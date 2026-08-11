'use client'

// The React KeyboardEvent is aliased so it doesn't shadow the DOM one that MorphSelect's
// document-level key listener below relies on.
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { featureLabel, groupLabel } from '@/lib/i18n/morph-labels'
import { ChevronDown, Trash2, Check } from 'lucide-react'
import { type MorphGroup } from '@/lib/morph-features'
import { vocabFor, type MorphVocab } from '@/lib/morph-vocab'
import { betaCodeToGreek, BETA_LEGEND } from '@/lib/greek-translit'
import { latinToHebrew, HEBREW_LEGEND } from '@/lib/hebrew-translit'
import { normalizeHebrew } from '@/lib/hebrew-fold'
import { normalizeGreek } from '@/lib/greek-utils'
import type { ConstructTerm, LemmaForms } from '@/lib/construct-query'

// One word of a construct: a part-of-speech dropdown, then only the parsing categories that
// part of speech can actually take (categoriesFor), plus an optional lexeme restriction.
//
// Each category is a MULTI-select — ticking Genitive and Dative means "genitive OR dative".
// Across categories the constraints are AND'd. That's why these are checkbox popovers rather
// than plain <select>s: Accordance needs an explicit OR operator for the same thing.

function MorphSelect({ group, selected, onChange, vocab }: {
  group: MorphGroup
  selected: string[]
  onChange: (vals: string[]) => void
  vocab: MorphVocab
}) {
  const t = useT()
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

  // A plain click picks that one value and CLOSES — picking one thing shouldn't cost a second
  // click to dismiss the menu, which is the common case by far. Multi-select (the OR) is still
  // there on ⌘/Ctrl/shift-click, which toggles and leaves the menu open so you can add more.
  // Clicking the value that's already the sole selection clears it.
  const pick = (v: string, additive: boolean) => {
    if (additive) {
      onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
      return
    }
    onChange(selected.length === 1 && selected[0] === v ? [] : [v])
    setOpen(false)
  }

  // "any" and "N selected" are chrome — they say how much of the box is constrained. The VALUES
  // inside it (nominative, aorist …) come from vocab.label and stay English with the rest of the
  // parsing vocabulary, which moves as one piece across the reader, Variants and the quiz.
  const label = selected.length === 0
    ? t('cq.any')
    : selected.length <= 2
      ? selected.map(v => featureLabel(v, t)).join(', ')
      : t('cq.nSelected', { n: selected.length })

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{groupLabel(group.key, t, group.label)}</label>
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
              {t('cq.clearAny', { group: groupLabel(group.key, t, group.label).toLowerCase() })}
            </button>
          )}
          {group.features.map(f => {
            const on = selected.includes(f.value)
            return (
              <button key={f.value} type="button"
                onClick={e => pick(f.value, e.metaKey || e.ctrlKey || e.shiftKey)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  on ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <span className={`flex h-3.5 w-3.5 flex-none items-center justify-center rounded border ${
                  on ? 'border-brand-400 bg-brand-500 text-white' : 'border-gray-300'}`}>
                  {on && <Check size={10} strokeWidth={3} />}
                </span>
                {f.label}
              </button>
            )
          })}
          <p className="mt-1 border-t border-gray-100 px-2 pt-1 text-[10px] leading-snug text-gray-300">
            ⌘-click to pick more than one <span className="text-gray-400">(either)</span>
          </p>
        </div>
      )}
    </div>
  )
}

// A category the word already settles — shown in the same slot a dropdown would occupy, so the
// card keeps its shape, but plainly not interactive. Not sent as a search constraint either:
// the lemma already implies it.
function Fixed({ label, value }: { label: string; value: string }) {
  const t = useT()
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      <p className="rounded-md border border-dashed border-gray-200 px-2 py-1.5 text-xs text-gray-500" title={t('cq.fixedByWord')}>
        {value}
      </p>
    </div>
  )
}

interface Suggestion { display: string; gloss: string; count: number; pos: string }

