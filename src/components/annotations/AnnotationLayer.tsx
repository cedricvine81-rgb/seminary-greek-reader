'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { fingerprint } from '@/lib/i18n/content'
import { resolveAnchor, hasNote, type BlockAnnotationRecord } from '@/lib/block-annotations'
import { offsetWithin } from '@/components/highlights/range-utils'
import { DEFAULT_HIGHLIGHT_COLOR, type HighlightColor } from '@/lib/highlight-colors'
import { useBlockSelection } from './useBlockSelection'
import { AnnotationPopup } from './AnnotationPopup'
import { caretOffsetAt, canPaint, paint, unpaint, type PaintRange } from './paint'

/** A block that has something to show in the margin, and where it sits in the container. */
interface Marker { blockId: string; top: number; count: number; detached: boolean }

/**
 * Makes a body of the app's own prose annotatable: drag to highlight, write a note, hover to
 * read it back.
 *
 * Wraps the chapter content and needs nothing from it but `data-ann-block="<stable id>"` on
 * each block — the ids the translation pipeline already assigns, which is why this works
 * across all 21 Greek and 23 Hebrew chapters without touching a single chapter file.
 *
 * Anchors are resolved against the DOM as it stands, every time it changes, because three
 * separate things move this prose under the reader: switching language re-renders every
 * block from the Spanish catalogue, the Beginning/Intermediate toggle adds and removes whole
 * sections, and editing the chapter changes the words themselves. Only the third invalidates
 * a note, and `resolveAnchor` is what tells them apart.
 */
