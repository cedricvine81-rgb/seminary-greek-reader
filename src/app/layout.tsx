import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
import { PreviewBannerInner } from '@/components/layout/PreviewBanner'
import { NativeMenuGuard } from '@/components/layout/NativeMenuGuard'
import { ChunkErrorReload } from '@/components/layout/ChunkErrorReload'
import { MasterSearchProvider } from '@/components/search/MasterSearchProvider'
import { PageGuideProvider } from '@/components/help/PageGuideProvider'
import { GrammarPanelProvider } from '@/components/grammar/GrammarPanelProvider'
import { WordSearchProvider } from '@/components/search/WordSearchProvider'
import { ProsePanelProvider } from '@/components/texts/ProsePanelProvider'
import { ScrollRestorer } from '@/components/search/ScrollRestorer'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getServerLocale } from '@/lib/i18n/server'
import { HTML_LANG } from '@/lib/i18n/locale'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { getServerTrack } from '@/lib/track-server'
import { brandFor } from '@/lib/track'
import { TrackProvider } from '@/lib/track-client'

const inter = Inter({ subsets: ['latin'] })

// Title and description follow the language track, so a Hebrew student's browser tab and
// bookmarks say "Seminary Hebrew". generateMetadata (not a static export) because it has to
// read the cookie. The icon is deliberately shared: it identifies the app, not the track.
export async function generateMetadata(): Promise<Metadata> {
  const brand = brandFor(getServerTrack())
  return {
    title: { default: brand.name, template: `%s | ${brand.name}` },
    description: brand.description,
    // Declare the app icon so browsers request /icon.svg (and get a 200) instead of
    // blindly probing /favicon.ico — which keeps 404 noise out of the server logs.
    icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  }
}

// Explicit mobile viewport: correct scaling, allow pinch-zoom (accessibility),
// and theme the browser chrome to the app's brand colour.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fffbf5',   // sepia page background (the default scheme)
}

async function getHeaderProps() {
  try {
    const token = getTokenFromCookies()
    if (!token) return { isAuthenticated: false }
    const payload = verifyToken(token)
    if (!payload) return { isAuthenticated: false }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true, role: true, deletedAt: true },
    })
    if (!user || user.deletedAt) return { isAuthenticated: false }
    return {
      isAuthenticated: true,
      userRole: user.role as 'INSTRUCTOR' | 'STUDENT' | 'ADMIN',
      userName: `${user.firstName} ${user.surname}`,
    }
  } catch {
    return { isAuthenticated: false }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerProps = await getHeaderProps()

  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  const isInstructorPreview =
    payload?.role === 'INSTRUCTOR' &&
    cookies().get('instructor_preview')?.value === '1'

  // Display theme: rendered server-side from the cookie so there's no flash of
  // the default theme and no hydration mismatch (see src/lib/theme.ts). Sepia is
  // the default for anyone who hasn't chosen a scheme; an explicit 'light' choice
  // removes the attribute so :root (light) applies.
  const themeCookie = cookies().get('display-theme')?.value
  const dataTheme =
    themeCookie === 'light' ? undefined
    : themeCookie === 'dim' || themeCookie === 'dark' ? themeCookie
    : 'sepia'

  // App-wide text size, same cookie-before-paint reasoning as the theme. 'md' (or no
  // cookie) stamps nothing, leaving the browser's own default font size in charge.
  const scaleCookie = cookies().get('text-scale')?.value
  const dataTextScale =
    scaleCookie === 'sm' || scaleCookie === 'lg' || scaleCookie === 'xl' ? scaleCookie : undefined

  // Interface language, from its own cookie for the same reason as the theme: rendered
  // server-side so the first paint is already in the student's language. Drives <html lang>,
  // which is what selects the CJK font stack and the screen-reader voice.
  const locale = getServerLocale()
  // Which brand this render wears. A view preference only — see src/lib/track.ts.
  const track = getServerTrack()

  return (
    <html lang={HTML_LANG[locale]} data-theme={dataTheme} data-text-scale={dataTextScale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gentium+Plus:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=Noto+Serif+Hebrew:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      {/*
        Browser translation (Chrome/Safari/Edge "Translate this page") is DENIED BY DEFAULT and
        opted into per block — see the `translate="yes"` markers on the English source texts.
        Not because translation is unwelcome: a Spanish student reading Philo in a Victorian
        English translation has no other way in, and the browser's own translator costs nothing
        and needs no API key.

        Default-deny because of what page translation would otherwise reach:
          • the GREEK and HEBREW — mangling the text the whole app exists to read;
          • the interface, which is already properly translated, so it would be re-translated
            Spanish→Spanish and reworded away from the terminology the course teaches;
          • names, assignment titles and the instructor's own words.

        Opting back in is inherited and overridable — verified in-browser that translate="yes"
        inside a translate="no" subtree re-enables it for that subtree and its descendants — so
        one attribute here plus a marker per English-prose column is the whole mechanism.
      */}
      <body className={inter.className} translate="no">
        <ChunkErrorReload />
        <LocaleProvider locale={locale}>
        <TrackProvider track={track}>
        <div className="min-h-screen flex flex-col">
          <PreviewBannerInner show={isInstructorPreview} />
          <AppHeader {...headerProps} />
          {/* id="app-content": the Master Search side panel squeezes this leftward (padding-right
              via --search-panel-w in globals.css) so search + page read as a split view. */}
          <div id="app-content" className="flex flex-1 flex-col">
            {children}
          </div>
          <AppFooter />
        </div>
        <NativeMenuGuard />
        <MasterSearchProvider isAuthenticated={headerProps.isAuthenticated} />
        <PageGuideProvider />
        <GrammarPanelProvider />
        <WordSearchProvider />
        <ProsePanelProvider />
        <ScrollRestorer />
        </TrackProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
