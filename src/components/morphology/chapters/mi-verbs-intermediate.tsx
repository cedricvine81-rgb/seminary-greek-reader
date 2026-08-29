/* ─────────────────────────────────────────────
   Chapter: mi-verbs — the INTERMEDIATE page

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

export const MI_VERBS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="mi-verbs.h.going-deeper-small">Going deeper: small club, heavy theology</SectionHeading>
    <P id="mi-verbs.p.stative-perfect-because">
      <strong>ἵστημι's stative perfect.</strong> Because its perfect <Gk>ἕστηκα</Gk> denotes the
      <em> state</em> of standing, it translates as an English present: <Gk>ἰδοὺ ἕστηκα ἐπὶ τὴν θύραν</Gk>,
      "behold, I <em>stand</em> at the door" (Rev 3:20). A "have stood" here would miss the living
      posture the perfect asserts.
    </P>
    <P id="mi-verbs.p.passion-gospels-thread">
      <strong>παραδίδωμι and the passion.</strong> The Gospels thread one verb through the whole story:
      Judas <em>hands over</em> Jesus (Mark 14:10), the chief priests <em>hand him over</em> to Pilate
      (15:1), Pilate <em>hands him over</em> to be crucified (15:15) — and Paul dares to make God the
      subject: "he did not spare his own Son but <em>handed him over</em> for us all" (Rom 8:32). Tracking
      the verb is tracking the theology.
    </P>
    <P id="mi-verbs.p.range-one-verb">
      <strong>ἀφίημι's range.</strong> One verb covers "forgive" (sins), "leave" (nets, Matt 4:20), and
      "allow" (Matt 3:15). The root picture — releasing, letting go — underlies all three; context picks
      the English word, and the shared root sometimes carries the point.
    </P>
  </>
)
