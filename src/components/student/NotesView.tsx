'use client'
import { useCallback, useEffect, useState } from 'react'
import { Folder, FolderPlus, Trash2, Pencil, Check, X, StickyNote, Loader2, GraduationCap, Send, CheckCircle2, Clock } from 'lucide-react'
import { NOTE_COLORS, NOTE_COLOR_KEYS, colorOf, type NoteColor } from '@/lib/note-colors'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { useNoteFontScale, useNoteLineSpacing } from '@/lib/note-prefs'
import { toNoteHtml, isHtmlEmpty } from '@/lib/note-html'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { LexicalInfoPanel } from '@/types/lexicon'

interface NoteT { id: string; folderId: string | null; book: string; chapter: number; verse: number; verseEnd: number | null; body: string }
interface FolderT { id: string; name: string; color: string; _count: { notes: number } }
// A graded Course Notes assignment: the student's auto-provisioned folder + its submission status.
interface CourseNotesEntry {
  assignmentId: string; title: string; courseName: string; folderId: string; folderName: string
  dueDate: string; submittedAt: string | null; grade: number | null; gradeNote: string | null
}
interface Book { osisId: string; name: string }
export interface NoteAnchor { book: string; name: string; chapter: number; verseStart: number; verseEnd: number }

const MAX_PASSAGE_VERSES = 80

// Versions the side text pane can be shown in — same list as Backgrounds/Synopsis.
const VERSIONS = [
  { code: 'na1904', label: 'Greek — Nestle 1904' },
  { code: 'gnt', label: 'Greek — Tischendorf' },
  { code: 'bsb', label: 'English (BSB)' },
  { code: 'en', label: 'English (WEB)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Mandarin' },
]
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }
const GNT_MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatGntMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return GNT_MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function toLexicalInfo(tok: WordToken, ref: string): LexicalInfoPanel {
  return { surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '', parsing: tok.parsing, strongs: tok.strongs, reference: ref }
}

