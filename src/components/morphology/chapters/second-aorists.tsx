/* ─────────────────────────────────────────────
   Chapter: 2nd Aorists

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'

// The second aorist is not a searchable CATEGORY: the index records tense simply as 'aorist',
// so these anchor on verbs that form one. See construct-presets.ts for why.
const SECOND_AORIST_SEARCHES = CONSTRUCT_PRESETS.find(g => g.heading === 'Verb forms — second aorist and deponents')!
  .presets.filter(p => p.label.startsWith('Second aorist'))

export const SECOND_AORISTS_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="second-aorists.h.start-english-sing">Start with English: sing, sang — go, went</SectionHeading>
      <P id="second-aorists.p.how-does-english">
        How does English make a past tense? Usually by adding <em>-ed</em>: walk → walked. But its oldest,
        commonest verbs refuse: sing → <em>sang</em>, drink → <em>drank</em>, go → <em>went</em>. They mark
        the past by <em>changing the word itself</em>. No English speaker thinks "sang" means something
        different from a would-be "singed" — it is just how that verb does its past.
      </P>
      <P id="second-aorists.p.greek-exactly-split">
        Greek has exactly this split. Most verbs form the aorist with the <Gk>σα</Gk> marker
        (<Gk>ἔλυσα</Gk> — a "1st aorist," the walk/walked type). But a club of very common verbs changes
        its <Term t="stem">stem</Term> instead: <Gk>λαμβάνω</Gk> "I take" → <Gk>ἔλαβον</Gk> "I took." These
        are the <strong>2nd aorists</strong> — the sing/sang club. The <em>meaning</em> is identical to any
        aorist; only the formation differs. And like English's strong verbs, they are learned as
        vocabulary: this chapter's table is really a vocabulary list.
      </P>
    </LevelOnly>

    {/* ── 2 · Recognition ────────────────────────────────── */}
    <SectionHeading id="second-aorists.h.how-recognize-one">How to recognize one</SectionHeading>
    <P id="second-aorists.p.three-clues-taken">
      Three clues, taken <em>together</em>: (1) an augment — past time; (2) <strong>no</strong>
      <Gk> σα/θη</Gk> marker; (3) a stem that differs from the present. The endings are the imperfect's —
      so the stem alone separates a 2nd aorist from an imperfect: <Gk>ἐλάμβανον</Gk> (imperfect, present
      stem, "I was taking") vs. <Gk>ἔλαβον</Gk> (2nd aorist, changed stem, "I took").
    </P>
    <TableAside
      sticky
      beginning={<>
        <p><Tr id="second-aorists.as.strong-aorist-still">A <strong>2nd (strong) aorist</strong> is still just a simple past ("I did"), but it forms by <em>changing the stem</em> instead of adding <Gk>σα</Gk>. You memorize these like vocabulary.</Tr></p>
        <Ex grc="λαμβάνω → ἔλαβον" en={<Tr id="second-aorists.ex.take-took">I take → I took</Tr>} />
        <p><Tr id="second-aorists.as.uses-imperfect's-endings">It uses the imperfect's endings, but with a changed stem — read the row left to right: present → aorist → meaning.</Tr></p>
      </>}
    >
    <MorphTable id="second-aorists.t1" tCols={[2]} striped
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
    <DropdownPractice id="second-aorists.d1"
      title="Practice — first or second aorist?"
      options={["1st aorist — σα identifier", "2nd aorist — changed stem"]}
      items={[
        { q: <span className="normal-case">ἔλυσα</span>, answer: "1st aorist — σα identifier" },
        { q: <span className="normal-case">εἶδον</span>, answer: "2nd aorist — changed stem" },
        { q: <span className="normal-case">ἔλαβεν</span>, answer: "2nd aorist — changed stem" },
        { q: <span className="normal-case">ἐπίστευσεν</span>, answer: "1st aorist — σα identifier" },
        { q: <span className="normal-case">ἦλθον</span>, answer: "2nd aorist — changed stem" },
        { q: <span className="normal-case">ἔγραψεν</span>, answer: "1st aorist — σα identifier" },
      ]}
    />

    <SectionHeading id="second-aorists.h.changed-stem-travels">The changed stem travels everywhere</SectionHeading>
    <P id="second-aorists.p.aorist-stem-isn't">
      The 2nd-aorist stem isn't only for the indicative — it powers the verb's aorist participles,
      infinitives, subjunctives, and imperatives too, all <em>without the augment</em> (augments belong to
      the indicative alone). So from <Gk>λαβ‑</Gk>: participle <Gk>λαβών</Gk> "having taken," infinitive
      <Gk> λαβεῖν</Gk> "to take," imperative <Gk>λάβε</Gk> "take!" Learn one changed stem, unlock five moods.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="second-aorists.al.one-stem-many">One stem, many hats</Tr></AsideLabel>
        <Ex grc="ἔλαβον" en={<Tr id="second-aorists.ex.took-indicative-augment">I took (indicative — augment)</Tr>} />
        <Ex grc="λαβών" en={<Tr id="second-aorists.ex.having-taken-participle">having taken (participle — no augment)</Tr>} />
        <Ex grc="λαβεῖν" en={<Tr id="second-aorists.ex.take-infinitive">to take (infinitive)</Tr>} />
        <Ex grc="ἵνα λάβητε" en={<Tr id="second-aorists.ex.may-receive-subjunctive">that you may receive (subjunctive)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="second-aorists.as.why-recognizing-bare">This is why recognizing bare stems matters more than memorizing full paradigms: <Gk>ἐλθών, ἰδών, εἰπών</Gk> open sentences constantly, and none carries an augment to help you.</Tr></p>
      </>}
    >
      <MorphTable id="second-aorists.t2" tCols={[0, 2]} flush title="The 2nd-aorist stem (λαβ‑) across the moods" headers={['Mood', 'Form', 'Translation']} firstColIsData
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
    <DropdownPractice id="second-aorists.d2"
      title="Practice — trace the stem"
      intro={<Tr id="second-aorists.intro.changed-stem-keeps">The changed stem keeps its identity in every mood.</Tr>}
      options={["ὁράω (εἶδον) — \"having seen\"", "λαμβάνω — \"to take\"", "ἔρχομαι — \"having come\"", "λέγω — \"having said\"", "ἐσθίω — \"to eat\"", "εὑρίσκω — \"having found\""]}
      items={[
        { q: <span className="normal-case">ἰδών</span>, answer: "ὁράω (εἶδον) — \"having seen\"" },
        { q: <span className="normal-case">λαβεῖν</span>, answer: "λαμβάνω — \"to take\"" },
        { q: <span className="normal-case">ἐλθών</span>, answer: "ἔρχομαι — \"having come\"" },
        { q: <span className="normal-case">εἰπών</span>, answer: "λέγω — \"having said\"" },
        { q: <span className="normal-case">φαγεῖν</span>, answer: "ἐσθίω — \"to eat\"" },
        { q: <span className="normal-case">εὑρών</span>, answer: "εὑρίσκω — \"having found\"" },
      ]}
    />

    <SectionHeading id="second-aorists.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="second-aorists.wo.identical-took-took">1st sg. and 3rd pl. are identical (<Gk>ἔλαβον</Gk> = "I took" or "they took") — exactly like the imperfect. Context decides.</Tr></li>
        <li><Tr id="second-aorists.wo.imperfect-aorist-same">Imperfect vs. 2nd aorist: same endings, different stem — <Gk>ἐλάμβανον</Gk> "I was taking" vs. <Gk>ἔλαβον</Gk> "I took."</Tr></li>
        <li><Tr id="second-aorists.wo.suppletive-aorists-borrow">Suppletive aorists borrow another root entirely: <Gk>λέγω → εἶπον</Gk>, <Gk>ὁράω → εἶδον</Gk>, <Gk>φέρω → ἤνεγκον</Gk> — like go → went. Sheer memorization, richly repaid.</Tr></li>
        <li><Tr id="second-aorists.wo.compounds-augment-after">Compounds augment after the preposition: <Gk>ἐξῆλθον</Gk> "they went out" (<Gk>ἐξ + ἦλθον</Gk>).</Tr></li>
        <li><Tr id="second-aorists.wo.attach-endings-straight"><Gk>ἔγνων, ἔβην, ἀνέβην</Gk> attach endings straight to the stem vowel ("root aorists") — no connecting vowel at all.</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="second-aorists.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="second-aorists.pr1"
      title="Practice — parse and translate"
      intro={<Tr id="second-aorists.intro.ask-augment-changed">Ask: augment? σα? changed stem? Then check the table above.</Tr>}
      items={[
        { q: <span className="normal-case">ἦλθεν εἰς τὴν πόλιν.</span>,
          a: <Tr id="second-aorists.pa.came-into-city">"He came into the city" — 2nd aorist of <span className="normal-case">ἔρχομαι</span>, 3rd sg.</Tr>},
        { q: <span className="normal-case">εἶπον οἱ μαθηταὶ αὐτῷ.</span>,
          a: <Tr id="second-aorists.pa.disciples-said-him">"The disciples said to him" — suppletive aorist of <span className="normal-case">λέγω</span>, 3rd pl.</Tr>},
        { q: <span className="normal-case">εὗρον τὸ παιδίον.</span>,
          a: <Tr id="second-aorists.pa.found-child-found">"They found the child" (or "I found") — 2nd aorist of <span className="normal-case">εὑρίσκω</span>.</Tr>},
        { q: <span className="normal-case">ἐλάμβανον τὰ δῶρα.</span>,
          a: <Tr id="second-aorists.pa.were-receiving-gifts">"They were receiving the gifts" — <em>imperfect</em>, not aorist: the stem is the present's <span className="normal-case">λαμβαν‑</span>.</Tr>},
        { q: <span className="normal-case">ἰδὼν τὸν ὄχλον, ἀνέβη εἰς τὸ ὄρος.</span>,
          a: <Tr id="second-aorists.pa.seeing-crowd-went">"Seeing the crowd, he went up the mountain" — aorist participle <span className="normal-case">ἰδών</span> (εἶδον, no augment) + root aorist <span className="normal-case">ἀνέβη</span> (Matt 5:1).</Tr>},
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="second-aorists.cs1"
      lesson="Lesson 6 · Second aorists (Mark 14:16)"
      items={[
        { words: [
          { w: "καὶ", parsing: "Conjunction", gloss: "and" },
          { w: "ἐξῆλθον", parsing: "2nd Aor Act Ind 3 Pl — ἐξέρχομαι", gloss: "went out" },
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "μαθηταὶ", parsing: "Nom Pl Masc — μαθητής", syntax: "Subject", gloss: "disciples" },
          { w: "καὶ", parsing: "Conjunction", gloss: "and" },
          { w: "ἦλθον", parsing: "2nd Aor Act Ind 3 Pl — ἔρχομαι", gloss: "came" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "into" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "πόλιν", parsing: "Acc Sg Fem — πόλις", gloss: "city" },
          { w: "καὶ", parsing: "Conjunction", gloss: "and" },
          { w: "εὗρον", parsing: "2nd Aor Act Ind 3 Pl — εὑρίσκω", gloss: "found" },
          { w: "καθὼς", parsing: "Conjunction", gloss: "just as" },
          { w: "εἶπεν", parsing: "2nd Aor Act Ind 3 Sg — λέγω", gloss: "he had said" },
          { w: "αὐτοῖς.", parsing: "Dat Pl Masc — αὐτός", syntax: "Dative of Indirect Object", gloss: "to them" },
        ],
          translation: "And the disciples went out and came into the city and found (it) just as he had told them. (Mark 14:16)",
          note: "Four second aorists in one verse — every one a changed stem with imperfect-style endings.",
        },
      ]}
    />

    <HomeworkAssignments chapter="second-aorists" />

    {/* Syntax is a relation between words, which the one-word morphology search can't express;
        these open Construct search instead. */}
    <LiveExamples
      intro={<Tr id="second-aorists.intro.second-aorist-can't">The second aorist can't be searched as a category — the corpus records the tense simply as aorist — so these show every aorist of verbs that form one:</Tr>}
      links={SECOND_AORIST_SEARCHES.map(pr => ({
        label: <>{pr.label} <span className="text-gray-400">— {pr.approx.toLocaleString()} in the NT</span></>,
        construct: pr.query,
      }))}
    />

    <LiveExamples
      intro={<Tr id="second-aorists.intro.aorist-club-dominates">The 2nd-aorist club dominates NT narrative — every story runs on these forms.</Tr>}
      links={[
        { label: <Tr id="second-aorists.le.aorists-compound-family">Aorists of <span className="normal-case">ἔρχομαι</span> — ἦλθον and its compound family</Tr>, lemma: 'ἔρχομαι', features: ['verb', 'aorist'] },
        { label: <Tr id="second-aorists.le.aorists-most-common">Aorists of <span className="normal-case">λέγω</span> — εἶπεν, the most common narrative verb of all</Tr>, lemma: 'λέγω', features: ['verb', 'aorist'] },
        { label: <Tr id="second-aorists.le.aorists-came-pass">Aorists of <span className="normal-case">γίνομαι</span> — ἐγένετο, "and it came to pass"</Tr>, lemma: 'γίνομαι', features: ['verb', 'aorist'] },
        { label: <Tr id="second-aorists.le.aorists-saw">Aorists of <span className="normal-case">ὁράω</span> — εἶδεν, "he saw"</Tr>, lemma: 'ὁράω', features: ['verb', 'aorist'] },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
  </>
)
