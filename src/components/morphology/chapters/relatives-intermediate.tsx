/* ─────────────────────────────────────────────
   Chapter: relatives — the INTERMEDIATE page

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

export const RELATIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="relatives.h.int-clause">The relative clause at work</SectionHeading>
    <P id="relatives.p.int-lead">
      The rule you learned still holds — gender and number from the antecedent, case from the relative’s own clause — but the New Testament breaks the case half of it often enough that the exceptions have names. Most are one phenomenon: the relative is pulled into the case of the word beside it.
    </P>
    <SectionHeading id="relatives.cg.int-uses">Uses and irregularities</SectionHeading>
    <CatGroup>
      <Cat id="relatives.cat.attraction" name="Attraction" eg="ὅ → οὗ beside a genitive" ex={[{ g: "ἐκ τοῦ ὕδατος οὗ ἐγὼ δώσω αὐτῷ", e: "from the water that I will give him", r: "John 4:14" }, { g: "ἀξίως περιπατῆσαι τῆς κλήσεως ἧς ἐκλήθητε", e: "to walk worthily of the calling with which you were called", r: "Eph 4:1" }]}><T id="relatives.cat.attraction.d">the relative abandons the case its own clause calls for and takes the antecedent’s instead — most often accusative pulled to genitive or dative</T></Cat>
      <Cat id="relatives.cat.headless" name="Without an antecedent" eg="“whoever has ears”" ex={[{ g: "ὃς γὰρ οὐκ ἔστιν καθ’ ἡμῶν ὑπὲρ ἡμῶν ἐστιν", e: "for whoever is not against us is for us", r: "Mark 9:40" }, { g: "ὃ ἦν ἀπ’ ἀρχῆς ὃ ἀκηκόαμεν", e: "what was from the beginning, what we have heard", r: "1 John 1:1" }]}><T id="relatives.cat.headless.d">the relative carries its own head — “the one who,” “what” — and the clause fills a noun slot in the main sentence</T></Cat>
      <Cat id="relatives.cat.hostis" name="ὅστις — qualitative" eg="“such a one as”" ex={[{ g: "ὅστις γὰρ ὅλον τὸν νόμον τηρήσῃ", e: "for whoever keeps the whole law", r: "Jas 2:10" }, { g: "ὅστις γὰρ ἔχει δοθήσεται αὐτῷ", e: "for whoever has, it will be given to him", r: "Matt 13:12" }]}><T id="relatives.cat.hostis.d">the compound relative generalises or characterises: “whoever,” or “the sort of person who”</T></Cat>
      <Cat id="relatives.cat.indefinite-an" name="With ἄν and the subjunctive" eg="ὃς ἄν “whoever”" ex={[{ g: "ὃς ἂν ποιήσῃ τὸ θέλημα τοῦ Θεοῦ", e: "whoever does the will of God", r: "Mark 3:35" }, { g: "ὃς δ’ ἂν πίῃ ἐκ τοῦ ὕδατος", e: "but whoever drinks of the water", r: "John 4:14" }]}><T id="relatives.cat.indefinite-an.d">the clause becomes fully indefinite — any member of a class, at any time</T></Cat>
    </CatGroup>
    <P id="relatives.p.int-caution">
      <strong>Why it is worth noticing.</strong> An attracted relative can disguise the syntax of a whole clause: a genitive <Gk>οὗ</Gk> may be functioning as the object of its own verb, not as a genitive at all. When a relative’s case makes no sense in its clause, look at the word immediately before it before concluding the author has written something unusual.
    </P>
    <SectionHeading id="relatives.h.going-deeper-attraction">Going deeper: attraction and the hymnic relative</SectionHeading>
    <P id="relatives.p.case-attraction-greek">
      <strong>Case attraction.</strong> Greek sometimes lets the antecedent pull the relative into its
      own case, especially genitive/dative: <Gk>περὶ πάντων ὧν ἐποίησεν</Gk> — "concerning all
      [the things] <em>that</em> he did" (Luke 3:19), where strict grammar expects accusative <Gk>ἅ</Gk>
      but the genitive <Gk>πάντων</Gk> attracted it to <Gk>ὧν</Gk>. Luke and John do this constantly;
      recognize it and refuse to panic when the case rule seems "broken."
    </P>
    <P id="relatives.p.hymnic-relative-several">
      <strong>The hymnic relative.</strong> Several passages scholars identify as early christological
      hymns open with a bare relative: <Gk>ὅς ἐστιν εἰκὼν τοῦ θεοῦ</Gk>, "<em>who</em> is the image of
      the invisible God" (Col 1:15); <Gk>ὃς ἐν μορφῇ θεοῦ ὑπάρχων</Gk> (Phil 2:6); <Gk>ὃς ἐφανερώθη ἐν
      σαρκί</Gk> (1 Tim 3:16). The dangling "who…" suggests quoted material whose antecedent lived in
      the original setting — a grammatical fingerprint of quotation.
    </P>
    <P id="relatives.p.relative-article-participle">
      <strong>Relative vs. article + participle.</strong> Greek has two ways to say "the one who
      believes": <Gk>ὃς πιστεύει</Gk> and <Gk>ὁ πιστεύων</Gk>. John prefers the participle for timeless
      characterization, the relative for specific reference — a stylistic dial worth watching when both
      appear side by side.
    </P>
  </>
)
