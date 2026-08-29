/* ─────────────────────────────────────────────
   Chapter: Nouns/Adj. — the INTERMEDIATE page

   The Intermediate level stopped being the Beginning page with extra cards (user decision,
   2026-08-30: "when Intermediate is selected we essentially build new subheadings for each
   chapter"). This file is that page for the nouns: its own outline, organised the way the
   Intermediate course actually teaches — by SYNTAX, not by paradigm. The spine is the four
   CatGroups that used to live folded inside the "Going deeper" card: Wallace's Essential
   Syntax Categories, each case now a full section of the chapter.

   Beginning keeps chapters/nouns.tsx untouched. MorphologyView picks this file when the
   level toggle says Intermediate (INTERMEDIATE_CONTENT); chapters without an Intermediate
   file of their own fall back to their shared page, so the migration is per-chapter — and a
   future Advanced level is one more map.

   Almost everything here moved rather than being written: the taxonomy from the card, the
   article section, the delete-test and the "Going deeper" highlights from nouns.tsx — same
   ids throughout, so every Spanish string moved with them. The two reference tables (t4, t5)
   are rendered from the same ids as the Beginning copies; nouns.tsx is canonical for their
   content.
───────────────────────────────────────────── */

import {
  MorphTable, Gk,
  P, SectionHeading, InfoBox,
  Tr,
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const NOUNS_INTERMEDIATE_CONTENT = (
  <>
    {/* ── 1 · Form before function ───────────────────────── */}
    <SectionHeading id="nouns.h.int-form-function">The case system: form before function</SectionHeading>
    <P id="nouns.p.int-case-form-function">
      Five case <em>forms</em>, and more case <em>functions</em> than five. The five-case system
      is the set of endings that are actually distinct — that is what you parse, and the paradigms
      live on the Beginning page, one toggle away. The older eight-case scheme splits the genitive into genitive and ablative and the dative
      into dative, locative and instrumental; it is describing function, not form, and the same
      distinctions survive in Wallace as syntactic categories under the five. Parse the form,
      then argue for the function.
    </P>

    {/* ── 2–5 · The cases, by syntax ─────────────────────── */}
    <SectionHeading id="nouns.cg.nominative-the-naming">Nominative — the naming case</SectionHeading>
    <CatGroup>
            <Cat id="nouns.cat.subject"name="Subject" ex={[{ g: "ὁ λόγος σὰρξ ἐγένετο", e: "the Word became flesh", r: "John 1:14" }, { g: "ὁ θεὸς ἀγάπη ἐστίν", e: "God is love", r: "1 John 4:8" }]}><T id="nouns.cat.subject.d">the doer of a finite verb</T></Cat>
            <Cat id="nouns.cat.predicate-nominative"name="Predicate Nominative" eg="“the Word was God,” John 1:1" ex={[{ g: "θεὸς ἦν ὁ λόγος", e: "the Word was God", r: "John 1:1" }, { g: "ὑμεῖς ἐστε τὸ φῶς τοῦ κόσμου", e: "you are the light of the world", r: "Matt 5:14" }]}><T id="nouns.cat.predicate-nominative.d">renames the subject through an equative verb (<G>εἰμί, γίνομαι</G>)</T></Cat>
            <Cat id="nouns.cat.nominative-absolute"name="Nominative Absolute" ex={[{ g: "Ἀρχὴ τοῦ εὐαγγελίου Ἰησοῦ Χριστοῦ", e: "The beginning of the gospel of Jesus Christ", r: "Mark 1:1" }, { g: "Παῦλος ἀπόστολος Χριστοῦ Ἰησοῦ", e: "Paul, an apostle of Christ Jesus", r: "Eph 1:1" }]}><T id="nouns.cat.nominative-absolute.d">a naming nominative in titles / salutations (not in a full sentence)</T></Cat>
            <Cat id="nouns.cat.nominative-for-vocative"name="Nominative for Vocative" eg="“O foolish Galatians!”" ex={[{ g: "ὁ κύριός μου καὶ ὁ θεός μου", e: "My Lord and my God!", r: "John 20:28" }, { g: "ναί, ὁ πατήρ", e: "Yes, Father", r: "Matt 11:26" }]}><T id="nouns.cat.nominative-for-vocative.d">a nominative used for direct address</T></Cat>
    </CatGroup>
    <SectionHeading id="nouns.cg.genitive-description-separation">Genitive — description & separation (“of”)</SectionHeading>
    <CatGroup>
            <Cat id="nouns.cat.possessive"name="Possessive" eg="“his ear”" ex={[{ g: "τὸν οἶκον τοῦ πατρός μου", e: "my Father’s house", r: "John 2:16" }, { g: "τὸ βιβλίον τοῦ προφήτου Ἠσαΐου", e: "the scroll of the prophet Isaiah", r: "Luke 4:17" }]}><T id="nouns.cat.possessive.d">the head noun belongs to the genitive</T></Cat>
            <Cat id="nouns.cat.descriptive"name="Descriptive" ex={[{ g: "βάπτισμα μετανοίας", e: "a baptism of repentance", r: "Mark 1:4" }, { g: "τὸν οἰκονόμον τῆς ἀδικίας", e: "the dishonest steward", r: "Luke 16:8" }]}><T id="nouns.cat.descriptive.d">a loose “characterized by” quality (the catch-all genitive)</T></Cat>
            <Cat id="nouns.cat.relationship"name="Relationship" eg="Σίμων Ἰωάννου, “Simon [son] of John”" ex={[{ g: "Σίμων Ἰωάννου", e: "Simon, son of John", r: "John 21:15" }, { g: "Ἰάκωβος ὁ τοῦ Ζεβεδαίου", e: "James the son of Zebedee", r: "Matt 10:2" }]}><T id="nouns.cat.relationship.d">family relation</T></Cat>
            <Cat id="nouns.cat.partitive"name="Partitive" eg="“half of my possessions”" ex={[{ g: "τὰ ἡμίσιά μου τῶν ὑπαρχόντων", e: "half of my possessions", r: "Luke 19:8" }, { g: "τινὲς τῶν γραμματέων", e: "some of the scribes", r: "Matt 9:3" }]}><T id="nouns.cat.partitive.d">the whole of which the head noun is a part</T></Cat>
            <Cat id="nouns.cat.apposition"name="Apposition" eg="“the sign, namely circumcision”" ex={[{ g: "τοῦ ναοῦ τοῦ σώματος αὐτοῦ", e: "the temple of his body", r: "John 2:21" }, { g: "σημεῖον περιτομῆς", e: "the sign, namely circumcision", r: "Rom 4:11" }]}><T id="nouns.cat.apposition.d">the genitive is the same thing / a specific example of the head noun</T></Cat>
            <Cat id="nouns.cat.comparison"name="Comparison" eg="“greater than the angels”" ex={[{ g: "μείζων τοῦ πατρὸς ἡμῶν Ἀβραάμ", e: "greater than our father Abraham", r: "John 8:53" }, { g: "πλεῖον Ἰωνᾶ ὧδε", e: "something greater than Jonah is here", r: "Matt 12:41" }]}><T id="nouns.cat.comparison.d">the standard after a comparative adjective (“than”)</T></Cat>
            <Cat id="nouns.cat.subjective"name="Subjective" eg="“the revelation of Jesus” = Jesus reveals" ex={[{ g: "ἡ ἀγάπη τοῦ Χριστοῦ συνέχει ἡμᾶς", e: "the love of Christ (= Christ’s love) compels us", r: "2 Cor 5:14" }, { g: "Ἀποκάλυψις Ἰησοῦ Χριστοῦ", e: "the revelation from Jesus Christ", r: "Rev 1:1" }]}><T id="nouns.cat.subjective.d">acts as the subject of the idea in a verbal head noun</T></Cat>
            <Cat id="nouns.cat.objective"name="Objective" eg="“blasphemy of the Spirit” = blaspheming the Spirit" ex={[{ g: "ἡ τοῦ πνεύματος βλασφημία", e: "the blasphemy against the Spirit", r: "Matt 12:31" }, { g: "διὰ τὸν φόβον τῶν Ἰουδαίων", e: "for fear of the Jews", r: "John 7:13" }]}><T id="nouns.cat.objective.d">acts as the object of that idea</T></Cat>
            <Cat id="nouns.cat.genitive-of-time"name="Genitive of Time" ex={[{ g: "ἦλθεν πρὸς αὐτὸν νυκτός", e: "he came to him by night", r: "John 3:2" }, { g: "νηστεύω δὶς τοῦ σαββάτου", e: "I fast twice a week", r: "Luke 18:12" }]}><T id="nouns.cat.genitive-of-time.d">the kind of time / time <em>within which</em></T></Cat>
            <Cat id="nouns.cat.genitive-absolute"name="Genitive Absolute" ex={[{ g: "ὀψίας δὲ γενομένης", e: "when evening had come", r: "Matt 8:16" }, { g: "ἔτι αὐτοῦ λαλοῦντος", e: "while he was still speaking", r: "Mark 5:35" }]}><T id="nouns.cat.genitive-absolute.d">a detached genitive noun + participle giving background (see Participles)</T></Cat>
            <Cat id="nouns.cat.after-certain-verbs"name="After certain verbs / prepositions" ex={[{ g: "ἥψατο τῆς χειρὸς αὐτῆς", e: "he touched her hand", r: "Matt 8:15" }, { g: "ἀκούσουσιν τῆς φωνῆς τοῦ υἱοῦ τοῦ θεοῦ", e: "they will hear the voice of the Son of God", r: "John 5:25" }]}><T id="nouns.cat.after-certain-verbs.d">as a direct object (sensation, sharing, ruling…) or governed by a preposition</T></Cat>
    </CatGroup>
    <SectionHeading id="nouns.cg.dative-the-to">Dative — the “to / for / with / by” case</SectionHeading>
    <CatGroup>
            <Cat id="nouns.cat.indirect-object"name="Indirect Object" eg="“he gave the book to me”" ex={[{ g: "δός μοι τὴν κεφαλὴν Ἰωάννου", e: "give me the head of John", r: "Matt 14:8" }, { g: "λέγει αὐτῇ ὁ Ἰησοῦς", e: "Jesus says to her", r: "John 11:23" }]}><T id="nouns.cat.indirect-object.d">the person to/for whom</T></Cat>
            <Cat id="nouns.cat.interest"name="Interest" ex={[{ g: "μαρτυρεῖτε ἑαυτοῖς", e: "you testify against yourselves", r: "Matt 23:31" }, { g: "τῷ κυρίῳ ζῶμεν", e: "we live for the Lord", r: "Rom 14:8" }]}><T id="nouns.cat.interest.d">advantage (“for” someone) or disadvantage (“against” someone)</T></Cat>
            <Cat id="nouns.cat.reference-respect"name="Reference / Respect" eg="“dead to sin”" ex={[{ g: "νεκροὺς τῇ ἁμαρτίᾳ", e: "dead with respect to sin", r: "Rom 6:11" }, { g: "ζῶντας τῷ θεῷ", e: "alive with respect to God", r: "Rom 6:11" }]}><T id="nouns.cat.reference-respect.d">“with respect to”</T></Cat>
            <Cat id="nouns.cat.possession"name="Possession" ex={[{ g: "οὐκ ἦν αὐτοῖς τόπος ἐν τῷ καταλύματι", e: "there was no place for them in the inn", r: "Luke 2:7" }, { g: "ᾧ ὄνομα Ἰωσήφ", e: "whose name was Joseph", r: "Luke 1:27" }]}><T id="nouns.cat.possession.d">the possessor with an equative verb</T></Cat>
            <Cat id="nouns.cat.sphere"name="Sphere" eg="“pure in heart”" ex={[{ g: "οἱ καθαροὶ τῇ καρδίᾳ", e: "the pure in heart", r: "Matt 5:8" }, { g: "οἱ πτωχοὶ τῷ πνεύματι", e: "the poor in spirit", r: "Matt 5:3" }]}><T id="nouns.cat.sphere.d">the realm in which something is true</T></Cat>
            <Cat id="nouns.cat.dative-of-time"name="Dative of Time" ex={[{ g: "τῇ τρίτῃ ἡμέρᾳ ἐγερθήσεται", e: "on the third day he will be raised", r: "Matt 20:19" }, { g: "τοῖς γενεσίοις αὐτοῦ δεῖπνον ἐποίησεν", e: "on his birthday he gave a banquet", r: "Mark 6:21" }]}><T id="nouns.cat.dative-of-time.d">the point in time <em>at which</em></T></Cat>
            <Cat id="nouns.cat.means-instrument"name="Means / Instrument" eg="“with a word”" ex={[{ g: "ἐξέβαλεν τὰ πνεύματα λόγῳ", e: "he cast out the spirits with a word", r: "Matt 8:16" }, { g: "χάριτί ἐστε σεσῳσμένοι", e: "by grace you have been saved", r: "Eph 2:8" }]}><T id="nouns.cat.means-instrument.d">the plain dative = “by/with”</T></Cat>
            <Cat id="nouns.cat.direct-object-after"name="Direct Object / after prepositions" ex={[{ g: "ἠκολούθησαν αὐτῷ", e: "they followed him", r: "Matt 4:20" }, { g: "ἐπίστευσεν Ἀβραὰμ τῷ θεῷ", e: "Abraham believed God", r: "Rom 4:3" }]}><T id="nouns.cat.direct-object-after.d">verbs and prepositions that govern the dative</T></Cat>
    </CatGroup>
    <SectionHeading id="nouns.cg.accusative-extent-limitation">Accusative — extent & limitation</SectionHeading>
    <CatGroup>
            <Cat id="nouns.cat.direct-object"name="Direct Object" eg="“God loved the world”" ex={[{ g: "ἠγάπησεν ὁ θεὸς τὸν κόσμον", e: "God loved the world", r: "John 3:16" }, { g: "λύσατε τὸν ναὸν τοῦτον", e: "destroy this temple", r: "John 2:19" }]}><T id="nouns.cat.direct-object.d">what receives a transitive verb's action</T></Cat>
            <Cat id="nouns.cat.double-accusative"name="Double Accusative" ex={[{ g: "ἐκεῖνος ὑμᾶς διδάξει πάντα", e: "he will teach you all things", r: "John 14:26" }, { g: "ὑμᾶς εἴρηκα φίλους", e: "I have called you friends", r: "John 15:15" }]}><T id="nouns.cat.double-accusative.d">two objects: person + thing (“he teaches you Greek”), or object + complement (“they called him Lord”)</T></Cat>
            <Cat id="nouns.cat.measure"name="Measure" eg="“forty days,” “a day's journey”" ex={[{ g: "ἔμεινεν ἐκεῖ δύο ἡμέρας", e: "he stayed there two days", r: "John 4:40" }, { g: "ἦλθον ἡμέρας ὁδόν", e: "they went a day’s journey", r: "Luke 2:44" }]}><T id="nouns.cat.measure.d">extent of time or space (“how long / how far”)</T></Cat>
            <Cat id="nouns.cat.subject-of-infinitive"name="Subject of Infinitive" eg="“I want him to learn”" ex={[{ g: "δεῖ ὑμᾶς γεννηθῆναι ἄνωθεν", e: "you must be born again", r: "John 3:7" }, { g: "ἐν τῷ ὑποστρέφειν τὸν Ἰησοῦν", e: "when Jesus returned", r: "Luke 8:40" }]}><T id="nouns.cat.subject-of-infinitive.d">the accusative that acts as an infinitive's subject</T></Cat>
            <Cat id="nouns.cat.after-certain-prepositions"name="After certain prepositions" ex={[{ g: "ἀπέστειλεν ὁ θεὸς τὸν υἱὸν εἰς τὸν κόσμον", e: "God sent the Son into the world", r: "John 3:17" }, { g: "πάντες ἔρχονται πρὸς αὐτόν", e: "everyone is coming to him", r: "John 3:26" }]}><T id="nouns.cat.after-certain-prepositions.d">prepositions that govern the accusative</T></Cat>
    </CatGroup>

    {/* ── 5 · The article ────────────────────────────────── */}
    <SectionHeading id="nouns.h.article-beyond">The article — beyond "the"</SectionHeading>
    <P id="nouns.p.intermediate-course-gives">The Intermediate course gives the article its own session:</P>
    <MorphTable id="nouns.t8" tCols={[0, 1, 2]}
      headers={['Use', 'What it does', 'Example']} firstColIsData striped
      rows={[
        ['As pronoun', 'ὁ δε = "but he"', 'ὁ δε ἐξελθων ἠρξατο κηρυσσειν (Mark 1:45)'],
        ['Individualizing', 'points back to something already mentioned', 'τον ἀνθρωπον — THAT man, just discussed'],
        ['Generic', 'the class, not an individual', 'ἀξιος ὁ ἐργατης του μισθου αὐτου (Luke 10:7)'],
        ['Substantiver', 'turns anything into a noun', 'οἱ ἐκ πιστεως — those who are of faith (Gal 3:7)'],
        ['Function marker', 'flags case or ties an attributive on', 'ἡ ἐντολη ἡ ἐμη (John 15:12)'],
        ['Absence of article', 'often stresses quality, not indefiniteness', 'θεος ἠν ὁ λογος — the Word was (in nature) God (John 1:1)'],
        ['Colwell’s rule', 'a definite predicate before the verb usually drops its article', 'θεος ἠν ὁ λογος again — anarthrous, still definite'],
        ['Granville Sharp', 'one article + two singular nouns joined by και = one person', 'του θεου και σωτηρος ἡμων Ἰησου Χριστου (Tit 2:13)'],
      ]}
      note="Colwell and Granville Sharp are rules of thumb about when the article may be dropped without a change of meaning — both matter in key christological texts."
    />

    {/* ── 6 · Adjective position ───────────────────────────── */}
    <SectionHeading id="nouns.h.int-adjective-position">Adjective position: attributive or predicate?</SectionHeading>
    <P id="nouns.p.delete-test-settles">
      The delete-test settles hard cases: remove the adjective, and if the sentence still works it was
      attributive ("the [good] word"); if the sentence collapses, the adjective <em>was</em> the point —
      predicate.
    </P>

    {/* ── 7 · Method ─────────────────────────────────────── */}
    <SectionHeading id="nouns.h.going-deeper-when">Going deeper: when the default translation isn't enough</SectionHeading>
    <P id="nouns.p.glosses-training-wheels">
      The glosses "of" and "to/for" are training wheels. Interpretation begins when you ask <em>which kind</em> of
      genitive or dative you are looking at — the full catalogue is the case sections above. Three
      highlights show why it matters:
    </P>
    <P id="nouns.p.genitive-spectrum-love">
      <strong>The genitive spectrum.</strong> "The love of God" (<Gk>ἡ ἀγάπη τοῦ θεοῦ</Gk>) is genuinely
      ambiguous: God's love for us (<em>subjective</em> genitive — God does the loving) or our love for God
      (<em>objective</em> — God receives it)? Grammar alone cannot decide; context and the author's usage must.
      The most debated NT example is <Gk>πίστις Χριστοῦ</Gk> — "faith <em>in</em> Christ" (objective) or "the
      faithfulness <em>of</em> Christ" (subjective)? Entire monographs hang on that genitive (Rom 3:22; Gal 2:16).
    </P>
    <P id="nouns.p.subject-predicate-nominative">
      <strong>Subject vs. predicate nominative.</strong> With an equative verb both nouns are nominative —
      so which is the subject of <Gk>θεὸς ἦν ὁ λόγος</Gk> (John 1:1)? The rule: pronouns outrank proper names
      and articular nouns; here <Gk>ὁ λόγος</Gk> has the article, so it is the subject — "the Word was God,"
      never "God was the Word." The predicate usually names the <em>class</em> the subject belongs to, the way
      "God is love" does not mean "love is God."
    </P>
    <P id="nouns.p.time-cases-worked">
      <strong>The time cases.</strong> "I worked at night" is ambiguous in English; Greek's case choice is not:
      genitive <Gk>νυκτός</Gk> = "during the night" (kind of time), dative <Gk>νυκτί</Gk> = "at a point in the
      night," accusative <Gk>νύκτα</Gk> = "all night long" (extent). Nicodemus came <Gk>νυκτός</Gk> (John 3:2) —
      under cover of night, not at one instant.
    </P>
  </>
)
