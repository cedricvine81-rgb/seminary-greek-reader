'use client'

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
import { Tr, Term, useTm } from '@/components/morphology/shared'
import { useLocale, useT } from '@/lib/i18n/LocaleProvider'
import { K, localizeRef } from '@/lib/i18n/morph-fields'

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
  const t = useT()
  return (
    <p className="text-sm leading-relaxed text-gray-600 border-l-2 border-brand-200 pl-3">
      <span className="font-semibold text-gray-500 mr-1.5 text-xs uppercase tracking-wide">{t('morph.eg')}</span>
      {children}
    </p>
  )
}

/** Greek run kept in normal case (defensive — body text is not uppercased,
 *  but this keeps intent explicit and future-proofs against style changes). */
export function G({ children }: { children: React.ReactNode }) {
  return <span className="normal-case">{children}</span>
}
// This file marks Greek with its own `G`, not the chapters' `Gk` — same job, lighter styling.
// The role is what the translation serializer reads, so both are recognised without either
// component knowing about the other. See morph-markup.tsx.
G.i18nRole = 'greek' as const

/** Translatable prose in these notes, rendering {…} back as this file's own G. */
export function T({ id, children }: { id: string; children: React.ReactNode }) {
  return <Tr id={id} comps={{ Gk: G, Term }}>{children}</Tr>
}

/** A memory hook — the kind of "How to remember" mnemonic used in class. */
function Hook({ children }: { children: React.ReactNode }) {
  const t = useT()
  return (
    <p className="text-sm leading-relaxed text-gray-700 rounded-md bg-surface border border-brand-200 px-2.5 py-1.5">
      <span className="font-semibold text-brand-700 mr-1.5 text-xs uppercase tracking-wide">{t('morph.remember')}</span>
      {children}
    </p>
  )
}

