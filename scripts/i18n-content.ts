/**
 * Generates the translated-content catalogues from plain key→text JSON, and reports what is
 * missing or stale.
 *
 * The translator edits JSON — src/lib/i18n/es/themes.json — which holds nothing but keys and
 * Spanish. Fingerprints of the English are computed HERE, from the live source, and written into
 * the generated catalogue. That is deliberate: a fingerprint typed or pasted by hand is a
 * fingerprint that can be wrong, and a wrong fingerprint is the one failure this design must not
 * have — it would let a stale translation pass as current.
 *
 * Usage:
 *   npx tsx scripts/i18n-content.ts --list themes            # keys + English, to translate from
 *   npx tsx scripts/i18n-content.ts --build                  # regenerate src/lib/i18n/content-es.ts
 *   npx tsx scripts/i18n-content.ts --audit                  # coverage, and what went stale
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import * as React from 'react'

// The chapter modules are require()d further down (morphologyItems), and that require path
// transforms their JSX with the CLASSIC runtime — which expects `React` to be a global and threw
// "React is not defined" on the first chapter it loaded, taking --list and --build down with it.
// The tsconfig asks for the automatic runtime, but it does not reach these runtime requires.
// Putting React on the global satisfies the classic runtime without changing how anything is
// compiled for the app itself.
;(globalThis as unknown as { React: typeof React }).React = React
import { THEME_PAGES, THEME_GROUPS, TRADITIONS } from '../src/lib/themes'
import { PAGE_GUIDES } from '../src/lib/page-guides'
import { BACKGROUND, BACKGROUND_LEDE } from '../src/lib/register-background'
import { workDate } from '../src/lib/work-dates'
import { DEVICES, GROUP_LABEL, GROUP_DESC } from '../src/lib/rhetoric-devices'
import { getTextSummary } from '../src/lib/texts-summaries'
import { TEXT_CATEGORIES } from '../src/lib/texts-catalog'
import { CONSTRUCT_PRESETS } from '../src/lib/construct-presets'
import { HEBREW_CONSTRUCT_PRESETS } from '../src/lib/construct-presets-hebrew'
import { fingerprint } from '../src/lib/i18n/content'
import { serialize, greekRuns } from '../src/lib/i18n/morph-markup'
import { fieldsOf, FIELD_COMPONENTS } from '../src/lib/i18n/morph-fields'

const LOCALES = ['es'] as const
type Loc = typeof LOCALES[number]

export interface Item {
  key: string
  english: string
  /** For a SPLIT source, which output file this string belongs in. See `build()`. */
  bucket?: string
}

/**
 * Every translatable string of the Themes pages, with the key it is stored under.
 *
 * Keys are built from STABLE identities — the page id, and for an entry its work/chapter/verse —
 * never from an array index. Entries get reordered constantly (they sort by date, and the
 * curation adds to the middle of a list), and an index-keyed catalogue would silently reattach
 * every translation to the wrong passage the first time one was inserted.
 */
export function themeItems(): Item[] {
  const items: Item[] = []
  // The sidebar sections, keyed by a slug of the English rather than by position — the groups
  // get reordered, and their names are the identity that survives that.
  for (const g of THEME_GROUPS) {
    items.push({ key: `themes.group.${g.toLowerCase().replace(/\s+/g, '-')}`, english: g })
  }
  // The tradition bands. Their notes are the page's method teaching — "later than the New
  // Testament; evidence for how Judaism settled" — and are the last thing that should stay in a
  // language the reader cannot read.
  for (const tr of TRADITIONS) {
    items.push({ key: `themes.tradition.${tr.id}.label`, english: tr.label })
    items.push({ key: `themes.tradition.${tr.id}.dates`, english: tr.dates })
    items.push({ key: `themes.tradition.${tr.id}.note`, english: tr.note })
  }
  // The date chips beside each citation. Keyed by the English label itself, and DISTINCT ones
  // only — 47 labels cover 131 works. Keying by label rather than by work means a new work
  // sharing an existing date needs no new translation, and an unfamiliar date shape falls back
  // to English rather than being mangled by a transform.
  const dates = new Set<string>()
  for (const p of THEME_PAGES) for (const e of p.entries) {
    const d = workDate(e.work); if (d) dates.add(d.label)
  }
  for (const label of Array.from(dates).sort()) {
    items.push({ key: `themes.date.${label}`, english: label })
  }
  for (const p of THEME_PAGES) {
    items.push({ key: `themes.${p.id}.label`, english: p.label })
    items.push({ key: `themes.${p.id}.blurb`, english: p.blurb })
    items.push({ key: `themes.${p.id}.anchors`, english: p.canonicalAnchors })
    p.absences.forEach((a, i) => items.push({ key: `themes.${p.id}.absence.${i}`, english: a }))
    for (const e of p.entries) {
      items.push({
        key: `themes.${p.id}.sum.${e.work}.${e.chapter}.${e.verse}`,
        english: e.summary,
      })
    }
  }
  return items
}

/**
 * The Rhetoric tab's catalogue of figures: the six group labels and glosses, and for each device
 * its name, its definition, and the one-line note on every occurrence.
 *
 * Not translated: the `greek` field (ὁμοίωσις and the rest are the technical names and stay
 * Greek in any language) and `ref`, which is a machine-parsed verse address — translating
 * "Matt 10:16" would break the lookup that turns it into a passage.
 */
/**
 * The two vocabulary decks' GLOSSES — the English meaning shown on every flashcard, quiz option
 * and browse row (src/data/bgvb-vocabulary.json, src/data/hebrew-vocabulary.json).
 *
 * Keyed by the LEMMA, not by position: the decks are rebuilt from frequency data by
 * scripts/build-hebrew-vocabulary.py and friends, so a word's index moves but its lemma does not.
 * Two words occasionally share a gloss ("and"); the key is per-word, so each is translated in its
 * own right and can diverge where Spanish needs it to.
 */
