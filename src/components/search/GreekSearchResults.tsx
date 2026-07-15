'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { findTermRanges, markSlice, normalizeFold } from '@/lib/highlight-terms'

// Two-column parallel view for a Greek search: each hit verse shows the Greek (word-by-word,
// clickable → parsing pane) beside a parallel translation, with one ParsingPanel pinned at the
// bottom. Reuses the reader's per-chapter word data (/api/reader) and translation index
// (/api/translation), fetched lazily per shown chapter. See SearchPageView for the flat list.

const MARK = 'bg-red-100 text-red-700 font-semibold rounded-sm'
const MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
const TRANSLATIONS = [
  { lang: 'en', label: 'English (WEB)' }, { lang: 'bsb', label: 'English (BSB)' },
  { lang: 'es', label: 'Spanish' }, { lang: 'fr', label: 'French' }, { lang: 'pt', label: 'Portuguese' },
  { lang: 'ru', label: 'Russian' }, { lang: 'ko', label: 'Korean' }, { lang: 'zh', label: 'Mandarin' },
]

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

export function GreekSearchResults({ hits, terms, corpus, bookName, context, ctxMap, onOpen }: {
  hits: GreekHit[]
  terms: string[]
  corpus: 'GNT' | 'LXX'
  bookName: Map<string, string>
  context: number
  ctxMap: Record<string, CtxVerse[]>
  onOpen: (h: GreekHit) => void
}) {
  const [transLang, setTransLang] = useState('en')
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  const [selKey, setSelKey] = useState<string | null>(null)
  const [, bump] = useState(0)

  // verseId → tokens (Greek, per corpus) and verseId → translation text (per lang), lazily filled.
  const tokens = useRef<Record<string, Token[]>>({})
  const trans = useRef<Record<string, Record<string, string>>>({})
  const fetchedTok = useRef<Set<string>>(new Set())
  const fetchedTr = useRef<Set<string>>(new Set())

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
      if (!fetchedTr.current.has(trKey)) {
        fetchedTr.current.add(trKey)
        fetch(`/api/translation?book=${osis}&chapter=${ch}&lang=${transLang}`)
          .then(r => (r.ok ? r.json() : { verses: {} }))
          .then((d: { verses?: Record<string, string> }) => {
            Object.assign((trans.current[transLang] ??= {}), d.verses ?? {})
            bump(x => x + 1)
          }).catch(() => { fetchedTr.current.delete(trKey) })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, context, ctxMap, corpus, transLang])

  const trMap = trans.current[transLang] ?? {}

  function greekCell(h: GreekHit, cv: CtxVerse, isHit: boolean, rowKey: string): ReactNode {
    const vid = `${h.osisId}.${cv.chapter}.${cv.verse}`
    const toks = tokens.current[vid]
    if (!isHit || !toks || toks.length === 0) {
      // Neighbour verses (or not-yet-loaded) render as plain (grey) text.
      return <span className={isHit ? '' : 'text-gray-400'}>{hilite(cv.text, terms)}</span>
    }
    return toks.map((tok, ti) => {
      const key = `${rowKey}.${ti}`
      const matched = termSet.has(normalizeFold(tok.surface))
      const select = () => {
        setInfo({ surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '', parsing: tok.parsing, strongs: tok.strongs, reference: `${bookName.get(h.osisId) ?? h.osisId} ${cv.chapter}:${cv.verse}` })
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
      <div className="flex justify-end pb-2">
        <select value={transLang} onChange={e => setTransLang(e.target.value)}
          className="rounded-md border border-gray-200 bg-surface px-2 py-1 text-xs text-gray-600">
          {TRANSLATIONS.map(t => <option key={t.lang} value={t.lang}>{t.label}</option>)}
        </select>
      </div>

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
                    <div key={rowKey} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                      <p className={`greek-text leading-relaxed ${isHit ? 'text-gray-900' : 'text-gray-400'}`}>
                        <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{cv.verse}</sup>
                        {greekCell(h, cv, isHit, rowKey)}
                      </p>
                      <p className={`leading-relaxed sm:border-l sm:border-gray-100 sm:pl-4 ${isHit ? 'text-gray-700' : 'text-gray-400'}`}>
                        {trMap[vid] ? hilite(trMap[vid], isHit ? terms : []) : <span className="text-gray-300 italic">…</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Parsing pane pinned at the bottom of the results — fills on Greek word hover/click. */}
      <div className="sticky bottom-0 pt-3 pb-1 bg-gray-50/95 backdrop-blur">
        <ParsingPanel info={info} bgClass="bg-surface" />
      </div>
    </div>
  )
}
