/**
 * The morphology chapters' translation format.
 *
 * WHY THIS EXISTS. Every other translated surface stores its English in a data file, so the
 * translatable unit is already a string. The morphology chapters don't: their teaching prose is
 * JSX, woven through inline markup —
 *
 *     Say "λ, μ, ν, ρ" out loud — <em>l, m, n, r</em>. They flow; ancient grammarians called them
 *     <strong> liquid</strong> consonants. Now try <Gk>μεν + σω</Gk> — "men-so."
 *
 * — and that whole sentence is one unit to translate. Moving it into a data file would take the
 * English out of the source, which this design has refused everywhere else.
 *
 * So instead the JSX is FLATTENED to a compact template that a translator can write:
 *
 *     Say "λ, μ, ν, ρ" out loud — _l, m, n, r_. They flow; … called them *liquid* consonants.
 *     Now try {μεν + σω} — "men-so."
 *
 *     _x_   emphasis            *x*   strong
 *     {x}   Greek — NEVER translated, and checked to survive the translation intact
 *     [k:x] glossary term, k = GLOSSARY key
 *
 *     ¶     end of a paragraph (inside a multi-paragraph block)
 *
 * ONE SERIALIZER, TWO CALLERS. `serialize` runs at build time (over the chapter's React tree,
 * imported directly by scripts/i18n-content.ts) and again in the browser (over the same tree's
 * children). Both must agree exactly or every fingerprint would mismatch and every block would
 * silently fall back to English — so they are deliberately the same function, not two that match.
 *
 * Anything this format cannot express makes `serialize` return null, which takes the block out of
 * the catalogue: it stays English rather than being half-represented.
 */
import type { ReactNode, ReactElement } from 'react'

/** Components a template can name. Passed in, so this module stays free of component imports. */
export interface MarkupComponents {
  Gk: (p: { children: ReactNode }) => ReactElement | null
  Term: (p: { t: string; children?: ReactNode }) => ReactElement | null
}

/** Collapse JSX's incidental whitespace (newlines + indentation) the way a browser would. */
const squash = (s: string) => s.replace(/\s+/g, ' ')

/**
 * Components declare their ROLE, and `serialize` reads that — never `Function.name`.
 *
 * Names do not survive a production build: `function Gk(…)` ships as `function W(e)`, so a
 * name-based check quietly stops recognising Greek, `serialize` returns null, and every paragraph
 * containing Greek falls back to English — while headings, having no component children, keep
 * translating. That mixture is exactly what it looks like, and it cannot happen in dev, which
 * does not minify. A role is a string literal the minifier leaves alone.
 *
 * A role rather than a fixed identity because more than one component plays each part: the
 * chapters mark Greek with `Gk`, the Getting Started notes with their own local `G`. Both are
 * Greek; neither should have to know about the other.
 */
export type I18nRole = 'greek' | 'term'
export interface Roled { i18nRole?: I18nRole }
const roleOf = (type: unknown): I18nRole | undefined =>
  typeof type === 'function' ? (type as Roled).i18nRole : undefined

/**
 * Flatten React children to a template string, or null if they contain anything the format
 * cannot round-trip. Null is not a failure to report — it is the honest answer that this block
 * is not translatable in place, and the renderer keeps its English.
 */
