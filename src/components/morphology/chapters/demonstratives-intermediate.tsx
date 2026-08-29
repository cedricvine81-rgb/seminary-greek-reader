/* ─────────────────────────────────────────────
   Chapter: demonstratives — the INTERMEDIATE page

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

export const DEMONSTRATIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="demonstratives.h.int-pointing">Which way is it pointing?</SectionHeading>
    <P id="demonstratives.p.int-lead">
      A demonstrative is a finger. The exegetical question is never what it means — “this,” “that” — but what it is pointing at, and Greek lets it point in both directions, and sometimes at nothing in the text at all.
    </P>
    <SectionHeading id="demonstratives.cg.int-uses">The uses</SectionHeading>
    <CatGroup>
      <Cat id="demonstratives.cat.anaphoric" name="Anaphoric" eg="“after these things”" ex={[{ g: "μετὰ ταῦτα ἦν ἑορτὴ τῶν Ἰουδαίων", e: "after these things there was a feast of the Jews", r: "John 5:1" }, { g: "ταῦτα εἶπεν Ἡσαΐας ὅτι εἶδεν τὴν δόξαν αὐτοῦ", e: "Isaiah said these things because he saw his glory", r: "John 12:41" }]}><T id="demonstratives.cat.anaphoric.d">points back at something already said — the default, and the reason <G>οὗτος</G> so often means little more than “he”</T></Cat>
      <Cat id="demonstratives.cat.cataphoric" name="Cataphoric" eg="“this is my commandment: that…”" ex={[{ g: "αὕτη ἐστὶν ἡ ἐντολὴ ἡ ἐμή ἵνα ἀγαπᾶτε ἀλλήλους", e: "this is my commandment, that you love one another", r: "John 15:12" }, { g: "ἐν τούτῳ ἐστὶν ἡ ἀγάπη οὐχ ὅτι ἡμεῖς ἠγαπήσαμεν τὸν θεόν", e: "in this is love, not that we have loved God", r: "1 John 4:10" }]}><T id="demonstratives.cat.cataphoric.d">points forward to what is about to be said — usually followed by <G>ὅτι</G> or <G>ἵνα</G> spelling the content out</T></Cat>
      <Cat id="demonstratives.cat.contemptuous" name="Contemptuous" eg="“this man receives sinners”" ex={[{ g: "οὗτος ἁμαρτωλοὺς προσδέχεται καὶ συνεσθίει αὐτοῖς", e: "this fellow welcomes sinners and eats with them", r: "Luke 15:2" }]}><T id="demonstratives.cat.contemptuous.d"><G>οὗτος</G> used of a person present, with a sneer — “this fellow”</T></Cat>
      <Cat id="demonstratives.cat.remote" name="Remote and emphatic" eg="“that one”" ex={[{ g: "ἐκεῖνος ἦν ὁ λύχνος ὁ καιόμενος", e: "that one was the burning lamp", r: "John 5:35" }, { g: "ἐκεῖνος ὑμᾶς διδάξει πάντα", e: "that one will teach you all things", r: "John 14:26" }]}><T id="demonstratives.cat.remote.d"><G>ἐκεῖνος</G> for the further of two, and in John often for a figure the narrative keeps in view</T></Cat>
    </CatGroup>
    <P id="demonstratives.p.int-caution">
      <strong>The habit to build.</strong> When you meet <Gk>οὗτος</Gk> or <Gk>ταῦτα</Gk>, ask first whether the referent is behind or ahead. A <Gk>ὅτι</Gk> or <Gk>ἵνα</Gk> clause following immediately is the usual sign it points forward — and misreading that direction can invert a sentence’s argument.
    </P>
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
