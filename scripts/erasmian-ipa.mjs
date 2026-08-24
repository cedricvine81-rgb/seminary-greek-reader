// Greek → IPA in the Erasmian scheme taught by the app's Pronunciation chapter.
//
// Erasmian is deliberately mechanical — one distinct sound per letter/diphthong — so this
// is a deterministic transliterator, not a model. Every value below is the one the
// chapter's tables teach (src/components/morphology/chapters/pronunciation.tsx):
//   η = "obey", ει = "veil" (Erasmian's famous overlap), αι = "aisle", ου = "soup",
//   ευ/ηυ = "feud", αυ = "how", οι = "oil", υι = "quit", χ = "loch", θ = "thin",
//   ζ = dz, γ before γ/κ/χ/ξ = "ng", rough breathing = h, iota subscript silent,
//   accents read as plain stress.
// Two calls the chapter leaves open (α/ι/υ have unmarked length; lone υ is only glossed
// "u"): α → /ɑ/ (father), ι → /ɪ/ (hit), υ → /ʊ/ — kept distinct from ου /uː/ so the
// one-sound-per-spelling principle survives. Change them here and regenerate.
//
// Used by scripts/build-erasmian-audio.mjs, which feeds the IPA to Azure TTS via
// <phoneme alphabet="ipa">. Run `node scripts/erasmian-ipa.mjs --test` to check the
// output against the pronunciation chapter's own respellings (hay-MACE, bap-TID-zoh …).

// Combining marks (NFD)
const SMOOTH = '̓', ROUGH = '̔'
const ACUTE = '́', GRAVE = '̀', CIRCUM = '͂'
const IOTA_SUB = 'ͅ', DIAERESIS = '̈'
const MACRON = '̄', BREVE = '̆'
const MARKS = new Set([SMOOTH, ROUGH, ACUTE, GRAVE, CIRCUM, IOTA_SUB, DIAERESIS, MACRON, BREVE])

const VOWELS = new Set(['α', 'ε', 'η', 'ι', 'ο', 'υ', 'ω'])

const VOWEL_IPA = { α: 'ɑ', ε: 'ɛ', η: 'eɪ', ι: 'ɪ', ο: 'ɒ', υ: 'ʊ', ω: 'oʊ' }
// The seven diphthongs (first letter + second letter). ηυ shares ευ's value.
const DIPHTHONG_IPA = {
  'αι': 'aɪ', 'ει': 'eɪ', 'οι': 'ɔɪ', 'υι': 'wɪ',
  'αυ': 'aʊ', 'ου': 'uː', 'ευ': 'juː', 'ηυ': 'juː',
}
// Long vowel with iota subscript — the iota is silent.
const IOTA_SUB_IPA = { α: 'ɑː', η: 'eɪ', ω: 'oʊ' }

const CONS_IPA = {
  β: 'b', γ: 'g', δ: 'd', ζ: 'dz', θ: 'θ', κ: 'k', λ: 'l', μ: 'm', ν: 'n',
  ξ: 'ks', π: 'p', ρ: 'r', σ: 's', ς: 's', τ: 't', φ: 'f', χ: 'x', ψ: 'ps',
}
// γ turns nasal before these
const NASALIZERS = new Set(['γ', 'κ', 'χ', 'ξ'])