export function vocabItems(): Item[] {
  const items: Item[] = []
  for (const [deck, file] of [['greek', 'src/data/bgvb-vocabulary.json'],
                              ['hebrew', 'src/data/hebrew-vocabulary.json']] as const) {
    const words = JSON.parse(fs.readFileSync(file, 'utf8')) as { word: string; gloss: string }[]
    // The Hebrew deck is the file PLUS the words the corpus frequency pass structurally
    // cannot see — the inseparable prefixes and adonai, merged in by vocab-decks.ts (see
    // scripts/build-glanz-bands.py). Reading only the file left those seven with no
    // Spanish while this audit reported 100%, because it never knew they existed.
    if (deck === 'hebrew') {
      const bands = JSON.parse(fs.readFileSync('src/data/hebrew-glanz-bands.json', 'utf8')) as
        { supplement?: { word: string; gloss: string }[] }
      for (const w of bands.supplement ?? []) words.push({ word: w.word, gloss: w.gloss })
    }
    // HOMOGRAPHS. 19 Hebrew lemmas appear twice with unrelated senses — אֵת is both the
    // direct-object marker and "with"; עָנָה is both "answer" and "afflict". Keyed by lemma
    // alone they collide, and only one sense of each pair could ever be translated: the other
    // would fall back to English while the catalogue looked complete. So a lemma that occurs
    // more than once takes the fingerprint of its English as a suffix — derived from the deck,
    // stable across rebuilds, and not positional.
    const seen = new Map<string, number>()
    for (const w of words) seen.set(w.word.normalize('NFC'), (seen.get(w.word.normalize('NFC')) ?? 0) + 1)
    for (const w of words) {
      if (!w.gloss?.trim()) continue
      // NFC-normalise the lemma. The decks store some words with OXIA (U+1F77) where NFC uses
      // TONOS (U+03AF) — canonically equivalent, different code points — so a key typed by hand
      // would silently fail to match and the gloss would stay English with nothing reported.
      const lemma = w.word.normalize('NFC')
      const key = (seen.get(lemma) ?? 0) > 1
        ? `vocab.gloss.${deck}.${lemma}~${fingerprint(w.gloss)}`
        : `vocab.gloss.${deck}.${lemma}`
      items.push({ key, english: w.gloss, bucket: deck })
    }
    // The deck's own English, emitted for the client.
    //
    // The reader's parsing pane needs it to VERIFY a translation rather than merely display one:
    // content() compares fingerprint(english) against the catalogue's fp, and without the English
    // there is nothing to compare, so a gloss whose English had since been edited would show its
    // stale Spanish. The pane cannot reuse VOCAB_GLOSSES for this — that is a different, fuller
    // gloss set (αὐτός is "he, she, it, himself…" there and "he, she, it; same" here), so its
    // fingerprints would never match.
    fs.mkdirSync('public/data/vocab', { recursive: true })
    fs.writeFileSync(`public/data/vocab/${deck}.en.json`,
      JSON.stringify(Object.fromEntries(
        words.filter(w => w.gloss?.trim()).map(w => [w.word.normalize('NFC'), w.gloss]),
      )))
  }
  return items
}

export function rhetoricItems(): Item[] {
  const items: Item[] = []
  for (const [g, label] of Object.entries(GROUP_LABEL)) {
    items.push({ key: `rhetoric.group.${g}.label`, english: label })
  }
  for (const [g, desc] of Object.entries(GROUP_DESC)) {
    items.push({ key: `rhetoric.group.${g}.desc`, english: desc })
  }
  // The per-book Bullinger datasets (public/data/rhetoric/devices/*.json) add 67 further figures
  // that the curated list does not carry. They share the key space, because RhetoricView merges
  // them into one catalogue and cannot tell which layer a device came from.
  //
  // Their 2,081 OCCURRENCE NOTES are a source of their own — `rhetoricNoteItems` below — because
  // they are ~47,000 words and must not be loaded with this catalogue. See its comment.
  const seen = new Set(DEVICES.map(d => d.id))
  const dir = 'public/data/rhetoric/devices'
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    const parsed = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')) as
      { devices?: { id: string; name?: string; definition?: string }[] }
    for (const d of parsed.devices ?? []) {
      if (seen.has(d.id)) continue
      seen.add(d.id)
      if (d.name) items.push({ key: `rhetoric.${d.id}.name`, english: d.name })
      if (d.definition) items.push({ key: `rhetoric.${d.id}.definition`, english: d.definition })
    }
  }
  for (const d of DEVICES) {
    items.push({ key: `rhetoric.${d.id}.name`, english: d.name })
    items.push({ key: `rhetoric.${d.id}.definition`, english: d.definition })
    for (const o of d.occurrences) {
      // Keyed by the verse reference, which is the occurrence's stable identity — the list is
      // curated and reordered, so an index would reattach notes to the wrong verses.
      if (o.note) items.push({ key: `rhetoric.${d.id}.occ.${o.ref}`, english: o.note })
    }
  }
  return items
}

/**
 * The morphology textbook: teaching prose from the 21 chapter components.
 *
 * UNLIKE EVERY OTHER SOURCE HERE, this one does not read a data file — the chapters have no data
 * file. It imports each chapter's exported React tree and walks it, which works because those
 * exports are plain element trees (`export const LIQUIDS_CONTENT = (<>…</>)`), not components:
 * building the tree runs no hooks and touches no browser.
 *
 * The point of importing rather than parsing the .tsx is that the SAME `serialize` the browser
 * uses produces the English here. A separate build-time parser would be a second implementation
 * of the format, and the first time the two disagreed every fingerprint would mismatch and the
 * whole surface would fall silently back to English — a failure that looks exactly like "not
 * translated yet." One function, no drift.
 *
 * Only nodes carrying an `id` are collected; prose without one is deliberately left English.
 */
