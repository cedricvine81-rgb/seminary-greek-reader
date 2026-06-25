'use client'
import { useRef, useState } from 'react'
import { StickyNote, Loader2, Trash2, Maximize2, X } from 'lucide-react'
import { NoteComposer } from './NoteComposer'
import { useNoteFontScale } from '@/lib/note-prefs'
import { toNoteHtml, isHtmlEmpty } from '@/lib/note-html'

/**
 * Per-verse note affordance for any reading view. The icon is brand-blue/filled
 * when a note exists. Clicking opens an inline popover (auto-positioned to stay on
 * screen, auto-growing editor with a Markdown toolbar + font size); an Expand
 * button opens a roomy modal with a live preview for long notes. Notes are anchored
 * to (book, chapter, verse), so they're shared across every text/version.
 */
export function VerseNoteButton({ book, chapter, verse, noted, onChanged }: {
  book: string; chapter: number; verse: number; noted: boolean; onChanged?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ id: string; body: string } | null>(null)
  const [body, setBody] = useState('')
  const [place, setPlace] = useState<{ v: 'top' | 'bottom'; h: 'left' | 'right' }>({ v: 'bottom', h: 'left' })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const [fontScale, setFontScale] = useNoteFontScale()

  const reference = `${book} ${chapter}:${verse}`

  async function openEditor() {
    // Position the popover so it never falls off the viewport.
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) setPlace({ v: r.bottom + 300 > window.innerHeight ? 'top' : 'bottom', h: r.left + 290 > window.innerWidth ? 'right' : 'left' })
    setOpen(true)
    if (!noted) { setNote(null); setBody(''); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`)
      const d = await res.json()
      const n = (d.notes || [])[0]
      setNote(n ? { id: n.id, body: n.body } : null)
      setBody(n?.body ?? '')
    } catch { /* leave empty */ } finally { setLoading(false) }
  }

  function close() { setOpen(false); setExpanded(false) }

  async function save() {
    setSaving(true)
    try {
      if (note) {
        if (isHtmlEmpty(body)) await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' })
        else if (body !== note.body) await fetch(`/api/notes?id=${note.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
      } else if (!isHtmlEmpty(body)) {
        await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ book, chapter, verse, body }) })
      }
      onChanged?.()
      close()
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!note) { close(); return }
    setSaving(true)
    try { await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' }); onChanged?.(); close() }
    finally { setSaving(false) }
  }

  const footer = (
    <div className="flex items-center gap-2 mt-2">
      <button type="button" onClick={save} disabled={saving}
        className="rounded bg-brand-600 text-white text-xs px-2.5 py-1 hover:bg-brand-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
      <button type="button" onClick={close} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      {note && <button type="button" onClick={remove} className="ml-auto text-gray-400 hover:text-red-600" title="Delete note"><Trash2 size={13} /></button>}
    </div>
  )

  return (
    <span ref={wrapRef} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => (open ? close() : openEditor())}
        title={noted ? 'Edit note' : 'Add a note'}
        className={`p-0.5 rounded transition-colors ${noted ? 'text-brand-600 hover:text-brand-700' : 'text-gray-300 hover:text-brand-500'}`}
      >
        <StickyNote size={14} fill={noted ? 'currentColor' : 'none'} />
      </button>

      {/* Inline popover */}
      {open && !expanded && (
        <>
          <span className="fixed inset-0 z-40" onClick={close} />
          <div
            className={`absolute z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-2 ${place.h === 'right' ? 'right-0' : 'left-0'} ${place.v === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-gray-400">{reference}</span>
              <button type="button" onClick={() => setExpanded(true)} title="Expand" className="text-gray-400 hover:text-gray-700"><Maximize2 size={13} /></button>
            </div>
            {loading ? (
              <p className="text-xs text-gray-400 p-2"><Loader2 size={12} className="inline animate-spin" /> Loading…</p>
            ) : (
              <>
                <NoteComposer initialHtml={toNoteHtml(body)} onChange={setBody} autoFocus fontScale={fontScale} onFontScale={setFontScale} maxHeight={260} />
                {footer}
              </>
            )}
          </div>
        </>
      )}

      {/* Expanded modal — roomy editor + live preview for long notes */}
      {open && expanded && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/30 p-4 overflow-y-auto" onClick={close}>
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl p-4 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">Note · {reference}</h3>
              <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <NoteComposer initialHtml={toNoteHtml(body)} onChange={setBody} autoFocus fontScale={fontScale} onFontScale={setFontScale} minHeight={320} maxHeight={540} />
            {footer}
          </div>
        </div>
      )}
    </span>
  )
}
