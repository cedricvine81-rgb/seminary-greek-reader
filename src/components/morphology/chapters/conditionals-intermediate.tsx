/* ─────────────────────────────────────────────
   Chapter: conjunctions — the INTERMEDIATE page

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

export const CONJUNCTIONS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="conditionals.h.going-deeper-conditions">Going deeper: conditions as rhetoric</SectionHeading>
    <P id="conditionals.p.class-lever-because">
      <strong>The 1st class as a lever.</strong> Because it assumes rather than asserts, the 1st class is
      a rhetorical instrument. Paul uses it to argue from shared ground (Gal 3:29); Satan uses it to
      needle (<Gk>εἰ υἱὸς εἶ τοῦ θεοῦ</Gk>, Matt 4:3 — "granting, for the moment, that you are…"); Jesus
      turns it back on accusers (<Gk>εἰ δὲ ἐγὼ ἐν Βεελζεβοὺλ ἐκβάλλω τὰ δαιμόνια…</Gk>, Luke 11:19).
      Ask <em>why</em> a speaker assumes the protasis, and exegesis begins.
    </P>
    <P id="conditionals.p.missing-classes-grammars">
      <strong>The missing classes.</strong> Grammars also list a 4th class — <Gk>εἰ</Gk> + optative, the
      "remote possibility" — which survives only in fragments in the NT (<Gk>εἰ καὶ πάσχοιτε</Gk>, "even
      if you should suffer," 1 Pet 3:14), as the optative mood was dying in Koine. Where you meet a bare
      optative wish instead, it is usually the fossil <Gk>μὴ γένοιτο</Gk>, "may it never be!" — Paul's
      recoil in Romans.
    </P>
    <P id="conditionals.p.conditions-without-greek">
      <strong>Conditions without εἰ.</strong> Greek can smuggle conditions into other clothing: the
      conditional participle (<Gk>θερίσομεν μὴ ἐκλυόμενοι</Gk>, "we will reap, <em>if we do not give
      up</em>," Gal 6:9) and the conditional imperative (John 2:19). When a "then" seems to follow from a
      phrase that isn't an "if," suspect a hidden protasis.
    </P>
  </>
)
