/* ─────────────────────────────────────────────
   Chapter: Indicative Verbs

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  HomeworkAssignments,
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice,
  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'

export const INDICATIVES_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="indicatives.h.start-english-what">Start with English: what a verb carries</SectionHeading>
      <P id="indicatives.p.verb-names-action">
        A <Term t="verb">verb</Term> names an action or a state — <em>writes, sees, is</em>. Now notice how
        little English asks of its verbs. "I write, you write, we write, they write" — the verb barely
        changes; only "she write<strong>s</strong>" picks up an ending. To say <em>who</em> acts, English
        must add a pronoun, and to say <em>when</em>, it adds helper words: "I <em>will</em> write,"
        "I <em>was</em> writing," "I <em>have</em> written."
      </P>
      <P id="indicatives.p.greek-packs-all">
        Greek packs all of that <em>inside</em> the verb. The ending tells you who is acting — so
        <Gk> λύομεν</Gk>, one word, is a complete sentence: "we loose." No separate word for "we" is needed;
        the ending <Gk>‑ομεν</Gk> <em>is</em> the "we." And time is marked by changes at the front and middle
        of the word — a prefix for past time, a marker before the ending for future, and so on. A Greek verb
        is a little machine: <strong>stem</strong> (the meaning) + <strong>markers</strong> (the tense) +
        <strong> ending</strong> (the person). This chapter teaches you to read the machine.
      </P>
      <P id="indicatives.p.one-more-idea">
        One more idea: <Term t="mood">mood</Term>. The <strong>indicative</strong> — this chapter — is the
        mood of plain statement and question: things presented as fact ("she wrote," "did she write?").
        Commands, wishes, and "maybes" have their own moods, each with its own tab.
      </P>
    </LevelOnly>

    {/* ── 2 · The ending is the subject ──────────────────── */}
    <SectionHeading id="indicatives.h.ending-subject">The ending is the subject</SectionHeading>
    <P id="indicatives.p.greek-verbs-mark">
      Greek verbs mark six persons: I / you (sg.) / he-she-it, and we / you (pl.) / they. Here is the
      present tense of <Gk>λύω</Gk> ("I loose / untie"), the model verb your textbook tables will use
      everywhere. Read the endings, not the stem — the stem <Gk>λυ‑</Gk> never changes here.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="indicatives.as.greek's-present-covers">Greek's present covers <em>both</em> English "I loose" and "I am loosing" — it does not distinguish the two.</Tr></p>
        <Ex grc="πιστεύω εἰς τὸν θεόν" en={<Tr id="indicatives.ex.believe-god">I believe in God</Tr>} />
        <Ex grc="ὁ Ἰησοῦς διδάσκει" en={<Tr id="indicatives.ex.jesus-teaches-teaching">Jesus teaches / is teaching</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.present-imperfective-aspect">Present = <em>imperfective</em> <Term t="aspect">aspect</Term> (ongoing).</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t1" tCols={[0, 2]} flush title="Present Tense — λύω (I loose, I am loosing)" headers={['Person','Greek','Translation']}
        rows={[
          ['1st sg.','λύ|ω','I am untying / I untie'],
          ['2nd sg.','λύ|εις','You are untying / you untie'],
          ['3rd sg.','λύ|ει','He/she/it is untying'],
          ['1st pl.','λύ|ομεν','We are untying / we untie'],
          ['2nd pl.','λύ|ετε','You are untying / you untie'],
          ['3rd pl.','λύ|ουσι(ν)','They are untying / they untie'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Past time: the augment ─────────────────────── */}
    <DropdownPractice id="indicatives.d1"
      title="Practice — who is acting?"
      intro={<Tr id="indicatives.intro.read-person-number">Read the person and number straight off the ending.</Tr>}
      options={["1st singular — \"I\"", "2nd singular — \"you\"", "3rd singular — \"he/she/it\"", "1st plural — \"we\"", "2nd plural — \"you (pl.)\"", "3rd plural — \"they\""]}
      items={[
        { q: <span className="normal-case">λέγομεν</span>, answer: "1st plural — \"we\"" },
        { q: <span className="normal-case">πιστεύεις</span>, answer: "2nd singular — \"you\"" },
        { q: <span className="normal-case">ἀκούουσιν</span>, answer: "3rd plural — \"they\"" },
        { q: <span className="normal-case">ἔχετε</span>, answer: "2nd plural — \"you (pl.)\"" },
        { q: <span className="normal-case">γινώσκω</span>, answer: "1st singular — \"I\"" },
        { q: <span className="normal-case">λαμβάνει</span>, answer: "3rd singular — \"he/she/it\"" },
      ]}
    />

    <SectionHeading id="indicatives.h.marking-past-time">Marking past time: the augment</SectionHeading>
    <P id="indicatives.p.push-verb-into">
      To push a verb into the past, Greek glues an <Gk>ἐ‑</Gk> onto the front — called the
      <strong> augment</strong>. Think of it as the past-time flag: <Gk>λύομεν</Gk> "we loose" →
      <Gk> ἐλύομεν</Gk> "we were loosing." The <strong>imperfect</strong> tense (ongoing past, "was …ing")
      is exactly that: augment + present stem + a slightly different set of endings. Those two sets of
      endings — present and imperfect — are the base for everything else:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="indicatives.al.default-translations-add">Default translations (add the verb)</Tr></AsideLabel>
        <p><Tr id="indicatives.as.present-active-ing"><strong>Present</strong> active: "I ‒ / I am ‒ing" · mid/pass: "I am (being) ‒ed."</Tr></p>
        <p><Tr id="indicatives.as.imperfect-active-was"><strong>Imperfect</strong> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</Tr></p>
        <p><Tr id="indicatives.as.imperfect's-augment-marks">The imperfect's <Gk>ε‒</Gk> augment marks past time.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.imperfect-past-imperfective">The imperfect is <em>past imperfective</em> — ongoing or repeated action in the past ("kept on…, was beginning to…"), as opposed to the aorist's single, whole action.</Tr></p>
        <p><Tr id="indicatives.as.middle-lost-intervocalic">The 2nd-sg. middle (<Gk>ἐλύου, λύῃ</Gk>) lost an intervocalic <Gk>σ</Gk>, which is why it looks irregular.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t2" tCols={[0, 1]} flush title="Present & Imperfect Full Paradigm — λύω" headers={['','','Imp. Active','Imp. Mid/Pass','Pres. Active','Pres. Mid/Pass']}
        rows={[
          ['SG','1','ἔλυ|ον','ἐλυ|όμην','λύ|ω','λύ|ομαι'],
          ['','2','ἔλυ|ες','ἐλύ|ου','λύ|εις','λύ|ῃ (σαι)'],
          ['','3','ἔλυ|ε(ν)','ἐλύ|ετο','λύ|ει','λύ|εται'],
          ['PL','1','ἐλύ|ομεν','ἐλυ|όμεθα','λύ|ομεν','λυ|όμεθα'],
          ['','2','ἐλύ|ετε','ἐλύ|εσθε','λύ|ετε','λύ|εσθε'],
          ['','3','ἔλυ|ον','ἐλύ|οντο','λύ|ουσι(ν)','λύ|ονται'],
        ]}
      />
    </TableAside>
    <InfoBox title={<Tr id="indicatives.ib.augment-quirks">Two augment quirks</Tr>}>
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
        <li><Tr id="indicatives.wo.verb-starts-vowel">If the verb starts with a vowel, the augment <em>lengthens</em> it instead of adding <Gk>ἐ‑</Gk>: <Gk>ἀκούω</Gk> "I hear" → <Gk>ἤκουον</Gk> "I was hearing."</Tr></li>
        <li><Tr id="indicatives.wo.compound-verbs-augment">In compound verbs the augment goes <em>after</em> the preposition: <Gk>ἀπολύω</Gk> "I release" → <Gk>ἀπέλυον</Gk> (not <Gk>ἠπολυον</Gk>).</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 4 · εἰμί ───────────────────────────────────────── */}
    <DropdownPractice id="indicatives.d2"
      title="Practice — spot the augment"
      intro={<Tr id="indicatives.intro.prefix-lengthened-opening">The ἐ- prefix (or a lengthened opening vowel) marks past time in the indicative.</Tr>}
      options={["Augmented — past time", "No augment — not past"]}
      items={[
        { q: <span className="normal-case">ἤκουον</span>, answer: "Augmented — past time", note: <Tr id="indicatives.n.lengthened">ἀ lengthened to ἠ.</Tr> },
        { q: <span className="normal-case">πιστεύομεν</span>, answer: "No augment — not past" },
        { q: <span className="normal-case">ἐλέγετε</span>, answer: "Augmented — past time" },
        { q: <span className="normal-case">ἔχει</span>, answer: "No augment — not past" },
        { q: <span className="normal-case">ἔγραφον</span>, answer: "Augmented — past time" },
        { q: <span className="normal-case">λύουσιν</span>, answer: "No augment — not past" },
      ]}
    />

    <SectionHeading id="indicatives.h.most-common-verb">The most common verb of all: εἰμί, "to be"</SectionHeading>
    <P id="indicatives.p.just-english-was">
      Just as in English (<em>am, is, was</em> — nothing like "be"!), the Greek verb "to be" is irregular
      and must simply be memorized. It is worth the effort: it is the most frequent verb in the New Testament.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="indicatives.al.verb">The verb "to be"</Tr></AsideLabel>
        <p><Tr id="indicatives.as.irregular-very-common"><Gk>εἰμί</Gk> is irregular and very common — memorize it. It has no voice.</Tr></p>
        <Ex grc="ἐγώ εἰμι" en={<Tr id="indicatives.ex.x">I am</Tr>} />
        <Ex grc="ἦν ὁ λόγος" en={<Tr id="indicatives.ex.word-was">the Word was</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.equative-verb-links"><Gk>εἰμί</Gk> is an <strong>equative</strong> verb: it links the subject to a <em>predicate nominative</em>, so both stand in the nominative (<Gk>θεὸς ἦν ὁ λόγος</Gk>).</Tr></p>
        <p><Tr id="indicatives.as.future-middle-deponent">Its future <Gk>ἔσομαι</Gk> is a middle (deponent) form.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t3" tCols={[0]} flush title="εἰμί — Present, Future & Imperfect Indicative" headers={['Person','Present','Future','Imperfect']}
        rows={[
          ['I','εἰμί','ἔσομαι','ἦμην'],
          ['You (sg.)','εἶ','ἔσῃ','ἦς (or ἦσθα)'],
          ['He/she/it','ἐστί(ν)','ἔσται','ἦν'],
          ['We','ἐσμέν','ἐσόμεθα','ἦμεν (or ἦμεθα)'],
          ['You (pl.)','ἐστέ','ἔσεσθε','ἦτε'],
          ['They','εἰσί(ν)','ἔσονται','ἦσαν'],
        ]}
        note="Present Infinitive: εἶναι · Present Participle (Masc. Nom. Sg./Pl.): ὤν / ὄντες"
      />
    </TableAside>

    {/* ── 5 · The tense machine ──────────────────────────── */}
    <ClassSentences id="indicatives.cs1"
      lesson="εἰμί in the wild"
      items={[
        { words: [
          { w: "ἐγώ", parsing: "Nom Sg — ἐγώ (emphatic)", syntax: "Subject", gloss: "I" },
          { w: "εἰμι", parsing: "Pres Act Ind 1 Sg — εἰμί", gloss: "am" },
          { w: "τὸ", parsing: "Article — Nom Sg Neut", gloss: "the" },
          { w: "φῶς", parsing: "Nom Sg Neut — φῶς (3rd decl.)", syntax: "Predicate Nominative", gloss: "light" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of the" },
          { w: "κόσμου.", parsing: "Gen Sg Masc — κόσμος", syntax: "Genitive of Possession", gloss: "world" },
        ],
          translation: "I am the light of the world.",
          note: "John 8:12.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "θεὸς", parsing: "Nom Sg Masc — θεός", syntax: "Subject", gloss: "God" },
          { w: "ἀγάπη", parsing: "Nom Sg Fem — ἀγάπη", syntax: "Predicate Nominative", gloss: "love" },
          { w: "ἐστίν.", parsing: "Pres Act Ind 3 Sg — εἰμί", gloss: "is" },
        ],
          translation: "God is love.",
          note: "1 John 4:8 — the articular θεός is the subject; anarthrous ἀγάπη the predicate.",
        },
      ]}
    />

    <SectionHeading id="indicatives.h.tense-machine-identifiers">The tense machine: identifiers</SectionHeading>
    <P id="indicatives.p.here-payoff-learning">
      Here is the payoff of learning the two base paradigms: every remaining tense is built by inserting a
      <strong> tense identifier</strong> — a flag letter or two — between the stem and the ending. Learn six
      flags and you can read the entire system:
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="indicatives.as.spot-flag-letter">Spot the flag letter, then read the ending for person. <Gk>‒σ‒</Gk> future, <Gk>‒σα‒</Gk> aorist, <Gk>‒θη‒</Gk> aorist passive, <Gk>‒κα‒</Gk> perfect.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.recognize-family-exact">Recognize the <em>family</em>, not an exact string: a <Gk>σ</Gk>-cluster = aorist/future, a <Gk>θ</Gk>-cluster = passive. Reduced forms appear right before certain endings.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t4" tCols={[1]} flush title="Tense Identifiers" headers={['Identifier','Tense']}
        rows={[
          ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
          ['‒σα','1st Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1st Aorist (passive)'],
          ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle/passive)'],
        ]}
      />
    </TableAside>
    <P id="indicatives.p.aorist-deserves-introduction">
      The <strong>aorist</strong> deserves an introduction, since English has no tense by that name. It is
      the plain past — "I loosed," the action viewed as a simple whole — and it is the workhorse past tense
      of the New Testament. Contrast the imperfect: <Gk>ἐλύομεν</Gk> "we <em>were</em> loosing" (a process
      unrolling) vs. <Gk>ἐλύσαμεν</Gk> "we loosed" (done, whole, one event). And the <strong>perfect</strong> is
      "I <em>have</em> loosed" — a past act whose result still stands; its extra signature is
      <strong> reduplication</strong>, a doubled first consonant at the front: <Gk>λέ‑λυκα</Gk>.
    </P>
    <P id="indicatives.p.each-tense-modifies">Each tense modifies the base paradigms according to a fixed recipe:</P>
    <TableAside
      beginning={<>
        <p><Tr id="indicatives.as.build-any-tense">Build any tense from the present/imperfect base plus the modification shown.</Tr></p>
        <Ex grc="ἔλυον → ἔλυσα" en={<Tr id="indicatives.ex.aorist-loosed">+ σα = aorist “I loosed”</Tr>} />
        <Ex grc="λύω → λύσω" en={<Tr id="indicatives.ex.future-will-loose">+ σ = future “I will loose”</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.run-backwards-parse">Run it backwards to parse an unknown form: strip the ending, spot the marker, subtract it, and you're left with the lexical stem to look up.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t5" tCols={[0, 1]} flush title="Applying Tense Identifiers to Endings" headers={['Tense','Modification to Base Endings']}
        rows={[
          ['Aorist active','Replace connecting vowel with σα  →  use Imperfect endings'],
          ['Aorist middle','Replace connecting vowel with σα  →  use Imperfect endings'],
          ['Aorist passive','Replace connecting vowel with θη  →  use Imperfect endings'],
          ['Perfect active','Replace connecting vowel with κα  →  use Imperfect endings'],
          ['Future active','Insert σ before connecting vowel  →  use Present endings'],
          ['Future middle','Insert σ before connecting vowel  →  use Present endings'],
          ['Future passive','Insert θησ before connecting vowel  →  use Present endings'],
          ['Perfect mid/pass','Delete connecting vowel  →  use Present endings'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p><Tr id="indicatives.as.when-future-aorist">When the <Gk>σ</Gk> of the future/aorist meets a stem consonant, the two merge into a single letter.</Tr></p>
        <Ex grc="γραφ + σω → γράψω" en={<Tr id="indicatives.ex.will-write">I will write</Tr>} />
        <Ex grc="κηρυκ + σω → κηρύξω" en={<Tr id="indicatives.ex.will-preach">I will preach</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.very-same-mergers">The very same mergers drive the dative plural (<Gk>‒σι</Gk>) and many 3rd-declension nominatives — one rule, several places.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t6" tCols={[]} flush title="Consonant + σ Combinations" headers={['Stem ends in','+ σ','Result']}
        rows={[
          ['π, β, φ','+ σ','ψ'],
          ['τ, δ, θ, ζ','+ σ','σ'],
          ['κ, γ, χ, σ','+ σ','ξ'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p><Tr id="indicatives.as.shows-moving-parts">This shows the moving parts of a verb: an <strong>augment</strong> (<Gk>ε‒</Gk>) goes on the <em>front</em> for past tenses, and the <strong>identifier</strong> (<Gk>σ / θ</Gk>) goes <em>after</em> the stem.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.passive-builds-middle">The passive builds on <Gk>θη / θησ</Gk>; the middle borrows the active's <Gk>σ</Gk> in the future and aorist. Stem + augment + identifier is the whole machine.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t7" tCols={[0]} flush title="Tense Stem Structure — λύ‒" headers={['Tense','Active','Middle','Passive']}
        rows={[
          ['Present','λυ','λυ','λυ'],
          ['Future','λυ‒σ','λυ‒σ','λυ‒θησ'],
          ['Imperfect','ε‒λυ','ε‒λυ','ε‒λυ'],
          ['Aorist','ε‒λυ‒σ','ε‒λυ‒σ','ε‒λυ‒θ'],
        ]}
        note="ε = augment (past tenses); σ / θησ / θ = tense identifier"
      />
    </TableAside>

    {/* ── 6 · Voice ──────────────────────────────────────── */}
    <DropdownPractice id="indicatives.d3"
      title="Practice — name the tense"
      intro={<Tr id="indicatives.intro.augment-identifier-reduplication">Augment? Identifier? Reduplication? Read the machine.</Tr>}
      options={["Present", "Imperfect", "Future", "Aorist", "Perfect", "Aorist passive", "Future passive"]}
      items={[
        { q: <span className="normal-case">λύσομεν</span>, answer: "Future" },
        { q: <span className="normal-case">ἐλύσατε</span>, answer: "Aorist" },
        { q: <span className="normal-case">λελύκαμεν</span>, answer: "Perfect" },
        { q: <span className="normal-case">ἐλύετο</span>, answer: "Imperfect" },
        { q: <span className="normal-case">λυθήσεται</span>, answer: "Future passive" },
        { q: <span className="normal-case">ἐλύθη</span>, answer: "Aorist passive" },
      ]}
    />

    <SectionHeading id="indicatives.h.voice-who-does">Voice: who does, who receives</SectionHeading>
    <P id="indicatives.p.english-two-voices">
      English has two <Term t="voice">voices</Term>: active ("the dog bit the man") and passive ("the man
      was bitten"). Greek adds a third, the <strong>middle</strong>, where the subject acts with some
      self-involvement — often "for oneself." In the present and imperfect the middle and passive share the
      same forms, so context decides; in the future and aorist they split apart. Here is the whole system at
      a glance, on one verb in the first person:
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="indicatives.al.read-across-voices">Read across the voices</Tr></AsideLabel>
        <p><Tr id="indicatives.as.active-loose-subject"><strong>Active</strong> = "I loose" (subject acts) · <strong>Middle</strong> = "I loose myself / for myself" · <strong>Passive</strong> = "I am loosed" (subject is acted on).</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.middle-often-means">The middle often means acting <em>in one's own interest</em>. The future/aorist passive show the <Gk>θη</Gk> marker (<Gk>λυθήσομαι, ἐλύθην</Gk>).</Tr></p>
        <p><Tr id="indicatives.as.many-middle-looking">Many middle-looking forms are simply <strong>deponents</strong> with an active meaning — see the Deponents tab.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t8" tCols={[0, 1, 3]} flush title="Full Tense & Voice Paradigm — λύω (1st sg.)" headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Present','Active','λύ|ω','I loose'],
          ['','Middle','λύ|ομαι','I loose myself'],
          ['','Passive','λύ|ομαι','I am being loosed'],
          ['Future','Active','λύ|σ|ω','I will loose'],
          ['','Middle','λύ|σ|ομαι','I will loose myself'],
          ['','Passive','λυ|θήσ|ομαι','I will be loosed'],
          ['Imperfect','Active','ἔλυ|ον','I was loosing'],
          ['','Middle','ἐλυ|όμην','I was loosing myself'],
          ['','Passive','ἐλυ|όμην','I was being loosed'],
          ['Aorist','Active','ἔλυ|σα|','I loosed'],
          ['','Middle','ἐλυ|σά|μην','I loosed myself'],
          ['','Passive','ἐλύ|θη|ν','I was loosed'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p><Tr id="indicatives.as.perfect-completed-past">Perfect = "I have ‒ed": a completed past act with a result that <em>still stands</em>. Its front-of-word flag is <strong>reduplication</strong> (<Gk>λε‒λυκα</Gk>).</Tr></p>
        <p><Tr id="indicatives.as.pluperfect-had-same">Pluperfect = "I had ‒ed": the same idea one step further back in time.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.perfect-stresses-present">The perfect stresses the <strong>present state</strong> produced by a past action — <Gk>γέγραπται</Gk> "it stands written." That resultative force is why it matters exegetically.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t9" tCols={[0, 1, 3]} flush title="Perfect & Pluperfect — λύω" headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Perfect','Active','λέλυ|κα|','I have loosed'],
          ['','Middle','λέλυ|μαι','I have loosed myself'],
          ['','Passive','λέλυ|μαι','I have been loosed'],
          ['Pluperfect','Active','ἐλελύ|κ|ειν','I had loosed'],
          ['','Middle','ἐλελύ|μην','I had loosed myself'],
          ['','Passive','ἐλελύ|μην','I had been loosed'],
        ]}
      />
    </TableAside>

    {/* ── 7 · Worked example ─────────────────────────────── */}
    <DropdownPractice id="indicatives.d4"
      title="Practice — name the voice"
      options={["Active — subject acts", "Middle/Passive form", "Passive (θη-form)"]}
      items={[
        { q: <span className="normal-case">λύει</span>, answer: "Active — subject acts" },
        { q: <span className="normal-case">λύεται</span>, answer: "Middle/Passive form" },
        { q: <span className="normal-case">λυθήσεται</span>, answer: "Passive (θη-form)" },
        { q: <span className="normal-case">ἐλύθησαν</span>, answer: "Passive (θη-form)" },
        { q: <span className="normal-case">λύομαι</span>, answer: "Middle/Passive form" },
        { q: <span className="normal-case">ἔλυσεν</span>, answer: "Active — subject acts" },
      ]}
    />

    <LevelOnly level="beginning">
    <SectionHeading id="indicatives.h.reading-machine-worked">Reading the machine: a worked example</SectionHeading>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="indicatives.al.step-step">Step by step</Tr></AsideLabel>
        <p><Tr id="indicatives.as.front-augment-past"><strong>1.</strong> Front: <Gk>ἐ‑</Gk> — an augment. Past time.</Tr></p>
        <p><Tr id="indicatives.as.middle-aorist-flag"><strong>2.</strong> Middle: <Gk>‑σα‑</Gk> — the aorist flag. Simple past, active or middle.</Tr></p>
        <p><Tr id="indicatives.as.end"><strong>3.</strong> End: <Gk>‑μεν</Gk> — "we."</Tr></p>
        <p><Tr id="indicatives.as.assemble-loosed-every">Assemble: "<strong>we loosed</strong>." Every regular verb in the indicative yields to these three questions: front? middle? end?</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="indicatives.as.same-scan-reverse">The same scan in reverse tells you what to look up: strip <Gk>ἐ‑</Gk> and <Gk>‑σα‑</Gk> and <Gk>‑μεν</Gk>, and the remainder <Gk>λυ‑</Gk> is the lexical stem → <Gk>λύω</Gk> in the dictionary.</Tr></p>
      </>}
    >
      <MorphTable id="indicatives.t10" tCols={[1]} flush title="Worked example — ἐλύσαμεν" headers={['Piece','What it says']} firstColIsData
        rows={[
          ['ἐ‑', 'augment → past time'],
          ['λυ‑', 'stem → “loose”'],
          ['‑σα‑', 'tense identifier → aorist'],
          ['‑μεν', 'ending → “we”'],
        ]}
        note="ἐ + λυ + σα + μεν = “we loosed”"
      />
    </TableAside>

    </LevelOnly>
    {/* ── 8 · Watch out ──────────────────────────────────── */}
    <SectionHeading id="indicatives.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="indicatives.wo.imperfect-identical-was">The 1st sg. and 3rd pl. imperfect are identical (<Gk>ἔλυον</Gk> = "I was loosing" <em>or</em> "they were loosing") — context decides.</Tr></li>
        <li><Tr id="indicatives.wo.initial-long-vowel">An initial long vowel may <em>be</em> the augment in disguise: <Gk>ἤκουον</Gk> comes from <Gk>ἀκούω</Gk>.</Tr></li>
        <li><Tr id="indicatives.wo.movable-cosmetic-carries">The movable <Gk>ν</Gk> on <Gk>λύουσι(ν), ἐστί(ν)</Gk> is cosmetic — it carries no meaning.</Tr></li>
        <li><Tr id="indicatives.wo.present-future-differ">Present and future differ by one letter (<Gk>λύω / λύσω</Gk>) — and with some stems the <Gk>σ</Gk> hides inside a merged letter (<Gk>γράψω</Gk>).</Tr></li>
        <li><Tr id="indicatives.wo.augment-never-appears">An augment <em>never</em> appears outside the indicative — if a "past-looking" form turns up in a command or infinitive, the augment is not what you are seeing.</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 9 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning">
    <SectionHeading id="indicatives.h.try">Try it</SectionHeading>
    <Practice id="indicatives.pr1"
      title="Practice A — parse the verb"
      intro={<Tr id="indicatives.intro.give-tense-voice">Give the tense, voice, person, and a translation. Ask the three questions: front? middle? end?</Tr>}
      items={[
        { q: <span className="normal-case">λύεις</span>,
          a: <Tr id="indicatives.pa.present-active-loose">Present active, 2nd sg. — "you loose / are loosing." No augment, no identifier.</Tr>},
        { q: <span className="normal-case">ἐλύετο</span>,
          a: <Tr id="indicatives.pa.imperfect-middle-passive">Imperfect middle/passive, 3rd sg. — "he was being loosed" (or middle "was loosing for himself"). Augment + no identifier.</Tr>},
        { q: <span className="normal-case">λύσομεν</span>,
          a: <Tr id="indicatives.pa.future-active-will">Future active, 1st pl. — "we will loose." The <span className="normal-case">σ</span> with <em>no augment</em> = future.</Tr>},
        { q: <span className="normal-case">ἐλύθη</span>,
          a: <Tr id="indicatives.pa.aorist-passive-she">Aorist passive, 3rd sg. — "he/she/it was loosed." Augment + <span className="normal-case">θη</span>.</Tr>},
        { q: <span className="normal-case">λελύκατε</span>,
          a: <Tr id="indicatives.pa.perfect-active-loosed">Perfect active, 2nd pl. — "you have loosed." Reduplication (<span className="normal-case">λε‑</span>) + <span className="normal-case">κα</span>.</Tr>},
        { q: <span className="normal-case">ἠκούσατε</span>,
          a: <Tr id="indicatives.pa.aorist-active-heard">Aorist active, 2nd pl. of <span className="normal-case">ἀκούω</span> — "you heard." The lengthened <span className="normal-case">ἠ‑</span> is the augment on a vowel-initial verb.</Tr>},
      ]}
    />
    <Practice id="indicatives.pr2"
      title="Practice B — translate the sentence"
      intro={<Tr id="indicatives.intro.vocabulary-writes-believe">Vocabulary: <span className="normal-case">γράφει</span> "writes" · <span className="normal-case">πιστεύομεν</span> "we believe" · <span className="normal-case">σώσει</span> "will save" · <span className="normal-case">ἐδίδασκεν</span> "was teaching."</Tr>}
      items={[
        { q: <span className="normal-case">ὁ ἀπόστολος γράφει τοῖς ἀδελφοῖς.</span>,
          a: <Tr id="indicatives.pa.apostle-writes-writing">"The apostle writes (is writing) to the brothers."</Tr>},
        { q: <span className="normal-case">ἐδίδασκεν ὁ κύριος τὸν ὄχλον.</span>,
          a: <Tr id="indicatives.pa.lord-was-teaching">"The Lord was teaching the crowd" — imperfect: an ongoing scene, not a single event.</Tr>},
        { q: <span className="normal-case">πιστεύομεν τῷ λόγῳ τοῦ θεοῦ.</span>,
          a: <Tr id="indicatives.pa.believe-word-god">"We believe the word of God" (dative after <span className="normal-case">πιστεύω</span>).</Tr>},
        { q: <span className="normal-case">ὁ θεὸς σώσει τὸν λαὸν αὐτοῦ.</span>,
          a: <Tr id="indicatives.pa.god-will-save">"God will save his people" — future (<span className="normal-case">σώ‑σ‑ει</span>).</Tr>},
        { q: <span className="normal-case">ἐλύθησαν οἱ δοῦλοι.</span>,
          a: <Tr id="indicatives.pa.servants-were-loosed">"The servants were loosed / set free" — aorist passive plural.</Tr>},
      ]}
    />

    {/* ── 10 · See it in the NT ──────────────────────────── */}
    <ClassSentences id="indicatives.cs2"
      lesson="Lessons 5–6 · The tenses"
      items={[
        { words: [
          { w: "ἐβάπτιζεν", parsing: "Impf Act Ind 3 Sg — βαπτίζω", gloss: "he was baptising" },
          { w: "τοὺς", parsing: "Article — Acc Pl Masc", gloss: "the" },
          { w: "μαθητάς.", parsing: "Acc Pl Masc — μαθητής", syntax: "Direct Object", gloss: "disciples" },
        ],
          translation: "He was baptising the disciples.",
          note: "Imperfect: the ἐ- augment + primary stem = ongoing past action.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "θεὸς", parsing: "Nom Sg Masc — θεός", syntax: "Subject", gloss: "God" },
          { w: "σώσει", parsing: "Fut Act Ind 3 Sg — σῴζω", gloss: "will save" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λαὸν", parsing: "Acc Sg Masc — λαός", syntax: "Direct Object", gloss: "people" },
          { w: "αὐτοῦ.", parsing: "Gen Sg Masc — αὐτός", syntax: "Genitive of Possession", gloss: "his" },
        ],
          translation: "God will save his people.",
        },
        { words: [
          { w: "διὰ", parsing: "Preposition + accusative", gloss: "because of" },
          { w: "τὸ", parsing: "Article — Acc Sg Neut", gloss: "the" },
          { w: "εὐαγγέλιον", parsing: "Acc Sg Neut — εὐαγγέλιον", gloss: "gospel" },
          { w: "ἐπιστεύσαμεν.", parsing: "Aor Act Ind 1 Pl — πιστεύω", gloss: "we believed" },
        ],
          translation: "We believed because of the gospel.",
        },
        { words: [
          { w: "βεβαπτίσμεθα", parsing: "Perf Mid/Pass Ind 1 Pl — βαπτίζω", gloss: "we have been baptised" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "into" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "Χριστόν.", parsing: "Acc Sg Masc — Χριστός", gloss: "Christ" },
        ],
          translation: "We have been baptised into Christ.",
          note: "Perfect: reduplication (βε-) + completed action with continuing result.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "ἀσθενὴς", parsing: "Nom Sg Masc — ἀσθενής (adjective as noun)", syntax: "Subject", gloss: "weak man" },
          { w: "ἠνέχθη", parsing: "Aor Pass Ind 3 Sg — φέρω (irregular)", gloss: "was carried" },
          { w: "ὑπὸ", parsing: "Preposition + genitive (agent)", gloss: "by" },
          { w: "τῶν", parsing: "Article — Gen Pl Masc", gloss: "the" },
          { w: "ἀδελφῶν", parsing: "Gen Pl Masc — ἀδελφός", gloss: "brothers" },
          { w: "αὐτοῦ.", parsing: "Gen Sg Masc — αὐτός", syntax: "Genitive of Possession", gloss: "his" },
        ],
          translation: "The weak man was carried by his brothers.",
          note: "ὑπό + genitive marks the agent of a passive verb.",
        },
      ]}
    />

    </LevelOnly>
    <HomeworkAssignments chapter="indicatives" />

    <LiveExamples
      intro={<Tr id="indicatives.intro.tense-system-wild">The tense system in the wild — every hit is a real NT verb you can now decode.</Tr>}
      links={[
        { label: <Tr id="indicatives.le.aorist">Aorist indicatives — the narrative workhorse (spot the augments)</Tr>, features: ['verb', 'aorist', 'indicative'] },
        { label: <Tr id="indicatives.le.imperfect">Imperfects — ongoing past scenes ("was …ing")</Tr>, features: ['verb', 'imperfect', 'indicative'] },
        { label: <Tr id="indicatives.le.perfect">Perfects — completed acts whose results stand</Tr>, features: ['verb', 'perfect', 'indicative'] },
        { label: <Tr id="indicatives.le.future">Future indicatives — promises and predictions</Tr>, features: ['verb', 'future', 'indicative'] },
      ]}
    />

    {/* ── 11 · Going deeper (Intermediate only) ──────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="indicatives.h.going-deeper-tense">Going deeper: tense as interpretation</SectionHeading>
      <P id="indicatives.p.aspect-over-time">
        <strong>Aspect over time.</strong> In the indicative Greek tense marks both time and
        {' '}<Term t="aspect">aspect</Term>, but aspect is the deeper category: the imperfect paints a process,
        the aorist reports a whole, the perfect asserts a standing result. When Mark writes
        <Gk> ἐδίδασκεν</Gk> ("he was teaching"), he is setting a scene; when he switches to aorists, events
        march. Watching an author alternate imperfect and aorist is watching him direct your attention.
      </P>
      <P id="indicatives.p.historical-present-mark">
        <strong>The historical present.</strong> Mark loves narrating the past in the present tense —
        <Gk> λέγει αὐτῷ</Gk>, "he <em>says</em> to him" — the way an excited storyteller slips into "so then
        he <em>says</em> to me…". Translate as past, but notice the vividness the choice adds.
      </P>
      <P id="indicatives.p.divine-passive-passive">
        <strong>The divine passive.</strong> A passive with no agent stated often implies God as the actor:
        <Gk> ἠγέρθη</Gk>, "he <em>was raised</em>" (Rom 4:25) — raised <em>by God</em>. Jewish reverence for
        the divine name made this a natural idiom, and the NT uses it constantly in promises: "they shall be
        comforted" (Matt 5:4) — by whom? Exactly.
      </P>
      <P id="indicatives.p.caution-tense-choices">
        <strong>A caution.</strong> Tense choices are only exegetically loaded where the author had a live
        choice. Much aorist usage is simply default narration — resist sermons built on "the aorist means
        once-for-all." It doesn't; it means the author viewed the action as a whole.
      </P>
    </LevelOnly>
  </>
)
