'use client'

// Choosing what to compare: type a reference, or pick a work from the library.
//
// This replaces four controls — a mode toggle, a filter box, a 433-item select, and a pair of
// chapter spinners — with the two things a reader actually has in mind. Scripture they can
// write down ("Mark", "Luke 1-2", "Mark 4:1-9"), so there is a box that reads what they write
// and completes the pericope as they type, the same box the Exegesis page uses. Everything
// else is a title they would have to look up, so there is a list of titles.
//
// A reference naming a whole book is answered from the prebuilt index with no request at all;
// only a genuine passage costs one.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { bookName } from '@/lib/i18n/book-names'
import { CORPUS_KEY, type PassageManifest, type StyleUnit } from '@/lib/style-register'
import { formatReference, normRef, parseReference, type ParsedRef, type RefBook } from '@/lib/style-reference'

/** A labelled section of a book, from public/data/pericopes.json. */
interface Section { c: number; v: number; ec: number; ev: number; t: string }
type Pericopes = Record<string, Section[]>

export type Target =
  | { kind: 'work'; work: string }
  | {
      kind: 'passage'
      corpus: string; book: string; label: string
      fromCh: number; toCh: number; fromV?: number; toV?: number
      /** From the manifest, so the size of a selection shows before it is profiled. */
      words: number
    }

/** Splits worth putting in front of a reader: each shows something no whole work can. */
const PRESETS = [
  { ref: 'Luke 1-2', key: 'reg.preset.lukeInfancy' },
  { ref: 'Luke 3-24', key: 'reg.preset.lukeRest' },
  { ref: 'Acts 1-15', key: 'reg.preset.actsEarly' },
  { ref: 'Acts 16-28', key: 'reg.preset.actsWe' },
]

