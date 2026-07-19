/* ─────────────────────────────────────────────
   Chapter: Nouns & Adjectives  (pilot chapter)

   The textbook-style chapter template:
     1. English first        (Beginning only — grammar from zero)
     2. The four cases
     3. The forms            (paradigm tables + level-aware asides)
     4. How to translate     (the three-step method, worked examples)
     5. Adjectives agree
     6. Watch out            (confusables)
     7. Try it               (practice with tap-to-reveal answers)
     8. See it in the NT     (live corpus links)
     9. Going deeper         (Intermediate only)
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const NOUNS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: how do you know who did what?</SectionHeading>
      <P>
        Read this sentence: <em>"The dog bit the man."</em> Now this one: <em>"The man bit the dog."</em>
        Same four words — completely different (and more newsworthy) event. How did you know who did the
        biting? <strong>Word order.</strong> In English, whatever comes before the verb is the one acting,
        and whatever comes after is the one acted on. That is the rule you have been using your whole life
        without ever being taught it.
      </P>
      <P>
        Greek plays the game differently. Instead of fixing the word order, Greek changes the <Term t="ending">endings</Term> of
        its words. The form of the word itself tells you its job — so the words can come in almost any order,
        and the sentence still means the same thing. This system of "jobs shown by endings" is
        called <Term t="case">case</Term>.
      </P>
      <P>
        English actually kept a small souvenir of this system — in its <Term t="pronoun">pronouns</Term>:
      </P>
      <TableAside
        beginning={<>
          <p>One word, three forms, three jobs. You already switch between these without thinking —
          you would never say <em>"Him saw I."</em></p>
          <p>Greek does exactly this, but to <strong>every</strong> noun, using endings. That is the whole
          idea of this chapter.</p>
        </>}
      >
        <MorphTable flush title="The case system English kept" headers={['', 'Subject', 'Possessor', 'Object']} firstColIsData
          rows={[
            ['Pronoun', 'he', 'his', 'him'],
            ['Question word', 'who', 'whose', 'whom'],
          ]}
          note="“He saw him” — the forms alone tell you who saw whom."
        />
      </TableAside>
      <P>
        Three more words you need, all with everyday meanings. A <Term t="noun">noun</Term> names a person,
        place, thing, or idea. <Term t="gender">Gender</Term> is the grammatical class a Greek noun belongs to —
        masculine, feminine, or neuter. Don't read biology into it: the Greek word for <em>child</em> (τέκνον)
        is neuter, and <em>desert</em> (ἔρημος) is feminine. It is simply each word's family membership, learned
        with the word. And <Term t="number">number</Term> is just singular versus plural — "cat" versus "cats."
      </P>
      <P>
        Finally, nouns come in ending-families called <Term t="declension">declensions</Term>. English has
        ending-families for plurals: most nouns add <em>-s</em> (cat→cats), a few add <em>-en</em> (ox→oxen),
        a few change their vowel (mouse→mice). Greek has three main families — the 1st, 2nd, and 3rd
        declensions — and once you know a noun's family, you know its whole set of endings.
      </P>
    </LevelOnly>

    {/* ── 2 · The four cases ─────────────────────────────── */}
    <SectionHeading>The four cases and their jobs</SectionHeading>
    <P>
      Greek nouns have four main cases (plus a fifth, the <Term t="vocative">vocative</Term>, for calling
      someone — "O Lord!" — which usually looks like the nominative). Each case has a default English
      translation that will carry you a long way:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Anchor sentence</AsideLabel>
        <p>"<strong>The apostle</strong> [nom.] speaks <strong>the word</strong> [acc.] <strong>of God</strong> [gen.] <strong>to the crowd</strong> [dat.]."</p>
        <p>One English sentence holds all four jobs. Keep it in your head and the cases stop being abstract.</p>
      </>}
      intermediate={<>
        <p>These are the <em>default</em> glosses. Each case has a family of further uses — the full
        catalogue is in the "Going deeper" card above, and the highlights are in the last section below.</p>
      </>}
    >
      <MorphTable flush headers={['Case', 'Job', 'Default translation']} firstColIsData
        rows={[
          ['Nominative', 'subject — the doer', '(no extra word)'],
          ['Genitive', 'possession, source, description', 'of …'],
          ['Dative', 'the person to/for whom; with/by', 'to …, for …'],
          ['Accusative', 'direct object — acted upon', '(no extra word)'],
        ]}
      />
    </TableAside>

    {/* ── 3 · The forms ──────────────────────────────────── */}
    <SectionHeading>The forms: 1st &amp; 2nd declension</SectionHeading>
    <P>
      Here is the first ending-family. Masculine and neuter nouns mostly use the 2nd-declension columns;
      feminine nouns mostly use the 1st (the <Gk>‒η</Gk> column). Read any form as <Term t="stem">stem</Term> +
      ending: <Gk>λόγ‑ος, λόγ‑ου, λόγ‑ῳ, λόγ‑ον</Gk>.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="ὁ λόγος" en="the word (subject)" />
        <Ex grc="τοῦ λόγου" en="of the word" />
        <Ex grc="τῷ λόγῳ" en="to / for the word" />
        <Ex grc="τὸν λόγον" en="the word (direct object)" />
        <p>Two shortcuts: the neuter copies the masculine except in the nom./acc., and the neuter's
        nominative and accusative are always identical.</p>
      </>}
      intermediate={<>
        <p>One paradigm covers nouns <em>and</em> adjectives. Endings repeat across genders
        (<Gk>‒ων</Gk> is the genitive plural everywhere), so let the article settle an ambiguous form.</p>
        <AsideLabel>In a sentence</AsideLabel>
        <Ex grc="ὁ ἀπόστολος λέγει τὸν λόγον τοῦ θεοῦ" en="the apostle speaks the word of God" />
      </>}
    >
      <MorphTable flush title="1st & 2nd Declension Endings" headers={['','Masc.','Neut.','Fem.','Sense']} dividerRows={[0,5]}
        rows={[
          ['Singular','','','',''],
          ['Nom.','‒ος','‒ον','‒η','subject'],['Gen.','‒ου →','‒ου','‒ης','of'],
          ['Dat.','‒ῳ →','‒ῳ','‒ῃ','to / for'],['Acc.','‒ον','= Nom.','‒ην','object'],
          ['Plural','','','',''],
          ['Nom.','‒οι','‒α','‒αι','subject'],['Gen.','‒ων →','‒ων','‒ων','of'],
          ['Dat.','‒οις →','‒οις','‒αις','to / for'],['Acc.','‒ους','= Nom.','‒ας','object'],
        ]}
        note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>

    <SectionHeading>Your best friend: the article</SectionHeading>
    <P>
      Greek's word for "the" — the <Term t="article">article</Term> — changes form to match its noun
      in gender, case, and number. That makes it a free answer key: even when a noun's ending is ambiguous,
      the article beside it usually is not. When in doubt, <em>parse the article, not the noun</em>.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>The article gives you the parse</AsideLabel>
        <Ex grc="ὁ λόγος" en="the word (ὁ says: masc. nominative)" />
        <Ex grc="ἡ ἀρχή" en="the beginning (fem.)" />
        <Ex grc="τὸ ἔργον" en="the work (neut.)" />
        <p>Memorize the article's forms early — it is the highest-value memory work in all of Greek.</p>
      </>}
      intermediate={<>
        <p>The article can turn almost anything into a noun (substantivize): <Gk>τὸ ἀγαθόν</Gk> "the good thing,"
        <Gk> οἱ πιστεύοντες</Gk> "the believers."</p>
        <p>Greek has no indefinite article — an anarthrous noun is often "a(n) …," but word order and context
        can still make it definite (Colwell's rule).</p>
      </>}
    >
      <MorphTable flush title="Article & Noun Paradigm" headers={['','','Art.','Noun','Art.','Noun','Art.','Noun']}
        rows={[
          ['','','Masc.','λόγος','Fem.','ἀρχή','Neut.','ἔργον'],
          ['Sg.','Nom.','ὁ','λόγος','ἡ','ἀρχή','τό','ἔργον'],
          ['','Gen.','τοῦ','λόγου','τῆς','ἀρχῆς','τοῦ','ἔργου'],
          ['','Dat.','τῷ','λόγῳ','τῇ','ἀρχῇ','τῷ','ἔργῳ'],
          ['','Acc.','τόν','λόγον','τήν','ἀρχήν','τό','ἔργον'],
          ['Pl.','Nom.','οἱ','λόγοι','αἱ','ἀρχαί','τά','ἔργα'],
          ['','Gen.','τῶν','λόγων','τῶν','ἀρχῶν','τῶν','ἔργων'],
          ['','Dat.','τοῖς','λόγοις','ταῖς','ἀρχαῖς','τοῖς','ἔργοις'],
          ['','Acc.','τούς','λόγους','τάς','ἀρχάς','τά','ἔργα'],
        ]}
      />
    </TableAside>

    <SectionHeading>The third family: 3rd declension</SectionHeading>
    <P>
      The 3rd declension looks irregular but is actually a very consistent family — the trick is
      that its true <Term t="stem">stem</Term> hides. Find it by dropping <Gk>‒ος</Gk> from
      the <em>genitive</em>: <Gk>σάρξ, σαρκός</Gk> → stem <Gk>σαρκ‑</Gk>. Then the endings below attach cleanly.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="ἡ σάρξ" en="the flesh (subject)" />
        <Ex grc="τῆς σαρκός" en="of the flesh" />
        <Ex grc="τῇ σαρκί" en="to / for the flesh" />
        <Ex grc="τὴν σάρκα" en="the flesh (object)" />
        <p>Vocabulary tip: always learn a 3rd-declension noun <em>with its genitive</em> — that is where
        the stem lives.</p>
      </>}
      intermediate={<>
        <p>The nominative disguises the stem because stem consonants collide with <Gk>‒ς</Gk>
        (<Gk>σαρκ + ς → σάρξ</Gk>; dentals drop: <Gk>ἐλπιδ + ς → ἐλπίς</Gk>).</p>
        <p>The dative plural <Gk>‒σι(ν)</Gk> triggers the same consonant + <Gk>σ</Gk> changes as the future
        and aorist: <Gk>σαρκ + σί → σαρξί</Gk>.</p>
      </>}
    >
      <MorphTable flush title="3rd Declension Endings" headers={['','Masc./Fem.','Neuter','Sense']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','‒ς  or  ‒(none)','‒(none)','subject'],['Gen.','‒ος →','‒ος','of'],
          ['Dat.','‒ι →','‒ι','to / for'],['Acc.','‒α  or  ‒ν','= Nom.','object'],
          ['Plural','','',''],
          ['Nom.','‒ες','‒α','subject'],['Gen.','‒ων →','‒ων','of'],['Dat.','‒σι →','‒σι','to / for'],['Acc.','‒ας','= Nom.','object'],
        ]}
        note="→ neuter takes the same ending as Masc./Fem.  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>

    {/* ── 4 · How to translate ───────────────────────────── */}
    <SectionHeading>How to translate: the three-step method</SectionHeading>
    <P>
      Never translate a Greek sentence word-by-word from left to right — that is the English habit, and
      Greek word order will betray you. Instead, every time:
    </P>
    <InfoBox>
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
        <li><strong>Find the case of every noun</strong> — read the articles and endings.</li>
        <li><strong>Ask why each word has that case</strong> — who is the subject? the object? what is the "of" phrase attached to?</li>
        <li><strong>Then build the English sentence</strong> — in English order, with "of / to / for" supplied.</li>
      </ol>
    </InfoBox>
    <P>Watch it work on a scrambled sentence:</P>
    <TableAside
      beginning={<>
        <AsideLabel>Step by step</AsideLabel>
        <p><strong>1.</strong> <Gk>τὸν ἄνθρωπον</Gk> — τόν says accusative: the object. <Gk>ὁ θεός</Gk> — ὁ says
        nominative: the subject.</p>
        <p><strong>2.</strong> So God is doing the seeing, and the man is being seen — even though "the man"
        came first.</p>
        <p><strong>3.</strong> English order: <em>"God sees the man."</em></p>
        <p>Greek fronted <Gk>τὸν ἄνθρωπον</Gk> for emphasis — something like "it's the <em>man</em> God sees."
        The cases carry the grammar; the order carries the spotlight.</p>
      </>}
      intermediate={<>
        <p>Word order in Greek is rhetorical, not grammatical: fronting marks emphasis or contrast. When you
        see an object first, ask what the author is spotlighting — a genuinely exegetical observation,
        available only to someone reading the Greek.</p>
      </>}
    >
      <MorphTable flush title={gt("Worked example — τὸν ἄνθρωπον βλέπει ὁ θεός")} headers={['Word','Case','Job']} firstColIsData
        rows={[
          ['τὸν ἄνθρωπον', 'accusative', 'direct object'],
          ['βλέπει', '— (verb)', '“sees”'],
          ['ὁ θεός', 'nominative', 'subject'],
        ]}
        note="Translation: “God sees the man.” — not “the man sees God”!"
      />
    </TableAside>

    {/* ── 5 · Adjectives agree ───────────────────────────── */}
    <SectionHeading>Adjectives agree with their nouns</SectionHeading>
    <P>
      An <Term t="adjective">adjective</Term> describes a noun — and in Greek it must <strong>agree</strong> with
      that noun in gender, case, and number, using the very endings you just learned. <Gk>καλὸς λόγος</Gk> "a good
      word"; change the noun's case and the adjective changes with it: <Gk>τοῦ καλοῦ λόγου</Gk> "of the good word."
    </P>
    <P>
      Position matters. Inside the article–noun unit (<Gk>ὁ καλὸς λόγος</Gk>, article–adjective–noun) the
      adjective is <strong>attributive</strong>: "the good word." Outside it (<Gk>καλὸς ὁ λόγος</Gk>) it
      is <strong>predicate</strong>: it makes a statement — "the word <em>is</em> good," with no "is" written.
    </P>
    <LevelOnly level="intermediate">
      <P>
        The delete-test settles hard cases: remove the adjective, and if the sentence still works it was
        attributive ("the [good] word"); if the sentence collapses, the adjective <em>was</em> the point —
        predicate.
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <AsideLabel>Meaning</AsideLabel>
        <p><Gk>πᾶς, πᾶσα, πᾶν</Gk> = "all, every, whole" — the most common adjective in the NT, and a preview
        of things to come: its masculine/neuter run on the 3rd declension while its feminine runs on the 1st.</p>
        <Ex grc="πᾶς ἄνθρωπος" en="every person" />
        <Ex grc="πάντες" en="everyone" />
      </>}
      intermediate={<>
        <p>The same 3rd + 1st declension split reappears in every active participle
        (<Gk>λύων, λύουσα, λῦον</Gk>) — master <Gk>πᾶς</Gk> now and participles will feel familiar later.</p>
        <p>Sense shifts with the article: <Gk>πᾶσα πόλις</Gk> "every city," <Gk>πᾶσα ἡ πόλις</Gk> "the whole city."</p>
      </>}
    >
      <MorphTable flush title={gt("πᾶς, πᾶσα, πᾶν  (all, every)")} headers={['','','Masc. (3rd)','Fem. (1st)','Neut. (3rd)']}
        rows={[
          ['Sg.','Nom.','πᾶς','πᾶσα','πᾶν'],['','Gen.','παντός','πάσης','παντός'],
          ['','Dat.','παντί','πάσῃ','παντί'],['','Acc.','πάντα','πᾶσαν','πᾶν'],
          ['Pl.','Nom.','πάντες','πᾶσαι','πάντα'],['','Gen.','πάντων','πασῶν','πάντων'],
          ['','Dat.','πᾶσιν','πάσαις','πᾶσιν'],['','Acc.','πάντας','πάσας','πάντα'],
        ]}
      />
    </TableAside>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>‒ων</Gk> is the genitive plural of <em>everything</em> — every gender, every declension. Use the article (<Gk>τῶν</Gk>) and context to identify the noun.</li>
        <li><Gk>‒ος</Gk> is double-booked: 2nd-declension nominative singular (<Gk>λόγος</Gk>) <em>and</em> 3rd-declension genitive singular (<Gk>σαρκός</Gk>). The article settles it: <Gk>ὁ</Gk> vs. <Gk>τῆς</Gk>.</li>
        <li>Neuter nominative and accusative are always identical (<Gk>τὸ ἔργον, τὰ ἔργα</Gk>) — decide subject vs. object from the rest of the sentence.</li>
        <li>Breathing marks distinguish real words: <Gk>ἐν</Gk> "in" vs. <Gk>ἕν</Gk> "one"; <Gk>εἰς</Gk> "into" vs. <Gk>εἷς</Gk> "one."</li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice A — parse the form"
      intro={<>Give the case, number, and default translation. (Tap for the answer.)</>}
      items={[
        { q: <span className="normal-case">τοῦ κυρίου</span>,
          a: <>Genitive singular masculine — "of the Lord." The article <span className="normal-case">τοῦ</span> gives it away.</> },
        { q: <span className="normal-case">τοῖς ἀνθρώποις</span>,
          a: <>Dative plural masculine — "to / for the people."</> },
        { q: <span className="normal-case">τὴν ἀρχήν</span>,
          a: <>Accusative singular feminine — "the beginning" as a direct object.</> },
        { q: <span className="normal-case">τὰ ἔργα</span>,
          a: <>Neuter plural — nominative <em>or</em> accusative ("the works"): the neuter's nom. and acc. are identical, so the sentence must decide.</> },
        { q: <span className="normal-case">τῆς σαρκός</span>,
          a: <>Genitive singular feminine (3rd declension) — "of the flesh." Note the <span className="normal-case">‑ος</span> ending here is <em>genitive</em>, not nominative: trust the article.</> },
      ]}
    />
    <Practice
      title="Practice B — translate the sentence"
      intro={<>Use the three-step method: cases first, then jobs, then English.
        Vocabulary: <span className="normal-case">βλέπει</span> "sees" · <span className="normal-case">λέγει</span> "says/speaks" · <span className="normal-case">ἀκούουσιν</span> "they hear" · <span className="normal-case">δοῦλος</span> "servant" · <span className="normal-case">τέκνον</span> "child."</>}
      items={[
        { q: <span className="normal-case">ὁ θεὸς βλέπει τὸν ἄνθρωπον.</span>,
          a: <>"God sees the man." <span className="normal-case">ὁ θεός</span> nominative = subject; <span className="normal-case">τὸν ἄνθρωπον</span> accusative = object.</> },
        { q: <span className="normal-case">τὸν λόγον τοῦ κυρίου ἀκούουσιν οἱ δοῦλοι.</span>,
          a: <>"The servants hear the word of the Lord." The object came first — the cases, not the order, tell you <span className="normal-case">οἱ δοῦλοι</span> (nominative) is the subject.</> },
        { q: <span className="normal-case">λέγει ὁ ἀπόστολος τοῖς ἀδελφοῖς.</span>,
          a: <>"The apostle speaks to the brothers." <span className="normal-case">τοῖς ἀδελφοῖς</span> dative = the ones spoken <em>to</em>.</> },
        { q: <span className="normal-case">τὰ τέκνα βλέπει ὁ κύριος.</span>,
          a: <>"The Lord sees the children." Trap: <span className="normal-case">τὰ τέκνα</span> could be nom. or acc. (neuter!), but <span className="normal-case">ὁ κύριος</span> is unambiguously nominative — so it must be the subject.</> },
        { q: <span className="normal-case">ἡ ἀρχὴ τοῦ εὐαγγελίου (cf. Mark 1:1)</span>,
          a: <>"The beginning of the gospel" — a nominative + genitive phrase, exactly how Mark's Gospel opens.</> },
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>Don't take the textbook's word for it — these links search the tagged Greek New Testament itself.</>}
      links={[
        { label: <>Every form of <span className="normal-case">λόγος</span> in the NT — watch the endings change with the job</>, lemma: 'λόγος', features: ['noun'] },
        { label: 'Genitive nouns — hundreds of real "of …" phrases', features: ['noun', 'genitive'] },
        { label: 'Dative plural nouns — spot the ‑οις / ‑αις / ‑σι endings', features: ['noun', 'dative', 'plural'] },
        { label: '3rd-declension in action: every neuter noun', features: ['noun', 'neuter'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: when the default translation isn't enough</SectionHeading>
      <P>
        The glosses "of" and "to/for" are training wheels. Interpretation begins when you ask <em>which kind</em> of
        genitive or dative you are looking at — the full catalogue is in the card at the top of this page. Three
        highlights show why it matters:
      </P>
      <P>
        <strong>The genitive spectrum.</strong> "The love of God" (<Gk>ἡ ἀγάπη τοῦ θεοῦ</Gk>) is genuinely
        ambiguous: God's love for us (<em>subjective</em> genitive — God does the loving) or our love for God
        (<em>objective</em> — God receives it)? Grammar alone cannot decide; context and the author's usage must.
        The most debated NT example is <Gk>πίστις Χριστοῦ</Gk> — "faith <em>in</em> Christ" (objective) or "the
        faithfulness <em>of</em> Christ" (subjective)? Entire monographs hang on that genitive (Rom 3:22; Gal 2:16).
      </P>
      <P>
        <strong>Subject vs. predicate nominative.</strong> With an equative verb both nouns are nominative —
        so which is the subject of <Gk>θεὸς ἦν ὁ λόγος</Gk> (John 1:1)? The rule: pronouns outrank proper names
        and articular nouns; here <Gk>ὁ λόγος</Gk> has the article, so it is the subject — "the Word was God,"
        never "God was the Word." The predicate usually names the <em>class</em> the subject belongs to, the way
        "God is love" does not mean "love is God."
      </P>
      <P>
        <strong>The time cases.</strong> "I worked at night" is ambiguous in English; Greek's case choice is not:
        genitive <Gk>νυκτός</Gk> = "during the night" (kind of time), dative <Gk>νυκτί</Gk> = "at a point in the
        night," accusative <Gk>νύκτα</Gk> = "all night long" (extent). Nicodemus came <Gk>νυκτός</Gk> (John 3:2) —
        under cover of night, not at one instant.
      </P>
    </LevelOnly>
  </>
)
