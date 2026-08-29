/* ─────────────────────────────────────────────
   Chapter: infinitives — the INTERMEDIATE page

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
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const INFINITIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="infinitives.cg.verbal-use-like">Verbal use (like a verb)</SectionHeading>
    <CatGroup>
            <Cat id="infinitives.cat.purpose"name="Purpose" eg="“I came to destroy the law”" ex={[{ g: "οὐκ ἦλθον καταλῦσαι ἀλλὰ πληρῶσαι", e: "I did not come to abolish but to fulfill", r: "Matt 5:17" }, { g: "ἐξῆλθεν ὁ σπείρων σπεῖραι", e: "the sower went out to sow", r: "Mark 4:3" }]}><T id="infinitives.cat.purpose.d">answers <em>why?</em> — “in order to”; naked inf., or <G>τοῦ / εἰς τό / πρὸς τό</G></T></Cat>
            <Cat id="infinitives.cat.result"name="Result" eg="“…so that the crowd was amazed”" ex={[{ g: "ὥστε τὸν ὄχλον θαυμάσαι", e: "so that the crowd marveled", r: "Matt 15:31" }, { g: "ὥστε ἤδη γεμίζεσθαι τὸ πλοῖον", e: "so that the boat was already filling", r: "Mark 4:37" }]}><T id="infinitives.cat.result.d">the outcome produced; usually <G>ὥστε</G> + infinitive</T></Cat>
            <Cat id="infinitives.cat.time"name="Time" ex={[{ g: "ἐν τῷ σπείρειν αὐτόν", e: "while he was sowing", r: "Matt 13:4" }, { g: "μετὰ τὸ ἐγερθῆναί με", e: "after I have been raised", r: "Matt 26:32" }]}><T id="infinitives.cat.time.d">answers <em>when?</em> — <G>μετὰ τό</G> "after," <G>ἐν τῷ</G> "while," <G>πρὸ τοῦ</G> "before"</T></Cat>
            <Cat id="infinitives.cat.causal"name="Causal" eg="“because it had no root”" ex={[{ g: "διὰ τὸ μὴ ἔχειν ῥίζαν", e: "because it had no root", r: "Mark 4:6" }, { g: "διὰ τὸ εἶναι αὐτὸν ἐξ οἴκου Δαυίδ", e: "because he was of the house of David", r: "Luke 2:4" }]}><T id="infinitives.cat.causal.d">answers <em>why?</em> looking back; <G>διὰ τό</G> + infinitive</T></Cat>
            <Cat id="infinitives.cat.complementary"name="Complementary" eg="“you cannot serve God and mammon”" ex={[{ g: "οὐ δύνασθε θεῷ δουλεύειν καὶ μαμωνᾷ", e: "you cannot serve God and mammon", r: "Matt 6:24" }, { g: "ἤρξατο ὁ Ἰησοῦς κηρύσσειν", e: "Jesus began to preach", r: "Matt 4:17" }]}><T id="infinitives.cat.complementary.d">completes a helper verb (<G>δύναμαι, θέλω, μέλλω, ἄρχομαι</G>)</T></Cat>
    </CatGroup>
    <SectionHeading id="infinitives.cg.substantival-use-like">Substantival use (like a noun)</SectionHeading>
    <CatGroup>
            <Cat id="infinitives.cat.subject"name="Subject" eg="“to live is Christ” (Phil 1:21)" ex={[{ g: "ἐμοὶ τὸ ζῆν Χριστὸς καὶ τὸ ἀποθανεῖν κέρδος", e: "to live is Christ and to die is gain", r: "Phil 1:21" }, { g: "καλόν ἐστιν ἡμᾶς ὧδε εἶναι", e: "it is good for us to be here", r: "Mark 9:5" }]}><T id="infinitives.cat.subject.d">the infinitive is the subject, often with <G>δεῖ, ἔξεστιν</G></T></Cat>
            <Cat id="infinitives.cat.indirect-discourse"name="Indirect Discourse" eg="“they say there is no resurrection”" ex={[{ g: "λέγουσιν ἀνάστασιν μὴ εἶναι", e: "they say there is no resurrection", r: "Mark 12:18" }, { g: "τίνα με λέγουσιν εἶναι;", e: "who do they say that I am?", r: "Mark 8:27" }]}><T id="infinitives.cat.indirect-discourse.d">reports speech/thought after a verb of perception</T></Cat>
            <Cat id="infinitives.cat.epexegetical"name="Epexegetical" eg="“authority to tread on serpents”" ex={[{ g: "ἐξουσίαν τοῦ πατεῖν ἐπάνω ὄφεων", e: "authority to tread on serpents", r: "Luke 10:19" }, { g: "ἐξουσίαν ἔχω θεῖναι αὐτήν", e: "I have authority to lay it down", r: "John 10:18" }]}><T id="infinitives.cat.epexegetical.d">explains a noun or adjective (ability, freedom, need…)</T></Cat>
    </CatGroup>
    <SectionHeading id="infinitives.h.going-deeper-infinitive">Going deeper: the infinitive as theology's workhorse</SectionHeading>
    <P id="infinitives.p.subject-infinitives-article">
      <strong>Subject infinitives.</strong> With the article, an infinitive can anchor a whole
      proposition: <Gk>ἐμοὶ γὰρ τὸ ζῆν Χριστὸς καὶ τὸ ἀποθανεῖν κέρδος</Gk> — "for to me, <em>to
      live</em> is Christ and <em>to die</em> is gain" (Phil 1:21). Two articular infinitives are the
      subjects; the sentence's punch depends on seeing them as nouns.
    </P>
    <P id="infinitives.p.indirect-discourse-after">
      <strong>Indirect discourse.</strong> After verbs of saying and thinking, the infinitive can report
      speech: <Gk>λέγουσιν ἀνάστασιν μὴ εἶναι</Gk> — "they say there is no resurrection" (Mark 12:18,
      of the Sadducees). The accusative-plus-infinitive frame ("they say <em>resurrection not to
      be</em>") is the Greek machinery behind many an English "that"-clause.
    </P>
    <P id="infinitives.p.purpose-result-infinitive">
      <strong>Purpose vs. result.</strong> <Gk>εἰς τό</Gk> + infinitive usually marks intention
      ("in order to"); <Gk>ὥστε</Gk> + infinitive usually marks outcome ("so that, with the result
      that"): <Gk>ὥστε τὸν ὄχλον θαυμάσαι</Gk>, "so that the crowd was amazed" (Matt 15:31). Where a
      text is ambiguous — did God <em>intend</em> or merely <em>allow</em> the outcome? — the choice
      between purpose and result is a genuinely theological call.
    </P>
  </>
)