/* A small wrapper so each explanation is a consistently-spaced stack. */
function Note({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

/** One syntax category: bold name — short gloss (optional simple example),
 *  then two real NT examples (Greek clause + English translation below).
 *  Exported: the per-level chapter pages build their case sections from these. */
export function Cat({ id, name, children, eg, ex }: {
  id?: string
  name: React.ReactNode
  children: React.ReactNode
  eg?: React.ReactNode
  ex?: { g: string; e: string; r: string }[]
}) {
  // Same contract as MorphTable: an `id` means "translate my string props". The description is
  // JSX, so the chapter wraps it in <T> itself; everything reachable from props is handled here.
  const tm = useTm()
  const locale = useLocale()
  if (id) {
    if (typeof name === 'string') name = tm(K.catName(id), name)
    if (typeof eg === 'string') eg = tm(K.catEg(id), eg)
    if (ex) ex = ex.map((x, i) => (x.e ? { ...x, e: tm(K.catEx(id, i), x.e) } : x))
  }
  if (ex) ex = ex.map(x => ({ ...x, r: localizeRef(x.r, locale) }))
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
export function CatGroup({ label, children }: { label?: React.ReactNode; children: React.ReactNode }) {
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
        <P><T id="essentials.exp.s1.b1">Greek nouns change their <strong>endings</strong> to show their job in a sentence (this is called <strong>case</strong>). The 1st and 2nd declensions are the two most common ending patterns. Masculine and neuter nouns usually use 2nd-declension endings (<G>‑ος, ‑ον</G>); feminine nouns usually use 1st-declension endings (<G>‑η / ‑α</G>). Look at the last letter or two to find the case.</T></P>
        <Eg><T id="essentials.exp.s1.b2">English does a tiny version of this: <em>he / him / his</em> is one word wearing three different endings for three different jobs. Greek does it to every noun.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s1.b3">The case names a noun's function: <strong>Nominative</strong> = subject, <strong>Genitive</strong> = "of" (possession/source), <strong>Dative</strong> = "to/for" (indirect object), <strong>Accusative</strong> = direct object. Two shortcuts save memory work: the neuter matches the masculine everywhere <em>except</em> the nominative and accusative, and the neuter nominative and accusative are always identical.</T></P>
        <P><T id="essentials.exp.s1.b4">Because endings repeat across genders (<G>‑ων</G> is the genitive plural for all three), let the <strong>article</strong> and context — not the bare ending — settle an ambiguous form.</T></P>
      </Note>
    ),
  },
  2: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s2.b1">The 3rd declension is the "irregular-looking" group, but its endings are actually very consistent. The trick is that the noun's <strong>stem</strong> is often hidden. You find it by dropping <G>‑ος</G> from the genitive singular.</T></P>
        <Eg><T id="essentials.exp.s2.b2"><G>σάρξ, σαρκός</G> → stem <G>σαρκ‑</G>. Learn the endings, then attach them to that stem. English does something similar with <em>ox → oxen</em> or <em>foot → feet</em> — a few nouns reshape before adding an ending.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s2.b3">Because the nominative singular often disguises the stem (letters collide when <G>‑ς</G> is added — <G>‑τ, ‑δ, ‑θ</G> drop out before <G>‑ς</G>), always parse a 3rd-declension noun from its <strong>genitive</strong>, not its nominative.</T></P>
        <P><T id="essentials.exp.s2.b4">The dative plural <G>‑σι(ν)</G> triggers the very same consonant + <G>σ</G> changes you meet in the future and aorist of verbs. Neuter nouns keep the two universal rules: nom. = acc., and the plural nom./acc. ends in <G>‑α</G>.</T></P>
      </Note>
    ),
  },
  3: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s3.b1">These are the two <strong>base</strong> sets of personal endings — every other tense is built from them. Personal endings tell you <strong>who</strong> acts (I, you, he/she/it, we, you-all, they). "Primary" endings go on present/future (non-past); "secondary" endings go on past tenses. The imperfect also adds an <G>ε‑</G> (an <strong>augment</strong>) to the front to mark past time.</T></P>
        <Eg><T id="essentials.exp.s3.b2">Active endings = the subject <em>does</em> the action; middle/passive endings = the subject <em>receives</em> it (or acts on itself).</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s3.b3">Master these two rows and you can rebuild the whole indicative system: the aorist, future, and perfect simply insert a tense marker and then <em>reuse these same endings</em>. The augment (<G>ε‑</G>, or a lengthened initial vowel) is the single most reliable signal of a past-time indicative.</T></P>
        <P><T id="essentials.exp.s3.b4">The 2nd-person middle forms (<G>‑ῃ / ‑ου</G>) look irregular because an <G>σ</G> between vowels dropped out — knowing that explains the odd spelling instead of forcing you to memorize it cold.</T></P>
      </Note>
    ),
  },
  4: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s4.b1">A <strong>tense identifier</strong> is a tell-tale letter (or two) added to a verb's stem that signals its tense. Learn these "flags" and you can spot a verb's tense at a glance: <G>‑σ‑</G> = future, <G>‑σα‑</G> = aorist active/middle, <G>‑θη‑</G> = aorist passive, <G>‑κα‑</G> = perfect active.</T></P>
        <Eg><T id="essentials.exp.s4.b2"><G>λύω</G> "I loose" → <G>λύσω</G> has <G>‑σ‑</G>, so it is future: "I <em>will</em> loose."</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s4.b3">Identifiers sit <em>between</em> the stem and the personal ending, so parsing is a two-step scan: (1) find the identifier for tense/voice, (2) read the ending for person/number.</T></P>
        <P><T id="essentials.exp.s4.b4">Watch for reduced forms — the <G>σ</G> of <G>‑σα</G> or the <G>θ</G> of <G>‑θη</G> can drop or assimilate next to certain endings, so recognize the <em>family</em> (σ-cluster = aorist, θ-cluster = passive) rather than an exact string. The perfect's reduplication (<G>λε‑λυ‑κα</G>) is a second, front-of-word flag reinforcing the <G>‑κα</G>.</T></P>
      </Note>
    ),
  },
  5: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s5.b1">This is the "recipe" for building any tense: start from the present or imperfect endings, then modify the connecting vowel with the right identifier. Past tenses (secondary) build on <strong>imperfect</strong> endings; non-past (primary) build on <strong>present</strong> endings.</T></P>
        <Eg><T id="essentials.exp.s5.b2">To make the aorist active, take the imperfect endings and swap the connecting vowel for <G>‑σα</G>: <G>ἔλυον</G> → <G>ἔλυσα</G>, "I loosed."</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s5.b3">The system is economical — you never memorize a brand-new paradigm, only a <em>transformation</em> applied to a base. "Insert" operations (future) keep primary endings; "replace" operations (aorist/perfect) reshape the connecting vowel and take secondary endings.</T></P>
        <P><T id="essentials.exp.s5.b4">Once this clicks, an unfamiliar form can be reverse-engineered: strip the ending, identify the marker, subtract it, and you are left with the lexical stem to look up in a dictionary.</T></P>
      </Note>
    ),
  },
  6: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s6.b1">A <strong>participle</strong> is a verbal adjective — an "‑ing" or "‑ed" word (loosing, loosed) that still describes a noun, so it takes noun-like endings for gender, case, and number. Know two patterns: the participle of <G>εἰμί</G> (<G>ὤν, οὖσα, ὄν</G> = "being"), and the middle/passive participle, which always contains the giveaway chunk <G>‑μεν‑</G> (<G>λυόμενος</G> = "being loosed").</T></P>
        <Eg><T id="essentials.exp.s6.b2">"The <em>running</em> water," "a <em>broken</em> cup" — participles describing nouns.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s6.b3">Spotting <G>‑μεν‑</G> instantly narrows a participle to middle/passive; its absence points to active. Active participles decline on a 3rd-declension pattern (masc./neut.) plus 1st-declension (fem.), which is why <G>‑ντ‑</G> surfaces (<G>λύο‑ντ‑ος</G>).</T></P>
        <P><T id="essentials.exp.s6.b4">Participles carry tense (aspect) and voice but no person, so translate them <em>relative to the main verb</em>: a present participle = same time / ongoing, an aorist participle = usually prior / completed action.</T></P>
      </Note>
    ),
  },
  7: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s7.b1">The <strong>subjunctive</strong> is the mood of "might / should" (potential, not fact); its flag is a <strong>lengthened</strong> connecting vowel (<G>ω/η</G> where the indicative had <G>ο/ε</G>). The <strong>imperative</strong> is the mood of commands ("Loose!"). For the imperative, memorize two endings: 3rd singular <G>‑τω</G> and 3rd plural <G>‑τωσαν</G>.</T></P>
        <Hook><T id="essentials.exp.s7.b2">The subjunctive usually announces itself with a "<strong>flag word</strong>" just before it — <G>ἵνα</G> / <G>ὅπως</G> (purpose) or <G>ἄν</G> / <G>ἐάν</G> (indefinite / conditional).</T></Hook>
        <Eg><T id="essentials.exp.s7.b3"><G>εἰμί</G> has its own subjunctive worth learning: <G>ὦ, ᾖς, ᾖ…</G></T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s7.b4">The subjunctive's long vowel is the whole tell — and <strong>no augment ever appears</strong>, even in the aorist subjunctive, because these moods express aspect, not time. So aorist subjunctive/imperative describe a single, whole action, while present forms describe ongoing action: the difference is <em>kind</em> of action, not <em>when</em>.</T></P>
        <P><T id="essentials.exp.s7.b5">Greek's third-person imperative (<G>‑τω</G>, "let him…") has no clean English equal, so translate with "let / should."</T></P>
      </Note>
    ),
  },
  8: {
    beginning: (
      <Note>
        <P><T id="essentials.exp.s8.b1">A small but very common group of verbs ends in <G>‑μι</G> instead of <G>‑ω</G>: <G>δίδωμι</G> "I give," <G>τίθημι</G> "I put," <G>ἵστημι</G> "I stand." They look strange because in the present and imperfect they <strong>reduplicate</strong> with an iota (<G>δι‑δω‑μι</G>) and their stem vowel shifts short/long (<G>δο/δω</G>).</T></P>
        <Hook><T id="essentials.exp.s8.b2"><G>‑μι</G> verbs have <strong>two stems</strong>: the <strong>present stem</strong> (longer) covers present + imperfect; the <strong>verbal stem</strong> (shorter) covers future, aorist + perfect.</T></Hook>
        <Eg><T id="essentials.exp.s8.b3">Good news: outside the present and imperfect, <G>‑μι</G> verbs behave almost like normal <G>‑ω</G> verbs.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="essentials.exp.s8.b4">The iota-reduplication is a <strong>present/imperfect-only</strong> flag — see it and you know the tense system; lose it and you are in the aorist/future/perfect, where μι-verbs act regularly on the short stem.</T></P>
        <P><T id="essentials.exp.s8.b5">Their aorist marker is <G>‑κα</G>, not <G>‑σα</G> (<G>ἔδωκα, ἔθηκα</G>), which is why their aorists resemble perfects — use reduplication and context to tell the two apart.</T></P>
      </Note>
    ),
  },
}

