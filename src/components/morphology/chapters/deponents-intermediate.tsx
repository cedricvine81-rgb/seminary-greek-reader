/* ─────────────────────────────────────────────
   Chapter: deponents — the INTERMEDIATE page

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

export const DEPONENTS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="deponents.h.going-deeper-deponent">Going deeper: is "deponent" the right name?</SectionHeading>
    <P id="deponents.p.middle-voice-reappraisal">
      <strong>The middle-voice reappraisal.</strong> A growing consensus in Greek linguistics holds that
      most "deponents" never laid anything aside — their middle form fits their meaning. Verbs of motion
      (<Gk>ἔρχομαι, πορεύομαι</Gk>), emotion (<Gk>φοβέομαι</Gk>), perception, and self-involving action
      are exactly where languages with a middle voice use it: the subject is inside the event, affected
      by it. On this view the label "deponent" describes <em>English's</em> lack of a middle voice, not a
      defect in the Greek. For translation nothing changes; for feel, much does — <Gk>δέχομαι</Gk> "I
      receive (into my own hands)" is middle to its bones.
    </P>
    <P id="deponents.p.full-stretch-one">
      <strong>γίνομαι at full stretch.</strong> One verb spans "be born," "become," "happen," "come to
      be," even "be" — John 1:14's <Gk>ὁ λόγος σὰρξ ἐγένετο</Gk>, "the Word <em>became</em> flesh," leans
      on the verb's sense of entering a new state, deliberately unlike the <Gk>ἦν</Gk> ("was") of 1:1.
      The contrast between εἰμί and γίνομαι carries the prologue's theology.
    </P>
    <P id="deponents.p.watch-passive-functions">
      <strong>Watch σώζομαι.</strong> The passive of <Gk>σῴζω</Gk> functions almost as a deponent in
      texts like Acts 2:47 ("those being saved") — but here the passive is real and theological: God is
      the unstated saver. Divine passive and deponency can look identical; the lexicon and context
      separate them.
    </P>
  </>
)
