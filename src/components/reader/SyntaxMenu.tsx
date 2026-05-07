'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Info } from 'lucide-react'
import type { VerseWord } from '@/types/biblical-text'
import type { SyntaxEntry, SyntaxContext, WallaceCategory } from '@/lib/wallace-categories'
import { getWallaceCategories } from '@/lib/wallace-categories'
import { getProielRelation } from '@/lib/proiel-relations'
import { buildGbiDisplay, type GbiEntry } from '@/lib/gbi-data'
import { buildAbsDisplay, type AbsSyntaxEntry } from '@/lib/abs-syntax'

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

export function SyntaxMenu({ word, syntax, gbiEntry, absEntry, ctx, x, y, wallaceOn, proielOn, gbiOn, absOn, onClose }: SyntaxMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  const [selectedPrep, setSelectedPrep] = useState<string>(ctx.governingPrep ?? 'none')
  const [showPrepTooltip, setShowPrepTooltip] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouse)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouse)
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
  }

  const cats = wallaceOn ? getWallaceCategories(syntax, parse, effectiveCtx) : []
  // Always show all levels (Beginner + Intermediate) when Wallace is on

  const proiel = proielOn ? getProielRelation(syntax) : null
  const gbi    = gbiOn    ? buildGbiDisplay(gbiEntry ?? undefined) : null
  const abs    = absOn    ? buildAbsDisplay(absEntry) : null

  const hasContent = cats.length > 0 || proiel !== null || gbi !== null || abs !== null

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: y, left: x, zIndex: 1000, width: 380, maxHeight: '75vh' }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
        <div>
          <span
            className="text-xl font-semibold text-brand-800 leading-tight block"
            style={{ fontFamily: "'Gentium Plus', Georgia, serif" }}
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
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5 shrink-0">
          <X size={14} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-3 space-y-2 overflow-y-auto">

        {/* Wallace categories — always at top, always all levels (Beginner + Intermediate) */}
        {cats.length > 0 && cats.map((cat, i) => (
          <div key={i} className={`rounded-lg border px-3 py-2 ${LEVEL_COLORS[cat.level]}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">{cat.name}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${LEVEL_BADGE[cat.level]}`}>
                {cat.level === 'beginner' ? 'Beginner' : 'Intermediate'}
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-80 whitespace-pre-line">{cat.desc}</p>
          </div>
        ))}

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
                <span className="text-xs font-semibold text-amber-900">Role: </span>
                <span className="text-xs text-amber-800">{gbi.role}</span>
              </div>
            )}

            {gbi.gloss && (
              <div>
                <span className="text-xs font-semibold text-amber-900">Gloss: </span>
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
                <span className="text-xs font-semibold text-amber-900 block mb-0.5">Semantic Frame:</span>
                {gbi.frame.map((f, i) => (
                  <div key={i} className="text-xs text-amber-800 leading-snug">{f.label}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABS · Asian Bible Society NT Syntax */}
        {absOn && (
          abs ? (
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 space-y-1.5">
              <span className="text-[10px] font-bold tracking-widest text-violet-600 uppercase">ABS · NT Syntax</span>
              {abs.clause && (
                <div><span className="text-xs font-semibold text-violet-900">Clause: </span>
                     <span className="text-xs text-violet-800">{abs.clause}</span></div>
              )}
              {abs.discourse && (
                <div><span className="text-xs font-semibold text-violet-900">Discourse: </span>
                     <span className="text-xs text-violet-800">{abs.discourse}</span></div>
              )}
              {abs.phrase && (
                <div><span className="text-xs font-semibold text-violet-900">Phrase: </span>
                     <span className="text-xs text-violet-800">{abs.phrase}</span></div>
              )}
              {abs.function && (
                <div><span className="text-xs font-semibold text-violet-900">Function: </span>
                     <span className="text-xs text-violet-800">{abs.function}</span></div>
              )}
              {abs.information && (
                <div><span className="text-xs font-semibold text-violet-900">Information: </span>
                     <span className="text-xs text-violet-800">{abs.information}</span></div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
              <span className="text-[10px] font-bold tracking-widest text-violet-400 uppercase">ABS · NT Syntax</span>
              <p className="text-xs text-violet-400 italic mt-0.5">No entry for this word.</p>
            </div>
          )
        )}

        {/* Empty state */}
        {!hasContent && (
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
              <span className="text-[10px] bg-brand-100 text-brand-700 rounded-full px-1.5 py-0.5 font-medium">auto-detected</span>
            )}
          </div>
          <select
            value={selectedPrep}
            onChange={e => setSelectedPrep(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            style={{ fontFamily: "'Gentium Plus', Georgia, serif" }}
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
