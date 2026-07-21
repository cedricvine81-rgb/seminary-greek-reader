/* ─────────────────────────────────────────────
   Chapter: Imperatives

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,
} from '../shared'

export const IMPERATIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: giving orders</SectionHeading>
      <P>
        "Sit!" "Listen." "Come in." English commands are the barest verb form there is — no ending, no
        subject, and (except for tone of voice) no variety. That is the <strong>imperative</strong>, the
        {' '}<Term t="mood">mood</Term> of command and request.
      </P>
      <P>
        Greek's imperative is richer in two ways. First, it marks <Term t="number">number</Term>: telling one
        person to listen (<Gk>ἄκουε</Gk>) is a different form from telling a crowd (<Gk>ἀκούετε</Gk>) —
        something written English cannot show at all. Second, Greek has a <strong>third-person</strong>
        imperative: a command <em>about</em> someone — <Gk>λυέτω</Gk>, "let him loose," "he must loose."
        English has to paraphrase with "let…"; Greek says it in one word.
      </P>
      <P>
        And as with the subjunctive: no augment, no past time. An aorist imperative commands a whole,
        single action; a present imperative commands ongoing action. The difference is
        {' '}<Term t="aspect">aspect</Term>, never time.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading>The forms you'll meet most</SectionHeading>
    <TableAside
      beginning={<>
        <p>The imperative gives a command. Learn the 2nd-person forms first.</p>
        <Ex grc="λῦε" en="loose! (you, sg.)" />
        <Ex grc="λύετε" en="loose! (you all)" />
        <Ex grc="πίστευε" en="believe! (keep believing)" />
      </>}
      intermediate={<>
        <p>Present vs. aorist imperative is aspect: present = ongoing / general, aorist = a single specific act. Beware the look-alike future indicative — the ending decides (<Gk>πίστευσον</Gk> "believe!" vs. <Gk>πιστεύσομεν</Gk> "we will believe").</p>
      </>}
    >
      <MorphTable flush title={gt("Most Common Imperative Forms — λύω")} headers={['','Present Active','Aorist Active']}
        rows={[
          ['2nd Person Singular','λῦε','λύσον'],
          ['2nd Person Plural','λύετε','λύσατε'],
        ]}
      />
    </TableAside>
    <P>
      The third person builds on two endings worth memorizing cold: <Gk>‑τω</Gk> (singular, "let him…")
      and <Gk>‑τωσαν</Gk> (plural, "let them…"). The full paradigms live in Essentials 7 — here is the
      shape of the thing:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="λυέτω" en="let him loose" />
        <Ex grc="λυέτωσαν" en="let them loose" />
        <Ex grc="ἀκουέτω" en="let him hear (Rev 2:7's refrain)" />
      </>}
      intermediate={<>
        <p>"Let him…" is a translation crutch, not a permission slip — the 3rd-person imperative commands as firmly as the 2nd. <Gk>ὁ ἔχων ὦτα ἀκουέτω</Gk> is an order to hear, not an offer.</p>
      </>}
    >
      <MorphTable flush title="The 3rd-person endings" headers={['', 'Ending', 'Force']} firstColIsData
        rows={[
          ['3rd singular', '‑τω', 'let him / her / it …'],
          ['3rd plural', '‑τωσαν', 'let them …'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Aspect in commands ─────────────────────────── */}
    <DropdownPractice
      title="Practice — parse the command"
      options={["Pres Impv 2 Sg — \"keep loosing!\"", "Aor Impv 2 Sg — \"loose!\"", "Pres Impv 2 Pl", "Aor Impv 2 Pl", "Pres Impv 3 Sg — \"let him loose!\"", "Aor Impv 3 Sg — \"let him loose!\""]}
      items={[
        { q: <span className="normal-case">λῦε</span>, answer: "Pres Impv 2 Sg — \"keep loosing!\"" },
        { q: <span className="normal-case">λῦσον</span>, answer: "Aor Impv 2 Sg — \"loose!\"" },
        { q: <span className="normal-case">λύετε</span>, answer: "Pres Impv 2 Pl" },
        { q: <span className="normal-case">λύσατε</span>, answer: "Aor Impv 2 Pl" },
        { q: <span className="normal-case">λυέτω</span>, answer: "Pres Impv 3 Sg — \"let him loose!\"" },
        { q: <span className="normal-case">λυσάτω</span>, answer: "Aor Impv 3 Sg — \"let him loose!\"" },
      ]}
    />

    <SectionHeading>Present or aorist? The aspect of a command</SectionHeading>
    <P>
      Both tenses command; they command <em>differently</em>. The aorist orders a specific, whole act:
      <Gk> λύσον</Gk>, "untie it (now, this one)." The present orders continuing or habitual action:
      <Gk> λῦε</Gk>, "keep untying / make untying your practice." Jesus' <Gk>πίστευε</Gk> (present) to
      Jairus is "keep believing"; Paul's <Gk>πίστευσον</Gk> (aorist) to the jailer is "put your faith —
      the decisive act."
    </P>
    <P>
      The aorist imperative is somewhat the default for specific requests — which makes a chosen
      <em> present</em> worth noticing. Prohibitions split along the same line: <Gk>μή</Gk> + present
      imperative tends to "stop doing / don't keep doing," while "don't (ever) do" usually takes
      <Gk> μή</Gk> + aorist <em>subjunctive</em> (see the Subjunctives chapter).
    </P>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <ClassSentences
      lesson="Commands in the text"
      items={[
        { words: [
          { w: "χαίρετε", parsing: "Pres Act Impv 2 Pl — χαίρω", gloss: "rejoice!" },
          { w: "ἐν", parsing: "Preposition + dative", gloss: "in" },
          { w: "κυρίῳ", parsing: "Dat Sg Masc — κύριος", gloss: "the Lord" },
          { w: "πάντοτε.", parsing: "Adverb", gloss: "always" },
        ],
          translation: "Rejoice in the Lord always.",
          note: "Philippians 4:4 — present imperative: keep on rejoicing.",
        },
        { words: [
          { w: "μὴ", parsing: "Negative particle (+ pres. impv.)", gloss: "not" },
          { w: "φοβοῦ,", parsing: "Pres Mid Impv 2 Sg — φοβέομαι", gloss: "fear" },
          { w: "μόνον", parsing: "Adverb", gloss: "only" },
          { w: "πίστευε.", parsing: "Pres Act Impv 2 Sg — πιστεύω", gloss: "believe" },
        ],
          translation: "Do not fear; only believe.",
          note: "Mark 5:36 — μή + present imperative: stop fearing (and keep believing).",
        },
      ]}
    />

    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>Aorist imperative vs. future indicative: both carry <Gk>σ</Gk> and no augment — the <em>endings</em> decide: <Gk>πίστευσον</Gk> "believe!" vs. <Gk>πιστεύσομεν</Gk> "we will believe."</li>
        <li>2nd plural present imperative = 2nd plural present indicative (<Gk>λύετε</Gk> = "loose!" or "you are loosing"). Context — especially a vocative or a μή — decides.</li>
        <li>No augment on imperatives: <Gk>λύσατε</Gk>, not <Gk>ἐλύσατε</Gk> (that's the indicative "you loosed").</li>
        <li>Middle/passive imperatives exist too: <Gk>λύου</Gk> "be loosed!", <Gk>προσεύχου</Gk> "pray!" (deponent — active meaning).</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Identify person, number, tense — then feel the aspect. Vocabulary: <span className="normal-case">ἀκούω</span> "hear" · <span className="normal-case">ἔγειρε</span> "rise" · <span className="normal-case">δός</span> (aor. impv. of δίδωμι, "give").</>}
      items={[
        { q: <span className="normal-case">ἄκουε τὸν λόγον.</span>,
          a: <>"Hear the word!" — 2nd sg. present: keep on hearing, as a practice.</> },
        { q: <span className="normal-case">ἀκούσατε τοὺς λόγους τούτους.</span>,
          a: <>"Hear these words!" — 2nd pl. aorist: a specific act of listening (Acts 2:22's opener).</> },
        { q: <span className="normal-case">ὁ ἔχων ὦτα ἀκουέτω.</span>,
          a: <>"Let the one who has ears hear" — 3rd sg. imperative in ‑τω.</> },
        { q: <span className="normal-case">μὴ κρίνετε.</span>,
          a: <>"Do not judge / stop judging" — μή + present imperative (Matt 7:1): don't make judging your habit.</> },
        { q: <span className="normal-case">δὸς ἡμῖν σήμερον.</span>,
          a: <>"Give us today" — aorist imperative of δίδωμι: the Lord's Prayer asks in whole, specific acts.</> },
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences
      lesson="Lesson 8 · The imperative"
      items={[
        { words: [
          { w: "ζητεῖτε", parsing: "Pres Act Impv 2 Pl — ζητέω", gloss: "seek! (keep seeking)" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "ἀλήθειαν.", parsing: "Acc Sg Fem — ἀλήθεια", syntax: "Direct Object", gloss: "truth" },
        ],
          translation: "Seek (pl.) the truth!",
          note: "Present imperative = continuous command.",
        },
        { words: [
          { w: "πέμψον", parsing: "Aor Act Impv 2 Sg — πέμπω", gloss: "send!" },
          { w: "αὐτῷ.", parsing: "Dat Sg Masc — αὐτός", syntax: "Dative of Indirect Object", gloss: "to him" },
        ],
          translation: "Send to him!",
          note: "Aorist imperative = simple (\"default\") command.",
        },
        { words: [
          { w: "διδάσκετε", parsing: "Pres Act Impv 2 Pl — διδάσκω", gloss: "teach!" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λαόν.", parsing: "Acc Sg Masc — λαός", syntax: "Direct Object", gloss: "people" },
        ],
          translation: "Teach (pl.) the people!",
        },
      ]}
    />

    <HomeworkAssignments chapter="imperatives" />

    <LiveExamples
      intro={<>The NT is full of commands — compare how present and aorist feel in context.</>}
      links={[
        { label: 'Every imperative in the NT', features: ['verb', 'imperative'] },
        { label: 'Aorist imperatives — specific, whole-act commands', features: ['verb', 'imperative', 'aorist'] },
        { label: 'Present imperatives — ongoing or habitual commands', features: ['verb', 'imperative', 'present'] },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: commands with manners</SectionHeading>
      <P>
        <strong>Request, not just order.</strong> Direction of rank matters: an imperative from an inferior
        to a superior is an entreaty. Every petition of the Lord's Prayer is an aorist imperative —
        <Gk> ἁγιασθήτω, ἐλθέτω, γενηθήτω, δός, ἄφες</Gk> — prayer language, not barked orders. Translating
        "give us" as rude misreads the mood's range.
      </P>
      <P>
        <strong>The conditional imperative.</strong> Imperative + <Gk>καί</Gk> + future indicative can carry
        an "if… then" force: <Gk>λύσατε τὸν ναὸν τοῦτον καὶ ἐν τρισὶν ἡμέραις ἐγερῶ αὐτόν</Gk> — "destroy
        this temple [= if you destroy it], and in three days I will raise it" (John 2:19). The imperative
        states the condition, not a wish.
      </P>
      <P>
        <strong>Permission and toleration.</strong> Occasionally the imperative concedes rather than
        commands: <Gk>ὁ ἀδικῶν ἀδικησάτω ἔτι</Gk>, "let the evildoer still do evil" (Rev 22:11) — grim
        permission, not encouragement. Context, as ever, assigns the force.
      </P>
    </LevelOnly>
  </>
)
