import { Fragment, type ReactNode } from 'react'

/**
 * `_like this_` becomes italics.
 *
 * Authored prose needs italics for one thing above all: the titles of works. SBL style asks
 * for them, and a citation that reads "Aristotle, Rhet. 3.9" in upright type is not quite the
 * citation. The alternative — cutting the sentence at every title and reassembling it in JSX —
 * fixes English word order into every translation, which is the mistake rich() exists to
 * avoid; an underscore travels through a translator's hands intact.
 *
 * Deliberately the only markup here. Anything more and authors start writing a language
 * instead of a sentence.
 */
export function emphasise(text: string): ReactNode {
  return text.split(/(_[^_]+_)/).map((seg, i) =>
    /^_[^_]+_$/.test(seg)
      ? <em key={i}>{seg.slice(1, -1)}</em>
      : <Fragment key={i}>{seg}</Fragment>,
  )
}
