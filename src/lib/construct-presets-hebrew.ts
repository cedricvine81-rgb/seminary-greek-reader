// Worked Hebrew constructs, the counterpart to construct-presets.ts. Clicking one loads it into
// the builder, where it can be edited, re-scoped, or run over a single book.
//
// Every count below was measured against the Masoretic Text with this engine before being
// listed, so a wrong result shows up as a wrong number rather than a plausible one.
//
// Two things about Hebrew make these possible at all: the MT index is built per MORPHEME, so the
// prefixed article, waw and prepositions are searchable even though they are not separate words;
// and OSHB tags STATE, so a noun bound to what follows it (construct) is distinguishable from one
// standing free (absolute). Distance is still counted in written words, so a prefix and its host
// are zero apart.

import type { ConstructQuery, ConstructTerm } from './construct-query'
import type { ConstructPreset, PresetGroup } from './construct-presets'

const base = { ordered: true, sameVerse: false }

const noun = (extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: ['noun'], ...extra } })
const verb = (extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: ['verb'], ...extra } })
const pos = (p: string, extra: Record<string, string[]> = {}): ConstructTerm =>
  ({ features: { pos: [p], ...extra } })

export const HEBREW_CONSTRUCT_PRESETS: PresetGroup[] = [
  {
    id: 'the-construct-chain',
    heading: 'The construct chain',
    presets: [
      {
        id: 'construct-chain-noun-of-noun',
        label: 'Construct chain (noun of noun)',
        note: 'A noun in the construct state bound to the noun after it — "the word OF the LORD". The commonest structure in Hebrew, and the one students most need to see in quantity.',
        approx: 13085,
        query: { ...base, within: 1, terms: [noun({ state: ['construct'] }), noun()] },
      },
      {
        id: 'three-member-chain',
        label: 'Three-member chain',
        note: 'Two construct nouns in a row before the absolute one — "the house of the father of the boy". Chains longer than two links are where translation goes wrong.',
        approx: 3471,
        query: { ...base, within: 2, terms: [noun({ state: ['construct'] }), noun({ state: ['construct'] }), noun()] },
      },
      {
        id: 'construct-before-a-proper-noun',
        label: 'Construct before a proper noun',
        note: 'A bound noun before a name — "the God OF Israel", "the man OF God". The second element is definite by nature, so the whole chain is definite.',
        approx: 8012,
        query: { ...base, within: 1, terms: [noun({ state: ['construct'] }), pos('proper noun')] },
      },
    ],
  },
  {
    id: 'the-narrative-backbone',
    heading: 'The narrative backbone',
    presets: [
      {
        id: 'wayyiqtol-sequential-imperfect',
        label: 'Wayyiqtol (sequential imperfect)',
        note: 'The verb form that carries Hebrew narrative — "and he said", "and they went". Reading a chain of these is reading the story’s spine.',
        approx: 8001,
        query: { ...base, within: 1, terms: [verb({ conjugation: ['sequential imperfect'] })] },
      },
      {
        id: 'weqatal-sequential-perfect',
        label: 'Weqatal (sequential perfect)',
        note: 'The perfect with waw that continues an imperfect or an imperative — the future/habitual counterpart to wayyiqtol, and the backbone of legal and prophetic material.',
        approx: 3397,
        query: { ...base, within: 1, terms: [verb({ conjugation: ['sequential perfect'] })] },
      },
      {
        id: 'two-wayyiqtols-in-a-row',
        label: 'Two wayyiqtols in a row',
        note: 'Consecutive narrative verbs within a few words — the pattern that makes a sequence of events. Widen the distance to catch looser chains.',
        approx: 3124,
        query: { ...base, within: 4, terms: [verb({ conjugation: ['sequential imperfect'] }), verb({ conjugation: ['sequential imperfect'] })] },
      },
    ],
  },
  {
    id: 'verbal-syntax',
    heading: 'Verbal syntax',
    presets: [
      {
        id: 'l-infinitive-construct-purpose',
        label: 'ל + infinitive construct (purpose)',
        note: 'The commonest way Hebrew says "in order to". The ל is a prefix, not a separate word, so this only works because the text is indexed by morpheme.',
        approx: 4857,
        query: { ...base, within: 1, terms: [pos('preposition'), verb({ conjugation: ['infinitive construct'] })] },
      },
      {
        id: 'infinitive-absolute-finite-verb',
        label: 'Infinitive absolute + finite verb',
        note: 'The emphatic construction — "you shall SURELY die". Classically the two share a root; this finds the shape, and the pairs worth discussing are easy to spot in the results.',
        approx: 442,
        query: { ...base, within: 2, terms: [verb({ conjugation: ['infinitive absolute'] }), verb({ conjugation: ['perfect', 'imperfect'] })] },
      },
      {
        id: 'participle-personal-pronoun',
        label: 'Participle + personal pronoun',
        note: 'The durative present — "I am doing", "you are going". Hebrew has no present tense, so this construction does the work.',
        approx: 325,
        query: { ...base, within: 2, terms: [verb({ conjugation: ['active participle'] }), pos('personal pronoun')] },
      },
      {
        id: 'prohibition-al-jussive',
        label: 'Prohibition: אַל + jussive',
        note: 'The immediate prohibition ("do not do it now"), against לֹא + imperfect below — the difference students routinely flatten in translation.',
        approx: 534,
        query: { ...base, within: 2, terms: [{ features: { pos: ['negative particle'] }, strongs: ['408'] }, verb({ conjugation: ['jussive'] })] },
      },
      {
        id: 'prohibition-la-imperfect',
        label: 'Prohibition: לֹא + imperfect',
        note: 'The absolute, permanent prohibition — the form of the Ten Commandments. Compare the count and the tone with the jussive above.',
        approx: 2135,
        query: { ...base, within: 2, terms: [{ features: { pos: ['negative particle'] }, strongs: ['3808'] }, verb({ conjugation: ['imperfect'] })] },
      },
      {
        id: 'cohortative-let-me-let-us',
        label: 'Cohortative (let me / let us)',
        note: 'First-person volition — resolve, request, or self-encouragement.',
        approx: 424,
        query: { ...base, within: 1, terms: [verb({ conjugation: ['cohortative'] })] },
      },
    ],
  },
  {
    id: 'agreement-and-attribution',
    heading: 'Agreement and attribution',
    presets: [
      {
        id: 'noun-agreeing-adjective',
        label: 'Noun + agreeing adjective',
        note: 'The adjective follows its noun and agrees in gender and number — "a great city". Agreement is what tells you which noun it belongs to.',
        approx: 2179,
        query: {
          ...base,
          within: 1,
          terms: [noun(), { features: { pos: ['adjective'] }, agreeWith: 0, agreeOn: ['gender', 'number'] }],
        },
      },
      {
        id: 'article-noun-article-adjective',
        label: 'Article + noun + article + adjective',
        note: 'Both definite: the adjective is ATTRIBUTIVE ("the great city"). Contrast the same pair with the article on the noun only, which is predicate ("the city is great").',
        approx: 626,
        query: {
          ...base,
          within: 3,
          terms: [pos('article'), noun(), pos('article'), { features: { pos: ['adjective'] } }],
        },
      },
    ],
  },
  {
    id: 'particles-worth-tracing',
    heading: 'Particles worth tracing',
    presets: [
      {
        id: 'at-definite-noun',
        label: 'אֵת + definite noun',
        note: 'The direct-object marker before a definite object — the clearest signal of what a verb is acting on.',
        approx: 2529,
        query: { ...base, within: 2, terms: [pos('direct object marker'), pos('article'), noun()] },
      },
      {
        id: 'pronominal-suffix-on-a-noun',
        label: 'Pronominal suffix on a noun',
        note: 'Hebrew possession — "his word", "my people". The suffix is part of the written word, reachable here because suffixes are indexed as morphemes.',
        approx: 14442,
        query: { ...base, within: 1, terms: [noun(), pos('pronominal suffix')] },
      },
      {
        id: 'directional-he',
        label: 'Directional he',
        note: 'The ־ָה ending meaning "toward" — "to Egypt", "southward". Easy to miss and easy to mistranslate as a feminine ending.',
        approx: 925,
        query: { ...base, within: 1, terms: [pos('directional he')] },
      },
    ],
  },
]

export const ALL_HEBREW_PRESETS: ConstructPreset[] = HEBREW_CONSTRUCT_PRESETS.flatMap(g => g.presets)

/** The presets for a corpus: Hebrew for the MT, Greek everywhere else. */
export function presetsFor(corpus: string): PresetGroup[] | null {
  return corpus === 'MT' ? HEBREW_CONSTRUCT_PRESETS : null
}

export type { ConstructQuery }
