/* ─────────────────────────────────────────────
   Morphology explanations — Beginning / Intermediate

   Plain-English teaching notes for each Morphology tab, written at a
   first-year level. Two registers per topic:

     • beginning     — what it is, what to look for, one simple example
                       (mirrors the "Eight Minimums" / "Endings Overview"
                       recognition-and-parse approach)
     • intermediate  — the functions/uses and the nuances a student meets
                       next (mirrors the Wallace-based syntax summaries)

   Content is keyed two ways:
     ESS_EXPLANATIONS   — Essentials sub-sections, keyed by section id (1–8)
     TAB_EXPLANATIONS   — every other topic tab, keyed by MainTab id
───────────────────────────────────────────── */

import React from 'react'
import { ChevronRight } from 'lucide-react'

export type MorphLevel = 'beginning' | 'intermediate'

export interface Explanation {
  beginning: React.ReactNode
  intermediate: React.ReactNode
}

/* ── small prose helpers ─────────────────────── */

/** A paragraph of teaching prose. */
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-gray-700">{children}</p>
}

/** An illustrative example, set off with a left rule. Use for the "simple
 *  English example" that anchors each explanation. */
function Eg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-gray-600 border-l-2 border-brand-200 pl-3">
      <span className="font-semibold text-gray-500 mr-1.5 text-xs uppercase tracking-wide">e.g.</span>
      {children}
    </p>
  )
}

/** Greek run kept in normal case (defensive — body text is not uppercased,
 *  but this keeps intent explicit and future-proofs against style changes). */
function G({ children }: { children: React.ReactNode }) {
  return <span className="normal-case">{children}</span>
}

/** A memory hook — the kind of "How to remember" mnemonic used in class. */
function Hook({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-gray-700 rounded-md bg-surface border border-brand-200 px-2.5 py-1.5">
      <span className="font-semibold text-brand-700 mr-1.5 text-xs uppercase tracking-wide">Remember</span>
      {children}
    </p>
  )
}

