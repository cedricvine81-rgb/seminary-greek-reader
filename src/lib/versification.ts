// Hebrew (BHS / Masoretic) → English (KJV-tradition, e.g. WEB) versification map.
//
// The app's MT corpus (OSHB) is numbered per BHS; the translations it pairs with (WEB via
// getbible, BSB via bolls) follow the English tradition. In ~30 chapters these diverge — a
// Hebrew superscription counts as a verse (Psalms), or a verse sits across a chapter boundary
// (Gen 32, Joel, Malachi, …). Looking a translation up by the raw Hebrew chapter:verse then
// returns the neighbouring English verse. This maps a Hebrew reference to the English one so a
// parallel column lines up.
//
// Every entry here was derived by diffing the app's own MT verse counts against the WEB verse
// counts per chapter (scripts intentionally not kept — the result is this static table), so the
// boundaries match the exact texts being paired, not just a generic published table.

export interface EngRef { chapter: number; verse: number }

// Psalms: a title counted in Hebrew shifts every following verse. offset = (# title verses);
// Hebrew verse v → English v − offset, and the title verses themselves have no English number.
// Keyed by Psalm number; absent Psalms have no shift. (Generated from MT-vs-WEB verse counts.)
const PSALM_OFFSET: Record<number, number> = {
  3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 12: 1, 18: 1, 19: 1, 20: 1, 21: 1, 22: 1, 30: 1,
  31: 1, 34: 1, 36: 1, 38: 1, 39: 1, 40: 1, 41: 1, 42: 1, 44: 1, 45: 1, 46: 1, 47: 1, 48: 1,
  49: 1, 51: 2, 52: 2, 53: 1, 54: 2, 55: 1, 56: 1, 57: 1, 58: 1, 59: 1, 60: 2, 61: 1, 62: 1,
  63: 1, 64: 1, 65: 1, 67: 1, 68: 1, 69: 1, 70: 1, 75: 1, 76: 1, 77: 1, 80: 1, 81: 1, 83: 1,
  84: 1, 85: 1, 88: 1, 89: 1, 92: 1, 102: 1, 108: 1, 140: 1, 142: 1,
}

