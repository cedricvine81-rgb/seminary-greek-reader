import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { prisma } from '@/lib/db'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

// Reads live DB; never pre-render
export const dynamic = 'force-dynamic'

function getAdmin() {
  const token = getTokenFromCookies()
  const payload = token ? verifyToken(token) : null
  return payload?.role === 'ADMIN' ? payload : null
}

const PAGE_SIZE = 50

/**
 * GET /api/admin/lexicon
 *   q=...               substring match against lexeme or gloss
 *   onlyWithSynonyms=1  only show entries that already have curated synonyms
 *   quizVocabOnly=1     only show lemmas that appear in published vocab quizzes
 *   alphaStart=κ        only show lemmas whose first letter matches (diacritic-tolerant)
 *   minFreq=30          filter by minimum frequency
 *   sort=alpha|freq     sort order (default freq desc)
 *   page=1
 */
export async function GET(req: NextRequest) {
  try {
    if (!getAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim() ?? ''
    const onlyWithSynonyms = sp.get('onlyWithSynonyms') === '1'
    const quizVocabOnly = sp.get('quizVocabOnly') === '1'
    const alphaStart = sp.get('alphaStart')?.trim() ?? ''
    const minFreq = Number(sp.get('minFreq')) || 0
    const sort = sp.get('sort') === 'alpha' ? 'alpha' : 'freq'
    const page = Math.max(1, Number(sp.get('page')) || 1)

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { lexeme: { contains: q, mode: 'insensitive' } },
        { gloss: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (onlyWithSynonyms) where.acceptedAnswers = { not: null }
    if (minFreq > 0) where.frequency = { gte: minFreq }

    if (alphaStart) {
      // The lexicon stores lemmas with accents/diacritics; match the first base letter
      // regardless of breathing/accent marks. We expand the requested base letter into
      // all possible accent variants that share the same NFD base.
      const variants = expandToAccentVariants(alphaStart)
      where.OR = [
        ...(where.OR ? [...(where.OR as object[])] : []),
        ...variants.map(v => ({ lexeme: { startsWith: v } })),
      ]
    }

    if (quizVocabOnly) {
      // Intersect with the set of lemmas referenced by published vocab quiz questions.
      const quizPrompts = await prisma.question.findMany({
        where: {
          type: 'GREEK_TO_ENGLISH',
          assignment: { isPublished: true, type: 'VOCABULARY_QUIZ' },
        },
        select: { prompt: true },
        distinct: ['prompt'],
      })
      const promptList = Array.from(new Set(quizPrompts.map(q => q.prompt))).filter(Boolean)
      if (promptList.length === 0) {
        return NextResponse.json({ rows: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 })
      }
      where.lexeme = { in: promptList }
    }

    const orderBy = sort === 'alpha'
      ? [{ lexeme: 'asc' as const }]
      : [{ frequency: 'desc' as const }, { lexeme: 'asc' as const }]

    const [total, rows] = await Promise.all([
      prisma.lexicalEntry.count({ where }),
      prisma.lexicalEntry.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, lexeme: true, gloss: true, extendedGloss: true,
          partOfSpeech: true, frequency: true, acceptedAnswers: true,
        },
      }),
    ])

    return NextResponse.json({
      rows,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    })
  } catch (err) {
    logError('api/admin/lexicon', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

/**
 * Map a Greek "base letter" (without diacritics) to the set of accent/breathing
 * variants the lexicon may store. Generated cheaply from Unicode normalization.
 */
function expandToAccentVariants(base: string): string[] {
  const ch = base.charAt(0).toLowerCase()
  // Greek vowels that take breathings/accents
  const VOWELS: Record<string, string[]> = {
    α: ['α', 'ά', 'ὰ', 'ᾶ', 'ἀ', 'ἁ', 'ἄ', 'ἅ', 'ἂ', 'ἃ', 'ἆ', 'ἇ'],
    ε: ['ε', 'έ', 'ὲ', 'ἐ', 'ἑ', 'ἔ', 'ἕ', 'ἒ', 'ἓ'],
    η: ['η', 'ή', 'ὴ', 'ῆ', 'ἠ', 'ἡ', 'ἤ', 'ἥ', 'ἢ', 'ἣ', 'ἦ', 'ἧ'],
    ι: ['ι', 'ί', 'ὶ', 'ῖ', 'ἰ', 'ἱ', 'ἴ', 'ἵ', 'ἲ', 'ἳ', 'ἶ', 'ἷ', 'ϊ', 'ΐ'],
    ο: ['ο', 'ό', 'ὸ', 'ὀ', 'ὁ', 'ὄ', 'ὅ', 'ὂ', 'ὃ'],
    υ: ['υ', 'ύ', 'ὺ', 'ῦ', 'ὐ', 'ὑ', 'ὔ', 'ὕ', 'ὒ', 'ὓ', 'ὖ', 'ὗ', 'ϋ', 'ΰ'],
    ω: ['ω', 'ώ', 'ὼ', 'ῶ', 'ὠ', 'ὡ', 'ὤ', 'ὥ', 'ὢ', 'ὣ', 'ὦ', 'ὧ'],
    ρ: ['ρ', 'ῤ', 'ῥ'],
  }
  return VOWELS[ch] ?? [ch]
}