/** One word (NFC or NFD, any case) → syllable list; each { onset, nucleus, stressed }. */
function syllabify(word) {
  // Tokenize: [{ base, marks }] with punctuation/apostrophes dropped.
  const nfd = word.normalize('NFD').toLowerCase()
  const tokens = []
  for (const ch of nfd) {
    if (MARKS.has(ch)) { if (tokens.length) tokens[tokens.length - 1].marks.push(ch); continue }
    if (VOWELS.has(ch) || CONS_IPA[ch]) tokens.push({ base: ch, marks: [] })
  }

  let rough = tokens.some(t => t.marks.includes(ROUGH) && VOWELS.has(t.base))
  const sylls = []
  let onset = rough ? 'h' : ''

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (!VOWELS.has(t.base)) {
      // γ before γ/κ/χ/ξ = ng; ζ softens to plain z at word start
      let c = CONS_IPA[t.base]
      if (t.base === 'γ' && NASALIZERS.has(tokens[i + 1]?.base)) c = 'ŋ'
      if (t.base === 'ζ' && i === 0) c = 'z'
      onset += c
      continue
    }
    // Vowel: iota subscript → long value, else try diphthong with the NEXT vowel
    let nucleus, stressed = t.marks.some(m => m === ACUTE || m === GRAVE || m === CIRCUM)
    if (t.marks.includes(IOTA_SUB) && IOTA_SUB_IPA[t.base]) {
      nucleus = IOTA_SUB_IPA[t.base]
    } else {
      const next = tokens[i + 1]
      const pair = next && VOWELS.has(next.base) && !next.marks.includes(DIAERESIS)
        ? DIPHTHONG_IPA[t.base + next.base] : undefined
      if (pair) {
        nucleus = pair
        stressed = stressed || next.marks.some(m => m === ACUTE || m === GRAVE || m === CIRCUM)
        i++ // consume the second vowel
      } else {
        nucleus = VOWEL_IPA[t.base]
      }
    }
    sylls.push({ onset, nucleus, stressed })
    onset = ''
  }
  // Trailing consonants belong to the last syllable's coda
  if (onset && sylls.length) sylls[sylls.length - 1].coda = onset
  else if (onset) sylls.push({ onset: '', nucleus: '', stressed: false, coda: onset })
  return sylls
}

/** IPA for one Greek word, ˈ marking the accented syllable (accents = stress in class). */
export function erasmianWordIPA(word) {
  const sylls = syllabify(word)
  return sylls
    .map(s => `${s.stressed ? 'ˈ' : ''}${s.onset}${s.nucleus}${s.coda ?? ''}`)
    .join('')
}

/** IPA for a word or phrase (per-word conversion, space-joined). */
export function erasmianIPA(text) {
  return text
    .split(/[\s·.,;:·!?()\[\]"'«»—–-]+/)
    .filter(Boolean)
    .map(erasmianWordIPA)
    .filter(Boolean)
    .join(' ')
}

// ── Self-test against the pronunciation chapter's own respellings ──────────────────────
if (process.argv.includes('--test')) {
  const CASES = [
    // From the chapter's three-schemes table and examples
    ['ἡμεῖς', 'heɪˈmeɪs'],          // hay-MACE
    ['καί', 'ˈkaɪ'],                // kai as "eye"
    ['βαπτίζω', 'bɑpˈtɪdzoʊ'],      // bap-TID-zoh
    ['ἅγιος', 'ˈhɑgɪɒs'],           // HA-gi-os
    ['ἄγγελος', 'ˈɑŋgɛlɒs'],        // angelos, γγ = ng
    ['λόγος', 'ˈlɒgɒs'],
    ['υἱός', 'hwɪˈɒs'],             // υι = "quit", rough breathing
    ['οὐρανός', 'uːrɑˈnɒs'],        // ου = "soup"
    ['εὐαγγέλιον', 'juːɑŋˈgɛlɪɒn'], // ευ = "feud"
    ['αὐτός', 'aʊˈtɒs'],            // αυ = "how"
    ['οἶκος', 'ˈɔɪkɒs'],            // οι = "oil"
    ['εἰμί', 'eɪˈmɪ'],              // ει = "veil"
    ['τῷ', 'ˈtoʊ'],                 // iota subscript silent
    ['λόγῳ', 'ˈlɒgoʊ'],
    ['ψυχή', 'psʊˈxeɪ'],            // ψ = ps, χ = loch
    ['Ἰερουσαλήμ', 'ɪɛruːsɑˈleɪm'], // smooth breathing, ιε not a diphthong
    ['Ἠσαΐας', 'eɪsɑˈɪɑs'],         // diaeresis splits the pair
    ['κόσμος', 'ˈkɒsmɒs'],
    ['θρόνος', 'ˈθrɒnɒs'],
    ['ζωή', 'zoʊˈeɪ'],              // word-initial ζ
    ['ῥῆμα', 'ˈreɪmɑ'],             // initial ῥ: the h is written, not sounded
  ]
  let bad = 0
  for (const [word, want] of CASES) {
    const got = erasmianIPA(word)
    const ok = got === want
    if (!ok) bad++
    console.log(`${ok ? '✓' : '✗'} ${word}  →  ${got}${ok ? '' : `   (expected ${want})`}`)
  }
  console.log(bad === 0 ? `\nAll ${CASES.length} match the chapter.` : `\n${bad} MISMATCH(ES)`)
  process.exit(bad === 0 ? 0 : 1)
}