/**
 * Where a chapter file's strings must live: the TAB ID MorphologyView fetches by, which is not
 * always the file name. Get this wrong and the fetch 404s, the catalogue comes back empty, and the
 * chapter silently renders English — indistinguishable from "not translated yet".
 */
const CHAPTER_TAB: Record<string, string> = {
  'second-aorists': '2nd-aorists',
  conditionals: 'conjunctions',
  // A level's own page shares its chapter's catalogue: the view fetches by TAB id, and the
  // tab is 'nouns' whichever file renders it.
  'nouns-intermediate': 'nouns',
  'pronunciation-intermediate': 'pronunciation',
  'parsing-intermediate': 'parsing',
  'prepositions-intermediate': 'prepositions',
  'pronouns-intermediate': 'pronouns',
  'demonstratives-intermediate': 'demonstratives',
  'relatives-intermediate': 'relatives',
  'conditionals-intermediate': 'conjunctions',
  'conj-adv-intermediate': 'conj-adv',
  'indicatives-intermediate': 'indicatives',
  'contract-verbs-intermediate': 'contract-verbs',
  'liquids-intermediate': 'liquids',
  'principal-parts-intermediate': 'principal-parts',
  'infinitives-intermediate': 'infinitives',
  'imperatives-intermediate': 'imperatives',
  'participles-intermediate': 'participles',
  'subjunctives-intermediate': 'subjunctives',
  'mi-verbs-intermediate': 'mi-verbs',
  'second-aorists-intermediate': '2nd-aorists',
  'deponents-intermediate': 'deponents',
}

/**
 * The HEBREW grammar's chapters. Same walk as the Greek one, but bucketed under "hb-<chapter>"
 * so a Hebrew chapter that shares a name with a Greek one (nouns, pronouns, prepositions,
 * participles) writes its own catalogue instead of overwriting it. HebrewGrammarView fetches
 * by exactly that name.
 */
export function hebrewMorphologyItems(): Item[] {
  const items: Item[] = []
  const dir = 'src/components/morphology/hebrew'
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    if (!f.endsWith('.tsx') || f === 'HebrewGrammarView.tsx') continue
    const chapter = f.replace(/\.tsx$/, '')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(`../${dir}/${chapter}`) as Record<string, unknown>
    for (const exported of Object.values(mod)) collect(exported, items, `hb-${chapter}`)
  }
  // HbExamples / HbVocab / HbDrills / HbReview take an `id` naming a chapter of GENERATED DATA,
  // not a translation key, and they have no children — the collector sees them as empty blocks.
  // Translation ids are always "<chapter>.<slot>", so the dot tells the two apart.
  return items.filter(i => i.key.includes('.'))
}

export function morphologyItems(): Item[] {
  const items: Item[] = []
  const dir = 'src/components/morphology/chapters'
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    if (!f.endsWith('.tsx')) continue
    const chapter = f.replace(/\.tsx$/, '')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(`../${dir}/${chapter}`) as Record<string, unknown>
    for (const exported of Object.values(mod)) collect(exported, items, CHAPTER_TAB[chapter] ?? chapter)
  }

  // The "Getting started" note at the top of every chapter lives in a different file, keyed by
  // tab. That key IS the chapter name, so each note is bucketed into its own chapter's catalogue
  // and arrives on the one fetch the chapter already makes.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const exp = require('../src/components/vocab/morphology-explanations') as {
    TAB_EXPLANATIONS: Record<string, { beginning?: unknown; intermediate?: unknown }>
    ESS_EXPLANATIONS: Record<string, { beginning?: unknown; intermediate?: unknown }>
  }
  for (const [tab, e] of Object.entries(exp.TAB_EXPLANATIONS ?? {})) {
    collect(e?.beginning, items, tab)
    collect(e?.intermediate, items, tab)
  }
  // The Minimums sub-sections are keyed 1–8 but all render under the one 'essentials' tab.
  for (const e of Object.values(exp.ESS_EXPLANATIONS ?? {})) {
    collect(e?.beginning, items, 'essentials')
    collect(e?.intermediate, items, 'essentials')
  }

  // Every bucket must be a real tab, because the bucket IS the filename the view fetches. Without
  // this, a chapter whose file name differs from its tab (see CHAPTER_TAB) writes a catalogue
  // nobody ever requests and stays English with nothing reported.
  //
  // The tab list is read from MorphologyView's own REVISION_CONTENT, which is the thing that does
  // the fetching. TAB_EXPLANATIONS was the first guess and is subtly wrong: not every tab has a
  // "Getting started" note (parsing has none), so it would reject a perfectly good bucket.
  const view = fs.readFileSync('src/components/vocab/MorphologyView.tsx', 'utf8')
  const block = /const REVISION_CONTENT[^{]*\{([\s\S]*?)\n\}/.exec(view)?.[1] ?? ''
  const tabs = new Set<string>()
  const tabRe = /^\s*'?([a-z0-9-]+)'?:/gm
  let tm: RegExpExecArray | null
  while ((tm = tabRe.exec(block)) !== null) tabs.add(tm[1])
  if (tabs.size < 10) throw new Error('could not read the tab list from MorphologyView')
  const stray = Array.from(new Set(items.map(i => i.bucket!).filter(b => !tabs.has(b))))
  if (stray.length) {
    console.error(`morphology: ${stray.length} bucket(s) are not tab ids — their catalogues would`
      + ` never be fetched: ${stray.join(', ')}`)
    console.error('  add the file → tab mapping to CHAPTER_TAB in this script.')
    process.exit(1)
  }
  return items
}

/**
 * Walk a React tree, collecting every `id`-bearing node.
 *
 * An `id` means one of two things, decided by what the component is:
 *   · on prose (P, SectionHeading, Tr) — serialize my CHILDREN to a markup template;
 *   · on a table, drill or sentence set — enumerate my string PROPS, per morph-fields.ts.
 * Either way the keys come from the same module the components read, so neither side can drift.
 */
