/* ─────────────────────────────────────────────
   Chapter: prepositions — the INTERMEDIATE page

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

export const PREPOSITIONS_INTERMEDIATE_CONTENT = (
  <>
    <P id="prepositions.p.two-refinements-first">
      Two refinements. First, remember from the verb chapter that compounds take their augment
      <em>after</em> the preposition (<Gk>ἐξέβαλον</Gk>, "they cast out"). Second, compounding can
      intensify rather than redirect (<Gk>γινώσκω</Gk> "know" → <Gk>ἐπιγινώσκω</Gk> "know fully") —
      though in Koine some compounds have faded to near-synonyms of the simple verb; check usage before
      building an argument on the prefix.
    </P>
    <SectionHeading id="prepositions.h.going-deeper-theology">Going deeper: theology in small words</SectionHeading>
    <P id="prepositions.p.paul's-signature-phrase">
      <strong>ἐν Χριστῷ.</strong> Paul's signature phrase — "in Christ," some 80+ times with its variants —
      rides on the dative of sphere: believers live and act <em>within the realm defined by</em> Christ.
      No English preposition quite reproduces it, which is why translations wobble between "in," "united
      to," and "through." The grammar is the theology here.
    </P>
    <P id="prepositions.p.chains-agency-greek">
      <strong>Chains of agency.</strong> Greek can distinguish the ultimate agent (<Gk>ὑπό</Gk> + gen.)
      from the intermediate one (<Gk>διά</Gk> + gen.): "what was spoken <Gk>ὑπὸ κυρίου διὰ τοῦ
      προφήτου</Gk>" — <em>by</em> the Lord <em>through</em> the prophet (Matt 1:22). One verse, a whole
      doctrine of inspiration in two prepositions.
    </P>
    <P id="prepositions.p.don't-over-press">
      <strong>Don't over-press εἰς.</strong> In classical Greek <Gk>εἰς</Gk> (motion) and
      <Gk> ἐν</Gk> (rest) were kept apart; in Koine they had begun to blur, and Mark can write
      <Gk> εἰς</Gk> where John writes <Gk>ἐν</Gk> with no difference intended. Arguments that lean hard on
      "εἰς must mean <em>into</em>" (e.g., in baptism texts) need corroboration from context, not just the
      lexicon.
    </P>
  </>
)
