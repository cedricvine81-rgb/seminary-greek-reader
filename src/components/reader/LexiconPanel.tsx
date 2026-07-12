'use client'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { VerseWord } from '@/types/biblical-text'
import { formatParsing } from '@/lib/morph-formatting'

interface StrongsEntry { lemma: string; def: string; kjv: string }

// Full lexicon entry for a word (#4): the lexeme data already on the word (gloss, extended
// gloss, part of speech, frequency, Strong's) plus the Strong's lexical definition fetched
// lazily from /api/lexicon.
export function LexiconPanel({ word, onClose }: { word: VerseWord; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const lex = word.lexeme
  const parse = word.parses?.[0]
  const strongs = lex?.strongs
  const [entry, setEntry] = useState<StrongsEntry | null>(null)
  const [loading, setLoading] = useState(!!strongs)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOutside) }
  }, [onClose])

  useEffect(() => {
    if (!strongs) return
    let alive = true
    setLoading(true)
    fetch(`/api/lexicon?strongs=${encodeURIComponent(strongs)}`)
      .then(r => r.json())
      .then(d => { if (alive) setEntry(d.entry ?? null) })
      .catch(() => { if (alive) setEntry(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [strongs])

  const serif = { fontFamily: "'Gentium Plus', Georgia, serif" }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4">
      <div ref={ref} className="w-full sm:max-w-lg max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
          <div>
            <span className="text-2xl font-semibold text-brand-800 leading-tight block" style={serif}>
              {lex?.lexeme ?? word.surface}
            </span>
            <span className="text-xs text-gray-500">
              {lex?.partOfSpeech}{typeof lex?.frequency === 'number' ? ` · ${lex.frequency}× in the NT` : ''}
              {strongs ? ` · Strong's ${String(strongs).replace(/^0+/, '')}` : ''}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 p-1 -mr-1"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">This form</p>
            <p className="text-gray-800"><span style={serif} className="text-base">{word.surface}</span>{parse ? ` — ${formatParsing(parse)}` : ''}</p>
          </div>

          {lex?.gloss && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Gloss</p>
              <p className="text-gray-800">{lex.gloss}</p>
            </div>
          )}

          {lex?.extendedGloss && lex.extendedGloss !== lex.gloss && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Extended</p>
              <p className="text-gray-700 leading-relaxed">{lex.extendedGloss}</p>
            </div>
          )}

          {strongs && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Strong's definition</p>
              {loading ? (
                <p className="text-gray-400 italic text-xs">Loading…</p>
              ) : entry ? (
                <div className="space-y-1">
                  <p className="text-gray-700 leading-relaxed">{entry.def}</p>
                  {entry.kjv && <p className="text-xs text-gray-400">KJV: {entry.kjv}</p>}
                </div>
              ) : (
                <p className="text-gray-400 italic text-xs">No entry.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
