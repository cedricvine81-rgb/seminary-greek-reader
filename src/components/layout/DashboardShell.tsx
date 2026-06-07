import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface DashboardShellProps {
  role: 'INSTRUCTOR' | 'STUDENT'
  children: ReactNode
  pageTitle?: string
  pageDescription?: string
  actions?: ReactNode
}

async function getPendingRequestCount(instructorId: string): Promise<number> {
  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { instructorId },
          { coInstructors: { some: { userId: instructorId } } },
        ],
      },
      select: { id: true },
    })
    return prisma.enrollment.count({
      where: { courseId: { in: courses.map(c => c.id) }, status: 'PENDING' },
    })
  } catch {
    return 0
  }
}

export async function DashboardShell({
  role, children, pageTitle, pageDescription, actions
}: DashboardShellProps) {
  let pendingRequests = 0
  if (role === 'INSTRUCTOR') {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (payload?.role === 'INSTRUCTOR') {
      pendingRequests = await getPendingRequestCount(payload.sub)
    }
  }

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar role={role} pendingRequests={role === 'INSTRUCTOR' ? pendingRequests : 0} />
      <main className="flex-1 min-w-0 p-6 lg:p-8 bg-gray-50">
        {(pageTitle || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              {pageTitle && (
                <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              )}
              {pageDescription && (
                <p className="text-sm text-gray-500 mt-0.5">{pageDescription}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