export function ConstructTermCard({ index, termCount, term, corpus, lemmaForms, onChange, onRemove }: {
  index: number
  // How many words the construct has, so a card knows which others it could agree with.
  termCount: number
  term: ConstructTerm
  corpus: string
  // normalized lemma → the forms that lemma is attested in. Present for the New Testament, whose
  // table is small enough to hold in the page; absent for the Septuagint, which is queried through
  // /api/construct/lemmas instead (44,249 lemmas is too much to ship). Same behaviour either way,
  // the remote path just lands a moment later.
  lemmaForms?: Map<string, LemmaForms>
  onChange: (t: ConstructTerm) => void
  onRemove?: () => void
}) {
  const t = useT()
  // Greek or Hebrew, decided by the corpus: the two share this card but no categories.
  const vocab = vocabFor(corpus)
  const isHebrew = vocab.script === 'hebrew'
  // The lemma table is keyed by the corpus's own fold (build-construct-index.mjs): Hebrew by
  // its consonantal skeleton, Greek by accent-stripped lowercase.
  const foldWord = (t: string) => (isHebrew ? normalizeHebrew(t).replace(/\s+/g, '') : normalizeGreek(t))
  // Agreement: which other word, and in which categories. Defaults to the first other word.
  const otherWords = Array.from({ length: termCount }, (_, i) => i).filter(i => i !== index)
  const agreeOn = (term.agreeOn ?? []).filter(c => vocab.agreementCategories.includes(c))
  const agreeWith = term.agreeWith !== undefined && otherWords.includes(term.agreeWith)
    ? term.agreeWith
    : otherWords[0] ?? 0
  const setAgreement = (cats: string[], withIdx: number) => {
    const next = { ...term }
    if (cats.length) { next.agreeOn = cats; next.agreeWith = withIdx }
    else { delete next.agreeOn; delete next.agreeWith }
    onChange(next)
  }

  const [greekInput, setGreekInput] = useState(true)
  const [openSug, setOpenSug] = useState(false)
  const [activeSug, setActiveSug] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const typed = (term.lemma ?? '').trim()
  // Exact-form matching is only the Septuagint's problem: its chapter files store the surface form
  // in the `lemma` field, so without a Strong's number there is nothing but the spelling to match.
  // The GNT trees and the prose sidecars (Stanza) both carry real lemmas, so "any form" holds.
  const lexemeIsExact = corpus === 'LXX' && !(term.strongs?.length)

  // Remote lookup, for corpora with no in-page table (the Septuagint). Debounced, and keyed by the
  // text it answered so a late reply can't be mistaken for the current word's.
  const [remote, setRemote] = useState<{ q: string; suggestions: Suggestion[]; exact: LemmaForms | null }>({ q: '', suggestions: [], exact: null })
  useEffect(() => {
    if (lemmaForms) return
    if (typed.length < 2) { setRemote({ q: typed, suggestions: [], exact: null }); return }
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/construct/lemmas?corpus=${encodeURIComponent(corpus)}&q=${encodeURIComponent(typed)}`, { signal: ctrl.signal })
        .then(r => (r.ok ? r.json() : null))
        .then((d: { suggestions?: Suggestion[]; exact?: LemmaForms | null } | null) => {
          if (d) setRemote({ q: typed, suggestions: d.suggestions ?? [], exact: d.exact ?? null })
        })
        .catch(() => {})
    }, 150)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [typed, corpus, lemmaForms])

  // Whether a lookup has actually answered for what's typed — governs the recognised / not-found
  // line, which mustn't claim "not a word" while a request is still in flight.
  const resolved = !!lemmaForms || remote.q === typed

  // What the typed word settles. A recognised lemma fixes its part of speech and often more:
  // λόγος is a masculine noun, so neither is a question — those controls become plain text and
  // the rest of the dropdowns offer only the values the word actually occurs in.
  const forms = lemmaForms
    ? lemmaForms.get(foldWord(typed)) ?? null
    : remote.q === typed ? remote.exact : null

  const posOptions = forms?.p ?? vocab.posFeatures.map(f => f.value)
  // A part of speech the word can't be is STALE — it survived a word change and would search for
  // something that cannot exist (a verb whose lemma is ἵνα: no matches, no explanation). Ignore
  // it for display; prune() strips it from the query itself.
  const rawPos = term.features.pos?.[0] ?? ''
  const pos = rawPos && posOptions.includes(rawPos) ? rawPos : ''

  // The values still worth offering for a category, given the word (if any). An empty array in
  // the data means "this word never occurs in that category" (ἵνα has no degree) — distinct from
  // the key being absent, which means no restriction at all.
  const optionsFor = (group: MorphGroup, f: LemmaForms | null = forms): string[] => {
    const all = group.features.map(x => x.value)
    const attested = f?.[group.key]
    if (!attested) return all
    return all.filter(v => attested.includes(v))
  }

  // Which categories to show. With no part of speech chosen but a recognised word, offer the
  // union over the tags that word actually carries — so ἵνα (conjunction or adverb) offers no
  // inflection at all, rather than the full set it would get from "any".
  const groupsFor = (posVal: string, moods: string[], f: LemmaForms | null): MorphGroup[] => {
    const list = posVal ? [posVal] : f ? f.p : ['']
    const seen = new Set<string>()
    const out: MorphGroup[] = []
    for (const p of list) {
      for (const g of vocab.categoriesFor(p, moods)) {
        if (seen.has(g.key)) continue
        seen.add(g.key)
        // Drop a category the word is never attested in — selecting it could only return nothing.
        if (optionsFor(g, f).length > 0) out.push(g)
      }
    }
    return out
  }
  const categories = groupsFor(pos, term.features.mood ?? [], forms)

  // The categories the word leaves no choice in (λόγος → "masculine"), for the recognised line.
  const settled = forms
    ? categories.map(g => optionsFor(g)).filter(o => o.length === 1).map(o => vocab.label(o[0]))
    : []

  // Drop any constraint that is no longer selectable — one the part of speech can't take (a
  // leftover dative on a term switched to Verb), or one the word is never attested in. Either
  // would sit there invisibly and match nothing.
  const prune = (features: Record<string, string[]>, f: LemmaForms | null) => {
    const out: Record<string, string[]> = {}
    // The part of speech goes first, because everything else depends on it. Keep it only if the
    // word can actually be that; if the word has exactly one tag, adopt it.
    const allowed = f?.p ?? null
    const current = features.pos?.[0] ?? ''
    let posVal = current
    if (allowed && current && !allowed.includes(current)) posVal = allowed.length === 1 ? allowed[0] : ''
    if (posVal) out.pos = [posVal]
    for (const g of groupsFor(posVal, features.mood ?? [], f)) {
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

  // Settle the card against a word's attested forms: adopt the part of speech when the word leaves
  // no doubt (a lemma attested as both noun and adjective keeps the choice open, just narrowed to
  // those two), and re-prune either way, since changing the word can invalidate a form that was
  // legal for the old one (a feminine left over after switching to λόγος).
  const settleAgainst = (features: Record<string, string[]>, f: LemmaForms | null) => {
    const found = f?.p.length === 1 ? f.p[0] : null
    return prune(found && found !== pos ? { ...features, pos: [found] } : features, f)
  }

  // Strong's numbers from the table are what the engine actually matches on for a corpus whose
  // own lemma field is only a surface form. Dropped when the word no longer resolves, so a stale
  // number can't outlive the word it came from.
  const strongsOf = (f: LemmaForms | null): string[] | undefined => {
    const s = f?.s as unknown as string[] | undefined
    return s?.length ? s : undefined
  }

  const applyLemma = (next: string) => {
    const nextForms = lemmaForms?.get(foldWord(next.trim())) ?? null
    const nextTerm: ConstructTerm = { ...term, lemma: next, features: settleAgainst(term.features, nextForms) }
    const s = strongsOf(nextForms)
    if (s) nextTerm.strongs = s; else delete nextTerm.strongs
    onChange(nextTerm)
  }

  // With no in-page table the lookup is async, so the settling happens when the answer lands
  // rather than on the keystroke. Compared before writing so this can't loop.
  useEffect(() => {
    if (lemmaForms || !typed || remote.q !== typed || !remote.exact) return
    const next = settleAgainst(term.features, remote.exact)
    const s = strongsOf(remote.exact)
    const changed = JSON.stringify(next) !== JSON.stringify(term.features)
      || JSON.stringify(s ?? null) !== JSON.stringify(term.strongs ?? null)
    if (changed) {
      const nextTerm: ConstructTerm = { ...term, features: next }
      if (s) nextTerm.strongs = s; else delete nextTerm.strongs
      onChange(nextTerm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, typed, lemmaForms])

  const onLemmaChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const caret = el.selectionStart ?? el.value.length
    const next = greekInput ? (isHebrew ? latinToHebrew(el.value) : betaCodeToGreek(el.value)) : el.value
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
  const suggestions = useMemo<Suggestion[]>(() => {
    const q = foldWord(typed)
    if (!lemmaForms) return remote.q === typed ? remote.suggestions : []
    if (q.length < 2) return []
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
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('cq.wordN', { n: index + 1 })}</span>
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
          {/* The New Testament trees carry real lemmas, so its field means "any form of this
              word". The Septuagint chapter files don't — their `lemma` is a verbatim copy of the
              surface form — so there the field can only mean "this exact form", and says so
              rather than promising something it can't do. Strong's numbers would give the LXX a
              true lexeme, which is the proper fix. */}
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <span className="text-gray-500">
              {t(isHebrew
                ? (lexemeIsExact ? 'cq.step1HebrewForm' : 'cq.step1Hebrew')
                : (lexemeIsExact ? 'cq.step1GreekForm' : 'cq.step1Greek'))}
            </span>
            <span className="font-normal normal-case tracking-normal text-gray-300">
              {t(lexemeIsExact ? 'cq.exactFormHint' : 'cq.anyFormHint')}
            </span>
          </label>
          <input ref={inputRef} value={term.lemma ?? ''} onChange={onLemmaChange} onKeyDown={onLemmaKeyDown}
            onFocus={() => { if (suggestions.length) setOpenSug(true) }}
            autoComplete="off" spellCheck={false}
            placeholder={t(isHebrew
              ? (lexemeIsExact ? 'cq.egHebrewExact' : 'cq.egHebrew')
              : (lexemeIsExact ? 'cq.egGreekExact' : 'cq.egGreek'))}
            dir={isHebrew ? 'rtl' : undefined}
            lang={isHebrew ? 'he' : undefined}
            className={`w-full rounded-md border border-gray-300 bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${isHebrew ? 'font-hebrew text-base' : greekInput ? 'greek-text' : ''}`} />

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
                    <span dir={isHebrew ? 'rtl' : undefined}
                      className={`shrink-0 text-base text-gray-800 ${isHebrew ? 'font-hebrew' : 'greek-text'}`}>{s.display}</span>
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
              {lexemeIsExact ? t('cq.found') : t('cq.recognised')} — {forms.p.join(' or ')}
              {settled.length > 0 && <span className="text-gray-400"> · always {settled.join(', ')}</span>}
            </p>
          ) : typed.length >= 3 && resolved ? (
            <p className="mt-1 text-[11px] text-gray-400">Not found in this text — check the spelling, or set the form by hand</p>
          ) : null}
        </div>
        <button type="button" onClick={() => setGreekInput(v => !v)}
          title={greekInput
            ? (isHebrew ? t('cq.hebrewKeyboardOn', { legend: HEBREW_LEGEND }) : t('cq.greekKeyboardOn', { legend: BETA_LEGEND }))
            : t(isHebrew ? 'cq.hebrewKeyboardOff' : 'cq.greekKeyboardOff')}
          className={`flex-none rounded-md border px-2 py-1.5 text-xs transition-colors ${
            greekInput ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-surface text-gray-500 hover:bg-gray-50'}`}>
          <span className={isHebrew ? 'font-hebrew' : 'greek-text'}>{isHebrew ? 'א' : 'α'}</span>
        </button>
      </div>

      {/* Step 2 — WHAT FORM. Part of speech first: it decides which categories even appear. */}
      <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {t('cq.step2')}
        <span className="font-normal normal-case tracking-normal text-gray-300">{t('cq.step2Hint')}</span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {/* Part of speech: a dropdown only while it's still open. Once the word settles it
            (λόγος can only be a noun) there is nothing to pick, so it reads as a fact. */}
        {posOptions.length === 1 && forms ? (
          <Fixed label={t('cq.partOfSpeech')} value={featureLabel(posOptions[0], t)} />
        ) : (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Part of speech</label>
            <select value={pos} onChange={e => setCategory('pos', e.target.value ? [e.target.value] : [])}
              className="w-full rounded-md border border-gray-300 bg-surface px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">{t('cq.any')}</option>
              {vocab.posFeatures.filter(f => posOptions.includes(f.value))
                .map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        )}

        {/* Same rule per category: λόγος is masculine, so Gender is a statement, not a menu.
            Where a choice remains, the menu lists only forms the word actually occurs in. */}
        {categories.map(g => {
          const opts = optionsFor(g)
          if (opts.length === 1) return <Fixed key={g.key} label={groupLabel(g.key, t, g.label)} value={featureLabel(opts[0], t)} />
          return (
            <MorphSelect key={g.key}
              group={opts.length === g.features.length ? g : { ...g, features: g.features.filter(f => opts.includes(f.value)) }}
              selected={term.features[g.key] ?? []}
              onChange={vals => setCategory(g.key, vals)}
              vocab={vocab} />
          )
        })}
      </div>

      {/* Step 3 — HOW IT RELATES to the other words: whether it must be there at all, and whether
          it has to agree. Agreement is the point of the whole feature for teaching — attributive
          vs predicate position, Granville Sharp — so it sits on the card, not behind a menu. */}
      {termCount > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-2.5">
          <span className="flex items-center gap-2 text-xs text-gray-600">
            {([[false, t('cq.mustAppear')], [true, t('cq.mustNotAppear')]] as const).map(([val, label]) => (
              <label key={label} className="flex cursor-pointer items-center gap-1"
                title={val ? t('cq.notBetweenTitle') : undefined}>
                <input type="radio" name={`negate-${index}`} checked={!!term.negate === val}
                  onChange={() => onChange({ ...term, negate: val || undefined })}
                  className="h-3 w-3 accent-brand-600" />
                {label}
              </label>
            ))}
          </span>

          {/* A forbidden word isn't positioned, so it has nothing to agree with. */}
          {!term.negate && (
            <span className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <label className="flex cursor-pointer items-center gap-1">
                <input type="checkbox" checked={agreeOn.length > 0}
                  onChange={e => setAgreement(e.target.checked ? [...vocab.agreementCategories] : [], agreeWith)}
                  className="h-3 w-3 accent-brand-600" />
                {t('cq.agreesWith')}
              </label>
              {otherWords.length === 1 ? (
                <span className="text-gray-500">{t('cq.wordN', { n: otherWords[0] + 1 })}</span>
              ) : (
                <select value={agreeWith} onChange={e => setAgreement(agreeOn, Number(e.target.value))}
                  className="rounded border border-gray-300 bg-surface px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {otherWords.map(i => <option key={i} value={i}>{t('cq.wordN', { n: i + 1 })}</option>)}
                </select>
              )}
              <span className="text-gray-400">{t('cq.in')}</span>
              {vocab.agreementCategories.map(cat => (
                <label key={cat} className="flex cursor-pointer items-center gap-1">
                  <input type="checkbox" checked={agreeOn.includes(cat)}
                    onChange={e => setAgreement(
                      e.target.checked ? [...agreeOn, cat] : agreeOn.filter(c => c !== cat), agreeWith)}
                    className="h-3 w-3 accent-brand-600" />
                  {cat}
                </label>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
