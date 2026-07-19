/* ─────────────────────────────────────────────
   Chapter: Indicative Verbs

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const INDICATIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: what a verb carries</SectionHeading>
      <P>
        A <Term t="verb">verb</Term> names an action or a state — <em>writes, sees, is</em>. Now notice how
        little English asks of its verbs. "I write, you write, we write, they write" — the verb barely
        changes; only "she write<strong>s</strong>" picks up an ending. To say <em>who</em> acts, English
        must add a pronoun, and to say <em>when</em>, it adds helper words: "I <em>will</em> write,"
        "I <em>was</em> writing," "I <em>have</em> written."
      </P>
      <P>
        Greek packs all of that <em>inside</em> the verb. The ending tells you who is acting — so
        <Gk> λύομεν</Gk>, one word, is a complete sentence: "we loose." No separate word for "we" is needed;
        the ending <Gk>‑ομεν</Gk> <em>is</em> the "we." And time is marked by changes at the front and middle
        of the word — a prefix for past time, a marker before the ending for future, and so on. A Greek verb
        is a little machine: <strong>stem</strong> (the meaning) + <strong>markers</strong> (the tense) +
        <strong> ending</strong> (the person). This chapter teaches you to read the machine.
      </P>
      <P>
        One more idea: <Term t="mood">mood</Term>. The <strong>indicative</strong> — this chapter — is the
        mood of plain statement and question: things presented as fact ("she wrote," "did she write?").
        Commands, wishes, and "maybes" have their own moods, each with its own tab.
      </P>
    </LevelOnly>

    {/* ── 2 · The ending is the subject ──────────────────── */}
    <SectionHeading>The ending is the subject</SectionHeading>
    <P>
      Greek verbs mark six persons: I / you (sg.) / he-she-it, and we / you (pl.) / they. Here is the
      present tense of <Gk>λύω</Gk> ("I loose / untie"), the model verb your textbook tables will use
      everywhere. Read the endings, not the stem — the stem <Gk>λυ‑</Gk> never changes here.
    </P>
    <TableAside
      beginning={<>
        <p>Greek's present covers <em>both</em> English "I loose" and "I am loosing" — it does not distinguish the two.</p>
        <Ex grc="πιστεύω εἰς τὸν θεόν" en="I believe in God" />
        <Ex grc="ὁ Ἰησοῦς διδάσκει" en="Jesus teaches / is teaching" />
      </>}
      intermediate={<>
        <p>Present = <em>imperfective</em> <Term t="aspect">aspect</Term> (ongoing). Watch for the <strong>historical present</strong> — a present-tense verb telling a past story for vividness (<Gk>λέγει αὐτῷ</Gk> = "he said to him").</p>
      </>}
    >
      <MorphTable flush title={gt("Present Tense — λύω (I loose, I am loosing)")} headers={['Person','Greek','Translation']}
        rows={[
          ['1st sg.','λύω','I am untying / I untie'],
          ['2nd sg.','λύεις','You are untying / you untie'],
          ['3rd sg.','λύει','He/she/it is untying'],
          ['1st pl.','λύομεν','We are untying / we untie'],
          ['2nd pl.','λύετε','You are untying / you untie'],
          ['3rd pl.','λύουσι(ν)','They are untying / they untie'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Past time: the augment ─────────────────────── */}
    <SectionHeading>Marking past time: the augment</SectionHeading>
    <P>
      To push a verb into the past, Greek glues an <Gk>ἐ‑</Gk> onto the front — called the
      <strong> augment</strong>. Think of it as the past-time flag: <Gk>λύομεν</Gk> "we loose" →
      <Gk> ἐλύομεν</Gk> "we were loosing." The <strong>imperfect</strong> tense (ongoing past, "was …ing")
      is exactly that: augment + present stem + a slightly different set of endings. Those two sets of
      endings — present and imperfect — are the base for everything else:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations (add the verb)</AsideLabel>
        <p><Gk>Present</Gk> active: "I ‒ / I am ‒ing" · mid/pass: "I am (being) ‒ed."</p>
        <p><Gk>Imperfect</Gk> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</p>
        <p>The imperfect's <Gk>ε‒</Gk> augment marks past time.</p>
      </>}
      intermediate={<>
        <p>The imperfect is <em>past imperfective</em> — ongoing or repeated action in the past ("kept on…, was beginning to…"), as opposed to the aorist's single, whole action.</p>
        <p>The 2nd-sg. middle (<Gk>ἐλύου, λύῃ</Gk>) lost an intervocalic <Gk>σ</Gk>, which is why it looks irregular.</p>
      </>}
    >
      <MorphTable flush title={gt("Present & Imperfect Full Paradigm — λύω")} headers={['','','Imp. Active','Imp. Mid/Pass','Pres. Active','Pres. Mid/Pass']}
        rows={[
          ['SG','1','ἔλυον','ἐλυόμην','λύω','λύομαι'],
          ['','2','ἔλυες','ἐλύου','λύεις','λύῃ (σαι)'],
          ['','3','ἔλυε(ν)','ἐλύετο','λύει','λύεται'],
          ['PL','1','ἐλύομεν','ἐλυόμεθα','λύομεν','λυόμεθα'],
          ['','2','ἐλύετε','ἐλύεσθε','λύετε','λύεσθε'],
          ['','3','ἔλυον','ἐλύοντο','λύουσι(ν)','λύονται'],
        ]}
      />
    </TableAside>
    <InfoBox title="Two augment quirks">
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
        <li>If the verb starts with a vowel, the augment <em>lengthens</em> it instead of adding <Gk>ἐ‑</Gk>: <Gk>ἀκούω</Gk> "I hear" → <Gk>ἤκουον</Gk> "I was hearing."</li>
        <li>In compound verbs the augment goes <em>after</em> the preposition: <Gk>ἀπολύω</Gk> "I release" → <Gk>ἀπέλυον</Gk> (not <Gk>ἠπολυον</Gk>).</li>
      </ul>
    </InfoBox>

    {/* ── 4 · εἰμί ───────────────────────────────────────── */}
    <SectionHeading>The most common verb of all: εἰμί, "to be"</SectionHeading>
    <P>
      Just as in English (<em>am, is, was</em> — nothing like "be"!), the Greek verb "to be" is irregular
      and must simply be memorized. It is worth the effort: it is the most frequent verb in the New Testament.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>The verb "to be"</AsideLabel>
        <p><Gk>εἰμί</Gk> is irregular and very common — memorize it. It has no voice.</p>
        <Ex grc="ἐγώ εἰμι" en="I am" />
        <Ex grc="ἦν ὁ λόγος" en="the Word was" />
      </>}
      intermediate={<>
        <p><Gk>εἰμί</Gk> is an <strong>equative</strong> verb: it links the subject to a <em>predicate nominative</em>, so both stand in the nominative (<Gk>θεὸς ἦν ὁ λόγος</Gk>).</p>
        <p>Its future <Gk>ἔσομαι</Gk> is a middle (deponent) form.</p>
      </>}
    >
      <MorphTable flush title={gt("εἰμί — Present, Future & Imperfect Indicative")} headers={['Person','Present','Future','Imperfect']}
        rows={[
          ['I','εἰμί','ἔσομαι','ἦμην'],
          ['You (sg.)','εἶ','ἔσῃ','ἦς (or ἦσθα)'],
          ['He/she/it','ἐστί(ν)','ἔσται','ἦν'],
          ['We','ἐσμέν','ἐσόμεθα','ἦμεν (or ἦμεθα)'],
          ['You (pl.)','ἐστέ','ἔσεσθε','ἦτε'],
          ['They','εἰσί(ν)','ἔσονται','ἦσαν'],
        ]}
        note="Present Infinitive: εἶναι · Present Participle (Masc. Nom. Sg./Pl.): ὤν / ὄντες"
      />
    </TableAside>

    {/* ── 5 · The tense machine ──────────────────────────── */}
    <SectionHeading>The tense machine: identifiers</SectionHeading>
    <P>
      Here is the payoff of learning the two base paradigms: every remaining tense is built by inserting a
      <strong> tense identifier</strong> — a flag letter or two — between the stem and the ending. Learn six
      flags and you can read the entire system:
    </P>
    <TableAside
      beginning={<>
        <p>Spot the flag letter, then read the ending for person. <Gk>‒σ‒</Gk> future, <Gk>‒σα‒</Gk> aorist, <Gk>‒θη‒</Gk> aorist passive, <Gk>‒κα‒</Gk> perfect.</p>
      </>}
      intermediate={<>
        <p>Recognize the <em>family</em>, not an exact string: a <Gk>σ</Gk>-cluster = aorist/future, a <Gk>θ</Gk>-cluster = passive. Reduced forms appear right before certain endings.</p>
      </>}
    >
      <MorphTable flush title="Tense Identifiers" headers={['Identifier','Tense']}
        rows={[
          ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
          ['‒σα','1st Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1st Aorist (passive)'],
          ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle/passive)'],
        ]}
      />
    </TableAside>
    <P>
      The <strong>aorist</strong> deserves an introduction, since English has no tense by that name. It is
      the plain past — "I loosed," the action viewed as a simple whole — and it is the workhorse past tense
      of the New Testament. Contrast the imperfect: <Gk>ἐλύομεν</Gk> "we <em>were</em> loosing" (a process
      unrolling) vs. <Gk>ἐλύσαμεν</Gk> "we loosed" (done, whole, one event). And the <strong>perfect</strong> is
      "I <em>have</em> loosed" — a past act whose result still stands; its extra signature is
      <strong> reduplication</strong>, a doubled first consonant at the front: <Gk>λέ‑λυκα</Gk>.
    </P>
    <P>Each tense modifies the base paradigms according to a fixed recipe:</P>
    <TableAside
      beginning={<>
        <p>Build any tense from the present/imperfect base plus the modification shown.</p>
        <Ex grc="ἔλυον → ἔλυσα" en="+ σα = aorist “I loosed”" />
        <Ex grc="λύω → λύσω" en="+ σ = future “I will loose”" />
      </>}
      intermediate={<>
        <p>Run it backwards to parse an unknown form: strip the ending, spot the marker, subtract it, and you're left with the lexical stem to look up.</p>
      </>}
    >
      <MorphTable flush title="Applying Tense Identifiers to Endings" headers={['Tense','Modification to Base Endings']}
        rows={[
          ['Aorist active','Replace connecting vowel with σα  →  use Imperfect endings'],
          ['Aorist middle','Replace connecting vowel with σα  →  use Imperfect endings'],
          ['Aorist passive','Replace connecting vowel with θη  →  use Imperfect endings'],
          ['Perfect active','Replace connecting vowel with κα  →  use Imperfect endings'],
          ['Future active','Insert σ before connecting vowel  →  use Present endings'],
          ['Future middle','Insert σ before connecting vowel  →  use Present endings'],
          ['Future passive','Insert θησ before connecting vowel  →  use Present endings'],
          ['Perfect mid/pass','Delete connecting vowel  →  use Present endings'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>When the <Gk>σ</Gk> of the future/aorist meets a stem consonant, the two merge into a single letter.</p>
        <Ex grc="γραφ + σω → γράψω" en="I will write" />
        <Ex grc="κηρυκ + σω → κηρύξω" en="I will preach" />
      </>}
      intermediate={<>
        <p>The very same mergers drive the dative plural (<Gk>‒σι</Gk>) and many 3rd-declension nominatives — one rule, several places.</p>
      </>}
    >
      <MorphTable flush title={gt("Consonant + σ Combinations")} headers={['Stem ends in','+ σ','Result']}
        rows={[
          ['π, β, φ','+ σ','ψ'],
          ['τ, δ, θ, ζ','+ σ','σ'],
          ['κ, γ, χ, σ','+ σ','ξ'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>This shows the moving parts of a verb: an <strong>augment</strong> (<Gk>ε‒</Gk>) goes on the <em>front</em> for past tenses, and the <strong>identifier</strong> (<Gk>σ / θ</Gk>) goes <em>after</em> the stem.</p>
      </>}
      intermediate={<>
        <p>The passive builds on <Gk>θη / θησ</Gk>; the middle borrows the active's <Gk>σ</Gk> in the future and aorist. Stem + augment + identifier is the whole machine.</p>
      </>}
    >
      <MorphTable flush title={gt("Tense Stem Structure — λύ‒")} headers={['Tense','Active','Middle','Passive']}
        rows={[
          ['Present','λυ','λυ','λυ'],
          ['Future','λυ‒σ','λυ‒σ','λυ‒θησ'],
          ['Imperfect','ε‒λυ','ε‒λυ','ε‒λυ'],
          ['Aorist','ε‒λυ‒σ','ε‒λυ‒σ','ε‒λυ‒θ'],
        ]}
        note="ε = augment (past tenses); σ / θησ / θ = tense identifier"
      />
    </TableAside>

    {/* ── 6 · Voice ──────────────────────────────────────── */}
    <SectionHeading>Voice: who does, who receives</SectionHeading>
    <P>
      English has two <Term t="voice">voices</Term>: active ("the dog bit the man") and passive ("the man
      was bitten"). Greek adds a third, the <strong>middle</strong>, where the subject acts with some
      self-involvement — often "for oneself." In the present and imperfect the middle and passive share the
      same forms, so context decides; in the future and aorist they split apart. Here is the whole system at
      a glance, on one verb in the first person:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Read across the voices</AsideLabel>
        <p><strong>Active</strong> = "I loose" (subject acts) · <strong>Middle</strong> = "I loose myself / for myself" · <strong>Passive</strong> = "I am loosed" (subject is acted on).</p>
      </>}
      intermediate={<>
        <p>The middle often means acting <em>in one's own interest</em>. The future/aorist passive show the <Gk>θη</Gk> marker (<Gk>λυθήσομαι, ἐλύθην</Gk>).</p>
        <p>Many middle-looking forms are simply <strong>deponents</strong> with an active meaning — see the Deponents tab.</p>
      </>}
    >
      <MorphTable flush title={gt("Full Tense & Voice Paradigm — λύω (1st sg.)")} headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Present','Active','λύω','I loose'],
          ['','Middle','λύομαι','I loose myself'],
          ['','Passive','λύομαι','I am being loosed'],
          ['Future','Active','λύσω','I will loose'],
          ['','Middle','λύσομαι','I will loose myself'],
          ['','Passive','λυθήσομαι','I will be loosed'],
          ['Imperfect','Active','ἔλυον','I was loosing'],
          ['','Middle','ἐλυόμην','I was loosing myself'],
          ['','Passive','ἐλυόμην','I was being loosed'],
          ['Aorist','Active','ἔλυσα','I loosed'],
          ['','Middle','ἐλυσάμην','I loosed myself'],
          ['','Passive','ἐλύθην','I was loosed'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Perfect = "I have ‒ed": a completed past act with a result that <em>still stands</em>. Its front-of-word flag is <strong>reduplication</strong> (<Gk>λε‒λυκα</Gk>).</p>
        <p>Pluperfect = "I had ‒ed": the same idea one step further back in time.</p>
      </>}
      intermediate={<>
        <p>The perfect stresses the <strong>present state</strong> produced by a past action — <Gk>γέγραπται</Gk> "it stands written." That resultative force is why it matters exegetically.</p>
      </>}
    >
      <MorphTable flush title={gt("Perfect & Pluperfect — λύω")} headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Perfect','Active','λέλυκα','I have loosed'],
          ['','Middle','λέλυμαι','I have loosed myself'],
          ['','Passive','λέλυμαι','I have been loosed'],
          ['Pluperfect','Active','ἐλελύκειν','I had loosed'],
          ['','Middle','ἐλελύμην','I had loosed myself'],
          ['','Passive','ἐλελύμην','I had been loosed'],
        ]}
      />
    </TableAside>

    {/* ── 7 · Worked example ─────────────────────────────── */}
    <SectionHeading>Reading the machine: a worked example</SectionHeading>
    <TableAside
      beginning={<>
        <AsideLabel>Step by step</AsideLabel>
        <p><strong>1.</strong> Front: <Gk>ἐ‑</Gk> — an augment. Past time.</p>
        <p><strong>2.</strong> Middle: <Gk>‑σα‑</Gk> — the aorist flag. Simple past, active or middle.</p>
        <p><strong>3.</strong> End: <Gk>‑μεν</Gk> — "we."</p>
        <p>Assemble: "<strong>we loosed</strong>." Every regular verb in the indicative yields to these three questions: front? middle? end?</p>
      </>}
      intermediate={<>
        <p>The same scan in reverse tells you what to look up: strip <Gk>ἐ‑</Gk> and <Gk>‑σα‑</Gk> and <Gk>‑μεν</Gk>, and the remainder <Gk>λυ‑</Gk> is the lexical stem → <Gk>λύω</Gk> in the dictionary.</p>
      </>}
    >
      <MorphTable flush title={gt("Worked example — ἐλύσαμεν")} headers={['Piece','What it says']} firstColIsData
        rows={[
          ['ἐ‑', 'augment → past time'],
          ['λυ‑', 'stem → “loose”'],
          ['‑σα‑', 'tense identifier → aorist'],
          ['‑μεν', 'ending → “we”'],
        ]}
        note="ἐ + λυ + σα + μεν = “we loosed”"
      />
    </TableAside>

    {/* ── 8 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>The 1st sg. and 3rd pl. imperfect are identical (<Gk>ἔλυον</Gk> = "I was loosing" <em>or</em> "they were loosing") — context decides.</li>
        <li>An initial long vowel may <em>be</em> the augment in disguise: <Gk>ἤκουον</Gk> comes from <Gk>ἀκούω</Gk>.</li>
        <li>The movable <Gk>ν</Gk> on <Gk>λύουσι(ν), ἐστί(ν)</Gk> is cosmetic — it carries no meaning.</li>
        <li>Present and future differ by one letter (<Gk>λύω / λύσω</Gk>) — and with some stems the <Gk>σ</Gk> hides inside a merged letter (<Gk>γράψω</Gk>).</li>
        <li>An augment <em>never</em> appears outside the indicative — if a "past-looking" form turns up in a command or infinitive, the augment is not what you are seeing.</li>
      </ul>
    </InfoBox>

    {/* ── 9 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice A — parse the verb"
      intro={<>Give the tense, voice, person, and a translation. Ask the three questions: front? middle? end?</>}
      items={[
        { q: <span className="normal-case">λύεις</span>,
          a: <>Present active, 2nd sg. — "you loose / are loosing." No augment, no identifier.</> },
        { q: <span className="normal-case">ἐλύετο</span>,
          a: <>Imperfect middle/passive, 3rd sg. — "he was being loosed" (or middle "was loosing for himself"). Augment + no identifier.</> },
        { q: <span className="normal-case">λύσομεν</span>,
          a: <>Future active, 1st pl. — "we will loose." The <span className="normal-case">σ</span> with <em>no augment</em> = future.</> },
        { q: <span className="normal-case">ἐλύθη</span>,
          a: <>Aorist passive, 3rd sg. — "he/she/it was loosed." Augment + <span className="normal-case">θη</span>.</> },
        { q: <span className="normal-case">λελύκατε</span>,
          a: <>Perfect active, 2nd pl. — "you have loosed." Reduplication (<span className="normal-case">λε‑</span>) + <span className="normal-case">κα</span>.</> },
        { q: <span className="normal-case">ἠκούσατε</span>,
          a: <>Aorist active, 2nd pl. of <span className="normal-case">ἀκούω</span> — "you heard." The lengthened <span className="normal-case">ἠ‑</span> is the augment on a vowel-initial verb.</> },
      ]}
    />
    <Practice
      title="Practice B — translate the sentence"
      intro={<>Vocabulary: <span className="normal-case">γράφει</span> "writes" · <span className="normal-case">πιστεύομεν</span> "we believe" · <span className="normal-case">σώσει</span> "will save" · <span className="normal-case">ἐδίδασκεν</span> "was teaching."</>}
      items={[
        { q: <span className="normal-case">ὁ ἀπόστολος γράφει τοῖς ἀδελφοῖς.</span>,
          a: <>"The apostle writes (is writing) to the brothers."</> },
        { q: <span className="normal-case">ἐδίδασκεν ὁ κύριος τὸν ὄχλον.</span>,
          a: <>"The Lord was teaching the crowd" — imperfect: an ongoing scene, not a single event.</> },
        { q: <span className="normal-case">πιστεύομεν τῷ λόγῳ τοῦ θεοῦ.</span>,
          a: <>"We believe the word of God" (dative after <span className="normal-case">πιστεύω</span>).</> },
        { q: <span className="normal-case">ὁ θεὸς σώσει τὸν λαὸν αὐτοῦ.</span>,
          a: <>"God will save his people" — future (<span className="normal-case">σώ‑σ‑ει</span>).</> },
        { q: <span className="normal-case">ἐλύθησαν οἱ δοῦλοι.</span>,
          a: <>"The servants were loosed / set free" — aorist passive plural.</> },
      ]}
    />

    {/* ── 10 · See it in the NT ──────────────────────────── */}
    <LiveExamples
      intro={<>The tense system in the wild — every hit is a real NT verb you can now decode.</>}
      links={[
        { label: 'Aorist indicatives — the narrative workhorse (spot the augments)', features: ['verb', 'aorist', 'indicative'] },
        { label: 'Imperfects — ongoing past scenes ("was …ing")', features: ['verb', 'imperfect', 'indicative'] },
        { label: 'Perfects — completed acts whose results stand', features: ['verb', 'perfect', 'indicative'] },
        { label: 'Future indicatives — promises and predictions', features: ['verb', 'future', 'indicative'] },
      ]}
    />

    {/* ── 11 · Going deeper (Intermediate only) ──────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: tense as interpretation</SectionHeading>
      <P>
        <strong>Aspect over time.</strong> In the indicative Greek tense marks both time and
        <Term t="aspect"> aspect</Term>, but aspect is the deeper category: the imperfect paints a process,
        the aorist reports a whole, the perfect asserts a standing result. When Mark writes
        <Gk> ἐδίδασκεν</Gk> ("he was teaching"), he is setting a scene; when he switches to aorists, events
        march. Watching an author alternate imperfect and aorist is watching him direct your attention.
      </P>
      <P>
        <strong>The historical present.</strong> Mark loves narrating the past in the present tense —
        <Gk> λέγει αὐτῷ</Gk>, "he <em>says</em> to him" — the way an excited storyteller slips into "so then
        he <em>says</em> to me…". Translate as past, but notice the vividness the choice adds.
      </P>
      <P>
        <strong>The divine passive.</strong> A passive with no agent stated often implies God as the actor:
        <Gk> ἠγέρθη</Gk>, "he <em>was raised</em>" (Rom 4:25) — raised <em>by God</em>. Jewish reverence for
        the divine name made this a natural idiom, and the NT uses it constantly in promises: "they shall be
        comforted" (Matt 5:4) — by whom? Exactly.
      </P>
      <P>
        <strong>A caution.</strong> Tense choices are only exegetically loaded where the author had a live
        choice. Much aorist usage is simply default narration — resist sermons built on "the aorist means
        once-for-all." It doesn't; it means the author viewed the action as a whole.
      </P>
    </LevelOnly>
  </>
)
