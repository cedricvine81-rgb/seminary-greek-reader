'use client'

/* ─────────────────────────────────────────────
   Morphology — shared building blocks

   Everything the chapter files (chapters/*.tsx) and the MorphologyView
   shell have in common: the paradigm-table components, the level context
   behind the Beginning/Intermediate toggle, and the textbook components
   (Term glossary tooltips, Practice exercises, LiveExamples corpus links).
───────────────────────────────────────────── */

import { useState, useEffect, useContext, useMemo, useRef, createContext } from 'react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatNumber } from '@/lib/i18n/format'
import Link from 'next/link'
import clsx from 'clsx'
import { GLOSSARY } from './glossary'
import { NO_CONTENT, content, fingerprint, type ContentCatalogue } from '@/lib/i18n/content'
import { serialize, parse, type MarkupComponents } from '@/lib/i18n/morph-markup'
import { K } from '@/lib/i18n/morph-fields'
import { openTranslationWorkbench, type WorkbenchSentence } from '@/lib/translation-workbench-bus'
import { HomeworkSetPreviewLink } from '@/components/instructor/HomeworkSetPreview'
import { openMasterSearch } from '@/lib/master-search-bus'
import { encodeConstruct, type ConstructQuery } from '@/lib/construct-query'
import { transliterate } from '@/lib/hebrew-xlit'
import { formatHebrewParse, hebrewMorphRole } from '@/lib/hebrew-morph'

export type MorphLevel = 'beginning' | 'intermediate'

/** Current Beginning/Intermediate level, provided by MorphologyView. */
export const LevelContext = createContext<MorphLevel>('beginning')

/* ─── Transliteration toggle (Hebrew grammar) ──────────────────────────────
   Beginners cannot yet read pointed Hebrew at speed, and every standard
   first-year grammar prints a transliteration beside its examples for the
   opening chapters. Ours is switchable: on, each Hebrew example carries its
   pronunciation in grey; off, the page is Hebrew only — which is where a
   student needs to arrive. Provided by HebrewGrammarView, remembered per
   device. */
export const XlitContext = createContext(false)
export const XLIT_STORAGE_KEY = 'hebrewGrammar.xlit'

/* ─── Paradigm tables ───────────────────────── */

interface MorphTableProps {
  /** Makes the table's prose translatable; keys derive from K in morph-fields.ts. */
  id?: string
  /** Column indexes whose cells are prose, not Greek or paradigm slots. */
  tCols?: number[]
  /** Column indexes rendered as HEBREW: the Hebrew webfont, right-to-left, sized so the
   *  pointing stays legible. The red-ending `stem|ending` marker works in these cells too,
   *  provided the split falls on a whole-letter boundary (a letter plus its own points) —
   *  mid-letter splits detach combining marks. */
  hCols?: number[]
  title?: React.ReactNode
  headers: string[]
  rows: (string | null | undefined)[][]
  dividerRows?: number[]
  note?: string
  firstColIsData?: boolean
  highlight?: string
  highlightCols?: number[]
  /** Drop the default bottom margin (used when the table sits inside a TableAside row). */
  flush?: boolean
  /** Alternate row tint — for long vocabulary lists, keeps the eye on the row. */
  striped?: boolean
}

/**
 * Render a table cell, colouring the morphology (textbook style):
 * - "stem|ending" (invisible marker) renders the ending red; "|word" makes the whole
 *   word red (used for the article);
 * - "stem|identifier|ending" additionally renders the tense identifier blue —
 *   the Eight Minimums distinction between the identifier and the personal ending;
 * - a token beginning with a dash (an endings-table cell like "‒ος") goes red,
 *   unless it IS a tense identifier (‒σ, ‒σα, ‒θη, ‒κα …), which goes blue.
 */
const TENSE_IDENTIFIERS = new Set(['σ', 'σα', 'θη', 'θε', 'θ', 'θησ', 'κα', 'κ'])

/**
 * Hebrew prefix marker: "נִ»קְטַל" renders נִ red — the pattern identifier at the FRONT of
 * the word, where Hebrew puts it (Niphal's נ, Hiphil's ה, the imperfect's יתאנ, the
 * participle's מ). The Greek convention marks endings, so its markers sit at the END of a
 * token; Hebrew needs both ends. Splits must fall on base letters (never before a combining
 * vowel point), or Safari breaks the shaping — so a prefix segment carries its vowel with it.
 */
function renderHebrewAffixes(tok: string, key: number): React.ReactNode {
  // '~' toggles a red span anywhere in the word — for differences that are neither a prefix
  // nor an ending (the construct state changes vowels INSIDE the word). Pairs of '~' wrap
  // the changed part; the marker never falls before a combining mark, so shaping is safe.
  if (tok.includes('~')) {
    const bits = tok.split('~')
    return (
      <span key={key}>
        {bits.map((b, i) => (i % 2 === 1
          ? <span key={i} className="text-red-600">{b}</span>
          : <span key={i}>{b}</span>))}
      </span>
    )
  }
  const parts = tok.split('»')
  const pfx = parts.length > 1 ? parts[0] : null
  let rest = parts.length > 1 ? parts.slice(1).join('') : tok
  let end: string | null = null
  if (rest.includes('|')) {
    const bits = rest.split('|')
    rest = bits[0]
    end = bits.slice(1).join('')
  }
  return (
    <span key={key}>
      {pfx && <span className="text-red-600">{pfx}</span>}
      {rest}
      {end && <span className="text-red-600">{end}</span>}
    </span>
  )
}

const HEBREW_RE = /[\u0590-\u05FF]/

function renderCell(cell: string): React.ReactNode {
  if (!cell.includes('|') && !cell.includes('»') && !cell.includes('~') && !/(^|\s)[‒–-]\S/.test(cell)) return cell
  // Hebrew tokens use the affix renderer (both ends, one colour); Greek keeps its
  // blue-identifier / red-ending scheme below.
  if (HEBREW_RE.test(cell)) {
    const parts = cell.split(/(\s+)/)
    return <>{parts.map((tok, i) => (/^\s*$/.test(tok) ? tok
      : (tok.includes('»') || tok.includes('|') || tok.includes('~')) ? renderHebrewAffixes(tok, i) : tok))}</>
  }
  const parts = cell.split(/(\s+)/)
  return (
    <>
      {parts.map((tok, i) => {
        if (/^\s*$/.test(tok)) return tok
        if (tok.includes('|')) {
          const bits = tok.split('|')
          if (bits.length >= 3) {
            const [stem, ident, ...rest] = bits
            return (
              <span key={i}>
                {stem}
                <span className="text-blue-600 font-medium">{ident}</span>
                <span className="text-red-600 font-medium">{rest.join('')}</span>
              </span>
            )
          }
          const [stem, end] = bits
          return <span key={i}>{stem}<span className="text-red-600 font-medium">{end}</span></span>
        }
        if (/^[‒–-]\S/.test(tok)) {
          const letters = tok.replace(/[^Ͱ-Ͽἀ-῿]/g, '')
          const cls = TENSE_IDENTIFIERS.has(letters) ? 'text-blue-600 font-medium' : 'text-red-600 font-medium'
          return <span key={i} className={cls}>{tok}</span>
        }
        return tok
      })}
    </>
  )
}

/* ─── Real biblical examples (Hebrew grammar) ──────────────────────────────
   Generated by scripts/build-hebrew-grammar-examples.py: for each chapter, verses
   that use the form being taught and stay inside beginning vocabulary. Rendered
   with the taught word marked, the reference linking into the Reader, and the
   transliteration following the page toggle. */
