// Type Hebrew on a Latin keyboard — the Hebrew counterpart to greek-translit.ts's beta code,
// used by Construct search's word field so a student without a Hebrew keyboard layout can still
// enter דבר or אלהים.
//
// Phonetic rather than positional: 'd' gives ד, not the ג that a real Israeli keyboard puts on
// that key. Someone who reads Hebrew but types on a Latin keyboard knows the sounds, not the
// layout. Digraphs are tried before single letters, so "sh" is ש and not שה.

// Two-letter combinations first — order matters, longest match wins.
const DIGRAPHS: [string, string][] = [
  ['sh', 'ש'], ['ch', 'ח'], ['kh', 'כ'], ['ts', 'צ'], ['tz', 'צ'],
  ['th', 'ת'], ['ph', 'פ'], ['ss', 'שׂ'],
]

const SINGLE: Record<string, string> = {
  a: 'א', b: 'ב', g: 'ג', d: 'ד', h: 'ה', v: 'ו', w: 'ו', z: 'ז',
  T: 'ט', t: 'ת', y: 'י', i: 'י', k: 'כ', l: 'ל', m: 'מ', n: 'נ',
  s: 'ס', p: 'פ', f: 'פ', c: 'צ', q: 'ק', Q: 'ק', r: 'ר',
  // ʿayin and ʾalef are routinely typed as apostrophes.
  "'": 'ע', '`': 'א', 'e': 'ע', 'o': 'ו', 'u': 'ו', 'j': 'י',
  S: 'שׁ', H: 'ח', A: 'ע', E: 'א',
}

/** Letters that take a different shape at the end of a word. */
const FINALS: Record<string, string> = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' }

export const HEBREW_LEGEND = "sh=ש  ch=ח  ts=צ  T=ט  '=ע  v/w=ו  q=ק"

/**
 * Latin → Hebrew, applied as you type. Anything already Hebrew is passed through untouched, so
 * a real Hebrew keyboard (or a paste) still works with the toggle left on.
 */
export function latinToHebrew(input: string): string {
  let out = ''
  for (let i = 0; i < input.length; ) {
    const two = input.slice(i, i + 2).toLowerCase()
    const digraph = DIGRAPHS.find(([k]) => k === two)
    if (digraph) { out += digraph[1]; i += 2; continue }
    const ch = input[i]
    out += SINGLE[ch] ?? SINGLE[ch.toLowerCase()] ?? ch
    i += 1
  }
  return finalize(out)
}

/**
 * Put word-final letters into their final form. Applied to the whole string each keystroke, so
 * the shape corrects itself as the word grows — מל becomes ml, then מלך once the kaf ends it.
 */
export function finalize(s: string): string {
  return s.replace(/([כמנפצ])(?=$|[\s־])/g, (_, c: string) => FINALS[c] ?? c)
}
