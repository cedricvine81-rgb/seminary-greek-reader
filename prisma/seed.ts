import { PrismaClient, Corpus, CourseLevel, FrequencyLevel, Role, AssignmentType, QuestionType } from '@prisma/client'
import { hash } from 'bcryptjs'
import gntData from './seed-data/sample-gnt.json'
import lxxData from './seed-data/sample-lxx.json'
import vocab50 from './seed-data/vocabulary-nt-50-plus.json'
import vocab30 from './seed-data/vocabulary-nt-30-plus.json'

const prisma = new PrismaClient()

type SeedVerse = { chapter: number; verse: number; reference: string; text: string }
type SeedBook = {
  osisId: string; name: string; abbrev: string; totalChapters: number
  corpus: string; verses: SeedVerse[]
}
type SeedVocab = {
  lexeme: string; gloss: string; partOfSpeech: string
  frequency: number; strongs?: string; extendedGloss?: string
}

async function main() {
  console.log('Seeding database…')

  // ── Institution ──────────────────────────────────────────────────
  const institution = await prisma.institution.upsert({
    where: { name: 'Demo Seminary' },
    update: {},
    create: { name: 'Demo Seminary' },
  })

  // ── Demo users ───────────────────────────────────────────────────
  const instructorPw = await hash('instructor123', 12)
  const studentPw = await hash('student123', 12)

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@demo.edu' },
    update: {},
    create: {
      firstName: 'Dr. James',
      surname: 'Mitchell',
      email: 'instructor@demo.edu',
      password: instructorPw,
      role: Role.INSTRUCTOR,
      institution: 'Demo Seminary',
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'student@demo.edu' },
    update: {},
    create: {
      firstName: 'Sarah',
      surname: 'Johnson',
      email: 'student@demo.edu',
      password: studentPw,
      role: Role.STUDENT,
      institution: 'Demo Seminary',
    },
  })

  // ── Biblical texts ────────────────────────────────────────────────
  const allBooks: SeedBook[] = [
    ...(gntData as SeedBook[]),
    ...(lxxData as SeedBook[]),
  ]

  for (const bookData of allBooks) {
    const book = await prisma.biblicalBook.upsert({
      where: { osisId: bookData.osisId },
      update: {},
      create: {
        osisId: bookData.osisId,
        name: bookData.name,
        abbrev: bookData.abbrev,
        totalChapters: bookData.totalChapters,
        corpus: bookData.corpus as Corpus,
      },
    })

    for (const v of bookData.verses) {
      await prisma.biblicalVerse.upsert({
        where: { bookId_chapter_verse: { bookId: book.id, chapter: v.chapter, verse: v.verse } },
        update: { text: v.text },
        create: {
          bookId: book.id,
          chapter: v.chapter,
          verse: v.verse,
          reference: v.reference,
          text: v.text,
        },
      })
    }
    console.log(`  Seeded ${bookData.name} (${bookData.verses.length} verses)`)
  }

  // ── Lexical entries + vocabulary lists ────────────────────────────
  const allVocab: (SeedVocab & { level: FrequencyLevel })[] = [
    ...(vocab50 as SeedVocab[]).map(v => ({ ...v, level: FrequencyLevel.BEGINNING })),
    ...(vocab30 as SeedVocab[]).map(v => ({ ...v, level: FrequencyLevel.INTERMEDIATE })),
  ]

  const seen = new Set<string>()
  for (const item of allVocab) {
    let lexEntry = await prisma.lexicalEntry.findUnique({ where: { lexeme: item.lexeme } })
    if (!lexEntry) {
      lexEntry = await prisma.lexicalEntry.create({
        data: {
          lexeme: item.lexeme,
          gloss: item.gloss,
          partOfSpeech: item.partOfSpeech,
          frequency: item.frequency,
          strongs: item.strongs ?? null,
          extendedGloss: item.extendedGloss ?? null,
        },
      })
    }

    const key = `${lexEntry.id}-${item.level}`
    if (!seen.has(key)) {
      seen.add(key)
      await prisma.vocabularyItem.upsert({
        where: { lexemeId_level: { lexemeId: lexEntry.id, level: item.level } },
        update: {},
        create: {
          lexemeId: lexEntry.id,
          level: item.level,
          sortOrder: item.frequency,
        },
      })

      await prisma.flashcard.upsert({
        where: { lexemeId_level: { lexemeId: lexEntry.id, level: item.level } },
        update: {},
        create: {
          lexemeId: lexEntry.id,
          level: item.level,
          front: item.lexeme,
          backLexeme: item.lexeme,
          backGloss: item.gloss,
          backParsing: item.partOfSpeech,
        },
      })
    }
  }
  console.log(`  Seeded ${allVocab.length} vocabulary/flashcard entries`)

  // ── Demo course ───────────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { id: 'demo-course-001' },
    update: {},
    create: {
      id: 'demo-course-001',
      name: 'Beginning Greek I',
      level: CourseLevel.BEGINNING,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      instructorId: instructor.id,
      institutionId: institution.id,
    },
  })

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: {},
    create: { userId: student.id, courseId: course.id },
  })

  // ── Demo assignment ───────────────────────────────────────────────
  const assignment = await prisma.assignment.upsert({
    where: { id: 'demo-assign-001' },
    update: {},
    create: {
      id: 'demo-assign-001',
      courseId: course.id,
      createdById: instructor.id,
      title: 'Week 1: John 1:1–5 Vocabulary',
      type: AssignmentType.VOCABULARY_QUIZ,
      weekNumber: 1,
      dueDate: new Date('2025-09-08'),
      level: CourseLevel.BEGINNING,
      reference: 'John 1:1-5',
      instructions: 'Identify the gloss for each Greek word.',
      isPublished: true,
    },
  })

  // Sample questions
  const sampleWords = [
    { prompt: 'λόγος', correct: 'word, message, reason', opts: ['law', 'word, message, reason', 'life', 'light'] },
    { prompt: 'ζωή', correct: 'life', opts: ['life', 'darkness', 'world', 'grace'] },
    { prompt: 'φῶς', correct: 'light', opts: ['fire', 'light', 'spirit', 'faith'] },
  ]

  for (let i = 0; i < sampleWords.length; i++) {
    const w = sampleWords[i]
    await prisma.question.upsert({
      where: { id: `demo-q-00${i + 1}` },
      update: {},
      create: {
        id: `demo-q-00${i + 1}`,
        assignmentId: assignment.id,
        position: i + 1,
        type: QuestionType.GREEK_TO_ENGLISH,
        prompt: w.prompt,
        correctAnswer: w.correct,
        options: w.opts,
        points: 1,
        reference: 'John 1:1-5',
      },
    })
  }

  console.log('  Seeded demo course, enrollment, and assignment')
  console.log('\nSeed complete.')
  console.log('\nDemo credentials:')
  console.log('  Instructor → instructor@demo.edu / instructor123')
  console.log('  Student    → student@demo.edu / student123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
