/* ─────────────────────────────────────────────
   Chapter: μι-Verbs

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const MI_VERBS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: the irregular VIPs</SectionHeading>
      <P>
        Every language keeps its most-used verbs in odd old shapes. English "to be" (am, is, was),
        "go" (went!), "do" (did, done) — beginners must simply learn them, because they appear on every
        page. Greek is the same: a small club of verbs ends in <Gk>‑μι</Gk> instead of <Gk>‑ω</Gk>, keeps
        some archaic habits — and includes words you cannot read a chapter without:
        <Gk> δίδωμι</Gk> "I give," <Gk>τίθημι</Gk> "I put," <Gk>ἵστημι</Gk> "I stand," <Gk>ἀφίημι</Gk> "I
        forgive / leave."
      </P>
      <P>
        The good news: the strangeness is concentrated. In the present and imperfect, μι-verbs look alien;
        everywhere else they behave nearly like <Gk>λύω</Gk>. Learn two habits and one marker, below, and
        the club stops being intimidating.
      </P>
    </LevelOnly>

    {/* ── 2 · The two stems ──────────────────────────────── */}
    <SectionHeading>Habit one: two stems</SectionHeading>
    <P>
      Each μι-verb keeps two <Term t="stem">stems</Term>. The short <strong>verb stem</strong>
      (<Gk>δο‑</Gk>, <Gk>θε‑</Gk>, <Gk>στα‑</Gk>) powers the future, aorist, and perfect. The longer
      <strong> present stem</strong> doubles the first consonant with an iota — <Gk>δι‑δο</Gk>,
      <Gk> τι‑θε</Gk>, <Gk>ἱ‑στα</Gk> — and powers only the present and imperfect. That iota is your
      diagnostic: <strong>see iota-reduplication → present or imperfect. No iota → any other tense.</strong>
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Meanings</AsideLabel>
        <Ex grc="δίδωμι" en="I give" />
        <Ex grc="τίθημι" en="I put / place" />
        <Ex grc="ἵστημι" en="I stand / set" />
      </>}
      intermediate={<>
        <p>Each has <strong>two stems</strong>: the reduplicated <em>present</em> stem (longer) for present + imperfect, and the shorter <em>verb</em> stem for future, aorist + perfect.</p>
      </>}
    >
      <MorphTable flush title={gt("‒μι Verb Stems")} headers={['-μι verb','Verb stem','Present stem']}
        rows={[
          ['δίδωμι','δο / δω','διδο / διδω'],
          ['τίθημι','θε / θη','τιθε / τιθη'],
          ['ἵστημι','στα / στη','ἱστα / ἱστη'],
        ]}
        note="The reduplicated present stem is lengthened in the singular (διδο → διδω, τιθε → τιθη, ἱστα → ἱστη)."
      />
    </TableAside>
    <P>
      Habit two hides in that note: the stem vowel plays <strong>short / long</strong> — long in the
      singular (<Gk>δίδωμι, δίδως, δίδωσι</Gk>), short in the plural (<Gk>δίδομεν, δίδοτε</Gk>). Watch the
      pattern run down the present tense:
    </P>
    <TableAside
      beginning={<>
        <p>The iota reduplication (<Gk>δι‑, τι‑, ἱ‑</Gk>) marks the present. See it → the verb is present or imperfect.</p>
        <Ex grc="δίδωμί σοι" en="I give to you" />
      </>}
      intermediate={<>
        <p>Endings attach directly to the long stem (no connecting vowel), which is why the singular looks so different from <Gk>‑ω</Gk> verbs; the plural shortens the stem again.</p>
      </>}
    >
      <MorphTable flush title="Present Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
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
    <SectionHeading>The marker: a ‑κα aorist</SectionHeading>
    <P>
      In the aorist, μι-verbs drop the iota (of course — not present tense any more) and take
      <Gk> ‑κα</Gk> where ordinary verbs take <Gk>‑σα</Gk>: <Gk>ἔδωκα</Gk> "I gave," <Gk>ἔθηκα</Gk> "I
      put." Same augment, same endings as a first aorist — just a different flag letter.
    </P>
    <TableAside
      beginning={<>
        <p>No iota here — the aorist drops the reduplication and takes a <Gk>‑κα</Gk> marker (not <Gk>‑σα</Gk>).</p>
        <Ex grc="ἔδωκα" en="I gave" />
        <Ex grc="ἔθηκα" en="I put" />
      </>}
      intermediate={<>
        <p>The <Gk>‑κα</Gk> aorist can look like a perfect — tell them apart by reduplication (perfect) and context. <Gk>ἵστημι</Gk> keeps its <Gk>‑σα</Gk> (<Gk>ἔστησα</Gk>) and is transitive here ("I set up").</p>
      </>}
    >
      <MorphTable flush title="Aorist Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
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
    <SectionHeading>The family you'll actually read: compounds</SectionHeading>
    <P>
      Much of the μι-club's NT frequency comes through compounds — preposition + μι-verb — and several are
      theological heavyweights:
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἀφίημι τὰς ἁμαρτίας" en="I forgive sins" />
        <Ex grc="παρέδωκεν αὐτόν" en="he handed him over" />
      </>}
      intermediate={<>
        <p><Gk>παραδίδωμι</Gk> is the passion narrative's hinge-word — Judas "hands over" Jesus, but so does God (Rom 8:32, <Gk>ὑπὲρ ἡμῶν παρέδωκεν αὐτόν</Gk>). One verb, two theologies of the cross.</p>
      </>}
    >
      <MorphTable flush title="Key μι-compounds" headers={['Compound', 'Built from', 'Meaning']} firstColIsData
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
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>‑κα</Gk> aorist vs. perfect: <Gk>ἔδωκα</Gk> (aorist — augment, no reduplication) vs. <Gk>δέδωκα</Gk> (perfect — reduplication). Front of the word decides.</li>
        <li><Gk>ἵστημι</Gk> swings between transitive "I set / place" (1st aorist <Gk>ἔστησα</Gk>) and intransitive "I stand" (2nd aorist <Gk>ἔστην</Gk>); its perfect <Gk>ἕστηκα</Gk> means a present state — "I stand."</li>
        <li>The rough breathing on <Gk>ἵστημι</Gk> forms (<Gk>ἱ‑</Gk>) <em>is</em> the reduplication — an "h" where δ and τ doubled with iota.</li>
        <li>μι-verb aorist imperatives are short and common: <Gk>δός</Gk> "give!", <Gk>ἄφες</Gk> "forgive!", <Gk>θές</Gk> "put!"</li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Front of the word first: iota? augment? reduplication?</>}
      items={[
        { q: <span className="normal-case">δίδωσιν</span>,
          a: <>Present active 3rd sg. — "he gives." Iota reduplication = present system.</> },
        { q: <span className="normal-case">ἔδωκεν αὐτῷ ὁ θεός.</span>,
          a: <>"God gave (it) to him" — aorist (augment + κα, no iota).</> },
        { q: <span className="normal-case">δέδωκα</span>,
          a: <>Perfect active 1st sg. — "I have given." Reduplication (δε‑) + κα.</> },
        { q: <span className="normal-case">τίθησιν τὴν ψυχὴν αὐτοῦ.</span>,
          a: <>"He lays down his life" — present of τίθημι (John 10:11's shepherd).</> },
        { q: <span className="normal-case">ἄφες ἡμῖν τὰ ὀφειλήματα ἡμῶν.</span>,
          a: <>"Forgive us our debts" — aorist imperative of ἀφίημι (Matt 6:12).</> },
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>The μι-club in the wild — watch for iota vs. augment vs. reduplication at the front.</>}
      links={[
        { label: <>Every form of <span className="normal-case">δίδωμι</span> — the model μι-verb</>, lemma: 'δίδωμι' },
        { label: <>Every form of <span className="normal-case">ἀφίημι</span> — "forgive / leave / allow"</>, lemma: 'ἀφίημι' },
        { label: <>Every form of <span className="normal-case">παραδίδωμι</span> — "hand over / betray"</>, lemma: 'παραδίδωμι' },
        { label: <>Every form of <span className="normal-case">ἵστημι</span> — "stand / set"</>, lemma: 'ἵστημι' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: small club, heavy theology</SectionHeading>
      <P>
        <strong>ἵστημι's stative perfect.</strong> Because its perfect <Gk>ἕστηκα</Gk> denotes the
        <em> state</em> of standing, it translates as an English present: <Gk>ἰδοὺ ἕστηκα ἐπὶ τὴν θύραν</Gk>,
        "behold, I <em>stand</em> at the door" (Rev 3:20). A "have stood" here would miss the living
        posture the perfect asserts.
      </P>
      <P>
        <strong>παραδίδωμι and the passion.</strong> The Gospels thread one verb through the whole story:
        Judas <em>hands over</em> Jesus (Mark 14:10), the chief priests <em>hand him over</em> to Pilate
        (15:1), Pilate <em>hands him over</em> to be crucified (15:15) — and Paul dares to make God the
        subject: "he did not spare his own Son but <em>handed him over</em> for us all" (Rom 8:32). Tracking
        the verb is tracking the theology.
      </P>
      <P>
        <strong>ἀφίημι's range.</strong> One verb covers "forgive" (sins), "leave" (nets, Matt 4:20), and
        "allow" (Matt 3:15). The root picture — releasing, letting go — underlies all three; context picks
        the English word, and the shared root sometimes carries the point.
      </P>
    </LevelOnly>
  </>
)
