/* ─────────────────────────────────────────────
   Chapter: Subjunctives

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,
} from '../shared'
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'

// The subjunctive presets from Construct search, so the chapter and the search can't drift apart.
const SUBJUNCTIVE_USES = CONSTRUCT_PRESETS.find(g => g.heading === 'Uses of the subjunctive')!.presets

export const SUBJUNCTIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: the maybe-mood</SectionHeading>
      <P>
        Not everything we say is a statement of fact. "She <em>may</em> come." "<em>Let's</em> go."
        "What <em>should</em> we do?" "…so that he <em>might</em> learn." Each of these steps back from
        plain assertion into possibility, intention, or purpose. English marks that step with helper
        words — <em>may, might, should, let's</em>.
      </P>
      <P>
        Greek marks it with a <Term t="mood">mood</Term>: the <strong>subjunctive</strong>. And instead of
        adding helper words, Greek changes the verb <em>inside</em>, in the simplest way imaginable — it
        <strong> lengthens the connecting vowel</strong>. Where the indicative has <Gk>ο/ε</Gk>, the
        subjunctive has <Gk>ω/η</Gk>: indicative <Gk>λύομεν</Gk> "we loose" → subjunctive
        <Gk> λύωμεν</Gk> "let us loose / we may loose." One long vowel is the whole disguise.
      </P>
      <P>
        One more liberation: the subjunctive has <strong>no time</strong>. Even its aorist is not past —
        the tense difference is purely <Term t="aspect">aspect</Term> (ongoing vs. a single whole action),
        and there is never an augment.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading>The forms: one long vowel</SectionHeading>
    <TableAside
      beginning={<>
        <p>The subjunctive = "may / might / should." Its flag is the <strong>long vowel</strong> <Gk>ω/η</Gk> where the indicative had <Gk>ο/ε</Gk>.</p>
        <Ex grc="ἵνα λύῃ" en="in order that he may loose" />
      </>}
      intermediate={<>
        <p>The present subjunctive carries <em>imperfective</em> aspect (ongoing) — never past time. It usually follows a "flag word" like <Gk>ἵνα</Gk> or <Gk>ἐάν</Gk>.</p>
      </>}
    >
      <MorphTable flush title={gt("Present Subjunctive — λύω")} headers={['','Pers.','Active','Mid./Pass.']}
        rows={[
          ['SG','1','λύω','λύωμαι'],['','2','λύῃς','λύῃ'],['','3','λύῃ','λύηται'],
          ['PL','1','λύωμεν','λυώμεθα'],['','2','λύητε','λύησθε'],['','3','λύωσιν','λύωνται'],
        ]}
        note="I may (might) be loosing / I may be loosed"
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The aorist subjunctive views the action as a single whole — but it is <em>not</em> past (no augment).</p>
        <Ex grc="ἐὰν λύσῃ" en="if he looses" />
      </>}
      intermediate={<>
        <p>Aspect only: aorist = perfective (a whole action), present = ongoing.</p>
      </>}
    >
      <MorphTable flush title={gt("Aorist Subjunctive — λύω")} headers={['','Pers.','Active','Middle','Passive']}
        rows={[
          ['SG','1','λύσω','λύσωμαι','λυθῶ'],['','2','λύσῃς','λύσῃ','λυθῇς'],['','3','λύσῃ','λύσηται','λυθῇ'],
          ['PL','1','λύσωμεν','λυσώμεθα','λυθῶμεν'],['','2','λύσητε','λύσησθε','λυθῆτε'],['','3','λύσωσιν','λύσωνται','λυθῶσιν'],
        ]}
        note="I may (might) loose / I may be loosed"
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P>
        Note the family resemblance: the aorist subjunctive is just the aorist's <Gk>σ</Gk> + the same long
        vowels — <em>without</em> the augment (augments live only in the indicative). So
        <Gk> λύσωμεν</Gk> looks confusingly like the future <Gk>λύσομεν</Gk>: the long <Gk>ω</Gk> is the
        only difference, and it is enough.
      </P>
    </LevelOnly>

    {/* ── 3 · Flag words ─────────────────────────────────── */}
    <DropdownPractice
      title="Practice — indicative or subjunctive?"
      options={["Indicative — statement", "Subjunctive — the vowel went long"]}
      items={[
        { q: <span className="normal-case">λύομεν</span>, answer: "Indicative — statement" },
        { q: <span className="normal-case">λύωμεν</span>, answer: "Subjunctive — the vowel went long" },
        { q: <span className="normal-case">ἀκούετε</span>, answer: "Indicative — statement" },
        { q: <span className="normal-case">ἀκούητε</span>, answer: "Subjunctive — the vowel went long" },
        { q: <span className="normal-case">πιστεύσῃ</span>, answer: "Subjunctive — the vowel went long" },
        { q: <span className="normal-case">πιστεύει</span>, answer: "Indicative — statement" },
      ]}
    />

    <SectionHeading>How you'll actually meet it: flag words</SectionHeading>
    <P>
      The subjunctive rarely walks alone. In practice, a small set of "flag words" announces it a word or
      two in advance — see one of these, and expect a subjunctive verb to follow:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Flag word in action</AsideLabel>
        <Ex grc="ἵνα πιστεύητε" en="in order that you may believe" />
        <Ex grc="ἐὰν εἴπωμεν" en="if we say…" />
        <Ex grc="ὃς ἂν ἀκούσῃ" en="whoever hears" />
      </>}
      intermediate={<>
        <p>The logic: <Gk>ἵνα/ὅπως</Gk> project intention (not yet fact); <Gk>ἐάν/ἄν/ὅταν</Gk> mark indefiniteness. Both are non-assertions — exactly the subjunctive's territory.</p>
      </>}
    >
      <MorphTable flush title="The flag words" headers={['Flag', 'Introduces', 'Translate']} firstColIsData
        rows={[
          ['ἵνα, ὅπως', 'purpose clause', 'in order that … may'],
          ['ἐάν', '3rd-class condition', 'if (maybe / future)'],
          ['ὅταν', 'indefinite time', 'whenever'],
          ['ὃς ἄν', 'indefinite person', 'whoever'],
          ['ἕως (ἄν)', 'indefinite limit', 'until'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Independent uses ───────────────────────────── */}
    <DropdownPractice
      title="Practice — read the flag word"
      options={["Purpose — \"in order that\"", "Condition — \"if (maybe)\"", "\"Whoever\"", "\"Whenever\"", "Prohibition — \"do not\"", "Emphatic denial — \"never\""]}
      items={[
        { q: <span className="normal-case">ἵνα</span>, answer: "Purpose — \"in order that\"" },
        { q: <span className="normal-case">ἐάν</span>, answer: "Condition — \"if (maybe)\"" },
        { q: <span className="normal-case">ὃς ἄν</span>, answer: "\"Whoever\"" },
        { q: <span className="normal-case">ὅταν</span>, answer: "\"Whenever\"" },
        { q: <span className="normal-case">μή + aorist subj.</span>, answer: "Prohibition — \"do not\"" },
        { q: <span className="normal-case">οὐ μή</span>, answer: "Emphatic denial — \"never\"" },
      ]}
    />

    <SectionHeading>When it does walk alone</SectionHeading>
    <P>
      Four uses need no flag word — the subjunctive itself carries the meaning:
    </P>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><strong>Hortatory</strong> (1st plural): <Gk>ἀγαπῶμεν ἀλλήλους</Gk> — "<em>let us</em> love one another." You exhort the group you belong to.</li>
        <li><strong>Deliberative</strong> (questions): <Gk>τί εἴπω;</Gk> — "what <em>should</em> I say?"</li>
        <li><strong>Prohibition</strong>: <Gk>μή</Gk> + aorist subjunctive — <Gk>μὴ φοβηθῇς</Gk>, "do not fear."</li>
        <li><strong>Emphatic negation</strong>: <Gk>οὐ μή</Gk> + aorist subjunctive — the strongest "no" Greek can say: "certainly never."</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Watch out ──────────────────────────────────── */}
    <ClassSentences
      lesson="The subjunctive alone"
      items={[
        { words: [
          { w: "ἀγαπῶμεν", parsing: "Pres Act Subj 1 Pl — ἀγαπάω (hortatory)", gloss: "let us love" },
          { w: "ἀλλήλους.", parsing: "Acc Pl Masc — ἀλλήλων", syntax: "Direct Object", gloss: "one another" },
        ],
          translation: "Let us love one another.",
          note: "1 John 4:7 — the hortatory subjunctive.",
        },
        { words: [
          { w: "τί", parsing: "Acc Sg Neut — τίς (interrogative)", gloss: "what?" },
          { w: "εἴπω;", parsing: "2nd Aor Act Subj 1 Sg — λέγω (deliberative)", gloss: "should I say" },
        ],
          translation: "What should I say?",
          note: "John 12:27 — the deliberative subjunctive.",
        },
      ]}
    />

    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>Aorist subjunctive vs. future indicative: <Gk>λύσητε</Gk> vs. <Gk>λύσετε</Gk> — the long vowel decides, so read vowels carefully after a <Gk>σ</Gk>.</li>
        <li>1st sg. <Gk>λύω</Gk> is identical in indicative and subjunctive — let the flag word or context decide.</li>
        <li>No augment, ever: <Gk>ἐὰν λύσῃ</Gk>, not <Gk>ἐὰν ἐλύσῃ</Gk>.</li>
        <li>Contract (-εω) verbs are easy here: the long vowels swallow the <Gk>ε</Gk>, so <Gk>ποιῇς, ποιῆτε</Gk> follow the regular pattern.</li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning">
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Watch for the flag word and the long vowel. Vocabulary: <span className="normal-case">πιστεύω</span> "believe" · <span className="normal-case">φάγωμεν</span> (aor. subj. of "eat") · <span className="normal-case">σωθῇ</span> (aor. pass. subj. of "save").</>}
      items={[
        { q: <span className="normal-case">ἵνα πιστεύσητε</span>,
          a: <>"In order that you may believe" — ἵνα + aorist subjunctive (a whole act of believing).</> },
        { q: <span className="normal-case">ἐὰν ὁ κύριος θέλῃ</span>,
          a: <>"If the Lord wills" — ἐάν + present subjunctive: 3rd-class condition (Jas 4:15's sentiment).</> },
        { q: <span className="normal-case">φάγωμεν καὶ πίωμεν.</span>,
          a: <>"Let us eat and drink" — hortatory subjunctives, no flag word needed (1 Cor 15:32).</> },
        { q: <span className="normal-case">ὃς ἂν ἀκούσῃ τὸν λόγον</span>,
          a: <>"Whoever hears the word" — indefinite relative clause with ἄν.</> },
        { q: <span className="normal-case">οὐ μὴ ἀπολῶνται.</span>,
          a: <>"They shall certainly never perish" — οὐ μή + aorist subjunctive, the emphatic negation of John 10:28.</> },
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <ClassSentences
      lesson="Lesson 8 · The subjunctive"
      items={[
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "μαθηταὶ", parsing: "Nom Pl Masc — μαθητής", syntax: "Subject", gloss: "disciples" },
          { w: "ἀπεστάλησαν", parsing: "Aor Pass Ind 3 Pl — ἀποστέλλω", gloss: "were sent" },
          { w: "ἵνα", parsing: "Conjunction + subjunctive", syntax: "Purpose Clause", gloss: "in order that" },
          { w: "κηρύσσωσιν", parsing: "Pres Act Subj 3 Pl — κηρύσσω", gloss: "they might preach" },
          { w: "τὸ", parsing: "Article — Acc Sg Neut", gloss: "the" },
          { w: "εὐαγγέλιον.", parsing: "Acc Sg Neut — εὐαγγέλιον", syntax: "Direct Object", gloss: "gospel" },
        ],
          translation: "The disciples were sent in order that they might preach the gospel.",
        },
        { words: [
          { w: "ὃς", parsing: "Nom Sg Masc — ὅς (relative)", gloss: "who" },
          { w: "ἂν", parsing: "Particle (+ subjunctive = indefinite)", gloss: "-ever" },
          { w: "ἀκούῃ", parsing: "Pres Act Subj 3 Sg — ἀκούω", gloss: "hears" },
          { w: "μου,", parsing: "Gen Sg — ἐγώ", syntax: "Genitive of Direct Object", gloss: "me" },
          { w: "ἀκούει", parsing: "Pres Act Ind 3 Sg — ἀκούω", gloss: "hears" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "the one" },
          { w: "πέμψαντός", parsing: "Aor Act Ptcp Gen Sg Masc — πέμπω", syntax: "Substantival Participle", gloss: "who sent" },
          { w: "με.", parsing: "Acc Sg — ἐγώ", syntax: "Direct Object", gloss: "me" },
        ],
          translation: "Whoever hears me hears the one who sent me.",
          note: "ὃς ἄν + subjunctive = \"whoever\"; ἀκούω takes a genitive object.",
        },
        { words: [
          { w: "μὴ", parsing: "Negative particle (+ aor. subj. = prohibition)", gloss: "do not" },
          { w: "φοβηθῆτε.", parsing: "Aor Pass Subj 2 Pl — φοβέομαι", gloss: "be afraid" },
        ],
          translation: "Do not be afraid.",
          note: "μή + aorist subjunctive forbids an action as a whole.",
        },
        { words: [
          { w: "οὐ", parsing: "Negative particle", gloss: "not" },
          { w: "μὴ", parsing: "Negative particle", gloss: "never" },
          { w: "εἰσέλθωσιν.", parsing: "2nd Aor Act Subj 3 Pl — εἰσέρχομαι", gloss: "they will enter" },
        ],
          translation: "They will never enter.",
          note: "οὐ μή + aorist subjunctive is the strongest possible denial.",
        },
        { words: [
          { w: "ζητῶμεν", parsing: "Pres Act Subj 1 Pl — ζητέω (hortatory)", gloss: "let us seek" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "βασιλείαν", parsing: "Acc Sg Fem — βασιλεία", syntax: "Direct Object", gloss: "kingdom" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of" },
          { w: "θεοῦ.", parsing: "Gen Sg Masc — θεός", syntax: "Genitive of Possession", gloss: "God" },
        ],
          translation: "Let us seek the kingdom of God.",
        },
      ]}
    />

    </LevelOnly>
    <HomeworkAssignments chapter="subjunctives" />

    <LiveExamples
      intro={<>Track the flag words to their subjunctives in the text itself.</>}
      links={[
        { label: 'Every subjunctive in the NT — scan for the long vowels', features: ['verb', 'subjunctive'] },
        { label: 'Aorist subjunctives — prohibitions, conditions, purpose clauses', features: ['verb', 'subjunctive', 'aorist'] },
        { label: <>Every <span className="normal-case">ἵνα</span> — check the subjunctive that follows each one</>, lemma: 'ἵνα' },
      ]}
    />

    {/* The uses of the subjunctive are RELATIONS between words — a flag word and a mood — so they
        need Construct search rather than the one-word morphology search above. Each of these is a
        preset, and opens in the builder where it can be narrowed or run against another text. */}
    <LiveExamples
      intro={<>Now the uses, each as a search you can open and adjust:</>}
      links={SUBJUNCTIVE_USES.map(p => ({
        label: <>{p.label} <span className="text-gray-400">— {p.approx.toLocaleString()} in the NT</span></>,
        construct: p.query,
      }))}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: purpose, promise, and the strongest no</SectionHeading>
      <P>
        <strong>ἵνα beyond purpose.</strong> Classical ἵνα meant "in order that"; Koine stretched it. It can
        mark <em>result</em> ("so that"), <em>content</em> (answering "what?" after verbs of asking —
        "I ask that you…"), even stand where an infinitive would. When John writes
        <Gk> αὕτη ἐστὶν ἡ ἐντολή, ἵνα ἀγαπᾶτε</Gk> (John 15:12), the ἵνα clause is not the command's
        purpose — it <em>is</em> the command's content. Always ask which job ἵνα is doing.
      </P>
      <P>
        <strong>The emphatic οὐ μή.</strong> Piling both negatives onto an aorist subjunctive produces
        Greek's most absolute denial — about 85 NT occurrences, heavily in sayings of Jesus:
        <Gk> οὐ μὴ ἀπόλωνται εἰς τὸν αἰῶνα</Gk>, "they shall <em>by no means ever</em> perish" (John 10:28).
        English "never" undersells it; translators reach for "certainly not," "by no means."
      </P>
      <P>
        <strong>Prohibition aspect.</strong> <Gk>μή</Gk> + <em>aorist</em> subjunctive forbids as a whole
        ("don't do it / don't start"); <Gk>μή</Gk> + <em>present</em> imperative leans "stop doing / don't
        keep doing." The distinction is a tendency, not a law — check context before preaching it — but it
        often illuminates: <Gk>μὴ φοβοῦ</Gk> (pres.) to the fearing disciple, "stop being afraid."
      </P>
    </LevelOnly>
  </>
)
