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
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, GuidedExample, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,
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

    <DropdownPractice
      title="Practice — spot the case"
      intro={<>Which Greek case would the <strong>bold</strong> phrase be in? (English first — no endings needed yet.)</>}
      options={["Nominative", "Genitive", "Dative", "Accusative"]}
      items={[
        { q: <><strong>The apostle</strong> teaches the crowd.</>, answer: "Nominative", note: <>The doer of the action — the subject.</> },
        { q: <>God loves <strong>the world</strong>.</>, answer: "Accusative", note: <>Acted upon — the direct object.</> },
        { q: <>The word <strong>of the Lord</strong> endures.</>, answer: "Genitive", note: <>"of …" — possession/source.</> },
        { q: <>She speaks <strong>to the disciples</strong>.</>, answer: "Dative", note: <>"to/for …" — the ones spoken to.</> },
        { q: <>We heard the voice <strong>of an angel</strong>.</>, answer: "Genitive" },
        { q: <><strong>The children</strong> hear the word.</>, answer: "Nominative" },
        { q: <>He gives the bread <strong>to the crowd</strong>.</>, answer: "Dative" },
      ]}
    />

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

    <DropdownPractice
      title="Practice — parse the form"
      intro={<>Pick the case and number. Read each form as stem + ending before you choose.</>}
      options={["Nominative Singular", "Genitive Singular", "Dative Singular", "Accusative Singular", "Nominative Plural", "Genitive Plural", "Dative Plural", "Accusative Plural", "Nom/Acc Plural (neuter)"]}
      items={[
        { q: <span className="normal-case">λόγον</span>, answer: "Accusative Singular" },
        { q: <span className="normal-case">ψυχῆς</span>, answer: "Genitive Singular" },
        { q: <span className="normal-case">ἀνθρώπῳ</span>, answer: "Dative Singular" },
        { q: <span className="normal-case">ἀδελφοί</span>, answer: "Nominative Plural" },
        { q: <span className="normal-case">ἔργα</span>, answer: "Nom/Acc Plural (neuter)", note: <>Neuter nominative and accusative are always identical — the sentence must decide.</> },
        { q: <span className="normal-case">ἡμέραις</span>, answer: "Dative Plural" },
        { q: <span className="normal-case">κυρίων</span>, answer: "Genitive Plural" },
      ]}
    />

    <ClassSentences
      lesson="Lesson 3 · 1st & 2nd declension"
      items={[
        { words: [
          { w: "ἀκούετε", parsing: "Pres Act Ind 2 Pl — ἀκούω", gloss: "you hear" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λόγον", parsing: "Acc Sg Masc — λόγος", syntax: "Direct Object", gloss: "word" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of" },
          { w: "θεοῦ.", parsing: "Gen Sg Masc — θεός", syntax: "Genitive of Possession", gloss: "God" },
        ],
          translation: "You (pl.) hear the word of God.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "κύριος", parsing: "Nom Sg Masc — κύριος", syntax: "Subject", gloss: "Lord" },
          { w: "γινώσκει", parsing: "Pres Act Ind 3 Sg — γινώσκω", gloss: "knows" },
          { w: "τὰς", parsing: "Article — Acc Pl Fem", gloss: "the" },
          { w: "καρδίας.", parsing: "Acc Pl Fem — καρδία", syntax: "Direct Object", gloss: "hearts" },
        ],
          translation: "The Lord knows the hearts.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "υἱὸς", parsing: "Nom Sg Masc — υἱός", syntax: "Subject", gloss: "son" },
          { w: "λέγει", parsing: "Pres Act Ind 3 Sg — λέγω", gloss: "speaks" },
          { w: "τοῖς", parsing: "Article — Dat Pl Masc", gloss: "to the" },
          { w: "ἀδελφοῖς.", parsing: "Dat Pl Masc — ἀδελφός", syntax: "Dative of Indirect Object", gloss: "brothers" },
        ],
          translation: "The son speaks to the brothers.",
        },
        { words: [
          { w: "ἀκούομεν", parsing: "Pres Act Ind 1 Pl — ἀκούω", gloss: "we hear" },
          { w: "τὰς", parsing: "Article — Acc Pl Fem", gloss: "the" },
          { w: "φωνὰς", parsing: "Acc Pl Fem — φωνή", syntax: "Direct Object", gloss: "voices" },
          { w: "τῶν", parsing: "Article — Gen Pl Masc", gloss: "of the" },
          { w: "ἀγγέλων.", parsing: "Gen Pl Masc — ἄγγελος", syntax: "Genitive of Possession", gloss: "angels" },
        ],
          translation: "We hear the voices of the angels.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "ἄνθρωποι", parsing: "Nom Pl Masc — ἄνθρωπος", syntax: "Subject", gloss: "men" },
          { w: "πιστεύουσιν", parsing: "Pres Act Ind 3 Pl — πιστεύω", gloss: "believe" },
          { w: "τῷ", parsing: "Article — Dat Sg Neut", gloss: "the" },
          { w: "εὐαγγελίῳ.", parsing: "Dat Sg Neut — εὐαγγέλιον", gloss: "gospel" },
        ],
          translation: "The men believe the gospel.",
          note: "πιστεύω takes its object in the dative — \"believe (in) the gospel.\"",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "κόσμος", parsing: "Nom Sg Masc — κόσμος", syntax: "Subject", gloss: "world" },
          { w: "οὐ", parsing: "Negative particle", gloss: "not" },
          { w: "γινώσκει", parsing: "Pres Act Ind 3 Sg — γινώσκω", gloss: "knows" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "θεόν.", parsing: "Acc Sg Masc — θεός", syntax: "Direct Object", gloss: "God" },
        ],
          translation: "The world does not know God.",
          note: "Echoes John 1:10 — ὁ κόσμος αὐτὸν οὐκ ἔγνω.",
        },
      ]}
    />

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
    >
      <MorphTable flush title="Article & Noun Paradigm" headers={['','','Art.','Noun','Art.','Noun','Art.','Noun']}
        rows={[
          ['','','Masc.','λόγ|ος','Fem.','ἀρχ|ή','Neut.','ἔργ|ον'],
          ['Sg.','Nom.','|ὁ','λόγ|ος','|ἡ','ἀρχ|ή','|τό','ἔργ|ον'],
          ['','Gen.','|τοῦ','λόγ|ου','|τῆς','ἀρχ|ῆς','|τοῦ','ἔργ|ου'],
          ['','Dat.','|τῷ','λόγ|ῳ','|τῇ','ἀρχ|ῇ','|τῷ','ἔργ|ῳ'],
          ['','Acc.','|τόν','λόγ|ον','|τήν','ἀρχ|ήν','|τό','ἔργ|ον'],
          ['Pl.','Nom.','|οἱ','λόγ|οι','|αἱ','ἀρχ|αί','|τά','ἔργ|α'],
          ['','Gen.','|τῶν','λόγ|ων','|τῶν','ἀρχ|ῶν','|τῶν','ἔργ|ων'],
          ['','Dat.','|τοῖς','λόγ|οις','|ταῖς','ἀρχ|αῖς','|τοῖς','ἔργ|οις'],
          ['','Acc.','|τούς','λόγ|ους','|τάς','ἀρχ|άς','|τά','ἔργ|α'],
        ]}
      />
    </TableAside>

    <DropdownPractice
      title="Practice — parse the article"
      intro={<>The article is your answer key — so learn to parse it on sight. Pick the case and number.</>}
      options={["Nominative Singular", "Genitive Singular", "Dative Singular", "Accusative Singular", "Nominative Plural", "Genitive Plural", "Dative Plural", "Accusative Plural"]}
      items={[
        { q: <span className="normal-case">τοῦ</span>, answer: "Genitive Singular", note: <>Masculine or neuter — τοῦ serves both.</> },
        { q: <span className="normal-case">ταῖς</span>, answer: "Dative Plural", note: <>Feminine.</> },
        { q: <span className="normal-case">τόν</span>, answer: "Accusative Singular", note: <>Masculine.</> },
        { q: <span className="normal-case">ἡ</span>, answer: "Nominative Singular", note: <>Feminine.</> },
        { q: <span className="normal-case">τῶν</span>, answer: "Genitive Plural", note: <>All three genders — context decides.</> },
        { q: <span className="normal-case">τῷ</span>, answer: "Dative Singular", note: <>Masculine or neuter.</> },
        { q: <span className="normal-case">αἱ</span>, answer: "Nominative Plural", note: <>Feminine.</> },
      ]}
    />

    <ClassSentences
      lesson="Lesson 3 · The article"
      items={[
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "ἀδελφὸς", parsing: "Nom Sg Masc — ἀδελφός", syntax: "Subject", gloss: "brother" },
          { w: "ἔχει", parsing: "Pres Act Ind 3 Sg — ἔχω", gloss: "has" },
          { w: "τὸ", parsing: "Article — Acc Sg Neut", gloss: "the" },
          { w: "εὐαγγέλιον.", parsing: "Acc Sg Neut — εὐαγγέλιον", syntax: "Direct Object", gloss: "gospel" },
        ],
          translation: "The brother has the gospel.",
        },
        { words: [
          { w: "ἀκούομεν", parsing: "Pres Act Ind 1 Pl — ἀκούω", gloss: "we hear" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "φωνὴν", parsing: "Acc Sg Fem — φωνή", syntax: "Direct Object", gloss: "voice" },
          { w: "τῆς", parsing: "Article — Gen Sg Fem", gloss: "of the" },
          { w: "ἐκκλησίας.", parsing: "Gen Sg Fem — ἐκκλησία", syntax: "Genitive of Possession", gloss: "church" },
        ],
          translation: "We hear the voice of the church.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "μαθηταὶ", parsing: "Nom Pl Masc — μαθητής", syntax: "Subject", gloss: "disciples" },
          { w: "γράφουσιν", parsing: "Pres Act Ind 3 Pl — γράφω", gloss: "write" },
          { w: "τοὺς", parsing: "Article — Acc Pl Masc", gloss: "the" },
          { w: "λόγους.", parsing: "Acc Pl Masc — λόγος", syntax: "Direct Object", gloss: "words" },
        ],
          translation: "The disciples write the words.",
          note: "μαθητής looks 1st-declension feminine but the article οἱ proves it masculine — trust the article.",
        },
        { words: [
          { w: "γινώσκετε", parsing: "Pres Act Ind 2 Pl — γινώσκω", gloss: "you know" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "δόξαν", parsing: "Acc Sg Fem — δόξα", syntax: "Direct Object", gloss: "glory" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of the" },
          { w: "κυρίου.", parsing: "Gen Sg Masc — κύριος", syntax: "Genitive of Possession", gloss: "Lord" },
        ],
          translation: "You (pl.) know the glory of the Lord.",
        },
        { words: [
          { w: "λαμβάνετε", parsing: "Pres Act Ind 2 Pl — λαμβάνω", gloss: "you receive" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "ἄρτον", parsing: "Acc Sg Masc — ἄρτος", syntax: "Direct Object", gloss: "bread" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of the" },
          { w: "κυρίου.", parsing: "Gen Sg Masc — κύριος", syntax: "Genitive of Possession", gloss: "Lord" },
        ],
          translation: "You (pl.) receive the bread of the Lord.",
        },
        { words: [
          { w: "πιστεύομεν", parsing: "Pres Act Ind 1 Pl — πιστεύω", gloss: "we believe" },
          { w: "τῷ", parsing: "Article — Dat Sg Masc", gloss: "the" },
          { w: "λόγῳ", parsing: "Dat Sg Masc — λόγος", gloss: "word" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of the" },
          { w: "κυρίου.", parsing: "Gen Sg Masc — κύριος", syntax: "Genitive of Possession", gloss: "Lord" },
        ],
          translation: "We believe the word of the Lord.",
          note: "Again πιστεύω + dative. The two τοῦ/τῷ forms show why parsing the article matters.",
        },
      ]}
    />

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

    <DropdownPractice
      title="Practice — parse the 3rd-declension form"
      intro={<>Find the hidden stem first (drop ‑ος from the genitive), then pick the case and number.</>}
      options={["Nominative Singular", "Genitive Singular", "Dative Singular", "Accusative Singular", "Nominative Plural", "Genitive Plural", "Dative Plural", "Accusative Plural", "Nom/Acc Plural (neuter)"]}
      items={[
        { q: <span className="normal-case">γυναῖκες</span>, answer: "Nominative Plural" },
        { q: <span className="normal-case">ὀνόματα</span>, answer: "Nom/Acc Plural (neuter)" },
        { q: <span className="normal-case">πίστεως</span>, answer: "Genitive Singular", note: <>πίστις, πίστεως — the vowel-stem family with the ‑εως genitive.</> },
        { q: <span className="normal-case">βασιλεῖ</span>, answer: "Dative Singular" },
        { q: <span className="normal-case">ἐλπίδα</span>, answer: "Accusative Singular" },
        { q: <span className="normal-case">νύκτας</span>, answer: "Accusative Plural" },
      ]}
    />

    <ClassSentences
      lesson="Lesson 4 · 3rd declension"
      items={[
        { words: [
          { w: "ἡ", parsing: "Article — Nom Sg Fem", gloss: "the" },
          { w: "θυγάτηρ", parsing: "Nom Sg Fem — θυγάτηρ (3rd decl.)", syntax: "Subject", gloss: "daughter" },
          { w: "τῆς", parsing: "Article — Gen Sg Fem", gloss: "of the" },
          { w: "μητρὸς", parsing: "Gen Sg Fem — μήτηρ (3rd decl.)", syntax: "Genitive of Relationship", gloss: "mother" },
          { w: "ἔφυγεν.", parsing: "Aor Act Ind 3 Sg — φεύγω", gloss: "fled" },
        ],
          translation: "The mother's daughter fled.",
        },
        { words: [
          { w: "ἔχομεν", parsing: "Pres Act Ind 1 Pl — ἔχω", gloss: "we have" },
          { w: "πιστὸν", parsing: "Acc Sg Masc — πιστός (adjective)", gloss: "faithful" },
          { w: "πατέρα.", parsing: "Acc Sg Masc — πατήρ (3rd decl.)", syntax: "Direct Object", gloss: "father" },
        ],
          translation: "We have a faithful father.",
          note: "πιστόν (1st/2nd-declension adjective) agrees with πατέρα (3rd-declension noun) in case, number and gender — not in ending.",
        },
        { words: [
          { w: "διὰ", parsing: "Preposition + genitive", gloss: "through" },
          { w: "τῆς", parsing: "Article — Gen Sg Fem", gloss: "the" },
          { w: "χάριτος", parsing: "Gen Sg Fem — χάρις (3rd decl.)", gloss: "grace" },
          { w: "ἔχομεν", parsing: "Pres Act Ind 1 Pl — ἔχω", gloss: "we have" },
          { w: "ἐλπίδα", parsing: "Acc Sg Fem — ἐλπίς (3rd decl.)", syntax: "Direct Object", gloss: "hope" },
          { w: "ζωῆς.", parsing: "Gen Sg Fem — ζωή", syntax: "Genitive of Description/Quality", gloss: "of life" },
        ],
          translation: "Through grace we have hope of life.",
        },
        { words: [
          { w: "πλείονες", parsing: "Nom Pl Fem — πλείων (comparative)", gloss: "more" },
          { w: "γυναῖκες", parsing: "Nom Pl Fem — γυνή (3rd decl.)", syntax: "Subject", gloss: "women" },
          { w: "ἔρχονται.", parsing: "Pres Mid Ind 3 Pl — ἔρχομαι", gloss: "are coming" },
        ],
          translation: "More women are coming.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "πατέρες", parsing: "Nom Pl Masc — πατήρ (3rd decl.)", syntax: "Subject", gloss: "fathers" },
          { w: "ἔχουσιν", parsing: "Pres Act Ind 3 Pl — ἔχω", gloss: "have" },
          { w: "ἐλπίδα.", parsing: "Acc Sg Fem — ἐλπίς (3rd decl.)", syntax: "Direct Object", gloss: "hope" },
        ],
          translation: "The fathers have hope.",
        },
        { words: [
          { w: "ἡ", parsing: "Article — Nom Sg Fem", gloss: "the" },
          { w: "γυνὴ", parsing: "Nom Sg Fem — γυνή (3rd decl.)", syntax: "Subject", gloss: "woman" },
          { w: "λαμβάνει", parsing: "Pres Act Ind 3 Sg — λαμβάνω", gloss: "receives" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "χάριν.", parsing: "Acc Sg Fem — χάρις (3rd decl.)", syntax: "Direct Object", gloss: "grace" },
        ],
          translation: "The woman receives the grace.",
          note: "χάριν — an irregular accusative (not χάριτα). A handful of common nouns do this.",
        },
      ]}
    />

    {/* ── 4 · How to translate ───────────────────────────── */}
    <LevelOnly level="beginning">
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
    </LevelOnly>
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
          ['Sg.','Nom.','πᾶς','πᾶσ|α','πᾶν'],['','Gen.','παντ|ός','πάσ|ης','παντ|ός'],
          ['','Dat.','παντ|ί','πάσ|ῃ','παντ|ί'],['','Acc.','πάντ|α','πᾶσ|αν','πᾶν'],
          ['Pl.','Nom.','πάντ|ες','πᾶσ|αι','πάντ|α'],['','Gen.','πάντ|ων','πασ|ῶν','πάντ|ων'],
          ['','Dat.','πᾶσ|ιν','πάσ|αις','πᾶσ|ιν'],['','Acc.','πάντ|ας','πάσ|ας','πάντ|α'],
        ]}
      />
    </TableAside>

    <DropdownPractice
      title="Practice — which position?"
      intro={<>Attributive describes inside the article–noun unit; predicate makes a statement; substantival stands alone as a noun.</>}
      options={["Attributive — \"the good word\"", "Predicate — \"the word is good\"", "Substantival — \"the good (ones)\""]}
      items={[
        { q: <span className="normal-case">ὁ ἀγαθὸς λόγος</span>, answer: "Attributive — \"the good word\"" },
        { q: <span className="normal-case">ὁ λόγος ἀγαθός</span>, answer: "Predicate — \"the word is good\"", note: <>Outside the article–noun unit — it asserts, with no "is" written.</> },
        { q: <span className="normal-case">οἱ ἅγιοι</span>, answer: "Substantival — \"the good (ones)\"", note: <>Article + adjective, no noun: "the holy ones," "the saints."</> },
        { q: <span className="normal-case">ὁ λόγος ὁ καλός</span>, answer: "Attributive — \"the good word\"", note: <>The second attributive position — the repeated article keeps it inside the unit.</> },
        { q: <span className="normal-case">ἁγία ἡ ἐκκλησία</span>, answer: "Predicate — \"the word is good\"" },
        { q: <span className="normal-case">τὰ ἀγαθά</span>, answer: "Substantival — \"the good (ones)\"", note: <>"The good things."</> },
      ]}
    />

    <ClassSentences
      lesson="Lesson 3 · Adjectives"
      items={[
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "ἀγαθὸς", parsing: "Nom Sg Masc — ἀγαθός (attributive)", gloss: "good" },
          { w: "ἄνθρωπος", parsing: "Nom Sg Masc — ἄνθρωπος", syntax: "Subject", gloss: "man" },
          { w: "ἔχει", parsing: "Pres Act Ind 3 Sg — ἔχω", gloss: "has" },
          { w: "καλὴν", parsing: "Acc Sg Fem — καλός (attributive)", gloss: "good" },
          { w: "καρδίαν.", parsing: "Acc Sg Fem — καρδία", syntax: "Direct Object", gloss: "heart" },
        ],
          translation: "The good man has a good heart.",
        },
        { words: [
          { w: "πιστὸς", parsing: "Nom Sg Masc — πιστός (predicate)", syntax: "Predicate Nominative", gloss: "faithful" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "κύριος.", parsing: "Nom Sg Masc — κύριος", syntax: "Subject", gloss: "Lord" },
        ],
          translation: "The Lord is faithful.",
          note: "2 Thessalonians 3:3 — predicate position, with no εἰμί written.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "ἅγιοι", parsing: "Nom Pl Masc — ἅγιος (substantival)", syntax: "Subject", gloss: "saints" },
          { w: "ἀκούουσιν", parsing: "Pres Act Ind 3 Pl — ἀκούω", gloss: "hear" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λόγον.", parsing: "Acc Sg Masc — λόγος", syntax: "Direct Object", gloss: "word" },
        ],
          translation: "The saints hear the word.",
          note: "Substantival: article + adjective with no noun = \"the holy ones.\"",
        },
        { words: [
          { w: "νεκρὰ", parsing: "Nom Pl Neut — νεκρός (predicate)", syntax: "Predicate Nominative", gloss: "dead" },
          { w: "τὰ", parsing: "Article — Nom Pl Neut", gloss: "the" },
          { w: "ἔργα.", parsing: "Nom Pl Neut — ἔργον", syntax: "Subject", gloss: "works" },
        ],
          translation: "The works are dead.",
          note: "Echoes Hebrews — νεκρὰ ἔργα, \"dead works.\"",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "θεὸς", parsing: "Nom Sg Masc — θεός", syntax: "Subject", gloss: "God" },
          { w: "λέγει", parsing: "Pres Act Ind 3 Sg — λέγω", gloss: "speaks" },
          { w: "καλοὺς", parsing: "Acc Pl Masc — καλός (attributive)", gloss: "good" },
          { w: "λόγους", parsing: "Acc Pl Masc — λόγος", syntax: "Direct Object", gloss: "words" },
          { w: "τοῖς", parsing: "Article — Dat Pl Masc", gloss: "to the" },
          { w: "πιστοῖς.", parsing: "Dat Pl Masc — πιστός (substantival)", syntax: "Dative of Indirect Object", gloss: "faithful" },
        ],
          translation: "God speaks good words to the faithful.",
          note: "τοῖς πιστοῖς is substantival — \"to the faithful (ones).\"",
        },
        { words: [
          { w: "ἐσχάτη", parsing: "Nom Sg Fem — ἔσχατος (predicate)", syntax: "Predicate Nominative", gloss: "last" },
          { w: "ἐστὶν", parsing: "Pres Act Ind 3 Sg — εἰμί", gloss: "is" },
          { w: "ἡ", parsing: "Article — Nom Sg Fem", gloss: "the" },
          { w: "ὥρα.", parsing: "Nom Sg Fem — ὥρα", syntax: "Subject", gloss: "hour" },
        ],
          translation: "It is the last hour.",
          note: "1 John 2:18 — ἐσχάτη ὥρα ἐστίν.",
        },
      ]}
    />

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

    {/* ── 7 · Together (guided practice) ─────────────────── */}
    <LevelOnly level="beginning">
    <SectionHeading>Together: let's work through two</SectionHeading>
    <P>
      Before you fly solo, work these with me. Answer each prompt in your head (or out loud — this is a
      language), then tap <em>Show</em> to check yourself before the next prompt appears.
    </P>
    <GuidedExample
      sentence={<>τὸν λόγον τοῦ θεοῦ ἀκούει ὁ μαθητής.</>}
      steps={[
        { prompt: <>Step 1 — find the cases. What does <span className="normal-case">τόν</span> tell you about <span className="normal-case">λόγον</span>?</>,
          answer: <>Accusative singular masculine — so <span className="normal-case">τὸν λόγον</span> is the <strong>direct object</strong>, even though it comes first.</> },
        { prompt: <>What is <span className="normal-case">τοῦ θεοῦ</span>, and what does it attach to?</>,
          answer: <>Genitive — "of God." It hangs on the noun before it: "the word <em>of God</em>."</> },
        { prompt: <>Who is doing the hearing?</>,
          answer: <><span className="normal-case">ὁ μαθητής</span> — nominative (the article ὁ says so), therefore the <strong>subject</strong>. A 1st-declension <em>masculine</em> noun: the article outranks the ‑ης ending.</> },
        { prompt: <>Step 3 — assemble it in English order.</>,
          answer: <>Subject → verb → object → "of" phrase: <em>the disciple / hears / the word / of God</em>.</> },
      ]}
      translation={<>"The disciple hears the word of God." — and the fronted τὸν λόγον spotlights <em>what</em> is heard.</>}
    />
    <GuidedExample
      title="Together: now a real confession"
      sentence={<>σὺ εἶ ὁ υἱὸς τοῦ θεοῦ</>}
      source={{ ref: 'John 1:49', label: 'John 1:49 (Nathanael to Jesus)' }}
      steps={[
        { prompt: <>Find the subject. What are <span className="normal-case">σύ</span> and <span className="normal-case">εἶ</span>?</>,
          answer: <>The pronoun "you" + <span className="normal-case">εἰμί</span>'s 2nd singular: "you are." The spelled-out σύ adds emphasis — <em>you</em>.</> },
        { prompt: <>What case is <span className="normal-case">ὁ υἱός</span> — and why isn't it the object?</>,
          answer: <>Nominative! With the equative verb "to be" there is no object — <span className="normal-case">ὁ υἱός</span> is a <strong>predicate nominative</strong>, renaming the subject: "you are <em>the Son</em>."</> },
        { prompt: <>And <span className="normal-case">τοῦ θεοῦ</span>?</>,
          answer: <>Genitive again, attached to υἱός: "the Son <em>of God</em>."</> },
      ]}
      translation={<>"You are the Son of God" — Nathanael's confession, built entirely from this chapter's grammar.</>}
    />

    </LevelOnly>
    {/* ── 8 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning">
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice A — parse the form"
      intro={<>Give the case, number, and default translation. (Tap for the answer.)</>}
      items={[
        { q: <span className="normal-case">τοῦ κυρίου</span>,
          a: <>Genitive singular masculine — "of the Lord." The article <span className="normal-case">τοῦ</span> gives it away.</> },
        { q: <span className="normal-case">τοῖς ἀνθρώποις</span>,
          a: <>Dative plural masculine — "to / for the people."</> },
        { q: <span className="normal-case">τὴν ἡμέραν</span>,
          a: <>Accusative singular feminine — "the day" as a direct object.</> },
        { q: <span className="normal-case">τὸ εὐαγγέλιον</span>,
          a: <>Neuter singular — nominative <em>or</em> accusative ("the gospel"): the neuter's nom. and acc. are identical, so the sentence must decide.</> },
        { q: <span className="normal-case">τοῦ πατρός</span>,
          a: <>Genitive singular masculine (3rd declension) — "of the father." Note the <span className="normal-case">‑ος</span> ending here is <em>genitive</em>, not nominative: trust the article.</> },
      ]}
    />
    <Practice
      title="Practice B — translate the sentence"
      intro={<>Use the three-step method: cases first, then jobs, then English.
        Vocabulary: <span className="normal-case">γινώσκει</span> "knows" · <span className="normal-case">λέγει</span> "says/speaks" · <span className="normal-case">ἀκούουσιν</span> "they hear" · <span className="normal-case">λαμβάνει</span> "receives" · <span className="normal-case">μαθητής</span> "disciple."</>}
      items={[
        { q: <span className="normal-case">ὁ θεὸς γινώσκει τὸν ἄνθρωπον.</span>,
          a: <>"God knows the man." <span className="normal-case">ὁ θεός</span> nominative = subject; <span className="normal-case">τὸν ἄνθρωπον</span> accusative = object.</> },
        { q: <span className="normal-case">τὸν λόγον τοῦ κυρίου ἀκούουσιν οἱ μαθηταί.</span>,
          a: <>"The disciples hear the word of the Lord." The object came first — the cases, not the order, tell you <span className="normal-case">οἱ μαθηταί</span> (nominative) is the subject.</> },
        { q: <span className="normal-case">λέγει ὁ ἀπόστολος τοῖς ἀδελφοῖς.</span>,
          a: <>"The apostle speaks to the brothers." <span className="normal-case">τοῖς ἀδελφοῖς</span> dative = the ones spoken <em>to</em>.</> },
        { q: <span className="normal-case">τὸ εὐαγγέλιον λαμβάνει ὁ μαθητής.</span>,
          a: <>"The disciple receives the gospel." Trap: <span className="normal-case">τὸ εὐαγγέλιον</span> could be nom. or acc. (neuter!), but <span className="normal-case">ὁ μαθητής</span> is unambiguously nominative — so it must be the subject.</> },
        { q: <span className="normal-case">κύριός ἐστιν ὁ υἱὸς τοῦ ἀνθρώπου. (Mark 2:28)</span>,
          a: <>"The Son of Man is Lord." Both nouns are nominative (equative <span className="normal-case">ἐστίν</span>) — the articular <span className="normal-case">ὁ υἱός</span> is the subject, anarthrous <span className="normal-case">κύριος</span> the predicate. Real verse, this chapter's grammar.</> },
      ]}
    />

    {/* ── 9 · See it in the NT ───────────────────────────── */}

    </LevelOnly>
    <HomeworkAssignments chapter="nouns" />

    <LiveExamples
      intro={<>Don't take the textbook's word for it — these links search the tagged Greek New Testament itself.</>}
      links={[
        { label: <>Every form of <span className="normal-case">λόγος</span> in the NT — watch the endings change with the job</>, lemma: 'λόγος', features: ['noun'] },
        { label: 'Genitive nouns — hundreds of real "of …" phrases', features: ['noun', 'genitive'] },
        { label: 'Dative plural nouns — spot the ‑οις / ‑αις / ‑σι endings', features: ['noun', 'dative', 'plural'] },
        { label: '3rd-declension in action: every neuter noun', features: ['noun', 'neuter'] },
      ]}
    />
    {/* ── The article in full (Intermediate — from the Article session of the Int. course) ── */}
    <LevelOnly level="intermediate">
      <SectionHeading>The article — beyond "the"</SectionHeading>
      <P>The Intermediate course gives the article its own session:</P>
      <MorphTable
        headers={['Use', 'What it does', 'Example']} firstColIsData striped
        rows={[
          ['As pronoun', 'ὁ δε = "but he"', 'ὁ δε ἐξελθων ἠρξατο κηρυσσειν (Mark 1:45)'],
          ['Individualizing', 'points back to something already mentioned', 'τον ἀνθρωπον — THAT man, just discussed'],
          ['Generic', 'the class, not an individual', 'ἀξιος ὁ ἐργατης του μισθου αὐτου (Luke 10:7)'],
          ['Substantiver', 'turns anything into a noun', 'οἱ ἐκ πιστεως — those who are of faith (Gal 3:7)'],
          ['Function marker', 'flags case or ties an attributive on', 'ἡ ἐντολη ἡ ἐμη (John 15:12)'],
          ['Absence of article', 'often stresses quality, not indefiniteness', 'θεος ἠν ὁ λογος — the Word was (in nature) God (John 1:1)'],
          ['Colwell’s rule', 'a definite predicate before the verb usually drops its article', 'θεος ἠν ὁ λογος again — anarthrous, still definite'],
          ['Granville Sharp', 'one article + two singular nouns joined by και = one person', 'του θεου και σωτηρος ἡμων Ἰησου Χριστου (Tit 2:13)'],
        ]}
        note="Colwell and Granville Sharp are rules of thumb about when the article may be dropped without a change of meaning — both matter in key christological texts."
      />
    </LevelOnly>


    {/* ── 10 · Going deeper (Intermediate only) ──────────── */}
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
