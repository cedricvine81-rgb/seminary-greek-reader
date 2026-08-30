import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { citationsFor, type CitationTarget } from '@/lib/style-citations'

// POST /api/register/citations
//   { units: [{ id, corpus, work } | { id, corpus, book, fromCh, toCh }], features: [], lemmas: [] }
//   → { [id]: { refs, counts } }
//
// Batched, because the printed report asks about a dozen works at once and each corpus is
// parsed once per instance — a request per work would reload the same corpus a dozen times.
// Server-side for the same reason the passage profiler is: the token streams live on disk.
const MAX_UNITS = 12

interface UnitSpec {
  id?: string
  corpus?: string
  work?: string
  book?: string
  fromCh?: number
  toCh?: number
  fromV?: number
  toV?: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      units?: UnitSpec[]; features?: string[]; lemmas?: string[]; limit?: number
    }
    const units = Array.isArray(body.units) ? body.units.slice(0, MAX_UNITS) : []
    const features = Array.isArray(body.features) ? body.features.slice(0, 40) : []
    const lemmas = Array.isArray(body.lemmas) ? body.lemmas.slice(0, 40) : []
    const limit = Math.min(6, Math.max(1, Number(body.limit) || 3))
    if (!units.length || (!features.length && !lemmas.length)) {
      return NextResponse.json({}, { status: 400 })
    }

    // Group by corpus so each one is touched once, in one pass over the list.
    const order = units.slice().sort((a, b) => String(a.corpus).localeCompare(String(b.corpus)))
    const out: Record<string, unknown> = {}
    for (const u of order) {
      const id = String(u.id ?? '')
      if (!id || !u.corpus) continue
      const target: CitationTarget | null = u.work
        ? { kind: 'work', corpus: u.corpus, work: u.work }
        : u.book
          ? {
              kind: 'passage',
              ref: {
                corpus: u.corpus, book: u.book,
                fromCh: Number(u.fromCh) || 1, toCh: Number(u.toCh) || 999,
                fromV: Number.isFinite(Number(u.fromV)) && Number(u.fromV) > 0 ? Number(u.fromV) : undefined,
                toV: Number.isFinite(Number(u.toV)) && Number(u.toV) > 0 ? Number(u.toV) : undefined,
              },
            }
          : null
      if (!target) continue
      out[id] = citationsFor(target, features, lemmas, limit)
    }
    return NextResponse.json(out)
  } catch (err) {
    logError('api/register/citations', err)
    return NextResponse.json({}, { status: 500 })
  }
}
