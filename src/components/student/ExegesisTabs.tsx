'use client'
import { useEffect, useRef, useState } from 'react'
import { PencilLine, ListTree, Columns3, StickyNote } from 'lucide-react'
import { ExegesisWorkspace } from './ExegesisWorkspace'
import { PhraseExplorer } from '@/components/phrase/PhraseExplorer'
import { SynopsisView } from '@/components/phrase/SynopsisView'
import { NotesView, type NoteAnchor } from './NotesView'

type Section = { c: number; v: number; ec: number; ev: number; t: string }
type Pericopes = Record<string, Section[]>
type Book = { osisId: string; name: string; abbrev?: string }

const norm = (s: string) => s.toLowerCase().replace(/[\s.]/g, '')

/**
 * Standalone Exegesis page: one shared Passage box drives three tabs — the annotation
 * Workspace, the Phrasing (syntax) tree, and the Synopsis (parallel comparison). All
 * tabs stay mounted so switching keeps their state. Phrasing/Synopsis live only on this
 * public study page — translation assignments and exams render <ExegesisWorkspace>
 * directly (no phrasing, so it can't leak answers).
 *
 * As you type a passage start (e.g. "Matt 4:1"), the box suggests the rest of that
 * pericope in grey ("-11", giving "Matt 4:1-11" = the Temptation) from BSB section
 * data (public/data/pericopes.json). Accept with Tab / → / Enter. NT boundaries are
 * exact; OT is approximate (BSB Masoretic vs the app's LXX versification).
 */
