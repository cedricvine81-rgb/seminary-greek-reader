// Pointed Hebrew → simplified academic transliteration, for the Grammar pages'
// beginner toggle. Standard-grammar style (BBH/SBL general purpose), deliberately
// simplified where the full system needs judgement a machine can't supply:
//
//  · begadkephat: only the audibly distinct pairs alternate (b/v, k/kh, p/f);
//    ג ד ת render g, d, t with or without dagesh, as most modern courses read them.
//  · dagesh after a vowel doubles the consonant (forte); at word start or after a
//    closed syllable it is lene and doubles nothing. The vowel-before test is the
//    usual classroom rule and right in the overwhelming majority of forms.
//  · shewa: vocal (ə) at word start, after another shewa, and under a letter with
//    dagesh forte; otherwise silent. The classic first-year heuristic.
//  · qamets renders ā (qamets-hatuf detection needs syllable weighing; the few
//    common hatuf words are special-cased).
//
// The output is a reading aid, not a citation form — it sits in grey under the
// Hebrew, and the Hebrew remains the text of record.

const CONS: Record<string, string | [string, string]> = {
  'א': 'ʾ', 'ב': ['b', 'v'], 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'w', 'ז': 'z',
  'ח': 'ḥ', 'ט': 'ṭ', 'י': 'y', 'כ': ['k', 'kh'], 'ך': ['k', 'kh'], 'ל': 'l',
  'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'ʿ', 'פ': ['p', 'f'],
  'ף': ['p', 'f'], 'צ': 'ṣ', 'ץ': 'ṣ', 'ק': 'q', 'ר': 'r', 'ש': 'š', 'ת': 't',
}

// Combining points (after accent stripping)
const SHEVA = 'ְ'
const HATEF: Record<string, string> = { 'ֱ': 'ĕ', 'ֲ': 'ă', 'ֳ': 'ŏ' }
const VOWEL: Record<string, string> = {
  'ִ': 'i',   // hireq
  'ֵ': 'ē',   // tsere
  'ֶ': 'e',   // seghol
  'ַ': 'a',   // patach
  'ָ': 'ā',   // qamets (hatuf handled by special cases)
  'ֹ': 'ō',   // holem
  'ֻ': 'u',   // qibbuts
}
const HOLEM_HASER_WAW = 'ֺ'   // U+05BA — consonantal waw carrying a real ō
const DAGESH = 'ּ'
const SHIN_DOT = 'ׁ'
const SIN_DOT = 'ׂ'
const MAQQEF = '־'

// Words where the qamets is hatuf (o) — the handful a first year meets.
const HATUF: Record<string, string> = { 'כָּל': 'kol', 'כָּל־': 'kol-' }

const ACCENTS = /[֑-ֽֿ֯׀׃-ׇ]/g  // taamim, meteg, sof pasuq, etc.

interface Tok { cons: string; dagesh: boolean; shin?: 'š' | 'ś'; vowel: string | null; sheva: boolean; hatef: string | null; consonantalWaw?: boolean }

function tokenize(word: string): (Tok | { sep: string })[] {
  const out: (Tok | { sep: string })[] = []
  let cur: Tok | null = null
  for (const ch of word) {
    if (CONS[ch]) {
      cur = { cons: ch, dagesh: false, vowel: null, sheva: false, hatef: null }
      out.push(cur)
    } else if (ch === DAGESH) { if (cur) cur.dagesh = true }
    else if (ch === SHIN_DOT) { if (cur) cur.shin = 'š' }
    else if (ch === SIN_DOT) { if (cur) cur.shin = 'ś' }
    else if (ch === SHEVA) { if (cur) cur.sheva = true }
    else if (HATEF[ch]) { if (cur) cur.hatef = HATEF[ch] }
    else if (ch === HOLEM_HASER_WAW) { if (cur) { cur.vowel = 'ō'; cur.consonantalWaw = true } }
    else if (VOWEL[ch]) { if (cur) cur.vowel = VOWEL[ch] }
    else if (ch === MAQQEF || ch === '-') out.push({ sep: '-' }), cur = null
    else if (ch === ' ') out.push({ sep: ' ' }), cur = null
    // anything else (Latin debris, punctuation) is dropped
  }
  return out
}

