import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
import { PreviewBannerInner } from '@/components/layout/PreviewBanner'
import { NativeMenuGuard } from '@/components/layout/NativeMenuGuard'
import { MasterSearchProvider } from '@/components/search/MasterSearchProvider'
import { WordSearchProvider } from '@/components/search/WordSearchProvider'
import { ScrollRestorer } from '@/components/search/ScrollRestorer'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Seminary Greek', template: '%s | Seminary Greek' },
  description: 'Read the Septuagint and Greek New Testament, study vocabulary, practice morphology, and complete instructor-created assignments.',
  // Declare the app icon so browsers request /icon.svg (and get a 200) instead of
  // blindly probing /favicon.ico — which keeps 404 noise out of the server logs.
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
}

// Explicit mobile viewport: correct scaling, allow pinch-zoom (accessibility),
// and theme the browser chrome to the app's brand colour.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
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
  // the default theme and no hydration mismatch (see src/lib/theme.ts).
  const themeCookie = cookies().get('display-theme')?.value
  const dataTheme =
    themeCookie === 'sepia' || themeCookie === 'dim' || themeCookie === 'dark'
      ? themeCookie
      : undefined

  return (
    <html lang="en" data-theme={dataTheme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gentium+Plus:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <PreviewBannerInner show={isInstructorPreview} />
          <AppHeader {...headerProps} />
          <div className="flex flex-1 flex-col">
            {children}
          </div>
          <AppFooter />
        </div>
        <NativeMenuGuard />
        <MasterSearchProvider />
        <WordSearchProvider />
        <ScrollRestorer />
      </body>
    </html>
  )
}
