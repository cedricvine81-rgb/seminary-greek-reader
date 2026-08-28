/* ─────────────────────────────────────────────
   Chapter: Basic Verbs — the present active indicative, before the nouns

   WHY THIS CHAPTER EXISTS. The Nouns/Adjectives chapter is third in the course and reads verbs
   freely: λέγει, ἀκούω, γινώσκει, πιστεύω, λαμβάνει, ἔχομεν, βλέπει, γράφουσιν — the present
   active indicative across all six persons, of eight different verbs. The chapter that teaches
   that tense, Indicative Verbs, is EIGHTH. A student following the course in order met the forms
   five chapters before anything explained them, and had to take every example sentence on trust.

   So this is deliberately small: one tense, one voice, one mood, one set of endings, and the
   handful of verbs the next two chapters actually use. Everything else about the Greek verb —
   the other tenses, the middle and passive, the moods, the contract and μι verbs — is left to
   the chapters that own it. The point is only to make the noun chapters readable.

   The verbs are not chosen by taste: they are the verbs those chapters use, checked against the
   text, and they are all in the first lessons of the BGVB vocabulary the course schedules.

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, InfoBox,
  DropdownPractice,
  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'

export const BASIC_VERBS_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />

    {/* ── 1 · Why a verb before the nouns ─────────────────── */}
    <SectionHeading id="basic-verbs.h.why-verbs-first">Why verbs come first</SectionHeading>
    <P id="basic-verbs.p.sentence-needs-verb">
      A sentence needs a verb. The chapters that follow are about nouns and adjectives, but every
      example in them has a verb in it — "the good man <em>hears</em> the word," "we <em>have</em> the
      book" — so a handful of verbs has to come first, or the examples cannot be read.
      This chapter is that handful: one tense, one voice, one mood, and the endings that carry them.
    </P>
    <P id="basic-verbs.p.ending-carries-person">
      The important difference from English is where the person lives. English needs a pronoun —
      "<em>I</em> hear," "<em>we</em> hear." Greek puts it in the <strong>ending</strong>, so the pronoun
      is not needed: <Gk>ἀκούω</Gk> is already "I hear," and <Gk>ἀκούομεν</Gk> is already "we hear."
      Learn the six endings once and they work on every regular verb in the language.
    </P>

    {/* ── 2 · λύω, the paradigm verb ──────────────────────── */}
    <SectionHeading id="basic-verbs.h.luo-paradigm">λύω — the pattern verb</SectionHeading>
    <P id="basic-verbs.p.luo-is-the-model">
      Grammars conjugate <Gk>λύω</Gk> "I loose, I untie" first, because it is perfectly regular and its
      stem never changes: <Gk>λυ-</Gk> plus an ending, six times. Learn this table and you have the
      present active indicative of every regular verb.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="basic-verbs.al.no-pronoun">No pronoun needed</Tr></AsideLabel>
        <p><Tr id="basic-verbs.as.ending-does-work">The ending does the work a pronoun does in English. A pronoun may still be
        added for emphasis — <Gk>ἐγὼ λύω</Gk> "<em>I</em> loose" — but it is never required.</Tr></p>
        <Ex grc="λύω" en={<Tr id="basic-verbs.ex.i-loose">I loose</Tr>} />
        <Ex grc="λύουσιν" en={<Tr id="basic-verbs.ex.they-loose">they loose</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="basic-verbs.as.movable-nu">The ν on <Gk>λύουσι(ν)</Gk> is a movable ν: it appears before a vowel or a pause and
        drops otherwise. It is not part of the ending, and it never changes the parse.</Tr></p>
        <p><Tr id="basic-verbs.as.thematic-vowel">The ο/ε alternating through the endings is the thematic vowel — the same vowel that
        reappears in the other tenses built on this stem.</Tr></p>
      </>}
    >
      <MorphTable id="basic-verbs.t1" tCols={[0, 2, 4]} flush title="λύω — present active indicative"
        headers={['', 'Singular', '', 'Plural', '']} firstColIsData
        rows={[
          ['1st', 'λύ|ω', 'I loose', 'λύ|ομεν', 'we loose'],
          ['2nd', 'λύ|εις', 'you loose', 'λύ|ετε', 'you (pl.) loose'],
          ['3rd', 'λύ|ει', 'he/she/it looses', 'λύ|ουσι(ν)', 'they loose'],
        ]}
        note="The stem λυ- never changes; only the ending moves — that is the whole of the present active indicative."
      />
    </TableAside>

    <InfoBox title={<Tr id="basic-verbs.ib.how-to-parse">How to parse λύω</Tr>}>
      <Tr id="basic-verbs.ib.body" paragraphs>
        Give the slots in order, then the lexical form. <Gk>λύομεν</Gk> is present · active · indicative ·
        1st person · plural · of <Gk>λύω</Gk> — and you should be able to say what both mean: <Gk>λύω</Gk> is
        "I loose," and <Gk>λύομεν</Gk> is "we loose."¶That last step is the one students skip. A parse that
        stops at the labels has not shown that the form was understood; the meaning of the inflected form is
        the point of parsing it.
      </Tr>
    </InfoBox>

    {/* ── 3 · The verbs the next chapters use ─────────────── */}
    <SectionHeading id="basic-verbs.h.core-verbs">The core verbs</SectionHeading>
    <P id="basic-verbs.p.these-eight">
      These are the verbs the noun and adjective chapters use, and they all take the endings you have just
      learned — the stem is what changes from verb to verb, never the ending. Each is among the first
      words of the course vocabulary, so they are worth knowing cold before going further.
    </P>
    <MorphTable id="basic-verbs.t2" tCols={[1, 3]} flush title="Core verbs — present active indicative"
      headers={['1st sg.', 'Meaning', '3rd sg.', 'Meaning']} firstColIsData
      rows={[
        ['λέγω', 'I say, tell', 'λέγει', 'he says'],
        ['ἀκούω', 'I hear, listen', 'ἀκούει', 'he hears'],
        ['βλέπω', 'I look, see', 'βλέπει', 'he sees'],
        ['γράφω', 'I write', 'γράφει', 'he writes'],
        ['γινώσκω', 'I know, learn', 'γινώσκει', 'he knows'],
        ['λαμβάνω', 'I receive, take', 'λαμβάνει', 'he receives'],
        ['πιστεύω', 'I believe, trust', 'πιστεύει', 'he believes'],
        ['ἔχω', 'I have, hold', 'ἔχει', 'he has'],
      ]}
      note="Conjugate any of them by swapping λυ- for the stem: ἀκού|ω, ἀκού|εις, ἀκού|ει, ἀκού|ομεν, ἀκού|ετε, ἀκού|ουσι(ν)."
    />

    {/* ── 4 · εἰμί, the odd one out ───────────────────────── */}
    <SectionHeading id="basic-verbs.h.eimi">εἰμί — the one that breaks the pattern</SectionHeading>
    <P id="basic-verbs.p.eimi-irregular">
      One verb has to be learned separately, and it is the commonest of all: <Gk>εἰμί</Gk> "I am." It takes no
      object, because it does not act on anything — it <em>links</em>, joining a subject to whatever is said
      about it. That is why it matters here: the adjective sentences in the next chapter
      ("the man <em>is</em> good") are built on it, and Greek often leaves it out altogether and expects the
      reader to supply it.
    </P>
    <MorphTable id="basic-verbs.t3" tCols={[0, 2, 4]} flush title="εἰμί — present indicative"
      headers={['', 'Singular', '', 'Plural', '']} firstColIsData
      rows={[
        ['1st', 'εἰμί', 'I am', 'ἐσμέν', 'we are'],
        ['2nd', 'εἶ', 'you are', 'ἐστέ', 'you (pl.) are'],
        ['3rd', 'ἐστί(ν)', 'he/she/it is', 'εἰσί(ν)', 'they are'],
      ]}
      note="No voice is given for εἰμί: there is nothing for it to act on, so “active” would say nothing. Parse it as present indicative and the person and number."
    />

    <LevelOnly level="intermediate">
      <P id="basic-verbs.p.eimi-enclitic">
        Most of these forms are enclitic — they lean on the word before them and usually carry no accent of
        their own. <Gk>ἔστιν</Gk> takes an accent when it stands first in its clause or means "exists."
      </P>
    </LevelOnly>

    <DropdownPractice id="basic-verbs.d1"
      title="Practice — parse the form"
      intro={<Tr id="basic-verbs.intro.give-person-number">Give the person and number, then say what it means.</Tr>}
      options={['1st singular', '2nd singular', '3rd singular', '1st plural', '2nd plural', '3rd plural']}
      items={[
        { q: <span className="normal-case">ἀκούει</span>, answer: '3rd singular', note: <Tr id="basic-verbs.n.he-hears">"He hears." The ending -ει is the giveaway.</Tr> },
        { q: <span className="normal-case">πιστεύομεν</span>, answer: '1st plural', note: <Tr id="basic-verbs.n.we-believe">"We believe."</Tr> },
        { q: <span className="normal-case">γράφετε</span>, answer: '2nd plural', note: <Tr id="basic-verbs.n.you-write">"You (more than one) write."</Tr> },
        { q: <span className="normal-case">λαμβάνουσιν</span>, answer: '3rd plural', note: <Tr id="basic-verbs.n.they-receive">"They receive." The ν is movable and changes nothing.</Tr> },
        { q: <span className="normal-case">βλέπω</span>, answer: '1st singular', note: <Tr id="basic-verbs.n.i-see">"I see." No pronoun needed.</Tr> },
        { q: <span className="normal-case">ἔχεις</span>, answer: '2nd singular', note: <Tr id="basic-verbs.n.you-have">"You (one person) have."</Tr> },
      ]}
    />
  </>
)
