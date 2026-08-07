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
import { THEME_PAGES, THEME_GROUPS, TRADITIONS } from '../src/lib/themes'
import { workDate } from '../src/lib/work-dates'
import { DEVICES, GROUP_LABEL, GROUP_DESC } from '../src/lib/rhetoric-devices'
import { getTextSummary } from '../src/lib/texts-summaries'
import { TEXT_CATEGORIES } from '../src/lib/texts-catalog'
import { fingerprint } from '../src/lib/i18n/content'

const LOCALES = ['es'] as const
type Loc = typeof LOCALES[number]

export interface Item { key: string; english: string }

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
  // Their occurrence notes are NOT enumerated here. There are 2,081 of them, some 47,000 words —
  // a surface in its own right, and larger than the whole Themes corpus. Adding them silently
  // would turn "translate the Rhetoric tab" into a job several times its stated size. They fall
  // back to English until they are taken on deliberately.
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

const SOURCES: Record<string, () => Item[]> = {
  themes: themeItems, rhetoric: rhetoricItems, summaries: summaryItems,
}
/** Sources whose generated catalogue is expanded from the translated one. */
const FAN_OUT: Record<string, (t: Record<string, string>) => { key: string; english: string; text: string }[]> = {
  summaries: summaryFanOut,
}

function allItems(): Item[] {
  return Object.values(SOURCES).flatMap(f => f())
}

function readJson(loc: Loc, name: string): Record<string, string> {
  const f = `src/lib/i18n/${loc}/${name}.json`
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}
}

function translations(loc: Loc): Record<string, string> {
  return Object.assign({}, ...Object.keys(SOURCES).map(n => readJson(loc, n)))
}

// ── --list ────────────────────────────────────────────────────────────────────────────
function list(name: string) {
  const items = SOURCES[name]?.() ?? []
  const have = translations('es')
  const todo = items.filter(i => !have[i.key])
  console.log(JSON.stringify(Object.fromEntries(todo.map(i => [i.key, i.english])), null, 2))
  console.error(`${todo.length} untranslated of ${items.length}`)
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

/** One generated file per (locale, source), because they are loaded one surface at a time. */
function build() {
  const badMarkers: string[] = []
  for (const loc of LOCALES) {
    for (const [name, fn] of Object.entries(SOURCES)) {
      const byKey = new Map(fn().map(i => [i.key, i.english]))
      const t = readJson(loc, name)
      const lines: string[] = []
      let orphans = 0
      const emit = (key: string, english: string, text: string) => {
        checkMarkers(loc, text, key, badMarkers)
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
    console.error(`${badMarkers.length} unresolvable cross-page marker(s)`)
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
    const t = translations(loc)
    // Recompute rather than importing the catalogue, so the audit reports on the JSON the
    // translator is editing and not on a stale generated file.
    const missing = items.filter(i => !t[i.key])
    const stale = items.filter(i => {
      const gen = generatedFp(loc, i.key)
      return t[i.key] && gen !== undefined && gen !== fingerprint(i.english)
    })
    const done = items.length - missing.length
    const pct = ((done / items.length) * 100).toFixed(1)
    console.log(`${loc}: ${done}/${items.length} strings (${pct}%), `
      + `${words(missing.map(m => m.english).join(' '))} English words left`)
    if (stale.length) {
      console.log(`  ${stale.length} STALE — the English changed after these were translated:`)
      stale.slice(0, 20).forEach(s => console.log('    ' + s.key))
    }
  }
}

/** The fp recorded in the generated catalogue, if it has been built. */
const genCache: Partial<Record<Loc, Record<string, string>>> = {}
function generatedFp(loc: Loc, key: string): string | undefined {
  if (!genCache[loc]) {
    const files = Object.keys(SOURCES).map(n => `src/lib/i18n/generated/${loc}.${n}.ts`)
    const map: Record<string, string> = {}
    for (const f of files) {
      if (!fs.existsSync(f)) continue
      // exec in a loop, not matchAll: its iterator needs downlevelIteration under this tsconfig.
      const src = fs.readFileSync(f, 'utf8')
      const re = /"([^"]+)": \{ fp: "([^"]+)"/g
      let m: RegExpExecArray | null
      while ((m = re.exec(src)) !== null) map[m[1]] = m[2]
    }
    genCache[loc] = map
  }
  return genCache[loc]![key]
}

const args = process.argv.slice(2)
if (args[0] === '--list') list(args[1] ?? 'themes')
else if (args[0] === '--audit') audit()
else if (args[0] === '--build') build()
else { console.error('usage: --list <source> | --build | --audit'); process.exit(1) }
