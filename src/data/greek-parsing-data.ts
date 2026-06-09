/**
 * Curated Greek parsing data for morphology quizzes.
 * Each entry represents one inflected form with its full parsing.
 */

export interface GreekParseEntry {
  surface: string       // The inflected Greek form shown to the student
  lexeme: string        // Dictionary/lexical form
  gloss: string         // English meaning of the lexeme
  partOfSpeech: 'Verb' | 'Noun' | 'Adjective' | 'Pronoun'
  // Verb fields
  tense?: string
  voice?: string
  mood?: string
  person?: string
  // Shared
  number?: string
  // Noun/Adj/Pronoun fields
  casus?: string        // case (renamed to avoid JS reserved word)
  gender?: string
  reference?: string    // Optional NT reference
}

// ─── VERBS ────────────────────────────────────────────────────────────────────

export const VERB_PARSES: GreekParseEntry[] = [
  // ── λύω — Present Active Indicative ──
  { surface: 'λύω',       lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λύεις',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λύει',      lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'λύομεν',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'λύετε',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'λύουσιν',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Present Middle/Passive Indicative ──
  { surface: 'λύομαι',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Middle/Passive', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λύῃ',       lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Middle/Passive', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λύεται',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Middle/Passive', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'λυόμεθα',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Middle/Passive', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'λύεσθε',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Middle/Passive', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'λύονται',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Middle/Passive', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Present Active Subjunctive ──
  { surface: 'λύωμεν',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Plural' },
  { surface: 'λύητε',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Plural' },
  { surface: 'λύωσιν',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '3rd', number: 'Plural' },
  { surface: 'λύῃς',      lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Singular' },

  // ── λύω — Present Active Imperative ──
  { surface: 'λῦε',       lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Imperative', person: '2nd', number: 'Singular' },
  { surface: 'λυέτω',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Imperative', person: '3rd', number: 'Singular' },
  { surface: 'λύετε',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Imperative', person: '2nd', number: 'Plural' },

  // ── λύω — Present Active Infinitive ──
  { surface: 'λύειν',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Infinitive' },

  // ── λύω — Imperfect Active Indicative ──
  { surface: 'ἔλυον',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔλυες',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἔλυεν',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐλύομεν',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἐλύετε',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἔλυον',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Imperfect Middle/Passive Indicative ──
  { surface: 'ἐλυόμην',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Middle/Passive', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἐλύου',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Middle/Passive', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἐλύετο',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Middle/Passive', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐλυόμεθα',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Middle/Passive', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἐλύεσθε',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Middle/Passive', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἐλύοντο',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Middle/Passive', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Future Active Indicative ──
  { surface: 'λύσω',      lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λύσεις',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λύσει',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'λύσομεν',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'λύσετε',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'λύσουσιν',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Future Middle Indicative ──
  { surface: 'λύσομαι',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λύσῃ',      lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λύσεται',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '3rd', number: 'Singular' },

  // ── λύω — Future Passive Indicative ──
  { surface: 'λυθήσομαι', lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Passive', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λυθήσῃ',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Passive', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λυθήσεται', lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Future', voice: 'Passive', mood: 'Indicative', person: '3rd', number: 'Singular' },

  // ── λύω — Aorist Active Indicative ──
  { surface: 'ἔλυσα',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔλυσας',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἔλυσεν',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐλύσαμεν',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἐλύσατε',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἔλυσαν',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Aorist Passive Indicative ──
  { surface: 'ἐλύθην',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἐλύθης',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἐλύθη',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐλύθημεν',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἐλύθητε',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἐλύθησαν',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Aorist Active Subjunctive ──
  { surface: 'λύσω',      lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Singular' },
  { surface: 'λύσῃς',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Singular' },
  { surface: 'λύσῃ',      lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '3rd', number: 'Singular' },
  { surface: 'λύσωμεν',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Plural' },
  { surface: 'λύσητε',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Plural' },
  { surface: 'λύσωσιν',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '3rd', number: 'Plural' },

  // ── λύω — Aorist Active Imperative ──
  { surface: 'λῦσον',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Imperative', person: '2nd', number: 'Singular' },
  { surface: 'λυσάτω',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Imperative', person: '3rd', number: 'Singular' },
  { surface: 'λύσατε',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Imperative', person: '2nd', number: 'Plural' },

  // ── λύω — Aorist Active Infinitive ──
  { surface: 'λῦσαι',     lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Infinitive' },

  // ── λύω — Perfect Active Indicative ──
  { surface: 'λέλυκα',    lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λέλυκας',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λέλυκεν',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'λελύκαμεν', lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'λελύκατε',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'λελύκασιν', lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── λύω — Perfect Middle/Passive Indicative ──
  { surface: 'λέλυμαι',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Middle/Passive', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λέλυσαι',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Middle/Passive', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λέλυται',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Middle/Passive', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'λελύμεθα',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Middle/Passive', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'λέλυσθε',   lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Middle/Passive', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'λέλυνται',  lexeme: 'λύω', gloss: 'loose, destroy', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Middle/Passive', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── εἰμί — Present Indicative ──
  { surface: 'εἰμί',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'εἶ',    lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἐστίν', lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐσμέν', lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἐστέ',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'εἰσίν', lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── εἰμί — Imperfect Indicative ──
  { surface: 'ἤμην',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἦς',    lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἦν',    lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἦμεν',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἦτε',   lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἦσαν',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── εἰμί — Present Subjunctive ──
  { surface: 'ὦ',     lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Singular' },
  { surface: 'ᾖς',    lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Singular' },
  { surface: 'ᾖ',     lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '3rd', number: 'Singular' },
  { surface: 'ὦμεν',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Plural' },
  { surface: 'ἦτε',   lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Plural' },
  { surface: 'ὦσιν',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '3rd', number: 'Plural' },

  // ── εἰμί — Future Indicative ──
  { surface: 'ἔσομαι',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔσῃ',     lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἔσται',   lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐσόμεθα', lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἔσεσθε',  lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἔσονται', lexeme: 'εἰμί', gloss: 'be, exist', partOfSpeech: 'Verb', tense: 'Future', voice: 'Middle', mood: 'Indicative', person: '3rd', number: 'Plural' },

  // ── πιστεύω (believe) — key forms ──
  { surface: 'πιστεύω',      lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular', reference: 'John 9:38' },
  { surface: 'πιστεύεις',    lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'πιστεύει',     lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular', reference: 'John 3:16' },
  { surface: 'πιστεύομεν',   lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'πιστεύετε',    lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Imperative', person: '2nd', number: 'Plural' },
  { surface: 'ἐπίστευσα',    lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἐπίστευσας',   lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἐπίστευσεν',   lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἐπιστεύσαμεν', lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'πιστεύσωμεν',  lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Plural' },
  { surface: 'πεπίστευκα',   lexeme: 'πιστεύω', gloss: 'believe, trust', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },

  // ── ἀγαπάω (love) — key forms ──
  { surface: 'ἀγαπῶ',        lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular', reference: 'John 14:31' },
  { surface: 'ἀγαπᾷς',       lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular', reference: 'John 21:16' },
  { surface: 'ἀγαπᾷ',        lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἀγαπῶμεν',     lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Plural', reference: '1 John 4:7' },
  { surface: 'ἀγαπᾶτε',      lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Imperative', person: '2nd', number: 'Plural' },
  { surface: 'ἠγάπησεν',     lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular', reference: 'John 3:16' },
  { surface: 'ἠγαπήθητε',    lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἠγάπηκα',      lexeme: 'ἀγαπάω', gloss: 'love', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },

  // ── λέγω (say) — key forms ──
  { surface: 'λέγω',    lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'λέγεις',  lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'λέγει',   lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'λέγομεν', lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'λέγετε',  lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'λέγουσιν',lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'ἔλεγον',  lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'εἶπεν',   lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'εἴπωμεν', lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '1st', number: 'Plural' },
  { surface: 'εἶπον',   lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'εἰπεῖν',  lexeme: 'λέγω', gloss: 'say, speak', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Infinitive' },

  // ── γινώσκω (know) — key forms ──
  { surface: 'γινώσκω',    lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'γινώσκεις',  lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'γινώσκει',   lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἔγνων',      lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔγνωτε',     lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἔγνωσαν',    lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'ἐγνώσθη',    lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Passive', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'γνῶναι',     lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Infinitive' },
  { surface: 'ἔγνωκα',     lexeme: 'γινώσκω', gloss: 'know, understand', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },

  // ── ἔχω (have) — key forms ──
  { surface: 'ἔχω',    lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔχεις',  lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ἔχει',   lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ἔχομεν', lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ἔχετε',  lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ἔχουσιν',lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'εἶχον',  lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'ἕξω',    lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Future', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔσχον',  lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ἔσχεν',  lexeme: 'ἔχω', gloss: 'have, hold', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },

  // ── ποιέω (do, make) — key forms ──
  { surface: 'ποιῶ',     lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Singular' },
  { surface: 'ποιεῖς',   lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Singular' },
  { surface: 'ποιεῖ',    lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
  { surface: 'ποιοῦμεν', lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '1st', number: 'Plural' },
  { surface: 'ποιεῖτε',  lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '2nd', number: 'Plural' },
  { surface: 'ποιοῦσιν', lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Present', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'ἐποίουν',  lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Imperfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Plural' },
  { surface: 'ἐποίησεν', lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular', reference: 'John 2:11' },
  { surface: 'ποιήσητε', lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Aorist', voice: 'Active', mood: 'Subjunctive', person: '2nd', number: 'Plural' },
  { surface: 'πεποίηκεν',lexeme: 'ποιέω', gloss: 'do, make', partOfSpeech: 'Verb', tense: 'Perfect', voice: 'Active', mood: 'Indicative', person: '3rd', number: 'Singular' },
]

// ─── NOUNS ─────────────────────────────────────────────────────────────────────

export const NOUN_PARSES: GreekParseEntry[] = [
  // ── λόγος (word) — 2nd declension masculine ──
  { surface: 'λόγος',  lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Masculine', number: 'Singular' },
  { surface: 'λόγε',   lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Vocative',   gender: 'Masculine', number: 'Singular' },
  { surface: 'λόγου',  lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Masculine', number: 'Singular' },
  { surface: 'λόγῳ',   lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Masculine', number: 'Singular' },
  { surface: 'λόγον',  lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Masculine', number: 'Singular' },
  { surface: 'λόγοι',  lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Masculine', number: 'Plural' },
  { surface: 'λόγων',  lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Masculine', number: 'Plural' },
  { surface: 'λόγοις', lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Masculine', number: 'Plural' },
  { surface: 'λόγους', lexeme: 'λόγος', gloss: 'word, reason', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Masculine', number: 'Plural' },

  // ── ἔργον (work) — 2nd declension neuter ──
  { surface: 'ἔργον',  lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἔργου',  lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἔργῳ',   lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἔργον',  lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἔργα',   lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Neuter',    number: 'Plural' },
  { surface: 'ἔργων',  lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Neuter',    number: 'Plural' },
  { surface: 'ἔργοις', lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Neuter',    number: 'Plural' },
  { surface: 'ἔργα',   lexeme: 'ἔργον', gloss: 'work, deed', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Neuter',    number: 'Plural' },

  // ── ἁμαρτία (sin) — 1st declension feminine ──
  { surface: 'ἁμαρτία',   lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Singular' },
  { surface: 'ἁμαρτίας',  lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Singular' },
  { surface: 'ἁμαρτίᾳ',   lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Singular' },
  { surface: 'ἁμαρτίαν',  lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Singular' },
  { surface: 'ἁμαρτίαι',  lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Plural' },
  { surface: 'ἁμαρτιῶν',  lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Plural' },
  { surface: 'ἁμαρτίαις', lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Plural' },
  { surface: 'ἁμαρτίας',  lexeme: 'ἁμαρτία', gloss: 'sin', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Plural' },

  // ── ψυχή (soul) — 1st declension feminine ──
  { surface: 'ψυχή',   lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Singular' },
  { surface: 'ψυχῆς',  lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Singular' },
  { surface: 'ψυχῇ',   lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Singular' },
  { surface: 'ψυχήν',  lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Singular' },
  { surface: 'ψυχαί',  lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Plural' },
  { surface: 'ψυχῶν',  lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Plural' },
  { surface: 'ψυχαῖς', lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Plural' },
  { surface: 'ψυχάς',  lexeme: 'ψυχή', gloss: 'soul, life', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Plural' },

  // ── πίστις (faith) — 3rd declension feminine (i-stem) ──
  { surface: 'πίστις',  lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Singular' },
  { surface: 'πίστεως', lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Singular' },
  { surface: 'πίστει',  lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Singular' },
  { surface: 'πίστιν',  lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Singular' },
  { surface: 'πίστεις', lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Plural' },
  { surface: 'πίστεων', lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Plural' },
  { surface: 'πίστεσιν',lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Plural' },
  { surface: 'πίστεις', lexeme: 'πίστις', gloss: 'faith, trust', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Plural' },

  // ── σάρξ (flesh) — 3rd declension feminine ──
  { surface: 'σάρξ',   lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Singular' },
  { surface: 'σαρκός', lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Singular' },
  { surface: 'σαρκί',  lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Singular' },
  { surface: 'σάρκα',  lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Singular' },
  { surface: 'σάρκες', lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Feminine', number: 'Plural' },
  { surface: 'σαρκῶν', lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Feminine', number: 'Plural' },
  { surface: 'σαρξίν', lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Feminine', number: 'Plural' },
  { surface: 'σάρκας', lexeme: 'σάρξ', gloss: 'flesh, body', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Feminine', number: 'Plural' },

  // ── πνεῦμα (spirit) — 3rd declension neuter ──
  { surface: 'πνεῦμα',   lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Neuter', number: 'Singular' },
  { surface: 'πνεύματος',lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Neuter', number: 'Singular' },
  { surface: 'πνεύματι', lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Neuter', number: 'Singular' },
  { surface: 'πνεῦμα',   lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Neuter', number: 'Singular' },
  { surface: 'πνεύματα', lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Nominative', gender: 'Neuter', number: 'Plural' },
  { surface: 'πνευμάτων',lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Genitive',   gender: 'Neuter', number: 'Plural' },
  { surface: 'πνεύμασιν',lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Dative',     gender: 'Neuter', number: 'Plural' },
  { surface: 'πνεύματα', lexeme: 'πνεῦμα', gloss: 'spirit, breath', partOfSpeech: 'Noun', casus: 'Accusative', gender: 'Neuter', number: 'Plural' },
]

// ─── ADJECTIVES ───────────────────────────────────────────────────────────────

export const ADJECTIVE_PARSES: GreekParseEntry[] = [
  // ── ἀγαθός (good) — 2-1-2 declension ──
  { surface: 'ἀγαθός',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Masculine', number: 'Singular' },
  { surface: 'ἀγαθοῦ',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Masculine', number: 'Singular' },
  { surface: 'ἀγαθῷ',   lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Masculine', number: 'Singular' },
  { surface: 'ἀγαθόν',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Masculine', number: 'Singular' },
  { surface: 'ἀγαθή',   lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἀγαθῆς',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἀγαθῇ',   lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἀγαθήν',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἀγαθόν',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἀγαθοῦ',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἀγαθῷ',   lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἀγαθοί',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Masculine', number: 'Plural' },
  { surface: 'ἀγαθῶν',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Masculine', number: 'Plural' },
  { surface: 'ἀγαθοῖς', lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Masculine', number: 'Plural' },
  { surface: 'ἀγαθούς', lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Masculine', number: 'Plural' },
  { surface: 'ἀγαθαί',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'ἀγαθῶν',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Feminine',  number: 'Plural' },
  { surface: 'ἀγαθαῖς', lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Feminine',  number: 'Plural' },
  { surface: 'ἀγαθάς',  lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'ἀγαθά',   lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Neuter',    number: 'Plural' },
  { surface: 'ἀγαθά',   lexeme: 'ἀγαθός', gloss: 'good', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Neuter',    number: 'Plural' },

  // ── πιστός (faithful) — 2-1-2 declension ──
  { surface: 'πιστός',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Masculine', number: 'Singular' },
  { surface: 'πιστοῦ',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Masculine', number: 'Singular' },
  { surface: 'πιστῷ',   lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Masculine', number: 'Singular' },
  { surface: 'πιστόν',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Masculine', number: 'Singular' },
  { surface: 'πιστή',   lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'πιστῆς',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Feminine',  number: 'Singular' },
  { surface: 'πιστῇ',   lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Feminine',  number: 'Singular' },
  { surface: 'πιστήν',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'πιστόν',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'πιστοί',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Masculine', number: 'Plural' },
  { surface: 'πιστῶν',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Genitive',   gender: 'Masculine', number: 'Plural' },
  { surface: 'πιστοῖς', lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Dative',     gender: 'Masculine', number: 'Plural' },
  { surface: 'πιστούς', lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Accusative', gender: 'Masculine', number: 'Plural' },
  { surface: 'πισταί',  lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'πιστά',   lexeme: 'πιστός', gloss: 'faithful, believing', partOfSpeech: 'Adjective', casus: 'Nominative', gender: 'Neuter',    number: 'Plural' },
]

// ─── PRONOUNS ─────────────────────────────────────────────────────────────────

export const PRONOUN_PARSES: GreekParseEntry[] = [
  // ── αὐτός (he/she/it/same) ──
  { surface: 'αὐτός',  lexeme: 'αὐτός', gloss: 'he, him, same', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Masculine', number: 'Singular' },
  { surface: 'αὐτοῦ',  lexeme: 'αὐτός', gloss: 'he, him, same', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Masculine', number: 'Singular' },
  { surface: 'αὐτῷ',   lexeme: 'αὐτός', gloss: 'he, him, same', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Masculine', number: 'Singular' },
  { surface: 'αὐτόν',  lexeme: 'αὐτός', gloss: 'he, him, same', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Masculine', number: 'Singular' },
  { surface: 'αὐτή',   lexeme: 'αὐτός', gloss: 'she, her, same', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'αὐτῆς',  lexeme: 'αὐτός', gloss: 'she, her, same', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Feminine',  number: 'Singular' },
  { surface: 'αὐτῇ',   lexeme: 'αὐτός', gloss: 'she, her, same', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Feminine',  number: 'Singular' },
  { surface: 'αὐτήν',  lexeme: 'αὐτός', gloss: 'she, her, same', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'αὐτό',   lexeme: 'αὐτός', gloss: 'it, same', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'αὐτοῦ',  lexeme: 'αὐτός', gloss: 'it, same', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Neuter',    number: 'Singular' },
  { surface: 'αὐτῷ',   lexeme: 'αὐτός', gloss: 'it, same', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Neuter',    number: 'Singular' },
  { surface: 'αὐτό',   lexeme: 'αὐτός', gloss: 'it, same', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'αὐτοί',  lexeme: 'αὐτός', gloss: 'they (m), same', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Masculine', number: 'Plural' },
  { surface: 'αὐτῶν',  lexeme: 'αὐτός', gloss: 'their, same', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Masculine', number: 'Plural' },
  { surface: 'αὐτοῖς', lexeme: 'αὐτός', gloss: 'them, same', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Masculine', number: 'Plural' },
  { surface: 'αὐτούς', lexeme: 'αὐτός', gloss: 'them, same', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Masculine', number: 'Plural' },
  { surface: 'αὐταί',  lexeme: 'αὐτός', gloss: 'they (f), same', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'αὐτῶν',  lexeme: 'αὐτός', gloss: 'their (f), same', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Feminine',  number: 'Plural' },
  { surface: 'αὐταῖς', lexeme: 'αὐτός', gloss: 'them (f), same', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Feminine',  number: 'Plural' },
  { surface: 'αὐτάς',  lexeme: 'αὐτός', gloss: 'them (f), same', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Feminine',  number: 'Plural' },

  // ── οὗτος (this) — demonstrative ──
  { surface: 'οὗτος',  lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Masculine', number: 'Singular' },
  { surface: 'τούτου', lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Masculine', number: 'Singular' },
  { surface: 'τούτῳ',  lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Masculine', number: 'Singular' },
  { surface: 'τοῦτον', lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Masculine', number: 'Singular' },
  { surface: 'αὕτη',   lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'ταύτης', lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Feminine',  number: 'Singular' },
  { surface: 'ταύτῃ',  lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Feminine',  number: 'Singular' },
  { surface: 'ταύτην', lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'τοῦτο',  lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'τούτου', lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Neuter',    number: 'Singular' },
  { surface: 'τούτῳ',  lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Neuter',    number: 'Singular' },
  { surface: 'τοῦτο',  lexeme: 'οὗτος', gloss: 'this', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'οὗτοι',  lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Masculine', number: 'Plural' },
  { surface: 'τούτων', lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Masculine', number: 'Plural' },
  { surface: 'τούτοις',lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Masculine', number: 'Plural' },
  { surface: 'τούτους',lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Masculine', number: 'Plural' },
  { surface: 'αὗται',  lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'ταύτας', lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'ταῦτα',  lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Neuter',    number: 'Plural' },
  { surface: 'ταῦτα',  lexeme: 'οὗτος', gloss: 'these', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Neuter',    number: 'Plural' },

  // ── ἐκεῖνος (that) — demonstrative ──
  { surface: 'ἐκεῖνος',  lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Masculine', number: 'Singular' },
  { surface: 'ἐκείνου',  lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Masculine', number: 'Singular' },
  { surface: 'ἐκείνῳ',   lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Masculine', number: 'Singular' },
  { surface: 'ἐκεῖνον',  lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Masculine', number: 'Singular' },
  { surface: 'ἐκείνη',   lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἐκείνης',  lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἐκείνῃ',   lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἐκείνην',  lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Feminine',  number: 'Singular' },
  { surface: 'ἐκεῖνο',   lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἐκεῖνο',   lexeme: 'ἐκεῖνος', gloss: 'that', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Neuter',    number: 'Singular' },
  { surface: 'ἐκεῖνοι',  lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Masculine', number: 'Plural' },
  { surface: 'ἐκείνων',  lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Genitive',   gender: 'Masculine', number: 'Plural' },
  { surface: 'ἐκείνοις', lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Dative',     gender: 'Masculine', number: 'Plural' },
  { surface: 'ἐκείνους', lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Masculine', number: 'Plural' },
  { surface: 'ἐκεῖναι',  lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'ἐκείνας',  lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Accusative', gender: 'Feminine',  number: 'Plural' },
  { surface: 'ἐκεῖνα',   lexeme: 'ἐκεῖνος', gloss: 'those', partOfSpeech: 'Pronoun', casus: 'Nominative', gender: 'Neuter',    number: 'Plural' },
]
