'use client'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Search, Delete } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string, type: 'word' | 'reference', lang?: string) => void
  // Mobile "Verse" button opens the passage picker, which the reader renders at top level.
  onVerseClick?: () => void
  // The translation currently in view on mobile (null = Greek). When set, the search box
  // searches that translation's text instead of Greek.
  viewLang?: string | null
  viewLangLabel?: string
}

// Rows match a compact Greek keyboard layout
const GREEK_ROWS = [
  ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι'],
  ['κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ'],
  ['σ', 'ς', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'],
]

export function SearchBar({ onSearch, onVerseClick, viewLang, viewLangLabel }: SearchBarProps) {
  const [query, setQuery]             = useState('')
  const [type, setType]               = useState<'word' | 'reference'>('reference')
  const [showKeyboard, setShowKeyboard] = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)

  // On mobile the Verse/Word toggle is replaced by a "Verse" button (opens the visual
  // passage picker) and the search box is word-only, so force the word type there.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const effectiveType = isMobile ? 'word' : type
  // On mobile, a non-null viewLang means a translation is showing → search that language.
  const effectiveLang = isMobile && effectiveType === 'word' ? (viewLang ?? null) : null

  // Close keyboard when clicking outside the whole component
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowKeyboard(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function submit() {
    if (query.trim()) onSearch(query.trim(), effectiveType, effectiveLang ?? undefined)
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') setShowKeyboard(false)
  }

  function insertLetter(letter: string) {
    const input = inputRef.current
    if (!input) { setQuery(q => q + letter); return }
    const start = input.selectionStart ?? query.length
    const end   = input.selectionEnd   ?? query.length
    const next  = query.slice(0, start) + letter + query.slice(end)
    setQuery(next)
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(start + 1, start + 1)
    })
  }

  function deleteLetter() {
    const input = inputRef.current
    if (!input) { setQuery(q => q.slice(0, -1)); return }
    const start = input.selectionStart ?? query.length
    const end   = input.selectionEnd   ?? query.length
    let next: string
    let cursor: number
    if (start !== end) {
      next   = query.slice(0, start) + query.slice(end)
      cursor = start
    } else if (start > 0) {
      next   = query.slice(0, start - 1) + query.slice(start)
      cursor = start - 1
    } else {
      return
    }
    setQuery(next)
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div ref={wrapperRef} className="relative flex items-center gap-2">
      {/* Desktop: Verse | Word type toggle. */}
      <div className="hidden lg:flex rounded-lg border border-gray-300 overflow-hidden text-sm shrink-0">
        {(['reference', 'word'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); if (t !== 'word') setShowKeyboard(false) }}
            className={
              type === t
                ? 'px-3 py-2 bg-brand-600 text-white font-medium'
                : 'px-3 py-2 bg-white text-gray-600 hover:bg-gray-50'
            }
          >
            {t === 'word' ? 'Word' : 'Verse'}
          </button>
        ))}
      </div>

      {/* Mobile: "Verse" opens the visual passage picker; the search box is word-only. */}
      <button
        type="button"
        onClick={onVerseClick}
        className="lg:hidden shrink-0 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium"
      >
        Verse
      </button>

      {/* Search input + keyboard toggle */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder={effectiveLang ? `Search ${viewLangLabel ?? 'translation'}…` : effectiveType === 'word' ? 'Search Greek word…' : 'e.g. John 3:16'}
          className={`w-full pl-9 py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${effectiveType === 'word' && !effectiveLang ? 'pr-10' : 'pr-3'}`}
        />
        {effectiveType === 'word' && !effectiveLang && (
          <button
            type="button"
            title="Greek keyboard"
            onClick={() => setShowKeyboard(v => !v)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-sm font-semibold transition-colors ${showKeyboard ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-50'}`}
            style={{ fontFamily: "'Gentium Plus', Georgia, serif" }}
          >
            α
          </button>
        )}
      </div>

      {/* Greek keyboard popup */}
      {showKeyboard && effectiveType === 'word' && !effectiveLang && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 select-none">
          {GREEK_ROWS.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-1">
              {row.map(letter => (
                <button
                  key={letter}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); insertLetter(letter) }}
                  className="w-8 h-8 flex items-center justify-center rounded text-base text-brand-800 hover:bg-brand-50 active:bg-brand-100 transition-colors"
                  style={{ fontFamily: "'Gentium Plus', Georgia, serif" }}
                >
                  {letter}
                </button>
              ))}
              {/* Backspace on last row */}
              {ri === GREEK_ROWS.length - 1 && (
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); deleteLetter() }}
                  className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors ml-1"
                  title="Backspace"
                >
                  <Delete size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
