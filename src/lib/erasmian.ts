/**
 * Greek → sound, in the Erasmian scheme this app teaches.
 *
 * Erasmian is deliberately mechanical — one distinct sound per letter and diphthong — so
 * this is a deterministic transliterator, not a pronunciation model. Every value below is
 * the one the Pronunciation chapter's tables teach
 * (src/components/morphology/chapters/pronunciation.tsx):
 *   η = "obey", ει = "veil", αι = "aisle", ου = "soup", ευ/ηυ = "feud", αυ = "how",
 *   οι = "oil", υι = "quit", χ = "loch", θ = "thin", ζ = dz, γ before γ/κ/χ/ξ = "ng",
 *   rough breathing = h, iota subscript silent, accents read as plain stress.
 * Three calls the chapter leaves open (α, ι, υ have unmarked length; lone υ is glossed only
 * "u"): α → /ɑ/, ι → /ɪ/, υ → /ʊ/ — kept distinct from ου /uː/ so the one-sound-per-spelling
 * principle survives. Change them here and everything downstream follows.
 *
 * ONE implementation, two consumers, deliberately: the build script that pre-renders MP3s
 * (scripts/build-erasmian-audio.mjs, via `<phoneme alphabet="ipa">`) and the browser, which
 * falls back to speech synthesis over `erasmianRespell` when a word has no recording yet.
 * A second copy would drift, and then the audio and the fallback would teach two different
 * pronunciations of the same word.
 *
 * No imports: safe in a client component and in a plain build script.
 * The chapter's own respellings are the regression suite — see tests/erasmian.test.ts.
 */

// Combining marks (NFD)
const ROUGH = '̔', SMOOTH = '̓'
const ACUTE = '́', GRAVE = '̀', CIRCUM = '͂'
const IOTA_SUB = 'ͅ', DIAERESIS = '̈'
const MACRON = '̄', BREVE = '̆'
const MARKS = new Set([SMOOTH, ROUGH, ACUTE, GRAVE, CIRCUM, IOTA_SUB, DIAERESIS, MACRON, BREVE])
const ACCENTS = [ACUTE, GRAVE, CIRCUM]

const VOWELS = new Set(['α', 'ε', 'η', 'ι', 'ο', 'υ', 'ω'])

const VOWEL_IPA: Record<string, string> = { α: 'ɑ', ε: 'ɛ', η: 'eɪ', ι: 'ɪ', ο: 'ɒ', υ: 'ʊ', ω: 'oʊ' }
/** The seven diphthongs; ηυ shares ευ's value. */
const DIPHTHONG_IPA: Record<string, string> = {
  'αι': 'aɪ', 'ει': 'eɪ', 'οι': 'ɔɪ', 'υι': 'wɪ',
  'αυ': 'aʊ', 'ου': 'uː', 'ευ': 'juː', 'ηυ': 'juː',
}
/** Long vowel carrying an iota subscript — the iota is silent. */
const IOTA_SUB_IPA: Record<string, string> = { α: 'ɑː', η: 'eɪ', ω: 'oʊ' }

const CONS_IPA: Record<string, string> = {
  β: 'b', γ: 'g', δ: 'd', ζ: 'dz', θ: 'θ', κ: 'k', λ: 'l', μ: 'm', ν: 'n',
  ξ: 'ks', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', φ: 'f', χ: 'x', ψ: 'ps',
}
/** γ turns nasal before these (ἄγγελος = angelos). */
const NASALIZERS = new Set(['γ', 'κ', 'χ', 'ξ'])

// ── Syllable division ─────────────────────────────────────────────────────────────────
// Where a consonant cluster splits decides where the stress mark ˈ lands, and a mark in the
// wrong place is audible: εὐαγγέλιον divided as juːɑ-ˈŋgɛ- asks the voice to BEGIN a
// syllable with ŋ, which English phonotactics forbid, and the engine drops or mangles it.
// So a cluster keeps only as much of its tail as can legally start an English syllable; the
// rest closes the syllable before (βαπτίζω → bɑp-ˈtɪ-dzoʊ, the chapter's "bap-TID-zoh").
// Units are per-LETTER, never per-character: ψ ξ ζ are single letters whose IPA happens to
// be two symbols (ps, ks, dz) and must never be split across syllables.
const STOPS_FRIC = new Set(['p', 'b', 't', 'd', 'k', 'g', 'f', 'θ', 'x'])
const S_CLUSTER = new Set(['p', 't', 'k', 'm', 'n', 'l'])

