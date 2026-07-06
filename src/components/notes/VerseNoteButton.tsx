'use client'
import { useRef, useState } from 'react'
import { StickyNote, Loader2, Trash2, X } from 'lucide-react'
import { NoteComposer } from './NoteComposer'
import { useNoteFontScale } from '@/lib/note-prefs'
import { toNoteHtml, isHtmlEmpty, sanitizeNoteHtml } from '@/lib/note-html'

/**
 * Per-verse note affordance for any reading view. The icon is brand-blue/filled
 * when a note exists. Hovering a filled icon shows the note read-only in a small
 * bubble (desktop only — touch devices have no hover and fall back to tapping);
 * clicking opens the roomy editor (Markdown toolbar, font size, folder selector).
 * Notes are anchored to (book, chapter, verse), so they're shared across every text.
 */
interface FolderLite { id: string; name: string }

export function VerseNoteButton({ book, chapter, verse, noted, onChanged }: {
  book: string; chapter: number; verse: number; noted: boolean; onChanged?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ id: string; body: string; folderId: string | null } | null>(null)
  const [body, setBody] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderLite[]>([])
  const [fontScale, setFontScale] = useNoteFontScale()

  // Hover preview: a read-only bubble on pointer hover (desktop). The note body is
  // fetched once on first hover and cached until the note is edited or removed.
  const [showPreview, setShowPreview] = useState(false)
  const [previewBody, setPreviewBody] = useState<string | null>(null)
  const [place, setPlace] = useState<{ v: 'top' | 'bottom'; h: 'left' | 'right' }>({ v: 'bottom', h: 'left' })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reference = `${book} ${chapter}:${verse}`

  async function fetchNote(): Promise<{ id: string; body: string; folderId: string | null } | null> {
    const res = await fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`)
    const d = await res.json()
    const n = (d.notes || [])[0]
    return n ? { id: n.id, body: n.body, folderId: n.folderId ?? null } : null
  }

  async function openEditor() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }
    setShowPreview(false)
    setOpen(true)
    // Load the user's folders so the note can be filed from here (cheap enough per open).
    fetch('/api/notes')
      .then(r => r.json())
      .then(d => setFolders((d.folders || []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))))
      .catch(() => { /* leave folder list empty */ })
    if (!noted) { setNote(null); setBody(''); setFolderId(null); return }
    setLoading(true)
    try {
      const n = await fetchNote()
      setNote(n)
      setBody(n?.body ?? '')
      setFolderId(n?.folderId ?? null)
    } catch { /* leave empty */ } finally { setLoading(false) }
  }

  function close() { setOpen(false) }

  // Hover in: after a short delay (so a passing pointer doesn't flash the bubble),
  // show the preview and fetch the body once. Delay is cancelled on hover out.
  function onEnter() {
    if (!noted || open) return
    const r = wrapRef.current?.getBoundingClientRect()
    if (r) setPlace({ v: r.bottom + 240 > window.innerHeight ? 'top' : 'bottom', h: r.left + 300 > window.innerWidth ? 'right' : 'left' })
    hoverTimer.current = setTimeout(async () => {
      setShowPreview(true)
      if (previewBody === null) {
        try { const n = await fetchNote(); setPreviewBody(n?.body ?? '') }
        catch { setPreviewBody('') }
      }
    }, 250)
  }
  function onLeave() {
    if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null }
    setShowPreview(false)
  }

  async function save() {
    setSaving(true)
    try {
      if (note) {
        if (isHtmlEmpty(body)) await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' })
        else if (body !== note.body || folderId !== note.folderId)
          await fetch(`/api/notes?id=${note.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, folderId }) })
      } else if (!isHtmlEmpty(body)) {
        await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ book, chapter, verse, body, folderId }) })
      }
      setPreviewBody(null) // note changed — invalidate the hover-preview cache
      onChanged?.()
      close()
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!note) { close(); return }
    setSaving(true)
    try { await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' }); setPreviewBody(null); onChanged?.(); close() }
    finally { setSaving(false) }
  }

  return (
    <span ref={wrapRef} className="relative inline-block align-middle" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        onClick={() => (open ? close() : openEditor())}
        title={noted ? 'Edit note' : 'Add a note'}
        className={`p-0.5 rounded transition-colors ${noted ? 'text-brand-600 hover:text-brand-700' : 'text-gray-300 hover:text-brand-500'}`}
      >
        <StickyNote size={14} fill={noted ? 'currentColor' : 'none'} />
      </button>

      {/* Read-only hover preview (desktop). Padding (not margin) bridges the gap to the
          icon so moving the pointer onto the bubble doesn't dismiss it. */}
      {noted && showPreview && !open && (
        <div
          className={`absolute z-50 ${place.h === 'right' ? 'right-0' : 'left-0'} ${place.v === 'top' ? 'bottom-full pb-1' : 'top-full pt-1'}`}
          role="tooltip"
        >
          <div className="w-72 max-w-[80vw] rounded-lg border border-gray-200 bg-white p-2.5 shadow-lg">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{reference}</div>
            {previewBody === null ? (
              <p className="text-xs text-gray-400"><Loader2 size={12} className="inline animate-spin" /> Loading…</p>
            ) : isHtmlEmpty(toNoteHtml(previewBody)) ? (
              <p className="text-xs italic text-gray-400">Empty note</p>
            ) : (
              <div
                className="prose-notes max-h-52 overflow-y-auto text-sm leading-snug text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(toNoteHtml(previewBody)) }}
              />
            )}
            <p className="mt-1.5 border-t border-gray-100 pt-1 text-[10px] text-gray-400">Click to edit</p>
          </div>
        </div>
      )}

      {/* Roomy editor modal — opened directly (no small popover step). */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center bg-black/30 p-4 overflow-y-auto" onClick={close}>
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl p-4 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-800">Note · {reference}</h3>
              <label className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                <span className="hidden sm:inline">Folder</span>
                <select
                  value={folderId ?? ''}
                  onChange={e => setFolderId(e.target.value || null)}
                  className="rounded border border-gray-200 text-xs text-gray-600 px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                  title="File this note in a folder"
                >
                  <option value="">Unfiled</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
              <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {loading ? (
              <p className="text-xs text-gray-400 p-2"><Loader2 size={12} className="inline animate-spin" /> Loading…</p>
            ) : (
              <NoteComposer initialHtml={toNoteHtml(body)} onChange={setBody} autoFocus fontScale={fontScale} onFontScale={setFontScale} minHeight={320} maxHeight={540} />
            )}

            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={save} disabled={saving}
                className="rounded bg-brand-600 text-white text-xs px-2.5 py-1 hover:bg-brand-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={close} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              {note && <button type="button" onClick={remove} className="ml-auto text-gray-400 hover:text-red-600" title="Delete note"><Trash2 size={13} /></button>}
            </div>
          </div>
        </div>
      )}
    </span>
  )
}
