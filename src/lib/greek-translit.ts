// Live QWERTY → Greek transliteration using the TLG "Beta Code" letter conventions — the
// scholarly standard for typing Greek on a Latin keyboard (Perseus, TLG, Logos). One Latin key
// → one Greek letter, so it transliterates cleanly on every keystroke. Accents/breathings are
// omitted (the search is accent-insensitive). Non-mapped characters pass through unchanged, so
// already-Greek text, spaces, quotes and digits survive re-running it on the whole field.

const BETA: Record<string, string> = {
  a: 'α', b: 'β', g: 'γ', d: 'δ', e: 'ε', z: 'ζ', h: 'η', q: 'θ', i: 'ι', k: 'κ',
  l: 'λ', m: 'μ', n: 'ν', c: 'ξ', o: 'ο', p: 'π', r: 'ρ', s: 'σ', t: 'τ', u: 'υ',
  f: 'φ', x: 'χ', y: 'ψ', w: 'ω',
}

// The non-obvious keys, for an on-screen legend.
export const BETA_LEGEND = 'h=η  q=θ  c=ξ  u=υ  f=φ  x=χ  y=ψ  w=ω'

export function betaCodeToGreek(input: string): string {
  let out = ''
  for (const ch of input) out += BETA[ch.toLowerCase()] ?? ch
  // Normalise sigmas: collapse to medial σ, then use final ς at word ends.
  return out
    .replace(/ς/g, 'σ')
    .replace(/σ(?=$|[^Ͱ-Ͽἀ-῿])/g, 'ς')
}
