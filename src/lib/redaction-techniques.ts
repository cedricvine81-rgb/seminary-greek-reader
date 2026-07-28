// Editorial-technique key for the Synopsis tab's Compare mode. Two tiers:
//  1. Word-level paraphrase modes — Theon's closed list from his chapter On Paraphrase —
//     which the compare engine detects automatically and color-codes.
//  2. Narrative-level compositional devices — the categories Michael Licona documents
//     from Plutarch and the rhetorical handbooks (Jesus, Contradicted, 2024; Why Are
//     There Differences in the Gospels?, 2017) — which operate above the word level and
//     must be judged from the colored evidence, not computed from it.
// All descriptions are original wording; sources are cited for study.

import type { RedactionTag } from './redaction-compare'
import type { ProsePassageTarget } from './prose-panel-bus'

/** A citation. `passage` means the work is embedded in this app, so the key can open it in
 *  the side panel instead of sending the student to an external site; `url` is the fallback
 *  for sources we don't hold (the Armenian-only chapters, the modern monographs). */
export type TechniqueRef = { label: string; url?: string; passage?: ProsePassageTarget }

export type WordLevelTechnique = {
  tag: RedactionTag | 'omitted'
  name: string
  ancient: string          // the ancient term / where it comes from
  description: string
  example: string          // an NT illustration
  refs: TechniqueRef[]
}

/** The narrative-level device vocabulary — shared with the per-pericope annotations
 *  (redaction-annotations.ts) so chips and key entries stay in sync. */
export type NarrativeDeviceName =
  | 'Paraphrase' | 'Compression' | 'Transferal' | 'Displacement'
  | 'Conflation' | 'Spotlighting' | 'Simplification' | 'Expansion of narrative details'

export type NarrativeTechnique = {
  name: NarrativeDeviceName
  description: string
  example: string
  lookFor: string          // how it shows up in the color-coding
  refs: TechniqueRef[]
}

// Public, stable sources: Quintilian in H. E. Butler's public-domain Loeb translation
// (Perseus / LacusCurtius).
//
// THEON — two different citations, because his text is transmitted in two states:
//  • The Greek breaks off in the chapter on law; everything up to there survives in Greek
//    (Walz), and we host it ourselves — so the chreia exercises below link into our reader.
//  • The closing pedagogical chapters (reading, listening, PARAPHRASE, elaboration,
//    contradiction) are lost in Greek and survive only in a classical-Armenian version;
//    the standard English of those is Kennedy (SBL 2003), under copyright.
// Spengel/Walz page numbers therefore exist only for the Greek-extant part: do NOT attach
// one to the paraphrase chapter (an earlier revision of this file wrongly cited it as
// "101.7–9").
/** The source of the four modes — and the one Theon chapter we cannot show, since the
 *  Greek is lost and only a classical-Armenian version survives (the standard English of
 *  it, Kennedy's SBL 2003, is under copyright). Deliberately label-only: a blue link that
 *  led to a book the student can't read was worse than a plain scholarly note, and every
 *  Theon citation that CAN be opened now opens our own translation. */
const THEON_PARAPHRASE: TechniqueRef = {
  label: 'Theon, Progymnasmata, On Paraphrase — Greek lost, extant only in Armenian (Eng. trans. Kennedy, SBL 2003)',
}
/** The chreia exercises — extant in Greek, and readable in this app. */
const THEON_CHREIA: TechniqueRef = {
  label: 'Theon, Progymnasmata, On the Chreia',
  passage: { source: 'theon-progymnasmata', chapter: 5, verse: 4, label: 'Theon, Progymnasmata', cite: 'On the Chreia — the exercises' },
}
/** Theon's own defence of paraphrase, with his worked examples of ancient authors
 *  reshaping Homer and one another — the closest thing in the surviving Greek to the lost
 *  chapter, and the theoretical warrant for this whole tab. */
