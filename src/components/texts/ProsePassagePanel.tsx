'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { findProseWork, type ProseDoc, type ProseVerse } from '@/lib/prose-texts'
import { SearchWords } from '@/components/search/SearchWords'
import type { ProsePassageTarget } from '@/lib/prose-panel-bus'

// A cited source (Theon, Quintilian, …) read beside the page that cited it, rather than a
// navigation away. Mirrors MasterSearchPanel's split-view mechanics: on desktop the panel
// publishes its width on <html> (data-prose-panel + --prose-panel-w) and globals.css shifts
// #app-content left by the same amount, so the page is squeezed rather than covered; on
// mobile it's a full-screen sheet.

const WIDTH_KEY = 'prosePanel.width'
const MIN_W = 380
const DEFAULT_W = 560

function clampWidth(w: number): number {
  const max = Math.round(window.innerWidth * 0.6)
  return Math.min(Math.max(w, MIN_W), Math.max(max, MIN_W))
}

/** Which columns to show for a work that carries the original alongside the English. */
type Show = 'both' | 'en' | 'orig'

export function ProsePassagePanel({ target, onClose }: { target: ProsePassageTarget; onClose: () => void }) {
  const work = findProseWork(target.source)
  const [width, setWidth] = useState(DEFAULT_W)
  const [doc, setDoc] = useState<ProseDoc | null>(null)
  const [failed, setFailed] = useState(false)
  const [show, setShow] = useState<Show>('both')
  const widthRef = useRef(width); widthRef.current = width
  const drag = useRef<{ startX: number; startW: number } | null>(null)
  const markedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const v = parseInt(localStorage.getItem(WIDTH_KEY) ?? '', 10)
      if (Number.isFinite(v)) setWidth(clampWidth(v))
    } catch { /* ignore */ }
  }, [])

  // Squeeze the page rather than cover it (desktop) — see globals.css.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-prose-panel', '1')
    root.style.setProperty('--prose-panel-w', `${width}px`)
    return () => {
      root.removeAttribute('data-prose-panel')
      root.style.removeProperty('--prose-panel-w')
    }
  }, [width])

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

  // Load the work's chapter→verse JSON (same files the Texts reader uses).
  useEffect(() => {
    if (!work) { setFailed(true); return }
    let live = true
    setDoc(null); setFailed(false)
    fetch(work.dataUrl)
      .then(r => r.json())
      .then((d: ProseDoc) => { if (live) setDoc(d) })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [work])

  // Bring the cited paragraph into view once the text is in.
  useEffect(() => {
    if (doc && markedRef.current) markedRef.current.scrollIntoView({ block: 'start' })
  }, [doc])

  const chapter = doc?.chapters.find(c => c.number === target.chapter)
  const hasOriginal = !!doc?.greek && !!chapter?.verses.some(v => v.greek)
  const heading = target.label ?? work?.name ?? 'Text'
  const chapterLabel = work?.chapterLabel?.(target.chapter)
  // Quintilian's original column is Latin; the Greek works' is Greek.
  const isGreekWork = !target.source.startsWith('quintilian-')
  const origLabel = isGreekWork ? 'Greek' : 'Latin'
  /** Citation shown in the word menu's Copy row. */
  const citeFor = (v: ProseVerse): string =>
    `${work?.name ?? ''} ${v.ref ?? `${target.chapter}.${v.number}`}`.trim()
  const readerHref = `/texts?work=${encodeURIComponent(target.source)}&chapter=${target.chapter}`

  return (
    <div
      className="fixed inset-0 z-50 lg:inset-auto lg:top-14 lg:right-0 lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:w-[var(--panel-w)] flex flex-col bg-surface border-l border-gray-200 shadow-xl"
      style={{ '--panel-w': `${width}px` } as CSSProperties}
      role="dialog"
      aria-label={heading}
    >
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
            <p className="text-sm font-semibold text-gray-800 truncate">{heading}</p>
            <p className="text-[11px] text-gray-500">
              {chapterLabel ? `${chapterLabel} · ` : ''}
              {target.cite ? `cited: ${target.cite}` : `chapter ${target.chapter}`}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-none">
            <a
              href={readerHref}
              title="Open in the full Texts reader"
              className="rounded p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100"
            >
              <ExternalLink size={15} />
            </a>
            <button onClick={onClose} title="Close (Esc)" className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100">
              <X size={16} />
            </button>
          </div>
        </div>
        {hasOriginal && (
          <div className="mt-2 flex gap-1">
            {([['both', `${origLabel} + English`], ['orig', origLabel], ['en', 'English']] as [Show, string][]).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setShow(k)}
                className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                  show === k ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        {failed || !work ? (
          <p className="text-sm text-gray-400 italic">Couldn&rsquo;t load this text.</p>
        ) : !doc ? (
          <p className="text-sm text-gray-300 italic">Loading…</p>
        ) : !chapter ? (
          <p className="text-sm text-gray-400 italic">Chapter {target.chapter} isn&rsquo;t in this work.</p>
        ) : (
          <div className="space-y-4">
            {chapter.verses.map(v => {
              const marked = target.verse != null && v.number === target.verse
              return (
                <div
                  key={v.number}
                  ref={marked ? markedRef : undefined}
                  className={marked ? 'rounded-lg bg-parchment-50 ring-1 ring-parchment-200 px-3 py-2 -mx-1' : ''}
                >
                  {/* Editorial section heading, where the work has them (Theon). */}
                  {v.heading && (
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600/80">{v.heading}</p>
                  )}
                  {chapter.verses.length > 1 && (
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-brand-500">
                      {v.ref ?? `¶ ${v.number}`}
                    </p>
                  )}
                  {/* Words carry the app-wide right-click menu (search, lookup, copy), so a
                      passage opened from a citation can be dug into like any reading pane
                      rather than being inert text. */}
                  {hasOriginal && v.greek && show !== 'en' && (
                    <SearchWords
                      text={v.greek}
                      terms={[]}
                      className="font-greek text-[1.05rem] leading-relaxed text-gray-900 block"
                      payload={() => ({
                        kind: isGreekWork ? 'greek' : 'translation',
                        reference: citeFor(v),
                        ...(isGreekWork ? { greekCorpus: 'GNT' as const } : { transLang: 'la' }),
                        bgCollection: 'greco-roman',
                        bgCollectionLabel: 'Greco-Roman',
                      })}
                    />
                  )}
                  {show !== 'orig' && (
                    <SearchWords
                      text={v.text}
                      terms={[]}
                      className={`font-reading leading-relaxed text-gray-700 block ${hasOriginal && v.greek && show === 'both' ? 'mt-2' : ''}`}
                      payload={() => ({
                        kind: 'translation',
                        reference: citeFor(v),
                        transLang: 'en',
                        bgCollection: 'greco-roman',
                        bgCollectionLabel: 'Greco-Roman',
                      })}
                    />
                  )}
                </div>
              )
            })}
            <p className="border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-400">{doc.attribution}</p>
          </div>
        )}
      </div>
    </div>
  )
}
