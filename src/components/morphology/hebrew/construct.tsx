/* ─────────────────────────────────────────────
   Hebrew chapter: The Construct State

   How Hebrew says "X of Y": construct forms, the definiteness rule,
   and what may (and may not) interrupt a construct chain.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples } from '../shared'

export const HB_CONSTRUCT = (
  <>
    <P>
      Hebrew has no word for &ldquo;of.&rdquo; To say &ldquo;the word of the king&rdquo; it
      simply sets two nouns side by side — <Hb>דְּבַר הַמֶּלֶךְ</Hb> — with the first noun in
      a compressed form called the <Term t="construct state"><strong>construct state</strong></Term>,
      leaning its accent on the noun that follows (compare how English compresses
      &ldquo;dog&rdquo; in &ldquo;doghouse&rdquo;). The ordinary dictionary form is the{' '}
      <Term t="absolute"><strong>absolute</strong></Term> state.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">English owns two ways to say possession: <em>the king’s horse</em> and <em>the horse of the king</em>. Hebrew has only the second — minus the word “of.” The two nouns simply stand together, and the first one compresses (loses its stress, often shortens its vowels) because it is hurrying on to the noun that completes it: <Hb>סוּס הַמֶּלֶךְ</Hb> “the horse of-the-king.”</p>
      <p>Chains work like English possessive chains — “my brother’s wife’s mother” — except read forwards: <Hb>דְּבַר עֶבֶד הַמֶּלֶךְ</Hb> “the word of the servant of the king.” Every link but the last is in construct.</p>
    </InfoBox>

    <SectionHeading n={1}>Construct forms</SectionHeading>
    <MorphTable
      title="Absolute → construct"
      headers={['Absolute', 'Construct', '']}
      hCols={[0, 1]}
      tCols={[2]}
      firstColIsData
      striped
      rows={[
        ['דָּבָר', 'דְּבַר', 'word of'],
        ['דְּבָרִים', 'דִּבְרֵי', 'words of'],
        ['סוּסִים', 'סוּסֵי', 'horses of'],
        ['תּוֹרָה', 'תּוֹרַת', 'law of'],
        ['מִשְׁפָּחָה', 'מִשְׁפַּחַת', 'family of'],
        ['בַּיִת', 'בֵּית', 'house of'],
        ['בָּנִים', 'בְּנֵי', 'sons of'],
        ['אֱלֹהִים', 'אֱלֹהֵי', 'God of'],
      ]}
      note="The signatures: mp ־ִים → ־ֵי; fs ־ָה → ־ַת; and internal vowels shorten, because the construct gives up its own stress."
    />

    <SectionHeading n={2}>The definiteness rule</SectionHeading>
    <P>
      A construct noun <strong>never takes the article</strong>. The whole chain is{' '}
      <Term t="definite">definite</Term> if its <em>last</em> noun is definite — by article,
      by suffix, or by being a name:
    </P>
    <MorphTable
      title="Definiteness travels up the chain"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['דְּבַר מֶלֶךְ', 'a word of a king'],
        ['דְּבַר הַמֶּלֶךְ', 'THE word of the king'],
        ['דְּבַר־יְהוָה', 'the word of the LORD'],
        ['בֵּית לֶחֶם', 'Bethlehem — “house of bread”'],
        ['אֱלֹהֵי יִשְׂרָאֵל', 'the God of Israel'],
      ]}
    />
    <P>
      That is why &ldquo;a word of the king&rdquo; cannot be said with a construct chain at
      all — Hebrew must paraphrase with <Hb>לְ</Hb>: <Hb>דָּבָר לַמֶּלֶךְ</Hb>.
    </P>

    <SectionHeading n={3}>Chain rules</SectionHeading>
    <P>
      Nothing may interrupt a chain — not even an adjective. Modifiers wait until the chain
      is finished, then agree with whichever noun they describe:{' '}
      <Hb>דְּבַר הַמֶּלֶךְ הַגָּדוֹל</Hb> — &ldquo;the word of the great king&rdquo; (or
      &ldquo;the great word of the king&rdquo;; gender and number decide when they can).
      Chains can run three nouns deep — <Hb>סֵפֶר תּוֹרַת אֱלֹהִים</Hb>, read from the front:
      &ldquo;the book of the law of God.&rdquo;
    </P>
    <HbEx he="בְּיוֹם עֲשׂוֹת יְהוָה אֱלֹהִים אֶרֶץ וְשָׁמָיִם" en={<>“in the day the LORD God made earth and heavens” (Gen 2:4) — even an infinitive can stand in construct: “in the day of the making of…”.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">Construct plural <Hb>־ֵי</Hb> looks like the 1cs suffix <Hb>־ַי</Hb> (“my”) at a glance. The construct is followed by another noun; the suffix ends the phrase.</p>
      <p className="mb-1"><Hb>בֶּן־</Hb> “son of” builds ages and classes: <Hb>בֶּן־שָׁנָה</Hb> “a year old.”</p>
      <p>Translate chains back to front when English needs it, but <em>parse</em> them front to back.</p>
    </InfoBox>

    <HbExamples id="construct" />

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Is <Hb>סוּסֵי הַמֶּלֶךְ</Hb> definite or indefinite? Translate it.</>, a: <>Definite — the last noun carries the article: “the horses of the king.”</> },
        { q: <>Why is <Hb>הַדְּבַר הַמֶּלֶךְ</Hb> impossible?</>, a: <>A construct noun never takes the article; definiteness comes only from the end of the chain.</> },
        { q: <>Translate <Hb>תּוֹרַת מֹשֶׁה</Hb>.</>, a: <>“the law of Moses” — definite because מֹשֶׁה is a proper name.</> },
        { q: <>Form the construct of <Hb>בָּנִים</Hb> and translate <Hb>__ יִשְׂרָאֵל</Hb>.</>, a: <><Hb>בְּנֵי יִשְׂרָאֵל</Hb> — “the sons/children of Israel.”</> },
      ]}
    />
  </>
)
