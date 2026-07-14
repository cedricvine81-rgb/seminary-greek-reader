'use client'
import { useEffect, useRef, useState } from 'react'
import { PencilLine, ListTree, Columns3, StickyNote, BookOpen, MoreVertical, X, Download, FolderClock, Scroll, Library, type LucideIcon } from 'lucide-react'
import { ExegesisWorkspace, type ExegesisWorkspaceHandle, type SavedSession } from './ExegesisWorkspace'
import { PhraseExplorer, PhrasingSourcesPanel, FONT_SIZES, type PhraseFontSize } from '@/components/phrase/PhraseExplorer'
import { SynopsisView } from '@/components/phrase/SynopsisView'
import { BackgroundsView, type OpenInTextsTarget } from '@/components/phrase/BackgroundsView'
import { onOpenInTexts } from '@/lib/open-in-texts-bus'
import { LIBRARY_WORKS } from '@/lib/backgrounds-library'
import { TextsReader } from '@/components/texts/TextsReader'
import { NotesView, type NoteAnchor } from './NotesView'
import { CommentaryView } from '@/components/commentary/CommentaryView'
import { TextSizeControls } from '@/components/reader/TextSizeControls'
import { useCommentaryFontScale, useCommentaryLineSpacing, useNoteFontScale, useNoteLineSpacing } from '@/lib/note-prefs'
import { SBL_ABBREVIATIONS } from '@/lib/sbl-abbreviations'

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
type ExegesisTab = 'workspace' | 'phrasing' | 'synopsis' | 'backgrounds' | 'texts' | 'notes' | 'commentary'
const EXEGESIS_TABS: ExegesisTab[] = ['workspace', 'phrasing', 'synopsis', 'backgrounds', 'texts', 'notes', 'commentary']

// Tab id → label + icon, shared by the desktop tab bar and the mobile hamburger menu.
const TAB_LIST: { id: ExegesisTab; label: string; Icon: LucideIcon }[] = [
  { id: 'workspace',   label: 'Syntax',      Icon: PencilLine },
  { id: 'phrasing',    label: 'Phrasing',    Icon: ListTree },
  { id: 'synopsis',    label: 'Synopsis',    Icon: Columns3 },
  { id: 'backgrounds', label: 'Backgrounds', Icon: Scroll },
  { id: 'texts',       label: 'Texts',       Icon: Library },
  { id: 'commentary',  label: 'Commentary',  Icon: BookOpen },
  { id: 'notes',       label: 'Notes',       Icon: StickyNote },
]

// Mobile switches tabs from inside the ⋮ menu and omits Backgrounds and Synopsis (too
// wide/complex to use comfortably on a phone — they stay desktop-only).
const MOBILE_HIDDEN_TABS: ExegesisTab[] = ['backgrounds', 'synopsis']
const MOBILE_TAB_LIST = TAB_LIST.filter(t => !MOBILE_HIDDEN_TABS.includes(t.id))

