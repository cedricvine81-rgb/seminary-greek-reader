/* ─────────────────────────────────────────────
   Chapter: Contract Verbs  (-έω, -άω, -όω)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const CONTRACT_VERBS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: do not → don't</SectionHeading>
      <P>
        When two words rub together constantly, English squeezes them: <em>do not → don't</em>,
        <em> I am → I'm</em>. Nothing changes in meaning; the sounds just fuse. Greek does the same thing
        <em> inside</em> certain verbs. If a verb's <Term t="stem">stem</Term> ends in a short vowel —
        <Gk> ε, α,</Gk> or <Gk>ο</Gk> — that vowel collides with the connecting vowel of the ending, and
        the two <strong>contract</strong> into one long sound: <Gk>φιλέ‑ομεν → φιλοῦμεν</Gk>, "we love."
      </P>
      <P>
        Dictionaries list the uncontracted form (<Gk>φιλέω</Gk>) so you can see the stem — but you will
        <em> never</em> meet that spelling in an actual text; it always appears contracted (<Gk>φιλῶ</Gk>).
        These "contract verbs" include some of the most important words in the New Testament:
        <Gk> ἀγαπάω</Gk> "love," <Gk>ποιέω</Gk> "do/make," <Gk>λαλέω</Gk> "speak," <Gk>ζητέω</Gk> "seek,"
        <Gk> πληρόω</Gk> "fulfill."
      </P>
    </LevelOnly>

    {/* ── 2 · The rules ──────────────────────────────────── */}
    <SectionHeading>The contraction rules</SectionHeading>
    <P>
      Each stem-vowel family has its own small rule-set. You don't need to produce these from scratch —
      you need to <em>recognize</em> the results, and the circumflex accent (<Gk>ῶ, εῖ, οῦ, ᾷ</Gk>) that
      contraction usually leaves behind, like a scar marking where two vowels fused.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Reading tip</AsideLabel>
        <p>See a present-tense verb wearing a <strong>circumflex</strong> on its ending (<Gk>ποιεῖ, ἀγαπᾷ, πληροῖ</Gk>)? It's a contract verb. Work back to the dictionary form by asking which family the vowels point to.</p>
      </>}
      intermediate={<>
        <p>The master shortcuts: like vowels give the long version (<Gk>ε+ε=ει, ο+ο=ου</Gk>); an <Gk>ο</Gk>-sound anywhere wins (<Gk>→ ου/ω/οι</Gk>); <Gk>α</Gk> before an e-sound gives <Gk>α/ᾳ</Gk>; and a long vowel simply swallows a short one.</p>
      </>}
    >
      <MorphTable flush title="The three families" headers={['Family', 'Example', 'Key results']} firstColIsData
        rows={[
          ['-έω', 'ποιέω “do”', 'ε+ε=ει · ε+ο=ου · ε + long vowel = (swallowed)'],
          ['-άω', 'ἀγαπάω “love”', 'α+ε/η=α(ᾳ) · α+ο/ου/ω=ω'],
          ['-όω', 'πληρόω “fulfill”', 'ο+ε/ο/ου=ου · ο+η/ω=ω · ο+ῃ/ει=οι'],
        ]}
      />
    </TableAside>
    <P>Here are all three families across the present active — compare column by column with <Gk>λύω</Gk>:</P>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="ποιῶ" en="I do / make" />
        <Ex grc="ἀγαπῶμεν" en="we love" />
        <Ex grc="πληροῖ" en="he fulfills" />
      </>}
      intermediate={<>
        <p>-άω's giveaway is <Gk>ᾳ</Gk> where -έω has <Gk>ει</Gk> (<Gk>ἀγαπᾷ</Gk> vs. <Gk>ποιεῖ</Gk>); -όω's is <Gk>οι</Gk> (<Gk>πληροῖ</Gk>). The 1st sg. and pl. of all three converge on <Gk>ῶ / ‑οῦμεν/‑ῶμεν</Gk>.</p>
      </>}
    >
      <MorphTable flush title="Present Active Indicative — the three families" headers={['','Pers.','ποιέω','ἀγαπάω','πληρόω']}
        rows={[
          ['Sg.','1.','ποιῶ','ἀγαπῶ','πληρῶ'],
          ['','2.','ποιεῖς','ἀγαπᾷς','πληροῖς'],
          ['','3.','ποιεῖ','ἀγαπᾷ','πληροῖ'],
          ['Pl.','1.','ποιοῦμεν','ἀγαπῶμεν','πληροῦμεν'],
          ['','2.','ποιεῖτε','ἀγαπᾶτε','πληροῦτε'],
          ['','3.','ποιοῦσι(ν)','ἀγαπῶσι(ν)','πληροῦσι(ν)'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Outside the present ────────────────────────── */}
    <SectionHeading>Outside the present: the vowel grows up</SectionHeading>
    <P>
      Contraction only happens where stem-vowel meets connecting vowel — the present and imperfect. In
      every other tense, the stem vowel simply <strong>lengthens</strong> before the tense marker
      (<Gk>ε→η, α→η, ο→ω</Gk>), and the verb behaves exactly like <Gk>λύω</Gk>:
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ποιέω → ποιήσω, ἐποίησα" en="I will do, I did" />
        <Ex grc="ἀγαπάω → ἠγάπησα" en="I loved" />
        <Ex grc="πληρόω → πεπλήρωκα" en="I have fulfilled" />
      </>}
      intermediate={<>
        <p>So a contract verb is only "hard" in two tenses. Meet <Gk>ἠγάπησεν</Gk> (John 3:16) and it parses like any 1st aorist: augment + lengthened stem + σ + ending.</p>
      </>}
    >
      <MorphTable flush title={gt("The lengthening rule — ποιέω")} headers={['Tense', 'Form', 'What happened']} firstColIsData
        rows={[
          ['Present', 'ποιῶ', 'contraction'],
          ['Imperfect', 'ἐποίουν', 'contraction (+ augment)'],
          ['Future', 'ποιήσω', 'ε → η + σ'],
          ['Aorist', 'ἐποίησα', 'ε → η + σα'],
          ['Perfect', 'πεποίηκα', 'ε → η + κα'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>ποιεῖ</Gk> is 3rd sg. ("he does") <em>and</em> the 2nd sg. middle; <Gk>ποιεῖν</Gk> is the infinitive — small differences, big meaning shifts.</li>
        <li><Gk>ζάω</Gk> "live" contracts irregularly with η: <Gk>ζῇς, ζῇ, ζῆν</Gk>.</li>
        <li><Gk>καλέω</Gk> refuses to lengthen: future <Gk>καλέσω</Gk>, aorist <Gk>ἐκάλεσα</Gk> — a famous exception.</li>
        <li>Liquid futures <em>look</em> like -έω presents (<Gk>μενῶ</Gk> "I will remain" vs. present <Gk>μένω</Gk>) — see the Liquid Verbs chapter; the accent is the clue.</li>
        <li>Imperfects of contract verbs contract too: <Gk>ἐποίει</Gk> "he was doing," <Gk>ἠγάπα</Gk> "he loved (was loving)."</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Name the family (-έω / -άω / -όω), then the form.</>}
      items={[
        { q: <span className="normal-case">λαλεῖ τῷ ὄχλῳ.</span>,
          a: <>"He speaks to the crowd" — λαλέω, present 3rd sg. (ε+ει=ει).</> },
        { q: <span className="normal-case">ἀγαπᾷς με;</span>,
          a: <>"Do you love me?" — ἀγαπάω, present 2nd sg. (John 21:15's question).</> },
        { q: <span className="normal-case">ζητοῦμεν τὴν βασιλείαν.</span>,
          a: <>"We seek the kingdom" — ζητέω, present 1st pl. (ε+ο=ου).</> },
        { q: <span className="normal-case">ἠγάπησεν ὁ θεὸς τὸν κόσμον.</span>,
          a: <>"God loved the world" — aorist of ἀγαπάω: augment + α→η + σα (John 3:16).</> },
        { q: <span className="normal-case">ἵνα πληρωθῇ τὸ ῥηθέν.</span>,
          a: <>"That what was spoken might be fulfilled" — aorist passive subjunctive of πληρόω (ο→ω), Matthew's formula.</> },
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>Contract verbs carry the NT's biggest themes — love, doing, speaking, fulfilling.</>}
      links={[
        { label: <>Every form of <span className="normal-case">ἀγαπάω</span> — the love verb</>, lemma: 'ἀγαπάω' },
        { label: <>Every form of <span className="normal-case">ποιέω</span> — do / make</>, lemma: 'ποιέω' },
        { label: <>Every form of <span className="normal-case">λαλέω</span> — speak</>, lemma: 'λαλέω' },
        { label: <>Every form of <span className="normal-case">πληρόω</span> — fulfill</>, lemma: 'πληρόω' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: love verbs and formula verbs</SectionHeading>
      <P>
        <strong>ἀγαπάω and φιλέω.</strong> John 21:15–17 alternates the two love verbs ("do you
        <Gk> ἀγαπᾷς</Gk> me?" … "I <Gk>φιλῶ</Gk> you"), and preachers have built mountains on the switch.
        Handle with care: John elsewhere uses the two interchangeably (both describe the Father's love for
        the Son), and Koine authors freely varied near-synonyms. The alternation may be stylistic; if a
        distinction is intended, it must be argued from the context, not assumed from the lexicon.
      </P>
      <P>
        <strong>πληρόω as Matthew's hinge.</strong> Matthew's fulfillment formula — <Gk>ἵνα πληρωθῇ τὸ
        ῥηθὲν διὰ τοῦ προφήτου</Gk>, "that what was spoken through the prophet might be fulfilled" —
        recurs a dozen times, always with the aorist passive subjunctive. One contract verb structures the
        whole Gospel's argument that Jesus completes Israel's story.
      </P>
      <P>
        <strong>Why contraction matters for parsing.</strong> The circumflex is information: <Gk>ποιῶν</Gk>
        (circumflex — participle of a contract verb) vs. a hypothetical <Gk>ποίων</Gk>. When an accent
        seems to sit "wrong," suspect contraction — the accent of the uncontracted form usually survives
        the fusion.
      </P>
    </LevelOnly>
  </>
)
