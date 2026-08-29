/* ─────────────────────────────────────────────
   Chapter: contract-verbs — the INTERMEDIATE page

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

export const CONTRACT_VERBS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="contract-verbs.h.going-deeper-love">Going deeper: love verbs and formula verbs</SectionHeading>
    <P id="contract-verbs.p.john-alternates-two">
      <strong>ἀγαπάω and φιλέω.</strong> John 21:15–17 alternates the two love verbs ("do you
      <Gk> ἀγαπᾷς</Gk> me?" … "I <Gk>φιλῶ</Gk> you"), and preachers have built mountains on the switch.
      Handle with care: John elsewhere uses the two interchangeably (both describe the Father's love for
      the Son), and Koine authors freely varied near-synonyms. The alternation may be stylistic; if a
      distinction is intended, it must be argued from the context, not assumed from the lexicon.
    </P>
    <P id="contract-verbs.p.matthew's-hinge-matthew's">
      <strong>πληρόω as Matthew's hinge.</strong> Matthew's fulfillment formula — <Gk>ἵνα πληρωθῇ τὸ
      ῥηθὲν διὰ τοῦ προφήτου</Gk>, "that what was spoken through the prophet might be fulfilled" —
      recurs a dozen times, always with the aorist passive subjunctive. One contract verb structures the
      whole Gospel's argument that Jesus completes Israel's story.
    </P>
    <P id="contract-verbs.p.why-contraction-matters">
      <strong>Why contraction matters for parsing.</strong> The circumflex is information: <Gk>ποιῶν</Gk>
      (circumflex — participle of a contract verb) vs. a hypothetical <Gk>ποίων</Gk>. When an accent
      seems to sit "wrong," suspect contraction — the accent of the uncontracted form usually survives
      the fusion.
    </P>
  </>
)
