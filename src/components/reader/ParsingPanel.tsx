'use client'
import { useEffect, useState } from 'react'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { VOCAB_GLOSSES } from '@/lib/vocab-glosses'

function lookupVocabGloss(lexeme: string | undefined): string | null {
  if (!lexeme) return null
  if (VOCAB_GLOSSES[lexeme]) return VOCAB_GLOSSES[lexeme]
  // Strip diacritics and try a normalized match (handles accent variants)
  const stripped = lexeme.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
  for (const [key, gloss] of Object.entries(VOCAB_GLOSSES)) {
    const kStripped = key.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
    if (kStripped === stripped) return gloss
  }
  return null
}

interface LexiconEntry {
  thayer?: string
  mounce?: string
  abbottSmith?: string
}

type LexiconDict = Record<string, LexiconEntry>
type LsjDict = Record<string, string>

let _lexCache: LexiconDict | null = null
let _lexLoading: Promise<LexiconDict> | null = null

let _lsjCache: LsjDict | null = null
let _lsjLoading: Promise<LsjDict> | null = null

function loadLexicon(): Promise<LexiconDict> {
  if (_lexCache) return Promise.resolve(_lexCache)
  if (_lexLoading) return _lexLoading
  _lexLoading = fetch('/data/greek-lexicon.json')
    .then(r => r.json())
    .then(d => { _lexCache = d; return d })
  return _lexLoading
}

function loadLsj(): Promise<LsjDict> {
  if (_lsjCache) return Promise.resolve(_lsjCache)
  if (_lsjLoading) return _lsjLoading
  _lsjLoading = fetch('/data/lsj.json')
    .then(r => r.json())
    .then(d => { _lsjCache = d; return d })
  return _lsjLoading
}

// Strip diacritics + lowercase + unify sigma variants to match LSJ index keys
function normalizeLemma(lemma: string): string {
  return lemma.normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
}

interface ParsingPanelProps {
  info: LexicalInfoPanel | null
  locked?: boolean
}

export function ParsingPanel({ info, locked }: ParsingPanelProps) {
  const [entry, setEntry] = useState<LexiconEntry | null>(null)
  const [lsjEntry, setLsjEntry] = useState<string | null>(null)
  const vocabGloss = lookupVocabGloss(info?.lexeme)

  // Load Strong's-keyed lexicon (Thayer, Mounce, Abbott-Smith)
  useEffect(() => {
    if (!info?.strongs) { setEntry(null); return }
    const key = info.strongs.startsWith('G') ? info.strongs : `G${info.strongs}`
    loadLexicon()
      .then(dict => setEntry(dict[key] ?? null))
      .catch(() => setEntry(null))
  }, [info?.strongs])

  // Load LSJ by normalized lemma
  useEffect(() => {
    if (!info?.lexeme) { setLsjEntry(null); return }
    const norm = normalizeLemma(info.lexeme)
    loadLsj()
      .then(dict => setLsjEntry(dict[norm] ?? null))
      .catch(() => setLsjEntry(null))
  }, [info?.lexeme])

  // Fixed outer container — height never changes, content scrolls inside
  return (
    <div className={`h-44 bg-white rounded-xl border shadow-sm flex flex-col ${locked ? 'border-brand-400 ring-1 ring-brand-300' : 'border-gray-200'}`}>
      {!info ? (
        <div className="flex items-center justify-center h-full text-sm text-gray-400 italic px-5">
          Hover or click any Greek word to see lexical information.
        </div>
      ) : (
        <div className="overflow-y-auto px-5 py-3 text-sm leading-snug">
          {/* Word + parsing header */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="greek-text text-lg font-semibold text-brand-800">{info.surface}</span>
            <span className="greek-text text-base text-gray-500">{info.lexeme}</span>
            {info.strongs && (
              <span className="font-mono text-xs text-gray-400 bg-gray-50 rounded px-1">{info.strongs}</span>
            )}
            {locked && (
              <span className="ml-auto text-xs text-brand-500 font-medium">Shift key to enter/exit scrolling</span>
            )}
          </div>
          <p className="text-gray-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Parsing</span>
            {info.parsing}
          </p>

          {/* Lexical definitions */}
          <div className="text-gray-800">
            {entry?.thayer && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Thayer&apos;s</span>
                {entry.thayer}
              </p>
            )}
            {entry?.mounce && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Open GNT</span>
                {entry.mounce}
              </p>
            )}
            {entry?.abbottSmith && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Abbott-Smith</span>
                {entry.abbottSmith}
              </p>
            )}
            {lsjEntry && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Liddell-Scott</span>
                {lsjEntry}
              </p>
            )}
            {vocabGloss && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Vocab Builder</span>
                {vocabGloss}
              </p>
            )}
            {!entry?.thayer && !entry?.mounce && !entry?.abbottSmith && !lsjEntry && !vocabGloss && info.gloss && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Gloss</span>
                {info.gloss}
              </p>
            )}
          </div>

          <p className="mt-1 pt-1 border-t border-gray-100 text-xs text-gray-400">{info.reference}</p>
        </div>
      )}
    </div>
  )
}
