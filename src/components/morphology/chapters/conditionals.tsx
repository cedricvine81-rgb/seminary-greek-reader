/* ─────────────────────────────────────────────
   Chapter: Conditionals

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'

export const CONJUNCTIONS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="conditionals.h.start-english-three">Start with English: three flavours of "if"</SectionHeading>
      <P id="conditionals.p.compare-three-english">
        Compare three English sentences. "If it's raining, the game is off" — you're reasoning from a
        supposition. "If you had studied, you would have passed" — you didn't, and both of you know it.
        "If you ask her, she'll help" — an open possibility, still in the future. One little word "if,"
        three different relationships to reality, and English signals the difference entirely through
        helper verbs (<em>had… would have…; will</em>).
      </P>
      <P id="conditionals.p.greek-builds-same">
        Greek builds the same three flavours with hardware you already own: the choice
        of "if"-word (<Gk>εἰ</Gk> or <Gk>ἐάν</Gk>), the <Term t="mood">mood</Term> of the verb, and the
        little particle <Gk>ἄν</Gk>. Grammarians number the flavours: <strong>first class</strong> (assumed
        true), <strong>second class</strong> (contrary to fact), <strong>third class</strong> (open /
        future). Two names to keep: the "if" clause is the <strong>protasis</strong>; the "then" clause is
        the <strong>apodosis</strong>.
      </P>
    </LevelOnly>

    {/* ── 2 · The map ────────────────────────────────────── */}
    <SectionHeading id="conditionals.h.map-three-classes">The map: three classes</SectionHeading>
    <TableAside
      beginning={<>
        <p><Tr id="conditionals.as.conditional-clause-protasis">A conditional has an "if" clause (protasis) and a "then" clause (apodosis). Count the words to classify it: <Gk>εἰ</Gk> = One Word (1st) · <Gk>εἰ … ἄν</Gk> = Two Words (2nd) · <Gk>ἐάν</Gk> = Three Letters (3rd).</Tr></p>
        <Ex grc="εἰ υἱὸς εἶ τοῦ θεοῦ…" en={<Tr id="conditionals.ex.son-god-class">if you are the Son of God… (1st class)</Tr>} />
      </>}
    >
      <MorphTable id="conditionals.t1" tCols={[0, 2]} flush title="Conditional Sentences" headers={['Class','Protasis','Apodosis']}
        rows={[
          ['First Class (Assumed True)','εἰ + Indicative','Any mood or tense'],
          ['Second Class (Contrary to Fact)','εἰ + Indicative','ἄν + Indicative'],
          ['Third Class (Probable / Future)','ἐάν + Subjunctive','Any mood or tense'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Class by class ─────────────────────────────── */}
    <DropdownPractice id="conditionals.d1"
      title="Practice — name the class"
      intro={<Tr id="conditionals.intro.read-conjunction-mood">Read the conjunction + mood before anything else.</Tr>}
      options={["First class — εἰ + indicative (assumed true)", "Second class — εἰ + past indicative … ἄν (contrary to fact)", "Third class — ἐάν + subjunctive (open)", "Indefinite relative — ὃς ἄν + subjunctive (\"whoever\")"]}
      items={[
        { q: <Tr id="conditionals.q.first"><span className="normal-case">εἰ</span> + present indicative</Tr>, answer: "First class — εἰ + indicative (assumed true)" },
        { q: <Tr id="conditionals.q.second"><span className="normal-case">εἰ</span> + aorist indicative … <span className="normal-case">ἄν</span></Tr>, answer: "Second class — εἰ + past indicative … ἄν (contrary to fact)" },
        { q: <Tr id="conditionals.q.third"><span className="normal-case">ἐάν</span> + subjunctive</Tr>, answer: "Third class — ἐάν + subjunctive (open)" },
        { q: <Tr id="conditionals.q.indefinite"><span className="normal-case">ὃς ἄν</span> + subjunctive</Tr>, answer: "Indefinite relative — ὃς ἄν + subjunctive (\"whoever\")" },
      ]}
    />

    <SectionHeading id="conditionals.h.first-class-assumed">First class: assumed true — for the argument</SectionHeading>
    <P id="conditionals.p.indicative-assumes-sake">
      <Gk>εἰ</Gk> + indicative assumes the "if" for the sake of what follows: <em>if</em> this holds,
      <em> then</em> that follows. Crucially, the grammar says nothing about whether it actually holds.
      "If you like patterns, you'll like Greek" tells you nothing about whether you do — only what follows
      if you do.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="εἰ δὲ ὑμεῖς Χριστοῦ, ἄρα τοῦ Ἀβραὰμ σπέρμα ἐστέ" en={<Tr id="conditionals.ex.christ's-then-abraham's">if you are Christ's, then you are Abraham's offspring (Gal 3:29)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="conditionals.as.class-protasis-can">A 1st-class protasis can be something the speaker affirms, doubts, or even mocks — the taunt <Gk>εἰ σὺ εἶ ὁ βασιλεὺς τῶν Ἰουδαίων, σῶσον σεαυτόν</Gk> (Luke 23:37) is 1st class. So never auto-translate <Gk>εἰ</Gk> as "since."</Tr></p>
      </>}
    >
      <MorphTable id="conditionals.t2" tCols={[0, 2]} flush title="First class anatomy" headers={['Piece', 'Form', 'Note']} firstColIsData
        rows={[
          ['Protasis', 'εἰ + indicative', 'assumed true for the argument'],
          ['Apodosis', 'anything', 'statement, command, question…'],
        ]}
      />
    </TableAside>

    <SectionHeading id="conditionals.h.second-class-contrary">Second class: contrary to fact</SectionHeading>
    <P id="conditionals.p.still-indicative-past">
      Still <Gk>εἰ</Gk> + indicative (past tenses), but now the apodosis carries <Gk>ἄν</Gk> — and the
      speaker signals that the "if" is <em>not</em> the case: "if you had liked Greek, you would have
      learnt it" (you didn't, alas). English's tell is "would"; Greek's is that little <Gk>ἄν</Gk>.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="εἰ γὰρ ἐπιστεύετε Μωϋσεῖ, ἐπιστεύετε ἂν ἐμοί" en={<Tr id="conditionals.ex.believed-moses-would">if you believed Moses, you would believe me (John 5:46)</Tr>} />
        <p><Tr id="conditionals.as.implication-don't-believe">Implication: they don't believe Moses — and so don't believe Jesus.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="conditionals.as.tense-refines-counterfactual">Tense refines the counterfactual: imperfects for present-time ("if you believed [now]…"), aorists for past-time ("if they had known, they would not have crucified the Lord of glory," 1 Cor 2:8). Martha's <Gk>εἰ ἦς ὧδε</Gk> (John 11:21) wraps grief in grammar: "if you had been here…"</Tr></p>
      </>}
    >
      <MorphTable id="conditionals.t3" tCols={[0, 2]} flush title="Second class anatomy" headers={['Piece', 'Form', 'Note']} firstColIsData
        rows={[
          ['Protasis', 'εἰ + past indicative', 'assumed false'],
          ['Apodosis', 'ἄν + past indicative', 'the “would (have)” clause'],
        ]}
      />
    </TableAside>

    <SectionHeading id="conditionals.h.third-class-open">Third class: open — maybe, or whenever</SectionHeading>
    <P id="conditionals.p.subjunctive-leaves-condition">
      <Gk>ἐάν</Gk> + <Term t="subjunctive">subjunctive</Term> leaves the condition genuinely open — a
      future prospect ("if you ask…"), or a general truth about whoever-it-applies-to ("if anyone loves
      the world…"). The subjunctive is exactly the right mood: the maybe-mood for the maybe-clause.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἐὰν μόνον ἅψωμαι τοῦ ἱματίου αὐτοῦ, σωθήσομαι" en={<Tr id="conditionals.ex.only-touch-his">if only I touch his cloak, I will be saved (Matt 9:21)</Tr>} />
        <Ex grc="ἐάν τι αἰτήσητε ἐν τῷ ὀνόματί μου…" en={<Tr id="conditionals.ex.ask-anything-name">if you ask anything in my name… (John 14:14)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="conditionals.as.general-class-states">The "general" 3rd class states a standing rule: <Gk>ἐάν τις ἀγαπᾷ τὸν κόσμον, οὐκ ἔστιν ἡ ἀγάπη τοῦ πατρὸς ἐν αὐτῷ</Gk> (1 John 2:15) — timeless, not predictive. Context separates "future particular" from "present general."</Tr></p>
      </>}
    >
      <MorphTable id="conditionals.t4" tCols={[0, 2]} flush title="Third class anatomy" headers={['Piece', 'Form', 'Note']} firstColIsData
        rows={[
          ['Protasis', 'ἐάν + subjunctive', 'open: future or general'],
          ['Apodosis', 'anything', 'often future indicative'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <ClassSentences id="conditionals.cs1"
      lesson="A third-class condition"
      items={[
        { words: [
          { w: "ἐὰν", parsing: "Conjunction (+ subjunctive)", syntax: "Conditional Clause (Third Class)", gloss: "if" },
          { w: "ἔχητε", parsing: "Pres Act Subj 2 Pl — ἔχω", gloss: "you have" },
          { w: "ἀγάπην,", parsing: "Acc Sg Fem — ἀγάπη", syntax: "Direct Object", gloss: "love" },
          { w: "μαθηταί", parsing: "Nom Pl Masc — μαθητής", syntax: "Predicate Nominative", gloss: "disciples" },
          { w: "μού", parsing: "Gen Sg — ἐγώ", syntax: "Genitive of Possession", gloss: "my" },
          { w: "ἐστε.", parsing: "Pres Act Ind 2 Pl — εἰμί", gloss: "you are" },
        ],
          translation: "If you have love, you are my disciples.",
          note: "After John 13:35.",
        },
      ]}
    />

    <SectionHeading id="conditionals.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="conditionals.wo.first-class-since">First class ≠ "since." The devil's <Gk>εἰ υἱὸς εἶ τοῦ θεοῦ</Gk> (Matt 4:3) assumes it for the argument's sake — translating "since you are" flattens the taunt.</Tr></li>
        <li><Tr id="conditionals.wo.unless-unless-one"><Gk>ἐὰν μή</Gk> = "unless" (<Gk>ἐὰν μή τις γεννηθῇ ἄνωθεν</Gk>, "unless one is born again," John 3:3).</Tr></li>
        <li><Tr id="conditionals.wo.unaccented-looking-circumflexed"><Gk>εἰ</Gk> vs. <Gk>εἶ</Gk>: unaccented-looking <Gk>εἰ</Gk> "if" vs. circumflexed <Gk>εἶ</Gk> "you are" — they even co-star in the same clause (<Gk>εἰ σὺ εἶ…</Gk> "if you are…").</Tr></li>
        <li><Tr id="conditionals.wo.untranslatable-alone-colours"><Gk>ἄν</Gk> is untranslatable alone — it colours the clause ("would," "-ever"). Spot it, don't gloss it.</Tr></li>
        <li><Tr id="conditionals.wo.even"><Gk>κἄν</Gk> = <Gk>καὶ ἐάν</Gk>, "even if."</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="conditionals.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="conditionals.pr1"
      title="Practice — classify and translate"
      intro={<Tr id="conditionals.intro.name-class-first">Name the class first (count the words!), then translate.</Tr>}
      items={[
        { q: <span className="normal-case">εἰ φιλεῖς τὸν θεόν, σοφὸς εἶ.</span>,
          a: <Tr id="conditionals.pa.class-love-god">1st class — "If you love God, you are wise." Assumed true for the argument.</Tr>},
        { q: <span className="normal-case">εἰ ἤκουσεν, οὐκ ἂν ἀπέθανεν.</span>,
          a: <Tr id="conditionals.pa.class-had-listened">2nd class (the ἄν!) — "If he had listened, he would not have died." He didn't listen.</Tr>},
        { q: <span className="normal-case">ἐὰν ὁ βασιλεὺς ἐξέλθῃ, οἱ δοῦλοι ἀπολυθήσονται.</span>,
          a: <Tr id="conditionals.pa.class-king-goes">3rd class — "If the king goes out, the slaves will be released." Open future.</Tr>},
        { q: <span className="normal-case">ἐὰν εἴπωμεν ὅτι ἁμαρτίαν οὐκ ἔχομεν, ἑαυτοὺς πλανῶμεν.</span>,
          a: <Tr id="conditionals.pa.class-general-say">3rd class, general — "If we say we have no sin, we deceive ourselves" (1 John 1:8): a standing truth about whoever says it.</Tr>},
        { q: <span className="normal-case">εἰ τὸ εὐαγγέλιον κηρύσσεται, χαίρετε.</span>,
          a: <Tr id="conditionals.pa.class-imperative-apodosis">1st class with an imperative apodosis — "If the gospel is being preached, rejoice!"</Tr>},
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="conditionals.cs2"
      lesson="Lesson 10 · Conditionals"
      items={[
        { words: [
          { w: "εἰ", parsing: "Conjunction (+ indicative)", syntax: "Conditional Clause (First Class)", gloss: "if" },
          { w: "πιστεύεις", parsing: "Pres Act Ind 2 Sg — πιστεύω", gloss: "you believe" },
          { w: "τῷ", parsing: "Article — Dat Sg Masc", gloss: "the" },
          { w: "λόγῳ,", parsing: "Dat Sg Masc — λόγος", gloss: "word" },
          { w: "μακάριός", parsing: "Nom Sg Masc — μακάριος", syntax: "Predicate Nominative", gloss: "blessed" },
          { w: "εἶ.", parsing: "Pres Act Ind 2 Sg — εἰμί", gloss: "you are" },
        ],
          translation: "If you (s.) believe the word, you are blessed.",
          note: "First class: assumed true for the sake of argument.",
        },
        { words: [
          { w: "εἰ", parsing: "Conjunction (+ past indicative)", syntax: "Conditional Clause (Second Class)", gloss: "if" },
          { w: "ἐπίστευσας", parsing: "Aor Act Ind 2 Sg — πιστεύω", gloss: "you had believed" },
          { w: "οὐκ", parsing: "Negative particle", gloss: "not" },
          { w: "ἂν", parsing: "Particle (marks contrary-to-fact)", gloss: "would" },
          { w: "ἐφοβήθης.", parsing: "Aor Pass Ind 2 Sg — φοβέομαι", gloss: "you were afraid" },
        ],
          translation: "If you (s.) had believed, you would not have been afraid.",
          note: "Second class: contrary to fact — past indicative in both halves, ἄν in the main clause.",
        },
        { words: [
          { w: "ἐὰν", parsing: "Conjunction (+ subjunctive)", syntax: "Conditional Clause (Third Class)", gloss: "if" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "κύριος", parsing: "Nom Sg Masc — κύριος", syntax: "Subject", gloss: "Lord" },
          { w: "ἔλθῃ,", parsing: "2nd Aor Act Subj 3 Sg — ἔρχομαι", gloss: "comes" },
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "πιστοὶ", parsing: "Nom Pl Masc — πιστός", syntax: "Subject", gloss: "faithful" },
          { w: "σωθήσονται.", parsing: "Fut Pass Ind 3 Pl — σῴζω", gloss: "will be saved" },
        ],
          translation: "If the Lord comes, the faithful will be saved.",
          note: "Third class: future condition — ἐάν + subjunctive.",
        },
      ]}
    />

    <HomeworkAssignments chapter="conditionals" />

    <LiveExamples
      intro={<Tr id="conditionals.intro.hunt-classes-wild">Hunt the classes in the wild — check each protasis's mood as you go.</Tr>}
      links={[
        { label: <Tr id="conditionals.le.every-sort-class">Every <span className="normal-case">εἰ</span> — sort the 1st from the 2nd class as you read</Tr>, lemma: 'εἰ' },
        { label: <Tr id="conditionals.le.every-class-territory">Every <span className="normal-case">ἐάν</span> — 3rd-class territory; watch for ἐὰν μή "unless"</Tr>, lemma: 'ἐάν' },
        { label: <Tr id="conditionals.le.every-untranslatable-mood">Every <span className="normal-case">ἄν</span> — the untranslatable mood-particle at work</Tr>, lemma: 'ἄν' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
  </>
)
