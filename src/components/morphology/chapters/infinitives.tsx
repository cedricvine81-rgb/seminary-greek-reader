/* ─────────────────────────────────────────────
   Chapter: Infinitives

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences,
} from '../shared'

export const INFINITIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: the "to …" form</SectionHeading>
      <P>
        "I want <em>to eat</em>." "She hopes <em>to win</em>." "<em>To err</em> is human." The
        <strong> infinitive</strong> — English marks it with "to" — is the verb's all-purpose form: no
        subject, no person, no number. It names the action itself.
      </P>
      <P>
        Notice something about "<em>To err</em> is human": the infinitive is working as a <em>noun</em> —
        it is the subject of "is." That double life is the key to the Greek infinitive: it is a
        <strong> verbal noun</strong>. Verb enough to have <Term t="tense">tense</Term> and
        {' '}<Term t="voice">voice</Term> and take objects ("to eat <em>bread</em>"); noun enough to serve as a
        subject, take the article <Gk>τό</Gk>, and even follow prepositions. Greek exploits the noun side
        far more than English does — and that is where the interesting constructions live.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading>The forms: two endings cover most of it</SectionHeading>
    <TableAside
      beginning={<>
        <p>The infinitive is the "to ‒" form. It has no person or number, so it never changes for "I / you / he."</p>
        <Ex grc="θέλω λύειν" en="I want to loose" />
        <Ex grc="λύσαι" en="to loose (aorist — σ, but no augment)" />
      </>}
      intermediate={<>
        <p>It's a <strong>verbal noun</strong>: it can take an article (<Gk>τό</Gk>) and even an accusative subject (<Gk>θέλω τὸν ἄγγελον ἀπελθεῖν</Gk> "I want the messenger to depart"). Present vs. aorist = aspect, not time.</p>
      </>}
    >
      <MorphTable flush title={gt("Most Common Infinitive Forms — λύω")} headers={['','Present Active','Aorist Active']}
        rows={[['Infinitive','λύειν','λύσαι']]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P>
        As always outside the indicative: the aorist infinitive has the <Gk>σ</Gk> but <strong>no
        augment</strong>, and its "tense" is aspect — <Gk>λύειν</Gk> pictures ongoing loosing,
        <Gk> λῦσαι</Gk> the act as a whole. Middle/passive forms end in <Gk>‑εσθαι</Gk> (present m/p:
        <Gk> λύεσθαι</Gk>) and <Gk>‑θῆναι</Gk> (aorist passive: <Gk>λυθῆναι</Gk>) — recognize them; don't
        agonize over producing them.
      </P>
    </LevelOnly>

    {/* ── 3 · The helper-verb pattern ────────────────────── */}
    <SectionHeading>Where you'll meet it first: after helper verbs</SectionHeading>
    <P>
      Exactly as in English, a set of "helper" verbs is incomplete without an infinitive:
      "I <em>am able</em>… (to do what?)". Learn these pairs as a unit:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>In sentences</AsideLabel>
        <Ex grc="οὐ δύνασθε θεῷ δουλεύειν καὶ μαμωνᾷ" en="you cannot serve God and mammon (Matt 6:24)" />
        <Ex grc="μέλλει ἔρχεσθαι" en="he is about to come" />
      </>}
      intermediate={<>
        <p><Gk>δεῖ</Gk> deserves special note: Greek has no word for "must," so "it is necessary to…" does the job — and in the Gospels <Gk>δεῖ</Gk> often carries the weight of divine necessity (<Gk>δεῖ τὸν υἱὸν τοῦ ἀνθρώπου πολλὰ παθεῖν</Gk>, Mark 8:31).</p>
      </>}
    >
      <MorphTable flush title="Helper verbs that take an infinitive" headers={['Verb', 'Meaning']} firstColIsData
        rows={[
          ['δύναμαι', 'I am able (to)'],
          ['θέλω', 'I wish / want (to)'],
          ['μέλλω', 'I am about (to)'],
          ['ἄρχομαι', 'I begin (to)'],
          ['ὀφείλω', 'I ought (to)'],
          ['δεῖ', 'it is necessary (to) — “must”'],
          ['ἔξεστιν', 'it is lawful / permitted (to)'],
        ]}
      />
    </TableAside>

    {/* ── 4 · The accusative subject ─────────────────────── */}
    <SectionHeading>Who does the infinitive's action? The accusative subject</SectionHeading>
    <P>
      "She wanted <em>to learn</em>" — she does the learning. "She wanted <em>me</em> to learn" — now
      someone else does it, and English drops that someone in as "me." Greek does precisely the same, and
      the someone goes in the <Term t="accusative">accusative</Term>: <Gk>θέλω τὸν ἄγγελον ἀπελθεῖν</Gk>,
      "I want the messenger to depart" — literally "I want <em>the messenger</em> [acc.] <em>to
      depart</em>."
    </P>
    <TableAside
      beginning={<>
        <Ex grc="δεῖ τὸν υἱὸν τοῦ ἀνθρώπου πολλὰ παθεῖν" en="the Son of Man must suffer many things (Mark 8:31)" />
        <p>Literally: "it is necessary <em>the Son of Man</em> [acc.] <em>to suffer</em> many things."</p>
      </>}
      intermediate={<>
        <p>When two accusatives flank an equative infinitive, the same pecking order as predicate nominatives applies: the pronoun / proper name / articular noun is the subject (<Gk>ἔλεγον αὐτὸν εἶναι θεόν</Gk>, "they said <em>he</em> was a god," Acts 28:6).</p>
      </>}
    >
      <MorphTable flush title="The pattern" headers={['Piece', 'Case', 'Job']} firstColIsData
        rows={[
          ['θέλω / δεῖ / λέγω …', '— (finite verb)', 'the frame'],
          ['τὸν ἄγγελον', 'accusative', 'subject of the infinitive'],
          ['ἀπελθεῖν', '— (infinitive)', 'the action'],
        ]}
      />
    </TableAside>

    {/* ── 5 · Articular infinitives ──────────────────────── */}
    <SectionHeading>The article + infinitive: Greek's Swiss-army clause</SectionHeading>
    <P>
      Because the infinitive is a noun, it can take the neuter article — <Gk>τὸ λύειν</Gk>, "the (act of)
      loosing" — and once it has an article, it can follow a <Term t="preposition">preposition</Term>. That
      combination builds compact clauses English needs whole phrases for:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>In sentences</AsideLabel>
        <Ex grc="ἐν τῷ σπείρειν" en="while he was sowing (Mark 4:4)" />
        <Ex grc="μετὰ τὸ ἐγερθῆναί με" en="after I am raised (Matt 26:32)" />
        <Ex grc="διὰ τὸ μὴ ἔχειν ῥίζαν" en="because it had no root (Mark 4:6)" />
      </>}
      intermediate={<>
        <p>Method: translate the preposition, turn the infinitive into a finite verb, and make any
        accusative its subject — <Gk>μετὰ τὸ ἐγερθῆναί με</Gk> = "after the [event of] me being raised" →
        "after I am raised."</p>
      </>}
    >
      <MorphTable flush title="Preposition + articular infinitive" headers={['Pattern', 'Meaning']} firstColIsData
        rows={[
          ['ἐν τῷ + inf.', 'while / as …'],
          ['μετὰ τό + inf.', 'after …'],
          ['πρὸ τοῦ + inf.', 'before …'],
          ['διὰ τό + inf.', 'because …'],
          ['εἰς τό / πρὸς τό + inf.', 'in order to … (purpose)'],
          ['ὥστε + inf.', 'so that … (result)'],
        ]}
      />
    </TableAside>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>Aorist active infinitive <Gk>λῦσαι</Gk> vs. aorist middle imperative <Gk>λῦσαι</Gk> — identical spelling; the sentence frame decides.</li>
        <li>No augment: <Gk>λῦσαι</Gk>, never <Gk>ἐλῦσαι</Gk>.</li>
        <li>Negative is <Gk>μή</Gk>, not <Gk>οὐ</Gk>: <Gk>τὸ μὴ ἔχειν</Gk>, "not having."</li>
        <li>-εω verbs contract normally: <Gk>φιλεῖν</Gk> "to love," <Gk>ποιῆσαι</Gk> "to do."</li>
        <li>When translating <Gk>δεῖ</Gk>, trade "it is necessary that X…" for plain English "X must…".</li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — translate"
      intro={<>Vocabulary: <span className="normal-case">ἐσθίω / φαγεῖν</span> "eat" · <span className="normal-case">προσεύχομαι</span> "pray" · <span className="normal-case">βαπτισθῆναι</span> "to be baptized."</>}
      items={[
        { q: <span className="normal-case">θέλομεν τὸν λόγον ἀκούειν.</span>,
          a: <>"We want to hear the word" — complementary infinitive after θέλω.</> },
        { q: <span className="normal-case">δεῖ ἡμᾶς προσεύχεσθαι.</span>,
          a: <>"We must pray" — literally "it is necessary [for] us [acc.] to pray."</> },
        { q: <span className="normal-case">μετὰ τὸ φαγεῖν, ἐξῆλθον.</span>,
          a: <>"After eating, they went out" — μετὰ τό + aorist infinitive.</> },
        { q: <span className="normal-case">ἐν τῷ λέγειν αὐτόν, ἐθαύμαζον.</span>,
          a: <>"While he was speaking, they were amazed" — ἐν τῷ + infinitive with accusative subject αὐτόν.</> },
        { q: <span className="normal-case">ἦλθεν βαπτισθῆναι.</span>,
          a: <>"He came to be baptized" — bare infinitive of purpose after a verb of motion (cf. Matt 3:13).</> },
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <ClassSentences
      lesson="Lessons 5 & 8 · The infinitive"
      items={[
        { words: [
          { w: "θέλεις", parsing: "Pres Act Ind 2 Sg — θέλω", gloss: "do you wish" },
          { w: "ἀκοῦσαι;", parsing: "Aor Act Infinitive — ἀκούω", syntax: "Complementary Infinitive", gloss: "to hear" },
        ],
          translation: "Do you (s.) wish to hear?",
        },
        { words: [
          { w: "δεῖ", parsing: "Pres Act Ind 3 Sg — δεῖ (impersonal)", gloss: "it is necessary" },
          { w: "προσεύχεσθαι.", parsing: "Pres Mid Infinitive — προσεύχομαι", syntax: "Subject Infinitive", gloss: "to pray" },
        ],
          translation: "It is necessary to pray.",
          note: "With impersonal δεῖ the infinitive is the grammatical subject.",
        },
        { words: [
          { w: "ἐμέλλετε", parsing: "Impf Act Ind 2 Pl — μέλλω", gloss: "you were about" },
          { w: "ἔρχεσθαι.", parsing: "Pres Mid Infinitive — ἔρχομαι", syntax: "Complementary Infinitive", gloss: "to come" },
        ],
          translation: "You (pl.) were about to come.",
        },
        { words: [
          { w: "δεῖ", parsing: "Pres Act Ind 3 Sg — δεῖ (impersonal)", gloss: "it is necessary" },
          { w: "τηρεῖν", parsing: "Pres Act Infinitive — τηρέω", syntax: "Subject Infinitive", gloss: "to keep" },
          { w: "τὰς", parsing: "Article — Acc Pl Fem", gloss: "the" },
          { w: "ἐντολάς.", parsing: "Acc Pl Fem — ἐντολή", syntax: "Direct Object", gloss: "commandments" },
        ],
          translation: "It is necessary to keep the commandments.",
        },
      ]}
    />

    <LiveExamples
      intro={<>Watch the patterns — helper + infinitive, preposition + articular infinitive — repeat page after page.</>}
      links={[
        { label: 'Every infinitive in the NT', features: ['verb', 'infinitive'] },
        { label: 'Aorist infinitives — whole-action "to …"', features: ['verb', 'infinitive', 'aorist'] },
        { label: <>Every form of <span className="normal-case">δεῖ</span> — the NT's "must"</>, lemma: 'δεῖ' },
        { label: <>Every form of <span className="normal-case">δύναμαι</span> — "able to…" + infinitive</>, lemma: 'δύναμαι' },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: the infinitive as theology's workhorse</SectionHeading>
      <P>
        <strong>Subject infinitives.</strong> With the article, an infinitive can anchor a whole
        proposition: <Gk>ἐμοὶ γὰρ τὸ ζῆν Χριστὸς καὶ τὸ ἀποθανεῖν κέρδος</Gk> — "for to me, <em>to
        live</em> is Christ and <em>to die</em> is gain" (Phil 1:21). Two articular infinitives are the
        subjects; the sentence's punch depends on seeing them as nouns.
      </P>
      <P>
        <strong>Indirect discourse.</strong> After verbs of saying and thinking, the infinitive can report
        speech: <Gk>λέγουσιν ἀνάστασιν μὴ εἶναι</Gk> — "they say there is no resurrection" (Mark 12:18,
        of the Sadducees). The accusative-plus-infinitive frame ("they say <em>resurrection not to
        be</em>") is the Greek machinery behind many an English "that"-clause.
      </P>
      <P>
        <strong>Purpose vs. result.</strong> <Gk>εἰς τό</Gk> + infinitive usually marks intention
        ("in order to"); <Gk>ὥστε</Gk> + infinitive usually marks outcome ("so that, with the result
        that"): <Gk>ὥστε τὸν ὄχλον θαυμάσαι</Gk>, "so that the crowd was amazed" (Matt 15:31). Where a
        text is ambiguous — did God <em>intend</em> or merely <em>allow</em> the outcome? — the choice
        between purpose and result is a genuinely theological call.
      </P>
    </LevelOnly>
  </>
)
