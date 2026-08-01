/* ─────────────────────────────────────────────
   Chapter: How to Parse

   Sits between Pronunciation and Nouns/Adj. — the student can now read the
   letters aloud but has not yet met a paradigm. This chapter teaches the
   ANSWER FORMAT before the forms: what slots a parse has, in what order, and
   which set of slots each part of speech uses.

   Order is the standard NT convention (Mounce, Black, Croy):
     • nominals      case · number · gender · lexical form
     • finite verbs  tense · voice · mood · person · number · lexical form
     • participles   tense · voice · participle · case · number · gender · lexical
     • infinitives   tense · voice · infinitive · lexical
   Wallace's Greek Grammar Beyond the Basics reverses the nominal order to
   gender-number-case; that divergence is flagged at Intermediate level rather
   than hidden, since students meet both in the commentaries.
───────────────────────────────────────────── */

import {
  ColsTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, InfoBox,
  GuidedExample, DropdownPractice, LiveExamples,
} from '../shared'

/** A parse written out, so the fixed word order is visible at a glance. */
function Slots({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-brand-800">{children}</span>
}

export const PARSING_CONTENT = (
  <>
    {/* ── 1 · What parsing is (Beginning only) ───────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Before the forms: learn the answer</SectionHeading>
      <P>
        You can now read Greek letters aloud. The next thing to learn is not a paradigm — it is what a
        right answer looks like. To <Term t="parse">parse</Term> a word is to say what job it is doing,
        and Greek says that job out loud in the word&rsquo;s ending. English mostly uses word order
        instead: &ldquo;the dog bit the man&rdquo; and &ldquo;the man bit the dog&rdquo; use identical
        words and mean opposite things. Greek can shuffle the words freely, because the endings, not the
        order, carry who did what.
      </P>
      <P>
        So every Greek word you meet asks the same short list of questions, and the answers always come
        in the same fixed order. Learn the order now and every later chapter is just filling in options
        you already have slots for.
      </P>
    </LevelOnly>

    {/* ── 2 · The master table ───────────────────────────── */}
    <SectionHeading n={1}>Four patterns — which slots to fill</SectionHeading>
    <P>
      There are only four parsing patterns in Greek. Find which one the word belongs to, then fill its
      slots left to right. The last slot is always the <strong>lexical form</strong> — the dictionary
      entry you would look the word up under.
    </P>

    <ColsTable
      title="The parse, by part of speech"
      headers={['Word type', 'Slots, in order', 'Worked example']}
      rows={[
        [
          <>Noun<br /><span className="text-xs text-gray-500">also adjective, article, pronoun</span></>,
          <Slots>case · number · gender · lexical form</Slots>,
          <><Gk>ἀνθρώπους</Gk> = accusative plural masculine of <Gk>ἄνθρωπος</Gk></>,
        ],
        [
          <>Finite verb<br /><span className="text-xs text-gray-500">a verb with a subject built in</span></>,
          <Slots>tense · voice · mood · person · number · lexical form</Slots>,
          <><Gk>λύει</Gk> = present active indicative 3rd singular of <Gk>λύω</Gk></>,
        ],
        [
          <>Participle<br /><span className="text-xs text-gray-500">verbal adjective — both sets</span></>,
          <Slots>tense · voice · participle · case · number · gender · lexical form</Slots>,
          <><Gk>λύων</Gk> = present active participle nominative singular masculine of <Gk>λύω</Gk></>,
        ],
        [
          <>Infinitive<br /><span className="text-xs text-gray-500">verbal noun — no person</span></>,
          <Slots>tense · voice · infinitive · lexical form</Slots>,
          <><Gk>λύειν</Gk> = present active infinitive of <Gk>λύω</Gk></>,
        ],
        [
          <>Indeclinable<br /><span className="text-xs text-gray-500">preposition, conjunction, adverb, particle</span></>,
          <span className="text-sm text-gray-600">no slots — name the part of speech</span>,
          <><Gk>ἐν</Gk> = preposition (takes the dative)</>,
        ],
      ]}
      note="The lexical form always comes last, introduced by “of” or “from”."
    />

    {/* ── 3 · Nouns ──────────────────────────────────────── */}
    <SectionHeading n={2}>Parsing a noun: case · number · gender</SectionHeading>
    <P>
      Every noun, adjective, article and pronoun gets exactly three answers, always in this order. Each
      column below is one slot; pick one option from each.
    </P>

    <TableAside
      beginning={
        <>
          <AsideLabel>Read a column at a time</AsideLabel>
          <p>
            Work left to right and say it as one phrase. Do not stop at the case — an unfinished parse
            (&ldquo;it&rsquo;s genitive&rdquo;) is not an answer.
          </p>
          <AsideLabel>Worked</AsideLabel>
          <Ex grc={<Gk>τῆς βασιλείας</Gk>} en="genitive singular feminine — “of the kingdom”" />
          <Ex grc={<Gk>τοῖς λόγοις</Gk>} en="dative plural masculine — “to/with the words”" />
          <p>
            Notice the article agrees with its noun in all three slots. That makes the article the best
            parsing clue in the language: parse it, and you have parsed the noun.
          </p>
        </>
      }
      intermediate={
        <>
          <AsideLabel>Gender is grammatical, not natural</AsideLabel>
          <p>
            <Gk>τὸ τέκνον</Gk> (&ldquo;the child&rdquo;) is neuter and <Gk>ἡ ἁμαρτία</Gk> (&ldquo;sin&rdquo;)
            is feminine; neither says anything about the referent. Gender is a property of the noun in the
            lexicon, so it is the one slot you cannot always read off the ending — you learn it with the word.
          </p>
          <AsideLabel>Why the vocative is listed last</AsideLabel>
          <p>
            The vocative is distinct only in a few singular forms (<Gk>κύριε</Gk>, <Gk>πάτερ</Gk>,{' '}
            <Gk>ἀδελφέ</Gk>); elsewhere it borrows the nominative. Some paradigms therefore omit it, but it
            is a real case and the NT uses it constantly in address and prayer.
          </p>
        </>
      }
    >
      <ColsTable
        title="Noun slots — pick one from each column"
        headers={['1 · Case', '2 · Number', '3 · Gender']}
        rows={[
          [<><strong>Nominative</strong> <span className="text-xs text-gray-500">— subject</span></>, <strong>Singular</strong>, <strong>Masculine</strong>],
          [<><strong>Genitive</strong> <span className="text-xs text-gray-500">— “of”, possession, source</span></>, <strong>Plural</strong>, <strong>Feminine</strong>],
          [<><strong>Dative</strong> <span className="text-xs text-gray-500">— “to / for / with / in”</span></>, '', <strong>Neuter</strong>],
          [<><strong>Accusative</strong> <span className="text-xs text-gray-500">— direct object</span></>, '', ''],
          [<><strong>Vocative</strong> <span className="text-xs text-gray-500">— direct address</span></>, '', ''],
        ]}
        note="Then add the lexical form: “accusative plural masculine of ἄνθρωπος.”"
      />
    </TableAside>

    {/* ── 4 · Verbs ──────────────────────────────────────── */}
    <SectionHeading n={3}>Parsing a finite verb: tense · voice · mood · person · number</SectionHeading>
    <P>
      A <strong>finite</strong> verb is one that carries its own subject — <Gk>λύει</Gk> already means
      &ldquo;he/she/it looses&rdquo; without a separate word for &ldquo;he.&rdquo; Finite verbs take five
      answers, always in this order.
    </P>

    <TableAside
      beginning={
        <>
          <AsideLabel>Five in one breath</AsideLabel>
          <p>
            Say it as a single phrase and it stops feeling like five facts:
            &ldquo;present-active-indicative-third-singular.&rdquo; Students who pause between slots
            lose their place; students who chant it do not.
          </p>
          <AsideLabel>Worked</AsideLabel>
          <Ex grc={<Gk>ἀκούομεν</Gk>} en="present active indicative 1st plural of ἀκούω — “we hear”" />
          <Ex grc={<Gk>ἐπίστευσαν</Gk>} en="aorist active indicative 3rd plural of πιστεύω — “they believed”" />
          <p>
            <strong>Voice</strong> asks whether the subject acts (active), is acted on (passive), or acts
            with a stake in the outcome (middle). <strong>Mood</strong> asks how the speaker presents it:
            as fact, as possibility, as command, as wish.
          </p>
        </>
      }
      intermediate={
        <>
          <AsideLabel>Tense is aspect first, time second</AsideLabel>
          <p>
            Outside the indicative, the tense slot carries <Term t="aspect">aspect</Term> and not time at
            all: an aorist subjunctive is not past. Keep naming the tense by its label — you are reporting
            the form, not committing to a translation.
          </p>
          <AsideLabel>The optative</AsideLabel>
          <p>
            Only ~68 NT occurrences, most of them Paul&rsquo;s <Gk>μὴ γένοιτο</Gk>. It stays in the table
            because it is a real slot option and Luke and Paul both use it deliberately.
          </p>
          <AsideLabel>Pluperfect</AsideLabel>
          <p>
            Rare (~86 in the NT) and never augmented consistently; some grammars fold it into the perfect
            for beginners. Named here so you recognise it in an apparatus.
          </p>
        </>
      }
    >
      <ColsTable
        title="Finite-verb slots — pick one from each column"
        headers={['1 · Tense', '2 · Voice', '3 · Mood', '4 · Person', '5 · Number']}
        rows={[
          [<strong>Present</strong>, <strong>Active</strong>, <><strong>Indicative</strong> <span className="text-xs text-gray-500">— states a fact</span></>, <>1st <span className="text-xs text-gray-500">— I / we</span></>, <strong>Singular</strong>],
          [<strong>Imperfect</strong>, <strong>Middle</strong>, <><strong>Subjunctive</strong> <span className="text-xs text-gray-500">— may / might</span></>, <>2nd <span className="text-xs text-gray-500">— you</span></>, <strong>Plural</strong>],
          [<strong>Future</strong>, <strong>Passive</strong>, <><strong>Imperative</strong> <span className="text-xs text-gray-500">— command</span></>, <>3rd <span className="text-xs text-gray-500">— he/she/it, they</span></>, ''],
          [<strong>Aorist</strong>, '', <><strong>Optative</strong> <span className="text-xs text-gray-500">— wish (rare)</span></>, '', ''],
          [<strong>Perfect</strong>, '', '', '', ''],
          [<strong>Pluperfect</strong>, '', '', '', ''],
        ]}
        note="Then add the lexical form: “present active indicative 3rd singular of λύω.”"
      />
    </TableAside>

    {/* ── 5 · Non-finite ─────────────────────────────────── */}
    <SectionHeading n={4}>Participles and infinitives — the hybrids</SectionHeading>
    <P>
      These two are <strong>non-finite</strong>: they have no person, because they have no subject of
      their own. A participle is a verbal adjective, so after its verb slots it takes the whole noun set
      as well. An infinitive is a verbal noun and simply stops.
    </P>

    <ColsTable
      headers={['Form', 'Slots, in order', 'Worked example']}
      rows={[
        [
          <strong>Participle</strong>,
          <Slots>tense · voice · <span className="text-gray-500">participle</span> · case · number · gender · lexical</Slots>,
          <><Gk>πιστεύων</Gk> = present active participle nominative singular masculine of <Gk>πιστεύω</Gk></>,
        ],
        [
          <strong>Participle</strong>,
          <span className="text-xs text-gray-500">same six slots, a different form</span>,
          <><Gk>γραφέντα</Gk> = aorist passive participle accusative singular masculine of <Gk>γράφω</Gk></>,
        ],
        [
          <strong>Infinitive</strong>,
          <Slots>tense · voice · <span className="text-gray-500">infinitive</span> · lexical</Slots>,
          <><Gk>πιστεύειν</Gk> = present active infinitive of <Gk>πιστεύω</Gk></>,
        ],
        [
          <strong>Infinitive</strong>,
          <span className="text-xs text-gray-500">no person, no number, no gender</span>,
          <><Gk>γραφῆναι</Gk> = aorist passive infinitive of <Gk>γράφω</Gk></>,
        ],
      ]}
      note="“Participle” and “infinitive” occupy the mood slot in this scheme — say the word aloud where the mood would go."
    />

    <InfoBox title="The one rule to carry forward">
      <p>
        A parse is finished only when you have named <em>every</em> slot for that word type and then the
        lexical form. &ldquo;Aorist&rdquo; is not a parse. &ldquo;Aorist active indicative 3rd singular of{' '}
        <span className="normal-case">λύω</span>&rdquo; is.
      </p>
    </InfoBox>

    {/* ── 6 · Intermediate: conventions and ambiguity ────── */}
    <LevelOnly level="intermediate">
      <SectionHeading n={5}>Conventions you will meet elsewhere</SectionHeading>
      <P>
        <strong>Case-number-gender vs gender-number-case.</strong> The order taught here — case first — is
        the standard of the introductory grammars (Mounce, Black, Croy) and of this course. Wallace&rsquo;s{' '}
        <em>Greek Grammar Beyond the Basics</em> and several parsing guides invert it to
        gender-number-case. Both name the same three slots; only the recitation order differs. Use
        case-number-gender in this course, and do not be thrown when a commentary writes
        &ldquo;masculine singular nominative.&rdquo;
      </P>
      <P>
        <strong>Mood, or not.</strong> Traditional paradigms list the infinitive and participle alongside
        the four moods, which is convenient for parsing and wrong as grammar: neither is a mood, since
        neither makes an assertion. Say &ldquo;participle&rdquo; in the mood slot, but do not conclude
        that it is one.
      </P>
      <P>
        <strong>Ambiguity is normal, and it is an answer.</strong> A great many forms are formally
        ambiguous, and the honest parse names the options rather than guessing:
      </P>
      <ColsTable
        headers={['Form', 'Formally', 'How the context decides']}
        rows={[
          [<Gk>τέκνα</Gk>, 'nominative or accusative plural neuter', 'Neuter never distinguishes the two — find the verb and ask whether this is doing or being done to.'],
          [<Gk>γράφεται</Gk>, 'present middle or passive indicative 3rd singular', 'Middle and passive are identical outside the aorist and future. Sense, and any agent phrase (ὑπό + genitive), decides.'],
          [<Gk>τῆς φωνῆς</Gk>, 'genitive singular feminine', 'Unambiguous — but whether it is possession, source or objective genitive is syntax, not parsing.'],
          [<Gk>ἀνθρώπου</Gk>, 'genitive singular masculine', 'Compare ἀνθρώπους (accusative plural): one letter apart in sound, a different job entirely.'],
        ]}
        note="Naming both options is a complete parse. Silently picking one is not."
      />
      <P>
        That last row is worth dwelling on. Parsing tells you the <em>form</em>; it does not tell you the{' '}
        <em>function</em>. &ldquo;Genitive singular feminine&rdquo; is a parse; &ldquo;genitive of
        source&rdquo; is an exegetical claim that needs an argument. Keeping the two apart is most of what
        separates careful exegesis from proof-texting with a lexicon.
      </P>
    </LevelOnly>

    {/* ── 7 · Guided ─────────────────────────────────────── */}
    <GuidedExample
      title="Together: parse every word of John 1:1a"
      sentence={<Gk>ἐν ἀρχῇ ἦν ὁ λόγος</Gk>}
      source={{ ref: 'John 1:1', label: 'John 1:1' }}
      translation="“In the beginning was the Word.”"
      steps={[
        {
          prompt: 'First sort the words: which pattern does each one need?',
          answer: <>
            <Gk>ἐν</Gk> is a preposition — indeclinable, no slots. <Gk>ἀρχῇ</Gk> and <Gk>λόγος</Gk> are
            nouns — three slots each. <Gk>ὁ</Gk> is the article — it parses like a noun.{' '}
            <Gk>ἦν</Gk> is the only finite verb — five slots.
          </>,
        },
        {
          prompt: <>Parse <Gk>ἀρχῇ</Gk>.</>,
          answer: <>Dative singular feminine of <Gk>ἀρχή</Gk>. The <Gk>-ῃ</Gk> ending is dative singular, and <Gk>ἐν</Gk> always takes the dative — the preposition confirms the case.</>,
        },
        {
          prompt: <>Parse <Gk>ὁ λόγος</Gk> — both words.</>,
          answer: <><Gk>ὁ</Gk> = nominative singular masculine article; <Gk>λόγος</Gk> = nominative singular masculine of <Gk>λόγος</Gk>. They agree in all three slots, which is how you know they belong together. Nominative means this is the subject.</>,
        },
        {
          prompt: <>Parse <Gk>ἦν</Gk>.</>,
          answer: <>Imperfect active indicative 3rd singular of <Gk>εἰμί</Gk>. All five slots named, then the lexical form.</>,
        },
        {
          prompt: 'What has the parsing already told you about the sentence?',
          answer: <>That <Gk>ὁ λόγος</Gk> is the subject (nominative) and <Gk>ἐν ἀρχῇ</Gk> is a prepositional phrase of place/time (dative) — before you have translated a word. The imperfect <Gk>ἦν</Gk> describes continuing existence rather than a point of origin, which is exactly the theological weight the verse carries.</>,
        },
      ]}
    />

    {/* ── 8 · Drills ─────────────────────────────────────── */}
    <DropdownPractice
      title="Practice — parse the noun"
      intro={<>Give all three slots in order: case, number, gender. (Lexical forms are given; you are naming the slots, not the paradigm.)</>}
      options={[
        'nominative singular masculine',
        'genitive singular masculine',
        'dative singular masculine',
        'accusative singular masculine',
        'accusative plural masculine',
        'accusative plural feminine',
        'genitive singular feminine',
        'dative plural masculine',
        'nominative or accusative plural neuter',
      ]}
      items={[
        { q: <><Gk>λόγῳ</Gk> <span className="text-xs text-gray-500">(λόγος, m.)</span></>, answer: 'dative singular masculine', note: <>The <Gk>-ῳ</Gk> ending is the mark of the dative singular in this declension.</> },
        { q: <><Gk>ἀνθρώπου</Gk> <span className="text-xs text-gray-500">(ἄνθρωπος, m.)</span></>, answer: 'genitive singular masculine', note: <>&ldquo;of a man.&rdquo; Do not confuse with <Gk>ἀνθρώπους</Gk>, accusative plural.</> },
        { q: <><Gk>τέκνα</Gk> <span className="text-xs text-gray-500">(τέκνον, n.)</span></>, answer: 'nominative or accusative plural neuter', note: <>Neuter never distinguishes nominative from accusative. Naming both is the complete answer.</> },
        { q: <><Gk>ἀρχῆς</Gk> <span className="text-xs text-gray-500">(ἀρχή, f.)</span></>, answer: 'genitive singular feminine' },
        { q: <><Gk>λόγοις</Gk> <span className="text-xs text-gray-500">(λόγος, m.)</span></>, answer: 'dative plural masculine' },
        { q: <><Gk>ἀνθρώπους</Gk> <span className="text-xs text-gray-500">(ἄνθρωπος, m.)</span></>, answer: 'accusative plural masculine' },
      ]}
    />

    <DropdownPractice
      title="Practice — parse the verb"
      intro={<>Give all five slots in order: tense, voice, mood, person, number.</>}
      options={[
        'present active indicative 3rd singular',
        'present active indicative 1st plural',
        'present middle or passive indicative 3rd singular',
        'imperfect active indicative 3rd singular',
        'future active indicative 1st plural',
        'aorist active indicative 1st plural',
        'aorist active indicative 3rd plural',
        'aorist passive indicative 3rd singular',
      ]}
      items={[
        { q: <><Gk>ἀκούει</Gk> <span className="text-xs text-gray-500">(ἀκούω)</span></>, answer: 'present active indicative 3rd singular', note: <>&ldquo;he/she/it hears.&rdquo; The person is inside the ending — no separate pronoun needed.</> },
        { q: <><Gk>ἐλύσαμεν</Gk> <span className="text-xs text-gray-500">(λύω)</span></>, answer: 'aorist active indicative 1st plural', note: <>Augment <Gk>ἐ-</Gk> plus the <Gk>-σα-</Gk> marker: aorist. The <Gk>-μεν</Gk> is 1st plural.</> },
        { q: <><Gk>γράφεται</Gk> <span className="text-xs text-gray-500">(γράφω)</span></>, answer: 'present middle or passive indicative 3rd singular', note: <>Middle and passive share one form in the present. Name both — the context, not the ending, decides.</> },
        { q: <><Gk>ἦν</Gk> <span className="text-xs text-gray-500">(εἰμί)</span></>, answer: 'imperfect active indicative 3rd singular' },
        { q: <><Gk>πιστεύσομεν</Gk> <span className="text-xs text-gray-500">(πιστεύω)</span></>, answer: 'future active indicative 1st plural' },
        { q: <><Gk>ἐπίστευσαν</Gk> <span className="text-xs text-gray-500">(πιστεύω)</span></>, answer: 'aorist active indicative 3rd plural' },
      ]}
    />

    {/* ── 9 · Corpus ─────────────────────────────────────── */}
    <LiveExamples
      intro={<>Every one of these slots is tagged in the Greek New Testament. Search a slot and read real forms — this is the same parsing you will do all year.</>}
      links={[
        { label: 'Every dative singular noun in the NT — the slot you just learned', features: ['noun', 'dative', 'singular'] },
        { label: 'Every aorist active indicative — the narrative backbone of the Gospels', features: ['verb', 'aorist', 'active', 'indicative'] },
        { label: 'Every present participle — the hybrid with six slots', features: ['verb', 'present', 'participle'] },
        { label: 'Every infinitive — no person, no number', features: ['verb', 'infinitive'] },
        { label: 'Every vocative — direct address and prayer', features: ['noun', 'vocative'] },
      ]}
    />
  </>
)
