/* ─────────────────────────────────────────────
   Chapter: participles — the INTERMEDIATE page

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

export const PARTICIPLES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="participles.cg.adjectival-with-the">Adjectival (with the article)</SectionHeading>
    <CatGroup>
            <Cat id="participles.cat.attributive"name="Attributive" eg="“the man who is loosing…”" ex={[{ g: "ὁ ἄρτος ὁ ἐκ τοῦ οὐρανοῦ καταβαίνων", e: "the bread that comes down from heaven", r: "John 6:50" }, { g: "τὸ πνεῦμα τὸ λαλοῦν ἐν ὑμῖν", e: "the Spirit who speaks in you", r: "Matt 10:20" }]}><T id="participles.cat.attributive.d">adds detail to a noun (“who / which”)</T></Cat>
            <Cat id="participles.cat.substantival"name="Substantival" eg="ὁ πιστεύων, “the believer”" ex={[{ g: "ὁ πιστεύων εἰς τὸν υἱὸν ἔχει ζωὴν αἰώνιον", e: "the one who believes in the Son has eternal life", r: "John 3:36" }, { g: "μακάριοι οἱ πενθοῦντες", e: "blessed are those who mourn", r: "Matt 5:5" }]}><T id="participles.cat.substantival.d">stands alone as a noun</T></Cat>
            <Cat id="participles.cat.predicate"name="Predicate" ex={[{ g: "εἶδεν τὸ πνεῦμα καταβαῖνον εἰς αὐτόν", e: "he saw the Spirit descending upon him", r: "Mark 1:10" }, { g: "εὑρήσετε βρέφος ἐσπαργανωμένον ἐν φάτνῃ", e: "you will find a baby wrapped in cloths in a manger", r: "Luke 2:12" }]}><T id="participles.cat.predicate.d">asserts something of the noun (rare)</T></Cat>
    </CatGroup>
    <SectionHeading id="participles.cg.adverbial-circumstantial-no">Adverbial / circumstantial (no article) — modifies the main verb</SectionHeading>
    <CatGroup>
            <Cat id="participles.cat.temporal"name="Temporal" eg="“while eating…”" ex={[{ g: "ἐλθὼν ὁ Ἰησοῦς εἰς τὴν οἰκίαν Πέτρου", e: "when Jesus came into Peter’s house", r: "Matt 8:14" }, { g: "ἀκούσαντες δὲ ἐβαπτίσθησαν", e: "and when they heard, they were baptized", r: "Acts 19:5" }]}><T id="participles.cat.temporal.d">answers <em>when?</em></T></Cat>
            <Cat id="participles.cat.cause"name="Cause" eg="“because he was righteous”" ex={[{ g: "Ἰωσὴφ δίκαιος ὢν", e: "Joseph, because he was righteous", r: "Matt 1:19" }, { g: "πλανᾶσθε μὴ εἰδότες τὰς γραφάς", e: "you are wrong because you do not know the Scriptures", r: "Matt 22:29" }]}><T id="participles.cat.cause.d">answers <em>why?</em> — “because”</T></Cat>
            <Cat id="participles.cat.means-manner"name="Means / Manner" eg="“by doing this…”" ex={[{ g: "τίς μεριμνῶν δύναται προσθεῖναι πῆχυν;", e: "who by worrying can add a single cubit?", r: "Matt 6:27" }, { g: "ἐπορεύοντο χαίροντες", e: "they went on their way rejoicing", r: "Acts 5:41" }]}><T id="participles.cat.means-manner.d">answers <em>how?</em></T></Cat>
            <Cat id="participles.cat.condition"name="Condition" eg="“if you do this…”" ex={[{ g: "θερίσομεν μὴ ἐκλυόμενοι", e: "we will reap, if we do not give up", r: "Gal 6:9" }, { g: "πῶς ἡμεῖς ἐκφευξόμεθα τηλικαύτης ἀμελήσαντες σωτηρίας;", e: "how shall we escape if we neglect so great a salvation?", r: "Heb 2:3" }]}><T id="participles.cat.condition.d">the “if” on which the verb depends</T></Cat>
            <Cat id="participles.cat.concession"name="Concession" eg="“although they knew God…”" ex={[{ g: "γνόντες τὸν θεὸν οὐχ ὡς θεὸν ἐδόξασαν", e: "although they knew God, they did not glorify him as God", r: "Rom 1:21" }, { g: "ὃν οὐκ ἰδόντες ἀγαπᾶτε", e: "though you have not seen him, you love him", r: "1 Pet 1:8" }]}><T id="participles.cat.concession.d">“although”</T></Cat>
            <Cat id="participles.cat.purpose"name="Purpose" ex={[{ g: "ἐληλύθει προσκυνήσων εἰς Ἰερουσαλήμ", e: "he had come to worship in Jerusalem", r: "Acts 8:27" }, { g: "ἴδωμεν εἰ ἔρχεται Ἡλείας σώσων αὐτόν", e: "let us see whether Elijah comes to save him", r: "Matt 27:49" }]}><T id="participles.cat.purpose.d">answers <em>why?</em> looking forward — “in order to”</T></Cat>
    </CatGroup>
    <SectionHeading id="participles.cg.other-uses">Other uses</SectionHeading>
    <CatGroup>
            <Cat id="participles.cat.attendant-circumstance"name="Attendant Circumstance" eg="“Go and make disciples”" ex={[{ g: "πορευθέντες μαθητεύσατε πάντα τὰ ἔθνη", e: "go and make disciples of all nations", r: "Matt 28:19" }, { g: "ἐγερθεὶς παράλαβε τὸ παιδίον", e: "rise and take the child", r: "Matt 2:13" }]}><T id="participles.cat.attendant-circumstance.d">translate as a finite verb + “and”; pigg-backs on the main verb</T></Cat>
            <Cat id="participles.cat.periphrastic"name="Periphrastic" ex={[{ g: "ἦν διδάσκων αὐτοὺς ὡς ἐξουσίαν ἔχων", e: "he was teaching them as one having authority", r: "Mark 1:22" }, { g: "ἦν ὁ λαὸς προσδοκῶν τὸν Ζαχαρίαν", e: "the people were waiting for Zechariah", r: "Luke 1:21" }]}><T id="participles.cat.periphrastic.d">a participle + a form of <G>εἰμί</G> making one verbal idea</T></Cat>
            <Cat id="participles.cat.imperatival"name="Imperatival" ex={[{ g: "τῇ ἐλπίδι χαίροντες, τῇ θλίψει ὑπομένοντες", e: "rejoice in hope, be patient in tribulation", r: "Rom 12:12" }, { g: "ἀποστυγοῦντες τὸ πονηρόν, κολλώμενοι τῷ ἀγαθῷ", e: "abhor what is evil, cling to what is good", r: "Rom 12:9" }]}><T id="participles.cat.imperatival.d">a participle functioning as a command</T></Cat>
            <Cat id="participles.cat.genitive-absolute"name="Genitive Absolute" ex={[{ g: "ὀψίας δὲ γενομένης", e: "when evening had come", r: "Matt 8:16" }, { g: "ἔτι αὐτοῦ λαλοῦντος ἰδοὺ Ἰούδας ἦλθεν", e: "while he was still speaking, behold, Judas came", r: "Matt 26:47" }]}><T id="participles.cat.genitive-absolute.d">detached participle + noun, both genitive — usually background/time</T></Cat>
    </CatGroup>
    <SectionHeading id="participles.h.going-deeper-adverbial">Going deeper: the adverbial flavours</SectionHeading>
    <P id="participles.p.calling-participle-adverbial">
      Calling a participle "adverbial" only starts the conversation; the exegetical question
      is <em>which</em> circumstance it adds. The main flavours (full catalogue in the sections above):
      <strong> temporal</strong> ("when/after"), <strong>causal</strong> ("because" — <Gk>δίκαιος ὤν</Gk>,
      "because he was righteous," Matt 1:19), <strong>concessive</strong> ("although" —
      <Gk> γνόντες τὸν θεόν</Gk>, "although they knew God," Rom 1:21), <strong>means</strong> ("by …ing"),
      <strong> conditional</strong> ("if"), and <strong>purpose</strong> ("in order to"). The form is
      identical; context assigns the flavour — which means the translator is always interpreting.
    </P>
    <P id="participles.p.attendant-circumstance-sometimes">
      <strong>Attendant circumstance.</strong> Sometimes an aorist participle piggy-backs on the main
      verb's force and translates as a parallel verb + "and." The famous case is Matt 28:19:
      <Gk> πορευθέντες μαθητεύσατε</Gk> — "<em>Go and</em> make disciples," the participle borrowing the
      imperative's punch. The tell-tale pattern: aorist participle <em>before</em> an aorist main verb,
      typically in narrative or command.
    </P>
    <P id="participles.p.periphrastics-participle-form">
      <strong>Periphrastics.</strong> A participle + a form of <Gk>εἰμί</Gk> can stand in for a simple
      tense: <Gk>ἦν διδάσκων</Gk> = "he was teaching" (imperfect equivalent). Common in Luke. The
      combination usually emphasizes the ongoing process.
    </P>
    <P id="participles.p.redundant-participle-narrative">
      <strong>Redundant participle.</strong> Narrative Greek loves <Gk>ἀποκριθεὶς εἶπεν</Gk> — literally
      "having answered, he said," functionally just "he answered." A Semitic-flavoured idiom; translate
      it once, not twice.
    </P>
  </>
)
