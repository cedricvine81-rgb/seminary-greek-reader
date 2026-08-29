/* ─────────────────────────────────────────────
   Chapter: conj-adv — the INTERMEDIATE page

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
  ColsTable, Gk, P, SectionHeading
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const CONJ_ADV_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="conj-adv.h.int-connectives">What the connectives are doing</SectionHeading>
    <P id="conj-adv.p.int-lead">
      Koine narrative and argument are held together by a small set of connectives, and almost every sentence has one. Their glosses are nearly useless on their own — <Gk>δέ</Gk> is not simply “but” — because what they mark is the <em>relation</em> between what came before and what comes next. Reading them well is most of reading an argument well.
    </P>
    <SectionHeading id="conj-adv.cg.int-connectives">The workhorses</SectionHeading>
    <CatGroup>
      <Cat id="conj-adv.cat.kai" name="καί" eg="“even the winds obey him”" ex={[{ g: "καὶ οἱ ἄνεμοι καὶ ἡ θάλασσα αὐτῷ ὑπακούουσιν", e: "even the winds and the sea obey him", r: "Matt 8:27" }]}><T id="conj-adv.cat.kai.d">connective “and,” but also adjunctive “also” and ascensive “even.” Position and sense decide; in narrative, strings of <G>καί</G> mark pace rather than logic</T></Cat>
      <Cat id="conj-adv.cat.de" name="δέ" eg="“and/but he said”" ex={[{ g: "ὁ δὲ ἔφη αὐτῷ ἀγαπήσεις Κύριον τὸν Θεόν σου", e: "and he said to him, you shall love the Lord your God", r: "Matt 22:37" }]}><T id="conj-adv.cat.de.d">marks a new step, not necessarily a contrast — the writer is moving the discourse on. Translate as “but” only when the context supplies the opposition</T></Cat>
      <Cat id="conj-adv.cat.gar" name="γάρ" eg="“for God so loved”" ex={[{ g: "οὕτως γὰρ ἠγάπησεν ὁ Θεὸς τὸν κόσμον", e: "for God so loved the world", r: "John 3:16" }]}><T id="conj-adv.cat.gar.d">gives the grounds for what was just said — explanation, not a new assertion. Postpositive, so it is never the first word</T></Cat>
      <Cat id="conj-adv.cat.oun" name="οὖν" eg="“therefore what God joined”" ex={[{ g: "ὃ οὖν ὁ Θεὸς συνέζευξεν ἄνθρωπος μὴ χωριζέτω", e: "what therefore God has joined, let no one separate", r: "Matt 19:6" }]}><T id="conj-adv.cat.oun.d">draws an inference from what precedes — “therefore, so then.” In John it is often merely narrative transition, so weigh the author</T></Cat>
      <Cat id="conj-adv.cat.alla" name="ἀλλά" eg="“not… but”" ex={[{ g: "οὐκ ἦλθον καταλῦσαι ἀλλὰ πληρῶσαι", e: "I did not come to abolish but to fulfil", r: "Matt 5:17" }]}><T id="conj-adv.cat.alla.d">strong adversative — it cancels or replaces, where <G>δέ</G> merely moves on</T></Cat>
    </CatGroup>
    <P id="conj-adv.p.int-caution">
      <strong>The discipline.</strong> Diagram an argument by its connectives before you weigh its words: mark every <Gk>γάρ</Gk> as a support, every <Gk>οὖν</Gk> as a conclusion, every <Gk>ἀλλά</Gk> as a correction, and the shape of the paragraph appears without any lexical work at all. Then check the author’s habits — a writer who uses <Gk>οὖν</Gk> as a mere “and then” will mislead you if you read every one as an inference.
    </P>
    <SectionHeading id="conj-adv.h.semantic-labels-naming">Semantic labels: naming the moves of an argument</SectionHeading>
    <P id="conj-adv.p.beyond-naming-conjunctions">
      Beyond naming conjunctions, discourse analysis names what each <em>sentence</em> is doing — the
      move it makes in the argument. These labels (after Black) let you outline a paragraph's logic: the
      main assertion, its grounds, restatements, illustrations, and so on.
    </P>
    <ColsTable id="conj-adv.ct5" tCols={[0, 1, 2]}
      title="Proposition labels (after Black)"
      headers={['Logic', 'Form', 'Clarification']}
      rows={[
        ['Event or Action', 'Situation – Response', 'Introduction'],
        ['Assertion', 'Problem – Resolution', 'Conclusion'],
        ['– Idea – Ground', 'Rhetorical question', 'Summary'],
        ['Expansion', 'Entreaty', 'List, Series'],
        ['Restatement', 'Exhortation or Warning', 'Parallel'],
        ['– Alternative', 'Exclamation', 'Apposition'],
        ['– Explanation', 'Desire (wish or hope)', 'Identification'],
        ['– Manner', 'Promise', 'Description'],
        ['– Question – Answer', 'Illustration / Example', 'Verification'],
      ]}
    />
    <SectionHeading id="conj-adv.h.going-deeper-reading">Going deeper: reading by the signs</SectionHeading>
    <P id="conj-adv.p.both-translate-twins">
      <strong>δέ vs. καί.</strong> Both translate "and," but they are not twins: <Gk>καί</Gk> simply
      adds; <Gk>δέ</Gk> marks a new development — a step forward in the story or argument. Mark strings
      scenes with <Gk>καί</Gk> (breathless, paratactic); Matthew and Luke often re-edit the same scenes
      with <Gk>δέ</Gk> (structured, developmental). An author's connective habits are part of his voice.
    </P>
    <P id="conj-adv.p.chains-paul-reasons">
      <strong>γάρ chains.</strong> Paul reasons in <Gk>γάρ</Gk>: claim, ground, ground of the ground.
      Romans 1:16–18 hangs three <Gk>γάρ</Gk> clauses in a row — outline them and the argument's skeleton
      stands out. When you preach a Pauline text, the <Gk>γάρ</Gk> chain often <em>is</em> the sermon
      outline.
    </P>
    <P id="conj-adv.p.asyndeton-because-greek">
      <strong>Asyndeton.</strong> Because Greek so regularly connects sentences, the <em>absence</em> of
      a connective (asyndeton) is itself a signal — abruptness, solemnity, a new section (common in John;
      striking in commands: <Gk>ἐγείρεσθε, ἄγωμεν</Gk>, "Rise, let us go," Mark 14:42). When the road
      signs suddenly stop, slow down.
    </P>
  </>
)
