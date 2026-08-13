/* ─────────────────────────────────────────────
   Hebrew chapter: The Verb System

   The map before the territory: root, stem (binyan), conjugation,
   and the shape of a parse — the same slots the Reader's parsing
   pane shows and the morphology quizzes ask for.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, Term } from '../shared'

export const HB_VERB_SYSTEM = (
  <>
    <P>
      Almost every Hebrew verb is built on a <Term t="root"><strong>root</strong></Term>{' '}
      (<Hb>שֹׁרֶשׁ</Hb>) of three consonants. The root carries the core idea; everything
      else — who acts, when, in what <Term t="voice">voice</Term> — is said by the{' '}
      <em>pattern</em> poured around those three letters, the way English s-ng underlies
      sing, sang, sung, and song. Grammars
      display the patterns on the root <Hb>קטל</Hb> &ldquo;kill&rdquo;, chosen because its
      letters never misbehave.
    </P>

    <SectionHeading n={1}>The stems (binyanim)</SectionHeading>
    <P>
      A <strong>stem</strong> (Hebrew <em>binyan</em>, &ldquo;building&rdquo;) is a fixed
      pattern that sets the verb&rsquo;s voice and nuance. Seven do nearly all the work:
    </P>
    <MorphTable
      title="The seven major stems"
      headers={['Stem', 'Pattern (3ms perfect)', 'Nuance', 'Example']}
      tCols={[0, 2]}
      hCols={[1, 3]}
      firstColIsData
      striped
      rows={[
        ['Qal', 'קָטַל', 'simple active', 'שָׁמַר  he kept'],
        ['Niphal', 'נִקְטַל', 'passive / reflexive of Qal', 'נִשְׁמַר  he was kept'],
        ['Piel', 'קִטֵּל', 'intensive / factitive', 'דִּבֶּר  he spoke'],
        ['Pual', 'קֻטַּל', 'passive of Piel', 'דֻּבַּר  it was spoken'],
        ['Hiphil', 'הִקְטִיל', 'causative', 'הִמְלִיךְ  he made (someone) king'],
        ['Hophal', 'הָקְטַל', 'passive of Hiphil', 'הָמְלַךְ  he was made king'],
        ['Hithpael', 'הִתְקַטֵּל', 'reflexive / iterative', 'הִתְפַּלֵּל  he prayed'],
      ]}
      note="Qal (“light”) is the unmarked stem — about seventy percent of all verb forms in the Bible."
    />

    <SectionHeading n={2}>The conjugations</SectionHeading>
    <P>
      Within each stem, a verb inflects in a handful of <strong>conjugations</strong>. Hebrew
      marks <em>aspect</em> — complete versus incomplete action — more than tense; time comes
      from context.
    </P>
    <MorphTable
      title="What each conjugation does"
      headers={['Conjugation', 'Built with', 'Typical force', 'Example']}
      tCols={[0, 1, 2]}
      hCols={[3]}
      firstColIsData
      rows={[
        ['Perfect (qatal)', 'endings only', 'complete: “he kept”', 'שָׁמַר'],
        ['Imperfect (yiqtol)', 'prefixes (+ endings)', 'incomplete: “he will keep”', 'יִשְׁמֹר'],
        ['Sequential imperfect (wayyiqtol)', 'וַ + imperfect', 'narrative past: “and he kept”', 'וַיִּשְׁמֹר'],
        ['Sequential perfect (weqatal)', 'וְ + perfect', 'continues future / command', 'וְשָׁמַרְתָּ'],
        ['Imperative', 'imperfect minus prefix', 'command: “keep!”', 'שְׁמֹר'],
        ['Cohortative / Jussive', 'lengthened / shortened yiqtol', '“let me / let him…”', 'יְהִי'],
        ['Infinitives (construct, absolute)', 'fixed forms', '“to keep”; emphasis', 'לִשְׁמֹר'],
        ['Participles (active, passive)', 'noun-like forms', '“keeping”, “kept”', 'שֹׁמֵר'],
      ]}
    />

    <SectionHeading n={3}>The shape of a parse</SectionHeading>
    <P>
      To parse a Hebrew verb is to fill five slots: <strong>stem — conjugation — person —
      gender — number</strong>, plus the root. So <Hb>וַיֹּאמֶר</Hb> parses as Qal, sequential
      imperfect, 3ms, from <Hb>אמר</Hb> — &ldquo;and he said.&rdquo; These are exactly the
      labels the Reader&rsquo;s parsing pane shows when you click a word, and exactly the
      dropdowns a morphology quiz offers.
    </P>

    <InfoBox title="How to read the coming chapters">
      <p className="mb-1">Qal gets three chapters (perfect, imperfect, the waw-consecutive) because every other stem reuses its machinery — the endings and prefixes never change, only the vowel pattern between them.</p>
      <p className="mb-1">Learn each stem by its <em>fingerprint</em>: Niphal’s נ, Piel’s doubled middle letter, Hiphil’s ה + hireq-yod, Hithpael’s הִתְ.</p>
      <p>The pronoun chapter’s person-gender-number labels (3ms, 2fs…) now become verb endings — same grid, new use.</p>
    </InfoBox>

    <Practice
      level="both"
      title="Try it"
      items={[
        { q: <>What is the root of <Hb>הִמְלִיךְ</Hb> “he made king”?</>, a: <><Hb>מלך</Hb> — strip the Hiphil ה prefix and the hireq-yod pattern.</> },
        { q: <>Which stem is <Hb>נִשְׁבַּר</Hb> “it was broken”, and how do you know?</>, a: <>Niphal — the נ prefix on a perfect, and the passive sense of שׁבר “break.”</> },
        { q: <>Which stem doubles the middle root letter?</>, a: <>Piel (with its passive Pual, and Hithpael) — the dagesh forte in the middle radical is the fingerprint.</> },
        { q: <>Name the five parsing slots.</>, a: <>Stem, conjugation, person, gender, number — then add the root.</> },
      ]}
    />
  </>
)