interface GrammarExample {
  ref: string; osis: string; chapter: number; verse: number
  he: string; en: string
  target: { surface: string; morph: string; position: number }
}
interface GrammarVocab { lemma: string; gloss: string; freq: number; pos: string; strongs: string }
interface GrammarDrill {
  surface: string; morph: string; strongs: string; kind: 'parse' | 'segment'
  segments?: { text: string; morph: string }[]
  ref: string; osis: string; chapter: number; verse: number
}
interface GrammarReading { ref: string; osis: string; chapter: number; verse: number; he: string; en: string }
interface GrammarChapterData {
  examples: GrammarExample[]; vocab: GrammarVocab[]; drills: GrammarDrill[]
  reading?: GrammarReading[]
}
type GrammarData = Record<string, GrammarChapterData>
let _exCache: GrammarData | null = null
let _exLoading: Promise<GrammarData> | null = null
function loadExamples(): Promise<GrammarData> {
  if (_exCache) return Promise.resolve(_exCache)
  if (!_exLoading) _exLoading = fetch('/data/grammar-examples-hebrew.json')
    .then(r => r.json()).then(d => (_exCache = d)).catch(() => ({} as GrammarData))
  return _exLoading
}

/** Chapter order — what "earlier chapters" means for the cumulative review box. */
const HB_CHAPTER_SEQUENCE = [
  'alphabet', 'vowels', 'article', 'prepositions', 'nouns', 'construct', 'adjectives',
  'pronouns', 'suffixes', 'numbers', 'verb-system', 'qal-perfect', 'qal-imperfect',
  'waw-consecutive', 'volitives', 'infinitives', 'participles', 'niphal', 'piel-pual',
  'hiphil-hophal', 'hithpael', 'weak-verbs', 'syntax',
]
const HB_CHAPTER_TITLE: Record<string, string> = {
  article: 'the article', prepositions: 'prepositions', nouns: 'nouns', construct: 'the construct state',
  adjectives: 'adjectives', pronouns: 'pronouns', suffixes: 'suffixes', numbers: 'numbers',
  'verb-system': 'the verb system', 'qal-perfect': 'the Qal perfect', 'qal-imperfect': 'the Qal imperfect',
  'waw-consecutive': 'the waw-consecutive', volitives: 'volitives', infinitives: 'infinitives',
  participles: 'participles', niphal: 'the Niphal', 'piel-pual': 'the Piel', 'hiphil-hophal': 'the Hiphil',
  hithpael: 'the Hithpael', syntax: 'syntax',
}

