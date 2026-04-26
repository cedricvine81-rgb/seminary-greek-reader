import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/layout/AppHeader'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Seminary Greek', template: '%s | Seminary Greek' },
  description: 'Read the Septuagint and Greek New Testament, study vocabulary, practice morphology, and complete instructor-created assignments.',
}

async function getHeaderProps() {
  try {
    const token = getTokenFromCookies()
    if (!token) return { isAuthenticated: false }
    const payload = verifyToken(token)
    if (!payload) return { isAuthenticated: false }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, surname: true, role: true },
    })
    if (!user) return { isAuthenticated: false }
    return {
      isAuthenticated: true,
      userRole: user.role as 'INSTRUCTOR' | 'STUDENT',
      userName: `${user.firstName} ${user.surname}`,
    }
  } catch {
    return { isAuthenticated: false }
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerProps = await getHeaderProps()

  return (
    <html lang="en">
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
          <AppHeader {...headerProps} />
          <div className="flex flex-1 flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