const THEON_PROEM: TechniqueRef = {
  label: 'Theon, Progymnasmata, Proem — on the usefulness of paraphrase',
  passage: { source: 'theon-progymnasmata', chapter: 1, verse: 2, label: 'Theon, Progymnasmata', cite: 'Proem — paraphrase and its examples' },
}
const QUINT_1_9: TechniqueRef = {
  label: 'Quintilian, Institutio Oratoria 1.9.2',
  passage: { source: 'quintilian-1', chapter: 9, verse: 1, label: 'Quintilian, Institutio Oratoria', cite: '1.9.2' },
}
const QUINT_10_5: TechniqueRef = {
  label: 'Quintilian, Institutio Oratoria 10.5.4–11',
  passage: { source: 'quintilian-10', chapter: 5, verse: 1, label: 'Quintilian, Institutio Oratoria', cite: '10.5.4–11' },
}
const LICONA_JC = {
  label: 'Licona, Jesus, Contradicted (Zondervan, 2024)',
  url: 'https://zondervanacademic.com/products/jesus-contradicted',
}
const LICONA_WD = {
  label: 'Licona, Why Are There Differences in the Gospels? (Oxford, 2017)',
  url: 'https://global.oup.com/academic/product/why-are-there-differences-in-the-gospels-9780190264260',
}

/** Theon names exactly four modes of paraphrase, "plus combinations of these" — so the
 *  five entries below (four modes, with word-order recast split out of "variation" for
 *  display) cover his list completely. */
export const WORD_LEVEL: WordLevelTechnique[] = [
  {
    tag: 'form',
    name: 'Variation in syntax',
    ancient: 'Theon’s first mode of paraphrase',
    description:
      'The same word kept, but its grammatical form changed — a different tense, mood, case, or number. Mark’s vivid historical presents becoming aorists in Matthew and Luke is the classic Gospel example.',
    example: 'Mark 1:12 ἐκβάλλει (present, “drives out”) → Matt 4:1 ἀνήχθη (aorist).',
    refs: [THEON_PROEM, THEON_PARAPHRASE, QUINT_1_9],
  },
  {
    tag: 'moved',
    name: 'Word order / construction recast',
    ancient: 'Also “variation in syntax” (Theon)',
    description:
      'The same word retained but relocated — the clause has been rebuilt around it. Includes participles resolved into finite verbs and vice versa.',
    example: 'Mark 1:32 ὄψιας δὲ γενομένης kept by Matt 8:16 but re-positioned in the sentence.',
    refs: [THEON_PROEM, THEON_PARAPHRASE],
  },
  {
    tag: 'added',
    name: 'Addition (elaboration)',
    ancient: 'Theon’s second mode; Quintilian’s “embellish”',
    description:
      'Material with no counterpart in the source: an explanatory phrase, a fulfillment citation, a heightened detail. Quintilian tells students they may “add the vigour of oratory” and make good the source’s omissions.',
    example: 'Matt 3:17 adds ἰδού and λέγουσα to Mark 1:11’s account of the voice.',
    refs: [THEON_PROEM, THEON_PARAPHRASE, QUINT_10_5],
  },
  {
    tag: 'omitted',
    name: 'Subtraction (omission)',
    ancient: 'Theon’s third mode; Quintilian’s “abridge” / “prune”',
    description:
      'Source material dropped. Struck-through words in the source column were used by none of the compared columns. Wholesale omission across a passage shades into the narrative device of compression.',
    example: 'Matthew routinely drops Mark’s duplicate expressions (e.g. Mark 1:32 “when evening came, when the sun set” → Matt 8:16 keeps only the first).',
    refs: [THEON_PROEM, THEON_PARAPHRASE, QUINT_1_9],
  },
  {
    tag: 'subst',
    name: 'Substitution',
    ancient: 'Theon’s fourth mode',
    description:
      'A different word in the same slot: a synonym, a clarification, or a theological preference. Transferal of speech (a saying reworded from second to third person, or moved to another speaker) usually surfaces as a run of substitutions.',
    example: '“Kingdom of God” (Mark 4:30) → “kingdom of heaven” (Matt 13:31); Σὺ εἶ (Mark 1:11) → Οὗτός ἐστιν (Matt 3:17).',
    refs: [THEON_CHREIA, THEON_PROEM, THEON_PARAPHRASE, LICONA_JC],
  },
]

