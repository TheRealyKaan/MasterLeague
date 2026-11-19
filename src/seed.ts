/* Demo data for a fresh database: `pnpm seed`. Does nothing if teams already exist.
   Accounts get random passwords, written to .seed-credentials.txt (git-ignored). */
import { getPayload } from 'payload'
import config from '@payload-config'
import { randomBytes } from 'crypto'
import { writeFileSync } from 'fs'

const payload = await getPayload({ config })
const { totalDocs } = await payload.count({ collection: 'teams' })
if (totalDocs) {
  payload.logger.info('Teams already exist; seed skipped.')
  process.exit(0)
}

const pw = () => randomBytes(9).toString('base64url')
const accounts = [
  { email: 'admin@masterlig.local', name: 'Lig yöneticisi', role: 'admin' as const, password: pw() },
  { email: 'hakem@masterlig.local', name: 'Hakem', role: 'referee' as const, password: pw() },
]
for (const a of accounts) {
  const { docs } = await payload.find({ collection: 'users', where: { email: { equals: a.email } }, limit: 1 })
  if (!docs.length) await payload.create({ collection: 'users', data: a })
}
writeFileSync('.seed-credentials.txt', accounts.map((a) => `${a.role}\t${a.email}\t${a.password}`).join('\n') + '\n')

const names: [string, string, string[]][] = [
  ['Hascelona', '9-C', ['Ali Kaya', 'Can Er', 'Burak Şen']],
  ['Has Milan', '9-D', ['Mert Ak', 'Efe Su']],
  ['Kartallar', '9-A', ['Kaan Öz', 'Arda Yıl']],
  ['Yıldızspor', '9-B', ['Deniz Ay', 'Ozan Göl']],
  ['Gençlerbirliği', '10-A', ['Berk Can']],
  ['Atletik', '10-B', ['Emir Tan']],
]
const ids: number[] = []
for (const [i, [name, className, players]] of names.entries()) {
  ids.push((await payload.create({ collection: 'teams', data: { name, className, players, order: i } })).id as number)
}
const t = (n: number) => ids[n - 1]

const at = (days: number, hh: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hh, 0, 0, 0); return d.toISOString() }
let ts = Date.now() - 3_600_000
type Ev = { kind: 'G' | 'OG' | 'Y' | 'R'; side: 'home' | 'away'; player: string; minute: number; assist?: string; ts?: number }
const ev = (e: Ev) => ({ ...e, ts: ts++ })
const matches = [
  { home: 1, away: 2, k: at(-8, 10), pitch: 'Saha 1', status: 'done', events: [ev({ kind: 'G', side: 'home', player: 'Ali Kaya', minute: 5, assist: 'Can Er' }), ev({ kind: 'G', side: 'away', player: 'Mert Ak', minute: 22 }), ev({ kind: 'Y', side: 'away', player: 'Efe Su', minute: 33 }), ev({ kind: 'G', side: 'home', player: 'Ali Kaya', minute: 40 })] },
  { home: 3, away: 4, k: at(-8, 11), pitch: 'Saha 2', status: 'done', events: [ev({ kind: 'G', side: 'home', player: 'Kaan Öz', minute: 12 }), ev({ kind: 'G', side: 'home', player: 'Arda Yıl', minute: 50, assist: 'Kaan Öz' })] },
  { home: 5, away: 6, k: at(-8, 12), pitch: 'Saha 1', status: 'done', events: [ev({ kind: 'G', side: 'away', player: 'Emir Tan', minute: 30 })] },
  { home: 2, away: 3, k: at(-1, 10), pitch: 'Saha 1', status: 'done', events: [ev({ kind: 'G', side: 'home', player: 'Mert Ak', minute: 8 }), ev({ kind: 'G', side: 'away', player: 'Kaan Öz', minute: 19 }), ev({ kind: 'R', side: 'away', player: 'Arda Yıl', minute: 44 })] },
  { home: 4, away: 5, k: at(-1, 11), pitch: 'Saha 2', status: 'done', events: [ev({ kind: 'G', side: 'home', player: 'Deniz Ay', minute: 3 }), ev({ kind: 'G', side: 'home', player: 'Deniz Ay', minute: 15, assist: 'Ozan Göl' }), ev({ kind: 'G', side: 'away', player: 'Berk Can', minute: 55 })] },
  { home: 6, away: 1, k: new Date(Date.now() - 23 * 60000).toISOString(), pitch: 'Saha 1', status: 'live', startedAt: new Date(Date.now() - 23 * 60000).toISOString(), events: [ev({ kind: 'G', side: 'away', player: 'Ali Kaya', minute: 9, assist: 'Can Er' }), ev({ kind: 'Y', side: 'home', player: 'Emir Tan', minute: 17 })] },
  { home: 1, away: 3, k: at(3, 10), pitch: 'Saha 1', status: 'sched', events: [] },
  { home: 2, away: 5, k: at(3, 11), pitch: 'Saha 2', status: 'sched', events: [] },
  { home: 4, away: 6, k: at(10, 10), pitch: 'Saha 1', status: 'sched', events: [] },
]
for (const m of matches) {
  await payload.create({ collection: 'matches', data: { home: t(m.home), away: t(m.away), kickoff: m.k, pitch: m.pitch, status: m.status as 'done', startedAt: m.startedAt, events: m.events } as never })
}
await payload.create({ collection: 'injuries', data: { team: t(2), player: 'Efe Su', note: 'Ayak bileği', expectedReturn: '2 hafta' } })
await payload.create({ collection: 'notices', data: { text: 'Cumartesi maçları 10.00’da başlayacak. Lütfen 15 dakika önce sahada olun.', publishedAt: new Date().toISOString() } })

payload.logger.info('Seeded demo league. Account passwords are in .seed-credentials.txt')
process.exit(0)
