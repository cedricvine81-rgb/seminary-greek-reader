'use client'
import { type ReactNode } from 'react'
import { findTermRanges, SEARCH_MARK } from '@/lib/highlight-terms'
import { openWordSearch, type WordSearchPayload } from '@/lib/word-search-bus'

/**
 * Search-result text with the same right-click menu the readers have.
 *
 * Results used to render as inert strings, so a word found by searching could not be
 * searched again, looked up, or highlighted — the one place a reader most wants to dig
 * further. This splits the text into per-word spans carrying the menu, while keeping the
 * search terms marked.
 *
 * `payload` supplies the per-word menu details (corpus, book, translation language,
 * background collection) that only the calling surface knows.
 */
/** Trim surrounding punctuation so "λόγος," searches as "λόγος". */
function stripEdgePunctuation(tok: string): string {
  return tok.replace(/^[^\wʼ'\u0370-\u03ff\u1f00-\u1fff\u0590-\u05ff]+/, '')
            .replace(/[^\wʼ'\u0370-\u03ff\u1f00-\u1fff\u0590-\u05ff]+$/, '') || tok
}

export function SearchWords({
  text, terms, payload, className,
}: {
  text: string
  terms: string[]
  payload: (word: string) => Omit<WordSearchPayload, 'x' | 'y' | 'surface'>
  className?: string
}): ReactNode {
  const ranges = terms.length ? findTermRanges(text, terms) : []
  const inTerm = (start: number, end: number) =>
    ranges.some(([rs, re]) => start < re && end > rs)

  let pos = 0
  return (
    <span className={className}>
      {text.split(/(\s+)/).map((tok, i) => {
        const start = pos
        pos += tok.length
        if (!tok || /\s/.test(tok)) return tok
        const end = start + tok.length
        const marked = inTerm(start, end)
        return (
          <span
            key={i}
            className={`trans-word${marked ? ` ${SEARCH_MARK}` : ''}`}
            onContextMenu={e => {
              e.preventDefault()
              e.stopPropagation()
              openWordSearch({
                x: e.clientX, y: e.clientY,
                surface: stripEdgePunctuation(tok),
                ...payload(tok),
              })
            }}
          >
            {tok}
          </span>
        )
      })}
    </span>
  )
}
