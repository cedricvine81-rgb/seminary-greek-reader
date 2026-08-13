/* ─────────────────────────────────────────────
   Hebrew chapter: Volitives — Imperative, Cohortative, Jussive

   The three ways Hebrew expresses will, one per person, plus the
   two negatives and the politeness particle נא.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples, HbVocab, HbDrills, HbReview } from '../shared'

export const HB_VOLITIVES = (
  <>
    <P>
      <Term t="volitive">Volitives</Term> are the wanting-and-willing forms — commands and
      wishes. Hebrew distributes &ldquo;let / may / must&rdquo; across the{' '}
      <Term t="person">persons</Term>: the{' '}
      <strong>cohortative</strong> for &ldquo;let <em>me/us</em>,&rdquo; the{' '}
      <strong>imperative</strong> for direct commands to <em>you</em>, and the{' '}
      <strong>jussive</strong> for &ldquo;let <em>him/them</em>.&rdquo; All three are the
      imperfect, bent slightly.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1">Volitives are the grammar of wanting. English covers the three persons with three different tricks: <em>“Let me / let’s go”</em> (myself), <em>“Go!”</em> (you), <em>“May he go / long live the king”</em> (someone else). Hebrew has a dedicated form for each — cohortative for “let me/us,” imperative for “you,” jussive for “may he.”</p>
      <p>Same wanting, three directions. The chapter is just those three forms and how to spot them.</p>
    </InfoBox>

    <SectionHeading n={1}>The imperative</SectionHeading>
    <P>
      Strip the prefix off the second-person imperfect and a command remains. Second person
      only — four forms:
    </P>
    <MorphTable
      title="Qal imperative of קטל"
      headers={['', 'Imperfect', 'Imperative', 'Meaning']}
      hCols={[1, 2]}
      tCols={[3]}
      rows={[
        ['2ms', 'תִּקְטֹל', 'קְטֹל', 'kill!'],
        ['2fs', 'תִּקְטְלִי', 'קִטְלִי', 'kill!'],
        ['2mp', 'תִּקְטְלוּ', 'קִטְלוּ', 'kill!'],
        ['2fp', 'תִּקְטֹלְנָה', 'קְטֹלְנָה', 'kill!'],
      ]}
      note="Where two shewas would collide (קְטְלִי), the first becomes hireq: קִטְלִי."
    />
    <HbEx he="שְׁמַע יִשְׂרָאֵל" en={<>“Hear, O Israel!” (Deut 6:4) — Qal imperative 2ms of שׁמע, a-class like its imperfect.</>} />

    <SectionHeading n={2}>The cohortative</SectionHeading>
    <P>
      First person + <Hb>־ָה</Hb>: self-encouragement, resolve, request.
    </P>
    <MorphTable
      title="Cohortative"
      headers={['', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[2]}
      rows={[
        ['1cs', 'אֶקְטְלָה', 'let me kill'],
        ['1cp', 'נִקְטְלָה', 'let us kill'],
      ]}
    />
    <HbEx he="אָשִׁירָה לַיהוָה" en={<>“I will sing to the LORD” (Exod 15:1) — cohortative resolve.</>} />

    <SectionHeading n={3}>The jussive</SectionHeading>
    <P>
      Third person (and negated second person). Usually it looks <em>identical</em> to the
      imperfect; it is visibly shorter only where the verb has a form to shorten — the weak
      verbs:
    </P>
    <MorphTable
      title="Jussive vs imperfect"
      headers={['Imperfect', 'Jussive', 'Meaning']}
      hCols={[0, 1]}
      tCols={[2]}
      firstColIsData
      rows={[
        ['יִהְיֶה', 'יְהִי', 'may it be / let there be'],
        ['יִרְאֶה', 'יֵרֶא', 'may he see'],
        ['יָקוּם', 'יָקֹם', 'may he arise'],
        ['יִקְטֹל', 'יִקְטֹל', '(strong verb — no visible difference)'],
      ]}
    />

    <SectionHeading n={4}>The two negatives, and נָא</SectionHeading>
    <MorphTable
      title="Saying “don’t”"
      headers={['Construction', 'Force', 'Example']}
      tCols={[0, 1]}
      hCols={[2]}
      firstColIsData
      rows={[
        ['אַל + jussive', 'immediate: “stop / don’t (now)”', 'אַל־תִּירָא  do not fear'],
        ['לֹא + imperfect', 'categorical: “you shall never”', 'לֹא תִּרְצָח  you shall not murder'],
      ]}
      note="The imperative itself is never negated. The particle נָא adds urgency or politeness: שְׁלַח־נָא “please send”."
    />

    <InfoBox title="Watch for">
      <p className="mb-1">After an imperative, a wayyiqtol or weqatal continues the command chain: “Go … and take …”.</p>
      <p className="mb-1">Cohortative ־ָה looks like the 3fs perfect ending; the prefix (א / נ) tells you it is a first-person imperfect form.</p>
      <p>In wayyiqtol the jussive shape reappears with past meaning (וַיְהִי) — shortness there signals the sequential form, not a wish.</p>
    </InfoBox>

    <HbExamples id="volitives" />

    <HbVocab id="volitives" />

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>שְׁמֹר</Hb>, a: <>Qal imperative 2ms of <Hb>שׁמר</Hb> — “keep!”</> },
        { q: <Hb>נֵלְכָה</Hb>, a: <>Qal cohortative 1cp of <Hb>הלך</Hb> — “let us go.”</> },
        { q: <Hb>יְהִי אוֹר</Hb>, a: <>Qal jussive 3ms of <Hb>היה</Hb> — “let there be light” (Gen 1:3).</> },
        { q: <Hb>אַל־תִּשְׁלַח</Hb>, a: <>אַל + Qal jussive 2ms of <Hb>שׁלח</Hb> — “do not send / do not stretch out (your hand)” (cf. Gen 22:12).</> },
      ]}
    />

    <HbDrills id="volitives" />

    <HbReview id="volitives" />
  </>
)
