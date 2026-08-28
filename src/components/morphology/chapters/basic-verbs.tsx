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

   The verbs are the instructor's own three lists, taken from the chapter-end vocabularies in Duff: the
   nine that behave like λύω, the six ε-contracts like φιλέω, and eleven compounds — plus γράφω, γινώσκω
   and πιστεύω, which the noun chapters use and which follow the λύω pattern exactly. All of them are
   already in the BGVB vocabulary this course schedules, and the NT counts here are that deck's.

   The compounds are placed last on purpose: nine of the eleven are built on verbs conjugated earlier in
   this same chapter, so by the time a student reaches them the table is mostly a list of things they can
   already do.

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
      This chapter is that handful: one tense, one voice, one mood, and the endings that carry them —
      the verbs gone through in class before the nouns begin.
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
    <P id="basic-verbs.p.nine-like-luo">
      Nine verbs behave exactly like <Gk>λύω</Gk>. They take the endings you have just learned without a
      single change — only the stem differs, never the ending — so learning the table once has already
      given you all nine. The number is how often each occurs in the New Testament.
    </P>
    <MorphTable id="basic-verbs.t2" tCols={[1, 3]} flush title="Nine verbs like λύω"
      headers={['1st sg.', 'Meaning', '3rd sg.', 'NT times']} firstColIsData
      rows={[
        ['ἄγω', 'I lead, bring', 'ἄγει', '70'],
        ['ἀκούω', 'I hear, listen to', 'ἀκούει', '427'],
        ['βάλλω', 'I throw', 'βάλλει', '125'],
        ['βλέπω', 'I see, watch', 'βλέπει', '132'],
        ['διδάσκω', 'I teach', 'διδάσκει', '97'],
        ['ἔχω', 'I have, hold', 'ἔχει', '707'],
        ['λαμβάνω', 'I take, receive', 'λαμβάνει', '259'],
        ['λέγω', 'I say, speak, tell', 'λέγει', '2,258'],
        ['λύω', 'I untie', 'λύει', '42'],
      ]}
      note="Conjugate any of them by swapping the stem: ἀκού|ω, ἀκού|εις, ἀκού|ει, ἀκού|ομεν, ἀκού|ετε, ἀκού|ουσι(ν)."
    />
    <P id="basic-verbs.p.three-more">
      Three more follow the same pattern and turn up in the chapters just ahead, so they are worth adding
      now: <Gk>γράφω</Gk> "I write," <Gk>γινώσκω</Gk> "I know," <Gk>πιστεύω</Gk> "I believe, trust."
    </P>

    {/* ── 3b · The ε-contracts ────────────────────────────── */}
    <SectionHeading id="basic-verbs.h.like-phileo">Six more like φιλέω</SectionHeading>
    <P id="basic-verbs.p.contract-explained">
      A second group ends in <Gk>-έω</Gk> rather than <Gk>-ω</Gk>, and the ε meets the vowel of the ending and
      merges with it: <Gk>φιλέ-ω</Gk> becomes <Gk>φιλῶ</Gk>. Nothing new is happening — the endings are the
      ones you already know, wearing a circumflex where two vowels have run together. These are
      the <Term t="contract verb">contract verbs</Term>, and the chapter of that name works through all three
      kinds; these six are the ones needed now.
    </P>
    <MorphTable id="basic-verbs.t4" tCols={[0, 2, 4]} flush title="φιλέω — present active indicative (contracted)"
      headers={['', 'Singular', '', 'Plural', '']} firstColIsData
      rows={[
        ['1st', 'φιλῶ', 'I love', 'φιλοῦμεν', 'we love'],
        ['2nd', 'φιλεῖς', 'you love', 'φιλεῖτε', 'you (pl.) love'],
        ['3rd', 'φιλεῖ', 'he/she/it loves', 'φιλοῦσι(ν)', 'they love'],
      ]}
      note="Uncontracted these would be φιλέω, φιλέεις, φιλέει … — say them slowly and you can hear the contracted form appear."
    />
    <MorphTable id="basic-verbs.t5" tCols={[1, 3]} flush title="Six verbs like φιλέω"
      headers={['1st sg.', 'Meaning', '3rd sg.', 'NT times']} firstColIsData
      rows={[
        ['ζητέω', 'I seek', 'ζητεῖ', '117'],
        ['καλέω', 'I call', 'καλεῖ', '148'],
        ['λαλέω', 'I speak, say', 'λαλεῖ', '298'],
        ['ποιέω', 'I do, make', 'ποιεῖ', '569'],
        ['τηρέω', 'I keep', 'τηρεῖ', '71'],
        ['φιλέω', 'I love, like', 'φιλεῖ', '25'],
      ]}
      note="The lexical form is always given uncontracted — φιλέω, ποιέω — which is why the dictionary form and the form on the page can look different."
    />

    {/* ── 3c · Compounds ─────────────────────────────────── */}
    <SectionHeading id="basic-verbs.h.compounds">Eleven compound verbs</SectionHeading>
    <P id="basic-verbs.p.compound-prefix">
      A compound verb is a preposition stuck on the front of a verb, and the join changes nothing about
      the endings. <Gk>συνάγω</Gk> is <Gk>σύν</Gk> + <Gk>ἄγω</Gk> and conjugates exactly like <Gk>ἄγω</Gk>:
      <Gk> συνάγω, συνάγεις, συνάγει, συνάγομεν, συνάγετε, συνάγουσι(ν)</Gk>. The prefix simply rides along at
      the front — so nine of the eleven below are verbs you have already conjugated in this chapter.
    </P>
    <P id="basic-verbs.p.compound-meaning">
      What the prefix does change is the sense, and not always predictably. <Gk>ἐκβάλλω</Gk> is "throw
      <em>out</em>," which you could have guessed from <Gk>ἐκ</Gk> "out of" and <Gk>βάλλω</Gk> "I throw";
      but <Gk>παρακαλέω</Gk> — "call alongside" — means to exhort, or to comfort. Read the prefix as a hint,
      never as a definition.
    </P>
    <MorphTable id="basic-verbs.t6" tCols={[2, 3]} flush title="Eleven compound verbs"
      headers={['1st sg.', 'Built from', 'Meaning', 'Pattern', 'NT times']} firstColIsData
      rows={[
        ['ἀναβλέπω', 'ἀνά + βλέπω', 'I look up, receive sight', 'like λύω', '25'],
        ['ἀπολύω', 'ἀπό + λύω', 'I set free, divorce, dismiss', 'like λύω', '67'],
        ['ἐκβάλλω', 'ἐκ + βάλλω', 'I drive out, cast out', 'like λύω', '80'],
        ['ἐπικαλέω', 'ἐπί + καλέω', 'I call upon, name', 'like φιλέω', '30'],
        ['κατοικέω', 'κατά + οἰκέω', 'I dwell, inhabit, live', 'like φιλέω', '45'],
        ['παρακαλέω', 'παρά + καλέω', 'I exhort, comfort, encourage', 'like φιλέω', '108'],
        ['παραλαμβάνω', 'παρά + λαμβάνω', 'I take, receive', 'like λύω', '49'],
        ['περιπατέω', 'περί + πατέω', 'I walk about, live', 'like φιλέω', '94'],
        ['προσκυνέω', 'πρός + κυνέω', 'I worship (+ dative)', 'like φιλέω', '59'],
        ['συνάγω', 'σύν + ἄγω', 'I gather, bring together', 'like λύω', '59'],
        ['ὑπάγω', 'ὑπό + ἄγω', 'I depart', 'like λύω', '81'],
      ]}
      note="Pattern tells you which table to conjugate it from: the -ω verbs take λύω's endings, the -έω verbs contract like φιλέω. προσκυνέω takes its object in the dative rather than the accusative."
    />
    <LevelOnly level="intermediate">
      <P id="basic-verbs.p.compound-bound-stems">
        Three of the bases — <Gk>οἰκέω</Gk>, <Gk>πατέω</Gk>, <Gk>κυνέω</Gk> — are rare or unused on their own in
        the New Testament: the compound is the word. Splitting them is still worth doing, because the same
        bases recur in other compounds (<Gk>οἰκία</Gk>, <Gk>οἰκοδομέω</Gk>).
      </P>
    </LevelOnly>

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
        { q: <span className="normal-case">ποιεῖ</span>, answer: '3rd singular', note: <Tr id="basic-verbs.n.he-does">"He does, he makes." A contract verb: ποιέ-ει has run together into ποιεῖ.</Tr> },
        { q: <span className="normal-case">λαλοῦμεν</span>, answer: '1st plural', note: <Tr id="basic-verbs.n.we-speak">"We speak." Contracted from λαλέ-ομεν.</Tr> },
        { q: <span className="normal-case">ἐκβάλλουσιν</span>, answer: '3rd plural', note: <Tr id="basic-verbs.n.they-cast-out">"They cast out." A compound: strip ἐκ- and it is βάλλουσιν, which you already know.</Tr> },
      ]}
    />
  </>
)
