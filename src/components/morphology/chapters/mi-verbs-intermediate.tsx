/* ─────────────────────────────────────────────
   Chapter: mi-verbs — the INTERMEDIATE page

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

export const MI_VERBS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="mi-verbs.h.int-athematic">The athematic conjugation</SectionHeading>
    <P id="mi-verbs.p.int-lead">
      The <Gk>-μι</Gk> verbs are the older layer of the language. They attach their endings straight to the stem with no connecting vowel — which is what “athematic” means — and the club is small enough to learn by name, but its members are so frequent, and so theologically loaded, that they repay it several times over.
    </P>
    <SectionHeading id="mi-verbs.cg.int-habits">The habits that identify them</SectionHeading>
    <CatGroup>
      <Cat id="mi-verbs.cat.reduplication" name="Present reduplication with iota" eg="δίδωμι, τίθημι, ἵστημι" ex={[{ g: "οὕτως γὰρ ἠγάπησεν ὁ Θεὸς τὸν κόσμον ὥστε τὸν Υἱὸν τὸν μονογενῆ ἔδωκεν", e: "for God so loved the world that he gave his only Son", r: "John 3:16" }]}><T id="mi-verbs.cat.reduplication.d">the present stem doubles its first consonant with an <G>ι</G>: <G>δι-δο</G>, <G>τι-θε</G>, <G>ἱ-στα</G>. See that pattern and you are in the present system, nowhere else</T></Cat>
      <Cat id="mi-verbs.cat.vowel-gradation" name="Long in the singular, short in the plural" eg="δίδωσι / δίδομεν" ex={[{ g: "κἀγὼ δίδωμι αὐτοῖς ζωὴν αἰώνιον", e: "I give them eternal life", r: "John 10:28" }]}><T id="mi-verbs.cat.vowel-gradation.d">the stem vowel alternates by number — <G>δίδωμι, δίδως, δίδωσι</G> against <G>δίδομεν, δίδοτε</G>. The alternation is the surest tell after reduplication</T></Cat>
      <Cat id="mi-verbs.cat.kappa-aorist" name="A κ where others take σ" eg="ἔδωκα, ἔθηκα" ex={[{ g: "τὴν ψυχήν μου τίθημι ὑπὲρ τῶν προβάτων", e: "I lay down my life for the sheep", r: "John 10:15" }]}><T id="mi-verbs.cat.kappa-aorist.d">the aorist drops the iota reduplication and takes <G>-κα</G> instead of <G>-σα</G>. Same augment, same endings, different marker</T></Cat>
      <Cat id="mi-verbs.cat.compounds" name="Most of the frequency is in compounds" eg="παραδίδωμι, ἀφίημι, ἀνίστημι" ex={[{ g: "ἀφίενταί σου αἱ ἁμαρτίαι", e: "your sins are forgiven", r: "Mark 2:5" }]}><T id="mi-verbs.cat.compounds.d">preposition + <G>-μι</G> verb carries much of the class’s New Testament weight, and several of the compounds are theological heavyweights in their own right</T></Cat>
    </CatGroup>
    <P id="mi-verbs.p.int-caution">
      <strong>Where it bites.</strong> <Gk>παραδίδωμι</Gk> — “hand over” — is the verb of the betrayal and of the delivering up of the Son, and it is the same word in both. Reading the <Gk>-μι</Gk> forms fluently is the difference between noticing that and not.
    </P>
    <SectionHeading id="mi-verbs.h.going-deeper-small">Going deeper: small club, heavy theology</SectionHeading>
    <P id="mi-verbs.p.stative-perfect-because">
      <strong>ἵστημι's stative perfect.</strong> Because its perfect <Gk>ἕστηκα</Gk> denotes the
      <em> state</em> of standing, it translates as an English present: <Gk>ἰδοὺ ἕστηκα ἐπὶ τὴν θύραν</Gk>,
      "behold, I <em>stand</em> at the door" (Rev 3:20). A "have stood" here would miss the living
      posture the perfect asserts.
    </P>
    <P id="mi-verbs.p.passion-gospels-thread">
      <strong>παραδίδωμι and the passion.</strong> The Gospels thread one verb through the whole story:
      Judas <em>hands over</em> Jesus (Mark 14:10), the chief priests <em>hand him over</em> to Pilate
      (15:1), Pilate <em>hands him over</em> to be crucified (15:15) — and Paul dares to make God the
      subject: "he did not spare his own Son but <em>handed him over</em> for us all" (Rom 8:32). Tracking
      the verb is tracking the theology.
    </P>
    <P id="mi-verbs.p.range-one-verb">
      <strong>ἀφίημι's range.</strong> One verb covers "forgive" (sins), "leave" (nets, Matt 4:20), and
      "allow" (Matt 3:15). The root picture — releasing, letting go — underlies all three; context picks
      the English word, and the shared root sometimes carries the point.
    </P>
  </>
)