// Chapter-boundary shifts, keyed `<osisId>.<hebrewChapter>`. Each maps a Hebrew verse in that
// chapter to its English chapter+verse. Only divergent chapters appear; every other reference is
// identity. A Hebrew chapter whose extra verses spill from the *next* chapter (English simply has
// more) needs no rule — its own verses are unchanged.
const RULES: Record<string, (v: number) => EngRef> = {
  'Gen.32': v => (v === 1 ? { chapter: 31, verse: 55 } : { chapter: 32, verse: v - 1 }),

  'Exod.7': v => (v >= 26 ? { chapter: 8, verse: v - 25 } : { chapter: 7, verse: v }),
  'Exod.8': v => ({ chapter: 8, verse: v + 4 }),
  'Exod.21': v => (v === 37 ? { chapter: 22, verse: 1 } : { chapter: 21, verse: v }),
  'Exod.22': v => ({ chapter: 22, verse: v + 1 }),

  'Lev.5': v => (v >= 20 ? { chapter: 6, verse: v - 19 } : { chapter: 5, verse: v }),
  'Lev.6': v => ({ chapter: 6, verse: v + 7 }),

  'Num.17': v => (v <= 15 ? { chapter: 16, verse: 35 + v } : { chapter: 17, verse: v - 15 }),
  'Num.25': v => (v === 19 ? { chapter: 26, verse: 1 } : { chapter: 25, verse: v }),
  'Num.30': v => (v === 1 ? { chapter: 29, verse: 40 } : { chapter: 30, verse: v - 1 }),

  'Deut.13': v => (v === 1 ? { chapter: 12, verse: 32 } : { chapter: 13, verse: v - 1 }),
  'Deut.23': v => (v === 1 ? { chapter: 22, verse: 30 } : { chapter: 23, verse: v - 1 }),
  'Deut.28': v => (v === 69 ? { chapter: 29, verse: 1 } : { chapter: 28, verse: v }),
  'Deut.29': v => ({ chapter: 29, verse: v + 1 }),

  '1Sam.21': v => (v === 1 ? { chapter: 20, verse: 42 } : { chapter: 21, verse: v - 1 }),
  '1Sam.24': v => (v === 1 ? { chapter: 23, verse: 29 } : { chapter: 24, verse: v - 1 }),

  '2Sam.19': v => (v === 1 ? { chapter: 18, verse: 33 } : { chapter: 19, verse: v - 1 }),

  '1Kgs.5': v => (v <= 14 ? { chapter: 4, verse: 20 + v } : { chapter: 5, verse: v - 14 }),
  '1Kgs.22': v => (v >= 44 ? { chapter: 22, verse: v - 1 } : { chapter: 22, verse: v }),

  '2Kgs.12': v => (v === 1 ? { chapter: 11, verse: 21 } : { chapter: 12, verse: v - 1 }),

  '1Chr.5': v => (v <= 26 ? { chapter: 5, verse: v } : { chapter: 6, verse: v - 26 }),
  '1Chr.6': v => ({ chapter: 6, verse: v + 15 }),
  '1Chr.12': v => (v >= 5 ? { chapter: 12, verse: v - 1 } : { chapter: 12, verse: v }),

  '2Chr.1': v => (v === 18 ? { chapter: 2, verse: 1 } : { chapter: 1, verse: v }),
  '2Chr.2': v => ({ chapter: 2, verse: v + 1 }),
  '2Chr.13': v => (v === 23 ? { chapter: 14, verse: 1 } : { chapter: 13, verse: v }),
  '2Chr.14': v => ({ chapter: 14, verse: v + 1 }),

  'Neh.3': v => (v <= 32 ? { chapter: 3, verse: v } : { chapter: 4, verse: v - 32 }),
  'Neh.4': v => ({ chapter: 4, verse: v + 6 }),
  'Neh.7': v => (v >= 69 ? { chapter: 7, verse: v + 1 } : { chapter: 7, verse: v }),
  'Neh.10': v => (v === 1 ? { chapter: 9, verse: 38 } : { chapter: 10, verse: v - 1 }),

  'Job.40': v => (v <= 24 ? { chapter: 40, verse: v } : { chapter: 41, verse: v - 24 }),
  'Job.41': v => ({ chapter: 41, verse: v + 8 }),

  'Eccl.4': v => (v === 17 ? { chapter: 5, verse: 1 } : { chapter: 4, verse: v }),
  'Eccl.5': v => ({ chapter: 5, verse: v + 1 }),

  'Song.7': v => (v === 1 ? { chapter: 6, verse: 13 } : { chapter: 7, verse: v - 1 }),

  'Isa.8': v => (v === 23 ? { chapter: 9, verse: 1 } : { chapter: 8, verse: v }),
  'Isa.9': v => ({ chapter: 9, verse: v + 1 }),
  'Isa.64': v => ({ chapter: 64, verse: v + 1 }),

  'Jer.8': v => (v === 23 ? { chapter: 9, verse: 1 } : { chapter: 8, verse: v }),
  'Jer.9': v => ({ chapter: 9, verse: v + 1 }),

  'Ezek.21': v => (v <= 5 ? { chapter: 20, verse: 44 + v } : { chapter: 21, verse: v - 5 }),

  'Dan.3': v => (v <= 30 ? { chapter: 3, verse: v } : { chapter: 4, verse: v - 30 }),
  'Dan.4': v => ({ chapter: 4, verse: v + 3 }),
  'Dan.6': v => (v === 1 ? { chapter: 5, verse: 31 } : { chapter: 6, verse: v - 1 }),

  'Hos.2': v => (v <= 2 ? { chapter: 1, verse: 9 + v } : { chapter: 2, verse: v - 2 }),
  'Hos.12': v => (v === 1 ? { chapter: 11, verse: 12 } : { chapter: 12, verse: v - 1 }),
  'Hos.14': v => (v === 1 ? { chapter: 13, verse: 16 } : { chapter: 14, verse: v - 1 }),

  // Hebrew Joel has 4 chapters, English 3: Heb 3:1–5 = Eng 2:28–32, Heb 4 = Eng 3.
  'Joel.3': v => ({ chapter: 2, verse: 27 + v }),
  'Joel.4': v => ({ chapter: 3, verse: v }),

  'Jonah.2': v => (v === 1 ? { chapter: 1, verse: 17 } : { chapter: 2, verse: v - 1 }),

  'Mic.4': v => (v === 14 ? { chapter: 5, verse: 1 } : { chapter: 4, verse: v }),
  'Mic.5': v => ({ chapter: 5, verse: v + 1 }),

  'Nah.2': v => (v === 1 ? { chapter: 1, verse: 15 } : { chapter: 2, verse: v - 1 }),

  'Zech.2': v => (v <= 4 ? { chapter: 1, verse: 17 + v } : { chapter: 2, verse: v - 4 }),

  // Hebrew Malachi has 3 chapters, English 4: Heb 3:19–24 = Eng 4:1–6.
  'Mal.3': v => (v <= 18 ? { chapter: 3, verse: v } : { chapter: 4, verse: v - 18 }),
}

/**
 * Map a Hebrew (MT) reference to its English (WEB/KJV-tradition) chapter+verse. Returns `null`
 * for a Hebrew verse that has no English counterpart — a Psalm superscription, which English
 * leaves unnumbered. The vast majority of references are identity and returned unchanged.
 */
export function mtToEnglish(osisId: string, chapter: number, verse: number): EngRef | null {
  if (osisId === 'Ps') {
    const offset = PSALM_OFFSET[chapter] ?? 0
    if (offset === 0) return { chapter, verse }
    if (verse <= offset) return null   // superscription — unnumbered in English
    return { chapter, verse: verse - offset }
  }
  const rule = RULES[`${osisId}.${chapter}`]
  return rule ? rule(verse) : { chapter, verse }
}
