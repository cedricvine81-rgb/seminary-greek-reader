'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Reusable passage input with the same predictive behaviour as the shared Exegesis passage
// box: grey ghost-text completing the current pericope (accept with Tab / → / Enter) and a
// dropdown of the chapter's labelled sections (BSB pericopes). Drop it into any "type a
// passage" field so the affordance is consistent across the Exegesis tools.
//
// The dropdown renders in a portal (fixed position) so it is never clipped by a scrolling
// ancestor (e.g. the Synopsis columns). Book + pericope data are fetched once and shared.

type Book = { osisId: string; name: string; abbrev?: string }
type Section = { c: number; v: number; ec: number; ev: number; t: string }
type Pericopes = Record<string, Section[]>

const norm = (s: string) => s.toLowerCase().replace(/[\s.]/g, '')

let cache: { books: Book[]; pericopes: Pericopes } | null = null
let inflight: Promise<{ books: Book[]; pericopes: Pericopes }> | null = null
function loadData(): Promise<{ books: Book[]; pericopes: Pericopes }> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = Promise.all([
      fetch('/data/books.json').then(r => r.json()),
      fetch('/data/pericopes.json').then(r => r.json()),
    ]).then(([booksData, pericopes]) => {
      cache = { books: [...(booksData.gnt ?? []), ...(booksData.lxx ?? [])] as Book[], pericopes: pericopes as Pericopes }
      return cache
    }).catch(() => ({ books: [] as Book[], pericopes: {} as Pericopes }))
  }
  return inflight
}

function findBook(books: Book[], bookStr: string): Book | undefined {
  return books.find(b =>
    norm(b.osisId) === bookStr || (b.abbrev && norm(b.abbrev) === bookStr) || norm(b.name) === bookStr ||
    norm(b.name).startsWith(bookStr) || norm(b.osisId).startsWith(bookStr))
}

export function PassageAutocomplete({
  value, onChange, onCommit, placeholder, inputClassName = '', error, commitOnBlur,
}: {
  value: string
  onChange: (v: string) => void
  onCommit: (v: string) => void          // Enter, a picked section, or (if commitOnBlur) blur
  placeholder?: string
  inputClassName?: string
  error?: boolean
  commitOnBlur?: boolean
}) {
  const dataRef = useRef<{ books: Book[]; pericopes: Pericopes } | null>(cache)
  const [, force] = useState(0)
  const [ghost, setGhost] = useState('')
  const suggestion = useRef('')
  const [chapterSecs, setChapterSecs] = useState<{ ref: string; title: string }[]>([])
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dataRef.current) return
    let alive = true
    loadData().then(d => { if (alive) { dataRef.current = d; force(n => n + 1) } })
    return () => { alive = false }
  }, [])

  // Keep the portal dropdown pinned to the input while it's open.
  useEffect(() => {
    if (!open) return
    const update = () => { if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect()) }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [open, chapterSecs.length])

  function computeGhost(v: string) {
    suggestion.current = ''
    const data = dataRef.current
    if (!data) return setGhost('')
    const m = v.match(/^(\s*.+?\s+(\d+):(\d+))(?:\s*-\s*\d*)?\s*$/)
    if (!m) return setGhost('')
    const prefix = m[1].replace(/\s+$/, '')
    const chapter = parseInt(m[2], 10)
    const startVerse = parseInt(m[3], 10)
    const bookStr = norm(prefix.slice(0, prefix.lastIndexOf(m[2] + ':' + m[3])))
    if (!bookStr) return setGhost('')
    const book = findBook(data.books, bookStr)
    const sections = book && data.pericopes[book.osisId]
    if (!sections) return setGhost('')
    const sec = sections.find(s =>
      (chapter > s.c || (chapter === s.c && startVerse >= s.v)) &&
      (chapter < s.ec || (chapter === s.ec && startVerse <= s.ev)))
    if (!sec || sec.ec !== chapter || sec.ev <= startVerse) return setGhost('')
    const full = `${prefix}-${sec.ev}`
    if (full.startsWith(v) && full.length > v.length) { suggestion.current = full; setGhost(full.slice(v.length)) }
    else setGhost('')
  }

  function computeSections(v: string) {
    const data = dataRef.current
    const m = data && v.match(/^\s*(.+?)\s+(\d+)(?::\d+)?\s*(?:-.*)?$/)
    if (!m) return setChapterSecs([])
    const chapter = parseInt(m[2], 10)
    const book = findBook(data!.books, norm(m[1]))
    if (!book) return setChapterSecs([])
    setChapterSecs((data!.pericopes[book.osisId] ?? [])
      .filter(s => s.c <= chapter && chapter <= s.ec)
      .map(s => ({ ref: `${book.name} ${s.c}:${s.v}${s.c === s.ec ? `-${s.ev}` : `-${s.ec}:${s.ev}`}`, title: s.t })))
  }

  function handleChange(v: string) { onChange(v); computeGhost(v); computeSections(v); setOpen(true) }
  function accept() { const s = suggestion.current; if (s) { onChange(s); setGhost(''); suggestion.current = '' } return s || value }
  function pick(ref: string) { onChange(ref); setGhost(''); setOpen(false); onCommit(ref) }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const atEnd = e.currentTarget.selectionStart === value.length && e.currentTarget.selectionEnd === value.length
    if (ghost && (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd))) { e.preventDefault(); accept(); return }
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      const final = (ghost ? accept() : value).trim()
      setGhost(''); setOpen(false)
      onCommit(final)
      e.currentTarget.blur()
    }
  }

  const left = rect ? Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 400) - 300) : 0

  return (
    <div ref={wrapRef} className="relative min-w-0">
      {ghost && (
        <div aria-hidden className={`pointer-events-none absolute inset-0 whitespace-pre overflow-hidden !border-transparent !bg-transparent ${inputClassName}`}>
          <span className="invisible">{value}</span><span className="text-gray-400">{ghost}</span>
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => { if (chapterSecs.length) setOpen(true) }}
        onBlur={() => { setGhost(''); setOpen(false); if (commitOnBlur) onCommit(value.trim()) }}
        placeholder={placeholder}
        className={`relative bg-transparent ${error ? 'border-red-400 focus:ring-red-400' : ''} ${inputClassName}`}
      />
      {open && chapterSecs.length > 0 && rect && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[60] w-72 max-w-[92vw] overflow-hidden overflow-y-auto rounded-lg border border-gray-200 bg-popover py-1 shadow-lg max-h-72"
          style={{ top: rect.bottom + 4, left: Math.max(8, left) }}
        >
          {chapterSecs.map(s => (
            <button
              key={s.ref}
              type="button"
              onMouseDown={e => { e.preventDefault(); pick(s.ref) }}
              className="block w-full px-3 py-1.5 text-left hover:bg-brand-50"
            >
              <span className="text-xs font-medium text-brand-700">{s.ref}</span>
              <span className="ml-2 text-xs text-gray-500">{s.title}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
