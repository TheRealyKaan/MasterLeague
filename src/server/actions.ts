'use server'
import { cookies } from 'next/headers'
import { currentUser, getLeague, payload, VOTER_COOKIE } from './league'
import { stand, winnerOf } from '@/lib/league.js'

type Doc = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type Result = { ok: boolean; error?: string; league?: Awaited<ReturnType<typeof getLeague>> }
const fail = (error: string): Result => ({ ok: false, error })
const done = async (): Promise<Result> => ({ ok: true, league: await getLeague() })
const asInt = (v: unknown) => (v === '' || v == null ? NaN : Math.trunc(Number(v)))

export type RefOp =
  | { type: 'start' | 'finish' | 'reopen' | 'clearScore' }
  | { type: 'event'; kind: 'G' | 'Y' | 'R'; team: string; player?: string; assist?: string; minute?: string | number; og?: boolean; ts?: number }
  | { type: 'delEvent'; ts: number }
  | { type: 'status'; value: 'sched' | 'live' | 'done' }
  | { type: 'score'; h: unknown; a: unknown }
  | { type: 'clock'; minute: unknown }
  | { type: 'pen'; value: '' | 'h' | 'a' }

const REF_OPS = new Set(['start', 'finish', 'event', 'delEvent'])

/** Live match control for referees (own match, limited ops) and admins (everything). */
export async function matchAction(matchId: string, op: RefOp): Promise<Result> {
  const user = await currentUser()
  if (!user) return fail('Oturum süresi doldu, tekrar giriş yapın')
  const p = await payload()
  const m = (await p.findByID({ collection: 'matches', id: matchId, depth: 0, overrideAccess: true }).catch(() => null)) as Doc | null
  if (!m) return fail('Maç bulunamadı')
  const admin = user.role === 'admin'
  if (!admin) {
    if (user.assignedMatch !== String(m.id)) return fail('Bu maçı yönetme yetkiniz yok')
    if (!REF_OPS.has(op.type)) return fail('Bu düzeltmeyi yalnızca yönetici yapabilir')
    if (m.status === 'done') return fail('Maç bitti. Düzeltme için yönetici gerekir')
  }
  const settings = (await p.findGlobal({ slug: 'settings' })) as Doc
  const len = settings.matchMinutes || 60
  const events: Doc[] = m.events || []
  let data: Doc

  switch (op.type) {
    case 'start':
      data = { status: 'live', startedAt: m.status === 'sched' ? new Date().toISOString() : m.startedAt }
      break
    case 'finish':
      data = { status: 'done' }
      break
    case 'reopen':
      data = { status: 'live' }
      break
    case 'status':
      if (!['sched', 'live', 'done'].includes(op.value)) return fail('Geçersiz durum')
      data = { status: op.value, ...(op.value === 'live' && !m.startedAt ? { startedAt: new Date().toISOString() } : {}) }
      break
    case 'pen':
      data = { penaltyWinner: op.value === 'h' ? 'home' : op.value === 'a' ? 'away' : null }
      break
    case 'score': {
      const h = asInt(op.h), a = asInt(op.a)
      if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return fail('Geçerli bir skor girin')
      data = { manualScore: { home: h, away: a }, ...(m.status === 'sched' ? { status: 'done' } : {}) }
      break
    }
    case 'clearScore':
      data = { manualScore: { home: null, away: null } }
      break
    case 'clock': {
      const mn = asInt(op.minute)
      if (isNaN(mn) || mn < 1 || mn > len) return fail(`1 ile ${len} arası dakika girin`)
      data = { startedAt: new Date(Date.now() - (mn - 1) * 60000).toISOString() }
      break
    }
    case 'event': {
      const player = (op.player || '').trim().slice(0, 80)
      if (!['G', 'Y', 'R'].includes(op.kind)) return fail('Geçersiz olay')
      if (op.kind !== 'G' && !player) return fail('Oyuncu adını girin')
      if (op.ts != null && !admin) return fail('Olay düzenlemeyi yalnızca yönetici yapabilir')
      const side = String(op.team) === String(m.away) ? 'away' : 'home'
      const started = m.startedAt ? Math.min(len, Math.floor((Date.now() - Date.parse(m.startedAt)) / 60000) + 1) : null
      const minute = op.minute === '' || op.minute == null ? started : asInt(op.minute)
      if (minute != null && (isNaN(minute) || minute < 0 || minute > 200)) return fail('Geçerli bir dakika girin')
      const ev = {
        kind: op.kind === 'G' && op.og ? 'OG' : op.kind, side, player,
        assist: op.kind === 'G' && !op.og ? (op.assist || '').trim().slice(0, 80) || null : null,
        minute, ts: op.ts ?? Date.now(),
      }
      if (op.ts != null) {
        if (!events.some((e) => e.ts === op.ts)) return fail('Olay bulunamadı')
        data = { events: events.map((e) => (e.ts === op.ts ? { ...e, ...ev } : e)) }
      } else {
        data = { events: [...events, ev], ...(m.status === 'sched' ? { status: 'live', startedAt: new Date().toISOString() } : {}) }
      }
      break
    }
    case 'delEvent': {
      const e = events.find((x) => x.ts === op.ts)
      if (!e) return fail('Olay bulunamadı')
      const undo = (settings.undoMinutes ?? 2) * 60000
      if (!admin && Date.now() - e.ts > undo) return fail('Geri alma süresi geçti. Düzeltmeyi yönetici yapabilir')
      data = { events: events.filter((x) => x.ts !== op.ts) }
      break
    }
    default:
      return fail('Bilinmeyen işlem')
  }
  await p.update({ collection: 'matches', id: m.id, data, overrideAccess: true })
  return done()
}

