/* ─────────────────────────────────────────────
   Chapter: relatives — the INTERMEDIATE page

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

export const RELATIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="relatives.h.going-deeper-attraction">Going deeper: attraction and the hymnic relative</SectionHeading>
    <P id="relatives.p.case-attraction-greek">
      <strong>Case attraction.</strong> Greek sometimes lets the antecedent pull the relative into its
      own case, especially genitive/dative: <Gk>περὶ πάντων ὧν ἐποίησεν</Gk> — "concerning all
      [the things] <em>that</em> he did" (Luke 3:19), where strict grammar expects accusative <Gk>ἅ</Gk>
      but the genitive <Gk>πάντων</Gk> attracted it to <Gk>ὧν</Gk>. Luke and John do this constantly;
      recognize it and refuse to panic when the case rule seems "broken."
    </P>
    <P id="relatives.p.hymnic-relative-several">
      <strong>The hymnic relative.</strong> Several passages scholars identify as early christological
      hymns open with a bare relative: <Gk>ὅς ἐστιν εἰκὼν τοῦ θεοῦ</Gk>, "<em>who</em> is the image of
      the invisible God" (Col 1:15); <Gk>ὃς ἐν μορφῇ θεοῦ ὑπάρχων</Gk> (Phil 2:6); <Gk>ὃς ἐφανερώθη ἐν
      σαρκί</Gk> (1 Tim 3:16). The dangling "who…" suggests quoted material whose antecedent lived in
      the original setting — a grammatical fingerprint of quotation.
    </P>
    <P id="relatives.p.relative-article-participle">
      <strong>Relative vs. article + participle.</strong> Greek has two ways to say "the one who
      believes": <Gk>ὃς πιστεύει</Gk> and <Gk>ὁ πιστεύων</Gk>. John prefers the participle for timeless
      characterization, the relative for specific reference — a stylistic dial worth watching when both
      appear side by side.
    </P>
  </>
)
