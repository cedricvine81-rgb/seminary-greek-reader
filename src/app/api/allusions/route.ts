import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'
import { searchAllusions, strongsFrequencies, termFrequencies, type SourceToken, type AllusionTerm } from '@/lib/allusion-search'

// Allusion search over the LXX (Exegesis → Allusions tab).
//
// POST { action: 'freq',      strongs: string[] }
//   → { totalVerses, counts }        — rarity badges for a passage's words
// POST { action: 'termfreq',  terms: AllusionTerm[] }
//   → { totalVerses, counts }        — same, but a phrase is counted as a SEQUENCE
// POST { action: 'search',    terms: AllusionTerm[], sourceTokens?: { s, f }[], useSynonyms?: boolean }
//   → { totalVerses, hits, frequencies }
//
// Public data, no auth. Input sizes are capped: a passage is a few hundred words, so
// anything beyond these limits is a malformed or abusive request, not a real search.

const MAX_STRONGS = 400
const MAX_SOURCE_TOKENS = 1200
const MAX_TERMS = 40
const MAX_PHRASE_LEN = 12

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const strs = (v: unknown, cap: number): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && /^\d{1,6}$/.test(x)).slice(0, cap) : []

    const parseTerms = (v: unknown): AllusionTerm[] =>
      Array.isArray(v)
        ? v.slice(0, MAX_TERMS).flatMap(raw => {
            const o = raw as { kind?: unknown; strongs?: unknown; forms?: unknown }
            const ss = strs(o?.strongs, MAX_PHRASE_LEN)
            if (ss.length === 0) return []
            const kind: AllusionTerm['kind'] = o?.kind === 'phrase' && ss.length > 1 ? 'phrase' : 'word'
            const forms = Array.isArray(o?.forms)
              ? (o.forms as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 12).map(f => f.slice(0, 40))
              : []
            return [{ kind, strongs: ss, forms }]
          })
        : []

    if (body.action === 'freq') {
      return NextResponse.json(strongsFrequencies(strs(body.strongs, MAX_STRONGS)))
    }

    if (body.action === 'termfreq') {
      return NextResponse.json(termFrequencies(parseTerms(body.terms)))
    }

    if (body.action === 'search') {
      const terms = parseTerms(body.terms)
      if (terms.length === 0) return NextResponse.json({ error: 'Select at least one word' }, { status: 400 })

      const sourceTokens: SourceToken[] = Array.isArray(body.sourceTokens)
        ? (body.sourceTokens as unknown[]).slice(0, MAX_SOURCE_TOKENS).flatMap(t => {
            const o = t as { s?: unknown; f?: unknown }
            return typeof o?.s === 'string' && /^\d{1,6}$/.test(o.s) && typeof o?.f === 'string'
              ? [{ s: o.s, f: o.f.slice(0, 40) }] : []
          })
        : []

      return NextResponse.json(searchAllusions({ terms, sourceTokens, useSynonyms: body.useSynonyms === true }))
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    logError('api/allusions', err)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
