/* ─────────────────────────────────────────────
   Chapter: Prepositions

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences, DropdownPractice, HomeworkAssignments,  Tr,
} from '../shared'
import { CONSTRUCT_PRESETS } from '@/lib/construct-presets'

// Preposition-plus-case searches from Construct search, drawn from the preset list so the
// chapter and the search stay in step.
const PREPOSITION_CASES = CONSTRUCT_PRESETS.find(g => g.heading === 'Prepositions and their cases')!.presets

export const PREPOSITIONS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="prepositions.h.start-english-little">Start with English: the little relationship words</SectionHeading>
      <P id="prepositions.p.cat-box-cat">
        "The cat is <em>in</em> the box. The cat jumped <em>onto</em> the box. The cat came <em>out of</em> the
        box." Those little words — <em>in, onto, out of, with, from, through</em> — are
        {' '}<Term t="preposition">prepositions</Term>: they pin down the relationship (usually of place, time, or
        means) between the action and a noun. "Pre-position" is literal: they sit <em>before</em> the noun.
      </P>
      <P id="prepositions.p.greek-prepositions-come">
        Greek prepositions come with one twist. Each preposition <strong>governs a case</strong> — it dictates
        which case the noun after it must wear. And some prepositions govern two or even three cases,
        <em>with a different meaning for each</em>. So a Greek preposition is really a
        preposition-plus-case <em>pair</em>: learn <Gk>διά</Gk>-with-genitive ("through") and
        <Gk> διά</Gk>-with-accusative ("because of") as two different vocabulary items.
      </P>
    </LevelOnly>

    {/* ── 2 · The spatial logic ──────────────────────────── */}
    <SectionHeading id="prepositions.h.logic-behind-cases">The logic behind the cases</SectionHeading>
    <P id="prepositions.p.case-pairings-random">
      The case pairings are not random — they ride on the cases' own instincts, which you can picture as
      motion in a diagram: the <Term t="genitive">genitive</Term> leans toward <strong>away from / out
      of</strong> (source), the <Term t="dative">dative</Term> toward <strong>resting at</strong> (position),
      and the <Term t="accusative">accusative</Term> toward <strong>movement toward</strong> (goal). Keep that
      triangle in your head and many meanings become guessable.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="prepositions.al.triangle-action">The triangle in action</Tr></AsideLabel>
        <Ex grc="ἐκ τοῦ οἴκου" en={<Tr id="prepositions.ex.out-house-gen">out of the house (gen. — away)</Tr>} />
        <Ex grc="ἐν τῷ οἴκῳ" en={<Tr id="prepositions.ex.house-dat-rest">in the house (dat. — at rest)</Tr>} />
        <Ex grc="εἰς τὸν οἶκον" en={<Tr id="prepositions.ex.into-house-acc">into the house (acc. — toward)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="prepositions.as.one-case-prepositions">The one-case prepositions are the purest expression of the triangle: <Gk>ἀπό/ἐκ</Gk> + gen. (away), <Gk>ἐν/σύν</Gk> + dat. (rest, accompaniment), <Gk>εἰς/πρός</Gk> + acc. (toward).</Tr></p>
      </>}
    >
      <MorphTable id="prepositions.t1" tCols={[1, 2]} flush title="One-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
        rows={[
          ['ἀντί',    '+ genitive',   'instead of, in place of'],
          ['ἀπό',     '+ genitive',   'from, away from'],
          ['ἐκ / ἐξ', '+ genitive',   'out of, from'],
          ['εἰς',     '+ accusative', 'into, to'],
          ['πρός',    '+ accusative', 'to, toward'],
          ['ἐν',      '+ dative',     'in, among'],
          ['σύν',     '+ dative',     'with'],
        ]}
      />
    </TableAside>

    <DropdownPractice id="prepositions.d1"
      title="Practice — which case follows?"
      intro={<Tr id="prepositions.intro.one-case-prepositions-2">The one-case prepositions are the pure triangle: away = genitive, rest = dative, toward = accusative.</Tr>}
      options={["Genitive", "Dative", "Accusative"]}
      items={[
        { q: <Tr id="prepositions.q.away-from"><span className="normal-case">ἀπό</span> — away from</Tr>, answer: "Genitive" },
        { q: <Tr id="prepositions.q.in"><span className="normal-case">ἐν</span> — in</Tr>, answer: "Dative" },
        { q: <Tr id="prepositions.q.into"><span className="normal-case">εἰς</span> — into</Tr>, answer: "Accusative" },
        { q: <Tr id="prepositions.q.out-of"><span className="normal-case">ἐκ</span> — out of</Tr>, answer: "Genitive" },
        { q: <Tr id="prepositions.q.toward"><span className="normal-case">πρός</span> — toward</Tr>, answer: "Accusative" },
        { q: <Tr id="prepositions.q.with"><span className="normal-case">σύν</span> — with</Tr>, answer: "Dative" },
      ]}
    />

    <ClassSentences id="prepositions.cs1"
      lesson="Lesson 3 · One-case prepositions"
      items={[
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "μαθηταί", parsing: "Nom Pl Masc — μαθητής", syntax: "Subject", gloss: "disciples" },
          { w: "εἰσιν", parsing: "Pres Act Ind 3 Pl — εἰμί", gloss: "are" },
          { w: "ἐν", parsing: "Preposition + dative", gloss: "in" },
          { w: "τῷ", parsing: "Article — Dat Sg Neut", gloss: "the" },
          { w: "ἱερῷ.", parsing: "Dat Sg Neut — ἱερόν", gloss: "temple" },
        ],
          translation: "The disciples are in the temple.",
        },
        { words: [
          { w: "πιστεύομεν", parsing: "Pres Act Ind 1 Pl — πιστεύω", gloss: "we believe" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "in/into" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "κύριον.", parsing: "Acc Sg Masc — κύριος", gloss: "Lord" },
        ],
          translation: "We believe in the Lord.",
          note: "πιστεύω εἰς + accusative — the NT idiom for trusting into someone.",
        },
        { words: [
          { w: "ἀκούομεν", parsing: "Pres Act Ind 1 Pl — ἀκούω", gloss: "we hear" },
          { w: "φωνὴν", parsing: "Acc Sg Fem — φωνή", syntax: "Direct Object", gloss: "a voice" },
          { w: "ἐκ", parsing: "Preposition + genitive", gloss: "out of" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "the" },
          { w: "οὐρανοῦ.", parsing: "Gen Sg Masc — οὐρανός", gloss: "heaven" },
        ],
          translation: "We hear a voice from heaven.",
          note: "Echoes Mark 1:11 — φωνὴ ἐκ τῶν οὐρανῶν.",
        },
        { words: [
          { w: "ἔχομεν", parsing: "Pres Act Ind 1 Pl — ἔχω", gloss: "we have" },
          { w: "εἰρήνην", parsing: "Acc Sg Fem — εἰρήνη", syntax: "Direct Object", gloss: "peace" },
          { w: "ἀπὸ", parsing: "Preposition + genitive", gloss: "from" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "the" },
          { w: "θεοῦ.", parsing: "Gen Sg Masc — θεός", gloss: "God" },
        ],
          translation: "We have peace from God.",
          note: "Romans 1:7 — εἰρήνη ἀπὸ θεοῦ πατρὸς ἡμῶν.",
        },
        { words: [
          { w: "οἱ", parsing: "Article — Nom Pl Masc", gloss: "the" },
          { w: "ἀδελφοί", parsing: "Nom Pl Masc — ἀδελφός", syntax: "Subject", gloss: "brothers" },
          { w: "εἰσιν", parsing: "Pres Act Ind 3 Pl — εἰμί", gloss: "are" },
          { w: "σὺν", parsing: "Preposition + dative", gloss: "with" },
          { w: "τοῖς", parsing: "Article — Dat Pl Masc", gloss: "the" },
          { w: "μαθηταῖς.", parsing: "Dat Pl Masc — μαθητής", gloss: "disciples" },
        ],
          translation: "The brothers are with the disciples.",
        },
        { words: [
          { w: "λέγομεν", parsing: "Pres Act Ind 1 Pl — λέγω", gloss: "we speak" },
          { w: "πρὸς", parsing: "Preposition + accusative", gloss: "to/toward" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "θεόν.", parsing: "Acc Sg Masc — θεός", gloss: "God" },
        ],
          translation: "We speak to God.",
        },
      ]}
    />

    {/* ── 3 · Two-case ───────────────────────────────────── */}
    <SectionHeading id="prepositions.h.two-cases-two">Two cases, two meanings</SectionHeading>
    <P id="prepositions.p.these-case-following">
      With these, the case of the following noun is not decoration — it <em>selects the meaning</em>. Before
      translating, glance past the preposition to the noun's article and ending, then choose the row.
    </P>
    <TableAside
      beginning={<>
        <p><Tr id="prepositions.as.these-take-two">These take <em>two</em> cases — and the case changes the meaning. Always check the ending of the following noun.</Tr></p>
        <Ex grc="διὰ τοῦ ἀγγέλου" en={<Tr id="prepositions.ex.through-messenger-gen">through the messenger (gen.)</Tr>} />
        <Ex grc="διὰ τὸν ὄχλον" en={<Tr id="prepositions.ex.because-crowd-acc">because of the crowd (acc.)</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="prepositions.as.genitive-typically-keeps">The genitive typically keeps the "source / through" sense, the accusative the "toward / because-of" sense — the same gen.-vs-acc. logic you meet everywhere.</Tr></p>
      </>}
    >
      <MorphTable id="prepositions.t2" tCols={[1, 2]} flush title="Two-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
        rows={[
          ['διά',  '+ genitive',  'through'],
          ['',     '+ accusative','because of'],
          ['κατά', '+ genitive',  'against, down from'],
          ['',     '+ accusative','according to, along'],
          ['μετά', '+ genitive',  'with'],
          ['',     '+ accusative','after'],
          ['ὑπό',  '+ genitive',  'by (agent)'],
          ['',     '+ accusative','under'],
        ]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P id="prepositions.p.pair-worth-savoring">
        A pair worth savoring: <Gk>μετὰ τῶν μαθητῶν</Gk> is "with the disciples," but
        <Gk> μετὰ τὸ σάββατον</Gk> is "after the Sabbath." Same preposition, opposite English words — the
        case did all the work.
      </P>
    </LevelOnly>

    {/* ── 4 · Three-case ─────────────────────────────────── */}
    <SectionHeading id="prepositions.h.three-case-prepositions">The three-case prepositions</SectionHeading>
    <TableAside
      beginning={<>
        <p><Tr id="prepositions.as.these-take-three">These take <em>three</em> cases — three senses. Let the case of the noun tell you which.</Tr></p>
        <Ex grc="ἐπὶ τῆς γῆς" en={<Tr id="prepositions.ex.earth-gen">on the earth (gen.)</Tr>} />
        <Ex grc="ἐπὶ τὸ βιβλίον" en={<Tr id="prepositions.ex.onto-book-acc">onto the book (acc.)</Tr>} />
      </>}
    >
      <MorphTable id="prepositions.t3" tCols={[1, 2]} flush title="Three-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
        rows={[
          ['ἐπί',  '+ genitive',  'on, over'],
          ['',     '+ dative',    'on, at'],
          ['',     '+ accusative','on, against'],
          ['παρά', '+ genitive',  'from beside'],
          ['',     '+ dative',    'beside, with'],
          ['',     '+ accusative','alongside'],
          ['περί', '+ genitive',  'about, concerning'],
          ['',     '+ dative',    'around, near'],
          ['',     '+ accusative','around'],
        ]}
      />
    </TableAside>

    {/* ── 5 · Compound verbs ─────────────────────────────── */}
    <SectionHeading id="prepositions.h.prepositions-glued-onto">Prepositions glued onto verbs</SectionHeading>
    <P id="prepositions.p.greek-loves-welding">
      Greek loves welding a preposition onto the front of a verb to sharpen or redirect its meaning —
      exactly like English "out-run" or "over-look." <Gk>βάλλω</Gk> "I throw" + <Gk>ἐκ</Gk> "out" →
      <Gk> ἐκβάλλω</Gk> "I throw out, drive out" (what Jesus does to demons). <Gk>ἔρχομαι</Gk> "I come/go"
      spawns a whole family: <Gk>εἰσέρχομαι</Gk> "enter," <Gk>ἐξέρχομαι</Gk> "go out,"
      <Gk> προσέρχομαι</Gk> "approach." Often the compound then repeats the same preposition before its
      noun: <Gk>εἰσέρχεται εἰς τὸν οἶκον</Gk>, "he enters into the house."
    </P>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <SectionHeading id="prepositions.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="prepositions.wo.final-vowels-elide">Final vowels elide before a following vowel: <Gk>διὰ αὐτοῦ → δι᾿ αὐτοῦ</Gk>, <Gk>ἀπὸ αὐτοῦ → ἀπ᾿ αὐτοῦ</Gk>. The apostrophe marks the lost vowel.</Tr></li>
        <li><Tr id="prepositions.wo.becomes-before-vowel"><Gk>ἐκ</Gk> becomes <Gk>ἐξ</Gk> before a vowel: <Gk>ἐξ οἴκου</Gk>.</Tr></li>
        <li><Tr id="prepositions.wo.instrument-usually-needs">Instrument usually needs <em>no</em> preposition at all — the plain dative does it: <Gk>τῷ λόγῳ</Gk> "by a word." Don't hunt for a missing ἐν.</Tr></li>
        <li><Tr id="prepositions.wo.breathings-again-one">Breathings again: <Gk>ἐν</Gk> "in" vs. <Gk>ἕν</Gk> "one"; <Gk>εἰς</Gk> "into" vs. <Gk>εἷς</Gk> "one."</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="prepositions.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="prepositions.pr1"
      title="Practice — translate the phrase"
      intro={<Tr id="prepositions.intro.read-case-first">Read the case first, then choose the meaning. Vocabulary: <span className="normal-case">οἶκος</span> "house" · <span className="normal-case">σάββατον</span> "Sabbath" · <span className="normal-case">νόμος</span> "law" · <span className="normal-case">μαθητής</span> "disciple."</Tr>}
      items={[
        { q: <span className="normal-case">ἐν τῷ οἴκῳ</span>,
          a: <Tr id="prepositions.pa.house-dative-rest">"In the house" — dative of rest.</Tr>},
        { q: <span className="normal-case">εἰς τὸν οἶκον</span>,
          a: <Tr id="prepositions.pa.into-house-accusative">"Into the house" — accusative of motion toward.</Tr>},
        { q: <span className="normal-case">ἐκ τοῦ οἴκου</span>,
          a: <Tr id="prepositions.pa.out-house-genitive">"Out of the house" — genitive of source.</Tr>},
        { q: <span className="normal-case">μετὰ τῶν μαθητῶν</span>,
          a: <Tr id="prepositions.pa.disciples-genitive">"With the disciples" — μετά + genitive.</Tr>},
        { q: <span className="normal-case">μετὰ τὸ σάββατον</span>,
          a: <Tr id="prepositions.pa.after-sabbath-accusative">"After the Sabbath" — μετά + accusative. The case flipped the meaning.</Tr>},
        { q: <span className="normal-case">κατὰ τὸν νόμον</span>,
          a: <Tr id="prepositions.pa.according-law-accusative">"According to the law" — κατά + accusative.</Tr>},
        { q: <span className="normal-case">ὑπὸ τοῦ θεοῦ</span>,
          a: <Tr id="prepositions.pa.god-genitive-agent">"By God" — ὑπό + genitive: the agent behind a passive verb.</Tr>},
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <ClassSentences id="prepositions.cs2"
      lesson="Lesson 3 · Prepositions"
      items={[
        { words: [
          { w: "διὰ", parsing: "Preposition + accusative", gloss: "because of" },
          { w: "τὴν", parsing: "Article — Acc Sg Fem", gloss: "the" },
          { w: "ἀγάπην", parsing: "Acc Sg Fem — ἀγάπη", gloss: "love" },
          { w: "τοῦ", parsing: "Article — Gen Sg Masc", gloss: "of" },
          { w: "θεοῦ", parsing: "Gen Sg Masc — θεός", syntax: "Subjective Genitive", gloss: "God" },
          { w: "πιστεύομεν.", parsing: "Pres Act Ind 1 Pl — πιστεύω", gloss: "we believe" },
        ],
          translation: "We believe because of the love of God.",
          note: "τοῦ θεοῦ could be subjective (\"God loves us\") or objective (\"we love God\") — context decides.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "Ἰησοῦς", parsing: "Nom Sg Masc — Ἰησοῦς", syntax: "Subject", gloss: "Jesus" },
          { w: "λαμβάνει", parsing: "Pres Act Ind 3 Sg — λαμβάνω", gloss: "takes" },
          { w: "τοὺς", parsing: "Article — Acc Pl Masc", gloss: "the" },
          { w: "μαθητὰς", parsing: "Acc Pl Masc — μαθητής", syntax: "Direct Object", gloss: "disciples" },
          { w: "εἰς", parsing: "Preposition + accusative", gloss: "into" },
          { w: "τὰ", parsing: "Article — Acc Pl Neut", gloss: "the" },
          { w: "πλοῖα.", parsing: "Acc Pl Neut — πλοῖον", gloss: "boats" },
        ],
          translation: "Jesus takes the disciples into the boats.",
        },
        { words: [
          { w: "λαλοῦσιν", parsing: "Pres Act Ind 3 Pl — λαλέω", gloss: "they are speaking" },
          { w: "αὐταῖς", parsing: "Dat Pl Fem — αὐτός", syntax: "Dative of Indirect Object", gloss: "to them (f.)" },
          { w: "περὶ", parsing: "Preposition + genitive", gloss: "about" },
          { w: "τῆς", parsing: "Article — Gen Sg Fem", gloss: "the" },
          { w: "βασιλείας.", parsing: "Gen Sg Fem — βασιλεία", gloss: "kingdom" },
        ],
          translation: "They are speaking to them (f.) about the kingdom.",
        },
        { words: [
          { w: "ὁ", parsing: "Article — Nom Sg Masc", gloss: "the" },
          { w: "θεὸς", parsing: "Nom Sg Masc — θεός", syntax: "Subject", gloss: "God" },
          { w: "γινώσκει", parsing: "Pres Act Ind 3 Sg — γινώσκω", gloss: "knows" },
          { w: "τὰς", parsing: "Article — Acc Pl Fem", gloss: "the" },
          { w: "καρδίας", parsing: "Acc Pl Fem — καρδία", syntax: "Direct Object", gloss: "hearts" },
          { w: "κατὰ", parsing: "Preposition + accusative", gloss: "according to" },
          { w: "τὸν", parsing: "Article — Acc Sg Masc", gloss: "the" },
          { w: "λόγον.", parsing: "Acc Sg Masc — λόγος", gloss: "word" },
        ],
          translation: "God knows the hearts according to the word.",
        },
      ]}
    />

    <HomeworkAssignments chapter="prepositions" />

    {/* Syntax is a relation between words, which the one-word morphology search can't express;
        these open Construct search instead. */}
    <LiveExamples
      intro={<Tr id="prepositions.intro.same-preposition-different">The same preposition in different cases — see how the sense turns on the case:</Tr>}
      links={PREPOSITION_CASES.map(pr => ({
        label: <>{pr.label} <span className="text-gray-400">— {pr.approx.toLocaleString()} in the NT</span></>,
        construct: pr.query,
      }))}
    />

    <LiveExamples
      intro={<Tr id="prepositions.intro.prepositions-saturate-watch">Prepositions saturate the NT — watch the same word shift meaning with its case.</Tr>}
      links={[
        { label: <Tr id="prepositions.le.every-most-common">Every <span className="normal-case">ἐν</span> in the NT — the most common preposition of all</Tr>, lemma: 'ἐν', features: ['preposition'] },
        { label: <Tr id="prepositions.le.every-check-each">Every <span className="normal-case">διά</span> — check each one: genitive "through" or accusative "because of"?</Tr>, lemma: 'διά', features: ['preposition'] },
        { label: <Tr id="prepositions.le.every-hunt-agent">Every <span className="normal-case">ὑπό</span> — hunt for the agent ("by …") uses with passives</Tr>, lemma: 'ὑπό', features: ['preposition'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
  </>
)
