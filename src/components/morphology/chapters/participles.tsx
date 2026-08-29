/* ─────────────────────────────────────────────
   Chapter: Participles

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'

// The participle's uses from Construct search — drawn from the preset list rather than
// restated, so the chapter and the search can't drift apart.
const PARTICIPLE_USES = CONSTRUCT_PRESETS.find(g => g.heading === 'Uses of the participle')!.presets

export const PARTICIPLES_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="participles.h.start-english-verbs">Start with English: verbs wearing adjective clothes</SectionHeading>
      <P id="participles.p.running-water-broken">
        "The <em>running</em> water." "A <em>broken</em> cup." "The man <em>sitting</em> by the door."
        Each italicised word is built from a verb (run, break, sit) but is doing an adjective's job —
        describing a noun. English calls these <strong>participles</strong>, and it makes them with
        <em> -ing</em> and <em>-ed/-en</em>. You use them constantly: "<em>Having finished</em> breakfast,
        she left." "<em>While walking</em> home, I saw him."
      </P>
      <P id="participles.p.participle-therefore-hybrid">
        A participle is therefore a hybrid — half verb, half <Term t="adjective">adjective</Term>. The Greek
        participle keeps both halves visibly: from its verb side it carries <Term t="tense">tense</Term> and
        {' '}<Term t="voice">voice</Term>; from its adjective side it carries <Term t="gender">gender</Term>,
        {' '}<Term t="case">case</Term>, and <Term t="number">number</Term>, agreeing with the noun it describes.
        The one thing it never carries is <em>person</em> — a participle by itself never says "I" or "they."
      </P>
      <P id="participles.p.why-give-participles">
        Why give participles a whole chapter? Frequency. New Testament Greek loves them — roughly one word
        in every twenty is a participle. Learn to read them and whole sentences unlock; skip them and every
        verse fights back.
      </P>
    </LevelOnly>

    {/* ── 2 · The forms ──────────────────────────────────── */}
    <SectionHeading id="participles.h.forms-being-participle">The forms: "being" — the participle of εἰμί</SectionHeading>
    <P id="participles.p.start-simplest-participle">
      Start with the simplest participle: <Gk>ὤν, οὖσα, ὄν</Gk>, "being," from <Gk>εἰμί</Gk>. Its endings
      are worth close attention, because the masculine and neuter columns (3rd declension, with the
      signature <Gk>‑ντ‑</Gk>) and the feminine column (1st declension) are the very skeleton every
      <em> active</em> participle uses.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="participles.as.being-translate-article"><Gk>ὤν, οὖσα, ὄν</Gk> = "being." Translate the article + participle as "the one who is…"</Tr></p>
        <Ex grc="ὁ ὢν ἐν τῷ οὐρανῷ" en={<Tr id="participles.ex.one-who-heaven">the one who is in heaven</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="participles.as.only-present-participle"><Gk>εἰμί</Gk> has only a present participle — the building block of the <em>periphrastic</em> tenses covered in "Going deeper" below.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t1" tCols={[0]} flush title="Present Participle of εἰμί (ὤν, οὖσα, ὄν)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
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
    <LevelOnly level="beginning">
      <P id="participles.p.now-bolt-those">
        Now bolt those endings onto a verb stem and you have the <strong>present active participle</strong> —
        "loosing." Notice it is literally <Gk>λύ‑</Gk> + the <Gk>ὤν</Gk> pattern:
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <p><Tr id="participles.as.present-active-participle-2">Present active participle = "loosing" — action going on at the <em>same time</em> as the main verb (Simultaneous).</Tr></p>
        <Ex grc="ὁ λύων τὸν δοῦλον" en={<Tr id="participles.ex.one-loosing-slave">the one loosing the slave</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="participles.as.declines-declension-pattern">It declines on a 3rd-declension pattern for masc./neut. (note the <Gk>‑ντ‑</Gk>) plus 1st-declension for the feminine — the same split as <Gk>πᾶς</Gk>.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t2" tCols={[0]} flush title="Present Active Participle — λύων, λύουσα, λύον" headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
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
    <P id="participles.p.aorist-active-participle">
      The <strong>aorist active participle</strong> slips the aorist's <Gk>σα</Gk> in before the same
      machinery — "having loosed." One crucial absence: <strong>no augment</strong>. Augments belong to the
      indicative only, so an aorist participle signals its tense with <Gk>σα</Gk> alone.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="participles.as.aorist-active-participle-2">Aorist active participle = "having loosed" — action that happened <em>before</em> the main verb (Sequence).</Tr></p>
        <Ex grc="λύσας τὸν δοῦλον ἀπῆλθεν" en={<Tr id="participles.ex.having-loosed-slave">having loosed the slave, he left</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="participles.as.note-there-augment">Note there is <strong>no augment</strong> (augments live only in the indicative). The aorist participle marks relative time, not absolute past.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t3" tCols={[0]} flush title="Aorist Active Participle — λύσας, λύσασα, λύσαν" headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
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
    <P id="participles.p.middle-passive-participles">
      Middle and passive participles are friendlier still: the giveaway chunk <Gk>‑μεν‑</Gk> plus the
      completely regular endings of <Gk>ἀγαθός</Gk>. See <Gk>‑μεν‑</Gk> and you know instantly you are
      looking at a middle/passive participle.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="participles.as.chunk-marks-middle">The chunk <Gk>‑μεν‑</Gk> marks a middle/passive participle: "being loosed."</Tr></p>
        <Ex grc="ὁ λυόμενος" en={<Tr id="participles.ex.one-being-loosed">the one being loosed</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="participles.as.these-take-regular">These take the regular 1st/2nd-declension endings of <Gk>ἀγαθός</Gk> — fully predictable, unlike the active's 3rd-declension pattern.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t4" tCols={[0]} flush title="Middle / Passive Participle Endings (‒μεν‒ + endings of ἀγαθός)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
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
        <p><Tr id="participles.as.build-middle-passive">Build a middle/passive participle from tense marker + <Gk>‑μεν‑</Gk>. The connecting vowel tells the tense.</Tr></p>
        <Ex grc="λυόμενος" en={<Tr id="participles.ex.being-loosed-present">being loosed (present)</Tr>} />
        <Ex grc="λελυμένος" en={<Tr id="participles.ex.having-been-loosed">having been loosed (perfect)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="participles.as.reading-reverse-before">Reading it in reverse: <Gk>ο</Gk> before <Gk>‑μεν‑</Gk> = present, <Gk>σα</Gk> = aorist middle, and no connecting vowel (with reduplication) = perfect.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t5" tCols={[0]} flush title="Middle/Passive Participle — Tense Identifier + ‒μεν‒" headers={['Tense','Identifier','Example (Masc. Nom. Sg.)']}
        rows={[
          ['Present m/p','‒ο‒μεν','λυόμενος'],
          ['Aorist middle','‒σα‒μεν','λυσάμενος'],
          ['Perfect m/p','(no c.v.)‒μεν','λελυμένος'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Timing ─────────────────────────────────────── */}
    <DropdownPractice id="participles.d1"
      title="Practice — parse the participle"
      options={["Pres Act Masc Nom Sg", "Pres Act Fem Nom Sg", "Aor Act Masc Nom Sg", "Pres M/P Masc Nom Sg", "Aor Pass Masc Nom Sg", "Aor Act Masc Nom Pl"]}
      items={[
        { q: <span className="normal-case">λύων</span>, answer: "Pres Act Masc Nom Sg" },
        { q: <span className="normal-case">λύουσα</span>, answer: "Pres Act Fem Nom Sg" },
        { q: <span className="normal-case">λύσας</span>, answer: "Aor Act Masc Nom Sg" },
        { q: <span className="normal-case">λυόμενος</span>, answer: "Pres M/P Masc Nom Sg" },
        { q: <span className="normal-case">λυθείς</span>, answer: "Aor Pass Masc Nom Sg" },
        { q: <span className="normal-case">λύσαντες</span>, answer: "Aor Act Masc Nom Pl" },
      ]}
    />

    <SectionHeading id="participles.h.timing-simultaneous-sequence">Timing: Simultaneous or Sequence</SectionHeading>
    <P id="participles.p.participle's-tense-does">
      A participle's tense does not say <em>when</em> on the calendar — it says when <em>relative to the
      main verb</em>. The rule fits in four words: <strong>Present = Simultaneous, Aorist = Sequence.</strong>
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="participles.al.one-example-every">One example, every main-verb tense</Tr></AsideLabel>
        <p><Tr id="participles.as.while-eating-man"><em>While eating</em>, the man <strong>reads</strong> / <strong>read</strong> / <strong>will read</strong> his
        newspaper — the present participle stays "while eating" no matter when the reading happens.</Tr></p>
        <p><Tr id="participles.as.having-eaten-man"><em>Having eaten</em>, the man reads / read / will read his newspaper — the aorist participle
        stays "having eaten": the meal comes first, whenever the reading is.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="participles.as.because-participle-tense">Because participle tense is <em>relative</em>, choose your English connective from the pair:
        present → "while / as …ing"; aorist → "after / when / having …ed." Then adjust for smooth English.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t6" tCols={[0, 1, 2]} flush title="The timing rule" headers={['Participle', 'Relation to main verb', 'Default English']} firstColIsData
        rows={[
          ['Present', 'same time (simultaneous)', 'while …ing, as …ing'],
          ['Aorist', 'before it (sequence)', 'having …ed, after …ing'],
        ]}
      />
    </TableAside>

    {/* ── 4 · The article question ───────────────────────── */}
    <DropdownPractice id="participles.d2"
      title="Practice — timing"
      intro={<Tr id="participles.intro.present-participle-same">Present participle = same time; aorist participle = before the main verb.</Tr>}
      options={["Simultaneous — \"while …-ing\"", "Sequence — \"having …-ed\""]}
      items={[
        { q: <span className="normal-case">βλέπων</span>, answer: "Simultaneous — \"while …-ing\"" },
        { q: <span className="normal-case">βλέψας</span>, answer: "Sequence — \"having …-ed\"" },
        { q: <span className="normal-case">ἐρχόμενος</span>, answer: "Simultaneous — \"while …-ing\"" },
        { q: <span className="normal-case">ἐλθών</span>, answer: "Sequence — \"having …-ed\"" },
        { q: <span className="normal-case">ἀκούσας</span>, answer: "Sequence — \"having …-ed\"" },
        { q: <span className="normal-case">ἀκούων</span>, answer: "Simultaneous — \"while …-ing\"" },
      ]}
    />

    <SectionHeading id="participles.h.first-question-there">The first question: is there an article?</SectionHeading>
    <P id="participles.p.every-participle-meet">
      Every participle you meet gets the same opening question: <strong>does an article stand with it?</strong>
      The answer sorts its use.
    </P>
    <P id="participles.p.article-adverbial-participle">
      <strong>No article → adverbial.</strong> The participle adds a circumstance to the main verb — when,
      how, why: <Gk>λύων τὸν δοῦλον, λαλεῖ τῷ κυρίῳ</Gk>, "<em>while loosing</em> the slave, he speaks to
      the Lord"; <Gk>λύσας τὸν δοῦλον, λαλεῖ</Gk>, "<em>after loosing</em> the slave, he speaks."
    </P>
    <P id="participles.p.article-noun-attributive">
      <strong>Article + noun → attributive.</strong> The participle describes the noun, like any adjective:
      <Gk> ὁ ἄνθρωπος ὁ λύων τὸν δοῦλον</Gk>, "the man <em>who is loosing</em> the slave."
    </P>
    <P id="participles.p.article-noun-substantival">
      <strong>Article, no noun → substantival.</strong> The participle <em>becomes</em> the noun:
      <Gk> ὁ λύων</Gk>, "the one loosing"; <Gk>ὁ πιστεύων</Gk>, "the one who believes — the believer."
      Don't be shy about supplying "who" or "the one who"; the goal is good English.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="participles.al.same-participle-three">The same participle, three jobs</Tr></AsideLabel>
        <Ex grc="ἀκούσας, εἶπεν" en={<Tr id="participles.ex.when-heard-said">when he heard, he said (adverbial)</Tr>} />
        <Ex grc="ὁ ἀνὴρ ὁ ἀκούσας" en={<Tr id="participles.ex.man-who-heard">the man who heard (attributive)</Tr>} />
        <Ex grc="οἱ ἀκούσαντες" en={<Tr id="participles.ex.those-who-heard">those who heard (substantival)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="participles.as.then-cross-timing">Then cross it with the timing rule: <Gk>ὁ λύων</Gk> "the one loosing" vs. <Gk>ὁ λύσας</Gk> "the one who loosed"; adverbial <Gk>λύων</Gk> "while loosing" vs. <Gk>λύσας</Gk> "having loosed." Two questions — article? tense? — decode most participles on sight.</Tr></p>
      </>}
    >
      <MorphTable id="participles.t7" tCols={[0, 1, 2]} flush title="The decision grid" headers={['', 'Present ptc.', 'Aorist ptc.']} firstColIsData
        rows={[
          ['With article', '“the one …ing”', '“the one who …ed”'],
          ['No article', '“while …ing”', '“having …ed”'],
        ]}
      />
    </TableAside>
    {/* The three questions are the chapter's method — a student who can run them can parse any
        participle in the NT. They were set in the smallest, faintest type on the page, below
        even the surrounding prose; they now carry the weight the method deserves. The wording
        and the Tr ids are untouched, so the translations still resolve. */}
    <div className="mb-5 rounded-xl border-2 border-brand-300 bg-brand-50 px-5 py-4">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-800">
        <Tr id="participles.ib.decision-process">Parsing a Participle — Decision Process</Tr>
      </p>
      <ol className="space-y-3">
        {[
          <Tr key="1" id="participles.wo.stem-been-changed">Has the stem been changed? No → regular; Yes → 2nd aorist (uses ‛o' present endings)</Tr>,
          <Tr key="2" id="participles.wo.what-connecting-vowel">What is the connecting vowel? ο/ου → present; α → aorist</Tr>,
          <Tr key="3" id="participles.wo.present-active-participle">Is ‒μεν‒ present? No → active participle; Yes → middle/passive (or aorist middle)</Tr>,
        ].map((q, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-base leading-relaxed text-gray-900">{q}</span>
          </li>
        ))}
      </ol>
    </div>

    {/* ── 5 · Genitive absolute ──────────────────────────── */}
    <DropdownPractice id="participles.d3"
      title="Practice — which use?"
      intro={<Tr id="participles.intro.first-question-there-2">First question: is there an article, and what does it attach to?</Tr>}
      options={["Substantival — \"the one who …\"", "Attributive — \"the X who …\"", "Adverbial — \"while/after …-ing\""]}
      items={[
        { q: <span className="normal-case">ὁ πιστεύων</span>, answer: "Substantival — \"the one who …\"" },
        { q: <span className="normal-case">πιστεύων</span>, answer: "Adverbial — \"while/after …-ing\"" },
        { q: <span className="normal-case">ὁ ἄνθρωπος ὁ πιστεύων</span>, answer: "Attributive — \"the X who …\"" },
        { q: <span className="normal-case">οἱ ἀκούοντες</span>, answer: "Substantival — \"the one who …\"" },
        { q: <span className="normal-case">ἀκούσας</span>, answer: "Adverbial — \"while/after …-ing\"" },
        { q: <span className="normal-case">τὸν λόγον τὸν σῴζοντα</span>, answer: "Attributive — \"the X who …\"" },
      ]}
    />

    <SectionHeading id="participles.h.genitive-absolute">The genitive absolute</SectionHeading>
    <P id="participles.p.one-special-pattern">
      One special pattern earns its own name. When the participle's subject is <em>not</em> the subject of
      the main sentence, Greek detaches the whole phrase — participle and its noun together — into the
      genitive, usually at the front of the sentence, to give background: time, circumstances, setting.
      "Absolute" is Latin for "loosed off": the phrase floats free of the main clause's grammar.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ὀψίας γενομένης, ἦλθεν" en={<Tr id="participles.ex.when-evening-had">when evening had come, he came</Tr>} />
        <Ex grc="ἐλθόντος τοῦ Ἰησοῦ, ἐθαύμαζον" en={<Tr id="participles.ex.when-jesus-came">when Jesus came, they were amazed</Tr>} />
        <p><Tr id="participles.as.literally-evening-having">Literally "evening having come" — smooth it to a "when / while" clause in English.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="participles.as.anatomy-anarthrous-genitive">Anatomy: an <em>anarthrous</em> genitive participle + a genitive noun/pronoun, grammatically
        independent of the main clause. Its usual force is temporal, but context can tip it causal
        ("since…") or concessive ("although…").</Tr></p>
      </>}
    >
      <MorphTable id="participles.t8" tCols={[0, 1]} flush title="Spotting a genitive absolute" headers={['Clue', 'What to do']} firstColIsData
        rows={[
          ['Sentence opens with a genitive', 'think genitive absolute'],
          ['Genitive noun + genitive participle', 'bracket the phrase off'],
          ['Different subject from main verb', 'translate as a “when / while” clause'],
        ]}
      />
    </TableAside>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <ClassSentences id="participles.cs1"
      lesson="The genitive absolute in the text"
      items={[
        { words: [
          { w: "ταῦτα", parsing: "Acc Pl Neut — οὗτος", syntax: "Direct Object", gloss: "these things" },
          { w: "αὐτοῦ", parsing: "Gen Sg Masc — αὐτός", syntax: "Genitive Absolute", gloss: "he" },
          { w: "λαλοῦντος", parsing: "Pres Act Ptcp Gen Sg Masc — λαλέω", syntax: "Genitive Absolute", gloss: "speaking" },
          { w: "πολλοὶ", parsing: "Nom Pl Masc — πολύς", syntax: "Subject", gloss: "many" },
          { w: "ἐπίστευσαν", parsing: "Aor Act Ind 3 Pl — πιστεύω", gloss: "believed" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "in" },
          { w: "αὐτόν.", parsing: "Acc Sg Masc — αὐτός", gloss: "him" },
        ],
          translation: "While he was saying these things, many believed in him.",
          note: "John 8:30 — αὐτοῦ λαλοῦντος is a genitive absolute; its subject is not part of the main clause.",
        },
      ]}
    />

    <SectionHeading id="participles.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="participles.wo.double-booked-plural"><Gk>λύουσι(ν)</Gk> is double-booked: 3rd plural present indicative ("they loose") <em>and</em> dative plural masc./neut. participle ("to those loosing"). The context — is there another main verb? — decides.</Tr></li>
        <li><Tr id="participles.wo.augment-participles-ever">No augment on participles, ever: <Gk>λύσας</Gk>, not <Gk>ἐλύσας</Gk>. Past-looking meaning, no <Gk>ἐ‑</Gk>.</Tr></li>
        <li><Tr id="participles.wo.feminine-participles-run">Feminine participles run on 1st-declension endings (<Gk>λυούσης</Gk>, like <Gk>δόξης</Gk>) — don't hunt for <Gk>‑ντ‑</Gk> there.</Tr></li>
        <li><Tr id="participles.wo.deponent-verbs-make">Deponent verbs make middle-form participles with active meaning: <Gk>ἐρχόμενος</Gk> = "coming," not "being come."</Tr></li>
        <li><Tr id="participles.wo.string-aorist-participles">A string of aorist participles before a main verb often reads best as parallel English verbs: "she heard, came, and touched…" — not "having heard, having come, having touched."</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning">
    <SectionHeading id="participles.h.try">Try it</SectionHeading>
    <Practice id="participles.pr1"
      title="Practice A — parse the participle"
      intro={<Tr id="participles.intro.give-tense-voice">Give tense, voice, gender/case/number, and a default translation.</Tr>}
      items={[
        { q: <span className="normal-case">λύων</span>,
          a: <Tr id="participles.pa.present-active-masc">Present active, masc. nom. sg. — "loosing" (simultaneous).</Tr>},
        { q: <span className="normal-case">λύσασα</span>,
          a: <Tr id="participles.pa.aorist-active-fem">Aorist active, fem. nom. sg. — "having loosed" (sequence). The <span className="normal-case">σα</span> flags aorist; no augment.</Tr>},
        { q: <span className="normal-case">λυόμενοι</span>,
          a: <Tr id="participles.pa.present-middle-passive">Present middle/passive, masc. nom. pl. — "being loosed" (the <span className="normal-case">‑μεν‑</span> gives it away).</Tr>},
        { q: <span className="normal-case">ἀκούσαντες</span>,
          a: <Tr id="participles.pa.aorist-active-masc">Aorist active, masc. nom. pl. of <span className="normal-case">ἀκούω</span> — "having heard / when they heard."</Tr>},
        { q: <span className="normal-case">λελυμένος</span>,
          a: <Tr id="participles.pa.perfect-middle-passive">Perfect middle/passive, masc. nom. sg. — "having been loosed": reduplication + <span className="normal-case">‑μεν‑</span> with no connecting vowel.</Tr>},
      ]}
    />
    <Practice id="participles.pr2"
      title="Practice B — translate the sentence"
      intro={<Tr id="participles.intro.ask-two-questions">Ask the two questions — article? tense? Vocabulary: <span className="normal-case">κράζω</span> "cry out" · <span className="normal-case">σπείρω</span> "sow" · <span className="normal-case">θεωρέω</span> "see/behold" · <span className="normal-case">ὄχλος</span> "crowd."</Tr>}
      items={[
        { q: <span className="normal-case">βλέψας τὸν ὄχλον, ὁ Ἰησοῦς ἐκήρυξεν τὸν λόγον.</span>,
          a: <Tr id="participles.pa.when-saw-crowd">"When he saw the crowd, Jesus proclaimed the word." Anarthrous aorist participle = adverbial, prior action.</Tr>},
        { q: <span className="normal-case">ὁ σπείρων τὸν λόγον σπείρει.</span>,
          a: <Tr id="participles.pa.sower-sows-word">"The sower sows the word" — substantival present participle: "the sowing one" = the sower (cf. Mark 4:14).</Tr>},
        { q: <span className="normal-case">λέγων τῷ ὄχλῳ, ὁ ἀπόστολος ἐθεώρει τὸν οὐρανόν.</span>,
          a: <Tr id="participles.pa.while-speaking-crowd">"While speaking to the crowd, the apostle was watching heaven." Present participle = simultaneous with the imperfect main verb.</Tr>},
        { q: <span className="normal-case">μακάριος ὁ βλέπων τὸν θεόν.</span>,
          a: <Tr id="participles.pa.blessed-one-who">"Blessed is the one who sees God." Article + participle, no noun = substantival.</Tr>},
        { q: <span className="normal-case">τοῦ κυρίου λέγοντος, οἱ μαθηταὶ ἤκουον.</span>,
          a: <Tr id="participles.pa.while-lord-was">"While the Lord was speaking, the disciples were listening." Genitive noun + genitive participle at the front = genitive absolute.</Tr>},
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="participles.cs2"
      lesson="Lesson 7 · Participles"
      items={[
        { words: [
          { w: "γράφων", parsing: "Pres Act Ptcp Nom Sg Masc — γράφω", syntax: "Adverbial Participle (Temporal)", gloss: "while writing" },
          { w: "ταῦτα", parsing: "Acc Pl Neut — οὗτος", syntax: "Direct Object", gloss: "these things" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "προφήτης", parsing: "Nom Sg Masc — προφήτης", syntax: "Subject", gloss: "prophet" },
          { w: "ἀκούει", parsing: "Pres Act Ind 3 Sg — ἀκούω", gloss: "hears" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "μαθητήν.", parsing: "Acc Sg Masc — μαθητής", syntax: "Direct Object", gloss: "disciple" },
        ],
          translation: "While writing these things, the prophet hears the disciple.",
          note: "Present participle = action at the same time as the main verb.",
        },
        { words: [
          { w: "γράψας", parsing: "Aor Act Ptcp Nom Sg Masc — γράφω", syntax: "Adverbial Participle (Temporal)", gloss: "having written" },
          { w: "ταῦτα", parsing: "Acc Pl Neut — οὗτος", syntax: "Direct Object", gloss: "these things" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "προφήτης", parsing: "Nom Sg Masc — προφήτης", syntax: "Subject", gloss: "prophet" },
          { w: "ἤκουσε", parsing: "Aor Act Ind 3 Sg — ἀκούω", gloss: "heard" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "μαθητήν.", parsing: "Acc Sg Masc — μαθητής", syntax: "Direct Object", gloss: "disciple" },
        ],
          translation: "Having written these things, the prophet heard the disciple.",
          note: "Aorist participle = action before the main verb.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "μαθητὴς", parsing: "Nom Sg Masc — μαθητής", syntax: "Subject", gloss: "disciple" },
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "who" },
          { w: "διδασκόμενος", parsing: "Pres Pass Ptcp Nom Sg Masc — διδάσκω", syntax: "Attributive Participle", gloss: "is being taught" },
          { w: "ὑπὸ", parsing: "Preposition + genitive (agent)", gloss: "by" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "the" },
          { w: "προφήτου", parsing: "Gen Sg Masc — προφήτης", gloss: "prophet" },
          { w: "πιστός", parsing: "Nom Sg Masc — πιστός", gloss: "faithful" },
          { w: "ἐστιν.", parsing: "Pres Act Ind 3 Sg — εἰμί", gloss: "is" },
        ],
          translation: "The disciple who is being taught by the prophet is faithful.",
          note: "Article + participle after the noun = attributive: translate as a relative clause.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the ones" },
          { w: "ζητοῦντες", parsing: "Pres Act Ptcp Nom Pl Masc — ζητέω", syntax: "Substantival Participle", gloss: "who seek" },
          { w: "εὑρήσουσιν.", parsing: "Fut Act Ind 3 Pl — εὑρίσκω", gloss: "will find" },
        ],
          translation: "The ones who seek will find.",
        },
        { words: [
          { w: "ἐλθοῦσα", parsing: "2nd Aor Act Ptcp Nom Sg Fem — ἔρχομαι", syntax: "Adverbial Participle (Temporal)", gloss: "when she had come" },
          { w: "προσεκύνησεν", parsing: "Aor Act Ind 3 Sg — προσκυνέω", gloss: "she worshipped" },
          { w: "αὐτῷ.", parsing: "Dat Sg Masc — αὐτός", gloss: "him" },
        ],
          translation: "When she had come, she worshipped him.",
          note: "προσκυνέω takes its object in the dative.",
        },
        { words: [
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "the" },
          { w: "δὲ", parsing: "Conjunction (postpositive)", gloss: "and/now" },
          { w: "προφήτου", parsing: "Gen Sg Masc — προφήτης", syntax: "Genitive Absolute", gloss: "prophet" },
          { w: "ἀποθανόντος", parsing: "2nd Aor Act Ptcp Gen Sg Masc — ἀποθνῄσκω", syntax: "Genitive Absolute", gloss: "having died" },
          { w: "ἔφυγον", parsing: "2nd Aor Act Ind 3 Pl — φεύγω", gloss: "they fled" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "into" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "ἔρημον.", parsing: "Acc Sg Fem — ἔρημος", gloss: "desert" },
        ],
          translation: "After the prophet died, they fled into the desert.",
          note: "Genitive absolute: noun + participle both genitive, grammatically disconnected from the main clause.",
        },
      ]}
    />

    </LevelOnly>
    <HomeworkAssignments chapter="participles" />

    {/* Syntax is a relation between words, which the one-word morphology search can't express;
        these open Construct search instead. */}
    <LiveExamples
      intro={<Tr id="participles.intro.now-uses-each">Now the uses, each as a search you can open and adjust:</Tr>}
      links={PARTICIPLE_USES.map(pr => ({
        label: <>{pr.label} <span className="text-gray-400">— {pr.approx.toLocaleString()} in the NT</span></>,
        construct: pr.query,
      }))}
    />

    <LiveExamples
      intro={<Tr id="participles.intro.participles-everywhere-roughly">Participles are everywhere — roughly one NT word in twenty. Watch the patterns repeat.</Tr>}
      links={[
        { label: <Tr id="participles.le.aorist">Aorist participles — hunt the "having …ed" clauses that open sentences</Tr>, features: ['participle', 'aorist'] },
        { label: <Tr id="participles.le.present">Present participles — "while …ing" and "the one who …s"</Tr>, features: ['participle', 'present'] },
        { label: <Tr id="participles.le.genitive">Genitive participles — genitive-absolute territory</Tr>, features: ['participle', 'genitive'] },
        { label: <Tr id="participles.le.every-participle-john's">Every participle of <span className="normal-case">πιστεύω</span> — John's favourite: "the one believing"</Tr>, lemma: 'πιστεύω', features: ['participle'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
  </>
)