function collect(node: unknown, items: Item[], chapter: string) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) { for (const n of node) collect(n, items, chapter); return }
  const el = node as { type?: unknown; props?: Record<string, unknown> }
  const props = el.props
  if (!props) {
    // A plain data object, not an element — a Practice item {q, a}, a LiveExamples link
    // {label, lemma}. Its values routinely hold JSX, so they have to be walked too.
    for (const v of Object.values(node as Record<string, unknown>)) collect(v, items, chapter)
    return
  }

  const id = props.id
  if (typeof id === 'string') {
    const name = typeof el.type === 'function' ? ((el.type as { name?: string }).name ?? '') : ''
    if (FIELD_COMPONENTS.has(name)) {
      for (const f of fieldsOf(name, props)) items.push({ ...f, bucket: chapter })
      // Do NOT stop here: these components also carry JSX in their props — a drill's `intro`, a
      // Practice item's answer — and those are <Tr>-marked prose the field list knows nothing of.
      for (const v of Object.values(props)) if (v && typeof v === 'object') collect(v, items, chapter)
      return
    }
    // A titled block (InfoBox) renders its heading through the same catalogue but keeps its body
    // in `children`, so it is NOT a field component — collecting it as one would skip the
    // serialize below and drop the body. Take the title here and let the body fall through.
    if (typeof props.title === 'string' && props.title.trim()) {
      items.push({ key: `${id}.title`, english: props.title, bucket: chapter })
    }
    const english = serialize(props.children as never)
    if (english === null) {
      console.error(`  ${chapter}: ${id} — markup not representable; left English`)
    } else if (!english.trim()) {
      // A dot-less id belongs to a DATA component (HbExamples id="nouns"), not a translation
      // slot — it is meant to have no children, so this is not a fault to report.
      if (id.includes('.')) console.error(`  ${chapter}: ${id} — empty`)
    } else {
      items.push({ key: id, english, bucket: chapter })
    }
    return   // nested ids inside a translated block would never be reached at runtime
  }
  // Asides and drills pass JSX through props, not children — walk those too.
  for (const v of Object.values(props)) if (v && typeof v === 'object') collect(v, items, chapter)
}

/**
 * Bullinger's own note on each figure-occurrence, from the per-book datasets — 2,081 of them,
 * some 47,000 words. They are the tooltip text under a figure like Metonymy or Epistrophe:
 * "Here the Greek word house is rendered household: i.e., family."
 *
 * WHY THIS IS A SOURCE OF ITS OWN, AND SPLIT PER BOOK. Every other catalogue is handed to the
 * page as a prop, which means it is serialized into that page's payload. Doing that here would
 * put 47,000 words of Spanish into every load of /exegesis — six times the rest of the Rhetoric
 * catalogue put together — to show the handful of notes on one open chapter. The data it
 * translates is already per book, and RhetoricView already fetches one book at a time, so the
 * translation is fetched the same way: `public/data/rhetoric/notes-<loc>/<Osis>.json`, alongside
 * the English it belongs to, and only for the book being read. Matthew is 331 notes; the other
 * 26 books cost nothing until opened.
 *
 * The 58 refs that the CURATED list also carries are skipped. Both layers key by device+verse,
 * but `mergeDevices` keeps the curated note when they collide, so the curated note is the one on
 * screen and the Bullinger wording for those verses is never rendered. Emitting it would attach
 * a second translation to a key that already has one, and the fingerprint would decide which
 * survived — a coin toss between two different English sentences.
 */
export function rhetoricNoteItems(): Item[] {
  const curated = new Set<string>()
  for (const d of DEVICES) for (const o of d.occurrences) {
    if (o.note) curated.add(`rhetoric.${d.id}.occ.${o.ref}`)
  }
  const items: Item[] = []
  const seen = new Set<string>()
  const dir = 'public/data/rhetoric/devices'
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []) {
    if (!f.endsWith('.json')) continue
    const osis = f.replace(/\.json$/, '')
    const parsed = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')) as
      { devices?: { id: string; occurrences?: { ref: string; note?: string }[] }[] }
    for (const d of parsed.devices ?? []) {
      for (const o of d.occurrences ?? []) {
        if (!o.note) continue
        const key = `rhetoric.${d.id}.occ.${o.ref}`
        if (curated.has(key) || seen.has(key)) continue
        seen.add(key)
        items.push({ key, english: o.note, bucket: osis })
      }
    }
  }
  return items
}

/**
 * The "Summary" popover beside an open work's title: five fixed sections (Authorship, Historical
 * Context, Contents, Theological Significance, Relationship to New Testament) for 692 of the 848
 * catalog works.
 *
 * SHARING IS THE WHOLE PROBLEM HERE. Herodotus' nine catalog entries share one summary, as do
 * Quintilian's twelve and Eusebius' ten, and many works reuse a vetted Backgrounds summary. Of
 * 3,460 rendered sections only 1,762 are distinct. Keying by work id alone would ask for the same
 * paragraph to be translated nine times and let the nine copies drift apart.
 *
 * So there are two key spaces. The translator writes against a CANONICAL key — the first work id,
 * in sorted order, that resolves to that body — and the build fans each translation out to every
 * work id sharing it, each with its own fingerprint. The renderer only ever looks up its own
 * work's key and needs to know nothing about any of this.
 */
