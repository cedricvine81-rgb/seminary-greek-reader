'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { SearchWords } from '@/components/search/SearchWords'
import { findProseWork, type ProseDoc } from '@/lib/prose-texts'

// A construct hit read BESIDE the search that found it, instead of navigating away to the
// full reader and losing the query. Same split-view mechanics as the Master Search and
// cited-source panels, mirrored: this one docks LEFT (data-construct-panel +
// --construct-panel-w on <html>; globals.css pads #app-content on that side), so the
// passage sits to the left of the builder and results, which stay where they were.
//
// It serves both kinds of construct result, which come from different places: biblical hits
// (GNT/LXX) load a chapter from /api/reader, and prose hits (Josephus, Philo, the Talmud…)
// load the work's chapter→verse JSON, the same file the Texts reader uses.

export type ConstructTextTarget =
  | { kind: 'biblical'; osisId: string; chapter: number; verse: number; corpus: 'NA1904' | 'LXX'; label: string }
  | { kind: 'prose'; source: string; chapter: number; verse?: number; label: string; href: string | null }

const WIDTH_KEY = 'constructPanel.width'
const MIN_W = 380
const DEFAULT_W = 560

function clampWidth(w: number): number {
  return Math.min(Math.max(w, MIN_W), Math.max(Math.round(window.innerWidth * 0.6), MIN_W))
}

interface Row { num: number; ref?: string; greek?: string; english?: string }

export function ConstructTextPanel({ target, onClose }: { target: ConstructTextTarget; onClose: () => void }) {
  const [width, setWidth] = useState(DEFAULT_W)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attribution, setAttribution] = useState<string | null>(null)
  const widthRef = useRef(width); widthRef.current = width
  const drag = useRef<{ startX: number; startW: number } | null>(null)
  const markedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(WIDTH_KEY) ?? '', 10)
      if (Number.isFinite(v)) setWidth(clampWidth(v))
    } catch { /* ignore */ }
  }, [])

  // Squeeze the page from the left rather than cover it (desktop) — see globals.css.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-construct-panel', '1')
    root.style.setProperty('--construct-panel-w', `${width}px`)
    return () => {
      root.removeAttribute('data-construct-panel')
      root.style.removeProperty('--construct-panel-w')
    }
  }, [width])

  // Drag the RIGHT edge: the panel is on the left, so widening means dragging outward.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!drag.current) return
      e.preventDefault()
      setWidth(clampWidth(drag.current.startW + (e.clientX - drag.current.startX)))
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

  // Load the passage — biblical from the reader API, prose from the work's static JSON.
  useEffect(() => {
    let live = true
    setRows(null); setFailed(false); setAttribution(null)

    async function load() {
      try {
        if (target.kind === 'biblical') {
          const r = await fetch(`/api/reader?book=${encodeURIComponent(target.osisId)}&chapter=${target.chapter}&corpus=${target.corpus}`)
          if (!r.ok) throw new Error('reader')
          const d = await r.json() as { verses?: { verse: number; text?: string; words?: { surface: string }[] }[] }
          if (!live) return
          setRows((d.verses ?? []).map(v => ({
            num: v.verse,
            greek: v.text ?? (v.words ?? []).map(w => w.surface).join(' '),
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

  // Bring the matched verse into view once the text is in.
  useEffect(() => {
    if (rows && markedRef.current) markedRef.current.scrollIntoView({ block: 'center' })
  }, [rows])

  const markedNum = target.kind === 'biblical' ? target.verse : target.verse
  const readerHref = target.kind === 'biblical'
    ? `/reader?ref=${encodeURIComponent(`${target.osisId} ${target.chapter}:${target.verse}`)}`
    : target.href

  return (
    <div
      className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:left-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[var(--panel-w)] flex flex-col bg-surface border-r border-gray-200 shadow-xl"
      style={{ '--panel-w': `${width}px` } as CSSProperties}
      role="dialog"
      aria-label={target.label}
    >
      {/* Resize handle on the panel's right edge (it docks left). */}
      <div
        onPointerDown={e => {
          e.preventDefault()
          drag.current = { startX: e.clientX, startW: widthRef.current }
          document.body.style.userSelect = 'none'
        }}
        title="Drag to resize"
        className="hidden lg:flex absolute right-0 inset-y-0 w-2 -mr-1 cursor-col-resize touch-none items-center justify-center group"
      >
        <div className="h-12 w-1 rounded-full bg-gray-300 group-hover:bg-brand-400 transition-colors" />
      </div>

      <div className="flex-none border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{target.label}</p>
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
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
              return (
                <div
                  key={v.num}
                  ref={marked ? markedRef : undefined}
                  className={marked ? '-mx-1 rounded-lg bg-parchment-50 px-3 py-2 ring-1 ring-parchment-200' : ''}
                >
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-500">
                    {v.ref ?? v.num}
                  </p>
                  {/* Words keep the app-wide right-click menu, so a passage opened from a hit
                      can be parsed and searched like any reading pane. */}
                  {v.greek && (
                    <SearchWords
                      text={v.greek}
                      terms={[]}
                      className="block font-greek text-[1.05rem] leading-relaxed text-gray-900"
                      payload={() => ({
                        kind: 'greek',
                        reference: `${target.label} ${v.ref ?? v.num}`,
                        greekCorpus: target.kind === 'biblical' && target.corpus === 'LXX' ? 'LXX' : 'GNT',
                      })}
                    />
                  )}
                  {v.english && (
                    <p className={`font-reading leading-relaxed text-gray-700 ${v.greek ? 'mt-1.5' : ''}`}>{v.english}</p>
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
    </div>
  )
}
