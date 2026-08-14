import { Fragment, type ReactNode } from 'react'

/**
 * A translated sentence whose holes are ELEMENTS, not text.
 *
 * WHY THIS EXISTS. Most of the English still hard-coded in this app is not a bare string —
 * it is a sentence with markup threaded through it: a work title in italics, a term in bold,
 * a chip sample, a link. The obvious fix, cutting it into three keys and putting the markup
 * between them, is worse than leaving it English: it fixes English word order into every
 * language. "The type should be *prominent* — a famous figure" becomes "El tipo debe ser
 * *prominente*: una figura famosa", and a translator who is handed the three fragments
 * separately cannot move the emphasis at all.
 *
 * So the whole sentence stays one key, with named holes, and the holes are filled with JSX
 * here. The translator sees the sentence and can put {work} wherever their language wants it.
 *
 * Call t() WITHOUT vars so the holes survive to this function:
 *
 *   {rich(t('red.intro'), {
 *     progym: <span className="italic">Progymnasmata</span>,
 *     modes:  <span className="font-medium">{t('red.fourModes')}</span>,
 *   })}
 *
 * An unfilled hole renders as itself, visibly — a missing part should look wrong in review
 * rather than silently vanish from the sentence.
 */
export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{[A-Za-z][A-Za-z0-9]*\})/).map((seg, i) => {
    const m = /^\{([A-Za-z][A-Za-z0-9]*)\}$/.exec(seg)
    if (m && m[1] in parts) return <Fragment key={i}>{parts[m[1]]}</Fragment>
    return <Fragment key={i}>{seg}</Fragment>
  })
}