/** Licona's compositional devices operate at the level of the whole episode. The colors
 *  supply the evidence; identifying the device is the student's exegetical judgment. */
export const NARRATIVE_LEVEL: NarrativeTechnique[] = [
  {
    name: 'Paraphrase',
    description: 'Retelling in one’s own words while keeping the sense — the umbrella practice the school exercises trained. Every device below is a species of it.',
    example: 'Most triple-tradition pericopes show 40–80% verbal retention with steady recasting of the remainder.',
    lookFor: 'A mix of every color at moderate density.',
    refs: [THEON_PROEM, THEON_PARAPHRASE, QUINT_10_5, LICONA_JC],
  },
  {
    name: 'Compression',
    description: 'Narrating an event as though it occupied less time, or trimming an episode to its core.',
    example: 'Matthew’s fig tree withers “at once” (Matt 21:19); Mark spreads the discovery over two days (Mark 11:12–21).',
    lookFor: 'Heavy strike-through in the source column with little added in the target.',
    refs: [LICONA_JC, LICONA_WD, QUINT_1_9],
  },
  {
    name: 'Transferal',
    description: 'Words or deeds belonging to one figure attributed to another, often to streamline the cast.',
    example: 'The centurion asks Jesus directly in Matt 8:5–6; in Luke 7:3–6 he sends elders and friends.',
    lookFor: 'Substitutions clustered around speakers, names, and pronouns; person shifts in the verb forms.',
    refs: [LICONA_JC, LICONA_WD],
  },
  {
    name: 'Displacement',
    description: 'An event uprooted from its position in the source and replanted elsewhere in the narrative.',
    example: 'The temple cleansing opens Jesus’ ministry in John 2 but closes it in the Synoptics.',
    lookFor: 'Not visible inside one pericope — compare the pericope’s position across the Gospel parallels list.',
    refs: [LICONA_JC, LICONA_WD],
  },
  {
    name: 'Conflation',
    description: 'Elements of two or more events or people combined and told as one.',
    example: 'Matthew’s two-in-one accounts (two demoniacs, Matt 8:28; cf. Mark 5:2’s one).',
    lookFor: 'Additions in the target that match wording from a different pericope of the source.',
    refs: [LICONA_JC, LICONA_WD],
  },
  {
    name: 'Spotlighting',
    description: 'Attention held on one participant while others present go unmentioned — like a stage spotlight.',
    example: 'Luke 24:12 spotlights Peter at the tomb; John 20:3–8 has two disciples running.',
    lookFor: 'Omission of named participants; singular verbs where the source has plurals.',
    refs: [LICONA_JC, LICONA_WD],
  },
  {
    name: 'Simplification',
    description: 'Details that complicate the story omitted or smoothed away.',
    example: 'Matt 8:16 drops Mark 1:33’s “the whole city was gathered at the door.”',
    lookFor: 'Strike-through concentrated on Mark’s vivid but incidental details.',
    refs: [LICONA_JC, LICONA_WD],
  },
  {
    name: 'Expansion of narrative details',
    description: 'Plausible circumstantial detail supplied to fill out a scene, the counterpart of simplification.',
    example: 'Matthew’s fulfillment citations (e.g. Matt 8:17) expanding Mark’s bare narrative.',
    lookFor: 'Long green runs in the target with the surrounding text otherwise retained.',
    refs: [LICONA_WD, QUINT_10_5],
  },
]

// Openable sources (our Theon translation, the public-domain Quintilian) first; the
// unshowable and modern ones after.
export const TECHNIQUE_SOURCES: TechniqueRef[] = [THEON_PROEM, THEON_CHREIA, QUINT_1_9, QUINT_10_5, THEON_PARAPHRASE, LICONA_JC, LICONA_WD]
