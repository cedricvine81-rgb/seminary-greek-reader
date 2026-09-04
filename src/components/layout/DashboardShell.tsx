import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { userMustChangePassword } from '@/lib/must-change-password'
import { studentHasAccess } from '@/lib/subscription'
import { getServerT } from '@/lib/i18n/server'


// Page headings arrive as English text from 36 pages. Rather than edit every one, they are
// mapped here to catalogue keys and translated on the way through; a title not listed (a
// course name, an assignment title) falls through untouched, which is correct — those are
// user data, not interface text.
const TITLE_KEYS: Record<string, string> = {
  'Dashboard': 'nav.dashboard', 'Assignments': 'nav.assignments', 'Grades': 'nav.grades',
  'Messages': 'nav.messages', 'Materials': 'nav.materials', 'Courses': 'nav.courses',
  'Calendar': 'nav.calendar', 'Settings': 'account.settings', 'Reports': 'nav.reports',
  'Users': 'nav.users', 'Institutions': 'nav.institutions', 'Notifications': 'nav.notifications',
  'Audit Log': 'nav.auditLog', 'Vocab Appeals': 'nav.vocabAppeals',
  'Vocab Synonyms': 'nav.vocabSynonyms', 'Accuracy': 'nav.accuracy',
  'Admin Dashboard': 'page.adminDashboard', 'Course Archive': 'page.courseArchive',
  'Create Course': 'page.createCourse', 'Edit Course': 'page.editCourse',
  'Appeals': 'nav.appeals', 'Enrollment Requests': 'page.enrollmentRequests', 'Exegesis Workspace': 'page.exegesisWorkspace',
  'Flashcards': 'page.flashcards', 'Group Presentations': 'page.groupPresentations',
  'My Courses': 'page.myCourses', 'New Assignment': 'page.newAssignment',
  'Students': 'page.students', 'Submission': 'page.submission',
  'Use Existing Assignments': 'page.useExisting',
}

interface DashboardShellProps {
  role: 'INSTRUCTOR' | 'STUDENT' | 'ADMIN'
  children: ReactNode
  pageTitle?: string
  pageDescription?: string
  actions?: ReactNode
  /** Pass from the page if already known — skips the extra DB query */
  pendingCount?: number
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
      where: { courseId: { in: courses.map(c => c.id) }, status: 'PENDING', user: { deletedAt: null } },
    })
  } catch {
    return 0
  }
}

export async function DashboardShell({
  role, children, pageTitle, pageDescription, actions, pendingCount,
}: DashboardShellProps) {
  const t = getServerT()
  // Force users who must change their password (admin-created accounts) through the
  // password-change screen before they can access any dashboard page. This is the
  // single chokepoint — every authenticated page renders inside DashboardShell.
  const shellToken = getTokenFromCookies()
  const shellPayload = shellToken ? verifyToken(shellToken) : null
  if (shellPayload && await userMustChangePassword(shellPayload.sub)) {
    redirect('/auth/change-password?required=1')
  }

  // Same chokepoint blocks students without an active (or grandfathered) subscription.
  // Checked against the real logged-in role, not the `role` prop — an instructor
  // previewing student pages passes role="STUDENT" but must never be paywalled.
  if (shellPayload?.role === 'STUDENT' && !await studentHasAccess(shellPayload.sub)) {
    redirect('/subscribe')
  }

  let pendingRequests = pendingCount ?? 0

  // Only query if the page didn't supply the count
  if (role === 'INSTRUCTOR' && pendingCount === undefined) {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (payload?.role === 'INSTRUCTOR') {
      pendingRequests = await getPendingRequestCount(payload.sub)
    }
  }

  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar role={role} pendingRequests={role === 'INSTRUCTOR' ? pendingRequests : 0} />
      <main className="flex-1 min-w-0 p-4 lg:p-8 bg-gray-50 pb-20 lg:pb-8">
        {(pageTitle || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              {pageTitle && (
                <h1 className="text-2xl font-bold text-gray-900">{TITLE_KEYS[pageTitle] ? t(TITLE_KEYS[pageTitle]) : pageTitle}</h1>
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
      <MobileNav role={role} pendingRequests={role === 'INSTRUCTOR' ? pendingRequests : 0} />
    </div>
  )
}
