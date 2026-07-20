/* ─────────────────────────────────────────────
   Chapter: Conditionals

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences,
} from '../shared'

export const CONJUNCTIONS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: three flavours of "if"</SectionHeading>
      <P>
        Compare three English sentences. "If it's raining, the game is off" — you're reasoning from a
        supposition. "If you had studied, you would have passed" — you didn't, and both of you know it.
        "If you ask her, she'll help" — an open possibility, still in the future. One little word "if,"
        three different relationships to reality, and English signals the difference entirely through
        helper verbs (<em>had… would have…; will</em>).
      </P>
      <P>
        Greek builds the same three flavours with hardware you already own: the choice
        of "if"-word (<Gk>εἰ</Gk> or <Gk>ἐάν</Gk>), the <Term t="mood">mood</Term> of the verb, and the
        little particle <Gk>ἄν</Gk>. Grammarians number the flavours: <strong>first class</strong> (assumed
        true), <strong>second class</strong> (contrary to fact), <strong>third class</strong> (open /
        future). Two names to keep: the "if" clause is the <strong>protasis</strong>; the "then" clause is
        the <strong>apodosis</strong>.
      </P>
    </LevelOnly>

    {/* ── 2 · The map ────────────────────────────────────── */}
    <SectionHeading>The map: three classes</SectionHeading>
    <TableAside
      beginning={<>
        <p>A conditional has an "if" clause (protasis) and a "then" clause (apodosis). Count the words to classify it: <Gk>εἰ</Gk> = One Word (1st) · <Gk>εἰ … ἄν</Gk> = Two Words (2nd) · <Gk>ἐάν</Gk> = Three Letters (3rd).</p>
        <Ex grc="εἰ υἱὸς εἶ τοῦ θεοῦ…" en="if you are the Son of God… (1st class)" />
      </>}
      intermediate={<>
        <p>Classify by the <em>protasis</em>. The class shows the speaker's rhetorical stance, not objective fact — a 1st-class condition can frame something known to be false. A <strong>"would"</strong> in English (and <Gk>ἄν</Gk> in Greek) flags the contrary-to-fact 2nd class.</p>
      </>}
    >
      <MorphTable flush title="Conditional Sentences" headers={['Class','Protasis','Apodosis']}
        rows={[
          ['First Class (Assumed True)','εἰ + Indicative','Any mood or tense'],
          ['Second Class (Contrary to Fact)','εἰ + Indicative','ἄν + Indicative'],
          ['Third Class (Probable / Future)','ἐάν + Subjunctive','Any mood or tense'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Class by class ─────────────────────────────── */}
    <SectionHeading>First class: assumed true — for the argument</SectionHeading>
    <P>
      <Gk>εἰ</Gk> + indicative assumes the "if" for the sake of what follows: <em>if</em> this holds,
      <em> then</em> that follows. Crucially, the grammar says nothing about whether it actually holds.
      "If you like patterns, you'll like Greek" tells you nothing about whether you do — only what follows
      if you do.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="εἰ δὲ ὑμεῖς Χριστοῦ, ἄρα τοῦ Ἀβραὰμ σπέρμα ἐστέ" en="if you are Christ's, then you are Abraham's offspring (Gal 3:29)" />
      </>}
      intermediate={<>
        <p>Since the assumption is rhetorical, a 1st-class protasis can be something the speaker affirms (Gal 3:29), doubts, or even mocks — the taunt <Gk>εἰ σὺ εἶ ὁ βασιλεὺς τῶν Ἰουδαίων, σῶσον σεαυτόν</Gk> (Luke 23:37) is 1st class. So never auto-translate <Gk>εἰ</Gk> as "since."</p>
      </>}
    >
      <MorphTable flush title="First class anatomy" headers={['Piece', 'Form', 'Note']} firstColIsData
        rows={[
          ['Protasis', 'εἰ + indicative', 'assumed true for the argument'],
          ['Apodosis', 'anything', 'statement, command, question…'],
        ]}
      />
    </TableAside>

    <SectionHeading>Second class: contrary to fact</SectionHeading>
    <P>
      Still <Gk>εἰ</Gk> + indicative (past tenses), but now the apodosis carries <Gk>ἄν</Gk> — and the
      speaker signals that the "if" is <em>not</em> the case: "if you had liked Greek, you would have
      learnt it" (you didn't, alas). English's tell is "would"; Greek's is that little <Gk>ἄν</Gk>.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="εἰ γὰρ ἐπιστεύετε Μωϋσεῖ, ἐπιστεύετε ἂν ἐμοί" en="if you believed Moses, you would believe me (John 5:46)" />
        <p>Implication: they don't believe Moses — and so don't believe Jesus.</p>
      </>}
      intermediate={<>
        <p>Tense refines the counterfactual: imperfects for present-time ("if you believed [now]…"), aorists for past-time ("if they had known, they would not have crucified the Lord of glory," 1 Cor 2:8). Martha's <Gk>εἰ ἦς ὧδε</Gk> (John 11:21) wraps grief in grammar: "if you had been here…"</p>
      </>}
    >
      <MorphTable flush title="Second class anatomy" headers={['Piece', 'Form', 'Note']} firstColIsData
        rows={[
          ['Protasis', 'εἰ + past indicative', 'assumed false'],
          ['Apodosis', 'ἄν + past indicative', 'the “would (have)” clause'],
        ]}
      />
    </TableAside>

    <SectionHeading>Third class: open — maybe, or whenever</SectionHeading>
    <P>
      <Gk>ἐάν</Gk> + <Term t="subjunctive">subjunctive</Term> leaves the condition genuinely open — a
      future prospect ("if you ask…"), or a general truth about whoever-it-applies-to ("if anyone loves
      the world…"). The subjunctive is exactly the right mood: the maybe-mood for the maybe-clause.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἐὰν μόνον ἅψωμαι τοῦ ἱματίου αὐτοῦ, σωθήσομαι" en="if only I touch his cloak, I will be saved (Matt 9:21)" />
        <Ex grc="ἐάν τι αἰτήσητε ἐν τῷ ὀνόματί μου…" en="if you ask anything in my name… (John 14:14)" />
      </>}
      intermediate={<>
        <p>The "general" 3rd class states a standing rule: <Gk>ἐάν τις ἀγαπᾷ τὸν κόσμον, οὐκ ἔστιν ἡ ἀγάπη τοῦ πατρὸς ἐν αὐτῷ</Gk> (1 John 2:15) — timeless, not predictive. Context separates "future particular" from "present general."</p>
      </>}
    >
      <MorphTable flush title="Third class anatomy" headers={['Piece', 'Form', 'Note']} firstColIsData
        rows={[
          ['Protasis', 'ἐάν + subjunctive', 'open: future or general'],
          ['Apodosis', 'anything', 'often future indicative'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>First class ≠ "since." The devil's <Gk>εἰ υἱὸς εἶ τοῦ θεοῦ</Gk> (Matt 4:3) assumes it for the argument's sake — translating "since you are" flattens the taunt.</li>
        <li><Gk>ἐὰν μή</Gk> = "unless" (<Gk>ἐὰν μή τις γεννηθῇ ἄνωθεν</Gk>, "unless one is born again," John 3:3).</li>
        <li><Gk>εἰ</Gk> vs. <Gk>εἶ</Gk>: unaccented-looking <Gk>εἰ</Gk> "if" vs. circumflexed <Gk>εἶ</Gk> "you are" — they even co-star in the same clause (<Gk>εἰ σὺ εἶ…</Gk> "if you are…").</li>
        <li><Gk>ἄν</Gk> is untranslatable alone — it colours the clause ("would," "-ever"). Spot it, don't gloss it.</li>
        <li><Gk>κἄν</Gk> = <Gk>καὶ ἐάν</Gk>, "even if."</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — classify and translate"
      intro={<>Name the class first (count the words!), then translate.</>}
      items={[
        { q: <span className="normal-case">εἰ φιλεῖς τὸν θεόν, σοφὸς εἶ.</span>,
          a: <>1st class — "If you love God, you are wise." Assumed true for the argument.</> },
        { q: <span className="normal-case">εἰ ἤκουσεν, οὐκ ἂν ἀπέθανεν.</span>,
          a: <>2nd class (the ἄν!) — "If he had listened, he would not have died." He didn't listen.</> },
        { q: <span className="normal-case">ἐὰν ὁ βασιλεὺς ἐξέλθῃ, οἱ δοῦλοι ἀπολυθήσονται.</span>,
          a: <>3rd class — "If the king goes out, the slaves will be released." Open future.</> },
        { q: <span className="normal-case">ἐὰν εἴπωμεν ὅτι ἁμαρτίαν οὐκ ἔχομεν, ἑαυτοὺς πλανῶμεν.</span>,
          a: <>3rd class, general — "If we say we have no sin, we deceive ourselves" (1 John 1:8): a standing truth about whoever says it.</> },
        { q: <span className="normal-case">εἰ τὸ εὐαγγέλιον κηρύσσεται, χαίρετε.</span>,
          a: <>1st class with an imperative apodosis — "If the gospel is being preached, rejoice!"</> },
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences
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

    <LiveExamples
      intro={<>Hunt the classes in the wild — check each protasis's mood as you go.</>}
      links={[
        { label: <>Every <span className="normal-case">εἰ</span> — sort the 1st from the 2nd class as you read</>, lemma: 'εἰ' },
        { label: <>Every <span className="normal-case">ἐάν</span> — 3rd-class territory; watch for ἐὰν μή "unless"</>, lemma: 'ἐάν' },
        { label: <>Every <span className="normal-case">ἄν</span> — the untranslatable mood-particle at work</>, lemma: 'ἄν' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: conditions as rhetoric</SectionHeading>
      <P>
        <strong>The 1st class as a lever.</strong> Because it assumes rather than asserts, the 1st class is
        a rhetorical instrument. Paul uses it to argue from shared ground (Gal 3:29); Satan uses it to
        needle (<Gk>εἰ υἱὸς εἶ τοῦ θεοῦ</Gk>, Matt 4:3 — "granting, for the moment, that you are…"); Jesus
        turns it back on accusers (<Gk>εἰ δὲ ἐγὼ ἐν Βεελζεβοὺλ ἐκβάλλω τὰ δαιμόνια…</Gk>, Luke 11:19).
        Ask <em>why</em> a speaker assumes the protasis, and exegesis begins.
      </P>
      <P>
        <strong>The missing classes.</strong> Grammars also list a 4th class — <Gk>εἰ</Gk> + optative, the
        "remote possibility" — which survives only in fragments in the NT (<Gk>εἰ καὶ πάσχοιτε</Gk>, "even
        if you should suffer," 1 Pet 3:14), as the optative mood was dying in Koine. Where you meet a bare
        optative wish instead, it is usually the fossil <Gk>μὴ γένοιτο</Gk>, "may it never be!" — Paul's
        recoil in Romans.
      </P>
      <P>
        <strong>Conditions without εἰ.</strong> Greek can smuggle conditions into other clothing: the
        conditional participle (<Gk>θερίσομεν μὴ ἐκλυόμενοι</Gk>, "we will reap, <em>if we do not give
        up</em>," Gal 6:9) and the conditional imperative (John 2:19). When a "then" seems to follow from a
        phrase that isn't an "if," suspect a hidden protasis.
      </P>
    </LevelOnly>
  </>
)
