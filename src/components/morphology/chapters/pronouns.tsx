/* ─────────────────────────────────────────────
   Chapter: Pronouns

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const PRONOUNS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: words that stand in</SectionHeading>
      <P>
        "Mary saw Mary's brother and Mary waved to Mary's brother." Unbearable — which is why every language
        has <Term t="pronoun">pronouns</Term>: "Mary saw her brother and waved to him."
        A pronoun stands in for a noun already mentioned (its <strong>antecedent</strong>), so you
        don't have to keep repeating it.
      </P>
      <P>
        You already know the key fact about Greek pronouns from the Nouns chapter: English pronouns are the
        one place English still changes form for <Term t="case">case</Term> — <em>he / his / him</em>. Greek
        pronouns do the same, with fuller sets of endings. The rule of agreement: a pronoun matches its
        antecedent in <strong>gender and number</strong>, but takes its <strong>case from its own job</strong> in
        the sentence. "Mary … waved to <em>him</em>" — <em>him</em> is masculine singular because "brother" is,
        but object-form because of its own role.
      </P>
    </LevelOnly>

    {/* ── 2 · αὐτός ──────────────────────────────────────── */}
    <SectionHeading>The workhorse: αὐτός ("he, she, it")</SectionHeading>
    <P>
      By far the most common Greek pronoun is <Gk>αὐτός</Gk> — the everyday "he / she / it / they." Its endings
      are the familiar 1st/2nd-declension set, and its genitive doubles as "his / her / its / their":
      <Gk> ὁ λόγος αὐτοῦ</Gk>, "his word" (literally "the word of him").
    </P>
    <TableAside
      beginning={<>
        <p><Gk>αὐτός</Gk> is the everyday "he / she / it, they." It agrees in gender with the noun it stands for.</p>
        <Ex grc="βλέπω αὐτόν" en="I see him" />
        <Ex grc="ὁ λόγος αὐτοῦ" en="his word" />
      </>}
      intermediate={<>
        <p><Gk>αὐτός</Gk> does triple duty: alone in an oblique case = "him"; in the attributive position (<Gk>ὁ αὐτός</Gk>) = "the same"; in the predicate position (<Gk>αὐτὸς ὁ…</Gk>) = intensive "himself."</p>
      </>}
    >
      <MorphTable flush title={gt("3rd Person Pronoun — αὐτός (he, she, it)")} headers={['','','Masc.','Eng.','Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg.','Nom.','αὐτός','he','αὐτή','she','αὐτό','it'],
          ['','Gen.','αὐτοῦ','his','αὐτῆς','her','αὐτοῦ','its'],
          ['','Dat.','αὐτῷ','to him','αὐτῇ','to her','αὐτῷ','to it'],
          ['','Acc.','αὐτόν','him','αὐτήν','her','αὐτό','it'],
          ['Pl.','Nom.','αὐτοί','they','αὐταί','they','αὐτά','they'],
          ['','Gen.','αὐτῶν','their','αὐτῶν','their','αὐτῶν','their'],
          ['','Dat.','αὐτοῖς','to them','αὐταῖς','to them','αὐτοῖς','to them'],
          ['','Acc.','αὐτούς','them','αὐτάς','them','αὐτά','them'],
        ]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P>
        One translation habit to build early: Greek gender is grammatical, so <Gk>αὐτή</Gk> pointing back to a
        feminine <em>thing</em> (say, <Gk>ἡ ἐκκλησία</Gk>, "the church") comes into English as "it," not "she."
        Translate the antecedent's meaning, not the Greek gender.
      </P>
    </LevelOnly>

    {/* ── 3 · 1st & 2nd person ───────────────────────────── */}
    <SectionHeading>"I" and "you": the personal pronouns</SectionHeading>
    <P>
      Here is a surprise from the verb chapter: Greek usually does <em>not</em> need a word for "I" or "you" —
      the verb ending already says who acts (<Gk>λέγω</Gk> = "I say," all by itself). So when
      <Gk> ἐγώ</Gk> or <Gk>σύ</Gk> <em>does</em> appear, it adds <strong>emphasis</strong>:
      <Gk> ἐγὼ λέγω</Gk> is "<em>I</em> say" — I, whatever others may say.
    </P>
    <TableAside
      beginning={<>
        <p>Greek usually leaves out "I / you" — the verb ending already says who acts. So when <Gk>ἐγώ</Gk> or <Gk>σύ</Gk> <em>do</em> appear, they add emphasis.</p>
        <Ex grc="ἐγὼ λέγω" en="I (myself) say" />
      </>}
      intermediate={<>
        <p>Each has an emphatic and an unemphatic (enclitic) form: <Gk>ἐμοῦ / μου</Gk>, <Gk>ἐμοί / μοι</Gk>, <Gk>ἐμέ / με</Gk>. The longer form is used for stress or after a preposition.</p>
      </>}
    >
      <MorphTable flush title="1st & 2nd Person Pronouns" headers={['Case','1st Sg.','Eng.','1st Pl.','Eng.','2nd Sg.','Eng.','2nd Pl.']}
        rows={[
          ['Nom.','ἐγώ','I','ἡμεῖς','we','σύ','you','ὑμεῖς'],
          ['Gen.','ἐμοῦ / μου','of me','ἡμῶν','of us','σοῦ','of you','ὑμῶν'],
          ['Dat.','ἐμοί / μοι','to/for me','ἡμῖν','to/for us','σοί','to/for you','ὑμῖν'],
          ['Acc.','ἐμέ / με','me','ἡμᾶς','us','σέ','you','ὑμᾶς'],
        ]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P>
        The little genitives <Gk>μου</Gk> and <Gk>σου</Gk> are how Greek says "my" and "your":
        <Gk> ὁ πατήρ μου</Gk>, "my father" (literally "the father of me"). Note that English spelling can't
        tell "you" singular from "you" plural — Greek always can: <Gk>σύ</Gk> is one person,
        <Gk> ὑμεῖς</Gk> is "you all."
      </P>
    </LevelOnly>

    {/* ── 4 · "No one" ───────────────────────────────────── */}
    <SectionHeading>"No one, nothing": οὐδείς and μηδείς</SectionHeading>
    <P>
      Greek has two words for "no one / nothing," built from a negative + <Gk>εἷς</Gk> ("one") — literally
      "not even one." Which negative you meet depends on the verb's mood: <Gk>οὐδείς</Gk> pairs with plain
      statements (the indicative), <Gk>μηδείς</Gk> with everything else (commands, "maybes," infinitives).
    </P>
    <TableAside
      beginning={<>
        <p>Both mean "no one / nothing." Use <Gk>οὐδείς</Gk> with the indicative (statements of fact); use <Gk>μηδείς</Gk> with the other moods (commands, subjunctives, infinitives, participles).</p>
        <Ex grc="οὐδεὶς οἶδεν" en="no one knows" />
      </>}
      intermediate={<>
        <p>Both are built from a negative + <Gk>εἷς</Gk> ("not even one"). Unlike English, Greek can stack negatives for <em>emphasis</em> — two negatives do not cancel (<Gk>οὐκ … οὐδείς</Gk> = "not … anyone").</p>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MorphTable flush title={gt("οὐδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','οὐδείς','οὐδεμία','οὐδέν'],
            ['Gen.','οὐδενός','οὐδεμιᾶς','οὐδενός'],
            ['Dat.','οὐδενί','οὐδεμιᾷ','οὐδενί'],
            ['Acc.','οὐδένα','οὐδεμίαν','οὐδέν'],
          ]}
          note="Used with indicative mood."
        />
        <MorphTable flush title={gt("μηδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
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
    <SectionHeading>An accent that changes everything: τις and τίς</SectionHeading>
    <P>
      Two pronouns are spelled with the same letters and distinguished <em>only</em> by the accent.
      Unaccented <Gk>τις</Gk> means "someone, anyone, a certain…"; accented <Gk>τίς</Gk> asks the question
      "who? what?" This is the one place a beginner truly must read accents.
    </P>
    <TableAside
      beginning={<>
        <p>Unaccented <Gk>τις</Gk> = "someone, anyone, a certain." It is <em>enclitic</em> — it leans on the previous word and has no accent of its own.</p>
        <Ex grc="ἄνθρωπός τις" en="a certain man" />
      </>}
      intermediate={<>
        <p><Gk>τις</Gk> can be a pronoun ("someone") or an adjective ("a certain …"). Tell it from the question word <Gk>τίς</Gk> purely by the <strong>accent</strong>.</p>
      </>}
    >
      <MorphTable flush title={gt("τις — Indefinite Pronoun (someone, anyone)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
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
        <p>Accented <Gk>τίς</Gk> asks a question: "who? what?" The accent is the <em>only</em> difference from indefinite <Gk>τις</Gk>.</p>
        <Ex grc="τίς εἶ;" en="Who are you?" />
      </>}
      intermediate={<>
        <p>The neuter <Gk>τί</Gk> often means "why?" as well as "what?" (<Gk>τί ποιεῖτε;</Gk> "why are you doing this?").</p>
      </>}
    >
      <MorphTable flush title={gt("τίς — Interrogative Pronoun (who? what?)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
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
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>αὐτή</Gk> ("she") vs. <Gk>αὕτη</Gk> ("this woman," from <Gk>οὗτος</Gk>) — the breathing mark and accent are the only visible difference.</li>
        <li>The Greek question mark is <Gk>;</Gk> — what looks like a semicolon ends a question: <Gk>τίς εἶ;</Gk></li>
        <li>Possessives need the article: "my words" is <Gk>οἱ λόγοι μου</Gk>, with <Gk>οἱ</Gk> — not bare <Gk>λόγοι μου</Gk>.</li>
        <li>Translate grammatical gender by sense: <Gk>αὐτῆς</Gk> referring to <Gk>τῆς ἐκκλησίας</Gk> is "its," not "her."</li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice A — parse the pronoun"
      intro={<>Identify the form and give a translation.</>}
      items={[
        { q: <span className="normal-case">αὐτούς</span>,
          a: <>Accusative plural masculine of <span className="normal-case">αὐτός</span> — "them."</> },
        { q: <span className="normal-case">αὐτῇ</span>,
          a: <>Dative singular feminine — "to / for her" (or "to it," if the antecedent is a feminine thing).</> },
        { q: <span className="normal-case">ἡμῖν</span>,
          a: <>Dative plural of <span className="normal-case">ἐγώ</span> — "to / for us."</> },
        { q: <span className="normal-case">ὑμᾶς</span>,
          a: <>Accusative plural of <span className="normal-case">σύ</span> — "you all" as an object.</> },
        { q: <span className="normal-case">τίνος</span>,
          a: <>Genitive singular of accented <span className="normal-case">τίς</span> — "whose? of what?"</> },
      ]}
    />
    <Practice
      title="Practice B — translate the sentence"
      intro={<>Vocabulary: <span className="normal-case">βλέπω</span> "I see" · <span className="normal-case">λέγει</span> "says" · <span className="normal-case">ἀκούετε</span> "you (pl.) hear" · <span className="normal-case">γινώσκει</span> "knows."</>}
      items={[
        { q: <span className="normal-case">ὁ κύριος γινώσκει αὐτούς.</span>,
          a: <>"The Lord knows them."</> },
        { q: <span className="normal-case">λέγει αὐτοῖς ὁ Ἰησοῦς.</span>,
          a: <>"Jesus says to them" — dative <span className="normal-case">αὐτοῖς</span> = the ones addressed.</> },
        { q: <span className="normal-case">ἐγὼ βλέπω τὸν ἀδελφόν σου.</span>,
          a: <>"<em>I</em> see your brother" — the expressed <span className="normal-case">ἐγώ</span> is emphatic; <span className="normal-case">σου</span> = "your."</> },
        { q: <span className="normal-case">τίς ἀκούει τὸν λόγον;</span>,
          a: <>"Who hears the word?" — accented <span className="normal-case">τίς</span> asks the question.</> },
        { q: <span className="normal-case">ἄνθρωπός τις εἶχεν δύο τέκνα.</span>,
          a: <>"A certain man had two children" — unaccented <span className="normal-case">τις</span>, the classic parable opener.</> },
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>Pronouns are the highest-frequency words in the NT after the article — see them at work.</>}
      links={[
        { label: <>Every form of <span className="normal-case">αὐτός</span> — the NT's third most common word</>, lemma: 'αὐτός', features: ['pronoun'] },
        { label: <>Every <span className="normal-case">ἐγώ</span> — spot the emphasis each time "I" is spelled out</>, lemma: 'ἐγώ', features: ['pronoun'] },
        { label: 'All pronouns in the accusative — pronouns as objects', features: ['pronoun', 'accusative'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: small words, large claims</SectionHeading>
      <P>
        <strong>The three faces of αὐτός.</strong> Position is everything. Oblique and alone, it is the plain
        pronoun ("him"). Inside the article-unit — <Gk>ὁ αὐτὸς λόγος</Gk> — it means "the <em>same</em> word."
        In predicate position — <Gk>αὐτὸς ὁ κύριος</Gk> — it intensifies: "the Lord <em>himself</em>"
        (1 Thess 4:16). Same word, three meanings, all decided by the article.
      </P>
      <P>
        <strong>Emphatic ἐγώ εἰμι.</strong> Since the verb alone means "I am," the spelled-out
        <Gk> ἐγώ εἰμι</Gk> is doubly weighted — and John builds a christology on it: "before Abraham was,
        <Gk> ἐγὼ εἰμί</Gk>" (John 8:58), echoing the divine self-declaration of Exod 3:14 (LXX). The
        crowd's reaction — picking up stones — shows they heard the claim in the grammar.
      </P>
      <P>
        <strong>Editorial "we."</strong> A first-person plural does not always include the readers: Paul's
        "we" sometimes means himself alone (epistolary plural), sometimes himself and his co-workers
        (exclusive), sometimes everyone (inclusive). Deciding which is a genuinely interpretive act —
        try it on the "we" statements of 1 John 1.
      </P>
    </LevelOnly>
  </>
)
