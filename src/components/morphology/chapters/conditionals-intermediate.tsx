/* ─────────────────────────────────────────────
   Chapter: conjunctions — the INTERMEDIATE page

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

export const CONJUNCTIONS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="conditionals.h.int-classes">The classes of condition</SectionHeading>
    <P id="conditionals.p.int-classes-lead">
      A conditional sentence has two halves: the <em>protasis</em> (the “if” clause) and the <em>apodosis</em> (the “then” clause). Greek marks, in the protasis itself, how the speaker is presenting the condition — and that presentation is a rhetorical choice, not a claim about the facts. Four classes are traditionally distinguished; the New Testament uses three of them freely and never completes the fourth.
    </P>
    <SectionHeading id="conditionals.cg.int-four-classes">The four classes</SectionHeading>
    <CatGroup>
      <Cat id="conditionals.cat.first-class" name="First class" eg="εἰ + indicative" ex={[{ g: "εἰ Υἱὸς εἶ τοῦ Θεοῦ εἰπὲ ἵνα οἱ λίθοι οὗτοι ἄρτοι γένωνται", e: "if you are the Son of God, tell these stones to become bread", r: "Matt 4:3" }, { g: "εἰ δὲ Πνεύματι ἄγεσθε οὐκ ἐστὲ ὑπὸ νόμον", e: "but if you are led by the Spirit, you are not under law", r: "Gal 5:18" }]}><T id="conditionals.cat.first-class.d">the speaker argues <em>from</em> the condition — grammatically “if, and let us assume it is so.” It says nothing about whether the condition actually holds</T></Cat>
      <Cat id="conditionals.cat.second-class" name="Second class" eg="εἰ + past indicative, with ἄν in the apodosis" ex={[{ g: "οὗτος εἰ ἦν προφήτης ἐγίνωσκεν ἂν τίς καὶ ποταπὴ ἡ γυνή", e: "if this man were a prophet, he would have known who this woman is", r: "Luke 7:39" }, { g: "εἰ γὰρ ἐπιστεύετε Μωϋσεῖ ἐπιστεύετε ἂν ἐμοί", e: "for if you believed Moses, you would believe me", r: "John 5:46" }]}><T id="conditionals.cat.second-class.d">contrary to fact — the speaker signals that the condition is <em>not</em> the case. The <G>ἄν</G> in the apodosis is the marker to look for</T></Cat>
      <Cat id="conditionals.cat.third-class" name="Third class" eg="ἐάν + subjunctive" ex={[{ g: "ἐὰν ὁμολογῶμεν τὰς ἁμαρτίας ἡμῶν πιστός ἐστιν", e: "if we confess our sins, he is faithful", r: "1 John 1:9" }, { g: "ἐάν τις ἀγαπᾷ τὸν κόσμον οὐκ ἔστιν ἡ ἀγάπη τοῦ Πατρὸς ἐν αὐτῷ", e: "if anyone loves the world, the love of the Father is not in him", r: "1 John 2:15" }]}><T id="conditionals.cat.third-class.d">the condition is left genuinely open — a future prospect, or a general truth about whoever it applies to. Much the commonest class in the New Testament</T></Cat>
      <Cat id="conditionals.cat.fourth-class" name="Fourth class" eg="εἰ + optative" ex={[{ g: "ἀλλ’ εἰ καὶ πάσχοιτε διὰ δικαιοσύνην μακάριοι", e: "but even if you should suffer for righteousness’ sake, you are blessed", r: "1 Pet 3:14" }]}><T id="conditionals.cat.fourth-class.d">remote possibility — “if it should happen, which it very well might not.” No New Testament sentence has both halves; only fragments survive</T></Cat>
    </CatGroup>
    <P id="conditionals.p.int-caution">
      <strong>The caution that matters.</strong> A first-class condition does not mean “since.” The grammar presents the condition as true <em>for the sake of the argument</em>, and the same construction carries a taunt at the cross — <Gk>εἰ Υἱὸς εἶ τοῦ Θεοῦ, κατάβηθι</Gk>, “if you are the Son of God, come down” (Matt 27:40) — where the speakers plainly do not believe it. Read the class as a rhetorical posture, and let the context say whether the speaker means it.
    </P>
    <SectionHeading id="conditionals.h.going-deeper-conditions">Going deeper: conditions as rhetoric</SectionHeading>
    <P id="conditionals.p.class-lever-because">
      <strong>The 1st class as a lever.</strong> Because it assumes rather than asserts, the 1st class is
      a rhetorical instrument. Paul uses it to argue from shared ground (Gal 3:29); Satan uses it to
      needle (<Gk>εἰ υἱὸς εἶ τοῦ θεοῦ</Gk>, Matt 4:3 — "granting, for the moment, that you are…"); Jesus
      turns it back on accusers (<Gk>εἰ δὲ ἐγὼ ἐν Βεελζεβοὺλ ἐκβάλλω τὰ δαιμόνια…</Gk>, Luke 11:19).
      Ask <em>why</em> a speaker assumes the protasis, and exegesis begins.
    </P>
    <P id="conditionals.p.missing-classes-grammars">
      <strong>The missing classes.</strong> Grammars also list a 4th class — <Gk>εἰ</Gk> + optative, the
      "remote possibility" — which survives only in fragments in the NT (<Gk>εἰ καὶ πάσχοιτε</Gk>, "even
      if you should suffer," 1 Pet 3:14), as the optative mood was dying in Koine. Where you meet a bare
      optative wish instead, it is usually the fossil <Gk>μὴ γένοιτο</Gk>, "may it never be!" — Paul's
      recoil in Romans.
    </P>
    <P id="conditionals.p.conditions-without-greek">
      <strong>Conditions without εἰ.</strong> Greek can smuggle conditions into other clothing: the
      conditional participle (<Gk>θερίσομεν μὴ ἐκλυόμενοι</Gk>, "we will reap, <em>if we do not give
      up</em>," Gal 6:9) and the conditional imperative (John 2:19). When a "then" seems to follow from a
      phrase that isn't an "if," suspect a hidden protasis.
    </P>
  </>
)
