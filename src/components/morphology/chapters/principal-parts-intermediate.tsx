/* ─────────────────────────────────────────────
   Chapter: principal-parts — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.

   Category NAMES below are the standard apparatus of the intermediate grammars (Wallace,
   Black, Porter; behind them Burton and Robertson) used as the shared terminology they
   are. The explanations and English glosses are ours, and every Greek example is quoted
   from the text this app serves (NA1904) and checked by scripts/verify-examples.mjs.
───────────────────────────────────────────── */

import {
  Gk, P, SectionHeading
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const PRINCIPAL_PARTS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="principal-parts.h.int-six-systems">Six systems, not six tenses</SectionHeading>
    <P id="principal-parts.p.int-lead">
      The principal parts are not a list to recite but a map of where a verb’s stems change. Each part is the head of a <em>system</em> — a group of forms built from it — so knowing one part gives you every form in its system, and knowing which system a form belongs to tells you which part to look up.
    </P>
    <SectionHeading id="principal-parts.cg.int-systems">What each part governs</SectionHeading>
    <CatGroup>
      <Cat id="principal-parts.cat.present-system" name="1. Present" eg="λύω → ἔλυον" ex={[{ g: "ὁ πιστεύων εἰς τὸν Υἱὸν ἔχει ζωὴν αἰώνιον", e: "the one who believes in the Son has eternal life", r: "John 3:36" }]}><T id="principal-parts.cat.present-system.d">present and imperfect, in every voice — and the present stem is the one that contracts, reduplicates or nasalises, so it is often the odd one out</T></Cat>
      <Cat id="principal-parts.cat.future-system" name="2. Future active/middle" eg="λύσω · μενῶ" ex={[{ g: "αὐτὸς δὲ βαπτίσει ὑμᾶς ἐν πνεύματι ἁγίῳ", e: "he will baptise you with the Holy Spirit", r: "Mark 1:8" }]}><T id="principal-parts.cat.future-system.d">the future in those two voices only. A liquid verb builds it without σ, which is why it can look like a contract present</T></Cat>
      <Cat id="principal-parts.cat.aorist-system" name="3. Aorist active/middle" eg="ἔλυσα → λύσας, λῦσαι" ex={[{ g: "ἀκούσας δὲ ὁ Ἰησοῦς ἐθαύμασεν", e: "when Jesus heard this he marvelled", r: "Matt 8:10" }]}><T id="principal-parts.cat.aorist-system.d">the aorist in those voices, plus its participle, infinitive, subjunctive and imperative — the augment only in the indicative</T></Cat>
      <Cat id="principal-parts.cat.perfect-active" name="4. Perfect active" eg="λέλυκα · γέγραπται" ex={[{ g: "γέγραπται γὰρ ἐν βίβλῳ ψαλμῶν", e: "for it is written in the book of Psalms", r: "Acts 1:20" }]}><T id="principal-parts.cat.perfect-active.d">perfect and pluperfect active, marked by reduplication. The perfect is a state, not a past — which is why this system is worth its own place</T></Cat>
      <Cat id="principal-parts.cat.perfect-middle" name="5. Perfect middle/passive" eg="λέλυμαι" ex={[{ g: "τετέλεσται καὶ κλίνας τὴν κεφαλὴν παρέδωκεν τὸ πνεῦμα", e: "it is finished; and bowing his head he gave up his spirit", r: "John 19:30" }]}><T id="principal-parts.cat.perfect-middle.d">the same tenses in the other voices, and the endings attach straight to the stem with no connecting vowel — which is where the consonant changes happen</T></Cat>
      <Cat id="principal-parts.cat.aorist-passive" name="6. Aorist passive" eg="ἐλύθην · ἐγράφη" ex={[{ g: "καὶ ὁ Λόγος σὰρξ ἐγένετο", e: "and the Word became flesh", r: "John 1:14" }]}><T id="principal-parts.cat.aorist-passive.d">aorist and future passive, with the <G>θη</G> marker. A verb can be perfectly regular in five systems and irregular here</T></Cat>
    </CatGroup>
    <P id="principal-parts.p.int-caution">
      <strong>Why lexicons print them.</strong> A form you cannot place is a form whose system you have not identified. Find the marker — reduplication, <Gk>σ</Gk>, <Gk>θη</Gk>, an augment — and it names the part; the part names the entry; and only then does the lexicon help. Working the other way round, from a guessed present, is how a reader ends up inventing a verb.
    </P>
    <SectionHeading id="principal-parts.h.deeper">Going deeper: systems, not tenses</SectionHeading>
    <P id="principal-parts.p.systems">
      <strong>Think in tense-systems.</strong> The six parts reveal Greek's real architecture: not
      "tenses" but <em>systems</em> — present, future, aorist, perfect active, perfect middle/passive,
      aorist passive — each with one stem serving every mood. That is why the aorist subjunctive,
      infinitive, imperative, and participle all share part 3's stem minus the augment. Master the
      systems and the hundreds of "forms" collapse into six stems plus rules you already know.
    </P>
    <P id="principal-parts.p.part6">
      <strong>Part 6's odd career.</strong> The θη-stem began as an intransitive marker, not a strict
      passive — which explains "passive deponents" like <Gk>ἐπορεύθην</Gk> "I went" and
      <Gk> ἀπεκρίθην</Gk> "I answered": old middle-intransitives wearing θη. The tidy active/passive
      grid is a later simplification laid over messier history.
    </P>
    <P id="principal-parts.p.perfects">
      <strong>γέγονεν and ἐλήλυθα.</strong> Perfects of the everyday verbs carry weight out of
      proportion to their size: John 1:3's <Gk>ὃ γέγονεν</Gk> ("that which has come to be") and the
      recurring <Gk>ἐλήλυθεν ἡ ὥρα</Gk> ("the hour <em>has come</em> — and now stands here") both lean
      on the perfect's standing-result force you met in the Indicatives chapter.
    </P>
  </>
)
