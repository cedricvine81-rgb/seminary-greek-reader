'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { SearchWords } from '@/components/search/SearchWords'
import { ResizableParsingPane } from '@/components/reader/ResizableParsingPane'
import { findProseWork, type ProseDoc } from '@/lib/prose-texts'
import type { LexicalInfoPanel } from '@/types/lexicon'

// A construct hit read BESIDE the search that found it, instead of navigating away to the
// full reader and losing the query. Same split-view mechanics as the Master Search and
// cited-source panels — docked right, resizable, width remembered, Esc to close — so
// globals.css pads #app-content on that side and the builder and results stay put.
//
// It serves both kinds of construct result, which come from different places: biblical hits
// (GNT/LXX) load a chapter from /api/reader, and prose hits (Josephus, Philo, the Talmud…)
// load the work's chapter→verse JSON, the same file the Texts reader uses.
//
// Because /api/reader returns each word's lexeme and parse, biblical passages here get the
// same two reading aids the Reader has: click a word for the parsing pane, and pick a
// parallel translation. Prose hits have neither — their sidecars aren't loaded here — so
// both controls are hidden rather than shown empty.

export type ConstructTextTarget =
  | { kind: 'biblical'; osisId: string; chapter: number; verse: number; corpus: 'NA1904' | 'LXX'; label: string }
  | { kind: 'prose'; source: string; chapter: number; verse?: number; label: string; href: string | null }

const WIDTH_KEY = 'constructPanel.width'
const LANG_KEY = 'constructPanel.lang'
const MIN_W = 380
const DEFAULT_W = 560

// Matches the parallel-translation choices offered under the results themselves.
const LANGS: [string, string][] = [
  ['none', 'No translation'],
  ['en', 'English (WEB)'],
  ['bsb', 'English (BSB)'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['pt', 'Portuguese'],
  ['ru', 'Russian'],
  ['ko', 'Korean'],
  ['zh', 'Mandarin'],
]

function clampWidth(w: number): number {
  return Math.min(Math.max(w, MIN_W), Math.max(Math.round(window.innerWidth * 0.6), MIN_W))
}

const MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}

type Token = { surface: string; lemma: string; gloss?: string; strongs?: string; parsing: string }
interface Row { num: number; ref?: string; greek?: string; english?: string; tokens?: Token[] }

