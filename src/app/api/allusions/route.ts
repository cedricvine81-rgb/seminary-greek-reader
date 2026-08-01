import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { searchAllusions, strongsFrequencies, type SourceToken } from '@/lib/allusion-search'

// Allusion search over the LXX (Exegesis → Allusions tab).
//
// POST { action: 'freq',   strongs: string[] }
//   → { totalVerses, counts }        — rarity badges for a passage's words
// POST { action: 'search', selected: string[], selectedForms?: Record<string,string[]>,
//        sourceTokens?: { s, f }[] }
//   → { totalVerses, hits, frequencies }
//
// Public data, no auth. Input sizes are capped: a passage is a few hundred words, so
// anything beyond these limits is a malformed or abusive request, not a real search.

const MAX_STRONGS = 400
const MAX_SOURCE_TOKENS = 1200

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const strs = (v: unknown, cap: number): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && /^\d{1,6}$/.test(x)).slice(0, cap) : []

    if (body.action === 'freq') {
      return NextResponse.json(strongsFrequencies(strs(body.strongs, MAX_STRONGS)))
    }

    if (body.action === 'search') {
      const selected = strs(body.selected, 40)
      if (selected.length === 0) return NextResponse.json({ error: 'Select at least one word' }, { status: 400 })

      const selectedForms: Record<string, string[]> = {}
      if (body.selectedForms && typeof body.selectedForms === 'object') {
        for (const [k, v] of Object.entries(body.selectedForms as Record<string, unknown>)) {
          if (/^\d{1,6}$/.test(k) && Array.isArray(v)) {
            selectedForms[k] = v.filter((x): x is string => typeof x === 'string').slice(0, 10)
          }
        }
      }

      const sourceTokens: SourceToken[] = Array.isArray(body.sourceTokens)
        ? (body.sourceTokens as unknown[]).slice(0, MAX_SOURCE_TOKENS).flatMap(t => {
            const o = t as { s?: unknown; f?: unknown }
            return typeof o?.s === 'string' && /^\d{1,6}$/.test(o.s) && typeof o?.f === 'string'
              ? [{ s: o.s, f: o.f.slice(0, 40) }] : []
          })
        : []

      return NextResponse.json(searchAllusions({ selected, selectedForms, sourceTokens }))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    logError('api/allusions', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