/** The chapter's real-text examples. `n` caps how many are shown (default all). */
export function HbExamples({ id, n, title }: { id: string; n?: number; title?: string }) {
  const t = useT()
  const [all, setAll] = useState<GrammarExample[] | null>(null)
  const xlit = useContext(XlitContext)
  useEffect(() => { loadExamples().then(d => setAll(d[id]?.examples ?? [])) }, [id])
  if (!all || all.length === 0) return null
  const items = n ? all.slice(0, n) : all
  return (
    <div className="mb-5 rounded-lg border border-brand-200 bg-brand-50/40 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
        {title ?? 'In the Hebrew Bible'}
      </p>
      <ul className="space-y-2.5">
        {items.map(ex => {
          const words = ex.he.split(/\s+/)
          return (
            <li key={ex.ref}>
              <p lang="he" dir="rtl" className="font-hebrew text-[22px] leading-loose text-gray-900">
                {words.map((w, i) => (
                  <span key={i} className={i === ex.target.position ? 'rounded bg-amber-200/70 px-0.5 font-semibold' : ''}>
                    {w}{i < words.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </p>
              {xlit && <p dir="ltr" className="text-[12px] italic leading-tight text-gray-500">{transliterate(ex.he)}</p>}
              <p className="text-[14px] leading-snug text-gray-700">
                {ex.en}{' '}
                <Link
                  href={`/reader?book=${ex.osis}&chapter=${ex.chapter}&verse=${ex.verse}&corpus=MT`}
                  className="whitespace-nowrap text-[12px] font-medium text-brand-700 hover:underline"
                >{ex.ref}</Link>
              </p>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-[11px] italic text-gray-400">
        {t('morph.hb.exampleNote')}
      </p>
    </div>
  )
}

/** The chapter's vocabulary: every deck word that appears in its examples, commonest first.
 *  Standard grammars end each chapter with a list to memorise; this one is not invented —
 *  it is exactly the words needed to read the examples above without a lexicon. */
export function HbVocab({ id }: { id: string }) {
  const t = useT()
  const locale = useLocale()
  const [rows, setRows] = useState<GrammarVocab[] | null>(null)
  const xlit = useContext(XlitContext)
  useEffect(() => { loadExamples().then(d => setRows(d[id]?.vocab ?? [])) }, [id])
  if (!rows || rows.length === 0) return null
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-surface px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
        {t('morph.hb.chapterVocab')}
      </p>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {rows.map(v => (
          <li key={v.strongs} className="flex items-baseline gap-2 text-[14px]">
            <span lang="he" dir="rtl" className="font-hebrew text-[20px] text-gray-900">{v.lemma}</span>
            {xlit && <span className="text-[11px] italic text-gray-400">{transliterate(v.lemma)}</span>}
            <span className="min-w-0 flex-1 truncate text-gray-700">{v.gloss}</span>
            <span className="shrink-0 font-mono text-[11px] text-gray-400">{formatNumber(v.freq, locale)}×</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] italic text-gray-400">
        {t('morph.hb.freqNote')}
      </p>
    </div>
  )
}

/** Parse drills on real forms. `from` overrides the chapter (the cumulative review uses it
 *  to pull earlier chapters' forms). */
export function HbDrills({ id, n = 10, title, intro }: {
  id: string; n?: number; title?: string; intro?: React.ReactNode
}) {
  const t = useT()
  const [rows, setRows] = useState<GrammarDrill[] | null>(null)
  useEffect(() => { loadExamples().then(d => setRows(d[id]?.drills ?? [])) }, [id])
  if (!rows || rows.length === 0) return null
  return <DrillList items={rows.slice(0, n)} title={title ?? t('morph.hb.parseThese')} intro={intro} />
}

/** Forms from EARLIER chapters, so a chapter keeps the previous ones alive. */
export function HbReview({ id, n = 5 }: { id: string; n?: number }) {
  const t = useT()
  const [items, setItems] = useState<{ drill: GrammarDrill; from: string }[] | null>(null)
  useEffect(() => {
    loadExamples().then(d => {
      const idx = HB_CHAPTER_SEQUENCE.indexOf(id)
      if (idx <= 0) { setItems([]); return }
      const earlier = HB_CHAPTER_SEQUENCE.slice(0, idx).filter(c => (d[c]?.drills?.length ?? 0) > 0)
      // Walk backwards through the earlier chapters, one form from each, so the review
      // spreads over the course rather than hammering the chapter just gone.
      const out: { drill: GrammarDrill; from: string }[] = []
      for (let i = earlier.length - 1; i >= 0 && out.length < n; i--) {
        const c = earlier[i]
        const pool = d[c].drills
        out.push({ drill: pool[out.length % pool.length], from: c })
      }
      setItems(out)
    })
  }, [id, n])
  if (!items || items.length === 0) return null
  return (
    <DrillList
      title={t('morph.hb.stillRemember')}
      intro={<>{t('morph.hb.stillRememberIntro')}</>}
      items={items.map(x => x.drill)}
      froms={items.map(x => x.from)}
      tone="amber"
    />
  )
}

/** Shared renderer for a list of drill items. */
function DrillList({ items, title, intro, froms, tone = 'gray' }: {
  items: GrammarDrill[]; title: string; intro?: React.ReactNode
  froms?: string[]; tone?: 'gray' | 'amber'
}) {
  const t = useT()
  const xlit = useContext(XlitContext)
  const box = tone === 'amber'
    ? 'border-amber-200 bg-amber-50/50'
    : 'border-gray-200 bg-gray-50'
  return (
    <div className={`my-5 max-w-3xl rounded-xl border px-4 py-3.5 ${box}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {intro && <div className="mb-3 text-sm text-gray-600">{intro}</div>}
      <ol className="list-inside list-decimal space-y-3">
        {items.map((d, i) => (
          <li key={`${d.surface}-${i}`} className="text-sm text-gray-800">
            <span lang="he" dir="rtl" className="font-hebrew text-[22px] align-middle">{d.surface}</span>
            {xlit && <span className="ms-2 text-[12px] italic text-gray-500">{transliterate(d.surface)}</span>}
            <details className="ml-5 mt-0.5">
              <summary className="cursor-pointer select-none list-none text-xs font-medium text-brand-600 hover:text-brand-700 [&::-webkit-details-marker]:hidden">
                {t('morph.showAnswer')}
              </summary>
              <div className="mt-1 border-l-2 border-brand-200 pl-3 text-sm text-gray-700">
                {d.kind === 'segment' && d.segments
                  ? <span>{d.segments.map((sg, j) => (
                      <span key={j}>
                        {j > 0 && <span className="text-gray-300"> + </span>}
                        <span lang="he" dir="rtl" className="font-hebrew text-[18px]">{sg.text}</span>
                        <span className="text-xs text-gray-500"> {hebrewMorphRole(sg.morph)}</span>
                      </span>
                    ))}</span>
                  : <span>{formatHebrewParse(d.morph)}</span>}
                {froms?.[i] && (
                  <span className="ms-1 text-xs text-gray-400">
                    — {HB_CHAPTER_TITLE[froms[i]] ?? froms[i]}
                  </span>
                )}
                <Link
                  href={`/reader?book=${d.osis}&chapter=${d.chapter}&verse=${d.verse}&corpus=MT`}
                  className="ms-2 whitespace-nowrap text-[12px] font-medium text-brand-700 hover:underline"
                >{d.ref}</Link>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Reading practice for the Alphabet chapter: familiar verses to sound out, with the
 *  transliteration hidden behind its own button so the exercise is genuine — you decode
 *  first, then check. Independent of the page-wide toggle, because here the whole point is
 *  to look away from the answer. */
export function HbReading({ id = 'alphabet' }: { id?: string }) {
  const t = useT()
  const [rows, setRows] = useState<GrammarReading[] | null>(null)
  const [show, setShow] = useState(false)
  const [showEn, setShowEn] = useState(false)
  useEffect(() => { loadExamples().then(d => setRows(d[id]?.reading ?? [])) }, [id])
  if (!rows || rows.length === 0) return null
  const btn = 'rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors'
  return (
    <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3.5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Reading practice
        </p>
        <div className="ms-auto flex gap-2">
          <button
            type="button" onClick={() => setShow(v => !v)} aria-pressed={show}
            className={`${btn} ${show ? 'border-brand-500 bg-brand-100 text-brand-800' : 'border-gray-300 bg-surface text-gray-600 hover:text-gray-900'}`}
          >{show ? 'Hide transliteration' : 'Show transliteration'}</button>
          <button
            type="button" onClick={() => setShowEn(v => !v)} aria-pressed={showEn}
            className={`${btn} ${showEn ? 'border-brand-500 bg-brand-100 text-brand-800' : 'border-gray-300 bg-surface text-gray-600 hover:text-gray-900'}`}
          >{showEn ? t('morph.hb.hideEnglish') : t('morph.hb.showEnglish')}</button>
        </div>
      </div>
      <p className="mb-3 text-sm text-gray-600">
        {t('morph.hb.readAloud')}
      </p>
      <ol className="space-y-3">
        {rows.map(r => (
          <li key={r.ref} className="border-b border-brand-100 pb-2.5 last:border-0">
            <p lang="he" dir="rtl" className="font-hebrew text-[26px] leading-loose text-gray-900">{r.he}</p>
            {show && (
              <p dir="ltr" className="text-[13px] italic leading-snug text-gray-500">{transliterate(r.he)}</p>
            )}
            <p className="mt-0.5 text-[13px] leading-snug text-gray-600">
              {showEn && <span>{r.en} </span>}
              <Link
                href={`/reader?book=${r.osis}&chapter=${r.chapter}&verse=${r.verse}&corpus=MT`}
                className="whitespace-nowrap text-[12px] font-medium text-brand-700 hover:underline"
              >{r.ref}</Link>
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Grey transliteration under a Hebrew table cell, when the toggle is on. Strips the
 *  affix markers (»,|) so the pronunciation reads as one word. */
function XlitLine({ text }: { text: string }) {
  const xlit = useContext(XlitContext)
  if (!xlit) return null
  const clean = text.replace(/[»|~]/g, '')
  if (!/[א-ת]/.test(clean)) return null
  // Ending/prefix-only cells ("־ָה", "יִ־") are fragments, not words: transliterating them
  // yields noise like "-h". Needs at least two letters and no leading maqqef.
  if (/^[־-]/.test(clean.trim()) || (clean.match(/[א-ת]/g) ?? []).length < 2) return null
  return <span dir="ltr" className="mt-0.5 block font-sans text-[11px] italic leading-tight text-gray-500">{transliterate(clean)}</span>
}

export function MorphTable({ id, tCols, hCols, title, headers, rows, dividerRows = [], note, firstColIsData = false, highlight, highlightCols, flush = false, striped = false }: MorphTableProps) {
  const divSet = new Set(dividerRows)
  const tm = useTm()
  if (id) {
    // A translated title may contain Greek (the paradigm it names), so it goes through gt().
    if (typeof title === 'string') title = gt(tm(K.title(id), title))
    if (note) note = tm(K.note(id), note)
    headers = headers.map((h, i) => (h ? tm(K.header(id, i), h) : h))
    if (tCols?.length) {
      rows = rows.map((row, r) => row.map((cell, c) =>
        (tCols.includes(c) && cell) ? tm(K.cell(id, r, c), cell) : cell))
    }
  }
  return (
    <div className={flush ? '' : 'mb-5'}>
      {title && (
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1.5">
          {title}
        </p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
        <table className="text-[15px] border-collapse">
          <thead>
            <tr className="bg-brand-100 border-b border-brand-200">
              {headers.map((h, i) => (
                <th key={i} className={clsx('px-3 py-2 font-semibold text-brand-900 text-[15px] whitespace-nowrap', i === 0 ? 'text-left' : 'text-center')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isDivider = divSet.has(ri)
              return (
                <tr key={ri} className={clsx(isDivider ? 'bg-brand-50/60 border-t border-gray-200' : striped && ri % 2 === 1 ? 'bg-gray-50/80' : 'bg-surface', !isDivider && ri > 0 && 'border-t border-gray-100')}>
                  {row.map((cell, ci) => (
                    <td key={ci} dir={!isDivider && hCols?.includes(ci) ? 'rtl' : undefined} className={clsx('px-3 py-2', !isDivider && hCols?.includes(ci) && 'font-hebrew text-[22px] leading-relaxed', isDivider ? 'text-xs font-semibold text-brand-700 uppercase tracking-wide' : (ci === 0 && !firstColIsData) ? 'text-left text-[15px] font-medium text-gray-500 whitespace-nowrap' : (firstColIsData && ci > 0) ? ['text-left text-[15px]', (highlight && (!highlightCols || highlightCols.includes(ci))) ? highlight : 'text-gray-900'] : ['text-center text-[15px]', (highlight && (!highlightCols || highlightCols.includes(ci))) ? highlight : 'text-gray-900'])}>
                      {cell ? renderCell(cell) : ''}
                      {!isDivider && hCols?.includes(ci) && cell && <XlitLine text={cell} />}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

export function InfoBox({ id, title, children }: { id?: string; title?: React.ReactNode; children: React.ReactNode }) {
  const tm = useTm()
  // `id` opts the box into translation, like P and MorphTable. The "In plain English" boxes are
  // the most useful prose in the Hebrew chapters for a reader without a second language, so they
  // must be translatable rather than stranded in English.
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] leading-relaxed text-gray-700">
      {title && <p className="font-semibold text-gray-800 mb-1.5">{typeof title === 'string' && id ? tm(K.title(id), title) : title}</p>}
      {id ? <Tr id={id} paragraphs>{children}</Tr> : children}
    </div>
  )
}

/**
 * A simple left-aligned multi-column table for parallel lists (e.g. adverbs by
 * How/When/Where, semantic labels). Unlike MorphTable, every cell is plain
 * left-aligned data and cells may be React nodes (for sub-headings).
 */
export function ColsTable({ id, tCols, title, headers, rows, note }: {
  /** Makes the table's prose translatable; keys derive from K in morph-fields.ts. */
  id?: string
  /** Column indexes whose cells are prose, not Greek or paradigm slots. */
  tCols?: number[]
  title?: React.ReactNode
  headers: string[]
  rows: React.ReactNode[][]
  note?: string
}) {
  const tm = useTm()
  if (id) {
    if (typeof title === 'string') title = gt(tm(K.title(id), title))
    if (note) note = tm(K.note(id), note)
    headers = headers.map((h, i) => (h ? tm(K.header(id, i), h) : h))
    if (tCols?.length) {
      rows = rows.map((row, r) => row.map((cell, c) =>
        (tCols.includes(c) && typeof cell === 'string' && cell) ? tm(K.cell(id, r, c), cell) : cell))
    }
  }
  return (
    <div className="mb-5">
      {title && (
        <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1.5">{title}</p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
        <table className="text-[15px] border-collapse">
          <thead>
            <tr className="bg-brand-100 border-b border-brand-200">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold text-brand-900 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={clsx('bg-surface align-top', ri > 0 && 'border-t border-gray-100')}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-left text-gray-900">{cell ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

/**
 * Wrap runs of Greek characters in a normal-case span so the section-title
 * CSS `uppercase` transform does not capitalise Greek text.
 * Covers Basic Greek (U+0370–U+03FF) and Greek Extended (U+1F00–U+1FFF).
 */
export function gt(text: string): React.ReactNode {
  const re = /[Ͱ-Ͽἀ-῿]+/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<span key={m.index} className="normal-case">{m[0]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length <= 1 && typeof parts[0] === 'string' ? parts[0] ?? text : <>{parts}</>
}

/* ─── Table + aside layout ──────────────────── */

/**
 * Paradigm tables are only as wide as their content, leaving space to the
 * right. TableAside fills that space with a level-aware explanation/example
 * panel: it reads the current Beginning/Intermediate level from context and
 * shows the matching aside. On mobile the aside stacks under the table.
 */
export function TableAside({ beginning, intermediate, children, sticky = false }: {
  beginning?: React.ReactNode
  intermediate?: React.ReactNode
  children: React.ReactNode
  /** Keep the aside pinned in view while a long table scrolls past it. */
  sticky?: boolean
}) {
  const level = useContext(LevelContext)
  const aside = level === 'beginning' ? beginning : intermediate
  return (
    <div className="mb-5 flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-6">
      <div className="w-fit max-w-full lg:shrink-0">{children}</div>
      {aside && (
        <aside className={clsx(
          'lg:flex-1 min-w-0 lg:pl-6 lg:border-l lg:border-gray-100 space-y-2 text-sm leading-relaxed text-gray-600',
          sticky && 'lg:sticky lg:top-2 lg:self-start'
        )}>
          {aside}
        </aside>
      )}
    </div>
  )
}

/** Greek run in an aside (asides are not uppercased, but this keeps intent explicit). */
export function Gk({ children }: { children: React.ReactNode }) {
  return <span className="normal-case font-medium text-gray-800">{children}</span>
}

// Declares what this component IS to the translation serializer. A string literal, so the
// production minifier preserves it where it renames the function itself.
Gk.i18nRole = 'greek' as const

/** Hebrew run in prose — the Hebrew webfont, right-to-left, sized for legible pointing.
 *  No i18nRole on purpose: the translation serializer does not know this component, so a
 *  translatable block containing Hebrew falls back to its English children — the standard
 *  never-mislead rule — until the serializer is taught Hebrew. */
export function Hb({ children }: { children: React.ReactNode }) {
  const xlit = useContext(XlitContext)
  const heb = <span lang="he" dir="rtl" className="font-hebrew text-[1.35em] normal-case font-medium text-gray-800">{children}</span>
  if (!xlit) return heb
  const t = transliterateNode(children)
  return t
    ? <span className="whitespace-nowrap">{heb}<span className="ms-1 text-[0.82em] italic text-gray-500">{t}</span></span>
    : heb
}

/** Pull the plain text out of a node so it can be transliterated (children are
 *  usually a bare string; a fragment of strings also works). */
function transliterateNode(node: React.ReactNode): string {
  const text = typeof node === 'string' ? node
    : Array.isArray(node) ? node.filter(n => typeof n === 'string').join('')
    : ''
  return /[א-ת]/.test(text) ? transliterate(text) : ''
}

// Same role as Gk: the serializer writes it as {…}, so Hebrew inside a translated paragraph is
// carried through the translation untouched and checked to come back intact. Without this, every
// Hebrew-bearing paragraph — which is nearly all of them — was "not representable" and stayed
// English no matter what the translator did.
Hb.i18nRole = 'greek' as const

/** An example line: Hebrew → English. */
export function HbEx({ he, en }: { he: React.ReactNode; en: React.ReactNode }) {
  const xlit = useContext(XlitContext)
  const t = xlit ? transliterateNode(he) : ''
  return (
    <p className="text-[15px] leading-relaxed mb-2">
      <span lang="he" dir="rtl" className="font-hebrew text-[22px] text-gray-800">{he}</span>
      {t && <span className="ms-2 text-[13px] italic text-gray-500">{t}</span>}
      <span className="mx-1.5 text-gray-400">→</span>
      <span className="text-gray-600">{en}</span>
    </p>
  )
}

/** An example line in an aside: Greek → English. */
export function Ex({ grc, en }: { grc: React.ReactNode; en: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="normal-case text-gray-800">{grc}</span>
      <span className="mx-1.5 text-gray-400">→</span>
      <span className="text-gray-600">{en}</span>
    </p>
  )
}

/** A small bold sub-label inside an aside (e.g. "Default translations"). */
export function AsideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</p>
}

/* ─── Translation ───────────────────────────── */

/**
 * The chapter's translated prose, or the empty catalogue. Provided by MorphologyView from a
 * catalogue the server picked for the reader's language, exactly as the other surfaces do — so
 * an English reader is given NO_CONTENT and every lookup below reduces to its own children.
 */
const MorphContent = createContext<ContentCatalogue>(NO_CONTENT)
export const MorphContentProvider = MorphContent.Provider

/**
 * Marks a run of chapter prose as translatable, under a STABLE hand-written id.
 *
 * Ids are written into the chapter source rather than derived from position, for the reason the
 * rest of this codebase keys by identity: paragraphs get inserted, reordered and split as the
 * teaching is revised, and an index-keyed catalogue would silently reattach every translation to
 * the wrong paragraph the first time that happened.
 *
 * If the English has been edited since it was translated, the fingerprint no longer matches and
 * the reader gets the English — the same fall-back-never-mislead rule as every other surface.
 */
/**
 * Look up a translated STRING PROP — a table header, a drill option, a sentence gloss.
 *
 * The companion to `Tr`, which can only reach JSX children. Keys always come from `K` in
 * morph-fields.ts, never hand-built, so the build script and this lookup cannot drift.
 */
export function useTm(): (key: string, english: string) => string {
  const cat = useContext(MorphContent)
  return useMemo(() => (key: string, english: string) => content(cat, key, english), [cat])
}

export function Tr({ id, comps, paragraphs, children }: {
  id: string
  /** Rebuild <p> elements from the ¶ markers — for blocks whose English is several paragraphs. */
  paragraphs?: boolean
  /** Which components a translated {…} / [k:x] renders as. Defaults to this module's own —
   *  the Getting Started notes override it so their Greek keeps its own styling. */
  comps?: MarkupComponents
  children: React.ReactNode
}) {
  const cat = useContext(MorphContent)
  const entry = cat[id]
  // `data-ann-block` makes this run annotatable (see components/annotations). It goes HERE,
  // on the translated run itself, and not on the <p> or <h3> around it: the anchored
  // element's text has to be exactly the prose the offsets were measured against, and a
  // SectionHeading's <h3> also contains its number badge.
  //
  // Inline by default — <Tr> is used mid-sentence — but a block whose children are whole
  // paragraphs needs a <div>, since a <span> may not contain a <p>.
  const Anchor = paragraphs ? 'div' : 'span'
  if (!entry) return <Anchor data-ann-block={id}>{children}</Anchor>
  const english = serialize(children)
  if (english === null || entry.fp !== fingerprint(english)) return <Anchor data-ann-block={id}>{children}</Anchor>
  // {…} is "original language". Which one is decided by the characters inside it, so one
  // marker serves both grammars and a chapter needs no extra wiring.
  const Original = (p: { children: React.ReactNode }) =>
    typeof p.children === 'string' && /[\u0590-\u05FF]/.test(p.children)
      ? <Hb>{p.children}</Hb>
      : <Gk>{p.children}</Gk>
  const nodes = parse(entry.text, comps ?? { Gk: Original, Term })
  if (!paragraphs) return <Anchor data-ann-block={id}>{nodes}</Anchor>
  // Split the parsed nodes on the ¶ marker back into <p> elements. Only blocks that are
  // paragraph-shaped ask for this — <P> itself is already a <p>, and nesting is invalid.
  const groups: React.ReactNode[][] = [[]]
  for (const n of nodes) {
    if (typeof n === 'string' && n.includes('¶')) {
      const bits = n.split('¶')
      bits.forEach((b, i) => {
        if (b) groups[groups.length - 1].push(b)
        if (i < bits.length - 1) groups.push([])
      })
    } else groups[groups.length - 1].push(n)
  }
  return <Anchor data-ann-block={id}>{groups.filter(g => g.length).map((g, i) => <p key={i} className="mb-1 last:mb-0">{g}</p>)}</Anchor>
}

/* ─── Textbook components ───────────────────── */

/** A paragraph of chapter prose, width-capped for comfortable reading.
 *  `id` makes the paragraph translatable; without one it stays English in every language. */
export function P({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p className="text-base leading-relaxed text-gray-700 max-w-3xl mb-3">
      {id ? <Tr id={id}>{children}</Tr> : children}
    </p>
  )
}

/** Numbered section heading inside a chapter. */
export function SectionHeading({ n, id, children }: { n?: number; id?: string; children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
      {n != null && (
        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          {n}
        </span>
      )}
      {id ? <Tr id={id}>{children}</Tr> : children}
    </h3>
  )
}

/** Render children only at one level (e.g. the English-grammar primer only for Beginning). */
export function LevelOnly({ level, children }: { level: MorphLevel; children: React.ReactNode }) {
  const cur = useContext(LevelContext)
  return cur === level ? <>{children}</> : null
}

/**
 * A glossary term. Renders with a dotted underline; tapping it opens a small
 * plain-English definition. `t` must match a GLOSSARY key; the visible text
 * defaults to the key but can be overridden with children (e.g. plural form).
 */
export function Term({ t, children }: { t: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const def = GLOSSARY[t.toLowerCase()]
  if (!def) return <>{children ?? t}</>
  return (
    <span className="relative inline-block">
      <button
        type="button"
        // A drag that crosses this term is a highlight, not a tap on the glossary: opening the
        // definition would cover the words being selected. Only an actual click (nothing
        // selected) opens it.
        onClick={() => { if (window.getSelection()?.isCollapsed !== false) setOpen(o => !o) }}
        onBlur={() => setOpen(false)}
        // select-text because a <button> is not selectable by default (WebKit in particular),
        // so without it a drag across a glossary term breaks the selection in half — which is
        // most sentences in these chapters.
        className="select-text underline decoration-dotted decoration-brand-400 underline-offset-2 cursor-help text-inherit"
      >
        {children ?? t}
      </button>
      {open && (
        <span className="absolute left-0 top-full mt-1 z-40 block w-64 max-w-[78vw] rounded-lg border border-gray-200 bg-popover px-3 py-2 text-xs leading-relaxed text-gray-700 shadow-lg normal-case font-normal text-left">
          <span className="font-semibold text-gray-900">{def.title}</span> — {def.def}
        </span>
      )}
    </span>
  )
}

Term.i18nRole = 'term' as const

/** An exercise block with tap-to-reveal answers.
 *  Practice blocks are drill material from the Beginning course, so by default
 *  they render only at the Beginning level — the Intermediate view keeps just
 *  the tables and the intermediate notes. Pass level="both" to show anyway. */
export function Practice({ id, title = 'Try it', intro, items, level = 'beginning' }: {
  id?: string
  title?: string
  intro?: React.ReactNode
  items: { q: React.ReactNode; a: React.ReactNode }[]
  level?: MorphLevel | 'both'
}) {
  const t = useT()
  const cur = useContext(LevelContext)
  const tm = useTm()
  if (id) title = tm(K.title(id), title)
  if (level !== 'both' && cur !== level) return null
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      {intro && <div className="text-sm text-gray-600 mb-3">{intro}</div>}
      <ol className="space-y-3 list-decimal list-inside">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-gray-800">
            <span>{it.q}</span>
            <details className="mt-0.5 ml-5">
              <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-xs font-medium text-brand-600 hover:text-brand-700">
                {t('morph.showAnswer')}
              </summary>
              <div className="mt-1 text-sm text-gray-700 border-l-2 border-brand-200 pl-3">{it.a}</div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Guided "we do" example — step ③ of the teaching cycle (① English concept,
 * ② Greek examples, ③ guided practice with prompts, ④ independent practice).
 * A sentence is worked through staged prompts: each "Show" reveals the answer
 * to the current prompt and surfaces the next one, mirroring how the
 * instructor prompts the class. The final translation appears at the end.
 */
export function GuidedExample({ title, sentence, source, translation, steps, level = 'beginning' }: {
  // No English default: a default string could not be translated, so each call site passes its
  // own <Tr>. See the three GuidedExamples in nouns.tsx and parsing.tsx.
  title: React.ReactNode
  sentence: React.ReactNode
  /** Optional verse reference; rendered as a link into the Reader. */
  // `ref` is the corpus lookup key and stays English; `label` is what the reader sees, so it
  // has to be able to hold a <Tr>.
  source?: { ref: string; label?: React.ReactNode }
  translation?: React.ReactNode
  steps: { prompt: React.ReactNode; answer: React.ReactNode }[]
  /** Beginning-course drill material — hidden at Intermediate by default. */
  level?: MorphLevel | 'both'
}) {
  const t = useT()
  const [revealed, setRevealed] = useState(0)
  const cur = useContext(LevelContext)
  if (level !== 'both' && cur !== level) return null
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1.5">{title}</p>
      <p className="text-base normal-case text-gray-900 mb-1">{sentence}</p>
      {source && (
        <p className="text-xs mb-2">
          <Link href={`/reader?ref=${encodeURIComponent(source.ref)}`} className="text-brand-600 hover:underline">
            {source.label ?? source.ref} — {t('morph.openInReader')} →
          </Link>
        </p>
      )}
      <ol className="mt-2 space-y-2.5">
        {steps.slice(0, revealed + 1).map((s, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-gray-800">{s.prompt}</p>
            {i < revealed ? (
              <p className="mt-0.5 border-l-2 border-brand-300 pl-3 text-gray-700">{s.answer}</p>
            ) : (
              <button
                onClick={() => setRevealed(r => r + 1)}
                className="mt-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
              >
                Show
              </button>
            )}
          </li>
        ))}
      </ol>
      {revealed >= steps.length && translation && (
        <p className="mt-3 border-t border-brand-100 pt-2.5 text-sm font-medium text-gray-900">{translation}</p>
      )}
      {revealed > 0 && (
        <button onClick={() => setRevealed(0)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
          {t('morph.startOver')}
        </button>
      )}
    </div>
  )
}

/**
 * A practice block where each item is answered from a dropdown (e.g. parse drills:
 * pick the case + number). Answering gives immediate right/wrong feedback and, when
 * wrong, shows the correct answer. `options` is the shared dropdown list; an item can
 * override it with its own.
 */
export function DropdownPractice({ id, title = 'Practice', intro, options, items, level = 'beginning' }: {
  id?: string
  title?: string
  intro?: React.ReactNode
  options: string[]
  items: { q: React.ReactNode; answer: string; options?: string[]; note?: React.ReactNode }[]
  /** Beginning-course drill material — hidden at Intermediate by default. */
  level?: MorphLevel | 'both'
}) {
  const t = useT()
  const curLevel = useContext(LevelContext)
  const tm = useTm()
  if (id) {
    // An item's `answer` is matched against `options` by value, so both must move together.
    // Translating the options and mapping each answer through the same table keeps them in step
    // without asking the translator to keep two lists identical by hand.
    const en = options
    const es = options.map((o, i) => tm(K.option(id, i), o))
    const map = new Map(en.map((o, i) => [o, es[i]] as const))
    title = tm(K.title(id), title)
    options = es
    items = items.map(it => ({ ...it, answer: map.get(it.answer) ?? it.answer,
      options: it.options?.map(o => map.get(o) ?? o) }))
  }
  const [chosen, setChosen] = useState<Record<number, string>>({})
  // Quiz-from-memory mode (for in-class use): "Quiz me" BLANKS the table this practice
  // drills (the nearest preceding table on the page), answers give no feedback until
  // Submit, and Submit restores the table and marks every item right/wrong — so the
  // instructor can walk through why each answer was right or wrong.
  const [mode, setMode] = useState<'open' | 'quiz' | 'review'>('open')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const blanked = useRef<HTMLElement[]>([])

  // Find the nearest preceding element (walking up through ancestors) that contains
  // a table, and hide its table bodies — the frame stays, the contents go blank.
  function blankTable() {
    let node: HTMLElement | null = rootRef.current
    outer: while (node) {
      let sib = node.previousElementSibling as HTMLElement | null
      while (sib) {
        const tables: HTMLTableElement[] = sib.tagName === 'TABLE'
          ? [sib as HTMLTableElement]
          : Array.from(sib.querySelectorAll('table'))
        if (tables.length > 0) {
          for (const t of tables) {
            for (const body of Array.from(t.tBodies)) {
              body.style.visibility = 'hidden'
              blanked.current.push(body)
            }
          }
          break outer
        }
        sib = sib.previousElementSibling as HTMLElement | null
      }
      node = node.parentElement
    }
  }
  function unblankTable() {
    for (const el of blanked.current) el.style.visibility = ''
    blanked.current = []
  }
  // Never leave a table blanked if the block unmounts (e.g. switching chapter tabs).
  useEffect(() => () => unblankTable(), [])

  function startQuiz() {
    setChosen({})
    setMode('quiz')
    blankTable()
  }
  function submitQuiz() {
    setMode('review')
    unblankTable()
  }
  function endQuiz() {
    setChosen({})
    setMode('open')
    unblankTable()
  }

  if (level !== 'both' && curLevel !== level) return null

  const answered = Object.keys(chosen).filter(k => chosen[Number(k)] !== '').length
  const right = items.filter((it, i) => chosen[i] === it.answer).length
  // Feedback (colors, ✓/✗, running score) is hidden while a quiz is in progress.
  const showFeedback = mode !== 'quiz'

  return (
    <div ref={rootRef} className={clsx('my-5 max-w-3xl rounded-xl border px-4 py-3.5',
      mode === 'quiz' ? 'border-brand-300 bg-brand-50/50' : 'border-gray-200 bg-gray-50')}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
          {mode === 'quiz' && <span className="ml-2 normal-case font-medium text-brand-700">{t('morph.fromMemory')}</span>}
          {mode === 'review' && <span className="ml-2 normal-case font-medium text-brand-700">{t('morph.results')}</span>}
        </p>
        {mode === 'review'
          ? <span className="text-xs font-medium tabular-nums text-gray-600">{t('morph.score', { right, total: items.length })}</span>
          : mode === 'open' && answered > 0 && (
            <span className="text-xs tabular-nums text-gray-400">{t('morph.score', { right, total: answered })}</span>
          )}
      </div>
      {intro && mode === 'open' && <div className="text-sm text-gray-600 mb-3">{intro}</div>}
      {mode === 'quiz' && (
        <p className="mb-3 text-sm text-brand-800">
          {t('morph.quizInstructions')}
        </p>
      )}
      <ol className="space-y-3">
        {items.map((it, i) => {
          const picked = chosen[i] ?? ''
          const isRight = showFeedback && picked !== '' && picked === it.answer
          const isWrong = showFeedback && picked !== '' && picked !== it.answer
          const missed = mode === 'review' && picked === ''
          return (
            <li key={i} className="text-sm text-gray-800">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="min-w-[3.5rem]">{i + 1}. {it.q}</span>
                <select
                  value={picked}
                  disabled={mode === 'review'}
                  onChange={e => setChosen(prev => ({ ...prev, [i]: e.target.value }))}
                  className={clsx(
                    'rounded-lg border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-80',
                    isRight ? 'border-green-400' : (isWrong || missed) ? 'border-red-400' : 'border-gray-300'
                  )}
                >
                  <option value="">{t('morph.chooseOption')}</option>
                  {(it.options ?? options).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {isRight && <span className="text-xs font-medium text-green-700">{t('morph.correct')}</span>}
                {isWrong && <span className="text-xs font-medium text-red-700">{t('morph.wrongAnswer', { answer: it.answer })}</span>}
                {missed && <span className="text-xs font-medium text-red-700">{t('morph.notAnswered', { answer: it.answer })}</span>}
              </div>
              {(isWrong || missed) && it.note && (
                <p className="mt-1 border-l-2 border-brand-200 pl-3 text-xs text-gray-600">{it.note}</p>
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {mode === 'open' && (
          <button
            type="button"
            onClick={startQuiz}
            className="rounded-lg border border-brand-300 bg-surface px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            {t('morph.quizMe')}
          </button>
        )}
        {mode === 'quiz' && (
          <>
            <button
              type="button"
              onClick={submitQuiz}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              {answered < items.length
                ? t('morph.submitAnswersLeft', { left: items.length - answered })
                : t('morph.submitAnswers')}
            </button>
            <button type="button" onClick={endQuiz} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </>
        )}
        {mode === 'review' && (
          <>
            <button
              type="button"
              onClick={startQuiz}
              className="rounded-lg border border-brand-300 bg-surface px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              {t('morph.tryAgain')}
            </button>
            <button type="button" onClick={endQuiz} className="text-xs text-gray-400 hover:text-gray-600">
              {t('morph.done')}
            </button>
          </>
        )}
        {mode === 'open' && answered > 0 && (
          <button type="button" onClick={() => setChosen({})} className="text-xs text-gray-400 hover:text-gray-600">
            {t('morph.startOver')}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Classroom translation sentences — step ④ "you do" of the teaching cycle,
 * mirrored 1:1 from the lesson PowerPoint decks (deck ⇄ page parity). Each
 * sentence can be opened in the Translation Workbench side panel, where the
 * student clicks each word and enters its parsing, syntax and translation.
 * A "Show translation" fallback keeps the block usable as plain reading.
 */
export function ClassSentences({ id, lesson, intro, items, level = 'beginning' }: {
  id?: string
  /** Which deck these mirror, e.g. "Lesson 3 · Prepositions". */
  lesson: string
  intro?: React.ReactNode
  items: Omit<WorkbenchSentence, 'lesson'>[]
  /** Mirrors the Beginning course's lesson decks — hidden at Intermediate by default. */
  level?: MorphLevel | 'both'
}) {
  const t = useT()
  const cur = useContext(LevelContext)
  const tm = useTm()
  if (id) {
    lesson = tm(K.lesson(id), lesson)
    items = items.map((it, s) => ({
      ...it,
      translation: it.translation ? tm(K.sentence(id, s), it.translation) : it.translation,
      note: it.note ? tm(K.sentNote(id, s), it.note) : it.note,
      // `parsing` is left English on purpose — see morph-fields.ts.
      words: it.words?.map((w, i) => ({
        ...w,
        gloss: w.gloss ? tm(K.gloss(id, s, i), w.gloss) : w.gloss,
        syntax: w.syntax ? tm(K.syntax(id, s, i), w.syntax) : w.syntax,
      })),
    }))
  }
  if (level !== 'both' && cur !== level) return null
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-0.5">
        {t('morph.translateFromClass')}
      </p>
      <p className="text-xs text-gray-500 mb-2">{lesson}</p>
      {intro && <div className="text-sm text-gray-600 mb-3">{intro}</div>}
      <ol className="space-y-2.5 list-decimal list-inside">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-gray-800">
            <span className="font-reading normal-case text-base text-gray-900">
              {it.words.map(w => w.w).join(' ')}
            </span>
            <div className="ml-5 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <button
                type="button"
                onClick={() => openTranslationWorkbench({ ...it, lesson })}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
              >
                {t('morph.openInWorkbench')}
              </button>
              <details className="inline-block">
                <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-xs font-medium text-gray-400 hover:text-gray-600">
                  {t('morph.showTranslation')}
                </summary>
                <span className="text-sm text-gray-700">{it.translation}</span>
              </details>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Graded homework for this chapter (the lesson deck's "Exercises A / B" as
 * Translation Exercises), role-aware:
 *
 * - Students see their published homework assignments with due date +
 *   submission state; each opens the assignment's homework pane.
 * - Instructors see an activate panel: per course, toggle a set on with a
 *   deadline (creates the published assignment through the normal assignment
 *   API, so it appears on the course dashboard and in the gradebook), adjust
 *   the deadline, or deactivate (unpublish) — class-by-class control from
 *   right here on the Grammar page.
 *
 * Renders nothing when signed out or when the chapter has no sets.
 */
interface HwStudentEntry { assignmentId: string; title: string; dueDate: string; round2Deadline: string | null; submitted: boolean }
interface HwInstructorData {
  sets: { id: string; title: string; sentenceCount: number }[]
  courses: { id: string; name: string; level: string }[]
  assignments: { setId: string; courseId: string; assignmentId: string; dueDate: string; isPublished: boolean; allowLate: boolean; lateDaysLimit: number | null; round2Deadline: string | null }[]
}

// ISO instant → a datetime-local input value ("YYYY-MM-DDTHH:mm") in local time.
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
// Deadline shown to instructors: date + time, with explicit fields (Safari-safe — no dateStyle).
function fmtDeadline(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function HomeworkAssignments({ chapter }: { chapter: string }) {
  const t = useT()
  const [role, setRole] = useState<'none' | 'student' | 'instructor'>('none')
  const [entries, setEntries] = useState<HwStudentEntry[]>([])
  const [data, setData] = useState<HwInstructorData | null>(null)
  const [dates, setDates] = useState<Record<string, string>>({})       // `${setId}:${courseId}` -> datetime-local
  const [selected, setSelected] = useState<Record<string, string>>({}) // setId -> chosen courseId
  const [late, setLate] = useState<Record<string, boolean>>({})        // `${setId}:${courseId}` -> allow late
  const [lateDays, setLateDays] = useState<Record<string, number>>({}) // `${setId}:${courseId}` -> days (0 = no limit)
  const [r2, setR2] = useState<Record<string, boolean>>({})            // `${setId}:${courseId}` -> correction round on
  const [r2Dates, setR2Dates] = useState<Record<string, string>>({})   // `${setId}:${courseId}` -> round 2 datetime-local
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  function load() {
    fetch(`/api/grammar-homework?chapter=${encodeURIComponent(chapter)}`)
      .then(r => (r.ok ? r.json() : { role: 'none', entries: [] }))
      .then(d => {
        setRole(d.role ?? 'none')
        if (d.role === 'student') setEntries(d.entries ?? [])
        if (d.role === 'instructor') setData(d)
      })
      .catch(() => setRole('none'))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [chapter])

  if (role === 'student') {
    if (entries.length === 0) return null
    return (
      <div className="my-5 max-w-3xl rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-2">Homework — graded</p>
        <ul className="space-y-1.5">
          {entries.map(e => (
            <li key={e.assignmentId} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              <Link href={`/student/assignments/${e.assignmentId}`} className="font-medium text-amber-900 hover:underline">
                {e.title} →
              </Link>
              <span className="text-xs text-amber-700">
                due {fmtDeadline(e.dueDate)}
                {e.round2Deadline && ` · corrections until ${fmtDeadline(e.round2Deadline)}`}
                {e.submitted && ' · submitted ✓'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (role !== 'instructor' || !data) return null

  async function act(key: string, fn: () => Promise<Response>) {
    setBusy(key); setError('')
    try {
      const res = await fn()
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        setError(b.error ?? 'Something went wrong.')
        return
      }
      load()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="my-5 max-w-3xl rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">
        {t('morph.hw.heading')}
      </p>
      <p className="text-xs text-amber-700 mb-3">
        {t('morph.hw.help')}
      </p>
      <div className="space-y-3">
        {data.sets.map(set => {
          const courseId = selected[set.id] ?? data.courses[0].id
          const course = data.courses.find(c => c.id === courseId)!
          const key = `${set.id}:${courseId}`
          const existing = data.assignments.find(a => a.setId === set.id && a.courseId === courseId)
          const dtVal = dates[key] ?? (existing ? toLocalInput(existing.dueDate) : '')
          const lateVal = late[key] ?? (existing ? existing.allowLate : false)
          const daysVal = lateDays[key] ?? (existing ? (existing.lateDaysLimit ?? 0) : 0)
          const r2On = r2[key] ?? (existing ? !!existing.round2Deadline : false)
          const r2Val = r2Dates[key] ?? (existing?.round2Deadline ? toLocalInput(existing.round2Deadline) : '')
          // Round 2 must end after Round 1 (the due date).
          const r2Invalid = r2On && !!r2Val && !!dtVal && new Date(r2Val) <= new Date(dtVal)
          const fieldCls = 'rounded-lg border border-gray-300 bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
          // Late policy sent to the API: null days = accept indefinitely.
          const latePayload = { allowLate: lateVal, lateDaysLimit: lateVal && daysVal > 0 ? daysVal : null }
          const r2Payload = { round2Deadline: r2On && r2Val ? new Date(r2Val).toISOString() : null }
          const changed = !!existing && (
            (!!dtVal && dtVal !== toLocalInput(existing.dueDate)) ||
            lateVal !== existing.allowLate ||
            (lateVal && (daysVal || 0) !== (existing.lateDaysLimit ?? 0)) ||
            r2On !== !!existing.round2Deadline ||
            (r2On && !!r2Val && r2Val !== (existing.round2Deadline ? toLocalInput(existing.round2Deadline) : ''))
          )
          return (
            <div key={set.id} className="rounded-lg border border-amber-200 bg-surface p-3">
              <p className="text-sm font-semibold text-gray-800">
                {set.title} <span className="text-xs font-normal text-gray-400">· {set.sentenceCount} sentences ·</span>{' '}
                <HomeworkSetPreviewLink setId={set.id} />
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                  Course
                  <select
                    value={courseId}
                    onChange={e => setSelected(prev => ({ ...prev, [set.id]: e.target.value }))}
                    className={fieldCls}
                  >
                    {data.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                  Due — date &amp; time
                  <input
                    type="datetime-local"
                    value={dtVal}
                    onChange={e => setDates(prev => ({ ...prev, [key]: e.target.value }))}
                    className={fieldCls}
                  />
                </label>
                <label className="flex items-center gap-1.5 pb-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={r2On}
                    onChange={e => setR2(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  Correction round
                </label>
                {r2On && (
                  <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                    Corrections end — date &amp; time
                    <input
                      type="datetime-local"
                      value={r2Val}
                      onChange={e => setR2Dates(prev => ({ ...prev, [key]: e.target.value }))}
                      className={clsx(fieldCls, r2Invalid && 'border-red-400 ring-1 ring-red-300')}
                    />
                  </label>
                )}
                <label className="flex items-center gap-1.5 pb-2 text-xs font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={lateVal}
                    onChange={e => setLate(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  Allow late
                </label>
                {lateVal && (
                  <label className="flex items-center gap-1.5 pb-2 text-xs text-gray-500">
                    up to
                    <input
                      type="number" min={0} max={30}
                      value={daysVal}
                      onChange={e => setLateDays(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-14 rounded-lg border border-gray-300 px-1.5 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {daysVal > 0 ? (daysVal === 1 ? 'day late' : 'days late') : 'days (0 = no limit)'}
                  </label>
                )}
                <div className="flex items-center gap-2 pb-1">
                  {!existing ? (
                    <button
                      type="button"
                      disabled={busy === key || !dtVal || r2Invalid || (r2On && !r2Val)}
                      onClick={() => act(key, () => fetch('/api/assignments', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          courseId, title: set.title, type: 'TRANSLATION_EXERCISE',
                          weekNumber: 1, dueDate: new Date(dtVal).toISOString(), level: course.level,
                          homeworkSet: set.id, isPublished: true,
                          maxRetakes: 0,   // one Round 1 submission; corrections go through their own endpoint
                          ...latePayload,
                          ...r2Payload,
                        }),
                      }))}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {busy === key ? 'Activating…' : 'Activate'}
                    </button>
                  ) : (
                    <>
                      <span className={clsx('rounded-md px-2 py-1 text-xs font-medium',
                        existing.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {existing.isPublished
                          ? `active · due ${fmtDeadline(existing.dueDate)}${existing.round2Deadline ? ` · corrections until ${fmtDeadline(existing.round2Deadline)}` : ''}${existing.allowLate ? ` · late ${existing.lateDaysLimit ? `+${existing.lateDaysLimit}d` : 'open'}` : ''}`
                          : 'deactivated'}
                      </span>
                      {existing.isPublished && changed && (
                        <button
                          type="button"
                          disabled={busy === key || r2Invalid || (r2On && !r2Val)}
                          onClick={() => act(key, () => fetch(`/api/assignments/${existing.assignmentId}`, {
                            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dueDate: new Date(dtVal).toISOString(), ...latePayload, ...r2Payload }),
                          }))}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          Update
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy === key}
                        onClick={() => act(key, () => fetch(`/api/assignments/${existing.assignmentId}`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(existing.isPublished
                            ? { isPublished: false }
                            : { isPublished: true, ...(dtVal ? { dueDate: new Date(dtVal).toISOString() } : {}) }),
                        }))}
                        className="rounded-lg border border-gray-300 bg-surface px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                      >
                        {existing.isPublished ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">{error}</p>}
    </div>
  )
}

/**
 * Links into the live tagged corpus: each entry opens the Master Search
 * morphology facet (/search?in=morph:GNT) pre-filled with the given features
 * and/or lemma, so students see every real NT occurrence of the category.
 */
export function LiveExamples({ intro, links }: {
  intro?: React.ReactNode
  // `features`/`lemma` open the one-word morphology search. `construct` opens Construct search
  // instead, which is what SYNTAX needs — attributive position, a genitive absolute or a
  // second-class condition are relations between words, and no single-word search can express them.
  links: {
    label: React.ReactNode
    features?: string[]
    lemma?: string
    construct?: Omit<ConstructQuery, 'corpus'>
  }[]
}) {
  const t = useT()
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1.5">{t('morph.seeItInNT')}</p>
      {intro && <div className="text-sm text-gray-600 mb-2">{intro}</div>}
      <ul className="space-y-1.5">
        {links.map((l, i) => (
          <li key={i}>
            {l.construct ? (
              /* Construct search needs the builder's room, so it opens in a new tab rather than the
                 side panel — the Grammar page stays where it is either way. */
              <a
                href={`/search/construct?${encodeConstruct({ ...l.construct, corpus: 'GNT' }).toString()}`}
                target="_blank"
                rel="noopener"
                className="text-left text-sm text-brand-600 hover:text-brand-700 hover:underline"
              >
                {l.label} →
              </a>
            ) : (
              /* Opens the morphology search in the SIDE PANEL (split view, like Reader
                 searches) — the Grammar page stays visible; matches highlight in red. */
              <button
                type="button"
                onClick={() => openMasterSearch({
                  query: l.lemma ?? '',
                  scope: 'morph:GNT',
                  features: l.features?.join(','),
                })}
                className="text-left text-sm text-brand-600 hover:text-brand-700 hover:underline"
              >
                {l.label} →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
