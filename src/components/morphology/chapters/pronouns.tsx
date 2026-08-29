/* ─────────────────────────────────────────────
   Chapter: Pronouns

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'

export const PRONOUNS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="pronouns.h.start-english-words">Start with English: words that stand in</SectionHeading>
      <P id="pronouns.p.mary-saw-mary's">
        "Mary saw Mary's brother and Mary waved to Mary's brother." Unbearable — which is why every language
        has <Term t="pronoun">pronouns</Term>: "Mary saw her brother and waved to him."
        A pronoun stands in for a noun already mentioned (its <strong>antecedent</strong>), so you
        don't have to keep repeating it.
      </P>
      <P id="pronouns.p.already-know-key">
        You already know the key fact about Greek pronouns from the Nouns chapter: English pronouns are the
        one place English still changes form for <Term t="case">case</Term> — <em>he / his / him</em>. Greek
        pronouns do the same, with fuller sets of endings. The rule of agreement: a pronoun matches its
        antecedent in <strong>gender and number</strong>, but takes its <strong>case from its own job</strong> in
        the sentence. "Mary … waved to <em>him</em>" — <em>him</em> is masculine singular because "brother" is,
        but object-form because of its own role.
      </P>
    </LevelOnly>

    {/* ── 2 · αὐτός ──────────────────────────────────────── */}
    <SectionHeading id="pronouns.h.workhorse-she">The workhorse: αὐτός ("he, she, it")</SectionHeading>
    <P id="pronouns.p.far-most-common">
      By far the most common Greek pronoun is <Gk>αὐτός</Gk> — the everyday "he / she / it / they." Its endings
      are the familiar 1st/2nd-declension set, and its genitive doubles as "his / her / its / their":
      <Gk> ὁ λόγος αὐτοῦ</Gk>, "his word" (literally "the word of him").
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="pronouns.as.everyday-she-agrees"><Gk>αὐτός</Gk> is the everyday "he / she / it, they." It agrees in gender with the noun it stands for.</Tr></p>
        <Ex grc="βλέπω αὐτόν" en={<Tr id="pronouns.ex.see-him">I see him</Tr>} />
        <Ex grc="ὁ λόγος αὐτοῦ" en={<Tr id="pronouns.ex.his-word">his word</Tr>} />
      </>}
    >
      <MorphTable id="pronouns.t1" tCols={[0, 1, 3, 5, 7]} flush title="3rd Person Pronoun — αὐτός (he, she, it)" headers={['','','Masc.','Eng.','Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg.','Nom.','αὐτ|ός','he','αὐτ|ή','she','αὐτ|ό','it'],
          ['','Gen.','αὐτ|οῦ','his','αὐτ|ῆς','her','αὐτ|οῦ','its'],
          ['','Dat.','αὐτ|ῷ','to him','αὐτ|ῇ','to her','αὐτ|ῷ','to it'],
          ['','Acc.','αὐτ|όν','him','αὐτ|ήν','her','αὐτ|ό','it'],
          ['Pl.','Nom.','αὐτ|οί','they','αὐτ|αί','they','αὐτ|ά','they'],
          ['','Gen.','αὐτ|ῶν','their','αὐτ|ῶν','their','αὐτ|ῶν','their'],
          ['','Dat.','αὐτ|οῖς','to them','αὐτ|αῖς','to them','αὐτ|οῖς','to them'],
          ['','Acc.','αὐτ|ούς','them','αὐτ|άς','them','αὐτ|ά','them'],
        ]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P id="pronouns.p.one-translation-habit">
        One translation habit to build early: Greek gender is grammatical, so <Gk>αὐτή</Gk> pointing back to a
        feminine <em>thing</em> (say, <Gk>ἡ ἐκκλησία</Gk>, "the church") comes into English as "it," not "she."
        Translate the antecedent's meaning, not the Greek gender.
      </P>
    </LevelOnly>

    <DropdownPractice id="pronouns.d1"
      title="Practice — parse αὐτός"
      intro={<Tr id="pronouns.intro.match-each-form">Match each form to its parsing and default translation.</Tr>}
      options={["Accusative Plural Masculine — \"them\"", "Dative Singular Feminine — \"to/for her\"", "Genitive Singular (masc./neut.) — \"his/its\"", "Nominative Plural Feminine — \"they\"", "Genitive Plural (all genders) — \"their\"", "Nom/Acc Singular Neuter — \"it\""]}
      items={[
        { q: <span className="normal-case">αὐτούς</span>, answer: "Accusative Plural Masculine — \"them\"" },
        { q: <span className="normal-case">αὐτῇ</span>, answer: "Dative Singular Feminine — \"to/for her\"", note: <Tr id="pronouns.n.the-antecedent-feminine">Or "to it," if the antecedent is a feminine thing.</Tr> },
        { q: <span className="normal-case">αὐτοῦ</span>, answer: "Genitive Singular (masc./neut.) — \"his/its\"" },
        { q: <span className="normal-case">αὐταί</span>, answer: "Nominative Plural Feminine — \"they\"" },
        { q: <span className="normal-case">αὐτῶν</span>, answer: "Genitive Plural (all genders) — \"their\"" },
        { q: <span className="normal-case">αὐτό</span>, answer: "Nom/Acc Singular Neuter — \"it\"", note: <Tr id="pronouns.n.neuter-nominative-and">Neuter nominative and accusative are identical — as always.</Tr> },
      ]}
    />

    <ClassSentences id="pronouns.cs1"
      lesson="Lesson 3 · Pronouns (αὐτός)"
      items={[
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "κύριος", parsing: "Nom Sg Masc — κύριος", syntax: "Subject", gloss: "Lord" },
          { w: "γινώσκει", parsing: "Pres Act Ind 3 Sg — γινώσκω", gloss: "knows" },
          { w: "αὐτούς.", parsing: "Acc Pl Masc — αὐτός", syntax: "Direct Object", gloss: "them" },
        ],
          translation: "The Lord knows them.",
        },
        { words: [
          { w: "λέγει", parsing: "Pres Act Ind 3 Sg — λέγω", gloss: "says" },
          { w: "αὐτοῖς", parsing: "Dat Pl Masc — αὐτός", syntax: "Dative of Indirect Object", gloss: "to them" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "Ἰησοῦς.", parsing: "Nom Sg Masc — Ἰησοῦς", syntax: "Subject", gloss: "Jesus" },
        ],
          translation: "Jesus says to them.",
          note: "The subject comes last — the cases, not the order, tell you who speaks.",
        },
        { words: [
          { w: "ἀκούομεν", parsing: "Pres Act Ind 1 Pl — ἀκούω", gloss: "we hear" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λόγον", parsing: "Acc Sg Masc — λόγος", syntax: "Direct Object", gloss: "word" },
          { w: "αὐτοῦ.", parsing: "Gen Sg Masc — αὐτός", syntax: "Genitive of Possession", gloss: "his" },
        ],
          translation: "We hear his word.",
          note: "The genitive of αὐτός is how Greek says \"his/her/its\" — literally \"the word of him.\"",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "θεὸς", parsing: "Nom Sg Masc — θεός", syntax: "Subject", gloss: "God" },
          { w: "γινώσκει", parsing: "Pres Act Ind 3 Sg — γινώσκω", gloss: "knows" },
          { w: "τὰς", parsing: "Article — Acc Pl Fem", gloss: "the" },
          { w: "καρδίας", parsing: "Acc Pl Fem — καρδία", syntax: "Direct Object", gloss: "hearts" },
          { w: "αὐτῶν.", parsing: "Gen Pl — αὐτός", syntax: "Genitive of Possession", gloss: "their" },
        ],
          translation: "God knows their hearts.",
        },
        { words: [
          { w: "βλέπομεν", parsing: "Pres Act Ind 1 Pl — βλέπω", gloss: "we see" },
          { w: "αὐτὸν", parsing: "Acc Sg Masc — αὐτός", syntax: "Direct Object", gloss: "him" },
          { w: "ἐν", parsing: "Preposition + dative", gloss: "in" },
          { w: "τῷ", parsing: "Article — Dat Sg Neut", gloss: "the" },
          { w: "ἱερῷ.", parsing: "Dat Sg Neut — ἱερόν", gloss: "temple" },
        ],
          translation: "We see him in the temple.",
        },
      ]}
    />

    {/* ── 3 · 1st & 2nd person ───────────────────────────── */}
    <SectionHeading id="pronouns.h.personal-pronouns">"I" and "you": the personal pronouns</SectionHeading>
    <LevelOnly level="beginning">
      <P id="pronouns.p.here-surprise-verb">
        Here is a surprise from the verb chapter: Greek usually does <em>not</em> need a word for "I" or "you" —
        the verb ending already says who acts (<Gk>λέγω</Gk> = "I say," all by itself). So when
        <Gk> ἐγώ</Gk> or <Gk>σύ</Gk> <em>does</em> appear, it adds <strong>emphasis</strong>:
        <Gk> ἐγὼ λέγω</Gk> is "<em>I</em> say" — I, whatever others may say.
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <p><Tr id="pronouns.as.greek-usually-leaves">Greek usually leaves out "I / you" — the verb ending already says who acts. So when <Gk>ἐγώ</Gk> or <Gk>σύ</Gk> <em>do</em> appear, they add emphasis.</Tr></p>
        <Ex grc="ἐγὼ λέγω" en={<Tr id="pronouns.ex.myself-say">I (myself) say</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="pronouns.as.each-emphatic-unemphatic">Each has an emphatic and an unemphatic (enclitic) form: <Gk>ἐμοῦ / μου</Gk>, <Gk>ἐμοί / μοι</Gk>, <Gk>ἐμέ / με</Gk>. The longer form is used for stress or after a preposition.</Tr></p>
      </>}
    >
      <MorphTable id="pronouns.t2" tCols={[0, 2, 4, 6]} flush title="1st & 2nd Person Pronouns" headers={['Case','1st Sg.','Eng.','1st Pl.','Eng.','2nd Sg.','Eng.','2nd Pl.']}
        rows={[
          ['Nom.','ἐγώ','I','ἡμεῖς','we','σύ','you','ὑμεῖς'],
          ['Gen.','ἐμοῦ / μου','of me','ἡμῶν','of us','σοῦ','of you','ὑμῶν'],
          ['Dat.','ἐμοί / μοι','to/for me','ἡμῖν','to/for us','σοί','to/for you','ὑμῖν'],
          ['Acc.','ἐμέ / με','me','ἡμᾶς','us','σέ','you','ὑμᾶς'],
        ]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P id="pronouns.p.little-genitives-how">
        The little genitives <Gk>μου</Gk> and <Gk>σου</Gk> are how Greek says "my" and "your":
        <Gk> ὁ πατήρ μου</Gk>, "my father" (literally "the father of me"). Note that English spelling can't
        tell "you" singular from "you" plural — Greek always can: <Gk>σύ</Gk> is one person,
        <Gk> ὑμεῖς</Gk> is "you all."
      </P>
    </LevelOnly>

    <DropdownPractice id="pronouns.d2"
      title="Practice — parse the personal pronoun"
      intro={<Tr id="pronouns.intro.which-pronoun-which">Which pronoun, which case — and what does it mean?</Tr>}
      options={["Dative Plural of ἐγώ — \"to/for us\"", "Accusative Plural of σύ — \"you (pl.)\"", "Genitive Singular of ἐγώ — \"my / of me\"", "Genitive Plural of σύ — \"your / of you (pl.)\"", "Accusative Singular of ἐγώ (emphatic) — \"me\"", "Nominative Plural of ἐγώ — \"we\""]}
      items={[
        { q: <span className="normal-case">ἡμῖν</span>, answer: "Dative Plural of ἐγώ — \"to/for us\"" },
        { q: <span className="normal-case">ὑμᾶς</span>, answer: "Accusative Plural of σύ — \"you (pl.)\"" },
        { q: <span className="normal-case">μου</span>, answer: "Genitive Singular of ἐγώ — \"my / of me\"", note: <Tr id="pronouns.n.the-short-enclitic">The short (enclitic) form — the everyday "my."</Tr> },
        { q: <span className="normal-case">ὑμῶν</span>, answer: "Genitive Plural of σύ — \"your / of you (pl.)\"" },
        { q: <span className="normal-case">ἐμέ</span>, answer: "Accusative Singular of ἐγώ (emphatic) — \"me\"", note: <Tr id="pronouns.n.the-long-form">The long form — used for stress or after prepositions.</Tr> },
        { q: <span className="normal-case">ἡμεῖς</span>, answer: "Nominative Plural of ἐγώ — \"we\"", note: <Tr id="pronouns.n.nominative-emphasis-the">Nominative = emphasis: the verb ending already says "we."</Tr> },
      ]}
    />

    <ClassSentences id="pronouns.cs2"
      lesson="Lesson 3 · Pronouns (first and second person)"
      items={[
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "λόγος", parsing: "Nom Sg Masc — λόγος", syntax: "Subject", gloss: "word" },
          { w: "σου", parsing: "Gen Sg — σύ", syntax: "Genitive of Possession", gloss: "your" },
          { w: "σῴζει.", parsing: "Pres Act Ind 3 Sg — σῴζω", gloss: "saves" },
        ],
          translation: "Your word saves.",
        },
        { words: [
          { w: "ἐγὼ", parsing: "Nom Sg — ἐγώ (emphatic)", syntax: "Subject", gloss: "I" },
          { w: "βλέπω", parsing: "Pres Act Ind 1 Sg — βλέπω", gloss: "see" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "ἀδελφόν", parsing: "Acc Sg Masc — ἀδελφός", syntax: "Direct Object", gloss: "brother" },
          { w: "σου.", parsing: "Gen Sg — σύ", syntax: "Genitive of Possession", gloss: "your" },
        ],
          translation: "I see your brother.",
          note: "The spelled-out ἐγώ is emphatic — the verb ending alone already means \"I see.\"",
        },
        { words: [
          { w: "ὑμεῖς", parsing: "Nom Pl — σύ (emphatic)", syntax: "Subject", gloss: "you (pl.)" },
          { w: "ἠκούσατε", parsing: "Aor Act Ind 2 Pl — ἀκούω", gloss: "heard" },
          { w: "ἀλλὰ", parsing: "Conjunction", gloss: "but" },
          { w: "ἡμεῖς", parsing: "Nom Pl — ἐγώ (emphatic)", syntax: "Subject", gloss: "we" },
          { w: "οὐκ", parsing: "Negative particle", gloss: "not" },
          { w: "ἐπιστεύσαμεν.", parsing: "Aor Act Ind 1 Pl — πιστεύω", gloss: "believed" },
        ],
          translation: "You (pl.) heard, but we did not believe.",
          note: "The emphatic pronouns ὑμεῖς and ἡμεῖς sharpen the contrast — Greek only adds them for emphasis.",
        },
        { words: [
          { w: "σὺ", parsing: "Nom Sg — σύ (emphatic)", syntax: "Subject", gloss: "you" },
          { w: "φιλεῖς", parsing: "Pres Act Ind 2 Sg — φιλέω", gloss: "love" },
          { w: "σεαυτόν,", parsing: "Acc Sg Masc — σεαυτοῦ (reflexive)", syntax: "Direct Object", gloss: "yourself" },
          { w: "ἀλλ᾿", parsing: "Conjunction", gloss: "but" },
          { w: "ἐγὼ", parsing: "Nom Sg — ἐγώ (emphatic)", syntax: "Subject", gloss: "I" },
          { w: "τοὺς", parsing: "Article — Acc Pl Masc", gloss: "the" },
          { w: "ἄλλους.", parsing: "Acc Pl Masc — ἄλλος", syntax: "Direct Object", gloss: "others" },
        ],
          translation: "You love yourself, but I (love) the others.",
          note: "The second verb is left out (ellipsis) — supply it from the first clause.",
        },
        { words: [
          { w: "ὑμεῖς", parsing: "Nom Pl — σύ (emphatic)", syntax: "Subject", gloss: "you (pl.)" },
          { w: "ἐστε", parsing: "Pres Act Ind 2 Pl — εἰμί", gloss: "are" },
          { w: "τὸ", parsing: "Article — Nom Sg Neut", gloss: "the" },
          { w: "φῶς", parsing: "Nom Sg Neut — φῶς (3rd decl.)", syntax: "Predicate Nominative", gloss: "light" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of the" },
          { w: "κόσμου.", parsing: "Gen Sg Masc — κόσμος", syntax: "Genitive of Possession", gloss: "world" },
        ],
          translation: "You (pl.) are the light of the world.",
          note: "Matthew 5:14 — straight from your Lesson 4 deck.",
        },
      ]}
    />

    {/* ── 4 · "No one" ───────────────────────────────────── */}
    <SectionHeading id="pronouns.h.one-nothing">"No one, nothing": οὐδείς and μηδείς</SectionHeading>
    <P id="pronouns.p.greek-two-words">
      Greek has two words for "no one / nothing," built from a negative + <Gk>εἷς</Gk> ("one") — literally
      "not even one." Which negative you meet depends on the verb's mood: <Gk>οὐδείς</Gk> pairs with plain
      statements (the indicative), <Gk>μηδείς</Gk> with everything else (commands, "maybes," infinitives).
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="pronouns.as.both-mean-one">Both mean "no one / nothing." Use <Gk>οὐδείς</Gk> with the indicative (statements of fact); use <Gk>μηδείς</Gk> with the other moods (commands, subjunctives, infinitives, participles).</Tr></p>
        <Ex grc="οὐδεὶς οἶδεν" en={<Tr id="pronouns.ex.one-knows">no one knows</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="pronouns.as.both-built-negative">Both are built from a negative + <Gk>εἷς</Gk> ("not even one"). Unlike English, Greek can stack negatives for <em>emphasis</em> — two negatives do not cancel (<Gk>οὐκ … οὐδείς</Gk> = "not … anyone").</Tr></p>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MorphTable id="pronouns.t3" tCols={[0]} flush title="οὐδείς — no one, nothing" headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','οὐδείς','οὐδεμία','οὐδέν'],
            ['Gen.','οὐδενός','οὐδεμιᾶς','οὐδενός'],
            ['Dat.','οὐδενί','οὐδεμιᾷ','οὐδενί'],
            ['Acc.','οὐδένα','οὐδεμίαν','οὐδέν'],
          ]}
          note="Used with indicative mood."
        />
        <MorphTable id="pronouns.t4" tCols={[0]} flush title="μηδείς — no one, nothing" headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','μηδείς','μηδεμία','μηδέν'],
            ['Gen.','μηδενός','μηδεμιᾶς','μηδενός'],
            ['Dat.','μηδενί','μηδεμιᾷ','μηδενί'],
            ['Acc.','μηδένα','μηδεμίαν','μηδέν'],
          ]}
          note="Used with non-indicative moods."
        />
      </div>
    </TableAside>

    {/* ── 5 · τις / τίς ──────────────────────────────────── */}
    <SectionHeading id="pronouns.h.accent-changes-everything">An accent that changes everything: τις and τίς</SectionHeading>
    <P id="pronouns.p.two-pronouns-spelled">
      Two pronouns are spelled with the same letters and distinguished <em>only</em> by the accent.
      Unaccented <Gk>τις</Gk> means "someone, anyone, a certain…"; accented <Gk>τίς</Gk> asks the question
      "who? what?" This is the one place a beginner truly must read accents.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="pronouns.as.unaccented-someone-anyone">Unaccented <Gk>τις</Gk> = "someone, anyone, a certain." It is <em>enclitic</em> — it leans on the previous word and has no accent of its own.</Tr></p>
        <Ex grc="ἄνθρωπός τις" en={<Tr id="pronouns.ex.certain-man">a certain man</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="pronouns.as.can-pronoun-someone"><Gk>τις</Gk> can be a pronoun ("someone") or an adjective ("a certain …"). Tell it from the question word <Gk>τίς</Gk> purely by the <strong>accent</strong>.</Tr></p>
      </>}
    >
      <MorphTable id="pronouns.t5" tCols={[0, 2, 4]} flush title="τις — Indefinite Pronoun (someone, anyone)" headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg. Nom.','τις','someone','τι','something'],
          ['Gen.','τινος','of someone','τινος','of something'],
          ['Dat.','τινι','to someone','τινι','to something'],
          ['Acc.','τινα','someone','τι','something'],
          ['Pl. Nom.','τινες','some (people)','τινα','some things'],
          ['Gen.','τινων','of some','τινων','of some things'],
          ['Dat.','τισι','to some','τισι','to some things'],
          ['Acc.','τινας','some (people)','τινα','some things'],
        ]}
        note="Enclitic — no accent on first syllable."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p><Tr id="pronouns.as.accented-asks-question">Accented <Gk>τίς</Gk> asks a question: "who? what?" The accent is the <em>only</em> difference from indefinite <Gk>τις</Gk>.</Tr></p>
        <Ex grc="τίς εἶ;" en={<Tr id="pronouns.ex.who">Who are you?</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="pronouns.as.neuter-often-means">The neuter <Gk>τί</Gk> often means "why?" as well as "what?" (<Gk>τί ποιεῖτε;</Gk> "why are you doing this?").</Tr></p>
      </>}
    >
      <MorphTable id="pronouns.t6" tCols={[0, 2, 4]} flush title="τίς — Interrogative Pronoun (who? what?)" headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg. Nom.','τίς','who?','τί','which? what? why?'],
          ['Gen.','τίνος','whose?','τίνος','of which? what?'],
          ['Dat.','τίνι','to whom?','τίνι','to which?'],
          ['Acc.','τίνα','whom?','τί','which? what?'],
          ['Pl. Nom.','τίνες','who?','τίνα','which? what?'],
          ['Gen.','τίνων','whose?','τίνων','of which? what?'],
          ['Dat.','τίσι','to whom?','τίσι','to which?'],
          ['Acc.','τίνας','who?','τίνα','which? what?'],
        ]}
        note="Always accented — distinguished from τις by accent."
      />
    </TableAside>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <SectionHeading id="pronouns.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="pronouns.wo.she-woman-breathing"><Gk>αὐτή</Gk> ("she") vs. <Gk>αὕτη</Gk> ("this woman," from <Gk>οὗτος</Gk>) — the breathing mark and accent are the only visible difference.</Tr></li>
        <li><Tr id="pronouns.wo.greek-question-mark">The Greek question mark is <Gk>;</Gk> — what looks like a semicolon ends a question: <Gk>τίς εἶ;</Gk></Tr></li>
        <li><Tr id="pronouns.wo.possessives-need-article">Possessives need the article: "my words" is <Gk>οἱ λόγοι μου</Gk>, with <Gk>οἱ</Gk> — not bare <Gk>λόγοι μου</Gk>.</Tr></li>
        <li><Tr id="pronouns.wo.translate-grammatical-gender">Translate grammatical gender by sense: <Gk>αὐτῆς</Gk> referring to <Gk>τῆς ἐκκλησίας</Gk> is "its," not "her."</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="pronouns.h.try">Try it</SectionHeading></LevelOnly>
    <DropdownPractice id="pronouns.d3"
      title="Practice — τις or τίς?"
      intro={<Tr id="pronouns.intro.read-accent-first">Read the accent first — it is the only difference between "someone" and "who?"</Tr>}
      options={["Interrogative — \"who?\"", "Indefinite — \"someone\"", "Interrogative — \"what? why?\"", "Indefinite — \"some (people)\"", "Interrogative — \"whose? of what?\"", "Indefinite — \"to someone\""]}
      items={[
        { q: <span className="normal-case">τίς</span>, answer: "Interrogative — \"who?\"" },
        { q: <span className="normal-case">τις</span>, answer: "Indefinite — \"someone\"", note: <Tr id="pronouns.n.accent-the-enclitic">No accent — the enclitic indefinite.</Tr> },
        { q: <span className="normal-case">τί</span>, answer: "Interrogative — \"what? why?\"" },
        { q: <span className="normal-case">τινες</span>, answer: "Indefinite — \"some (people)\"" },
        { q: <span className="normal-case">τίνος</span>, answer: "Interrogative — \"whose? of what?\"" },
        { q: <span className="normal-case">τινι</span>, answer: "Indefinite — \"to someone\"" },
      ]}
    />

    <ClassSentences id="pronouns.cs3"
      lesson="Lesson 4 · τις and τίς"
      items={[
        { words: [
          { w: "τίς", parsing: "Nom Sg — τίς (interrogative)", syntax: "Subject", gloss: "who?" },
          { w: "πιστεύει;", parsing: "Pres Act Ind 3 Sg — πιστεύω", gloss: "believes" },
        ],
          translation: "Who believes?",
        },
        { words: [
          { w: "τίς", parsing: "Nom Sg — τίς (interrogative)", syntax: "Subject", gloss: "who?" },
          { w: "ἀκούει", parsing: "Pres Act Ind 3 Sg — ἀκούω", gloss: "hears" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λόγον;", parsing: "Acc Sg Masc — λόγος", syntax: "Direct Object", gloss: "word" },
        ],
          translation: "Who hears the word?",
        },
        { words: [
          { w: "θέλω", parsing: "Pres Act Ind 1 Sg — θέλω", gloss: "I want" },
          { w: "ὕδωρ", parsing: "Acc Sg Neut — ὕδωρ (3rd decl.)", syntax: "Direct Object", gloss: "water" },
          { w: "τι.", parsing: "Acc Sg Neut — τις (indefinite, enclitic)", gloss: "some" },
        ],
          translation: "I want some water.",
          note: "Unaccented τι = \"some\" — leaning on the noun before it.",
        },
        { words: [
          { w: "τί", parsing: "Acc Sg Neut — τίς (interrogative, adverbial)", gloss: "why?" },
          { w: "ζητεῖτε", parsing: "Pres Act Ind 2 Pl — ζητέω", gloss: "you seek" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "κύριον;", parsing: "Acc Sg Masc — κύριος", syntax: "Direct Object", gloss: "Lord" },
        ],
          translation: "Why do you (pl.) seek the Lord?",
          note: "Neuter τί often means \"why?\" — context decides between \"what?\" and \"why?\"",
        },
        { words: [
          { w: "περὶ", parsing: "Preposition + genitive", gloss: "about" },
          { w: "τίνος", parsing: "Gen Sg — τίς (interrogative)", gloss: "what/whom?" },
          { w: "λέγεις;", parsing: "Pres Act Ind 2 Sg — λέγω", gloss: "are you speaking" },
        ],
          translation: "About what (or whom) are you speaking?",
        },
        { words: [
          { w: "γυναῖκές", parsing: "Nom Pl Fem — γυνή (3rd decl.)", syntax: "Subject", gloss: "women" },
          { w: "τινες", parsing: "Nom Pl — τις (indefinite)", gloss: "some" },
          { w: "εἰσὶν", parsing: "Pres Act Ind 3 Pl — εἰμί", gloss: "are" },
          { w: "πισταί.", parsing: "Nom Pl Fem — πιστός", syntax: "Predicate Nominative", gloss: "faithful" },
        ],
          translation: "Some women are faithful.",
          note: "The double accent on γυναῖκές comes from the enclitic τινες throwing its accent backward.",
        },
        { words: [
          { w: "τίνα", parsing: "Acc Sg — τίς (interrogative)", syntax: "Direct Object", gloss: "whom?" },
          { w: "καλεῖτε;", parsing: "Pres Act Ind 2 Pl — καλέω", gloss: "are you calling" },
        ],
          translation: "Whom are you (pl.) calling?",
        },
      ]}
    />

    <HomeworkAssignments chapter="pronouns" />

    <LiveExamples
      intro={<Tr id="pronouns.intro.pronouns-highest-frequency">Pronouns are the highest-frequency words in the NT after the article — see them at work.</Tr>}
      links={[
        { label: <Tr id="pronouns.le.every-form-nt's">Every form of <span className="normal-case">αὐτός</span> — the NT's third most common word</Tr>, lemma: 'αὐτός', features: ['pronoun'] },
        { label: <Tr id="pronouns.le.every-spot-emphasis">Every <span className="normal-case">ἐγώ</span> — spot the emphasis each time "I" is spelled out</Tr>, lemma: 'ἐγώ', features: ['pronoun'] },
        { label: <Tr id="pronouns.le.accusative">All pronouns in the accusative — pronouns as objects</Tr>, features: ['pronoun', 'accusative'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
  </>
)
