'use client'
import type { Corpus } from '@/types/biblical-text'
import { useT } from '@/lib/i18n/LocaleProvider'

interface CorpusSelectorProps {
  value: Corpus
  onChange: (corpus: Corpus) => void
}

export function CorpusSelector({ value, onChange }: CorpusSelectorProps) {
  const t = useT()
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden bg-surface">
      {(['GNT', 'LXX'] as Corpus[]).map(corpus => (
        <button
          key={corpus}
          onClick={() => onChange(corpus)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            value === corpus
              ? 'bg-brand-700 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {corpus === 'GNT' ? t('reader.greekNT') : 'LXX'}
        </button>
      ))}
    </div>
  )
}
