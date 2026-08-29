/* ─────────────────────────────────────────────
   Chapter: contract-verbs — the INTERMEDIATE page

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

export const CONTRACT_VERBS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="contract-verbs.h.int-accent-evidence">The accent is evidence</SectionHeading>
    <P id="contract-verbs.p.int-lead">
      Contraction is a sound change with a spelling consequence, and the circumflex it leaves behind is not decoration — it is the record of two vowels having merged. For a reader that makes the accent a piece of parsing evidence, and in a few places the <em>only</em> piece.
    </P>
    <SectionHeading id="contract-verbs.cg.int-reading">Reading the contracted form</SectionHeading>
    <CatGroup>
      <Cat id="contract-verbs.cat.circumflex-witness" name="The circumflex as witness" eg="ποιῶν (contract) vs a hypothetical ποίων" ex={[{ g: "ὁ ποιῶν τὴν ἀλήθειαν ἔρχεται πρὸς τὸ φῶς", e: "the one who does the truth comes to the light", r: "John 3:21" }]}><T id="contract-verbs.cat.circumflex-witness.d">where a contract verb’s accent sits tells you a contraction happened; the uncontracted accent usually survives the fusion, which is why it can land where a non-contract verb would never put it</T></Cat>
      <Cat id="contract-verbs.cat.liquid-future" name="Against the liquid future" eg="μενῶ / μένω" ex={[{ g: "μείνατε ἐν ἐμοί κἀγὼ ἐν ὑμῖν", e: "remain in me, and I in you", r: "John 15:4" }]}><T id="contract-verbs.cat.liquid-future.d">a liquid future contracts too, so it wears an <G>-έω</G> present’s clothes. <G>μενῶ</G> “I will remain” differs from present <G>μένω</G> by accent alone</T></Cat>
      <Cat id="contract-verbs.cat.lexical-form" name="The lexical form is uncontracted" eg="ποιέω → ποιεῖ" ex={[{ g: "ὁ Πατήρ μου ἕως ἄρτι ἐργάζεται κἀγὼ ἐργάζομαι", e: "my Father is working until now, and I am working", r: "John 5:17" }]}><T id="contract-verbs.cat.lexical-form.d">dictionaries list <G>ποιέω</G>, the page shows <G>ποιεῖ</G>. Searching for what you see will fail; the stem vowel has to be restored before you can look anything up</T></Cat>
      <Cat id="contract-verbs.cat.outside-present" name="Only two tenses contract" eg="ποιῶ but ἐποίησα" ex={[{ g: "ἃ γὰρ ἂν ἐκεῖνος ποιῇ ταῦτα καὶ ὁ υἱὸς ποιεῖ ὁμοίως", e: "for whatever that one does, these things the Son also does likewise", r: "John 5:19" }]}><T id="contract-verbs.cat.outside-present.d">contraction needs a connecting vowel to meet the stem vowel, which happens in the present and imperfect only. Everywhere else the stem vowel simply lengthens and the verb is ordinary</T></Cat>
    </CatGroup>
    <P id="contract-verbs.p.int-caution">
      <strong>The reflex to build.</strong> When an accent looks wrong, suspect contraction before suspecting the editor. And when two readings of a form are possible — present or future, indicative or subjunctive — check whether the accent is doing the deciding, because in this class of verb it frequently is.
    </P>
    <SectionHeading id="contract-verbs.h.going-deeper-love">Going deeper: love verbs and formula verbs</SectionHeading>
    <P id="contract-verbs.p.john-alternates-two">
      <strong>ἀγαπάω and φιλέω.</strong> John 21:15–17 alternates the two love verbs ("do you
      <Gk> ἀγαπᾷς</Gk> me?" … "I <Gk>φιλῶ</Gk> you"), and preachers have built mountains on the switch.
      Handle with care: John elsewhere uses the two interchangeably (both describe the Father's love for
      the Son), and Koine authors freely varied near-synonyms. The alternation may be stylistic; if a
      distinction is intended, it must be argued from the context, not assumed from the lexicon.
    </P>
    <P id="contract-verbs.p.matthew's-hinge-matthew's">
      <strong>πληρόω as Matthew's hinge.</strong> Matthew's fulfillment formula — <Gk>ἵνα πληρωθῇ τὸ
      ῥηθὲν διὰ τοῦ προφήτου</Gk>, "that what was spoken through the prophet might be fulfilled" —
      recurs a dozen times, always with the aorist passive subjunctive. One contract verb structures the
      whole Gospel's argument that Jesus completes Israel's story.
    </P>
    <P id="contract-verbs.p.why-contraction-matters">
      <strong>Why contraction matters for parsing.</strong> The circumflex is information: <Gk>ποιῶν</Gk>
      (circumflex — participle of a contract verb) vs. a hypothetical <Gk>ποίων</Gk>. When an accent
      seems to sit "wrong," suspect contraction — the accent of the uncontracted form usually survives
      the fusion.
    </P>
  </>
)
