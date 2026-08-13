/* ─────────────────────────────────────────────
   Hebrew chapter: Numbers & Using a Lexicon

   Cardinals (with the famous gender polarity), teens, tens, hundreds,
   ordinals — and, paired here as the course pairs them, how to find a
   word in a Hebrew lexicon once prefixes and suffixes are stripped.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_NUMBERS = (
  <>
    <P>
      Hebrew numbers are nouns and adjectives, not a separate species — they have{' '}
      <Term t="gender">gender</Term>, they stand in <Term t="construct state">construct</Term>,
      and they agree (or famously refuse to agree) with what they count.
    </P>

    <SectionHeading n={1}>One to ten — and the polarity rule</SectionHeading>
    <P>
      <strong>One</strong> behaves like an adjective (after its noun, agreeing);{' '}
      <strong>two</strong> is a dual noun; and from <strong>three to ten</strong> the forms
      swap: <em>masculine nouns take the feminine-looking numeral, feminine nouns the
      masculine-looking one</em>. Grammars call it <strong>polarity</strong>. It is not a
      mistake in the text — it is the system.
    </P>
    <MorphTable
      title="Cardinals 1–10"
      headers={['', 'With masculine nouns', 'With feminine nouns']}
      hCols={[1, 2]}
      tCols={[0]}
      striped
      rows={[
        ['1', 'אֶחָד', 'אַחַת'],
        ['2', 'שְׁנַיִם (constr. שְׁנֵי)', 'שְׁתַּיִם (constr. שְׁתֵּי)'],
        ['3', 'שְׁלֹשָׁה', 'שָׁלֹשׁ'],
        ['4', 'אַרְבָּעָה', 'אַרְבַּע'],
        ['5', 'חֲמִשָּׁה', 'חָמֵשׁ'],
        ['6', 'שִׁשָּׁה', 'שֵׁשׁ'],
        ['7', 'שִׁבְעָה', 'שֶׁבַע'],
        ['8', 'שְׁמֹנָה', 'שְׁמֹנֶה'],
        ['9', 'תִּשְׁעָה', 'תֵּשַׁע'],
        ['10', 'עֲשָׂרָה', 'עֶשֶׂר'],
      ]}
      note="From 3–10 the ־ָה form (which looks feminine) counts MASCULINE nouns: שְׁלֹשָׁה בָנִים “three sons” but שָׁלֹשׁ בָּנוֹת “three daughters.”"
    />
    <HbEx he="שְׁנֵי הָאֲנָשִׁים" en={<>“the two men” — the construct form שְׁנֵי leans on a definite noun, so the pair is definite.</>} />

    <SectionHeading n={2}>Teens, tens, hundreds</SectionHeading>
    <MorphTable
      title="Building larger numbers"
      headers={['Number', 'Form', '']}
      hCols={[1]}
      tCols={[0, 2]}
      firstColIsData
      striped
      rows={[
        ['11–19', 'unit + עָשָׂר / עֶשְׂרֵה', 'שְׁלֹשָׁה עָשָׂר “thirteen” (m); שְׁלֹשׁ עֶשְׂרֵה (f)'],
        ['20', 'עֶשְׂרִים', 'the plural of “ten”'],
        ['30–90', 'plural of the unit', 'שְׁלֹשִׁים “thirty,” אַרְבָּעִים “forty,” חֲמִשִּׁים “fifty”'],
        ['100', 'מֵאָה', 'dual מָאתַיִם “two hundred”; plural מֵאוֹת in compounds'],
        ['1,000', 'אֶלֶף', 'dual אַלְפַּיִם “two thousand”; plural אֲלָפִים'],
        ['10,000', 'רְבָבָה', '“myriad” — the poetry word for a countless host'],
      ]}
      note="Compound numbers simply string together, usually largest first, often with וְ: “four hundred and thirty years” (Exod 12:40)."
    />
    <P>
      With large numbers the counted noun often stays <em>singular</em>:{' '}
      <Hb>שִׁבְעִים שָׁנָה</Hb> &ldquo;seventy year(s)&rdquo; — the idiom behind many an odd-looking
      census line.
    </P>

    <SectionHeading n={3}>Ordinals</SectionHeading>
    <MorphTable
      title="First to tenth"
      headers={['', 'Ordinal', '', 'Ordinal']}
      hCols={[1, 3]}
      tCols={[0, 2]}
      rows={[
        ['first', 'רִאשׁוֹן', 'sixth', 'שִׁשִּׁי'],
        ['second', 'שֵׁנִי', 'seventh', 'שְׁבִיעִי'],
        ['third', 'שְׁלִישִׁי', 'eighth', 'שְׁמִינִי'],
        ['fourth', 'רְבִיעִי', 'ninth', 'תְּשִׁיעִי'],
        ['fifth', 'חֲמִישִׁי', 'tenth', 'עֲשִׂירִי'],
      ]}
      note="Ordinals are true adjectives (they follow and agree). Beyond ten, Hebrew uses the cardinals: “in the fourteenth year” is literally “in year fourteen.”"
    />
    <HbEx he="יוֹם הַשִּׁשִּׁי" en={<>“the sixth day” (Gen 1:31) — the ordinal with the article, closing each creation day.</>} />

    <SectionHeading n={4}>Using a lexicon</SectionHeading>
    <P>
      A Hebrew dictionary files words by <Term t="root">root</Term> or by dictionary form —
      never by the form you meet on the page. To find a word, <strong>undress it</strong>:
    </P>
    <InfoBox title="The stripping order">
      <p className="mb-1">1. Remove what the earlier chapters taught you to see: the article <Hb>הַ</Hb>, the inseparable prepositions <Hb>בְּ כְּ לְ</Hb>, the conjunction <Hb>וְ</Hb>, and any pronominal <Term t="suffix">suffix</Term>.</p>
      <p className="mb-1">2. Remove verb prefixes (<Hb>י ת א נ</Hb> of the imperfect, <Hb>מ</Hb> of participles, <Hb>ה</Hb> of Hiphil/Hithpael) and endings.</p>
      <p className="mb-1">3. What remains should be three letters. If only two remain, a weak letter has vanished — try <Hb>נ</Hb> or <Hb>י</Hb> at the front, <Hb>ה</Hb> at the back, or a middle <Hb>ו/י</Hb> (the weak-verbs chapter is the map).</p>
      <p>4. In the app you can cheat honestly: click any word and the parsing pane names the root for you — then look it up knowing what you are looking for.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>Why is <Hb>שְׁלֹשָׁה בָנִים</Hb> (“three sons”) not a gender mistake?</>, a: <>Polarity: from 3–10 the feminine-looking numeral counts masculine nouns.</> },
        { q: <>Translate <Hb>שְׁתֵּי נָשִׁים</Hb>.</>, a: <>“two women” — feminine dual construct שְׁתֵּי with the feminine noun.</> },
        { q: <>What is יוֹם רְבִיעִי?</>, a: <>“a fourth day” — ordinal, following and agreeing with its noun.</> },
        { q: <>You meet <Hb>וַיִּפֹּל</Hb> and find only two strong letters (פל). What root do you try?</>, a: <><Hb>נפל</Hb> “fall” — the initial נ assimilated into the dagesh (a I-נ weak verb).</> },
      ]}
    />
  </>
)
