/* ─────────────────────────────────────────────
   Hebrew chapter: Hithpael

   The reflexive of the Piel family: forms, meanings, and the
   metathesis / assimilation quirks of the הת prefix.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_HITHPAEL = (
  <>
    <P>
      The Hithpael doubles the middle root letter like the <Term t="piel">Piel</Term> and
      adds the prefix <Hb>הִתְ</Hb>: action done to or among <em>oneself</em> —{' '}
      <Term t="reflexive">reflexive</Term>, reciprocal, or repeated. Its most famous member needs no introduction: <Hb>הִתְפַּלֵּל</Hb>,
      &ldquo;pray.&rdquo;
    </P>

    <SectionHeading n={1}>Forms</SectionHeading>
    <MorphTable
      title="Hithpael of קטל"
      headers={['Conjugation', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[0, 2]}
      firstColIsData
      rows={[
        ['perfect 3ms', 'הִתְקַטֵּל', 'he killed himself'],
        ['perfect 2ms', 'הִתְקַטַּלְתָּ', 'you killed yourself'],
        ['perfect 3cp', 'הִתְקַטְּלוּ', 'they killed themselves'],
        ['imperfect 3ms', 'יִתְקַטֵּל', 'he will kill himself'],
        ['imperfect 1cs', 'אֶתְקַטֵּל', 'I will kill myself'],
        ['imperative 2ms', 'הִתְקַטֵּל', 'kill yourself!'],
        ['infinitive construct', 'הִתְקַטֵּל', 'to kill oneself'],
        ['participle', 'מִתְקַטֵּל', 'killing himself'],
      ]}
      note="In the imperfect and participle the ה gives way to the prefix letter (יִתְ־, מִתְ־); the ת of the stem survives everywhere."
    />

    <SectionHeading n={2}>What Hithpael means</SectionHeading>
    <MorphTable
      title="The range"
      headers={['Nuance', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['reflexive', 'הִתְקַדֵּשׁ', 'consecrate oneself'],
        ['reciprocal', 'הִתְרָאוּ', 'they looked at one another'],
        ['iterative — back and forth', 'הִתְהַלֵּךְ', 'walk about, walk with'],
        ['its own idiom', 'הִתְפַּלֵּל', 'pray'],
      ]}
    />
    <HbEx he="וַיִּתְהַלֵּךְ חֲנוֹךְ אֶת־הָאֱלֹהִים" en={<>“and Enoch walked with God” (Gen 5:22) — the iterative Hithpael of הלך: a settled walking-about, a way of life.</>} />

    <SectionHeading n={3}>The ת and the sibilants</SectionHeading>
    <P>
      When the first root letter is a sibilant, the <Hb>ת</Hb> of the prefix misbehaves — the
      one genuinely tricky thing about this stem:
    </P>
    <MorphTable
      title="Metathesis and assimilation"
      headers={['First radical', 'What happens', 'Example', '']}
      tCols={[0, 1, 3]}
      hCols={[2]}
      firstColIsData
      rows={[
        ['שׁ · שׂ · ס', 'ת swaps places with it (metathesis)', 'הִשְׁתַּמֵּר', 'he kept himself  (not הִתְשַׁמֵּר)'],
        ['צ', 'swaps AND hardens to ט', 'הִצְטַדֵּק', 'he justified himself'],
        ['ד · ט · ת', 'ת assimilates into it (dagesh)', 'הִטַּהֵר', 'he purified himself'],
      ]}
    />

    <InfoBox title="Watch for">
      <p className="mb-1">Parse by fingerprints in order: הת (or ית/מת) prefix → dagesh in the middle radical → Hithpael. Metathesis does not change the parse, only the spelling.</p>
      <p>Like Niphal, some Hithpaels translate simply active: הִתְפַּלֵּל “pray,” הִתְהַלֵּךְ “walk about.”</p>
    </InfoBox>

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>הִתְפַּלֵּל</Hb>, a: <>Hithpael perfect 3ms of <Hb>פלל</Hb> — “he prayed.”</> },
        { q: <Hb>אֶתְפַּלֵּל</Hb>, a: <>Hithpael imperfect 1cs of <Hb>פלל</Hb> — “I will pray.”</> },
        { q: <Hb>מִתְהַלֵּךְ</Hb>, a: <>Hithpael participle ms of <Hb>הלך</Hb> — “walking about” (Gen 3:8).</> },
        { q: <>Why is “he watched himself” spelled <Hb>הִשְׁתַּמֵּר</Hb> and not הִתְשַׁמֵּר?</>, a: <>Metathesis: before the sibilant שׁ the prefix-ת swaps into second place.</> },
      ]}
    />
  </>
)
