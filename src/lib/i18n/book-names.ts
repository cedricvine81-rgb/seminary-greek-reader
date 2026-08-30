import type { Locale } from './locale'

/**
 * Localized names and abbreviations for the biblical books, keyed by OSIS id.
 *
 * WHY A CATALOGUE RATHER THAN t() KEYS: book names are needed in three different shapes (full
 * name, abbreviation, and inside an already-formatted "Book c:v" reference) by a dozen surfaces
 * that share no component tree — reader headings, search results, the book pickers, exegesis,
 * every rendered citation. Eighty-five books × three shapes as flat message keys would be 255
 * entries whose relationships nothing enforces. Keyed by OSIS id, the invariant is checkable:
 * `npm run i18n:books` reports any id in public/data/books.json that this file does not cover.
 *
 * THE ONE RULE: **localize the DISPLAY, never the STORED string.** A verse reference is baked
 * into data server-side (`reference: \`${bookName} ${c}:${v}\`` in src/lib/reader.ts) and
 * persisted on BiblicalVerse, Assignment.reference and Question.reference. Instructors type
 * those, questions key off them, and grading matches against them. Translating a stored
 * reference would silently unlink an assignment from its passage. Everything here runs at
 * render time only; identity always travels as the OSIS id alongside.
 *
 * A missing entry falls back to the English the caller already had, the same never-mislead rule
 * the fingerprinted content catalogues use — so a partly covered locale degrades to English
 * rather than to an id like "1Thess".
 *
 * OSIS ids are not unique per book across corpora: the LXX carries JoshB / JudgB / EsthGr /
 * DanLXX beside the MT's Josh / Judg / Esth / Dan, because they are genuinely different texts
 * (Greek Esther has material Hebrew Esther lacks). They are separate entries here, and the
 * Greek ones say so in their name, because a student reading the LXX should see which text
 * they are in.
 */
export interface BookLabel {
  /** Full display name, e.g. "1 Corintios". */
  name: string
  /** Short form for grids and tight columns, e.g. "1 Co". */
  abbrev: string
}

/**
 * Latin American Spanish, following the Reina-Valera tradition for the protocanon and the
 * common Catholic/ecumenical forms for the deuterocanon. Abbreviations match the ones already
 * used by localizeRef() in morph-fields.ts, so the morphology cards and the reader agree.
 */
