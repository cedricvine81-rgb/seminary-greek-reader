import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { suggestLemmas, lemmaEntry } from '@/lib/construct-lemmas'

// GET /api/construct/lemmas?corpus=LXX&q=<typed text>
// Predictive lexemes plus the exact entry for what's typed, for Construct search's word field.
// Only used for corpora whose lemma table is too large to ship to the browser (the Septuagint —
// the New Testament's is held client-side, so its field never needs a request).
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim()
  const corpus = (searchParams.get('corpus') ?? 'GNT').toUpperCase()
  if (!/^[A-Z]{3}$/.test(corpus)) return NextResponse.json({ suggestions: [], exact: null })

  try {
    return NextResponse.json({
      suggestions: suggestLemmas(corpus, q),
      exact: lemmaEntry(corpus, q),
    })
  } catch (err) {
    logError('api/construct/lemmas', err)
    return NextResponse.json({ suggestions: [], exact: null })
  }
}
