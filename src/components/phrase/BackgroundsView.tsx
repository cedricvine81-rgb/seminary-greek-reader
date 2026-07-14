'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ExternalLink, BookOpen, ChevronDown, X } from 'lucide-react'
import { VerseNoteButton } from '@/components/notes/VerseNoteButton'
import { onNotesChanged } from '@/lib/notes-changed-bus'
import { ParsingPanel } from '@/components/reader/ParsingPanel'
import type { LexicalInfoPanel } from '@/types/lexicon'
import type { PhraseFontSize } from './PhraseExplorer'
import { findLxxWork } from '@/lib/texts-catalog'
import { matchProseCitation, type ProseWork, type ProseChapter, type EmbeddedProseSource } from '@/lib/prose-texts'
import { BACKGROUND_SUMMARIES, type SummaryWork } from '@/lib/backgrounds-summaries'
import { useHighlights } from '@/components/highlights/useHighlights'
import { useHighlightSelection } from '@/components/highlights/useHighlightSelection'
import { HighlightPopup } from '@/components/highlights/HighlightPopup'
import { verseAnchorProps, withTokenOffsets, highlightAt, renderHighlightedPlainText } from '@/components/highlights/render'
import { highlightMarkClass } from '@/lib/highlight-colors'

// A reference the "Open in Texts" button can hand off to the Texts tab — only shown when
// the currently displayed cross-reference text is actually embedded there.
export interface OpenInTextsTarget {
  source: 'lxx' | 'josephus' | EmbeddedProseSource
  osisId?: string
  workDir?: string
  book?: number
  chapter: number
  verse?: number
  // A term to highlight (in red) in the opened text — set when the reader is opened from a
  // background-sources search, so the reader can point out the word that was searched for.
  highlight?: string
}

type BgFontSize = PhraseFontSize
const FONT_SIZE_MAP: Record<BgFontSize, string> = { sm: '1.05rem', md: '1.25rem', lg: '1.45rem', xl: '1.7rem' }

type RefBook = { osisId: string; name: string; abbrev: string; totalChapters: number; corpus?: string }

/** Parse "John 1:1-5" against a book list (mirrors the Synopsis/Phrasing tools' parser).
 *  Also handles single-chapter books cited without a chapter, as a bare verse or verse
 *  range — "Jude 14", "Jude 14-15", "Obad 5" (m[5] is that trailing dash range). */
function parseRef(ref: string, books: RefBook[]): { book: RefBook; chapter: number; verseStart: number; verseEnd: number } | null {
  const q = ref.trim().replace(/[–—]/g, '-')
  const m = q.match(/^((?:\d\s*)?\w[\w\s]*?)\s+(\d+)(?:\s*[:.,]\s*(\d+)(?:\s*-\s*(\d+))?)?(?:\s*-\s*(\d+))?$/)
  if (!m) return null
  const bookPart = m[1].trim().toLowerCase().replace(/\s+/g, '')
  const chapter = parseInt(m[2]); const vs = m[3] ? parseInt(m[3]) : 1; const ve = m[4] ? parseInt(m[4]) : (m[3] ? vs : 200)
  const dashEnd = m[5] ? parseInt(m[5]) : undefined   // bare "N-M" range with no chapter:verse colon
  const book = books.find(b => [b.osisId, b.name, b.abbrev].some(s => {
    const c = s.toLowerCase().replace(/\s+/g, ''); return c === bookPart || c.startsWith(bookPart) || bookPart.startsWith(c.slice(0, Math.max(3, bookPart.length)))
  }))
  if (!book) return null
  // Single-chapter books (Jude, Obadiah, Philemon, 2-3 John): a bare number is a verse of
  // chapter 1, and "14-15" is a verse range — not a chapter or a chapter range.
  if (book.totalChapters === 1 && !m[3]) return { book, chapter: 1, verseStart: chapter, verseEnd: dashEnd ?? chapter }
  return { book, chapter, verseStart: vs, verseEnd: ve }
}

// A clickable Greek word carries enough to fill the shared parsing pane (Strong's,
// Thayer's, Mounce, Abbott-Smith, LSJ lookups happen inside ParsingPanel itself).
type WordToken = { surface: string; parsing: string; lemma: string; gloss?: string; strongs?: string }
const GNT_MORPH_ORDER = ['partOfSpeech', 'tense', 'voice', 'mood', 'person', 'number', 'casus', 'gender'] as const
function formatGntMorph(m: Record<string, string | null> | undefined): string {
  if (!m) return ''
  return GNT_MORPH_ORDER.map(k => m[k]).filter(Boolean).join(', ')
}
function toLexicalInfo(tok: WordToken, bookName: string, verseRef: string): LexicalInfoPanel {
  return {
    surface: tok.surface, lexeme: tok.lemma, gloss: tok.gloss ?? '', partOfSpeech: '',
    parsing: tok.parsing, strongs: tok.strongs, reference: `${bookName} ${verseRef}`,
  }
}

// Versions either column can be shown in: a Greek edition or a translation. Only the
// 66 canonical Bible books have translation data (see /api/translation) — this list
// applies to the Greek NT passage (left) and to OT/LXX/NT cross-references (right);
// other cross-reference types (DSS, Second Temple lit, etc.) have a single fixed source.
const VERSIONS = [
  { code: 'na1904', label: 'Greek — Nestle 1904' },
  { code: 'gnt', label: 'Greek — Tischendorf' },
  { code: 'bsb', label: 'English (BSB)' },
  { code: 'en', label: 'English (WEB)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Mandarin' },
]

// The deuterocanonical / Apocrypha books have no BSB/WEB English (those are Protestant-
// canon only), so for them the right column also offers Brenton's 1851 English of the
// Septuagint (public-domain, from ebible.org — see scripts/build-brenton-apocrypha.py).
// Because it's translated from the same Greek the app shows, it sits verse-aligned next
// to it. Only these books have Brenton data; the option is shown only when one is open.
const BRENTON_BOOKS = new Set(['Tob', 'Jdt', 'EsthGr', 'Wis', 'Sir', 'Bar', 'EpJer', 'Sus', 'Bel', '1Macc', '2Macc', '1Esd', '3Macc', '4Macc'])
const BRENTON_VERSION = { code: 'brenton', label: 'English — Brenton (LXX)' }

// Which right-column versions actually have text for a given reference. The bsb/web/es/…
// translations exist only for the 66-book Protestant canon (see /api/translation), so
// they're dropped for the deuterocanonical books below, where they'd load nothing. And
// na1904/gnt are two distinct Greek NT editions only for NT references; for OT/LXX/
// Apocrypha refs both fall back to the same Septuagint text, so they collapse to a single,
// accurately-labelled "Greek — Septuagint" option.
const PROTESTANT_CODES = new Set(['bsb', 'en', 'es', 'fr', 'pt', 'ru', 'ko', 'zh'])
const DEUTEROCANONICAL = new Set(['Tob', 'Jdt', 'Wis', 'Sir', 'Bar', 'EpJer', 'Sus', 'Bel', '1Macc', '2Macc', '3Macc', '4Macc', '1Esd', 'Odes', 'PsSol'])
function rightVersionOptions(osisId: string, isNT: boolean): { code: string; label: string }[] {
  const out: { code: string; label: string }[] = isNT
    ? [{ code: 'na1904', label: 'Greek — Nestle 1904' }, { code: 'gnt', label: 'Greek — Tischendorf' }]
    : [{ code: 'na1904', label: 'Greek — Septuagint' }]
  if (!DEUTEROCANONICAL.has(osisId)) out.push(...VERSIONS.filter(v => PROTESTANT_CODES.has(v.code)))
  if (BRENTON_BOOKS.has(osisId)) out.push(BRENTON_VERSION)
  return out
}

