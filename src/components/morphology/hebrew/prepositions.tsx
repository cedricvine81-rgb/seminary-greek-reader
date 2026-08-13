/* ─────────────────────────────────────────────
   Hebrew chapter: Prepositions

   The three inseparables and their pointing, מן and its assimilation,
   the independent prepositions, and the direct-object marker את —
   which is not a preposition but is met here because it looks like one.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_PREPOSITIONS = (
  <>
    <P>
      A <Term t="preposition">preposition</Term> is a little relationship word — &ldquo;in,
      to, like, from, with.&rdquo; Hebrew&rsquo;s three commonest are not even separate
      words: they are single letters glued to the front of the next word, which is why they
      are called <em>inseparable</em>.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">A preposition is a small word that positions one thing relative to another: <em>in</em> the house, <em>to</em> the city, <em>like</em> a lion, <em>from</em> Egypt. English writes them as separate words; Hebrew glues its three commonest to the front of the next word, exactly as it glued “the”: <Hb>בְּבַיִת</Hb> “in-a-house,” one word.</p>
      <p>English actually does this in a few fossils — <em>aboard</em> (“on board”), <em>ashore</em>, <em>tonight</em> — it just stopped doing it productively. Hebrew never stopped.</p>
    </InfoBox>

    <SectionHeading n={1}>The inseparable prepositions: בְּ, כְּ, לְ</SectionHeading>
    <P>
      Three prepositions are prefixes, never separate words: <Hb>בְּ</Hb> &ldquo;in, by,
      with,&rdquo; <Hb>כְּ</Hb> &ldquo;like, as,&rdquo; <Hb>לְ</Hb> &ldquo;to, for.&rdquo;
      Their pointing follows the same instincts as the conjunction <Hb>וְ</Hb> (taught with
      the article, in the previous chapter):
    </P>
    <MorphTable
      title="Pointing בְּ, כְּ, לְ"
      headers={['Before…', 'Form', 'Example', '']}
      tCols={[0, 3]}
      hCols={[1, 2]}
      firstColIsData
      rows={[
        ['most letters', 'בְּ', 'בְּבַיִת', 'in a house'],
        ['a vocal shewa', 'בִּ', 'בִּדְבַר', 'by the word of'],
        ['a composite shewa', 'its short vowel', 'בַּאֲשֶׁר', 'in that…'],
        ['אֱלֹהִים', 'בֵּ  (the alef quiesces)', 'בֵּאלֹהִים', 'in God'],
        ['the article', 'the preposition swallows the ה and takes its pointing', 'בַּבַּיִת', 'in the house'],
      ]}
      note="So לְ + הָעָם → לָעָם “for the people”; כְּ + הַיּוֹם → כַּיּוֹם “as the day”. The ה of the article vanishes; its vowel and dagesh remain."
    />

    <SectionHeading n={2}>מִן — “from”</SectionHeading>
    <P>
      <Hb>מִן</Hb> stands free with a maqqef (<Hb>מִן־הָעִיר</Hb>, &ldquo;from the city&rdquo;)
      or fuses onto the word. When it fuses, its <Hb>נ</Hb> assimilates into the next letter as
      a dagesh forte — and before a guttural, which cannot take the dagesh, the vowel
      lengthens to <Hb>מֵ</Hb>:
    </P>
    <MorphTable
      title="מן fused"
      headers={['', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      rows={[
        ['before ordinary letters: מִ + dagesh', 'מִמֶּלֶךְ', 'from a king'],
        ['before gutturals and ר: מֵ', 'מֵאִישׁ', 'from a man'],
        ['', 'מֵעִיר', 'from a city'],
      ]}
    />

    <SectionHeading n={3}>The independent prepositions</SectionHeading>
    <MorphTable
      title="Common independent prepositions"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      striped
      rows={[
        ['אֶל', 'to, toward'],
        ['עַל', 'on, over, against'],
        ['עִם', 'with'],
        ['אֵת / אֶת־', 'with (a second, distinct את — see §4)'],
        ['תַּחַת', 'under; instead of'],
        ['לִפְנֵי', 'before, in the presence of (lit. “to the face of”)'],
        ['אַחֲרֵי', 'after, behind'],
        ['בֵּין', 'between'],
        ['עַד', 'until, as far as'],
        ['אֵצֶל', 'beside'],
      ]}
    />

    <SectionHeading n={4}>The object marker אֵת</SectionHeading>
    <P>
      Hebrew flags a <strong>definite direct object</strong> with <Hb>אֵת</Hb> (usually{' '}
      <Hb>אֶת־</Hb> with maqqef). It is untranslated — a grammatical signpost, not a word with
      meaning. Indefinite objects go unmarked.
    </P>
    <HbEx he="בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ" en={<>“God created the heavens and the earth” (Gen 1:1) — both objects are definite, so both carry אֵת.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">Two different words spell את: the object marker (<Hb>אֹתוֹ</Hb> “him” with suffixes) and the preposition “with” (<Hb>אִתּוֹ</Hb> “with him” — hireq and dagesh). Context and pointing separate them.</p>
      <p className="mb-1"><Hb>לְ</Hb> + infinitive construct (<Hb>לִקְטֹל</Hb>) is the ordinary way to say “to do” — you will meet it constantly from the Infinitives chapter on.</p>
      <p>מִן also builds the comparative: <Hb>טוֹב מִזָּהָב</Hb>, “better than gold.”</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Combine: <Hb>בְּ</Hb> + <Hb>הַשָּׁמַיִם</Hb>.</>, a: <><Hb>בַּשָּׁמַיִם</Hb> — the ה drops, the preposition inherits patach and the dagesh stays.</> },
        { q: <>Combine: <Hb>מִן</Hb> + <Hb>בַּיִת</Hb> (fused).</>, a: <><Hb>מִבַּיִת</Hb> — the נ assimilates as dagesh forte in the ב.</> },
        { q: <>Combine: <Hb>מִן</Hb> + <Hb>עִיר</Hb> (fused).</>, a: <><Hb>מֵעִיר</Hb> — ayin refuses the dagesh, so the hireq lengthens to tsere.</> },
        { q: <>Why does Gen 1:1 read <Hb>אֵת הַשָּׁמַיִם</Hb> but no את before <Hb>אֱלֹהִים</Hb>?</>, a: <>Because אלהים is the <em>subject</em>. את marks only the definite direct object.</> },
      ]}
    />
  </>
)
