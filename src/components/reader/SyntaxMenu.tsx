'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import Link from 'next/link'
import { X, Info, GraduationCap } from 'lucide-react'
import { chapterForCategory, grammarHref, CHAPTER_LABEL, type GrammarChapter } from '@/lib/syntax-grammar-map'
import { openGrammarPanel, hasGrammarPanel } from '@/lib/grammar-panel-bus'
import type { VerseWord } from '@/types/biblical-text'
import type { SyntaxEntry, SyntaxContext, WallaceCategory } from '@/lib/wallace-categories'
import { getWallaceCategories } from '@/lib/wallace-categories'
import { getProielRelation } from '@/lib/proiel-relations'
import { buildGbiDisplay, type GbiEntry } from '@/lib/gbi-data'
import { buildAbsDisplay, type AbsSyntaxEntry } from '@/lib/abs-syntax'
import { formatMaculaClauseRule, getMaculaClauseRoleLabel } from '@/lib/macula-syntax'
import { HighlightSwatches } from '@/components/highlights/HighlightSwatches'
import type { WordHighlight } from '@/lib/word-search-bus'

/**
 * "Learn this" — opens the Grammar chapter that teaches this syntax category BESIDE the text
 * (GrammarPanel), so the verse stays on screen. Falls back to an ordinary link when no panel
 * is mounted — on /grammar itself, where a panel over the page would be absurd, and on any
 * surface that doesn't host the provider.
 */
function GrammarLink({ chapter, level, category }: {
  chapter: GrammarChapter
  level: 'beginner' | 'intermediate'
  category: string
}) {
  const t = useT()
  const cls = 'mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline'
  const label = <><GraduationCap size={11} className="shrink-0" /> {t('reader.learnThis', { chapter: CHAPTER_LABEL[chapter] })}</>

  if (!hasGrammarPanel()) {
    return <Link href={grammarHref(chapter, level)} className={cls}>{label}</Link>
  }
  return (
    <button
      type="button"
      className={cls}
      onClick={() => openGrammarPanel({
        chapter,
        level: level === 'beginner' ? 'beginning' : 'intermediate',
        fromCategory: category,
      })}
    >
      {label}
    </button>
  )
}

export type WordSearchAction = 'lemma' | 'form' | 'morph' | 'lexicon' | 'backgrounds'
export type SearchScope = 'GNT' | 'LXX' | 'BOTH'

interface SyntaxMenuProps {
  word: VerseWord
  syntax: SyntaxEntry | null
  gbiEntry: GbiEntry | null
  absEntry: AbsSyntaxEntry | null
  ctx: SyntaxContext
  x: number
  y: number
  wallaceOn: boolean
  proielOn: boolean
  gbiOn: boolean
  absOn: boolean
  onWordAction: (action: WordSearchAction, scope: SearchScope) => void
  /** Which corpus the reader is showing, so the frequency count is only shown when it applies. */
  readerScope?: SearchScope
  highlight?: WordHighlight
  loading?: boolean   // syntax datasets still downloading — show a placeholder, not the empty state
  onClose: () => void
}

const PREP_OPTIONS = [
  { value: 'none',    label: 'None (no preposition)' },
  { value: 'ἀνά',    label: 'ἀνά (acc.) — up along, each' },
  { value: 'ἀντί',   label: 'ἀντί (gen.) — instead of' },
  { value: 'ἀπό',    label: 'ἀπό (gen.) — from, away from' },
  { value: 'διά',    label: 'διά — through/by (gen.) | because of (acc.)' },
  { value: 'εἰς',    label: 'εἰς (acc.) — into, toward' },
  { value: 'ἐκ',     label: 'ἐκ / ἐξ (gen.) — out of, from' },
  { value: 'ἐν',     label: 'ἐν (dat.) — in, among, by' },
  { value: 'ἐπί',    label: 'ἐπί (gen./dat./acc.) — on, over, against' },
  { value: 'κατά',   label: 'κατά — against/down (gen.) | according to (acc.)' },
  { value: 'μετά',   label: 'μετά — with (gen.) | after (acc.)' },
  { value: 'παρά',   label: 'παρά — from (gen.) | beside (dat.) | contrary to (acc.)' },
  { value: 'περί',   label: 'περί — concerning (gen.) | around (acc.)' },
  { value: 'πρό',    label: 'πρό (gen.) — before' },
  { value: 'πρός',   label: 'πρός (acc.) — to, toward, with' },
  { value: 'σύν',    label: 'σύν (dat.) — with, together with' },
  { value: 'ὑπέρ',   label: 'ὑπέρ — on behalf of (gen.) | above (acc.)' },
  { value: 'ὑπό',    label: 'ὑπό — by/agent (gen.) | under (acc.)' },
  { value: 'χωρίς',  label: 'χωρίς (gen.) — apart from, without' },
]