export function AnnotationLayer({ page, surface = 'morphology', children }: {
  page: string
  surface?: string
  children: React.ReactNode
}) {
  const t = useT()
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<BlockAnnotationRecord[]>([])
  const [enabled, setEnabled] = useState(false)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [hover, setHover] = useState<{ x: number; y: number; body: string } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const { popup, open, close } = useBlockSelection(containerRef, enabled)

  // One request does double duty: it loads the page's annotations and tells us whether this
  // reader may have any at all (a 401/402 means signed out or not subscribed — in which case
  // the whole layer stays inert rather than showing controls that would fail on save).
  useEffect(() => {
    let alive = true
    fetch(`/api/annotations?surface=${encodeURIComponent(surface)}&page=${encodeURIComponent(page)}`)
      .then(async r => {
        if (!alive) return
        if (!r.ok) { setEnabled(false); setItems([]); return }
        const d = await r.json()
        setEnabled(true)
        setItems(d.annotations ?? [])
      })
      .catch(() => { if (alive) setEnabled(false) })
    return () => { alive = false }
  }, [surface, page])

  /** Re-resolve every anchor against the live DOM, then paint and place the margin markers. */
  const resolve = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const ranges: PaintRange[] = []
    const byBlock = new Map<string, { top: number; count: number; detached: boolean }>()
    const containerTop = container.getBoundingClientRect().top

    for (const a of items) {
      const block = container.querySelector<HTMLElement>(`[data-ann-block="${CSS.escape(a.blockId)}"]`)
      // Not on screen at all — a section the level toggle has hidden. Its notes are not
      // lost, they are just not here; the count in the margin would be a lie about a block
      // the reader cannot see, so skip it entirely.
      if (!block) continue
      const state = resolveAnchor(a, block.textContent ?? '', locale)
      if (state.kind === 'exact' || state.kind === 'repaired') {
        ranges.push({ color: a.color, withNote: hasNote(a), start: state.start, end: state.end, block })
      }
      if (hasNote(a) || state.kind === 'detached') {
        const top = block.getBoundingClientRect().top - containerTop
        const cur = byBlock.get(a.blockId)
        byBlock.set(a.blockId, {
          top: cur?.top ?? top,
          count: (cur?.count ?? 0) + (hasNote(a) ? 1 : 0),
          detached: (cur?.detached ?? false) || state.kind === 'detached',
        })
      }
    }
    paint(ranges)
    // Array.from, not a spread — this tsconfig's target rejects Map-iterator spreads, and
    // `next dev` does not run the check that `next build` (i.e. Vercel) does.
    setMarkers(Array.from(byBlock, ([blockId, m]) => ({ blockId, ...m })))
  }, [items, locale])

  // Resolve after every render that could have moved the prose. A MutationObserver rather
  // than a dependency list because the things that move it — the level toggle, a chapter
  // swap, the Spanish catalogue arriving a moment after first paint — are changes inside
  // `children`, which this component does not re-render for.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    resolve()
    let frame = 0
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(resolve)
    })
    obs.observe(container, { childList: true, subtree: true, characterData: true })
    return () => { obs.disconnect(); cancelAnimationFrame(frame) }
  }, [resolve])

  useEffect(() => () => unpaint(), [])

  /** Which annotation, if any, covers the point — the hit test a painted range can't do. */
  const annotationAt = useCallback((x: number, y: number): BlockAnnotationRecord | null => {
    const container = containerRef.current
    if (!container) return null
    const caret = caretOffsetAt(x, y)
    if (!caret || !container.contains(caret.node)) return null
    const el = caret.node.nodeType === Node.ELEMENT_NODE ? (caret.node as HTMLElement) : caret.node.parentElement
    const block = el?.closest<HTMLElement>('[data-ann-block]')
    if (!block) return null
    const offset = offsetWithin(block, caret.node, caret.offset)
    for (const a of items) {
      if (a.blockId !== block.dataset.annBlock) continue
      const state = resolveAnchor(a, block.textContent ?? '', locale)
      if (state.kind !== 'exact' && state.kind !== 'repaired') continue
      if (offset >= state.start && offset < state.end) return a
    }
    return null
  }, [items, locale])

  // Hover preview (desktop). Guarded on a fine pointer: on a touch screen a "hover" is
  // synthesised from the tap that is already opening the popover, so it would flash a
  // tooltip under the reader's finger and then vanish.
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const container = containerRef.current
    if (!container) return
    let frame = 0
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const a = annotationAt(e.clientX, e.clientY)
        setHover(a && hasNote(a) ? { x: e.clientX, y: e.clientY, body: a.body } : null)
      })
    }
    container.addEventListener('mousemove', onMove)
    return () => { container.removeEventListener('mousemove', onMove); cancelAnimationFrame(frame) }
  }, [enabled, annotationAt])

  // Click a highlight to open it. Ignored while a selection is live, so the click that ends
  // a drag doesn't immediately reopen what it just created.
  useEffect(() => {
    if (!enabled) return
    const container = containerRef.current
    if (!container) return
    function onClick(e: MouseEvent) {
      if (!window.getSelection()?.isCollapsed) return
      const a = annotationAt(e.clientX, e.clientY)
      if (!a) return
      setOpenId(a.id)
      open(a.id, e.clientX, e.clientY)
      setHover(null)
    }
    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [enabled, annotationAt, open])

  async function create(color: HighlightColor, body: string) {
    if (popup?.kind !== 'new') return
    const { blockId, start, end, quote, blockText } = popup.sel
    const payload = {
      surface, page, blockId, locale,
      startOffset: start, endOffset: end, quote,
      fp: fingerprint(blockText), color, body,
    }
    const r = await fetch('/api/annotations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const d = await r.json().catch(() => ({}))
    if (d.annotation) setItems(prev => [...prev, d.annotation])
  }

  async function update(id: string, patch: { color?: string; body?: string }) {
    setItems(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a))
    await fetch(`/api/annotations?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    }).catch(() => {})
  }

  async function remove(id: string) {
    setItems(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/annotations?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const openItem = openId ? items.find(a => a.id === openId) ?? null : null

  return (
    <div ref={containerRef} className="relative">
      {children}

      {/* Margin markers: the only affordance that must work everywhere. A note is reachable
          from here when its range cannot be painted at all — a browser without the
          highlight API, a note written in the other language, or one whose words have been
          edited away. */}
      {markers.length > 0 && (
        <div className="pointer-events-none absolute inset-y-0 left-0 print:hidden" aria-hidden={false}>
          {markers.map(m => (
            <button
              key={m.blockId}
              type="button"
              style={{ top: m.top }}
              onClick={e => {
                const first = items.find(a => a.blockId === m.blockId && hasNote(a))
                if (!first) return
                setOpenId(first.id)
                open(first.id, e.clientX, e.clientY)
              }}
              title={m.detached ? t('ann.detached') : t('ann.noteCount', { count: m.count })}
              className={`pointer-events-auto absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold transition-colors sm:-left-5 ${
                m.detached
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-brand-100 text-brand-700 hover:bg-brand-200'}`}
            >
              {m.detached ? '!' : m.count}
            </button>
          ))}
        </div>
      )}

      {hover && !popup && (
        <div
          className="pointer-events-none fixed z-40 max-w-xs -translate-x-1/2 rounded-lg border border-gray-200 bg-popover px-2.5 py-1.5 text-xs leading-snug text-gray-700 shadow-md"
          style={{ left: hover.x, top: hover.y + 18 }}
        >
          {hover.body}
        </div>
      )}

      {popup?.kind === 'new' && (
        <AnnotationPopup
          x={popup.x} y={popup.y}
          color={DEFAULT_HIGHLIGHT_COLOR}
          body=""
          canDelete={false}
          onColor={c => { create(c, ''); close() }}
          onSave={body => { if (body.trim()) create(DEFAULT_HIGHLIGHT_COLOR, body) }}
          onDelete={close}
          onClose={close}
        />
      )}

      {popup?.kind === 'edit' && openItem && (
        <AnnotationPopup
          x={popup.x} y={popup.y}
          color={openItem.color}
          body={openItem.body}
          canDelete
          onColor={c => update(openItem.id, { color: c })}
          onSave={body => { if (body !== openItem.body) update(openItem.id, { body }) }}
          onDelete={() => { remove(openItem.id); setOpenId(null); close() }}
          onClose={() => { setOpenId(null); close() }}
        />
      )}

      {/* Said once, quietly, and only to someone who has annotations that cannot be drawn. */}
      {enabled && items.length > 0 && !canPaint() && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('ann.noPaintSupport')}</p>
      )}
    </div>
  )
}
