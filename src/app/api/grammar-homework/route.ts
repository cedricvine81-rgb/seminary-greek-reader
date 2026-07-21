import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { GRAMMAR_HOMEWORK_SETS } from '@/data/grammar-homework'

// The Grammar page's homework block, role-aware.
//
// Students: list their published grammar-homework assignments (deck Exercises
// A/B sets) for one chapter, with due date and submission state.
//
// Instructors: list this chapter's available sets alongside the courses they
// teach and any existing homework assignment per (set × course) — powering the
// activate/deadline controls on the Grammar page. Activation itself goes
// through the normal assignment APIs, so the homework lands in the course
// dashboard and gradebook like any other assignment.
//
// Homework questions are identified by the {"hw":1,...} marker in options[0],
// which also carries the set and chapter ids.

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ role: 'none', entries: [] })

    const chapter = req.nextUrl.searchParams.get('chapter') ?? ''
    if (!chapter) return NextResponse.json({ role: 'none', entries: [] })
    const sets = GRAMMAR_HOMEWORK_SETS.filter(s => s.chapter === chapter)
    if (sets.length === 0) return NextResponse.json({ role: 'none', entries: [] })

    if (payload.role === 'INSTRUCTOR') {
      const courses = await prisma.course.findMany({
        where: { OR: [{ instructorId: payload.sub }, { coInstructors: { some: { userId: payload.sub } } }] },
        select: { id: true, name: true, level: true },
        orderBy: { name: 'asc' },
      })
      if (courses.length === 0) return NextResponse.json({ role: 'none', entries: [] })

      const candidates = await prisma.assignment.findMany({
        where: { type: 'TRANSLATION_EXERCISE', courseId: { in: courses.map(c => c.id) } },
        select: {
          id: true, courseId: true, dueDate: true, isPublished: true, allowLate: true, lateDaysLimit: true,
          questions: { orderBy: { position: 'asc' }, take: 1, select: { options: true } },
        },
      })
      const assignments: { setId: string; courseId: string; assignmentId: string; dueDate: string; isPublished: boolean; allowLate: boolean; lateDaysLimit: number | null }[] = []
      for (const a of candidates) {
        const opt = a.questions[0]?.options[0] ?? ''
        if (!opt.includes('"hw":1')) continue
        try {
          const meta = JSON.parse(opt) as { set?: string; chapter?: string }
          if (meta.chapter !== chapter || !meta.set) continue
          assignments.push({
            setId: meta.set, courseId: a.courseId, assignmentId: a.id,
            dueDate: a.dueDate.toISOString(), isPublished: a.isPublished,
            allowLate: a.allowLate, lateDaysLimit: a.lateDaysLimit,
          })
        } catch { /* ignore */ }
      }
      return NextResponse.json({
        role: 'instructor',
        sets: sets.map(s => ({ id: s.id, title: s.title, sentenceCount: s.sentences.length })),
        courses,
        assignments,
      })
    }

    // Student view
    const candidates = await prisma.assignment.findMany({
      where: {
        type: 'TRANSLATION_EXERCISE',
        isPublished: true,
        course: { enrollments: { some: { userId: payload.sub, status: 'APPROVED' } } },
      },
      select: {
        id: true, title: true, dueDate: true,
        questions: { orderBy: { position: 'asc' }, take: 1, select: { options: true } },
      },
    })
    const marker = `"chapter":"${chapter}"`
    const hw = candidates.filter(a => {
      const opt = a.questions[0]?.options[0] ?? ''
      return opt.includes('"hw":1') && opt.includes(marker)
    })
    if (hw.length === 0) return NextResponse.json({ role: 'student', entries: [] })

    const attempts = await prisma.quizAttempt.groupBy({
      by: ['assignmentId'],
      where: { userId: payload.sub, assignmentId: { in: hw.map(a => a.id) } },
      _count: { _all: true },
    })
    const attempted = new Set(attempts.map(a => a.assignmentId))
    return NextResponse.json({
      role: 'student',
      entries: hw.map(a => ({
        assignmentId: a.id,
        title: a.title,
        dueDate: a.dueDate.toISOString(),
        submitted: attempted.has(a.id),
      })),
    })
  } catch (err) {
    logError('api/grammar-homework GET', err)
    return NextResponse.json({ role: 'none', entries: [] })
  }
}
