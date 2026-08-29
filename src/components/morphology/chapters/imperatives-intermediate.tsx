/* ─────────────────────────────────────────────
   Chapter: imperatives — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.
───────────────────────────────────────────── */

import {
  Gk, P, SectionHeading
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const IMPERATIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="imperatives.h.int-uses">The uses of the imperative</SectionHeading>
    <CatGroup>
            <Cat id="imperatives.cat.command"name="Command" eg="“Go and make disciples”" ex={[{ g: "πορευθέντες μαθητεύσατε πάντα τὰ ἔθνη", e: "go and make disciples of all nations", r: "Matt 28:19" }, { g: "ἀκολούθει μοι", e: "follow me", r: "Matt 9:9" }]}><T id="imperatives.cat.command.d">a straightforward order, usually superior to inferior</T></Cat>
            <Cat id="imperatives.cat.prohibition"name="Prohibition" eg="“do not fear”" ex={[{ g: "μὴ φοβοῦ, μόνον πίστευε", e: "do not fear, only believe", r: "Mark 5:36" }, { g: "μὴ κρίνετε, ἵνα μὴ κριθῆτε", e: "do not judge, so that you may not be judged", r: "Matt 7:1" }]}><T id="imperatives.cat.prohibition.d"><G>μή</G> + imperative forbids an action</T></Cat>
            <Cat id="imperatives.cat.request-entreaty"name="Request / Entreaty" eg="“give us this day our daily bread”" ex={[{ g: "τὸν ἄρτον ἡμῶν δὸς ἡμῖν σήμερον", e: "give us this day our daily bread", r: "Matt 6:11" }, { g: "κύριε, βοήθει μοι", e: "Lord, help me", r: "Matt 15:25" }]}><T id="imperatives.cat.request-entreaty.d">a polite appeal, often inferior to superior</T></Cat>
            <Cat id="imperatives.cat.permissive"name="Permissive" ex={[{ g: "ὃ ποιεῖς ποίησον τάχιον", e: "what you do, do quickly", r: "John 13:27" }, { g: "εἰ ὁ ἄπιστος χωρίζεται, χωριζέσθω", e: "if the unbeliever separates, let it be so", r: "1 Cor 7:15" }]}><T id="imperatives.cat.permissive.d">allows or tolerates an action ("let him do it")</T></Cat>
            <Cat id="imperatives.cat.conditional"name="Conditional" ex={[{ g: "λύσατε τὸν ναὸν τοῦτον, καὶ ἐγερῶ αὐτόν", e: "destroy this temple, and I will raise it up", r: "John 2:19" }, { g: "ἐγγίσατε τῷ θεῷ, καὶ ἐγγιεῖ ὑμῖν", e: "draw near to God, and he will draw near to you", r: "Jas 4:8" }]}><T id="imperatives.cat.conditional.d">an imperative that states a condition ("do X, and Y will follow")</T></Cat>
    </CatGroup>
    <SectionHeading id="imperatives.h.int-prohibitions">Prohibitions: the gap the subjunctive fills</SectionHeading>
    <P id="imperatives.p.int-prohibitions-lead">
      Greek has no ordinary way of saying “don’t” with a second-person aorist imperative. The form
      exists, but with <Gk>μή</Gk> it is all but unused — and the language fills the empty slot with
      the aorist <em>subjunctive</em> instead. That is why the prohibition system straddles two
      moods: to forbid something you reach for a present imperative or an aorist subjunctive, and
      the choice between them is aspect, not politeness.
    </P>
    <P id="imperatives.p.int-ou-me">
      Which negative goes where follows the same logic. <Gk>οὐ</Gk> negates a fact, so it belongs
      with the indicative; <Gk>μή</Gk> negates a will, a wish or a supposition, so it belongs with
      every other mood. A prohibition is an act of will — hence <Gk>μή</Gk> throughout — and the
      one construction that stacks both negatives, <Gk>οὐ μή</Gk>, is not a prohibition at all but
      the strongest denial the language can make.
    </P>
    <SectionHeading id="imperatives.cg.int-prohibitions">How to say “do not”</SectionHeading>
    <CatGroup>
      <Cat id="imperatives.cat.proh-present-imv" name="μή + present imperative" eg="μὴ κρίνετε “do not judge”" ex={[{ g: "Μὴ κρίνετε ἵνα μὴ κριθῆτε", e: "do not judge, so that you may not be judged", r: "Matt 7:1" }, { g: "μὴ μεριμνᾶτε τῇ ψυχῇ ὑμῶν τί φάγητε", e: "do not be anxious for your life, what you will eat", r: "Matt 6:25" }]}><T id="imperatives.cat.proh-present-imv.d">forbids as a general or ongoing matter. Often rendered “do not make a habit of…”, and where the hearers are already doing the thing, “stop”</T></Cat>
      <Cat id="imperatives.cat.proh-aorist-subj" name="μή + aorist subjunctive" eg="μὴ νομίσητε “do not suppose”" ex={[{ g: "Μὴ νομίσητε ὅτι ἦλθον καταλῦσαι τὸν νόμον", e: "do not suppose that I came to abolish the law", r: "Matt 5:17" }, { g: "μὴ οὖν μεριμνήσητε λέγοντες τί φάγωμεν", e: "so do not be anxious, saying, what shall we eat?", r: "Matt 6:31" }]}><T id="imperatives.cat.proh-aorist-subj.d">the prohibitive subjunctive — the form that stands in for the missing aorist imperative. It forbids the act viewed as a whole, and is as much a command as any imperative</T></Cat>
      <Cat id="imperatives.cat.proh-third-person" name="μή + third-person aorist imperative" eg="μὴ καταβάτω “let him not go down”" ex={[{ g: "ὁ ἐπὶ τοῦ δώματος μὴ καταβάτω ἆραι τὰ ἐκ τῆς οἰκίας αὐτοῦ", e: "let the one on the housetop not go down to take what is in his house", r: "Matt 24:17" }]}><T id="imperatives.cat.proh-third-person.d">in the third person the aorist imperative survives in prohibitions, because there is no subjunctive idiom competing for the slot. English has to reach for “let him not…”</T></Cat>
      <Cat id="imperatives.cat.proh-compound" name="μηδέ and μηδείς" eg="μηδενὶ εἴπῃς “tell no one”" ex={[{ g: "ὅρα μηδενὶ εἴπῃς", e: "see that you tell no one", r: "Matt 8:4" }, { g: "μὴ καταβάτω μηδὲ εἰσελθάτω ἆραί τι ἐκ τῆς οἰκίας αὐτοῦ", e: "let him not go down nor go in to take anything out of his house", r: "Mark 13:15" }]}><T id="imperatives.cat.proh-compound.d">a prohibition already under <G>μή</G> is continued with the compound negatives, which keep the same mood rather than starting a new construction</T></Cat>
      <Cat id="imperatives.cat.proh-ou-me" name="οὐ μή + aorist subjunctive" eg="οὐ μὴ εἰσέλθητε “you will certainly not enter”" ex={[{ g: "οὐ μὴ εἰσέλθητε εἰς τὴν βασιλείαν τῶν οὐρανῶν", e: "you will certainly not enter the kingdom of heaven", r: "Matt 5:20" }]}><T id="imperatives.cat.proh-ou-me.d">not a prohibition but an emphatic denial — the speaker rules the thing out entirely. Read it as “will certainly not,” never as “do not”</T></Cat>
      <Cat id="imperatives.cat.proh-future" name="οὐ + future indicative" eg="οὐ φονεύσεις “you shall not murder”" ex={[{ g: "ἐρρέθη τοῖς ἀρχαίοις οὐ φονεύσεις", e: "it was said to the ancients, you shall not murder", r: "Matt 5:21" }, { g: "τὸ γὰρ οὐ μοιχεύσεις οὐ φονεύσεις οὐ κλέψεις", e: "for the “you shall not commit adultery, you shall not murder, you shall not steal”", r: "Rom 13:9" }]}><T id="imperatives.cat.proh-future.d">the imperatival future, carried into Greek from the Hebrew of the commandments. It is a flat statement of what will not be done, functioning as an absolute prohibition</T></Cat>
    </CatGroup>
    <P id="imperatives.p.int-aspect-caution">
      <strong>The rule you will meet, and the reason to hold it loosely.</strong> Older grammars
      teach that <Gk>μή</Gk> with the present means “stop doing what you are doing,” and with the
      aorist “do not start.” It is a useful first approximation and it is not a law. Matthew
      forbids anxiety with the present imperative at 6:25 — <Gk>μὴ μεριμνᾶτε</Gk> — and with the
      aorist subjunctive six verses later at 6:31 — <Gk>μὴ οὖν μεριμνήσητε</Gk> — in one continuous
      argument, to one audience, about one thing. If the aspects carried the sharp force the rule
      claims, that would be incoherent. Take the present as viewing the prohibition as ongoing and
      the aorist as viewing it whole, and let the context, not the paradigm, decide whether
      “stop” is warranted.
    </P>
    <SectionHeading id="imperatives.h.going-deeper-commands">Going deeper: commands with manners</SectionHeading>
    <P id="imperatives.p.request-just-order">
      <strong>Request, not just order.</strong> Direction of rank matters: an imperative from an inferior
      to a superior is an entreaty. Every petition of the Lord's Prayer is an aorist imperative —
      <Gk> ἁγιασθήτω, ἐλθέτω, γενηθήτω, δός, ἄφες</Gk> — prayer language, not barked orders. Translating
      "give us" as rude misreads the mood's range.
    </P>
    <P id="imperatives.p.permission-toleration-occasionally">
      <strong>Permission and toleration.</strong> Occasionally the imperative concedes rather than
      commands: <Gk>ὁ ἀδικῶν ἀδικησάτω ἔτι</Gk>, "let the evildoer still do evil" (Rev 22:11) — grim
      permission, not encouragement. Context, as ever, assigns the force.
    </P>
  </>
)
