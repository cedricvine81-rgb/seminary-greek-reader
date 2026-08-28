/* ─────────────────────────────────────────────
   Chapter: Imperatives

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'

export const IMPERATIVES_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="imperatives.h.start-english-giving">Start with English: giving orders</SectionHeading>
      <P id="imperatives.p.sit-listen-come">
        "Sit!" "Listen." "Come in." English commands are the barest verb form there is — no ending, no
        subject, and (except for tone of voice) no variety. That is the <strong>imperative</strong>, the
        {' '}<Term t="mood">mood</Term> of command and request.
      </P>
      <P id="imperatives.p.greek's-imperative-richer">
        Greek's imperative is richer in two ways. First, it marks <Term t="number">number</Term>: telling one
        person to listen (<Gk>ἄκουε</Gk>) is a different form from telling a crowd (<Gk>ἀκούετε</Gk>) —
        something written English cannot show at all. Second, Greek has a <strong>third-person</strong>
        imperative: a command <em>about</em> someone — <Gk>λυέτω</Gk>, "let him loose," "he must loose."
        English has to paraphrase with "let…"; Greek says it in one word.
      </P>
      <P id="imperatives.p.subjunctive-augment-past">
        And as with the subjunctive: no augment, no past time. An aorist imperative commands a whole,
        single action; a present imperative commands ongoing action. The difference is
        {' '}<Term t="aspect">aspect</Term>, never time.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading id="imperatives.h.forms-you'll-meet">The forms you'll meet most</SectionHeading>
    <TableAside
      beginning={<>
        <p><Tr id="imperatives.as.imperative-gives-command">The imperative gives a command. Learn the 2nd-person forms first.</Tr></p>
        <Ex grc="λῦε" en={<Tr id="imperatives.ex.loose">loose! (you, sg.)</Tr>} />
        <Ex grc="λύετε" en={<Tr id="imperatives.ex.loose-all">loose! (you all)</Tr>} />
        <Ex grc="πίστευε" en={<Tr id="imperatives.ex.believe-keep-believing">believe! (keep believing)</Tr>} />
      </>}
    >
      <MorphTable id="imperatives.t1" tCols={[0]} flush title="Most Common Imperative Forms — λύω" headers={['','Present Active','Aorist Active']}
        rows={[
          ['2nd Person Singular','λῦε','λύσον'],
          ['2nd Person Plural','λύετε','λύσατε'],
        ]}
      />
    </TableAside>
    <P id="imperatives.p.third-person-builds">
      The third person builds on two endings worth memorizing cold: <Gk>‑τω</Gk> (singular, "let him…")
      and <Gk>‑τωσαν</Gk> (plural, "let them…"). The full paradigms live in Minimums 7 — here is the
      shape of the thing:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="imperatives.al.default-translations">Default translations</Tr></AsideLabel>
        <Ex grc="λυέτω" en={<Tr id="imperatives.ex.loose-2">let him loose</Tr>} />
        <Ex grc="λυέτωσαν" en={<Tr id="imperatives.ex.loose-3">let them loose</Tr>} />
        <Ex grc="ἀκουέτω" en={<Tr id="imperatives.ex.hear-rev-refrain">let him hear (Rev 2:7's refrain)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="imperatives.as.let-him-translation">"Let him…" is a translation crutch, not a permission slip — the 3rd-person imperative commands as firmly as the 2nd. <Gk>ὁ ἔχων ὦτα ἀκουέτω</Gk> is an order to hear, not an offer.</Tr></p>
      </>}
    >
      <MorphTable id="imperatives.t2" tCols={[0, 2]} flush title="The 3rd-person endings" headers={['', 'Ending', 'Force']} firstColIsData
        rows={[
          ['3rd singular', '‑τω', 'let him / her / it …'],
          ['3rd plural', '‑τωσαν', 'let them …'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Aspect in commands ─────────────────────────── */}
    <DropdownPractice id="imperatives.d1"
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

    <SectionHeading id="imperatives.h.present-aorist-aspect">Present or aorist? The aspect of a command</SectionHeading>
    <P id="imperatives.p.both-tenses-command">
      Both tenses command; they command <em>differently</em>. The aorist orders a specific, whole act:
      <Gk> λύσον</Gk>, "untie it (now, this one)." The present orders continuing or habitual action:
      <Gk> λῦε</Gk>, "keep untying / make untying your practice." Jesus' <Gk>πίστευε</Gk> (present) to
      Jairus is "keep believing"; Paul's <Gk>πίστευσον</Gk> (aorist) to the jailer is "put your faith —
      the decisive act."
    </P>
    <P id="imperatives.p.aorist-imperative-somewhat">
      The aorist imperative is somewhat the default for specific requests — which makes a chosen
      <em> present</em> worth noticing. Prohibitions split along the same line: <Gk>μή</Gk> + present
      imperative tends to "stop doing / don't keep doing," while "don't (ever) do" usually takes
      <Gk> μή</Gk> + aorist <em>subjunctive</em> (see the Subjunctives chapter).
    </P>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <ClassSentences id="imperatives.cs1"
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

    <SectionHeading id="imperatives.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="imperatives.wo.aorist-imperative-future">Aorist imperative vs. future indicative: both carry <Gk>σ</Gk> and no augment — the <em>endings</em> decide: <Gk>πίστευσον</Gk> "believe!" vs. <Gk>πιστεύσομεν</Gk> "we will believe."</Tr></li>
        <li><Tr id="imperatives.wo.plural-present-imperative">2nd plural present imperative = 2nd plural present indicative (<Gk>λύετε</Gk> = "loose!" or "you are loosing"). Context — especially a vocative or a μή — decides.</Tr></li>
        <li><Tr id="imperatives.wo.augment-imperatives-that's">No augment on imperatives: <Gk>λύσατε</Gk>, not <Gk>ἐλύσατε</Gk> (that's the indicative "you loosed").</Tr></li>
        <li><Tr id="imperatives.wo.middle-passive-imperatives">Middle/passive imperatives exist too: <Gk>λύου</Gk> "be loosed!", <Gk>προσεύχου</Gk> "pray!" (deponent — active meaning).</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="imperatives.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="imperatives.pr1"
      title="Practice — parse and translate"
      intro={<Tr id="imperatives.intro.identify-person-number">Identify person, number, tense — then feel the aspect. Vocabulary: <span className="normal-case">ἀκούω</span> "hear" · <span className="normal-case">ἔγειρε</span> "rise" · <span className="normal-case">δός</span> (aor. impv. of δίδωμι, "give").</Tr>}
      items={[
        { q: <span className="normal-case">ἄκουε τὸν λόγον.</span>,
          a: <Tr id="imperatives.pa.hear-word-present">"Hear the word!" — 2nd sg. present: keep on hearing, as a practice.</Tr>},
        { q: <span className="normal-case">ἀκούσατε τοὺς λόγους τούτους.</span>,
          a: <Tr id="imperatives.pa.hear-these-words">"Hear these words!" — 2nd pl. aorist: a specific act of listening (Acts 2:22's opener).</Tr>},
        { q: <span className="normal-case">ὁ ἔχων ὦτα ἀκουέτω.</span>,
          a: <Tr id="imperatives.pa.let-one-who">"Let the one who has ears hear" — 3rd sg. imperative in ‑τω.</Tr>},
        { q: <span className="normal-case">μὴ κρίνετε.</span>,
          a: <Tr id="imperatives.pa.judge-stop-judging">"Do not judge / stop judging" — μή + present imperative (Matt 7:1): don't make judging your habit.</Tr>},
        { q: <span className="normal-case">δὸς ἡμῖν σήμερον.</span>,
          a: <Tr id="imperatives.pa.give-today-aorist">"Give us today" — aorist imperative of δίδωμι: the Lord's Prayer asks in whole, specific acts.</Tr>},
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="imperatives.cs2"
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
      intro={<Tr id="imperatives.intro.full-commands-compare">The NT is full of commands — compare how present and aorist feel in context.</Tr>}
      links={[
        { label: <Tr id="imperatives.le.imperative">Every imperative in the NT</Tr>, features: ['verb', 'imperative'] },
        { label: <Tr id="imperatives.le.aorist-imperatives-specific">Aorist imperatives — specific, whole-act commands</Tr>, features: ['verb', 'imperative', 'aorist'] },
        { label: <Tr id="imperatives.le.present-imperatives-ongoing">Present imperatives — ongoing or habitual commands</Tr>, features: ['verb', 'imperative', 'present'] },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="imperatives.h.going-deeper-commands">Going deeper: commands with manners</SectionHeading>
      <P id="imperatives.p.request-just-order">
        <strong>Request, not just order.</strong> Direction of rank matters: an imperative from an inferior
        to a superior is an entreaty. Every petition of the Lord's Prayer is an aorist imperative —
        <Gk> ἁγιασθήτω, ἐλθέτω, γενηθήτω, δός, ἄφες</Gk> — prayer language, not barked orders. Translating
        "give us" as rude misreads the mood's range.
      </P>
      <P id="imperatives.p.permission-toleration-occasionally">
        <strong>Permission and toleration.</strong> Occasionally the imperative concedes rather than
        commands: <Gk>ὁ ἀδικῶν ἀδικησάτω ἔτι</Gk>, "let the evildoer still do evil" (Rev 22:11) — grim
        permission, not encouragement. Context, as ever, assigns the force.
      </P>
    </LevelOnly>
  </>
)
