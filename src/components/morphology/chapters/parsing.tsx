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
  GuidedExample, DropdownPractice, LiveExamples,  Tr,
} from '../shared'

/** A parse written out, so the fixed word order is visible at a glance. */
function Slots({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-brand-800">{children}</span>
}

export const PARSING_CONTENT = (
  <>
    {/* ── 1 · What parsing is (Beginning only) ───────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="parsing.h.before-forms-learn">Before the forms: learn the answer</SectionHeading>
      <P id="parsing.p.can-now-read">
        You can now read Greek letters aloud. The next thing to learn is not a paradigm — it is what a
        right answer looks like. To <Term t="parse">parse</Term> a word is to say what job it is doing,
        and Greek says that job out loud in the word&rsquo;s ending. English mostly uses word order
        instead: &ldquo;the dog bit the man&rdquo; and &ldquo;the man bit the dog&rdquo; use identical
        words and mean opposite things. Greek can shuffle the words freely, because the endings, not the
        order, carry who did what.
      </P>
      <P id="parsing.p.every-greek-word">
        So every Greek word you meet asks the same short list of questions, and the answers always come
        in the same fixed order. Learn the order now and every later chapter is just filling in options
        you already have slots for.
      </P>
    </LevelOnly>

    {/* ── 2 · The master table ───────────────────────────── */}
    <SectionHeading n={1} id="parsing.h.four-patterns-which">Four patterns — which slots to fill</SectionHeading>
    <P id="parsing.p.there-only-four">
      There are only four parsing patterns in Greek. Find which one the word belongs to, then fill its
      slots left to right. The last slot is always the <strong>lexical form</strong> — the dictionary
      entry you would look the word up under.
    </P>

    <ColsTable id="parsing.ct1"
      title="The parse, by part of speech"
      headers={['Word type', 'Slots, in order', 'Worked example']}
      rows={[
        [
          <><Tr id="parsing.g.noun">Noun</Tr><br /><span className="text-xs text-gray-500"><Tr id="parsing.g.also-adjective-article">also adjective, article, pronoun</Tr></span></>,
          <Slots><Tr id="parsing.g.case-number-gender-lexical">case · number · gender · lexical form</Tr></Slots>,
          <><Tr id="parsing.g.accusative-plural-masculine"><Gk>ἀνθρώπους</Gk> = accusative plural masculine of <Gk>ἄνθρωπος</Gk></Tr></>,
        ],
        [
          <><Tr id="parsing.g.finite-verb">Finite verb</Tr><br /><span className="text-xs text-gray-500"><Tr id="parsing.g.verb-subject-built">a verb with a subject built in</Tr></span></>,
          <Slots><Tr id="parsing.g.tense-voice-mood-lexical">tense · voice · mood · person · number · lexical form</Tr></Slots>,
          <><Tr id="parsing.g.present-active-indicative-3sg"><Gk>λύει</Gk> = present active indicative 3rd singular of <Gk>λύω</Gk></Tr></>,
        ],
        [
          <><Tr id="parsing.g.participle-3">Participle</Tr><br /><span className="text-xs text-gray-500"><Tr id="parsing.g.verbal-adjective-both">verbal adjective — both sets</Tr></span></>,
          <Slots><Tr id="parsing.g.tense-voice-participle-full">tense · voice · participle · case · number · gender · lexical form</Tr></Slots>,
          <><Tr id="parsing.g.present-active-participle-nsm"><Gk>λύων</Gk> = present active participle nominative singular masculine of <Gk>λύω</Gk></Tr></>,
        ],
        [
          <><Tr id="parsing.g.infinitive">Infinitive</Tr><br /><span className="text-xs text-gray-500"><Tr id="parsing.g.verbal-noun-person">verbal noun — no person</Tr></span></>,
          <Slots><Tr id="parsing.g.tense-voice-infinitive-lexical">tense · voice · infinitive · lexical form</Tr></Slots>,
          <><Tr id="parsing.g.present-active-infinitive"><Gk>λύειν</Gk> = present active infinitive of <Gk>λύω</Gk></Tr></>,
        ],
        [
          <><Tr id="parsing.g.indeclinable">Indeclinable</Tr><br /><span className="text-xs text-gray-500"><Tr id="parsing.g.preposition-conjunction-adverb">preposition, conjunction, adverb, particle</Tr></span></>,
          <span className="text-sm text-gray-600"><Tr id="parsing.g.no-slots-name">no slots — name the part of speech</Tr></span>,
          <><Tr id="parsing.g.preposition-takes-dative"><Gk>ἐν</Gk> = preposition (takes the dative)</Tr></>,
        ],
      ]}
      note="The lexical form always comes last, introduced by “of” or “from”."
    />

    {/* ── 3 · Nouns ──────────────────────────────────────── */}
    <SectionHeading n={2} id="parsing.h.parsing-noun-case">Parsing a noun: case · number · gender</SectionHeading>
    <P id="parsing.p.every-noun-adjective">
      Every noun, adjective, article and pronoun gets exactly three answers, always in this order. Each
      column below is one slot; pick one option from each.
    </P>

    <TableAside
      beginning={
        <>
          <AsideLabel><Tr id="parsing.al.read-column-time">Read a column at a time</Tr></AsideLabel>
          <p><Tr id="parsing.as.work-left-right">
            Work left to right and say it as one phrase. Do not stop at the case — an unfinished parse
            (&ldquo;it&rsquo;s genitive&rdquo;) is not an answer.
          </Tr></p>
          <AsideLabel><Tr id="parsing.al.worked">Worked</Tr></AsideLabel>
          <Ex grc={<Gk>τῆς βασιλείας</Gk>} en={<Tr id="parsing.ex.genitive-singular-feminine">genitive singular feminine — “of the kingdom”</Tr>} />
          <Ex grc={<Gk>τοῖς λόγοις</Gk>} en={<Tr id="parsing.ex.dative-plural-masculine">dative plural masculine — “to/with the words”</Tr>} />
          <p><Tr id="parsing.as.notice-article-agrees">
            Notice the article agrees with its noun in all three slots. That makes the article the best
            parsing clue in the language: parse it, and you have parsed the noun.
          </Tr></p>
        </>
      }
      intermediate={
        <>
          <AsideLabel><Tr id="parsing.al.gender-grammatical-natural">Gender is grammatical, not natural</Tr></AsideLabel>
          <p><Tr id="parsing.as.ldquo-child-rdquo">
            <Gk>τὸ τέκνον</Gk> (&ldquo;the child&rdquo;) is neuter and <Gk>ἡ ἁμαρτία</Gk> (&ldquo;sin&rdquo;)
            is feminine; neither says anything about the referent. Gender is a property of the noun in the
            lexicon, so it is the one slot you cannot always read off the ending — you learn it with the word.
          </Tr></p>
          <AsideLabel><Tr id="parsing.al.why-vocative-listed">Why the vocative is listed last</Tr></AsideLabel>
          <p><Tr id="parsing.as.vocative-distinct-only">
            The vocative is distinct only in a few singular forms (<Gk>κύριε</Gk>, <Gk>πάτερ</Gk>,{' '}
            <Gk>ἀδελφέ</Gk>); elsewhere it borrows the nominative. Some paradigms therefore omit it, but it
            is a real case and the NT uses it constantly in address and prayer.
          </Tr></p>
        </>
      }
    >
      <ColsTable id="parsing.ct2"
        title="Noun slots — pick one from each column"
        headers={['1 · Case', '2 · Number', '3 · Gender']}
        rows={[
          [<><strong><Tr id="parsing.g.nominative">Nominative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.subject">— subject</Tr></span></>, <strong><Tr id="parsing.g.singular">Singular</Tr></strong>, <strong><Tr id="parsing.g.masculine">Masculine</Tr></strong>],
          [<><strong><Tr id="parsing.g.genitive">Genitive</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.of-possession-source">— “of”, possession, source</Tr></span></>, <strong><Tr id="parsing.g.plural">Plural</Tr></strong>, <strong><Tr id="parsing.g.feminine">Feminine</Tr></strong>],
          [<><strong><Tr id="parsing.g.dative">Dative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.for-with">— “to / for / with / in”</Tr></span></>, '', <strong><Tr id="parsing.g.neuter">Neuter</Tr></strong>],
          [<><strong><Tr id="parsing.g.accusative">Accusative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.direct-object">— direct object</Tr></span></>, '', ''],
          [<><strong><Tr id="parsing.g.vocative">Vocative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.direct-address">— direct address</Tr></span></>, '', ''],
        ]}
        note="Then add the lexical form: “accusative plural masculine of ἄνθρωπος.”"
      />
    </TableAside>

    {/* ── 4 · Verbs ──────────────────────────────────────── */}
    <SectionHeading n={3} id="parsing.h.parsing-finite-verb">Parsing a finite verb: tense · voice · mood · person · number</SectionHeading>
    <P id="parsing.p.finite-verb-one">
      A <strong>finite</strong> verb is one that carries its own subject — <Gk>λύει</Gk> already means
      &ldquo;he/she/it looses&rdquo; without a separate word for &ldquo;he.&rdquo; Finite verbs take five
      answers, always in this order.
    </P>

    <TableAside
      beginning={
        <>
          <AsideLabel><Tr id="parsing.al.five-one-breath">Five in one breath</Tr></AsideLabel>
          <p><Tr id="parsing.as.say-single-phrase">
            Say it as a single phrase and it stops feeling like five facts:
            &ldquo;present-active-indicative-third-singular.&rdquo; Students who pause between slots
            lose their place; students who chant it do not.
          </Tr></p>
          <AsideLabel><Tr id="parsing.al.worked-2">Worked</Tr></AsideLabel>
          <Ex grc={<Gk>ἀκούομεν</Gk>} en={<Tr id="parsing.ex.present-active-indicative">present active indicative 1st plural of ἀκούω — “we hear”</Tr>} />
          <Ex grc={<Gk>ἐπίστευσαν</Gk>} en={<Tr id="parsing.ex.aorist-active-indicative">aorist active indicative 3rd plural of πιστεύω — “they believed”</Tr>} />
          <p><Tr id="parsing.as.voice-asks-whether">
            <strong>Voice</strong> asks whether the subject acts (active), is acted on (passive), or acts
            with a stake in the outcome (middle). <strong>Mood</strong> asks how the speaker presents it:
            as fact, as possibility, as command, as wish.
          </Tr></p>
        </>
      }
      intermediate={
        <>
          <AsideLabel><Tr id="parsing.al.tense-aspect-first">Tense is aspect first, time second</Tr></AsideLabel>
          <p><Tr id="parsing.as.outside-indicative-tense">
            Outside the indicative, the tense slot carries <Term t="aspect">aspect</Term> and not time at
            all: an aorist subjunctive is not past. Keep naming the tense by its label — you are reporting
            the form, not committing to a translation.
          </Tr></p>
          <AsideLabel><Tr id="parsing.al.optative">The optative</Tr></AsideLabel>
          <p><Tr id="parsing.as.only-occurrences-most">
            Only ~68 NT occurrences, most of them Paul&rsquo;s <Gk>μὴ γένοιτο</Gk>. It stays in the table
            because it is a real slot option and Luke and Paul both use it deliberately.
          </Tr></p>
          <AsideLabel><Tr id="parsing.al.pluperfect">Pluperfect</Tr></AsideLabel>
          <p><Tr id="parsing.as.rare-never-augmented">
            Rare (~86 in the NT) and never augmented consistently; some grammars fold it into the perfect
            for beginners. Named here so you recognise it in an apparatus.
          </Tr></p>
        </>
      }
    >
      <ColsTable id="parsing.ct3"
        title="Finite-verb slots — pick one from each column"
        headers={['1 · Tense', '2 · Voice', '3 · Mood', '4 · Person', '5 · Number']}
        rows={[
          [<strong><Tr id="parsing.g.present">Present</Tr></strong>, <strong><Tr id="parsing.g.active">Active</Tr></strong>, <><strong><Tr id="parsing.g.indicative">Indicative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.states-fact">— states a fact</Tr></span></>, <><Tr id="parsing.g.person-1st">1st</Tr> <span className="text-xs text-gray-500"><Tr id="parsing.g.i-we">— I / we</Tr></span></>, <strong><Tr id="parsing.g.singular">Singular</Tr></strong>],
          [<strong><Tr id="parsing.g.imperfect">Imperfect</Tr></strong>, <strong><Tr id="parsing.g.middle">Middle</Tr></strong>, <><strong><Tr id="parsing.g.subjunctive">Subjunctive</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.may-might">— may / might</Tr></span></>, <><Tr id="parsing.g.person-2nd">2nd</Tr> <span className="text-xs text-gray-500"><Tr id="parsing.g.you">— you</Tr></span></>, <strong><Tr id="parsing.g.plural">Plural</Tr></strong>],
          [<strong><Tr id="parsing.g.future">Future</Tr></strong>, <strong><Tr id="parsing.g.passive">Passive</Tr></strong>, <><strong><Tr id="parsing.g.imperative">Imperative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.command">— command</Tr></span></>, <><Tr id="parsing.g.person-3rd">3rd</Tr> <span className="text-xs text-gray-500"><Tr id="parsing.g.he-she-it-they">— he/she/it, they</Tr></span></>, ''],
          [<strong><Tr id="parsing.g.aorist">Aorist</Tr></strong>, '', <><strong><Tr id="parsing.g.optative">Optative</Tr></strong> <span className="text-xs text-gray-500"><Tr id="parsing.g.wish-rare">— wish (rare)</Tr></span></>, '', ''],
          [<strong><Tr id="parsing.g.perfect">Perfect</Tr></strong>, '', '', '', ''],
          [<strong><Tr id="parsing.g.pluperfect">Pluperfect</Tr></strong>, '', '', '', ''],
        ]}
        note="Then add the lexical form: “present active indicative 3rd singular of λύω.”"
      />
    </TableAside>

    {/* ── 5 · Non-finite ─────────────────────────────────── */}
    <SectionHeading n={4} id="parsing.h.participles-infinitives-hybrids">Participles and infinitives — the hybrids</SectionHeading>
    <P id="parsing.p.these-two-non">
      These two are <strong>non-finite</strong>: they have no person, because they have no subject of
      their own. A participle is a verbal adjective, so after its verb slots it takes the whole noun set
      as well. An infinitive is a verbal noun and simply stops.
    </P>

    <ColsTable id="parsing.ct4"
      headers={['Form', 'Slots, in order', 'Worked example']}
      rows={[
        [
          <strong><Tr id="parsing.g.participle">Participle</Tr></strong>,
          <Slots><Tr id="parsing.g.tense-voice">tense · voice · </Tr><span className="text-gray-500"><Tr id="parsing.g.participle-2">participle</Tr></span><Tr id="parsing.g.case-number-gender"> · case · number · gender · lexical</Tr></Slots>,
          <><Tr id="parsing.g.ct4-r0-ex"><Gk>πιστεύων</Gk> = present active participle nominative singular masculine of <Gk>πιστεύω</Gk></Tr></>,
        ],
        [
          <strong><Tr id="parsing.g.participle">Participle</Tr></strong>,
          <span className="text-xs text-gray-500"><Tr id="parsing.g.same-six-slots">same six slots, a different form</Tr></span>,
          <><Tr id="parsing.g.ct4-r1-ex"><Gk>γραφέντα</Gk> = aorist passive participle accusative singular masculine of <Gk>γράφω</Gk></Tr></>,
        ],
        [
          <strong><Tr id="parsing.g.infinitive">Infinitive</Tr></strong>,
          <Slots><Tr id="parsing.g.tense-voice">tense · voice · </Tr><span className="text-gray-500"><Tr id="parsing.g.infinitive-lower">infinitive</Tr></span><Tr id="parsing.g.lexical-tail"> · lexical</Tr></Slots>,
          <><Tr id="parsing.g.ct4-r2-ex"><Gk>πιστεύειν</Gk> = present active infinitive of <Gk>πιστεύω</Gk></Tr></>,
        ],
        [
          <strong><Tr id="parsing.g.infinitive">Infinitive</Tr></strong>,
          <span className="text-xs text-gray-500"><Tr id="parsing.g.no-person-number">no person, no number, no gender</Tr></span>,
          <><Tr id="parsing.g.ct4-r3-ex"><Gk>γραφῆναι</Gk> = aorist passive infinitive of <Gk>γράφω</Gk></Tr></>,
        ],
      ]}
      note="“Participle” and “infinitive” occupy the mood slot in this scheme — say the word aloud where the mood would go."
    />

    <InfoBox title={<Tr id="parsing.ib.one-rule">The one rule to carry forward</Tr>}>
      <p><Tr id="parsing.as.parse-finished-only">
        A parse is finished only when you have named <em>every</em> slot for that word type and then the
        lexical form. &ldquo;Aorist&rdquo; is not a parse. &ldquo;Aorist active indicative 3rd singular of{' '}
        <span className="normal-case">λύω</span>&rdquo; is.
      </Tr></p>
    </InfoBox>

    {/* ── 6 · Intermediate: conventions and ambiguity ────── */}
    <LevelOnly level="intermediate">
      <SectionHeading n={5} id="parsing.h.conventions-will-meet">Conventions you will meet elsewhere</SectionHeading>
      <P id="parsing.p.case-number-gender">
        <strong>Case-number-gender vs gender-number-case.</strong> The order taught here — case first — is
        the standard of the introductory grammars (Mounce, Black, Croy) and of this course. Wallace&rsquo;s{' '}
        <em>Greek Grammar Beyond the Basics</em> and several parsing guides invert it to
        gender-number-case. Both name the same three slots; only the recitation order differs. Use
        case-number-gender in this course, and do not be thrown when a commentary writes
        &ldquo;masculine singular nominative.&rdquo;
      </P>
      <P id="parsing.p.mood-traditional-paradigms">
        <strong>Mood, or not.</strong> Traditional paradigms list the infinitive and participle alongside
        the four moods, which is convenient for parsing and wrong as grammar: neither is a mood, since
        neither makes an assertion. Say &ldquo;participle&rdquo; in the mood slot, but do not conclude
        that it is one.
      </P>
      <P id="parsing.p.ambiguity-normal-answer">
        <strong>Ambiguity is normal, and it is an answer.</strong> A great many forms are formally
        ambiguous, and the honest parse names the options rather than guessing:
      </P>
      <ColsTable id="parsing.ct5" tCols={[1, 2]}
        headers={['Form', 'Formally', 'How the context decides']}
        rows={[
          [<Gk>τέκνα</Gk>, 'nominative or accusative plural neuter', 'Neuter never distinguishes the two — find the verb and ask whether this is doing or being done to.'],
          [<Gk>γράφεται</Gk>, 'present middle or passive indicative 3rd singular', 'Middle and passive are identical outside the aorist and future. Sense, and any agent phrase (ὑπό + genitive), decides.'],
          [<Gk>τῆς φωνῆς</Gk>, 'genitive singular feminine', 'Unambiguous — but whether it is possession, source or objective genitive is syntax, not parsing.'],
          [<Gk>ἀνθρώπου</Gk>, 'genitive singular masculine', 'Compare ἀνθρώπους (accusative plural): one letter apart in sound, a different job entirely.'],
        ]}
        note="Naming both options is a complete parse. Silently picking one is not."
      />
      <P id="parsing.p.last-row-worth">
        That last row is worth dwelling on. Parsing tells you the <em>form</em>; it does not tell you the{' '}
        <em>function</em>. &ldquo;Genitive singular feminine&rdquo; is a parse; &ldquo;genitive of
        source&rdquo; is an exegetical claim that needs an argument. Keeping the two apart is most of what
        separates careful exegesis from proof-texting with a lexicon.
      </P>
    </LevelOnly>

    {/* ── 7 · Guided ─────────────────────────────────────── */}
    <GuidedExample
      title={<Tr id="parsing.ge.together-parse-every">Together: parse every word of John 1:1a</Tr>}
      sentence={<Gk>ἐν ἀρχῇ ἦν ὁ λόγος</Gk>}
      source={{ ref: 'John 1:1', label: <Tr id="parsing.src.john-1-1">John 1:1</Tr> }}
      translation="“In the beginning was the Word.”"
      steps={[
        {
          prompt: 'First sort the words: which pattern does each one need?',
          answer: <Tr id="parsing.ga.preposition-indeclinable-slots">
            <Gk>ἐν</Gk> is a preposition — indeclinable, no slots. <Gk>ἀρχῇ</Gk> and <Gk>λόγος</Gk> are
            nouns — three slots each. <Gk>ὁ</Gk> is the article — it parses like a noun.{' '}
            <Gk>ἦν</Gk> is the only finite verb — five slots.
          </Tr>,
        },
        {
          prompt: <Tr id="parsing.gp.parse">Parse <Gk>ἀρχῇ</Gk>.</Tr>,
          answer: <Tr id="parsing.ga.dative-singular-feminine">Dative singular feminine of <Gk>ἀρχή</Gk>. The <Gk>-ῃ</Gk> ending is dative singular, and <Gk>ἐν</Gk> always takes the dative — the preposition confirms the case.</Tr>,
        },
        {
          prompt: <Tr id="parsing.gp.parse-both-words">Parse <Gk>ὁ λόγος</Gk> — both words.</Tr>,
          answer: <Tr id="parsing.ga.nominative-singular-masculine"><Gk>ὁ</Gk> = nominative singular masculine article; <Gk>λόγος</Gk> = nominative singular masculine of <Gk>λόγος</Gk>. They agree in all three slots, which is how you know they belong together. Nominative means this is the subject.</Tr>,
        },
        {
          prompt: <Tr id="parsing.gp.parse-2">Parse <Gk>ἦν</Gk>.</Tr>,
          answer: <Tr id="parsing.ga.imperfect-active-indicative">Imperfect active indicative 3rd singular of <Gk>εἰμί</Gk>. All five slots named, then the lexical form.</Tr>,
        },
        {
          prompt: 'What has the parsing already told you about the sentence?',
          answer: <Tr id="parsing.ga.that-the-subject">That <Gk>ὁ λόγος</Gk> is the subject (nominative) and <Gk>ἐν ἀρχῇ</Gk> is a prepositional phrase of place/time (dative) — before you have translated a word. The imperfect <Gk>ἦν</Gk> describes continuing existence rather than a point of origin, which is exactly the theological weight the verse carries.</Tr>,
        },
      ]}
    />

    {/* ── 8 · Drills ─────────────────────────────────────── */}
    <DropdownPractice id="parsing.d1"
      title="Practice — parse the noun"
      intro={<Tr id="parsing.intro.give-all-three">Give all three slots in order: case, number, gender. (Lexical forms are given; you are naming the slots, not the paradigm.)</Tr>}
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
        { q: <><Gk>λόγῳ</Gk> <span className="text-xs text-gray-500">(λόγος, m.)</span></>, answer: 'dative singular masculine', note: <Tr id="parsing.n.0">The <Gk>-ῳ</Gk> ending is the mark of the dative singular in this declension.</Tr> },
        { q: <><Gk>ἀνθρώπου</Gk> <span className="text-xs text-gray-500">(ἄνθρωπος, m.)</span></>, answer: 'genitive singular masculine', note: <Tr id="parsing.n.1">&ldquo;of a man.&rdquo; Do not confuse with <Gk>ἀνθρώπους</Gk>, accusative plural.</Tr> },
        { q: <><Gk>τέκνα</Gk> <span className="text-xs text-gray-500">(τέκνον, n.)</span></>, answer: 'nominative or accusative plural neuter', note: <Tr id="parsing.n.2">Neuter never distinguishes nominative from accusative. Naming both is the complete answer.</Tr> },
        { q: <><Gk>ἀρχῆς</Gk> <span className="text-xs text-gray-500">(ἀρχή, f.)</span></>, answer: 'genitive singular feminine' },
        { q: <><Gk>λόγοις</Gk> <span className="text-xs text-gray-500">(λόγος, m.)</span></>, answer: 'dative plural masculine' },
        { q: <><Gk>ἀνθρώπους</Gk> <span className="text-xs text-gray-500">(ἄνθρωπος, m.)</span></>, answer: 'accusative plural masculine' },
      ]}
    />

    <DropdownPractice id="parsing.d2"
      title="Practice — parse the verb"
      intro={<Tr id="parsing.intro.give-all-five">Give all five slots in order: tense, voice, mood, person, number.</Tr>}
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
        { q: <><Gk>ἀκούει</Gk> <span className="text-xs text-gray-500">(ἀκούω)</span></>, answer: 'present active indicative 3rd singular', note: <Tr id="parsing.n.3">&ldquo;he/she/it hears.&rdquo; The person is inside the ending — no separate pronoun needed.</Tr> },
        { q: <><Gk>ἐλύσαμεν</Gk> <span className="text-xs text-gray-500">(λύω)</span></>, answer: 'aorist active indicative 1st plural', note: <Tr id="parsing.n.4">Augment <Gk>ἐ-</Gk> plus the <Gk>-σα-</Gk> marker: aorist. The <Gk>-μεν</Gk> is 1st plural.</Tr> },
        { q: <><Gk>γράφεται</Gk> <span className="text-xs text-gray-500">(γράφω)</span></>, answer: 'present middle or passive indicative 3rd singular', note: <Tr id="parsing.n.5">Middle and passive share one form in the present. Name both — the context, not the ending, decides.</Tr> },
        { q: <><Gk>ἦν</Gk> <span className="text-xs text-gray-500">(εἰμί)</span></>, answer: 'imperfect active indicative 3rd singular' },
        { q: <><Gk>πιστεύσομεν</Gk> <span className="text-xs text-gray-500">(πιστεύω)</span></>, answer: 'future active indicative 1st plural' },
        { q: <><Gk>ἐπίστευσαν</Gk> <span className="text-xs text-gray-500">(πιστεύω)</span></>, answer: 'aorist active indicative 3rd plural' },
      ]}
    />

    {/* ── 9 · Corpus ─────────────────────────────────────── */}
    <LiveExamples
      intro={<Tr id="parsing.intro.every-one-these">Every one of these slots is tagged in the Greek New Testament. Search a slot and read real forms — this is the same parsing you will do all year.</Tr>}
      links={[
        { label: <Tr id="parsing.le.dative-singular">Every dative singular noun in the NT — the slot you just learned</Tr>, features: ['noun', 'dative', 'singular'] },
        { label: <Tr id="parsing.le.aorist-indicative">Every aorist active indicative — the narrative backbone of the Gospels</Tr>, features: ['verb', 'aorist', 'active', 'indicative'] },
        { label: <Tr id="parsing.le.present-participle">Every present participle — the hybrid with six slots</Tr>, features: ['verb', 'present', 'participle'] },
        { label: <Tr id="parsing.le.infinitive">Every infinitive — no person, no number</Tr>, features: ['verb', 'infinitive'] },
        { label: <Tr id="parsing.le.vocative">Every vocative — direct address and prayer</Tr>, features: ['noun', 'vocative'] },
      ]}
    />
  </>
)
