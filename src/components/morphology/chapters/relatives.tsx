/* ─────────────────────────────────────────────
   Chapter: Relative Pronouns & Clauses  (ὅς, ἥ, ὅ)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  DropdownPractice, ClassSentences,  Tr,
} from '../shared'

export const RELATIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="relatives.h.start-english-who">Start with English: the who/which clauses</SectionHeading>
      <P id="relatives.p.man-who-came">
        "The man <em>who came to dinner</em> stayed a month." English folds one sentence inside another
        with <em>who, which, that</em> — the <strong>relative pronouns</strong>. The folded-in part
        ("who came to dinner") is a relative <Term t="clause">clause</Term>, and it describes a noun in the
        main sentence — its <strong>antecedent</strong> ("the man").
      </P>
      <P id="relatives.p.english-relatives-barely">
        English relatives barely change form (who/whom/whose, and even "whom" is dying). Greek's relative
        <Gk> ὅς, ἥ, ὅ</Gk> declines fully — and that is a gift, because its endings encode exactly how the
        clause hangs together. One rule governs everything: the relative takes its <strong>gender and
        number from its antecedent</strong>, but its <strong>case from its own job inside its clause</strong>.
        In "the man <em>whom I saw</em>," <em>whom</em> is masculine singular (matching "man") but
        object-case (because <em>I saw him</em>).
      </P>
    </LevelOnly>

    {/* ── 2 · Forms ──────────────────────────────────────── */}
    <SectionHeading id="relatives.h.forms-small-words">The forms: small words, sharp accents</SectionHeading>
    <P id="relatives.p.relative-looks-like">
      The relative looks like the article stripped of its <Gk>τ</Gk> — but with a rough breathing and an
      accent on every form. Those two marks are how you tell <Gk>ὅ</Gk> from <Gk>ὁ</Gk>:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="relatives.al.spot-difference">Spot the difference</Tr></AsideLabel>
        <Ex grc="ὁ λόγος" en={<Tr id="relatives.ex.word-article-accent">the word (article — no accent)</Tr>} />
        <Ex grc="ὃν εἶδον" en={<Tr id="relatives.ex.whom-saw-relative">whom I saw (relative — accented)</Tr>} />
        <p><Tr id="relatives.as.very-short-word">A very short word with a rough breathing <em>and</em> an accent is almost certainly a relative pronoun.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="relatives.as.compare-pairs-students">Compare the pairs students confuse: <Gk>ἥ</Gk> (rel. "who," fem.) vs. <Gk>ἡ</Gk> (article); <Gk>οἵ</Gk> (rel. pl.) vs. <Gk>οἱ</Gk> (article); <Gk>ᾧ</Gk> "to whom" vs. nothing else — the iota-subscripted relative datives are unmistakable.</Tr></p>
      </>}
    >
      <MorphTable id="relatives.t1" flush title="ὅς, ἥ, ὅ — who, which, that" headers={['','','Masc.','Fem.','Neut.']}
        rows={[
          ['Sg.','Nom.','ὅς','ἥ','ὅ'],
          ['','Gen.','οὗ','ἧς','οὗ'],
          ['','Dat.','ᾧ','ᾗ','ᾧ'],
          ['','Acc.','ὅν','ἥν','ὅ'],
          ['Pl.','Nom.','οἵ','αἵ','ἅ'],
          ['','Gen.','ὧν','ὧν','ὧν'],
          ['','Dat.','οἷς','αἷς','οἷς'],
          ['','Acc.','οὕς','ἅς','ἅ'],
        ]}
      />
    </TableAside>

    {/* ── 3 · The agreement rule ─────────────────────────── */}
    <DropdownPractice id="relatives.d1"
      title="Practice — parse the relative"
      intro={<Tr id="relatives.intro.small-words-sharp">Small words, sharp accents — every form carries one.</Tr>}
      options={["Acc Sg Fem — \"whom/which\"", "Gen Sg Masc/Neut — \"whose/of which\"", "Dat Pl Masc/Neut — \"to whom\"", "Nom/Acc Pl Neut — \"which (things)\"", "Gen Sg Fem — \"whose\"", "Acc Sg Masc — \"whom\""]}
      items={[
        { q: <span className="normal-case">ἥν</span>, answer: "Acc Sg Fem — \"whom/which\"" },
        { q: <span className="normal-case">οὗ</span>, answer: "Gen Sg Masc/Neut — \"whose/of which\"" },
        { q: <span className="normal-case">οἷς</span>, answer: "Dat Pl Masc/Neut — \"to whom\"" },
        { q: <span className="normal-case">ἅ</span>, answer: "Nom/Acc Pl Neut — \"which (things)\"" },
        { q: <span className="normal-case">ἧς</span>, answer: "Gen Sg Fem — \"whose\"" },
        { q: <span className="normal-case">ὅν</span>, answer: "Acc Sg Masc — \"whom\"" },
      ]}
    />

    <SectionHeading id="relatives.h.one-rule-worked">The one rule, worked</SectionHeading>
    <P id="relatives.p.gender-number-look">
      Gender and number look <em>backward</em> to the antecedent; case looks <em>inward</em> to the
      relative's own clause. Watch it decide a form:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="relatives.al.step-step">Step by step</Tr></AsideLabel>
        <p><Tr id="relatives.as.man-whom-saw"><Gk>ὁ ἀνὴρ ὃν εἶδον</Gk> — "the man whom I saw."</Tr></p>
        <p><Tr id="relatives.as.antecedent-masculine-singular"><strong>1.</strong> Antecedent <Gk>ἀνήρ</Gk>: masculine singular → the relative is masc. sg.</Tr></p>
        <p><Tr id="relatives.as.inside-clause-saw"><strong>2.</strong> Inside its clause, "I saw <em>him</em>" → direct object → accusative.</Tr></p>
        <p><Tr id="relatives.as.masc-acc-done"><strong>3.</strong> Masc. sg. acc. = <Gk>ὅν</Gk>. Done.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="relatives.as.relative-clause-itself">The relative clause itself then behaves like a big adjective (modifying the antecedent) or — with no antecedent — like a noun: <Gk>ὃς ἔχει ὦτα</Gk>, "<em>whoever</em> has ears." Headless relatives are common and translate as "the one who / whatever."</Tr></p>
      </>}
    >
      <MorphTable id="relatives.t2" tCols={[0, 1, 2]} flush title="Deciding a relative's form" headers={['Question', 'Looks to', 'Answer']} firstColIsData
        rows={[
          ['Gender?', 'the antecedent', 'match it'],
          ['Number?', 'the antecedent', 'match it'],
          ['Case?', "the relative's own clause", 'its job there'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Indefinite relatives ───────────────────────── */}
    <ClassSentences id="relatives.cs1"
      lesson="The relative in action"
      items={[
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "λόγος", parsing: "Nom Sg Masc — λόγος", syntax: "Subject", gloss: "word" },
          { w: "ὃν", parsing: "Acc Sg Masc — ὅς (relative)", syntax: "Direct Object", gloss: "which" },
          { w: "ἀκούετε", parsing: "Pres Act Ind 2 Pl — ἀκούω", gloss: "you hear" },
          { w: "οὐκ", parsing: "Negative particle", gloss: "not" },
          { w: "ἔστιν", parsing: "Pres Act Ind 3 Sg — εἰμί", gloss: "is" },
          { w: "ἐμός.", parsing: "Nom Sg Masc — ἐμός", syntax: "Predicate Nominative", gloss: "mine" },
        ],
          translation: "The word which you hear is not mine.",
          note: "John 14:24 — ὃν takes its gender/number from λόγος but its case from its own clause (object of ἀκούετε).",
        },
        { words: [
          { w: "γινώσκομεν", parsing: "Pres Act Ind 1 Pl — γινώσκω", gloss: "we know" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "ἄνθρωπον", parsing: "Acc Sg Masc — ἄνθρωπος", syntax: "Direct Object", gloss: "man" },
          { w: "ᾧ", parsing: "Dat Sg Masc — ὅς (relative)", syntax: "Dative of Indirect Object", gloss: "to whom" },
          { w: "λέγεις.", parsing: "Pres Act Ind 2 Sg — λέγω", gloss: "you are speaking" },
        ],
          translation: "We know the man to whom you are speaking.",
        },
      ]}
    />

    <SectionHeading id="relatives.h.whoever-indefinite-relatives">"Whoever": the indefinite relatives</SectionHeading>
    <P id="relatives.p.add-subjunctive-relative">
      Add <Gk>ἄν</Gk> (with a subjunctive) and the relative goes generic: <Gk>ὃς ἂν ἀκούσῃ</Gk>,
      "<em>whoever</em> hears" — you met this pattern in the Subjunctives chapter. Greek also has a
      compound indefinite relative <Gk>ὅστις, ἥτις, ὅτι</Gk> ("whoever, anyone who"), common in the
      nominative: <Gk>πᾶς ὅστις ἀκούει</Gk>, "everyone who hears" (Matt 7:24).
    </P>

    {/* ── 5 · Watch out ──────────────────────────────────── */}
    <DropdownPractice id="relatives.d2"
      title="Practice — the indefinite relatives"
      options={["whoever", "whatever", "whoever (qualitative — \"anyone of the sort who\")", "as many as / all who"]}
      items={[
        { q: <span className="normal-case">ὃς ἄν</span>, answer: "whoever" },
        { q: <span className="normal-case">ὃ ἄν</span>, answer: "whatever" },
        { q: <span className="normal-case">ὅστις</span>, answer: "whoever (qualitative — \"anyone of the sort who\")" },
        { q: <span className="normal-case">ὅσοι</span>, answer: "as many as / all who" },
      ]}
    />

    <SectionHeading id="relatives.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="relatives.wo.article-relative-breathing">Article vs. relative: <Gk>ἡ / ἥ</Gk>, <Gk>οἱ / οἵ</Gk>, <Gk>ὁ / ὅ</Gk> — breathing + accent decide. Slow down on one-letter words.</Tr></li>
        <li><Tr id="relatives.wo.neuter-relative-conjunction">Neuter relative <Gk>ὅ</Gk> vs. conjunction <Gk>ὅτι</Gk> "that/because" — and the indefinite neuter <Gk>ὅτι</Gk> ("whatever") looks identical to the conjunction; context separates them.</Tr></li>
        <li><Tr id="relatives.wo.relative-clause-often">The relative clause often sits <em>between</em> article and noun in English order — untangle by finding the main verb first.</Tr></li>
        <li><Tr id="relatives.wo.relative's-antecedent-may">A relative's antecedent may be a whole idea, not a noun: <Gk>ὅ</Gk> "which (fact)…"</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="relatives.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="relatives.pr1"
      title="Practice — parse the relative and translate"
      intro={<Tr id="relatives.intro.each-relative-gender">For each relative: gender/number (from what antecedent?) and case (what job?).</Tr>}
      items={[
        { q: <span className="normal-case">ὁ λόγος ὃν ἤκουσας</span>,
          a: <Tr id="relatives.pa.word-which-heard">"The word which you heard" — ὅν: masc. sg. (from λόγος), accusative (object of ἤκουσας).</Tr>},
        { q: <span className="normal-case">ἡ γυνὴ ἧς ἡ θυγάτηρ ἠσθένει</span>,
          a: <Tr id="relatives.pa.woman-whose-daughter">"The woman whose daughter was sick" — ἧς: fem. sg., genitive (possessing the daughter).</Tr>},
        { q: <span className="normal-case">ὁ προφήτης ᾧ ἐπίστευσαν</span>,
          a: <Tr id="relatives.pa.prophet-whom-believed">"The prophet whom they believed" — ᾧ: dative, because πιστεύω takes the dative.</Tr>},
        { q: <span className="normal-case">ἃ εἶδον, μαρτυροῦσιν.</span>,
          a: <Tr id="relatives.pa.what-things-which">"What (the things which) they saw, they testify" — headless neuter plural ἅ.</Tr>},
        { q: <span className="normal-case">ὃς ἂν ποιήσῃ τὸ θέλημα τοῦ θεοῦ…</span>,
          a: <Tr id="relatives.pa.whoever-does-will">"Whoever does the will of God…" — indefinite relative + ἄν + aorist subjunctive (Mark 3:35).</Tr>},
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<Tr id="relatives.intro.relatives-stitch-nt's">Relatives stitch the NT's sentences together — and open some of its greatest hymns.</Tr>}
      links={[
        { label: <Tr id="relatives.le.every-form-relative">Every form of <span className="normal-case">ὅς</span> — the relative at work</Tr>, lemma: 'ὅς' },
        { label: <Tr id="relatives.le.every-whoever-clauses">Every <span className="normal-case">ὅστις</span> — "whoever" clauses</Tr>, lemma: 'ὅστις' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="relatives.h.going-deeper-attraction">Going deeper: attraction and the hymnic relative</SectionHeading>
      <P id="relatives.p.case-attraction-greek">
        <strong>Case attraction.</strong> Greek sometimes lets the antecedent pull the relative into its
        own case, especially genitive/dative: <Gk>περὶ πάντων ὧν ἐποίησεν</Gk> — "concerning all
        [the things] <em>that</em> he did" (Luke 3:19), where strict grammar expects accusative <Gk>ἅ</Gk>
        but the genitive <Gk>πάντων</Gk> attracted it to <Gk>ὧν</Gk>. Luke and John do this constantly;
        recognize it and refuse to panic when the case rule seems "broken."
      </P>
      <P id="relatives.p.hymnic-relative-several">
        <strong>The hymnic relative.</strong> Several passages scholars identify as early christological
        hymns open with a bare relative: <Gk>ὅς ἐστιν εἰκὼν τοῦ θεοῦ</Gk>, "<em>who</em> is the image of
        the invisible God" (Col 1:15); <Gk>ὃς ἐν μορφῇ θεοῦ ὑπάρχων</Gk> (Phil 2:6); <Gk>ὃς ἐφανερώθη ἐν
        σαρκί</Gk> (1 Tim 3:16). The dangling "who…" suggests quoted material whose antecedent lived in
        the original setting — a grammatical fingerprint of quotation.
      </P>
      <P id="relatives.p.relative-article-participle">
        <strong>Relative vs. article + participle.</strong> Greek has two ways to say "the one who
        believes": <Gk>ὃς πιστεύει</Gk> and <Gk>ὁ πιστεύων</Gk>. John prefers the participle for timeless
        characterization, the relative for specific reference — a stylistic dial worth watching when both
        appear side by side.
      </P>
    </LevelOnly>
  </>
)
