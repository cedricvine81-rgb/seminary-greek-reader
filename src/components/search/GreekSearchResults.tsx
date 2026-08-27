'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ParsingDock } from './ParsingDock'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { buildHebrewInfo } from '@/components/reader/HebrewWord'
import { loadHebrewLexicon, type HebrewLexicon } from '@/lib/hebrew-lexicon'
import { findTermRanges, markSlice, normalizeFold, SEARCH_MARK } from '@/lib/highlight-terms'
import { emitParsingInfo, hasParsingSink } from '@/lib/parsing-info-bus'
import { openWordSearch } from '@/lib/word-search-bus'
import { TransWords, forwardContextMenuToNearestTransWord } from '@/components/highlights/TransWords'
import { useHighlights } from '@/components/highlights/useHighlights'
import { highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { shouldSnippet, snippetRanges } from '@/lib/snippet'

// Two-column parallel view for a Greek search: each hit verse shows the Greek (word-by-word,
// clickable → parsing pane) beside a parallel translation, with one ParsingPanel pinned at the
// bottom. Reuses the reader's per-chapter word data (/api/reader) and translation index
// (/api/translation), fetched lazily per shown chapter. See SearchPageView for the flat list.

const MARK = SEARCH_MARK
const MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
// `transLang === 'none'` turns the parallel column off (Greek only) — never fetched, never
// rendered as a column. The selector itself lives in SearchPageView's controls bar.

type Token = {
  surface: string; lemma: string; gloss?: string; strongs?: string; parsing: string
  // Hebrew (MT) only: the raw OSHB code, the morpheme breakdown, and the language flag, which
  // buildHebrewInfo turns into a Hebrew parsing panel (lemma, transliteration, BDB, prefixes).
  heb?: { morph: string; morphemes?: { text: string; strongs: string; morph: string }[]; lang?: 'H' | 'A' }
}
// matchedLemmas: normalized lemmas of the word(s) a morphology search matched in this verse,
// so exactly those tokens can be red-highlighted (surface/lemma terms cover the other searches).
// matchedWords: 0-based indices of the words a construct search matched IN THIS VERSE. Present only
// where the search index's tokens line up with the reader's (see readerAligned in construct-query),
// and preferred over matchedLemmas when it is — lemma highlighting marks every occurrence of a
// matched lexeme, so a search on the article lights up every article in the verse.
export type GreekHit = { osisId: string; chapter: number; verse: number; text: string; matchedLemmas?: string[]; matchedWords?: number[] }
type CtxVerse = { chapter: number; verse: number; text: string }

function formatMorph(m?: Record<string, string | null>): string {
  if (!m) return ''
  return MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function hilite(text: string, terms: string[]): ReactNode {
  const ranges = findTermRanges(text, terms)
  return ranges.length ? <>{markSlice(text, ranges, 0, text.length, MARK)}</> : text
}

// A verse long enough that printing all of it buries the match. The New Testament has none — its
// longest is Revelation 20:4 at 58 words — but the Septuagint has 19 over 100, because our source
// collapses the edition's letter sub-verses into the base number: 1Kgs 12:24 carries the whole of
// 12:24a-24z (the alternate Jeroboam narrative) at 1,017 words, and Esther's Additions sit inside
// 4:17, 8:12, 1:1, 3:13 and 10:3. Windowing needs exact matched positions, so it only applies where
// the caller can supply them.
const LONG_VERSE = 60
const CONTEXT_WORDS = 12

export function GreekSearchResults({ hits, terms, searchLemma, corpus, gntBooks, bookName, context, ctxMap, transLang, onOpen, embedded = false, isAuthenticated = false, snippetLongVerses = false }: {
  hits: GreekHit[]
  terms: string[]
  // Folded lemma for an "all forms" search: matched words are inflected forms that don't contain
  // the lemma string, so they're highlighted by their lemma instead of their surface.
  searchLemma?: string
  // NA1904 is Nestle 1904, which is what the parsing trees behind Construct search ARE — so
  // rendering construct hits against it makes the word positions exact by construction.
  corpus: 'GNT' | 'LXX' | 'NA1904' | 'MT' | 'BOTH'
  /** New Testament book ids, so a combined Greek search can tell which half each hit came from. */
  gntBooks?: Set<string>
  bookName: Map<string, string>
  context: number
  ctxMap: Record<string, CtxVerse[]>
  // Parallel-translation column language ('none' = Greek only); owned by SearchPageView's
  // controls bar so the selector sits with Context / Relevance, above the results.
  transLang: string
  onOpen: (h: GreekHit) => void
  embedded?: boolean
  // Enables the highlighter row in the right-click menu; searching works signed out.
  isAuthenticated?: boolean
  // Opt-in: show a window around the match in very long verses instead of the whole thing. Off by
  // default so the morphology and word searches, which share this component, are unaffected.
  snippetLongVerses?: boolean
}) {
  // A search hit is real text, so it gets the same right-click menu as the reader: search
  // the word, and highlight it (the highlight is stored against the verse, so it shows up
  // in the reader too).
  const highlights = useHighlights(isAuthenticated)
  const [info, setInfo] = useState<LexicalInfoPanel | null>(null)
  // Verses the reader has asked to see in full.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selKey, setSelKey] = useState<string | null>(null)
  const [, bump] = useState(0)
  // Embedded in the side panel over a page with its own parsing pane (the Reader): feed word
  // parses THERE via the bus and drop the panel's internal dock — one pane, no duplication.
  // Decided once at mount (the host page registers its sink before the panel can open).
  const [useSink] = useState(() => embedded && hasParsingSink())
  // The Hebrew Strong's lexicon, fetched once when the MT is on screen — it supplies the
  // dictionary form, transliteration and BDB entry the Hebrew parsing panel shows.
  const [hebrewLex, setHebrewLex] = useState<HebrewLexicon | null>(null)
  useEffect(() => {
    if (corpus === 'MT' && !hebrewLex) loadHebrewLexicon().then(setHebrewLex).catch(() => {})
  }, [corpus, hebrewLex])
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

  // A combined Greek search returns hits from both Testaments at once, so the corpus is a
  // property of each hit rather than of the search. Everything downstream — which chapter file
  // to parse against, which reader a word belongs to — has to ask per book, not once.
  const corpusOf = useCallback((osisId: string): 'GNT' | 'LXX' | 'NA1904' | 'MT' =>
    corpus === 'BOTH' ? (gntBooks?.has(osisId) ? 'GNT' : 'LXX') : corpus,
  [corpus, gntBooks])

  useEffect(() => {
    // Caches live in refs (persist across renders), so late-resolving fetches always store —
    // no per-run "alive" guard (which would drop data when the effect re-runs but the dedupe
    // set skips a re-fetch).
    for (const ck of Array.from(chapters)) {
      const [osis, ch] = ck.split('.')
      const hitCorpus = corpusOf(osis)
      const tokKey = `${hitCorpus}.${ck}`
      if (!fetchedTok.current.has(tokKey)) {
        fetchedTok.current.add(tokKey)
        if (hitCorpus === 'MT') {
          // Straight from the MT chapter files, like the Hebrew Reader (GreekReader) does.
          // /api/reader flattens Hebrew into the Greek word shape — Strong's arrives as "G7225"
          // and the OSHB code is dropped — so a Hebrew word looked up as Greek, which is why the
          // pane showed Liddell-Scott for בְּרֵאשִׁית.
          fetch(`/data/mt/${osis}_${ch}.json`)
            .then(r => (r.ok ? r.json() : null))
            .then((d: { verses?: { verse: number; words?: { surface: string; strongs?: string; morph?: string; lang?: 'H' | 'A'; morphemes?: { text: string; strongs: string; morph: string }[] }[] }[] } | null) => {
              if (!d?.verses) return
              for (const v of d.verses) {
                tokens.current[`${osis}.${ch}.${v.verse}`] = (v.words ?? []).map(w => ({
                  surface: w.surface,
                  lemma: '',                        // filled from the lexicon when the pane is built
                  strongs: w.strongs,
                  parsing: '',
                  heb: { morph: w.morph ?? '', morphemes: w.morphemes, lang: w.lang },
                }))
              }
              bump(x => x + 1)
            }).catch(() => { fetchedTok.current.delete(tokKey) })
        } else {
        fetch(`/api/reader?book=${osis}&chapter=${ch}&corpus=${hitCorpus}`)
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
  }, [hits, context, ctxMap, corpus, corpusOf, transLang])

  const showTrans = transLang !== 'none'
  const trMap = showTrans ? trans.current[transLang] ?? {} : {}

  function greekCell(h: GreekHit, cv: CtxVerse, isHit: boolean, rowKey: string): ReactNode {
    const vid = `${h.osisId}.${cv.chapter}.${cv.verse}`
    const toks = tokens.current[vid]
    if (!isHit || !toks || toks.length === 0) {
      // Neighbour verses (or not-yet-loaded) render as plain (grey) text.
      return <span className={isHit ? '' : 'text-gray-400'}>{hilite(cv.text, terms)}</span>
    }
    const hitLemmas = h.matchedLemmas?.length ? new Set(h.matchedLemmas.map(normalizeFold)) : null
    // Exact positions win when the caller could supply them.
    const hitWords = h.matchedWords?.length ? new Set(h.matchedWords) : null
    const positions = h.matchedWords ?? []
    const long = snippetLongVerses && isHit && !expanded[rowKey]
      && shouldSnippet(toks.length, positions, LONG_VERSE, CONTEXT_WORDS)
    const ranges = long
      ? snippetRanges(positions, toks.length, CONTEXT_WORDS)
      : [{ from: 0, to: toks.length }]
    // Char offsets into the verse's canonical text (tokens joined by single spaces), the
    // same basis the reader's highlights use, so a highlight made here lands identically.
    let pos = 0
    const spans = toks.map(t => { const start = pos; pos += t.surface.length + 1; return { start, end: start + t.surface.length } })
    const verseHl = isAuthenticated ? highlights.forVerse(h.osisId, cv.chapter, cv.verse, 'grc') : []
    const body = ranges.flatMap((rg, ri) => [
      ...(ri > 0 || rg.from > 0 ? [<span key={`gap${ri}`} className="text-gray-300">… </span>] : []),
      ...toks.slice(rg.from, rg.to).map((tok, k) => {
      const ti = rg.from + k
      const key = `${rowKey}.${ti}`
      const { start, end } = spans[ti]
      const mark = verseHl.length ? highlightAt(start, end, verseHl) : undefined
      const matched = hitWords
        ? hitWords.has(ti)
        : termSet.has(normalizeFold(tok.surface))
          || (!!searchLemma && normalizeFold(tok.lemma) === searchLemma)
          || (!!hitLemmas && hitLemmas.has(normalizeFold(tok.lemma)))
      const select = () => {
        const reference = `${bookName.get(h.osisId) ?? h.osisId} ${cv.chapter}:${cv.verse}`
        showInfo(tok.heb
          // Hebrew: the same panel the Reader builds — dictionary form, transliteration, the
          // decoded OSHB parse, Strong's + BDB, and the prefix/suffix breakdown for compounds.
          ? buildHebrewInfo(
              { surface: tok.surface, strongs: tok.strongs ?? '', morph: tok.heb.morph, lang: tok.heb.lang, morphemes: tok.heb.morphemes } as never,
              reference,
              hebrewLex,
            )
          : { surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '', parsing: tok.parsing, strongs: tok.strongs, reference })
        setSelKey(key)
      }
      return (
        <span key={ti} onMouseEnter={select} onClick={select}
          onContextMenu={e => {
            e.preventDefault()
            // The word-search panel is Greek-only (its scopes and lexicon are). A Hebrew word
            // would open it pointed at the wrong corpus, so the MT keeps hover-parsing and the
            // parsing pane but no right-click search until that panel learns Hebrew.
            if (corpusOf(h.osisId) === 'MT') return
            const existing = verseHl.find(hh => start < hh.endOffset && end > hh.startOffset)
            openWordSearch({
              x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma || null,
              reference: `${bookName.get(h.osisId) ?? h.osisId} ${cv.chapter}:${cv.verse}`,
              // NA1904 is a display edition, not a search scope — a word looked up from it searches
              // the New Testament.
              kind: 'greek', greekCorpus: corpusOf(h.osisId) === 'LXX' ? 'LXX' : 'GNT', book: h.osisId,
              highlight: isAuthenticated ? {
                activeColor: existing?.color ?? null,
                onPick: c => existing
                  ? void highlights.recolor(existing.id, h.osisId, cv.chapter, c)
                  : void highlights.create(h.osisId, cv.chapter, cv.verse, start, end, c, 'grc'),   // Greek only — the MT returns above
                onRemove: () => { if (existing) void highlights.remove(existing.id, h.osisId, cv.chapter) },
              } : undefined,
            })
          }}
          className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selKey === key ? 'bg-brand-100' : ''} ${matched ? MARK : ''}${mark ? ` ${highlightMarkClass(mark.color)}` : ''}`}>
          {tok.surface}{ti < rg.to - 1 ? ' ' : ''}
        </span>
      )
    })])
    if (!long) return body
    return (
      <>
        {body}
        {ranges[ranges.length - 1].to < toks.length && <span className="text-gray-300"> …</span>}
        <button type="button" onClick={() => setExpanded(e => ({ ...e, [rowKey]: true }))}
          className="ml-2 align-baseline font-sans text-[11px] text-brand-600 hover:underline">
          show all {toks.length} words
        </button>
      </>
    )
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
                      {/* The MT is the one right-to-left corpus here: it needs dir="rtl" and the
                          Hebrew font, or the verse renders reversed in a Greek face. */}
                      <p
                        dir={corpus === 'MT' ? 'rtl' : undefined}
                        lang={corpus === 'MT' ? 'he' : undefined}
                        className={`${corpus === 'MT' ? 'font-hebrew text-[1.15rem]' : 'greek-text'} leading-relaxed ${isHit ? 'text-gray-900' : 'text-gray-400'}`}
                      >
                        <sup className="text-[10px] text-brand-500 mr-0.5 font-sans">{cv.verse}</sup>
                        {greekCell(h, cv, isHit, rowKey)}
                      </p>
                      {showTrans && (
                        <p onContextMenu={forwardContextMenuToNearestTransWord}
                          className={`font-reading leading-relaxed sm:border-l sm:border-gray-100 sm:pl-4 ${isHit ? 'text-gray-700' : 'text-gray-400'}`}>
                          {trMap[vid]
                            ? (<TransWords
                                    text={trMap[vid]} lang={transLang}
                                    terms={isHit ? terms : undefined}
                                    reference={`${bookName.get(h.osisId) ?? h.osisId} ${cv.chapter}:${cv.verse}`}
                                    book={h.osisId}
                                    hl={isAuthenticated ? {
                                      isAuthenticated,
                                      verseHighlights: highlights.forVerse(h.osisId, cv.chapter, cv.verse, transLang),
                                      create: (st, en, c) => void highlights.create(h.osisId, cv.chapter, cv.verse, st, en, c, transLang),
                                      recolor: (id, c) => void highlights.recolor(id, h.osisId, cv.chapter, c),
                                      remove: id => void highlights.remove(id, h.osisId, cv.chapter),
                                    } : undefined} />)
                            : <span className="text-gray-300 italic">…</span>}
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
