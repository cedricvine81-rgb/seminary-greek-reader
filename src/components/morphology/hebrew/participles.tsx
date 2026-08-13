/* ─────────────────────────────────────────────
   Hebrew chapter: Participles

   Active and passive forms, and the three uses — verbal,
   attributive, substantive — plus the construct participle.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx } from '../shared'

export const HB_PARTICIPLES = (
  <>
    <P>
      The participle is a verb wearing a noun&rsquo;s clothes: it has gender, number and
      state — never person. It paints action as <em>ongoing</em>, and in later Hebrew it
      grows into the present tense.
    </P>

    <SectionHeading n={1}>Forms</SectionHeading>
    <MorphTable
      title="Qal active participle (“killing”)"
      headers={['', 'Masculine', 'Feminine']}
      hCols={[1, 2]}
      rows={[
        ['singular', 'קֹטֵל', 'קֹטֶלֶת · קֹטְלָה'],
        ['plural', 'קֹטְלִים', 'קֹטְלוֹת'],
      ]}
      note="Signature: holem after the first radical, tsere after the second. The fs usually takes the ־ֶת shape."
    />
    <MorphTable
      title="Qal passive participle (“killed”)"
      headers={['', 'Masculine', 'Feminine']}
      hCols={[1, 2]}
      rows={[
        ['singular', 'קָטוּל', 'קְטוּלָה'],
        ['plural', 'קְטוּלִים', 'קְטוּלוֹת'],
      ]}
      note="Signature: shureq between the second and third radicals. בָּרוּךְ “blessed” is the passive participle of ברך."
    />

    <SectionHeading n={2}>The three uses</SectionHeading>
    <MorphTable
      title="How participles work"
      headers={['Use', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['verbal — ongoing action', 'הָאִישׁ יֹשֵׁב בָּעִיר', 'the man is sitting in the city'],
        ['attributive — like an adjective', 'הָאֵשׁ הַבֹּעֶרֶת', 'the burning fire'],
        ['substantive — “the one who…”', 'הַיֹּשֵׁב בַּשָּׁמַיִם', 'the One sitting in the heavens  (Ps 2:4)'],
      ]}
    />
    <P>
      The substantive use supplies Hebrew&rsquo;s agent nouns: <Hb>שֹׁפֵט</Hb> a judge
      (&ldquo;one judging&rdquo;), <Hb>רֹעֶה</Hb> a shepherd, <Hb>כֹּהֵן</Hb> a priest. Like
      any noun, a participle can stand in construct: <Hb>יֹשְׁבֵי הָאָרֶץ</Hb>, &ldquo;the
      inhabitants of the land.&rdquo;
    </P>
    <HbEx he="שֹׁמֵר יִשְׂרָאֵל" en={<>“the Keeper of Israel” (Ps 121:4) — participle in construct; the psalm turns on the root שׁמר repeated as a participle.</>} />

    <SectionHeading n={3}>Participle clauses</SectionHeading>
    <P>
      Participle + subject (either order) makes a present-tense clause without any
      &ldquo;is&rdquo;: <Hb>הִנֵּה אָנֹכִי עֹשֶׂה</Hb>, &ldquo;behold, I am doing…&rdquo;
      With <Hb>הָיָה</Hb> it builds past continuous: <Hb>הָיָה רֹעֶה</Hb>, &ldquo;he was
      shepherding.&rdquo; Negation uses <Hb>אֵין</Hb>: <Hb>אֵין שֹׁמֵעַ</Hb>, &ldquo;there is
      no one listening.&rdquo;
    </P>

    <InfoBox title="Watch for">
      <p className="mb-1"><Hb>קֹטֵל</Hb> vs perfect <Hb>קָטַל</Hb>: holem in the first syllable = participle. The holem is often written plene: קוֹטֵל.</p>
      <p className="mb-1">In parsing, participles take gender / number / state — never person. Ticking “person” on a quiz excludes every participle.</p>
      <p>The far demonstrative and the article turn a participle into a relative clause on the cheap: <Hb>הָעֹשֶׂה</Hb> “the one who does / who did.”</p>
    </InfoBox>

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>כֹּתְבִים</Hb>, a: <>Qal active participle mp of <Hb>כתב</Hb> — “(men) writing.”</> },
        { q: <Hb>בָּרוּךְ</Hb>, a: <>Qal passive participle ms of <Hb>ברך</Hb> — “blessed.”</> },
        { q: <Hb>שֹׁמֶרֶת</Hb>, a: <>Qal active participle fs of <Hb>שׁמר</Hb> — “(a woman) keeping.”</> },
        { q: <>Translate <Hb>הָעָם הַיֹּשֵׁב בָּאָרֶץ</Hb>.</>, a: <>“the people dwelling in the land” — attributive participle with article agreement.</> },
      ]}
    />
  </>
)
