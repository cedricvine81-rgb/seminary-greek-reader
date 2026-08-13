/* ─────────────────────────────────────────────
   Hebrew chapter: Adjectives

   Forms, the three uses (attributive, predicate, substantive),
   and comparison with מן.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_ADJECTIVES = (
  <>
    <P>
      An <Term t="adjective">adjective</Term> describes a noun — &ldquo;the <em>good</em>{' '}
      word,&rdquo; &ldquo;a <em>great</em> king.&rdquo; In Hebrew an adjective changes its
      ending to match the noun it describes in <Term t="gender">gender</Term> and{' '}
      <Term t="number">number</Term>, using the same endings the nouns themselves use — so
      the noun chapter has already taught you the forms.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1"><strong>Agreement is the new idea here.</strong> An English adjective never changes: <em>the tall man, the tall woman, the tall men</em> — “tall” sits still. A Hebrew adjective changes its ending to MATCH its noun in gender and number — the same red endings the nouns chapter taught: <Hb>אִישׁ טוֹב</Hb> “a good man,” <Hb>אִשָּׁה טוֹבָה</Hb> “a good woman,” <Hb>אֲנָשִׁים טוֹבִים</Hb> “good men.”</p>
      <p>Spanish speakers know this move already (<em>alto / alta / altos / altas</em>). The payoff for reading: the matching endings tell you which noun an adjective belongs to, even from a distance.</p>
    </InfoBox>

    <SectionHeading n={1}>Forms</SectionHeading>
    <P>
      Adjectives take the same endings as nouns and agree with their noun in gender and
      number — using the noun&rsquo;s <em>real</em> gender, not its ending.
    </P>
    <MorphTable
      title="טוֹב “good” and גָּדוֹל “great”"
      headers={['', 'ms', 'fs', 'mp', 'fp']}
      hCols={[1, 2, 3, 4]}
      rows={[
        ['good', 'טוֹב', 'טוֹבָ|ה', 'טוֹבִ|ים', 'טוֹב|וֹת'],
        ['great', 'גָּדוֹל', 'גְּדוֹלָ|ה', 'גְּדוֹלִ|ים', 'גְּדוֹל|וֹת'],
      ]}
      note="The usual vowel reduction applies when the ending draws the stress: גָּדוֹל → גְּדוֹלָה."
    />

    <SectionHeading n={2}>Attributive: “the good man”</SectionHeading>
    <P>
      An attributive adjective <strong>follows</strong> its noun and matches it in
      definiteness — a definite noun means an article on the adjective too:
    </P>
    <MorphTable
      title="Attributive position"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['אִישׁ טוֹב', 'a good man'],
        ['הָאִישׁ הַטּוֹב', 'the good man'],
        ['אִשָּׁה טוֹבָה', 'a good woman'],
        ['הֶעָרִים הַגְּדֹלוֹת', 'the great cities  (עיר is feminine!)'],
      ]}
    />

    <SectionHeading n={3}>Predicate: “the man is good”</SectionHeading>
    <P>
      Drop the adjective&rsquo;s article — and usually put it first — and the phrase becomes a
      whole sentence, no verb &ldquo;to be&rdquo; required. This <em>verbless clause</em> is
      one of Hebrew&rsquo;s most characteristic constructions.
    </P>
    <MorphTable
      title="Attributive vs predicate"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['הָאִישׁ הַטּוֹב', 'the good man  (a phrase)'],
        ['טוֹב הָאִישׁ', 'the man is good  (a sentence)'],
        ['הָאִישׁ טוֹב', 'the man is good  (also possible)'],
      ]}
      note="The test is the article: noun definite + adjective bare = predicate."
    />
    <HbEx he="טוֹב־יְהוָה לַכֹּל" en={<>“the LORD is good to all” (Ps 145:9).</>} />

    <SectionHeading n={4}>Substantive: “the wise (one)”</SectionHeading>
    <P>
      With no noun at all, the adjective stands as one: <Hb>הֶחָכָם</Hb> &ldquo;the wise
      man,&rdquo; <Hb>הָרְשָׁעִים</Hb> &ldquo;the wicked.&rdquo; English does the same with
      &ldquo;the good, the bad…&rdquo;
    </P>

    <SectionHeading n={5}>Comparison</SectionHeading>
    <P>
      Hebrew has no &ldquo;-er&rdquo; or &ldquo;more.&rdquo; It compares with <Hb>מִן</Hb>:
      literally &ldquo;good <em>from</em>&rdquo; = &ldquo;better than.&rdquo; The superlative
      is usually a definite adjective or a construct idiom.
    </P>
    <MorphTable
      title="Comparative and superlative"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['טוֹבָה חָכְמָה מִזָּהָב', 'wisdom is better than gold  (cf. Prov 16:16)'],
        ['גָּדוֹל מִכָּל־הָעָם', 'greater than all the people'],
        ['הַקָּטֹן', 'the youngest  (definite adjective as superlative)'],
        ['שִׁיר הַשִּׁירִים', 'the Song of Songs — “the greatest song” (construct superlative)'],
      ]}
    />

    <InfoBox title="Watch for">
      <p className="mb-1">Demonstratives sit in the same slots: attributive <Hb>הָאִישׁ הַזֶּה</Hb> “this man”, predicate <Hb>זֶה הָאִישׁ</Hb> “this is the man.”</p>
      <p>When both readings are grammatical (<Hb>הָאִישׁ טוֹב</Hb>), context decides — start by trying the predicate.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Attributive or predicate? <Hb>הַדָּבָר הַגָּדוֹל</Hb></>, a: <>Attributive — both carry the article: “the great word.”</> },
        { q: <>Attributive or predicate? <Hb>גָּדוֹל הַדָּבָר</Hb></>, a: <>Predicate — bare adjective before a definite noun: “the word is great.”</> },
        { q: <>Say “the good women.”</>, a: <><Hb>הַנָּשִׁים הַטּוֹבוֹת</Hb> — feminine plural agreement with the irregular נָשִׁים.</> },
        { q: <>Translate <Hb>חָכָם מִכָּל־אָדָם</Hb>.</>, a: <>“wiser than any man” — מן of comparison.</> },
      ]}
    />
  </>
)
