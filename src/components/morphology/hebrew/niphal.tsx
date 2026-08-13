/* ─────────────────────────────────────────────
   Hebrew chapter: Niphal

   First derived stem: forms across all conjugations, the passive /
   middle / reflexive range, and the Niphal-only verbs.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples } from '../shared'

export const HB_NIPHAL = (
  <>
    <P>
      The <Term t="niphal">Niphal</Term> is <Term t="qal">Qal</Term>&rsquo;s counterpart:
      usually <Term t="passive"><strong>passive</strong></Term>{' '}
      (<Hb>נִכְתַּב</Hb> &ldquo;it was written&rdquo;), often <strong>middle or{' '}
      <Term t="reflexive">reflexive</Term></strong> (<Hb>נִסְתַּר</Hb> &ldquo;he hid
      himself&rdquo;). Its fingerprint is
      a <Hb>נ</Hb> — visible in the perfect and participle, assimilated into a dagesh forte in
      the first root letter everywhere else.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1"><strong>Active vs passive is an English idea too.</strong> “The boy broke the window” is active — the subject does the deed. “The window <em>was broken</em>” is passive — the subject receives it, and the doer can go unnamed. English builds its passive with a helping verb (“was broken”); Hebrew builds it by moving the same root into a different stem: <Hb>שָׁמַר</Hb> “he kept” → <Hb>נִשְׁמַר</Hb> “he was kept.” One added letter does the work of the whole English phrase.</p>
      <p><strong>Reflexive is the other face:</strong> sometimes the Niphal is “he kept <em>himself</em>” — subject and object are the same person. Context decides which face you are looking at.</p>
    </InfoBox>

    <SectionHeading n={1}>Perfect and imperfect</SectionHeading>
    <MorphTable
      title="Niphal perfect of קטל"
      headers={['', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[2]}
      rows={[
        ['3ms', 'נִ»קְטַל', 'he was killed'],
        ['3fs', 'נִ»קְטְלָ|ה', 'she was killed'],
        ['2ms', 'נִ»קְטַלְ|תָּ', 'you were killed'],
        ['1cs', 'נִ»קְטַלְ|תִּי', 'I was killed'],
        ['3cp', 'נִ»קְטְל|וּ', 'they were killed'],
        ['2mp', 'נִ»קְטַלְ|תֶּם', 'you were killed'],
        ['1cp', 'נִ»קְטַלְ|נוּ', 'we were killed'],
      ]}
      note="נִ + the familiar perfect endings. (The 2fs and 2fp rows follow the Qal pattern exactly.)"
    />
    <MorphTable
      title="Niphal imperfect of קטל"
      headers={['', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[2]}
      rows={[
        ['3ms', 'יִקָּטֵל', 'he will be killed'],
        ['3fs / 2ms', 'תִּקָּטֵל', 'she / you will be killed'],
        ['2fs', 'תִּקָּטְלִי', 'you will be killed'],
        ['1cs', 'אֶקָּטֵל', 'I will be killed'],
        ['3mp', 'יִקָּטְלוּ', 'they will be killed'],
        ['1cp', 'נִקָּטֵל', 'we will be killed'],
      ]}
      note="The נ has assimilated: *yin-qatel → yiqqatel. That dagesh in the FIRST root letter is how you tell Niphal imperfect from Qal."
    />

    <SectionHeading n={2}>The other forms</SectionHeading>
    <MorphTable
      title="Niphal at a glance"
      headers={['Conjugation', 'Form']}
      hCols={[1]}
      tCols={[0]}
      firstColIsData
      rows={[
        ['participle', 'נִקְטָל'],
        ['imperative', 'הִקָּטֵל'],
        ['infinitive construct', 'הִקָּטֵל'],
        ['infinitive absolute', 'נִקְטוֹל · הִקָּטֹל'],
      ]}
      note="Imperative and infinitive lead with הִ + dagesh — the assimilated נ again, behind a helping ה."
    />

    <SectionHeading n={3}>What Niphal means</SectionHeading>
    <MorphTable
      title="The range"
      headers={['Nuance', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['passive', 'נִכְתַּב בַּסֵּפֶר', 'it was written in the book'],
        ['middle / reflexive', 'נִסְתַּר', 'he hid himself'],
        ['reciprocal', 'נִלְחֲמוּ', 'they fought (one another)'],
        ['tolerative', 'נִמְצָא', 'he let himself be found / he was found'],
      ]}
    />
    <P>
      Some verbs live only in the Niphal, with active meaning — Hebrew&rsquo;s deponents, if
      you know Greek: <Hb>נִשְׁבַּע</Hb> swear, <Hb>נִלְחַם</Hb> fight. Parse them Niphal;
      translate them active.
    </P>
    <HbEx he="וְנִבְרְכוּ בְךָ כֹּל מִשְׁפְּחֹת הָאֲדָמָה" en={<>“and in you all the families of the earth shall be blessed” (Gen 12:3) — Niphal weqatal of ברך.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">Niphal perfect 1cp <Hb>נִקְטַלְנוּ</Hb> vs Qal imperfect 1cp <Hb>נִקְטֹל</Hb> — both start with נ. The endings (and the theme vowel) separate them.</p>
      <p>Before a guttural the assimilated dagesh cannot stand and the vowel lengthens: <Hb>יֵעָשֶׂה</Hb> “it will be done.”</p>
    </InfoBox>

    <HbExamples id="niphal" />

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>נִשְׁמַר</Hb>, a: <>Niphal perfect 3ms of <Hb>שׁמר</Hb> — “he was kept.”</> },
        { q: <Hb>יִכָּתֵב</Hb>, a: <>Niphal imperfect 3ms of <Hb>כתב</Hb> — “it will be written” (dagesh in the כ = assimilated נ).</> },
        { q: <Hb>נִלְחַם</Hb>, a: <>Niphal perfect 3ms of <Hb>לחם</Hb> — “he fought” (Niphal-only verb, active in sense).</> },
        { q: <Hb>נִשְׁבַּעְתִּי</Hb>, a: <>Niphal perfect 1cs of <Hb>שׁבע</Hb> — “I have sworn.”</> },
      ]}
    />
  </>
)