export function TargetPicker({
  manifest, works, initialRef, initialWork, onTarget, nameOf, corpusOf,
}: {
  manifest: PassageManifest
  works: StyleUnit[]
  initialRef?: string
  initialWork?: string
  onTarget: (t: Target | null) => void
  nameOf: (u: StyleUnit) => string
  corpusOf: (u: StyleUnit) => string
}) {
  const t = useT()
  const locale = useLocale()

  const [books, setBooks] = useState<RefBook[]>([])
  const [pericopes, setPericopes] = useState<Pericopes>({})
  const [text, setText] = useState(initialRef ?? '')
  const [ghost, setGhost] = useState('')
  const [sections, setSections] = useState<{ ref: string; title: string }[]>([])
  const [predOpen, setPredOpen] = useState(false)
  const [libraryWork, setLibraryWork] = useState(initialWork ?? '')
  const suggestion = useRef('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let live = true
    Promise.all([
      fetch('/data/books.json').then(r => r.json()),
      fetch('/data/pericopes.json').then(r => r.json()),
    ]).then(([b, p]) => {
      if (!live) return
      // Each book also answers to its name in the reader's language, which is what the
      // placeholder tells them to type.
      setBooks(([...(b.gnt ?? []), ...(b.lxx ?? [])] as RefBook[])
        .map(bk => ({ ...bk, aliases: [bookName(bk.osisId, locale, bk.name)] })))
      setPericopes(p as Pericopes)
    }).catch(() => {})
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  useEffect(() => {
    if (!predOpen) return
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setPredOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [predOpen])

  /* ── what the reference means ────────────────────────────────────────── */
  const parsed = useMemo(() => (books.length ? parseReference(text, books) : null), [text, books])

  const wordsIn = useCallback((p: ParsedRef) => {
    const list = manifest[p.book.corpus]?.find(b => b.id === p.book.osisId)
    if (!list) return 0
    let n = 0
    for (const [ch, w] of list.ch) if (ch >= p.fromCh && ch <= p.toCh) n += w
    return n
  }, [manifest])

  // A whole book that the index already profiles needs no request; anything else is a passage.
  const workIds = useMemo(() => new Set(works.map(w => w.work)), [works])

  useEffect(() => {
    if (libraryWork) { onTarget({ kind: 'work', work: libraryWork }); return }
    if (!parsed) { onTarget(null); return }
    if (parsed.wholeBook && workIds.has(parsed.book.osisId)) {
      onTarget({ kind: 'work', work: parsed.book.osisId })
      return
    }
    const label = bookName(parsed.book.osisId, locale, parsed.book.name)
    onTarget({
      kind: 'passage',
      corpus: parsed.book.corpus, book: parsed.book.osisId,
      label: formatReference(parsed, label),
      fromCh: parsed.fromCh, toCh: parsed.toCh, fromV: parsed.fromV, toV: parsed.toV,
      words: wordsIn(parsed),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, libraryWork, workIds, locale, wordsIn])

  /* ── the grey completion, and the chapter's sections ─────────────────── */
  // The same resolution the parser uses, so a prediction never disagrees with the reference it
  // is predicting for.
  const matchBook = (typed: string) => {
    const names = (b: RefBook) => [b.name, ...(b.aliases ?? [])].map(normRef)
    return books.find(b => normRef(b.osisId) === typed || names(b).includes(typed))
      ?? books.find(b => b.abbrev && normRef(b.abbrev) === typed)
      ?? books.find(b => names(b).some(n => n.startsWith(typed)) || normRef(b.osisId).startsWith(typed))
      ?? null
  }

  const recompute = (value: string) => {
    suggestion.current = ''
    setGhost('')
    setSections([])
    if (!books.length) return

    // Complete the pericope the typed verse opens, exactly as the Exegesis box does.
    const m = /^(\s*.+?\s+(\d+):(\d+))(?:\s*[-–]\s*\d*)?\s*$/.exec(value)
    if (m) {
      const prefix = m[1].replace(/\s+$/, '')
      const ch = Number(m[2]); const v = Number(m[3])
      const bookStr = normRef(prefix.slice(0, prefix.lastIndexOf(`${m[2]}:${m[3]}`)))
      const book = matchBook(bookStr)
      const secs = book ? pericopes[book.osisId] : undefined
      const sec = secs?.find(s => (ch > s.c || (ch === s.c && v >= s.v))
        && (ch < s.ec || (ch === s.ec && v <= s.ev)))
      if (sec && sec.ec === ch && sec.ev > v) {
        const full = `${prefix}-${sec.ev}`
        if (full.startsWith(value) && full.length > value.length) {
          suggestion.current = full
          setGhost(full.slice(value.length))
        }
      }
    }

    // Every labelled section of the chapter the box resolves to.
    const c = /^\s*(.+?)\s+(\d+)(?::\d+)?\s*(?:[-–].*)?$/.exec(value)
    if (!c) return
    const bookStr = normRef(c[1])
    const chapter = Number(c[2])
    const book = matchBook(bookStr)
    if (!book) return
    const label = bookName(book.osisId, locale, book.name)
    setSections((pericopes[book.osisId] ?? [])
      .filter(s => s.c <= chapter && chapter <= s.ec)
      .map(s => ({
        ref: `${label} ${s.c}:${s.v}${s.c === s.ec ? `-${s.ev}` : `-${s.ec}:${s.ev}`}`,
        title: s.t,
      })))
  }

  const change = (value: string) => {
    setText(value)
    setLibraryWork('')          // typing a reference takes the target back from the list
    recompute(value)
    setPredOpen(true)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const atEnd = e.currentTarget.selectionStart === text.length
    if (ghost && (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd))) {
      e.preventDefault()
      change(suggestion.current)
      return
    }
    if (e.key === 'Enter') { e.preventDefault(); if (ghost) change(suggestion.current); setPredOpen(false) }
    if (e.key === 'Escape') setPredOpen(false)
  }

  /* ── the library list, grouped the way the Texts menu groups it ──────── */
  const grouped = useMemo(() => {
    const byGroup = new Map<string, StyleUnit[]>()
    for (const w of works) {
      // Greco-Roman is 294 works; grouped under one heading it is unusable, so it splits by
      // author the way the Texts menu does — the author is the title's own prefix.
      const group = w.corpus === 'greco'
        ? w.label.split(',')[0].trim()
        : (CORPUS_KEY[w.corpus] ? t(CORPUS_KEY[w.corpus]) : w.corpus)
      const list = byGroup.get(group)
      if (list) list.push(w); else byGroup.set(group, [w])
    }
    return Array.from(byGroup.entries())
      .map(([group, items]) => [group, items.sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale))] as const)
      .sort((a, b) => a[0].localeCompare(b[0], locale))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works, locale, t])

  const parsedWords = parsed && !parsed.wholeBook ? wordsIn(parsed) : 0

  return (
    <div className="space-y-3">
      <div ref={boxRef}>
        <label htmlFor="reg-ref" className="mb-1 block text-sm font-medium text-gray-700">
          {t('reg.passageLabel')}
        </label>
        <div className="relative">
          {/* The ghost sits under the input, offset by the text already typed. */}
          {ghost && (
            <div className="pointer-events-none absolute inset-0 flex items-center whitespace-pre px-3 text-sm">
              <span className="invisible">{text}</span><span className="text-gray-400">{ghost}</span>
            </div>
          )}
          <input
            id="reg-ref" value={text} onChange={e => change(e.target.value)}
            onKeyDown={onKeyDown} onFocus={() => { if (sections.length) setPredOpen(true) }}
            placeholder={t('reg.passagePlaceholder')} autoComplete="off" spellCheck={false}
            className="input w-full bg-transparent text-sm"
          />
          {predOpen && sections.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-popover py-1 shadow-lg">
              {sections.map(s => (
                <button
                  key={s.ref} type="button"
                  onMouseDown={e => { e.preventDefault(); setText(s.ref); setLibraryWork(''); setGhost(''); setSections([]); setPredOpen(false); recompute(s.ref) }}
                  className="block w-full px-3 py-1.5 text-left hover:bg-brand-50"
                >
                  <span className="text-xs font-medium text-brand-700">{s.ref}</span>
                  <span className="ml-2 text-xs text-gray-500">{s.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {text.trim() && !parsed && <span className="text-amber-700">{t('reg.refNotFound')}</span>}
          {parsedWords > 0 && (
            <span className="text-gray-500">{t('reg.selectionSize', { n: parsedWords.toLocaleString(locale) })}</span>
          )}
          <span className="text-gray-500">{t('reg.try')}</span>
          {PRESETS.map(p => (
            <button
              key={p.key} type="button" onClick={() => change(p.ref)}
              className="rounded-full border border-gray-200 px-2 py-0.5 text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              {t(p.key)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="reg-library" className="mb-1 block text-sm font-medium text-gray-700">
          {t('reg.libraryLabel')}
        </label>
        <select
          id="reg-library" value={libraryWork} className="input w-full text-sm"
          onChange={e => { setLibraryWork(e.target.value); if (e.target.value) { setText(''); setGhost(''); setSections([]) } }}
        >
          <option value="">{t('reg.libraryPlaceholder')}</option>
          {grouped.map(([group, items]) => (
            <optgroup key={group} label={group}>
              {items.map(w => (
                <option key={w.work} value={w.work}>
                  {nameOf(w)} — {corpusOf(w)} ({w.n.toLocaleString(locale)})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  )
}
