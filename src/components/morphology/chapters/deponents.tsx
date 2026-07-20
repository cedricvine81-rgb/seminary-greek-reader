/* ─────────────────────────────────────────────
   Chapter: Deponent Verbs

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences,
} from '../shared'

export const DEPONENTS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: forms that don't mean what they look like</SectionHeading>
      <P>
        English has verbs whose form and meaning part company. "I <em>was born</em> in June" — passive in
        form, but you aren't picturing anyone doing the "borning"; it just tells what happened to you.
        Nobody is misled, because you learned the expression whole.
      </P>
      <P>
        Greek has a whole club like that: verbs that wear <strong>middle/passive endings</strong>
        (their dictionary form ends in <Gk>‑ομαι</Gk>, not <Gk>‑ω</Gk>) but carry a plain
        <strong> active meaning</strong>. <Gk>ἔρχομαι</Gk> <em>looks</em> like "I am being come" — it just
        means "I come / go." These are <strong>deponent</strong> verbs, from the Latin for "laid aside":
        they have laid their active forms aside. Your job is simple: parse the form as the middle/passive
        it is, then translate with the active meaning the lexicon gives. No hidden passiveness to hunt for.
      </P>
    </LevelOnly>

    {/* ── 2 · Spotting them ──────────────────────────────── */}
    <SectionHeading>How you spot one</SectionHeading>
    <P>
      The dictionary form tells you. A normal verb's lexical form ends in <Gk>‑ω</Gk> (<Gk>λύω</Gk>); a
      deponent's ends in <Gk>‑ομαι</Gk> (<Gk>ἔρχομαι, γίνομαι, δύναμαι</Gk>). And frequency is on your
      side — a handful of deponents are among the most common verbs in the entire New Testament:
    </P>
    <TableAside
      sticky
      beginning={<>
        <p>A <strong>deponent</strong> looks middle/passive (ending in <Gk>‑ομαι</Gk>) but means something <em>active</em>. Just translate it actively — the middle/passive form is its only form.</p>
        <Ex grc="ἔρχομαι" en="I come / go" />
        <Ex grc="ἀποκρίνομαι" en="I answer" />
      </>}
      intermediate={<>
        <p>Parse it exactly as a middle/passive (tense, person, number), then use the active gloss. Some are <strong>middle</strong> in the future/aorist, others <strong>passive</strong> (<Gk>ἀποκρίνομαι → ἀπεκρίθην</Gk>).</p>
        <p>Many now argue the Greek <strong>middle voice</strong> genuinely fits these verbs (subject-affectedness) rather than being a defective active — but the practical rule (active meaning) still holds.</p>
      </>}
    >
    <MorphTable
      flush
      title="40 Most Common Deponent Verbs"
      headers={['Pres. (1st sg.)', 'Fut.', 'Aor.', 'Definition']}
      firstColIsData
      rows={[
        ['ἄρχομαι', 'ἄρξομαι', 'ἠρξάμην', 'I begin'],
        ['ἀποκρίνομαι', '—', 'ἀπεκρίθην', 'I answer'],
        ['γίνομαι', 'γενήσομαι', 'ἐγενόμην', 'I become, am, happen'],
        ['δέχομαι', 'δέξομαι', 'ἐδεξάμην', 'I receive, accept'],
        ['δύναμαι', 'δυνήσομαι', 'ἠδυνήθην', 'I am able, can'],
        ['ἔρχομαι', 'ἐλεύσομαι', 'ἦλθον', 'I come, go'],
        ['ἐργάζομαι', 'ἐργάσομαι', 'ἠργασάμην', 'I work, do, accomplish'],
        ['εὐαγγελίζομαι', '—', 'εὐηγγελισάμην', 'I proclaim good news'],
        ['εὔχομαι', 'εὔξομαι', 'ηὐξάμην', 'I pray, wish'],
        ['θαυμάζω', 'θαυμάσομαι', 'ἐθαύμασα', 'I marvel, wonder (semi-dep.)'],
        ['κάθομαι', 'καθήσομαι', '—', 'I sit'],
        ['λογίζομαι', 'λογίσομαι', 'ἐλογισάμην', 'I reckon, consider, count'],
        ['ὁράω / ὄψομαι', 'ὄψομαι', 'εἶδον', 'I see (fut./aor. suppl.)'],
        ['ὀνομάζομαι', '—', 'ὠνομάσθην', 'I am named, called'],
        ['παραγίνομαι', 'παραγενήσομαι', 'παρεγενόμην', 'I arrive, appear'],
        ['πορεύομαι', 'πορεύσομαι', 'ἐπορεύθην', 'I go, travel, journey'],
        ['προσεύχομαι', 'προσεύξομαι', 'προσηυξάμην', 'I pray'],
        ['προσέρχομαι', 'προσελεύσομαι', 'προσῆλθον', 'I come/go to, approach'],
        ['σπένδομαι', '—', 'ἐσπείσθην', 'I am poured out (as offering)'],
        ['συνέρχομαι', 'συνελεύσομαι', 'συνῆλθον', 'I come together, assemble'],
        ['ἀγωνίζομαι', 'ἀγωνίσομαι', 'ἠγωνισάμην', 'I compete, strive, fight'],
        ['ἀνακρίνομαι', '—', 'ἀνεκρίθην', 'I examine, judge'],
        ['ἀντιλέγομαι', '—', 'ἀντελέχθην', 'I contradict, oppose'],
        ['βούλομαι', 'βουλήσομαι', 'ἐβουλήθην', 'I wish, want, will'],
        ['γεύομαι', 'γεύσομαι', 'ἐγευσάμην', 'I taste, experience'],
        ['διαλογίζομαι', '—', 'διελογισάμην', 'I discuss, reason, debate'],
        ['ἐκπορεύομαι', 'ἐκπορεύσομαι', 'ἐξεπορεύθην', 'I go out, come out from'],
        ['ἐπιστρέφω / ‒ομαι', 'ἐπιστρέψω', 'ἐπεστράφην', 'I turn to, return'],
        ['θέλω / βούλομαι', 'θελήσω', 'ἠθέλησα', 'I will, wish, desire (semi-dep.)'],
        ['κατεργάζομαι', '—', 'κατειργασάμην', 'I accomplish, produce, bring about'],
        ['κομίζομαι', 'κομίσομαι', 'ἐκομισάμην', 'I receive, obtain'],
        ['μάχομαι', 'μαχέσομαι', 'ἐμαχεσάμην', 'I fight, quarrel'],
        ['μετανοέω / ‒ομαι', 'μετανοήσω', 'μετενόησα', 'I repent, change my mind'],
        ['μιμέομαι', 'μιμήσομαι', 'ἐμιμησάμην', 'I imitate, follow the example of'],
        ['ὀδύρομαι', '—', 'ὠδυράμην', 'I grieve, lament, mourn'],
        ['παρακαλέομαι', '—', 'παρεκλήθην', 'I comfort, encourage (pass. dep.)'],
        ['παρατίθεμαι', '—', 'παρεθέμην', 'I set before, entrust (mid.)'],
        ['σώζομαι / σώζω', 'σωθήσομαι', 'ἐσώθην', 'I am saved (pass. used as dep.)'],
        ['ὑπάρχω / ‒ομαι', '—', '—', 'I exist, am (by nature)'],
        ['φοβέομαι', 'φοβηθήσομαι', 'ἐφοβήθην', 'I fear, am afraid'],
      ]}
      note="Dash (—) indicates no separate form exists or it is not attested in the NT. Some verbs are semi-deponent (active forms exist in some tenses)."
    />
    </TableAside>

    {/* ── 3 · Middle vs passive deponents ────────────────── */}
    <SectionHeading>Two sub-clubs: middle and passive deponents</SectionHeading>
    <P>
      Deponents split by which non-active forms they use in the aorist. <strong>Middle deponents</strong> take
      middle aorists: <Gk>ἐδεξάμην</Gk> "I received." <strong>Passive deponents</strong> take passive-looking
      aorists — with the <Gk>θη</Gk> marker — still meaning active: <Gk>ἀπεκρίθη</Gk> "he answered,"
      <Gk> ἐπορεύθην</Gk> "I went." So a <Gk>θη</Gk> form is not automatically passive in meaning; check
      whether the verb is deponent before translating "was …ed."
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἀπεκρίθη ὁ Ἰησοῦς" en="Jesus answered (not “was answered”!)" />
        <Ex grc="ἐπορεύθησαν" en="they went / journeyed" />
      </>}
      intermediate={<>
        <p>Oddities worth knowing: <Gk>ἔρχομαι</Gk> is deponent in the present but its aorist <Gk>ἦλθον</Gk> is a plain 2nd-aorist <em>active</em>; and <Gk>θέλω</Gk> is active in the present but deponent-futured. "Semi-deponent" covers these mixed careers.</p>
      </>}
    >
      <MorphTable flush title="The two sub-clubs" headers={['Type', 'Aorist looks', 'Example', 'Means']} firstColIsData
        rows={[
          ['Middle deponent', 'middle (‑σάμην)', 'ἐδεξάμην', 'I received'],
          ['Passive deponent', 'passive (‑θην)', 'ἀπεκρίθην', 'I answered'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>Not every <Gk>‑ομαι</Gk> form is deponent! <Gk>λύομαι</Gk> is the genuine middle/passive of <Gk>λύω</Gk>. The test is the <em>lexicon</em>: if no active form exists, it's deponent.</li>
        <li>A <Gk>θη</Gk> aorist from a passive deponent means <em>active</em>: <Gk>ἀπεκρίθη</Gk> "he answered." Don't force "was answered."</li>
        <li><Gk>ἐγένετο</Gk> (from <Gk>γίνομαι</Gk>) is everywhere: "became, happened, came to be, was." Small verb, wide range.</li>
        <li>Deponent participles keep the <Gk>‑μεν‑</Gk>/middle look with active meaning: <Gk>ἐρχόμενος</Gk> "coming," <Gk>πορευθέντες</Gk> "having gone" (Matt 28:19!).</li>
        <li>Semi-deponents change club mid-career: active present, deponent future (<Gk>λαμβάνω → λήμψομαι</Gk>; <Gk>γινώσκω → γνώσομαι</Gk>).</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Parse the form honestly (middle/passive!), then translate actively.</>}
      items={[
        { q: <span className="normal-case">ἔρχεται πρὸς αὐτόν.</span>,
          a: <>"He comes to him" — present deponent, 3rd sg.</> },
        { q: <span className="normal-case">ἀπεκρίθη αὐτοῖς ὁ Ἰησοῦς.</span>,
          a: <>"Jesus answered them" — aorist <em>passive in form</em> (θη), active in meaning: passive deponent.</> },
        { q: <span className="normal-case">οὐ δύναμαι ποιεῖν οὐδέν.</span>,
          a: <>"I can do nothing" — δύναμαι + infinitive (John 5:30; note the stacked negatives reinforcing, not cancelling).</> },
        { q: <span className="normal-case">ἐγένετο ἄνθρωπος ἀπεσταλμένος παρὰ θεοῦ.</span>,
          a: <>"There came (arose) a man sent from God" — ἐγένετο, aorist middle deponent (John 1:6).</> },
        { q: <span className="normal-case">προσηύξατο τῷ θεῷ.</span>,
          a: <>"He prayed to God" — aorist middle of the deponent προσεύχομαι.</> },
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences
      lesson="Lesson 5 · Middles and deponents"
      items={[
        { words: [
          { w: "ἔρχονται", parsing: "Pres Mid Ind 3 Pl — ἔρχομαι (deponent)", gloss: "they are coming" },
          { w: "πρὸς", parsing: "Preposition + accusative", gloss: "to/toward" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "θάλασσαν.", parsing: "Acc Sg Fem — θάλασσα", gloss: "sea" },
        ],
          translation: "They are coming to the sea.",
        },
        { words: [
          { w: "δεχόμεθα", parsing: "Pres Mid Ind 1 Pl — δέχομαι (deponent)", gloss: "we are receiving" },
          { w: "τὸ", parsing: "Article — Acc Sg Neut", gloss: "the" },
          { w: "εὐαγγέλιον.", parsing: "Acc Sg Neut — εὐαγγέλιον", syntax: "Direct Object", gloss: "gospel" },
        ],
          translation: "We are receiving the gospel.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "μαθηταὶ", parsing: "Nom Pl Masc — μαθητής", syntax: "Subject", gloss: "disciples" },
          { w: "ἐξέρχονται", parsing: "Pres Mid Ind 3 Pl — ἐξέρχομαι (deponent)", gloss: "are going out" },
          { w: "ἐκ", parsing: "Preposition + genitive", gloss: "out of" },
          { w: "τοῦ", parsing: "Article — Gen Sg Neut", gloss: "the" },
          { w: "ἱεροῦ.", parsing: "Gen Sg Neut — ἱερόν", gloss: "temple" },
        ],
          translation: "The disciples are leaving the temple.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "γραμματεῖς", parsing: "Nom Pl Masc — γραμματεύς", syntax: "Subject", gloss: "scribes" },
          { w: "ἤρξαντο", parsing: "Aor Mid Ind 3 Pl — ἄρχομαι (deponent)", gloss: "began" },
          { w: "λαλῆσαι.", parsing: "Aor Act Infinitive — λαλέω", syntax: "Complementary Infinitive", gloss: "to speak" },
        ],
          translation: "The scribes began to speak.",
        },
      ]}
    />

    <LiveExamples
      intro={<>Four deponents you cannot read a page without.</>}
      links={[
        { label: <>Every form of <span className="normal-case">γίνομαι</span> — become / happen / be</>, lemma: 'γίνομαι' },
        { label: <>Every form of <span className="normal-case">ἔρχομαι</span> — come / go (with its compounds)</>, lemma: 'ἔρχομαι' },
        { label: <>Every form of <span className="normal-case">ἀποκρίνομαι</span> — the Gospels' "answered"</>, lemma: 'ἀποκρίνομαι' },
        { label: <>Every form of <span className="normal-case">πορεύομαι</span> — go / journey</>, lemma: 'πορεύομαι' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: is "deponent" the right name?</SectionHeading>
      <P>
        <strong>The middle-voice reappraisal.</strong> A growing consensus in Greek linguistics holds that
        most "deponents" never laid anything aside — their middle form fits their meaning. Verbs of motion
        (<Gk>ἔρχομαι, πορεύομαι</Gk>), emotion (<Gk>φοβέομαι</Gk>), perception, and self-involving action
        are exactly where languages with a middle voice use it: the subject is inside the event, affected
        by it. On this view the label "deponent" describes <em>English's</em> lack of a middle voice, not a
        defect in the Greek. For translation nothing changes; for feel, much does — <Gk>δέχομαι</Gk> "I
        receive (into my own hands)" is middle to its bones.
      </P>
      <P>
        <strong>γίνομαι at full stretch.</strong> One verb spans "be born," "become," "happen," "come to
        be," even "be" — John 1:14's <Gk>ὁ λόγος σὰρξ ἐγένετο</Gk>, "the Word <em>became</em> flesh," leans
        on the verb's sense of entering a new state, deliberately unlike the <Gk>ἦν</Gk> ("was") of 1:1.
        The contrast between εἰμί and γίνομαι carries the prologue's theology.
      </P>
      <P>
        <strong>Watch σώζομαι.</strong> The passive of <Gk>σῴζω</Gk> functions almost as a deponent in
        texts like Acts 2:47 ("those being saved") — but here the passive is real and theological: God is
        the unstated saver. Divine passive and deponency can look identical; the lexicon and context
        separate them.
      </P>
    </LevelOnly>
  </>
)