function summaryBodies(): { canonical: string; heading: string; body: string; workIds: string[] }[] {
  const byBody = new Map<string, { heading: string; workIds: string[] }>()
  for (const c of TEXT_CATEGORIES as any[]) {
    for (const w of c.works) {
      const sum = getTextSummary(w)
      if (!sum) continue
      for (const sec of sum.sections) {
        const k = `${sec.heading}\u0000${sec.body}`
        const hit = byBody.get(k)
        if (hit) hit.workIds.push(w.id)
        else byBody.set(k, { heading: sec.heading, workIds: [w.id] })
      }
    }
  }
  return Array.from(byBody.entries()).map(([k, v]) => ({
    canonical: v.workIds.slice().sort()[0],
    heading: v.heading,
    body: k.slice(k.indexOf('\u0000') + 1),
    workIds: v.workIds,
  }))
}

const HEADING_SLUG: Record<string, string> = {
  'Authorship': 'authorship',
  'Historical Context': 'context',
  'Contents': 'contents',
  'Theological Significance': 'significance',
  'Relationship to New Testament': 'nt',
}
const slug = (h: string) => HEADING_SLUG[h] ?? h.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** What the TRANSLATOR writes against: one entry per distinct body. */
export function summaryItems(): Item[] {
  const items: Item[] = []
  // The five section headings, which are the same for every work.
  for (const [h, sl] of Object.entries(HEADING_SLUG)) {
    items.push({ key: `summary.heading.${sl}`, english: h })
  }
  for (const b of summaryBodies()) {
    items.push({ key: `summary.${b.canonical}.${slug(b.heading)}`, english: b.body })
  }
  return items
}

/** What the RENDERER looks up: one entry per work id, fanned out from the canonical translation. */
function summaryFanOut(t: Record<string, string>): { key: string; english: string; text: string }[] {
  const out: { key: string; english: string; text: string }[] = []
  for (const b of summaryBodies()) {
    const text = t[`summary.${b.canonical}.${slug(b.heading)}`]
    if (!text) continue
    for (const id of b.workIds) out.push({ key: `summary.${id}.${slug(b.heading)}`, english: b.body, text })
  }
  return out
}


/**
 * The worked examples of Construct search — the group headings, and each preset's label and its
 * explanatory note.
 *
 * Content rather than chrome, which is why these are here and not in messages.ts. "The strongest
 * negation in Greek: 'will certainly not'" is a grammar explanation, and the fingerprint is the
 * point: reword the English and a Spanish reader gets the English back rather than a note that
 * now says something subtly different from the one beside it.
 *
 * Keyed by the preset's own `id`, never its position — these lists grow by insertion into the
 * middle of a group, and an index-keyed catalogue would silently reattach every note to the
 * wrong construction the first time one was added.
 */
export function constructPresetItems(): Item[] {
  const items: Item[] = []
  for (const group of [...CONSTRUCT_PRESETS, ...HEBREW_CONSTRUCT_PRESETS]) {
    items.push({ key: `cpreset.group.${group.id}`, english: group.heading })
    for (const p of group.presets) {
      items.push({ key: `cpreset.${p.id}.label`, english: p.label })
      items.push({ key: `cpreset.${p.id}.note`, english: p.note })
    }
  }
  return items
}


/**
 * A short gloss for every lemma of the Greek New Testament, so the reader's parsing pane can
 * name a word in the reader's language whatever they click.
 *
 * SEPARATE FROM THE VOCAB DECK, which is a course vocabulary list of 1,120 words carrying its
 * own licence and its own teaching glosses. That deck covers about 90% of running text but only
 * a fifth of the vocabulary, so the fifth of clicks that land on a rarer word fell through to
 * English. This source is the rest of the lexicon: the concise gloss the lemma index already
 * carries, which is the same one the app shows elsewhere.
 *
 * Keyed by the lemma exactly as the index stores it, homograph markers included — "δοῦλος (II)"
 * is a distinct entry with a distinct sense, and that string is what reaches the pane.
 *
 * Deck entries are SKIPPED: a lemma the deck already glosses is translated there, in its
 * teaching form, and having two Spanish glosses for one word is how they come to disagree.
 */
export function lexiconGlossItems(): Item[] {
  const lemmas = JSON.parse(
    zlib.gunzipSync(fs.readFileSync('public/data/lemma-index.json.gz')).toString('utf8'),
  ) as { l: string; g?: string; f: number }[]
  const deck = new Set(Object.keys(
    JSON.parse(fs.readFileSync('public/data/vocab/greek.en.json', 'utf8')) as Record<string, string>,
  ))
  // Frequency order, so --list hands back the words a student is likeliest to meet first.
  return lemmas
    .filter(e => (e.g ?? '').trim() && !deck.has(e.l.normalize('NFC')))
    .sort((a, b) => b.f - a.f)
    .map(e => ({ key: `lex.gloss.${e.l.normalize('NFC')}`, english: e.g!.trim(), bucket: 'greek' }))
}

/**
 * The "about this page" panels (src/lib/page-guides.ts).
 *
 * Keyed by guide id and position rather than by a hash of the text, so a reordered section
 * keeps its translation and only an EDITED one goes stale — which is what the fingerprint is
 * for. The Hebrew overlay is extracted too: on the Hebrew track those fields replace their
 * counterparts wholesale, so a Spanish reader on that track would otherwise drop back to
 * English mid-panel.
 */
export function pageGuideItems(): Item[] {
  const items: Item[] = []
  const add = (id: string, part: string, english: string) => {
    if (english?.trim()) items.push({ key: `guide.${id}.${part}`, english })
  }
  for (const g of PAGE_GUIDES) {
    const faces: [string, typeof g | NonNullable<typeof g.hebrew>][] = [['', g]]
    if (g.hebrew) faces.push(['hebrew.', g.hebrew])
    for (const [prefix, face] of faces) {
      if (face.title) add(g.id, `${prefix}title`, face.title)
      if (face.lede) add(g.id, `${prefix}lede`, face.lede)
      face.sections?.forEach((sec, i) => {
        add(g.id, `${prefix}s${i}.h`, sec.heading)
        add(g.id, `${prefix}s${i}.b`, sec.body)
      })
      face.gestures?.forEach((ge, i) => {
        add(g.id, `${prefix}g${i}.does`, ge.does)
        add(g.id, `${prefix}g${i}.gets`, ge.gets)
      })
      face.related?.forEach((r, i) => add(g.id, `${prefix}r${i}`, r.label))
    }
  }
  return items
}