function isTwoUnitOnset(a: string, b: string): boolean {
  if ((b === 'r' || b === 'l') && STOPS_FRIC.has(a)) return true   // pr, kl, θr …
  if (a === 's' && S_CLUSTER.has(b)) return true                    // sp, st, sm …
  return false
}

/** Split a consonant run between the previous syllable's coda and the next one's onset. */
function splitCluster(units: string[]): { coda: string[]; onset: string[] } {
  // A single consonant between vowels always opens the next syllable (ἡ-μεῖς, not ἡμ-εῖς).
  if (units.length <= 1) return { coda: [], onset: units }
  const last = units[units.length - 1]
  const prev = units[units.length - 2]
  if (isTwoUnitOnset(prev, last)) return { coda: units.slice(0, -2), onset: [prev, last] }
  if (last !== 'ŋ') return { coda: units.slice(0, -1), onset: [last] }
  return { coda: units, onset: [] }   // ŋ can never begin a syllable
}

export interface ErasmianSyllable {
  onset: string[]
  nucleus: string
  coda: string[]
  stressed: boolean
}

/** One Greek word → its syllables in IPA. Accepts NFC or NFD, any case. */
export function erasmianSyllables(word: string): ErasmianSyllable[] {
  const nfd = word.normalize('NFD').toLowerCase()
  const tokens: { base: string; marks: string[] }[] = []
  for (const ch of nfd) {
    if (MARKS.has(ch)) { if (tokens.length) tokens[tokens.length - 1].marks.push(ch); continue }
    if (VOWELS.has(ch) || CONS_IPA[ch]) tokens.push({ base: ch, marks: [] })
  }

  // Rough breathing sounds only on a vowel; initial ῥ writes the mark but is read plain r.
  const rough = tokens.some(t => t.marks.includes(ROUGH) && VOWELS.has(t.base))

  // Pass 1: nuclei, each with the consonant units that PRECEDE it.
  const nuclei: { nucleus: string; stressed: boolean; before: string[] }[] = []
  let run: string[] = rough ? ['h'] : []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (!VOWELS.has(t.base)) {
      let c = CONS_IPA[t.base]
      if (t.base === 'γ' && NASALIZERS.has(tokens[i + 1]?.base)) c = 'ŋ'   // γγ/γκ/γχ/γξ
      if (t.base === 'ζ' && i === 0) c = 'z'                                // word-initial ζ
      run.push(c)
      continue
    }
    let nucleus: string
    let stressed = t.marks.some(m => ACCENTS.includes(m))
    if (t.marks.includes(IOTA_SUB) && IOTA_SUB_IPA[t.base]) {
      nucleus = IOTA_SUB_IPA[t.base]
    } else {
      const next = tokens[i + 1]
      const pair = next && VOWELS.has(next.base) && !next.marks.includes(DIAERESIS)
        ? DIPHTHONG_IPA[t.base + next.base] : undefined
      if (pair) {
        nucleus = pair
        stressed = stressed || next.marks.some(m => ACCENTS.includes(m))
        i++ // consume the second vowel
      } else {
        nucleus = VOWEL_IPA[t.base]
      }
    }
    nuclei.push({ nucleus, stressed, before: run })
    run = []
  }
  // A bare consonant — a letter quoted on its own, as the alphabet table does — has no
  // nucleus at all. Speak it as itself ("β" → /b/) rather than returning silence.
  if (!nuclei.length) {
    return run.length ? [{ onset: run, nucleus: '', coda: [], stressed: false }] : []
  }

  // Pass 2: distribute each run — all of the first is the opening onset; every later run
  // splits, its head closing the syllable before it.
  const sylls: ErasmianSyllable[] = nuclei.map(n => ({
    onset: [], nucleus: n.nucleus, coda: [], stressed: n.stressed,
  }))
  sylls[0].onset = nuclei[0].before
  for (let i = 1; i < nuclei.length; i++) {
    const { coda, onset } = splitCluster(nuclei[i].before)
    sylls[i - 1].coda = coda
    sylls[i].onset = onset
  }
  const last = sylls[sylls.length - 1]
  last.coda = [...last.coda, ...run]   // word-final consonants
  return sylls
}

/** IPA for one Greek word, ˈ marking the accented syllable (accents = stress in class). */
export function erasmianWordIPA(word: string): string {
  return erasmianSyllables(word)
    .map(s => `${s.stressed ? 'ˈ' : ''}${s.onset.join('')}${s.nucleus}${s.coda.join('')}`)
    .join('')
}

