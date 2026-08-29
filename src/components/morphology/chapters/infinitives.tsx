/* ─────────────────────────────────────────────
   Chapter: Infinitives

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'

export const INFINITIVES_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="infinitives.h.start-english-form">Start with English: the "to …" form</SectionHeading>
      <P id="infinitives.p.want-eat-she">
        "I want <em>to eat</em>." "She hopes <em>to win</em>." "<em>To err</em> is human." The
        <strong> infinitive</strong> — English marks it with "to" — is the verb's all-purpose form: no
        subject, no person, no number. It names the action itself.
      </P>
      <P id="infinitives.p.notice-something-about">
        Notice something about "<em>To err</em> is human": the infinitive is working as a <em>noun</em> —
        it is the subject of "is." That double life is the key to the Greek infinitive: it is a
        <strong> verbal noun</strong>. Verb enough to have <Term t="tense">tense</Term> and
        {' '}<Term t="voice">voice</Term> and take objects ("to eat <em>bread</em>"); noun enough to serve as a
        subject, take the article <Gk>τό</Gk>, and even follow prepositions. Greek exploits the noun side
        far more than English does — and that is where the interesting constructions live.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading id="infinitives.h.forms-two-endings">The forms: two endings cover most of it</SectionHeading>
    <TableAside
      beginning={<>
        <p><Tr id="infinitives.as.infinitive-form-person">The infinitive is the "to ‒" form. It has no person or number, so it never changes for "I / you / he."</Tr></p>
        <Ex grc="θέλω λύειν" en={<Tr id="infinitives.ex.want-loose">I want to loose</Tr>} />
        <Ex grc="λύσαι" en={<Tr id="infinitives.ex.loose-aorist-augment">to loose (aorist — σ, but no augment)</Tr>} />
      </>}
    >
      <MorphTable id="infinitives.t1" flush title="Most Common Infinitive Forms — λύω" headers={['','Present Active','Aorist Active']}
        rows={[['Infinitive','λύειν','λύσαι']]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P id="infinitives.p.always-outside-indicative">
        As always outside the indicative: the aorist infinitive has the <Gk>σ</Gk> but <strong>no
        augment</strong>, and its "tense" is aspect — <Gk>λύειν</Gk> pictures ongoing loosing,
        <Gk> λῦσαι</Gk> the act as a whole. Middle/passive forms end in <Gk>‑εσθαι</Gk> (present m/p:
        <Gk> λύεσθαι</Gk>) and <Gk>‑θῆναι</Gk> (aorist passive: <Gk>λυθῆναι</Gk>) — recognize them; don't
        agonize over producing them.
      </P>
    </LevelOnly>

    {/* ── 3 · The helper-verb pattern ────────────────────── */}
    <DropdownPractice id="infinitives.d1"
      title="Practice — identify the infinitive"
      options={["Present active — \"to loose\"", "Aorist active — \"to loose (simply)\"", "Present middle/passive", "Aorist passive — \"to be loosed\"", "Present (deponent) — \"to come\"", "Aorist (2nd) — \"to come\""]}
      items={[
        { q: <span className="normal-case">λύειν</span>, answer: "Present active — \"to loose\"" },
        { q: <span className="normal-case">λῦσαι</span>, answer: "Aorist active — \"to loose (simply)\"" },
        { q: <span className="normal-case">λύεσθαι</span>, answer: "Present middle/passive" },
        { q: <span className="normal-case">λυθῆναι</span>, answer: "Aorist passive — \"to be loosed\"" },
        { q: <span className="normal-case">ἔρχεσθαι</span>, answer: "Present (deponent) — \"to come\"" },
        { q: <span className="normal-case">ἐλθεῖν</span>, answer: "Aorist (2nd) — \"to come\"" },
      ]}
    />

    <SectionHeading id="infinitives.h.where-you'll-meet">Where you'll meet it first: after helper verbs</SectionHeading>
    <LevelOnly level="beginning">
      <P id="infinitives.p.exactly-english-set">
        Exactly as in English, a set of "helper" verbs is incomplete without an infinitive:
        "I <em>am able</em>… (to do what?)". Learn these pairs as a unit:
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="infinitives.al.sentences">In sentences</Tr></AsideLabel>
        <Ex grc="οὐ δύνασθε θεῷ δουλεύειν καὶ μαμωνᾷ" en={<Tr id="infinitives.ex.cannot-serve-god">you cannot serve God and mammon (Matt 6:24)</Tr>} />
        <Ex grc="μέλλει ἔρχεσθαι" en={<Tr id="infinitives.ex.about-come">he is about to come</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="infinitives.as.deserves-special-note"><Gk>δεῖ</Gk> deserves special note: Greek has no word for "must," so "it is necessary to…" does the job — and in the Gospels <Gk>δεῖ</Gk> often carries the weight of divine necessity (<Gk>δεῖ τὸν υἱὸν τοῦ ἀνθρώπου πολλὰ παθεῖν</Gk>, Mark 8:31).</Tr></p>
      </>}
    >
      <MorphTable id="infinitives.t2" tCols={[1]} flush title="Helper verbs that take an infinitive" headers={['Verb', 'Meaning']} firstColIsData
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
    <SectionHeading id="infinitives.h.who-does-infinitive's">Who does the infinitive's action? The accusative subject</SectionHeading>
    <P id="infinitives.p.she-wanted-learn">
      "She wanted <em>to learn</em>" — she does the learning. "She wanted <em>me</em> to learn" — now
      someone else does it, and English drops that someone in as "me." Greek does precisely the same, and
      the someone goes in the <Term t="accusative">accusative</Term>: <Gk>θέλω τὸν ἄγγελον ἀπελθεῖν</Gk>,
      "I want the messenger to depart" — literally "I want <em>the messenger</em> [acc.] <em>to
      depart</em>."
    </P>
    <TableAside
      beginning={<>
        <Ex grc="δεῖ τὸν υἱὸν τοῦ ἀνθρώπου πολλὰ παθεῖν" en={<Tr id="infinitives.ex.son-man-must">the Son of Man must suffer many things (Mark 8:31)</Tr>} />
        <p><Tr id="infinitives.as.literally-necessary-son">Literally: "it is necessary <em>the Son of Man</em> [acc.] <em>to suffer</em> many things."</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="infinitives.as.when-two-accusatives">When two accusatives flank an equative infinitive, the same pecking order as predicate nominatives applies: the pronoun / proper name / articular noun is the subject (<Gk>ἔλεγον αὐτὸν εἶναι θεόν</Gk>, "they said <em>he</em> was a god," Acts 28:6).</Tr></p>
      </>}
    >
      <MorphTable id="infinitives.t3" tCols={[1, 2]} flush title="The pattern" headers={['Piece', 'Case', 'Job']} firstColIsData
        rows={[
          ['θέλω / δεῖ / λέγω …', '— (finite verb)', 'the frame'],
          ['τὸν ἄγγελον', 'accusative', 'subject of the infinitive'],
          ['ἀπελθεῖν', '— (infinitive)', 'the action'],
        ]}
      />
    </TableAside>

    {/* ── 5 · Articular infinitives ──────────────────────── */}
    <ClassSentences id="infinitives.cs1"
      lesson="The accusative subject"
      items={[
        { words: [
          { w: "δεῖ", parsing: "Pres Act Ind 3 Sg — δεῖ (impersonal)", gloss: "it is necessary" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "υἱὸν", parsing: "Acc Sg Masc — υἱός", syntax: "Accusative Subject of Infinitive", gloss: "Son" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of" },
          { w: "ἀνθρώπου", parsing: "Gen Sg Masc — ἄνθρωπος", syntax: "Genitive of Relationship", gloss: "Man" },
          { w: "πολλὰ", parsing: "Acc Pl Neut — πολύς", syntax: "Direct Object", gloss: "many things" },
          { w: "παθεῖν.", parsing: "2nd Aor Act Infinitive — πάσχω", syntax: "Complementary Infinitive", gloss: "to suffer" },
        ],
          translation: "The Son of Man must suffer many things.",
          note: "Mark 8:31 — τὸν υἱόν is accusative because it is the SUBJECT of the infinitive.",
        },
      ]}
    />

    <SectionHeading id="infinitives.h.article-infinitive-greek's">The article + infinitive: Greek's Swiss-army clause</SectionHeading>
    <P id="infinitives.p.because-infinitive-noun">
      Because the infinitive is a noun, it can take the neuter article — <Gk>τὸ λύειν</Gk>, "the (act of)
      loosing" — and once it has an article, it can follow a <Term t="preposition">preposition</Term>. That
      combination builds compact clauses English needs whole phrases for:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="infinitives.al.sentences-2">In sentences</Tr></AsideLabel>
        <Ex grc="ἐν τῷ σπείρειν" en={<Tr id="infinitives.ex.while-was-sowing">while he was sowing (Mark 4:4)</Tr>} />
        <Ex grc="μετὰ τὸ ἐγερθῆναί με" en={<Tr id="infinitives.ex.after-raised-matt">after I am raised (Matt 26:32)</Tr>} />
        <Ex grc="διὰ τὸ μὴ ἔχειν ῥίζαν" en={<Tr id="infinitives.ex.because-had-root">because it had no root (Mark 4:6)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="infinitives.as.method-translate-preposition">Method: translate the preposition, turn the infinitive into a finite verb, and make any
        accusative its subject — <Gk>μετὰ τὸ ἐγερθῆναί με</Gk> = "after the [event of] me being raised" →
        "after I am raised."</Tr></p>
      </>}
    >
      <MorphTable id="infinitives.t4" tCols={[1]} flush title="Preposition + articular infinitive" headers={['Pattern', 'Meaning']} firstColIsData
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
    <DropdownPractice id="infinitives.d2"
      title="Practice — article + infinitive"
      intro={<Tr id="infinitives.intro.preposition-chooses-meaning">The preposition chooses the meaning.</Tr>}
      options={["\"while …-ing\"", "\"because … / on account of …-ing\"", "\"in order to …\"", "\"after …-ing\""]}
      items={[
        { q: <span className="normal-case">ἐν τῷ λαλεῖν</span>, answer: "\"while …-ing\"" },
        { q: <span className="normal-case">διὰ τὸ ἔχειν</span>, answer: "\"because … / on account of …-ing\"" },
        { q: <span className="normal-case">εἰς τὸ σῶσαι</span>, answer: "\"in order to …\"" },
        { q: <span className="normal-case">μετὰ τὸ ἐλθεῖν</span>, answer: "\"after …-ing\"" },
      ]}
    />

    <SectionHeading id="infinitives.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="infinitives.wo.aorist-active-infinitive">Aorist active infinitive <Gk>λῦσαι</Gk> vs. aorist middle imperative <Gk>λῦσαι</Gk> — identical spelling; the sentence frame decides.</Tr></li>
        <li><Tr id="infinitives.wo.augment-never">No augment: <Gk>λῦσαι</Gk>, never <Gk>ἐλῦσαι</Gk>.</Tr></li>
        <li><Tr id="infinitives.wo.negative-having">Negative is <Gk>μή</Gk>, not <Gk>οὐ</Gk>: <Gk>τὸ μὴ ἔχειν</Gk>, "not having."</Tr></li>
        <li><Tr id="infinitives.wo.verbs-contract-normally">-εω verbs contract normally: <Gk>φιλεῖν</Gk> "to love," <Gk>ποιῆσαι</Gk> "to do."</Tr></li>
        <li><Tr id="infinitives.wo.when-translating-trade">When translating <Gk>δεῖ</Gk>, trade "it is necessary that X…" for plain English "X must…".</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning">
    <SectionHeading id="infinitives.h.try">Try it</SectionHeading>
    <Practice id="infinitives.pr1"
      title="Practice — translate"
      intro={<Tr id="infinitives.intro.vocabulary-eat-pray">Vocabulary: <span className="normal-case">ἐσθίω / φαγεῖν</span> "eat" · <span className="normal-case">προσεύχομαι</span> "pray" · <span className="normal-case">βαπτισθῆναι</span> "to be baptized."</Tr>}
      items={[
        { q: <span className="normal-case">θέλομεν τὸν λόγον ἀκούειν.</span>,
          a: <Tr id="infinitives.pa.want-hear-word">"We want to hear the word" — complementary infinitive after θέλω.</Tr>},
        { q: <span className="normal-case">δεῖ ἡμᾶς προσεύχεσθαι.</span>,
          a: <Tr id="infinitives.pa.must-pray-literally">"We must pray" — literally "it is necessary [for] us [acc.] to pray."</Tr>},
        { q: <span className="normal-case">μετὰ τὸ φαγεῖν, ἐξῆλθον.</span>,
          a: <Tr id="infinitives.pa.after-eating-went">"After eating, they went out" — μετὰ τό + aorist infinitive.</Tr>},
        { q: <span className="normal-case">ἐν τῷ λέγειν αὐτόν, ἐθαύμαζον.</span>,
          a: <Tr id="infinitives.pa.while-was-speaking">"While he was speaking, they were amazed" — ἐν τῷ + infinitive with accusative subject αὐτόν.</Tr>},
        { q: <span className="normal-case">ἦλθεν βαπτισθῆναι.</span>,
          a: <Tr id="infinitives.pa.came-baptized-bare">"He came to be baptized" — bare infinitive of purpose after a verb of motion (cf. Matt 3:13).</Tr>},
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="infinitives.cs2"
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

    </LevelOnly>
    <HomeworkAssignments chapter="infinitives" />

    <LiveExamples
      intro={<Tr id="infinitives.intro.watch-patterns-helper">Watch the patterns — helper + infinitive, preposition + articular infinitive — repeat page after page.</Tr>}
      links={[
        { label: <Tr id="infinitives.le.infinitive">Every infinitive in the NT</Tr>, features: ['verb', 'infinitive'] },
        { label: <Tr id="infinitives.le.aorist-infinitives-whole">Aorist infinitives — whole-action "to …"</Tr>, features: ['verb', 'infinitive', 'aorist'] },
        { label: <Tr id="infinitives.le.every-form-nt's">Every form of <span className="normal-case">δεῖ</span> — the NT's "must"</Tr>, lemma: 'δεῖ' },
        { label: <Tr id="infinitives.le.every-form-able">Every form of <span className="normal-case">δύναμαι</span> — "able to…" + infinitive</Tr>, lemma: 'δύναμαι' },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
  </>
)
