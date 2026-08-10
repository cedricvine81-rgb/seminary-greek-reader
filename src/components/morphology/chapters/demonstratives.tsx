/* ─────────────────────────────────────────────
   Chapter: Demonstratives  (οὗτος, ἐκεῖνος — and friends)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'

export const DEMONSTRATIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="demonstratives.h.start-english-pointing">Start with English: pointing words</SectionHeading>
      <P id="demonstratives.p.book-one-english">
        "<em>This</em> book, not <em>that</em> one." English points with a near word (this/these) and a far
        word (that/those) — grammarians call them <strong>demonstratives</strong>, from the Latin for
        "point out." Greek has the same pair: <Gk>οὗτος</Gk> "this" (near) and <Gk>ἐκεῖνος</Gk> "that"
        (far — related to <Gk>ἐκεῖ</Gk>, "there").
      </P>
      <P id="demonstratives.p.like-any-pronoun">
        Like any pronoun-adjective, they agree with their noun in gender, case, and
        {' '}<Term t="number">number</Term> — and they are frequent: <Gk>οὗτος</Gk> alone occurs nearly 1,400
        times in the New Testament. Two things to learn: the forms (one quirky paradigm) and one surprising
        rule about position.
      </P>
    </LevelOnly>

    {/* ── 2 · Forms ──────────────────────────────────────── */}
    <SectionHeading id="demonstratives.h.forms-shifting-front">The forms: οὗτος and its shifting front end</SectionHeading>
    <P id="demonstratives.p.endings-familiar-declension">
      The endings of <Gk>οὗτος</Gk> are the familiar 1st/2nd-declension set. The strangeness is at the
      <em> front</em>, and it follows two rules: the masculine and feminine nominatives begin with a rough
      breathing (<Gk>οὗ‑, αὕ‑</Gk>, matching the article's <Gk>ὁ, ἡ</Gk>); every other form begins
      with <Gk>τ</Gk>. And the first syllable's vowel echoes the ending's vowel class
      (<Gk>τούτου</Gk> but <Gk>ταύτης</Gk>).
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="demonstratives.al.default-translations">Default translations</Tr></AsideLabel>
        <Ex grc="οὗτος ὁ ἄνθρωπος" en={<Tr id="demonstratives.ex.man">this man</Tr>} />
        <Ex grc="ταῦτα" en={<Tr id="demonstratives.ex.these-things-very">these things (very common!)</Tr>} />
        <Ex grc="μετὰ τοῦτο" en={<Tr id="demonstratives.ex.after">after this</Tr>} />
        <p><Tr id="demonstratives.as.standing-alone-it's">Standing alone, it's a pronoun: <Gk>οὗτος</Gk> "this one / he."</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="demonstratives.as.neuter-plural-may">The neuter plural <Gk>ταῦτα</Gk> may be the most common demonstrative form in the NT — "these things."</Tr></p>
      </>}
    >
      <MorphTable id="demonstratives.t1" flush title="οὗτος, αὕτη, τοῦτο — this" headers={['','','Masc.','Fem.','Neut.']}
        rows={[
          ['Sg.','Nom.','οὗτ|ος','αὕτ|η','τοῦτ|ο'],
          ['','Gen.','τούτ|ου','ταύτ|ης','τούτ|ου'],
          ['','Dat.','τούτ|ῳ','ταύτ|ῃ','τούτ|ῳ'],
          ['','Acc.','τοῦτ|ον','ταύτ|ην','τοῦτ|ο'],
          ['Pl.','Nom.','οὗτ|οι','αὗτ|αι','ταῦτ|α'],
          ['','Gen.','τούτ|ων','τούτ|ων','τούτ|ων'],
          ['','Dat.','τούτ|οις','ταύτ|αις','τούτ|οις'],
          ['','Acc.','τούτ|ους','ταύτ|ας','ταῦτ|α'],
        ]}
      />
    </TableAside>
    <P id="demonstratives.p.friendlier-completely-regular">
      <Gk>ἐκεῖνος</Gk> is friendlier: completely regular endings (like <Gk>αὐτός</Gk>), no front-end games.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἐκεῖνος ὁ μαθητής" en={<Tr id="demonstratives.ex.disciple">that disciple</Tr>} />
        <Ex grc="ἐν ἐκείνῃ τῇ ἡμέρᾳ" en={<Tr id="demonstratives.ex.day">on that day</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="demonstratives.as.other-reciprocal-one"><Gk>ἄλλος</Gk> "other" and the reciprocal <Gk>ἀλλήλων</Gk> "one another" decline just like <Gk>ἐκεῖνος</Gk> — meet them here: <Gk>ἔλεγον πρὸς ἀλλήλους</Gk>, "they were saying to one another" (Mark 4:41).</Tr></p>
      </>}
    >
      <MorphTable id="demonstratives.t2" flush title="ἐκεῖνος, ἐκείνη, ἐκεῖνο — that" headers={['','','Masc.','Fem.','Neut.']}
        rows={[
          ['Sg.','Nom.','ἐκεῖν|ος','ἐκείν|η','ἐκεῖν|ο'],
          ['','Gen.','ἐκείν|ου','ἐκείν|ης','ἐκείν|ου'],
          ['','Dat.','ἐκείν|ῳ','ἐκείν|ῃ','ἐκείν|ῳ'],
          ['','Acc.','ἐκεῖν|ον','ἐκείν|ην','ἐκεῖν|ο'],
          ['Pl.','Nom.','ἐκεῖν|οι','ἐκεῖν|αι','ἐκεῖν|α'],
          ['','Gen.','ἐκείν|ων','ἐκείν|ων','ἐκείν|ων'],
          ['','Dat.','ἐκείν|οις','ἐκείν|αις','ἐκείν|οις'],
          ['','Acc.','ἐκείν|ους','ἐκείν|ας','ἐκεῖν|α'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Position ───────────────────────────────────── */}
    <DropdownPractice id="demonstratives.d1"
      title="Practice — parse the demonstrative"
      intro={<Tr id="demonstratives.intro.same-endings-watch">Same endings as αὐτός — watch the τουτ-/ταυτ- front end.</Tr>}
      options={["Gen Sg Fem — \"of this\"", "Dat Pl Masc/Neut — \"to these\"", "Nom/Acc Pl Neut — \"those (things)\"", "Acc Sg Masc — \"this\"", "Nom Pl Fem — \"these\"", "Dat Sg Masc/Neut — \"to that\""]}
      items={[
        { q: <span className="normal-case">ταύτης</span>, answer: "Gen Sg Fem — \"of this\"" },
        { q: <span className="normal-case">τούτοις</span>, answer: "Dat Pl Masc/Neut — \"to these\"" },
        { q: <span className="normal-case">ἐκεῖνα</span>, answer: "Nom/Acc Pl Neut — \"those (things)\"" },
        { q: <span className="normal-case">τοῦτον</span>, answer: "Acc Sg Masc — \"this\"" },
        { q: <span className="normal-case">αὗται</span>, answer: "Nom Pl Fem — \"these\"", note: <Tr id="demonstratives.n.hautai">Rough breathing — not αὐταί ("they").</Tr> },
        { q: <span className="normal-case">ἐκείνῳ</span>, answer: "Dat Sg Masc/Neut — \"to that\"" },
      ]}
    />

    <SectionHeading id="demonstratives.h.position-surprise">The position surprise</SectionHeading>
    <P id="demonstratives.p.adjectives-modifying-articular">
      Adjectives modifying an articular noun sit <em>inside</em> the article-unit (<Gk>ὁ καλὸς λόγος</Gk>).
      Demonstratives do the opposite: they stand in <strong>predicate position</strong> — outside the
      article — yet still mean a simple "this/that + noun": <Gk>οὗτος ὁ ἄνθρωπος</Gk> or
      <Gk> ὁ ἄνθρωπος οὗτος</Gk>, both "this man." Never "this <em>is</em> the man" — with demonstratives,
      the predicate position is just where they live.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="οὗτος ὁ λόγος" en={<Tr id="demonstratives.ex.word">this word</Tr>} />
        <Ex grc="ἐκείνη ἡ ἡμέρα" en={<Tr id="demonstratives.ex.day-2">that day</Tr>} />
        <p><Tr id="demonstratives.as.note-article-still">Note the article is still there — demonstrative + article + noun.</Tr></p>
      </>}
    >
      <MorphTable id="demonstratives.t3" tCols={[1]} flush title="Adjective vs. demonstrative position" headers={['Pattern', 'Meaning']} firstColIsData
        rows={[
          ['ὁ καλὸς λόγος', 'the good word (adjective inside)'],
          ['οὗτος ὁ λόγος', 'this word (demonstrative outside)'],
          ['καλὸς ὁ λόγος', 'the word is good (adjective outside = statement)'],
        ]}
      />
    </TableAside>

    {/* ── 4 · The relatives: ἑαυτοῦ and ἀλλήλων ──────────── */}
    <DropdownPractice id="demonstratives.d2"
      title="Practice — translate the phrase"
      intro={<Tr id="demonstratives.intro.demonstratives-sit-predicate">Demonstratives sit in predicate position but translate attributively.</Tr>}
      options={["this man", "that day", "these works", "those disciples", "this commandment", "this gospel"]}
      items={[
        { q: <span className="normal-case">οὗτος ὁ ἄνθρωπος</span>, answer: "this man" },
        { q: <span className="normal-case">ἐκείνη ἡ ἡμέρα</span>, answer: "that day" },
        { q: <span className="normal-case">ταῦτα τὰ ἔργα</span>, answer: "these works" },
        { q: <span className="normal-case">ἐκεῖνοι οἱ μαθηταί</span>, answer: "those disciples" },
        { q: <span className="normal-case">αὕτη ἡ ἐντολή</span>, answer: "this commandment" },
        { q: <span className="normal-case">τοῦτο τὸ εὐαγγέλιον</span>, answer: "this gospel" },
      ]}
    />

    <SectionHeading id="demonstratives.h.two-cousins-himself">Two cousins: "himself" and "one another"</SectionHeading>
    <P id="demonstratives.p.two-more-pointing">
      Two more pointing-family pronouns complete the set. The reflexive <Gk>ἑαυτοῦ</Gk> ("himself /
      herself / itself") points the action back at its own subject: <Gk>σῴζει ἑαυτόν</Gk>, "he saves
      <em> himself</em>." The reciprocal <Gk>ἀλλήλων</Gk> ("one another") only exists in the plural — you
      need at least two to reciprocate: <Gk>ἀγαπᾶτε ἀλλήλους</Gk>, "love one another."
    </P>
    <LevelOnly level="intermediate">
      <P id="demonstratives.p.distinguish-reflexive-intensive">
        Distinguish reflexive <Gk>ἑαυτόν</Gk> from intensive <Gk>αὐτός</Gk> by the delete-test you know
        from the Pronouns chapter: delete "himself," and if the meaning collapses it was reflexive
        (<Gk>σῴζει ἑαυτόν</Gk>), if unchanged it was intensive (<Gk>αὐτὸς ὁ κύριος σῴζει</Gk>).
      </P>
    </LevelOnly>

    {/* ── 5 · Watch out ──────────────────────────────────── */}
    <ClassSentences id="demonstratives.cs1"
      lesson="Reflexives and reciprocals"
      items={[
        { words: [
          { w: "ἀγαπᾶτε", parsing: "Pres Act Impv 2 Pl — ἀγαπάω", gloss: "love!" },
          { w: "ἀλλήλους.", parsing: "Acc Pl Masc — ἀλλήλων (reciprocal)", syntax: "Direct Object", gloss: "one another" },
        ],
          translation: "Love one another.",
          note: "John 13:34.",
        },
        { words: [
          { w: "φιλοῦσιν", parsing: "Pres Act Ind 3 Pl — φιλέω", gloss: "they love" },
          { w: "ἑαυτούς.", parsing: "Acc Pl Masc — ἑαυτοῦ (reflexive)", syntax: "Direct Object", gloss: "themselves" },
        ],
          translation: "They love themselves.",
        },
      ]}
    />

    <SectionHeading id="demonstratives.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="demonstratives.wo.woman-she-rough"><Gk>αὕτη</Gk> ("this woman/she", rough breathing) vs. <Gk>αὐτή</Gk> ("she", smooth) — the breathing mark is the whole difference. Likewise <Gk>αὗται</Gk> vs. <Gk>αὐταί</Gk>.</Tr></li>
        <li><Tr id="demonstratives.wo.these-things-acc"><Gk>ταῦτα</Gk> ("these things") vs. <Gk>ταύτας</Gk> (acc. fem. pl.) — a one-letter trap in fast reading.</Tr></li>
        <li><Tr id="demonstratives.wo.set-phrases-recognize">Set phrases to recognize on sight: <Gk>μετὰ ταῦτα</Gk> "after these things," <Gk>διὰ τοῦτο</Gk> "for this reason," <Gk>ἐκ τούτου</Gk> "as a result."</Tr></li>
        <li><Tr id="demonstratives.wo.demonstrative-article-noun">Demonstrative + article + noun is <em>not</em> a sentence — resist reading "this is the…" unless a verb (or equative context) demands it.</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="demonstratives.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="demonstratives.pr1"
      title="Practice — parse and translate"
      intro={<Tr id="demonstratives.intro.vocabulary-sheep-gather">Vocabulary: <span className="normal-case">πρόβατον</span> "sheep" · <span className="normal-case">συνάγω</span> "gather" · <span className="normal-case">παραβολή</span> "parable."</Tr>}
      items={[
        { q: <span className="normal-case">συνάγει ταῦτα τὰ πρόβατα.</span>,
          a: <Tr id="demonstratives.pa.she-gathering-these">"She is gathering these sheep" — ταῦτα agrees with τὰ πρόβατα (neut. pl.).</Tr>},
        { q: <span className="normal-case">φιλῶ ἐκεῖνον τὸν μαθητήν.</span>,
          a: <Tr id="demonstratives.pa.love-disciple-acc">"I love that disciple" — ἐκεῖνον, acc. masc. sg., predicate position.</Tr>},
        { q: <span className="normal-case">οὗτός ἐστιν ὁ υἱός μου ὁ ἀγαπητός.</span>,
          a: <Tr id="demonstratives.pa.beloved-son-matt">"This is my beloved Son" (Matt 3:17) — οὗτος standing alone as subject.</Tr>},
        { q: <span className="normal-case">ἐν ἐκείνῃ τῇ ἡμέρᾳ γνώσεσθε.</span>,
          a: <Tr id="demonstratives.pa.day-will-know">"On that day you will know" (John 14:20) — dative of time.</Tr>},
        { q: <span className="normal-case">διὰ τοῦτο λέγω ὑμῖν.</span>,
          a: <Tr id="demonstratives.pa.reason-say-set">"For this reason I say to you" — the set phrase διὰ τοῦτο.</Tr>},
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="demonstratives.cs2"
      lesson="Lesson 3 · Pronouns (οὗτος and ἐκεῖνος)"
      items={[
        { words: [
          { w: "αὕτη", parsing: "Nom Sg Fem — οὗτος", syntax: "Subject", gloss: "this" },
          { w: "ἐστὶν", parsing: "Pres Act Ind 3 Sg — εἰμί", gloss: "is" },
          { w: "ἡ", parsing: "Article — Nom Sg Fem", gloss: "the" },
          { w: "ἡμέρα.", parsing: "Nom Sg Fem — ἡμέρα", syntax: "Predicate Nominative", gloss: "day" },
        ],
          translation: "This is the day.",
        },
        { words: [
          { w: "γινώσκω", parsing: "Pres Act Ind 1 Sg — γινώσκω", gloss: "I know" },
          { w: "ἐκεῖνον", parsing: "Acc Sg Masc — ἐκεῖνος", gloss: "that" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "ἄνθρωπον.", parsing: "Acc Sg Masc — ἄνθρωπος", syntax: "Direct Object", gloss: "man" },
        ],
          translation: "I know that man.",
        },
        { words: [
          { w: "ἐν", parsing: "Preposition + dative", gloss: "at/in" },
          { w: "τῇ", parsing: "Article — Dat Sg Fem", gloss: "the" },
          { w: "αὐτῇ", parsing: "Dat Sg Fem — αὐτός", gloss: "same" },
          { w: "ὥρᾳ", parsing: "Dat Sg Fem — ὥρα", syntax: "Dative of Time", gloss: "hour" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "Πέτρος", parsing: "Nom Sg Masc — Πέτρος", syntax: "Subject", gloss: "Peter" },
          { w: "ἔβλεψεν", parsing: "Aor Act Ind 3 Sg — βλέπω", gloss: "saw" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "Ἰησοῦν.", parsing: "Acc Sg Masc — Ἰησοῦς", syntax: "Direct Object", gloss: "Jesus" },
        ],
          translation: "At the same hour Peter saw Jesus.",
          note: "αὐτός in attributive position (article–αὐτός–noun) means \"same\".",
        },
        { words: [
          { w: "διὰ", parsing: "Preposition + accusative", gloss: "because of" },
          { w: "ταῦτα", parsing: "Acc Pl Neut — οὗτος", gloss: "these things" },
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "μαθηταὶ", parsing: "Nom Pl Masc — μαθητής", syntax: "Subject", gloss: "disciples" },
          { w: "ἔλεγον", parsing: "Impf Act Ind 3 Pl — λέγω", gloss: "were speaking" },
          { w: "ἀλλήλοις.", parsing: "Dat Pl Masc — ἀλλήλων", syntax: "Dative of Indirect Object", gloss: "to one another" },
        ],
          translation: "Because of these things the disciples were speaking to one another.",
        },
      ]}
    />

    <HomeworkAssignments chapter="demonstratives" />

    <LiveExamples
      intro={<Tr id="demonstratives.intro.pointing-words-place">The pointing words in place — notice how often they open or close an argument.</Tr>}
      links={[
        { label: <Tr id="demonstratives.le.every-form-nearly">Every form of <span className="normal-case">οὗτος</span> — nearly 1,400 pointers</Tr>, lemma: 'οὗτος' },
        { label: <Tr id="demonstratives.le.every-form-one">Every form of <span className="normal-case">ἐκεῖνος</span> — "that one," John's favourite</Tr>, lemma: 'ἐκεῖνος' },
        { label: <Tr id="demonstratives.le.every-one-another">Every <span className="normal-case">ἀλλήλων</span> — the "one another" commands</Tr>, lemma: 'ἀλλήλων' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="demonstratives.h.going-deeper-pointing">Going deeper: pointing with attitude</SectionHeading>
      <P id="demonstratives.p.backward-forward-demonstrative">
        <strong>Backward or forward?</strong> A demonstrative usually points back at what was just said
        (anaphoric: <Gk>μετὰ ταῦτα</Gk>), but it can point forward to what's coming (cataphoric):
        <Gk> αὕτη ἐστὶν ἡ ἐντολὴ ἡ ἐμή, ἵνα…</Gk> — "<em>this</em> is my commandment: that you love…"
        (John 15:12). John especially uses forward-pointing οὗτος to headline a definition before giving it.
      </P>
      <P id="demonstratives.p.contemptuous-pointing-person">
        <strong>The contemptuous οὗτος.</strong> Pointing at a person can sneer: <Gk>οὗτος</Gk> as "this
        fellow" — <Gk>οὗτος ὁ ἄνθρωπος</Gk> on hostile lips (Luke 15:2, "this fellow welcomes sinners").
        Context supplies the tone English must add with "fellow."
      </P>
      <P id="demonstratives.p.title-john's-farewell">
        <strong>ἐκεῖνος as a title.</strong> In John's farewell discourse, <Gk>ἐκεῖνος</Gk> repeatedly
        refers to the coming Spirit-Paraclete (John 14:26; 16:13–14) — a masculine demonstrative tracking
        through the discourse. Note also the idiom <Gk>ἐν ἐκείνῃ τῇ ἡμέρᾳ</Gk>, "in that day," carrying
        eschatological weight inherited from the prophets.
      </P>
    </LevelOnly>
  </>
)
