// Which morphology vocabulary a corpus speaks. Construct search builds one term card, and the
// card asks this what to offer: Greek declines for case and conjugates for tense/voice/mood,
// Hebrew declines for state and conjugates by stem, and the two share no category but number,
// gender and person. Everything language-specific the builder needs is behind this one interface,
// so adding a third script later means adding a vocabulary, not editing the card.

import {
  AGREEMENT_CATEGORIES, categoriesFor, FEATURE_LABEL, POS_FEATURES,
  type MorphFeature, type MorphGroup,
} from './morph-features'
import {
  HEBREW_AGREEMENT_CATEGORIES, hebrewCategoriesFor, HEBREW_FEATURE_LABEL, HEBREW_POS_FEATURES,
} from './morph-features-hebrew'

export interface MorphVocab {
  /** 'hebrew' reads right-to-left and sets the Hebrew font; used for display decisions. */
  script: 'greek' | 'hebrew'
  posFeatures: MorphFeature[]
  /** The categories a given part of speech can take (Greek also varies by mood). */
  categoriesFor: (pos: string, moods?: string[]) => MorphGroup[]
  label: (value: string) => string
  agreementCategories: readonly string[]
  /** What the word field is called — a Hebrew term is keyed by its dictionary form too. */
  wordLabel: string
}

export const GREEK_VOCAB: MorphVocab = {
  script: 'greek',
  posFeatures: POS_FEATURES,
  categoriesFor: (pos, moods = []) => categoriesFor(pos, moods),
  label: v => FEATURE_LABEL.get(v) ?? v,
  agreementCategories: AGREEMENT_CATEGORIES,
  wordLabel: 'Greek word',
}

export const HEBREW_VOCAB: MorphVocab = {
  script: 'hebrew',
  posFeatures: HEBREW_POS_FEATURES,
  categoriesFor: pos => hebrewCategoriesFor(pos),
  label: v => HEBREW_FEATURE_LABEL.get(v) ?? v,
  agreementCategories: HEBREW_AGREEMENT_CATEGORIES,
  wordLabel: 'Hebrew word',
}

/** The Masoretic Text is the one Hebrew corpus; everything else here is Greek. */
export function vocabFor(corpus: string): MorphVocab {
  return corpus === 'MT' ? HEBREW_VOCAB : GREEK_VOCAB
}
