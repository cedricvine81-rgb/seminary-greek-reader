'use client'
import { useState, FormEvent } from 'react'
import { Search } from 'lucide-react'
import type { SearchCorpus } from '@/lib/search'

interface SearchBarProps {
  onSearch: (query: string, type: 'word' | 'reference', corpus: SearchCorpus) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'word' | 'reference'>('word')
  const [corpus, setCorpus] = useState<SearchCorpus>('BOTH')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim(), type, corpus)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={type === 'word' ? 'Search Greek word…' : 'e.g. John 3:16'}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <select
        value={type}
        onChange={e => setType(e.target.value as 'word' | 'reference')}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      >
        <option value="word">By Greek word</option>
        <option value="reference">By reference</option>
      </select>

      <select
        value={corpus}
        onChange={e => setCorpus(e.target.value as SearchCorpus)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      >
        <option value="BOTH">Both corpora</option>
        <option value="GNT">Greek NT only</option>
        <option value="LXX">LXX only</option>
      </select>

      <button type="submit" className="btn-primary px-4 py-2 text-sm">
        Search
      </button>
    </form>
  )
}
