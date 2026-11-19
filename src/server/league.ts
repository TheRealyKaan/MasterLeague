import { getPayload, type Payload } from 'payload'
import { cookies, headers } from 'next/headers'
import config from '@payload-config'
import { ABOUT, SETTINGS } from '@/lib/defaults.js'

export const VOTER_COOKIE = 'mfl-voter'
export const payload = (): Promise<Payload> => getPayload({ config })

type Doc = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const idOf = (v: unknown) => String(v && typeof v === 'object' ? (v as Doc).id : v)
const mediaUrl = (v: unknown) => (v && typeof v === 'object' ? (v as Doc).sizes?.crest?.url || (v as Doc).url : null) || null

/** ISO instant -> naive "YYYY-MM-DDTHH:mm" in the league's time zone (the league logic works on local wall time). */
export function wallTime(iso: string | null | undefined, tz: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(+d)) return ''
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

export async function currentUser() {
  const { user } = await (await payload()).auth({ headers: await headers() })
  return user ? { id: user.id, email: user.email, name: (user as Doc).name || '', role: (user as Doc).role as 'admin' | 'referee', assignedMatch: (user as Doc).assignedMatch ? idOf((user as Doc).assignedMatch) : null } : null
}

const toMatch = (m: Doc, tz: string) => {
  const side = (s: string) => (s === 'away' ? idOf(m.away) : idOf(m.home))
  const other = (s: string) => (s === 'away' ? idOf(m.home) : idOf(m.away))
  const o: Doc = {
    id: idOf(m.id), home: idOf(m.home), away: idOf(m.away), date: wallTime(m.kickoff, tz), at: m.kickoff ? Date.parse(m.kickoff) : null, pitch: m.pitch || '',
    status: m.status, stage: m.stage || 'league',
    events: (m.events || []).map((e: Doc) => ({
      k: e.kind, team: e.kind === 'OG' ? other(e.side) : side(e.side), ...(e.kind === 'OG' ? { ptm: side(e.side) } : {}),
      player: e.player || '', ...(e.kind === 'G' && e.assist ? { assist: e.assist } : {}), min: e.minute != null ? String(e.minute) : '', ts: e.ts || 0, side: e.side,
    })),
  }
  if (m.startedAt) o.startedAt = Date.parse(m.startedAt)
  if (m.round) o.round = m.round
  if (m.penaltyWinner) o.pw = m.penaltyWinner === 'home' ? 'h' : 'a'
  if (m.manualScore?.home != null && m.manualScore?.away != null) o.so = { h: m.manualScore.home, a: m.manualScore.away }
  return o
}

/** Everything the site renders, in one round trip. Also closes matches that ran past full time. */
export async function getLeague() {
  const p = await payload()
  const all = { limit: 0, depth: 1, overrideAccess: false, pagination: false } as const
  const [settingsDoc, aboutDoc, mclDoc, teams, matches, injuries, notices] = await Promise.all([
    p.findGlobal({ slug: 'settings', depth: 1 }),
    p.findGlobal({ slug: 'about' }),
    p.findGlobal({ slug: 'champions-league', depth: 0 }),
    p.find({ collection: 'teams', ...all, sort: 'order' }),
    p.find({ collection: 'matches', ...all, depth: 0 }),
    p.find({ collection: 'injuries', ...all, depth: 0 }),
    p.find({ collection: 'notices', ...all, depth: 0, sort: '-publishedAt' }),
  ])
  const s = settingsDoc as Doc
  const settings = {
    leagueName: s.leagueName || SETTINGS.leagueName, season: s.season ?? SETTINGS.season, tagline: s.tagline ?? SETTINGS.tagline,
    themeColor: s.themeColor || SETTINGS.themeColor, timezone: s.timezone || SETTINGS.timezone, footerNote: s.footerNote ?? SETTINGS.footerNote,
    matchMinutes: s.matchMinutes ?? SETTINGS.matchMinutes, pointsWin: s.pointsWin ?? SETTINGS.pointsWin, pointsDraw: s.pointsDraw ?? SETTINGS.pointsDraw,
    undoMinutes: s.undoMinutes ?? SETTINGS.undoMinutes, logo: mediaUrl(s.logo) || '/logo.webp',
  }
  const tz = settings.timezone

  // auto-finish: a live match one minute past full time is over (formerly done by an open referee tab)
  const late = matches.docs.filter((m) => m.status === 'live' && m.startedAt && Date.now() - Date.parse(m.startedAt) >= (settings.matchMinutes + 1) * 60000)
  await Promise.all(late.map((m) => p.update({ collection: 'matches', id: m.id, data: { status: 'done' }, overrideAccess: true }).then(() => (m.status = 'done'))))

  const a = aboutDoc as Doc
  const mcl = mclDoc as Doc
  const voter = (await cookies()).get(VOTER_COOKIE)?.value
  return {
    now: Date.now(),
    settings,
    about: { sections: a.sections?.length ? a.sections : ABOUT.sections, rules: a.rules?.length ? a.rules : ABOUT.rules },
    teams: teams.docs.map((t: Doc) => ({ id: idOf(t.id), name: t.name, cls: t.className || '', order: t.order || 0, adj: t.pointAdjustment || 0, pl: t.players || [], logo: mediaUrl(t.logo) })),
    matches: matches.docs.map((m) => toMatch(m as Doc, tz)),
    injuries: injuries.docs.map((x: Doc) => ({ id: idOf(x.id), team: idOf(x.team), player: x.player, note: x.note || '', ret: x.expectedReturn || '' })),
    notices: notices.docs.map((n: Doc) => ({ id: idOf(n.id), text: n.text, at: Date.parse(n.publishedAt) || Date.parse(n.createdAt) })),
    mcl: mcl.active ? [{ id: 'main', seeds: (mcl.seeds || []).map(idOf), at: mcl.startedAt ? Date.parse(mcl.startedAt) : 0 }] : [],
    votes: await tally(p, voter),
  }
}

/** Poll counts per match, plus this device's own choice. */
// shortcut: loads every vote to count them; fine for a school league, aggregate in SQL if votes reach the tens of thousands
async function tally(p: Payload, voter?: string) {
  const { docs } = await p.find({ collection: 'votes', limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { match: true, side: true, voter: true } })
  const counts: Record<string, { h: number; a: number; mine?: 'h' | 'a' }> = {}
  docs.forEach((v: Doc) => {
    const c = (counts[idOf(v.match)] ||= { h: 0, a: 0 })
    const s = v.side === 'away' ? 'a' : 'h'
    c[s]++
    if (voter && v.voter === voter) c.mine = s
  })
  return counts
}

export type League = Awaited<ReturnType<typeof getLeague>>