function xlitWord(word: string): string {
  if (HATUF[word]) return HATUF[word]
  if (word.startsWith('כָּל־')) return 'kol-' + xlitWord(word.slice('כָּל־'.length))
  const toks = tokenize(word)
  let out = ''
  let prevHadVowel = false        // a vowel (incl. vocal shewa) directly before this consonant?
  let prevWasSheva = false
  toks.forEach((t, i) => {
    if ('sep' in t) { out += t.sep; prevHadVowel = false; prevWasSheva = false; return }
    const next = toks[i + 1]
    const isLast = !next || 'sep' in next

    // ── mater lectionis / vowel letters ──
    if (t.cons === 'ו') {
      if (t.dagesh && !t.vowel && !t.sheva && !t.hatef) { out += 'û'; prevHadVowel = true; prevWasSheva = false; return }   // shureq
      // holem ON the waw (U+05B9) = holem-waw, the vowel ô. (WLC writes a consonantal
      // waw-with-holem using U+05BA, mapped separately, so the two don't collide.)
      if (t.vowel === 'ō' && !t.dagesh && !t.sheva && !t.hatef && !t.consonantalWaw) { out += 'ô'; prevHadVowel = true; prevWasSheva = false; return }
      if (t.vowel === 'ō' || (!t.vowel && !t.sheva && !t.hatef && prevHadVowel === false && out.endsWith('ō'))) { /* holem-waw handled below */ }
      if (!t.vowel && !t.sheva && !t.hatef && !t.dagesh) {
        // bare waw after holem = holem-waw (ō → ô); after any other vowel it's a rare mater — keep silent
        if (out.endsWith('ō')) { out = out.slice(0, -1) + 'ô'; return }
        if (prevHadVowel) return
      }
    }
    if (t.cons === 'י' && !t.vowel && !t.sheva && !t.hatef && !t.dagesh) {
      // yod as vowel letter: i→î, ē→ê, e→ê(seghol-yod), a/ā + word-final yod = ay/āy kept as consonant
      if (out.endsWith('i')) { out = out.slice(0, -1) + 'î'; return }
      if (out.endsWith('ē')) { out = out.slice(0, -1) + 'ê'; return }
      if (out.endsWith('e')) { out = out.slice(0, -1) + 'ê'; return }
    }
    if (t.cons === 'ה' && isLast && !t.vowel && !t.sheva && !t.hatef) {
      // final he as mater (ā-h, ē-h, e-h): silent — qamets-he = â by convention
      if (out.endsWith('ā')) { out = out.slice(0, -1) + 'â'; return }
      if (out.endsWith('ē') || out.endsWith('e') || out.endsWith('ō')) return
      if (t.dagesh) { /* mappiq — real consonant, falls through */ }
    }

    // ── the consonant itself ──
    let c: string
    const map = CONS[t.cons]
    if (t.cons === 'ש') c = t.shin ?? 'š'
    else if (Array.isArray(map)) c = t.dagesh ? map[0] : map[1]
    else c = map as string
    // dagesh forte: doubles when a vowel precedes (and it isn't a begadkephat at word start)
    if (t.dagesh && prevHadVowel) c = c + c

    // ── the vowel ──
    let v = ''
    let vocalSheva = false
    if (t.hatef) v = t.hatef
    else if (t.vowel) {
      v = t.vowel
      // furtive patach: patach on a FINAL guttural is pronounced before it
      if (v === 'a' && isLast && (t.cons === 'ח' || t.cons === 'ע' || (t.cons === 'ה' && t.dagesh))) {
        out += 'a' + c
        prevHadVowel = false; prevWasSheva = false
        return
      }
    } else if (t.sheva) {
      const atStart = out === '' || out.endsWith('-') || out.endsWith(' ')
      vocalSheva = atStart || prevWasSheva || (t.dagesh && prevHadVowel)
      v = vocalSheva ? 'ə' : ''
    }

    out += c + v
    prevHadVowel = !!v && v !== ''
    prevWasSheva = t.sheva
  })
  return out
}

/** Transliterate a pointed-Hebrew string (spaces and maqqef preserved). */
export function transliterate(text: string): string {
  const clean = text.replace(ACCENTS, '')
  return clean.split(/(\s+)/).map(part =>
    /^\s+$/.test(part) ? ' ' : xlitWord(part)
  ).join('').trim()
}