/* A small wrapper so each explanation is a consistently-spaced stack. */
function Note({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

/** One syntax category: bold name — short gloss (optional simple example). */
function Cat({ name, children, eg }: { name: React.ReactNode; children: React.ReactNode; eg?: React.ReactNode }) {
  return (
    <li className="text-sm leading-snug text-gray-700">
      <span className="font-semibold text-gray-900">{name}</span> — {children}
      {eg && <span className="text-gray-500"> — <em>{eg}</em></span>}
    </li>
  )
}

/** A group of categories. When it has a label it is a click-to-expand
 *  disclosure (collapsed by default) so long lists stay compact; an unlabelled
 *  group renders as a plain list. */
function CatGroup({ label, children }: { label?: React.ReactNode; children: React.ReactNode }) {
  if (!label) {
    return <ul className="space-y-1 list-disc list-outside pl-5 marker:text-brand-300">{children}</ul>
  }
  return (
    <details className="group border-t border-brand-100 pt-1.5">
      <summary className="flex items-center gap-1 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden text-xs font-semibold uppercase tracking-wide text-brand-700 py-0.5">
        <ChevronRight size={13} className="shrink-0 transition-transform duration-150 group-open:rotate-90" />
        {label}
        <span className="ml-1 normal-case font-normal text-gray-400">({React.Children.count(children)})</span>
      </summary>
      <ul className="mt-1.5 space-y-1 list-disc list-outside pl-5 marker:text-brand-300">{children}</ul>
    </details>
  )
}

/* ─────────────────────────────────────────────
   Essentials 1–8
───────────────────────────────────────────── */

export const ESS_EXPLANATIONS: Record<number, Explanation> = {
  1: {
    beginning: (
      <Note>
        <P>Greek nouns change their <strong>endings</strong> to show their job in a sentence (this is called <strong>case</strong>). The 1st and 2nd declensions are the two most common ending patterns. Masculine and neuter nouns usually use 2nd-declension endings (<G>‑ος, ‑ον</G>); feminine nouns usually use 1st-declension endings (<G>‑η / ‑α</G>). Look at the last letter or two to find the case.</P>
        <Eg>English does a tiny version of this: <em>he / him / his</em> is one word wearing three different endings for three different jobs. Greek does it to every noun.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The case names a noun's function: <strong>Nominative</strong> = subject, <strong>Genitive</strong> = "of" (possession/source), <strong>Dative</strong> = "to/for" (indirect object), <strong>Accusative</strong> = direct object. Two shortcuts save memory work: the neuter matches the masculine everywhere <em>except</em> the nominative and accusative, and the neuter nominative and accusative are always identical.</P>
        <P>Because endings repeat across genders (<G>‑ων</G> is the genitive plural for all three), let the <strong>article</strong> and context — not the bare ending — settle an ambiguous form.</P>
      </Note>
    ),
  },
  2: {
    beginning: (
      <Note>
        <P>The 3rd declension is the "irregular-looking" group, but its endings are actually very consistent. The trick is that the noun's <strong>stem</strong> is often hidden. You find it by dropping <G>‑ος</G> from the genitive singular.</P>
        <Eg><G>σάρξ, σαρκός</G> → stem <G>σαρκ‑</G>. Learn the endings, then attach them to that stem. English does something similar with <em>ox → oxen</em> or <em>foot → feet</em> — a few nouns reshape before adding an ending.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Because the nominative singular often disguises the stem (letters collide when <G>‑ς</G> is added — <G>‑τ, ‑δ, ‑θ</G> drop out before <G>‑ς</G>), always parse a 3rd-declension noun from its <strong>genitive</strong>, not its nominative.</P>
        <P>The dative plural <G>‑σι(ν)</G> triggers the very same consonant + <G>σ</G> changes you meet in the future and aorist of verbs. Neuter nouns keep the two universal rules: nom. = acc., and the plural nom./acc. ends in <G>‑α</G>.</P>
      </Note>
    ),
  },
  3: {
    beginning: (
      <Note>
        <P>These are the two <strong>base</strong> sets of personal endings — every other tense is built from them. Personal endings tell you <strong>who</strong> acts (I, you, he/she/it, we, you-all, they). "Primary" endings go on present/future (non-past); "secondary" endings go on past tenses. The imperfect also adds an <G>ε‑</G> (an <strong>augment</strong>) to the front to mark past time.</P>
        <Eg>Active endings = the subject <em>does</em> the action; middle/passive endings = the subject <em>receives</em> it (or acts on itself).</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Master these two rows and you can rebuild the whole indicative system: the aorist, future, and perfect simply insert a tense marker and then <em>reuse these same endings</em>. The augment (<G>ε‑</G>, or a lengthened initial vowel) is the single most reliable signal of a past-time indicative.</P>
        <P>The 2nd-person middle forms (<G>‑ῃ / ‑ου</G>) look irregular because an <G>σ</G> between vowels dropped out — knowing that explains the odd spelling instead of forcing you to memorize it cold.</P>
      </Note>
    ),
  },
  4: {
    beginning: (
      <Note>
        <P>A <strong>tense identifier</strong> is a tell-tale letter (or two) added to a verb's stem that signals its tense. Learn these "flags" and you can spot a verb's tense at a glance: <G>‑σ‑</G> = future, <G>‑σα‑</G> = aorist active/middle, <G>‑θη‑</G> = aorist passive, <G>‑κα‑</G> = perfect active.</P>
        <Eg><G>λύω</G> "I loose" → <G>λύσω</G> has <G>‑σ‑</G>, so it is future: "I <em>will</em> loose."</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Identifiers sit <em>between</em> the stem and the personal ending, so parsing is a two-step scan: (1) find the identifier for tense/voice, (2) read the ending for person/number.</P>
        <P>Watch for reduced forms — the <G>σ</G> of <G>‑σα</G> or the <G>θ</G> of <G>‑θη</G> can drop or assimilate next to certain endings, so recognize the <em>family</em> (σ-cluster = aorist, θ-cluster = passive) rather than an exact string. The perfect's reduplication (<G>λε‑λυ‑κα</G>) is a second, front-of-word flag reinforcing the <G>‑κα</G>.</P>
      </Note>
    ),
  },
  5: {
    beginning: (
      <Note>
        <P>This is the "recipe" for building any tense: start from the present or imperfect endings, then modify the connecting vowel with the right identifier. Past tenses (secondary) build on <strong>imperfect</strong> endings; non-past (primary) build on <strong>present</strong> endings.</P>
        <Eg>To make the aorist active, take the imperfect endings and swap the connecting vowel for <G>‑σα</G>: <G>ἔλυον</G> → <G>ἔλυσα</G>, "I loosed."</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The system is economical — you never memorize a brand-new paradigm, only a <em>transformation</em> applied to a base. "Insert" operations (future) keep primary endings; "replace" operations (aorist/perfect) reshape the connecting vowel and take secondary endings.</P>
        <P>Once this clicks, an unfamiliar form can be reverse-engineered: strip the ending, identify the marker, subtract it, and you are left with the lexical stem to look up in a dictionary.</P>
      </Note>
    ),
  },
  6: {
    beginning: (
      <Note>
        <P>A <strong>participle</strong> is a verbal adjective — an "‑ing" or "‑ed" word (loosing, loosed) that still describes a noun, so it takes noun-like endings for gender, case, and number. Know two patterns: the participle of <G>εἰμί</G> (<G>ὤν, οὖσα, ὄν</G> = "being"), and the middle/passive participle, which always contains the giveaway chunk <G>‑μεν‑</G> (<G>λυόμενος</G> = "being loosed").</P>
        <Eg>"The <em>running</em> water," "a <em>broken</em> cup" — participles describing nouns.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Spotting <G>‑μεν‑</G> instantly narrows a participle to middle/passive; its absence points to active. Active participles decline on a 3rd-declension pattern (masc./neut.) plus 1st-declension (fem.), which is why <G>‑ντ‑</G> surfaces (<G>λύο‑ντ‑ος</G>).</P>
        <P>Participles carry tense (aspect) and voice but no person, so translate them <em>relative to the main verb</em>: a present participle = same time / ongoing, an aorist participle = usually prior / completed action.</P>
      </Note>
    ),
  },
  7: {
    beginning: (
      <Note>
        <P>The <strong>subjunctive</strong> is the mood of "might / should" (potential, not fact); its flag is a <strong>lengthened</strong> connecting vowel (<G>ω/η</G> where the indicative had <G>ο/ε</G>). The <strong>imperative</strong> is the mood of commands ("Loose!"). For the imperative, memorize two endings: 3rd singular <G>‑τω</G> and 3rd plural <G>‑τωσαν</G>.</P>
        <Hook>The subjunctive usually announces itself with a "<strong>flag word</strong>" just before it — <G>ἵνα</G> / <G>ὅπως</G> (purpose) or <G>ἄν</G> / <G>ἐάν</G> (indefinite / conditional).</Hook>
        <Eg><G>εἰμί</G> has its own subjunctive worth learning: <G>ὦ, ᾖς, ᾖ…</G></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The subjunctive's long vowel is the whole tell — and <strong>no augment ever appears</strong>, even in the aorist subjunctive, because these moods express aspect, not time. So aorist subjunctive/imperative describe a single, whole action, while present forms describe ongoing action: the difference is <em>kind</em> of action, not <em>when</em>.</P>
        <P>Greek's third-person imperative (<G>‑τω</G>, "let him…") has no clean English equal, so translate with "let / should."</P>
      </Note>
    ),
  },
  8: {
    beginning: (
      <Note>
        <P>A small but very common group of verbs ends in <G>‑μι</G> instead of <G>‑ω</G>: <G>δίδωμι</G> "I give," <G>τίθημι</G> "I put," <G>ἵστημι</G> "I stand." They look strange because in the present and imperfect they <strong>reduplicate</strong> with an iota (<G>δι‑δω‑μι</G>) and their stem vowel shifts short/long (<G>δο/δω</G>).</P>
        <Hook><G>‑μι</G> verbs have <strong>two stems</strong>: the <strong>present stem</strong> (longer) covers present + imperfect; the <strong>verbal stem</strong> (shorter) covers future, aorist + perfect.</Hook>
        <Eg>Good news: outside the present and imperfect, <G>‑μι</G> verbs behave almost like normal <G>‑ω</G> verbs.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The iota-reduplication is a <strong>present/imperfect-only</strong> flag — see it and you know the tense system; lose it and you are in the aorist/future/perfect, where μι-verbs act regularly on the short stem.</P>
        <P>Their aorist marker is <G>‑κα</G>, not <G>‑σα</G> (<G>ἔδωκα, ἔθηκα</G>), which is why their aorists resemble perfects — use reduplication and context to tell the two apart.</P>
      </Note>
    ),
  },
}

/* ─────────────────────────────────────────────
   Main topic tabs (all except Essentials)
───────────────────────────────────────────── */

export const TAB_EXPLANATIONS: Record<string, Explanation> = {
  nouns: {
    beginning: (
      <Note>
        <P>Greek nouns and adjectives share the same endings, so learning one set covers both. Every noun has a <strong>gender</strong> (masculine, feminine, neuter), and it shows its job by its <strong>case ending</strong>, not by word order as in English. The article ("the": <G>ὁ, ἡ, τό</G>) agrees with its noun in gender, case, and number — so it is your best clue when parsing. An adjective must "agree" with the noun it describes in the same three ways.</P>
        <Hook>Three steps to translation: (1) work out the <strong>case</strong> of each word, (2) work out <strong>why</strong> it has that case, (3) then translate. And watch the breathings — <G>ἐν</G> "in" vs. <G>ἕν</G> "one," <G>εἰς</G> "into" vs. <G>εἷς</G> "one."</Hook>
        <Eg><G>καλὸς λόγος</G> = "a good word." Change the noun's case and the adjective changes to match.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Each case does more than one job. These are the <strong>Essential Syntax Categories</strong> (after Wallace) — the functions you learn to name when you move from parsing to interpreting.</P>
        <CatGroup label="Nominative — the naming case">
          <Cat name="Subject">the doer of a finite verb</Cat>
          <Cat name="Predicate Nominative" eg="“the Word was God,” John 1:1">renames the subject through an equative verb (<G>εἰμί, γίνομαι</G>)</Cat>
          <Cat name="Nominative Absolute">a naming nominative in titles / salutations (not in a full sentence)</Cat>
          <Cat name="Nominative for Vocative" eg="“O foolish Galatians!”">a nominative used for direct address</Cat>
        </CatGroup>
        <CatGroup label="Genitive — description & separation (“of”)">
          <Cat name="Possessive" eg="“his ear”">the head noun belongs to the genitive</Cat>
          <Cat name="Descriptive">a loose “characterized by” quality (the catch-all genitive)</Cat>
          <Cat name="Relationship" eg="Σίμων Ἰωάννου, “Simon [son] of John”">family relation</Cat>
          <Cat name="Partitive" eg="“half of my possessions”">the whole of which the head noun is a part</Cat>
          <Cat name="Apposition" eg="“the sign, namely circumcision”">the genitive is the same thing / a specific example of the head noun</Cat>
          <Cat name="Comparison" eg="“greater than the angels”">the standard after a comparative adjective (“than”)</Cat>
          <Cat name="Subjective" eg="“the revelation of Jesus” = Jesus reveals">acts as the subject of the idea in a verbal head noun</Cat>
          <Cat name="Objective" eg="“blasphemy of the Spirit” = blaspheming the Spirit">acts as the object of that idea</Cat>
          <Cat name="Genitive of Time">the kind of time / time <em>within which</em></Cat>
          <Cat name="Genitive Absolute">a detached genitive noun + participle giving background (see Participles)</Cat>
          <Cat name="After certain verbs / prepositions">as a direct object (sensation, sharing, ruling…) or governed by a preposition</Cat>
        </CatGroup>
        <CatGroup label="Dative — the “to / for / with / by” case">
          <Cat name="Indirect Object" eg="“he gave the book to me”">the person to/for whom</Cat>
          <Cat name="Interest">advantage (“for” someone) or disadvantage (“against” someone)</Cat>
          <Cat name="Reference / Respect" eg="“dead to sin”">“with respect to”</Cat>
          <Cat name="Possession">the possessor with an equative verb</Cat>
          <Cat name="Sphere" eg="“pure in heart”">the realm in which something is true</Cat>
          <Cat name="Dative of Time">the point in time <em>at which</em></Cat>
          <Cat name="Means / Instrument" eg="“with a word”">the plain dative = “by/with”</Cat>
          <Cat name="Direct Object / after prepositions">verbs and prepositions that govern the dative</Cat>
        </CatGroup>
        <CatGroup label="Accusative — extent & limitation">
          <Cat name="Direct Object" eg="“God loved the world”">what receives a transitive verb's action</Cat>
          <Cat name="Double Accusative">two objects: person + thing (“he teaches you Greek”), or object + complement (“they called him Lord”)</Cat>
          <Cat name="Measure" eg="“forty days,” “a day's journey”">extent of time or space (“how long / how far”)</Cat>
          <Cat name="Subject of Infinitive" eg="“I want him to learn”">the accusative that acts as an infinitive's subject</Cat>
          <Cat name="After certain prepositions">prepositions that govern the accusative</Cat>
        </CatGroup>
        <Hook>Time expressions sort by case: "<strong>at</strong>" a point = dative · "<strong>during</strong>" = genitive · "<strong>how long</strong>" = accusative (<G>νυκτί</G> "at night" · <G>νυκτός</G> "during the night" · <G>νύκτα</G> "for the whole night").</Hook>
        <P><strong>The article</strong> also carries syntax. An adjective inside the article is <strong>attributive</strong> ("the good word"); outside it, <strong>predicate</strong> ("the word <em>is</em> good"). Two famous article rules: the <strong>Granville Sharp rule</strong> (one article joining two singular nouns points to one person) and <strong>Colwell's rule</strong> (an anarthrous predicate nominative before the verb can still be definite).</P>
      </Note>
    ),
  },
  pronouns: {
    beginning: (
      <Note>
        <P>A <strong>pronoun</strong> stands in for a noun ("he," "this," "who"). Like nouns, pronouns change endings for case, and they agree with what they replace in gender and number. <G>αὐτός</G> is the workhorse third-person pronoun ("he / she / it, they"). The personal pronouns <G>ἐγώ</G> ("I") and <G>σύ</G> ("you") simply have to be memorized.</P>
        <Eg><G>βλέπω αὐτόν</G> = "I see <em>him</em>" (accusative = the object).</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><G>αὐτός</G> does triple duty: alone in an oblique case = personal pronoun ("him"); in the attributive position (<G>ὁ αὐτός</G>) = "the same"; in the predicate position (<G>αὐτὸς ὁ…</G>) = intensive "himself."</P>
        <Hook>Is "himself" intensive or reflexive? <strong>Delete it.</strong> If the basic meaning is unchanged, it was intensive ("the king himself came"); if not, it was reflexive ("he saw himself"). And a very short word with a <em>rough</em> breathing is almost always a relative pronoun (<G>ὅς, ἥ, ὅ</G>).</Hook>
        <P>Distinguish <G>τις</G> (enclitic, unaccented = "someone / anyone") from <G>τίς</G> (accented = "who? what?") purely by the accent. Relative pronouns take their <em>gender and number</em> from their antecedent but their <em>case</em> from their own clause — a frequent parsing trap. And watch for forms of <G>οὗτος</G> that drop the <G>τ</G> (<G>οὗτος / αὕτη</G>).</P>
      </Note>
    ),
  },
  prepositions: {
    beginning: (
      <Note>
        <P><strong>Prepositions</strong> are little words that show relationships — direction, place, means ("into," "from," "with"). In Greek a preposition <strong>governs a case</strong>: the noun after it must be in the case that preposition requires, and the meaning depends on that case. Some take only one case; others take two or three, with a different meaning for each.</P>
        <Eg><G>ἐν</G> + dative = "in"; <G>εἰς</G> + accusative = "into." Learn each preposition together with its case(s) and gloss.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>A rough logic underlies the cases: <strong>genitive</strong> often = motion away / source, <strong>dative</strong> = position / rest, <strong>accusative</strong> = motion toward / extent. So with a three-case preposition like <G>ἐπί</G>, the case shifts the sense (<G>ἐπί</G> + gen. "on," + dat. "at," + acc. "onto / against").</P>
        <P>Prepositions also fuse onto verbs (compound verbs), strengthening or redirecting meaning. In Koine the edges blur — <G>εἰς</G> and <G>ἐν</G> overlap at times — so weigh context alongside the case.</P>
        <Hook>Where English uses "<strong>by</strong>" or "<strong>with</strong>" to show the instrument, Greek often needs <em>no preposition at all</em> — just the plain <strong>dative</strong> (<G>τῷ λόγῳ</G> = "with a word").</Hook>
      </Note>
    ),
  },
  conjunctions: {
    beginning: (
      <Note>
        <P>A <strong>conditional sentence</strong> has an "if" part (the <strong>protasis</strong>) and a "then" part (the <strong>apodosis</strong>). Greek uses different words and moods to show how likely the "if" is. <strong>First class</strong> (<G>εἰ</G> + indicative) assumes it is true for the sake of argument. <strong>Second class</strong> (<G>εἰ</G> + indicative … <G>ἄν</G>) is "contrary to fact." <strong>Third class</strong> (<G>ἐάν</G> + subjunctive) is the "maybe / future" condition.</P>
        <Hook>1st class = <G>εἰ</G> = <strong>One Word</strong> · 2nd class = <G>εἰ + ἄν</G> = <strong>Two Words</strong> · 3rd class = <G>ἐάν</G> = <strong>Three Letters</strong>.</Hook>
        <Eg>1st: "<em>If</em> you like Greek, you are wise" (says nothing about whether you actually do — <em>if</em> it's true, <em>then</em> the result follows). 3rd: "<em>If</em> you like Greek, you <em>will</em> learn it."</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Classify by the <strong>protasis</strong>: 1st class <G>εἰ</G> + indicative (assumed true <em>for the argument</em>, not necessarily factually true); 2nd class <G>εἰ</G> + past indicative with <G>ἄν</G> in the apodosis (contrary to fact — "if he were… but he isn't"); 3rd class <G>ἐάν</G> + subjunctive (probable / uncertain future, or a general truth).</P>
        <P>The class describes the speaker's <em>rhetorical stance</em>, not objective reality — a first-class condition can frame something the speaker knows is false, purely for argument.</P>
        <Hook>In English, a <strong>contrary-to-fact</strong> (2nd class) condition is marked by "<strong>would</strong>" in the apodosis: "If you had liked Greek, you <em>would</em> have learnt it." The <G>ἄν</G> is its Greek signal.</Hook>
      </Note>
    ),
  },
  'conj-adv': {
    beginning: (
      <Note>
        <P><strong>Conjunctions</strong> are joining words. <em>Coordinating</em> conjunctions link equal parts and often begin a main clause (<G>καί</G> "and," <G>ἀλλά</G> "but," <G>οὖν</G> "therefore"). <em>Subordinating</em> conjunctions start a dependent clause that cannot stand alone (<G>ὅτι</G> "that / because," <G>ἵνα</G> "in order that," <G>εἰ</G> "if"). <strong>Adverbs</strong> are different — they modify a verb, telling <em>how, when,</em> or <em>where</em> (<G>οὕτως</G> "thus," <G>τότε</G> "then," <G>ἐκεῖ</G> "there").</P>
        <Hook>Greek words ending in <G>‑ως</G> are usually <strong>adverbs</strong> — <G>καλῶς</G> "well," <G>οὕτως</G> "thus," <G>ὁμοίως</G> "likewise" (compare the adjective <G>καλός</G> "good"). Because word order is flexible, these connectors are your key to a sentence's logic.</Hook>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Conjunctions are the backbone of <strong>discourse analysis</strong>: they signal continuation (<G>καί, δέ</G>), contrast (<G>ἀλλά</G>), inference (<G>οὖν, διό</G>), and ground / explanation (<G>γάρ</G>), letting you trace an author's argument clause by clause.</P>
        <P>Some conjunctions predict the verb's mood — <G>ἵνα, ἐάν, ὅταν, ὅπως</G> typically take the subjunctive; <G>ὅτι, εἰ, καθώς</G> typically the indicative — so the conjunction previews the grammar. Set phrases like <G>διὰ τοῦτο</G> ("for this reason") or <G>διὰ τί</G> ("why?") often work as fixed discourse markers opening a new thought.</P>
      </Note>
    ),
  },
  indicatives: {
    beginning: (
      <Note>
        <P>The <strong>indicative</strong> is the mood of plain fact — it states what actually happens, happened, or will happen. This tab lays out <G>λύω</G> ("I loose") across all its tenses and voices as the model verb. For each form, focus on two things: the <strong>tense identifier</strong> (which tense/voice) and the <strong>personal ending</strong> (who). <G>εἰμί</G> ("I am") is irregular and worth memorizing on its own.</P>
        <Eg>"She <em>writes</em> / she <em>wrote</em> / she <em>will write</em>" — one verb, different tenses. Greek marks these on the verb itself.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>In the <em>indicative</em>, tense encodes both <strong>time</strong> and <strong>aspect</strong>. The same form can be put to several uses; naming the use is the interpretive step. These are the <strong>Essential Syntax Categories</strong> for the tenses (after Wallace).</P>
        <CatGroup label="Present (imperfective — ongoing)">
          <Cat name="Progressive" eg="“she is writing”">action in progress right now</Cat>
          <Cat name="Iterative">a repeated / habitual action</Cat>
          <Cat name="Extending-from-past">began in the past and continues ("I have been…")</Cat>
          <Cat name="Conative">attempted or about-to-begin action ("is trying to…")</Cat>
          <Cat name="Historical" eg="“Jesus says to them…”">a present-tense verb narrating a past event (vivid)</Cat>
          <Cat name="Futuristic">a present form referring to a certain future event</Cat>
        </CatGroup>
        <CatGroup label="Imperfect (past imperfective)">
          <Cat name="Progressive" eg="“he was teaching”">ongoing action in past time</Cat>
          <Cat name="Iterative">a repeated action in the past ("kept on…")</Cat>
          <Cat name="Ingressive / Inceptive" eg="“he began to speak”">focus on the start of the action</Cat>
          <Cat name="Conative">attempted past action ("was trying to…")</Cat>
        </CatGroup>
        <CatGroup label="Aorist (perfective — a whole action)">
          <Cat name="Constative">the action as a simple whole (the default aorist)</Cat>
          <Cat name="Ingressive" eg="“he became rich”">stresses entry into a state / action</Cat>
          <Cat name="Culminative">stresses the completed end-point</Cat>
          <Cat name="Gnomic">a timeless / proverbial truth</Cat>
          <Cat name="Epistolary">the writer's "now" written as a past ("I wrote")</Cat>
          <Cat name="Dramatic">an immediate past, stated for vividness</Cat>
        </CatGroup>
        <CatGroup label="Perfect & Future">
          <Cat name="Intensive Perfect" eg="“it stands finished”">stresses the resulting present state</Cat>
          <Cat name="Extensive Perfect">stresses the completed past act that produced the state</Cat>
          <Cat name="Predictive Future" eg="“he will come”">a plain prediction</Cat>
          <Cat name="Imperatival Future">a future used as a command ("you shall not…")</Cat>
          <Cat name="Deliberative Future">a real or rhetorical question ("what shall we do?")</Cat>
        </CatGroup>
        <P>Voice matters for exegesis too: a passive often hides its agent (the "divine passive" implying God). But reserve heavy tense-based theology for places where the author had a real choice of forms — much tense selection is just default narration.</P>
      </Note>
    ),
  },
  infinitives: {
    beginning: (
      <Note>
        <P>An <strong>infinitive</strong> is the "to ‑" form of a verb (<G>λύειν</G> "to loose"). It names the action without a subject, person, or number, so it does not change for "I / you / he." Mostly you just recognize two forms: present active (<G>‑ειν</G>) and aorist active (<G>‑σαι</G>). The aorist infinitive has the <G>σ</G> but — importantly — <strong>no augment</strong> (augments live only in the indicative).</P>
        <Eg><G>θέλω λύειν</G> = "I want <em>to loose</em>."</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The infinitive is a <strong>verbal noun</strong>, so it can take an article (<G>τό</G>) and even a subject in the accusative (<G>θέλω τὸν ἄγγελον ἀπελθεῖν</G> = "I want the messenger to depart"). These are its <strong>Essential Syntax Categories</strong> (after Wallace).</P>
        <CatGroup label="Verbal use (like a verb)">
          <Cat name="Purpose" eg="“I came to destroy the law”">answers <em>why?</em> — “in order to”; naked inf., or <G>τοῦ / εἰς τό / πρὸς τό</G></Cat>
          <Cat name="Result" eg="“…so that the crowd was amazed”">the outcome produced; usually <G>ὥστε</G> + infinitive</Cat>
          <Cat name="Time">answers <em>when?</em> — <G>μετὰ τό</G> "after," <G>ἐν τῷ</G> "while," <G>πρὸ τοῦ</G> "before"</Cat>
          <Cat name="Causal" eg="“because it had no root”">answers <em>why?</em> looking back; <G>διὰ τό</G> + infinitive</Cat>
          <Cat name="Complementary" eg="“you cannot serve God and mammon”">completes a helper verb (<G>δύναμαι, θέλω, μέλλω, ἄρχομαι</G>)</Cat>
        </CatGroup>
        <CatGroup label="Substantival use (like a noun)">
          <Cat name="Subject" eg="“to live is Christ” (Phil 1:21)">the infinitive is the subject, often with <G>δεῖ, ἔξεστιν</G></Cat>
          <Cat name="Indirect Discourse" eg="“they say there is no resurrection”">reports speech/thought after a verb of perception</Cat>
          <Cat name="Epexegetical" eg="“authority to tread on serpents”">explains a noun or adjective (ability, freedom, need…)</Cat>
        </CatGroup>
        <P>Present vs. aorist infinitive is aspect, not time: ongoing vs. simple action.</P>
      </Note>
    ),
  },
  imperatives: {
    beginning: (
      <Note>
        <P>The <strong>imperative</strong> is the command mood ("Loose!" "Believe!"). Greek has both 2nd-person ("you, do this") and 3rd-person imperatives (literally "let him do this"), which English lacks. You mainly memorize the 2nd-person forms plus the endings <G>‑τω</G> (3rd sg.) and <G>‑τωσαν</G> (3rd pl.). Aorist imperatives have the <G>σ</G> but no augment.</P>
        <Eg><G>πίστευε</G> = "Believe!" (present — "keep on believing").</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Present vs. aorist imperative is <strong>aspect</strong>: present = ongoing / general ("make it your practice to…"), aorist = a specific, whole action ("do it"). The aorist is the more common of the two, so take note when the <em>present</em> imperative is chosen. These are its <strong>Essential Syntax Categories</strong> (after Wallace).</P>
        <CatGroup>
          <Cat name="Command" eg="“Go and make disciples”">a straightforward order, usually superior to inferior</Cat>
          <Cat name="Prohibition" eg="“do not fear”"><G>μή</G> + imperative forbids an action</Cat>
          <Cat name="Request / Entreaty" eg="“give us this day our daily bread”">a polite appeal, often inferior to superior</Cat>
          <Cat name="Permissive">allows or tolerates an action ("let him do it")</Cat>
          <Cat name="Conditional">an imperative that states a condition ("do X, and Y will follow")</Cat>
        </CatGroup>
        <Hook>Prohibitions split by aspect: <G>μή</G> + <strong>present</strong> imperative = "stop / don't keep doing," while <G>μή</G> + <strong>aorist</strong> subjunctive = "don't start / don't ever."</Hook>
        <Hook>It's easy to confuse the <strong>future indicative</strong> and the <strong>aorist imperative</strong> — both have a <G>σ</G> and no augment. The <em>endings</em> decide: <G>πίστευσον</G> "Believe!" (aor. imperative) vs. <G>πιστεύσομεν</G> "we will believe" (fut. indicative).</Hook>
      </Note>
    ),
  },
  participles: {
    beginning: (
      <Note>
        <P>A <strong>participle</strong> is a verbal adjective — part verb (tense, voice), part adjective (gender, case, number). Translate it with "‑ing" (active: <G>λύων</G> "loosing") or "‑ed / being" (middle/passive: <G>λυόμενος</G> "being loosed"). It agrees with the noun it describes, and the middle/passive form always shows the chunk <G>‑μεν‑</G>.</P>
        <Hook>Present participle = <strong>Simultaneous</strong> (same time as the main verb) · Aorist participle = <strong>Sequence</strong> (before the main verb).</Hook>
        <Eg>Present: "<em>While eating</em>, the man read his newspaper." Aorist: "<em>Having eaten</em>, the man read his newspaper." Same actions — the participle's tense just tells you the timing.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The first question is <strong>article or no article?</strong> With the article the participle is <em>adjectival</em>; without it, usually <em>adverbial</em>. These are its <strong>Essential Syntax Categories</strong> (after Wallace).</P>
        <CatGroup label="Adjectival (with the article)">
          <Cat name="Attributive" eg="“the man who is loosing…”">adds detail to a noun (“who / which”)</Cat>
          <Cat name="Substantival" eg="ὁ πιστεύων, “the believer”">stands alone as a noun</Cat>
          <Cat name="Predicate">asserts something of the noun (rare)</Cat>
        </CatGroup>
        <CatGroup label="Adverbial / circumstantial (no article) — modifies the main verb">
          <Cat name="Temporal" eg="“while eating…”">answers <em>when?</em></Cat>
          <Cat name="Cause" eg="“because he was righteous”">answers <em>why?</em> — “because”</Cat>
          <Cat name="Means / Manner" eg="“by doing this…”">answers <em>how?</em></Cat>
          <Cat name="Condition" eg="“if you do this…”">the “if” on which the verb depends</Cat>
          <Cat name="Concession" eg="“although they knew God…”">“although”</Cat>
          <Cat name="Purpose">answers <em>why?</em> looking forward — “in order to”</Cat>
        </CatGroup>
        <CatGroup label="Other uses">
          <Cat name="Attendant Circumstance" eg="“Go and make disciples”">translate as a finite verb + “and”; pigg-backs on the main verb</Cat>
          <Cat name="Periphrastic">a participle + a form of <G>εἰμί</G> making one verbal idea</Cat>
          <Cat name="Imperatival">a participle functioning as a command</Cat>
          <Cat name="Genitive Absolute">detached participle + noun, both genitive — usually background/time</Cat>
        </CatGroup>
        <Hook>Don't be afraid to add "<strong>who</strong>" for a substantival participle, and if the first word of a sentence is <strong>genitive</strong>, <em>think genitive absolute</em> — its subject differs from the main verb's (<G>ὀψίας γενομένης</G>… = "when evening had come…").</Hook>
      </Note>
    ),
  },
  subjunctives: {
    beginning: (
      <Note>
        <P>The <strong>subjunctive</strong> is the mood of possibility — "might, may, should" rather than plain fact. Its signal is a <strong>long connecting vowel</strong> (<G>ω/η</G>). It rarely stands alone; it usually follows a trigger word like <G>ἵνα</G> ("in order that"), <G>ἐάν</G> ("if"), or <G>ὅταν</G> ("whenever"). There is no past time here — even the aorist subjunctive is not past; the tense only shows aspect.</P>
        <Hook>Each common use has a "<strong>flag word</strong>" that alerts you the subjunctive is coming: <G>ἵνα</G> / <G>ὅπως</G> (purpose) or <G>ἄν</G> / <G>ἐάν</G> (indefinite / conditional).</Hook>
        <Eg><G>ἵνα λύῃ</G> = "in order that he <em>may</em> loose."</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>These are its <strong>Essential Syntax Categories</strong> (after Wallace) — some standing alone, some inside a dependent clause.</P>
        <CatGroup label="In independent clauses">
          <Cat name="Hortatory" eg="“let us love one another”">1st person plural — an exhortation</Cat>
          <Cat name="Deliberative" eg="“what shall we say?”">a real or rhetorical question about what to do</Cat>
          <Cat name="Emphatic Negation" eg="“will never perish”"><G>οὐ μή</G> + aorist subjunctive — the strongest “no”</Cat>
          <Cat name="Prohibitive" eg="“do not fear”"><G>μή</G> + aorist subjunctive (a negative command)</Cat>
        </CatGroup>
        <CatGroup label="In dependent clauses">
          <Cat name="ἵνα + subjunctive">purpose (“in order that”) or result (“so that”)</Cat>
          <Cat name="Conditional" eg="“if you ask…”"><G>ἐάν</G> + subjunctive — the 3rd-class condition</Cat>
          <Cat name="Indefinite" eg="ὃς ἄν “whoever,” ὅταν “whenever”">relative or temporal clauses with <G>ἄν</G></Cat>
        </CatGroup>
        <P>Because the subjunctive carries aspect only, choose your English helper ("may / should / might") from the <em>clause type</em>, not from a fixed gloss.</P>
      </Note>
    ),
  },
  'mi-verbs': {
    beginning: (
      <Note>
        <P>Most Greek verbs end in <G>‑ω</G>, but a handful of very common ones end in <G>‑μι</G>: <G>δίδωμι</G> ("I give"), <G>τίθημι</G> ("I put / place"), <G>ἵστημι</G> ("I stand"). They look odd because in the present/imperfect they double their first sound with an iota (<G>δι‑δωμι</G>) and their stem vowel swaps short/long (<G>δο/δω</G>). Learn these few verbs as high-frequency VIPs.</P>
        <Hook><G>‑μι</G> verbs have <strong>two stems</strong>: the <strong>present stem</strong> (longer, reduplicated) is used for the present and imperfect; the <strong>verbal stem</strong> (shorter) is used for the future, aorist, and perfect.</Hook>
        <Eg><G>δίδωμι σοι</G> = "I give <em>to you</em>."</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The iota-reduplication marks <strong>present/imperfect only</strong>; elsewhere μι-verbs revert to the short stem and act like <G>‑ω</G> verbs, with an aorist in <G>‑κα</G> (<G>ἔδωκα, ἔθηκα</G>) rather than <G>‑σα</G>.</P>
        <P><G>ἵστημι</G> is doubly tricky: transitive in some tenses ("I set / place") but intransitive in others ("I stand"), and its perfect <G>ἕστηκα</G> means a present state "I stand." Since many key NT terms are μι-compounds (<G>ἀφίημι</G> "forgive," <G>παραδίδωμι</G> "hand over / betray"), fluency here pays off fast.</P>
      </Note>
    ),
  },
  '2nd-aorists': {
    beginning: (
      <Note>
        <P>The <strong>aorist</strong> (simple past, "he did") normally shows a <G>‑σα‑</G> marker (1st aorist). But some verbs form their aorist a different way — by <strong>changing the stem itself</strong> — and these are called <strong>2nd</strong> (or "strong") aorists. They use the same endings as the imperfect, but with a changed stem and no <G>‑σα</G>. You basically memorize them as vocabulary.</P>
        <Eg><G>λαμβάνω</G> "I take" → <G>ἔλαβον</G> "I took" (stem changed <G>λαμβαν‑</G> → <G>λαβ‑</G>).</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>A 2nd aorist is identified by three clues <em>together</em>: an augment, a stem different from the present, and no <G>σα/θη</G> marker. The meaning is the ordinary aorist (perfective aspect) — only the way the form is built differs, like English <em>go → went</em> vs. <em>walk → walked</em>.</P>
        <P>Some verbs are <strong>suppletive</strong>, borrowing a totally different root for the aorist (<G>λέγω → εἶπον</G>, <G>ὁράω → εἶδον</G>). Learn the aorist stem as one of the verb's <em>principal parts</em> so you can trace an unfamiliar form back to its lexical form.</P>
      </Note>
    ),
  },
  deponents: {
    beginning: (
      <Note>
        <P>A <strong>deponent</strong> verb looks middle or passive (its ending is <G>‑ομαι</G>, not <G>‑ω</G>) but means something <strong>active</strong>. It has "laid aside" (deponent = "putting off") its active forms. So <G>ἔρχομαι</G> looks passive but simply means "I come / go." You just translate it actively; the middle/passive form is its normal, only form, and its dictionary form ends in <G>‑ομαι</G>.</P>
        <Hook>The vast majority of the time you meet a <strong>middle</strong> form, it is simply a deponent verb carrying an active meaning — so reach for "deponent" first.</Hook>
        <Eg><G>ἀποκρίνομαι</G> = "I answer" — active meaning, middle/passive form.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Parse a deponent exactly as you would any middle/passive form (tense, person, number), but translate with the <em>active</em> gloss your lexicon gives. Some are middle in the future/aorist; others are passive in the aorist (<G>ἀποκρίνομαι → ἀπεκρίθην</G>).</P>
        <P>Many grammarians now question the label "deponent," arguing the Greek <strong>middle voice</strong> genuinely fits these verbs (subject-affectedness) rather than being a defective active — a useful nuance, though the practical rule (active meaning) still holds. Watch, too, for <strong>semi-deponents</strong>, which are deponent in only some tenses.</P>
      </Note>
    ),
  },
  demonstratives: {
    beginning: (
      <Note>
        <P>The <strong>demonstratives</strong> are the pointing words: <G>οὗτος</G> "this" (near) and <G>ἐκεῖνος</G> "that" (far). They agree with their noun in gender, case, and number — and unlike adjectives, they stand <em>outside</em> the article-noun unit: <G>οὗτος ὁ ἄνθρωπος</G> = "this man."</P>
        <Hook>Watch the breathing: <G>αὕτη</G> (rough) = "this woman"; <G>αὐτή</G> (smooth) = "she." One mark, two different words.</Hook>
        <Eg><G>ταῦτα</G> = "these things" — one of the most common words in the NT.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><G>οὗτος</G> follows the article's front-end pattern (rough breathing in the nom. masc./fem., <G>τ‑</G> elsewhere) with 1st/2nd-declension endings. Standing alone it is a full pronoun (<G>οὗτός ἐστιν ὁ υἱός μου</G>).</P>
        <P>It can point backward (anaphoric, <G>μετὰ ταῦτα</G>) or forward to a coming definition (cataphoric — John's <G>αὕτη ἐστὶν ἡ ἐντολή, ἵνα…</G>), and on hostile lips it sneers: "this fellow." The reflexive <G>ἑαυτοῦ</G> and reciprocal <G>ἀλλήλων</G> complete the pointing family.</P>
      </Note>
    ),
  },
  relatives: {
    beginning: (
      <Note>
        <P>The <strong>relative pronoun</strong> <G>ὅς, ἥ, ὅ</G> ("who, which, that") folds one clause inside another: <G>ὁ ἀνὴρ ὃν εἶδον</G>, "the man whom I saw." It looks like the article without the <G>τ</G> — but always with a rough breathing <em>and</em> an accent.</P>
        <Hook>A very short word with a rough breathing and an accent is almost certainly a relative pronoun (<G>ἥ</G> ≠ <G>ἡ</G>, <G>οἵ</G> ≠ <G>οἱ</G>).</Hook>
        <Eg>Gender &amp; number come from the noun it points back to; its <em>case</em> comes from its own job in its clause.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The agreement rule ("gender/number backward, case inward") bends under <strong>attraction</strong>: a genitive or dative antecedent often pulls the relative into its own case (<G>πάντων ὧν ἐποίησεν</G>, Luke 3:19). Headless relatives act as nouns ("whoever / whatever"), and <G>ὃς ἄν</G> + subjunctive generalizes: "whoever."</P>
        <P>Bare-relative openings (<G>ὅς ἐστιν εἰκὼν τοῦ θεοῦ</G>, Col 1:15) are a fingerprint of quoted hymnic material.</P>
      </Note>
    ),
  },
  'contract-verbs': {
    beginning: (
      <Note>
        <P><strong>Contract verbs</strong> have stems ending in <G>ε, α,</G> or <G>ο</G>, which fuse with the connecting vowel — like English "do not → don't": <G>φιλέ‑ομεν → φιλοῦμεν</G>. Dictionaries list the uncontracted form (<G>φιλέω</G>), but texts always show the contracted one (<G>φιλῶ</G>).</P>
        <Hook>A <strong>circumflex</strong> on a present-tense ending (<G>ποιεῖ, ἀγαπᾷ, πληροῖ</G>) is contraction's scar — you're looking at a contract verb.</Hook>
        <Eg>Outside the present/imperfect the stem vowel just lengthens (<G>ἀγαπάω → ἠγάπησα</G>) and the verb behaves like <G>λύω</G>.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Master shortcuts: like vowels → the long version (<G>ε+ε=ει</G>); an o-sound anywhere wins (<G>→ ου/ω/οι</G>); <G>α</G> + e-sound → <G>α/ᾳ</G>; long vowels swallow short ones. Only the present and imperfect contract — every other tense lengthens and regularizes.</P>
        <P>Exceptions worth flagging: <G>καλέω</G> refuses to lengthen (<G>ἐκάλεσα</G>), <G>ζάω</G> contracts with η (<G>ζῇ</G>), and liquid futures mimic -έω presents (see Liquid Verbs).</P>
      </Note>
    ),
  },
  liquids: {
    beginning: (
      <Note>
        <P><strong>Liquid verbs</strong> have stems ending in the flowing consonants <G>λ, μ, ν, ρ</G> — sounds that refuse to sit next to <G>σ</G>. So their future and aorist form <em>without</em> the σ: future <G>μενῶ</G> "I will remain," aorist <G>ἔμεινα</G> "I remained."</P>
        <Hook>In liquid verbs there is <strong>no σ in the future or aorist</strong>. The future wears φιλέω-style contract endings — often only the <em>accent</em> separates <G>μένω</G> "I remain" from <G>μενῶ</G> "I will remain."</Hook>
        <Eg><G>ἀποστέλλω → ἀπέστειλα</G> "I sent" — double λ slims to one, stem vowel stretches.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>The stem-stretch (<G>μεν → μειν</G>) is <em>compensatory lengthening</em> — the lost σ's weight preserved in the vowel. Distinguish the liquid 1st aorist (<G>ἔκρινα</G>, α-endings) from the imperfect (<G>ἔκρινον</G>) by the ending vowel.</P>
        <P>Key liquid vocabulary is theologically loaded: <G>ἐγείρω</G> (divine-passive <G>ἠγέρθη</G> "he was raised"), <G>ἀποστέλλω</G> (the apostle-verb), <G>μένω</G> (John's "abide").</P>
      </Note>
    ),
  },
  'principal-parts': {
    beginning: (
      <Note>
        <P>Greek dictionaries describe a verb by its six <strong>principal parts</strong> — like English "sing, sang, sung," but six slots: present, future, aorist, perfect active, perfect middle/passive, aorist passive (<G>λύω, λύσω, ἔλυσα, λέλυκα, λέλυμαι, ἐλύθην</G>). Every form you will ever meet descends from one of the six.</P>
        <Hook>Learn a rebel verb's row as a <strong>chant</strong>, left to right — <G>λέγω, ἐρῶ, εἶπον, εἴρηκα, εἴρημαι, ἐρρέθην</G> — exactly as you learned <em>sing, sang, sung</em>.</Hook>
        <Eg>Regular verbs are predictable; memorize only the rebels (<G>ἔρχομαι, ὁράω, φέρω</G>…) — which are the very verbs on every page.</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Think in <strong>tense-systems</strong>, not tenses: each part's stem serves every mood of its system (part 3 minus the augment gives the aorist participle, infinitive, subjunctive, imperative). The future passive grows from part <em>6</em>, not part 2 (<G>λυθήσομαι</G> ← <G>ἐλύθην</G>).</P>
        <P>Where parts come from different roots (<G>λέγω / ἐρῶ / εἶπον</G>) you're seeing <em>suppletion</em> — ancient verbs merged into one paradigm, like go/went.</P>
      </Note>
    ),
  },
  pronunciation: {
    beginning: (
      <Note>
        <P>Greek's 24 letters are the ancestors of your own alphabet — many are old friends (<G>α β δ κ τ</G>), a few are impostors (<G>ν</G> is n, not v; <G>ρ</G> is r, not p), and three are genuinely new (<G>ξ χ ψ</G>). This course reads Greek with the <strong>Erasmian</strong> pronunciation: one distinct sound per letter, so spelling and sound always match.</P>
        <Hook><strong>Breathings are essential; accents are unimportant</strong> (for now). Every vowel-initial word carries a breathing — rough <G>῾</G> = h-sound, smooth <G>᾿</G> = silent but still required.</Hook>
        <Eg><G>ἅγιος</G> = <em>hagios</em> "holy" · <G>ἄγγελος</G> = <em>angelos</em> "angel" (and γγ = "ng").</Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P>Three schemes coexist: <strong>Erasmian</strong> (classroom convention — maximally distinct), <strong>reconstructed Koine</strong> (closest to first-century speech), and <strong>Modern Greek</strong> (the living tradition, with <em>itacism</em>: <G>η ι υ ει οι υι</G> all sounding "ee").</P>
        <P>The mergers matter beyond the classroom: scribes spelled by ear, so itacism drives manuscript variants — <G>ἡμεῖς</G>/<G>ὑμεῖς</G> ("we/you") became homophones, splitting the witnesses at places like 1 John 1:4. Pronunciation history doubles as a text-critical tool.</P>
      </Note>
    ),
  },
}
