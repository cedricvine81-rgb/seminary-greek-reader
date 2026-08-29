/* ─────────────────────────────────────────────
   Chapter: subjunctives — the INTERMEDIATE page

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

export const SUBJUNCTIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="subjunctives.cg.in-independent-clauses">In independent clauses</SectionHeading>
    <CatGroup>
            <Cat id="subjunctives.cat.hortatory"name="Hortatory" eg="“let us love one another”" ex={[{ g: "ἀγαπῶμεν ἀλλήλους", e: "let us love one another", r: "1 John 4:7" }, { g: "διέλθωμεν ἕως Βηθλέεμ", e: "let us go over to Bethlehem", r: "Luke 2:15" }]}><T id="subjunctives.cat.hortatory.d">1st person plural — an exhortation</T></Cat>
            <Cat id="subjunctives.cat.deliberative"name="Deliberative" eg="“what shall we say?”" ex={[{ g: "τί οὖν ποιήσωμεν;", e: "what then shall we do?", r: "Luke 3:10" }, { g: "δῶμεν ἢ μὴ δῶμεν;", e: "shall we pay, or shall we not?", r: "Mark 12:14" }]}><T id="subjunctives.cat.deliberative.d">a real or rhetorical question about what to do</T></Cat>
            <Cat id="subjunctives.cat.emphatic-negation"name="Emphatic Negation" eg="“will never perish”" ex={[{ g: "οὐ μὴ ἀπόλωνται εἰς τὸν αἰῶνα", e: "they shall never perish", r: "John 10:28" }, { g: "οἱ λόγοι μου οὐ μὴ παρέλθωσιν", e: "my words will never pass away", r: "Matt 24:35" }]}><T id="subjunctives.cat.emphatic-negation.d"><G>οὐ μή</G> + aorist subjunctive — the strongest “no”</T></Cat>
            <Cat id="subjunctives.cat.prohibitive"name="Prohibitive" eg="“do not fear”" ex={[{ g: "μὴ φοβηθῇς παραλαβεῖν Μαρίαν", e: "do not be afraid to take Mary", r: "Matt 1:20" }, { g: "μὴ δόξητε λέγειν ἐν ἑαυτοῖς", e: "do not presume to say among yourselves", r: "Matt 3:9" }]}><T id="subjunctives.cat.prohibitive.d"><G>μή</G> + aorist subjunctive (a negative command)</T></Cat>
    </CatGroup>
    <SectionHeading id="subjunctives.cg.in-dependent-clauses">In dependent clauses</SectionHeading>
    <CatGroup>
            <Cat id="subjunctives.cat.subjunctive"name="ἵνα + subjunctive" ex={[{ g: "ἵνα πᾶς ὁ πιστεύων εἰς αὐτὸν ἔχῃ ζωὴν αἰώνιον", e: "that whoever believes in him may have eternal life", r: "John 3:16" }, { g: "ἦλθεν ἵνα μαρτυρήσῃ περὶ τοῦ φωτός", e: "he came to bear witness about the light", r: "John 1:7" }]}><T id="subjunctives.cat.subjunctive.d">purpose (“in order that”) or result (“so that”)</T></Cat>
            <Cat id="subjunctives.cat.conditional"name="Conditional" eg="“if you ask…”" ex={[{ g: "ἐάν τι αἰτήσητέ με, ἐγὼ ποιήσω", e: "if you ask me anything, I will do it", r: "John 14:14" }, { g: "ἐὰν ὁμολογῶμεν τὰς ἁμαρτίας ἡμῶν", e: "if we confess our sins", r: "1 John 1:9" }]}><T id="subjunctives.cat.conditional.d"><G>ἐάν</G> + subjunctive — the 3rd-class condition</T></Cat>
            <Cat id="subjunctives.cat.indefinite"name="Indefinite" eg="ὃς ἄν “whoever,” ὅταν “whenever”" ex={[{ g: "ὃς ἂν ποιήσῃ τὸ θέλημα τοῦ θεοῦ", e: "whoever does the will of God", r: "Mark 3:35" }, { g: "ὅταν προσεύχησθε, λέγετε", e: "whenever you pray, say", r: "Luke 11:2" }]}><T id="subjunctives.cat.indefinite.d">relative or temporal clauses with <G>ἄν</G></T></Cat>
    </CatGroup>
    <SectionHeading id="subjunctives.h.going-deeper-purpose">Going deeper: purpose, promise, and the strongest no</SectionHeading>
    <P id="subjunctives.p.beyond-purpose-classical">
      <strong>ἵνα beyond purpose.</strong> Classical ἵνα meant "in order that"; Koine stretched it. It can
      mark <em>result</em> ("so that"), <em>content</em> (answering "what?" after verbs of asking —
      "I ask that you…"), even stand where an infinitive would. When John writes
      <Gk> αὕτη ἐστὶν ἡ ἐντολή, ἵνα ἀγαπᾶτε</Gk> (John 15:12), the ἵνα clause is not the command's
      purpose — it <em>is</em> the command's content. Always ask which job ἵνα is doing.
    </P>
    <P id="subjunctives.p.emphatic-piling-both">
      <strong>The emphatic οὐ μή.</strong> Piling both negatives onto an aorist subjunctive produces
      Greek's most absolute denial — about 85 NT occurrences, heavily in sayings of Jesus:
      <Gk> οὐ μὴ ἀπόλωνται εἰς τὸν αἰῶνα</Gk>, "they shall <em>by no means ever</em> perish" (John 10:28).
      English "never" undersells it; translators reach for "certainly not," "by no means."
    </P>
    <P id="subjunctives.p.prohibition-aspect-aorist">
      <strong>Prohibition aspect.</strong> <Gk>μή</Gk> + <em>aorist</em> subjunctive forbids as a whole
      ("don't do it / don't start"); <Gk>μή</Gk> + <em>present</em> imperative leans "stop doing / don't
      keep doing." The distinction is a tendency, not a law — check context before preaching it — but it
      often illuminates: <Gk>μὴ φοβοῦ</Gk> (pres.) to the fearing disciple, "stop being afraid."
    </P>
  </>
)
