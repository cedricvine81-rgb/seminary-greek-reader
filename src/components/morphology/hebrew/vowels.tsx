/* ─────────────────────────────────────────────
   Hebrew chapter: Vowels & Pointing

   The Masoretic vowel signs, matres lectionis, shewa (vocal, silent,
   composite), dagesh lene vs forte, the small marks (mappiq, maqqef,
   meteg), and syllables & accent — including the qamets / qamets-hatuf
   rule that follows from them.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx, Term } from '../shared'

export const HB_VOWELS = (
  <>
    <P id="vowels.p1">
      The biblical text was written in consonants; the vowel <Term t="pointing">points</Term>{' '}
      were added by the Masoretes (ca. AD 600–900) to preserve the traditional pronunciation. Almost every sign
      sits <strong>under</strong> the consonant it follows: <Hb>דָּ</Hb> is read <em>da</em> —
      consonant first, then the vowel beneath it.
    </P>

    <SectionHeading id="vowels.h1" n={1}>The vowel signs</SectionHeading>
    <MorphTable id="vowels.t1"
      tCols={[2]}
      title="Vowels, by class"
      headers={['Sign', 'Name', 'Sound', 'Class']}
      hCols={[0]}
      firstColIsData
      striped
      rows={[
        ['בַ', 'patach', 'a as in “bat” — short', 'a'],
        ['בָ', 'qamets', 'a as in “father” — long', 'a'],
        ['בֶ', 'seghol', 'e as in “met” — short', 'e'],
        ['בֵ', 'tsere', 'e as in “they” — long', 'e'],
        ['בִ', 'hireq', 'i as in “sit” — short', 'i'],
        ['בִי', 'hireq-yod', 'i as in “machine” — long, written with י', 'i'],
        ['בֹ', 'holem', 'o as in “role” — long', 'o'],
        ['בוֹ', 'holem-waw', 'o as in “role” — long, written with ו', 'o'],
        ['בָ', 'qamets-hatuf', 'o as in “cost” — short (see §6)', 'o'],
        ['בֻ', 'qibbuts', 'u as in “put” — short', 'u'],
        ['בוּ', 'shureq', 'u as in “rule” — long, written with ו', 'u'],
      ]}
      note="Where two rows sound alike, the difference is spelling, not pronunciation: adding a vowel letter (ו or י) writes the long vowel “fully”. Holem and holem-waw are one sound spelled two ways, as are hireq and hireq-yod. Qamets and qamets-hatuf are the reverse case — one sign, two sounds; §6 tells you which is which."
    />

    <InfoBox id="vowels.b1" title="Why some vowels look duplicated">
      <p className="mb-1">Hebrew has five vowel qualities — a, e, i, o, u — and each comes short or long, which is why the table has eleven rows for five sounds.</p>
      <p className="mb-1"><strong>Length is about timing, not quality.</strong> To an English ear the a of patach and the a of qamets are the same sound; what differs is how the syllable counts when the grammar divides words and places the accent. That is why length matters so much later (and so little when reading aloud).</p>
      <p>Three pairs sound identical because they are the same vowel written two ways — with or without a vowel letter: holem / holem-waw, hireq / hireq-yod, and (nearly) qibbuts / shureq. The spelled-out form is the long one.</p>
    </InfoBox>

    <SectionHeading id="vowels.h2" n={2}>Vowel letters (matres lectionis)</SectionHeading>
    <P id="vowels.p2">
      Before the points existed, scribes used the consonants <Hb>י</Hb>, <Hb>ו</Hb> and{' '}
      <Hb>ה</Hb> to hint at vowels — &ldquo;mothers of reading.&rdquo; The pointed text keeps
      them: <Hb>ִי</Hb>, <Hb>ֵי</Hb>, <Hb>וֹ</Hb>, <Hb>וּ</Hb>, and final <Hb>ָה</Hb> as in{' '}
      <Hb>תּוֹרָה</Hb>. When <Hb>ו</Hb> or <Hb>י</Hb> carries a vowel point of its own it is a
      consonant; when it carries none, it is serving as a vowel letter.
    </P>

    <SectionHeading id="vowels.h3" n={3}>Shewa</SectionHeading>
    <P id="vowels.p3">
      The two dots <Hb>בְ</Hb> are the <strong>shewa</strong>. It is either <em>vocal</em> — a
      grunt of a half-vowel, like the first e of &ldquo;because&rdquo; (<Hb>דְּבָרִים</Hb>{' '}
      <em>devarim</em>) — or <em>silent</em>, simply closing a syllable (<Hb>מִדְבָּר</Hb>{' '}
      <em>mid-bar</em>). The working rules:
    </P>
    <MorphTable id="vowels.t2"
      title="Vocal or silent?"
      headers={['Position', 'Value', 'Example']}
      tCols={[0, 1]}
      hCols={[2]}
      firstColIsData
      rows={[
        ['At the start of a word or syllable', 'vocal', 'שְׁמוּאֵל'],
        ['After a short vowel, closing the syllable', 'silent', 'מִשְׁפָּט'],
        ['The first of two shewas together', 'silent (the second is vocal)', 'יִשְׁמְעוּ'],
        ['Under a doubled letter (dagesh forte)', 'vocal', 'הַמְּלָכִים'],
      ]}
    />
    <P id="vowels.p4">
      Gutturals cannot manage a plain vocal shewa, so they take a <strong>composite
      shewa</strong> — shewa fused with a short vowel: <Hb>חֲ</Hb> (hateph-patach),{' '}
      <Hb>אֱ</Hb> (hateph-seghol), <Hb>חֳ</Hb> (hateph-qamets). Hence <Hb>אֲשֶׁר</Hb>,{' '}
      <Hb>אֱלֹהִים</Hb>, <Hb>חֳדָשִׁים</Hb>.
    </P>

    <SectionHeading id="vowels.h4" n={4}>Dagesh: one dot, two jobs</SectionHeading>
    <MorphTable id="vowels.t3"
      title="Dagesh lene vs dagesh forte"
      headers={['', 'Where', 'What it does', 'Example']}
      tCols={[1, 2]}
      hCols={[3]}
      rows={[
        ['Lene', 'begadkephat only, after a consonant or at a word’s start', 'hardens the sound (b, g, d, k, p, t)', 'בַּיִת'],
        ['Forte', 'any letter except a guttural, always after a vowel', 'doubles the letter', 'הַשָּׁמַיִם'],
      ]}
      note="Tell them apart by what precedes: after a vowel it must be forte; where no vowel precedes, in a begadkephat letter, it is lene."
    />
    <P id="vowels.p5">
      Doubling matters grammatically: the article doubles the next letter, the Piel stem
      doubles the middle root letter, and assimilated <Hb>נ</Hb> hides as a dagesh forte (a dot that doubles the letter). When
      you see a dagesh after a vowel, read the letter twice: <Hb>הַשָּׁמַיִם</Hb> ={' '}
      <em>hash-shamayim</em>.
    </P>

    <SectionHeading id="vowels.h5" n={5}>The small marks</SectionHeading>
    <MorphTable id="vowels.t4"
      title="Other pointing"
      headers={['Mark', 'Name', 'What it means']}
      tCols={[1, 2]}
      hCols={[0]}
      firstColIsData
      rows={[
        ['הּ', 'mappiq', 'a dot in final he: the ה is a real consonant, not a vowel letter — סוּסָהּ “her horse”'],
        ['אֶת־', 'maqqef', 'a hyphen joining words into one accent unit'],
        ['בָֽ', 'meteg', 'a small stroke marking a secondary stress or protecting a long vowel'],
        ['׃', 'sof pasuq', 'end of the verse'],
      ]}
    />

    <SectionHeading id="vowels.h6" n={6}>Syllables and accent</SectionHeading>
    <P id="vowels.p6">
      Every syllable begins with a consonant and is <em>open</em> (ends in a vowel:{' '}
      <Hb>דָּ</Hb>) or <em>closed</em> (ends in a consonant: <Hb>בָר</Hb>). Stress usually
      falls on the <strong>last</strong> syllable (<Hb>דָּבָר</Hb> da-<em>var</em>), sometimes
      the next-to-last. And the rule that decides qamets vs qamets-hatuf: in an{' '}
      <strong>unaccented closed</strong> syllable the sign is the short o —{' '}
      <Hb>חָכְמָה</Hb> is <em>ḥok-mah</em>, not <em>ḥak-mah</em>; everywhere else it is long a.
    </P>
    <HbEx he="בְּרֵאשִׁית בָּרָא אֱלֹהִים" en={<>be-re-SHIT ba-RA e-lo-HIM (Gen 1:1) — vocal shewa, qamets, composite shewa, all in the Bible’s first three words.</>} />

    <InfoBox id="vowels.b2" title="Watch for">
      <p className="mb-1">A shewa under the <em>last</em> letter of a word is always silent: <Hb>מֶלֶךְ</Hb>.</p>
      <p className="mb-1">Furtive patach: final <Hb>ח</Hb> or <Hb>ע</Hb> after a long vowel slips an a-sound in <em>before</em> itself — <Hb>רוּחַ</Hb> is <em>ru-aḥ</em>, not <em>ru-ḥa</em>.</p>
      <p>Alef at the end of a syllable is silent and lengthens the vowel: <Hb>רֹאשׁ</Hb> = <em>rosh</em>.</p>
    </InfoBox>

    <Practice id="vowels.x1"
      level="both"
      title="Try it"
      items={[
        { q: <>Divide into syllables: <Hb>מִדְבָּר</Hb></>, a: <><em>mid-bar</em> — the shewa is silent (it follows a short vowel and closes the syllable). The dagesh in <Hb>ב</Hb> is lene.</> },
        { q: <>Divide into syllables: <Hb>דְּבָרִים</Hb></>, a: <><em>de-va-rim</em> — the shewa starts the word, so it is vocal.</> },
        { q: <>Is the dagesh in <Hb>הַמֶּלֶךְ</Hb> lene or forte?</>, a: <>Forte — it follows a vowel (the patach of the article) and doubles the mem: <em>ham-me-lek</em>.</> },
        { q: <>How is <Hb>אָכְלָה</Hb> (“food”) pronounced?</>, a: <><em>ʾok-lah</em> — unaccented closed syllable, so the qamets is qamets-hatuf (o).</> },
      ]}
    />
  </>
)
