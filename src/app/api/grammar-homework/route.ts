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
//
// Two-round correction system: dueDate is the Round 1 cut-off; an optional
// round2Deadline opens a correction window after it (same convention as the
// passage exercises). Round 2 corrections are submitted via POST here — they
// are embedded into the existing Response.answer as {..., r2, r2At} rather
// than creating a second attempt, so Round 1 stays intact for the grader.

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
          round2Deadline: true, assessed: true,
          questions: { orderBy: { position: 'asc' }, take: 1, select: { options: true } },
        },
      })
      const assignments: { setId: string; courseId: string; assignmentId: string; dueDate: string; isPublished: boolean; allowLate: boolean; lateDaysLimit: number | null; round2Deadline: string | null; assessed: boolean }[] = []
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
            round2Deadline: a.round2Deadline?.toISOString() ?? null,
            assessed: a.assessed,
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
        id: true, title: true, dueDate: true, round2Deadline: true, assessed: true,
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
        round2Deadline: a.round2Deadline?.toISOString() ?? null,
        assessed: a.assessed,
        submitted: attempted.has(a.id),
      })),
    })
  } catch (err) {
    logError('api/grammar-homework GET', err)
    return NextResponse.json({ role: 'none', entries: [] })
  }
}

// ── Round 2 corrections submission ──
//
// Students revise their Round 1 answers during the correction window
// (dueDate < now ≤ round2Deadline). One corrections submission per student;
// stored inside the existing Response rows so Round 1 is never overwritten
// and no second QuizAttempt is created (maxRetakes stays 0).
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromCookies()
    const payload = token ? verifyToken(token) : null
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { assignmentId, corrections } = body as {
      assignmentId: string
      corrections: { questionId: string; words: { parsing: string; syntax: string; gloss: string }[]; translation: string }[]
    }
    if (!assignmentId || !Array.isArray(corrections) || corrections.length === 0) {
      return NextResponse.json({ error: 'assignmentId and corrections are required' }, { status: 400 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        courseId: true, dueDate: true, round2Deadline: true, isPublished: true,
        questions: { orderBy: { position: 'asc' }, take: 1, select: { options: true } },
      },
    })
    if (!assignment || !(assignment.questions[0]?.options[0] ?? '').includes('"hw":1')) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }
    if (!assignment.isPublished) return NextResponse.json({ error: 'Assignment not available' }, { status: 403 })
    if (!assignment.round2Deadline) {
      return NextResponse.json({ error: 'This homework has no correction round.' }, { status: 400 })
    }
    const now = new Date()
    if (now <= assignment.dueDate) {
      return NextResponse.json({ error: 'The correction round opens after the Round 1 deadline.' }, { status: 403 })
    }
    if (now > assignment.round2Deadline) {
      return NextResponse.json({ error: 'The correction round has closed.' }, { status: 403 })
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: payload.sub, courseId: assignment.courseId, status: 'APPROVED' },
      select: { id: true },
    })
    if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })

    const responses = await prisma.response.findMany({
      where: { userId: payload.sub, assignmentId, questionId: { not: null } },
      select: { id: true, questionId: true, answer: true, score: true },
    })
    if (responses.length === 0) {
      return NextResponse.json({ error: 'Submit Round 1 before entering corrections.' }, { status: 400 })
    }
    if (responses.some(r => r.answer.includes('"r2At"'))) {
      return NextResponse.json({ error: 'Corrections already submitted — you get one corrections round.' }, { status: 403 })
    }
    if (responses.some(r => r.score != null)) {
      return NextResponse.json({ error: 'This homework has already been graded.' }, { status: 403 })
    }

    const byQuestion = new Map(corrections.map(c => [c.questionId, c]))
    const r2At = now.toISOString()
    await prisma.$transaction(
      responses.map(r => {
        const c = byQuestion.get(r.questionId!)
        let merged: Record<string, unknown> = {}
        try { merged = JSON.parse(r.answer) } catch { /* keep raw answer under r1raw below */ }
        if (c) merged = { ...merged, r2: { words: c.words, translation: c.translation }, r2At }
        else merged = { ...merged, r2At }
        return prisma.response.update({ where: { id: r.id }, data: { answer: JSON.stringify(merged) } })
      })
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    logError('api/grammar-homework POST', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
