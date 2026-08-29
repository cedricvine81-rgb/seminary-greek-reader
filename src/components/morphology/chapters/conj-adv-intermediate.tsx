/* ─────────────────────────────────────────────
   Chapter: conj-adv — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.
───────────────────────────────────────────── */

import {
  ColsTable, Gk, P, SectionHeading,
} from '../shared'

export const CONJ_ADV_INTERMEDIATE_CONTENT = (
  <>
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