export function serialize(node: ReactNode): string | null {
  if (node === null || node === undefined || node === false || node === true) return ''
  if (typeof node === 'string') return squash(node)
  if (typeof node === 'number') return String(node)

  if (Array.isArray(node)) {
    const parts: string[] = []
    for (const child of node) {
      const s = serialize(child)
      if (s === null) return null
      parts.push(s)
    }
    return parts.join('')
  }

  const el = node as ReactElement<{ children?: ReactNode; t?: string }>
  if (!el || typeof el !== 'object' || !('type' in el)) return null

  const inner = serialize(el.props?.children)
  if (inner === null) return null

  // Fragments carry their children straight through.
  if ((el.type as unknown) === Symbol.for('react.fragment')) return inner

  // JSX indentation routinely lands inside a tag — `<Gk> μεν + σω</Gk>` — and that padding must
  // not end up inside the marker: it would make {…} compare padding rather than Greek, and oblige
  // the translator to reproduce whitespace they cannot see. Push it outside; it renders the same.
  const [, pre, core, post] = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner) as RegExpExecArray
  const wrap = (open: string, close: string) => core ? `${pre}${open}${core}${close}${post}` : inner

  const role = roleOf(el.type)
  if (role === 'greek') return wrap('{', '}')
  if (role === 'term') return el.props?.t ? wrap(`[${el.props.t}:`, ']') : null

  // Intrinsics: these are plain strings in the element tree and minifiers never touch them.
  switch (typeof el.type === 'string' ? el.type : '') {
    case 'em': return wrap('_', '_')
    case 'strong': return wrap('*', '*')
    // A paragraph inside a translated block (the multi-paragraph InfoBoxes). Marked rather
    // than dropped: without it the whole box was "not representable" and stayed English —
    // which stranded exactly the plain-language explanations a translation is most needed for.
    case 'p': return core ? `${pre}${core}¶${post}` : inner
    // The chapters write Greek two ways: <Gk> and a bare <span className="normal-case">, which is
    // exactly what <Gk> renders. Both are Greek and both must survive translation untouched.
    case 'span': {
      const cls = (el.props as { className?: string })?.className ?? ''
      return cls.includes('normal-case') ? wrap('{', '}') : null
    }
    default: return null
  }
}

/** The Greek runs in a template, in order — these must survive translation untouched. */
export function greekRuns(template: string): string[] {
  // exec in a loop, not matchAll: its iterator needs downlevelIteration under this tsconfig.
  const out: string[] = []
  const re = /\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(template)) !== null) out.push(m[1])
  return out
}

const TOKEN = /(_[^_]+_|\*[^*]+\*|\{[^{}]*\}|\[[^\]:]+:[^\]]*\])/g

/**
 * Rebuild React nodes from a template. The inverse of `serialize`, and the only thing that ever
 * renders a translated chapter block.
 *
 * Keys are positional here, which is safe in a way it would not be elsewhere: this array is
 * rebuilt from scratch on every render of one immutable string, so there is no reordering for an
 * index key to get wrong.
 */
export function parse(template: string, c: MarkupComponents): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  // A FRESH matcher per call, not the shared TOKEN: a glossary term's display text is parsed
  // recursively (below), and a recursive call sharing one regex would move the outer loop's
  // lastIndex and swallow the rest of the paragraph.
  const re = new RegExp(TOKEN.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(template)) !== null) {
    const at = m.index
    if (at > last) out.push(template.slice(last, at))
    const tok = m[0]
    const body = tok.slice(1, -1)
    // Emphasis nests the other way too — <strong>middle or <Term>reflexive</Term></strong>
    // serialises as *middle or [reflexive:reflexive]* — so these recurse as well.
    if (tok.startsWith('_')) out.push(<em key={i++}>{parse(body, c)}</em>)
    else if (tok.startsWith('*')) out.push(<strong key={i++}>{parse(body, c)}</strong>)
    else if (tok.startsWith('{')) out.push(<c.Gk key={i++}>{body}</c.Gk>)
    else {
      // Terms routinely wrap emphasised text — the chapters write <Term t="perfect"><strong>
      // perfect</strong></Term>, which serialises as [perfect:*perfect*]. Parse the display text
      // too, or the reader sees the literal asterisks the English never shows.
      const split = body.indexOf(':')
      const shown = body.slice(split + 1)
      out.push(<c.Term key={i++} t={body.slice(0, split)}>{parse(shown, c)}</c.Term>)
    }
    last = at + tok.length
  }
  if (last < template.length) out.push(template.slice(last))
  return out
}
