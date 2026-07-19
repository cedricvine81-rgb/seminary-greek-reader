/* ─────────────────────────────────────────────
   Chapter: Participles

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const PARTICIPLES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: verbs wearing adjective clothes</SectionHeading>
      <P>
        "The <em>running</em> water." "A <em>broken</em> cup." "The man <em>sitting</em> by the door."
        Each italicised word is built from a verb (run, break, sit) but is doing an adjective's job —
        describing a noun. English calls these <strong>participles</strong>, and it makes them with
        <em> -ing</em> and <em>-ed/-en</em>. You use them constantly: "<em>Having finished</em> breakfast,
        she left." "<em>While walking</em> home, I saw him."
      </P>
      <P>
        A participle is therefore a hybrid — half verb, half <Term t="adjective">adjective</Term>. The Greek
        participle keeps both halves visibly: from its verb side it carries <Term t="tense">tense</Term> and
        {' '}<Term t="voice">voice</Term>; from its adjective side it carries <Term t="gender">gender</Term>,
        {' '}<Term t="case">case</Term>, and <Term t="number">number</Term>, agreeing with the noun it describes.
        The one thing it never carries is <em>person</em> — a participle by itself never says "I" or "they."
      </P>
      <P>
        Why give participles a whole chapter? Frequency. New Testament Greek loves them — roughly one word
        in every twenty is a participle. Learn to read them and whole sentences unlock; skip them and every
        verse fights back.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading>The forms: "being" — the participle of εἰμί</SectionHeading>
    <P>
      Start with the simplest participle: <Gk>ὤν, οὖσα, ὄν</Gk>, "being," from <Gk>εἰμί</Gk>. Its endings
      are worth close attention, because the masculine and neuter columns (3rd declension, with the
      signature <Gk>‑ντ‑</Gk>) and the feminine column (1st declension) are the very skeleton every
      <em> active</em> participle uses.
    </P>
    <TableAside
      beginning={<>
        <p><Gk>ὤν, οὖσα, ὄν</Gk> = "being." Translate the article + participle as "the one who is…"</p>
        <Ex grc="ὁ ὢν ἐν τῷ οὐρανῷ" en="the one who is in heaven" />
      </>}
      intermediate={<>
        <p><Gk>εἰμί</Gk> has only a present participle; it helps build <em>periphrastic</em> tenses (<Gk>ἦν διδάσκων</Gk> "he was teaching").</p>
      </>}
    >
      <MorphTable flush title={gt("Present Participle of εἰμί (ὤν, οὖσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','ὤν','ὄν','οὖσα'],['Gen.','ὄντος','ὄντος','οὔσης'],
          ['Dat.','ὄντι','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],
          ['Plural','','',''],
          ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων','ὄντων','οὐσῶν'],
          ['Dat.','οὖσι','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας'],
        ]}
        note="Neuter Gen. & Dat. = Masculine  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>
    <P>
      Now bolt those endings onto a verb stem and you have the <strong>present active participle</strong> —
      "loosing." Notice it is literally <Gk>λύ‑</Gk> + the <Gk>ὤν</Gk> pattern:
    </P>
    <TableAside
      beginning={<>
        <p>Present active participle = "loosing" — action going on at the <em>same time</em> as the main verb (Simultaneous).</p>
        <Ex grc="ὁ λύων τὸν δοῦλον" en="the one loosing the slave" />
      </>}
      intermediate={<>
        <p>It declines on a 3rd-declension pattern for masc./neut. (note the <Gk>‑ντ‑</Gk>) plus 1st-declension for the feminine — the same split as <Gk>πᾶς</Gk>.</p>
      </>}
    >
      <MorphTable flush title={gt("Present Active Participle — λύων, λύουσα, λύον")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','λύων','λύουσα','λύον'],['Gen.','λύοντος','λυούσης','λύοντος'],
          ['Dat.','λύοντι','λυούσῃ','λύοντι'],['Acc.','λύοντα','λύουσαν','λύον'],
          ['Plural','','',''],
          ['Nom.','λύοντες','λύουσαι','λύοντα'],['Gen.','λυόντων','λυουσῶν','λυόντων'],
          ['Dat.','λύουσιν','λυούσαις','λύουσιν'],['Acc.','λύοντας','λυούσας','λύοντα'],
        ]}
      />
    </TableAside>
    <P>
      The <strong>aorist active participle</strong> slips the aorist's <Gk>σα</Gk> in before the same
      machinery — "having loosed." One crucial absence: <strong>no augment</strong>. Augments belong to the
      indicative only, so an aorist participle signals its tense with <Gk>σα</Gk> alone.
    </P>
    <TableAside
      beginning={<>
        <p>Aorist active participle = "having loosed" — action that happened <em>before</em> the main verb (Sequence).</p>
        <Ex grc="λύσας τὸν δοῦλον ἀπῆλθεν" en="having loosed the slave, he left" />
      </>}
      intermediate={<>
        <p>Note there is <strong>no augment</strong> (augments live only in the indicative). The aorist participle marks relative time, not absolute past.</p>
      </>}
    >
      <MorphTable flush title={gt("Aorist Active Participle — λύσας, λύσασα, λύσαν")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','λύσας','λύσασα','λύσαν'],['Gen.','λύσαντος','λυσάσης','λύσαντος'],
          ['Dat.','λύσαντι','λυσάσῃ','λύσαντι'],['Acc.','λύσαντα','λύσασαν','λύσαν'],
          ['Plural','','',''],
          ['Nom.','λύσαντες','λύσασαι','λύσαντα'],['Gen.','λυσάντων','λυσασῶν','λυσάντων'],
          ['Dat.','λύσασιν','λυσάσαις','λύσασιν'],['Acc.','λύσαντας','λυσάσας','λύσαντα'],
        ]}
      />
    </TableAside>
    <P>
      Middle and passive participles are friendlier still: the giveaway chunk <Gk>‑μεν‑</Gk> plus the
      completely regular endings of <Gk>ἀγαθός</Gk>. See <Gk>‑μεν‑</Gk> and you know instantly you are
      looking at a middle/passive participle.
    </P>
    <TableAside
      beginning={<>
        <p>The chunk <Gk>‑μεν‑</Gk> marks a middle/passive participle: "being loosed."</p>
        <Ex grc="ὁ λυόμενος" en="the one being loosed" />
      </>}
      intermediate={<>
        <p>These take the regular 1st/2nd-declension endings of <Gk>ἀγαθός</Gk> — fully predictable, unlike the active's 3rd-declension pattern.</p>
      </>}
    >
      <MorphTable flush title={gt("Middle / Passive Participle Endings (‒μεν‒ + endings of ἀγαθός)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου','‒μενου','‒μενης'],
          ['Dat.','‒μενῳ','‒μενῳ','‒μενῃ'],['Acc.','‒μενον','= Nom.','‒μενην'],
          ['Plural','','',''],
          ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων','‒μενων','‒μενων'],
          ['Dat.','‒μενοις','‒μενοις','‒μεναις'],['Acc.','‒μενους','= Nom.','‒μενας'],
        ]}
        note="Neuter Gen. & Dat. = Masculine  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Build a middle/passive participle from tense marker + <Gk>‑μεν‑</Gk>. The connecting vowel tells the tense.</p>
        <Ex grc="λυόμενος" en="being loosed (present)" />
        <Ex grc="λελυμένος" en="having been loosed (perfect)" />
      </>}
      intermediate={<>
        <p>Reading it in reverse: <Gk>ο</Gk> before <Gk>‑μεν‑</Gk> = present, <Gk>σα</Gk> = aorist middle, and no connecting vowel (with reduplication) = perfect.</p>
      </>}
    >
      <MorphTable flush title={gt("Middle/Passive Participle — Tense Identifier + ‒μεν‒")} headers={['Tense','Identifier','Example (Masc. Nom. Sg.)']}
        rows={[
          ['Present m/p','‒ο‒μεν','λυόμενος'],
          ['Aorist middle','‒σα‒μεν','λυσάμενος'],
          ['Perfect m/p','(no c.v.)‒μεν','λελυμένος'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Timing ─────────────────────────────────────── */}
    <SectionHeading>Timing: Simultaneous or Sequence</SectionHeading>
    <P>
      A participle's tense does not say <em>when</em> on the calendar — it says when <em>relative to the
      main verb</em>. The rule fits in four words: <strong>Present = Simultaneous, Aorist = Sequence.</strong>
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>One example, every main-verb tense</AsideLabel>
        <p><em>While eating</em>, the man <strong>reads</strong> / <strong>read</strong> / <strong>will read</strong> his
        newspaper — the present participle stays "while eating" no matter when the reading happens.</p>
        <p><em>Having eaten</em>, the man reads / read / will read his newspaper — the aorist participle
        stays "having eaten": the meal comes first, whenever the reading is.</p>
      </>}
      intermediate={<>
        <p>Because participle tense is <em>relative</em>, choose your English connective from the pair:
        present → "while / as …ing"; aorist → "after / when / having …ed." Then adjust for smooth English.</p>
      </>}
    >
      <MorphTable flush title="The timing rule" headers={['Participle', 'Relation to main verb', 'Default English']} firstColIsData
        rows={[
          ['Present', 'same time (simultaneous)', 'while …ing, as …ing'],
          ['Aorist', 'before it (sequence)', 'having …ed, after …ing'],
        ]}
      />
    </TableAside>

    {/* ── 4 · The article question ───────────────────────── */}
    <SectionHeading>The first question: is there an article?</SectionHeading>
    <P>
      Every participle you meet gets the same opening question: <strong>does an article stand with it?</strong>
      The answer sorts its use.
    </P>
    <P>
      <strong>No article → adverbial.</strong> The participle adds a circumstance to the main verb — when,
      how, why: <Gk>λύων τὸν δοῦλον, λαλεῖ τῷ κυρίῳ</Gk>, "<em>while loosing</em> the slave, he speaks to
      the Lord"; <Gk>λύσας τὸν δοῦλον, λαλεῖ</Gk>, "<em>after loosing</em> the slave, he speaks."
    </P>
    <P>
      <strong>Article + noun → attributive.</strong> The participle describes the noun, like any adjective:
      <Gk> ὁ ἄνθρωπος ὁ λύων τὸν δοῦλον</Gk>, "the man <em>who is loosing</em> the slave."
    </P>
    <P>
      <strong>Article, no noun → substantival.</strong> The participle <em>becomes</em> the noun:
      <Gk> ὁ λύων</Gk>, "the one loosing"; <Gk>ὁ πιστεύων</Gk>, "the one who believes — the believer."
      Don't be shy about supplying "who" or "the one who"; the goal is good English.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>The same participle, three jobs</AsideLabel>
        <Ex grc="ἀκούσας, εἶπεν" en="when he heard, he said (adverbial)" />
        <Ex grc="ὁ ἀνὴρ ὁ ἀκούσας" en="the man who heard (attributive)" />
        <Ex grc="οἱ ἀκούσαντες" en="those who heard (substantival)" />
      </>}
      intermediate={<>
        <p>Then cross it with the timing rule: <Gk>ὁ λύων</Gk> "the one loosing" vs. <Gk>ὁ λύσας</Gk> "the one who loosed"; adverbial <Gk>λύων</Gk> "while loosing" vs. <Gk>λύσας</Gk> "having loosed." Two questions — article? tense? — decode most participles on sight.</p>
      </>}
    >
      <MorphTable flush title="The decision grid" headers={['', 'Present ptc.', 'Aorist ptc.']} firstColIsData
        rows={[
          ['With article', '“the one …ing”', '“the one who …ed”'],
          ['No article', '“while …ing”', '“having …ed”'],
        ]}
      />
    </TableAside>
    <InfoBox title="Parsing a Participle — Decision Process">
      <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
        <li>Has the stem been changed? No → regular; Yes → 2nd aorist (uses ‛o' present endings)</li>
        <li>What is the connecting vowel? ο/ου → present; α → aorist</li>
        <li>Is ‒μεν‒ present? No → active participle; Yes → middle/passive (or aorist middle)</li>
      </ol>
    </InfoBox>

    {/* ── 5 · Genitive absolute ──────────────────────────── */}
    <SectionHeading>The genitive absolute</SectionHeading>
    <P>
      One special pattern earns its own name. When the participle's subject is <em>not</em> the subject of
      the main sentence, Greek detaches the whole phrase — participle and its noun together — into the
      genitive, usually at the front of the sentence, to give background: time, circumstances, setting.
      "Absolute" is Latin for "loosed off": the phrase floats free of the main clause's grammar.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ὀψίας γενομένης, ἦλθεν" en="when evening had come, he came" />
        <Ex grc="ἐλθόντος τοῦ Ἰησοῦ, ἐθαύμαζον" en="when Jesus came, they were amazed" />
        <p>Literally "evening having come" — smooth it to a "when / while" clause in English.</p>
      </>}
      intermediate={<>
        <p>Anatomy: an <em>anarthrous</em> genitive participle + a genitive noun/pronoun, grammatically
        independent of the main clause. Its usual force is temporal, but context can tip it causal
        ("since…") or concessive ("although…").</p>
      </>}
    >
      <MorphTable flush title="Spotting a genitive absolute" headers={['Clue', 'What to do']} firstColIsData
        rows={[
          ['Sentence opens with a genitive', 'think genitive absolute'],
          ['Genitive noun + genitive participle', 'bracket the phrase off'],
          ['Different subject from main verb', 'translate as a “when / while” clause'],
        ]}
      />
    </TableAside>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>λύουσι(ν)</Gk> is double-booked: 3rd plural present indicative ("they loose") <em>and</em> dative plural masc./neut. participle ("to those loosing"). The context — is there another main verb? — decides.</li>
        <li>No augment on participles, ever: <Gk>λύσας</Gk>, not <Gk>ἐλύσας</Gk>. Past-looking meaning, no <Gk>ἐ‑</Gk>.</li>
        <li>Feminine participles run on 1st-declension endings (<Gk>λυούσης</Gk>, like <Gk>δόξης</Gk>) — don't hunt for <Gk>‑ντ‑</Gk> there.</li>
        <li>Deponent verbs make middle-form participles with active meaning: <Gk>ἐρχόμενος</Gk> = "coming," not "being come."</li>
        <li>A string of aorist participles before a main verb often reads best as parallel English verbs: "she heard, came, and touched…" — not "having heard, having come, having touched."</li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice A — parse the participle"
      intro={<>Give tense, voice, gender/case/number, and a default translation.</>}
      items={[
        { q: <span className="normal-case">λύων</span>,
          a: <>Present active, masc. nom. sg. — "loosing" (simultaneous).</> },
        { q: <span className="normal-case">λύσασα</span>,
          a: <>Aorist active, fem. nom. sg. — "having loosed" (sequence). The <span className="normal-case">σα</span> flags aorist; no augment.</> },
        { q: <span className="normal-case">λυόμενοι</span>,
          a: <>Present middle/passive, masc. nom. pl. — "being loosed" (the <span className="normal-case">‑μεν‑</span> gives it away).</> },
        { q: <span className="normal-case">ἀκούσαντες</span>,
          a: <>Aorist active, masc. nom. pl. of <span className="normal-case">ἀκούω</span> — "having heard / when they heard."</> },
        { q: <span className="normal-case">λελυμένος</span>,
          a: <>Perfect middle/passive, masc. nom. sg. — "having been loosed": reduplication + <span className="normal-case">‑μεν‑</span> with no connecting vowel.</> },
      ]}
    />
    <Practice
      title="Practice B — translate the sentence"
      intro={<>Ask the two questions — article? tense? Vocabulary: <span className="normal-case">κράζω</span> "cry out" · <span className="normal-case">σπείρω</span> "sow" · <span className="normal-case">θεωρέω</span> "see/behold" · <span className="normal-case">ὄχλος</span> "crowd."</>}
      items={[
        { q: <span className="normal-case">βλέψας τὸν ὄχλον, ὁ Ἰησοῦς ἐκήρυξεν τὸν λόγον.</span>,
          a: <>"When he saw the crowd, Jesus proclaimed the word." Anarthrous aorist participle = adverbial, prior action.</> },
        { q: <span className="normal-case">ὁ σπείρων τὸν λόγον σπείρει.</span>,
          a: <>"The sower sows the word" — substantival present participle: "the sowing one" = the sower (cf. Mark 4:14).</> },
        { q: <span className="normal-case">λέγων τῷ ὄχλῳ, ὁ ἀπόστολος ἐθεώρει τὸν οὐρανόν.</span>,
          a: <>"While speaking to the crowd, the apostle was watching heaven." Present participle = simultaneous with the imperfect main verb.</> },
        { q: <span className="normal-case">μακάριος ὁ βλέπων τὸν θεόν.</span>,
          a: <>"Blessed is the one who sees God." Article + participle, no noun = substantival.</> },
        { q: <span className="normal-case">τοῦ κυρίου λέγοντος, οἱ μαθηταὶ ἤκουον.</span>,
          a: <>"While the Lord was speaking, the disciples were listening." Genitive noun + genitive participle at the front = genitive absolute.</> },
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>Participles are everywhere — roughly one NT word in twenty. Watch the patterns repeat.</>}
      links={[
        { label: 'Aorist participles — hunt the "having …ed" clauses that open sentences', features: ['participle', 'aorist'] },
        { label: 'Present participles — "while …ing" and "the one who …s"', features: ['participle', 'present'] },
        { label: 'Genitive participles — genitive-absolute territory', features: ['participle', 'genitive'] },
        { label: <>Every participle of <span className="normal-case">πιστεύω</span> — John's favourite: "the one believing"</>, lemma: 'πιστεύω', features: ['participle'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: the adverbial flavours</SectionHeading>
      <P>
        Calling a participle "adverbial" only starts the conversation; the exegetical question
        is <em>which</em> circumstance it adds. The main flavours (full catalogue in the card above):
        <strong> temporal</strong> ("when/after"), <strong>causal</strong> ("because" — <Gk>δίκαιος ὤν</Gk>,
        "because he was righteous," Matt 1:19), <strong>concessive</strong> ("although" —
        <Gk> γνόντες τὸν θεόν</Gk>, "although they knew God," Rom 1:21), <strong>means</strong> ("by …ing"),
        <strong> conditional</strong> ("if"), and <strong>purpose</strong> ("in order to"). The form is
        identical; context assigns the flavour — which means the translator is always interpreting.
      </P>
      <P>
        <strong>Attendant circumstance.</strong> Sometimes an aorist participle piggy-backs on the main
        verb's force and translates as a parallel verb + "and." The famous case is Matt 28:19:
        <Gk> πορευθέντες μαθητεύσατε</Gk> — "<em>Go and</em> make disciples," the participle borrowing the
        imperative's punch. The tell-tale pattern: aorist participle <em>before</em> an aorist main verb,
        typically in narrative or command.
      </P>
      <P>
        <strong>Periphrastics.</strong> A participle + a form of <Gk>εἰμί</Gk> can stand in for a simple
        tense: <Gk>ἦν διδάσκων</Gk> = "he was teaching" (imperfect equivalent). Common in Luke. The
        combination usually emphasizes the ongoing process.
      </P>
      <P>
        <strong>Redundant participle.</strong> Narrative Greek loves <Gk>ἀποκριθεὶς εἶπεν</Gk> — literally
        "having answered, he said," functionally just "he answered." A Semitic-flavoured idiom; translate
        it once, not twice.
      </P>
    </LevelOnly>
  </>
)
