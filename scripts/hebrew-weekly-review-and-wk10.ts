// Two follow-ups to scripts/switch-hebrew-weekly-to-sections.ts, at the user's request:
//
//  1. Review at 20% across the FA2026 weekly series (weeks 3+; week 2 has nothing earlier).
//     Pool = the week's §-section + 20% earlier-section words; attempts sample perAttempt.
//     Both the vocabSelection JSON and the vocabReviewPct column are set — different code
//     paths read each, and they must agree.
//
//  2. Week 10 (§1-I has only 5 words) becomes a §1 REVIEW that always includes those 5:
//     a hand-built pool of exactly perAttempt (20) questions — all 5 §1-I words plus 15
//     spread evenly over §1-A..§1-H — so every attempt shows the whole pool and the five
//     new words are guaranteed. Its stored recipe is all of §1, so a later regenerate
//     degrades gracefully to a uniform §1 review (losing only the guarantee).
import { prisma } from '@/lib/db'
import { generateHebrewVocabPoolFromSelection } from '@/lib/quiz-generation'
import { HEBREW_DECK, deckWordsForSelection } from '@/lib/vocab-decks'

const REVIEW_PCT = 20

function pickQuestions(pool: ReturnType<typeof generateHebrewVocabPoolFromSelection>, words: string[]) {
  const used = new Set<number>()
  const out: typeof pool = []
  for (const w of words) {
    const i = pool.findIndex((q, idx) => !used.has(idx) && q.prompt.includes(w))
    if (i === -1) throw new Error(`no question found for ${w}`)
    used.add(i)
    out.push(pool[i])
  }
  return out
}

async function main() {
  const APPLY = process.argv.includes('--apply')
  const c = await prisma.course.findFirst({ where: { name: { contains: 'Hebrew FA2026' } }, select: { id: true } })
  const qs = await prisma.assignment.findMany({
    where: { courseId: c!.id, type: 'VOCABULARY_QUIZ', title: { contains: 'Weekly vocab quiz' } },
    orderBy: { weekNumber: 'asc' },
    select: { id: true, title: true, weekNumber: true, vocabFillPct: true, provideDefinition: true,
              vocabSelection: true, _count: { select: { responses: true, attempts: true } } } })
  const touched = qs.filter(q => q._count.responses > 0 || q._count.attempts > 0)
  if (touched.length) throw new Error(`refusing: ${touched.length} have student work`)

  const section1 = HEBREW_DECK.allSubsectionKeys.filter(k => k.startsWith('1-'))

  for (const q of qs) {
    const sel = (q.vocabSelection ?? {}) as { subsections?: string[]; perAttempt?: number }
    const key = sel.subsections?.[0]
    if (!key) throw new Error(`week ${q.weekNumber}: no subsection stored`)
    const perAttempt = Number(sel.perAttempt ?? 20) || 20
    const fill = q.vocabFillPct ?? (q.provideDefinition ? 100 : 0)

    if (key === '1-I') {
      // ── Week 10: guaranteed-inclusion §1 review ──
      // Generate the full §1 pool once (so distractors draw §1-wide), then keep exactly
      // the 5 §1-I words + 15 spread evenly across §1-A..§1-H (round-robin, ~2 each).
      const full = generateHebrewVocabPoolFromSelection(section1, [], 'HEBREW_TO_ENGLISH', fill, 0)
      const newWords = deckWordsForSelection(HEBREW_DECK, ['1-I'], []).map(w => w.word)
      const perSection = section1.filter(k => k !== '1-I').map(k =>
        deckWordsForSelection(HEBREW_DECK, [k], []).map(w => w.word).sort(() => Math.random() - 0.5))
      const reviewWords: string[] = []
      for (let round = 0; reviewWords.length < 20 - newWords.length; round++)
        for (const sec of perSection) {
          if (reviewWords.length >= 20 - newWords.length) break
          if (sec[round]) reviewWords.push(sec[round])
        }
      const pool = pickQuestions(full, [...newWords, ...reviewWords])
      const title = q.title.replace(/\s*\((Glanz[^)]*|§[^)]*)\)\s*$/, '') + ' (§1 review)'
      console.log(`${APPLY ? 'FIX' : 'dry'} wk${String(q.weekNumber).padEnd(2)} ${title.padEnd(48)} pool=${pool.length} (5 new + ${reviewWords.length} review, all shown)`)
      if (!APPLY) continue
      await prisma.$transaction([
        prisma.question.deleteMany({ where: { assignmentId: q.id } }),
        prisma.question.createMany({ data: pool.map(p => ({ ...p, assignmentId: q.id })) }),
        prisma.assignment.update({ where: { id: q.id }, data: { title, vocabReviewPct: REVIEW_PCT,
          vocabSelection: { subsections: section1, pos: [], perAttempt, reviewPct: 0 } } }),
      ])
      continue
    }

    // ── Everyone else: 20% review (week 2 stays 0 — nothing earlier) ──
    const reviewPct = q.weekNumber <= 2 ? 0 : REVIEW_PCT
    const pool = generateHebrewVocabPoolFromSelection([key], [], 'HEBREW_TO_ENGLISH', fill, reviewPct)
    console.log(`${APPLY ? 'FIX' : 'dry'} wk${String(q.weekNumber).padEnd(2)} ${q.title.padEnd(48)} pool=${pool.length} review=${reviewPct}%`)
    if (!APPLY) continue
    await prisma.$transaction([
      prisma.question.deleteMany({ where: { assignmentId: q.id } }),
      prisma.question.createMany({ data: pool.map(p => ({ ...p, assignmentId: q.id })) }),
      prisma.assignment.update({ where: { id: q.id }, data: { vocabReviewPct: reviewPct,
        vocabSelection: { subsections: [key], pos: [], perAttempt, reviewPct } } }),
    ])
  }
  console.log(APPLY ? 'done' : 'dry run — rerun with --apply')
  await prisma.$disconnect()
}
main()
