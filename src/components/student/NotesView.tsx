'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Folder, FolderPlus, Trash2, Pencil, Check, X, StickyNote, Loader2, GraduationCap, Send, CheckCircle2, Clock, Plus, ChevronDown } from 'lucide-react'
import { NOTE_COLORS, NOTE_COLOR_KEYS, colorOf, type NoteColor } from '@/lib/note-colors'
import { NoteComposer } from '@/components/notes/NoteComposer'
import { useNoteFontScale, useNoteLineSpacing } from '@/lib/note-prefs'
import { toNoteHtml, isHtmlEmpty } from '@/lib/note-html'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { openWordSearch } from '@/lib/word-search-bus'
import { TransWords } from '@/components/highlights/TransWords'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { verseAnchorProps, withTokenOffsets, highlightAt } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'
import { onNotesChanged, emitNotesChanged } from '@/lib/notes-changed-bus'
import type { LexicalInfoPanel } from '@/types/lexicon'


// A note is either verse-anchored (book/chapter/verse set) or "general" (all null + optional title).
interface NoteT { id: string; folderId: string | null; book: string | null; chapter: number | null; verse: number | null; verseEnd: number | null; title: string | null; body: string }
// assignmentId is non-null only for Course Notes folders provisioned by an instructor's
// assignment — those can be renamed/recoloured but not deleted.
interface FolderT { id: string; name: string; color: string; assignmentId: string | null; _count: { notes: number } }
// A graded Course Notes assignment: the student's auto-provisioned folder + its submission status.
interface CourseNotesEntry {
  assignmentId: string; title: string; courseName: string; folderId: string; folderName: string
  dueDate: string; submittedAt: string | null; grade: number | null; gradeNote: string | null
}
interface Book { osisId: string; name: string }
export interface NoteAnchor { book: string; name: string; chapter: number; verseStart: number; verseEnd: number }

const MAX_PASSAGE_VERSES = 80

