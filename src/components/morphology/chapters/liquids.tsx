/* ─────────────────────────────────────────────
   Chapter: Liquid Verbs  (stems in λ, μ, ν, ρ)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const LIQUIDS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: sounds that won't take an -s</SectionHeading>
      <P>
        Say "λ, μ, ν, ρ" out loud — <em>l, m, n, r</em>. They flow; ancient grammarians called them
        <strong> liquid</strong> consonants. Now try pronouncing a Greek future built the normal way:
        <Gk> μεν + σω</Gk> — "men-so." Greek ears refused the combination: liquids simply
        <strong> won't sit next to σ</strong>. English has quirks like this too — think how "goose" makes
        its plural <em>geese</em> rather than accepting a clunky "gooses."
      </P>
      <P>
        So verbs whose stems end in a liquid — <Gk>μένω</Gk> "remain," <Gk>κρίνω</Gk> "judge,"
        <Gk> ἐγείρω</Gk> "raise," <Gk>ἀποστέλλω</Gk> "send" — form their future and aorist
        <em> without the σ</em>, compensating in two clever ways you're about to recognize instantly.
      </P>
    </LevelOnly>

    {/* ── 2 · The liquid future ──────────────────────────── */}
    <SectionHeading>The liquid future: a stealth future</SectionHeading>
    <P>
      Instead of <Gk>σ</Gk>, the liquid future slips in an <Gk>ε</Gk> that immediately contracts — so the
      future of a liquid verb wears the endings of a <em>contract present</em> (<Gk>φιλέω</Gk>-style):
      <Gk> μένω</Gk> "I remain" → future <Gk>μενῶ</Gk> "I will remain." The only visible difference from
      the present is often the <strong>circumflex accent</strong> — a genuinely sneaky future.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Present vs. future</AsideLabel>
        <Ex grc="μένω" en="I remain (present)" />
        <Ex grc="μενῶ" en="I will remain (future — circumflex!)" />
        <Ex grc="κρίνει / κρινεῖ" en="he judges / he will judge" />
      </>}
      intermediate={<>
        <p>Historically <Gk>μενέσω</Gk> → the σ dropped between vowels → <Gk>μενέω</Gk> → contraction → <Gk>μενῶ</Gk>. Same στ story as the 2nd-sg. middle endings — Greek's vanished sigmas explain half its "irregularities."</p>
      </>}
    >
      <MorphTable flush title={gt("Liquid Future — μενῶ (like the present of φιλέω)")} headers={['','Pers.','Form','Translation']}
        rows={[
          ['Sg.','1.','μενῶ','I will remain'],
          ['','2.','μενεῖς','you will remain'],
          ['','3.','μενεῖ','he/she will remain'],
          ['Pl.','1.','μενοῦμεν','we will remain'],
          ['','2.','μενεῖτε','you (pl.) will remain'],
          ['','3.','μενοῦσι(ν)','they will remain'],
        ]}
      />
    </TableAside>

    {/* ── 3 · The liquid aorist ──────────────────────────── */}
    <SectionHeading>The liquid aorist: σ-less but honest</SectionHeading>
    <P>
      The aorist likewise refuses the σ but keeps everything else — augment and the familiar
      <Gk> α</Gk>-endings — and usually <strong>compensates by stretching the stem vowel</strong> (or
      slimming a double consonant): <Gk>μένω → ἔμεινα</Gk> "I remained"; <Gk>ἀποστέλλω → ἀπέστειλα</Gk>
      "I sent" (λλ → λ).
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>The pattern</AsideLabel>
        <Ex grc="ἔμεινα" en="I remained (μεν → μειν)" />
        <Ex grc="ἤγειρα" en="I raised" />
        <Ex grc="ἀπέστειλα" en="I sent (στελλ → στειλ)" />
        <p>Augment + stretched stem + α-endings, no σ.</p>
      </>}
      intermediate={<>
        <p>Duff's summary: <em>in liquid verbs there is no σ in the future or aorist.</em> The stem-stretch (compensatory lengthening) is the σ's ghost — the syllable's weight preserved after the sound was lost.</p>
      </>}
    >
      <MorphTable flush title="Common liquid verbs" headers={['Present', 'Future', 'Aorist', 'Meaning']} firstColIsData
        rows={[
          ['μένω', 'μενῶ', 'ἔμεινα', 'I remain'],
          ['κρίνω', 'κρινῶ', 'ἔκρινα', 'I judge'],
          ['ἐγείρω', 'ἐγερῶ', 'ἤγειρα', 'I raise'],
          ['αἴρω', 'ἀρῶ', 'ἦρα', 'I lift up, take away'],
          ['ἀποστέλλω', 'ἀποστελῶ', 'ἀπέστειλα', 'I send'],
          ['ἀποκτείνω', 'ἀποκτενῶ', 'ἀπέκτεινα', 'I kill'],
          ['σπείρω', 'σπερῶ', 'ἔσπειρα', 'I sow'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>μένω / μενῶ</Gk>, <Gk>κρίνει / κρινεῖ</Gk> — present vs. future by accent alone. In unaccented contexts (or fast reading), the surrounding tense-logic decides.</li>
        <li><Gk>ἔκρινα</Gk> (liquid 1st aorist) vs. <Gk>ἔκρινον</Gk> (imperfect) — α-endings vs. ο/ε-endings.</li>
        <li>Double consonant slims in the aorist: <Gk>ἀποστέλλω → ἀπέστειλα</Gk> (and augment after the preposition, as always in compounds).</li>
        <li><Gk>βάλλω</Gk> is a liquid <em>with a 2nd aorist</em> (<Gk>ἔβαλον</Gk>) — clubs overlap; the verb list, not logic, tells you which club a verb joined.</li>
        <li><Gk>ἐγείρω</Gk>'s passive <Gk>ἠγέρθη</Gk> ("he was raised") is among the NT's most theologically loaded forms — parse it with care.</li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Watch accents and stem-stretches. Vocabulary: <span className="normal-case">καρπός</span> "fruit" · <span className="normal-case">νεκρός</span> "dead."</>}
      items={[
        { q: <span className="normal-case">μείνατε ἐν ἐμοί.</span>,
          a: <>"Remain in me" — aorist imperative of μένω (John 15:4): the stretched μειν-stem, no σ.</> },
        { q: <span className="normal-case">ἀποστελῶ πρὸς ὑμᾶς προφήτας.</span>,
          a: <>"I will send prophets to you" — liquid future of ἀποστέλλω (single λ!), cf. Luke 11:49.</> },
        { q: <span className="normal-case">μὴ κρίνετε, ἵνα μὴ κριθῆτε.</span>,
          a: <>"Do not judge, so that you may not be judged" (Matt 7:1) — present imperative + aorist passive subjunctive of κρίνω.</> },
        { q: <span className="normal-case">ἤγειρεν αὐτὸν ὁ θεός.</span>,
          a: <>"God raised him" — liquid aorist of ἐγείρω (Acts' resurrection formula).</> },
        { q: <span className="normal-case">ὁ σπείρων σπερεῖ τὸν λόγον.</span>,
          a: <>"The sower will sow the word" — present participle + liquid future of σπείρω.</> },
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>Four liquid verbs that carry resurrection, mission, judgment, and abiding.</>}
      links={[
        { label: <>Every form of <span className="normal-case">ἐγείρω</span> — raise / rise</>, lemma: 'ἐγείρω' },
        { label: <>Every form of <span className="normal-case">ἀποστέλλω</span> — send (the apostle-verb)</>, lemma: 'ἀποστέλλω' },
        { label: <>Every form of <span className="normal-case">κρίνω</span> — judge</>, lemma: 'κρίνω' },
        { label: <>Every form of <span className="normal-case">μένω</span> — remain / abide (John's key word)</>, lemma: 'μένω' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: theology in liquid forms</SectionHeading>
      <P>
        <strong>μένω in John.</strong> "Abide in me" — John's theology of union runs on this liquid verb
        (40 times in the Gospel, 27 in the letters). John 15 alone plays present forms ("keep abiding")
        against aorist forms in a sustained meditation; watching the aspect of each <Gk>μένω</Gk> form is
        half the exegesis of the chapter.
      </P>
      <P>
        <strong>ἐγείρω and ἀνίστημι.</strong> The NT says "raise" two ways — the liquid <Gk>ἐγείρω</Gk>
        (usually transitive: God raises Jesus, passive <Gk>ἠγέρθη</Gk>) and the μι-verb
        <Gk> ἀνίστημι</Gk> (often intransitive: "he rose"). Mark alternates them freely; the divine-passive
        <Gk> ἠγέρθη</Gk> "he was raised [by God]" quietly credits the Father throughout the kerygma.
      </P>
      <P>
        <strong>ἀποστέλλω and "apostle."</strong> The noun <Gk>ἀπόστολος</Gk> is this liquid verb
        substantivized — a "sent one." John's Gospel plays the sending chain relentlessly: as the Father
        <em> sent</em> me, so I <em>send</em> you (John 20:21) — mission grammar built on a liquid stem.
      </P>
    </LevelOnly>
  </>
)
