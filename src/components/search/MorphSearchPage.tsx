'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { GreekSearchResults, type GreekHit } from './GreekSearchResults'
import { MorphSearchPicker } from '@/components/reader/MorphSearchPicker'
import { MORPH_GROUPS } from '@/lib/morph-features'
import { markScrollRestore } from '@/lib/scroll-restore'

// The morphology facet of the full-page search (scope `morph:GNT`). Reached from the Reader's
// "By morphology" picker (openMasterSearch → /search?in=morph:GNT&features=…). Kept as its own
// page component (branched in /search/page.tsx) so it stays isolated from the text-query search
// UI while reusing GreekSearchResults for the Greek | translation display. NT-only.

// value → human label, for the criteria chips.
const FEATURE_LABEL = new Map(MORPH_GROUPS.flatMap(g => g.features.map(f => [f.value, f.label] as const)))

function returnLabelFor(from?: string): string {
  if (!from) return 'page'
  if (from.startsWith('/reader')) return 'Reader'
  if (from.startsWith('/exegesis')) return 'Exegesis'
  if (from.startsWith('/morphology')) return 'Morphology'
  return 'page'
}

export function MorphSearchPage({ features, lemma, returnTo }: {
  features: string[]
  lemma: string          // '' when not restricting to a lemma
  returnTo?: string
}) {
  const router = useRouter()
  const [hits, setHits] = useState<GreekHit[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookName, setBookName] = useState<Map<string, string>>(new Map())
  const [editing, setEditing] = useState(false)

  // Book display names (osisId → name), like SearchPageView.
  useEffect(() => {
    fetch('/data/books.json').then(r => r.ok ? r.json() : null)
      .then((d: { gnt?: { osisId: string; name: string }[]; lxx?: { osisId: string; name: string }[] } | null) => {
        if (!d) return
        const m = new Map<string, string>()
        for (const b of [...(d.gnt ?? []), ...(d.lxx ?? [])]) m.set(b.osisId, b.name)
        setBookName(m)
      }).catch(() => {})
  }, [])

  // Run the morphology search (GNT). Re-runs if the criteria change (an Edit navigates here anew).
  useEffect(() => {
    if (features.length === 0 && !lemma) { setHits([]); setLoading(false); return }
    let live = true
    setLoading(true)
    const params = new URLSearchParams({ type: 'morph', features: features.join(','), corpus: 'GNT' })
    if (lemma) params.set('lemma', lemma)
    fetch(`/api/search?${params.toString()}`)
      .then(r => r.ok ? r.json() : { results: [] })
      .then((d: { results?: { bookId: string; chapter: number; verse: number; text: string }[] }) => {
        if (!live) return
        setHits((d.results ?? []).map(v => ({ osisId: v.bookId, chapter: v.chapter, verse: v.verse, text: v.text })))
      })
      .catch(() => { if (live) setHits([]) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [features, lemma])

  const openHit = useCallback((h: GreekHit) => {
    router.push(`/reader?ref=${encodeURIComponent(`${h.osisId} ${h.chapter}:${h.verse}`)}`)
  }, [router])

  // Re-search with edited criteria: navigate here anew (preserving the return target).
  const applyEdit = useCallback((feats: string[], lem: string | null) => {
    setEditing(false)
    const p = new URLSearchParams({ in: 'morph:GNT', features: feats.join(',') })
    if (lem) p.set('q', lem)
    if (returnTo) p.set('from', returnTo)
    router.push(`/search?${p.toString()}`)
  }, [router, returnTo])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 pb-2 bg-gray-50/95 backdrop-blur border-b border-gray-100">
        {returnTo && (
          <button type="button" onClick={() => { markScrollRestore(returnTo); router.push(returnTo) }}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 transition-colors">
            <ArrowLeft size={16} /> Return to {returnLabelFor(returnTo)}
          </button>
        )}

        {/* Criteria summary + edit */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Search by morphology</span>
              <span className="text-[10px] text-gray-400">· New Testament</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {features.length === 0 && !lemma && <span className="text-xs text-gray-400 italic">No criteria — click Edit to choose.</span>}
              {features.map(f => (
                <span key={f} className="rounded-md bg-brand-50 border border-brand-100 px-2 py-0.5 text-xs text-brand-700">
                  {FEATURE_LABEL.get(f) ?? f}
                </span>
              ))}
              {lemma && (
                <span className="rounded-md bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                  lemma: <span className="greek-text">{lemma}</span>
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={() => setEditing(true)}
            className="flex-none inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-surface px-2.5 py-1.5 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors">
            <Pencil size={13} /> Edit criteria
          </button>
        </div>
      </div>

      <div className="pt-3">
        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400 inline-flex w-full items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Searching…</p>
        ) : !hits || hits.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">No matches.</p>
        ) : (
          <>
            <p className="pb-2 text-xs text-gray-400">{hits.length}{hits.length >= 300 ? '+' : ''} verse{hits.length === 1 ? '' : 's'}</p>
            <GreekSearchResults
              hits={hits}
              terms={[]}
              corpus="GNT"
              bookName={bookName}
              context={0}
              ctxMap={{}}
              onOpen={openHit}
            />
          </>
        )}
      </div>

      {editing && (
        <MorphSearchPicker
          initialFeatures={features}
          lemma={lemma || null}
          initialRestrictLemma={!!lemma}
          subject="Morphology criteria"
          onSearch={applyEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}