export function ExegesisTabs({ isAuthenticated, initialTab, initialOpen }: { isAuthenticated: boolean; initialTab?: string; initialOpen?: string }) {
  // Deep-link support: /exegesis?tab=phrasing opens straight to that tab (used by the
  // mobile Reader menu). Unknown/absent values fall back to the default Syntax tab.
  const [tab, setTab] = useState<ExegesisTab>(
    EXEGESIS_TABS.includes(initialTab as ExegesisTab) ? (initialTab as ExegesisTab) : 'workspace'
  )
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
  const [glossPref, setGlossPref] = useState<number | null>(null) // Vocabulary glossary threshold (drives the Exegesis tab)
  // Shared "tools" menu (⋮) next to Notes — one trigger/popover whose content swaps
  // per active tab. Exegesis's Vocabulary/PDF/Sessions are owned by ExegesisWorkspace;
  // we drive them imperatively via a ref and mirror its saved-sessions list here.
  const workspaceRef = useRef<ExegesisWorkspaceHandle>(null)
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const toolsMenuRef = useRef<HTMLDivElement>(null)
  // Phrasing / Synopsis text size (categorical, not persisted) and their static/derived
  // "sources & copyright" content, lifted up from each view so the shared menu can show it.
  const [phraseFontSize, setPhraseFontSize] = useState<PhraseFontSize>('lg')
  const [synFontSize, setSynFontSize] = useState<PhraseFontSize>('lg')
  const [synopsisAttribution, setSynopsisAttribution] = useState('')
  const [bgFontSize, setBgFontSize] = useState<PhraseFontSize>('lg')
  const [backgroundsAttribution, setBackgroundsAttribution] = useState('')
  const [textsFontSize, setTextsFontSize] = useState<PhraseFontSize>('lg')
  const [textsAttribution, setTextsAttribution] = useState('')
  // "Open in Texts" hand-off from Backgrounds — bumping the token forces the effect in
  // TextsReader to re-fire even if the same target is requested twice in a row.
  const [textsOpenRequest, setTextsOpenRequest] = useState<{ target: OpenInTextsTarget; token: number } | null>(null)
  const openRequestToken = useRef(0)
  function openInTexts(target: OpenInTextsTarget) {
    openRequestToken.current += 1
    setTextsOpenRequest({ target, token: openRequestToken.current })
    setTab('texts')
  }
  // Let the app-wide background-sources search open a hit here in place (when this workspace
  // is mounted), and honour an `open=<encoded target>` deep-link on first mount (used when
  // the search is triggered from another page and navigates here).
  useEffect(() => onOpenInTexts(openInTexts), [])
  useEffect(() => {
    if (!initialOpen) return
    try { openInTexts(JSON.parse(initialOpen) as OpenInTextsTarget) } catch { /* ignore malformed */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Commentary / Notes text size + line spacing (persisted, shared via the same
  // localStorage-backed hooks the views themselves use — both stay in sync).
  const [commentaryFontScale, setCommentaryFontScale] = useCommentaryFontScale()
  const [commentaryLineSpacing, setCommentaryLineSpacing] = useCommentaryLineSpacing()
  const [commentaryAttribution, setCommentaryAttribution] = useState<string | null>(null)
  const [noteFontScale, setNoteFontScale] = useNoteFontScale()
  const [noteLineSpacing, setNoteLineSpacing] = useNoteLineSpacing()

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

  useEffect(() => {
    if (!showToolsMenu) return
    function onMouseDown(e: MouseEvent) {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) setShowToolsMenu(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [showToolsMenu])

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
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shrink-0 ${
      active ? 'bg-brand-100 text-brand-800' : 'text-gray-500 hover:bg-gray-100'
    }`

  const toolsMenuTitles: Record<typeof tab, string> = {
    workspace: 'Syntax tools', phrasing: 'Settings & sources', synopsis: 'Settings & sources',
    backgrounds: 'Settings & sources', texts: 'Settings & sources', commentary: 'Commentary text', notes: 'Note text',
  }
  const toolsMenuTitle = toolsMenuTitles[tab]

  return (
    <>
      {/* Shared passage box + tabs. Mobile keeps everything on one row (passage input
          flexes) so the tab hamburger sits right after the passage box; desktop wraps
          with fixed widths. */}
      <div className="flex-none flex items-center flex-nowrap lg:flex-wrap gap-2 lg:gap-3 mb-2">
        <div className="flex items-center min-w-0 flex-1 lg:flex-none">
          <span className="px-3 py-1.5 rounded-l-lg bg-brand-600 text-white text-sm font-medium shrink-0">Passage</span>
          {/* Relative wrapper so the grey ghost-text can overlay the input exactly. */}
          <div className="relative flex-1 min-w-0 lg:flex-none">
            {ghost && (
              <div aria-hidden className="pointer-events-none absolute inset-0 px-3 py-1.5 text-sm w-full lg:w-56 whitespace-pre overflow-hidden border border-transparent rounded-l-none rounded-r-lg">
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
              className="relative bg-transparent border border-gray-300 rounded-l-none rounded-r-lg px-3 py-1.5 text-sm w-full lg:w-56 min-w-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
        {/* On narrow screens the 5 tabs can be wider than the viewport — let them scroll
            horizontally rather than clipping "Notes" off-screen. The tools menu sits
            outside this scroll container (a sibling, not a child): overflow-x-auto
            computes overflow-y to auto too, which would clip the dropdown's popover. */}
        <div className="flex items-center gap-1 shrink-0 lg:shrink lg:min-w-0">
          {/* Desktop: inline (horizontally scrolling) tab bar. */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {TAB_LIST.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={tabClass(tab === id)}><Icon size={16} /> {label}</button>
            ))}
          </div>

          {/* Shared tools menu (⋮) — content swaps with the active tab: Vocabulary/PDF/
              Sessions for Exegesis, text size + sources/copyright for the rest. */}
          <div ref={toolsMenuRef} className="relative shrink-0">
            <button
              type="button"
              title={toolsMenuTitle}
              onClick={() => setShowToolsMenu(v => !v)}
              className={`p-1.5 rounded-none transition-colors ${showToolsMenu ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <MoreVertical size={18} />
            </button>

            {showToolsMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-popover border border-gray-200 rounded-xl p-4 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{toolsMenuTitle}</span>
                  <button onClick={() => setShowToolsMenu(false)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                </div>

                {/* Mobile only: switch tabs from here (desktop uses the inline tab bar).
                    Backgrounds is intentionally omitted on mobile. */}
                <div className="lg:hidden border-b border-gray-100 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">View</p>
                  <div className="grid grid-cols-2 gap-1">
                    {MOBILE_TAB_LIST.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setTab(id); setShowToolsMenu(false) }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-none text-sm text-left transition-colors ${
                          tab === id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={16} className="shrink-0" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === 'workspace' && (
                  <>
                    {/* Vocabulary */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Vocabulary</p>
                      <select
                        value={glossPref ?? ''}
                        onChange={e => setGlossPref(e.target.value ? Number(e.target.value) : null)}
                        title="Show glosses for less common words"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      >
                        <option value="">Off</option>
                        <option value="50">Words less frequent than 50×</option>
                        <option value="30">Words less frequent than 30×</option>
                      </select>
                    </div>

                    {/* Download as PDF — close the menu and let it actually unmount (a
                        tick) before printing, or the open panel ends up in the print. */}
                    <button
                      type="button"
                      onClick={() => { setShowToolsMenu(false); setTimeout(() => workspaceRef.current?.exportPDF(), 0) }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download size={15} className="text-gray-400" /> Download as PDF
                    </button>

                    {/* My Sessions */}
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
                        <FolderClock size={13} /> My Sessions
                      </p>
                      {savedSessions.length === 0 ? (
                        <p className="text-sm text-gray-400">No saved sessions yet.</p>
                      ) : (
                        <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto -mx-1">
                          {savedSessions.map(s => (
                            <li key={s.id} className="flex items-center justify-between px-1 py-1.5 hover:bg-gray-50 rounded">
                              <button
                                type="button"
                                onClick={() => { workspaceRef.current?.loadSavedSession(s); setShowToolsMenu(false) }}
                                className="text-left flex-1 min-w-0"
                              >
                                <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                                <p className="text-xs text-gray-400">{new Date(s.updatedAt).toLocaleDateString()}</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => workspaceRef.current?.deleteSession(s.id)}
                                className="ml-2 text-red-400 hover:text-red-600 text-xs p-1"
                                title="Delete session"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}

                {tab === 'phrasing' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text size</p>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '0.85rem' }}>Α</span>
                        <input
                          type="range" min={0} max={FONT_SIZES.length - 1} step={1}
                          value={FONT_SIZES.indexOf(phraseFontSize)}
                          onChange={e => setPhraseFontSize(FONT_SIZES[e.target.valueAsNumber])}
                          className="flex-1 accent-brand-600"
                        />
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '1.5rem' }}>Α</span>
                      </div>
                    </div>
                    <PhrasingSourcesPanel />
                  </>
                )}

                {tab === 'synopsis' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text size</p>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '0.85rem' }}>Α</span>
                        <input
                          type="range" min={0} max={FONT_SIZES.length - 1} step={1}
                          value={FONT_SIZES.indexOf(synFontSize)}
                          onChange={e => setSynFontSize(FONT_SIZES[e.target.valueAsNumber])}
                          className="flex-1 accent-brand-600"
                        />
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '1.5rem' }}>Α</span>
                      </div>
                    </div>
                    {synopsisAttribution && (
                      <details className="border-t border-gray-100 pt-2">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">Sources &amp; copyright</summary>
                        <p className="text-xs text-gray-600 mt-2">{synopsisAttribution}</p>
                      </details>
                    )}
                  </>
                )}

                {tab === 'backgrounds' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text size</p>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '0.85rem' }}>Α</span>
                        <input
                          type="range" min={0} max={FONT_SIZES.length - 1} step={1}
                          value={FONT_SIZES.indexOf(bgFontSize)}
                          onChange={e => setBgFontSize(FONT_SIZES[e.target.valueAsNumber])}
                          className="flex-1 accent-brand-600"
                        />
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '1.5rem' }}>Α</span>
                      </div>
                    </div>
                    <details className="border-t border-gray-100 pt-2">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">Abbreviations (SBL)</summary>
                      <div className="mt-2 max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {SBL_ABBREVIATIONS.map(group => (
                          <details key={group.label} className="rounded border border-gray-100">
                            <summary className="cursor-pointer px-2 py-1 text-[11px] font-semibold text-gray-600 bg-gray-50 rounded">{group.label}</summary>
                            <div className="px-2 py-1.5 space-y-1">
                              {group.items.map(it => (
                                <div key={it.abbr} className="flex items-baseline gap-2 text-[11px]">
                                  <span className="font-mono font-medium text-gray-700 shrink-0">{it.abbr}</span>
                                  <span className="text-gray-400">{it.full}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                    <details className="border-t border-gray-100 pt-2">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">Online source texts</summary>
                      <p className="mt-2 mb-1.5 text-[11px] text-gray-400">Browse whole works — opens in a new tab.</p>
                      <div className="space-y-0.5">
                        {LIBRARY_WORKS.map(w => (
                          <a
                            key={w.url}
                            href={w.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-brand-50 hover:text-brand-800"
                          >
                            {w.label}
                          </a>
                        ))}
                      </div>
                    </details>
                    {backgroundsAttribution && (
                      <details className="border-t border-gray-100 pt-2">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">Sources &amp; copyright</summary>
                        <p className="text-xs text-gray-600 mt-2">{backgroundsAttribution}</p>
                      </details>
                    )}
                  </>
                )}

                {tab === 'texts' && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Text size</p>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '0.85rem' }}>Α</span>
                        <input
                          type="range" min={0} max={FONT_SIZES.length - 1} step={1}
                          value={FONT_SIZES.indexOf(textsFontSize)}
                          onChange={e => setTextsFontSize(FONT_SIZES[e.target.valueAsNumber])}
                          className="flex-1 accent-brand-600"
                        />
                        <span className="text-gray-400 select-none font-greek leading-none" style={{ fontSize: '1.5rem' }}>Α</span>
                      </div>
                    </div>
                    {textsAttribution && (
                      <details className="border-t border-gray-100 pt-2">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">Sources &amp; copyright</summary>
                        <p className="text-xs text-gray-600 mt-2">{textsAttribution}</p>
                      </details>
                    )}
                  </>
                )}

                {tab === 'commentary' && (
                  <>
                    <TextSizeControls
                      fontScale={commentaryFontScale} onFontScale={setCommentaryFontScale}
                      lineSpacing={commentaryLineSpacing} onLineSpacing={setCommentaryLineSpacing}
                    />
                    {commentaryAttribution && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Copyright</p>
                        <p className="text-[11px] leading-relaxed text-gray-500">{commentaryAttribution}</p>
                      </div>
                    )}
                  </>
                )}

                {tab === 'notes' && (
                  <TextSizeControls
                    fontScale={noteFontScale} onFontScale={setNoteFontScale}
                    lineSpacing={noteLineSpacing} onLineSpacing={setNoteLineSpacing}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 min-h-0 flex flex-col ${tab === 'workspace' ? '' : 'hidden'}`}>
        <ExegesisWorkspace ref={workspaceRef} isAuthenticated={isAuthenticated} controlledPassage={passage}
          glossPref={glossPref} onGlossPref={setGlossPref} savedSessions={savedSessions} onSavedSessions={setSavedSessions} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'phrasing' ? '' : 'hidden'}`}>
        <PhraseExplorer controlledPassage={passage} isAuthenticated={isAuthenticated}
          fontSize={phraseFontSize} onFontSize={setPhraseFontSize} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'synopsis' ? '' : 'hidden'}`}>
        <SynopsisView controlledPassage={passage} isAuthenticated={isAuthenticated}
          fontSize={synFontSize} onFontSize={setSynFontSize} onAttribution={setSynopsisAttribution} />
      </div>
      <div className={`flex-1 min-h-0 flex flex-col ${tab === 'backgrounds' ? '' : 'hidden'}`}>
        <BackgroundsView controlledPassage={passage} isAuthenticated={isAuthenticated}
          fontSize={bgFontSize} onFontSize={setBgFontSize} onAttribution={setBackgroundsAttribution} onOpenInTexts={openInTexts} />
      </div>
      <div className={`flex-1 min-h-0 flex flex-col ${tab === 'texts' ? '' : 'hidden'}`}>
        <TextsReader isAuthenticated={isAuthenticated} openRequest={textsOpenRequest}
          fontSize={textsFontSize} onFontSize={setTextsFontSize} onAttribution={setTextsAttribution} />
      </div>
      <div className={`flex-1 min-h-0 ${tab === 'commentary' ? '' : 'hidden'}`}>
        <CommentaryView anchor={anchor} isAuthenticated={isAuthenticated} onAttribution={setCommentaryAttribution} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${tab === 'notes' ? '' : 'hidden'}`}>
        <NotesView isAuthenticated={isAuthenticated} anchor={anchor} books={books} onJumpToPassage={jumpTo} />
      </div>
    </>
  )
}