/** The scholarly note behind the Register tool (src/lib/register-background.ts). */
export function registerBackgroundItems(): Item[] {
  const items: Item[] = [{ key: 'regbg.lede', english: BACKGROUND_LEDE }]
  for (const sec of BACKGROUND) {
    items.push({ key: `regbg.${sec.id}.h`, english: sec.heading })
    sec.paragraphs.forEach((p, i) => items.push({ key: `regbg.${sec.id}.p${i}`, english: p }))
    sec.lists?.forEach((l, j) => {
      items.push({ key: `regbg.${sec.id}.l${j}.h`, english: l.heading })
      l.items.forEach((it, k) => items.push({ key: `regbg.${sec.id}.l${j}.i${k}`, english: it }))
    })
  }
  return items
}

/**
 * The pericope headings (public/data/pericopes.json) — the section titles the passage boxes
 * predict with ("The Parable of the Sower"), shown verbatim in every language until now.
 *
 * Keyed by a FINGERPRINT OF THE TITLE ITSELF rather than by book and position, for two
 * reasons: the same heading recurs across the synoptics (2,975 sections share 2,564 distinct
 * titles) and should be translated once; and a retitled section then simply misses the
 * catalogue and falls back to English — the key is its own staleness check.
 */
export function pericopeTitleItems(): Item[] {
  const data = JSON.parse(fs.readFileSync('public/data/pericopes.json', 'utf8')) as
    Record<string, { t: string }[]>
  const seen = new Set<string>()
  const items: Item[] = []
  for (const sections of Object.values(data)) {
    for (const sec of sections) {
      const t = (sec.t ?? '').trim()
      if (!t || seen.has(t)) continue
      seen.add(t)
      items.push({ key: `peri.${fingerprint(t)}`, english: t, bucket: 'titles' })
    }
  }
  return items
}

const SOURCES: Record<string, () => Item[]> = {
  themes: themeItems, rhetoric: rhetoricItems, summaries: summaryItems,
  rhetoricNotes: rhetoricNoteItems, morphology: morphologyItems, hebrewMorphology: hebrewMorphologyItems, vocab: vocabItems,
  constructPresets: constructPresetItems,
  lexiconGlosses: lexiconGlossItems,
  pageGuides: pageGuideItems,
  registerBackground: registerBackgroundItems,
  pericopeTitles: pericopeTitleItems,
}
/**
 * Sources emitted as per-bucket JSON under public/ and fetched by the client, instead of as one
 * TS module imported on the server. For a corpus too big to sit in a page payload but naturally
 * divided — one file per book — this keeps the reader's cost proportional to what they opened.
 */
type SplitPath = (loc: Loc, bucket: string) => string
const SPLIT: Record<string, SplitPath | undefined> = {
  rhetoricNotes: (loc, osis) => `public/data/rhetoric/notes-${loc}/${osis}.json`,
  // The chapters are ~47,000 words complete — the same class of size as the Bullinger notes, and
  // far too much for a page payload. They are also read one chapter at a time, and the grammar
  // panel is mounted in the root layout, where a server-loaded catalogue would ride along with
  // every page in the app. Fetched per chapter instead, by the chapter that needs it.
  morphology: (loc, chapter) => `public/data/morphology/${loc}/${chapter}.json`,
  // The Hebrew grammar, same reasoning and the same directory — its buckets are already
  // prefixed "hb-", so the two never collide on a shared chapter name.
  hebrewMorphology: (loc, chapter) => `public/data/morphology/${loc}/${chapter}.json`,
  // One file per deck. A Greek reader never downloads the Hebrew glosses.
  vocab: (loc, deck) => `public/data/vocab/${loc}/${deck}.json`,
  // ~4,300 short glosses. Too many for a page payload, and only the reader needs them, so it
  // fetches this the same way it fetches the deck.
  lexiconGlosses: (loc, deck) => `public/data/lexicon-gloss/${loc}/${deck}.json`,
  // One file, fetched only by a Spanish reader alongside pericopes.json itself.
  pericopeTitles: loc => `public/data/pericope-titles/${loc}.json`,
}
/** Sources whose generated catalogue is expanded from the translated one. */
const FAN_OUT: Record<string, (t: Record<string, string>) => { key: string; english: string; text: string }[]> = {
  summaries: summaryFanOut,
}

/**
 * Every item, tagged with the source it came from. The tag is not decoration: the Greek and the
 * Hebrew grammars deliberately share chapter ids (nouns.t1, participles.t2 …), so a key alone
 * names two different strings and any report keyed on it silently conflates them.
 */
function allItems(): (Item & { source: string })[] {
  return Object.entries(SOURCES).flatMap(([source, f]) => f().map(i => ({ ...i, source })))
}

function readJson(loc: Loc, name: string): Record<string, string> {
  const f = `src/lib/i18n/${loc}/${name}.json`
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}
}

function translations(loc: Loc): Record<string, string> {
  return Object.assign({}, ...Object.keys(SOURCES).map(n => readJson(loc, n)))
}

// ── --list ────────────────────────────────────────────────────────────────────────────
/**
 * `--list <source> [bucket]` — the untranslated keys with their English, ready to translate from.
 *
 * The optional bucket narrows a SPLIT source to one file's worth (`--list rhetoricNotes Matt`).
 * A 2,000-string source dumped whole is not a work unit anybody can hold; a book is.
 */
