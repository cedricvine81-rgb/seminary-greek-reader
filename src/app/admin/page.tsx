import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card } from '@/components/ui/Card'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Users, BookOpen, Building2, Settings } from 'lucide-react'

export default async function AdminDashboard() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') redirect('/auth/sign-in')

  const [userCount, courseCount, institutionCount, instructorCount, studentCount] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.institution.count(),
    prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
  ])

  return (
    <DashboardShell role="ADMIN" pageTitle="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-brand-50">
                  <Users size={22} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userCount}</p>
                  <p className="text-sm text-gray-500">Total users</p>
                  <p className="text-xs text-gray-400 mt-0.5">{instructorCount} instructors · {studentCount} students</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/courses">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-50">
                  <BookOpen size={22} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{courseCount}</p>
                  <p className="text-sm text-gray-500">Courses</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/institutions">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50">
                  <Building2 size={22} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{institutionCount}</p>
                  <p className="text-sm text-gray-500">Institutions</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100">
                  <Settings size={22} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">Notifications</p>
                  <p className="text-sm text-gray-500">New-instructor emails</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardShell>
  )
}
