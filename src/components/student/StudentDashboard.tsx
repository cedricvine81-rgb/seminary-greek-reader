import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ClipboardList, BookOpen, Calendar, Award, GraduationCap, CheckCircle2, Scroll, Layers } from 'lucide-react'
import type { Assignment } from '@/types/assignment'
import { differenceInCalendarDays } from 'date-fns'

interface RecentScore {
  assignmentId: string
  title: string
  percentage: number
  completedAt: string
}

interface StudentDashboardProps {
  studentName: string
  pendingAssignments: Assignment[]
  recentScores: RecentScore[]
  stats: {
    enrolledCourses: number
    pendingAssignments: number
    completedAssignments: number
    averageScore: number | null
  }
}

function ScoreBadge({ pct }: { pct: number }) {
  const variant = pct >= 90 ? 'green' : pct >= 70 ? 'amber' : 'red'
  return <Badge variant={variant}>{pct}%</Badge>
}

function DueBadge({ dueDate }: { dueDate: string }) {
  const days = differenceInCalendarDays(new Date(dueDate), new Date())
  if (days < 0) return <span className="text-xs text-red-500 font-medium">Overdue</span>
  if (days === 0) return <span className="text-xs text-red-500 font-semibold">Due today</span>
  if (days === 1) return <span className="text-xs text-amber-600 font-medium">Due tomorrow</span>
  if (days <= 3) return <span className="text-xs text-amber-500 font-medium">Due in {days} days</span>
  return <span className="text-xs text-gray-400">Due {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
}

const TYPE_COLORS: Record<string, string> = {
  VOCABULARY_QUIZ:      'bg-blue-50 text-blue-700 border-blue-100',
  MORPHOLOGY_QUIZ:      'bg-purple-50 text-purple-700 border-purple-100',
  TRANSLATION_EXERCISE: 'bg-green-50 text-green-700 border-green-100',
  PASSAGE_VOCABULARY:   'bg-indigo-50 text-indigo-700 border-indigo-100',
}
const TYPE_LABELS: Record<string, string> = {
  VOCABULARY_QUIZ:      'Vocab',
  MORPHOLOGY_QUIZ:      'Morphology',
  TRANSLATION_EXERCISE: 'Translation',
  PASSAGE_VOCABULARY:   'Passage',
}

export function StudentDashboard({ studentName, pendingAssignments, recentScores, stats }: StudentDashboardProps) {
  const statCards = [
    { label: 'Courses', value: stats.enrolledCourses, icon: <GraduationCap size={18} />, color: 'text-blue-600 bg-blue-50', href: '/student/courses' },
    { label: 'To Do', value: stats.pendingAssignments, icon: <ClipboardList size={18} />, color: 'text-amber-600 bg-amber-50', href: '/student/assignments' },
    { label: 'Completed', value: stats.completedAssignments, icon: <CheckCircle2 size={18} />, color: 'text-green-600 bg-green-50', href: '/student/progress' },
    { label: 'Avg. Grade', value: stats.averageScore !== null ? `${stats.averageScore}%` : '—', icon: <Award size={18} />, color: 'text-purple-600 bg-purple-50', href: '/student/scores' },
  ]

  const urgent = pendingAssignments.filter(a =>
    differenceInCalendarDays(new Date(a.dueDate), new Date()) <= 3
  ).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Welcome back, {studentName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {urgent > 0
            ? <span className="text-amber-600 font-medium">{urgent} assignment{urgent > 1 ? 's' : ''} due soon — keep going!</span>
            : 'Keep up your Greek studies.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}>
            <Card hover className="flex items-center gap-3 p-4">
              <div className={`p-2 rounded-lg shrink-0 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions — lighter, button-like row, visually distinct from the stat cards */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: '/student/flashcards', label: 'Flashcards', icon: <Layers size={15} /> },
          { href: '/student/exegesis',   label: 'Exegesis',   icon: <Scroll size={15} /> },
          { href: '/student/calendar',   label: 'Calendar',   icon: <Calendar size={15} /> },
          { href: '/reader',             label: 'Reader',     icon: <BookOpen size={15} /> },
        ].map(q => (
          <Link
            key={q.href}
            href={q.href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors"
          >
            <span className="text-brand-600">{q.icon}</span>
            {q.label}
          </Link>
        ))}
      </div>

      {/* What's due leads (wider); recent scores secondary */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Upcoming assignments — the most important thing for a student */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="mb-0">Upcoming Assignments</CardTitle>
            <Link href="/student/assignments" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {pendingAssignments.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <p className="text-sm text-green-600 font-medium">You&apos;re all caught up! 🎉</p>
              <Link href="/student/courses" className="text-xs text-brand-600 hover:underline">Browse courses →</Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingAssignments.slice(0, 5).map(a => (
                <Link
                  key={a.id}
                  href={`/student/assignments/${a.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                    <DueBadge dueDate={a.dueDate} />
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_COLORS[a.type] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                    {TYPE_LABELS[a.type] ?? a.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent scores */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="mb-0">Recent Scores</CardTitle>
            <Link href="/student/scores" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          {recentScores.length === 0 ? (
            <div className="text-center py-6 space-y-1">
              <p className="text-sm text-gray-400">No scores yet.</p>
              <Link href="/student/assignments" className="text-xs text-brand-600 hover:underline">Start an assignment →</Link>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentScores.map(s => (
                <div key={s.assignmentId} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ScoreBadge pct={s.percentage} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