/* ─────────────────────────────────────────────
   Main topic tabs (all except Minimums)
───────────────────────────────────────────── */

export const TAB_EXPLANATIONS: Record<string, Explanation> = {
  // Sits before `nouns` because it is read before the nouns: the noun chapter's examples all
  // contain a verb, and this is the chapter that lets a student read them.
  'basic-verbs': {
    beginning: (
      <Note>
        <P><T id="basic-verbs.exp.b.intro">A Greek verb carries its subject in its <strong>ending</strong>, so no pronoun is needed where English demands one: <G>ἀκούω</G> is already "I hear," <G>ἀκούομεν</G> already "we hear." One set of six endings, learned once on <G>λύω</G>, works on every regular verb in the language. This chapter is deliberately small: one tense, one voice, one mood, and the handful of verbs the next two chapters actually use.</T></P>
        <Hook><T id="basic-verbs.exp.b.hook"><strong>Six endings, and they never change.</strong> <G>-ω, -εις, -ει, -ομεν, -ετε, -ουσι(ν)</G> — the stem in front of them is the only thing that differs from verb to verb. <G>εἰμί</G> "I am" is the one that has to be learned separately.</T></Hook>
        <Eg><T id="basic-verbs.exp.b.eg"><G>λύω</G> = "I loose" · <G>λύομεν</G> = "we loose." Same stem <G>λυ-</G>, different ending, different person.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="basic-verbs.exp.i.intro">The <G>ο/ε</G> alternating through these endings is the <strong>thematic vowel</strong>, and it is the thing to hold on to: the imperfect, the future and the second aorist are all built on this same stem with this same vowel, so what you learn here is not one tense but the frame the others hang on. The <G>-έω</G> verbs are not a second system either — <G>φιλέ-ω → φιλῶ</G> is these endings with two vowels run together, which is why the circumflex appears and why the lexicon still lists the uncontracted form.</T></P>
      </Note>
    ),
  },
  nouns: {
    beginning: (
      <Note>
        <P><T id="nouns.exp.b.intro">Greek nouns and adjectives share the same endings, so learning one set covers both. Every noun has a <strong>gender</strong> (masculine, feminine, neuter), and it shows its job by its <strong>case ending</strong>, not by word order as in English. The article ("the": <G>ὁ, ἡ, τό</G>) agrees with its noun in gender, case, and number — so it is your best clue when parsing. An adjective must "agree" with the noun it describes in the same three ways.</T></P>
        <Hook><T id="nouns.exp.b.hook">Three steps to translation: (1) work out the <strong>case</strong> of each word, (2) work out <strong>why</strong> it has that case, (3) then translate. And watch the breathings — <G>ἐν</G> "in" vs. <G>ἕν</G> "one," <G>εἰς</G> "into" vs. <G>εἷς</G> "one."</T></Hook>
        <Eg><T id="nouns.exp.b.eg"><G>καλὸς λόγος</G> = "a good word." Change the noun's case and the adjective changes to match.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="nouns.exp.i.intro">Each case does more than one job. These are the <strong>Essential Syntax Categories</strong> (after Wallace) — the functions you learn to name when you move from parsing to interpreting.</T></P>
        {/* The full case taxonomy lived here until the Intermediate level got its own
            chapter page (chapters/nouns-intermediate.tsx) — the four CatGroups now ARE
            that page's sections, under the same ids, so their translations moved with
            them. This card keeps only the orientation sentence. */}
      </Note>
    ),
  },
  pronouns: {
    beginning: (
      <Note>
        <P><T id="pronouns.exp.b.intro">A <strong>pronoun</strong> stands in for a noun ("he," "this," "who"). Like nouns, pronouns change endings for case, and they agree with what they replace in gender and number. <G>αὐτός</G> is the workhorse third-person pronoun ("he / she / it, they"). The personal pronouns <G>ἐγώ</G> ("I") and <G>σύ</G> ("you") simply have to be memorized.</T></P>
        <Eg><T id="pronouns.exp.b.eg"><G>βλέπω αὐτόν</G> = "I see <em>him</em>" (accusative = the object).</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <Hook><T id="pronouns.exp.i.hook">Is "himself" intensive or reflexive? <strong>Delete it.</strong> If the basic meaning is unchanged, it was intensive ("the king himself came"); if not, it was reflexive ("he saw himself"). And a very short word with a <em>rough</em> breathing is almost always a relative pronoun (<G>ὅς, ἥ, ὅ</G>).</T></Hook>
        <P><T id="pronouns.exp.i.main">Relative pronouns take their <em>gender and number</em> from their antecedent but their <em>case</em> from their own clause — a frequent parsing trap. And watch for forms of <G>οὗτος</G> that drop the <G>τ</G> (<G>οὗτος / αὕτη</G>).</T></P>
      </Note>
    ),
  },
  prepositions: {
    beginning: (
      <Note>
        <P><T id="prepositions.exp.b.intro"><strong>Prepositions</strong> are little words that show relationships — direction, place, means ("into," "from," "with"). In Greek a preposition <strong>governs a case</strong>: the noun after it must be in the case that preposition requires, and the meaning depends on that case. Some take only one case; others take two or three, with a different meaning for each.</T></P>
        <Eg><T id="prepositions.exp.b.eg"><G>ἐν</G> + dative = "in"; <G>εἰς</G> + accusative = "into." Learn each preposition together with its case(s) and gloss.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="prepositions.exp.i.main">A rough logic underlies the cases: <strong>genitive</strong> often = motion away / source, <strong>dative</strong> = position / rest, <strong>accusative</strong> = motion toward / extent. So with a three-case preposition like <G>ἐπί</G>, the case shifts the sense (<G>ἐπί</G> + gen. "on," + dat. "at," + acc. "onto / against").</T></P>
        <Hook><T id="prepositions.exp.i.hook">Where English uses "<strong>by</strong>" or "<strong>with</strong>" to show the instrument, Greek often needs <em>no preposition at all</em> — just the plain <strong>dative</strong> (<G>τῷ λόγῳ</G> = "with a word").</T></Hook>
      </Note>
    ),
  },
  conjunctions: {
    beginning: (
      <Note>
        <P><T id="conjunctions.exp.p.conditional-sentence-part">A <strong>conditional sentence</strong> has an "if" part (the <strong>protasis</strong>) and a "then" part (the <strong>apodosis</strong>). Greek uses different words and moods to show how likely the "if" is. <strong>First class</strong> (<G>εἰ</G> + indicative) assumes it is true for the sake of argument. <strong>Second class</strong> (<G>εἰ</G> + indicative … <G>ἄν</G>) is "contrary to fact." <strong>Third class</strong> (<G>ἐάν</G> + subjunctive) is the "maybe / future" condition.</T></P>
        <Hook><T id="conjunctions.exp.hook.class-one-word">1st class = <G>εἰ</G> = <strong>One Word</strong> · 2nd class = <G>εἰ + ἄν</G> = <strong>Two Words</strong> · 3rd class = <G>ἐάν</G> = <strong>Three Letters</strong>.</T></Hook>
        <Eg><T id="conjunctions.exp.eg.like-greek-wise">1st: "<em>If</em> you like Greek, you are wise" (says nothing about whether you actually do — <em>if</em> it's true, <em>then</em> the result follows). 3rd: "<em>If</em> you like Greek, you <em>will</em> learn it."</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="conjunctions.exp.p.classify-protasis-class">Classify by the <strong>protasis</strong>: 1st class <G>εἰ</G> + indicative (assumed true <em>for the argument</em>, not necessarily factually true); 2nd class <G>εἰ</G> + past indicative with <G>ἄν</G> in the apodosis (contrary to fact — "if he were… but he isn't"); 3rd class <G>ἐάν</G> + subjunctive (probable / uncertain future, or a general truth).</T></P>
        <P><T id="conjunctions.exp.p.class-describes-speaker's">The class describes the speaker's <em>rhetorical stance</em>, not objective reality — a first-class condition can frame something the speaker knows is false, purely for argument.</T></P>
        <Hook><T id="conjunctions.exp.hook.english-contrary-fact">In English, a <strong>contrary-to-fact</strong> (2nd class) condition is marked by "<strong>would</strong>" in the apodosis: "If you had liked Greek, you <em>would</em> have learnt it." The <G>ἄν</G> is its Greek signal.</T></Hook>
      </Note>
    ),
  },
  'conj-adv': {
    beginning: (
      <Note>
        <P><T id="conj-adv.exp.p.conjunctions-joining-words"><strong>Conjunctions</strong> are joining words. <em>Coordinating</em> conjunctions link equal parts and often begin a main clause (<G>καί</G> "and," <G>ἀλλά</G> "but," <G>οὖν</G> "therefore"). <em>Subordinating</em> conjunctions start a dependent clause that cannot stand alone (<G>ὅτι</G> "that / because," <G>ἵνα</G> "in order that," <G>εἰ</G> "if"). <strong>Adverbs</strong> are different — they modify a verb, telling <em>how, when,</em> or <em>where</em> (<G>οὕτως</G> "thus," <G>τότε</G> "then," <G>ἐκεῖ</G> "there").</T></P>
        <Hook><T id="conj-adv.exp.hook.greek-words-ending">Greek words ending in <G>‑ως</G> are usually <strong>adverbs</strong> — <G>καλῶς</G> "well," <G>οὕτως</G> "thus," <G>ὁμοίως</G> "likewise" (compare the adjective <G>καλός</G> "good"). Because word order is flexible, these connectors are your key to a sentence's logic.</T></Hook>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="conj-adv.exp.p.conjunctions-backbone-discourse">Conjunctions are the backbone of <strong>discourse analysis</strong>: they signal continuation (<G>καί, δέ</G>), contrast (<G>ἀλλά</G>), inference (<G>οὖν, διό</G>), and ground / explanation (<G>γάρ</G>), letting you trace an author's argument clause by clause.</T></P>
        <P><T id="conj-adv.exp.p.some-conjunctions-predict">Some conjunctions predict the verb's mood — <G>ἵνα, ἐάν, ὅταν, ὅπως</G> typically take the subjunctive; <G>ὅτι, εἰ, καθώς</G> typically the indicative — so the conjunction previews the grammar. Set phrases like <G>διὰ τοῦτο</G> ("for this reason") or <G>διὰ τί</G> ("why?") often work as fixed discourse markers opening a new thought.</T></P>
      </Note>
    ),
  },
  indicatives: {
    beginning: (
      <Note>
        <P><T id="indicatives.exp.b.intro">The <strong>indicative</strong> is the mood of plain fact — it states what actually happens, happened, or will happen. This tab lays out <G>λύω</G> ("I loose") across all its tenses and voices as the model verb. For each form, focus on two things: the <strong>tense identifier</strong> (which tense/voice) and the <strong>personal ending</strong> (who). <G>εἰμί</G> ("I am") is irregular and worth memorizing on its own.</T></P>
        <Eg><T id="indicatives.exp.b.hook">"She <em>writes</em> / she <em>wrote</em> / she <em>will write</em>" — one verb, different tenses. Greek marks these on the verb itself.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="indicatives.exp.b.eg">In the <em>indicative</em>, tense encodes both <strong>time</strong> and <strong>aspect</strong>. The same form can be put to several uses; naming the use is the interpretive step. These are the <strong>Essential Syntax Categories</strong> for the tenses (after Wallace).</T></P>
        {/* The category groups moved into the chapter body when this level got its own
            page (chapters/indicatives-intermediate.tsx) — same ids, so the translations went
            with them. The card keeps its orientation prose. */}

      </Note>
    ),
  },
  infinitives: {
    beginning: (
      <Note>
        <P><T id="infinitives.exp.p.infinitive-form-verb">An <strong>infinitive</strong> is the "to ‑" form of a verb (<G>λύειν</G> "to loose"). It names the action without a subject, person, or number, so it does not change for "I / you / he." Mostly you just recognize two forms: present active (<G>‑ειν</G>) and aorist active (<G>‑σαι</G>). The aorist infinitive has the <G>σ</G> but — importantly — <strong>no augment</strong> (augments live only in the indicative).</T></P>
        <Eg><T id="infinitives.exp.eg.want-loose"><G>θέλω λύειν</G> = "I want <em>to loose</em>."</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="infinitives.exp.p.infinitive-verbal-noun">The infinitive is a <strong>verbal noun</strong>, so it can take an article (<G>τό</G>) and even a subject in the accusative (<G>θέλω τὸν ἄγγελον ἀπελθεῖν</G> = "I want the messenger to depart"). These are its <strong>Essential Syntax Categories</strong> (after Wallace).</T></P>
        <P><T id="infinitives.exp.p.present-aorist-infinitive">Present vs. aorist infinitive is aspect, not time: ongoing vs. simple action.</T></P>
        {/* The category groups moved into the chapter body when this level got its own
            page (chapters/infinitives-intermediate.tsx) — same ids, so the translations went
            with them. The card keeps its orientation prose. */}

      </Note>
    ),
  },
  imperatives: {
    beginning: (
      <Note>
        <P><T id="imperatives.exp.p.imperative-command-mood">The <strong>imperative</strong> is the command mood ("Loose!" "Believe!"). Greek has both 2nd-person ("you, do this") and 3rd-person imperatives (literally "let him do this"), which English lacks. You mainly memorize the 2nd-person forms plus the endings <G>‑τω</G> (3rd sg.) and <G>‑τωσαν</G> (3rd pl.). Aorist imperatives have the <G>σ</G> but no augment.</T></P>
        <Eg><T id="imperatives.exp.eg.believe-present-keep"><G>πίστευε</G> = "Believe!" (present — "keep on believing").</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="imperatives.exp.p.present-aorist-imperative">Present vs. aorist imperative is <strong>aspect</strong>: present = ongoing / general ("make it your practice to…"), aorist = a specific, whole action ("do it"). The aorist is the more common of the two, so take note when the <em>present</em> imperative is chosen. These are its <strong>Essential Syntax Categories</strong> (after Wallace).</T></P>

        <Hook><T id="imperatives.exp.hook.prohibitions-split-aspect">Prohibitions split by aspect: <G>μή</G> + <strong>present</strong> imperative = "stop / don't keep doing," while <G>μή</G> + <strong>aorist</strong> subjunctive = "don't start / don't ever."</T></Hook>
        <Hook><T id="imperatives.exp.hook.it's-easy-confuse">It's easy to confuse the <strong>future indicative</strong> and the <strong>aorist imperative</strong> — both have a <G>σ</G> and no augment. The <em>endings</em> decide: <G>πίστευσον</G> "Believe!" (aor. imperative) vs. <G>πιστεύσομεν</G> "we will believe" (fut. indicative).</T></Hook>
        {/* The category list moved into chapters/imperatives-intermediate.tsx when this
            level got its own page — same ids, so the translations went with it. */}
      </Note>
    ),
  },
  participles: {
    beginning: (
      <Note>
        <P><T id="participles.exp.b.intro">A <strong>participle</strong> is a verbal adjective — part verb (tense, voice), part adjective (gender, case, number). Translate it with "‑ing" (active: <G>λύων</G> "loosing") or "‑ed / being" (middle/passive: <G>λυόμενος</G> "being loosed"). It agrees with the noun it describes, and the middle/passive form always shows the chunk <G>‑μεν‑</G>.</T></P>
        <Hook><T id="participles.exp.b.hook">Present participle = <strong>Simultaneous</strong> (same time as the main verb) · Aorist participle = <strong>Sequence</strong> (before the main verb).</T></Hook>
        <Eg><T id="participles.exp.b.eg">Present: "<em>While eating</em>, the man read his newspaper." Aorist: "<em>Having eaten</em>, the man read his newspaper." Same actions — the participle's tense just tells you the timing.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="participles.exp.i.intro">The first question is <strong>article or no article?</strong> With the article the participle is <em>adjectival</em>; without it, usually <em>adverbial</em>. These are its <strong>Essential Syntax Categories</strong> (after Wallace).</T></P>
        <Hook><T id="participles.exp.x.b1">Don't be afraid to add "<strong>who</strong>" for a substantival participle, and if the first word of a sentence is <strong>genitive</strong>, <em>think genitive absolute</em> — its subject differs from the main verb's (<G>ὀψίας γενομένης</G>… = "when evening had come…").</T></Hook>
        {/* The category groups moved into the chapter body when this level got its own
            page (chapters/participles-intermediate.tsx) — same ids, so the translations went
            with them. The card keeps its orientation prose. */}

      </Note>
    ),
  },
  subjunctives: {
    beginning: (
      <Note>
        <P><T id="subjunctives.exp.p.subjunctive-mood-possibility">The <strong>subjunctive</strong> is the mood of possibility — "might, may, should" rather than plain fact. Its signal is a <strong>long connecting vowel</strong> (<G>ω/η</G>). It rarely stands alone; it usually follows a trigger word like <G>ἵνα</G> ("in order that"), <G>ἐάν</G> ("if"), or <G>ὅταν</G> ("whenever"). There is no past time here — even the aorist subjunctive is not past; the tense only shows aspect.</T></P>
        <Hook><T id="subjunctives.exp.hook.each-common-use">Each common use has a "<strong>flag word</strong>" that alerts you the subjunctive is coming: <G>ἵνα</G> / <G>ὅπως</G> (purpose) or <G>ἄν</G> / <G>ἐάν</G> (indefinite / conditional).</T></Hook>
        <Eg><T id="subjunctives.exp.eg.order-may-loose"><G>ἵνα λύῃ</G> = "in order that he <em>may</em> loose."</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="subjunctives.exp.p.these-essential-syntax">These are its <strong>Essential Syntax Categories</strong> (after Wallace) — some standing alone, some inside a dependent clause.</T></P>
        <P><T id="subjunctives.exp.p.because-subjunctive-carries">Because the subjunctive carries aspect only, choose your English helper ("may / should / might") from the <em>clause type</em>, not from a fixed gloss.</T></P>
        {/* The category groups moved into the chapter body when this level got its own
            page (chapters/subjunctives-intermediate.tsx) — same ids, so the translations went
            with them. The card keeps its orientation prose. */}

      </Note>
    ),
  },
  'mi-verbs': {
    beginning: (
      <Note>
        <P><T id="mi-verbs.exp.p.most-greek-verbs">Most Greek verbs end in <G>‑ω</G>, but a handful of very common ones end in <G>‑μι</G>: <G>δίδωμι</G> ("I give"), <G>τίθημι</G> ("I put / place"), <G>ἵστημι</G> ("I stand"). They look odd because in the present/imperfect they double their first sound with an iota (<G>δι‑δωμι</G>) and their stem vowel swaps short/long (<G>δο/δω</G>). Learn these few verbs as high-frequency VIPs.</T></P>
        <Hook><T id="mi-verbs.exp.hook.verbs-two-stems"><G>‑μι</G> verbs have <strong>two stems</strong>: the <strong>present stem</strong> (longer, reduplicated) is used for the present and imperfect; the <strong>verbal stem</strong> (shorter) is used for the future, aorist, and perfect.</T></Hook>
        <Eg><T id="mi-verbs.exp.eg.give"><G>δίδωμι σοι</G> = "I give <em>to you</em>."</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="mi-verbs.exp.p.iota-reduplication-marks">The iota-reduplication marks <strong>present/imperfect only</strong>; elsewhere μι-verbs revert to the short stem and act like <G>‑ω</G> verbs, with an aorist in <G>‑κα</G> (<G>ἔδωκα, ἔθηκα</G>) rather than <G>‑σα</G>.</T></P>
      </Note>
    ),
  },
  '2nd-aorists': {
    beginning: (
      <Note>
        <P><T id="2nd-aorists.exp.p.aorist-simple-past">The <strong>aorist</strong> (simple past, "he did") normally shows a <G>‑σα‑</G> marker (1st aorist). But some verbs form their aorist a different way — by <strong>changing the stem itself</strong> — and these are called <strong>2nd</strong> (or "strong") aorists. They use the same endings as the imperfect, but with a changed stem and no <G>‑σα</G>. You basically memorize them as vocabulary.</T></P>
        <Eg><T id="2nd-aorists.exp.eg.take-took-stem"><G>λαμβάνω</G> "I take" → <G>ἔλαβον</G> "I took" (stem changed <G>λαμβαν‑</G> → <G>λαβ‑</G>).</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="2nd-aorists.exp.p.aorist-identified-three">A 2nd aorist is identified by three clues <em>together</em>: an augment, a stem different from the present, and no <G>σα/θη</G> marker. The meaning is the ordinary aorist (perfective aspect) — only the way the form is built differs, like English <em>go → went</em> vs. <em>walk → walked</em>.</T></P>
        <P><T id="2nd-aorists.exp.p.some-verbs-suppletive">Some verbs are <strong>suppletive</strong>, borrowing a totally different root for the aorist (<G>λέγω → εἶπον</G>, <G>ὁράω → εἶδον</G>). Learn the aorist stem as one of the verb's <em>principal parts</em> so you can trace an unfamiliar form back to its lexical form.</T></P>
      </Note>
    ),
  },
  deponents: {
    beginning: (
      <Note>
        <P><T id="deponents.exp.p.deponent-verb-looks">A <strong>deponent</strong> verb looks middle or passive (its ending is <G>‑ομαι</G>, not <G>‑ω</G>) but means something <strong>active</strong>. It has "laid aside" (deponent = "putting off") its active forms. So <G>ἔρχομαι</G> looks passive but simply means "I come / go." You just translate it actively; the middle/passive form is its normal, only form, and its dictionary form ends in <G>‑ομαι</G>.</T></P>
        <Hook><T id="deponents.exp.hook.vast-majority-time">The vast majority of the time you meet a <strong>middle</strong> form, it is simply a deponent verb carrying an active meaning — so reach for "deponent" first.</T></Hook>
        <Eg><T id="deponents.exp.eg.answer-active-meaning"><G>ἀποκρίνομαι</G> = "I answer" — active meaning, middle/passive form.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="deponents.exp.p.parse-deponent-exactly">Parse a deponent exactly as you would any middle/passive form (tense, person, number), but translate with the <em>active</em> gloss your lexicon gives. Some are middle in the future/aorist; others are passive in the aorist (<G>ἀποκρίνομαι → ἀπεκρίθην</G>).</T></P>
      </Note>
    ),
  },
  demonstratives: {
    beginning: (
      <Note>
        <P><T id="demonstratives.exp.p.demonstratives-pointing-words">The <strong>demonstratives</strong> are the pointing words: <G>οὗτος</G> "this" (near) and <G>ἐκεῖνος</G> "that" (far). They agree with their noun in gender, case, and number — and unlike adjectives, they stand <em>outside</em> the article-noun unit: <G>οὗτος ὁ ἄνθρωπος</G> = "this man."</T></P>
        <Hook><T id="demonstratives.exp.hook.watch-breathing-rough">Watch the breathing: <G>αὕτη</G> (rough) = "this woman"; <G>αὐτή</G> (smooth) = "she." One mark, two different words.</T></Hook>
        <Eg><T id="demonstratives.exp.eg.these-things-one"><G>ταῦτα</G> = "these things" — one of the most common words in the NT.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="demonstratives.exp.p.follows-article's-front"><G>οὗτος</G> follows the article's front-end pattern (rough breathing in the nom. masc./fem., <G>τ‑</G> elsewhere) with 1st/2nd-declension endings. Standing alone it is a full pronoun (<G>οὗτός ἐστιν ὁ υἱός μου</G>).</T></P>
        <P><T id="demonstratives.exp.p.interpretive-interest-how">The interpretive interest is in <em>how</em> it points — backward, forward, or with attitude ("Going deeper" below walks through the options). The reflexive <G>ἑαυτοῦ</G> and reciprocal <G>ἀλλήλων</G> complete the pointing family.</T></P>
      </Note>
    ),
  },
  relatives: {
    beginning: (
      <Note>
        <P><T id="relatives.exp.p.relative-pronoun-who">The <strong>relative pronoun</strong> <G>ὅς, ἥ, ὅ</G> ("who, which, that") folds one clause inside another: <G>ὁ ἀνὴρ ὃν εἶδον</G>, "the man whom I saw." It looks like the article without the <G>τ</G> — but always with a rough breathing <em>and</em> an accent.</T></P>
        <Hook><T id="relatives.exp.hook.very-short-word">A very short word with a rough breathing and an accent is almost certainly a relative pronoun (<G>ἥ</G> ≠ <G>ἡ</G>, <G>οἵ</G> ≠ <G>οἱ</G>).</T></Hook>
        <Eg><T id="relatives.exp.eg.gender-amp-number">Gender &amp; number come from the noun it points back to; its <em>case</em> comes from its own job in its clause.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="relatives.exp.p.agreement-rule-gender">The agreement rule ("gender/number backward, case inward") bends under <strong>attraction</strong> — a genitive or dative antecedent often pulls the relative into its own case ("Going deeper" below shows it in action). <G>ὃς ἄν</G> + subjunctive generalizes: "whoever."</T></P>
      </Note>
    ),
  },
  'contract-verbs': {
    beginning: (
      <Note>
        <P><T id="contract-verbs.exp.p.contract-verbs-stems"><strong>Contract verbs</strong> have stems ending in <G>ε, α,</G> or <G>ο</G>, which fuse with the connecting vowel — like English "do not → don't": <G>φιλέ‑ομεν → φιλοῦμεν</G>. Dictionaries list the uncontracted form (<G>φιλέω</G>), but texts always show the contracted one (<G>φιλῶ</G>).</T></P>
        <Hook><T id="contract-verbs.exp.hook.circumflex-present-tense">A <strong>circumflex</strong> on a present-tense ending (<G>ποιεῖ, ἀγαπᾷ, πληροῖ</G>) is contraction's scar — you're looking at a contract verb.</T></Hook>
        <Eg><T id="contract-verbs.exp.eg.outside-present-imperfect">Outside the present/imperfect the stem vowel just lengthens (<G>ἀγαπάω → ἠγάπησα</G>) and the verb behaves like <G>λύω</G>.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="contract-verbs.exp.p.only-present-imperfect">Only the present and imperfect actually contract — every other tense lengthens the stem vowel and regularizes. (The vowel-merge shortcuts sit beside the contraction table below.)</T></P>
        <P><T id="contract-verbs.exp.p.exceptions-worth-flagging">Exceptions worth flagging: <G>καλέω</G> refuses to lengthen (<G>ἐκάλεσα</G>), <G>ζάω</G> contracts with η (<G>ζῇ</G>), and liquid futures mimic -έω presents (see Liquid Verbs).</T></P>
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
        <P><T id="principal-parts.exp.b.intro">Greek dictionaries describe a verb by its six <strong>principal parts</strong> — like English "sing, sang, sung," but six slots: present, future, aorist, perfect active, perfect middle/passive, aorist passive (<G>λύω, λύσω, ἔλυσα, λέλυκα, λέλυμαι, ἐλύθην</G>). Every form you will ever meet descends from one of the six.</T></P>
        <Hook><T id="principal-parts.exp.b.hook">Learn a rebel verb's row as a <strong>chant</strong>, left to right — <G>λέγω, ἐρῶ, εἶπον, εἴρηκα, εἴρημαι, ἐρρέθην</G> — exactly as you learned <em>sing, sang, sung</em>.</T></Hook>
        <Eg><T id="principal-parts.exp.b.eg">Regular verbs are predictable; memorize only the rebels (<G>ἔρχομαι, ὁράω, φέρω</G>…) — which are the very verbs on every page.</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="principal-parts.exp.i.main">Think in <strong>tense-systems</strong>, not tenses: each part's stem serves every mood of its system. The asides beside the grid map which endings and moods belong to which part, and "Going deeper" below follows the idea further.</T></P>
      </Note>
    ),
  },
  pronunciation: {
    beginning: (
      <Note>
        <P><T id="pronunciation.exp.b.intro">Greek's 24 letters are the ancestors of your own alphabet — many are old friends (<G>α β δ κ τ</G>), a few are impostors (<G>ν</G> is n, not v; <G>ρ</G> is r, not p), and three are genuinely new (<G>ξ χ ψ</G>). This course reads Greek with the <strong>Erasmian</strong> pronunciation: one distinct sound per letter, so spelling and sound always match.</T></P>
        <Hook><T id="pronunciation.exp.b.hook"><strong>Breathings are essential; accents are unimportant</strong> (for now). Every vowel-initial word carries a breathing — rough <G>῾</G> = h-sound, smooth <G>᾿</G> = silent but still required.</T></Hook>
        <Eg><T id="pronunciation.exp.b.eg"><G>ἅγιος</G> = <em>hagios</em> "holy" · <G>ἄγγελος</G> = <em>angelos</em> "angel" (and γγ = "ng").</T></Eg>
      </Note>
    ),
    intermediate: (
      <Note>
        <P><T id="pronunciation.exp.i.intro">Three schemes coexist: <strong>Erasmian</strong> (classroom convention — maximally distinct), <strong>reconstructed Koine</strong> (closest to first-century speech), and <strong>Modern Greek</strong> (the living tradition, with <em>itacism</em>: <G>η ι υ ει οι υι</G> all sounding "ee"). Why the mergers matter for the manuscripts is the story of "Going deeper" below.</T></P>
      </Note>
    ),
  },
}
