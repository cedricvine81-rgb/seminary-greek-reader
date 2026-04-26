'use client'
import { useState, useEffect } from 'react'
import { CorpusSelector } from './CorpusSelector'
import { ReferenceNavigator } from './ReferenceNavigator'
import { SearchBar } from './SearchBar'
import { GreekVerse } from './GreekVerse'
import { ParsingPanel } from './ParsingPanel'
import type { Corpus, BiblicalBook, BiblicalVerse } from '@/types/biblical-text'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { SearchCorpus } from '@/lib/search'
import { SAMPLE_JOHN_1, SAMPLE_GEN_1 } from '@/data/sample-reader-data'

export function GreekReader() {
  const [corpus, setCorpus] = useState<Corpus>('GNT')
  const [books, setBooks] = useState<BiblicalBook[]>([])
  const [selectedBook, setSelectedBook] = useState<BiblicalBook | null>(null)
  const [chapter, setChapter] = useState(1)
  const [verses, setVerses] = useState<BiblicalVerse[]>([])
  const [activeWordId, setActiveWordId] = useState<string | null>(null)
  const [parsingInfo, setParsingInfo] = useState<LexicalInfoPanel | null>(null)
  const [searchResults, setSearchResults] = useState<BiblicalVerse[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load books when corpus changes
  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/reader?corpus=${corpus}`)
      .then(r => r.json())
      .then(data => {
        setBooks(data.books ?? [])
        setSelectedBook(null)
        setVerses(corpus === 'GNT' ? SAMPLE_JOHN_1 : SAMPLE_GEN_1)
        setSearchResults(null)
      })
      .catch(() => {
        setVerses(corpus === 'GNT' ? SAMPLE_JOHN_1 : SAMPLE_GEN_1)
      })
      .finally(() => setIsLoading(false))
  }, [corpus])

  async function handleNavigate(book: BiblicalBook, ch: number) {
    setSelectedBook(book)
    setChapter(ch)
    setSearchResults(null)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/reader?book=${book.osisId}&chapter=${ch}`)
      const data = await res.json()
      setVerses(data.verses ?? [])
    } catch {
      setVerses([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSearch(query: string, type: 'word' | 'reference', searchCorpus: SearchCorpus) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&corpus=${searchCorpus}`)
      const data = await res.json()
      setSearchResults(data.results ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  function handleWordHover(wordId: string | null, info: LexicalInfoPanel | null) {
    setActiveWordId(wordId)
    setParsingInfo(info)
  }

  const displayVerses = searchResults ?? verses

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <CorpusSelector value={corpus} onChange={c => { setCorpus(c); setSearchResults(null) }} />
        <ReferenceNavigator
          books={books}
          selectedBook={selectedBook}
          selectedChapter={chapter}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Search */}
      <SearchBar onSearch={handleSearch} />

      {/* Search result header */}
      {searchResults && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
          <button
            className="text-sm text-brand-600 hover:underline"
            onClick={() => setSearchResults(null)}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Text area */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-h-[360px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
        ) : displayVerses.length === 0 ? (
          <p className="text-gray-400 text-sm italic">Select a book and chapter to begin reading.</p>
        ) : (
          <div className="space-y-1">
            {displayVerses.map(v => (
              <GreekVerse
                key={v.id}
                verse={v}
                activeWordId={activeWordId}
                onWordHover={handleWordHover}
              />
            ))}
          </div>
        )}
      </div>

      {/* Parsing panel */}
      <ParsingPanel info={parsingInfo} />
    </div>
  )
}