function list(name: string, bucket?: string) {
  let items = SOURCES[name]?.() ?? []
  if (bucket) items = items.filter(i => i.bucket === bucket)
  // This source's OWN file, not the merge of all of them. The Hebrew grammar reuses the Greek
  // grammar's chapter ids (nouns.t1, participles.t2 …), so the merged view hid sixty Hebrew keys
  // behind their Greek namesakes and reported them done — while `build`, which reads per source,
  // shipped them as English.
  const have = readJson('es', name)
  const todo = items.filter(i => !have[i.key])
  console.log(JSON.stringify(Object.fromEntries(todo.map(i => [i.key, i.english])), null, 2))
  console.error(`${todo.length} untranslated of ${items.length}`
    + (bucket ? ` in ${bucket}` : ''))
}

/** `--buckets <source>` — how much is left in each bucket, to pick the next one to do. */
function buckets(name: string) {
  const items = SOURCES[name]?.() ?? []
  const have = readJson('es', name)
  const tally = new Map<string, { done: number; total: number; words: number }>()
  for (const i of items) {
    const b = i.bucket ?? '—'
    const t = tally.get(b) ?? { done: 0, total: 0, words: 0 }
    t.total++
    if (have[i.key]) t.done++; else t.words += i.english.trim().split(/\s+/).length
    tally.set(b, t)
  }
  for (const [b, t] of Array.from(tally.entries()).sort((a, b2) => b2[1].total - a[1].total)) {
    console.log(`${b.padEnd(10)} ${String(t.done).padStart(4)}/${String(t.total).padEnd(5)}`
      + (t.done === t.total ? ' done' : ` — ${t.words} English words left`))
  }
}

// ── --build ───────────────────────────────────────────────────────────────────────────
/**
 * Cross-page markers in translations must name a real page. A typo'd [[Atonment]] does not
 * error at runtime — withPageLinks simply leaves the marker unmatched, and the reader is shown
 * literal brackets in the middle of a sentence. Catching it here is the only place it is cheap.
 */
function checkMarkers(loc: Loc, text: string, key: string, bad: string[]) {
  const re = /\[\[([^\]]{2,45})\]\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const n = m[1].trim().toLowerCase()
    const hit = THEME_PAGES.find(p => p.label.toLowerCase() === n)
      ?? THEME_PAGES.find(p => p.label.toLowerCase().startsWith(n))
      ?? THEME_PAGES.find(p => p.id === n.replace(/\s+/g, '-'))
    if (!hit) bad.push(`${loc} ${key}: [[${m[1]}]] matches no theme page`)
  }
}

/**
 * A morphology translation must carry every Greek run through untouched, in order.
 *
 * This is the one error the format can hide. A dropped or "corrected" Greek form still renders as
 * perfectly fluent Spanish, so nothing looks wrong — but the paradigm the sentence is teaching is
 * gone, or worse, altered. Comparing the {…} runs is cheap and catches it before it ships.
 */
function checkGreek(loc: Loc, english: string, text: string, key: string, bad: string[]) {
  // Compared as a MULTISET, not in order. Translation legitimately reorders — English's
  // "{ἐγείρω}'s passive {ἠγέρθη}" becomes Spanish's "la pasiva {ἠγέρθη} de {ἐγείρω}" — and
  // demanding the original order would buy nothing but force stilted Spanish. Dropping, adding
  // or altering a form, which is what actually damages the teaching, is still caught.
  const want = greekRuns(english).slice().sort()
  const got = greekRuns(text).slice().sort()
  const missing = want.filter(w => { const i = got.indexOf(w); if (i >= 0) { got.splice(i, 1); return false } return true })
  missing.forEach(w => bad.push(`${loc} ${key}: Greek missing or altered — {${w}} is not in the translation`))
  got.forEach(g => bad.push(`${loc} ${key}: Greek not in the English — {${g}}`))
}

/** One generated file per (locale, source), because they are loaded one surface at a time. */
function build() {
  const badMarkers: string[] = []
  for (const loc of LOCALES) {
    for (const [name, fn] of Object.entries(SOURCES)) {
      const items = fn()
      const byKey = new Map(items.map(i => [i.key, i.english]))
      const bucketOf = new Map(items.map(i => [i.key, i.bucket]))
      const t = readJson(loc, name)
      const lines: string[] = []
      const split = SPLIT[name]
      const byBucket = new Map<string, Record<string, { fp: string; text: string }>>()
      let orphans = 0
      const emit = (key: string, english: string, text: string) => {
        checkMarkers(loc, text, key, badMarkers)
        // The Hebrew grammar has exactly the same exposure: a paradigm silently dropped
        // out of a fluent Spanish sentence is the one error the format cannot show.
        if (name === 'morphology' || name === 'hebrewMorphology') checkGreek(loc, english, text, key, badMarkers)
        if (split) {
          const b = bucketOf.get(key)
          if (!b) return   // unbucketed key in a split source: nowhere to put it
          const into = byBucket.get(b) ?? {}
          into[key] = { fp: fingerprint(english), text }
          byBucket.set(b, into)
          return
        }
        lines.push(`  ${JSON.stringify(key)}: { fp: ${JSON.stringify(fingerprint(english))}, `
          + `text: ${JSON.stringify(text)} },`)
      }
      const fan = FAN_OUT[name]
      if (fan) {
        // The heading keys are ordinary; only the bodies fan out.
        for (const [key, text] of Object.entries(t)) {
          if (!key.startsWith('summary.heading.')) continue
          const english = byKey.get(key)
          if (english === undefined) { orphans++; continue }
          emit(key, english, text)
        }
        for (const e of fan(t)) emit(e.key, e.english, e.text)
        orphans += Object.keys(t).filter(k => !k.startsWith('summary.heading.') && !byKey.has(k)).length
      } else {
        for (const [key, text] of Object.entries(t)) {
          const english = byKey.get(key)
          // A key with no English behind it means the source string was deleted or renamed.
          // Dropping it is right — carrying it would put text on screen matching nothing.
          if (english === undefined) { orphans++; continue }
          emit(key, english, text)
        }
      }
      if (split) {
        // Every bucket gets a file, including the ones with nothing translated yet: a 404 and an
        // empty catalogue mean the same thing to the reader, but only one of them is silent in
        // the network tab, and a missing file is indistinguishable from a build that failed.
        let written = 0
        for (const i of items) if (!byBucket.has(i.bucket ?? '')) byBucket.set(i.bucket!, {})
        for (const [b, entries] of Array.from(byBucket.entries()).sort()) {
          const f = split(loc, b)
          fs.mkdirSync(f.replace(/\/[^/]+$/, ''), { recursive: true })
          const sorted = Object.fromEntries(Object.keys(entries).sort().map(k => [k, entries[k]]))
          fs.writeFileSync(f, JSON.stringify(sorted))
          written += Object.keys(entries).length
        }
        console.log(`${name} → ${byBucket.size} files: ${written} strings`
          + (orphans ? ` (${orphans} orphaned key(s) dropped)` : ''))
        continue
      }
      lines.sort()
      const varName = `${loc.toUpperCase()}_${name.toUpperCase()}`
      const out = `// GENERATED by scripts/i18n-content.ts — do not edit.\n`
        + `// Translations live in src/lib/i18n/${loc}/${name}.json; run \`npm run i18n:content\`.\n`
        + `// \`fp\` fingerprints the English this was translated from; if the English has since\n`
        + `// changed, the reader is given the English rather than a stale translation.\n`
        + `import type { ContentCatalogue } from '../content'\n\n`
        + `export const ${varName}: ContentCatalogue = {\n${lines.join('\n')}\n}\n`
      fs.mkdirSync('src/lib/i18n/generated', { recursive: true })
      fs.writeFileSync(`src/lib/i18n/generated/${loc}.${name}.ts`, out)
      console.log(`${loc}.${name}.ts: ${lines.length} strings`
        + (orphans ? ` (${orphans} orphaned key(s) dropped)` : ''))
    }
  }
  if (badMarkers.length) {
    badMarkers.forEach(b => console.error('  ' + b))
    console.error(`${badMarkers.length} translation(s) rejected — nothing was written for them`)
    process.exit(1)
  }
}

