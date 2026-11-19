# Master Lig

League site for Master Lig: live scores, standings, fixtures, stats, injuries, notices, fan poll and the Master Champions League playoff.
Next.js 16 + **Payload CMS 3** (admin at `/admin`) + **Tailwind CSS 4** with a Material You 3 design. It deploys to Vercel as a single project.

## Run locally

```
pnpm install
cp .env.example .env        # set DATABASE_URL (Postgres) and PAYLOAD_SECRET
# or, once the Vercel project exists: npx vercel link && npx vercel env pull .env
pnpm seed                   # optional: demo league + admin/referee accounts (passwords go to .seed-credentials.txt)
pnpm dev                    # http://localhost:3000, CMS at http://localhost:3000/admin
```

Without `pnpm seed`, open `/admin` and create the first account. The first account always becomes the **admin**.

The database is Postgres (Neon on Vercel). In dev Payload syncs the schema automatically; deployments apply `src/migrations` on the first request.

## What the CMS manages

| CMS section | Contents |
|---|---|
| Lig → Maçlar | Fixtures, kickoff, pitch, status, live start time, goals/cards/own goals, manual score, MCL round, penalty winner |
| Lig → Takımlar | Name, class, crest image, player list, point adjustment, order. Deleting a team also removes its matches and injuries |
| Lig → Sakatlıklar | Injured players, note, expected return |
| Lig → Master Champions League | Seeds and start date (normally set by the site's "Başlat" button) |
| İçerik → Duyurular | Announcements |
| İçerik → Lig ayarları | League name, season, tagline, logo, footer, **theme seed color**, points per win/draw, match length, referee undo window, time zone |
| İçerik → Hakkında sayfası | About sections and rules |
| İçerik → Görseller, Taraftar oyları | Uploads; poll votes (view/delete) |
| Erişim → Kullanıcılar | Admin and referee accounts |

The site's live tools stay on the site, because they need to be fast during a match:
- **`/hakem`:** live referee panel. Start/finish, goals, cards, undo. Admins also get status, manual score, clock and penalty corrections.
- **`/yonetim`:** admin dashboard with CMS shortcuts and Champions League start, final and reset.

**Roles:**
- **Admin:** has full CMS access and can do everything on the site.
- **Referee:** cannot enter the CMS. They sign in at `/giris`, pick one unfinished match, and may only start/finish it and add events. They can delete their own events only within the undo window.

All of this is enforced on the server, in `src/server/actions.ts` and the collections' access rules.

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel. The framework (Next.js) is detected; the build command is `pnpm build`.
2. **Database:** in the project's Storage tab, create a **Neon** Postgres database and connect it to the project. This sets `DATABASE_URL`.
3. **Uploads:** create a **Vercel Blob** store in the project's Storage tab. This adds `BLOB_READ_WRITE_TOKEN`. Without it, image uploads fail on Vercel because its filesystem is read-only.
4. Set `PAYLOAD_SECRET` to a long random string.
5. Deploy. Pending migrations in `src/migrations` run automatically on the first request. Then open `/admin` and create the first (admin) account.

**When you change collections or fields:**
```
pnpm migrate:create <name>
```
Commit the new file in `src/migrations`.

## Live updates

Serverless functions can't hold sockets, so the site polls `/data`: every 4 s while a match is live or someone is signed in, otherwise every 30 s, and immediately when the tab regains focus. A live match is closed automatically one minute after full time.

## Tests

```
pnpm test   # league rules: scoring, standings, tiebreaks, stats, knockout winner, configurable points
```