export function ExegesisTabs({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [tab, setTab] = useState<'workspace' | 'phrasing' | 'synopsis' | 'notes'>('workspace')
  // The single passage that coordinates every tab. `input` is the live box text;
  // `passage` is committed on Enter/blur and pushed to the tabs.
  const [input, setInput] = useState('John 1:1-5')
  const [passage, setPassage] = useState('John 1:1-5')
  // Grey ghost-text completion of the current pericope.
  const [ghost, setGhost] = useState('')
  const suggestionRef = useRef('')        // full accepted string when ghost is shown
  const dataRef = useRef<{ books: Book[]; pericopes: Pericopes } | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [anchor, setAnchor] = useState<NoteAnchor | null>(null)  // committed passage → verse anchor for Notes

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch('/data/books.json').then(r => r.json()),
      fetch('/data/pericopes.json').then(r => r.json()),
    ]).then(([booksData, pericopes]) => {
      if (!alive) return
      const bks = [...(booksData.gnt ?? []), ...(booksData.lxx ?? [])] as Book[]
      dataRef.current = { books: bks, pericopes }
      setBooks(bks)
      computeGhost(input)
      setAnchor(parseAnchor(passage))
    }).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resolve a committed passage string to a canonical verse anchor for notes.
  function parseAnchor(value: string): NoteAnchor | null {
    const bks = dataRef.current?.books
    if (!bks) return null
    const m = value.trim().match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/)
    if (!m) return null
    const bookStr = norm(m[1])
    const book = bks.find(b =>
      norm(b.osisId) === bookStr || (b.abbrev && norm(b.abbrev) === bookStr) || norm(b.name) === bookStr ||
      norm(b.name).startsWith(bookStr) || norm(b.osisId).startsWith(bookStr))
    if (!book) return null
    const chapter = parseInt(m[2], 10), vs = parseInt(m[3], 10), ve = m[4] ? parseInt(m[4], 10) : vs
    return { book: book.osisId, name: book.name, chapter, verseStart: vs, verseEnd: Math.max(vs, ve) }
  }

  function commitPassage(value: string) { setPassage(value); setAnchor(parseAnchor(value)) }
  function jumpTo(ref: string) { setInput(ref); setGhost(''); commitPassage(ref); setTab('workspace') }

  // Derive the grey completion for the current box text.
  function computeGhost(value: string) {
    suggestionRef.current = ''
    const data = dataRef.current
    if (!data) { setGhost(''); return }
    // Capture "Book ch:vs" (ignoring any partial "-…" the user has started).
    const m = value.match(/^(\s*.+?\s+(\d+):(\d+))(?:\s*-\s*\d*)?\s*$/)
    if (!m) { setGhost(''); return }
    const prefix = m[1].replace(/\s+$/, '')
    const chapter = parseInt(m[2], 10)
    const startVerse = parseInt(m[3], 10)
    const bookStr = norm(prefix.slice(0, prefix.lastIndexOf(m[2] + ':' + m[3])))
    if (!bookStr) { setGhost(''); return }
    const book = data.books.find(b =>
      norm(b.osisId) === bookStr || (b.abbrev && norm(b.abbrev) === bookStr) || norm(b.name) === bookStr ||
      norm(b.name).startsWith(bookStr) || norm(b.osisId).startsWith(bookStr))
    if (!book) { setGhost(''); return }
    const sections = data.pericopes[book.osisId]
    if (!sections) { setGhost(''); return }
    const sec = sections.find(s =>
      (chapter > s.c || (chapter === s.c && startVerse >= s.v)) &&
      (chapter < s.ec || (chapter === s.ec && startVerse <= s.ev)))
    // Only suggest when the section ends within the typed chapter and past the start.
    if (!sec || sec.ec !== chapter || sec.ev <= startVerse) { setGhost(''); return }
    const suggestion = `${prefix}-${sec.ev}`
    if (suggestion.startsWith(value) && suggestion.length > value.length) {
      suggestionRef.current = suggestion
      setGhost(suggestion.slice(value.length))
    } else {
      setGhost('')
    }
  }

  function onChange(value: string) { setInput(value); computeGhost(value) }
  function accept() { const s = suggestionRef.current; setInput(s); setGhost(''); suggestionRef.current = ''; return s }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const atEnd = e.currentTarget.selectionStart === input.length && e.currentTarget.selectionEnd === input.length
    if (ghost && (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd))) {
      e.preventDefault(); accept(); return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const final = (ghost ? accept() : input).trim()
      commitPassage(final)
      e.currentTarget.blur()
    }
  }

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-brand-100 text-brand-800' : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <>
      {/* Shared passage box + tabs */}
      <div className="flex-none flex items-center flex-wrap gap-3 mb-2">
        <div className="flex items-center">
          <span className="px-3 py-1.5 rounded-l-lg bg-brand-600 text-white text-sm font-medium">Passage</span>
          {/* Relative wrapper so the grey ghost-text can overlay the input exactly. */}
          <div className="relative">
            {ghost && (
              <div aria-hidden className="pointer-events-none absolute inset-0 px-3 py-1.5 text-sm w-56 whitespace-pre overflow-hidden border border-transparent rounded-l-none rounded-r-lg">
                <span className="invisible">{input}</span><span className="text-gray-400">{ghost}</span>
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={e => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => { commitPassage(input.trim()); setGhost('') }}
              placeholder="e.g. Matthew 3:1-3"
              className="relative bg-transparent border border-gray-300 rounded-l-none rounded-r-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setTab('workspace')} className={tabClass(tab === 'workspace')}><PencilLine size={16} /> Exegesis</button>
          <button type="button" onClick={() => setTab('phrasing')} className={tabClass(tab === 'phrasing')}><ListTree size={16} /> Phrasing</button>
          <button type="button" onClick={() => setTab('synopsis')} className={tabClass(tab === 'synopsis')}><Columns3 size={16} /> Synopsis</button>
          <button type="button" onClick={() => setTab('notes')} className={tabClass(tab === 'notes')}><StickyNote size={16} /> Notes</button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col ${tab === 'workspace' ? '' : 'hidden'}`}>
        <ExegesisWorkspace isAuthenticated={isAuthenticated} controlledPassage={passage} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'phrasing' ? '' : 'hidden'}`}>
        <PhraseExplorer controlledPassage={passage} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'synopsis' ? '' : 'hidden'}`}>
        <SynopsisView controlledPassage={passage} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'notes' ? '' : 'hidden'}`}>
        <NotesView isAuthenticated={isAuthenticated} anchor={anchor} books={books} onJumpToPassage={jumpTo} />
      </div>
    </>
  )
}
