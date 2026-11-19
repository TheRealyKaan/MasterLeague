import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { tr } from '@payloadcms/translations/languages/tr'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Teams } from './collections/Teams'
import { Matches } from './collections/Matches'
import { Injuries, Media, Notices, Votes } from './collections/misc'
import { About, ChampionsLeague, Settings } from './globals'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Master Lig CMS' },
  },
  i18n: { supportedLanguages: { tr, en }, fallbackLanguage: 'tr' },
  collections: [Matches, Teams, Injuries, Notices, Votes, Media, Users],
  globals: [Settings, About, ChampionsLeague],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Postgres (Neon on Vercel). Dev uses schema push; deployments run src/migrations on cold start.
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [
    // Vercel's filesystem is read-only; uploads go to Vercel Blob whenever its token is present
    vercelBlobStorage({ enabled: !!process.env.BLOB_READ_WRITE_TOKEN, collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN || '' }),
  ],
})