export function NotesView({ isAuthenticated, anchor, books, onJumpToPassage }: {
  isAuthenticated: boolean
  anchor: NoteAnchor | null
  books: Book[]
  onJumpToPassage: (ref: string) => void
}) {
  const [folders, setFolders] = useState<FolderT[]>([])
  const [notes, setNotes] = useState<NoteT[]>([])
  const [courseNotes, setCourseNotes] = useState<CourseNotesEntry[]>([])
  const [submitting, setSubmitting] = useState<string | null>(null) // assignmentId being submitted
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFolder, setActiveFolder] = useState<string>('all') // 'all' | 'unfiled' | folderId
  const [newFolder, setNewFolder] = useState<{ name: string; color: NoteColor } | null>(null)
  const [editFolder, setEditFolder] = useState<{ id: string; name: string; color: NoteColor } | null>(null)

  // ── Side text pane: the anchor passage, in a chosen version, with click-to-parse ──
  const [version, setVersion] = useState('na1904')
  const [passageVerses, setPassageVerses] = useState<{ verse: number; text: string; tokens?: WordToken[] }[]>([])
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const isGreek = version === 'na1904' || version === 'gnt'

  useEffect(() => {
    if (!anchor) { setPassageVerses([]); return }
    let cancelled = false
    const { book: osis, chapter, verseStart, verseEnd } = anchor
    async function run() {
      let verses: { verse: number; text: string; tokens?: WordToken[] }[] = []
      if (version === 'na1904') {
        type Node = { t: string; id?: string; w?: string; parsing?: string; lemma?: string; gloss?: string; strongs?: string; c?: Node[] }
        const r = await fetch(`/data/phrase-tree/${osis}.json`)
        const d: { sentences?: { tree: Node }[] } = r.ok ? await r.json() : {}
        const byVerse: Record<number, { i: number; tok: WordToken }[]> = {}
        const walk = (n: Node) => {
          if (n.t === 'w' && n.id) {
            const [bk, ch, vs, wd] = n.id.split('.')
            if (bk === osis && Number(ch) === chapter) {
              const vNum = Number(vs)
              ;(byVerse[vNum] ??= []).push({ i: parseInt(wd || '0', 10), tok: { surface: n.w ?? '', parsing: n.parsing ?? '', lemma: n.lemma ?? '', gloss: n.gloss, strongs: n.strongs } })
            }
          } else (n.c ?? []).forEach(walk)
        }
        for (const s of d.sentences ?? []) walk(s.tree)
        verses = Object.entries(byVerse).map(([vs, ws]) => {
          ws.sort((a, b) => a.i - b.i)
          return { verse: Number(vs), text: ws.map(x => x.tok.surface).join(' '), tokens: ws.map(x => x.tok) }
        }).sort((a, b) => a.verse - b.verse)
      } else if (version === 'gnt') {
        const r = await fetch(`/data/gnt/${osis}_${chapter}.json`)
        const d: { verses?: { verse: number; text: string; words?: { surface: string; lemma?: string; strongs?: string; morph?: Record<string, string | null> }[] }[] } = r.ok ? await r.json() : {}
        verses = (d.verses ?? []).map(v => ({ verse: v.verse, text: v.text, tokens: v.words?.map(w => ({ surface: w.surface, parsing: formatGntMorph(w.morph), lemma: w.lemma ?? '', strongs: w.strongs })) }))
      } else if (version === 'bsb') {
        const r = await fetch('/data/bsb-alignment.json?v=3')
        const d: Record<string, { text: string }> = r.ok ? await r.json() : {}
        verses = Object.entries(d)
          .filter(([vid]) => vid.startsWith(`${osis}.${chapter}.`))
          .map(([vid, val]) => ({ verse: Number(vid.split('.')[2]), text: val.text }))
          .sort((a, b) => a.verse - b.verse)
      } else {
        const r = await fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${version}`)
        const d: { verses?: Record<string, string> } = r.ok ? await r.json() : {}
        verses = Object.entries(d.verses ?? {}).map(([vid, text]) => ({ verse: Number(vid.split('.')[2]), text })).sort((a, b) => a.verse - b.verse)
      }
      if (!cancelled) setPassageVerses(verses.filter(v => v.verse >= verseStart && v.verse <= verseEnd))
    }
    setSelectedInfo(null); setSelectedKey(null)
    void run()
    return () => { cancelled = true }
  }, [anchor, version])

  const bookName = useCallback((osis: string) => books.find(b => b.osisId === osis)?.name ?? osis, [books])

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    try {
      const [res, cnRes] = await Promise.all([fetch('/api/notes'), fetch('/api/notes/course-notes')])
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setFolders(data.folders); setNotes(data.notes)
      if (cnRes.ok) setCourseNotes((await cnRes.json()).entries ?? [])
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

  /* ── Course Notes: submit a folder for grading ── */
  async function submitForGrading(assignmentId: string) {
    setSubmitting(assignmentId)
    try {
      const res = await fetch('/api/notes/course-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignmentId }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Submit failed') }
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Submit failed') }
    finally { setSubmitting(null) }
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
    <div className="flex flex-col lg:flex-row gap-6 pb-10">
      <div className="flex-1 min-w-0 max-w-3xl space-y-8">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

        {/* ── This passage ── */}
        {anchor && (
          <section>
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

        {/* ── Course Notes assignments ── */}
        {courseNotes.length > 0 && (
          <section>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-2">
              <GraduationCap size={16} className="text-brand-600" /> Course Notes
            </h3>
            <div className="space-y-2">
              {courseNotes.map(cn => (
                <CourseNotesCard key={cn.assignmentId} entry={cn}
                  noteCount={folders.find(f => f.id === cn.folderId)?._count.notes ?? 0}
                  isActive={activeFolder === cn.folderId}
                  submitting={submitting === cn.assignmentId}
                  onOpen={() => setActiveFolder(cn.folderId)}
                  onSubmit={() => submitForGrading(cn.assignmentId)} />
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

      {/* ── Side text pane: read the passage (any version) while you write notes ── */}
      <div className="lg:w-96 shrink-0 flex flex-col gap-3">
        <div className="rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: '55vh' }}>
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
              {anchor ? `${anchor.name} ${anchor.chapter}:${anchor.verseStart}${anchor.verseEnd !== anchor.verseStart ? `–${anchor.verseEnd}` : ''}` : 'No passage'}
            </p>
            <select
              value={version}
              onChange={e => setVersion(e.target.value)}
              className="rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 shrink-0"
            >
              {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
            </select>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {!anchor ? (
              <p className="text-xs text-gray-400 italic">Enter a passage above to read it here.</p>
            ) : passageVerses.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Loading…</p>
            ) : (
              <div className={`space-y-1 leading-relaxed text-gray-900 ${isGreek ? 'font-greek text-xl' : 'text-sm text-gray-700'}`}>
                {passageVerses.map(v => (
                  <p key={v.verse}>
                    <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.verse}</sup>
                    {isGreek && v.tokens && v.tokens.length > 0
                      ? v.tokens.map((tok, ti) => {
                          const key = `${v.verse}.${ti}`
                          const select = () => { setSelectedInfo(toLexicalInfo(tok, `${anchor.name} ${anchor.chapter}:${v.verse}`)); setSelectedKey(key) }
                          return (
                            <span key={ti} onMouseEnter={select} onClick={select}
                              className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''}`}>
                              {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                            </span>
                          )
                        })
                      : v.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {isGreek && <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />}
      </div>
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

// Safari-safe date formatting: explicit field options only (no dateStyle/timeStyle mix).
function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// One graded Course Notes assignment: due date, note count, submission status + grade, and
// a submit/resubmit button. Notes stay editable after submitting; resubmitting re-timestamps.
function CourseNotesCard({ entry, noteCount, isActive, submitting, onOpen, onSubmit }: {
  entry: CourseNotesEntry
  noteCount: number
  isActive: boolean
  submitting: boolean
  onOpen: () => void
  onSubmit: () => void
}) {
  const overdue = !entry.submittedAt && new Date(entry.dueDate).getTime() < Date.now()
  const graded = entry.grade != null
  return (
    <div className={`rounded-lg border bg-white p-3 ${isActive ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onOpen} className="text-sm font-semibold text-brand-700 hover:underline text-left">
            {entry.title}
          </button>
          <p className="text-xs text-gray-500 mt-0.5">
            {entry.courseName} · Folder “{entry.folderName}” · {noteCount} {noteCount === 1 ? 'note' : 'notes'}
          </p>
          <p className={`text-xs mt-0.5 ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
            Due {formatDue(entry.dueDate)}{overdue ? ' · overdue' : ''}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {graded && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700">
              <CheckCircle2 size={12} /> {entry.grade}/100
            </span>
          )}
          <button onClick={onSubmit} disabled={submitting}
            className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {entry.submittedAt ? 'Resubmit' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Submission status / grade feedback */}
      {(entry.submittedAt || graded) && (
        <div className="mt-2 border-t border-gray-100 pt-2 space-y-1">
          {entry.submittedAt && (
            <p className="flex items-center gap-1 text-[11px] text-gray-500">
              <Clock size={11} /> Submitted {formatDue(entry.submittedAt)} · notes stay editable
            </p>
          )}
          {entry.gradeNote && (
            <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 whitespace-pre-wrap">{entry.gradeNote}</p>
          )}
        </div>
      )}
    </div>
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
  const [lineSpacing] = useNoteLineSpacing()

  async function persist() {
    const body = draft
    setSaving(true)
    try {
      if (existing) {
        if (isHtmlEmpty(body)) await fetch(`/api/notes?id=${existing.id}`, { method: 'DELETE' })
        else if (body !== existing.body) await fetch(`/api/notes?id=${existing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
        else { setSaving(false); return }
      } else if (!isHtmlEmpty(body)) {
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
      <NoteComposer initialHtml={toNoteHtml(draft)} onChange={setDraft} onBlur={persist} fontScale={fontScale} onFontScale={setFontScale} lineScale={lineSpacing} />
    </div>
  )
}
