/* ─────────────────────────────────────────────
   Hebrew chapter: Infinitives

   The construct (the workhorse: purpose, complement, temporal
   clauses) and the absolute (emphasis).
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples, HbVocab, HbDrills, HbReview } from '../shared'

export const HB_INFINITIVES = (
  <>
    <P>
      Hebrew has two <Term t="infinitive">infinitives</Term> — &ldquo;to do&rdquo; forms
      that name an action without saying who does it — with divided labor. The <strong>infinitive construct</strong>{' '}
      (<Hb>קְטֹל</Hb>) is the &ldquo;to do&rdquo; form — it takes prepositions and suffixes
      and builds clauses. The <strong>infinitive absolute</strong> (<Hb>קָטוֹל</Hb>) mostly
      stands beside a finite verb to add emphasis. Neither inflects for person: no subject
      slots, which is why the morphology quizzes ask only stem and conjugation for them.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">An infinitive is the verb as an idea, with nobody doing it yet: English <em>“to run”</em> — and English has a second, nouny version, the “-ing” gerund: <em>“running is hard.”</em> Hebrew likewise has two: the <strong>infinitive construct</strong> does roughly the work of “to run / running,” and the <strong>infinitive absolute</strong> is an emphatic doubling English can only imitate: <Hb>מוֹת תָּמוּת</Hb>, “dying you shall die” = “you shall surely die.”</p>
      <p>If you have ever said “I really, truly mean it,” you have felt what the infinitive absolute does.</p>
    </InfoBox>

    <SectionHeading n={1}>Infinitive construct</SectionHeading>
    <MorphTable
      title="The construct at work"
      headers={['Use', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['with לְ — purpose / “to do”', 'לִשְׁמֹר אֶת־הַתּוֹרָה', 'to keep the law'],
        ['complement of another verb', 'לֹא אוּכַל לָלֶכֶת', 'I am not able to go'],
        ['with בְּ / כְּ + suffix — temporal clause', 'בְּשָׁמְעוֹ', 'when he heard  (lit. “in his hearing”)'],
        ['negated with לְבִלְתִּי', 'לְבִלְתִּי אֲכָל־מִמֶּנּוּ', 'not to eat from it  (Gen 3:11)'],
      ]}
    />
    <P>
      The temporal idiom is everywhere in narrative: preposition + infinitive + subject
      suffix, often after <Hb>וַיְהִי</Hb> — <Hb>וַיְהִי בִּהְיוֹתָם בַּשָּׂדֶה</Hb>,
      &ldquo;and it happened, when they were in the field…&rdquo; (Gen 4:8).
    </P>
    <HbEx he="לְעָבְדָהּ וּלְשָׁמְרָהּ" en={<>“to work it and to keep it” (Gen 2:15) — two infinitive constructs with לְ, each carrying a 3fs object suffix (the garden).</>} />

    <SectionHeading n={2}>Infinitive absolute</SectionHeading>
    <MorphTable
      title="The absolute at work"
      headers={['Use', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['emphasis, before its own finite verb', 'מוֹת תָּמוּת', 'you shall SURELY die  (Gen 2:17)'],
        ['emphasis, echoing the verb', 'שָׁמוֹעַ שָׁמַעְתִּי', 'I have surely heard'],
        ['standing for an imperative', 'זָכוֹר אֶת־יוֹם הַשַּׁבָּת', 'Remember the sabbath day  (Exod 20:8)'],
      ]}
      note="The classic translation of the emphatic doubling — “dying you shall die” — is where the KJV’s “thou shalt surely die” comes from."
    />

    <SectionHeading n={3}>Forms to recognise</SectionHeading>
    <MorphTable
      title="Qal infinitives"
      headers={['', 'Form', 'With לְ']}
      hCols={[1, 2]}
      rows={[
        ['construct', 'קְטֹל', 'לִקְטֹל'],
        ['absolute', 'קָטוֹל', '—'],
      ]}
      note="Weak roots reshape the construct heavily: לָלֶכֶת “to go” (הלך), לָתֵת “to give” (נתן), לָשֶׁבֶת “to sit” (ישׁב), לִבְנוֹת “to build” (בנה). The Weak Verbs chapter collects them."
    />

    <InfoBox title="Watch for">
      <p className="mb-1">The bare construct looks identical to the ms imperative (<Hb>קְטֹל</Hb>). A preposition in front settles it; so does a suffix.</p>
      <p className="mb-1">A suffix on an infinitive can be its subject (<Hb>בְּשָׁמְעוֹ</Hb> “when HE heard”) or its object (<Hb>לְשָׁמְרוֹ</Hb> “to keep IT”) — sense decides.</p>
      <p><Hb>לֵאמֹר</Hb> (“saying”) introduces direct speech — an infinitive construct of אמר so common it functions as a quotation mark.</p>
    </InfoBox>

    <HbExamples id="infinitives" />

    <HbVocab id="infinitives" />

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>לִכְתֹּב</Hb>, a: <>לְ + Qal infinitive construct of <Hb>כתב</Hb> — “to write.”</> },
        { q: <Hb>כְּשָׁמְעֲךָ</Hb>, a: <>כְּ + Qal infinitive construct of <Hb>שׁמע</Hb> + 2ms suffix — “as you hear / when you hear.”</> },
        { q: <Hb>שָׁמוֹר תִּשְׁמְרוּן</Hb>, a: <>Qal infinitive absolute + imperfect 2mp of <Hb>שׁמר</Hb> — “you shall surely keep” (Deut 6:17).</> },
        { q: <Hb>לֵאמֹר</Hb>, a: <>לְ + Qal infinitive construct of <Hb>אמר</Hb> — “saying:” — the speech-introducer.</> },
      ]}
    />

    <HbDrills id="infinitives" />

    <HbReview id="infinitives" />
  </>
)
