/* ─────────────────────────────────────────────
   Chapter: pronouns — the INTERMEDIATE page

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

export const PRONOUNS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="pronouns.h.int-uses">The pronouns, by job</SectionHeading>
    <P id="pronouns.p.int-lead">
      Greek gets more work out of its pronouns than English does, and the same form does several jobs. <Gk>αὐτός</Gk> alone is the ordinary third-person pronoun, an intensive “himself,” and — with the article — “the same.” Position and article are what separate them.
    </P>
    <SectionHeading id="pronouns.cg.int-personal">Personal and intensive</SectionHeading>
    <CatGroup>
      <Cat id="pronouns.cat.personal-emphatic" name="Emphatic personal" eg="“<em>I</em> baptise you… <em>he</em> will baptise you”" ex={[{ g: "ἐγὼ μὲν ὑμᾶς βαπτίζω ἐν ὕδατι", e: "I baptise you with water", r: "Matt 3:11" }, { g: "σὺ εἶ ὁ Υἱός μου ὁ ἀγαπητός", e: "you are my beloved Son", r: "Mark 1:11" }]}><T id="pronouns.cat.personal-emphatic.d">the verb ending already gives the subject, so a nominative <G>ἐγώ</G> or <G>σύ</G> is there for weight or contrast</T></Cat>
      <Cat id="pronouns.cat.intensive" name="Intensive" eg="Ἰησοῦς αὐτός “Jesus himself”" ex={[{ g: "αὐτὸς Δαυεὶδ εἶπεν ἐν τῷ πνεύματι τῷ ἁγίῳ", e: "for David himself said in the Holy Spirit", r: "Mark 12:36" }, { g: "Ἰησοῦς αὐτὸς οὐκ ἐβάπτιζεν", e: "Jesus himself was not baptising", r: "John 4:2" }]}><T id="pronouns.cat.intensive.d">stands outside the article–noun unit where there is one, and beside an anarthrous name simply next to it — translated “himself, herself, itself”</T></Cat>
      <Cat id="pronouns.cat.identical" name="Identical" eg="τὸ αὐτό “the same thing”" ex={[{ g: "τὸ αὐτὸ φρονεῖτε", e: "be of the same mind", r: "2 Cor 13:11" }, { g: "τὸν αὐτὸν ἀγῶνα ἔχοντες", e: "having the same struggle", r: "Phil 1:30" }]}><T id="pronouns.cat.identical.d">attributive position, with the article — “the same”</T></Cat>
    </CatGroup>
    <SectionHeading id="pronouns.cg.int-reflexive">Turning the action back</SectionHeading>
    <CatGroup>
      <Cat id="pronouns.cat.reflexive" name="Reflexive" eg="ἑαυτόν “himself” as object" ex={[{ g: "σῶσον σεαυτὸν καταβὰς ἀπὸ τοῦ σταυροῦ", e: "save yourself by coming down from the cross", r: "Mark 15:30" }, { g: "ἀγαπήσεις τὸν πλησίον σου ὡς σεαυτόν", e: "you shall love your neighbour as yourself", r: "Matt 22:39" }]}><T id="pronouns.cat.reflexive.d">the action returns to its own subject; the form only ever appears in the oblique cases, because a reflexive can never be the subject</T></Cat>
      <Cat id="pronouns.cat.reciprocal" name="Reciprocal" eg="ἀλλήλους “one another”" ex={[{ g: "ἀγαπᾶτε ἀλλήλους καθὼς ἠγάπησα ὑμᾶς", e: "love one another as I have loved you", r: "John 13:34" }, { g: "ἀλλήλων τὰ βάρη βαστάζετε", e: "bear one another’s burdens", r: "Gal 6:2" }]}><T id="pronouns.cat.reciprocal.d">plural only, and always mutual — “one another,” not “themselves”</T></Cat>
    </CatGroup>
    <SectionHeading id="pronouns.cg.int-asking">Asking and leaving open</SectionHeading>
    <CatGroup>
      <Cat id="pronouns.cat.interrogative" name="Interrogative" eg="τίνα ζητεῖς; “whom do you seek?”" ex={[{ g: "τίνα ζητεῖς", e: "whom do you seek?", r: "John 20:15" }, { g: "τί με λέγεις ἀγαθόν", e: "why do you call me good?", r: "Mark 10:18" }]}><T id="pronouns.cat.interrogative.d">accented <G>τίς</G>, and it always keeps its accent — “who? what? why?”</T></Cat>
      <Cat id="pronouns.cat.indefinite" name="Indefinite" eg="ἄνθρωπός τις “a certain man”" ex={[{ g: "ἄνθρωπός τις εἶχεν δύο υἱούς", e: "a certain man had two sons", r: "Luke 15:11" }, { g: "ἐάν τις ἀγαπᾷ τὸν κόσμον", e: "if anyone loves the world", r: "1 John 2:15" }]}><T id="pronouns.cat.indefinite.d">enclitic <G>τις</G>, leaning on the word before it — “someone, a certain, any”</T></Cat>
    </CatGroup>
    <P id="pronouns.p.int-accent-test">
      <strong>The accent is the test.</strong> <Gk>τίς</Gk> and <Gk>τις</Gk> are the same letters; the acute marks the question. And for “himself,” the <em>delete-test</em> settles intensive against reflexive: remove the word, and if the sense survives it was intensive (<Gk>Ἰησοῦς αὐτός</Gk> — Jesus was still not baptising), while if the sentence collapses it was reflexive (<Gk>σῶσον σεαυτόν</Gk> needs its object).
    </P>
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
