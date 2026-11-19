import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { currentUser, getLeague } from '@/server/league'
import { themeCss } from '@/lib/theme.js'
import { LeagueProvider } from '@/components/state.jsx'
import { Shell } from '@/components/shell.jsx'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getLeague()
  return {
    title: { template: `%s · ${settings.leagueName}`, default: settings.leagueName },
    description: settings.tagline,
    icons: { icon: settings.logo },
  }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [league, user, jar] = await Promise.all([getLeague(), currentUser(), cookies()])
  // visitor's own choice (cookie) beats the CMS color; without a mode the CSS follows the OS
  const mode = ['light', 'dark'].find((m) => m === jar.get('mfl-mode')?.value)
  const seed = /^#[0-9a-f]{6}$/i.test(jar.get('mfl-seed')?.value || '') ? jar.get('mfl-seed')!.value : null
  return (
    <html lang="tr" data-theme={mode} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(seed || league.settings.themeColor) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
      </head>
      <body>
        <LeagueProvider initial={league} user={user} prefs={{ 'mfl-mode': mode || null, 'mfl-seed': seed }}>
          <Shell>{children}</Shell>
        </LeagueProvider>
      </body>
    </html>
  )
}
