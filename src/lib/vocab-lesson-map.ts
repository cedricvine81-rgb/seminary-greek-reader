// BGVB lesson map for Beginning Greek (50+ GNT occurrences, Sections I–II)
// Each lesson covers 20 consecutive frequency-rank words.
// sortOrder in VocabularyItem corresponds to frequency rank (1 = most frequent).

export interface VocabLesson {
  lesson: number       // 1–16
  section: string      // e.g. "Section I-A"
  rankMin: number
  rankMax: number
  occMin: number       // approximate lower bound from BGVB
  occMax: number       // approximate upper bound from BGVB
  pages: string        // BGVB page reference, e.g. "p. 11" or "pp. 12–13"
}

export const VOCAB_LESSONS: VocabLesson[] = [
  { lesson: 1,  section: 'Section I-A',  rankMin: 1,   rankMax: 20,  occMin: 913,  occMax: 19783, pages: 'p. 11'     },
  { lesson: 2,  section: 'Section I-B',  rankMin: 21,  rankMax: 40,  occMin: 472,  occMax: 886,   pages: 'p. 11'     },
  { lesson: 3,  section: 'Section I-C',  rankMin: 41,  rankMax: 60,  occMin: 258,  occMax: 470,   pages: 'p. 12'     },
  { lesson: 4,  section: 'Section I-D',  rankMin: 61,  rankMax: 80,  occMin: 194,  occMax: 250,   pages: 'p. 12'     },
  { lesson: 5,  section: 'Section I-E',  rankMin: 81,  rankMax: 100, occMin: 156,  occMax: 192,   pages: 'pp. 12–13' },
  { lesson: 6,  section: 'Section I-F',  rankMin: 101, rankMax: 120, occMin: 140,  occMax: 156,   pages: 'p. 13'     },
  { lesson: 7,  section: 'Section I-G',  rankMin: 121, rankMax: 140, occMin: 117,  occMax: 139,   pages: 'pp. 13–14' },
  { lesson: 8,  section: 'Section I-H',  rankMin: 141, rankMax: 160, occMin: 102,  occMax: 116,   pages: 'p. 14'     },
  { lesson: 9,  section: 'Section II-A', rankMin: 161, rankMax: 180, occMin: 95,   occMax: 101,   pages: 'p. 15'     },
  { lesson: 10, section: 'Section II-B', rankMin: 181, rankMax: 200, occMin: 86,   occMax: 94,    pages: 'pp. 15–16' },
  { lesson: 11, section: 'Section II-C', rankMin: 201, rankMax: 220, occMin: 77,   occMax: 84,    pages: 'p. 16'     },
  { lesson: 12, section: 'Section II-D', rankMin: 221, rankMax: 240, occMin: 69,   occMax: 77,    pages: 'p. 16'     },
  { lesson: 13, section: 'Section II-E', rankMin: 241, rankMax: 260, occMin: 63,   occMax: 68,    pages: 'pp. 16–17' },
  { lesson: 14, section: 'Section II-F', rankMin: 261, rankMax: 280, occMin: 59,   occMax: 62,    pages: 'p. 17'     },
  { lesson: 15, section: 'Section II-G', rankMin: 281, rankMax: 300, occMin: 53,   occMax: 58,    pages: 'p. 17'     },
  { lesson: 16, section: 'Section II-H', rankMin: 301, rankMax: 320, occMin: 50,   occMax: 53,    pages: 'pp. 17–18' },
]

/** Return the BGVB lesson for week N (1-indexed) in a Beginning-level semester schedule, or null if out of range. */
export function getLessonForWeek(week: number): VocabLesson | null {
  return VOCAB_LESSONS.find(l => l.lesson === week) ?? null
}
