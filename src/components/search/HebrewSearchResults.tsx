'use client'

import { useEffect, useRef, useState } from 'react'
import { mtToEnglish } from '@/lib/versification'

// Two-column parallel view for a Hebrew (MT) search: each hit verse shows the pointed Hebrew
// beside a parallel translation — mirroring GreekSearchResults, minus the word-level parsing.
// Translations are the reader's per-chapter index (/api/translation), fetched lazily per shown
// chapter. Hebrew (BHS) and English versification diverge in ~30 chapters (Psalm titles, Joel,
// Malachi, …), so each hit is mapped through mtToEnglish before the translation is fetched and
// looked up — otherwise the neighbouring English verse would show. See SearchPageView.

// First option turns the parallel column off; the rest are the available translations. Every MT
// book is in the 66-book canon, so all of these have Old-Testament coverage (unlike the LXX-only
// books on the Greek side, which need a Brenton fallback).
const TRANSLATIONS = [
  { lang: 'none', label: 'No translation' },
  { lang: 'en', label: 'English (WEB)' }, { lang: 'bsb', label: 'English (BSB)' },
  { lang: 'es', label: 'Spanish' }, { lang: 'fr', label: 'French' }, { lang: 'pt', label: 'Portuguese' },
  { lang: 'ru', label: 'Russian' }, { lang: 'ko', label: 'Korean' }, { lang: 'zh', label: 'Mandarin' },
]

export type HebrewHit = { osisId: string; chapter: number; verse: number; text: string }

export function HebrewSearchResults({ hits, bookName, onOpen }: {
  hits: HebrewHit[]
  bookName: Map<string, string>
  onOpen: (h: HebrewHit, transLang: string) => void
}) {
  const [transLang, setTransLang] = useState('en')
  const [, bump] = useState(0)
  // verseId → translation text (per lang), lazily filled; a ref so late fetches always store.
  const trans = useRef<Record<string, Record<string, string>>>({})
  const fetchedTr = useRef<Set<string>>(new Set())

  // Fetch the English chapters the hits map ONTO (which can differ from the Hebrew chapter, e.g.
  // Heb Joel 4 → Eng Joel 3), so the right chapter's verses are on hand for the lookup.
  const chapters = new Set<string>()
  for (const h of hits) {
    const eng = mtToEnglish(h.osisId, h.chapter, h.verse)
    if (eng) chapters.add(`${h.osisId}.${eng.chapter}`)
  }

  useEffect(() => {
    if (transLang === 'none') return
    for (const ck of Array.from(chapters)) {
      const [osis, ch] = ck.split('.')
      const trKey = `${transLang}.${ck}`
      if (fetchedTr.current.has(trKey)) continue
      fetchedTr.current.add(trKey)
      fetch(`/api/translation?book=${osis}&chapter=${ch}&lang=${transLang}`)
        .then(r => (r.ok ? r.json() : { verses: {} }))
        .then((d: { verses?: Record<string, string> }) => {
          Object.assign((trans.current[transLang] ??= {}), d.verses ?? {})
          bump(x => x + 1)
        })
        .catch(() => { fetchedTr.current.delete(trKey) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, transLang])

  const showTrans = transLang !== 'none'
  const trMap = showTrans ? trans.current[transLang] ?? {} : {}

  return (
    <div>
      <div className="flex justify-end pb-2">
        <select value={transLang} onChange={e => setTransLang(e.target.value)}
          className="rounded-md border border-gray-200 bg-surface px-2 py-1 text-xs text-gray-600">
          {TRANSLATIONS.map(t => <option key={t.lang} value={t.lang}>{t.label}</option>)}
        </select>
      </div>

      <div className="divide-y divide-gray-100">
        {hits.map((h, i) => {
          const eng = mtToEnglish(h.osisId, h.chapter, h.verse)
          const vid = eng ? `${h.osisId}.${eng.chapter}.${eng.verse}` : null
          return (
            <div key={i} className="py-2.5">
              <button onClick={() => onOpen(h, transLang)} className="text-xs font-medium text-brand-600 hover:underline">
                {bookName.get(h.osisId) ?? h.osisId} {h.chapter}:{h.verse}
              </button>
              <div className={`mt-1 grid gap-x-4 gap-y-1 items-baseline ${showTrans ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Same size the Reader's Hebrew column uses (its default — the reader's own
                    font-size setting is scoped to its container), so the split view reads as
                    one continuous surface rather than the results shouting. */}
                <p dir="rtl" className="font-hebrew leading-loose text-gray-800" style={{ fontSize: 'var(--greek-fs, 1.125rem)' }}>
                  {h.text}
                </p>
                {showTrans && (
                  <p className="font-reading leading-relaxed text-gray-700 sm:border-l sm:border-gray-100 sm:pl-4">
                    {vid === null
                      ? <span className="text-gray-400 italic">(superscription)</span>
                      : trMap[vid] ?? <span className="text-gray-300 italic">…</span>}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
