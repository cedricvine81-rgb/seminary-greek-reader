/* ─────────────────────────────────────────────
   Hebrew chapter: Qal Imperfect

   The prefixed conjugation: paradigm, the a-class, and the range
   of meanings (future, habitual, modal, prohibition).
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_QAL_IMPERFECT = (
  <>
    <P>
      The <Term t="imperfect"><strong>imperfect</strong></Term> (or <em>yiqtol</em>) views
      action as incomplete — English future (&ldquo;he will keep&rdquo;), habitual
      (&ldquo;he used to keep&rdquo;), or modal (&ldquo;he may keep&rdquo;). Where the perfect used endings, the imperfect leads with{' '}
      <strong>prefixes</strong> (<Hb>י ת א נ</Hb>), adding endings only for feminine and
      plural forms. This prefix set, too, is universal across the stems.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1"><strong>Incomplete = still open.</strong> English has no one tense for this, so the imperfect scatters across several: “he <em>will</em> keep” (not yet done), “he <em>keeps / used to</em> keep” (repeats, never a finished lump), “he <em>may</em> keep” (possible). What unites them: the action is not being viewed as over.</p>
      <p><strong>The pronoun moved to the FRONT.</strong> The perfect welded its pronouns on as endings; the imperfect welds them on as prefixes — red in the table. Only four letters do it: <Hb>י ת א נ</Hb> (yod “he/they,” taw “she/you,” alef “I,” nun “we”). Learn those four and you can spot an imperfect across the room.</p>
    </InfoBox>

    <SectionHeading n={1}>The paradigm</SectionHeading>
    <MorphTable
      title="Qal imperfect of קטל"
      headers={['', 'Form', 'Prefix / ending', 'Meaning']}
      hCols={[1, 2]}
      tCols={[3]}
      highlight="text-red-600 font-medium"
      highlightCols={[2]}
      rows={[
        ['3ms', 'יִ»קְטֹל', 'יִ־', 'he will kill'],
        ['3fs', 'תִּ»קְטֹל', 'תִּ־', 'she will kill'],
        ['2ms', 'תִּ»קְטֹל', 'תִּ־', 'you will kill'],
        ['2fs', 'תִּ»קְטְלִ|י', 'תִּ־ … ־ִי', 'you will kill'],
        ['1cs', 'אֶ»קְטֹל', 'אֶ־', 'I will kill'],
        ['3mp', 'יִ»קְטְל|וּ', 'יִ־ … ־וּ', 'they will kill'],
        ['3fp', 'תִּ»קְטֹלְ|נָה', 'תִּ־ … ־נָה', 'they will kill'],
        ['2mp', 'תִּ»קְטְל|וּ', 'תִּ־ … ־וּ', 'you will kill'],
        ['2fp', 'תִּ»קְטֹלְ|נָה', 'תִּ־ … ־נָה', 'you will kill'],
        ['1cp', 'נִ»קְטֹל', 'נִ־', 'we will kill'],
      ]}
      note="Ambiguities to accept now: 3fs = 2ms (תִּקְטֹל), and 3fp = 2fp (תִּקְטֹלְנָה). Context decides."
    />
    <P>
      The theme vowel of the strong Qal imperfect is holem (<Hb>יִקְטֹל</Hb>). Before the
      vowel-endings <Hb>־ִי</Hb> and <Hb>־וּ</Hb> it reduces to shewa: <Hb>יִקְטְלוּ</Hb>.
    </P>

    <SectionHeading n={2}>The a-class imperfect</SectionHeading>
    <P>
      Verbs whose second or third root letter is a guttural pull the theme vowel to patach —
      the guttural&rsquo;s standing preference:
    </P>
    <MorphTable
      title="a-class imperfects"
      headers={['Perfect', 'Imperfect', '']}
      hCols={[0, 1]}
      tCols={[2]}
      firstColIsData
      rows={[
        ['שָׁמַע', 'יִשְׁמַע', 'he will hear'],
        ['בָּחַר', 'יִבְחַר', 'he will choose'],
        ['שָׁלַח', 'יִשְׁלַח', 'he will send'],
        ['לָמַד', 'יִלְמַד', 'he will learn  (a-class without a guttural — some verbs just are)'],
      ]}
    />

    <SectionHeading n={3}>What the imperfect means</SectionHeading>
    <MorphTable
      title="The imperfect’s range"
      headers={['Force', 'Example', '']}
      tCols={[0, 2]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['future', 'יִמְלֹךְ', 'he will reign'],
        ['habitual', 'כֵּן יַעֲשֶׂה אִיּוֹב', 'thus Job would do (regularly) — Job 1:5'],
        ['modal', 'יִשְׁמֹר', 'he may / should / can keep'],
        ['permanent prohibition: לֹא +', 'לֹא תִּרְצָח', 'you shall not murder — Exod 20:13'],
      ]}
    />
    <HbEx he="יְהוָה יִמְלֹךְ לְעֹלָם וָעֶד" en={<>“The LORD will reign for ever and ever” (Exod 15:18).</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">The prefixes spell <Hb>איתן</Hb> (etan) — alef, yod, taw, nun — a traditional mnemonic for the set.</p>
      <p className="mb-1">A begadkephat letter directly after the prefix keeps its dagesh lene only when the prefix vowel is silent-shewa’d away — compare <Hb>יִכְתֹּב</Hb>: the כ is soft (after the vowel of יִ), the ת hard (after silent shewa).</p>
      <p>לֹא + imperfect is the categorical “never” of the commandments; the immediate “don’t!” uses אַל + jussive — Volitives chapter.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>תִּכְתֹּב</Hb>, a: <>Qal imperfect 3fs OR 2ms of <Hb>כתב</Hb> — “she / you will write.” Both parses are correct in isolation.</> },
        { q: <Hb>יִשְׁמְעוּ</Hb>, a: <>Qal imperfect 3mp of <Hb>שׁמע</Hb> — “they will hear” (theme vowel reduced before ־וּ).</> },
        { q: <Hb>אֶזְכֹּר</Hb>, a: <>Qal imperfect 1cs of <Hb>זכר</Hb> — “I will remember.”</> },
        { q: <Hb>נִשְׁמֹר</Hb>, a: <>Qal imperfect 1cp of <Hb>שׁמר</Hb> — “we will keep.” (Don’t mistake the נ for Niphal: in the imperfect, Niphal shows a dagesh in the FIRST root letter — יִקָּטֵל.)</> },
      ]}
    />
  </>
)
