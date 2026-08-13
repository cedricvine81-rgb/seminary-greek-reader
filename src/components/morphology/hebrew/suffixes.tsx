/* ─────────────────────────────────────────────
   Hebrew chapter: Pronominal Suffixes

   Possession on nouns (singular and plural bases), objects on
   prepositions and on את. The single highest-frequency piece of
   morphology after the article.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx } from '../shared'

export const HB_SUFFIXES = (
  <>
    <P>
      Hebrew has no possessive words like &ldquo;my&rdquo; or &ldquo;his.&rdquo; The pronoun
      attaches to the end of the noun: <Hb>סוּסִי</Hb> &ldquo;my horse.&rdquo; The same
      suffixes ride on prepositions (<Hb>לִי</Hb> &ldquo;to me&rdquo;) and on the object
      marker (<Hb>אֹתִי</Hb> &ldquo;me&rdquo;). A suffixed noun is automatically definite —
      no article needed or allowed.
    </P>

    <SectionHeading n={1}>On a singular noun</SectionHeading>
    <MorphTable
      title="סוּס “horse” + suffixes"
      headers={['', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[2]}
      highlight="text-red-600 font-medium"
      highlightCols={[]}
      rows={[
        ['1cs', 'סוּסִי', 'my horse'],
        ['2ms', 'סוּסְךָ', 'your horse'],
        ['2fs', 'סוּסֵךְ', 'your horse'],
        ['3ms', 'סוּסוֹ', 'his horse'],
        ['3fs', 'סוּסָהּ', 'her horse  (note the mappiq)'],
        ['1cp', 'סוּסֵנוּ', 'our horse'],
        ['2mp', 'סוּסְכֶם', 'your horse'],
        ['2fp', 'סוּסְכֶן', 'your horse'],
        ['3mp', 'סוּסָם', 'their horse'],
        ['3fp', 'סוּסָן', 'their horse'],
      ]}
    />

    <SectionHeading n={2}>On a plural noun</SectionHeading>
    <P>
      Plural nouns keep the <Hb>י</Hb> of their ending inside every suffix — that yod is your
      clue that the <em>possessed</em> thing is plural:
    </P>
    <MorphTable
      title="סוּסִים “horses” + suffixes"
      headers={['', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[2]}
      rows={[
        ['1cs', 'סוּסַי', 'my horses'],
        ['2ms', 'סוּסֶיךָ', 'your horses'],
        ['2fs', 'סוּסַיִךְ', 'your horses'],
        ['3ms', 'סוּסָיו', 'his horses  (pronounce -av)'],
        ['3fs', 'סוּסֶיהָ', 'her horses'],
        ['1cp', 'סוּסֵינוּ', 'our horses'],
        ['2mp', 'סוּסֵיכֶם', 'your horses'],
        ['2fp', 'סוּסֵיכֶן', 'your horses'],
        ['3mp', 'סוּסֵיהֶם', 'their horses'],
        ['3fp', 'סוּסֵיהֶן', 'their horses'],
      ]}
      note="Feminine plurals in ־וֹת take these same “plural-style” suffixes on top of the ות: תּוֹרוֹתָיו “his laws”."
    />

    <SectionHeading n={3}>On prepositions</SectionHeading>
    <MorphTable
      title="Prepositions + suffixes"
      headers={['', 'לְ “to”', 'בְּ “in”', 'עִם “with”', 'מִן “from”', 'עַל “on”  (plural-style)']}
      hCols={[1, 2, 3, 4, 5]}
      rows={[
        ['1cs', 'לִי', 'בִּי', 'עִמִּי', 'מִמֶּנִּי', 'עָלַי'],
        ['2ms', 'לְךָ', 'בְּךָ', 'עִמְּךָ', 'מִמְּךָ', 'עָלֶיךָ'],
        ['2fs', 'לָךְ', 'בָּךְ', 'עִמָּךְ', 'מִמֵּךְ', 'עָלַיִךְ'],
        ['3ms', 'לוֹ', 'בּוֹ', 'עִמּוֹ', 'מִמֶּנּוּ', 'עָלָיו'],
        ['3fs', 'לָהּ', 'בָּהּ', 'עִמָּהּ', 'מִמֶּנָּה', 'עָלֶיהָ'],
        ['1cp', 'לָנוּ', 'בָּנוּ', 'עִמָּנוּ', 'מִמֶּנּוּ', 'עָלֵינוּ'],
        ['2mp', 'לָכֶם', 'בָּכֶם', 'עִמָּכֶם', 'מִכֶּם', 'עֲלֵיכֶם'],
        ['3mp', 'לָהֶם', 'בָּהֶם', 'עִמָּהֶם', 'מֵהֶם', 'עֲלֵיהֶם'],
      ]}
      note="אֶל “to” declines like עַל: אֵלַי, אֵלֶיךָ, אֵלָיו… Note מִמֶּנּוּ is BOTH “from him” and “from us” — context decides."
    />

    <SectionHeading n={4}>On the object marker</SectionHeading>
    <MorphTable
      title="את + suffixes: the object pronouns"
      headers={['', 'Singular', 'Plural']}
      hCols={[1, 2]}
      rows={[
        ['1c', 'אֹתִי  me', 'אֹתָנוּ  us'],
        ['2m', 'אֹתְךָ  you', 'אֶתְכֶם  you'],
        ['2f', 'אֹתָךְ  you', 'אֶתְכֶן  you'],
        ['3m', 'אֹתוֹ  him', 'אֹתָם  them'],
        ['3f', 'אֹתָהּ  her', 'אֹתָן  them'],
      ]}
    />
    <HbEx he="עִמָּנוּ אֵל" en={<>Immanuel (Isa 7:14) — עִם “with” + ־נוּ “us” + אֵל “God”: the name is a suffix lesson.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1"><Hb>אֹתוֹ</Hb> “him” (object marker) vs <Hb>אִתּוֹ</Hb> “with him” (the preposition את, hireq + dagesh). Same consonants, different words.</p>
      <p className="mb-1">The 3ms singular suffix ‏<Hb>וֹ</Hb> and the 3ms plural-style ‏<Hb>ָיו</Hb> both mean “his” — the yod tells you whether he owns one or many.</p>
      <p>Nouns often shift vowels before suffixes (<Hb>דָּבָר</Hb> → <Hb>דְּבָרוֹ</Hb> “his word”; segholates restore the old vowel: <Hb>מַלְכִּי</Hb> “my king”).</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Parse and translate <Hb>סוּסֶיהָ</Hb>.</>, a: <>Noun + 3fs suffix on a plural base — “her horses” (the י marks the plural).</> },
        { q: <>Parse and translate <Hb>תּוֹרָתוֹ</Hb>.</>, a: <>“his law” — fs noun תּוֹרָה, construct-style base תּוֹרָת + וֹ.</> },
        { q: <><Hb>מִמֶּנּוּ</Hb> — “from him” or “from us”?</>, a: <>Either. The forms are identical; only context decides.</> },
        { q: <>Translate <Hb>שְׁמַע לָנוּ</Hb> vs <Hb>שְׁמָעֵנוּ</Hb>? Which suffix set does לָנוּ use?</>, a: <>Both mean “hear us”; לָנוּ is the preposition לְ + 1cp suffix — the same suffix family the nouns use.</> },
      ]}
    />
  </>
)
