/* ─────────────────────────────────────────────
   Hebrew chapter: Piel & Pual

   The doubled-middle stems: forms, the factitive / intensive /
   denominative range, and the high-frequency Piel vocabulary.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_PIEL_PUAL = (
  <>
    <P>
      The <Term t="piel">Piel</Term>&rsquo;s fingerprint is a{' '}
      <Term t="dagesh"><strong>dagesh forte</strong></Term> — a doubling dot —{' '}
      <strong>in the middle root letter</strong>.
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
        ['perfect 3fs', 'קִטְּלָ|ה', 'she slaughtered'],
        ['perfect 2ms', 'קִטַּלְ|תָּ', 'you slaughtered'],
        ['perfect 3cp', 'קִטְּל|וּ', 'they slaughtered'],
        ['imperfect 3ms', 'יְ»קַטֵּל', 'he will slaughter'],
        ['imperfect 1cs', 'אֲ»קַטֵּל', 'I will slaughter'],
        ['imperative 2ms', 'קַטֵּל', 'slaughter!'],
        ['infinitive construct', 'קַטֵּל', 'to slaughter'],
        ['participle', 'מְ»קַטֵּל', 'slaughtering'],
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
        ['imperfect 3ms', 'יְ»קֻטַּל', 'he will be slaughtered'],
        ['participle', 'מְ»קֻטָּל', 'being slaughtered'],
      ]}
      note="Same skeleton with u-class vowels (qibbuts). Rare in the flesh; instantly recognisable."
    />

    <SectionHeading n={3}>What Piel means — and what “intensive” really is</SectionHeading>
    <P>
      Older grammars call the Piel the <strong>“intensive” stem</strong>, and the label has a
      certain logic: the middle letter is doubled, so — the thought ran — the action is
      &ldquo;doubled&rdquo; too. Sometimes that is exactly right. <Hb>שָׁבַר</Hb> in Qal is
      &ldquo;to break&rdquo; — one clean snap; the Piel <Hb>שִׁבַּר</Hb> is &ldquo;to
      smash to pieces&rdquo; — the same act done thoroughly, violently, or over and over.
      When Moses came down the mountain and <Hb>וַיְשַׁבֵּר</Hb> the tablets (Exod 32:19),
      the text chose the Piel: not &ldquo;cracked&rdquo; but <em>shattered</em>.
    </P>
    <P>
      But test that idea across the language and it fails more often than it works —
      <Hb>דִּבֶּר</Hb> &ldquo;speak&rdquo; is not intense speaking, and <Hb>בִּקֵּשׁ</Hb>{' '}
      &ldquo;seek&rdquo; is not frantic seeking. Modern grammars therefore treat the Piel&rsquo;s
      core as <strong>factitive</strong>: it takes a <em>state</em> and turns it into an{' '}
      <em>act done to someone</em>. Qal <Hb>קָדַשׁ</Hb> &ldquo;to <em>be</em> holy&rdquo;
      becomes Piel <Hb>קִדֵּשׁ</Hb> &ldquo;to <em>make</em> holy, consecrate&rdquo;; Qal{' '}
      <Hb>גָּדַל</Hb> &ldquo;to <em>be</em> great&rdquo; becomes Piel <Hb>גִּדַּל</Hb>{' '}
      &ldquo;to make great — to raise a child, to magnify.&rdquo;
    </P>
    <InfoBox title="In plain English">
      <p className="mb-1">English does the factitive with suffixes and word-pairs, so you already know the move:</p>
      <p className="mb-1">· <em>pure → purify</em>, <em>sterile → sterilize</em>, <em>modern → modernize</em> — an adjective (a state) turned into an action done to something. That is Qal → Piel in miniature.</p>
      <p className="mb-1">· <em>learn → teach</em> — “to teach” is “to cause someone to learn.” Hebrew says it with the same root: Qal <Hb>לָמַד</Hb> “learn” → Piel <Hb>לִמַּד</Hb> “teach.”</p>
      <p>· <em>break → smash</em>, <em>hit → batter</em>, <em>bite → gnaw</em> — the genuinely “intensive” pairs. English needs a different word; Hebrew doubles a letter.</p>
    </InfoBox>
    <MorphTable
      title="The range"
      headers={['Nuance', 'Qal', 'Piel', 'English parallel']}
      tCols={[0, 3]}
      hCols={[1, 2]}
      firstColIsData
      rows={[
        ['factitive — make (someone) X', 'קָדַשׁ  be holy', 'קִדֵּשׁ  consecrate', 'pure → purify'],
        ['intensive / iterative', 'שָׁבַר  break', 'שִׁבַּר  shatter', 'break → smash'],
        ['denominative — verb from a noun', 'דָּבָר  word', 'דִּבֶּר  speak', 'a text → to text'],
        ['simply the verb’s home stem', '—', 'בִּקֵּשׁ  seek', 'no Qal exists to compare'],
      ]}
      note="Practical rule: the dagesh tells you the STEM; the lexicon tells you the SENSE. Never translate a Piel “harder” on principle — check whether this root actually pairs a Qal state with a Piel act."
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
