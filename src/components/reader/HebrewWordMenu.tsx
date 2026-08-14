'use client'
import { useEffect, useRef, useState } from 'react'
import { translateParsing } from '@/lib/i18n/morph-labels'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { X } from 'lucide-react'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { WordHighlight } from '@/lib/word-search-bus'
import { HighlightSwatches } from '@/components/highlights/HighlightSwatches'
import { openMasterSearch } from '@/lib/master-search-bus'
import { isExamLocked } from '@/lib/exam-lockdown'
import { loadMaculaHebrew, lookupMaculaHebrew, maculaRole, maculaClause, type MaculaHebrewEntry } from '@/lib/macula-hebrew'
import { resolverFor, type GlossResolver } from '@/lib/vocab-gloss-lookup'

// The right-click menu for a Hebrew word: an optional Highlight row (signed-in readers) plus the
// full Strong's lexicon entry — the parity counterpart to the Greek word's syntax/search menu.
// Left-clicking a word still populates the inline parsing pane; this pins a fuller reference view.
export function HebrewWordMenu({ info, wordId, x, y, highlight, onClose }: {
  info: LexicalInfoPanel
  wordId: string          // reader word id, e.g. "Gen.1.1.3" — for the Macula syntax lookup
  x: number
  y: number
  highlight?: WordHighlight
  onClose: () => void
}) {
  const t = useT()
  const locale = useLocale()
  // The same deck resolver the parsing pane uses. Without it this menu showed the raw
  // English gloss beside a fully Spanish lexicon entry — the Hebrew reader's most-used
  // click target, and the surface where a student can least guess the meaning.
  const [deckGloss, setDeckGloss] = useState<GlossResolver>(() => () => null)
  useEffect(() => {
    let alive = true
    resolverFor(locale, 'hebrew').then(r => { if (alive) setDeckGloss(() => r) })
    return () => { alive = false }
  }, [locale])
  const translatedGloss = info.lexeme ? deckGloss(info.lexeme) : null
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [syntax, setSyntax] = useState<MaculaHebrewEntry | null>(null)

  // Macula Hebrew syntax for this word (loaded per book, lazily).
  useEffect(() => {
    let alive = true
    const osisId = wordId.split('.')[0]
    loadMaculaHebrew(osisId).then(book => { if (alive) setSyntax(lookupMaculaHebrew(book, wordId)) })
    return () => { alive = false }
  }, [wordId])
  const syntaxRole = syntax ? maculaRole(syntax) : null
  const syntaxClause = syntax ? maculaClause(syntax) : null

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [onClose])

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1200) }).catch(() => {})
  }

  const menuW = 320
  const left = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - menuW - 8)
  const top  = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 360)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: Math.max(8, top), left: Math.max(8, left), zIndex: 1000, width: menuW, maxHeight: '75vh' }}
      className="bg-popover border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
        <div className="min-w-0">
          <span className="font-hebrew text-xl font-semibold text-brand-800 leading-tight block" dir="rtl">{info.surface}</span>
          <span className="text-xs text-gray-500 flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-hebrew text-sm" dir="rtl">{info.lexeme}</span>
            {info.transliteration && <span className="italic">{info.transliteration}</span>}
            {info.strongs && <span className="font-mono text-gray-400">{info.strongs}</span>}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 p-1 -mr-1 rounded hover:bg-gray-100" aria-label={t('action.close')}>
          <X size={16} />
        </button>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto text-sm">
        {/* Highlight this word (signed-in readers) */}
        {highlight && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0">{t('reader.highlight')}</span>
            <HighlightSwatches
              activeColor={highlight.activeColor}
              copyValue={info.surface}
              // Clear the word selection the right-click left behind, so the blue selection
              // doesn't sit on top of the highlight we just applied.
              onPick={c => { highlight.onPick(c); onClose(); window.getSelection()?.removeAllRanges() }}
              onRemove={() => { highlight.onRemove(); onClose(); window.getSelection()?.removeAllRanges() }}
            />
          </div>
        )}

        {/* Search this word across the Hebrew Bible — "all forms" (by Strong's number, so every
            inflection) or "this form" (the consonantal surface). Routes into Master Search. */}
        {!isExamLocked() && info.strongs && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('reader.searchThisWord')}</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button type="button"
                onClick={() => { onClose(); openMasterSearch({ query: info.lexeme, scope: 'hebrew:MT', strongs: info.strongs!.replace(/[^0-9]/g, '') }) }}
                className="text-left px-2.5 py-1.5 rounded-md border border-gray-200 bg-surface text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors">
                {t('reader.allForms')}
              </button>
              <button type="button"
                onClick={() => { onClose(); openMasterSearch({ query: info.surface, scope: 'hebrew:MT' }) }}
                className="text-left px-2.5 py-1.5 rounded-md border border-gray-200 bg-surface text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors">
                {t('reader.thisForm')}
              </button>
            </div>
          </div>
        )}

        {/* Parsing */}
        <p className="text-gray-600">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">{t('study.parsing')}</span>
          {translateParsing(info.parsing, t)}
        </p>

        {/* Morpheme segments (compounds) */}
        {info.segments && info.segments.length > 0 && (
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">{t('reader.segments')}</span>
            {info.segments.map((s, i) => (
              <span key={i} className="inline-flex items-baseline gap-1">
                <span className="font-hebrew text-base text-brand-800" dir="rtl">{s.text}</span>
                <span className="text-xs text-gray-500">{s.label}{s.gloss ? ` · ${s.gloss}` : ''}</span>
              </span>
            ))}
          </p>
        )}

        {/* Macula Hebrew syntax — the word's role in its phrase and the enclosing clause's shape. */}
        {(syntaxRole || syntaxClause) && (
          <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-1.5 space-y-0.5">
            {syntaxRole && (
              <p className="text-gray-700">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">{t('study.syntax')}</span>
                {syntaxRole}
              </p>
            )}
            {syntaxClause && (
              <p className="text-xs text-gray-500">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">{t('reader.clause')}</span>
                {syntaxClause}
              </p>
            )}
          </div>
        )}

        {/* Lexicon entry — short gloss, then the fuller Brown-Driver-Briggs entry (or Strong's
            concise definition where BDB has no matching entry). */}
        {(translatedGloss ?? info.gloss) && (
          <p className="text-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">{t('reader.gloss')}</span>
            {translatedGloss ?? info.gloss}
          </p>
        )}
        {info.bdbDefinition ? (
          <p className="text-gray-800 leading-relaxed" dir="ltr">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">BDB</span>
            {info.bdbDefinition}
          </p>
        ) : info.definition && info.definition !== info.gloss ? (
          <p className="text-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1.5">Strong&apos;s</span>
            {info.definition}
          </p>
        ) : null}

        {/* Copy */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500 pt-1 border-t border-gray-100">
          <span className="text-gray-400">{t('reader.copyLabel')}</span>
          <button type="button" onClick={() => copy(info.surface, 'word')} className="underline decoration-gray-300 hover:text-brand-700">{t('reader.copyWord')}</button>
          <button type="button" onClick={() => copy(info.lexeme, 'lemma')} className="underline decoration-gray-300 hover:text-brand-700">{t('reader.copyLemma')}</button>
          <button type="button" onClick={() => copy(info.reference, 'reference')} className="underline decoration-gray-300 hover:text-brand-700">{t('reader.copyRef')}</button>
          {copied && <span className="text-green-600">✓ copied {copied}</span>}
        </div>
      </div>
    </div>
  )
}
