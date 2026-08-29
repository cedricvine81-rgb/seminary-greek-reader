/* ─────────────────────────────────────────────
   Chapter: liquids — the INTERMEDIATE page

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

export const LIQUIDS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="liquids.h.deeper">Going deeper: theology in liquid forms</SectionHeading>
    <P id="liquids.p.meno">
      <strong>μένω in John.</strong> "Abide in me" — John's theology of union runs on this liquid verb
      (40 times in the Gospel, 27 in the letters). John 15 alone plays present forms ("keep abiding")
      against aorist forms in a sustained meditation; watching the aspect of each <Gk>μένω</Gk> form is
      half the exegesis of the chapter.
    </P>
    <P id="liquids.p.egeiro">
      <strong>ἐγείρω and ἀνίστημι.</strong> The NT says "raise" two ways — the liquid <Gk>ἐγείρω</Gk>
      (usually transitive: God raises Jesus, passive <Gk>ἠγέρθη</Gk>) and the μι-verb
      <Gk> ἀνίστημι</Gk> (often intransitive: "he rose"). Mark alternates them freely; the divine-passive
      <Gk> ἠγέρθη</Gk> "he was raised [by God]" quietly credits the Father throughout the kerygma.
    </P>
    <P id="liquids.p.apostello">
      <strong>ἀποστέλλω and "apostle."</strong> The noun <Gk>ἀπόστολος</Gk> is this liquid verb
      substantivized — a "sent one." John's Gospel plays the sending chain relentlessly: as the Father
      <em> sent</em> me, so I <em>send</em> you (John 20:21) — mission grammar built on a liquid stem.
    </P>
  </>
)