export function ConstructTextPanel({ target, onClose }: { target: ConstructTextTarget; onClose: () => void }) {
  const [width, setWidth] = useState(DEFAULT_W)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attribution, setAttribution] = useState<string | null>(null)
  const [lang, setLang] = useState('none')
  const [translation, setTranslation] = useState<Record<number, string>>({})
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const widthRef = useRef(width); widthRef.current = width
  const drag = useRef<{ startX: number; startW: number } | null>(null)
  const markedRef = useRef<HTMLDivElement>(null)

  const isBiblical = target.kind === 'biblical'

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(WIDTH_KEY) ?? '', 10)
      if (Number.isFinite(v)) setWidth(clampWidth(v))
      const l = localStorage.getItem(LANG_KEY)
      if (l && LANGS.some(([k]) => k === l)) setLang(l)
    } catch { /* ignore */ }
  }, [])

  // Squeeze the page rather than cover it (desktop) — see globals.css.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-construct-panel', '1')
    root.style.setProperty('--construct-panel-w', `${width}px`)
    return () => {
      root.removeAttribute('data-construct-panel')
      root.style.removeProperty('--construct-panel-w')
    }
  }, [width])

  // Drag the panel's left edge: it docks right, so dragging inward widens it.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      e.preventDefault()
      setWidth(clampWidth(drag.current.startW + (drag.current.startX - e.clientX)))
    }
    function onUp() {
      if (!drag.current) return
      drag.current = null
      document.body.style.userSelect = ''
      try { localStorage.setItem(WIDTH_KEY, String(widthRef.current)) } catch { /* ignore */ }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Load the passage — biblical from the reader API (words carry lexeme + parse), prose from
  // the work's static JSON.
  useEffect(() => {
    let live = true
    setRows(null); setFailed(false); setAttribution(null); setSelectedInfo(null)

    async function load() {
      try {
        if (target.kind === 'biblical') {
          const r = await fetch(`/api/reader?book=${encodeURIComponent(target.osisId)}&chapter=${target.chapter}&corpus=${target.corpus}`)
          if (!r.ok) throw new Error('reader')
          const d = await r.json() as {
            verses?: {
              verse: number; text?: string
              words?: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: Record<string, string | null>[] }[]
            }[]
          }
          if (!live) return
          setRows((d.verses ?? []).map(v => ({
            num: v.verse,
            greek: v.text ?? (v.words ?? []).map(w => w.surface).join(' '),
            tokens: (v.words ?? []).map(w => ({
              surface: w.surface,
              lemma: w.lexeme?.lexeme ?? '',
              gloss: w.lexeme?.gloss,
              strongs: w.lexeme?.strongs,
              parsing: w.parses?.[0] ? formatMorph(w.parses[0]) : '',
            })),
          })))
        } else {
          const work = findProseWork(target.source)
          if (!work) throw new Error('work')
          const r = await fetch(work.dataUrl)
          if (!r.ok) throw new Error('prose')
          const d = await r.json() as ProseDoc
          if (!live) return
          const ch = d.chapters.find(c => c.number === target.chapter)
          setRows((ch?.verses ?? []).map(v => ({ num: v.number, ref: v.ref, greek: v.greek, english: v.text })))
          setAttribution(d.attribution ?? null)
        }
      } catch {
        if (live) setFailed(true)
      }
    }
    void load()
    return () => { live = false }
  }, [target])

  // The chosen parallel translation for this chapter. Biblical only, and skipped for 'none'
  // so turning the column off costs no request.
  useEffect(() => {
    if (!isBiblical || lang === 'none') { setTranslation({}); return }
    const t = target as Extract<ConstructTextTarget, { kind: 'biblical' }>
    let live = true
    fetch(`/api/translation?book=${encodeURIComponent(t.osisId)}&chapter=${t.chapter}&lang=${lang}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { verses?: Record<string, string> } | null) => {
        if (!live || !d?.verses) return
        // Keyed by full osis reference ("Matt.1.1"), so the verse is the last segment.
        const byNum: Record<number, string> = {}
        for (const [k, v] of Object.entries(d.verses)) {
          const n = Number(k.split('.').pop())
          if (Number.isFinite(n)) byNum[n] = v
        }
        setTranslation(byNum)
      })
      .catch(() => { if (live) setTranslation({}) })
    return () => { live = false }
  }, [isBiblical, lang, target])

  // Bring the matched verse into view once the text is in.
  useEffect(() => {
    if (rows && markedRef.current) markedRef.current.scrollIntoView({ block: 'center' })
  }, [rows])

  const readerHref = target.kind === 'biblical'
    ? `/reader?ref=${encodeURIComponent(`${target.osisId} ${target.chapter}:${target.verse}`)}`
    : target.href

  const markedNum = target.verse

  // Greek rendered as clickable tokens (biblical) so a word can be parsed where it sits.
  const renderTokens = useMemo(() => (row: Row, refLabel: string) => (
    <p className="greek-text leading-relaxed block text-gray-900">
      {(row.tokens ?? []).map((tok, i) => {
        // Hover AND click, like the results list beside it: sweeping a mouse along a verse is
        // how you read a parse per word, and the click is what touch devices have instead.
        const select = () => setSelectedInfo({
          surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '',
          partOfSpeech: '', parsing: tok.parsing, strongs: tok.strongs, reference: refLabel,
        })
        return (
        <span key={i}>
          <button
            type="button"
            onMouseEnter={select}
            onFocus={select}
            onClick={select}
            className={`reading-word rounded px-0.5 transition-colors hover:bg-brand-100 ${
              selectedInfo?.surface === tok.surface && selectedInfo?.reference === refLabel ? 'bg-brand-100' : ''}`}
          >
            {tok.surface}
          </button>
          {i < (row.tokens?.length ?? 0) - 1 ? ' ' : ''}
        </span>
        )
      })}
    </p>
  ), [selectedInfo])

  return (
    <div
      className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:right-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[var(--panel-w)] flex flex-col bg-surface border-l border-gray-200 shadow-xl"
      style={{ '--panel-w': `${width}px` } as CSSProperties}
      role="dialog"
      aria-label={target.label}
    >
      {/* Resize handle on the panel's left edge (it docks right). */}
      <div
        onPointerDown={e => {
          e.preventDefault()
          drag.current = { startX: e.clientX, startW: widthRef.current }
          document.body.style.userSelect = 'none'
        }}
        title="Drag to resize"
        className="hidden lg:flex absolute left-0 inset-y-0 w-2 -ml-1 cursor-col-resize touch-none items-center justify-center group"
      >
        <div className="h-12 w-1 rounded-full bg-gray-300 group-hover:bg-brand-400 transition-colors" />
      </div>

      <div className="flex-none border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">{target.label}</p>
            <p className="text-[11px] text-gray-500">Your search stays open beside this</p>
          </div>
          <div className="flex flex-none items-center gap-1">
            {readerHref && (
              <a href={readerHref} title="Open in the full reader" className="rounded p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100">
                <ExternalLink size={15} />
              </a>
            )}
            <button onClick={onClose} title="Close (Esc)" className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Prose passages carry their own English already, and have no parse data here. */}
        {isBiblical && (
          <div className="mt-2 flex items-center gap-2">
            <select
              value={lang}
              onChange={e => {
                setLang(e.target.value)
                try { localStorage.setItem(LANG_KEY, e.target.value) } catch { /* ignore */ }
              }}
              title="Parallel translation"
              className="rounded-md border border-gray-200 bg-surface px-2 py-1 text-[11px] text-gray-600"
            >
              {LANGS.map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
            </select>
            <span className="text-[11px] text-gray-400">Click a word to parse it</span>
          </div>
        )}
      </div>

      {/* overscroll-contain: without it, reaching the top or bottom of this passage chains the
          wheel through to the page behind, so the builder and results scroll away under the
          cursor while you are reading here. */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
        {failed ? (
          <p className="text-sm italic text-gray-400">Couldn&rsquo;t load this passage.</p>
        ) : !rows ? (
          <p className="text-sm italic text-gray-300">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm italic text-gray-400">Nothing to show for this passage.</p>
        ) : (
          <div className="space-y-3">
            {rows.map(v => {
              const marked = v.num === markedNum
              const refLabel = `${target.label.replace(/\s+\d+:\d+$/, '')} ${target.chapter}:${v.num}`
              const en = isBiblical ? translation[v.num] : v.english
              return (
                <div
                  key={v.num}
                  ref={marked ? markedRef : undefined}
                  className={marked ? '-mx-1 rounded-lg bg-parchment-50 px-3 py-2 ring-1 ring-parchment-200' : ''}
                >
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-500">
                    {v.ref ?? v.num}
                  </p>
                  {/* Biblical Greek is tokenized for the parsing pane; prose keeps the
                      app-wide right-click menu (search, lookup, copy) on its words. */}
                  {isBiblical && v.tokens?.length ? renderTokens(v, refLabel) : v.greek ? (
                    <SearchWords
                      text={v.greek}
                      terms={[]}
                      className="greek-text leading-relaxed block text-gray-900"
                      payload={() => ({ kind: 'greek', reference: refLabel, greekCorpus: 'GNT' })}
                    />
                  ) : null}
                  {en && (
                    <p className={`font-reading leading-relaxed text-gray-700 ${v.greek || v.tokens?.length ? 'mt-1.5' : ''}`}>{en}</p>
                  )}
                </div>
              )
            })}
            {attribution && (
              <p className="border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-400">{attribution}</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom-anchored, like the Reader's and the Texts reader's own parsing panes. */}
      {isBiblical && <ResizableParsingPane storageKey="construct" info={selectedInfo} bgClass="bg-gray-50" />}
    </div>
  )
}
