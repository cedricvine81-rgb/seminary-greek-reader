/**
 * Refit a semester's vocabulary quiz series inside the course's own dates.
 *
 * The semester builder counts N weeks forward from the start date without checking
 * where the course actually ends, so a 16-week series on a 14-week course pushes its
 * last lessons past the end of term — they exist, but no student will ever sit them.
 *
 * This packs every BGVB lesson into the slots that fall inside the course. Slots keep
 * their dates; only which lesson each one carries changes. Where there are more
 * lessons than weeks, the final weeks introduce two lessons instead of repeating one.
 *
 *   npx tsx scripts/reschedule-vocab-series.ts --course="Beginning Greek FA26" [--apply]
 *
 * Without --apply it prints the plan and changes nothing. Refuses to touch a series
 * that already has student work.
 */
import { PrismaClient } from '@prisma/client'
import { generateVocabQuestionsForLesson } from '../src/lib/quiz-generation'
import { lessonSubsectionKey, VOCAB_LESSONS } from '../src/lib/vocab-lesson-map'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const arg = (n: string) => process.argv.find(a => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')
const COURSE = arg('course') ?? ''

async function main() {
  const course = await prisma.course.findFirst({
    where: { name: { contains: COURSE } },
    include: {
      assignments: {
        where: { type: 'VOCABULARY_QUIZ' },
        orderBy: { dueDate: 'asc' },
      },
    },
  })
  if (!course) { console.error(`No course matching "${COURSE}"`); process.exit(1) }

  const quizzes = course.assignments
  console.log(`${course.name}: ${course.startDate.toDateString()} – ${course.endDate.toDateString()}`)
  console.log(`vocabulary quizzes: ${quizzes.length}`)

  const ids = quizzes.map(q => q.id)
  const [attempts, responses] = await Promise.all([
    prisma.quizAttempt.count({ where: { assignmentId: { in: ids } } }),
    prisma.response.count({ where: { assignmentId: { in: ids } } }),
  ])
  if (attempts > 0 || responses > 0) {
    console.error(`REFUSING: ${attempts} attempts and ${responses} responses exist. ` +
      `Rescheduling would rewrite questions students have already answered.`)
    process.exit(1)
  }

  // Slots inside the course; anything dated past the end is surplus.
  const endOfCourse = new Date(course.endDate).getTime() + 24 * 60 * 60 * 1000
  const inside = quizzes.filter(q => q.dueDate.getTime() < endOfCourse)
  const surplus = quizzes.filter(q => q.dueDate.getTime() >= endOfCourse)

  // Group the surviving slots by their calendar week from the course start.
  const weekOf = (d: Date) =>
    Math.floor((d.getTime() - course.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  const byWeek = new Map<number, typeof inside>()
  for (const q of inside) {
    const w = weekOf(q.dueDate)
    byWeek.set(w, [...(byWeek.get(w) ?? []), q])
  }
  const weeks = Array.from(byWeek.keys()).sort((a, b) => a - b)

  const lessons = VOCAB_LESSONS.map(l => l.lesson)
  console.log(`weeks inside the course: ${weeks.length}   lessons to place: ${lessons.length}`)
  console.log(`slots inside: ${inside.length}   surplus past the end: ${surplus.length}`)

  // One lesson per week for as long as that fits; the last weeks carry the overflow,
  // so their two sittings cover two different lessons instead of repeating one.
  const spare = lessons.length - weeks.length
  const doubleFrom = weeks.length - spare   // first week that introduces two lessons
  const plan: { id: string; week: number; lesson: number; due: Date; title: string }[] = []
  let next = 0
  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i]
    const slots = byWeek.get(w)!.slice().sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    const introduce = i >= doubleFrom ? 2 : 1
    const forThisWeek = lessons.slice(next, next + introduce)
    next += introduce
    slots.forEach((slot, si) => {
      // With one lesson this week both sittings drill it; with two, one each.
      const lesson = forThisWeek[Math.min(si, forThisWeek.length - 1)]
      const key = lessonSubsectionKey(lesson)
      plan.push({
        id: slot.id, week: w, lesson, due: slot.dueDate,
        title: `Week ${w} — Vocabulary Quiz (§${key})`,
      })
    })
  }

  console.log('\nPlan:')
  for (const p of plan) {
    const before = quizzes.find(q => q.id === p.id)!
    const mark = before.title === p.title ? ' ' : '*'
    console.log(` ${mark} ${p.due.toISOString().slice(0, 10)}  wk ${String(p.week).padStart(2)}  ` +
      `lesson ${String(p.lesson).padStart(2)} (§${lessonSubsectionKey(p.lesson)})   ${p.title}`)
  }
  if (surplus.length) {
    console.log('\nDelete (dated after the course ends):')
    for (const s of surplus) console.log(`   ${s.dueDate.toISOString().slice(0, 10)}  ${s.title}`)
  }
  const covered = new Set(plan.map(p => p.lesson))
  const missing = lessons.filter(l => !covered.has(l))
  console.log(`\nlessons covered: ${covered.size}/${lessons.length}` +
    (missing.length ? `  MISSING ${missing.join(', ')}` : '  (all)'))

  if (!APPLY) { console.log('\nDry run — nothing written. Re-run with --apply.'); await prisma.$disconnect(); return }

  for (const p of plan) {
    const before = quizzes.find(q => q.id === p.id)!
    const pct = before.provideDefinition ? 100 : 0
    const count = await prisma.question.count({ where: { assignmentId: p.id } })
    const questions = generateVocabQuestionsForLesson(p.lesson, 'GREEK_TO_ENGLISH', count || 20, pct)
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: p.id } }),
      prisma.question.createMany({ data: questions.map(q => ({ ...q, assignmentId: p.id })) }),
      prisma.assignment.update({
        where: { id: p.id },
        data: { weekNumber: p.week, title: p.title },
      }),
    ])
  }
  for (const s of surplus) {
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: s.id } }),
      prisma.assignment.delete({ where: { id: s.id } }),
    ])
  }
  console.log(`\nApplied: ${plan.length} quizzes re-pointed, ${surplus.length} deleted.`)
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
