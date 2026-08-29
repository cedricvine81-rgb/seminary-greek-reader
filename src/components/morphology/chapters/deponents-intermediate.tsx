/* ─────────────────────────────────────────────
   Chapter: deponents — the INTERMEDIATE page

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

export const DEPONENTS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="deponents.h.int-middle-uses">What the middle actually does</SectionHeading>
    <P id="deponents.p.int-middle-lead">
      English has two voices and Greek has three, so the middle is the one with no English slot to fall into. Its common thread is that the subject is somehow <em>involved</em> in the action beyond simply performing it. The categories below are ways of naming that involvement; the form is identical in each, and only the verb and its context decide.
    </P>
    <SectionHeading id="deponents.cg.int-middle">The middle voice</SectionHeading>
    <CatGroup>
      <Cat id="deponents.cat.direct-middle" name="Direct (reflexive) middle" eg="“he hanged himself”" ex={[{ g: "ἀπελθὼν ἀπήγξατο", e: "he went away and hanged himself", r: "Matt 27:5" }]}><T id="deponents.cat.direct-middle.d">the subject acts on itself — rare in the New Testament, and the flagged examples are mostly bodily actions</T></Cat>
      <Cat id="deponents.cat.indirect-middle" name="Indirect middle" eg="“choosing for himself”" ex={[{ g: "ἐκλεξάμενος ἀπ’ αὐτῶν δώδεκα", e: "choosing for himself twelve of them", r: "Luke 6:13" }, { g: "περιεποιήσατο διὰ τοῦ αἵματος τοῦ ἰδίου", e: "he obtained for himself through his own blood", r: "Acts 20:28" }]}><T id="deponents.cat.indirect-middle.d">the subject acts <em>for itself</em>, in its own interest — much the commonest use</T></Cat>
      <Cat id="deponents.cat.permissive-middle" name="Permissive middle" eg="“get yourself baptised”" ex={[{ g: "ἀναστὰς βάπτισαι καὶ ἀπόλυσαι τὰς ἁμαρτίας σου", e: "rise, get baptised and wash away your sins", r: "Acts 22:16" }]}><T id="deponents.cat.permissive-middle.d">the subject <em>allows</em> the action to be done to itself — the sense often carried in English by “get”</T></Cat>
      <Cat id="deponents.cat.reciprocal-middle" name="Reciprocal middle" eg="“they took counsel together”" ex={[{ g: "συμβούλιον ἔλαβον κατ’ αὐτοῦ", e: "they took counsel together against him", r: "Matt 12:14" }]}><T id="deponents.cat.reciprocal-middle.d">a plural subject acting on one another</T></Cat>
    </CatGroup>
    <SectionHeading id="deponents.h.int-deponency">Is “deponent” the right word?</SectionHeading>
    <P id="deponents.p.int-deponency-lead">
      The traditional account says these verbs “laid aside” (Latin <em>deponere</em>) their active forms and mean something active anyway. That description has been steadily questioned: a verb like <Gk>ἔρχομαι</Gk> never had an active to lay aside, and for many of them the middle form is doing exactly what a middle should — the subject is involved in the action. On that reading they are not defective actives but ordinary <em>middle-only</em> verbs, and the label “deponent” tells you about Latin grammar rather than Greek.
    </P>
    <P id="deponents.p.int-deponency-practice">
      <strong>What to do with that in practice.</strong> Parse the form you see — middle or passive, as the ending says — and translate the sense the verb actually has. Where the middle idea is visible, let it show: <Gk>ἀπεκρίθη</Gk> is not merely “he answered” but a response the subject is invested in. Where it is not visible, do not manufacture it; some of these verbs really have flattened into plain lexical items, and a theology built on a middle ending that the author was not thinking about is a theology built on nothing.
    </P>
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