const LEVEL_COLORS: Record<WallaceCategory['level'], string> = {
  beginner:     'bg-green-50  text-green-800  border-green-200',
  intermediate: 'bg-indigo-50 text-indigo-800 border-indigo-200',
}
const LEVEL_BADGE: Record<WallaceCategory['level'], string> = {
  beginner:     'bg-green-100  text-green-700',
  intermediate: 'bg-indigo-100 text-indigo-700',
}

export function SyntaxMenu({ word, syntax, gbiEntry, absEntry, ctx, x, y, wallaceOn, proielOn, gbiOn, absOn, onWordAction, readerScope, highlight, loading, onClose }: SyntaxMenuProps) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)

  const [selectedPrep, setSelectedPrep] = useState<string>(ctx.governingPrep ?? 'none')
  const [showPrepTooltip, setShowPrepTooltip] = useState(false)
  // ── "Search this word" section ──
  const [scope, setScope] = useState<SearchScope>('BOTH')
  const [copied, setCopied] = useState<string | null>(null)
  const lemma   = word.lexeme?.lexeme ?? null
  const freq    = word.lexeme?.frequency
  const reference = (word.verseId ?? '').replace(/^(.*)\.(\d+)\.(\d+)$/, '$1 $2:$3')
  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text)
      .then(() => { setCopied(label); setTimeout(() => setCopied(null), 1200) })
      .catch(() => {})
  }
  // Lazy-init so SSR never touches window
  const [isMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onOutside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    // pointerdown, NOT mousedown+touchstart. On iPad the long-press opens this menu while
    // the finger is still down; lifting the finger then makes Safari synthesize a mousedown
    // at the word — outside the menu — which a mousedown listener read as "dismiss", so the
    // menu vanished the instant the finger came off. Pointer events fire once per REAL
    // interaction (at touch-start for touch, at button-press for mouse) and are never
    // synthesized retroactively, so the lift is invisible here and the next genuine tap or
    // click outside still closes the menu.
    document.addEventListener('pointerdown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
    }
  }, [onClose])

  const parse   = word.parses?.[0]
  const pos     = parse?.partOfSpeech ?? ''

  const showPrepDropdown = pos === 'Noun'
    && (syntax?.c === 'pp' || syntax?.gc === 'pp' || (ctx.governingPrep != null && ctx.governingPrep !== 'none'))

  const effectiveCtx: SyntaxContext = {
    ...ctx,
    governingPrep: selectedPrep,
    wordLexeme: word.lexeme?.lexeme ?? word.surface,
    // When ABS identifies an accusative as a direct object, align Wallace to it.
    absFunction: absEntry?.function ?? null,
  }

  const cats = wallaceOn ? getWallaceCategories(syntax, parse, effectiveCtx) : []
  // Always show all levels (Beginner + Intermediate) when Wallace is on

  const proiel = proielOn ? getProielRelation(syntax) : null
  const gbi    = gbiOn    ? buildGbiDisplay(gbiEntry ?? undefined) : null
  const abs    = absOn    ? buildAbsDisplay(absEntry) : null

  const hasContent = cats.length > 0 || proiel !== null || gbi !== null || abs !== null

  const menuStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, maxHeight: '75vh' }
    : { position: 'fixed', top: y, left: Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 396), zIndex: 1000, width: 380, maxHeight: '75vh' }

  const menuClass = isMobile
    ? 'bg-popover border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden'
    : 'bg-popover border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden'

  return (
    <div
      ref={ref}
      style={menuStyle}
      className={menuClass}
    >
      {/* ── Drag indicator (mobile only) ── */}
      {isMobile && (
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
        <div>
          <span
            className="font-reading text-xl font-semibold text-brand-800 leading-tight block"
          >
            {word.surface}
          </span>
          {word.lexeme && (
            <span className="text-xs text-gray-500">
              {word.lexeme.lexeme}{word.lexeme.gloss ? ` — ${word.lexeme.gloss}` : ''}
            </span>
          )}
          {parse && (
            <span className="block text-xs text-gray-400 mt-0.5">
              {[parse.partOfSpeech, parse.tense, parse.voice, parse.mood,
                parse.casus, parse.number, parse.person ? `${parse.person} person` : null]
                .filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 shrink-0 p-2 -mr-1 rounded-lg hover:bg-gray-100 touch-manipulation"
          aria-label={t('action.close')}
        >
          <X size={isMobile ? 22 : 16} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-3 space-y-2 overflow-y-auto">

        {/* ── Highlight this word ── */}
        {highlight && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0">{t('reader.highlight')}</span>
            <HighlightSwatches
              activeColor={highlight.activeColor}
              copyValue={word.surface}
              // Clear the word selection the right-click left behind, so the blue selection
              // doesn't sit on top of the highlight we just applied.
              onPick={c => { highlight.onPick(c); onClose(); window.getSelection()?.removeAllRanges() }}
              onRemove={() => { highlight.onRemove(); onClose(); window.getSelection()?.removeAllRanges() }}
            />
          </div>
        )}

        {/* ── Search this word ── */}
        <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('reader.searchThisWord')}</span>
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-[10px] leading-none">
              {(['GNT', 'LXX', 'BOTH'] as const).map(s => (
                <button key={s} type="button" onClick={() => setScope(s)}
                  className={`px-1.5 py-1 transition-colors ${scope === s ? 'bg-brand-600 text-white' : 'bg-surface text-gray-500 hover:bg-gray-50'}`}>
                  {s === 'GNT' ? 'NT' : s === 'LXX' ? 'OT' : 'Both'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => onWordAction('lemma', scope)}
              className="text-left px-2.5 py-1.5 rounded-lg border border-gray-200 bg-surface text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors">
              {/* The count is the lexeme's frequency in the corpus being read, so it only
                  describes the search about to run while the toggle agrees with it. Under
                  "Both" — or the other Testament — it would be a New Testament number
                  labelling a wider search, so it is dropped rather than left to mislead. */}
              {t('reader.allForms')}{typeof freq === 'number' && scope === readerScope
                ? <span className="text-gray-400"> · {freq}×</span> : null}
            </button>
            <button type="button" onClick={() => onWordAction('form', scope)}
              className="text-left px-2.5 py-1.5 rounded-lg border border-gray-200 bg-surface text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors">
              {t('reader.thisForm')}
            </button>
            <button type="button" onClick={() => onWordAction('morph', scope)}
              className="col-span-2 text-left px-2.5 py-1.5 rounded-lg border border-gray-200 bg-surface text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors">
              {/* Follows the toggle: morphology search used to be New Testament only, because
                  the Septuagint had no parse to match against. It does now. */}
              {t('reader.byMorphology')} <span className="text-gray-400">
                · {scope === 'GNT' ? 'NT' : scope === 'LXX' ? 'OT' : 'NT+OT'}</span>
            </button>
            <button type="button" onClick={() => onWordAction('backgrounds', scope)}
              className="col-span-2 text-left px-2.5 py-1.5 rounded-lg border border-gray-200 bg-surface text-xs text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors">
              {t('reader.backgroundTexts')} <span className="text-gray-400">· Philo, Josephus, LXX…</span>
            </button>
          </div>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500">
            <span className="text-gray-400">{t('reader.copyLabel')}</span>
            <button type="button" onClick={() => copy(word.surface, 'word')} className="underline decoration-gray-300 hover:text-brand-700 hover:decoration-brand-400">{t('reader.copyWord')}</button>
            {lemma && <button type="button" onClick={() => copy(lemma, 'dictionary form')} className="underline decoration-gray-300 hover:text-brand-700 hover:decoration-brand-400">{t('reader.copyDictForm')}</button>}
            {reference && <button type="button" onClick={() => copy(reference, 'reference')} className="underline decoration-gray-300 hover:text-brand-700 hover:decoration-brand-400">{t('reader.copyRef')}</button>}
            {copied && <span className="text-green-600">✓ copied {copied}</span>}
          </div>
        </div>

        {/* Macula clause structure — shown when data is available */}
        {(() => {
          const ruleLabel = formatMaculaClauseRule(ctx.maculaClauseRule)
          const roleLabel = getMaculaClauseRoleLabel(ctx.maculaClauseRole)
          if (!ruleLabel && !roleLabel) return null
          return (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 space-y-1">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Clause Structure · Macula</span>
              {ruleLabel && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{ctx.maculaClauseRule}</span>
                  <span className="text-xs text-gray-600">{ruleLabel}</span>
                </div>
              )}
              {roleLabel && (
                <div className="text-xs text-gray-500 italic">{roleLabel}</div>
              )}
            </div>
          )
        })()}

        {/* Wallace categories — always at top, always all levels (Beginner + Intermediate) */}
        {cats.length > 0 && cats.map((cat, i) => {
          // Where this category is taught. null when the Grammar doesn't cover it — then no
          // link, rather than sending the student to a chapter that won't discuss it.
          const chapter = chapterForCategory(cat.name)
          return (
            <div key={i} className={`rounded-lg border px-3 py-2 ${LEVEL_COLORS[cat.level]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{cat.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${LEVEL_BADGE[cat.level]}`}>
                  {cat.level === 'beginner' ? t('reader.levelBeginner') : t('reader.levelIntermediate')}
                </span>
              </div>
              {/* Directly under the name, BEFORE the description. Wallace's descriptions run
                  to several paragraphs, so a link placed after one sits below the fold of the
                  popup and is never seen. */}
              {chapter && (
                <GrammarLink
                  chapter={chapter}
                  level={cat.level}
                  category={cat.name}
                />
              )}
              <p className="text-xs leading-relaxed opacity-80 whitespace-pre-line">{cat.desc}</p>
            </div>
          )
        })}

        {/* PROIEL dependency relation */}
        {proiel && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-sky-600 uppercase">PROIEL</span>
              <span className="text-sm font-semibold text-sky-900">{proiel.code}</span>
              <span className="text-xs text-sky-700 opacity-80">— {proiel.name}</span>
            </div>
            <p className="text-xs leading-relaxed text-sky-800 opacity-80">{proiel.desc}</p>
          </div>
        )}

        {/* GBI / Macula-Greek */}
        {gbi && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">GBI · Macula-Greek</span>

            {gbi.role && (
              <div>
                <span className="text-xs font-semibold text-amber-900">{t('reader.role')} </span>
                <span className="text-xs text-amber-800">{gbi.role}</span>
              </div>
            )}

            {gbi.gloss && (
              <div>
                <span className="text-xs font-semibold text-amber-900">{t('reader.glossLabel')} </span>
                <span className="text-xs text-amber-800 italic">{gbi.gloss}</span>
              </div>
            )}

            {gbi.domains.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-amber-900 block mb-0.5">Louw-Nida Domain{gbi.domains.length > 1 ? 's' : ''}:</span>
                {gbi.domains.map((d, i) => (
                  <div key={i} className="text-xs text-amber-800 leading-snug">
                    <span className="font-mono">{d.code}</span>
                    <span className="mx-1 opacity-50">·</span>
                    <span>{d.domain}</span>
                  </div>
                ))}
              </div>
            )}

            {gbi.frame.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-amber-900 block mb-0.5">{t('reader.semanticFrame')}</span>
                {gbi.frame.map((f, i) => (
                  <div key={i} className="text-xs text-amber-800 leading-snug">{f.label}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABS · Asian Bible Society NT Syntax (Nestle 1904) */}
        {absOn && (
          abs ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 space-y-1.5">
              <span className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">ABS · NT Syntax</span>
              {abs.function && (
                <div><span className="text-xs font-semibold text-violet-900">{t('reader.function')} </span>
                     <span className="text-xs text-violet-800">{abs.function}</span></div>
              )}
              {abs.phrase && (
                <div><span className="text-xs font-semibold text-violet-900">{t('reader.phrase')} </span>
                     <span className="text-xs text-violet-800">{abs.phrase}</span></div>
              )}
              {abs.rule && (
                <div><span className="text-xs font-semibold text-violet-900">{t('reader.construction')} </span>
                     <span className="text-xs text-violet-800">{abs.rule}</span></div>
              )}
              {abs.clauseRule && (
                <div><span className="text-xs font-semibold text-violet-900">{t('reader.clausePattern')} </span>
                     <span className="text-xs text-violet-800">{abs.clauseRule}</span></div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
              <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase">ABS · NT Syntax</span>
              <p className="text-xs text-violet-400 italic mt-0.5">{t('reader.noEntryForWord')}</p>
            </div>
          )
        )}

        {/* Loading state — the syntax datasets are still downloading (first use of a session). */}
        {loading && (wallaceOn || proielOn || gbiOn || absOn) && !hasContent && (
          <p className="text-xs text-gray-400 italic px-1">{t('reader.loadingSyntax')}</p>
        )}

        {/* Empty state — data is loaded but no syntax layers are enabled. */}
        {!loading && !hasContent && (
          <p className="text-xs text-gray-400 italic px-1">
            Enable Wallace, PROIEL, GBI, or ABS Syntax in settings to see syntactical analysis.
          </p>
        )}
      </div>

      {/* ── Preposition dropdown (nouns in PP only, when Wallace is on) ── */}
      {wallaceOn && showPrepDropdown && (
        <div className="mx-3 mb-3 shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowPrepTooltip(true)}
                onMouseLeave={() => setShowPrepTooltip(false)}
                className="text-gray-400 hover:text-brand-600"
              >
                <Info size={12} />
              </button>
              {showPrepTooltip && (
                <div className="absolute left-5 bottom-0 z-10 w-56 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
                  Always identify prepositions first. Prepositions often determine case function before other syntax rules.
                </div>
              )}
            </div>
            {ctx.governingPrep && ctx.governingPrep !== 'none' && selectedPrep === ctx.governingPrep && (
              <span className="text-[10px] bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5 font-medium">{t('reader.autoDetected')}</span>
            )}
          </div>
          <select
            value={selectedPrep}
            onChange={e => setSelectedPrep(e.target.value)}
            className="font-reading w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
          >
            {PREP_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
