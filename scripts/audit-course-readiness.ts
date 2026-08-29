/**
 * Pre-semester readiness check for a live course.
 *
 *   npx tsx --env-file=.env.local scripts/audit-course-readiness.ts            # every active course
 *   npx tsx --env-file=.env.local scripts/audit-course-readiness.ts "Beginning Greek"
 *
 * Read-only. It answers the question an instructor actually has in week one — "will every
 * student hit a working assignment?" — by walking the same data the student pages read:
 *
 *   - published quizzes that carry no questions (the failure the semester route's transaction
 *     was written to prevent; rows created before it predate that guarantee)
 *   - vocabulary quizzes whose stored selection resolves to no deck words, which renders as an
 *     empty quiz rather than an error
 *   - duplicate assignments inside one week, the shape a twice-run generator leaves behind
 *   - due dates outside the course's own start/end dates
 *   - assignments still unpublished with the due date already past
 *   - enrolments that are not APPROVED, which keep a student out of the course silently
 */
import { PrismaClient } from '@prisma/client'
import { GREEK_DECK, HEBREW_DECK, deckWordsForSelection } from '../src/lib/vocab-decks'

const prisma = new PrismaClient()
const filter = process.argv[2]

type Finding = { sev: 'BLOCKER' | 'WARN' | 'NOTE'; course: string; msg: string }
const findings: Finding[] = []
const add = (sev: Finding['sev'], course: string, msg: string) => findings.push({ sev, course, msg })

const QUIZ_TYPES = new Set(['VOCABULARY_QUIZ', 'MORPHOLOGY_QUIZ'])
const day = (d: Date) => d.toISOString().slice(0, 10)

async function main() {
  const courses = await prisma.course.findMany({
    where: { isArchived: false, ...(filter ? { name: { contains: filter, mode: 'insensitive' } } : {}) },
    include: {
      instructor: { select: { firstName: true, surname: true } },
      enrollments: { select: { status: true } },
      assignments: {
        select: {
          id: true, title: true, type: true, weekNumber: true, dueDate: true,
          isPublished: true, vocabSelection: true, _count: { select: { questions: true } },
        },
        orderBy: [{ weekNumber: 'asc' }, { title: 'asc' }],
      },
    },
    orderBy: { startDate: 'desc' },
  })

  if (!courses.length) { console.log(`no active course matches ${JSON.stringify(filter ?? '')}`); return }

  for (const c of courses) {
    const approved = c.enrollments.filter(e => e.status === 'APPROVED').length
    const pending = c.enrollments.length - approved
    console.log(`\n${c.name}  (${c.level})  ${day(c.startDate)} -> ${day(c.endDate)}`)
    console.log(`  instructor ${c.instructor.firstName} ${c.instructor.surname} | ${approved} approved enrolments`
      + `${pending ? ` (+${pending} NOT approved)` : ''} | ${c.assignments.length} assignments`)

    if (pending) add('WARN', c.name, `${pending} enrolment(s) not APPROVED - those students cannot see the course`)

    const byType = new Map<string, number>()
    for (const a of c.assignments) byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
    if (byType.size) console.log('  ' + Array.from(byType).map(([t, n]) => `${t}:${n}`).join('  '))

    // published, but with nothing to answer
    for (const a of c.assignments) {
      if (QUIZ_TYPES.has(a.type) && a._count.questions === 0) {
        add(a.isPublished ? 'BLOCKER' : 'WARN', c.name,
          `${a.isPublished ? 'PUBLISHED' : 'draft'} quiz with ZERO questions - wk${a.weekNumber} "${a.title}"`)
      }
    }

    // a stored vocabulary selection that no longer matches any deck word
    for (const a of c.assignments) {
      const sel = (a.vocabSelection as { subsections?: string[] } | null)?.subsections
      if (!sel?.length) continue
      const deck = String(c.level).startsWith('HEBREW') ? HEBREW_DECK : GREEK_DECK
      if (deckWordsForSelection(deck, sel, []).length === 0) {
        add('BLOCKER', c.name,
          `vocabulary selection matches NO deck words - wk${a.weekNumber} "${a.title}" (${sel.join(', ')})`)
      }
    }

    // the same assignment generated twice into one week
    const seen = new Map<string, number>()
    for (const a of c.assignments) {
      const k = `wk${a.weekNumber} ${a.type} ${a.title}`
      seen.set(k, (seen.get(k) ?? 0) + 1)
    }
    Array.from(seen).forEach(([k, n]) => { if (n > 1) add('WARN', c.name, `${n} identical assignments - ${k}`) })

    // dates that fall outside the course's own dates
    for (const a of c.assignments) {
      if (a.dueDate < c.startDate) add('WARN', c.name, `due BEFORE the course starts - wk${a.weekNumber} "${a.title}" (${day(a.dueDate)})`)
      if (a.dueDate > c.endDate) add('NOTE', c.name, `due after the course ends - wk${a.weekNumber} "${a.title}" (${day(a.dueDate)})`)
    }

    // still a draft with the deadline gone
    const now = new Date()
    for (const a of c.assignments) {
      if (!a.isPublished && a.dueDate < now) {
        add('WARN', c.name, `unpublished and already past due - wk${a.weekNumber} "${a.title}"`)
      }
    }
  }

  console.log('\n-- FINDINGS --------------------------------------------')
  for (const sev of ['BLOCKER', 'WARN', 'NOTE'] as const) {
    const fs = findings.filter(f => f.sev === sev)
    if (!fs.length) continue
    console.log(`\n${sev} (${fs.length})`)
    for (const f of fs) console.log(`  - [${f.course}] ${f.msg}`)
  }
  if (!findings.length) console.log('no findings')
  console.log(`\n${findings.filter(f => f.sev === 'BLOCKER').length} blockers, `
    + `${findings.filter(f => f.sev === 'WARN').length} warnings, `
    + `${findings.filter(f => f.sev === 'NOTE').length} notes`)
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(findings.some(f => f.sev === 'BLOCKER') ? 1 : 0))
  .catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(2) })
