/* ─────────────────────────────────────────────
   Chapter: pronunciation — the INTERMEDIATE page

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

export const PRONUNCIATION_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="pronunciation.h.int-sound-and-text">When sound decides the text</SectionHeading>
    <P id="pronunciation.p.int-lead">
      For an intermediate reader the value of the sound system is not elocution but textual criticism. Scribes copied by ear as well as by eye, and every merger in the language turned two spellings into one sound — which is to say, into a place where manuscripts can disagree without anyone making a mistake worth the name.
    </P>
    <SectionHeading id="pronunciation.cg.int-textual">Where the ear left marks in the manuscripts</SectionHeading>
    <CatGroup>
      <Cat id="pronunciation.cat.itacism" name="Itacism" eg="ἡμεῖς / ὑμεῖς" ex={[{ g: "ὃ ἑωράκαμεν καὶ ἀκηκόαμεν ἀπαγγέλλομεν καὶ ὑμῖν", e: "what we have seen and heard we proclaim also to you", r: "1 John 1:3" }]}><T id="pronunciation.cat.itacism.d"><G>η ι υ ει οι</G> converged on “ee.” The famous casualty is <G>ἡμεῖς</G> against <G>ὑμεῖς</G> — “we” and “you” differing by one vowel that had stopped being a difference in sound</T></Cat>
      <Cat id="pronunciation.cat.omicron-omega" name="ο and ω" eg="ἔχομεν / ἔχωμεν" ex={[{ g: "Δικαιωθέντες οὖν ἐκ πίστεως εἰρήνην ἔχωμεν πρὸς τὸν θεόν", e: "therefore, having been justified by faith, let us have peace with God — this edition prints the subjunctive", r: "Rom 5:1" }]}><T id="pronunciation.cat.omicron-omega.d">the length distinction faded, so subjunctive and indicative could be written alike — and the difference between “we have peace” and “let us have peace” at Romans 5:1 rests on a single letter the ear no longer separated</T></Cat>
      <Cat id="pronunciation.cat.movable-nu" name="Movable ν and elision" eg="λύουσι(ν) · δι’ αὐτοῦ" ex={[{ g: "πάντα δι’ αὐτοῦ ἐγένετο", e: "all things were made through him", r: "John 1:3" }]}><T id="pronunciation.cat.movable-nu.d">a final ν appears before a vowel or pause and drops otherwise; a final short vowel elides before another vowel. Both are matters of sound, and neither changes a parse</T></Cat>
      <Cat id="pronunciation.cat.breathing" name="Breathings that matter" eg="ὁ / ὅ · αὐτοῦ / αὑτοῦ" ex={[{ g: "ἐν ἀρχῇ ἦν ὁ Λόγος", e: "in the beginning was the Word", r: "John 1:1" }]}><T id="pronunciation.cat.breathing.d">the rough breathing is the whole difference between the article and the relative, and between several common pairs. It was a sound, and then a mark, and then an editorial decision</T></Cat>
    </CatGroup>
    <P id="pronunciation.p.int-caution">
      <strong>What follows for exegesis.</strong> When an apparatus lists a variant that differs by one vowel, ask whether the two readings ever sounded different. If they did not, the variant is likely to be a hearing or spelling event rather than a theological one — which does not settle which reading is original, but does tell you what kind of argument the case will take.
    </P>
    <SectionHeading id="pronunciation.h.going-deeper-sound">Going deeper: sound history you can use</SectionHeading>
    <P id="pronunciation.p.itacism-manuscripts-converged">
      <strong>Itacism and the manuscripts.</strong> As <Gk>η, ι, υ, ει, οι</Gk> converged on "ee,"
      scribes taking dictation — or sounding out their exemplar — swapped those spellings freely. Most
      such variants are trivial, but some matter: <Gk>ἡμεῖς/ὑμεῖς</Gk> ("we/you") differ by exactly one
      itacized vowel, and the manuscripts of 1 John 1:4, 2 Cor 3:2, and Jude 5's neighbors split
      accordingly. When your apparatus shows an ε/αι or η/ι variant, think with your ears.
    </P>
    <P id="pronunciation.p.pitch-stress-classical">
      <strong>From pitch to stress.</strong> Classical accents marked musical <em>pitch</em> (the acute
      a rise, the circumflex a rise-and-fall); by the Koine period the system was collapsing into the
      plain stress accent Modern Greek keeps. That is why we can be relaxed about accents while insisting
      on breathings: in the first century the accents were already in flux, but initial /h/ still
      distinguished words.
    </P>
    <P id="pronunciation.p.letters-numbers-greek">
      <strong>The letters as numbers.</strong> Greek had no numerals — letters did the counting
      (α´ = 1, β´ = 2 … ι´ = 10, κ´ = 20), with three obsolete letters kept for the purpose. Hence
      Rev 13:18's "number of the beast," <Gk>χξϛ</Gk> = 600 + 60 + 6 — gematria assumes an alphabet
      that counts.
    </P>
  </>
)
