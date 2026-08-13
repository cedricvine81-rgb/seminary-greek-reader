/* ─────────────────────────────────────────────
   Hebrew chapter: Pronouns

   Independent personal pronouns, demonstratives (near and far),
   the relative אשׁר, and the interrogatives.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples } from '../shared'

export const HB_PRONOUNS = (
  <>
    <P>
      A <Term t="pronoun">pronoun</Term> stands in for a noun: &ldquo;he,&rdquo;
      &ldquo;she,&rdquo; &ldquo;this,&rdquo; &ldquo;who.&rdquo; Hebrew&rsquo;s personal
      pronouns come in two forms: <em>independent</em> words (this section) used mostly as
      subjects — and <Term t="suffix">suffixes</Term> glued to the end of other words for
      &ldquo;my / your / his&rdquo; and for objects, which get their own chapter.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">A pronoun stands in for a name: <em>I, you, he, she, we, they</em>. Grammars sort them by <strong>person</strong> — first person is the speaker (I/we), second is the one spoken TO (you), third is the one spoken ABOUT (he/she/they) — and Hebrew adds gender to “you” and “they”: <Hb>אַתָּה</Hb> is “you” to a man, <Hb>אַתְּ</Hb> “you” to a woman.</p>
      <p>One habit to build now: Hebrew usually buries its pronouns inside verb endings, so when a sentence spells out a separate pronoun — <Hb>אֲנִי</Hb>, <Hb>הוּא</Hb> — it is leaning on it: “<em>I myself</em> …”, “<em>he</em> is the one who …”.</p>
    </InfoBox>

    <SectionHeading n={1}>Independent personal pronouns</SectionHeading>
    <P>
      These are <strong>subject</strong> pronouns. Since the verb already encodes its subject,
      an independent pronoun beside a verb adds emphasis; their everyday work is in verbless
      clauses — <Hb>אֲנִי יְהוָה</Hb>, &ldquo;I <em>am</em> the LORD.&rdquo;
    </P>
    <MorphTable
      title="Personal pronouns"
      headers={['', 'Singular', 'Plural']}
      hCols={[1, 2]}
      rows={[
        ['1c', 'אֲנִי · אָנֹכִי', 'אֲנַחְנוּ'],
        ['2m', 'אַתָּה', 'אַתֶּם'],
        ['2f', 'אַתְּ', 'אַתֶּן'],
        ['3m', 'הוּא', 'הֵם · הֵמָּה'],
        ['3f', 'הִיא', 'הֵנָּה'],
      ]}
      note="אֲנִי and אָנֹכִי are interchangeable; the longer form is common in solemn speech. In the Pentateuch הִוא is often written for הִיא."
    />

    <SectionHeading n={2}>Demonstratives</SectionHeading>
    <MorphTable
      title="“this / these” and “that / those”"
      headers={['', 'ms', 'fs', 'plural']}
      hCols={[1, 2, 3]}
      rows={[
        ['near', 'זֶה', 'זֹאת', 'אֵלֶּה'],
        ['far', 'הוּא', 'הִיא', 'הֵם · הֵנָּה'],
      ]}
      note="“That” is simply the third-person pronoun pressed into service."
    />
    <P>
      Demonstratives behave exactly like adjectives. Attributive — after the noun, with the
      article: <Hb>הָאִישׁ הַזֶּה</Hb> &ldquo;this man,&rdquo; <Hb>הָאִישׁ הַהוּא</Hb>{' '}
      &ldquo;that man.&rdquo; Predicate — first and bare: <Hb>זֶה הַדָּבָר</Hb> &ldquo;this is
      the word.&rdquo;
    </P>

    <SectionHeading n={3}>The relative: אֲשֶׁר</SectionHeading>
    <P>
      One indeclinable word covers &ldquo;who, whom, which, that&rdquo;:{' '}
      <Hb>הָאִישׁ אֲשֶׁר שָׁמַר אֶת־הַתּוֹרָה</Hb>, &ldquo;the man who kept the law.&rdquo;
      Where English needs &ldquo;in which / whose,&rdquo; Hebrew resumes with a pronoun inside
      the clause: <Hb>הָאָרֶץ אֲשֶׁר אַתָּה שֹׁכֵב עָלֶיהָ</Hb> — &ldquo;the land which you
      lie <em>on it</em>&rdquo; (Gen 28:13). Later Hebrew abbreviates אשׁר to the prefix{' '}
      <Hb>שֶׁ־</Hb>.
    </P>

    <SectionHeading n={4}>Interrogatives</SectionHeading>
    <MorphTable
      title="Question words"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['מִי', 'who?  — מִי הָאִישׁ הַזֶּה “who is this man?”'],
        ['מָה · מַה־', 'what?  — usually מַה־ with maqqef and doubling: מַה־זֹּאת'],
        ['הֲ', 'the yes/no question prefix: הֲטוֹב הַדָּבָר “is the thing good?”'],
      ]}
      note="Pointing of מה varies with what follows (מָה, מַה־, מֶה) — recognise, don’t memorise."
    />
    <HbEx he="מִי־כָמֹכָה בָּאֵלִם יְהוָה" en={<>“Who is like you among the gods, O LORD?” (Exod 15:11).</>} />

    <InfoBox title="Watch for">
      <p className="mb-1"><Hb>הוּא</Hb> after a definite noun with its own article is “that” (<Hb>הַיּוֹם הַהוּא</Hb> “that day”); between two nouns it can be the copula: <Hb>יְהוָה הוּא הָאֱלֹהִים</Hb> “the LORD, he is God” (1 Kgs 18:39).</p>
      <p><Hb>זֶה</Hb> without the article before a noun is predicate: <Hb>זֶה הַיּוֹם</Hb> “this is the day” (Ps 118:24).</p>
    </InfoBox>

    <HbExamples id="pronouns" />

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Translate <Hb>הַתּוֹרָה הַזֹּאת</Hb>.</>, a: <>“this law” — attributive: article on both.</> },
        { q: <>Translate <Hb>זֹאת הַתּוֹרָה</Hb>.</>, a: <>“this is the law” — predicate demonstrative.</> },
        { q: <>Say “that city.”</>, a: <><Hb>הָעִיר הַהִיא</Hb> — עיר is feminine, and “that” is the 3fs pronoun with the article.</> },
        { q: <>Parse <Hb>אַתֶּם</Hb>.</>, a: <>Independent personal pronoun, 2mp — “you (all).”</> },
      ]}
    />
  </>
)
