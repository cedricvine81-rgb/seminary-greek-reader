/* ─────────────────────────────────────────────
   Hebrew chapter: Nouns — Gender & Number

   Endings, the dual, segholates, why vowels move in the plural,
   and the irregular plurals every first-year list carries.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, Term } from '../shared'

export const HB_NOUNS = (
  <>
    <P>
      Every Hebrew <Term t="noun">noun</Term> has a <Term t="gender">gender</Term> — masculine
      or feminine, with no neuter — even for things: &ldquo;land&rdquo; is feminine,
      &ldquo;word&rdquo; is masculine, and nothing about the meaning tells you which.{' '}
      <Term t="number">Number</Term> is singular, plural, or (for a small set of naturally
      paired things like eyes, hands, and ears) <strong>dual</strong>. The endings:
    </P>

    <SectionHeading n={1}>The endings</SectionHeading>
    <MorphTable
      title="Noun endings"
      headers={['', 'Singular', 'Plural', 'Dual']}
      hCols={[1, 2, 3]}
      rows={[
        ['masculine', 'סוּס  (—)', 'סוּסִים  (־ִים)', 'יוֹמַיִם  (־ַיִם)'],
        ['feminine', 'סוּסָה  (־ָה) · בְּרִית  (־ת)', 'סוּסוֹת  (־וֹת)', 'יָדַיִם  (־ַיִם)'],
      ]}
      note="The feminine singular also appears as ־ֶת (דַּעַת knowledge) and ־ִית / ־וּת. The dual ־ַיִם serves both genders."
    />
    <P>
      The dual survives for things that come in pairs and a few time words:{' '}
      <Hb>יָדַיִם</Hb> hands, <Hb>עֵינַיִם</Hb> eyes, <Hb>רַגְלַיִם</Hb> feet,{' '}
      <Hb>יוֹמַיִם</Hb> two days — and, frozen in form, <Hb>שָׁמַיִם</Hb> heavens and{' '}
      <Hb>מִצְרַיִם</Hb> Egypt.
    </P>

    <SectionHeading n={2}>Ending ≠ gender</SectionHeading>
    <P>
      The endings are a guide, not a guarantee. <Hb>אָבוֹת</Hb> &ldquo;fathers&rdquo; is
      masculine despite <Hb>־וֹת</Hb>; <Hb>נָשִׁים</Hb> &ldquo;women&rdquo; and{' '}
      <Hb>עָרִים</Hb> &ldquo;cities&rdquo; are feminine despite <Hb>־ִים</Hb>. Body parts that
      come in pairs are typically feminine (<Hb>יָד</Hb>, <Hb>עַיִן</Hb>). Agreement — with
      adjectives and verbs — follows the noun&rsquo;s real gender, not its ending.
    </P>

    <SectionHeading n={3}>Segholates</SectionHeading>
    <P>
      A large family of two-syllable nouns is accented on the <em>first</em> syllable and
      carries seghol(s): <Hb>מֶלֶךְ</Hb> king, <Hb>סֵפֶר</Hb> book, <Hb>קֹדֶשׁ</Hb> holiness,{' '}
      <Hb>נֶפֶשׁ</Hb> soul, <Hb>אֶרֶץ</Hb> land. They were originally one-syllable words
      (*malk), and the old vowel resurfaces whenever a suffix is added:{' '}
      <Hb>מַלְכִּי</Hb> &ldquo;my king.&rdquo; Their plural swaps to a shared pattern:
    </P>
    <MorphTable
      title="Segholate plurals"
      headers={['Singular', 'Plural', '']}
      hCols={[0, 1]}
      tCols={[2]}
      firstColIsData
      rows={[
        ['מֶלֶךְ', 'מְלָכִים', 'kings'],
        ['סֵפֶר', 'סְפָרִים', 'books'],
        ['נֶפֶשׁ', 'נְפָשׁוֹת', 'souls'],
        ['אֶרֶץ', 'אֲרָצוֹת', 'lands'],
      ]}
    />

    <SectionHeading n={4}>Why the vowels move</SectionHeading>
    <P>
      Adding an ending pulls the stress toward the end of the word, and unstressed long
      vowels two syllables before the stress reduce to shewa: <Hb>דָּבָר</Hb> →{' '}
      <Hb>דְּבָרִים</Hb>, <Hb>נָבִיא</Hb> → <Hb>נְבִיאִים</Hb>, <Hb>שָׁנָה</Hb> →{' '}
      <Hb>שָׁנִים</Hb>. This <em>propretonic reduction</em> is not chaos but a single rule,
      and it returns in the construct state and with every suffix.
    </P>

    <SectionHeading n={5}>Irregular plurals</SectionHeading>
    <MorphTable
      title="Learn these as pairs"
      headers={['Singular', 'Plural', '']}
      hCols={[0, 1]}
      tCols={[2]}
      firstColIsData
      striped
      rows={[
        ['אִישׁ', 'אֲנָשִׁים', 'man → men'],
        ['אִשָּׁה', 'נָשִׁים', 'woman → women'],
        ['בַּיִת', 'בָּתִּים', 'house → houses'],
        ['בֵּן', 'בָּנִים', 'son → sons'],
        ['בַּת', 'בָּנוֹת', 'daughter → daughters'],
        ['אָב', 'אָבוֹת', 'father → fathers'],
        ['אָח', 'אַחִים', 'brother → brothers'],
        ['יוֹם', 'יָמִים', 'day → days'],
        ['עִיר', 'עָרִים', 'city → cities'],
        ['רֹאשׁ', 'רָאשִׁים', 'head → heads'],
      ]}
    />

    <InfoBox title="Watch for">
      <p className="mb-1"><Hb>אֱלֹהִים</Hb> is plural in form but takes singular verbs and adjectives when it means the God of Israel: <Hb>בָּרָא אֱלֹהִים</Hb> — “God created,” singular verb.</p>
      <p><Hb>פָּנִים</Hb> “face” and <Hb>מַיִם</Hb> “water” exist only in the plural/dual form; translate as singular.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Form the plural of <Hb>נָבִיא</Hb> (prophet).</>, a: <><Hb>נְבִיאִים</Hb> — the qamets two back from the new stress reduces to shewa.</> },
        { q: <>What is odd about <Hb>עָרִים</Hb>?</>, a: <>It is the plural of <Hb>עִיר</Hb> “city” — irregular stem, and feminine despite ־ִים.</> },
        { q: <>Parse the number of <Hb>עֵינַיִם</Hb>.</>, a: <>Dual — “(pair of) eyes.”</> },
        { q: <>Why <Hb>מְלָכִים</Hb> and not <Hb>מֶלֶכִים</Hb>?</>, a: <>Segholates rebuild their plural on the pattern <em>CeCaCim</em>: מְלָכִים, סְפָרִים.</> },
      ]}
    />
  </>
)
