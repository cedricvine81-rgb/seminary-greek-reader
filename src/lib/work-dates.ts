/**
 * Approximate dates for the works the Themes pages cite, so entries within a tradition can be
 * shown in the order they were written.
 *
 * WHY: grouping by tradition already stops the worst error (the Mishnah read as first-century
 * evidence), but inside a group a student still met Sirach (c. 180 BC) beside 4 Ezra (c. 100 AD)
 * with nothing to say which came first — so an idea could not be watched moving.
 *
 * THESE ARE CONVENTIONAL APPROXIMATIONS AND SEVERAL ARE CONTESTED. A single year is a sortable
 * fiction: 1 Enoch is composite across two centuries, the Testaments of the Twelve Patriarchs
 * have a Jewish core with Christian interpolation, Pseudo-Jonathan's redaction may be centuries
 * later than its traditions, and the Testament of Solomon is dated anywhere from the first
 * century to the fifth. The number is for ORDERING; the label is what a reader sees, and it
 * hedges where the scholarship does.
 *
 * Prefix rules run before exact ids so a whole corpus can be dated in one line; the first match
 * wins, longest prefix first.
 */
export interface WorkDate { sort: number; label: string }

// Exact work ids, where a work has its own date.
const EXACT: Record<string, WorkDate> = {
  // ── Second Temple ──────────────────────────────────────────────────────────────────
  Tob: { sort: -200, label: 'c. 200 BC' },
  Sir: { sort: -180, label: 'c. 180 BC' },
  jubilees: { sort: -160, label: 'c. 160 BC' },
  aristeas: { sort: -150, label: 'c. 150 BC' },
  Bar: { sort: -150, label: 'c. 150 BC' },
  '1Esd': { sort: -150, label: 'c. 150 BC' },
  sibylline: { sort: -150, label: 'c. 150 BC (bk 3)' },
  '1enoch': { sort: -200, label: '3rd–1st c. BC' },
  Jdt: { sort: -100, label: 'c. 100 BC' },
  Sus: { sort: -100, label: 'c. 100 BC' },
  '1Macc': { sort: -100, label: 'c. 100 BC' },
  '2Macc': { sort: -100, label: 'c. 100 BC' },
  Odes: { sort: -100, label: 'c. 100 BC' },
  '3Macc': { sort: -50, label: 'c. 50 BC' },
  PsSol: { sort: -50, label: 'c. 50 BC' },
  Wis: { sort: -30, label: 'c. 30 BC' },
  'assumption-moses': { sort: 20, label: 'c. AD 20' },
  '4Macc': { sort: 40, label: 'c. AD 40' },
  '2enoch': { sort: 50, label: '1st c. AD' },
  josaseneth: { sort: 50, label: '1st c. BC–2nd c. AD' },
  'pseudo-philo': { sort: 70, label: 'c. AD 70' },
  'jewish-war': { sort: 78, label: 'c. AD 78' },
  antiquities: { sort: 94, label: 'c. AD 94' },
  life: { sort: 95, label: 'c. AD 95' },
  'against-apion': { sort: 97, label: 'c. AD 97' },
  '2baruch': { sort: 100, label: 'c. AD 100' },
  '2esdras': { sort: 100, label: 'c. AD 100 (4 Ezra)' },
  lae: { sort: 100, label: '1st–2nd c. AD' },
  apocmoses: { sort: 100, label: '1st–2nd c. AD' },
  '3baruch': { sort: 120, label: '1st–3rd c. AD' },
  'testament-of-abraham-a': { sort: 100, label: 'c. AD 100' },
  'testament-of-abraham-b': { sort: 100, label: 'c. AD 100' },
  'testament-of-solomon': { sort: 200, label: '1st–5th c. AD' },
  // ── Apostolic Fathers ──────────────────────────────────────────────────────────────
  'af-1clement': { sort: 96, label: 'c. AD 96' },
  'af-didache': { sort: 100, label: 'c. AD 100' },
  'ascension-of-isaiah': { sort: 110, label: 'c. AD 110' },
  'odes-of-solomon': { sort: 120, label: 'c. AD 120' },
  'af-polycarp': { sort: 120, label: 'c. AD 120' },
  'af-barnabas': { sort: 130, label: 'c. AD 130' },
  'af-hermas': { sort: 140, label: 'c. AD 140' },
  'af-2clement': { sort: 140, label: 'c. AD 140' },
  'af-mart-polycarp': { sort: 160, label: 'c. AD 160' },
  'af-diognetus': { sort: 180, label: 'c. AD 180' },
  // ── Later Christian ────────────────────────────────────────────────────────────────
  'paul-and-thecla': { sort: 170, label: 'c. AD 170' },
  'athanasius-incarnation': { sort: 318, label: 'c. AD 318' },
  // ── Greek and Roman ────────────────────────────────────────────────────────────────
  'greco-diogenes-laertius': { sort: 230, label: 'c. AD 230' },
}

// Whole corpora, longest prefix first.
const PREFIX: [string, WorkDate][] = [
  ['tp-', { sort: -150, label: 'c. 150 BC (Jewish core)' }],
  ['philo-', { sort: 25, label: 'c. AD 25' }],
  ['af-ign-', { sort: 110, label: 'c. AD 110' }],
  ['justin-', { sort: 155, label: 'c. AD 155' }],
  ['anf-irenaeus-', { sort: 180, label: 'c. AD 180' }],
  ['theophilus-', { sort: 180, label: 'c. AD 180' }],
  ['clement-', { sort: 200, label: 'c. AD 200' }],
  ['tert-', { sort: 205, label: 'c. AD 205' }],
  ['m-', { sort: 200, label: 'c. AD 200' }],
  ['origen-principles-', { sort: 225, label: 'c. AD 225' }],
  ['origen-celsus-', { sort: 248, label: 'c. AD 248' }],
  ['tg-isaiah', { sort: 300, label: '3rd–5th c. AD' }],
  ['tg-psj-', { sort: 400, label: 'redaction 4th–8th c. AD' }],
  ['eusebius-', { sort: 320, label: 'c. AD 320' }],
  ['athanasius-', { sort: 340, label: 'c. AD 340' }],
  ['y-', { sort: 400, label: 'c. AD 400' }],
  ['hesiod-', { sort: -700, label: 'c. 700 BC' }],
  ['herodotus-', { sort: -430, label: 'c. 430 BC' }],
  ['plutarch-', { sort: 100, label: 'c. AD 100' }],
]

const SORTED_PREFIX = [...PREFIX].sort((a, b) => b[0].length - a[0].length)

export function workDate(work: string): WorkDate | null {
  if (EXACT[work]) return EXACT[work]
  for (const [p, d] of SORTED_PREFIX) if (work.startsWith(p)) return d
  return null
}
