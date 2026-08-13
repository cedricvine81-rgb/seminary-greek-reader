/* ─────────────────────────────────────────────
   Hebrew chapter: Hiphil & Hophal

   The causative stem and its passive: forms, meaning,
   and the everyday Hiphil vocabulary.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_HIPHIL_HOPHAL = (
  <>
    <P>
      The <Term t="hiphil">Hiphil</Term> is the{' '}
      <Term t="causative"><strong>causative</strong></Term> — it makes someone else do the
      action, as English &ldquo;feed&rdquo; is to &ldquo;eat&rdquo;: Qal <Hb>מָלַךְ</Hb>{' '}
      &ldquo;he reigned&rdquo; → Hiphil <Hb>הִמְלִיךְ</Hb> &ldquo;he made (someone)
      king.&rdquo; Its
      fingerprints: a <Hb>הִ</Hb> prefix in the perfect, and the long <strong>hireq-yod</strong>{' '}
      theme vowel almost everywhere.
    </P>

    <InfoBox title="In plain English">
      <p className="mb-1"><strong>Causative = making it happen rather than doing it.</strong> English keeps a few fossil pairs that work exactly like Qal → Hiphil: the tree <em>falls</em> / the logger <em>fells</em> it; you <em>sit</em> / you <em>set</em> the cup down; you <em>lie</em> down / you <em>lay</em> the book down; the sun <em>rises</em> / you <em>raise</em> the flag. Hebrew does that to nearly ANY verb: בָּא “he came” → הֵבִיא “he brought” (caused to come); מָלַךְ “he reigned” → הִמְלִיךְ “he made (someone) king.”</p>
      <p>Where English has no pair, it says “make / have / let someone do it” — which is the wooden gloss the table uses. Real translations pick a natural verb: “bring,” “raise,” “crown.”</p>
    </InfoBox>

    <SectionHeading n={1}>Hiphil forms</SectionHeading>
    <MorphTable
      title="Hiphil of קטל"
      headers={['Conjugation', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[0, 2]}
      firstColIsData
      rows={[
        ['perfect 3ms', 'הִ»קְטִיל', 'he caused to kill'],
        ['perfect 3fs', 'הִ»קְטִילָ|ה', 'she caused to kill'],
        ['perfect 2ms', 'הִ»קְטַלְ|תָּ', 'you caused to kill'],
        ['perfect 3cp', 'הִ»קְטִיל|וּ', 'they caused to kill'],
        ['imperfect 3ms', 'יַ»קְטִיל', 'he will cause to kill'],
        ['imperfect 1cs', 'אַ»קְטִיל', 'I will cause to kill'],
        ['jussive 3ms', 'יַ»קְטֵל', 'let him cause to kill'],
        ['imperative 2ms', 'הַ»קְטֵל', 'cause to kill!'],
        ['infinitive construct', 'הַ»קְטִיל', 'to cause to kill'],
        ['participle', 'מַ»קְטִיל', 'causing to kill'],
      ]}
      note="Note the vowel shifts: perfect הִ but imperfect/participle patach (יַ, מַ); consonant-endings in the perfect drop the yod (הִקְטַלְתָּ); the jussive shortens hireq-yod to tsere — and wayyiqtol follows the jussive: וַיַּקְטֵל."
    />

    <SectionHeading n={2}>Hophal forms</SectionHeading>
    <MorphTable
      title="Hophal of קטל"
      headers={['Conjugation', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[0, 2]}
      firstColIsData
      rows={[
        ['perfect 3ms', 'הָ»קְטַל', 'he was caused to kill'],
        ['imperfect 3ms', 'יָקְטַל', 'he will be caused to kill'],
        ['participle', 'מָקְטָל', 'being caused to kill'],
      ]}
      note="The qamets under the prefix is qamets-hatuf: hoq-tal, yoq-tal. Some roots show qibbuts instead: הֻגַּד “it was told.”"
    />

    <SectionHeading n={3}>What Hiphil means</SectionHeading>
    <MorphTable
      title="Qal → Hiphil pairs"
      headers={['Qal', '', 'Hiphil', '']}
      hCols={[0, 2]}
      tCols={[1, 3]}
      firstColIsData
      rows={[
        ['מָלַךְ', 'reign', 'הִמְלִיךְ', 'make king'],
        ['גָּדַל', 'be great', 'הִגְדִּיל', 'magnify'],
        ['בּוֹא', 'come', 'הֵבִיא', 'bring'],
        ['יָצָא', 'go out', 'הוֹצִיא', 'bring out'],
        ['שָׁמַע', 'hear', 'הִשְׁמִיעַ', 'proclaim (cause to hear)'],
      ]}
      note="Weak roots bend the prefix vowel (הֵבִיא, הוֹצִיא) — the ה + causative sense still gives the stem away."
    />
    <P>
      Everyday Hiphils whose Qal you will rarely meet: <Hb>הִגִּיד</Hb> tell (root{' '}
      <Hb>נגד</Hb>), <Hb>הִצִּיל</Hb> deliver (<Hb>נצל</Hb>), <Hb>הִשְׁלִיךְ</Hb> throw
      (<Hb>שׁלך</Hb>), <Hb>הֶאֱמִין</Hb> believe (<Hb>אמן</Hb>), <Hb>הוֹשִׁיעַ</Hb> save
      (<Hb>ישׁע</Hb> — the root inside &ldquo;Joshua&rdquo; and &ldquo;Jesus&rdquo;).
    </P>
    <HbEx he="וְהֶאֱמִן בַּיהוָה" en={<>“and he believed in the LORD” (Gen 15:6) — Hiphil of אמן: to take God as reliable.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">Hiphil perfect <Hb>הִקְטִיל</Hb> vs Niphal imperative/infinitive <Hb>הִקָּטֵל</Hb>: both begin הִ — the dagesh in the first radical and the tsere mark the Niphal.</p>
      <p className="mb-1">In the imperfect there is no ה at all (it has elided into the prefix): patach under the prefix + hireq-yod = Hiphil.</p>
      <p>Participle מַ + hireq-yod (מַקְטִיל) vs Piel’s מְ + dagesh (מְקַטֵּל).</p>
    </InfoBox>

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>הִמְלִיכוּ</Hb>, a: <>Hiphil perfect 3cp of <Hb>מלך</Hb> — “they made (him) king.”</> },
        { q: <Hb>יַגְדִּיל</Hb>, a: <>Hiphil imperfect 3ms of <Hb>גדל</Hb> — “he will magnify.”</> },
        { q: <Hb>מַשְׁלִיךְ</Hb>, a: <>Hiphil participle ms of <Hb>שׁלך</Hb> — “throwing.”</> },
        { q: <Hb>הָגְלָה</Hb>, a: <>Hophal perfect 3ms of <Hb>גלה</Hb> — “he was carried into exile.”</> },
      ]}
    />
  </>
)
