/* ─────────────────────────────────────────────
   Chapter: principal-parts — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.
───────────────────────────────────────────── */

import {
  Gk, P, SectionHeading,
} from '../shared'

export const PRINCIPAL_PARTS_INTERMEDIATE_CONTENT = (
  <>
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
