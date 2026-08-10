/* ─────────────────────────────────────────────
   Chapter: Deponent Verbs

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'

// Deponency is not a searchable CATEGORY: the index records voice as active/middle/passive, so
// these anchor on verbs that exhibit it. See construct-presets.ts for why.
const DEPONENT_SEARCHES = CONSTRUCT_PRESETS.find(g => g.heading === 'Verb forms — second aorist and deponents')!
  .presets.filter(p => p.label.startsWith('Deponent'))

export const DEPONENTS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="deponents.h.start-english-forms">Start with English: forms that don't mean what they look like</SectionHeading>
      <P id="deponents.p.english-verbs-whose">
        English has verbs whose form and meaning part company. "I <em>was born</em> in June" — passive in
        form, but you aren't picturing anyone doing the "borning"; it just tells what happened to you.
        Nobody is misled, because you learned the expression whole.
      </P>
      <P id="deponents.p.greek-whole-club">
        Greek has a whole club like that: verbs that wear <strong>middle/passive endings</strong>
        (their dictionary form ends in <Gk>‑ομαι</Gk>, not <Gk>‑ω</Gk>) but carry a plain
        <strong> active meaning</strong>. <Gk>ἔρχομαι</Gk> <em>looks</em> like "I am being come" — it just
        means "I come / go." These are <strong>deponent</strong> verbs, from the Latin for "laid aside":
        they have laid their active forms aside. Your job is simple: parse the form as the middle/passive
        it is, then translate with the active meaning the lexicon gives. No hidden passiveness to hunt for.
      </P>
    </LevelOnly>

    {/* ── 2 · Spotting them ──────────────────────────────── */}
    <SectionHeading id="deponents.h.how-spot-one">How you spot one</SectionHeading>
    <P id="deponents.p.dictionary-form-tells">
      The dictionary form tells you. A normal verb's lexical form ends in <Gk>‑ω</Gk> (<Gk>λύω</Gk>); a
      deponent's ends in <Gk>‑ομαι</Gk> (<Gk>ἔρχομαι, γίνομαι, δύναμαι</Gk>). And frequency is on your
      side — a handful of deponents are among the most common verbs in the entire New Testament:
    </P>
    <TableAside
      sticky
      beginning={<>
        <p><Tr id="deponents.as.deponent-looks-middle">A <strong>deponent</strong> looks middle/passive (ending in <Gk>‑ομαι</Gk>) but means something <em>active</em>. Just translate it actively — the middle/passive form is its only form.</Tr></p>
        <Ex grc="ἔρχομαι" en={<Tr id="deponents.ex.come">I come / go</Tr>} />
        <Ex grc="ἀποκρίνομαι" en={<Tr id="deponents.ex.answer">I answer</Tr>} />
      </>}
    >
    <MorphTable id="deponents.t1" tCols={[3]} striped
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
    <DropdownPractice id="deponents.d1"
      title="Practice — deponent or not?"
      intro={<Tr id="deponents.intro.middle-passive-form">Middle/passive form; does the verb have an active form in use?</Tr>}
      options={["Deponent — translate as active", "Ordinary middle/passive"]}
      items={[
        { q: <span className="normal-case">ἔρχεται</span>, answer: "Deponent — translate as active", note: <Tr id="deponents.n.erchetai">"He comes" — ἔρχομαι has no active form.</Tr> },
        { q: <span className="normal-case">λύεται</span>, answer: "Ordinary middle/passive", note: <Tr id="deponents.n.luetai">"He is being loosed."</Tr> },
        { q: <span className="normal-case">δέχονται</span>, answer: "Deponent — translate as active" },
        { q: <span className="normal-case">γράφεται</span>, answer: "Ordinary middle/passive", note: <Tr id="deponents.n.graphetai">"It is written."</Tr> },
        { q: <span className="normal-case">πορεύονται</span>, answer: "Deponent — translate as active" },
        { q: <span className="normal-case">ἀποκρίνεται</span>, answer: "Deponent — translate as active" },
      ]}
    />

    <SectionHeading id="deponents.h.two-sub-clubs">Two sub-clubs: middle and passive deponents</SectionHeading>
    <P id="deponents.p.deponents-split-which">
      Deponents split by which non-active forms they use in the aorist. <strong>Middle deponents</strong> take
      middle aorists: <Gk>ἐδεξάμην</Gk> "I received." <strong>Passive deponents</strong> take passive-looking
      aorists — with the <Gk>θη</Gk> marker — still meaning active: <Gk>ἀπεκρίθη</Gk> "he answered,"
      <Gk> ἐπορεύθην</Gk> "I went." So a <Gk>θη</Gk> form is not automatically passive in meaning; check
      whether the verb is deponent before translating "was …ed."
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἀπεκρίθη ὁ Ἰησοῦς" en={<Tr id="deponents.ex.jesus-answered-was">Jesus answered (not “was answered”!)</Tr>} />
        <Ex grc="ἐπορεύθησαν" en={<Tr id="deponents.ex.went-journeyed">they went / journeyed</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="deponents.as.oddities-worth-knowing">Oddities worth knowing: <Gk>ἔρχομαι</Gk> is deponent in the present but its aorist <Gk>ἦλθον</Gk> is a plain 2nd-aorist <em>active</em>; and <Gk>θέλω</Gk> is active in the present but deponent-futured. "Semi-deponent" covers these mixed careers.</Tr></p>
      </>}
    >
      <MorphTable id="deponents.t2" tCols={[0, 1, 3]} flush title="The two sub-clubs" headers={['Type', 'Aorist looks', 'Example', 'Means']} firstColIsData
        rows={[
          ['Middle deponent', 'middle (‑σάμην)', 'ἐδεξάμην', 'I received'],
          ['Passive deponent', 'passive (‑θην)', 'ἀπεκρίθην', 'I answered'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <ClassSentences id="deponents.cs1"
      lesson="Deponents in the text"
      items={[
        { words: [
          { w: "ἀπεκρίθη", parsing: "Aor Pass-Dep Ind 3 Sg — ἀποκρίνομαι", gloss: "answered" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "Ἰησοῦς", parsing: "Nom Sg Masc — Ἰησοῦς", syntax: "Subject", gloss: "Jesus" },
          { w: "καὶ", parsing: "Conjunction", gloss: "and" },
          { w: "εἶπεν", parsing: "2nd Aor Act Ind 3 Sg — λέγω", gloss: "said" },
          { w: "αὐτῷ.", parsing: "Dat Sg Masc — αὐτός", syntax: "Dative of Indirect Object", gloss: "to him" },
        ],
          translation: "Jesus answered and said to him.",
          note: "The Gospels’ favourite formula — a passive-deponent with active meaning.",
        },
        { words: [
          { w: "ἐπορεύθησαν", parsing: "Aor Pass-Dep Ind 3 Pl — πορεύομαι", gloss: "they went" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "into" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "πόλιν.", parsing: "Acc Sg Fem — πόλις (3rd decl.)", gloss: "city" },
        ],
          translation: "They went into the city.",
        },
      ]}
    />

    <SectionHeading id="deponents.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="deponents.wo.every-form-deponent">Not every <Gk>‑ομαι</Gk> form is deponent! <Gk>λύομαι</Gk> is the genuine middle/passive of <Gk>λύω</Gk>. The test is the <em>lexicon</em>: if no active form exists, it's deponent.</Tr></li>
        <li><Tr id="deponents.wo.aorist-passive-deponent">A <Gk>θη</Gk> aorist from a passive deponent means <em>active</em>: <Gk>ἀπεκρίθη</Gk> "he answered." Don't force "was answered."</Tr></li>
        <li><Tr id="deponents.wo.everywhere-became-happened"><Gk>ἐγένετο</Gk> (from <Gk>γίνομαι</Gk>) is everywhere: "became, happened, came to be, was." Small verb, wide range.</Tr></li>
        <li><Tr id="deponents.wo.deponent-participles-keep">Deponent participles keep the <Gk>‑μεν‑</Gk>/middle look with active meaning: <Gk>ἐρχόμενος</Gk> "coming," <Gk>πορευθέντες</Gk> "having gone" (Matt 28:19!).</Tr></li>
        <li><Tr id="deponents.wo.semi-deponents-change">Semi-deponents change club mid-career: active present, deponent future (<Gk>λαμβάνω → λήμψομαι</Gk>; <Gk>γινώσκω → γνώσομαι</Gk>).</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="deponents.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="deponents.pr1"
      title="Practice — parse and translate"
      intro={<Tr id="deponents.intro.parse-form-honestly">Parse the form honestly (middle/passive!), then translate actively.</Tr>}
      items={[
        { q: <span className="normal-case">ἔρχεται πρὸς αὐτόν.</span>,
          a: <Tr id="deponents.pa.comes-him-present">"He comes to him" — present deponent, 3rd sg.</Tr>},
        { q: <span className="normal-case">ἀπεκρίθη αὐτοῖς ὁ Ἰησοῦς.</span>,
          a: <Tr id="deponents.pa.jesus-answered-them">"Jesus answered them" — aorist <em>passive in form</em> (θη), active in meaning: passive deponent.</Tr>},
        { q: <span className="normal-case">οὐ δύναμαι ποιεῖν οὐδέν.</span>,
          a: <Tr id="deponents.pa.can-nothing-infinitive">"I can do nothing" — δύναμαι + infinitive (John 5:30; note the stacked negatives reinforcing, not cancelling).</Tr>},
        { q: <span className="normal-case">ἐγένετο ἄνθρωπος ἀπεσταλμένος παρὰ θεοῦ.</span>,
          a: <Tr id="deponents.pa.there-came-arose">"There came (arose) a man sent from God" — ἐγένετο, aorist middle deponent (John 1:6).</Tr>},
        { q: <span className="normal-case">προσηύξατο τῷ θεῷ.</span>,
          a: <Tr id="deponents.pa.prayed-god-aorist">"He prayed to God" — aorist middle of the deponent προσεύχομαι.</Tr>},
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="deponents.cs2"
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

    {/* Syntax is a relation between words, which the one-word morphology search can't express;
        these open Construct search instead. */}
    <LiveExamples
      intro={<Tr id="deponents.intro.deponency-itself-can't">Deponency itself can't be searched — the corpus records the form (middle or passive), not the category — so these show the forms of verbs that are deponent:</Tr>}
      links={DEPONENT_SEARCHES.map(pr => ({
        label: <>{pr.label} <span className="text-gray-400">— {pr.approx.toLocaleString()} in the NT</span></>,
        construct: pr.query,
      }))}
    />

    <LiveExamples
      intro={<Tr id="deponents.intro.four-deponents-cannot">Four deponents you cannot read a page without.</Tr>}
      links={[
        { label: <Tr id="deponents.le.every-form-become">Every form of <span className="normal-case">γίνομαι</span> — become / happen / be</Tr>, lemma: 'γίνομαι' },
        { label: <Tr id="deponents.le.every-form-come">Every form of <span className="normal-case">ἔρχομαι</span> — come / go (with its compounds)</Tr>, lemma: 'ἔρχομαι' },
        { label: <Tr id="deponents.le.every-form-gospels'">Every form of <span className="normal-case">ἀποκρίνομαι</span> — the Gospels' "answered"</Tr>, lemma: 'ἀποκρίνομαι' },
        { label: <Tr id="deponents.le.every-form-journey">Every form of <span className="normal-case">πορεύομαι</span> — go / journey</Tr>, lemma: 'πορεύομαι' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="deponents.h.going-deeper-deponent">Going deeper: is "deponent" the right name?</SectionHeading>
      <P id="deponents.p.middle-voice-reappraisal">
        <strong>The middle-voice reappraisal.</strong> A growing consensus in Greek linguistics holds that
        most "deponents" never laid anything aside — their middle form fits their meaning. Verbs of motion
        (<Gk>ἔρχομαι, πορεύομαι</Gk>), emotion (<Gk>φοβέομαι</Gk>), perception, and self-involving action
        are exactly where languages with a middle voice use it: the subject is inside the event, affected
        by it. On this view the label "deponent" describes <em>English's</em> lack of a middle voice, not a
        defect in the Greek. For translation nothing changes; for feel, much does — <Gk>δέχομαι</Gk> "I
        receive (into my own hands)" is middle to its bones.
      </P>
      <P id="deponents.p.full-stretch-one">
        <strong>γίνομαι at full stretch.</strong> One verb spans "be born," "become," "happen," "come to
        be," even "be" — John 1:14's <Gk>ὁ λόγος σὰρξ ἐγένετο</Gk>, "the Word <em>became</em> flesh," leans
        on the verb's sense of entering a new state, deliberately unlike the <Gk>ἦν</Gk> ("was") of 1:1.
        The contrast between εἰμί and γίνομαι carries the prologue's theology.
      </P>
      <P id="deponents.p.watch-passive-functions">
        <strong>Watch σώζομαι.</strong> The passive of <Gk>σῴζω</Gk> functions almost as a deponent in
        texts like Acts 2:47 ("those being saved") — but here the passive is real and theological: God is
        the unstated saver. Divine passive and deponency can look identical; the lexicon and context
        separate them.
      </P>
    </LevelOnly>
  </>
)
