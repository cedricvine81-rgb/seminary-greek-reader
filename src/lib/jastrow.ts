// Click-to-look-up for Talmudic Aramaic, against Jastrow's dictionary (public domain, 1903;
// built by scripts/build-jastrow.py into public/data/jastrow.json.gz).
//
// This is a DICTIONARY lookup, not a parse. The Bavli text we ship carries no morphology and no
// licensable tagger for Talmudic Aramaic exists, so the honest thing to offer is what Jastrow
// himself wrote about a form — and, where a form could be several words, every candidate rather
// than one invented answer. Everything below is about finding candidates and being clear which
// ones required guessing.

export interface JastrowEntry {
  /** Jastrow's senses, de-marked-up. */
  s: string[]
  /** His part-of-speech note ("m.", "f.", "v."), where he gives one. */
  m?: string
}

export interface JastrowData {
  attribution: string
  entries: Record<string, JastrowEntry>
  /** normalized form → the headwords it can belong to. */
  forms: Record<string, string[]>
}

export interface JastrowMatch {
  headword: string
  entry: JastrowEntry
  /** What had to be removed to find it — '' for a direct hit, else e.g. 'ד', 'וב'. */
  strippedPrefix: string
  /** A suffix removed to reach the stem ('יה', 'ו'), where that was needed. */
  strippedSuffix: string
  /** True when the match required stripping, so the UI can mark it as a possibility. */
  inferred: boolean
}

// ─── Loading ──────────────────────────────────────────────────────────────────

let _cache: JastrowData | null = null
let _loading: Promise<JastrowData | null> | null = null

/** Fetch once, on the first Talmud word a reader clicks. */
export function loadJastrow(): Promise<JastrowData | null> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) return _loading
  // 10 MB of JSON, ~3.4 MB over the wire once the CDN gzips it — fetched once per session,
  // and only when a reader actually clicks a Talmud word.
  _loading = fetch('/data/jastrow.json')
    .then(r => (r.ok ? r.json() : null))
    .then((d: JastrowData | null) => { _cache = d; return d })
    .catch(() => null)
  return _loading
}

// ─── Matching ─────────────────────────────────────────────────────────────────

const NIKUD = /[֑-ׇ]/g
const NON_LETTER = /[^א-ת]/g
const FINALS: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }

/** Bare consonants, finals folded — the shape the index is keyed by. */
export function normalizeAramaic(s: string): string {
  return (s ?? '')
    .replace(NIKUD, '')
    .replace(NON_LETTER, '')
    .replace(/[ךםןףץ]/g, c => FINALS[c] ?? c)
}

// The particles Aramaic fuses onto the front of a word. ד (that/of) and ו (and) stack freely,
// which is why stripping is applied up to twice rather than once. ק is the Babylonian qa-
// participial (קאמר, קתני) — not a Hebrew prefix, but ubiquitous in the Bavli's own voice.
const PREFIXES = ['ד', 'ו', 'ב', 'כ', 'ל', 'מ', 'ה', 'ש', 'ק']

// Pronominal and determinative endings. Riskier than prefixes — dropping the ו of אותו leaves
// אות, a real and different word — so a suffix match is only tried when everything else has
// failed, and is flagged like any other inferred one. Longest first, so 'ייהו' wins over 'ו'.
// NB these are matched against the FOLDED form, where final letters are already normalised —
// so a masculine plural ends 'ימ', not 'ים'. Writing them unfolded silently matches nothing,
// which is how a first attempt at the plural endings appeared to add no coverage at all.
const SUFFIXES = [
  // pronominal and determinative
  'ייהו', 'יהו', 'הו', 'כונ', 'כמ', 'יהמ', 'יהנ', 'הא', 'יה', 'נו', 'א', 'ה', 'ו', 'ך', 'י', 'נ', 'מ',
  // plural and construct-plural, Hebrew and Aramaic
  'ימ', 'ינ', 'ות', 'יות', 'ותא', 'ותמ', 'ותיו', 'ייא', 'תא', 'אי',
]

/**
 * Jastrow entries a written form could belong to.
 *
 * Tries the whole form first — a direct hit is Jastrow's own indexing and needs no guessing.
 * Only then does it peel prefixes, one or two deep, marking anything it finds that way as
 * inferred: without morphology we cannot know that the ד of דאמר is the relative particle
 * rather than the first radical, so the reader is told which answers required a guess.
 */
export function lookupAramaic(data: JastrowData | null, surface: string): JastrowMatch[] {
  if (!data) return []
  const base = normalizeAramaic(surface)
  if (!base) return []

  const seen = new Set<string>()
  const out: JastrowMatch[] = []

  const collect = (form: string, stripped: string, suffix = '') => {
    for (const hw of data.forms[form] ?? []) {
      if (seen.has(hw)) continue
      const entry = data.entries[hw]
      if (!entry) continue
      seen.add(hw)
      out.push({ headword: hw, entry, strippedPrefix: stripped, strippedSuffix: suffix, inferred: stripped.length > 0 || suffix.length > 0 })
    }
  }

  collect(base, '')
  // A word that Jastrow lists outright needs no speculation about its prefixes.
  if (out.length > 0) return out

  for (const p1 of PREFIXES) {
    if (!base.startsWith(p1) || base.length < 3) continue
    const one = base.slice(1)
    collect(one, p1)
    for (const p2 of PREFIXES) {
      if (!one.startsWith(p2) || one.length < 3) continue
      collect(one.slice(1), p1 + p2)
    }
  }
  if (out.length > 0) return out

  // Last resort: an ending as well. This is the most speculative tier — about a third of the
  // words Jastrow does not list outright are reachable this way, but a wrongly-split stem is a
  // real word too, so these are candidates and are labelled as such.
  for (const suf of SUFFIXES) {
    if (!base.endsWith(suf) || base.length - suf.length < 2) continue
    const stem = base.slice(0, -suf.length)
    collect(stem, '', suf)
    for (const p1 of PREFIXES) {
      if (!stem.startsWith(p1) || stem.length < 3) continue
      collect(stem.slice(1), p1, suf)
    }
    if (out.length > 0) break
  }
  return out
}

/** How a candidate was reached, for the pane: "ד + stem", "stem + יה". Null for a direct hit. */
export function strippedLabel(m: JastrowMatch): string | null {
  if (!m.inferred) return null
  const parts = [m.strippedPrefix && `${m.strippedPrefix} +`, m.headword, m.strippedSuffix && `+ ${m.strippedSuffix}`]
  return parts.filter(Boolean).join(' ')
}
