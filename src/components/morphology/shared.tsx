'use client'

/* ─────────────────────────────────────────────
   Morphology — shared building blocks

   Everything the chapter files (chapters/*.tsx) and the MorphologyView
   shell have in common: the paradigm-table components, the level context
   behind the Beginning/Intermediate toggle, and the textbook components
   (Term glossary tooltips, Practice exercises, LiveExamples corpus links).
───────────────────────────────────────────── */

import { useState, useContext, createContext } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { GLOSSARY } from './glossary'

export type MorphLevel = 'beginning' | 'intermediate'

/** Current Beginning/Intermediate level, provided by MorphologyView. */
export const LevelContext = createContext<MorphLevel>('beginning')

/* ─── Paradigm tables ───────────────────────── */

interface MorphTableProps {
  title?: React.ReactNode
  headers: string[]
  rows: (string | null | undefined)[][]
  dividerRows?: number[]
  note?: string
  firstColIsData?: boolean
  highlight?: string
  highlightCols?: number[]
  /** Drop the default bottom margin (used when the table sits inside a TableAside row). */
  flush?: boolean
}

export function MorphTable({ title, headers, rows, dividerRows = [], note, firstColIsData = false, highlight, highlightCols, flush = false }: MorphTableProps) {
  const divSet = new Set(dividerRows)
  return (
    <div className={flush ? '' : 'mb-5'}>
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {title}
        </p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {headers.map((h, i) => (
                <th key={i} className={clsx('px-3 py-2 font-semibold text-gray-700 text-sm whitespace-nowrap', i === 0 ? 'text-left' : 'text-center')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isDivider = divSet.has(ri)
              return (
                <tr key={ri} className={clsx(isDivider ? 'bg-gray-50 border-t border-gray-200' : 'bg-surface', !isDivider && ri > 0 && 'border-t border-gray-100')}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={clsx('px-3 py-2', isDivider ? 'text-xs font-semibold text-gray-500 uppercase tracking-wide' : (ci === 0 && !firstColIsData) ? 'text-left text-sm font-medium text-gray-500 whitespace-nowrap' : (firstColIsData && ci > 0) ? ['text-left text-sm', (highlight && (!highlightCols || highlightCols.includes(ci))) ? highlight : 'text-gray-900'] : ['text-center text-sm', (highlight && (!highlightCols || highlightCols.includes(ci))) ? highlight : 'text-gray-900'])}>
                      {cell ?? ''}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

export function InfoBox({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
      {title && <p className="font-semibold text-gray-800 mb-1.5">{title}</p>}
      {children}
    </div>
  )
}

/**
 * A simple left-aligned multi-column table for parallel lists (e.g. adverbs by
 * How/When/Where, semantic labels). Unlike MorphTable, every cell is plain
 * left-aligned data and cells may be React nodes (for sub-headings).
 */
export function ColsTable({ title, headers, rows, note }: {
  title?: React.ReactNode
  headers: string[]
  rows: React.ReactNode[][]
  note?: string
}) {
  return (
    <div className="mb-5">
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{title}</p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold text-gray-700 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={clsx('bg-surface align-top', ri > 0 && 'border-t border-gray-100')}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-left text-gray-900">{cell ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

/**
 * Wrap runs of Greek characters in a normal-case span so the section-title
 * CSS `uppercase` transform does not capitalise Greek text.
 * Covers Basic Greek (U+0370–U+03FF) and Greek Extended (U+1F00–U+1FFF).
 */
export function gt(text: string): React.ReactNode {
  const re = /[Ͱ-Ͽἀ-῿]+/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<span key={m.index} className="normal-case">{m[0]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length <= 1 && typeof parts[0] === 'string' ? parts[0] ?? text : <>{parts}</>
}

/* ─── Table + aside layout ──────────────────── */

/**
 * Paradigm tables are only as wide as their content, leaving space to the
 * right. TableAside fills that space with a level-aware explanation/example
 * panel: it reads the current Beginning/Intermediate level from context and
 * shows the matching aside. On mobile the aside stacks under the table.
 */
export function TableAside({ beginning, intermediate, children, sticky = false }: {
  beginning?: React.ReactNode
  intermediate?: React.ReactNode
  children: React.ReactNode
  /** Keep the aside pinned in view while a long table scrolls past it. */
  sticky?: boolean
}) {
  const level = useContext(LevelContext)
  const aside = level === 'beginning' ? beginning : intermediate
  return (
    <div className="mb-5 flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-6">
      <div className="w-fit max-w-full lg:shrink-0">{children}</div>
      {aside && (
        <aside className={clsx(
          'lg:flex-1 min-w-0 lg:pl-6 lg:border-l lg:border-gray-100 space-y-2 text-sm leading-relaxed text-gray-600',
          sticky && 'lg:sticky lg:top-2 lg:self-start'
        )}>
          {aside}
        </aside>
      )}
    </div>
  )
}

/** Greek run in an aside (asides are not uppercased, but this keeps intent explicit). */
export function Gk({ children }: { children: React.ReactNode }) {
  return <span className="normal-case font-medium text-gray-800">{children}</span>
}

/** An example line in an aside: Greek → English. */
export function Ex({ grc, en }: { grc: React.ReactNode; en: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="normal-case text-gray-800">{grc}</span>
      <span className="mx-1.5 text-gray-400">→</span>
      <span className="text-gray-600">{en}</span>
    </p>
  )
}

/** A small bold sub-label inside an aside (e.g. "Default translations"). */
export function AsideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{children}</p>
}

/* ─── Textbook components ───────────────────── */

/** A paragraph of chapter prose, width-capped for comfortable reading. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-gray-700 max-w-3xl mb-3">{children}</p>
}

/** Numbered section heading inside a chapter. */
export function SectionHeading({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
      {n != null && (
        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          {n}
        </span>
      )}
      {children}
    </h3>
  )
}

/** Render children only at one level (e.g. the English-grammar primer only for Beginning). */
export function LevelOnly({ level, children }: { level: MorphLevel; children: React.ReactNode }) {
  const cur = useContext(LevelContext)
  return cur === level ? <>{children}</> : null
}

/**
 * A glossary term. Renders with a dotted underline; tapping it opens a small
 * plain-English definition. `t` must match a GLOSSARY key; the visible text
 * defaults to the key but can be overridden with children (e.g. plural form).
 */
export function Term({ t, children }: { t: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const def = GLOSSARY[t.toLowerCase()]
  if (!def) return <>{children ?? t}</>
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setOpen(false)}
        className="underline decoration-dotted decoration-brand-400 underline-offset-2 cursor-help text-inherit"
      >
        {children ?? t}
      </button>
      {open && (
        <span className="absolute left-0 top-full mt-1 z-40 block w-64 max-w-[78vw] rounded-lg border border-gray-200 bg-popover px-3 py-2 text-xs leading-relaxed text-gray-700 shadow-lg normal-case font-normal text-left">
          <span className="font-semibold text-gray-900">{def.title}</span> — {def.def}
        </span>
      )}
    </span>
  )
}

/** An exercise block with tap-to-reveal answers. */
export function Practice({ title = 'Try it', intro, items }: {
  title?: string
  intro?: React.ReactNode
  items: { q: React.ReactNode; a: React.ReactNode }[]
}) {
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</p>
      {intro && <div className="text-sm text-gray-600 mb-3">{intro}</div>}
      <ol className="space-y-3 list-decimal list-inside">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-gray-800">
            <span>{it.q}</span>
            <details className="mt-0.5 ml-5">
              <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-xs font-medium text-brand-600 hover:text-brand-700">
                Show answer
              </summary>
              <div className="mt-1 text-sm text-gray-700 border-l-2 border-brand-200 pl-3">{it.a}</div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Guided "we do" example — step ③ of the teaching cycle (① English concept,
 * ② Greek examples, ③ guided practice with prompts, ④ independent practice).
 * A sentence is worked through staged prompts: each "Show" reveals the answer
 * to the current prompt and surfaces the next one, mirroring how the
 * instructor prompts the class. The final translation appears at the end.
 */
export function GuidedExample({ title = 'Together: work it through', sentence, source, translation, steps }: {
  title?: string
  sentence: React.ReactNode
  /** Optional verse reference; rendered as a link into the Reader. */
  source?: { ref: string; label?: string }
  translation?: React.ReactNode
  steps: { prompt: React.ReactNode; answer: React.ReactNode }[]
}) {
  const [revealed, setRevealed] = useState(0)
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1.5">{title}</p>
      <p className="text-base normal-case text-gray-900 mb-1">{sentence}</p>
      {source && (
        <p className="text-xs mb-2">
          <Link href={`/reader?ref=${encodeURIComponent(source.ref)}`} className="text-brand-600 hover:underline">
            {source.label ?? source.ref} — open in the Reader →
          </Link>
        </p>
      )}
      <ol className="mt-2 space-y-2.5">
        {steps.slice(0, revealed + 1).map((s, i) => (
          <li key={i} className="text-sm">
            <p className="font-medium text-gray-800">{s.prompt}</p>
            {i < revealed ? (
              <p className="mt-0.5 border-l-2 border-brand-300 pl-3 text-gray-700">{s.answer}</p>
            ) : (
              <button
                onClick={() => setRevealed(r => r + 1)}
                className="mt-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
              >
                Show
              </button>
            )}
          </li>
        ))}
      </ol>
      {revealed >= steps.length && translation && (
        <p className="mt-3 border-t border-brand-100 pt-2.5 text-sm font-medium text-gray-900">{translation}</p>
      )}
      {revealed > 0 && (
        <button onClick={() => setRevealed(0)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">
          Start over
        </button>
      )}
    </div>
  )
}

/**
 * Links into the live tagged corpus: each entry opens the Master Search
 * morphology facet (/search?in=morph:GNT) pre-filled with the given features
 * and/or lemma, so students see every real NT occurrence of the category.
 */
export function LiveExamples({ intro, links }: {
  intro?: React.ReactNode
  links: { label: React.ReactNode; features?: string[]; lemma?: string }[]
}) {
  return (
    <div className="my-5 max-w-3xl rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 mb-1.5">See it in the New Testament</p>
      {intro && <div className="text-sm text-gray-600 mb-2">{intro}</div>}
      <ul className="space-y-1.5">
        {links.map((l, i) => {
          const p = new URLSearchParams({ in: 'morph:GNT' })
          if (l.features?.length) p.set('features', l.features.join(','))
          if (l.lemma) p.set('q', l.lemma)
          p.set('from', '/grammar')
          return (
            <li key={i}>
              <Link href={`/search?${p.toString()}`} className="text-sm text-brand-600 hover:text-brand-700 hover:underline">
                {l.label} →
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
