'use client'
import { useState } from 'react'
import { StickyNote, Loader2, Trash2 } from 'lucide-react'

/**
 * A small per-verse note affordance shown next to a verse reference in any reading
 * view. The icon is filled when a note exists (`noted`). Clicking opens an inline
 * popover that lazily loads the note for this exact verse and lets the user write,
 * edit, or delete it. Notes are anchored to the canonical (book, chapter, verse),
 * so they're shared across every text/version.
 */
export function VerseNoteButton({ book, chapter, verse, noted, onChanged }: {
  book: string; chapter: number; verse: number; noted: boolean; onChanged?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<{ id: string; body: string } | null>(null)
  const [body, setBody] = useState('')

  async function openPopover() {
    setOpen(true)
    if (!noted) { setNote(null); setBody(''); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/notes?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`)
      const d = await r.json()
      const n = (d.notes || [])[0]
      setNote(n ? { id: n.id, body: n.body } : null)
      setBody(n?.body ?? '')
    } catch { /* leave empty */ } finally { setLoading(false) }
  }

  async function save() {
    setSaving(true)
    try {
      if (note) {
        if (body.trim() === '') await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' })
        else if (body !== note.body) await fetch(`/api/notes?id=${note.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
      } else if (body.trim() !== '') {
        await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ book, chapter, verse, body }) })
      }
      onChanged?.()
      setOpen(false)
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!note) { setOpen(false); return }
    setSaving(true)
    try { await fetch(`/api/notes?id=${note.id}`, { method: 'DELETE' }); onChanged?.(); setOpen(false) }
    finally { setSaving(false) }
  }

  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPopover())}
        title={noted ? 'Edit note' : 'Add a note'}
        className={`p-0.5 rounded transition-colors ${noted ? 'text-brand-600 hover:text-brand-700' : 'text-gray-300 hover:text-brand-500'}`}
      >
        <StickyNote size={14} fill={noted ? 'currentColor' : 'none'} />
      </button>
      {open && (
        <>
          {/* click-away */}
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 left-0 mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-lg p-2" onClick={e => e.stopPropagation()}>
            {loading ? (
              <p className="text-xs text-gray-400 p-2"><Loader2 size={12} className="inline animate-spin" /> Loading…</p>
            ) : (
              <>
                <textarea autoFocus value={body} onChange={e => setBody(e.target.value)} rows={3}
                  placeholder="Write a note for this verse…"
                  className="w-full text-sm border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400" />
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" onClick={save} disabled={saving}
                    className="rounded bg-brand-600 text-white text-xs px-2.5 py-1 hover:bg-brand-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                  <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  {note && <button type="button" onClick={remove} className="ml-auto text-gray-400 hover:text-red-600" title="Delete note"><Trash2 size={13} /></button>}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </span>
  )
}
