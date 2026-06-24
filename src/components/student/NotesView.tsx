'use client'
import { useCallback, useEffect, useState } from 'react'
import { Folder, FolderPlus, Trash2, Pencil, Check, X, StickyNote, Loader2 } from 'lucide-react'
import { NOTE_COLORS, NOTE_COLOR_KEYS, colorOf, type NoteColor } from '@/lib/note-colors'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { useNoteFontScale } from '@/lib/note-prefs'

interface NoteT { id: string; folderId: string | null; book: string; chapter: number; verse: number; verseEnd: number | null; body: string }
interface FolderT { id: string; name: string; color: string; _count: { notes: number } }
interface Book { osisId: string; name: string }
export interface NoteAnchor { book: string; name: string; chapter: number; verseStart: number; verseEnd: number }

const MAX_PASSAGE_VERSES = 80

export function NotesView({ isAuthenticated, anchor, books, onJumpToPassage }: {
  isAuthenticated: boolean
  anchor: NoteAnchor | null
  books: Book[]
  onJumpToPassage: (ref: string) => void
}) {
  const [folders, setFolders] = useState<FolderT[]>([])
  const [notes, setNotes] = useState<NoteT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFolder, setActiveFolder] = useState<string>('all') // 'all' | 'unfiled' | folderId
  const [newFolder, setNewFolder] = useState<{ name: string; color: NoteColor } | null>(null)
  const [editFolder, setEditFolder] = useState<{ id: string; name: string; color: NoteColor } | null>(null)

  const bookName = useCallback((osis: string) => books.find(b => b.osisId === osis)?.name ?? osis, [books])

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    try {
      const res = await fetch('/api/notes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setFolders(data.folders); setNotes(data.notes)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [isAuthenticated])

  useEffect(() => { load() }, [load])

  /* ── Folder ops ── */
  async function saveNewFolder() {
    if (!newFolder?.name.trim()) return
    await fetch('/api/notes/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newFolder) })
    setNewFolder(null); load()
  }
  async function saveEditFolder() {
    if (!editFolder) return
    await fetch(`/api/notes/folders?id=${editFolder.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editFolder.name, color: editFolder.color }) })
    setEditFolder(null); load()
  }
  async function removeFolder(id: string) {
    if (!confirm('Delete this folder? Its notes are kept and moved to “Unfiled.”')) return
    await fetch(`/api/notes/folders?id=${id}`, { method: 'DELETE' })
    if (activeFolder === id) setActiveFolder('all')
    setEditFolder(null); load()
  }

  if (!isAuthenticated) {
    return <p className="text-sm text-gray-500 py-10 text-center">Please sign in to write and save study notes.</p>
  }
  if (loading) return <p className="text-sm text-gray-400 py-10 text-center"><Loader2 size={16} className="inline animate-spin" /> Loading notes…</p>

  // Notes for the current passage (same book/chapter, verse within range).
  const passageNotes = anchor
    ? notes.filter(n => n.book === anchor.book && n.chapter === anchor.chapter && n.verse >= anchor.verseStart && n.verse <= anchor.verseEnd)
    : []
  const passageVerseNote = (v: number) => passageNotes.find(n => n.verse === v)
  const verseList: number[] = anchor
    ? Array.from({ length: Math.min(anchor.verseEnd - anchor.verseStart + 1, MAX_PASSAGE_VERSES) }, (_, i) => anchor.verseStart + i)
    : []

  const filtered = notes.filter(n =>
    activeFolder === 'all' ? true : activeFolder === 'unfiled' ? !n.folderId : n.folderId === activeFolder)

  return (
    <div className="max-w-3xl space-y-8 pb-10">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      {/* ── This passage ── */}
      {anchor && (
        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Notes on {anchor.name} {anchor.chapter}{anchor.verseStart === anchor.verseEnd ? `:${anchor.verseStart}` : `:${anchor.verseStart}–${anchor.verseEnd}`}</h3>
          <p className="text-xs text-gray-400 mb-3">A note here stays attached to the verse — it reappears whenever you open that verse, in any version.</p>
          <div className="space-y-2">
            {verseList.map(v => (
              <NoteEditor key={passageVerseNote(v)?.id ?? `new-${anchor.book}-${anchor.chapter}-${v}`}
                existing={passageVerseNote(v)}
                anchor={{ book: anchor.book, chapter: anchor.chapter, verse: v, label: `${anchor.name} ${anchor.chapter}:${v}` }}
                folders={folders} onChanged={load} />
            ))}
          </div>
        </section>
      )}

      {/* ── Notebook ── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">My notebook</h3>
        <div className="flex items-center flex-wrap gap-1.5 mb-3">
          <Chip active={activeFolder === 'all'} onClick={() => setActiveFolder('all')} label={`All (${notes.length})`} />
          <Chip active={activeFolder === 'unfiled'} onClick={() => setActiveFolder('unfiled')} label={`Unfiled (${notes.filter(n => !n.folderId).length})`} />
          {folders.map(f => (
            <span key={f.id} className="inline-flex items-center">
              <button onClick={() => setActiveFolder(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${activeFolder === f.id ? colorOf(f.color).chip : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <span className={`h-2 w-2 rounded-full ${colorOf(f.color).dot}`} /> {f.name} ({f._count.notes})
              </button>
              {activeFolder === f.id && (
                <button onClick={() => setEditFolder({ id: f.id, name: f.name, color: (f.color as NoteColor) })} className="ml-1 text-gray-400 hover:text-gray-700" title="Edit folder"><Pencil size={12} /></button>
              )}
            </span>
          ))}
          {newFolder === null
            ? <button onClick={() => setNewFolder({ name: '', color: 'blue' })} className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"><FolderPlus size={12} /> New folder</button>
            : null}
        </div>

        {/* New / edit folder inline form */}
        {(newFolder || editFolder) && (
          <FolderForm
            value={newFolder ?? { name: editFolder!.name, color: editFolder!.color }}
            onChange={v => newFolder ? setNewFolder(v) : setEditFolder({ id: editFolder!.id, ...v })}
            onSave={newFolder ? saveNewFolder : saveEditFolder}
            onCancel={() => { setNewFolder(null); setEditFolder(null) }}
            onDelete={editFolder ? () => removeFolder(editFolder.id) : undefined}
          />
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-6">No notes here yet. Open a passage above and jot one down, or write directly on a verse.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <NoteEditor key={n.id} existing={n}
                anchor={{ book: n.book, chapter: n.chapter, verse: n.verse, label: `${bookName(n.book)} ${n.chapter}:${n.verse}${n.verseEnd ? `–${n.verseEnd}` : ''}` }}
                folders={folders} onChanged={load} onJump={() => onJumpToPassage(`${bookName(n.book)} ${n.chapter}:${n.verse}`)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs ${active ? 'bg-brand-50 border-brand-200 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
      {label}
    </button>
  )
}

function FolderForm({ value, onChange, onSave, onCancel, onDelete }: {
  value: { name: string; color: NoteColor }
  onChange: (v: { name: string; color: NoteColor }) => void
  onSave: () => void; onCancel: () => void; onDelete?: () => void
}) {
  return (
    <div className="mb-3 flex items-center flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <input autoFocus value={value.name} onChange={e => onChange({ ...value, name: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
        placeholder="Folder name" className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
      <div className="flex items-center gap-1">
        {NOTE_COLOR_KEYS.map(c => (
          <button key={c} title={NOTE_COLORS[c].label} onClick={() => onChange({ ...value, color: c })}
            className={`h-5 w-5 rounded-full ${NOTE_COLORS[c].dot} ${value.color === c ? 'ring-2 ring-offset-1 ring-gray-500' : ''}`} />
        ))}
      </div>
      <button onClick={onSave} className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"><Check size={13} /> Save</button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      {onDelete && <button onClick={onDelete} className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"><Trash2 size={13} /> Delete folder</button>}
    </div>
  )
}

// Editor for a single note — `existing` undefined means "new note for this verse".
function NoteEditor({ existing, anchor, folders, onChanged, onJump }: {
  existing?: NoteT
  anchor: { book: string; chapter: number; verse: number; label: string }
  folders: FolderT[]
  onChanged: () => void
  onJump?: () => void
}) {
  const [folderId, setFolderId] = useState<string | null>(existing?.folderId ?? null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(existing?.body ?? '')
  const [fontScale, setFontScale] = useNoteFontScale()

  async function persist() {
    const body = draft
    setSaving(true)
    try {
      if (existing) {
        if (body.trim() === '') await fetch(`/api/notes?id=${existing.id}`, { method: 'DELETE' })
        else if (body !== existing.body) await fetch(`/api/notes?id=${existing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
        else { setSaving(false); return }
      } else if (body.trim() !== '') {
        await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...anchor, body, folderId }) })
      } else { setSaving(false); return }
      onChanged()
    } finally { setSaving(false) }
  }

  async function changeFolder(id: string | null) {
    setFolderId(id)
    if (existing) { await fetch(`/api/notes?id=${existing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId: id }) }); onChanged() }
  }

  const folder = folders.find(f => f.id === (existing?.folderId ?? folderId))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
      <div className="flex items-center gap-2 mb-1">
        {onJump
          ? <button onClick={onJump} className="text-xs font-semibold text-brand-700 hover:underline">{anchor.label}</button>
          : <span className="text-xs font-semibold text-gray-500">{anchor.label}</span>}
        {folder && <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${colorOf(folder.color).chip}`}><span className={`h-1.5 w-1.5 rounded-full ${colorOf(folder.color).dot}`} />{folder.name}</span>}
        <span className="ml-auto flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin text-gray-400" />}
          <select value={existing?.folderId ?? folderId ?? ''} onChange={e => changeFolder(e.target.value || null)}
            className="rounded border border-gray-200 text-[11px] text-gray-500 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400" title="File in folder">
            <option value="">Unfiled</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {existing && <button onClick={async () => { await fetch(`/api/notes?id=${existing.id}`, { method: 'DELETE' }); onChanged() }} className="text-gray-300 hover:text-red-600" title="Delete note"><Trash2 size={13} /></button>}
        </span>
      </div>
      <NoteComposer value={draft} onChange={setDraft} onBlur={persist} fontScale={fontScale} onFontScale={setFontScale} minRows={existing?.body ? 2 : 1} />
    </div>
  )
}
