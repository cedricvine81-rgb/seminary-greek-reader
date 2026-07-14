'use client'
import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { Search, Delete } from 'lucide-react'
import { betaCodeToGreek } from '@/lib/greek-translit'

interface SearchBarProps {
  onSearch: (query: string, type: 'word' | 'reference', opts?: { lang?: string; lemma?: boolean }) => void
  // Mobile NT/LXX buttons switch the reader's corpus and open that corpus's passage picker.
  onVerseClick?: (corpus: 'GNT' | 'LXX') => void
  viewCorpus?: 'GNT' | 'LXX'
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

export function SearchBar({ onSearch, onVerseClick, viewCorpus, viewLang, viewLangLabel }: SearchBarProps) {
  const [query, setQuery]             = useState('')
  const [type, setType]               = useState<'word' | 'reference'>('reference')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [suggestions, setSuggestions] = useState<{ word: string; sub?: string }[]>([])

  const inputRef    = useRef<HTMLInputElement>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)
  // The last query we searched — so suggestions don't immediately re-open on that exact word.
  const lastSubmittedRef = useRef('')

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

  // Predictive word suggestions: after 2+ letters of a word search, fetch matching words.
  useEffect(() => {
    if (effectiveType !== 'word' || query.trim().length < 2 || query.trim() === lastSubmittedRef.current) { setSuggestions([]); return }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      const url = `/api/suggest?q=${encodeURIComponent(query.trim())}${effectiveLang ? `&lang=${effectiveLang}` : ''}`
      fetch(url, { signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : { suggestions: [] }))
        .then(d => setSuggestions(d.suggestions ?? []))
        .catch(() => { /* aborted / offline */ })
    }, 150)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [query, effectiveType, effectiveLang])

  // Close keyboard + suggestions when clicking outside the whole component
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowKeyboard(false)
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function submit() {
    if (query.trim()) { lastSubmittedRef.current = query.trim(); onSearch(query.trim(), effectiveType, effectiveLang ? { lang: effectiveLang } : undefined) }
    setSuggestions([])
  }

  // Pick a suggestion → fill it and search. A Greek pick is a lexeme, so search all its
  // forms; a translation pick is a plain word in that language.
  function pick(word: string) {
    lastSubmittedRef.current = word
    setQuery(word)
    setSuggestions([])
    setShowKeyboard(false)
    onSearch(word, effectiveType, effectiveLang ? { lang: effectiveLang } : { lemma: true })
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') setShowKeyboard(false)
  }

  // In Greek word mode, transliterate typed Latin → Greek live (TLG Beta Code: l→λ, q→θ …).
  // Greek text and non-letters pass through, and it's 1:1 so the cursor position is preserved.
  const greekTyping = effectiveType === 'word' && !effectiveLang
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (!greekTyping) { setQuery(e.target.value); return }
    const el = e.target
    const pos = el.selectionStart ?? el.value.length
    setQuery(betaCodeToGreek(el.value))
    requestAnimationFrame(() => { try { el.setSelectionRange(pos, pos) } catch {} })
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
                : 'px-3 py-2 bg-surface text-gray-600 hover:bg-gray-50'
            }
          >
            {t === 'word' ? 'Word' : 'Verse'}
          </button>
        ))}
      </div>

      {/* Mobile: NT / LXX each open that corpus's visual passage picker (and switch the
          reader to it). The active corpus is highlighted. Search box stays word-only. */}
      <div className="lg:hidden flex shrink-0 rounded-lg overflow-hidden border border-brand-600">
        {(['GNT', 'LXX'] as const).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => onVerseClick?.(c)}
            className={`px-2.5 py-2 text-sm font-medium ${
              viewCorpus === c ? 'bg-brand-600 text-white' : 'bg-surface text-brand-700'
            } ${c === 'LXX' ? 'border-l border-brand-600' : ''}`}
          >
            {c === 'GNT' ? 'NT' : 'LXX'}
          </button>
        ))}
      </div>

      {/* Search input + keyboard toggle */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={onChange}
          onKeyDown={handleKey}
          placeholder={effectiveLang ? `Search ${viewLangLabel ?? 'translation'}…` : effectiveType === 'word' ? 'Search Greek word…' : 'e.g. John 3:16'}
          className={`w-full pl-9 py-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${greekTyping ? 'greek-text' : ''} ${effectiveType === 'word' && !effectiveLang ? 'pr-10' : 'pr-3'}`}
        />
        {effectiveType === 'word' && !effectiveLang && (
          <button
            type="button"
            title="Greek keyboard — or just type Beta Code (l→λ, q→θ, h→η …)"
            onClick={() => setShowKeyboard(v => !v)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-sm font-semibold transition-colors ${showKeyboard ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-50'}`}
            style={{ fontFamily: "'Gentium Plus', Georgia, serif" }}
          >
            α
          </button>
        )}

        {/* Predictive word suggestions */}
        {suggestions.length > 0 && !showKeyboard && (
          <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-surface border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s.word}
                type="button"
                onMouseDown={e => { e.preventDefault(); pick(s.word) }}
                className="w-full text-left px-3 py-2 hover:bg-brand-50 border-b border-gray-50 last:border-0 flex items-baseline gap-2"
              >
                <span
                  className="text-gray-800 shrink-0"
                  style={effectiveLang ? { fontSize: '0.875rem' } : { fontFamily: "'Gentium Plus', Georgia, serif", fontSize: '1rem' }}
                >
                  {s.word}
                </span>
                {s.sub && <span className="text-xs text-gray-400 truncate">{s.sub}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Greek keyboard popup */}
      {showKeyboard && effectiveType === 'word' && !effectiveLang && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-gray-200 rounded-xl shadow-lg p-2 select-none">
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