// ── --audit ───────────────────────────────────────────────────────────────────────────
function audit() {
  const items = allItems()
  // `''.split(/\s+/)` is [''], not [], so an empty remainder must report 0 and not 1 —
  // a completion report that cannot say "done" is worse than no report.
  const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)
  for (const loc of LOCALES) {
    // Recompute rather than importing the catalogue, so the audit reports on the JSON the
    // translator is editing and not on a stale generated file.
    const bySource: Record<string, Record<string, string>> =
      Object.fromEntries(Object.keys(SOURCES).map(n => [n, readJson(loc, n)]))
    const has = (i: { source: string; key: string }) => Boolean(bySource[i.source]?.[i.key])
    const missing = items.filter(i => !has(i))
    const stale = items.filter(i => {
      const gen = generatedFp(loc, i.source, i.key)
      return has(i) && gen !== undefined && gen !== fingerprint(i.english)
    })
    const done = items.length - missing.length
    const pct = ((done / items.length) * 100).toFixed(1)
    console.log(`${loc}: ${done}/${items.length} strings (${pct}%), `
      + `${words(missing.map(m => m.english).join(' '))} English words left`)
    if (stale.length) {
      console.log(`  ${stale.length} STALE — the English changed after these were translated:`)
      stale.slice(0, 20).forEach(s => console.log(`    ${s.source}: ${s.key}`))
    }
  }
}

/**
 * The fp recorded in the generated catalogue, if it has been built — per SOURCE, because two
 * split sources can write into one directory (the Greek and Hebrew grammars both live under
 * public/data/morphology/<loc>/) and a flat map would let one overwrite the other's fingerprint,
 * reporting a perfectly current translation as stale.
 */
const genCache: Partial<Record<Loc, Record<string, string>>> = {}
const fpKey = (source: string, key: string) => `${source}\u0000${key}`
function generatedFp(loc: Loc, source: string, key: string): string | undefined {
  if (!genCache[loc]) {
    const map: Record<string, string> = {}
    for (const [name, fn] of Object.entries(SOURCES)) {
      const split = SPLIT[name]
      if (split) {
        // Split sources emit JSON under public/ rather than a generated module, but their
        // fingerprints are the same evidence of staleness and the audit has to see them. Only
        // this source's own buckets are read, which is what keeps the two grammars apart.
        const seen = new Set<string>()
        for (const i of fn()) {
          if (!i.bucket || seen.has(i.bucket)) continue
          seen.add(i.bucket)
          const f = split(loc, i.bucket)
          if (!fs.existsSync(f)) continue
          const j = JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, { fp: string }>
          for (const [k, v] of Object.entries(j)) map[fpKey(name, k)] = v.fp
        }
        continue
      }
      const f = `src/lib/i18n/generated/${loc}.${name}.ts`
      if (!fs.existsSync(f)) continue
      // exec in a loop, not matchAll: its iterator needs downlevelIteration under this tsconfig.
      const src = fs.readFileSync(f, 'utf8')
      const re = /"([^"]+)": \{ fp: "([^"]+)"/g
      let m: RegExpExecArray | null
      while ((m = re.exec(src)) !== null) map[fpKey(name, m[1])] = m[2]
    }
    genCache[loc] = map
  }
  return genCache[loc]![fpKey(source, key)]
}

const args = process.argv.slice(2)
if (args[0] === '--list') list(args[1] ?? 'themes', args[2])
else if (args[0] === '--buckets') buckets(args[1] ?? 'rhetoricNotes')
else if (args[0] === '--audit') audit()
else if (args[0] === '--build') build()
else {
  console.error('usage: --list <source> [bucket] | --buckets <source> | --build | --audit')
  process.exit(1)
}
