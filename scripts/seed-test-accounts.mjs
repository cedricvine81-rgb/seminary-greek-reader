// Seed the standing test accounts and sandbox course used for end-to-end smoke testing.
//
//   node --env-file=.env.local scripts/seed-test-accounts.mjs
//
// Creates (idempotently — safe to rerun, existing rows are updated in place):
//   · test-instructor@seminarygreek.app  (INSTRUCTOR, approved)
//   · test-student@seminarygreek.app     (STUDENT, GRANDFATHERED so the paywall never blocks)
//   · "TEST — Sandbox (ignore)" course owned by the instructor, student enrolled+approved,
//     one published homework assignment so the whole submit→grade loop is walkable.
//
// Fresh random passwords are generated ON EVERY RUN, printed to stdout and written to
// .tmp/test-credentials.txt (untracked). Rerun the script to rotate them.
//
// These accounts exist so broken student/instructor flows are found by a script — or by
// Claude in a preview browser — instead of by a student in week one.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const { hash } = bcrypt
import { randomBytes } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'

const prisma = new PrismaClient()
const pw = () => randomBytes(9).toString('base64url')

async function upsertUser({ email, role, firstName, surname, password, extra = {} }) {
  const hashed = await hash(password, 12)
  return prisma.user.upsert({
    where: { email },
    update: { password: hashed, approved: true, deletedAt: null, ...extra },
    create: {
      email, role, firstName, surname, password: hashed, approved: true,
      institution: 'TEST', termsAcceptedAt: new Date(), termsVersion: 'test',
      personalEmail: email, ...extra,
    },
  })
}

const instructorPw = pw()
const studentPw = pw()

const instructor = await upsertUser({
  email: 'test-instructor@seminarygreek.app', role: 'INSTRUCTOR',
  firstName: 'Test', surname: 'Instructor', password: instructorPw,
})
const student = await upsertUser({
  email: 'test-student@seminarygreek.app', role: 'STUDENT',
  firstName: 'Test', surname: 'Student', password: studentPw,
  extra: { subscriptionStatus: 'GRANDFATHERED' },
})

const courseName = 'TEST — Sandbox (ignore)'
let course = await prisma.course.findFirst({ where: { name: courseName } })
if (!course) {
  course = await prisma.course.create({ data: {
    name: courseName, level: 'BEGINNING', language: 'en',
    startDate: new Date(), endDate: new Date('2040-01-01'),
    instructorId: instructor.id,
  }})
} else if (course.instructorId !== instructor.id) {
  course = await prisma.course.update({ where: { id: course.id }, data: { instructorId: instructor.id } })
}

const enrollment = await prisma.enrollment.findFirst({ where: { courseId: course.id, userId: student.id } })
if (!enrollment) {
  await prisma.enrollment.create({ data: { courseId: course.id, userId: student.id, status: 'APPROVED' } })
} else if (enrollment.status !== 'APPROVED') {
  await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'APPROVED' } })
}

// One standing homework assignment, so the student pane and grading loop are reachable.
const hwTitle = 'TEST — Homework A — Prepositions (Lesson 3)'
let assignment = await prisma.assignment.findFirst({ where: { courseId: course.id, title: hwTitle } })
if (!assignment) {
  // The API route builds homework questions from the set; seeding creates the shell the same
  // way the route does (one question per sentence is generated on activation via the API).
  // Simpler and truer here: call nothing and let the smoke test activate through the API.
  assignment = null
}

// Two standing MORPHOLOGY_QUIZ assignments, so "Practise this quiz" is walkable end to end:
// one carrying a stored recipe (the normal case) and one without (the legacy fallback, which
// generates by part of speech alone). Neither needs generated Question rows — practice reads
// the recipe, never the graded questions.
for (const [title, extra] of [
  ['TEST — Morphology Quiz (practice check)', {
    morphSubtype: 'VERB', vocabThruLesson: 8,
    morphConfig: {
      fields: ['tense', 'voice', 'mood', 'person', 'number'],
      parseFilter: { tenses: ['Present', 'Aorist'], moods: ['Indicative', 'Subjunctive'] },
      numQuestions: 10,
    },
  }],
  ['TEST — Morphology Quiz (legacy, no recipe)', { morphSubtype: 'NOUN', morphConfig: null }],
]) {
  const data = {
    courseId: course.id, createdById: instructor.id, title, type: 'MORPHOLOGY_QUIZ',
    weekNumber: 4, dueDate: new Date('2040-01-01'), level: course.level, isPublished: true,
    ...extra,
  }
  const existing = await prisma.assignment.findFirst({ where: { courseId: course.id, title } })
  if (existing) await prisma.assignment.update({ where: { id: existing.id }, data })
  else await prisma.assignment.create({ data })
}

const creds = [
  'Seminary Greek — standing TEST accounts (safe to share with Claude, rotate by rerunning the seed script)',
  '',
  `instructor  test-instructor@seminarygreek.app  ${instructorPw}`,
  `student     test-student@seminarygreek.app     ${studentPw}`,
  '',
  `course      ${courseName}  (${course.id})`,
].join('\n')

mkdirSync('.tmp', { recursive: true })
writeFileSync('.tmp/test-credentials.txt', creds + '\n')
console.log(creds)
console.log('\nWritten to .tmp/test-credentials.txt (untracked).')
await prisma.$disconnect()
