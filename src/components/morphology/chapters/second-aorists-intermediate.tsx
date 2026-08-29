/* ─────────────────────────────────────────────
   Chapter: 2nd-aorists — the INTERMEDIATE page

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

export const SECOND_AORISTS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="2nd-aorists.h.int-form-not-meaning">A different form, not a different meaning</SectionHeading>
    <P id="2nd-aorists.p.int-lead">
      The single most important fact about the second aorist is negative: it does not mean anything a first aorist does not. The two are alternative ways of building the same tense, the way “walked” and “ran” are alternative English pasts. A verb has one or the other because of its history, not because the author chose a nuance.
    </P>
    <SectionHeading id="2nd-aorists.cg.int-uses">What the stem is really telling you</SectionHeading>
    <CatGroup>
      <Cat id="2nd-aorists.cat.lexical" name="It is a lexical fact" eg="λαμβάνω → ἔλαβον" ex={[{ g: "ὅσοι δὲ ἔλαβον αὐτόν", e: "but as many as received him", r: "John 1:12" }]}><T id="2nd-aorists.cat.lexical.d">the second-aorist stem belongs to the dictionary entry, not to the syntax. <G>λαμβάνω</G> takes <G>ἔλαβον</G> because that is its principal part — there is nothing to interpret</T></Cat>
      <Cat id="2nd-aorists.cat.suppletive" name="Suppletion" eg="λέγω → εἶπον · ὁράω → εἶδον" ex={[{ g: "εἶπεν οὖν αὐτοῖς ὁ Ἰησοῦς", e: "so Jesus said to them", r: "John 6:32" }, { g: "καὶ εἶδεν πνεῦμα θεοῦ καταβαῖνον", e: "and he saw the Spirit of God descending", r: "Matt 3:16" }]}><T id="2nd-aorists.cat.suppletive.d">some verbs borrow a wholly unrelated root for the aorist, exactly as English does with go/went. The lexical form of the aorist is not predictable from the present</T></Cat>
      <Cat id="2nd-aorists.cat.stem-elsewhere" name="The stem outside the indicative" eg="ἔλαβον → λαβών, λαβεῖν" ex={[{ g: "λαβὼν ἄρτον εὐχαριστήσας ἔκλασεν", e: "having taken bread and given thanks, he broke it", r: "Luke 22:19" }]}><T id="2nd-aorists.cat.stem-elsewhere.d">the aorist stem powers the aorist participle, infinitive, subjunctive and imperative too — but without the augment, which belongs to the indicative alone</T></Cat>
      <Cat id="2nd-aorists.cat.imperfect-clash" name="Telling it from the imperfect" eg="ἔβαλλον / ἔβαλον" ex={[{ g: "ἐλθοῦσα μία χήρα πτωχὴ ἔβαλεν λεπτὰ δύο", e: "a poor widow came and put in two small coins", r: "Mark 12:42" }]}><T id="2nd-aorists.cat.imperfect-clash.d">the endings are the imperfect’s, so only the stem separates them. <G>ἔβαλλον</G> is imperfect, <G>ἔβαλον</G> aorist — one letter, two aspects</T></Cat>
    </CatGroup>
    <P id="2nd-aorists.p.int-caution">
      <strong>The exegetical caution.</strong> Because the choice is lexical, nothing follows from “the author used a second aorist.” What <em>does</em> follow is aspect: it is an aorist, and therefore presents the action as a whole. Argue from the tense, never from which conjugation the tense happened to be built with.
    </P>
    <SectionHeading id="second-aorists.h.going-deeper-narrative's">Going deeper: narrative's engine room</SectionHeading>
    <P id="second-aorists.p.narrative-glue-luke">
      <strong>ἐγένετο as narrative glue.</strong> Luke especially loves opening scenes with
      <Gk> καὶ ἐγένετο</Gk> — the King James' "and it came to pass" — a Septuagintalism echoing Hebrew
      narrative style (<Gk>וַיְהִי</Gk>). It rarely needs translating as an event; it is a curtain-raiser.
      Spotting it tunes your ear to Luke's deliberately biblical register.
    </P>
    <P id="second-aorists.p.suppletion-information-when">
      <strong>Suppletion is information.</strong> When one verb's principal parts come from different
      roots (<Gk>λέγω / ἐρῶ / εἶπον</Gk>; <Gk>ὁράω / ὄψομαι / εἶδον</Gk>), each root once was its own
      verb. That is why <Gk>εἶδον</Gk> shares a root with "idea" and "video" (ϝιδ‑, "see") — etymology
      that occasionally illuminates, and always helps memory.
    </P>
    <P id="second-aorists.p.first-second-forms">
      <strong>First and second forms side by side.</strong> Some verbs show both aorists
      (<Gk>ἀπέστειλα / ἀπέστειλον</Gk>), and Koine was slowly regularizing toward 1st-aorist endings
      even on 2nd-aorist stems (<Gk>εἶπαν</Gk> for <Gk>εἶπον</Gk> in many manuscripts). Treat the
      variation as spelling, not meaning.
    </P>
  </>
)