/** A referee picks the match they will run. */
export async function pickMatch(matchId: string): Promise<Result> {
  const user = await currentUser()
  if (!user) return fail('Önce giriş yapın')
  const p = await payload()
  const m = (await p.findByID({ collection: 'matches', id: matchId, depth: 0, overrideAccess: true }).catch(() => null)) as Doc | null
  if (!m || m.status === 'done') return fail('Bu maç seçilemez')
  await p.update({ collection: 'users', id: user.id, data: { assignedMatch: m.id }, overrideAccess: true })
  return done()
}

async function requireAdmin() {
  const user = await currentUser()
  return user?.role === 'admin' ? user : null
}

const mclMatch = (round: string, home: string | number, away: string | number) => ({ home: Number(home), away: Number(away), stage: 'mcl', round, status: 'sched', pitch: '', events: [] })

export async function startMcl(): Promise<Result> {
  if (!(await requireAdmin())) return fail('Yönetici girişi gerekir')
  const L = await getLeague()
  if (L.mcl.length) return fail('Champions League zaten başladı')
  const rows = stand(L.teams, L.matches, null, { w: L.settings.pointsWin, d: L.settings.pointsDraw })
  if (rows.length < 4) return fail('En az 4 takım gerekir')
  const sd = rows.slice(0, 4).map((r: Doc) => r.id)
  const p = await payload()
  await p.updateGlobal({ slug: 'champions-league', data: { active: true, seeds: sd.map(Number), startedAt: new Date().toISOString() }, overrideAccess: true })
  await p.create({ collection: 'matches', data: mclMatch('sf1', sd[0], sd[3]) as never, overrideAccess: true })
  await p.create({ collection: 'matches', data: mclMatch('sf2', sd[1], sd[2]) as never, overrideAccess: true })
  return done()
}

export async function makeFinal(): Promise<Result> {
  if (!(await requireAdmin())) return fail('Yönetici girişi gerekir')
  const L = await getLeague()
  const M = L.matches.filter((x) => x.stage === 'mcl'), s1 = M.find((x) => x.round === 'sf1'), s2 = M.find((x) => x.round === 'sf2')
  if (M.some((x) => x.round === 'f')) return fail('Final zaten oluşturuldu')
  const w1 = winnerOf(s1), w2 = winnerOf(s2)
  if (!s1 || !s2 || !w1 || !w2) return fail('Yarı finallerin kazananı belli değil. Beraberlikte penaltı galibini seçin')
  const l1 = w1 === s1.home ? s1.away : s1.home, l2 = w2 === s2.home ? s2.away : s2.home
  const p = await payload()
  await p.create({ collection: 'matches', data: mclMatch('f', w1, w2) as never, overrideAccess: true })
  await p.create({ collection: 'matches', data: mclMatch('t3', l1, l2) as never, overrideAccess: true })
  return done()
}

export async function resetMcl(): Promise<Result> {
  if (!(await requireAdmin())) return fail('Yönetici girişi gerekir')
  const p = await payload()
  await p.delete({ collection: 'matches', where: { stage: { equals: 'mcl' } }, overrideAccess: true })
  await p.updateGlobal({ slug: 'champions-league', data: { active: false, seeds: [], startedAt: null }, overrideAccess: true })
  return done()
}

/** Fan poll: one vote per device (cookie) per match; voting again changes the vote. */
export async function vote(matchId: string, side: 'h' | 'a'): Promise<Result> {
  if (side !== 'h' && side !== 'a') return fail('Geçersiz oy')
  const p = await payload()
  const m = (await p.findByID({ collection: 'matches', id: matchId, depth: 0, overrideAccess: true }).catch(() => null)) as Doc | null
  if (!m || m.status === 'done') return fail('Bu maç için oylama kapalı')
  const jar = await cookies()
  let voter = jar.get(VOTER_COOKIE)?.value
  if (!voter || !/^[0-9a-f-]{36}$/.test(voter)) {
    voter = crypto.randomUUID()
    jar.set(VOTER_COOKIE, voter, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' })
  }
  const data = { match: m.id, voter, side: side === 'h' ? 'home' : 'away' } as const
  const { docs } = await p.find({ collection: 'votes', where: { and: [{ match: { equals: m.id } }, { voter: { equals: voter } }] }, limit: 1, overrideAccess: true })
  if (docs[0]) await p.update({ collection: 'votes', id: docs[0].id, data, overrideAccess: true })
  else await p.create({ collection: 'votes', data, overrideAccess: true })
  return done()
}
