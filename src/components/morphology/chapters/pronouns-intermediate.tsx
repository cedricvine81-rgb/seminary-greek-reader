/* ─────────────────────────────────────────────
   Chapter: pronouns — the INTERMEDIATE page

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

export const PRONOUNS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="pronouns.h.going-deeper-small">Going deeper: small words, large claims</SectionHeading>
    <P id="pronouns.p.three-faces-position">
      <strong>The three faces of αὐτός.</strong> Position is everything. Oblique and alone, it is the plain
      pronoun ("him"). Inside the article-unit — <Gk>ὁ αὐτὸς λόγος</Gk> — it means "the <em>same</em> word."
      In predicate position — <Gk>αὐτὸς ὁ κύριος</Gk> — it intensifies: "the Lord <em>himself</em>"
      (1 Thess 4:16). Same word, three meanings, all decided by the article.
    </P>
    <P id="pronouns.p.emphatic-since-verb">
      <strong>Emphatic ἐγώ εἰμι.</strong> Since the verb alone means "I am," the spelled-out
      <Gk> ἐγώ εἰμι</Gk> is doubly weighted — and John builds a christology on it: "before Abraham was,
      <Gk> ἐγὼ εἰμί</Gk>" (John 8:58), echoing the divine self-declaration of Exod 3:14 (LXX). The
      crowd's reaction — picking up stones — shows they heard the claim in the grammar.
    </P>
    <P id="pronouns.p.editorial-first-person">
      <strong>Editorial "we."</strong> A first-person plural does not always include the readers: Paul's
      "we" sometimes means himself alone (epistolary plural), sometimes himself and his co-workers
      (exclusive), sometimes everyone (inclusive). Deciding which is a genuinely interpretive act —
      try it on the "we" statements of 1 John 1.
    </P>
  </>
)
