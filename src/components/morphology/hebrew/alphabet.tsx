/* ─────────────────────────────────────────────
   Hebrew chapter: The Alphabet

   First-year coverage: the 23 consonants (sin/shin counted separately),
   final forms, begadkephat, gutturals, look-alikes. Vowels are the next
   chapter — the alphabet itself is consonants only.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, Term, HbReading } from '../shared'

export const HB_ALPHABET = (
  <>
    <P>
      Hebrew is written <strong>right to left</strong>, in consonants. The vowel signs you see
      under and above the letters — the <Term t="pointing">pointing</Term> — were added by the
      Masoretes centuries after the text was written; they are the next chapter. (Throughout
      this grammar, any <span className="underline decoration-dotted decoration-brand-400 underline-offset-2">dotted-underlined</span>{' '}
      term can be tapped for a plain-English definition — no grammar background is assumed.) You already know more Hebrew than you think:{' '}
      <Hb>אָמֵן</Hb> (amen), <Hb>שָׁלוֹם</Hb> (shalom), <Hb>הַלְלוּ־יָהּ</Hb> (hallelu-Yah,
      &ldquo;praise the LORD&rdquo;) all carry straight into English.
    </P>

    <SectionHeading n={1}>The 23 consonants</SectionHeading>
    <P>
      Say each letter&rsquo;s name aloud as you copy it out — the names rehearse the sounds.
      Where two pronunciations are listed, the first is the hard sound (with a dot, next
      section) and the second the soft.
    </P>
    <MorphTable
      title="The Hebrew alphabet"
      headers={['Letter', 'Name', 'Sound', 'Transliteration']}
      hCols={[0]}
      firstColIsData
      striped
      rows={[
        ['א', 'alef', 'silent (a glottal catch)', 'ʾ'],
        ['ב', 'bet', 'b / v', 'b / ḇ'],
        ['ג', 'gimel', 'g as in “get”', 'g'],
        ['ד', 'dalet', 'd', 'd'],
        ['ה', 'he', 'h', 'h'],
        ['ו', 'waw', 'w (or v)', 'w'],
        ['ז', 'zayin', 'z', 'z'],
        ['ח', 'het', 'ch as in “loch”', 'ḥ'],
        ['ט', 'tet', 't', 'ṭ'],
        ['י', 'yod', 'y', 'y'],
        ['כ', 'kaf', 'k / ch as in “loch”', 'k / ḵ'],
        ['ל', 'lamed', 'l', 'l'],
        ['מ', 'mem', 'm', 'm'],
        ['נ', 'nun', 'n', 'n'],
        ['ס', 'samek', 's', 's'],
        ['ע', 'ayin', 'silent (deeper catch than alef)', 'ʿ'],
        ['פ', 'pe', 'p / f', 'p / p̄'],
        ['צ', 'tsade', 'ts as in “nets”', 'ṣ'],
        ['ק', 'qof', 'k (further back)', 'q'],
        ['ר', 'resh', 'r', 'r'],
        ['שׂ', 'sin', 's', 'ś'],
        ['שׁ', 'shin', 'sh', 'š'],
        ['ת', 'taw', 't', 't'],
      ]}
      note="Sin and shin are the same letter shape distinguished by the dot: left dot = sin (s), right dot = shin (sh)."
    />

    <SectionHeading n={2}>Final forms</SectionHeading>
    <P>
      Five letters change shape at the end of a word — the mnemonic is the made-up word{' '}
      <em>kemnepets</em> (<Hb>כמנפץ</Hb>). The sound does not change, only the shape: most
      finals drop a tail below the line.
    </P>
    <MorphTable
      title="Final (sofit) forms"
      headers={['Normal', 'Final', 'Example']}
      hCols={[0, 1, 2]}
      firstColIsData
      rows={[
        ['כ', 'ך', 'מֶלֶךְ  (king)'],
        ['מ', 'ם', 'שָׁלוֹם  (peace)'],
        ['נ', 'ן', 'בֵּן  (son)'],
        ['פ', 'ף', 'כֶּסֶף  (silver)'],
        ['צ', 'ץ', 'אֶרֶץ  (land)'],
      ]}
    />

    <SectionHeading n={3}>Begadkephat: the six two-sound letters</SectionHeading>
    <P>
      Six letters — <Hb>ב ג ד כ פ ת</Hb>, remembered as <em>begadkephat</em> — each have a hard
      and a soft pronunciation. A dot inside the letter (the <em>dagesh lene</em>) marks the
      hard sound; without it the letter is soft. In practice most readers today only
      distinguish three pairs: <Hb>בּ/ב</Hb> (b/v), <Hb>כּ/כ</Hb> (k/ch), <Hb>פּ/פ</Hb> (p/f).
    </P>
    <MorphTable
      title="Begadkephat"
      headers={['Hard (with dagesh)', 'Soft (without)', 'Hard sound', 'Soft sound']}
      hCols={[0, 1]}
      firstColIsData
      rows={[
        ['בּ', 'ב', 'b', 'v'],
        ['גּ', 'ג', 'g', 'g (originally gh)'],
        ['דּ', 'ד', 'd', 'd (originally th as in “this”)'],
        ['כּ', 'כ', 'k', 'ch as in “loch”'],
        ['פּ', 'פ', 'p', 'f'],
        ['תּ', 'ת', 't', 't (originally th as in “thin”)'],
      ]}
      note="Rule of thumb: begadkephat is hard at the start of a word or syllable, soft after a vowel."
    />

    <SectionHeading n={4}>The gutturals</SectionHeading>
    <P>
      <Hb>א ה ח ע</Hb> — plus <Hb>ר</Hb>, which behaves like them half the time — are the{' '}
      <strong>gutturals</strong>, made at the back of the throat. Learn the set now: gutturals{' '}
      <strong>refuse to be doubled</strong> and <strong>prefer a-class vowels</strong>, and
      those two facts explain most of the &ldquo;irregular&rdquo; spellings you will meet in
      the article, the prepositions, and the weak verbs.
    </P>

    <SectionHeading n={5}>Look-alikes</SectionHeading>
    <InfoBox title="Letters beginners confuse">
      <p className="mb-1"><Hb>ב</Hb> bet vs <Hb>כ</Hb> kaf — bet has a heel jutting out at the bottom right.</p>
      <p className="mb-1"><Hb>ד</Hb> dalet vs <Hb>ר</Hb> resh — dalet has a sharp corner; resh is rounded.</p>
      <p className="mb-1"><Hb>ה</Hb> he vs <Hb>ח</Hb> het vs <Hb>ת</Hb> taw — he has a gap at the top left; het is closed; taw has a foot.</p>
      <p className="mb-1"><Hb>ו</Hb> waw vs <Hb>ז</Hb> zayin vs final <Hb>ן</Hb> nun — zayin&rsquo;s head crosses the stem; final nun drops below the line.</p>
      <p><Hb>ס</Hb> samek vs final <Hb>ם</Hb> mem — samek is round; final mem is squared.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      intro={<>Name each letter, right to left.</>}
      items={[
        { q: <Hb>דבר</Hb>, a: <>dalet, bet, resh — the root of <Hb>דָּבָר</Hb>, &ldquo;word.&rdquo;</> },
        { q: <Hb>שׁלום</Hb>, a: <>shin, lamed, waw, final mem — <Hb>שָׁלוֹם</Hb>, &ldquo;peace.&rdquo;</> },
        { q: <Hb>ארץ</Hb>, a: <>alef, resh, final tsade — <Hb>אֶרֶץ</Hb>, &ldquo;land.&rdquo;</> },
        { q: <>Which letters of <Hb>מלאך</Hb> are gutturals?</>, a: <>Only the <Hb>א</Hb>. (mem, lamed, alef, final kaf — <Hb>מַלְאָךְ</Hb>, &ldquo;messenger, angel.&rdquo;)</> },
      ]}
    />
    <HbReading />
  </>
)
