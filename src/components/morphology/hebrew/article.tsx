/* ─────────────────────────────────────────────
   Hebrew chapter: The Article & the Conjunction ו

   The two commonest prefixes in the language, and the pointing rules
   the gutturals force on both.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx } from '../shared'

export const HB_ARTICLE = (
  <>
    <P>
      Hebrew has no word for &ldquo;a&rdquo;: <Hb>מֶלֶךְ</Hb> is &ldquo;a king&rdquo; on its
      own. The definite article is not a separate word but a prefix — <Hb>הַ</Hb> plus a{' '}
      <strong>doubling</strong> of the next letter: <Hb>הַמֶּלֶךְ</Hb>, &ldquo;the king.&rdquo;
    </P>

    <SectionHeading n={1}>The article: הַ + dagesh forte</SectionHeading>
    <MorphTable
      title="The regular article"
      headers={['Without', 'With the article', '']}
      hCols={[0, 1]}
      tCols={[2]}
      firstColIsData
      rows={[
        ['סוּס', 'הַסּוּס', 'the horse'],
        ['מֶלֶךְ', 'הַמֶּלֶךְ', 'the king'],
        ['דָּבָר', 'הַדָּבָר', 'the word'],
      ]}
    />

    <SectionHeading n={2}>Before gutturals</SectionHeading>
    <P>
      Gutturals refuse doubling, so the article compensates — usually by lengthening its own
      vowel. The pattern is worth memorising once, because the inseparable prepositions reuse
      it.
    </P>
    <MorphTable
      title="The article before gutturals"
      headers={['Next letter', 'Article', 'Example', '']}
      tCols={[0, 3]}
      hCols={[1, 2]}
      firstColIsData
      rows={[
        ['א, ע, ר', 'הָ', 'הָאִישׁ', 'the man'],
        ['ה, ח', 'הַ  (no dagesh — “virtual” doubling)', 'הַהֵיכָל', 'the temple'],
        ['unaccented הָ, עָ — and any חָ', 'הֶ', 'הֶעָרִים', 'the cities'],
      ]}
      note="More examples: הָעָם the people, הָרֹאשׁ the head, הַחֶרֶב the sword, הֶהָרִים the mountains, הֶחָכָם the wise man."
    />

    <SectionHeading n={3}>The conjunction וְ</SectionHeading>
    <P>
      &ldquo;And&rdquo; is likewise a prefix: <Hb>וְ</Hb>. It glues clauses together so
      relentlessly that most verses of narrative begin with it. Its pointing shifts with what
      follows:
    </P>
    <MorphTable
      title="Pointing the conjunction"
      headers={['Before…', 'Form', 'Example', '']}
      tCols={[0, 3]}
      hCols={[1, 2]}
      firstColIsData
      rows={[
        ['most letters', 'וְ', 'וְדָבָר', 'and a word'],
        ['ב, מ, פ  (the “bump” letters)', 'וּ', 'וּמֶלֶךְ', 'and a king'],
        ['a vocal shewa', 'וּ', 'וּדְבָרִים', 'and words'],
        ['יְ', 'וִי  (the shewa drops)', 'וִיהוּדָה', 'and Judah'],
        ['a composite shewa', 'its short vowel', 'וַאֲנִי', 'and I'],
        ['an accented syllable (often)', 'וָ', 'תֹהוּ וָבֹהוּ', 'formless and void'],
      ]}
    />
    <HbEx he="וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ" en={<>“and the earth was formless and void” (Gen 1:2) — the plain וְ on the article, and the accented-pair וָ.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">The וּ form is a vowel, so a begadkephat letter after it goes soft: <Hb>וּבַיִת</Hb> is <em>u-vayit</em> — no dagesh lene in the ב.</p>
      <p className="mb-1">The article’s ה never elides after itself — but it does after the inseparable prepositions (next chapter): <Hb>בַּבַּיִת</Hb> = <Hb>בְּ</Hb> + <Hb>הַבַּיִת</Hb>.</p>
      <p>Names are definite without the article; so are nouns with a pronominal suffix. <Hb>הַ</Hb> on a proper name almost always signals something else (a he-interrogative, or a gentilic).</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Point the article on <Hb>עִיר</Hb> (city).</>, a: <><Hb>הָעִיר</Hb> — ayin is a guttural, so הָ with no doubling.</> },
        { q: <>Point the article on <Hb>חֶרֶב</Hb> (sword).</>, a: <><Hb>הַחֶרֶב</Hb> — het takes הַ with virtual doubling.</> },
        { q: <>Point “and Samuel”: <Hb>וְ</Hb> + <Hb>שְׁמוּאֵל</Hb>.</>, a: <><Hb>וּשְׁמוּאֵל</Hb> — before a vocal shewa the conjunction becomes וּ.</> },
        { q: <>Why is it <Hb>הֶהָרִים</Hb> and not <Hb>הַהָרִים</Hb>?</>, a: <>Before an unaccented הָ the article dissimilates to הֶ.</> },
      ]}
    />
  </>
)
