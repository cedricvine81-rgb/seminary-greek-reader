/* ─────────────────────────────────────────────
   Chapter: Principal Parts

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  DropdownPractice,
} from '../shared'

export const PRINCIPAL_PARTS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: sing, sang, sung</SectionHeading>
      <P>
        How does an English dictionary handle an irregular verb? It lists the forms you can't predict:
        <em> sing, sang, sung</em> — <em>go, went, gone</em>. Give an English speaker those "principal
        parts" and they can build everything else ("had sung," "will go") by rule.
      </P>
      <P>
        Greek does exactly this, with <strong>six</strong> principal parts per verb — six door-keys, one
        for each wing of the verb's house. Know which wing a form lives in, and its key tells you the stem
        to expect. For regular verbs like <Gk>λύω</Gk> the six parts are boringly predictable — which is
        the point: you only memorize parts for the rebels (<Gk>ἔρχομαι, λέγω, ὁράω, φέρω</Gk>…), and those
        rebels are precisely the verbs on every page.
      </P>
    </LevelOnly>

    {/* ── 2 · The six parts ──────────────────────────────── */}
    <SectionHeading>The six door-keys</SectionHeading>
    <TableAside
      beginning={<>
        <AsideLabel>What each part unlocks</AsideLabel>
        <p>Every form you will ever meet descends from one of these six. Parsing an unknown form = asking "which part is this from?"</p>
      </>}
      intermediate={<>
        <p>Parts 1–2 use primary endings; 3 is the aorist system (indicative + the augmentless moods); 4–5 the perfect systems; 6 the aorist passive <em>and</em> future passive (<Gk>λυθήσομαι</Gk> grows from part 6, not part 2).</p>
      </>}
    >
      <MorphTable flush title={gt("The six principal parts — λύω")} headers={['#', 'Part', 'Form', 'Generates']} firstColIsData
        rows={[
          ['1', 'Present', 'λύω', 'present & imperfect, all moods'],
          ['2', 'Future active/middle', 'λύσω', 'future active & middle'],
          ['3', 'Aorist active/middle', 'ἔλυσα', 'aorist active & middle, all moods'],
          ['4', 'Perfect active', 'λέλυκα', 'perfect & pluperfect active'],
          ['5', 'Perfect middle/passive', 'λέλυμαι', 'perfect & pluperfect middle/passive'],
          ['6', 'Aorist passive', 'ἐλύθην', 'aorist passive + future passive'],
        ]}
      />
    </TableAside>

    {/* ── 3 · The rebels ─────────────────────────────────── */}
    <DropdownPractice
      title="Practice — which door-key?"
      intro={<>Place each form in its principal part.</>}
      options={["Part 1 — present", "Part 2 — future active", "Part 3 — aorist active", "Part 4 — perfect active", "Part 5 — perfect middle/passive", "Part 6 — aorist passive"]}
      items={[
        { q: <span className="normal-case">λύω</span>, answer: "Part 1 — present" },
        { q: <span className="normal-case">λύσω</span>, answer: "Part 2 — future active" },
        { q: <span className="normal-case">ἔλυσα</span>, answer: "Part 3 — aorist active" },
        { q: <span className="normal-case">λέλυκα</span>, answer: "Part 4 — perfect active" },
        { q: <span className="normal-case">λέλυμαι</span>, answer: "Part 5 — perfect middle/passive" },
        { q: <span className="normal-case">ἐλύθην</span>, answer: "Part 6 — aorist passive" },
      ]}
    />

    <SectionHeading>The rebels worth memorizing</SectionHeading>
    <P>
      Here are the highest-frequency irregular sets in the New Testament. Read each row aloud, left to
      right, like <em>sing–sang–sung</em>. A dash means the part is missing or rare in the NT.
    </P>
    <TableAside
      sticky
      beginning={<>
        <p>Don't memorize the grid in one sitting — take a row a day, and always as a chant: <Gk>λέγω, ἐρῶ, εἶπον, εἴρηκα, εἴρημαι, ἐρρέθην</Gk>.</p>
        <p>Notice the clubs you know: 2nd aorists in part 3 (<Gk>ἔλαβον</Gk>), deponents' middle futures (<Gk>λήμψομαι</Gk>), liquid futures (<Gk>βαλῶ</Gk>).</p>
      </>}
      intermediate={<>
        <p>Where parts come from different roots (<Gk>λέγω/ἐρῶ/εἶπον</Gk>; <Gk>ὁράω/ὄψομαι/εἶδον</Gk>; <Gk>φέρω/οἴσω/ἤνεγκα</Gk>), you are looking at <em>suppletion</em> — ancient verbs merged into one paradigm, like English go/went.</p>
      </>}
    >
      <MorphTable flush title="Principal parts of key NT verbs" headers={['Present', 'Future', 'Aorist', 'Perf. Act.', 'Perf. M/P', 'Aor. Pass.']} firstColIsData
        rows={[
          ['λύω', 'λύσω', 'ἔλυσα', 'λέλυκα', 'λέλυμαι', 'ἐλύθην'],
          ['ἀγαπάω', 'ἀγαπήσω', 'ἠγάπησα', 'ἠγάπηκα', 'ἠγάπημαι', 'ἠγαπήθην'],
          ['ἄγω', 'ἄξω', 'ἤγαγον', '—', 'ἦγμαι', 'ἤχθην'],
          ['βάλλω', 'βαλῶ', 'ἔβαλον', 'βέβληκα', 'βέβλημαι', 'ἐβλήθην'],
          ['γίνομαι', 'γενήσομαι', 'ἐγενόμην', 'γέγονα', 'γεγένημαι', 'ἐγενήθην'],
          ['γινώσκω', 'γνώσομαι', 'ἔγνων', 'ἔγνωκα', 'ἔγνωσμαι', 'ἐγνώσθην'],
          ['ἔρχομαι', 'ἐλεύσομαι', 'ἦλθον', 'ἐλήλυθα', '—', '—'],
          ['εὑρίσκω', 'εὑρήσω', 'εὗρον', 'εὕρηκα', '—', 'εὑρέθην'],
          ['ἔχω', 'ἕξω', 'ἔσχον', 'ἔσχηκα', '—', '—'],
          ['λαμβάνω', 'λήμψομαι', 'ἔλαβον', 'εἴληφα', 'εἴλημμαι', 'ἐλήμφθην'],
          ['λέγω', 'ἐρῶ', 'εἶπον', 'εἴρηκα', 'εἴρημαι', 'ἐρρέθην'],
          ['ὁράω', 'ὄψομαι', 'εἶδον', 'ἑώρακα', '—', 'ὤφθην'],
          ['φέρω', 'οἴσω', 'ἤνεγκα', 'ἐνήνοχα', '—', 'ἠνέχθην'],
          ['δίδωμι', 'δώσω', 'ἔδωκα', 'δέδωκα', 'δέδομαι', 'ἐδόθην'],
          ['ἵστημι', 'στήσω', 'ἔστησα / ἔστην', 'ἕστηκα', '—', 'ἐστάθην'],
        ]}
        note="Dash (—) = unattested or rare in the NT. Learn a row as a chant, left to right."
      />
    </TableAside>

    {/* ── 4 · Using the grid ─────────────────────────────── */}
    <DropdownPractice
      title="Practice — name the rebel"
      intro={<>Suppletive stems: match the form to its dictionary verb.</>}
      options={["φέρω — \"I carried\"", "λέγω — \"I said\"", "ἔρχομαι — \"I came\"", "ὁράω — \"I saw\"", "ἐσθίω — \"I ate\"", "γινώσκω — \"I knew\""]}
      items={[
        { q: <span className="normal-case">ἤνεγκα</span>, answer: "φέρω — \"I carried\"" },
        { q: <span className="normal-case">εἶπον</span>, answer: "λέγω — \"I said\"" },
        { q: <span className="normal-case">ἦλθον</span>, answer: "ἔρχομαι — \"I came\"" },
        { q: <span className="normal-case">εἶδον</span>, answer: "ὁράω — \"I saw\"" },
        { q: <span className="normal-case">ἔφαγον</span>, answer: "ἐσθίω — \"I ate\"" },
        { q: <span className="normal-case">ἔγνων</span>, answer: "γινώσκω — \"I knew\"" },
      ]}
    />

    <SectionHeading>Using the grid: from mystery form to dictionary</SectionHeading>
    <TableAside
      beginning={<>
        <AsideLabel>Worked example</AsideLabel>
        <p>You meet <Gk>ὄψεσθε</Gk>. Endings say future middle 2nd pl. — so it's a part-2 form. Scan the future column… <Gk>ὄψομαι</Gk> → row <Gk>ὁράω</Gk>: "you will see."</p>
      </>}
      intermediate={<>
        <p>This is why lexica cite verbs by principal parts — and why time memorizing the grid repays itself every reading session. The alternative is looking up <Gk>ἤνεγκα</Gk> alphabetically and finding nothing near <Gk>φέρω</Gk>.</p>
      </>}
    >
      <MorphTable flush title="The lookup drill" headers={['Step', 'Ask']} firstColIsData
        rows={[
          ['1', 'Which endings? (person, number, voice, mood)'],
          ['2', 'Which system? (augment? σ? reduplication? θη?)'],
          ['3', 'Which principal part does that system hang on?'],
          ['4', 'Whose row is that form in? → dictionary form'],
        ]}
      />
    </TableAside>

    {/* ── 5 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>The future passive grows from part <strong>6</strong>, not part 2: <Gk>λυθήσομαι</Gk> from <Gk>ἐλύθην</Gk>. A missing part 6 usually means no passive future either.</li>
        <li><Gk>γέγονα</Gk> (perfect of γίνομαι) is active in form though the verb is deponent — perfects sometimes break a deponent's habits.</li>
        <li><Gk>ἵστημι</Gk> keeps two aorists with two meanings: <Gk>ἔστησα</Gk> "I set (up)" (transitive) vs. <Gk>ἔστην</Gk> "I stood" (intransitive).</li>
        <li>Deponent futures surprise: <Gk>λήμψομαι</Gk> "I will receive," <Gk>γνώσομαι</Gk> "I will know," <Gk>ὄψομαι</Gk> "I will see" — active meaning, middle form.</li>
        <li>An augment belongs only to parts 3 and 6 as <em>indicatives</em> — the same stems un-augmented serve the other moods (<Gk>ἐλθών, γνῶναι, δοθῆναι</Gk>).</li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — trace the form to its row"
      intro={<>Name the principal part it comes from, the dictionary verb, and translate.</>}
      items={[
        { q: <span className="normal-case">γνώσεσθε τὴν ἀλήθειαν.</span>,
          a: <>"You will know the truth" (John 8:32) — part 2 of γινώσκω (deponent future γνώσομαι).</> },
        { q: <span className="normal-case">ἤνεγκαν αὐτὸν πρὸς τὸν Ἰησοῦν.</span>,
          a: <>"They brought him to Jesus" — part 3 of φέρω (suppletive ἤνεγκα).</> },
        { q: <span className="normal-case">ἑώρακεν τὸν πατέρα.</span>,
          a: <>"He has seen the Father" — part 4 of ὁράω (John 6:46).</> },
        { q: <span className="normal-case">ἐδόθη μοι πᾶσα ἐξουσία.</span>,
          a: <>"All authority has been given to me" — part 6 of δίδωμι (Matt 28:18).</> },
        { q: <span className="normal-case">ἐλήλυθεν ἡ ὥρα.</span>,
          a: <>"The hour has come" — part 4 of ἔρχομαι (John 12:23), the odd-looking perfect ἐλήλυθα.</> },
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>Pick a rebel verb and watch all six of its faces appear in real text.</>}
      links={[
        { label: <>Every form of <span className="normal-case">φέρω</span> — the maximal suppletive</>, lemma: 'φέρω' },
        { label: <>Every form of <span className="normal-case">γινώσκω</span> — root aorist + deponent future</>, lemma: 'γινώσκω' },
        { label: <>Every form of <span className="normal-case">εὑρίσκω</span> — εὗρον to εὕρηκα ("eureka!")</>, lemma: 'εὑρίσκω' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: systems, not tenses</SectionHeading>
      <P>
        <strong>Think in tense-systems.</strong> The six parts reveal Greek's real architecture: not
        "tenses" but <em>systems</em> — present, future, aorist, perfect active, perfect middle/passive,
        aorist passive — each with one stem serving every mood. That is why the aorist subjunctive,
        infinitive, imperative, and participle all share part 3's stem minus the augment. Master the
        systems and the hundreds of "forms" collapse into six stems plus rules you already know.
      </P>
      <P>
        <strong>Part 6's odd career.</strong> The θη-stem began as an intransitive marker, not a strict
        passive — which explains "passive deponents" like <Gk>ἐπορεύθην</Gk> "I went" and
        <Gk> ἀπεκρίθην</Gk> "I answered": old middle-intransitives wearing θη. The tidy active/passive
        grid is a later simplification laid over messier history.
      </P>
      <P>
        <strong>γέγονεν and ἐλήλυθα.</strong> Perfects of the everyday verbs carry weight out of
        proportion to their size: John 1:3's <Gk>ὃ γέγονεν</Gk> ("that which has come to be") and the
        recurring <Gk>ἐλήλυθεν ἡ ὥρα</Gk> ("the hour <em>has come</em> — and now stands here") both lean
        on the perfect's standing-result force you met in the Indicatives chapter.
      </P>
    </LevelOnly>
  </>
)
