/* ─────────────────────────────────────────────
   Chapter: μι-Verbs

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'

export const MI_VERBS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="mi-verbs.h.start-english-irregular">Start with English: the irregular VIPs</SectionHeading>
      <P id="mi-verbs.p.every-language-keeps">
        Every language keeps its most-used verbs in odd old shapes. English "to be" (am, is, was),
        "go" (went!), "do" (did, done) — beginners must simply learn them, because they appear on every
        page. Greek is the same: a small club of verbs ends in <Gk>‑μι</Gk> instead of <Gk>‑ω</Gk>, keeps
        some archaic habits — and includes words you cannot read a chapter without:
        <Gk> δίδωμι</Gk> "I give," <Gk>τίθημι</Gk> "I put," <Gk>ἵστημι</Gk> "I stand," <Gk>ἀφίημι</Gk> "I
        forgive / leave."
      </P>
      <P id="mi-verbs.p.good-news-strangeness">
        The good news: the strangeness is concentrated. In the present and imperfect, μι-verbs look alien;
        everywhere else they behave nearly like <Gk>λύω</Gk>. Learn two habits and one marker, below, and
        the club stops being intimidating.
      </P>
    </LevelOnly>

    {/* ── 2 · The two stems ──────────────────────────────── */}
    <SectionHeading id="mi-verbs.h.habit-one-two">Habit one: two stems</SectionHeading>
    <P id="mi-verbs.p.each-verb-keeps">
      Each μι-verb keeps two <Term t="stem">stems</Term>. The short <strong>verb stem</strong>
      (<Gk>δο‑</Gk>, <Gk>θε‑</Gk>, <Gk>στα‑</Gk>) powers the future, aorist, and perfect. The longer
      <strong> present stem</strong> doubles the first consonant with an iota — <Gk>δι‑δο</Gk>,
      <Gk> τι‑θε</Gk>, <Gk>ἱ‑στα</Gk> — and powers only the present and imperfect. That iota is your
      diagnostic: <strong>see iota-reduplication → present or imperfect. No iota → any other tense.</strong>
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="mi-verbs.al.meanings">Meanings</Tr></AsideLabel>
        <Ex grc="δίδωμι" en={<Tr id="mi-verbs.ex.give">I give</Tr>} />
        <Ex grc="τίθημι" en={<Tr id="mi-verbs.ex.put-place">I put / place</Tr>} />
        <Ex grc="ἵστημι" en={<Tr id="mi-verbs.ex.stand-set">I stand / set</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="mi-verbs.as.each-two-stems">Each has <strong>two stems</strong>: the reduplicated <em>present</em> stem (longer) for present + imperfect, and the shorter <em>verb</em> stem for future, aorist + perfect.</Tr></p>
      </>}
    >
      <MorphTable id="mi-verbs.t1" flush title="‒μι Verb Stems" headers={['-μι verb','Verb stem','Present stem']}
        rows={[
          ['δίδωμι','δο / δω','διδο / διδω'],
          ['τίθημι','θε / θη','τιθε / τιθη'],
          ['ἵστημι','στα / στη','ἱστα / ἱστη'],
        ]}
        note="The reduplicated present stem is lengthened in the singular (διδο → διδω, τιθε → τιθη, ἱστα → ἱστη)."
      />
    </TableAside>
    <P id="mi-verbs.p.habit-two-hides">
      Habit two hides in that note: the stem vowel plays <strong>short / long</strong> — long in the
      singular (<Gk>δίδωμι, δίδως, δίδωσι</Gk>), short in the plural (<Gk>δίδομεν, δίδοτε</Gk>). Watch the
      pattern run down the present tense:
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="mi-verbs.as.iota-reduplication-marks">The iota reduplication (<Gk>δι‑, τι‑, ἱ‑</Gk>) marks the present. See it → the verb is present or imperfect.</Tr></p>
        <Ex grc="δίδωμί σοι" en={<Tr id="mi-verbs.ex.give-2">I give to you</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="mi-verbs.as.endings-attach-directly">Endings attach directly to the long stem (no connecting vowel), which is why the singular looks so different from <Gk>‑ω</Gk> verbs; the plural shortens the stem again.</Tr></p>
      </>}
    >
      <MorphTable id="mi-verbs.t2" flush title="Present Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
        rows={[
          ['Sg.','1.','δίδωμι','τίθημι','ἵστημι'],
          ['','2.','δίδως','τίθης','ἵστης'],
          ['','3.','δίδωσι(ν)','τίθησι(ν)','ἵστησι(ν)'],
          ['Pl.','1.','δίδομεν','τίθεμεν','ἵσταμεν'],
          ['','2.','δίδοτε','τίθετε','ἵστατε'],
          ['','3.','διδόασι(ν)','τιθέασι(ν)','ἱστᾶσι(ν)'],
        ]}
      />
    </TableAside>

    {/* ── 3 · The κα aorist ──────────────────────────────── */}
    <DropdownPractice id="mi-verbs.d1"
      title="Practice — which μι-verb?"
      intro={<Tr id="mi-verbs.intro.spot-stem">Spot the stem: διδ(ο)-, τιθ(ε)-, (ἱ)στ(α)-, ἀφι(ε)-.</Tr>}
      options={["δίδωμι — give", "τίθημι — place", "ἵστημι — stand", "ἀφίημι — forgive / leave"]}
      items={[
        { q: <span className="normal-case">δίδομεν</span>, answer: "δίδωμι — give" },
        { q: <span className="normal-case">τίθησιν</span>, answer: "τίθημι — place" },
        { q: <span className="normal-case">ἕστηκεν</span>, answer: "ἵστημι — stand" },
        { q: <span className="normal-case">ἀφίεμεν</span>, answer: "ἀφίημι — forgive / leave" },
        { q: <span className="normal-case">δοθήσεται</span>, answer: "δίδωμι — give" },
        { q: <span className="normal-case">σταθήσεται</span>, answer: "ἵστημι — stand" },
      ]}
    />

    <SectionHeading id="mi-verbs.h.marker-aorist">The marker: a ‑κα aorist</SectionHeading>
    <P id="mi-verbs.p.aorist-verbs-drop">
      In the aorist, μι-verbs drop the iota (of course — not present tense any more) and take
      <Gk> ‑κα</Gk> where ordinary verbs take <Gk>‑σα</Gk>: <Gk>ἔδωκα</Gk> "I gave," <Gk>ἔθηκα</Gk> "I
      put." Same augment, same endings as a first aorist — just a different flag letter.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="mi-verbs.as.iota-here-aorist">No iota here — the aorist drops the reduplication and takes a <Gk>‑κα</Gk> marker (not <Gk>‑σα</Gk>).</Tr></p>
        <Ex grc="ἔδωκα" en={<Tr id="mi-verbs.ex.gave">I gave</Tr>} />
        <Ex grc="ἔθηκα" en={<Tr id="mi-verbs.ex.put">I put</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="mi-verbs.as.aorist-can-look">The <Gk>‑κα</Gk> aorist can look like a perfect — tell them apart by reduplication (perfect) and context. <Gk>ἵστημι</Gk> keeps its <Gk>‑σα</Gk> (<Gk>ἔστησα</Gk>) and is transitive here ("I set up").</Tr></p>
      </>}
    >
      <MorphTable id="mi-verbs.t3" flush title="Aorist Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
        rows={[
          ['Sg.','1.','ἔδωκα','ἔθηκα','ἔστησα'],
          ['','2.','ἔδωκας','ἔθηκας','ἔστησας'],
          ['','3.','ἔδωκε(ν)','ἔθηκε(ν)','ἔστησε(ν)'],
          ['Pl.','1.','ἐδώκαμεν','ἐθήκαμεν','ἐστήσαμεν'],
          ['','2.','ἐδώκατε','ἐθήκατε','ἐστήσατε'],
          ['','3.','ἔδωκαν','ἔθηκαν','ἔστησαν'],
        ]}
      />
    </TableAside>

    {/* ── 4 · The compound family ────────────────────────── */}
    <DropdownPractice id="mi-verbs.d2"
      title="Practice — aorist or perfect?"
      intro={<Tr id="mi-verbs.intro.both-wear-reduplication">Both wear κα — reduplication settles it.</Tr>}
      options={["κ-aorist", "Perfect — reduplicated"]}
      items={[
        { q: <span className="normal-case">ἔδωκεν</span>, answer: "κ-aorist" },
        { q: <span className="normal-case">δέδωκεν</span>, answer: "Perfect — reduplicated" },
        { q: <span className="normal-case">ἔθηκεν</span>, answer: "κ-aorist" },
        { q: <span className="normal-case">τέθεικεν</span>, answer: "Perfect — reduplicated" },
        { q: <span className="normal-case">ἀφῆκεν</span>, answer: "κ-aorist" },
        { q: <span className="normal-case">ἐδώκαμεν</span>, answer: "κ-aorist" },
      ]}
    />

    <SectionHeading id="mi-verbs.h.family-you'll-actually">The family you'll actually read: compounds</SectionHeading>
    <P id="mi-verbs.p.much-club's-frequency">
      Much of the μι-club's NT frequency comes through compounds — preposition + μι-verb — and several are
      theological heavyweights:
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἀφίημι τὰς ἁμαρτίας" en={<Tr id="mi-verbs.ex.forgive-sins">I forgive sins</Tr>} />
        <Ex grc="παρέδωκεν αὐτόν" en={<Tr id="mi-verbs.ex.handed-him-over">he handed him over</Tr>} />
      </>}
    >
      <MorphTable id="mi-verbs.t4" tCols={[2]} flush title="Key μι-compounds" headers={['Compound', 'Built from', 'Meaning']} firstColIsData
        rows={[
          ['ἀφίημι', 'ἀπό + ἵημι', 'forgive, leave, allow'],
          ['παραδίδωμι', 'παρά + δίδωμι', 'hand over, entrust, betray'],
          ['ἀποδίδωμι', 'ἀπό + δίδωμι', 'give back, repay'],
          ['ἐπιτίθημι', 'ἐπί + τίθημι', 'lay upon (hands)'],
          ['ἀνίστημι', 'ἀνά + ἵστημι', 'raise up; rise'],
        ]}
      />
    </TableAside>

    {/* ── 5 · Watch out ──────────────────────────────────── */}
    <ClassSentences id="mi-verbs.cs1"
      lesson="μι-verbs in the text"
      items={[
        { words: [
          { w: "ἄφες", parsing: "2nd Aor Act Impv 2 Sg — ἀφίημι", gloss: "forgive!" },
          { w: "ἡμῖν", parsing: "Dat Pl — ἐγώ", syntax: "Dative of Indirect Object", gloss: "us" },
          { w: "τὰ", parsing: "Article — Acc Pl Neut", gloss: "the" },
          { w: "ὀφειλήματα", parsing: "Acc Pl Neut — ὀφείλημα (3rd decl.)", syntax: "Direct Object", gloss: "debts" },
          { w: "ἡμῶν.", parsing: "Gen Pl — ἐγώ", syntax: "Genitive of Possession", gloss: "our" },
        ],
          translation: "Forgive us our debts.",
          note: "Matthew 6:12 — the Lord’s Prayer.",
        },
      ]}
    />

    <SectionHeading id="mi-verbs.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="mi-verbs.wo.aorist-perfect-aorist"><Gk>‑κα</Gk> aorist vs. perfect: <Gk>ἔδωκα</Gk> (aorist — augment, no reduplication) vs. <Gk>δέδωκα</Gk> (perfect — reduplication). Front of the word decides.</Tr></li>
        <li><Tr id="mi-verbs.wo.swings-between-transitive"><Gk>ἵστημι</Gk> swings between transitive "I set / place" (1st aorist <Gk>ἔστησα</Gk>) and intransitive "I stand" (2nd aorist <Gk>ἔστην</Gk>); its perfect <Gk>ἕστηκα</Gk> means a present state — "I stand."</Tr></li>
        <li><Tr id="mi-verbs.wo.rough-breathing-forms">The rough breathing on <Gk>ἵστημι</Gk> forms (<Gk>ἱ‑</Gk>) <em>is</em> the reduplication — an "h" where δ and τ doubled with iota.</Tr></li>
        <li><Tr id="mi-verbs.wo.verb-aorist-imperatives">μι-verb aorist imperatives are short and common: <Gk>δός</Gk> "give!", <Gk>ἄφες</Gk> "forgive!", <Gk>θές</Gk> "put!"</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="mi-verbs.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="mi-verbs.pr1"
      title="Practice — parse and translate"
      intro={<Tr id="mi-verbs.intro.front-word-first">Front of the word first: iota? augment? reduplication?</Tr>}
      items={[
        { q: <span className="normal-case">δίδωσιν</span>,
          a: <Tr id="mi-verbs.pa.present-active-gives">Present active 3rd sg. — "he gives." Iota reduplication = present system.</Tr>},
        { q: <span className="normal-case">ἔδωκεν αὐτῷ ὁ θεός.</span>,
          a: <Tr id="mi-verbs.pa.god-gave-him">"God gave (it) to him" — aorist (augment + κα, no iota).</Tr>},
        { q: <span className="normal-case">δέδωκα</span>,
          a: <Tr id="mi-verbs.pa.perfect-active-given">Perfect active 1st sg. — "I have given." Reduplication (δε‑) + κα.</Tr>},
        { q: <span className="normal-case">τίθησιν τὴν ψυχὴν αὐτοῦ.</span>,
          a: <Tr id="mi-verbs.pa.lays-down-his">"He lays down his life" — present of τίθημι (John 10:11's shepherd).</Tr>},
        { q: <span className="normal-case">ἄφες ἡμῖν τὰ ὀφειλήματα ἡμῶν.</span>,
          a: <Tr id="mi-verbs.pa.forgive-our-debts">"Forgive us our debts" — aorist imperative of ἀφίημι (Matt 6:12).</Tr>},
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="mi-verbs.cs2"
      lesson="Lesson 9 · μι-verbs"
      items={[
        { words: [
          { w: "διδόασιν", parsing: "Pres Act Ind 3 Pl — δίδωμι", gloss: "they are giving" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "ἄρτον", parsing: "Acc Sg Masc — ἄρτος", syntax: "Direct Object", gloss: "bread" },
          { w: "τοῖς", parsing: "Article — Dat Pl Neut", gloss: "to the" },
          { w: "τέκνοις.", parsing: "Dat Pl Neut — τέκνον", syntax: "Dative of Indirect Object", gloss: "children" },
        ],
          translation: "They are giving the bread to the children.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "θεὸς", parsing: "Nom Sg Masc — θεός", syntax: "Subject", gloss: "God" },
          { w: "ἀνέστησεν", parsing: "Aor Act Ind 3 Sg — ἀνίστημι (transitive)", gloss: "raised" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "Χριστὸν", parsing: "Acc Sg Masc — Χριστός", syntax: "Direct Object", gloss: "Christ" },
          { w: "ἐκ", parsing: "Preposition + genitive", gloss: "from" },
          { w: "νεκρῶν.", parsing: "Gen Pl Masc — νεκρός", gloss: "the dead" },
        ],
          translation: "God raised Christ from the dead.",
        },
        { words: [
          { w: "ἔστημεν", parsing: "2nd Aor Act Ind 1 Pl — ἵστημι (intransitive)", gloss: "we stood" },
          { w: "μετὰ", parsing: "Preposition + genitive", gloss: "with" },
          { w: "τῶν", parsing: "Article — Gen Pl Masc", gloss: "the" },
          { w: "μαθητῶν", parsing: "Gen Pl Masc — μαθητής", gloss: "disciples" },
          { w: "ἐν", parsing: "Preposition + dative", gloss: "in" },
          { w: "τῷ", parsing: "Article — Dat Sg Neut", gloss: "the" },
          { w: "ἱερῷ.", parsing: "Dat Sg Neut — ἱερόν", gloss: "temple" },
        ],
          translation: "We stood with the disciples in the temple.",
        },
        { words: [
          { w: "ἀφέντες", parsing: "2nd Aor Act Ptcp Nom Pl Masc — ἀφίημι", syntax: "Adverbial Participle (Temporal)", gloss: "having left" },
          { w: "τὰ", parsing: "Article — Acc Pl Neut", gloss: "the" },
          { w: "πλοῖα", parsing: "Acc Pl Neut — πλοῖον", syntax: "Direct Object", gloss: "boats" },
          { w: "ἠκολούθησαν", parsing: "Aor Act Ind 3 Pl — ἀκολουθέω", gloss: "they followed" },
          { w: "αὐτῷ.", parsing: "Dat Sg Masc — αὐτός", gloss: "him" },
        ],
          translation: "When they had left the boats, they followed him.",
          note: "ἀκολουθέω takes its object in the dative.",
        },
      ]}
    />

    <HomeworkAssignments chapter="mi-verbs" />

    <LiveExamples
      intro={<Tr id="mi-verbs.intro.club-wild-watch">The μι-club in the wild — watch for iota vs. augment vs. reduplication at the front.</Tr>}
      links={[
        { label: <Tr id="mi-verbs.le.every-form-model">Every form of <span className="normal-case">δίδωμι</span> — the model μι-verb</Tr>, lemma: 'δίδωμι' },
        { label: <Tr id="mi-verbs.le.every-form-forgive">Every form of <span className="normal-case">ἀφίημι</span> — "forgive / leave / allow"</Tr>, lemma: 'ἀφίημι' },
        { label: <Tr id="mi-verbs.le.every-form-hand">Every form of <span className="normal-case">παραδίδωμι</span> — "hand over / betray"</Tr>, lemma: 'παραδίδωμι' },
        { label: <Tr id="mi-verbs.le.every-form-stand">Every form of <span className="normal-case">ἵστημι</span> — "stand / set"</Tr>, lemma: 'ἵστημι' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="mi-verbs.h.going-deeper-small">Going deeper: small club, heavy theology</SectionHeading>
      <P id="mi-verbs.p.stative-perfect-because">
        <strong>ἵστημι's stative perfect.</strong> Because its perfect <Gk>ἕστηκα</Gk> denotes the
        <em> state</em> of standing, it translates as an English present: <Gk>ἰδοὺ ἕστηκα ἐπὶ τὴν θύραν</Gk>,
        "behold, I <em>stand</em> at the door" (Rev 3:20). A "have stood" here would miss the living
        posture the perfect asserts.
      </P>
      <P id="mi-verbs.p.passion-gospels-thread">
        <strong>παραδίδωμι and the passion.</strong> The Gospels thread one verb through the whole story:
        Judas <em>hands over</em> Jesus (Mark 14:10), the chief priests <em>hand him over</em> to Pilate
        (15:1), Pilate <em>hands him over</em> to be crucified (15:15) — and Paul dares to make God the
        subject: "he did not spare his own Son but <em>handed him over</em> for us all" (Rom 8:32). Tracking
        the verb is tracking the theology.
      </P>
      <P id="mi-verbs.p.range-one-verb">
        <strong>ἀφίημι's range.</strong> One verb covers "forgive" (sins), "leave" (nets, Matt 4:20), and
        "allow" (Matt 3:15). The root picture — releasing, letting go — underlies all three; context picks
        the English word, and the shared root sometimes carries the point.
      </P>
    </LevelOnly>
  </>
)
