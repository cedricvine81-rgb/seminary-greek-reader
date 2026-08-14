'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Highlighter, StickyNote } from 'lucide-react'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { fingerprint } from '@/lib/i18n/content'
import { resolveAnchor, hasNote, isBlockNote, type BlockAnnotationRecord } from '@/lib/block-annotations'
import { offsetWithin } from '@/components/highlights/range-utils'
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLORS, type HighlightColor } from '@/lib/highlight-colors'
import { useBlockSelection } from './useBlockSelection'
import { AnnotationPopup } from './AnnotationPopup'
import { NoteSheet } from './NoteSheet'
import { caretOffsetAt, canPaint, paint, unpaint, type PaintRange } from './paint'

/** One rung of the margin rail: every annotatable block gets one, whether or not it has a
 *  note yet, so the way in is visible without knowing the drag gesture exists. */
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
  // The expanded note pane — the surface Scribble and the ink pad need.
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)
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
    const containerTop = container.getBoundingClientRect().top

    // A rung for EVERY block on screen, in document order — the rail is the affordance, so
    // it cannot be built from the annotations that happen to exist. Blocks the level toggle
    // has hidden aren't in the DOM and so get no rung, which is right: an icon beside a
    // paragraph the reader cannot see would be pointing at nothing.
    const byBlock = new Map<string, { top: number; count: number; detached: boolean }>()
    for (const el of Array.from(container.querySelectorAll<HTMLElement>('[data-ann-block]'))) {
      const id = el.dataset.annBlock!
      if (byBlock.has(id)) continue
      byBlock.set(id, { top: el.getBoundingClientRect().top - containerTop, count: 0, detached: false })
    }

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
      const cur = byBlock.get(a.blockId)
      if (cur) {
        cur.count += hasNote(a) ? 1 : 0
        cur.detached = cur.detached || state.kind === 'detached'
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

  async function update(id: string, patch: { color?: string; body?: string; ink?: string }) {
    setItems(prev => prev.map(a => a.id === id
      ? { ...a, ...patch, ...(patch.ink !== undefined ? { ink: patch.ink === '' ? null : patch.ink } : {}) }
      : a))
    await fetch(`/api/annotations?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    }).catch(() => {})
  }

  async function remove(id: string) {
    setItems(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/annotations?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  /**
   * Open the note for a block from its margin icon. If the block has none yet, one is
   * created with a ZERO-LENGTH anchor — a note about the paragraph rather than about any
   * particular words, which is what an icon beside it means, and which is why nothing gets
   * painted over the text.
   */
  async function openBlock(blockId: string) {
    const existing = items.find(a => a.blockId === blockId && hasNote(a))
      ?? items.find(a => a.blockId === blockId && isBlockNote(a))
    if (existing) { setSheetId(existing.id); return }
    const block = containerRef.current?.querySelector<HTMLElement>(`[data-ann-block="${CSS.escape(blockId)}"]`)
    if (!block) return
    const r = await fetch('/api/annotations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surface, page, blockId, locale,
        startOffset: 0, endOffset: 0, quote: '',
        fp: fingerprint(block.textContent ?? ''), color: DEFAULT_HIGHLIGHT_COLOR, body: '',
      }),
    })
    const d = await r.json().catch(() => ({}))
    if (d.annotation) { setItems(prev => [...prev, d.annotation]); setSheetId(d.annotation.id) }
  }

  const noteCount = items.filter(hasNote).length
  const openItem = openId ? items.find(a => a.id === openId) ?? null : null
  const sheetItem = sheetId ? items.find(a => a.id === sheetId) ?? null : null

  return (
    <div ref={containerRef} className="relative">
      {/* The feature has to announce itself. Drag-to-annotate is invisible until you already
          know it is there, and the first report from a real reader was, exactly, "nothing is
          visible" — the gesture worked and nothing on the page said so. One muted line,
          shown only to a reader who could actually save an annotation. */}
      {enabled && (
        <div className="mb-3 print:hidden">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-gray-400">
            <Highlighter size={12} className="shrink-0" />
            {t('ann.gestureHint')}
            {noteCount > 0 && (
              // A written note MUST be reachable from a plain, labelled control. The margin
              // dot was the only way in, and the second report from a real reader was "I
              // wrote a note but cannot see how to access what I wrote". A list also reaches
              // the notes a marker structurally cannot: a block the level toggle has hidden,
              // and a note whose range can't be painted at all.
              <button
                type="button"
                onClick={() => setListOpen(o => !o)}
                className="font-medium text-brand-600 underline decoration-dotted underline-offset-2 hover:text-brand-800"
              >
                {t('ann.chapterNotes', { count: noteCount })}
              </button>
            )}
          </p>

          {listOpen && (
            <ul className="mt-2 space-y-1.5 rounded-lg border border-gray-200 bg-surface p-2.5">
              {items.filter(hasNote).map(a => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      containerRef.current
                        ?.querySelector(`[data-ann-block="${CSS.escape(a.blockId)}"]`)
                        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                      setSheetId(a.id)
                    }}
                    className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${HIGHLIGHT_COLORS[(a.color as HighlightColor)]?.swatch ?? 'bg-yellow-300'}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs italic text-gray-500">“{a.quote}”</span>
                      <span className="block truncate text-sm text-gray-800">
                        {a.body.trim() || t('ann.handwrittenOnly')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {children}

      {/* The margin rail: a note icon beside every paragraph, the same gesture the Reader
          uses for verses. Drag-to-highlight still works and is still the way to mark
          particular WORDS, but it is discoverable only if you already know it — an icon is
          not. A rung also reaches what a painted highlight cannot: a note written in the
          other language, one whose words have been edited away, and any note at all in a
          browser without the CSS Custom Highlight API. */}
      {enabled && markers.length > 0 && (
        <div className="pointer-events-none absolute inset-y-0 right-0 print:hidden">
          {markers.map(m => (
            <button
              key={m.blockId}
              type="button"
              style={{ top: m.top }}
              onClick={() => openBlock(m.blockId)}
              title={m.detached ? t('ann.detached')
                : m.count > 0 ? t('ann.noteCount', { count: m.count })
                : t('ann.addNoteHere')}
              aria-label={m.count > 0 ? t('ann.noteCount', { count: m.count }) : t('ann.addNoteHere')}
              className={`pointer-events-auto absolute right-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all ${
                m.detached
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300 hover:bg-amber-200'
                  : m.count > 0
                    ? 'bg-brand-100 text-brand-700 ring-1 ring-inset ring-brand-300 hover:bg-brand-200'
                    // Empty rungs stay faint so 90 of them read as a margin rule rather than
                    // as 90 controls, and come forward on hover.
                    : 'text-gray-300 opacity-60 hover:bg-brand-50 hover:text-brand-600 hover:opacity-100'}`}
            >
              {m.detached ? '!' : m.count > 0 ? m.count : <StickyNote size={12} />}
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
          mode="new"
          x={popup.x} y={popup.y}
          color={DEFAULT_HIGHLIGHT_COLOR}
          body=""
          canDelete={false}
          onCommit={(c, body) => create(c, body)}
          onDelete={close}
          onClose={close}
        />
      )}

      {popup?.kind === 'edit' && openItem && (
        <AnnotationPopup
          mode="edit"
          x={popup.x} y={popup.y}
          color={openItem.color}
          body={openItem.body}
          canDelete
          onColor={c => update(openItem.id, { color: c })}
          onCommit={(_c, body) => { if (body !== openItem.body) update(openItem.id, { body }) }}
          onDelete={() => { remove(openItem.id); setOpenId(null); close() }}
          onClose={() => { setOpenId(null); close() }}
          onExpand={() => { setSheetId(openItem.id); close() }}
        />
      )}

      {sheetItem && (
        <NoteSheet
          quote={sheetItem.quote || t('ann.wholeParagraph')}
          color={sheetItem.color}
          body={sheetItem.body}
          ink={sheetItem.ink}
          onSave={patch => update(sheetItem.id, patch)}
          onDelete={() => { remove(sheetItem.id); setSheetId(null) }}
          onClose={() => { setSheetId(null); setOpenId(null) }}
        />
      )}

      {/* Said once, quietly, and only to someone who has annotations that cannot be drawn. */}
      {enabled && items.length > 0 && !canPaint() && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('ann.noPaintSupport')}</p>
      )}
    </div>
  )
}
