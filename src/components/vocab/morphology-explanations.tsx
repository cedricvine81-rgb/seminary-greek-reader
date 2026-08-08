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
     ESS_EXPLANATIONS   — Minimums sub-sections, keyed by section id (1–8)
     TAB_EXPLANATIONS   — every other topic tab, keyed by MainTab id
───────────────────────────────────────────── */

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Tr, Term } from '@/components/morphology/shared'

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
// This file marks Greek with its own `G`, not the chapters' `Gk` — same job, lighter styling.
// The role is what the translation serializer reads, so both are recognised without either
// component knowing about the other. See morph-markup.tsx.
G.i18nRole = 'greek' as const

/** Translatable prose in these notes, rendering {…} back as this file's own G. */
function T({ id, children }: { id: string; children: React.ReactNode }) {
  return <Tr id={id} comps={{ Gk: G, Term }}>{children}</Tr>
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

/** One syntax category: bold name — short gloss (optional simple example),
 *  then two real NT examples (Greek clause + English translation below). */
function Cat({ name, children, eg, ex }: {
  name: React.ReactNode
  children: React.ReactNode
  eg?: React.ReactNode
  ex?: { g: string; e: string; r: string }[]
}) {
  return (
    <li className="text-sm leading-snug text-gray-700">
      <span className="font-semibold text-gray-900">{name}</span> — {children}
      {eg && <span className="text-gray-500"> — <em>{eg}</em></span>}
      {ex && ex.length > 0 && (
        <ul className="mt-1.5 mb-1 space-y-1.5 list-none pl-0">
          {ex.map((x, i) => (
            <li key={i} className="border-l-2 border-brand-200 pl-2.5 leading-snug">
              <span className="normal-case font-reading text-[15px] text-gray-800">{x.g}</span>
              <span className="block text-xs text-gray-500">{x.e} <span className="text-gray-400">({x.r})</span></span>
            </li>
          ))}
        </ul>
      )}
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
   Minimums 1–8
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
   Main topic tabs (all except Minimums)
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
          <Cat name="Subject" ex={[{ g: "ὁ λόγος σὰρξ ἐγένετο", e: "the Word became flesh", r: "John 1:14" }, { g: "ὁ θεὸς ἀγάπη ἐστίν", e: "God is love", r: "1 John 4:8" }]}>the doer of a finite verb</Cat>
          <Cat name="Predicate Nominative" eg="“the Word was God,” John 1:1" ex={[{ g: "θεὸς ἦν ὁ λόγος", e: "the Word was God", r: "John 1:1" }, { g: "ὑμεῖς ἐστε τὸ φῶς τοῦ κόσμου", e: "you are the light of the world", r: "Matt 5:14" }]}>renames the subject through an equative verb (<G>εἰμί, γίνομαι</G>)</Cat>
          <Cat name="Nominative Absolute" ex={[{ g: "Ἀρχὴ τοῦ εὐαγγελίου Ἰησοῦ Χριστοῦ", e: "The beginning of the gospel of Jesus Christ", r: "Mark 1:1" }, { g: "Παῦλος ἀπόστολος Χριστοῦ Ἰησοῦ", e: "Paul, an apostle of Christ Jesus", r: "Eph 1:1" }]}>a naming nominative in titles / salutations (not in a full sentence)</Cat>
          <Cat name="Nominative for Vocative" eg="“O foolish Galatians!”" ex={[{ g: "ὁ κύριός μου καὶ ὁ θεός μου", e: "My Lord and my God!", r: "John 20:28" }, { g: "ναί, ὁ πατήρ", e: "Yes, Father", r: "Matt 11:26" }]}>a nominative used for direct address</Cat>
        </CatGroup>
        <CatGroup label="Genitive — description & separation (“of”)">
          <Cat name="Possessive" eg="“his ear”" ex={[{ g: "τὸν οἶκον τοῦ πατρός μου", e: "my Father’s house", r: "John 2:16" }, { g: "τὸ βιβλίον τοῦ προφήτου Ἠσαΐου", e: "the scroll of the prophet Isaiah", r: "Luke 4:17" }]}>the head noun belongs to the genitive</Cat>
          <Cat name="Descriptive" ex={[{ g: "βάπτισμα μετανοίας", e: "a baptism of repentance", r: "Mark 1:4" }, { g: "τὸν οἰκονόμον τῆς ἀδικίας", e: "the dishonest steward", r: "Luke 16:8" }]}>a loose “characterized by” quality (the catch-all genitive)</Cat>
          <Cat name="Relationship" eg="Σίμων Ἰωάννου, “Simon [son] of John”" ex={[{ g: "Σίμων Ἰωάννου", e: "Simon, son of John", r: "John 21:15" }, { g: "Ἰάκωβος ὁ τοῦ Ζεβεδαίου", e: "James the son of Zebedee", r: "Matt 10:2" }]}>family relation</Cat>
          <Cat name="Partitive" eg="“half of my possessions”" ex={[{ g: "τὰ ἡμίσιά μου τῶν ὑπαρχόντων", e: "half of my possessions", r: "Luke 19:8" }, { g: "τινὲς τῶν γραμματέων", e: "some of the scribes", r: "Matt 9:3" }]}>the whole of which the head noun is a part</Cat>
          <Cat name="Apposition" eg="“the sign, namely circumcision”" ex={[{ g: "τοῦ ναοῦ τοῦ σώματος αὐτοῦ", e: "the temple of his body", r: "John 2:21" }, { g: "σημεῖον περιτομῆς", e: "the sign, namely circumcision", r: "Rom 4:11" }]}>the genitive is the same thing / a specific example of the head noun</Cat>
          <Cat name="Comparison" eg="“greater than the angels”" ex={[{ g: "μείζων τοῦ πατρὸς ἡμῶν Ἀβραάμ", e: "greater than our father Abraham", r: "John 8:53" }, { g: "πλεῖον Ἰωνᾶ ὧδε", e: "something greater than Jonah is here", r: "Matt 12:41" }]}>the standard after a comparative adjective (“than”)</Cat>
          <Cat name="Subjective" eg="“the revelation of Jesus” = Jesus reveals" ex={[{ g: "ἡ ἀγάπη τοῦ Χριστοῦ συνέχει ἡμᾶς", e: "the love of Christ (= Christ’s love) compels us", r: "2 Cor 5:14" }, { g: "Ἀποκάλυψις Ἰησοῦ Χριστοῦ", e: "the revelation from Jesus Christ", r: "Rev 1:1" }]}>acts as the subject of the idea in a verbal head noun</Cat>
          <Cat name="Objective" eg="“blasphemy of the Spirit” = blaspheming the Spirit" ex={[{ g: "ἡ τοῦ πνεύματος βλασφημία", e: "the blasphemy against the Spirit", r: "Matt 12:31" }, { g: "διὰ τὸν φόβον τῶν Ἰουδαίων", e: "for fear of the Jews", r: "John 7:13" }]}>acts as the object of that idea</Cat>
          <Cat name="Genitive of Time" ex={[{ g: "ἦλθεν πρὸς αὐτὸν νυκτός", e: "he came to him by night", r: "John 3:2" }, { g: "νηστεύω δὶς τοῦ σαββάτου", e: "I fast twice a week", r: "Luke 18:12" }]}>the kind of time / time <em>within which</em></Cat>
          <Cat name="Genitive Absolute" ex={[{ g: "ὀψίας δὲ γενομένης", e: "when evening had come", r: "Matt 8:16" }, { g: "ἔτι αὐτοῦ λαλοῦντος", e: "while he was still speaking", r: "Mark 5:35" }]}>a detached genitive noun + participle giving background (see Participles)</Cat>
          <Cat name="After certain verbs / prepositions" ex={[{ g: "ἥψατο τῆς χειρὸς αὐτῆς", e: "he touched her hand", r: "Matt 8:15" }, { g: "ἀκούσουσιν τῆς φωνῆς τοῦ υἱοῦ τοῦ θεοῦ", e: "they will hear the voice of the Son of God", r: "John 5:25" }]}>as a direct object (sensation, sharing, ruling…) or governed by a preposition</Cat>
        </CatGroup>
        <CatGroup label="Dative — the “to / for / with / by” case">
          <Cat name="Indirect Object" eg="“he gave the book to me”" ex={[{ g: "δός μοι τὴν κεφαλὴν Ἰωάννου", e: "give me the head of John", r: "Matt 14:8" }, { g: "λέγει αὐτῇ ὁ Ἰησοῦς", e: "Jesus says to her", r: "John 11:23" }]}>the person to/for whom</Cat>
          <Cat name="Interest" ex={[{ g: "μαρτυρεῖτε ἑαυτοῖς", e: "you testify against yourselves", r: "Matt 23:31" }, { g: "τῷ κυρίῳ ζῶμεν", e: "we live for the Lord", r: "Rom 14:8" }]}>advantage (“for” someone) or disadvantage (“against” someone)</Cat>
          <Cat name="Reference / Respect" eg="“dead to sin”" ex={[{ g: "νεκροὺς τῇ ἁμαρτίᾳ", e: "dead with respect to sin", r: "Rom 6:11" }, { g: "ζῶντας τῷ θεῷ", e: "alive with respect to God", r: "Rom 6:11" }]}>“with respect to”</Cat>
          <Cat name="Possession" ex={[{ g: "οὐκ ἦν αὐτοῖς τόπος ἐν τῷ καταλύματι", e: "there was no place for them in the inn", r: "Luke 2:7" }, { g: "ᾧ ὄνομα Ἰωσήφ", e: "whose name was Joseph", r: "Luke 1:27" }]}>the possessor with an equative verb</Cat>
          <Cat name="Sphere" eg="“pure in heart”" ex={[{ g: "οἱ καθαροὶ τῇ καρδίᾳ", e: "the pure in heart", r: "Matt 5:8" }, { g: "οἱ πτωχοὶ τῷ πνεύματι", e: "the poor in spirit", r: "Matt 5:3" }]}>the realm in which something is true</Cat>
          <Cat name="Dative of Time" ex={[{ g: "τῇ τρίτῃ ἡμέρᾳ ἐγερθήσεται", e: "on the third day he will be raised", r: "Matt 20:19" }, { g: "τοῖς γενεσίοις αὐτοῦ δεῖπνον ἐποίησεν", e: "on his birthday he gave a banquet", r: "Mark 6:21" }]}>the point in time <em>at which</em></Cat>
          <Cat name="Means / Instrument" eg="“with a word”" ex={[{ g: "ἐξέβαλεν τὰ πνεύματα λόγῳ", e: "he cast out the spirits with a word", r: "Matt 8:16" }, { g: "χάριτί ἐστε σεσῳσμένοι", e: "by grace you have been saved", r: "Eph 2:8" }]}>the plain dative = “by/with”</Cat>
          <Cat name="Direct Object / after prepositions" ex={[{ g: "ἠκολούθησαν αὐτῷ", e: "they followed him", r: "Matt 4:20" }, { g: "ἐπίστευσεν Ἀβραὰμ τῷ θεῷ", e: "Abraham believed God", r: "Rom 4:3" }]}>verbs and prepositions that govern the dative</Cat>
        </CatGroup>
        <CatGroup label="Accusative — extent & limitation">
          <Cat name="Direct Object" eg="“God loved the world”" ex={[{ g: "ἠγάπησεν ὁ θεὸς τὸν κόσμον", e: "God loved the world", r: "John 3:16" }, { g: "λύσατε τὸν ναὸν τοῦτον", e: "destroy this temple", r: "John 2:19" }]}>what receives a transitive verb's action</Cat>
          <Cat name="Double Accusative" ex={[{ g: "ἐκεῖνος ὑμᾶς διδάξει πάντα", e: "he will teach you all things", r: "John 14:26" }, { g: "ὑμᾶς εἴρηκα φίλους", e: "I have called you friends", r: "John 15:15" }]}>two objects: person + thing (“he teaches you Greek”), or object + complement (“they called him Lord”)</Cat>
          <Cat name="Measure" eg="“forty days,” “a day's journey”" ex={[{ g: "ἔμεινεν ἐκεῖ δύο ἡμέρας", e: "he stayed there two days", r: "John 4:40" }, { g: "ἦλθον ἡμέρας ὁδόν", e: "they went a day’s journey", r: "Luke 2:44" }]}>extent of time or space (“how long / how far”)</Cat>
          <Cat name="Subject of Infinitive" eg="“I want him to learn”" ex={[{ g: "δεῖ ὑμᾶς γεννηθῆναι ἄνωθεν", e: "you must be born again", r: "John 3:7" }, { g: "ἐν τῷ ὑποστρέφειν τὸν Ἰησοῦν", e: "when Jesus returned", r: "Luke 8:40" }]}>the accusative that acts as an infinitive's subject</Cat>
          <Cat name="After certain prepositions" ex={[{ g: "ἀπέστειλεν ὁ θεὸς τὸν υἱὸν εἰς τὸν κόσμον", e: "God sent the Son into the world", r: "John 3:17" }, { g: "πάντες ἔρχονται πρὸς αὐτόν", e: "everyone is coming to him", r: "John 3:26" }]}>prepositions that govern the accusative</Cat>
        </CatGroup>
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
        <Hook>Is "himself" intensive or reflexive? <strong>Delete it.</strong> If the basic meaning is unchanged, it was intensive ("the king himself came"); if not, it was reflexive ("he saw himself"). And a very short word with a <em>rough</em> breathing is almost always a relative pronoun (<G>ὅς, ἥ, ὅ</G>).</Hook>
        <P>Relative pronouns take their <em>gender and number</em> from their antecedent but their <em>case</em> from their own clause — a frequent parsing trap. And watch for forms of <G>οὗτος</G> that drop the <G>τ</G> (<G>οὗτος / αὕτη</G>).</P>
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
          <Cat name="Progressive" eg="“she is writing”" ex={[{ g: "κύριε, σῶσον, ἀπολλύμεθα", e: "Lord, save us! We are perishing", r: "Matt 8:25" }, { g: "πάντες ζητοῦσίν σε", e: "everyone is looking for you", r: "Mark 1:37" }]}>action in progress right now</Cat>
          <Cat name="Iterative" ex={[{ g: "νηστεύω δὶς τοῦ σαββάτου", e: "I fast twice a week", r: "Luke 18:12" }, { g: "καθ’ ἡμέραν ἀποθνῄσκω", e: "I die daily", r: "1 Cor 15:31" }]}>a repeated / habitual action</Cat>
          <Cat name="Extending-from-past" ex={[{ g: "τοσαῦτα ἔτη δουλεύω σοι", e: "these many years I have been serving you", r: "Luke 15:29" }, { g: "ἀπ’ ἀρχῆς μετ’ ἐμοῦ ἐστε", e: "you have been with me from the beginning", r: "John 15:27" }]}>began in the past and continues ("I have been…")</Cat>
          <Cat name="Conative" ex={[{ g: "διὰ ποῖον ἔργον ἐμὲ λιθάζετε;", e: "for which deed are you trying to stone me?", r: "John 10:32" }, { g: "ἐν ὀλίγῳ με πείθεις Χριστιανὸν ποιῆσαι", e: "you are trying to persuade me to become a Christian", r: "Acts 26:28" }]}>attempted or about-to-begin action ("is trying to…")</Cat>
          <Cat name="Historical" eg="“Jesus says to them…”" ex={[{ g: "λέγει αὐτῇ ὁ Ἰησοῦς", e: "Jesus says to her", r: "John 20:15" }, { g: "ἔρχονται πάλιν εἰς Ἱεροσόλυμα", e: "they come again to Jerusalem", r: "Mark 11:27" }]}>a present-tense verb narrating a past event (vivid)</Cat>
          <Cat name="Futuristic" ex={[{ g: "ἔρχομαι πρὸς ὑμᾶς", e: "I am coming to you", r: "John 14:18" }, { g: "μετὰ δύο ἡμέρας τὸ πάσχα γίνεται", e: "after two days the Passover takes place", r: "Matt 26:2" }]}>a present form referring to a certain future event</Cat>
        </CatGroup>
        <CatGroup label="Imperfect (past imperfective)">
          <Cat name="Progressive" eg="“he was teaching”" ex={[{ g: "ἐδίδασκεν αὐτούς", e: "he was teaching them", r: "Mark 2:13" }, { g: "ἐκάθητο παρὰ τὴν ὁδόν", e: "he was sitting beside the road", r: "Mark 10:46" }]}>ongoing action in past time</Cat>
          <Cat name="Iterative" ex={[{ g: "κατ’ ἔτος ἐπορεύοντο εἰς Ἰερουσαλήμ", e: "every year they went to Jerusalem", r: "Luke 2:41" }, { g: "ἐβαπτίζοντο ἐν τῷ Ἰορδάνῃ ποταμῷ", e: "they were being baptized in the Jordan River", r: "Mark 1:5" }]}>a repeated action in the past ("kept on…")</Cat>
          <Cat name="Ingressive / Inceptive" eg="“he began to speak”" ex={[{ g: "ἀνοίξας τὸ στόμα αὐτοῦ ἐδίδασκεν αὐτούς", e: "he opened his mouth and began to teach them", r: "Matt 5:2" }, { g: "ἐξαλλόμενος ἔστη καὶ περιεπάτει", e: "leaping up, he stood and began to walk", r: "Acts 3:8" }]}>focus on the start of the action</Cat>
          <Cat name="Conative" ex={[{ g: "ὁ δὲ Ἰωάννης διεκώλυεν αὐτόν", e: "but John was trying to prevent him", r: "Matt 3:14" }, { g: "ἐκάλουν αὐτὸ Ζαχαρίαν", e: "they were going to name him Zechariah", r: "Luke 1:59" }]}>attempted past action ("was trying to…")</Cat>
        </CatGroup>
        <CatGroup label="Aorist (perfective — a whole action)">
          <Cat name="Constative" ex={[{ g: "τεσσεράκοντα καὶ ἓξ ἔτεσιν οἰκοδομήθη ὁ ναὸς οὗτος", e: "this temple was built in forty-six years", r: "John 2:20" }, { g: "ἐβασίλευσεν ὁ θάνατος ἀπὸ Ἀδάμ", e: "death reigned from Adam", r: "Rom 5:14" }]}>the action as a simple whole (the default aorist)</Cat>
          <Cat name="Ingressive" eg="“he became rich”" ex={[{ g: "δι’ ὑμᾶς ἐπτώχευσεν πλούσιος ὤν", e: "though he was rich, for your sakes he became poor", r: "2 Cor 8:9" }, { g: "ἐσίγησεν πᾶν τὸ πλῆθος", e: "the whole crowd fell silent", r: "Acts 15:12" }]}>stresses entry into a state / action</Cat>
          <Cat name="Culminative" ex={[{ g: "ἔμαθον αὐτάρκης εἶναι", e: "I have learned to be content", r: "Phil 4:11" }, { g: "ἐνίκησεν ὁ λέων ὁ ἐκ τῆς φυλῆς Ἰούδα", e: "the Lion of the tribe of Judah has conquered", r: "Rev 5:5" }]}>stresses the completed end-point</Cat>
          <Cat name="Gnomic" ex={[{ g: "ἐξηράνθη ὁ χόρτος καὶ τὸ ἄνθος ἐξέπεσεν", e: "the grass withers and the flower falls", r: "1 Pet 1:24" }, { g: "ἐδικαιώθη ἡ σοφία ἀπὸ τῶν τέκνων αὐτῆς", e: "wisdom is justified by her children", r: "Luke 7:35" }]}>a timeless / proverbial truth</Cat>
          <Cat name="Epistolary" ex={[{ g: "ἔπεμψα αὐτὸν πρὸς ὑμᾶς", e: "I am sending him to you", r: "Phil 2:28" }, { g: "ἔγραψά σοι", e: "I am writing to you", r: "Phlm 21" }]}>the writer's "now" written as a past ("I wrote")</Cat>
          <Cat name="Dramatic" ex={[{ g: "νῦν ἐδοξάσθη ὁ υἱὸς τοῦ ἀνθρώπου", e: "now the Son of Man is glorified", r: "John 13:31" }, { g: "ἡ θυγάτηρ μου ἄρτι ἐτελεύτησεν", e: "my daughter has just now died", r: "Matt 9:18" }]}>an immediate past, stated for vividness</Cat>
        </CatGroup>
        <CatGroup label="Perfect & Future">
          <Cat name="Intensive Perfect" eg="“it stands finished”" ex={[{ g: "τετέλεσται", e: "it is finished (and stands so)", r: "John 19:30" }, { g: "γέγραπται", e: "it stands written", r: "Matt 4:4" }]}>stresses the resulting present state</Cat>
          <Cat name="Extensive Perfect" ex={[{ g: "τὸν δρόμον τετέλεκα, τὴν πίστιν τετήρηκα", e: "I have finished the race, I have kept the faith", r: "2 Tim 4:7" }, { g: "ἐγὼ πεπίστευκα ὅτι σὺ εἶ ὁ Χριστός", e: "I have come to believe that you are the Christ", r: "John 11:27" }]}>stresses the completed past act that produced the state</Cat>
          <Cat name="Predictive Future" eg="“he will come”" ex={[{ g: "αὐτὸς σώσει τὸν λαὸν αὐτοῦ", e: "he will save his people", r: "Matt 1:21" }, { g: "ὁ οὐρανὸς καὶ ἡ γῆ παρελεύσονται", e: "heaven and earth will pass away", r: "Matt 24:35" }]}>a plain prediction</Cat>
          <Cat name="Imperatival Future" ex={[{ g: "ἀγαπήσεις τὸν πλησίον σου", e: "you shall love your neighbor", r: "Matt 22:39" }, { g: "οὐ φονεύσεις", e: "you shall not murder", r: "Matt 5:21" }]}>a future used as a command ("you shall not…")</Cat>
          <Cat name="Deliberative Future" ex={[{ g: "κύριε, πρὸς τίνα ἀπελευσόμεθα;", e: "Lord, to whom shall we go?", r: "John 6:68" }, { g: "πῶς ἔτι ζήσομεν ἐν αὐτῇ;", e: "how shall we still live in it?", r: "Rom 6:2" }]}>a real or rhetorical question ("what shall we do?")</Cat>
        </CatGroup>
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
          <Cat name="Purpose" eg="“I came to destroy the law”" ex={[{ g: "οὐκ ἦλθον καταλῦσαι ἀλλὰ πληρῶσαι", e: "I did not come to abolish but to fulfill", r: "Matt 5:17" }, { g: "ἐξῆλθεν ὁ σπείρων σπεῖραι", e: "the sower went out to sow", r: "Mark 4:3" }]}>answers <em>why?</em> — “in order to”; naked inf., or <G>τοῦ / εἰς τό / πρὸς τό</G></Cat>
          <Cat name="Result" eg="“…so that the crowd was amazed”" ex={[{ g: "ὥστε τὸν ὄχλον θαυμάσαι", e: "so that the crowd marveled", r: "Matt 15:31" }, { g: "ὥστε ἤδη γεμίζεσθαι τὸ πλοῖον", e: "so that the boat was already filling", r: "Mark 4:37" }]}>the outcome produced; usually <G>ὥστε</G> + infinitive</Cat>
          <Cat name="Time" ex={[{ g: "ἐν τῷ σπείρειν αὐτόν", e: "while he was sowing", r: "Matt 13:4" }, { g: "μετὰ τὸ ἐγερθῆναί με", e: "after I have been raised", r: "Matt 26:32" }]}>answers <em>when?</em> — <G>μετὰ τό</G> "after," <G>ἐν τῷ</G> "while," <G>πρὸ τοῦ</G> "before"</Cat>
          <Cat name="Causal" eg="“because it had no root”" ex={[{ g: "διὰ τὸ μὴ ἔχειν ῥίζαν", e: "because it had no root", r: "Mark 4:6" }, { g: "διὰ τὸ εἶναι αὐτὸν ἐξ οἴκου Δαυίδ", e: "because he was of the house of David", r: "Luke 2:4" }]}>answers <em>why?</em> looking back; <G>διὰ τό</G> + infinitive</Cat>
          <Cat name="Complementary" eg="“you cannot serve God and mammon”" ex={[{ g: "οὐ δύνασθε θεῷ δουλεύειν καὶ μαμωνᾷ", e: "you cannot serve God and mammon", r: "Matt 6:24" }, { g: "ἤρξατο ὁ Ἰησοῦς κηρύσσειν", e: "Jesus began to preach", r: "Matt 4:17" }]}>completes a helper verb (<G>δύναμαι, θέλω, μέλλω, ἄρχομαι</G>)</Cat>
        </CatGroup>
        <CatGroup label="Substantival use (like a noun)">
          <Cat name="Subject" eg="“to live is Christ” (Phil 1:21)" ex={[{ g: "ἐμοὶ τὸ ζῆν Χριστὸς καὶ τὸ ἀποθανεῖν κέρδος", e: "to live is Christ and to die is gain", r: "Phil 1:21" }, { g: "καλόν ἐστιν ἡμᾶς ὧδε εἶναι", e: "it is good for us to be here", r: "Mark 9:5" }]}>the infinitive is the subject, often with <G>δεῖ, ἔξεστιν</G></Cat>
          <Cat name="Indirect Discourse" eg="“they say there is no resurrection”" ex={[{ g: "λέγουσιν ἀνάστασιν μὴ εἶναι", e: "they say there is no resurrection", r: "Mark 12:18" }, { g: "τίνα με λέγουσιν εἶναι;", e: "who do they say that I am?", r: "Mark 8:27" }]}>reports speech/thought after a verb of perception</Cat>
          <Cat name="Epexegetical" eg="“authority to tread on serpents”" ex={[{ g: "ἐξουσίαν τοῦ πατεῖν ἐπάνω ὄφεων", e: "authority to tread on serpents", r: "Luke 10:19" }, { g: "ἐξουσίαν ἔχω θεῖναι αὐτήν", e: "I have authority to lay it down", r: "John 10:18" }]}>explains a noun or adjective (ability, freedom, need…)</Cat>
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
          <Cat name="Command" eg="“Go and make disciples”" ex={[{ g: "πορευθέντες μαθητεύσατε πάντα τὰ ἔθνη", e: "go and make disciples of all nations", r: "Matt 28:19" }, { g: "ἀκολούθει μοι", e: "follow me", r: "Matt 9:9" }]}>a straightforward order, usually superior to inferior</Cat>
          <Cat name="Prohibition" eg="“do not fear”" ex={[{ g: "μὴ φοβοῦ, μόνον πίστευε", e: "do not fear, only believe", r: "Mark 5:36" }, { g: "μὴ κρίνετε, ἵνα μὴ κριθῆτε", e: "do not judge, so that you may not be judged", r: "Matt 7:1" }]}><G>μή</G> + imperative forbids an action</Cat>
          <Cat name="Request / Entreaty" eg="“give us this day our daily bread”" ex={[{ g: "τὸν ἄρτον ἡμῶν δὸς ἡμῖν σήμερον", e: "give us this day our daily bread", r: "Matt 6:11" }, { g: "κύριε, βοήθει μοι", e: "Lord, help me", r: "Matt 15:25" }]}>a polite appeal, often inferior to superior</Cat>
          <Cat name="Permissive" ex={[{ g: "ὃ ποιεῖς ποίησον τάχιον", e: "what you do, do quickly", r: "John 13:27" }, { g: "εἰ ὁ ἄπιστος χωρίζεται, χωριζέσθω", e: "if the unbeliever separates, let it be so", r: "1 Cor 7:15" }]}>allows or tolerates an action ("let him do it")</Cat>
          <Cat name="Conditional" ex={[{ g: "λύσατε τὸν ναὸν τοῦτον, καὶ ἐγερῶ αὐτόν", e: "destroy this temple, and I will raise it up", r: "John 2:19" }, { g: "ἐγγίσατε τῷ θεῷ, καὶ ἐγγιεῖ ὑμῖν", e: "draw near to God, and he will draw near to you", r: "Jas 4:8" }]}>an imperative that states a condition ("do X, and Y will follow")</Cat>
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
          <Cat name="Attributive" eg="“the man who is loosing…”" ex={[{ g: "ὁ ἄρτος ὁ ἐκ τοῦ οὐρανοῦ καταβαίνων", e: "the bread that comes down from heaven", r: "John 6:50" }, { g: "τὸ πνεῦμα τὸ λαλοῦν ἐν ὑμῖν", e: "the Spirit who speaks in you", r: "Matt 10:20" }]}>adds detail to a noun (“who / which”)</Cat>
          <Cat name="Substantival" eg="ὁ πιστεύων, “the believer”" ex={[{ g: "ὁ πιστεύων εἰς τὸν υἱὸν ἔχει ζωὴν αἰώνιον", e: "the one who believes in the Son has eternal life", r: "John 3:36" }, { g: "μακάριοι οἱ πενθοῦντες", e: "blessed are those who mourn", r: "Matt 5:4" }]}>stands alone as a noun</Cat>
          <Cat name="Predicate" ex={[{ g: "εἶδεν τὸ πνεῦμα καταβαῖνον εἰς αὐτόν", e: "he saw the Spirit descending upon him", r: "Mark 1:10" }, { g: "εὑρήσετε βρέφος κείμενον ἐν φάτνῃ", e: "you will find a baby lying in a manger", r: "Luke 2:12" }]}>asserts something of the noun (rare)</Cat>
        </CatGroup>
        <CatGroup label="Adverbial / circumstantial (no article) — modifies the main verb">
          <Cat name="Temporal" eg="“while eating…”" ex={[{ g: "ἐλθὼν ὁ Ἰησοῦς εἰς τὴν οἰκίαν Πέτρου", e: "when Jesus came into Peter’s house", r: "Matt 8:14" }, { g: "ἀκούσαντες δὲ ἐβαπτίσθησαν", e: "and when they heard, they were baptized", r: "Acts 19:5" }]}>answers <em>when?</em></Cat>
          <Cat name="Cause" eg="“because he was righteous”" ex={[{ g: "Ἰωσὴφ δίκαιος ὢν", e: "Joseph, because he was righteous", r: "Matt 1:19" }, { g: "πλανᾶσθε μὴ εἰδότες τὰς γραφάς", e: "you are wrong because you do not know the Scriptures", r: "Matt 22:29" }]}>answers <em>why?</em> — “because”</Cat>
          <Cat name="Means / Manner" eg="“by doing this…”" ex={[{ g: "τίς μεριμνῶν δύναται προσθεῖναι πῆχυν;", e: "who by worrying can add a single cubit?", r: "Matt 6:27" }, { g: "ἐπορεύοντο χαίροντες", e: "they went on their way rejoicing", r: "Acts 5:41" }]}>answers <em>how?</em></Cat>
          <Cat name="Condition" eg="“if you do this…”" ex={[{ g: "θερίσομεν μὴ ἐκλυόμενοι", e: "we will reap, if we do not give up", r: "Gal 6:9" }, { g: "πῶς ἡμεῖς ἐκφευξόμεθα τηλικαύτης ἀμελήσαντες σωτηρίας;", e: "how shall we escape if we neglect so great a salvation?", r: "Heb 2:3" }]}>the “if” on which the verb depends</Cat>
          <Cat name="Concession" eg="“although they knew God…”" ex={[{ g: "γνόντες τὸν θεὸν οὐχ ὡς θεὸν ἐδόξασαν", e: "although they knew God, they did not glorify him as God", r: "Rom 1:21" }, { g: "ὃν οὐκ ἰδόντες ἀγαπᾶτε", e: "though you have not seen him, you love him", r: "1 Pet 1:8" }]}>“although”</Cat>
          <Cat name="Purpose" ex={[{ g: "ἐληλύθει προσκυνήσων εἰς Ἰερουσαλήμ", e: "he had come to worship in Jerusalem", r: "Acts 8:27" }, { g: "ἴδωμεν εἰ ἔρχεται Ἠλίας σώσων αὐτόν", e: "let us see whether Elijah comes to save him", r: "Matt 27:49" }]}>answers <em>why?</em> looking forward — “in order to”</Cat>
        </CatGroup>
        <CatGroup label="Other uses">
          <Cat name="Attendant Circumstance" eg="“Go and make disciples”" ex={[{ g: "πορευθέντες μαθητεύσατε πάντα τὰ ἔθνη", e: "go and make disciples of all nations", r: "Matt 28:19" }, { g: "ἐγερθεὶς παράλαβε τὸ παιδίον", e: "rise and take the child", r: "Matt 2:13" }]}>translate as a finite verb + “and”; pigg-backs on the main verb</Cat>
          <Cat name="Periphrastic" ex={[{ g: "ἦν διδάσκων αὐτοὺς ὡς ἐξουσίαν ἔχων", e: "he was teaching them as one having authority", r: "Mark 1:22" }, { g: "ἦν ὁ λαὸς προσδοκῶν τὸν Ζαχαρίαν", e: "the people were waiting for Zechariah", r: "Luke 1:21" }]}>a participle + a form of <G>εἰμί</G> making one verbal idea</Cat>
          <Cat name="Imperatival" ex={[{ g: "τῇ ἐλπίδι χαίροντες, τῇ θλίψει ὑπομένοντες", e: "rejoice in hope, be patient in tribulation", r: "Rom 12:12" }, { g: "ἀποστυγοῦντες τὸ πονηρόν, κολλώμενοι τῷ ἀγαθῷ", e: "abhor what is evil, cling to what is good", r: "Rom 12:9" }]}>a participle functioning as a command</Cat>
          <Cat name="Genitive Absolute" ex={[{ g: "ὀψίας δὲ γενομένης", e: "when evening had come", r: "Matt 8:16" }, { g: "ἔτι αὐτοῦ λαλοῦντος ἰδοὺ Ἰούδας ἦλθεν", e: "while he was still speaking, behold, Judas came", r: "Matt 26:47" }]}>detached participle + noun, both genitive — usually background/time</Cat>
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
          <Cat name="Hortatory" eg="“let us love one another”" ex={[{ g: "ἀγαπῶμεν ἀλλήλους", e: "let us love one another", r: "1 John 4:7" }, { g: "διέλθωμεν ἕως Βηθλέεμ", e: "let us go over to Bethlehem", r: "Luke 2:15" }]}>1st person plural — an exhortation</Cat>
          <Cat name="Deliberative" eg="“what shall we say?”" ex={[{ g: "τί οὖν ποιήσωμεν;", e: "what then shall we do?", r: "Luke 3:10" }, { g: "δῶμεν ἢ μὴ δῶμεν;", e: "shall we pay, or shall we not?", r: "Mark 12:14" }]}>a real or rhetorical question about what to do</Cat>
          <Cat name="Emphatic Negation" eg="“will never perish”" ex={[{ g: "οὐ μὴ ἀπόλωνται εἰς τὸν αἰῶνα", e: "they shall never perish", r: "John 10:28" }, { g: "οἱ λόγοι μου οὐ μὴ παρέλθωσιν", e: "my words will never pass away", r: "Matt 24:35" }]}><G>οὐ μή</G> + aorist subjunctive — the strongest “no”</Cat>
          <Cat name="Prohibitive" eg="“do not fear”" ex={[{ g: "μὴ φοβηθῇς παραλαβεῖν Μαρίαν", e: "do not be afraid to take Mary", r: "Matt 1:20" }, { g: "μὴ δόξητε λέγειν ἐν ἑαυτοῖς", e: "do not presume to say among yourselves", r: "Matt 3:9" }]}><G>μή</G> + aorist subjunctive (a negative command)</Cat>
        </CatGroup>
        <CatGroup label="In dependent clauses">
          <Cat name="ἵνα + subjunctive" ex={[{ g: "ἵνα πᾶς ὁ πιστεύων εἰς αὐτὸν ἔχῃ ζωὴν αἰώνιον", e: "that whoever believes in him may have eternal life", r: "John 3:16" }, { g: "ἦλθεν ἵνα μαρτυρήσῃ περὶ τοῦ φωτός", e: "he came to bear witness about the light", r: "John 1:7" }]}>purpose (“in order that”) or result (“so that”)</Cat>
          <Cat name="Conditional" eg="“if you ask…”" ex={[{ g: "ἐάν τι αἰτήσητέ με, ἐγὼ ποιήσω", e: "if you ask me anything, I will do it", r: "John 14:14" }, { g: "ἐὰν ὁμολογῶμεν τὰς ἁμαρτίας ἡμῶν", e: "if we confess our sins", r: "1 John 1:9" }]}><G>ἐάν</G> + subjunctive — the 3rd-class condition</Cat>
          <Cat name="Indefinite" eg="ὃς ἄν “whoever,” ὅταν “whenever”" ex={[{ g: "ὃς ἂν ποιήσῃ τὸ θέλημα τοῦ θεοῦ", e: "whoever does the will of God", r: "Mark 3:35" }, { g: "ὅταν προσεύχησθε, λέγετε", e: "whenever you pray, say", r: "Luke 11:2" }]}>relative or temporal clauses with <G>ἄν</G></Cat>
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
        <P>The interpretive interest is in <em>how</em> it points — backward, forward, or with attitude ("Going deeper" below walks through the options). The reflexive <G>ἑαυτοῦ</G> and reciprocal <G>ἀλλήλων</G> complete the pointing family.</P>
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
        <P>The agreement rule ("gender/number backward, case inward") bends under <strong>attraction</strong> — a genitive or dative antecedent often pulls the relative into its own case ("Going deeper" below shows it in action). <G>ὃς ἄν</G> + subjunctive generalizes: "whoever."</P>
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
        <P>Only the present and imperfect actually contract — every other tense lengthens the stem vowel and regularizes. (The vowel-merge shortcuts sit beside the contraction table below.)</P>
        <P>Exceptions worth flagging: <G>καλέω</G> refuses to lengthen (<G>ἐκάλεσα</G>), <G>ζάω</G> contracts with η (<G>ζῇ</G>), and liquid futures mimic -έω presents (see Liquid Verbs).</P>
      </Note>
    ),
  },
  liquids: {
    beginning: (
      <Note>
        <P><T id="liquids.exp.b.intro"><strong>Liquid verbs</strong> have stems ending in the flowing consonants <G>λ, μ, ν, ρ</G> — sounds that refuse to sit next to <G>σ</G>. So their future and aorist form <em>without</em> the σ: future <G>μενῶ</G> "I will remain," aorist <G>ἔμεινα</G> "I remained."</T></P>
        <Hook><T id="liquids.exp.b.hook">In liquid verbs there is <strong>no σ in the future or aorist</strong>. The future wears φιλέω-style contract endings — often only the <em>accent</em> separates <G>μένω</G> "I remain" from <G>μενῶ</G> "I will remain."</T></Hook>
        <Eg><T id="liquids.exp.b.eg"><G>ἀποστέλλω → ἀπέστειλα</G> "I sent" — double λ slims to one, stem vowel stretches.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="liquids.exp.i.main">The stem-stretch (<G>μεν → μειν</G>) is <em>compensatory lengthening</em> — the lost σ's weight preserved in the vowel. Distinguish the liquid 1st aorist (<G>ἔκρινα</G>, α-endings) from the imperfect (<G>ἔκρινον</G>) by the ending vowel.</T></P>
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
        <P>Think in <strong>tense-systems</strong>, not tenses: each part's stem serves every mood of its system. The asides beside the grid map which endings and moods belong to which part, and "Going deeper" below follows the idea further.</P>
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
        <P>Three schemes coexist: <strong>Erasmian</strong> (classroom convention — maximally distinct), <strong>reconstructed Koine</strong> (closest to first-century speech), and <strong>Modern Greek</strong> (the living tradition, with <em>itacism</em>: <G>η ι υ ει οι υι</G> all sounding "ee"). Why the mergers matter for the manuscripts is the story of "Going deeper" below.</P>
      </Note>
    ),
  },
}
