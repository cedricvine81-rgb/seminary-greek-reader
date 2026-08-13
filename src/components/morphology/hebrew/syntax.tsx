/* ─────────────────────────────────────────────
   Hebrew chapter: Sentence & Narrative Syntax

   The capstone: word order, verbless clauses, ישׁ/אין, הנה,
   questions, numbers, and the two verse-accents worth knowing.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples, HbVocab, HbDrills, HbReview } from '../shared'

export const HB_SYNTAX = (
  <>
    <P>
      Syntax is how words are arranged into <Term t="clause">clauses</Term> and sentences —
      everything the previous chapters&rsquo; forms are <em>for</em>. Hebrew&rsquo;s habits
      here differ from English in ways that change how a verse reads, starting with where
      the verb goes.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">English grammar lives in word order: <em>“the dog bit the man”</em> and <em>“the man bit the dog”</em> use identical words and mean opposite things, because English marks who-did-what by position (Subject–Verb–Object). Hebrew marks who-did-what on the words themselves — verb endings, the object marker <Hb>אֵת</Hb> — so its order is freer, and the NEUTRAL order is different: Verb first (“Bit the-dog the-man”).</p>
      <p>That freedom is meaningful: when Hebrew departs from verb-first and puts something else at the head of the sentence, it is pointing at it. Reading order well is reading emphasis.</p>
    </InfoBox>

    <SectionHeading n={1}>Word order</SectionHeading>
    <P>
      Narrative default: <strong>Verb — Subject — Object</strong> (<Hb>וַיִּקְרָא אֱלֹהִים
      לָאוֹר יוֹם</Hb>, &ldquo;and God called the light Day&rdquo;). Anything moved in front
      of the verb is being pointed at — contrast, topic shift, background. The classic signal
      is waw + non-verb: <Hb>וְהַנָּחָשׁ הָיָה עָרוּם</Hb>, &ldquo;now the <em>serpent</em>{' '}
      was crafty&rdquo; (Gen 3:1) — the storyline pauses and the camera moves.
    </P>

    <SectionHeading n={2}>Verbless clauses</SectionHeading>
    <P>
      Hebrew needs no &ldquo;is.&rdquo; Two nouns — or noun and adjective, noun and
      preposition-phrase — juxtaposed make a complete sentence, with the tense supplied by
      context:
    </P>
    <MorphTable
      title="Verbless clauses"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['יְהוָה רֹעִי', 'the LORD is my shepherd  (Ps 23:1)'],
        ['טוֹב הַדָּבָר', 'the thing is good'],
        ['אֲנִי יוֹסֵף', 'I am Joseph  (Gen 45:3)'],
        ['לַיהוָה הָאָרֶץ', 'the earth is the LORD’s  (Ps 24:1) — a preposition-phrase as predicate'],
      ]}
    />

    <SectionHeading n={3}>יֵשׁ and אֵין</SectionHeading>
    <MorphTable
      title="There is / there is not"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['יֵשׁ־תִּקְוָה', 'there is hope'],
        ['אֵין מֶלֶךְ בְּיִשְׂרָאֵל', 'there is no king in Israel  (Judg 21:25)'],
        ['אֵין כָּמוֹךָ', 'there is none like you'],
        ['אֵינֶנּוּ שֹׁמֵעַ', 'he is not listening  (אין + suffix negates a participle)'],
      ]}
    />

    <SectionHeading n={4}>הִנֵּה</SectionHeading>
    <P>
      The presentative &ldquo;behold!&rdquo; — better, &ldquo;look:&rdquo; — throws what
      follows onto the screen, often with a suffix: <Hb>הִנְנִי</Hb> &ldquo;here I am&rdquo;
      (Abraham&rsquo;s answer, Gen 22:1). With a participle it announces what is just about to
      happen: <Hb>הִנֵּה אָנֹכִי מֵבִיא אֶת־הַמַּבּוּל</Hb>, &ldquo;behold, I am about to
      bring the flood&rdquo; (Gen 6:17).
    </P>

    <SectionHeading n={5}>Questions</SectionHeading>
    <MorphTable
      title="Asking"
      headers={['Hebrew', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['הֲ־', 'yes/no question prefix: הֲשֹׁמֵר אָחִי אָנֹכִי “am I my brother’s keeper?” (Gen 4:9)'],
        ['מִי · מָה', 'who? · what?'],
        ['לָמָּה · מַדּוּעַ', 'why?'],
        ['אֵיךְ · אַיֵּה', 'how? · where?'],
      ]}
      note="הֲ before a guttural or shewa becomes הַ / הֶ — distinguish it from the article by the missing dagesh and the sense."
    />

    <SectionHeading n={6}>Numbers 1–10</SectionHeading>
    <P>
      Hebrew numerals have a famous quirk — <em>polarity</em>: from 3 to 10, masculine nouns
      take the feminine-looking numeral and vice versa.
    </P>
    <MorphTable
      title="Cardinals 1–10"
      headers={['', 'With masculine nouns', 'With feminine nouns']}
      hCols={[1, 2]}
      rows={[
        ['1', 'אֶחָד', 'אַחַת'],
        ['2', 'שְׁנַיִם', 'שְׁתַּיִם'],
        ['3', 'שְׁלֹשָׁה', 'שָׁלֹשׁ'],
        ['4', 'אַרְבָּעָה', 'אַרְבַּע'],
        ['5', 'חֲמִשָּׁה', 'חָמֵשׁ'],
        ['6', 'שִׁשָּׁה', 'שֵׁשׁ'],
        ['7', 'שִׁבְעָה', 'שֶׁבַע'],
        ['8', 'שְׁמֹנָה', 'שְׁמֹנֶה'],
        ['9', 'תִּשְׁעָה', 'תֵּשַׁע'],
        ['10', 'עֲשָׂרָה', 'עֶשֶׂר'],
      ]}
      note="1 behaves like an adjective (after its noun); 2 agrees normally; 3–10 show polarity: שְׁלֹשָׁה בָנִים “three sons”, שָׁלֹשׁ בָּנוֹת “three daughters.”"
    />

    <SectionHeading n={7}>Two accents worth knowing</SectionHeading>
    <P>
      The Masoretic accents mark the melody and the punctuation. Two repay learning on day
      one: <strong>sof pasuq</strong> <Hb>׃</Hb> ends the verse, and <strong>atnach</strong>{' '}
      (a small wishbone under a word) marks the verse&rsquo;s main midpoint pause — read a
      verse in its two halves and the syntax usually falls into place.
    </P>
    <HbEx he="וַיְהִי־עֶרֶב וַיְהִי־בֹקֶר יוֹם אֶחָד" en={<>“and there was evening and there was morning — day one” (Gen 1:5): wayyiqtol chain, then a verbless tail with the numeral אֶחָד after its noun.</>} />

    <InfoBox title="Where to go from here">
      <p className="mb-1">Open the Reader at Genesis 1 or Jonah 1 and read with the parsing pane: the wayyiqtol chains, verbless clauses and construct chains of these chapters cover most of what narrative will throw at you.</p>
      <p>The Vocab Builder’s frequency sections and the morphology quizzes drill exactly the labels used here — the tools are one course.</p>
    </InfoBox>

    <HbExamples id="syntax" />

    <HbVocab id="syntax" />

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Why does Gen 3:1 begin <Hb>וְהַנָּחָשׁ הָיָה</Hb> and not <Hb>וַיְהִי הַנָּחָשׁ</Hb>?</>, a: <>Waw + fronted subject breaks the wayyiqtol chain: background information, not the next event.</> },
        { q: <>Translate <Hb>אֵין נָבִיא בָּעִיר</Hb>.</>, a: <>“There is no prophet in the city.”</> },
        { q: <>Say “three kings” and “three cities.”</>, a: <><Hb>שְׁלֹשָׁה מְלָכִים</Hb> but <Hb>שָׁלֹשׁ עָרִים</Hb> — polarity, and עיר is feminine.</> },
        { q: <>Parse the clause type of <Hb>יְהוָה רֹעִי</Hb>.</>, a: <>Verbless clause: subject + predicate noun (with 1cs suffix) — “the LORD is my shepherd.”</> },
      ]}
    />

    <HbDrills id="syntax" />

    <HbReview id="syntax" />
  </>
)