/** IPA for a word or phrase (per-word conversion, space-joined). */
export function erasmianIPA(text: string): string {
  return splitWords(text).map(erasmianWordIPA).filter(Boolean).join(' ')
}

function splitWords(text: string): string[] {
  return text.split(/[\s·.,;:!?()[\]"'«»—–-]+/).filter(Boolean)
}

// ── English respelling ────────────────────────────────────────────────────────────────
// The chapter teaches by respelling ("hay-MACE", "bap-TID-zoh"), and the browser's built-in
// speech synthesis has no IPA input — but read an English respelling in an English voice and
// it produces a serviceable Erasmian. So this doubles as the display hint and as the
// no-setup fallback voice for words that have no recording yet.
const RESPELL_NUCLEUS: Record<string, string> = {
  'ɑ': 'ah', 'ɑː': 'ah', 'ɛ': 'eh', 'ɒ': 'o', 'ʊ': 'uu', 'ɪ': 'i',
  'eɪ': 'ay', 'oʊ': 'oh', 'aɪ': 'eye', 'aʊ': 'ow', 'ɔɪ': 'oy', 'uː': 'oo',
  'juː': 'yoo', 'wɪ': 'wi',
}
/**
 * Short vowels need a different spelling in an OPEN syllable, because English lengthens a
 * bare final vowel: "PI-stis" is read "PIE-stis", "ay-MI" as "ay-MY". Erasmian iota is
 * always the short i of "hit", so an open syllable spells it "ih", which English cannot
 * read long. (ɑ, ɛ and ʊ already use digraphs — ah, eh, uu — that stay short either way.)
 * Only the fallback voice is affected: the pre-rendered audio speaks the IPA, where the
 * vowel was never ambiguous.
 */
const RESPELL_NUCLEUS_OPEN: Record<string, string> = { 'ɪ': 'ih' }

const RESPELL_CONS: Record<string, string> = {
  'θ': 'th', 'x': 'ch', 'ŋ': 'ng', 'dz': 'dz', 'ps': 'ps', 'ks': 'x', 'z': 'z', 'h': 'h',
}
const respellUnit = (u: string) => RESPELL_CONS[u] ?? u

/**
 * "βαπτίζω" → "bahp-TI-dzoh": syllables hyphenated, the stressed one capitalised, in the
 * style the Pronunciation chapter uses for its examples.
 */
export function erasmianRespellWord(word: string): string {
  return erasmianSyllables(word)
    .map(s => {
      const open = s.coda.length === 0
      const nucleus = (open ? RESPELL_NUCLEUS_OPEN[s.nucleus] : undefined)
        ?? RESPELL_NUCLEUS[s.nucleus] ?? s.nucleus
      const text = s.onset.map(respellUnit).join('') + nucleus + s.coda.map(respellUnit).join('')
      return s.stressed ? text.toUpperCase() : text
    })
    .join('-')
}

/** Respelling for a word or phrase. */
export function erasmianRespell(text: string): string {
  return splitWords(text).map(erasmianRespellWord).filter(Boolean).join(' ')
}

// ── Where the pre-rendered audio lives ────────────────────────────────────────────────
// Named here, not in the player or the build script, because the two must agree exactly:
// a slug rule that drifts means the build writes files the app never asks for, and the app
// silently falls back to the browser voice for every word — a failure that looks like
// nothing at all.
//
// AAC in an .m4a container rather than MP3: the renderer is macOS's own `say` + `afconvert`,
// which cannot encode MP3. Safari and Chrome both play AAC natively, which is what this
// app's students use.
export const AUDIO_EXT = 'm4a'

/** Audio files are named by the word, stripped of accents and everything but Greek letters —
 *  EXCEPT the rough breathing, which is kept as a leading "h". Accents only move stress, but
 *  the breathing is a consonant: without it εἰς ("ays") and εἷς ("HAYS") collapsed onto one
 *  filename and whichever rendered first spoke for both. Same rule as the transliterator:
 *  the breathing counts on a vowel; initial ῥ writes the mark but is read plain r. */
export function audioSlug(greek: string): string {
  const nfd = greek.normalize('NFD').toLowerCase()
  const rough = new RegExp(`[αεηιουω]${ROUGH}`).test(nfd)
  const letters = nfd.replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').replace(/[^α-ω]/g, '')
  return letters ? (rough ? 'h' : '') + letters : ''
}

/** The URL the player fetches for a word ('' when there is nothing sayable). */
export function audioUrl(greek: string): string {
  const slug = audioSlug(greek)
  return slug ? `/audio/greek/${slug}.${AUDIO_EXT}` : ''
}
