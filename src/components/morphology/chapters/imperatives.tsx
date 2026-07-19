/* ─────────────────────────────────────────────
   Chapter: Imperatives

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
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
