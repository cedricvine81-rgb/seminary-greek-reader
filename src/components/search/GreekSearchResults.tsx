'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ParsingDock } from './ParsingDock'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { findTermRanges, markSlice, normalizeFold, SEARCH_MARK } from '@/lib/highlight-terms'
import { emitParsingInfo, hasParsingSink } from '@/lib/parsing-info-bus'

// Two-column parallel view for a Greek search: each hit verse shows the Greek (word-by-word,
// clickable → parsing pane) beside a parallel translation, with one ParsingPanel pinned at the
// bottom. Reuses the reader's per-chapter word data (/api/reader) and translation index
// (/api/translation), fetched lazily per shown chapter. See SearchPageView for the flat list.

const MARK = SEARCH_MARK
const MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
// `transLang === 'none'` turns the parallel column off (Greek only) — never fetched, never
// rendered as a column. The selector itself lives in SearchPageView's controls bar.

type Token = { surface: string; lemma: string; gloss?: string; strongs?: string; parsing: string }
export type GreekHit = { osisId: string; chapter: number; verse: number; text: string }
type CtxVerse = { chapter: number; verse: number; text: string }

function formatMorph(m?: Record<string, string | null>): string {
  if (!m) return ''
  return MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function hilite(text: string, terms: string[]): ReactNode {
  const ranges = findTermRanges(text, terms)
  return ranges.length ? <>{markSlice(text, ranges, 0, text.length, MARK)}</> : text
}

export function GreekSearchResults({ hits, terms, searchLemma, corpus, bookName, context, ctxMap, transLang, onOpen, embedded = false }: {
  hits: GreekHit[]
  terms: string[]
  // Folded lemma for an "all forms" search: matched words are inflected forms that don't contain
  // the lemma string, so they're highlighted by their lemma instead of their surface.
  searchLemma?: string
  corpus: 'GNT' | 'LXX'
  bookName: Map<string, string>
  context: number
  ctxMap: Record<string, CtxVerse[]>
  // Parallel-translation column language ('none' = Greek only); owned by SearchPageView's
  // controls bar so the selector sits with Context / Relevance, above the results.
  transLang: string
  onOpen: (h: GreekHit) => void
  embedded?: boolean
}) {
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  const [selKey, setSelKey] = useState<string | null>(null)
  const [, bump] = useState(0)
  // Embedded in the side panel over a page with its own parsing pane (the Reader): feed word
  // parses THERE via the bus and drop the panel's internal dock — one pane, no duplication.
  // Decided once at mount (the host page registers its sink before the panel can open).
  const [useSink] = useState(() => embedded && hasParsingSink())
  const showInfo = (i: LexicalInfoPanel | null) => { if (useSink) emitParsingInfo(i); else setInfo(i) }

  // verseId → tokens (Greek, per corpus) and verseId → translation text (per lang), lazily filled.
  const tokens = useRef<Record<string, Token[]>>({})
  const trans = useRef<Record<string, Record<string, string>>>({})
  const fetchedTok = useRef<Set<string>>(new Set())
  const fetchedTr = useRef<Set<string>>(new Set())
  // Brenton's Septuagint English, cached per book — the fallback for deuterocanonical / LXX-only
  // books (Judith, Sirach, Tobit, Maccabees…) that WEB/BSB (66-book canon) don't include. Keyed
  // `<osisId>.<chapter>.<verse>`, the same key the translation API and these results use.
  const brentonCache = useRef<Record<string, Record<string, string> | null>>({})
  function loadBrenton(osis: string): Promise<Record<string, string> | null> {
    if (osis in brentonCache.current) return Promise.resolve(brentonCache.current[osis])
    return fetch(`/data/brenton/${osis}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: Record<string, string> | null) => (brentonCache.current[osis] = d))
      .catch(() => (brentonCache.current[osis] = null))
  }

  // Folded single-word query terms, to red-highlight the matching Greek token(s).
  const termSet = new Set(terms.map(t => normalizeFold(t.replace(/"/g, ''))).filter(Boolean))

  // Every (book, chapter) shown — the hit verses plus, when context is on, their neighbours.
  const chapters = new Set<string>()
  for (const h of hits) {
    chapters.add(`${h.osisId}.${h.chapter}`)
    if (context > 0) for (const cv of ctxMap[`${h.osisId}.${h.chapter}.${h.verse}`] ?? []) chapters.add(`${h.osisId}.${cv.chapter}`)
  }

  useEffect(() => {
    // Caches live in refs (persist across renders), so late-resolving fetches always store —
    // no per-run "alive" guard (which would drop data when the effect re-runs but the dedupe
    // set skips a re-fetch).
    for (const ck of Array.from(chapters)) {
      const [osis, ch] = ck.split('.')
      const tokKey = `${corpus}.${ck}`
      if (!fetchedTok.current.has(tokKey)) {
        fetchedTok.current.add(tokKey)
        fetch(`/api/reader?book=${osis}&chapter=${ch}&corpus=${corpus}`)
          .then(r => (r.ok ? r.json() : null))
          .then((d: { verses?: { verse: number; words?: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: Record<string, string | null>[] }[] }[] } | null) => {
            if (!d?.verses) return
            for (const v of d.verses) {
              tokens.current[`${osis}.${ch}.${v.verse}`] = (v.words ?? []).map(w => ({
                surface: w.surface, lemma: w.lexeme?.lexeme ?? '', gloss: w.lexeme?.gloss, strongs: w.lexeme?.strongs,
                parsing: w.parses?.[0] ? formatMorph(w.parses[0]) : '',
              }))
            }
            bump(x => x + 1)
          }).catch(() => { fetchedTok.current.delete(tokKey) })
      }
      const trKey = `${transLang}.${ck}`
      if (transLang !== 'none' && !fetchedTr.current.has(trKey)) {
        fetchedTr.current.add(trKey)
        fetch(`/api/translation?book=${osis}&chapter=${ch}&lang=${transLang}`)
          .then(r => (r.ok ? r.json() : { verses: {} }))
          .then((d: { verses?: Record<string, string> }) => {
            const verses = d.verses ?? {}
            // WEB/BSB are the 66-book canon, so deuterocanonical / LXX-only books come back empty.
            // Fall back to Brenton's Septuagint English there so those texts still show a
            // translation (English options only — the foreign translations have no LXX text).
            if (Object.keys(verses).length === 0 && (transLang === 'en' || transLang === 'bsb')) {
              return loadBrenton(osis).then(br => {
                Object.assign((trans.current[transLang] ??= {}), br ?? {})
                bump(x => x + 1)
              })
            }
            Object.assign((trans.current[transLang] ??= {}), verses)
            bump(x => x + 1)
          }).catch(() => { fetchedTr.current.delete(trKey) })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, context, ctxMap, corpus, transLang])

  const showTrans = transLang !== 'none'
  const trMap = showTrans ? trans.current[transLang] ?? {} : {}

  function greekCell(h: GreekHit, cv: CtxVerse, isHit: boolean, rowKey: string): ReactNode {
    const vid = `${h.osisId}.${cv.chapter}.${cv.verse}`
    const toks = tokens.current[vid]
    if (!isHit || !toks || toks.length === 0) {
      // Neighbour verses (or not-yet-loaded) render as plain (grey) text.
      return <span className={isHit ? '' : 'text-gray-400'}>{hilite(cv.text, terms)}</span>
    }
    return toks.map((tok, ti) => {
      const key = `${rowKey}.${ti}`
      const matched = termSet.has(normalizeFold(tok.surface)) || (!!searchLemma && normalizeFold(tok.lemma) === searchLemma)
      const select = () => {
        showInfo({ surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '', parsing: tok.parsing, strongs: tok.strongs, reference: `${bookName.get(h.osisId) ?? h.osisId} ${cv.chapter}:${cv.verse}` })
        setSelKey(key)
      }
      return (
        <span key={ti} onMouseEnter={select} onClick={select}
          className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selKey === key ? 'bg-brand-100' : ''} ${matched ? MARK : ''}`}>
          {tok.surface}{ti < toks.length - 1 ? ' ' : ''}
        </span>
      )
    })
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {hits.map((h, i) => {
          const verses: CtxVerse[] = context > 0 && (ctxMap[`${h.osisId}.${h.chapter}.${h.verse}`]?.length ?? 0) > 0
            ? ctxMap[`${h.osisId}.${h.chapter}.${h.verse}`]
            : [{ chapter: h.chapter, verse: h.verse, text: h.text }]
          return (
            <div key={i} className="py-2.5">
              <button onClick={() => onOpen(h)} className="text-xs font-medium text-brand-600 hover:underline">
                {bookName.get(h.osisId) ?? h.osisId} {h.chapter}:{h.verse}
              </button>
              <div className="mt-1 space-y-1">
                {verses.map(cv => {
                  const isHit = cv.chapter === h.chapter && cv.verse === h.verse
                  const vid = `${h.osisId}.${cv.chapter}.${cv.verse}`
                  const rowKey = `${i}.${cv.chapter}.${cv.verse}`
                  return (
                    <div key={rowKey} className={`grid gap-x-4 gap-y-0.5 ${showTrans ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      <p className={`greek-text leading-relaxed ${isHit ? 'text-gray-900' : 'text-gray-400'}`}>
                        <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{cv.verse}</sup>
                        {greekCell(h, cv, isHit, rowKey)}
                      </p>
                      {showTrans && (
                        <p className={`font-reading leading-relaxed sm:border-l sm:border-gray-100 sm:pl-4 ${isHit ? 'text-gray-700' : 'text-gray-400'}`}>
                          {trMap[vid] ? hilite(trMap[vid], isHit ? terms : []) : <span className="text-gray-300 italic">…</span>}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Parsing pane docked at the bottom — fills on Greek word hover/click, drag to resize.
          Hidden when the host page's pane is serving (useSink) — see parsing-info-bus. */}
      {!useSink && <ParsingDock info={info} />}
    </div>
  )
}
