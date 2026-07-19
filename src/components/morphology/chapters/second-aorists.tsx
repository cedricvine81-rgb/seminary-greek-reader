/* ─────────────────────────────────────────────
   Chapter: 2nd Aorists

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const SECOND_AORISTS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: sing, sang — go, went</SectionHeading>
      <P>
        How does English make a past tense? Usually by adding <em>-ed</em>: walk → walked. But its oldest,
        commonest verbs refuse: sing → <em>sang</em>, drink → <em>drank</em>, go → <em>went</em>. They mark
        the past by <em>changing the word itself</em>. No English speaker thinks "sang" means something
        different from a would-be "singed" — it is just how that verb does its past.
      </P>
      <P>
        Greek has exactly this split. Most verbs form the aorist with the <Gk>σα</Gk> marker
        (<Gk>ἔλυσα</Gk> — a "1st aorist," the walk/walked type). But a club of very common verbs changes
        its <Term t="stem">stem</Term> instead: <Gk>λαμβάνω</Gk> "I take" → <Gk>ἔλαβον</Gk> "I took." These
        are the <strong>2nd aorists</strong> — the sing/sang club. The <em>meaning</em> is identical to any
        aorist; only the formation differs. And like English's strong verbs, they are learned as
        vocabulary: this chapter's table is really a vocabulary list.
      </P>
    </LevelOnly>

    {/* ── 2 · Recognition ────────────────────────────────── */}
    <SectionHeading>How to recognize one</SectionHeading>
    <P>
      Three clues, taken <em>together</em>: (1) an augment — past time; (2) <strong>no</strong>
      <Gk> σα/θη</Gk> marker; (3) a stem that differs from the present. The endings are the imperfect's —
      so the stem alone separates a 2nd aorist from an imperfect: <Gk>ἐλάμβανον</Gk> (imperfect, present
      stem, "I was taking") vs. <Gk>ἔλαβον</Gk> (2nd aorist, changed stem, "I took").
    </P>
    <TableAside
      sticky
      beginning={<>
        <p>A <strong>2nd (strong) aorist</strong> is still just a simple past ("I did"), but it forms by <em>changing the stem</em> instead of adding <Gk>σα</Gk>. You memorize these like vocabulary.</p>
        <Ex grc="λαμβάνω → ἔλαβον" en="I take → I took" />
        <p>It uses the imperfect's endings, but with a changed stem — read the row left to right: present → aorist → meaning.</p>
      </>}
      intermediate={<>
        <p>Three clues together identify it: an <strong>augment</strong>, a stem <strong>different from the present</strong>, and <strong>no σα/θη</strong> marker.</p>
        <p>Some are <em>suppletive</em> — they borrow a whole different root (<Gk>λέγω → εἶπον</Gk>, <Gk>ὁράω → εἶδον</Gk>). Learn the aorist stem as part of the verb's principal parts.</p>
      </>}
    >
    <MorphTable
      flush
      title="40 Most Common 2nd Aorist Verbs"
      headers={['Present', '2nd Aorist', 'Definition']}
      firstColIsData
      rows={[
        ['ἄγω', 'ἤγαγον', 'I lead, bring'],
        ['ἁμαρτάνω', 'ἥμαρτον', 'I sin, miss the mark'],
        ['ἀποθνῄσκω', 'ἀπέθανον', 'I die'],
        ['βάλλω', 'ἔβαλον', 'I throw, put'],
        ['γίνομαι', 'ἐγενόμην', 'I become, happen (mid.)'],
        ['γινώσκω', 'ἔγνων', 'I know'],
        ['ἔρχομαι', 'ἦλθον', 'I come, go'],
        ['εὑρίσκω', 'εὗρον', 'I find'],
        ['ἔχω', 'ἔσχον', 'I have, hold'],
        ['λαμβάνω', 'ἔλαβον', 'I take, receive'],
        ['λέγω', 'εἶπον', 'I say, speak'],
        ['ὁράω', 'εἶδον', 'I see'],
        ['πάσχω', 'ἔπαθον', 'I suffer, experience'],
        ['πίνω', 'ἔπιον', 'I drink'],
        ['πίπτω', 'ἔπεσον', 'I fall'],
        ['φεύγω', 'ἔφυγον', 'I flee'],
        ['ἀναβαίνω', 'ἀνέβην', 'I go up, ascend'],
        ['ἀποστέλλω', 'ἀπέστειλα / ἀπέστειλον', 'I send (away)'],
        ['ἄρχω', 'ἦρξα / ἦρξον', 'I rule; (mid.) begin'],
        ['εἰσέρχομαι', 'εἰσῆλθον', 'I enter'],
        ['ἐξέρχομαι', 'ἐξῆλθον', 'I go out'],
        ['καταβαίνω', 'κατέβην', 'I go down, descend'],
        ['κατέρχομαι', 'κατῆλθον', 'I come down'],
        ['κρίνω', 'ἔκρινα / ἔκρινον', 'I judge'],
        ['λείπω', 'ἔλιπον', 'I leave, abandon'],
        ['μανθάνω', 'ἔμαθον', 'I learn'],
        ['προσέρχομαι', 'προσῆλθον', 'I come/go to'],
        ['συνάγω', 'συνήγαγον', 'I gather together'],
        ['τίκτω', 'ἔτεκον', 'I give birth to'],
        ['τρέχω', 'ἔδραμον', 'I run'],
        ['ἀπέρχομαι', 'ἀπῆλθον', 'I go away, depart'],
        ['ἄρχομαι', 'ἠρξάμην', 'I begin (mid.)'],
        ['βαίνω', 'ἔβην', 'I go, walk'],
        ['εἶπον', '(see λέγω)', 'I said (suppletive aorist)'],
        ['κλέπτω', 'ἔκλεψα / ἔκλαπον', 'I steal'],
        ['λανθάνω', 'ἔλαθον', 'I escape notice'],
        ['ὄλλυμι', 'ὤλεσα / ὤλομην', 'I destroy; (mid.) perish'],
        ['πείθω', 'ἔπιθον', 'I persuade'],
        ['πέμπω', 'ἔπεμψα / ἔπεμπον', 'I send'],
        ['φέρω', 'ἤνεγκον', 'I carry, bear, bring'],
      ]}
      note="Some verbs have both 1st and 2nd aorist forms. Where both exist, the more common form is listed."
    />
    </TableAside>

    {/* ── 3 · Beyond the indicative ──────────────────────── */}
    <SectionHeading>The changed stem travels everywhere</SectionHeading>
    <P>
      The 2nd-aorist stem isn't only for the indicative — it powers the verb's aorist participles,
      infinitives, subjunctives, and imperatives too, all <em>without the augment</em> (augments belong to
      the indicative alone). So from <Gk>λαβ‑</Gk>: participle <Gk>λαβών</Gk> "having taken," infinitive
      <Gk> λαβεῖν</Gk> "to take," imperative <Gk>λάβε</Gk> "take!" Learn one changed stem, unlock five moods.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>One stem, many hats</AsideLabel>
        <Ex grc="ἔλαβον" en="I took (indicative — augment)" />
        <Ex grc="λαβών" en="having taken (participle — no augment)" />
        <Ex grc="λαβεῖν" en="to take (infinitive)" />
        <Ex grc="ἵνα λάβητε" en="that you may receive (subjunctive)" />
      </>}
      intermediate={<>
        <p>This is why recognizing bare stems matters more than memorizing full paradigms: <Gk>ἐλθών, ἰδών, εἰπών</Gk> open sentences constantly, and none carries an augment to help you.</p>
      </>}
    >
      <MorphTable flush title={gt("The 2nd-aorist stem (λαβ‑) across the moods")} headers={['Mood', 'Form', 'Translation']} firstColIsData
        rows={[
          ['Indicative', 'ἔλαβον', 'I took'],
          ['Participle', 'λαβών', 'having taken'],
          ['Infinitive', 'λαβεῖν', 'to take'],
          ['Subjunctive', 'λάβω', 'I may take'],
          ['Imperative', 'λάβε', 'take!'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>1st sg. and 3rd pl. are identical (<Gk>ἔλαβον</Gk> = "I took" or "they took") — exactly like the imperfect. Context decides.</li>
        <li>Imperfect vs. 2nd aorist: same endings, different stem — <Gk>ἐλάμβανον</Gk> "I was taking" vs. <Gk>ἔλαβον</Gk> "I took."</li>
        <li>Suppletive aorists borrow another root entirely: <Gk>λέγω → εἶπον</Gk>, <Gk>ὁράω → εἶδον</Gk>, <Gk>φέρω → ἤνεγκον</Gk> — like go → went. Sheer memorization, richly repaid.</li>
        <li>Compounds augment after the preposition: <Gk>ἐξῆλθον</Gk> "they went out" (<Gk>ἐξ + ἦλθον</Gk>).</li>
        <li><Gk>ἔγνων, ἔβην, ἀνέβην</Gk> attach endings straight to the stem vowel ("root aorists") — no connecting vowel at all.</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Ask: augment? σα? changed stem? Then check the table above.</>}
      items={[
        { q: <span className="normal-case">ἦλθεν εἰς τὴν πόλιν.</span>,
          a: <>"He came into the city" — 2nd aorist of <span className="normal-case">ἔρχομαι</span>, 3rd sg.</> },
        { q: <span className="normal-case">εἶπον οἱ μαθηταὶ αὐτῷ.</span>,
          a: <>"The disciples said to him" — suppletive aorist of <span className="normal-case">λέγω</span>, 3rd pl.</> },
        { q: <span className="normal-case">εὗρον τὸ παιδίον.</span>,
          a: <>"They found the child" (or "I found") — 2nd aorist of <span className="normal-case">εὑρίσκω</span>.</> },
        { q: <span className="normal-case">ἐλάμβανον τὰ δῶρα.</span>,
          a: <>"They were receiving the gifts" — <em>imperfect</em>, not aorist: the stem is the present's <span className="normal-case">λαμβαν‑</span>.</> },
        { q: <span className="normal-case">ἰδὼν τὸν ὄχλον, ἀνέβη εἰς τὸ ὄρος.</span>,
          a: <>"Seeing the crowd, he went up the mountain" — aorist participle <span className="normal-case">ἰδών</span> (εἶδον, no augment) + root aorist <span className="normal-case">ἀνέβη</span> (Matt 5:1).</> },
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>The 2nd-aorist club dominates NT narrative — every story runs on these forms.</>}
      links={[
        { label: <>Aorists of <span className="normal-case">ἔρχομαι</span> — ἦλθον and its compound family</>, lemma: 'ἔρχομαι', features: ['verb', 'aorist'] },
        { label: <>Aorists of <span className="normal-case">λέγω</span> — εἶπεν, the most common narrative verb of all</>, lemma: 'λέγω', features: ['verb', 'aorist'] },
        { label: <>Aorists of <span className="normal-case">γίνομαι</span> — ἐγένετο, "and it came to pass"</>, lemma: 'γίνομαι', features: ['verb', 'aorist'] },
        { label: <>Aorists of <span className="normal-case">ὁράω</span> — εἶδεν, "he saw"</>, lemma: 'ὁράω', features: ['verb', 'aorist'] },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: narrative's engine room</SectionHeading>
      <P>
        <strong>ἐγένετο as narrative glue.</strong> Luke especially loves opening scenes with
        <Gk> καὶ ἐγένετο</Gk> — the King James' "and it came to pass" — a Septuagintalism echoing Hebrew
        narrative style (<Gk>וַיְהִי</Gk>). It rarely needs translating as an event; it is a curtain-raiser.
        Spotting it tunes your ear to Luke's deliberately biblical register.
      </P>
      <P>
        <strong>Suppletion is information.</strong> When one verb's principal parts come from different
        roots (<Gk>λέγω / ἐρῶ / εἶπον</Gk>; <Gk>ὁράω / ὄψομαι / εἶδον</Gk>), each root once was its own
        verb. That is why <Gk>εἶδον</Gk> shares a root with "idea" and "video" (ϝιδ‑, "see") — etymology
        that occasionally illuminates, and always helps memory.
      </P>
      <P>
        <strong>First and second forms side by side.</strong> Some verbs show both aorists
        (<Gk>ἀπέστειλα / ἀπέστειλον</Gk>), and Koine was slowly regularizing toward 1st-aorist endings
        even on 2nd-aorist stems (<Gk>εἶπαν</Gk> for <Gk>εἶπον</Gk> in many manuscripts). Treat the
        variation as spelling, not meaning.
      </P>
    </LevelOnly>
  </>
)
