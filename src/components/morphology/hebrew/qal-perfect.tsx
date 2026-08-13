/* ─────────────────────────────────────────────
   Hebrew chapter: Qal Perfect

   The first paradigm: suffixed conjugation, statives, uses,
   and basic word order.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term, HbExamples, HbVocab, HbDrills, HbReview } from '../shared'

export const HB_QAL_PERFECT = (
  <>
    <P>
      The <Term t="perfect"><strong>perfect</strong></Term> (or <em>qatal</em>) views an
      action as complete — usually English past tense: &ldquo;he kept.&rdquo; It{' '}
      <Term t="conjugation">conjugates</Term> with <strong>endings only</strong> — one ending
      per &ldquo;I / you / she / we / they&rdquo; — added to the base <Hb>קָטַל</Hb>. Learn
      this ending set cold: every <Term t="binyan">stem</Term> in the language reuses it.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1"><strong>Reading the codes:</strong> “3ms” is shorthand for <em>third person, masculine, singular</em> — “he.” First person is the speaker (I / we), second is who you are talking to (you), third is who you are talking about (he / she / they). So 2fp = “you (women),” 1cs = “I,” 3cp = “they.” The “c” means <em>common</em>: one form serves both genders.</p>
      <p className="mb-1"><strong>English changes the pronoun; Hebrew changes the ending.</strong> English says <em>I kept, you kept, she kept</em> — the verb never moves, the pronoun does the work. Hebrew welds the pronoun onto the verb as an ending: <Hb>קָטַלְתִּי</Hb> is “kept-I,” <Hb>קָטַלְתָּ</Hb> “kept-you,” one word each. That is why a Hebrew sentence can be a single word.</p>
      <p><strong>“Complete” is a viewpoint, not a date.</strong> English tenses put events on a timeline (past / present / future). The Hebrew perfect instead views the action as a whole, finished package — usually that lands in English as past (“he kept”), but it can be “he has kept,” or with statives “he is old.”</p>
    </InfoBox>

    <SectionHeading n={1}>The paradigm</SectionHeading>
    <MorphTable
      title="Qal perfect of קטל"
      headers={['', 'Form', 'Ending', 'Meaning']}
      hCols={[1, 2]}
      tCols={[3]}
      highlight="text-red-600 font-medium"
      highlightCols={[2]}
      rows={[
        ['3ms', 'קָטַל', '—', 'he killed'],
        ['3fs', 'קָטְלָ|ה', '־ָה', 'she killed'],
        ['2ms', 'קָטַלְ|תָּ', '־תָּ', 'you killed'],
        ['2fs', 'קָטַלְ|תְּ', '־תְּ', 'you killed'],
        ['1cs', 'קָטַלְ|תִּי', '־תִּי', 'I killed'],
        ['3cp', 'קָטְל|וּ', '־וּ', 'they killed'],
        ['2mp', 'קְטַלְ|תֶּם', '־תֶּם', 'you killed'],
        ['2fp', 'קְטַלְ|תֶּן', '־תֶּן', 'you killed'],
        ['1cp', 'קָטַלְ|נוּ', '־נוּ', 'we killed'],
      ]}
      note="Third plural and first person do not mark gender (“common”). Before the vowel-endings ־ָה and ־וּ the second qamets reduces to shewa; before the heavy endings ־תֶּם / ־תֶּן the FIRST one does."
    />
    <P>
      Memory hooks: the 2ms/2fs/1cs endings echo the pronouns (<Hb>אַתָּה</Hb> → <Hb>־תָּ</Hb>,{' '}
      <Hb>אֲנִי</Hb>… <Hb>־תִּי</Hb>), and <Hb>־נוּ</Hb> is the &ldquo;our/us&rdquo; suffix
      you already know.
    </P>

    <SectionHeading n={2}>Stative verbs</SectionHeading>
    <P>
      Verbs describing a <em>state</em> rather than an action take tsere or holem in the 3ms
      and often translate as an English adjective with &ldquo;be&rdquo;:
    </P>
    <MorphTable
      title="Statives"
      headers={['Form', 'Meaning']}
      hCols={[0]}
      tCols={[1]}
      firstColIsData
      rows={[
        ['כָּבֵד', 'he is / was heavy, honored'],
        ['זָקֵן', 'he is / was old'],
        ['מָלֵא', 'it is / was full'],
        ['קָטֹן', 'he is / was small'],
        ['יָכֹל', 'he is / was able'],
      ]}
    />

    <SectionHeading n={3}>What the perfect means</SectionHeading>
    <P>
      Complete action, viewed whole. In practice: simple past (&ldquo;he kept&rdquo;),
      present perfect (&ldquo;he has kept&rdquo;), a present state with statives
      (&ldquo;he is old&rdquo;) — and occasionally the <em>prophetic perfect</em>, where a
      future certainty is spoken of as already done.
    </P>

    <SectionHeading n={4}>Word order</SectionHeading>
    <P>
      The neutral order is <strong>Verb — Subject — Object</strong>:{' '}
      <Hb>שָׁמַר הָאִישׁ אֶת־הַתּוֹרָה</Hb>, &ldquo;the man kept the law.&rdquo; When
      something else stands first, Hebrew is drawing attention to it.
    </P>
    <HbEx he="בְּרֵאשִׁית בָּרָא אֱלֹהִים" en={<>“In the beginning God created” (Gen 1:1) — בָּרָא is a Qal perfect 3ms; the fronted phrase sets the stage.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1"><Hb>קָטְלָה</Hb> (3fs perfect) vs a feminine noun in ־ָה: the verb has no article and its first vowel is qamets + vocal shewa.</p>
      <p className="mb-1">2ms <Hb>קָטַלְתָּ</Hb> and 2fs <Hb>קָטַלְתְּ</Hb> differ only in the final vowel — qamets = masculine.</p>
      <p>The perfect + וְ (weqatal) is NOT simple “and” + past — it flips to future/command force. That surprise is the Waw-Consecutive chapter.</p>
    </InfoBox>

    <HbExamples id="qal-perfect" />

    <HbVocab id="qal-perfect" />

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>שָׁמְרוּ</Hb>, a: <>Qal perfect 3cp of <Hb>שׁמר</Hb> — “they kept.”</> },
        { q: <Hb>כָּתַבְתִּי</Hb>, a: <>Qal perfect 1cs of <Hb>כתב</Hb> — “I wrote.”</> },
        { q: <Hb>זָכַרְתְּ</Hb>, a: <>Qal perfect 2fs of <Hb>זכר</Hb> — “you (f) remembered.”</> },
        { q: <Hb>מָלְאָה הָאָרֶץ</Hb>, a: <>Qal perfect 3fs of <Hb>מלא</Hb> + subject — “the earth was full” (stative).</> },
      ]}
    />

    <HbDrills id="qal-perfect" />

    <HbReview id="qal-perfect" />
  </>
)