// Plain text of a note's HTML body, for search matching (notes are stored as a safe HTML subset).
function noteText(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ')
  const d = document.createElement('div'); d.innerHTML = html
  return d.textContent ?? ''
}

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
// The non-Greek versions can also be shown INLINE beneath the Greek (like the Reader).
const TRANSLATIONS = VERSIONS.filter(v => v.code !== 'na1904' && v.code !== 'gnt')
const INLINE_TRANS_KEY = 'notes-inline-trans'
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
  const [noteKind, setNoteKind] = useState<'all' | 'verse' | 'general'>('all') // notebook filter: verse-anchored vs topic notes
  const [openKind, setOpenKind] = useState<null | 'verse' | 'general'>(null)   // which kind's folder dropdown is open
  const kindTabsRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('') // free-text search over the notebook list
  const [addingNote, setAddingNote] = useState(false) // composing a new topic (verse-less) note
  const [addVerse, setAddVerse] = useState<number | null>(null) // "This passage": verse chosen for a new verse note
  const [newFolder, setNewFolder] = useState<{ name: string; color: NoteColor } | null>(null)
  const [editFolder, setEditFolder] = useState<{ id: string; name: string; color: NoteColor } | null>(null)

  // Close an open Verse/Topic folder dropdown on outside click or Escape.
  useEffect(() => {
    if (!openKind) return
    const onDown = (e: MouseEvent) => { if (!kindTabsRef.current?.contains(e.target as Node)) setOpenKind(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenKind(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [openKind])

  // ── Side text pane: the anchor passage, in a chosen version, with click-to-parse ──
  // Highlighting is keyed by (anchor.book, anchor.chapter, verse) — the same anchors the
  // Reader/Texts/other panes use, so a mark made here shows up everywhere and vice versa.
  const highlights = useHighlights(isAuthenticated)
  const passagePaneRef = useRef<HTMLDivElement>(null)
  const highlightSelection = useHighlightSelection(passagePaneRef)
  const [version, setVersion] = useState('na1904')
  const [passageVerses, setPassageVerses] = useState<{ verse: number; text: string; tokens?: WordToken[] }[]>([])
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const isGreek = version === 'na1904' || version === 'gnt'
  // Optional translation shown INLINE beneath each Greek verse (only when a Greek version is
  // active), mirroring the Reader. Persisted so it survives navigation.
  const [inlineTrans, setInlineTrans] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : (localStorage.getItem(INLINE_TRANS_KEY) || null))
  const [transByVerse, setTransByVerse] = useState<Record<number, string>>({})
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (inlineTrans) localStorage.setItem(INLINE_TRANS_KEY, inlineTrans)
    else localStorage.removeItem(INLINE_TRANS_KEY)
  }, [inlineTrans])

  // Load a passage in one version → verses (with Greek tokens where available). Shared by the
  // primary text pane and the inline-translation fetch.
  const loadVerses = useCallback(async (v: string, osis: string, chapter: number): Promise<{ verse: number; text: string; tokens?: WordToken[] }[]> => {
    if (v === 'na1904') {
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
      return Object.entries(byVerse).map(([vs, ws]) => {
        ws.sort((a, b) => a.i - b.i)
        return { verse: Number(vs), text: ws.map(x => x.tok.surface).join(' '), tokens: ws.map(x => x.tok) }
      }).sort((a, b) => a.verse - b.verse)
    }
    if (v === 'gnt') {
      const r = await fetch(`/data/gnt/${osis}_${chapter}.json`)
      const d: { verses?: { verse: number; text: string; words?: { surface: string; lemma?: string; strongs?: string; morph?: Record<string, string | null> }[] }[] } = r.ok ? await r.json() : {}
      return (d.verses ?? []).map(vv => ({ verse: vv.verse, text: vv.text, tokens: vv.words?.map(w => ({ surface: w.surface, parsing: formatGntMorph(w.morph), lemma: w.lemma ?? '', strongs: w.strongs })) }))
    }
    if (v === 'bsb') {
      const r = await fetch('/data/bsb-alignment.json?v=3')
      const d: Record<string, { text: string }> = r.ok ? await r.json() : {}
      return Object.entries(d)
        .filter(([vid]) => vid.startsWith(`${osis}.${chapter}.`))
        .map(([vid, val]) => ({ verse: Number(vid.split('.')[2]), text: val.text }))
        .sort((a, b) => a.verse - b.verse)
    }
    const r = await fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${v}`)
    const d: { verses?: Record<string, string> } = r.ok ? await r.json() : {}
    return Object.entries(d.verses ?? {}).map(([vid, text]) => ({ verse: Number(vid.split('.')[2]), text })).sort((a, b) => a.verse - b.verse)
  }, [])

  // Primary text pane.
  useEffect(() => {
    if (!anchor) { setPassageVerses([]); return }
    let cancelled = false
    const { book: osis, chapter, verseStart, verseEnd } = anchor
    setSelectedInfo(null); setSelectedKey(null)
    void loadVerses(version, osis, chapter).then(verses => {
      if (!cancelled) setPassageVerses(verses.filter(v => v.verse >= verseStart && v.verse <= verseEnd))
    })
    void highlights.loadFor(osis, chapter)
    return () => { cancelled = true }
  }, [anchor, version, loadVerses, highlights.loadFor])

  // Inline translation beneath the Greek (only meaningful while a Greek version is showing).
  useEffect(() => {
    if (!anchor || !isGreek || !inlineTrans) { setTransByVerse({}); return }
    let cancelled = false
    const { book: osis, chapter } = anchor
    void loadVerses(inlineTrans, osis, chapter).then(verses => {
      if (cancelled) return
      const map: Record<number, string> = {}
      for (const v of verses) map[v.verse] = v.text
      setTransByVerse(map)
    })
    return () => { cancelled = true }
  }, [anchor, inlineTrans, isGreek, loadVerses])

  // A new passage clears any half-open "add note on verse" editor from the previous one.
  useEffect(() => { setAddVerse(null) }, [anchor])

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
  // Reload when a note is created/edited/deleted anywhere (e.g. a note icon on the Texts or
  // Commentary tab) — the notebook stays mounted across tabs, so it would otherwise be stale.
  useEffect(() => onNotesChanged(() => void load()), [load])

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
    const res = await fetch(`/api/notes/folders?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Could not delete this folder.'); return }
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
    ? notes.filter(n => n.book === anchor.book && n.chapter === anchor.chapter && n.verse != null && n.verse >= anchor.verseStart && n.verse <= anchor.verseEnd)
    : []
  const passageVerseNote = (v: number) => passageNotes.find(n => n.verse === v)
  const verseList: number[] = anchor
    ? Array.from({ length: Math.min(anchor.verseEnd - anchor.verseStart + 1, MAX_PASSAGE_VERSES) }, (_, i) => anchor.verseStart + i)
    : []

  const inFolder = (n: NoteT) =>
    activeFolder === 'all' ? true : activeFolder === 'unfiled' ? !n.folderId : n.folderId === activeFolder
  // Notes in the active folder — drives the displayed list (filtered below).
  const folderNotes = notes.filter(inFolder)
  // Count notes of a given kind within a given folder — drives the tab labels and the
  // per-folder counts inside the Verse / Topic dropdowns.
  const countKindFolder = (kind: 'verse' | 'general', folder: string) =>
    notes.filter(n =>
      (kind === 'verse' ? n.book != null : n.book == null) &&
      (folder === 'all' ? true : folder === 'unfiled' ? !n.folderId : n.folderId === folder)
    ).length
  const q = query.trim().toLowerCase()
  const filtered = folderNotes.filter(n => {
    if (noteKind === 'verse' && n.book == null) return false
    if (noteKind === 'general' && n.book != null) return false
    if (q && !((n.title ?? '') + ' ' + noteText(n.body)).toLowerCase().includes(q)) return false
    return true
  })

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-10">
      <div className="flex-1 min-w-0 max-w-3xl space-y-8">
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

        {/* ── This passage: verse notes for the loaded passage ──
            Only verses that already have a note get an editor (no wall of empty boxes for a
            whole chapter); the picker below opens an editor for any other verse in range. */}
        {anchor && (() => {
          const notedVerses = verseList.filter(v => passageVerseNote(v))
          const addable = verseList.filter(v => !passageVerseNote(v))
          return (
            <section>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                This passage
                <span className="ml-1.5 font-normal text-gray-400">
                  {anchor.name} {anchor.chapter}:{anchor.verseStart}{anchor.verseEnd !== anchor.verseStart ? `–${anchor.verseEnd}` : ''}
                </span>
              </h3>
              <div className="space-y-2">
                {notedVerses.map(v => (
                  <NoteEditor key={passageVerseNote(v)!.id}
                    existing={passageVerseNote(v)}
                    anchor={{ book: anchor.book, chapter: anchor.chapter, verse: v, label: `${anchor.name} ${anchor.chapter}:${v}` }}
                    folders={folders} onChanged={load} />
                ))}
                {addVerse != null && (
                  <NoteEditor key={`add-${anchor.book}-${anchor.chapter}-${addVerse}`}
                    anchor={{ book: anchor.book, chapter: anchor.chapter, verse: addVerse, label: `${anchor.name} ${anchor.chapter}:${addVerse}` }}
                    folders={folders}
                    onChanged={() => { setAddVerse(null); void load() }} />
                )}
              </div>
              {addable.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <label htmlFor="add-verse-note">Add a note on verse</label>
                  <select id="add-verse-note" value=""
                    onChange={e => { const v = Number(e.target.value); if (v) setAddVerse(v) }}
                    className="rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400">
                    <option value="">Choose…</option>
                    {addable.map(v => <option key={v} value={v}>{anchor.chapter}:{v}</option>)}
                  </select>
                </div>
              )}
              {notedVerses.length === 0 && addVerse == null && (
                <p className="text-xs text-gray-400 italic mt-1">No verse notes on this passage yet.</p>
              )}
            </section>
          )
        })()}

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
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-800">My notebook</h3>
            <button
              onClick={() => setAddingNote(true)}
              className="inline-flex items-center gap-1 rounded-none border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
              title="Write a topic note that isn’t tied to a specific verse"
            >
              <Plus size={13} /> New topic note
            </button>
          </div>

          {/* Kind tabs — "All" is plain; "Verse notes" and "Topic notes" each open a folder
              dropdown (folders used to be a separate second row). Plus free-text search. */}
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <div ref={kindTabsRef} className="inline-flex rounded-lg border border-gray-300 text-xs">
              <button type="button"
                onClick={() => { setNoteKind('all'); setActiveFolder('all'); setOpenKind(null) }}
                className={`rounded-l-lg px-2.5 py-1 font-medium ${noteKind === 'all' ? 'bg-brand-600 text-white' : 'bg-surface text-gray-600 hover:bg-gray-50'}`}>
                All ({notes.length})
              </button>
              {([['verse', 'Verse notes'], ['general', 'Topic notes']] as const).map(([kind, label]) => {
                const activeHere = noteKind === kind
                const activeF = activeHere && activeFolder !== 'all'
                  ? (activeFolder === 'unfiled'
                      ? { name: 'Unfiled', color: null as string | null }
                      : folders.find(f => f.id === activeFolder) ?? null)
                  : null
                return (
                  <div key={kind} className="relative flex">
                    <button type="button"
                      onClick={() => { setNoteKind(kind); setActiveFolder('all'); setOpenKind(openKind === kind ? null : kind) }}
                      className={`inline-flex items-center gap-1 border-l border-gray-300 px-2.5 py-1 font-medium ${kind === 'general' ? 'rounded-r-lg' : ''} ${activeHere ? 'bg-brand-600 text-white' : 'bg-surface text-gray-600 hover:bg-gray-50'}`}>
                      {label} ({countKindFolder(kind, 'all')})
                      {activeF && (
                        <span className={`h-1.5 w-1.5 rounded-full ${activeF.color ? colorOf(activeF.color as NoteColor).dot : 'bg-current opacity-70'}`} />
                      )}
                      <ChevronDown size={12} className={`transition-transform ${openKind === kind ? 'rotate-180' : ''}`} />
                    </button>
                    {openKind === kind && (
                      <div className="absolute left-0 top-full mt-1 z-30 min-w-[13rem] rounded-lg border border-gray-200 bg-popover shadow-lg py-1">
                        {([['all', 'All folders'], ['unfiled', 'Unfiled']] as const).map(([fk, flabel]) => (
                          <button key={fk} type="button"
                            onClick={() => { setNoteKind(kind); setActiveFolder(fk); setOpenKind(null) }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 ${activeHere && activeFolder === fk ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}>
                            <span className="flex-1">{flabel}</span>
                            <span className="text-gray-400">{countKindFolder(kind, fk)}</span>
                          </button>
                        ))}
                        {folders.length > 0 && <div className="my-1 border-t border-gray-100" />}
                        {folders.map(f => (
                          <div key={f.id} className="flex items-center">
                            <button type="button"
                              onClick={() => { setNoteKind(kind); setActiveFolder(f.id); setOpenKind(null) }}
                              className={`flex flex-1 items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 ${activeHere && activeFolder === f.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}>
                              <span className={`h-2 w-2 rounded-full ${colorOf(f.color).dot}`} />
                              <span className="flex-1 truncate">{f.name}</span>
                              <span className="text-gray-400">{countKindFolder(kind, f.id)}</span>
                            </button>
                            <button type="button" title="Edit folder"
                              onClick={() => { setEditFolder({ id: f.id, name: f.name, color: (f.color as NoteColor) }); setOpenKind(null) }}
                              className="px-2 py-1.5 text-gray-300 hover:text-gray-600"><Pencil size={11} /></button>
                          </div>
                        ))}
                        <div className="my-1 border-t border-gray-100" />
                        <button type="button"
                          onClick={() => { setNewFolder({ name: '', color: 'blue' }); setOpenKind(null) }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                          <FolderPlus size={12} /> New folder
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="relative flex-1 min-w-[8rem]">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search notes…"
                className="w-full rounded-lg border border-gray-300 pl-2.5 pr-6 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {query && (
                <button onClick={() => setQuery('')} title="Clear search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X size={13} /></button>
              )}
            </div>
          </div>

          {/* New / edit folder inline form */}
          {(newFolder || editFolder) && (() => {
            // Course Notes folders (assignment-linked) can be edited but not deleted.
            const editingCourseFolder = !!editFolder && folders.find(f => f.id === editFolder.id)?.assignmentId != null
            return (
              <FolderForm
                value={newFolder ?? { name: editFolder!.name, color: editFolder!.color }}
                onChange={v => newFolder ? setNewFolder(v) : setEditFolder({ id: editFolder!.id, ...v })}
                onSave={newFolder ? saveNewFolder : saveEditFolder}
                onCancel={() => { setNewFolder(null); setEditFolder(null) }}
                onDelete={editFolder && !editingCourseFolder ? () => removeFolder(editFolder.id) : undefined}
                lockedNote={editingCourseFolder ? 'Course Notes folder — set up by your instructor, so it can’t be deleted.' : undefined}
              />
            )
          })()}

          <div className="space-y-2">
            {addingNote && (
              <NoteEditor
                general
                defaultFolderId={activeFolder !== 'all' && activeFolder !== 'unfiled' ? activeFolder : null}
                folders={folders}
                onChanged={() => { setAddingNote(false); void load() }}
                onCancel={() => setAddingNote(false)}
              />
            )}
            {filtered.length === 0 && !addingNote ? (
              q ? (
                <p className="text-sm text-gray-400 italic py-6">No notes match “{query}”.</p>
              ) : noteKind === 'verse' ? (
                <p className="text-sm text-gray-400 italic py-6">
                  No verse notes here yet. Open a passage above and write on a verse, or use the note icon beside a verse in the Reader.
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic py-6">
                  No notes here yet. Use <span className="font-medium text-gray-600">New topic note</span> for a free-standing note, or open a passage above to write on a verse.
                </p>
              )
            ) : (
              filtered.map(n => (
                <NoteEditor key={n.id} existing={n}
                  anchor={n.book ? { book: n.book, chapter: n.chapter!, verse: n.verse!, label: `${bookName(n.book)} ${n.chapter}:${n.verse}${n.verseEnd ? `–${n.verseEnd}` : ''}` } : undefined}
                  folders={folders} onChanged={load}
                  onJump={n.book ? () => onJumpToPassage(`${bookName(n.book!)} ${n.chapter}:${n.verse}`) : undefined} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── Side text pane: read the passage (any version) while you write notes ── */}
      <div className="lg:w-96 shrink-0 flex flex-col gap-3">
        <div className="rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: '55vh' }}>
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
              {anchor ? `${anchor.name} ${anchor.chapter}:${anchor.verseStart}${anchor.verseEnd !== anchor.verseStart ? `–${anchor.verseEnd}` : ''}` : 'No passage'}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={version}
                onChange={e => setVersion(e.target.value)}
                title="Text version"
                className="rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
              {/* Inline translation beneath the Greek — only offered while a Greek version shows. */}
              {isGreek && (
                <select
                  value={inlineTrans ?? ''}
                  onChange={e => setInlineTrans(e.target.value || null)}
                  title="Show a translation inline beneath each Greek verse"
                  className="rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">+ translation</option>
                  {TRANSLATIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                </select>
              )}
            </div>
          </div>
          <div ref={passagePaneRef} className="flex-1 min-h-0 overflow-y-auto p-3">
            {!anchor ? (
              <p className="text-xs text-gray-400 italic">Enter a passage above to read it here.</p>
            ) : passageVerses.length === 0 ? (
              <p className="text-xs text-gray-300 italic">Loading…</p>
            ) : (
              <div className={`space-y-1 leading-relaxed text-gray-900 ${isGreek ? 'font-greek text-xl' : 'text-sm text-gray-700'}`}>
                {passageVerses.map(v => {
                  const ref = `${anchor.name} ${anchor.chapter}:${v.verse}`
                  const noted = notes.some(n => n.book === anchor.book && n.chapter === anchor.chapter && n.verse === v.verse)
                  const verseHighlights = highlights.forVerse(anchor.book, anchor.chapter, v.verse)
                  return (
                  <div key={v.verse} className={`flex items-start gap-1 ${isGreek && inlineTrans ? 'mb-2' : ''}`}>
                    <span className="pt-1 shrink-0 print:hidden">
                      <VerseNoteButton book={anchor.book} chapter={anchor.chapter} verse={v.verse} noted={noted} onChanged={load} />
                    </span>
                    <div className="min-w-0 flex-1">
                    <p>
                      <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.verse}</sup>
                      {isGreek && v.tokens && v.tokens.length > 0
                        ? <span {...verseAnchorProps(anchor.book, anchor.chapter, v.verse)}>
                            {withTokenOffsets(v.tokens).map(({ token: tok, start, end }, ti) => {
                              const key = `${v.verse}.${ti}`
                              const select = () => { setSelectedInfo(toLexicalInfo(tok, ref)); setSelectedKey(key) }
                              const hl = highlightAt(start, end, verseHighlights)
                              return (
                                <span key={ti} onMouseEnter={select} onClick={select}
                                  onContextMenu={e => { e.preventDefault(); openWordSearch({ x: e.clientX, y: e.clientY, surface: tok.surface, lemma: tok.lemma, reference: ref, kind: 'greek', greekCorpus: 'GNT',
                                    highlight: isAuthenticated ? {
                                      activeColor: hl?.color ?? null,
                                      onPick: c => hl ? void highlights.recolor(hl.id, anchor.book, anchor.chapter, c) : void highlights.create(anchor.book, anchor.chapter, v.verse, start, end, c),
                                      onRemove: () => { if (hl) void highlights.remove(hl.id, anchor.book, anchor.chapter) },
                                    } : undefined }) }}
                                  {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': anchor.book, 'data-hl-chapter': anchor.chapter, 'data-hl-color': hl.color } : {})}
                                  className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${hl ? highlightMarkClass(hl.color) : ''}`}>
                                  {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                                </span>
                              )
                            })}
                          </span>
                        : <span {...verseAnchorProps(anchor.book, anchor.chapter, v.verse)}>
                            <TransWords text={v.text} lang={version} reference={ref} book={anchor.book}
                              hl={isAuthenticated ? { isAuthenticated, verseHighlights,
                                create: (s, e, c) => void highlights.create(anchor.book, anchor.chapter, v.verse, s, e, c),
                                recolor: (id, c) => void highlights.recolor(id, anchor.book, anchor.chapter, c),
                                remove: id => void highlights.remove(id, anchor.book, anchor.chapter) } : undefined} />
                          </span>}
                    </p>
                    {/* Inline translation of this Greek verse, if one is selected. */}
                    {isGreek && inlineTrans && (
                      <p className="text-sm text-gray-600 font-sans mt-0.5 border-l-2 border-gray-200 pl-2">
                        {transByVerse[v.verse]
                          ? <TransWords text={transByVerse[v.verse]} lang={inlineTrans} reference={ref} book={anchor.book} />
                          : <span className="text-gray-300 italic text-xs">—</span>}
                      </p>
                    )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>

        {isGreek && <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />}
      </div>

      {isAuthenticated && highlightSelection.popup && (
        <HighlightPopup
          state={highlightSelection.popup}
          onPick={color => {
            const state = highlightSelection.popup!
            if (state.kind === 'new') for (const s of state.splits) void highlights.create(s.book, s.chapter, s.verse, s.start, s.end, color)
            else void highlights.recolor(state.id, state.book, state.chapter, color)
            highlightSelection.close()
          }}
          onRemove={() => {
            const state = highlightSelection.popup!
            if (state.kind === 'edit') void highlights.remove(state.id, state.book, state.chapter)
            highlightSelection.close()
          }}
          onClose={highlightSelection.close}
        />
      )}
    </div>
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
    <div className={`rounded-lg border bg-surface p-3 ${isActive ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-200'}`}>
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
            className="inline-flex items-center gap-1 rounded-none bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
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

function FolderForm({ value, onChange, onSave, onCancel, onDelete, lockedNote }: {
  value: { name: string; color: NoteColor }
  onChange: (v: { name: string; color: NoteColor }) => void
  onSave: () => void; onCancel: () => void; onDelete?: () => void; lockedNote?: string
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
      <button onClick={onSave} className="inline-flex items-center gap-1 rounded-none bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"><Check size={13} /> Save</button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      {onDelete
        ? <button onClick={onDelete} className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"><Trash2 size={13} /> Delete folder</button>
        : lockedNote ? <span className="ml-auto text-[11px] text-gray-400 max-w-[16rem]">{lockedNote}</span> : null}
    </div>
  )
}

// Editor for a single note. Three shapes:
//   • existing note (verse-anchored or general) — auto-saves.
//   • new verse note (`anchor` set, no `existing`) — quick-jot from a passage.
//   • new general note (`general`, no `anchor`) — a topic note with an optional title.
// All shapes auto-save: a debounce fires ~0.9s after typing stops, and the draft is
// also flushed when the editor unmounts (navigating away) or the tab is hidden, so
// notes can't be lost by leaving the page. New notes adopt the server id from their
// first save, so later edits update that note instead of creating duplicates.
function NoteEditor({ existing, anchor, general, defaultFolderId, folders, onChanged, onJump, onCancel }: {
  existing?: NoteT
  anchor?: { book: string; chapter: number; verse: number; label: string }
  general?: boolean
  defaultFolderId?: string | null
  folders: FolderT[]
  onChanged: () => void
  onJump?: () => void
  onCancel?: () => void
}) {
  const isGeneral = existing ? existing.book == null : !!general
  const isNew = !existing
  const [folderId, setFolderId] = useState<string | null>(existing?.folderId ?? defaultFolderId ?? null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(existing?.body ?? '')
  const [titleDraft, setTitleDraft] = useState(existing?.title ?? '')
  const [fontScale, setFontScale] = useNoteFontScale()
  const [lineSpacing] = useNoteLineSpacing()

  const H = { 'Content-Type': 'application/json' }

  // The note's server id once it exists (null for a new note until its first save).
  const idRef = useRef<string | null>(existing?.id ?? null)
  // Last values we've persisted — used to diff PATCHes and skip redundant writes.
  const saved = useRef({ body: existing?.body ?? '', title: existing?.title ?? '' })
  // Current drafts, so the debounced / unmount savers read fresh values without re-binding.
  const draftRef = useRef(draft); draftRef.current = draft
  const titleRef = useRef(titleDraft); titleRef.current = titleDraft
  // Serialize saves so an in-flight create can't race a second save into a duplicate.
  const chain = useRef<Promise<void>>(Promise.resolve())
  // Set once the note is discarded (Cancel/Delete) so trailing autosaves are ignored.
  const discarded = useRef(false)

  // Persist the current draft. `final` marks a user-completed edit (blur / explicit Save /
  // unmount): it may refresh the notebook list and delete an emptied note. The debounced
  // autosave passes final=false so it never reloads (which would remount and drop the caret).
  const save = useCallback((final: boolean): Promise<void> => {
    const run = async () => {
      if (discarded.current) return
      const body = draftRef.current
      const title = titleRef.current.trim()
      const empty = isHtmlEmpty(body) && (!isGeneral || !title)
      const id = idRef.current

      if (!id) {
        if (empty) { if (final && isNew && isGeneral) onCancel?.(); return }
        if (!isGeneral && !anchor) return
        setSaving(true)
        try {
          const payload = isGeneral ? { general: true, title, body, folderId } : { ...anchor!, body, folderId }
          const res = await fetch('/api/notes', { method: 'POST', headers: H, body: JSON.stringify(payload) })
          const d = await res.json().catch(() => ({}))
          if (res.ok && d.note?.id) { idRef.current = d.note.id; saved.current = { body, title }; emitNotesChanged() }
        } finally { setSaving(false) }
        if (final && !discarded.current) onChanged()
        return
      }

      // Note already exists on the server: update it, or delete it if the user emptied it.
      if (empty && final) {
        setSaving(true)
        try { await fetch(`/api/notes?id=${id}`, { method: 'DELETE' }); saved.current = { body: '', title: '' } }
        finally { setSaving(false) }
        onChanged(); emitNotesChanged()
        return
      }
      const patch: { body?: string; title?: string } = {}
      if (body !== saved.current.body) patch.body = body
      if (isGeneral && title !== saved.current.title) patch.title = title
      if (Object.keys(patch).length > 0) {
        setSaving(true)
        try { await fetch(`/api/notes?id=${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(patch) }); saved.current = { body, title } }
        finally { setSaving(false) }
        if (final) onChanged()
      } else if (final) {
        onChanged()
      }
    }
    chain.current = chain.current.then(run, run)
    return chain.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeneral, isNew, anchor, folderId, onChanged, onCancel])

  const saveRef = useRef(save); saveRef.current = save

  // Debounced autosave: ~0.9s after the student stops typing, persist silently.
  useEffect(() => {
    if (draft === saved.current.body && titleDraft.trim() === saved.current.title) return
    const t = setTimeout(() => { void saveRef.current(false) }, 900)
    return () => clearTimeout(t)
  }, [draft, titleDraft])

  // Flush the draft when the tab is hidden and when the editor unmounts (e.g. navigating
  // to another page) — the two moments a student's in-progress notes would otherwise vanish.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') void saveRef.current(false) }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      void saveRef.current(false)
    }
  }, [])

  async function changeFolder(id: string | null) {
    setFolderId(id)
    if (idRef.current) {
      await fetch(`/api/notes?id=${idRef.current}`, { method: 'PATCH', headers: H, body: JSON.stringify({ folderId: id }) })
      if (existing) onChanged()
    }
  }

  function discard() {
    discarded.current = true
    if (idRef.current) { void fetch(`/api/notes?id=${idRef.current}`, { method: 'DELETE' }).then(() => { onChanged(); emitNotesChanged() }) }
    onCancel?.()
  }

  const folder = folders.find(f => f.id === (existing?.folderId ?? folderId))
  // Existing / verse notes reload the list on blur; a still-composing new general note
  // saves silently on blur (so moving between its title and body doesn't remount it).
  const finalOnBlur = !(isNew && isGeneral)

  return (
    <div className="rounded-lg border border-gray-200 bg-input p-2.5">
      <div className="flex items-center gap-2 mb-1">
        {isGeneral ? (
          <input
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={() => void save(finalOnBlur)}
            placeholder="Topic note title (optional)"
            maxLength={200}
            autoFocus={isNew}
            className="flex-1 min-w-0 text-xs font-semibold text-gray-700 bg-transparent rounded border border-transparent hover:border-gray-200 focus:border-brand-400 px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        ) : onJump ? (
          <button onClick={onJump} className="text-xs font-semibold text-brand-700 hover:underline">{anchor?.label}</button>
        ) : (
          <span className="text-xs font-semibold text-gray-500">{anchor?.label}</span>
        )}
        {isGeneral && <span className="shrink-0 rounded-full bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5">Topic note</span>}
        {folder && <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] ${colorOf(folder.color).chip}`}><span className={`h-1.5 w-1.5 rounded-full ${colorOf(folder.color).dot}`} />{folder.name}</span>}
        <span className="ml-auto flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin text-gray-400" />}
          <select value={existing?.folderId ?? folderId ?? ''} onChange={e => changeFolder(e.target.value || null)}
            className="rounded border border-gray-200 text-[11px] text-gray-500 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400" title="File in folder">
            <option value="">Unfiled</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {existing && <button onClick={async () => { discarded.current = true; await fetch(`/api/notes?id=${existing.id}`, { method: 'DELETE' }); onChanged(); emitNotesChanged() }} className="text-gray-300 hover:text-red-600" title="Delete note"><Trash2 size={13} /></button>}
        </span>
      </div>
      <NoteComposer initialHtml={toNoteHtml(draft)} onChange={setDraft} onBlur={() => void save(finalOnBlur)} autoFocus={isNew && !isGeneral} fontScale={fontScale} onFontScale={setFontScale} lineScale={lineSpacing} />
      {isNew && isGeneral && (
        <div className="flex items-center justify-end gap-2 mt-2">
          <span className="mr-auto text-[11px] text-gray-400">Saves automatically</span>
          <button onClick={discard} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1">Cancel</button>
          <button onClick={() => void save(true)} disabled={saving} className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-none px-3 py-1 disabled:opacity-50">Save note</button>
        </div>
      )}
    </div>
  )
}