// Perseus Digital Library's own confirmed URL scheme for Whiston's translation of
// Josephus (CC BY-SA 3.0 US) — Antiquities of the Jews = Perseus text 1999.01.0146,
// The Jewish War = 1999.01.0148, both addressable by book/chapter/section. All four of
// Josephus's works are now embedded in-app (public/data/josephus/{antiquities,jewish-war,
// against-apion,life}/, parsed from the same public-domain Whiston translation via Project
// Gutenberg eBooks #2848, #2850, #2849, #2846) and rendered directly in the right column —
// see parseJosephusRef below. This Perseus link remains only as a secondary "open at
// Perseus" link next to embedded Antiquities/War citations, for students who want Perseus's
// own apparatus (Against Apion and the Life have no such secondary link).
function josephusUrl(citationText: string): string | null {
  const m = citationText.match(/Josephus,\s*(J\.W\.|Ant\.)\s*(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!m) return null
  const textId = m[1] === 'J.W.' ? '0148' : '0146'
  let url = `https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.${textId}:book%3D${m[2]}:whiston+chapter%3D${m[3]}`
  if (m[4]) url += `:whiston+section%3D${m[4]}`
  return url
}

// Josephus citations resolve against the embedded Whiston text. The four works are cited
// at different depths, so each is normalized to a {book, chapter, section} the viewer can
// use: Antiquities/War use Book.Chapter.Section directly; Against Apion is Book.Section
// (no chapter level → modeled as a single chapter 1 per book); the Life is a flat run of
// sections (→ book 1, chapter 1). A trailing Niese "§N" is ignored for locating. The
// Against Apion / Life patterns are searched anywhere in the string so the two malformed
// "Josephus, Ant. Ag. Ap. …" / "Josephus, Ant. Life …" citations still resolve.
type JosephusWork = 'Ant' | 'JW' | 'AgAp' | 'Life'
type JosephusRef = { work: JosephusWork; book: number; chapter: number; section: number }
const JOSEPHUS_WORK_DIR: Record<JosephusWork, string> = { Ant: 'antiquities', JW: 'jewish-war', AgAp: 'against-apion', Life: 'life' }
const JOSEPHUS_WORK_LABEL: Record<JosephusWork, string> = { Ant: 'Antiquities', JW: 'War', AgAp: 'Against Apion', Life: 'The Life' }
function parseJosephusRef(citationText: string): JosephusRef | null {
  const bcs = citationText.match(/Josephus,\s*(Ant\.|J\.W\.)\s*(\d+)\.(\d+)\.(\d+)/)
  if (bcs) return { work: bcs[1] === 'Ant.' ? 'Ant' : 'JW', book: parseInt(bcs[2], 10), chapter: parseInt(bcs[3], 10), section: parseInt(bcs[4], 10) }
  const agap = citationText.match(/Ag\.\s*Ap\.\s*(\d+)\.(\d+)/)
  if (agap) return { work: 'AgAp', book: parseInt(agap[1], 10), chapter: 1, section: parseInt(agap[2], 10) }
  const life = citationText.match(/\bLife\s+(\d+)/)
  if (life) return { work: 'Life', book: 1, chapter: 1, section: parseInt(life[1], 10) }
  return null
}
interface JosephusSection { number: number; text: string }
interface JosephusChapter { number: number; title: string; sections: JosephusSection[] }
interface JosephusBook { number: number; title: string; chapters: JosephusChapter[] }


// Philo's treatises are now embedded in-app (public/data/philo/, driven by the
// prose-texts registry) and open in the right reading pane via matchProseCitation above,
// so well-formed "Philo, …" citations never reach this function. It survives only as an
// external fallback for citations that don't resolve in-pane — chiefly the handful of
// malformed concatenated ones (e.g. "Philo, Cherubim Creation 20"), for which it still
// links out to the first-named treatise's Yonge page. earlychristianwritings.com hosts
// Yonge one HTML page per treatise; a few span multiple volumes (Allegorical
// Interpretation I-III, Special Laws I-IV, Moses I-II, Providence I-II), the leading digit
// picking the volume. Questions on Exodus and the Armenian "On God" fragment aren't on the
// site and stay unmapped.
const PHILO_BASE = 'http://www.earlychristianwritings.com/yonge/'
const PHILO_SIMPLE: Record<string, string> = {
  'Creation': 'book1.html', 'Cherubim': 'book5.html', 'Sacrifices': 'book6.html',
  'Worse': 'book7.html', 'Posterity': 'book8.html', 'Confusion': 'book15.html',
  'Migration': 'book16.html', 'Heir': 'book17.html', 'Decalogue': 'book26.html',
  'Virtues': 'book31.html', 'Rewards': 'book32.html', 'Good Person': 'book33.html',
  'Flaccus': 'book36.html', 'Embassy': 'book40.html', 'On the Life of Abraham': 'book22.html',
  'Dreams': 'book21.html',
}
function philoUrl(citationText: string): string | null {
  const m = citationText.replace(/^cf\.\s*/, '').replace(/^idem,\s*/, '').match(/Philo,\s*(.+)$/)
  if (!m) return null
  const tail = m[1]
  const volume = (name: string, pages: string[]): string | null => {
    const vm = tail.match(new RegExp(`^${name}\\s+(\\d)`))
    if (!vm) return null
    return pages[parseInt(vm[1], 10) - 1] ?? null
  }
  const page =
    volume('Alleg\\. Interp\\.', ['book2.html', 'book3.html', 'book4.html']) ??
    volume('Spec\\. Laws', ['book27.html', 'book28.html', 'book29.html', 'book30.html']) ??
    volume('Providence', ['book38.html', 'book39.html']) ??
    (/^Moses\s+2\./.test(tail) ? 'book25.html' : /^Moses/.test(tail) ? 'book24.html' : null) ??
    Object.entries(PHILO_SIMPLE).find(([name]) => tail.startsWith(name))?.[1] ??
    null
  return page ? PHILO_BASE + page : null
}

// The 1611 King James Apocrypha (public domain) is hosted book-by-book on Wikisource
// with a clean, predictable URL — confirmed directly from Wikisource's own index page,
// not guessed. 3/4 Maccabees aren't part of the KJV Apocrypha and aren't on Wikisource
// under this scheme, so they're left unmapped rather than guessed at.
const WIKISOURCE_APOCRYPHA: Record<string, string> = {
  '1 Esdr': '1_Esdras', '2 Esdr': '2_Esdras', 'Tob': 'Tobit', 'Jdt': 'Judith',
  'Wis': 'Wisdom_of_Solomon', 'Sir': 'Ecclesiasticus', 'Bar': 'Baruch',
  'Pr Man': 'Prayer_of_Manasseh', 'Sus': 'Susanna', '1 Macc': '1_Maccabees', '2 Macc': '2_Maccabees',
}
function apocryphaUrl(citationText: string): string | null {
  // The Epistle/Letter of Jeremiah is traditionally Baruch chapter 6 in the KJV — the
  // dataset's own citations note this equivalence (e.g. "Ep Jer 29 (= Bar 6:29)").
  if (/^Ep Jer\s/.test(citationText)) return 'https://en.wikisource.org/wiki/Bible_(King_James)/Baruch'
  const entry = Object.entries(WIKISOURCE_APOCRYPHA).find(([abbrev]) => citationText.startsWith(`${abbrev} `))
  return entry ? `https://en.wikisource.org/wiki/Bible_(King_James)/${entry[1]}` : null
}

// earlyjewishwritings.com (same publisher family as earlychristianwritings.com, used for
// Philo above) hosts these pseudepigrapha as one page per work — confirmed directly from
// its own index, not guessed. No chapter-level granularity here (unlike 1 Enoch above),
// but still a real, verified link to the right work.
const EARLY_JEWISH_WRITINGS: Record<string, string> = {
  '2 En.': '2enoch.html', '3 En.': '3enoch.html', 'Jub.': 'jubilees.html',
  '2 Bar.': '2baruch.html', '3 Bar.': '3baruch.html', '4 Bar.': '4baruch.html',
  '4 Ezra': '2esdras.html', 'Pss. Sol.': 'psalmssolomon.html', 'Sib. Or.': 'sibylline.html',
  // All twelve individual Testaments live on one combined page (no per-testament URLs).
  'T. Levi': 'testtwelve.html', 'T. Reu': 'testtwelve.html', 'T. Sim': 'testtwelve.html',
  'T. Jud': 'testtwelve.html', 'T. Iss': 'testtwelve.html', 'T. Zeb': 'testtwelve.html',
  'T. Dan': 'testtwelve.html', 'T. Naph': 'testtwelve.html', 'T. Gad': 'testtwelve.html',
  'T. Ash': 'testtwelve.html', 'T. Jos': 'testtwelve.html', 'T. Benj': 'testtwelve.html',
}
function pseudepigraphaUrl(citationText: string): string | null {
  // 1 Enoch is embedded in-app (see lib/prose-texts.ts) rather than linked out, so it's not here.
  const entry = Object.entries(EARLY_JEWISH_WRITINGS).find(([abbrev]) => citationText.startsWith(`${abbrev} `))
  return entry ? `https://www.earlyjewishwritings.com/${entry[1]}` : null
}

// Tries each source in turn; extend this as more sources get a verified URL scheme.
function secondTempleUrl(citationText: string): string | null {
  return josephusUrl(citationText) ?? philoUrl(citationText) ?? apocryphaUrl(citationText) ?? pseudepigraphaUrl(citationText)
}

// ── Cross-reference dataset (public/data/backgrounds-crossrefs.json) ──────────────────
interface CrossRefCitation {
  text: string
  type: 'OT' | 'LXX' | 'DSS' | 'Apocrypha' | 'Pseudepigrapha' | 'Josephus' | 'Philo' | 'Christian Apocrypha' | 'Patristic' | 'Rabbinic' | 'Greco-Roman' | 'NT' | 'Other'
  cf?: boolean
  ref?: { book: string; chapter: number; verse: number }
  // Present on citations merged in from named scholarly commentaries (e.g. France NICNT,
  // Beale & Carson) rather than the Evans appendix — see scripts/merge-nt-ot-allusions.py.
  // 'Testimony' is used by the Patristic (early-Christian reception) layer for entries that
  // attest a book/passage without a verbatim quotation or clear allusion.
  kind?: 'Quotation' | 'Allusion' | 'Testimony'
  source?: string
  note?: string
}
interface CrossRefEntry {
  book: string; chapter: number; endChapter: number; verseStart: number; verseEnd: number
  label: string; citations: CrossRefCitation[]
}
// Compact chip labels — standard acronyms and dropped "Literature"/parentheticals to
// save horizontal space. "Christian Apocr." stays qualified to distinguish it from the
// (Jewish) Apocrypha chip.
const TYPE_LABELS: Record<CrossRefCitation['type'], string> = {
  OT: 'OT', LXX: 'LXX', DSS: 'DSS',
  Apocrypha: 'Apocrypha', Pseudepigrapha: 'Pseudepigrapha', Josephus: 'Josephus', Philo: 'Philo',
  'Christian Apocrypha': 'Christian Apocr.',
  Patristic: 'Patristic',
  Rabbinic: 'Rabbinic', 'Greco-Roman': 'Greco-Roman', NT: 'NT', Other: 'Other',
}
const TYPE_ORDER: CrossRefCitation['type'][] = ['OT', 'LXX', 'DSS', 'Apocrypha', 'Pseudepigrapha', 'Josephus', 'Philo', 'Christian Apocrypha', 'Patristic', 'Rabbinic', 'Greco-Roman', 'NT', 'Other']
const TYPE_COLORS: Record<CrossRefCitation['type'], string> = {
  OT: 'bg-blue-50 border-blue-200 text-blue-800', LXX: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  DSS: 'bg-amber-50 border-amber-200 text-amber-800',
  // Apocrypha + Pseudepigrapha are green siblings (the old "Second Temple" colour, split).
  Apocrypha: 'bg-emerald-50 border-emerald-200 text-emerald-800', Pseudepigrapha: 'bg-lime-50 border-lime-200 text-lime-800',
  // Josephus + Philo — Hellenistic-Jewish authors, split out of "Other".
  Josephus: 'bg-cyan-50 border-cyan-200 text-cyan-800', Philo: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
  'Christian Apocrypha': 'bg-teal-50 border-teal-200 text-teal-800', Patristic: 'bg-orange-50 border-orange-200 text-orange-800',
  Rabbinic: 'bg-purple-50 border-purple-200 text-purple-800',
  'Greco-Roman': 'bg-rose-50 border-rose-200 text-rose-800', NT: 'bg-gray-100 border-gray-300 text-gray-700',
  Other: 'bg-gray-50 border-gray-200 text-gray-600',
}
// A (chapter, verse) pair as one sortable number, for range-overlap checks that may
// span a chapter boundary (a handful of entries do, e.g. "Rom 3:21–4:25").
const posKey = (ch: number, vs: number) => ch * 1000 + vs

/**
 * Backgrounds: the passage's Greek text (Nestle 1904 / Tischendorf) with a scholarly
 * cross-reference apparatus (OT, LXX, Dead Sea Scrolls, Apocrypha, Pseudepigrapha,
 * rabbinic literature, Greco-Roman literature — adapted from Craig A. Evans, Ancient
 * Texts for New Testament Studies, Appendix Two) and a reading pane for whichever
 * cross-referenced passage the student selects. OT/LXX cross-references open in full
 * (the app already has that corpus); other sources show their citation only for now.
 */
export function BackgroundsView({ controlledPassage, isAuthenticated = false, fontSize: controlledFontSize, onFontSize, onAttribution, onOpenInTexts }: {
  controlledPassage?: string
  isAuthenticated?: boolean
  fontSize?: BgFontSize
  onFontSize?: (v: BgFontSize) => void
  onAttribution?: (a: string) => void
  onOpenInTexts?: (target: OpenInTextsTarget) => void
}) {
  const [gntBooks, setGntBooks] = useState<RefBook[]>([])
  const [lxxBooks, setLxxBooks] = useState<RefBook[]>([])
  const [version, setVersion] = useState('na1904')
  const isFontSizeControlled = onFontSize !== undefined
  const [internalFontSize, setInternalFontSize] = useState<BgFontSize>('lg')
  const fontSize = isFontSizeControlled ? (controlledFontSize ?? 'lg') : internalFontSize
  const setFontSize = onFontSize ?? setInternalFontSize

  const anchor = (controlledPassage ?? '').trim()

  // ── Left column: passage text (Greek) ──
  const cache = useRef<Record<string, Record<string, string>>>({})          // version -> verseId -> text
  const wordCache = useRef<Record<string, Record<string, WordToken[]>>>({}) // version -> verseId -> tokens
  const loaded = useRef<Set<string>>(new Set())
  const [, setVer] = useState(0)
  const bump = () => setVer(v => v + 1)

  // ── Shared parsing pane (driven by either column) ──
  const [selectedInfo, setSelectedInfo] = useState<LexicalInfoPanel | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // ── Per-verse personal notes (signed-in users), left + right columns share one set ──
  const [notedKeys, setNotedKeys] = useState<Set<number>>(new Set())
  const refreshNotes = useCallback(async (book: string, chapter: number) => {
    if (!isAuthenticated || !book) { setNotedKeys(new Set()); return }
    try {
      const r = await fetch(`/api/notes?book=${book}&chapter=${chapter}&verseStart=1&verseEnd=200`)
      const d = await r.json()
      setNotedKeys(new Set((d.notes ?? []).map((n: { verse: number }) => n.verse)))
    } catch { /* ignore */ }
  }, [isAuthenticated])

  // ── Persisted text highlights (signed-in users), left + right columns keyed
  // independently by their own (book, chapter) — no cross-column bleed. ──
  const highlights = useHighlights(isAuthenticated)
  const panesRef = useRef<HTMLDivElement>(null)
  const highlightSelection = useHighlightSelection(panesRef)

  // ── Cross-reference dataset ──
  const [crossRefData, setCrossRefData] = useState<{ attribution: string; entries: CrossRefEntry[] } | null>(null)
  const [typeFilter, setTypeFilter] = useState<Set<CrossRefCitation['type']>>(new Set(TYPE_ORDER))

  // ── Right column: the selected cross-reference's text ──
  // Only OT/LXX/NT citations carry a `ref` (book+chapter+verse) that the app's own Bible
  // text/translation APIs can resolve — those are the ones this version selector applies
  // to. Other cross-reference types (DSS, Second Temple lit, etc.) have a single fixed
  // source and show a citation only, unaffected by this dropdown.
  const [rightRef, setRightRef] = useState<{ label: string; citation: CrossRefCitation } | null>(null)
  const [rightVersion, setRightVersion] = useState('na1904')
  const rightCache = useRef<Record<string, Record<string, { verse: number; text: string }[]>>>({}) // version -> "book.chapter" -> verses
  const [rightVerses, setRightVerses] = useState<{ verse: number; text: string; tokens?: WordToken[] }[] | null>(null)
  const [rightLoading, setRightLoading] = useState(false)

  // ── Right column, alternate mode: an embedded Josephus citation (Antiquities, Jewish
  // War, Against Apion, or the Life). Mutually exclusive with rightRef above — opening
  // one clears the other.
  const [rightJosephus, setRightJosephus] = useState<{ label: string; citation: CrossRefCitation; ref: JosephusRef } | null>(null)
  const [josephusChapter, setJosephusChapter] = useState<JosephusChapter | null>(null)
  const [josephusLoading, setJosephusLoading] = useState(false)
  const [josephusAttribution, setJosephusAttribution] = useState<Record<JosephusWork, string>>({ Ant: '', JW: '', AgAp: '', Life: '' })
  const josephusBookCache = useRef<Record<string, JosephusBook | null>>({})
  // Scrolls the cited section into view once its text loads — matters most for Against
  // Apion (up to 42 sections in one "chapter") and the Life (76), where the passage would
  // otherwise be far below the fold.
  const josephusHighlightRef = useRef<HTMLParagraphElement | null>(null)
  useEffect(() => {
    if (josephusChapter) josephusHighlightRef.current?.scrollIntoView({ block: 'start' })
  }, [josephusChapter])

  useEffect(() => {
    (['Ant', 'JW', 'AgAp', 'Life'] as JosephusWork[]).forEach(work => {
      fetch(`/data/josephus/${JOSEPHUS_WORK_DIR[work]}/index.json`).then(r => r.json()).then((d: { attribution?: string }) => {
        setJosephusAttribution(prev => ({ ...prev, [work]: d.attribution ?? '' }))
      }).catch(() => {})
    })
  }, [])

  const loadJosephusRef = useCallback(async (ref: JosephusRef) => {
    setJosephusLoading(true)
    try {
      const cacheKey = `${ref.work}.${ref.book}`
      let book = josephusBookCache.current[cacheKey]
      if (book === undefined) {
        const r = await fetch(`/data/josephus/${JOSEPHUS_WORK_DIR[ref.work]}/${ref.book}.json`)
        book = r.ok ? await r.json() : null
        josephusBookCache.current[cacheKey] = book
      }
      setJosephusChapter(book?.chapters.find(c => c.number === ref.chapter) ?? null)
    } catch {
      setJosephusChapter(null)
    } finally {
      setJosephusLoading(false)
    }
  }, [])

  function openJosephusRef(label: string, citation: CrossRefCitation, ref: JosephusRef) {
    setRightRef(null); setRightVerses(null)
    setRightJosephus({ label, citation, ref })
    setRightProse(null); setProseChapter(null)
    void loadJosephusRef(ref)
  }

  // ── Right column, alternate mode: an embedded prose work (2 Esdras, 1 Enoch, Jubilees,
  // 2 Baruch, 2 Enoch — see lib/prose-texts.ts). Mutually exclusive with rightRef/
  // rightJosephus above; opening one clears the others. Each work's chapters + attribution
  // are cached by source id after the first fetch.
  const [rightProse, setRightProse] = useState<{ work: ProseWork; label: string; citation: CrossRefCitation; ref: { chapter: number; verse?: number } } | null>(null)
  const [proseChapter, setProseChapter] = useState<ProseChapter | null>(null)
  const [proseLoading, setProseLoading] = useState(false)
  const [proseAttribution, setProseAttribution] = useState('')
  const proseCache = useRef<Record<string, { chapters: ProseChapter[]; attribution: string }>>({})

  const loadProseRef = useCallback(async (work: ProseWork, ref: { chapter: number; verse?: number }) => {
    setProseLoading(true)
    try {
      let cached = proseCache.current[work.source]
      if (!cached) {
        const r = await fetch(work.dataUrl)
        const d: { attribution?: string; chapters?: ProseChapter[] } = r.ok ? await r.json() : {}
        cached = { chapters: d.chapters ?? [], attribution: d.attribution ?? '' }
        proseCache.current[work.source] = cached
      }
      setProseAttribution(cached.attribution)
      setProseChapter(cached.chapters.find(c => c.number === ref.chapter) ?? null)
    } catch {
      setProseChapter(null)
    } finally {
      setProseLoading(false)
    }
  }, [])

  function openProseRef(work: ProseWork, label: string, citation: CrossRefCitation, ref: { chapter: number; verse?: number }) {
    setRightRef(null); setRightVerses(null)
    setRightJosephus(null); setJosephusChapter(null)
    setRightProse({ work, label, citation, ref })
    void loadProseRef(work, ref)
  }

  // ── Library: whole-work links, independent of whichever citation is open ──
  // Summaries — scholarly overviews of extra-canonical works, grouped by corpus. The
  // dropdown is an accordion of categories → books; clicking a book opens its summary
  // in a centered card. Static reference data, so no fetching involved.
  const [showSummaries, setShowSummaries] = useState(false)
  const [expandedSummaryCat, setExpandedSummaryCat] = useState<string | null>(null)
  const [openSummary, setOpenSummary] = useState<{ work: SummaryWork; category: string } | null>(null)
  const summariesRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!showSummaries) return
    function onMouseDown(e: MouseEvent) {
      if (summariesRef.current && !summariesRef.current.contains(e.target as Node)) setShowSummaries(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [showSummaries])

  useEffect(() => { onAttribution?.(crossRefData?.attribution ?? '') }, [crossRefData, onAttribution])

  useEffect(() => {
    fetch('/data/books.json').then(r => r.json()).then((d: { gnt?: RefBook[]; lxx?: RefBook[] }) => {
      setGntBooks(d.gnt ?? [])
      setLxxBooks(d.lxx ?? [])
    }).catch(() => {})
    fetch('/data/backgrounds-crossrefs.json').then(r => r.json()).then(setCrossRefData).catch(() => {})
  }, [])

  const parsed = parseRef(anchor, gntBooks)

  // Keep the note icons in sync when a note is made/removed on another tab.
  useEffect(() => {
    const book = parsed?.book.osisId; const chapter = parsed?.chapter
    if (!book || chapter == null) return
    return onNotesChanged(() => refreshNotes(book, chapter))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotes, parsed?.book.osisId, parsed?.chapter])

  // Load the anchor passage's text (left column) whenever it or the version changes.
  useEffect(() => {
    if (!parsed) return
    ensure(version, parsed.book.osisId, parsed.chapter)
    refreshNotes(parsed.book.osisId, parsed.chapter)
    void highlights.loadFor(parsed.book.osisId, parsed.chapter)
    setSelectedInfo(null); setSelectedKey(null)
    setRightRef(null); setRightVerses(null)
    setRightJosephus(null); setJosephusChapter(null)
    setRightProse(null); setProseChapter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, version, gntBooks.length])

  function ensure(v: string, osis: string, chapter: number) {
    const ck = v === 'na1904' ? `na1904.${osis}` : v === 'bsb' ? 'bsb' : `${v}.${osis}.${chapter}`
    if (loaded.current.has(ck)) { bump(); return }
    loaded.current.add(ck)
    const done = (map: Record<string, string>, patch: Record<string, string>) => { Object.assign(map, patch); bump() }
    if (v === 'na1904') {
      type Node = { t: string; id?: string; w?: string; parsing?: string; lemma?: string; gloss?: string; strongs?: string; c?: Node[] }
      fetch(`/data/phrase-tree/${osis}.json`).then(r => r.json()).then((d: { sentences?: { tree: Node }[] }) => {
        const byVerse: Record<string, { i: number; tok: WordToken }[]> = {}
        const walk = (n: Node) => {
          if (n.t === 'w' && n.id) {
            const [bk, ch, vs, wd] = n.id.split('.')
            ;(byVerse[`${bk}.${ch}.${vs}`] ??= []).push({
              i: parseInt(wd || '0', 10),
              tok: { surface: n.w ?? '', parsing: n.parsing ?? '', lemma: n.lemma ?? '', gloss: n.gloss, strongs: n.strongs },
            })
          } else (n.c ?? []).forEach(walk)
        }
        for (const s of d.sentences ?? []) walk(s.tree)
        const patch: Record<string, string> = {}
        const wpatch: Record<string, WordToken[]> = {}
        for (const [vKey, ws] of Object.entries(byVerse)) {
          ws.sort((a, b) => a.i - b.i)
          patch[vKey] = ws.map(x => x.tok.surface).join(' ')
          wpatch[vKey] = ws.map(x => x.tok)
        }
        Object.assign((wordCache.current.na1904 ??= {}), wpatch)
        done((cache.current.na1904 ??= {}), patch)
      }).catch(() => {})
    } else if (v === 'gnt') {
      type GntWord = { surface: string; lemma?: string; strongs?: string; morph?: Record<string, string | null> }
      fetch(`/data/gnt/${osis}_${chapter}.json`).then(r => r.json()).then((d: { verses?: { verse: number; text: string; words?: GntWord[] }[] }) => {
        const map = (cache.current.gnt ??= {})
        const wmap = (wordCache.current.gnt ??= {})
        for (const vv of d.verses ?? []) {
          const vid = `${osis}.${chapter}.${vv.verse}`
          map[vid] = vv.text
          if (vv.words) wmap[vid] = vv.words.map(w => ({ surface: w.surface, parsing: formatGntMorph(w.morph), lemma: w.lemma ?? '', strongs: w.strongs }))
        }
        bump()
      }).catch(() => {})
    } else if (v === 'bsb') {
      // Berean Standard Bible — pre-aligned static file (covers the whole Bible at once).
      fetch('/data/bsb-alignment.json?v=3').then(r => r.json()).then((d: Record<string, { text: string }>) => {
        const map = (cache.current.bsb ??= {})
        done(map, Object.fromEntries(Object.entries(d).map(([vid, val]) => [vid, val.text])))
      }).catch(() => {})
    } else {
      // WEB (en) and the other translations, one chapter at a time.
      fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${v}`).then(r => r.json()).then((d: { verses?: Record<string, string> }) => {
        done((cache.current[v] ??= {}), d.verses ?? {})
      }).catch(() => {})
    }
  }

  const leftVerses: { verse: number; text: string; tokens?: WordToken[] }[] = (() => {
    if (!parsed) return []
    const map = cache.current[version] ?? {}
    const wmap = wordCache.current[version] ?? {}
    const out: { verse: number; text: string; tokens?: WordToken[] }[] = []
    for (let v = parsed.verseStart; v <= parsed.verseEnd; v++) {
      const vid = `${parsed.book.osisId}.${parsed.chapter}.${v}`
      const t = map[vid]
      if (t) out.push({ verse: v, text: t, tokens: wmap[vid] })
    }
    return out
  })()

  // ── Cross-references applicable to the loaded passage ──
  const applicableRefs: CrossRefEntry[] = (() => {
    if (!parsed || !crossRefData) return []
    const startKey = posKey(parsed.chapter, parsed.verseStart)
    const endKey = posKey(parsed.chapter, parsed.verseEnd)
    return crossRefData.entries.filter(e => {
      if (e.book !== parsed.book.osisId) return false
      const eStart = posKey(e.chapter, e.verseStart)
      const eEnd = posKey(e.endChapter, e.verseEnd)
      return eStart <= endKey && eEnd >= startKey
    })
  })()

  // ── Right column: load a cross-reference's actual text, in whichever version the
  // right-column dropdown is set to. Greek editions (na1904/gnt) go through the Reader
  // API (word-level tokens, for the parsing pane); translations go through the same
  // Bible-translation endpoints the left column and Synopsis use. Re-runs when either
  // the open reference or the right-column version changes.
  const loadRightRef = useCallback(async (citation: CrossRefCitation, rv: string) => {
    if (!citation.ref) { setRightVerses(null); return }
    const { book: osis, chapter } = citation.ref
    const cacheForVersion = (rightCache.current[rv] ??= {})
    const ck = `${osis}.${chapter}`
    setRightLoading(true)
    try {
      if (!cacheForVersion[ck]) {
        if (rv === 'na1904' || rv === 'gnt') {
          const corpus = rv === 'na1904' ? 'NA1904' : 'GNT'
          const r = await fetch(`/api/reader?book=${osis}&chapter=${chapter}&corpus=${corpus}`)
          const d = await r.json()
          const wmap = (wordCache.current[`right.${rv}`] ??= {})
          cacheForVersion[ck] = (d.verses ?? []).map((v: { verse: number; text?: string; words?: { surface: string; lexeme?: { lexeme: string; gloss?: string; strongs?: string }; parses?: { partOfSpeech: string; tense?: string; voice?: string; mood?: string; person?: string; number?: string; casus?: string; gender?: string }[] }[] }) => {
            if (v.words) {
              wmap[`${osis}.${chapter}.${v.verse}`] = v.words.map(w => ({
                surface: w.surface, lemma: w.lexeme?.lexeme ?? '', gloss: w.lexeme?.gloss, strongs: w.lexeme?.strongs,
                parsing: w.parses?.[0] ? formatGntMorph(w.parses[0] as unknown as Record<string, string | null>) : '',
              }))
            }
            return { verse: v.verse, text: v.text ?? (v.words ?? []).map(w => w.surface).join(' ') }
          })
        } else if (rv === 'bsb') {
          const r = await fetch('/data/bsb-alignment.json?v=3')
          const d: Record<string, { text: string }> = await r.json()
          cacheForVersion[ck] = Object.entries(d)
            .filter(([vid]) => vid.startsWith(`${osis}.${chapter}.`))
            .map(([vid, val]) => ({ verse: parseInt(vid.split('.')[2], 10), text: val.text }))
        } else if (rv === 'brenton') {
          // Brenton's English Septuagint — a static per-book file, filtered to this chapter.
          const r = await fetch(`/data/brenton/${osis}.json`)
          const d: Record<string, string> = r.ok ? await r.json() : {}
          cacheForVersion[ck] = Object.entries(d)
            .filter(([vid]) => vid.startsWith(`${osis}.${chapter}.`))
            .map(([vid, text]) => ({ verse: parseInt(vid.split('.')[2], 10), text }))
        } else {
          const r = await fetch(`/api/translation?book=${osis}&chapter=${chapter}&lang=${rv}`)
          const d: { verses?: Record<string, string> } = await r.json()
          cacheForVersion[ck] = Object.entries(d.verses ?? {})
            .map(([vid, text]) => ({ verse: parseInt(vid.split('.')[2], 10), text }))
        }
      }
      const wmap = wordCache.current[`right.${rv}`] ?? {}
      setRightVerses(cacheForVersion[ck].map(v => ({ ...v, tokens: wmap[`${osis}.${chapter}.${v.verse}`] })))
      void highlights.loadFor(osis, chapter)
    } catch {
      setRightVerses(null)
    } finally {
      setRightLoading(false)
    }
  }, [highlights.loadFor])

  function openRightRef(label: string, citation: CrossRefCitation) {
    setRightJosephus(null); setJosephusChapter(null)
    setRightProse(null); setProseChapter(null)
    setRightRef({ label, citation })
    // If the dropdown was left on a version this new reference has no text for (e.g.
    // Brenton on a non-Apocrypha ref, or an English translation on a deuterocanonical
    // book), fall back to the Greek, which every reference has.
    const book = citation.ref?.book
    const codes = book
      ? rightVersionOptions(book, gntBooks.some(b => b.osisId === book)).map(v => v.code)
      : ['na1904']
    const effectiveVersion = codes.includes(rightVersion) ? rightVersion : 'na1904'
    if (effectiveVersion !== rightVersion) setRightVersion(effectiveVersion)
    void loadRightRef(citation, effectiveVersion)
  }
  // Re-fetch the currently open reference when the right-column version dropdown changes.
  useEffect(() => {
    if (rightRef?.citation.ref) void loadRightRef(rightRef.citation, rightVersion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightVersion])

  const isGreek = version === 'gnt' || version === 'na1904'
  const isRightGreek = rightVersion === 'gnt' || rightVersion === 'na1904'
  const rightBookName = rightRef?.citation.ref
    ? (lxxBooks.find(b => b.osisId === rightRef.citation.ref!.book)?.name ?? gntBooks.find(b => b.osisId === rightRef.citation.ref!.book)?.name ?? rightRef.citation.ref.book)
    : ''

  // What "Open in Texts" should hand off, if the currently displayed reference is
  // actually embedded in the Texts tab (Josephus, 2 Esdras, or a catalogued LXX book —
  // NT cross-references and citation-only sources like DSS/Rabbinic have no Texts entry).
  const openInTextsTarget: OpenInTextsTarget | null = rightJosephus
    ? { source: 'josephus', workDir: JOSEPHUS_WORK_DIR[rightJosephus.ref.work], book: rightJosephus.ref.book, chapter: rightJosephus.ref.chapter, verse: rightJosephus.ref.section }
    : rightProse
    ? { source: rightProse.work.source, chapter: rightProse.ref.chapter, verse: rightProse.ref.verse }
    : rightRef?.citation.ref && findLxxWork(rightRef.citation.ref.book)
    ? { source: 'lxx', osisId: rightRef.citation.ref.book, chapter: rightRef.citation.ref.chapter, verse: rightRef.citation.ref.verse }
    : null

  function toggleType(t: CrossRefCitation['type']) {
    setTypeFilter(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t); else next.add(t)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full gap-3" style={{ '--bg-fs': FONT_SIZE_MAP[fontSize] } as CSSProperties}>
      <div className="flex items-center flex-wrap gap-3">
        {/* Type filter chips for the middle column */}
        <div className="flex items-center flex-wrap gap-1.5 ml-auto">
          {/* Summaries — accordion of corpora → works; a work opens its overview in a card. */}
          <div ref={summariesRef} className="relative">
            <button
              type="button"
              onClick={() => setShowSummaries(v => !v)}
              title="Summaries — overviews of extra-canonical literature"
              className={`inline-flex items-center gap-1 rounded-none border px-2 py-1 text-[11px] font-medium transition-colors ${showSummaries ? 'bg-brand-100 border-brand-300 text-brand-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              <BookOpen size={14} /> Summaries
            </button>
            {showSummaries && (
              <div className="absolute left-0 top-full mt-1 z-30 w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-surface p-1.5 shadow-lg">
                {BACKGROUND_SUMMARIES.map(cat => (
                  <div key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedSummaryCat(c => c === cat.id ? null : cat.id)}
                      className="flex w-full items-start justify-between gap-2 rounded-none px-2 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <span>{cat.label}</span>
                      <ChevronDown size={13} className={`mt-0.5 shrink-0 text-gray-400 transition-transform ${expandedSummaryCat === cat.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSummaryCat === cat.id && (
                      <div className="mb-1 space-y-0.5 pl-2">
                        {cat.works.map(w => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => { setOpenSummary({ work: w, category: cat.label }); setShowSummaries(false) }}
                            className="block w-full rounded-none px-2 py-1 text-left text-xs text-gray-600 hover:bg-brand-50 hover:text-brand-800"
                          >
                            {w.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {TYPE_ORDER.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`rounded-none border px-2 py-0.5 text-[11px] font-medium transition-opacity ${TYPE_COLORS[t]} ${typeFilter.has(t) ? '' : 'opacity-30'}`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary card — the "bubble" that opens with a selected work's overview. */}
      {openSummary && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/30 p-4 overflow-y-auto" onClick={() => setOpenSummary(null)}>
          <div className="w-full max-w-2xl my-8 rounded-xl bg-surface shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">{openSummary.category}</p>
                <h3 className="text-base font-semibold text-gray-800">{openSummary.work.title}</h3>
              </div>
              <button type="button" onClick={() => setOpenSummary(null)} className="shrink-0 text-gray-400 hover:text-gray-600" aria-label="Close summary"><X size={18} /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-3">
              {openSummary.work.sections.map((section, i) => (
                <div key={i}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600 mb-0.5">{section.heading}</p>
                  <p className="text-sm leading-relaxed text-gray-700">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!anchor || !parsed ? (
        <p className="text-sm text-gray-400 italic">Enter a passage above to load its background apparatus.</p>
      ) : (
        <div ref={panesRef} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* ── Left: Greek text ── */}
          <div className="flex flex-col min-h-0 rounded-xl border border-gray-200 overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {parsed.book.name} {parsed.chapter}:{parsed.verseStart}{parsed.verseEnd !== parsed.verseStart ? `–${parsed.verseEnd}` : ''}
              </p>
              <select
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {VERSIONS.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {leftVerses.length === 0 ? (
                <p className="text-xs text-gray-300 italic">Loading…</p>
              ) : (
                <div
                  className={`space-y-1 leading-relaxed text-gray-900 ${isGreek ? 'font-greek' : 'font-reading'}`}
                  style={{ fontSize: isGreek ? 'var(--bg-fs, 1.45rem)' : 'calc(var(--bg-fs, 1.45rem) * 0.65)' }}
                >
                  {leftVerses.map(v => {
                    const verseHighlights = highlights.forVerse(parsed.book.osisId, parsed.chapter, v.verse)
                    return (
                    <p key={v.verse}>
                      {isAuthenticated && (
                        <span className="font-sans align-middle mr-0.5">
                          <VerseNoteButton book={parsed.book.osisId} chapter={parsed.chapter} verse={v.verse} noted={notedKeys.has(v.verse)} onChanged={() => refreshNotes(parsed.book.osisId, parsed.chapter)} />
                        </span>
                      )}
                      <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.verse}</sup>
                      {v.tokens && v.tokens.length > 0 ? (
                        <span {...verseAnchorProps(parsed.book.osisId, parsed.chapter, v.verse)}>
                          {withTokenOffsets(v.tokens).map(({ token: tok, start, end }, ti) => {
                            const key = `left.${parsed.book.osisId}.${parsed.chapter}.${v.verse}.${ti}`
                            const select = () => { setSelectedInfo(toLexicalInfo(tok, parsed.book.name, `${parsed.chapter}:${v.verse}`)); setSelectedKey(key) }
                            const hl = highlightAt(start, end, verseHighlights)
                            return (
                              <span
                                key={ti}
                                onMouseEnter={select}
                                onClick={select}
                                {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': parsed.book.osisId, 'data-hl-chapter': parsed.chapter, 'data-hl-color': hl.color } : {})}
                                className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${hl ? highlightMarkClass(hl.color) : ''}`}
                              >
                                {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                              </span>
                            )
                          })}
                        </span>
                      ) : (
                        <span {...verseAnchorProps(parsed.book.osisId, parsed.chapter, v.verse)}>
                          {renderHighlightedPlainText(v.text, parsed.book.osisId, parsed.chapter, verseHighlights)}
                        </span>
                      )}
                    </p>
                  )})}
                </div>
              )}
            </div>
          </div>

          {/* ── Middle: cross-references ── */}
          <div className="flex flex-col min-h-0 rounded-xl border border-gray-200 overflow-hidden">
            <p className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 uppercase tracking-wide">
              Cross-references
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {!crossRefData ? (
                <p className="text-xs text-gray-300 italic">Loading…</p>
              ) : applicableRefs.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No cataloged cross-references for this passage.</p>
              ) : (
                applicableRefs.map((entry, ei) => {
                  const cites = entry.citations.filter(c => typeFilter.has(c.type))
                  if (cites.length === 0) return null
                  return (
                    <div key={ei}>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1">{entry.label}</p>
                      <div className="space-y-1">
                        {cites.map((c, ci) => {
                          const josephusRef = !c.ref ? parseJosephusRef(c.text) : null
                          if (josephusRef) {
                            const perseusHref = josephusUrl(c.text)
                            return (
                              <div key={ci} className="flex items-center gap-1">
                                <button
                                  onClick={() => openJosephusRef(entry.label, c, josephusRef)}
                                  title="View text"
                                  className={`flex-1 block text-left rounded-none border px-2 py-1 text-xs transition-colors hover:brightness-95 cursor-pointer ${TYPE_COLORS[c.type]} ${rightJosephus?.citation === c ? 'ring-2 ring-brand-400' : ''}`}
                                >
                                  {c.cf && <span className="italic mr-1">cf.</span>}{c.text}
                                </button>
                                {perseusHref && (
                                  <a
                                    href={perseusHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open at Perseus (opens in a new tab)"
                                    className="shrink-0 text-[10px] text-gray-400 hover:text-brand-600 px-1"
                                  >
                                    ↗
                                  </a>
                                )}
                              </div>
                            )
                          }
                          // Embedded prose works (2 Esdras, the Pseudepigrapha, the
                          // Testaments, and Philo's treatises) open in the right reading
                          // pane rather than linking out. This runs before the external
                          // secondTempleUrl fallback, so a well-formed "Philo, Moses 2.70"
                          // resolves in-pane; only citations that don't match here (e.g. the
                          // malformed concatenated ones) fall through to an external link.
                          const prose = !c.ref ? matchProseCitation(c.text) : null
                          if (prose) {
                            return (
                              <button
                                key={ci}
                                onClick={() => openProseRef(prose.work, entry.label, c, prose.ref)}
                                title="View text"
                                className={`block w-full text-left rounded-none border px-2 py-1 text-xs transition-colors hover:brightness-95 cursor-pointer ${TYPE_COLORS[c.type]} ${rightProse?.citation === c ? 'ring-2 ring-brand-400' : ''}`}
                              >
                                {c.cf && <span className="italic mr-1">cf.</span>}{c.text}
                              </button>
                            )
                          }
                          const extUrl = !c.ref ? secondTempleUrl(c.text) : null
                          if (extUrl) {
                            const sourceName = extUrl.includes('perseus.tufts.edu') ? 'Perseus'
                              : extUrl.includes('Bible_(King_James)') ? 'KJV Apocrypha'
                              : extUrl.includes('earlyjewishwritings.com') ? 'Early Jewish Writings'
                              : 'Yonge translation'
                            return (
                              <a
                                key={ci}
                                href={extUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Read this passage at ${sourceName} (opens in a new tab)`}
                                className={`flex items-center justify-between gap-1.5 w-full text-left rounded-lg border px-2 py-1 text-xs transition-colors hover:brightness-95 ${TYPE_COLORS[c.type]}`}
                              >
                                <span>{c.cf && <span className="italic mr-1">cf.</span>}{c.text}</span>
                                <span className="shrink-0 text-[10px] opacity-60">{sourceName} ↗</span>
                              </a>
                            )
                          }
                          const scholarTitle = c.note
                            ? `${c.kind ? `${c.kind}. ` : ''}${c.note}${c.source ? ` — ${c.source}` : ''}`
                            : (c.ref ? 'View text' : 'Full text not yet available for this source')
                          // Clickable when there is embedded text (ref) OR a scholarly note to
                          // show in the right pane — patristic/commentary entries carry a note
                          // but no embedded text of their own.
                          const openable = !!c.ref || !!c.note
                          return (
                            <button
                              key={ci}
                              onClick={() => openRightRef(entry.label, c)}
                              disabled={!openable}
                              title={scholarTitle}
                              className={`block w-full text-left rounded-none border px-2 py-1 text-xs transition-colors ${TYPE_COLORS[c.type]} ${openable ? 'hover:brightness-95 cursor-pointer' : 'cursor-default opacity-80'} ${rightRef?.citation === c ? 'ring-2 ring-brand-400' : ''}`}
                            >
                              <span className="flex items-baseline justify-between gap-1.5">
                                <span>{c.cf && <span className="italic mr-1">cf.</span>}{c.text}</span>
                                {c.kind && !c.source && <span className="shrink-0 text-[10px] opacity-60">{c.kind}</span>}
                                {c.source && <span className="shrink-0 text-[10px] opacity-60">{c.source}</span>}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Right: the selected cross-reference's text ── */}
          <div className="flex flex-col min-h-0 rounded-xl border border-gray-200 overflow-hidden">
            <div className="shrink-0 px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                {rightJosephus ? rightJosephus.citation.text : rightProse ? rightProse.citation.text : rightRef ? rightRef.citation.text : 'Referenced text'}
              </p>
              <div className="shrink-0 flex items-center gap-1.5">
                {/* Only meaningful for OT/LXX/NT cross-references — the app's own Bible
                    text/translations. Harmless to leave visible otherwise; it just won't
                    affect a citation-only source. */}
                {rightRef?.citation.ref && (
                  <select
                    value={rightVersion}
                    onChange={e => setRightVersion(e.target.value)}
                    className="rounded-lg border border-gray-300 px-1.5 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    {rightVersionOptions(rightRef.citation.ref.book, gntBooks.some(b => b.osisId === rightRef.citation.ref!.book))
                      .map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                  </select>
                )}
                {/* Open in Texts — hands the current reference off to the Texts tab, where
                    the student can keep reading the whole work (not just this citation). */}
                {openInTextsTarget && (
                  <button
                    type="button"
                    onClick={() => onOpenInTexts?.(openInTextsTarget)}
                    title="Open in Texts — keep reading this work"
                    className="inline-flex items-center gap-1 rounded-none border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink size={12} /> Open
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {rightJosephus ? (
                josephusLoading ? (
                  <p className="text-xs text-gray-300 italic">Loading…</p>
                ) : !josephusChapter ? (
                  <p className="text-xs text-gray-400 italic">No text found for this reference.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600">
                      {/* Header depth matches how each work is cited: Ant./War by Book.Chapter,
                          Against Apion by Book (its sections have no chapter level), the Life
                          by nothing (a single flat run of sections). */}
                      {rightJosephus.ref.work === 'Life'
                        ? JOSEPHUS_WORK_LABEL.Life
                        : rightJosephus.ref.work === 'AgAp'
                          ? `${JOSEPHUS_WORK_LABEL.AgAp} ${rightJosephus.ref.book}`
                          : `${JOSEPHUS_WORK_LABEL[rightJosephus.ref.work]} ${rightJosephus.ref.book}.${josephusChapter.number}`}
                      {josephusChapter.title && <> — {josephusChapter.title}</>}
                    </p>
                    <div
                      className="space-y-1 leading-relaxed text-gray-900 font-reading"
                      style={{ fontSize: 'calc(var(--bg-fs, 1.45rem) * 0.6)' }}
                    >
                      {josephusChapter.sections.map(s => (
                        <p
                          key={s.number}
                          ref={s.number === rightJosephus.ref.section ? josephusHighlightRef : undefined}
                          className={s.number === rightJosephus.ref.section ? 'bg-brand-50 -mx-1 px-1 rounded' : undefined}
                        >
                          <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{s.number}</sup>
                          {s.text}
                        </p>
                      ))}
                    </div>
                    {josephusAttribution[rightJosephus.ref.work] && (
                      <p className="text-[10px] text-gray-400 italic">{josephusAttribution[rightJosephus.ref.work]}</p>
                    )}
                  </div>
                )
              ) : rightProse ? (
                proseLoading ? (
                  <p className="text-xs text-gray-300 italic">Loading…</p>
                ) : !proseChapter ? (
                  <p className="text-xs text-gray-400 italic">No text found for this reference.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600">
                      {rightProse.work.name} {proseChapter.number}
                    </p>
                    <div
                      className="space-y-1 leading-relaxed text-gray-900 font-reading"
                      style={{ fontSize: 'calc(var(--bg-fs, 1.45rem) * 0.6)' }}
                    >
                      {proseChapter.verses.map(v => (
                        <p
                          key={v.number}
                          className={v.number === rightProse.ref.verse ? 'bg-brand-50 -mx-1 px-1 rounded' : undefined}
                        >
                          <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.number}</sup>
                          {v.text}
                        </p>
                      ))}
                    </div>
                    {proseAttribution && (
                      <p className="text-[10px] text-gray-400 italic">{proseAttribution}</p>
                    )}
                  </div>
                )
              ) : !rightRef ? (
                <p className="text-xs text-gray-400 italic">Click a cross-reference to view its text here.</p>
              ) : (
                <>
                  {/* Exegetical note + scholar attribution — present on citations merged in
                      from named commentaries (see scripts/merge-nt-ot-allusions.py), rather
                      than the Evans appendix. Shown regardless of whether the passage itself
                      resolves to embedded text. */}
                  {rightRef.citation.note && (
                    <div className="mb-2 rounded-lg border border-brand-100 bg-brand-50/60 px-2 py-1.5 text-xs text-gray-700">
                      {rightRef.citation.kind && <span className="font-semibold">{rightRef.citation.kind}. </span>}
                      {rightRef.citation.note}
                      {rightRef.citation.source && <span className="text-gray-500"> — {rightRef.citation.source}</span>}
                    </div>
                  )}
                  {rightLoading ? (
                    <p className="text-xs text-gray-300 italic">Loading…</p>
                  ) : !rightRef.citation.ref ? (
                    <div className="text-xs text-gray-500 space-y-2">
                      <p className="italic">Full text not yet available for this source ({TYPE_LABELS[rightRef.citation.type]}).</p>
                      <p className="text-gray-400">Citation: {rightRef.citation.text}</p>
                    </div>
                  ) : !rightVerses || rightVerses.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No text found for this reference.</p>
                  ) : (
                    <div
                      className={`space-y-1 leading-relaxed text-gray-900 ${isRightGreek ? 'font-greek' : 'font-reading'}`}
                      style={{ fontSize: isRightGreek ? 'calc(var(--bg-fs, 1.45rem) * 0.85)' : 'calc(var(--bg-fs, 1.45rem) * 0.6)' }}
                    >
                      {rightVerses.map(v => {
                        const rightBook = rightRef.citation.ref!.book, rightChapter = rightRef.citation.ref!.chapter
                        const verseHighlights = highlights.forVerse(rightBook, rightChapter, v.verse)
                        return (
                        <p key={v.verse}>
                          {isAuthenticated && rightRef.citation.ref && (
                            <span className="font-sans align-middle mr-0.5">
                              <VerseNoteButton book={rightRef.citation.ref.book} chapter={rightRef.citation.ref.chapter} verse={v.verse} noted={false} />
                            </span>
                          )}
                          <sup className="text-[10px] text-gray-400 mr-0.5 font-sans">{v.verse}</sup>
                          {v.tokens && v.tokens.length > 0 ? (
                            <span {...verseAnchorProps(rightBook, rightChapter, v.verse)}>
                              {withTokenOffsets(v.tokens).map(({ token: tok, start, end }, ti) => {
                                const key = `right.${rightBook}.${rightChapter}.${v.verse}.${ti}`
                                const select = () => { setSelectedInfo(toLexicalInfo(tok, rightBookName, `${rightChapter}:${v.verse}`)); setSelectedKey(key) }
                                const hl = highlightAt(start, end, verseHighlights)
                                return (
                                  <span
                                    key={ti}
                                    onMouseEnter={select}
                                    onClick={select}
                                    {...(hl ? { 'data-highlight-id': hl.id, 'data-hl-book': rightBook, 'data-hl-chapter': rightChapter, 'data-hl-color': hl.color } : {})}
                                    className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-brand-100 ${selectedKey === key ? 'bg-brand-100' : ''} ${hl ? highlightMarkClass(hl.color) : ''}`}
                                  >
                                    {tok.surface}{ti < v.tokens!.length - 1 ? ' ' : ''}
                                  </span>
                                )
                              })}
                            </span>
                          ) : (
                            <span {...verseAnchorProps(rightBook, rightChapter, v.verse)}>
                              {renderHighlightedPlainText(v.text, rightBook, rightChapter, verseHighlights)}
                            </span>
                          )}
                        </p>
                      )})}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Parsing pane — shared by both the left (passage) and right (cross-reference)
          columns; same component used on Phrasing and Synopsis. */}
      {isGreek && (
        <ParsingPanel info={selectedInfo} bgClass="bg-gray-50" />
      )}

      {isAuthenticated && highlightSelection.popup && (
        <HighlightPopup
          state={highlightSelection.popup}
          onPick={color => {
            const state = highlightSelection.popup!
            if (state.kind === 'new') for (const s of state.splits) void highlights.create(s.book, s.chapter, s.verse, s.start, s.end, color)
            else void highlights.recolor(state.id, state.book, state.chapter, color)
            highlightSelection.close()
          }}
          onRemove={() => {
            const state = highlightSelection.popup!
            if (state.kind === 'edit') void highlights.remove(state.id, state.book, state.chapter)
            highlightSelection.close()
          }}
          onClose={highlightSelection.close}
        />
      )}
    </div>
  )
}
