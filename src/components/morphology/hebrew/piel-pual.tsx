/* ─────────────────────────────────────────────
   Hebrew chapter: Piel & Pual

   The doubled-middle stems: forms, the factitive / intensive /
   denominative range, and the high-frequency Piel vocabulary.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx } from '../shared'

export const HB_PIEL_PUAL = (
  <>
    <P>
      The Piel&rsquo;s fingerprint is a <strong>dagesh forte in the middle root letter</strong>.
      Its meaning is not always &ldquo;intensive&rdquo;: more often it makes a state into an
      action (<em>factitive</em>: <Hb>קִדֵּשׁ</Hb> &ldquo;make holy&rdquo;) or simply is the
      stem a verb happens to live in (<Hb>דִּבֶּר</Hb> &ldquo;speak&rdquo;). The Pual is its
      passive.
    </P>

    <SectionHeading n={1}>Piel forms</SectionHeading>
    <MorphTable
      title="Piel of קטל"
      headers={['Conjugation', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[0, 2]}
      firstColIsData
      rows={[
        ['perfect 3ms', 'קִטֵּל', 'he slaughtered'],
        ['perfect 3fs', 'קִטְּלָה', 'she slaughtered'],
        ['perfect 2ms', 'קִטַּלְתָּ', 'you slaughtered'],
        ['perfect 3cp', 'קִטְּלוּ', 'they slaughtered'],
        ['imperfect 3ms', 'יְקַטֵּל', 'he will slaughter'],
        ['imperfect 1cs', 'אֲקַטֵּל', 'I will slaughter'],
        ['imperative 2ms', 'קַטֵּל', 'slaughter!'],
        ['infinitive construct', 'קַטֵּל', 'to slaughter'],
        ['participle', 'מְקַטֵּל', 'slaughtering'],
      ]}
      note="Perfect: hireq–tsere. Imperfect: shewa under the prefix (יְ) — a Piel tell, since Qal prefixes carry hireq. Participle: מְ prefix."
    />

    <SectionHeading n={2}>Pual forms</SectionHeading>
    <MorphTable
      title="Pual of קטל"
      headers={['Conjugation', 'Form', 'Meaning']}
      hCols={[1]}
      tCols={[0, 2]}
      firstColIsData
      rows={[
        ['perfect 3ms', 'קֻטַּל', 'he was slaughtered'],
        ['imperfect 3ms', 'יְקֻטַּל', 'he will be slaughtered'],
        ['participle', 'מְקֻטָּל', 'being slaughtered'],
      ]}
      note="Same skeleton with u-class vowels (qibbuts). Rare in the flesh; instantly recognisable."
    />

    <SectionHeading n={3}>What Piel means</SectionHeading>
    <MorphTable
      title="The range"
      headers={['Nuance', 'Qal', 'Piel']}
      tCols={[0]}
      hCols={[1, 2]}
      firstColIsData
      rows={[
        ['factitive — make (someone) X', 'קָדַשׁ  be holy', 'קִדֵּשׁ  consecrate'],
        ['intensive / iterative', 'שָׁבַר  break', 'שִׁבַּר  shatter'],
        ['denominative — verb from a noun', 'דָּבָר  word', 'דִּבֶּר  speak'],
        ['simply the verb’s home stem', '—', 'בִּקֵּשׁ  seek'],
      ]}
    />
    <P>
      High-frequency Piels to bank now: <Hb>דִּבֶּר</Hb> speak, <Hb>צִוָּה</Hb> command,{' '}
      <Hb>בִּקֵּשׁ</Hb> seek, <Hb>הִלֵּל</Hb> praise, <Hb>לִמַּד</Hb> teach,{' '}
      <Hb>סִפֵּר</Hb> recount, <Hb>שִׁלַּח</Hb> send away, <Hb>בֵּרַךְ</Hb> bless — that last
      with tsere, because <Hb>ר</Hb> refuses the dagesh and the vowel compensates.
    </P>
    <HbEx he="הַלְלוּ־יָהּ" en={<>“Praise the LORD!” — Piel imperative 2mp of הלל + the short divine name. You have been parsing Piel since before you started.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">A dagesh in the middle radical after a vowel = Piel family (Piel, Pual, or Hithpael). The vowels around it pick which.</p>
      <p className="mb-1">Piel perfect <Hb>דִּבֶּר</Hb> vs the noun <Hb>דָּבָר</Hb>: hireq + dagesh vs qamets. Related root, different worlds.</p>
      <p>When the middle letter is a guttural or ר, look for compensatory tsere/qamets instead of a dagesh: בֵּרַךְ, מֵאֵן.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>דִּבֶּר</Hb>, a: <>Piel perfect 3ms of <Hb>דבר</Hb> — “he spoke.”</> },
        { q: <Hb>יְבַקְשׁוּ</Hb>, a: <>Piel imperfect 3mp of <Hb>בקשׁ</Hb> — “they will seek.”</> },
        { q: <Hb>מְדַבֵּר</Hb>, a: <>Piel participle ms of <Hb>דבר</Hb> — “speaking.”</> },
        { q: <Hb>צִוִּיתִי</Hb>, a: <>Piel perfect 1cs of <Hb>צוה</Hb> — “I commanded” (a III-ה root in Piel).</> },
      ]}
    />
  </>
)
