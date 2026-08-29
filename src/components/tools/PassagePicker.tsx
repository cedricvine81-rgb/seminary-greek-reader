'use client'

// Choosing a passage to profile: a book, and a range of chapters within it.
//
// The word count is shown live, from the manifest, BEFORE the server is asked to profile
// anything — the size of a selection is the single thing most likely to make the answer
// worthless, and a reader should be able to see that they have picked 300 words without
// having to submit and be told.

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { bookName } from '@/lib/i18n/book-names'
import { CORPUS_KEY, type PassageBook, type PassageManifest } from '@/lib/style-register'

export interface PassageSelection {
  corpus: string
  book: string
  label: string
  fromCh: number
  toCh: number
  /** Words in the selection, from the manifest — the server's count is authoritative. */
  words: number
}

/**
 * Splits worth putting in front of a reader, because each one answers a question the tool
 * exists for and none of them is visible at whole-work grain. Luke's infancy narrative
 * septuagintalizes and the rest of Luke does not; Acts changes at the "we" sections.
 */
const PRESETS: { corpus: string; book: string; fromCh: number; toCh: number; key: string }[] = [
  { corpus: 'GNT', book: 'Luke', fromCh: 1, toCh: 2, key: 'reg.preset.lukeInfancy' },
  { corpus: 'GNT', book: 'Luke', fromCh: 3, toCh: 24, key: 'reg.preset.lukeRest' },
  { corpus: 'GNT', book: 'Acts', fromCh: 1, toCh: 15, key: 'reg.preset.actsEarly' },
  { corpus: 'GNT', book: 'Acts', fromCh: 16, toCh: 28, key: 'reg.preset.actsWe' },
]

export function PassagePicker({
  manifest, initial, onChange,
}: {
  manifest: PassageManifest
  /** The passage a shared link opened on, if any. Read once, for the opening state only. */
  initial: { corpus: string; book: string; fromCh: number; toCh: number } | null
  onChange: (s: PassageSelection) => void
}) {
  const t = useT()
  const locale = useLocale()

  const corpora = useMemo(() => Object.keys(manifest), [manifest])
  const [corpus, setCorpus] = useState(initial?.corpus ?? corpora[0] ?? 'GNT')
  const books = manifest[corpus] ?? []
  const [book, setBook] = useState(initial?.book ?? 'Luke')
  const current: PassageBook | undefined = books.find(b => b.id === book) ?? books[0]

  const chapters = current?.ch ?? []
  const lastCh = chapters.length ? chapters[chapters.length - 1][0] : 1
  const [fromCh, setFromCh] = useState(initial?.fromCh ?? 1)
  const [toCh, setToCh] = useState(initial?.toCh ?? lastCh)

  const nameOf = (b: PassageBook) => bookName(b.id, locale, b.label)

  // Words in the chosen range, summed from the manifest.
  const words = useMemo(() => {
    let n = 0
    for (const [ch, w] of chapters) if (ch >= fromCh && ch <= toCh) n += w
    return n
  }, [chapters, fromCh, toCh])

  // Publish the selection whenever it settles. The parent debounces the request.
  useEffect(() => {
    if (!current) return
    onChange({ corpus, book: current.id, label: nameOf(current), fromCh, toCh, words })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpus, current?.id, fromCh, toCh, words, locale])

  const pickBook = (id: string) => {
    const b = books.find(x => x.id === id)
    setBook(id)
    setFromCh(1)
    setToCh(b?.ch.length ? b.ch[b.ch.length - 1][0] : 1)
  }

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setCorpus(p.corpus)
    setBook(p.book)
    setFromCh(p.fromCh)
    setToCh(p.toCh)
  }

  const num = (v: number, set: (n: number) => void, min: number, max: number, label: string) => (
    <input
      type="number" min={min} max={max} value={v} aria-label={label}
      onChange={e => {
        const n = Number(e.target.value)
        if (Number.isFinite(n)) set(Math.min(max, Math.max(min, Math.round(n))))
      }}
      className="input w-16 text-sm tabular-nums"
    />
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="reg-corpus" className="mb-1 block text-sm font-medium text-gray-700">
            {t('reg.corpus')}
          </label>
          <select
            id="reg-corpus" value={corpus} className="input text-sm"
            onChange={e => { setCorpus(e.target.value); const bs = manifest[e.target.value] ?? []; if (bs.length) pickBook(bs[0].id) }}
          >
            {corpora.map(c => (
              <option key={c} value={c}>{CORPUS_KEY[c] ? t(CORPUS_KEY[c]) : c}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label htmlFor="reg-book" className="mb-1 block text-sm font-medium text-gray-700">
            {t('reg.book')}
          </label>
          <select
            id="reg-book" value={current?.id ?? ''} className="input w-full text-sm"
            onChange={e => pickBook(e.target.value)}
          >
            {books.map(b => <option key={b.id} value={b.id}>{nameOf(b)}</option>)}
          </select>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">{t('reg.chapters')}</span>
          <div className="flex items-center gap-1.5">
            {num(fromCh, n => { setFromCh(n); if (n > toCh) setToCh(n) }, 1, lastCh, t('reg.firstChapter'))}
            <span className="text-gray-400">–</span>
            {num(toCh, n => { setToCh(n); if (n < fromCh) setFromCh(n) }, 1, lastCh, t('reg.lastChapter'))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <span className="text-gray-500">
          {t('reg.selectionSize', { n: words.toLocaleString(locale) })}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">{t('reg.try')}</span>
        {PRESETS.map(p => (
          <button
            key={p.key} onClick={() => applyPreset(p)}
            className="rounded-full border border-gray-200 px-2 py-0.5 text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            {t(p.key)}
          </button>
        ))}
      </div>
    </div>
  )
}
