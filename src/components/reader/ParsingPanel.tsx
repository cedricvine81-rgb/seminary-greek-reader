import type { LexicalInfoPanel } from '@/types/lexicon'

interface ParsingPanelProps {
  info: LexicalInfoPanel | null
}

export function ParsingPanel({ info }: ParsingPanelProps) {
  if (!info) {
    return (
      <div className="parsing-panel text-gray-400 text-sm italic">
        Hover over a Greek word to see parsing information.
      </div>
    )
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Surface form',   value: info.surface },
    { label: 'Lexical form',   value: info.lexeme },
    { label: 'Gloss',          value: info.gloss },
    { label: 'Part of speech', value: info.partOfSpeech },
    { label: 'Parsing',        value: info.parsing },
    { label: 'Reference',      value: info.reference },
  ]

  if (info.strongs) rows.push({ label: "Strong's", value: info.strongs })

  return (
    <div className="parsing-panel">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="greek-text text-2xl text-brand-800 font-medium">{info.surface}</span>
        <span className="text-sm text-gray-500">{info.lexeme}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(({ label, value }) => (
          value ? (
            <>
              <dt key={`${label}-dt`} className="text-gray-500 font-medium whitespace-nowrap">{label}</dt>
              <dd key={`${label}-dd`} className="text-gray-900">{value}</dd>
            </>
          ) : null
        ))}
      </dl>
    </div>
  )
}
