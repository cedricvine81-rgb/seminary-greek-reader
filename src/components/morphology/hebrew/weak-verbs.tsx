/* ─────────────────────────────────────────────
   Hebrew chapter: Weak Verbs

   The classes, their fingerprints, and a reference table of the
   forms first-year students actually meet in the text.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, Term } from '../shared'

export const HB_WEAK_VERBS = (
  <>
    <P>
      A verb is <strong>weak</strong> when one of its <Term t="root">root</Term> letters is
      a <Term t="guttural">guttural</Term>, a{' '}
      <Hb>נ</Hb> or <Hb>י</Hb> that likes to vanish, a middle <Hb>ו/י</Hb> that never really
      existed, or a final <Hb>ה</Hb> that drops. The classes are named by position — Roman
      numerals here, or traditionally by the letters of <Hb>פעל</Hb> (so I-נ ={' '}
      <Hb>פ״ן</Hb>). Do not memorise everything at once: learn each class&rsquo;s{' '}
      <em>fingerprint</em>, and let this table be the reference you return to.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">English has regular verbs (walk, walked) and irregular ones (sing/sang, go/went, be/was) that you simply learned by meeting them. Hebrew’s “weak” verbs are its irregulars — with one mercy: they are irregular by RULE. Certain letters (gutturals, נ, ו, י, final ה) misbehave in predictable ways wherever they sit in a root.</p>
      <p>So instead of memorising thousands of odd forms, you learn a handful of letter-habits — “נ assimilates,” “gutturals refuse doubling” — and whole families of verbs fall into place at once.</p>
    </InfoBox>

    <SectionHeading n={1}>The classes at a glance (Qal)</SectionHeading>
    <MorphTable
      title="Weak classes — Qal reference forms"
      headers={['Class', 'Root', 'Perfect', 'Imperfect', 'Wayyiqtol', 'Inf. c. (with לְ)', 'Fingerprint']}
      tCols={[0, 6]}
      hCols={[1, 2, 3, 4, 5]}
      firstColIsData
      striped
      rows={[
        ['I-guttural', 'עמד', 'עָמַד', 'יַעֲמֹד', 'וַיַּעֲמֹד', 'לַעֲמֹד', 'composite shewa under the guttural; patach in the prefix'],
        ['I-א', 'אמר', 'אָמַר', 'יֹאמַר', 'וַיֹּאמֶר', 'לֵאמֹר', 'the א quiesces: holem in the prefix'],
        ['I-נ', 'נפל', 'נָפַל', 'יִפֹּל', 'וַיִּפֹּל', 'לִנְפֹּל', 'the נ assimilates: dagesh in the next letter'],
        ['', 'נתן', 'נָתַן', 'יִתֵּן', 'וַיִּתֵּן', 'לָתֵת', 'doubly weak — even the infinitive is clipped'],
        ['', 'לקח', 'לָקַח', 'יִקַּח', 'וַיִּקַּח', 'לָקַחַת', 'behaves like I-נ despite the ל'],
        ['I-י', 'ישׁב', 'יָשַׁב', 'יֵשֵׁב', 'וַיֵּשֶׁב', 'לָשֶׁבֶת', 'the י drops; tsere prefix; ־ֶת infinitive'],
        ['', 'ידע', 'יָדַע', 'יֵדַע', 'וַיֵּדַע', 'לָדַעַת', 'same, with guttural a-vowels'],
        ['', 'הלך', 'הָלַךְ', 'יֵלֵךְ', 'וַיֵּלֶךְ', 'לָלֶכֶת', 'honorary member: acts like a I-י'],
        ['III-ה', 'בנה', 'בָּנָה', 'יִבְנֶה', 'וַיִּבֶן', 'לִבְנוֹת', 'perfect ־ָה, imperfect ־ֶה, and the ה falls off in wayyiqtol'],
        ['', 'עשׂה', 'עָשָׂה', 'יַעֲשֶׂה', 'וַיַּעַשׂ', 'לַעֲשׂוֹת', ''],
        ['', 'ראה', 'רָאָה', 'יִרְאֶה', 'וַיַּרְא', 'לִרְאוֹת', ''],
        ['', 'היה', 'הָיָה', 'יִהְיֶה', 'וַיְהִי', 'לִהְיוֹת', 'the verb “to be” — its wayyiqtol opens half the narratives in the Bible'],
        ['II-ו/י (hollow)', 'קום', 'קָם', 'יָקוּם', 'וַיָּקָם', 'לָקוּם', 'no middle consonant at all; the perfect is two letters'],
        ['', 'בוא', 'בָּא', 'יָבוֹא', 'וַיָּבֹא', 'לָבוֹא', ''],
        ['', 'שׂים', 'שָׂם', 'יָשִׂים', 'וַיָּשֶׂם', 'לָשׂוּם', ''],
        ['III-א', 'מצא', 'מָצָא', 'יִמְצָא', 'וַיִּמְצָא', 'לִמְצֹא', 'the א quiesces; vowels lengthen, endings attach oddly (מָצָאתָ)'],
        ['Geminate', 'סבב', 'סָבַב', 'יָסֹב', 'וַיָּסָב', 'לָסֹב', 'second and third radicals identical; forms compress'],
      ]}
      note="Blank fingerprint cells share the note above them. Doubly weak verbs (נתן, לקח, היה) misbehave in two directions at once — which is why the commonest verbs are the strangest."
    />

    <SectionHeading n={2}>How to find a root</SectionHeading>
    <P>
      When a form has fewer than three visible root letters, ask in order: Is there a{' '}
      <strong>dagesh</strong> hiding an assimilated <Hb>נ</Hb> (<Hb>יִפֹּל</Hb> ←{' '}
      <Hb>נפל</Hb>)? Is there a <strong>tsere prefix</strong> where a <Hb>י</Hb> fell out
      (<Hb>יֵשֵׁב</Hb> ← <Hb>ישׁב</Hb>)? Could a final <Hb>ה</Hb> have dropped
      (<Hb>וַיַּעַשׂ</Hb> ← <Hb>עשׂה</Hb>)? Is it hollow (<Hb>וַיָּקָם</Hb> ←{' '}
      <Hb>קום</Hb>)? The Reader&rsquo;s parsing pane will confirm your guess — use it as the
      answer key while these instincts form.
    </P>

    <SectionHeading n={3}>The five verbs worth over-learning</SectionHeading>
    <MorphTable
      title="Memorise these forms as words"
      headers={['Form', 'Parse', 'Meaning']}
      hCols={[0]}
      tCols={[1, 2]}
      firstColIsData
      rows={[
        ['וַיֹּאמֶר', 'Qal wayyiqtol 3ms, אמר', 'and he said'],
        ['וַיְהִי', 'Qal wayyiqtol 3ms, היה', 'and it came to pass'],
        ['וַיַּרְא', 'Qal wayyiqtol 3ms, ראה', 'and he saw'],
        ['וַיֵּלֶךְ', 'Qal wayyiqtol 3ms, הלך', 'and he went'],
        ['וַיָּבֹא', 'Qal wayyiqtol 3ms, בוא', 'and he came'],
      ]}
      note="These five open more narrative clauses than the rest of the lexicon combined."
    />

    <InfoBox title="Watch for">
      <p className="mb-1">Hollow verbs in the perfect (<Hb>קָם</Hb>, <Hb>בָּא</Hb>) look like participles (<Hb>קָם</Hb> can be either) — context and accent decide.</p>
      <p className="mb-1">III-ה verbs keep a real ה only in the 3ms perfect and similar forms; before endings it becomes י or vanishes: <Hb>בָּנִיתִי</Hb> “I built.”</p>
      <p>In other stems the same instincts apply — e.g. Hiphil of I-י roots shows holem-waw: <Hb>הוֹשִׁיעַ</Hb> “he saved” (ישׁע).</p>
    </InfoBox>

    <Practice
      level="both"
      title="Find the root, then parse"
      items={[
        { q: <Hb>וַיִּתֵּן</Hb>, a: <>Root <Hb>נתן</Hb> (dagesh = assimilated נ) — Qal wayyiqtol 3ms, “and he gave.”</> },
        { q: <Hb>וַיֵּשֶׁב</Hb>, a: <>Root <Hb>ישׁב</Hb> (tsere prefix = lost י) — Qal wayyiqtol 3ms, “and he sat / dwelt.”</> },
        { q: <Hb>וַתַּעַשׂ</Hb>, a: <>Root <Hb>עשׂה</Hb> (dropped ה) — Qal wayyiqtol 3fs, “and she did.”</> },
        { q: <Hb>יָקוּמוּ</Hb>, a: <>Root <Hb>קום</Hb> (hollow) — Qal imperfect 3mp, “they will arise.”</> },
      ]}
    />
  </>
)
