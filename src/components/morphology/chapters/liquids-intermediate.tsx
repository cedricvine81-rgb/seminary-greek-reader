/* ─────────────────────────────────────────────
   Chapter: liquids — the INTERMEDIATE page

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

export const LIQUIDS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="liquids.h.int-why-liquids">Why the liquids behave differently</SectionHeading>
    <P id="liquids.p.int-lead">
      Verbs whose stem ends in <Gk>λ μ ν ρ</Gk> refuse the <Gk>σ</Gk> that builds an ordinary future and aorist. That is a fact about sound, not about meaning — but it produces two forms that are easy to misread, and both of them are common.
    </P>
    <SectionHeading id="liquids.cg.int-reading">What to watch for</SectionHeading>
    <CatGroup>
      <Cat id="liquids.cat.future-contract" name="The future that looks present" eg="μενῶ “I will remain”" ex={[{ g: "ὁ μένων ἐν ἐμοὶ κἀγὼ ἐν αὐτῷ οὗτος φέρει καρπὸν πολύν", e: "the one who remains in me and I in him, he bears much fruit", r: "John 15:5" }]}><T id="liquids.cat.future-contract.d">instead of <G>σ</G> the future inserts an <G>ε</G> which immediately contracts, so a liquid future is spelled like an <G>-έω</G> present. Only the accent separates them</T></Cat>
      <Cat id="liquids.cat.aorist-no-sigma" name="The aorist without σ" eg="μένω → ἔμεινα" ex={[{ g: "ἔμεινεν δὲ Μαριὰμ σὺν αὐτῇ ὡς μῆνας τρεῖς", e: "and Mary remained with her about three months", r: "Luke 1:56" }]}><T id="liquids.cat.aorist-no-sigma.d">the augment and the α-endings are all there, but the <G>σα</G> is not; the stem usually compensates by lengthening its vowel or simplifying a double consonant</T></Cat>
      <Cat id="liquids.cat.frequency" name="They are not marginal" eg="μένω, ἀποστέλλω, ἐγείρω, κρίνω" ex={[{ g: "καθὼς ἀπέστειλέν με ὁ ζῶν Πατήρ", e: "as the living Father sent me", r: "John 6:57" }, { g: "ὁ Θεὸς αὐτὸν ἤγειρεν ἐκ νεκρῶν", e: "God raised him from the dead", r: "Rom 10:9" }]}><T id="liquids.cat.frequency.d">the liquid class holds some of the highest-frequency verbs in the New Testament, so the pattern is met constantly rather than as a curiosity</T></Cat>
    </CatGroup>
    <P id="liquids.p.int-caution">
      <strong>The practical upshot.</strong> Meeting <Gk>μενεῖ</Gk> and reading it as a present is the standard liquid mistake, and it turns a promise about the future into a statement about now. When a stem ends in a liquid, let the accent decide the tense before the sense does.
    </P>
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
