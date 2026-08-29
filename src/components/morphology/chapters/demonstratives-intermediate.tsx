/* ─────────────────────────────────────────────
   Chapter: demonstratives — the INTERMEDIATE page

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

export const DEMONSTRATIVES_INTERMEDIATE_CONTENT = (
  <>
    <P id="demonstratives.p.distinguish-reflexive-intensive">
      Distinguish reflexive <Gk>ἑαυτόν</Gk> from intensive <Gk>αὐτός</Gk> by the delete-test you know
      from the Pronouns chapter: delete "himself," and if the meaning collapses it was reflexive
      (<Gk>σῴζει ἑαυτόν</Gk>), if unchanged it was intensive (<Gk>αὐτὸς ὁ κύριος σῴζει</Gk>).
    </P>
    <SectionHeading id="demonstratives.h.going-deeper-pointing">Going deeper: pointing with attitude</SectionHeading>
    <P id="demonstratives.p.backward-forward-demonstrative">
      <strong>Backward or forward?</strong> A demonstrative usually points back at what was just said
      (anaphoric: <Gk>μετὰ ταῦτα</Gk>), but it can point forward to what's coming (cataphoric):
      <Gk> αὕτη ἐστὶν ἡ ἐντολὴ ἡ ἐμή, ἵνα…</Gk> — "<em>this</em> is my commandment: that you love…"
      (John 15:12). John especially uses forward-pointing οὗτος to headline a definition before giving it.
    </P>
    <P id="demonstratives.p.contemptuous-pointing-person">
      <strong>The contemptuous οὗτος.</strong> Pointing at a person can sneer: <Gk>οὗτος</Gk> as "this
      fellow" — <Gk>οὗτος ὁ ἄνθρωπος</Gk> on hostile lips (Luke 15:2, "this fellow welcomes sinners").
      Context supplies the tone English must add with "fellow."
    </P>
    <P id="demonstratives.p.title-john's-farewell">
      <strong>ἐκεῖνος as a title.</strong> In John's farewell discourse, <Gk>ἐκεῖνος</Gk> repeatedly
      refers to the coming Spirit-Paraclete (John 14:26; 16:13–14) — a masculine demonstrative tracking
      through the discourse. Note also the idiom <Gk>ἐν ἐκείνῃ τῇ ἡμέρᾳ</Gk>, "in that day," carrying
      eschatological weight inherited from the prophets.
    </P>
  </>
)
