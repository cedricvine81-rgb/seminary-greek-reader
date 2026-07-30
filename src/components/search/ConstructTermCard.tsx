'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ChevronDown, Trash2, Check } from 'lucide-react'
import { categoriesFor, FEATURE_LABEL, POS_FEATURES, type MorphGroup } from '@/lib/morph-features'
import { betaCodeToGreek, BETA_LEGEND } from '@/lib/greek-translit'
import { normalizeGreek } from '@/lib/greek-utils'
import type { ConstructTerm } from '@/lib/construct-query'

// One word of a construct: a part-of-speech dropdown, then only the parsing categories that
// part of speech can actually take (categoriesFor), plus an optional lexeme restriction.
//
// Each category is a MULTI-select — ticking Genitive and Dative means "genitive OR dative".
// Across categories the constraints are AND'd. That's why these are checkbox popovers rather
// than plain <select>s: Accordance needs an explicit OR operator for the same thing.

function MorphSelect({ group, selected, onChange }: {
  group: MorphGroup
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onOutside) }
  }, [open])

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  const label = selected.length === 0
    ? 'any'
    : selected.length <= 2
      ? selected.map(v => FEATURE_LABEL.get(v) ?? v).join(', ')
      : `${selected.length} selected`

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{group.label}</label>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}
        className={`inline-flex w-full items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
          selected.length > 0
            ? 'border-brand-300 bg-brand-50 text-brand-700'
            : 'border-gray-300 bg-surface text-gray-500 hover:bg-gray-50'}`}>
        <span className="truncate">{label}</span>
        <ChevronDown size={13} className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-gray-200 bg-popover p-1 shadow-xl">
          {selected.length > 0 && (
            <button type="button" onClick={() => { onChange([]); setOpen(false) }}
              className="mb-1 w-full rounded px-2 py-1 text-left text-[11px] text-gray-400 hover:bg-gray-50 hover:text-gray-600">
              Clear — any {group.label.toLowerCase()}
            </button>
          )}
          {group.features.map(f => {
            const on = selected.includes(f.value)
            return (
              <button key={f.value} type="button" onClick={() => toggle(f.value)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                  on ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <span className={`flex h-3.5 w-3.5 flex-none items-center justify-center rounded border ${
                  on ? 'border-brand-400 bg-brand-500 text-white' : 'border-gray-300'}`}>
                  {on && <Check size={10} strokeWidth={3} />}
                </span>
                {f.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ConstructTermCard({ index, term, lemmaPos, onChange, onRemove }: {
  index: number
  term: ConstructTerm
  // normalized lemma → part of speech, from the corpus (public/data/lemma-pos.json). Absent
  // until it loads, in which case the card just doesn't auto-fill.
  lemmaPos?: Map<string, string>
  onChange: (t: ConstructTerm) => void
  onRemove?: () => void
}) {
  const [greekInput, setGreekInput] = useState(true)
  const pos = term.features.pos?.[0] ?? ''
  const categories = categoriesFor(pos, term.features.mood ?? [])

  // Drop any constraint the part of speech (and mood) can't take, so a term never carries an
  // invisible one — a leftover dative on a term switched to Verb would silently match nothing.
  const prune = (features: Record<string, string[]>) => {
    const allowed = new Set(categoriesFor(features.pos?.[0] ?? '', features.mood ?? []).map(g => g.key))
    const out: Record<string, string[]> = {}
    for (const k of Object.keys(features)) if (k === 'pos' || allowed.has(k)) out[k] = features[k]
    return out
  }

  const setCategory = (key: string, vals: string[]) => {
    let features = { ...term.features }
    if (vals.length) features[key] = vals; else delete features[key]
    if (key === 'pos' || key === 'mood') features = prune(features)
    onChange({ ...term, features })
  }

  // The word decides which options are relevant: as soon as what's typed matches a New Testament
  // lexeme, its part of speech is filled in and the form dropdowns collapse to that word's
  // categories (θεός → Case/Number/Gender; ἔρχομαι → Tense/Voice/Mood/Person/Number). Still
  // overridable by hand, and an unrecognised word just leaves the dropdowns alone.
  const derivedPos = lemmaPos?.get(normalizeGreek((term.lemma ?? '').trim())) ?? null

  const onLemmaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const caret = el.selectionStart ?? el.value.length
    const next = greekInput ? betaCodeToGreek(el.value) : el.value
    const found = lemmaPos?.get(normalizeGreek(next.trim())) ?? null
    let features = term.features
    if (found && found !== pos) features = prune({ ...features, pos: [found] })
    onChange({ ...term, lemma: next, features })
    if (greekInput) requestAnimationFrame(() => { try { el.setSelectionRange(caret, caret) } catch {} })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Word {index + 1}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} title={`Remove word ${index + 1}`}
            className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Step 1 — WHICH WORD. First, because that's the order you think in: pick the word,
          then say what form it's in. Optional: leave it blank and the term is defined purely
          by grammar ("any aorist participle"), which is the other half of what this tool is for. */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <span className="text-gray-500">1 · Greek word</span>
            <span className="font-normal normal-case tracking-normal text-gray-300"> — any form of it; leave blank for any word</span>
          </label>
          <input value={term.lemma ?? ''} onChange={onLemmaChange} placeholder="e.g. πνεῦμα — or leave blank"
            className={`w-full rounded-md border border-gray-300 bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${greekInput ? 'greek-text' : ''}`} />
          {/* Tells you the word was recognised (and what it set), or that it wasn't found —
              accent-insensitive, so a miss really is a spelling issue or a non-NT word. */}
          {derivedPos ? (
            <p className="mt-1 text-[11px] text-brand-600">
              Recognised as a{'aeiou'.includes(derivedPos[0]) ? 'n' : ''} {derivedPos} — showing {derivedPos} forms below
            </p>
          ) : (term.lemma ?? '').trim().length >= 3 && lemmaPos ? (
            <p className="mt-1 text-[11px] text-gray-400">Not a New Testament word — check the spelling, or set the form by hand</p>
          ) : null}
        </div>
        <button type="button" onClick={() => setGreekInput(v => !v)}
          title={greekInput ? `Greek keyboard on — ${BETA_LEGEND}` : 'Greek keyboard off — type Latin letters'}
          className={`flex-none rounded-md border px-2 py-1.5 text-xs transition-colors ${
            greekInput ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-500 hover:bg-gray-50'}`}>
          <span className="greek-text">α</span>
        </button>
      </div>

      {/* Step 2 — WHAT FORM. Part of speech first: it decides which categories even appear. */}
      <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        2 · Its form
        <span className="font-normal normal-case tracking-normal text-gray-300"> — leave as “any” to match every form</span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Part of speech</label>
          <select value={pos} onChange={e => setCategory('pos', e.target.value ? [e.target.value] : [])}
            className="w-full rounded-md border border-gray-300 bg-surface px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="">any</option>
            {POS_FEATURES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {categories.map(g => (
          <MorphSelect key={g.key} group={g} selected={term.features[g.key] ?? []}
            onChange={vals => setCategory(g.key, vals)} />
        ))}
      </div>
    </div>
  )
}