const es: Record<string, BookLabel> = {
  // ── New Testament ──
  Matt: { name: 'Mateo', abbrev: 'Mt' },
  Mark: { name: 'Marcos', abbrev: 'Mc' },
  Luke: { name: 'Lucas', abbrev: 'Lc' },
  John: { name: 'Juan', abbrev: 'Jn' },
  Acts: { name: 'Hechos', abbrev: 'Hch' },
  Rom: { name: 'Romanos', abbrev: 'Ro' },
  '1Cor': { name: '1 Corintios', abbrev: '1 Co' },
  '2Cor': { name: '2 Corintios', abbrev: '2 Co' },
  Gal: { name: 'Gálatas', abbrev: 'Gá' },
  Eph: { name: 'Efesios', abbrev: 'Ef' },
  Phil: { name: 'Filipenses', abbrev: 'Fil' },
  Col: { name: 'Colosenses', abbrev: 'Col' },
  '1Thess': { name: '1 Tesalonicenses', abbrev: '1 Ts' },
  '2Thess': { name: '2 Tesalonicenses', abbrev: '2 Ts' },
  '1Tim': { name: '1 Timoteo', abbrev: '1 Ti' },
  '2Tim': { name: '2 Timoteo', abbrev: '2 Ti' },
  Titus: { name: 'Tito', abbrev: 'Tit' },
  Phlm: { name: 'Filemón', abbrev: 'Flm' },
  Heb: { name: 'Hebreos', abbrev: 'He' },
  Jas: { name: 'Santiago', abbrev: 'Stg' },
  '1Pet': { name: '1 Pedro', abbrev: '1 P' },
  '2Pet': { name: '2 Pedro', abbrev: '2 P' },
  '1John': { name: '1 Juan', abbrev: '1 Jn' },
  '2John': { name: '2 Juan', abbrev: '2 Jn' },
  '3John': { name: '3 Juan', abbrev: '3 Jn' },
  Jude: { name: 'Judas', abbrev: 'Jud' },
  Rev: { name: 'Apocalipsis', abbrev: 'Ap' },

  // ── Torah / Pentateuch ──
  Gen: { name: 'Génesis', abbrev: 'Gn' },
  Exod: { name: 'Éxodo', abbrev: 'Ex' },
  Lev: { name: 'Levítico', abbrev: 'Lv' },
  Num: { name: 'Números', abbrev: 'Nm' },
  Deut: { name: 'Deuteronomio', abbrev: 'Dt' },

  // ── Historical ──
  Josh: { name: 'Josué', abbrev: 'Jos' },
  Judg: { name: 'Jueces', abbrev: 'Jue' },
  Ruth: { name: 'Rut', abbrev: 'Rt' },
  '1Sam': { name: '1 Samuel', abbrev: '1 S' },
  '2Sam': { name: '2 Samuel', abbrev: '2 S' },
  '1Kgs': { name: '1 Reyes', abbrev: '1 R' },
  '2Kgs': { name: '2 Reyes', abbrev: '2 R' },
  '1Chr': { name: '1 Crónicas', abbrev: '1 Cr' },
  '2Chr': { name: '2 Crónicas', abbrev: '2 Cr' },
  Ezra: { name: 'Esdras', abbrev: 'Esd' },
  Neh: { name: 'Nehemías', abbrev: 'Neh' },
  Esth: { name: 'Ester', abbrev: 'Est' },

  // ── Poetry / Wisdom ──
  Job: { name: 'Job', abbrev: 'Job' },
  Ps: { name: 'Salmos', abbrev: 'Sal' },
  Prov: { name: 'Proverbios', abbrev: 'Pr' },
  Eccl: { name: 'Eclesiastés', abbrev: 'Ec' },
  Song: { name: 'Cantar de los Cantares', abbrev: 'Cnt' },

  // ── Prophets ──
  Isa: { name: 'Isaías', abbrev: 'Is' },
  Jer: { name: 'Jeremías', abbrev: 'Jer' },
  Lam: { name: 'Lamentaciones', abbrev: 'Lm' },
  Ezek: { name: 'Ezequiel', abbrev: 'Ez' },
  Dan: { name: 'Daniel', abbrev: 'Dn' },
  Hos: { name: 'Oseas', abbrev: 'Os' },
  Joel: { name: 'Joel', abbrev: 'Jl' },
  Amos: { name: 'Amós', abbrev: 'Am' },
  Obad: { name: 'Abdías', abbrev: 'Abd' },
  Jonah: { name: 'Jonás', abbrev: 'Jon' },
  Mic: { name: 'Miqueas', abbrev: 'Mi' },
  Nah: { name: 'Nahúm', abbrev: 'Nah' },
  Hab: { name: 'Habacuc', abbrev: 'Hab' },
  Zeph: { name: 'Sofonías', abbrev: 'Sof' },
  Hag: { name: 'Hageo', abbrev: 'Hag' },
  Zech: { name: 'Zacarías', abbrev: 'Zac' },
  Mal: { name: 'Malaquías', abbrev: 'Mal' },

  // ── Septuagint-only forms of protocanonical books ──
  // Named so the student can see WHICH text they are reading: the Greek Joshua, Judges, Esther
  // and Daniel differ substantively from the Hebrew, which is often the point of the exercise.
  JoshB: { name: 'Josué (LXX)', abbrev: 'Jos' },
  JudgB: { name: 'Jueces (LXX)', abbrev: 'Jue' },
  EsthGr: { name: 'Ester (griego)', abbrev: 'Est' },
  DanLXX: { name: 'Daniel (LXX)', abbrev: 'Dn' },

  // ── Deuterocanon / LXX ──
  '1Esd': { name: '1 Esdras', abbrev: '1 Esd' },
  Tob: { name: 'Tobías', abbrev: 'Tob' },
  Jdt: { name: 'Judit', abbrev: 'Jdt' },
  Wis: { name: 'Sabiduría', abbrev: 'Sab' },
  // "Sirácida" settled with the user; the traditional Spanish "Eclesiástico" is kept out of the
  // abbreviation too, since "Eclo" beside "Ec" (Eclesiastés) is a trap in a book grid.
  Sir: { name: 'Sirácida', abbrev: 'Sir' },
  EpJer: { name: 'Carta de Jeremías', abbrev: 'CarJer' },
  Bar: { name: 'Baruc', abbrev: 'Bar' },
  Sus: { name: 'Susana', abbrev: 'Sus' },
  Bel: { name: 'Bel y el dragón', abbrev: 'Bel' },
  // The Theodotion recensions, which the Septuagint corpus carries beside the Old Greek and
  // which the Register tool ranks as separate works. Without these three the Spanish list
  // showed "Susanna (Theodotion)" beside "Susana".
  SusTh: { name: 'Susana (Teodoción)', abbrev: 'Sus' },
  BelTh: { name: 'Bel y el dragón (Teodoción)', abbrev: 'Bel' },
  DanTh: { name: 'Daniel (Teodoción)', abbrev: 'Dn' },
  '1Macc': { name: '1 Macabeos', abbrev: '1 Mac' },
  '2Macc': { name: '2 Macabeos', abbrev: '2 Mac' },
  '3Macc': { name: '3 Macabeos', abbrev: '3 Mac' },
  '4Macc': { name: '4 Macabeos', abbrev: '4 Mac' },
  PsSol: { name: 'Salmos de Salomón', abbrev: 'SalSl' },
  Odes: { name: 'Odas', abbrev: 'Od' },
}

/**
 * Only Spanish is populated. Russian and Mandarin ship their interface catalogues already, but
 * biblical book names are not a thing to guess at — the Synodal and CUV traditions each have
 * settled forms, and a plausible-looking invention would be worse than the English a reader can
 * at least recognise. They fall back to English until someone who reads them fills these in.
 */
const BOOK_NAMES: Partial<Record<Locale, Record<string, BookLabel>>> = { es }

/** True if `locale` has any book names at all — lets a caller skip work entirely for English. */
export function hasBookNames(locale: string): boolean {
  return locale !== 'en' && BOOK_NAMES[locale as Locale] !== undefined
}

/**
 * The full display name for a book. `english` is what the caller already had (from the catalog
 * or books.json) and is returned unchanged when the locale has no entry — so callers never need
 * their own fallback.
 */
export function bookName(osisId: string, locale: string, english?: string): string {
  return BOOK_NAMES[locale as Locale]?.[osisId]?.name ?? english ?? osisId
}

/** The short form, for book grids and tight columns. */
export function bookAbbrev(osisId: string, locale: string, english?: string): string {
  return BOOK_NAMES[locale as Locale]?.[osisId]?.abbrev ?? english ?? osisId
}

/** "Matt 1:1" style display reference built from parts. Never persist the result. */
export function formatRef(osisId: string, locale: string, chapter: number | string,
                          verse?: number | string, english?: string): string {
  const b = bookName(osisId, locale, english)
  return verse === undefined ? `${b} ${chapter}` : `${b} ${chapter}:${verse}`
}
