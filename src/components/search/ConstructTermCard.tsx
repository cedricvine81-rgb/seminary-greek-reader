'use client'

// The React KeyboardEvent is aliased so it doesn't shadow the DOM one that MorphSelect's
// document-level key listener below relies on.
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown, Trash2, Check } from 'lucide-react'
import { categoriesFor, FEATURE_LABEL, POS_FEATURES, type MorphGroup } from '@/lib/morph-features'
import { betaCodeToGreek, BETA_LEGEND } from '@/lib/greek-translit'
import { normalizeGreek } from '@/lib/greek-utils'
import type { ConstructTerm, LemmaForms } from '@/lib/construct-query'

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

// A category the word already settles — shown in the same slot a dropdown would occupy, so the
// card keeps its shape, but plainly not interactive. Not sent as a search constraint either:
// the lemma already implies it.
function Fixed({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <p className="rounded-md border border-dashed border-gray-200 px-2 py-1.5 text-xs text-gray-500" title="Fixed by the word you chose">
        {value}
      </p>
    </div>
  )
}

export function ConstructTermCard({ index, term, lemmaForms, onChange, onRemove }: {
  index: number
  term: ConstructTerm
  // normalized lemma → the forms that lemma is attested in (public/data/lemma-forms.json).
  // Absent until it loads, in which case every option stays on offer.
  lemmaForms?: Map<string, LemmaForms>
  onChange: (t: ConstructTerm) => void
  onRemove?: () => void
}) {
  const [greekInput, setGreekInput] = useState(true)
  const [openSug, setOpenSug] = useState(false)
  const [activeSug, setActiveSug] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const pos = term.features.pos?.[0] ?? ''
  const categories = categoriesFor(pos, term.features.mood ?? [])

  // What the typed word settles. A recognised lemma fixes its part of speech and often more:
  // λόγος is a masculine noun, so neither is a question — those controls become plain text and
  // the rest of the dropdowns offer only the values the word actually occurs in.
  const forms = lemmaForms?.get(normalizeGreek((term.lemma ?? '').trim())) ?? null

  // The values still worth offering for a category, given the word (if any).
  const optionsFor = (group: MorphGroup, f: LemmaForms | null = forms): string[] => {
    const all = group.features.map(x => x.value)
    const attested = f?.[group.key]
    return attested?.length ? all.filter(v => attested.includes(v)) : all
  }
  const posOptions = forms?.p ?? POS_FEATURES.map(f => f.value)

  // The categories the word leaves no choice in (λόγος → "masculine"), for the recognised line.
  const settled = forms
    ? categoriesFor(forms.p[0] ?? '', term.features.mood ?? [])
        .map(g => optionsFor(g))
        .filter(o => o.length === 1)
        .map(o => FEATURE_LABEL.get(o[0]) ?? o[0])
    : []

  // Drop any constraint that is no longer selectable — one the part of speech can't take (a
  // leftover dative on a term switched to Verb), or one the word is never attested in. Either
  // would sit there invisibly and match nothing.
  const prune = (features: Record<string, string[]>, f: LemmaForms | null) => {
    const groups = categoriesFor(features.pos?.[0] ?? '', features.mood ?? [])
    const out: Record<string, string[]> = {}
    if (features.pos) out.pos = features.pos
    for (const g of groups) {
      const kept = (features[g.key] ?? []).filter(v => optionsFor(g, f).includes(v))
      if (kept.length) out[g.key] = kept
    }
    return out
  }

  const setCategory = (key: string, vals: string[]) => {
    let features = { ...term.features }
    if (vals.length) features[key] = vals; else delete features[key]
    if (key === 'pos' || key === 'mood') features = prune(features, forms)
    onChange({ ...term, features })
  }

  const applyLemma = (next: string) => {
    const nextForms = lemmaForms?.get(normalizeGreek(next.trim())) ?? null
    // Only fill in the part of speech when the word leaves no doubt; a lemma attested as both
    // (say) noun and adjective keeps the choice open, just narrowed to those two.
    const found = nextForms?.p.length === 1 ? nextForms.p[0] : null
    // Re-prune against the NEW word either way: changing the word can invalidate a form that
    // was legal for the old one (a feminine left over after switching to λόγος).
    const features = prune(found && found !== pos ? { ...term.features, pos: [found] } : term.features, nextForms)
    onChange({ ...term, lemma: next, features })
  }

  const onLemmaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const caret = el.selectionStart ?? el.value.length
    const next = greekInput ? betaCodeToGreek(el.value) : el.value
    applyLemma(next)
    setOpenSug(true); setActiveSug(-1)
    if (greekInput) requestAnimationFrame(() => { try { el.setSelectionRange(caret, caret) } catch {} })
  }

  // ─── Predictive lexemes ─────────────────────────────────────────────────────
  // Matched entirely in the browser against the already-loaded lemma table, so it responds on
  // every keystroke with no request — and can only ever suggest words that are genuinely in the
  // corpus, which is what this field needs. Prefix match first (accent-insensitive, so `logos`
  // and `λογος` both find λόγος), then anything containing the string, each ranked by how often
  // the word occurs in the New Testament.
  const suggestions = useMemo(() => {
    const q = normalizeGreek((term.lemma ?? '').trim())
    if (!lemmaForms || q.length < 2) return []
    const starts: { key: string; e: LemmaForms }[] = []
    const contains: { key: string; e: LemmaForms }[] = []
    // forEach, not for..of — a Map iterator needs downlevelIteration under this tsconfig, which
    // next dev tolerates and next build does not.
    lemmaForms.forEach((e, key) => {
      if (key.startsWith(q)) starts.push({ key, e })
      else if (key.includes(q)) contains.push({ key, e })
    })
    const byFreq = (a: { e: LemmaForms }, b: { e: LemmaForms }) => Number(b.e.n ?? 0) - Number(a.e.n ?? 0)
    starts.sort(byFreq); contains.sort(byFreq)
    return [...starts, ...contains].slice(0, 8).map(({ key, e }) => ({
      display: (e.d as unknown as string) || key,
      gloss: (e.g as unknown as string) || '',
      count: Number(e.n ?? 0),
      pos: e.p?.[0] ?? '',
    }))
  }, [term.lemma, lemmaForms])

  // Nothing to offer if the only hit is exactly what's already typed.
  const showSug = openSug && suggestions.length > 0 &&
    !(suggestions.length === 1 && suggestions[0].display === (term.lemma ?? '').trim())

  const pickSuggestion = (display: string) => {
    applyLemma(display)
    setOpenSug(false); setActiveSug(-1)
    inputRef.current?.focus()
  }

  const onLemmaKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!showSug) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSug(i => (i + 1) % suggestions.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSug(i => (i <= 0 ? suggestions.length : i) - 1) }
    else if (e.key === 'Enter' && activeSug >= 0) { e.preventDefault(); pickSuggestion(suggestions[activeSug].display) }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpenSug(false); setActiveSug(-1) }
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
        <div className="relative min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <span className="text-gray-500">1 · Greek word</span>
            <span className="font-normal normal-case tracking-normal text-gray-300"> — any form of it; leave blank for any word</span>
          </label>
          <input ref={inputRef} value={term.lemma ?? ''} onChange={onLemmaChange} onKeyDown={onLemmaKeyDown}
            onFocus={() => { if (suggestions.length) setOpenSug(true) }}
            autoComplete="off" spellCheck={false} placeholder="e.g. πνεῦμα — or leave blank"
            className={`w-full rounded-md border border-gray-300 bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${greekInput ? 'greek-text' : ''}`} />

          {/* Predictive lexemes — commonest first, with the gloss and how often the word occurs.
              Mouse-down rather than click so picking wins the race against the input's blur. */}
          {showSug && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenSug(false)} />
              <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-popover shadow-lg">
                {suggestions.map((s, i) => (
                  <button key={s.display} type="button"
                    onMouseDown={e => { e.preventDefault(); pickSuggestion(s.display) }}
                    onMouseEnter={() => setActiveSug(i)}
                    className={`flex w-full items-baseline gap-2 border-b border-gray-50 px-3 py-2 text-left last:border-0 ${
                      i === activeSug ? 'bg-brand-50' : 'hover:bg-brand-50'}`}>
                    <span className="greek-text shrink-0 text-base text-gray-800">{s.display}</span>
                    {s.gloss && <span className="truncate text-xs text-gray-400">{s.gloss}</span>}
                    <span className="ml-auto shrink-0 text-[10px] text-gray-300">{s.pos} · {s.count}×</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Tells you the word was recognised (and what it set), or that it wasn't found —
              accent-insensitive, so a miss really is a spelling issue or a non-NT word. */}
          {forms ? (
            <p className="mt-1 text-[11px] text-brand-600">
              Recognised — {forms.p.join(' or ')}
              {settled.length > 0 && <span className="text-gray-400"> · always {settled.join(', ')}</span>}
            </p>
          ) : (term.lemma ?? '').trim().length >= 3 && lemmaForms ? (
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
        {/* Part of speech: a dropdown only while it's still open. Once the word settles it
            (λόγος can only be a noun) there is nothing to pick, so it reads as a fact. */}
        {posOptions.length === 1 && forms ? (
          <Fixed label="Part of speech" value={FEATURE_LABEL.get(posOptions[0]) ?? posOptions[0]} />
        ) : (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Part of speech</label>
            <select value={pos} onChange={e => setCategory('pos', e.target.value ? [e.target.value] : [])}
              className="w-full rounded-md border border-gray-300 bg-surface px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">any</option>
              {POS_FEATURES.filter(f => posOptions.includes(f.value))
                .map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        )}

        {/* Same rule per category: λόγος is masculine, so Gender is a statement, not a menu.
            Where a choice remains, the menu lists only forms the word actually occurs in. */}
        {categories.map(g => {
          const opts = optionsFor(g)
          if (opts.length === 1) return <Fixed key={g.key} label={g.label} value={FEATURE_LABEL.get(opts[0]) ?? opts[0]} />
          return (
            <MorphSelect key={g.key}
              group={opts.length === g.features.length ? g : { ...g, features: g.features.filter(f => opts.includes(f.value)) }}
              selected={term.features[g.key] ?? []}
              onChange={vals => setCategory(g.key, vals)} />
          )
        })}
      </div>
    </div>
  )
}
