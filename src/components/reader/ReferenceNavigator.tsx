'use client'
import { useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BiblicalBook } from '@/types/biblical-text'

interface ReferenceNavigatorProps {
  books: BiblicalBook[]
  selectedBook: BiblicalBook | null
  selectedChapter: number
  onNavigate: (book: BiblicalBook, chapter: number) => void
}

export function ReferenceNavigator({
  books, selectedBook, selectedChapter, onNavigate,
}: ReferenceNavigatorProps) {
  const t = useT()
  function prevChapter() {
    if (!selectedBook) return
    if (selectedChapter > 1) {
      onNavigate(selectedBook, selectedChapter - 1)
    } else {
      const idx = books.findIndex(b => b.id === selectedBook.id)
      if (idx > 0) onNavigate(books[idx - 1], books[idx - 1].totalChapters)
    }
  }

  function nextChapter() {
    if (!selectedBook) return
    if (selectedChapter < selectedBook.totalChapters) {
      onNavigate(selectedBook, selectedChapter + 1)
    } else {
      const idx = books.findIndex(b => b.id === selectedBook.id)
      if (idx < books.length - 1) onNavigate(books[idx + 1], 1)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Book select */}
      <select
        value={selectedBook?.id ?? ''}
        onChange={e => {
          const book = books.find(b => b.id === e.target.value)
          if (book) onNavigate(book, 1)
        }}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
      >
        <option value="">{t('reader.selectBook')}</option>
        {books.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>

      {/* Chapter select */}
      {selectedBook && (
        <select
          value={selectedChapter}
          onChange={e => onNavigate(selectedBook, Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
        >
          {Array.from({ length: selectedBook.totalChapters }, (_, i) => i + 1).map(ch => (
            <option key={ch} value={ch}>{t('reader.chapterN', { n: ch })}</option>
          ))}
        </select>
      )}

      {/* Prev / Next */}
      <button onClick={prevChapter} disabled={!selectedBook} className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40" aria-label={t('reader.prevChapter')}>
        <ChevronLeft size={16} />
      </button>
      <button onClick={nextChapter} disabled={!selectedBook} className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40" aria-label={t('reader.nextChapter')}>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
