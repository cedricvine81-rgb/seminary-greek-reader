'use client'
import { useState } from 'react'
import { StickyNote, Loader2, Trash2, X } from 'lucide-react'
import { NoteComposer } from './NoteComposer'
import { useNoteFontScale } from '@/lib/note-prefs'
import { toNoteHtml, isHtmlEmpty } from '@/lib/note-html'

/**
 * Per-verse note affordance for any reading view. The icon is brand-blue/filled
 * when a note exists. Clicking opens the roomy note editor directly (a modal with a
 * Markdown toolbar, font size, and a folder selector so the note can be filed without
 * leaving the reader). Notes are anchored to (book, chapter, verse), so they're shared
 * across every text/version.
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

  const reference = `${book} ${chapter}:${verse}`

  async function openEditor() {
    setOpen(true)
    // Load the user's folders so the note can be filed from here (cheap enough per open).
    fetch('/api/notes')
      .then(r => r.json())
      .then(d => setFolders((d.folders || []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))))
      .catch(() => { /* leave folder list empty */ })
    if (!noted) { setNote(null); setBody(''); setFolderId(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`)
      const d = await res.json()
      const n = (d.notes || [])[0]
      setNote(n ? { id: n.id, body: n.body, folderId: n.folderId ?? null } : null)
      setBody(n?.body ?? '')
      setFolderId(n?.folderId ?? null)
    } catch { /* leave empty */ } finally { setLoading(false) }
  }

  function close() { setOpen(false) }

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

  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => (open ? close() : openEditor())}
        title={noted ? 'Edit note' : 'Add a note'}
        className={`p-0.5 rounded transition-colors ${noted ? 'text-brand-600 hover:text-brand-700' : 'text-gray-300 hover:text-brand-500'}`}
      >
        <StickyNote size={14} fill={noted ? 'currentColor' : 'none'} />
      </button>

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
