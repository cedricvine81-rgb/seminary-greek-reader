'use client'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
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
  bgClass?: string
  /**
   * 'panel' (default) = the fixed-height desktop card.
   * 'sheet' = height is controlled by the parent (used inside the mobile
   * bottom sheet), so we drop the fixed h-64 and the card border/shadow.
   */
  variant?: 'panel' | 'sheet'
}

export function ParsingPanel({ info, locked, bgClass = 'bg-surface', variant = 'panel' }: ParsingPanelProps) {
  const t = useT()
  const [entry, setEntry] = useState<LexiconEntry | null>(null)
  const [lsjEntry, setLsjEntry] = useState<string | null>(null)
  const isHebrew = info?.script === 'hebrew'
  const vocabGloss = isHebrew ? null : lookupVocabGloss(info?.lexeme)

  // Load Strong's-keyed lexicon (Thayer, Mounce, Abbott-Smith) — Greek only.
  useEffect(() => {
    if (isHebrew || !info?.strongs) { setEntry(null); return }
    const key = info.strongs.startsWith('G') ? info.strongs : `G${info.strongs}`
    loadLexicon()
      .then(dict => setEntry(dict[key] ?? null))
      .catch(() => setEntry(null))
  }, [info?.strongs, isHebrew])

  // Load LSJ by normalized lemma — Greek only.
  useEffect(() => {
    if (isHebrew || !info?.lexeme) { setLsjEntry(null); return }
    const norm = normalizeLemma(info.lexeme)
    loadLsj()
      .then(dict => setLsjEntry(dict[norm] ?? null))
      .catch(() => setLsjEntry(null))
  }, [info?.lexeme, isHebrew])

  // 'panel': fixed outer container — height never changes, content scrolls inside.
  // 'sheet': parent (the mobile bottom sheet) owns height/scroll, so grow to fill.
  const containerClass = variant === 'sheet'
    ? `flex-1 min-h-0 flex flex-col ${bgClass}`
    : `h-64 ${bgClass} rounded-xl border shadow-sm flex flex-col ${locked ? 'border-brand-400 ring-1 ring-brand-300' : 'border-gray-200'}`
  return (
    <div className={containerClass} data-parsing-pane>

      {!info ? (
        <div className="flex items-center justify-center h-full text-sm text-gray-400 italic px-5">
          {t('reader.hoverHint')}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 text-sm leading-snug">
          {/* Word + parsing header */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className={`${isHebrew ? 'font-hebrew' : 'greek-text'} text-lg font-semibold text-brand-800`} dir={isHebrew ? 'rtl' : undefined}>{info.surface}</span>
            <span className={`${isHebrew ? 'font-hebrew' : 'greek-text'} text-base text-gray-500`} dir={isHebrew ? 'rtl' : undefined}>{info.lexeme}</span>
            {isHebrew && info.transliteration && (
              <span className="text-xs text-gray-400 italic">{info.transliteration}</span>
            )}
            {info.strongs && (
              <span className="font-mono text-xs text-gray-400 bg-gray-50 rounded px-1">{info.strongs}</span>
            )}
            {locked && (
              <span className="ml-auto text-xs text-brand-500 font-medium">{t('reader.shiftHint')}</span>
            )}
          </div>
          <p className="text-gray-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">{t('study.parsing')}</span>
            {info.parsing}
          </p>

          {/* Hebrew: morpheme segment breakdown (prefixes/suffixes) */}
          {isHebrew && info.segments && info.segments.length > 0 && (
            <p className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">{t('reader.segments')}</span>
              {info.segments.map((s, i) => (
                <span key={i} className="inline-flex items-baseline gap-1">
                  <span className="font-hebrew text-base text-brand-800" dir="rtl">{s.text}</span>
                  <span className="text-xs text-gray-500">{s.label}{s.gloss ? ` · ${s.gloss}` : ''}</span>
                  {i < info.segments!.length - 1 && <span className="text-gray-300">+</span>}
                </span>
              ))}
            </p>
          )}

          {/* Hebrew: short gloss, then the fuller Brown-Driver-Briggs entry as the primary
              lexicon (falling back to the Strong's concise definition where BDB has none). */}
          {isHebrew && (
            <div className="text-gray-800">
              {info.gloss && (
                <p className="mb-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">{t('reader.gloss')}</span>
                  {info.gloss}
                </p>
              )}
              {info.bdbDefinition ? (
                <p className="mb-0 leading-relaxed">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">BDB</span>
                  {info.bdbDefinition}
                </p>
              ) : info.definition && info.definition !== info.gloss ? (
                <p className="mb-0">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">Strong&apos;s</span>
                  {info.definition}
                </p>
              ) : null}
            </div>
          )}

          {/* Lexical definitions (Greek) */}
          <div className={`text-gray-800 ${isHebrew ? 'hidden' : ''}`}>
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
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">{t('reader.vocabBuilder')}</span>
                {vocabGloss}
              </p>
            )}
            {!entry?.thayer && !entry?.mounce && !entry?.abbottSmith && !lsjEntry && !vocabGloss && info.gloss && (
              <p className="mb-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">{t('reader.gloss')}</span>
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
