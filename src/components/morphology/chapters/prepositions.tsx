/* ─────────────────────────────────────────────
   Chapter: Prepositions

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  ClassSentences,
} from '../shared'

export const PREPOSITIONS_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: the little relationship words</SectionHeading>
      <P>
        "The cat is <em>in</em> the box. The cat jumped <em>onto</em> the box. The cat came <em>out of</em> the
        box." Those little words — <em>in, onto, out of, with, from, through</em> — are
        {' '}<Term t="preposition">prepositions</Term>: they pin down the relationship (usually of place, time, or
        means) between the action and a noun. "Pre-position" is literal: they sit <em>before</em> the noun.
      </P>
      <P>
        Greek prepositions come with one twist. Each preposition <strong>governs a case</strong> — it dictates
        which case the noun after it must wear. And some prepositions govern two or even three cases,
        <em>with a different meaning for each</em>. So a Greek preposition is really a
        preposition-plus-case <em>pair</em>: learn <Gk>διά</Gk>-with-genitive ("through") and
        <Gk> διά</Gk>-with-accusative ("because of") as two different vocabulary items.
      </P>
    </LevelOnly>

    {/* ── 2 · The spatial logic ──────────────────────────── */}
    <SectionHeading>The logic behind the cases</SectionHeading>
    <P>
      The case pairings are not random — they ride on the cases' own instincts, which you can picture as
      motion in a diagram: the <Term t="genitive">genitive</Term> leans toward <strong>away from / out
      of</strong> (source), the <Term t="dative">dative</Term> toward <strong>resting at</strong> (position),
      and the <Term t="accusative">accusative</Term> toward <strong>movement toward</strong> (goal). Keep that
      triangle in your head and many meanings become guessable.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>The triangle in action</AsideLabel>
        <Ex grc="ἐκ τοῦ οἴκου" en="out of the house (gen. — away)" />
        <Ex grc="ἐν τῷ οἴκῳ" en="in the house (dat. — at rest)" />
        <Ex grc="εἰς τὸν οἶκον" en="into the house (acc. — toward)" />
      </>}
      intermediate={<>
        <p>The one-case prepositions are the purest expression of the triangle: <Gk>ἀπό/ἐκ</Gk> + gen. (away), <Gk>ἐν/σύν</Gk> + dat. (rest, accompaniment), <Gk>εἰς/πρός</Gk> + acc. (toward).</p>
      </>}
    >
      <MorphTable flush title="One-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
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

    {/* ── 3 · Two-case ───────────────────────────────────── */}
    <SectionHeading>Two cases, two meanings</SectionHeading>
    <P>
      With these, the case of the following noun is not decoration — it <em>selects the meaning</em>. Before
      translating, glance past the preposition to the noun's article and ending, then choose the row.
    </P>
    <TableAside
      beginning={<>
        <p>These take <em>two</em> cases — and the case changes the meaning. Always check the ending of the following noun.</p>
        <Ex grc="διὰ τοῦ ἀγγέλου" en="through the messenger (gen.)" />
        <Ex grc="διὰ τὸν ὄχλον" en="because of the crowd (acc.)" />
      </>}
      intermediate={<>
        <p>The genitive typically keeps the "source / through" sense, the accusative the "toward / because-of" sense — the same gen.-vs-acc. logic you meet everywhere.</p>
      </>}
    >
      <MorphTable flush title="Two-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
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
      <P>
        A pair worth savoring: <Gk>μετὰ τῶν μαθητῶν</Gk> is "with the disciples," but
        <Gk> μετὰ τὸ σάββατον</Gk> is "after the Sabbath." Same preposition, opposite English words — the
        case did all the work.
      </P>
    </LevelOnly>

    {/* ── 4 · Three-case ─────────────────────────────────── */}
    <SectionHeading>The three-case prepositions</SectionHeading>
    <TableAside
      beginning={<>
        <p>These take <em>three</em> cases — three senses. Let the case of the noun tell you which.</p>
        <Ex grc="ἐπὶ τῆς γῆς" en="on the earth (gen.)" />
        <Ex grc="ἐπὶ τὸ βιβλίον" en="onto the book (acc.)" />
      </>}
      intermediate={<>
        <p>In Koine the edges blur — <Gk>εἰς</Gk> and <Gk>ἐν</Gk> sometimes overlap — so weigh context alongside the case rather than trusting a one-word gloss.</p>
      </>}
    >
      <MorphTable flush title="Three-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
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
    <SectionHeading>Prepositions glued onto verbs</SectionHeading>
    <P>
      Greek loves welding a preposition onto the front of a verb to sharpen or redirect its meaning —
      exactly like English "out-run" or "over-look." <Gk>βάλλω</Gk> "I throw" + <Gk>ἐκ</Gk> "out" →
      <Gk> ἐκβάλλω</Gk> "I throw out, drive out" (what Jesus does to demons). <Gk>ἔρχομαι</Gk> "I come/go"
      spawns a whole family: <Gk>εἰσέρχομαι</Gk> "enter," <Gk>ἐξέρχομαι</Gk> "go out,"
      <Gk> προσέρχομαι</Gk> "approach." Often the compound then repeats the same preposition before its
      noun: <Gk>εἰσέρχεται εἰς τὸν οἶκον</Gk>, "he enters into the house."
    </P>
    <LevelOnly level="intermediate">
      <P>
        Two refinements. First, remember from the verb chapter that compounds take their augment
        <em>after</em> the preposition (<Gk>ἐξέβαλον</Gk>, "they cast out"). Second, compounding can
        intensify rather than redirect (<Gk>γινώσκω</Gk> "know" → <Gk>ἐπιγινώσκω</Gk> "know fully") —
        though in Koine some compounds have faded to near-synonyms of the simple verb; check usage before
        building an argument on the prefix.
      </P>
    </LevelOnly>

    {/* ── 6 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li>Final vowels elide before a following vowel: <Gk>διὰ αὐτοῦ → δι᾿ αὐτοῦ</Gk>, <Gk>ἀπὸ αὐτοῦ → ἀπ᾿ αὐτοῦ</Gk>. The apostrophe marks the lost vowel.</li>
        <li><Gk>ἐκ</Gk> becomes <Gk>ἐξ</Gk> before a vowel: <Gk>ἐξ οἴκου</Gk>.</li>
        <li>Instrument usually needs <em>no</em> preposition at all — the plain dative does it: <Gk>τῷ λόγῳ</Gk> "by a word." Don't hunt for a missing ἐν.</li>
        <li>Breathings again: <Gk>ἐν</Gk> "in" vs. <Gk>ἕν</Gk> "one"; <Gk>εἰς</Gk> "into" vs. <Gk>εἷς</Gk> "one."</li>
      </ul>
    </InfoBox>

    {/* ── 7 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — translate the phrase"
      intro={<>Read the case first, then choose the meaning. Vocabulary: <span className="normal-case">οἶκος</span> "house" · <span className="normal-case">σάββατον</span> "Sabbath" · <span className="normal-case">νόμος</span> "law" · <span className="normal-case">μαθητής</span> "disciple."</>}
      items={[
        { q: <span className="normal-case">ἐν τῷ οἴκῳ</span>,
          a: <>"In the house" — dative of rest.</> },
        { q: <span className="normal-case">εἰς τὸν οἶκον</span>,
          a: <>"Into the house" — accusative of motion toward.</> },
        { q: <span className="normal-case">ἐκ τοῦ οἴκου</span>,
          a: <>"Out of the house" — genitive of source.</> },
        { q: <span className="normal-case">μετὰ τῶν μαθητῶν</span>,
          a: <>"With the disciples" — μετά + genitive.</> },
        { q: <span className="normal-case">μετὰ τὸ σάββατον</span>,
          a: <>"After the Sabbath" — μετά + accusative. The case flipped the meaning.</> },
        { q: <span className="normal-case">κατὰ τὸν νόμον</span>,
          a: <>"According to the law" — κατά + accusative.</> },
        { q: <span className="normal-case">ὑπὸ τοῦ θεοῦ</span>,
          a: <>"By God" — ὑπό + genitive: the agent behind a passive verb.</> },
      ]}
    />

    {/* ── 8 · See it in the NT ───────────────────────────── */}
    <ClassSentences
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

    <LiveExamples
      intro={<>Prepositions saturate the NT — watch the same word shift meaning with its case.</>}
      links={[
        { label: <>Every <span className="normal-case">ἐν</span> in the NT — the most common preposition of all</>, lemma: 'ἐν', features: ['preposition'] },
        { label: <>Every <span className="normal-case">διά</span> — check each one: genitive "through" or accusative "because of"?</>, lemma: 'διά', features: ['preposition'] },
        { label: <>Every <span className="normal-case">ὑπό</span> — hunt for the agent ("by …") uses with passives</>, lemma: 'ὑπό', features: ['preposition'] },
      ]}
    />

    {/* ── 9 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: theology in small words</SectionHeading>
      <P>
        <strong>ἐν Χριστῷ.</strong> Paul's signature phrase — "in Christ," some 80+ times with its variants —
        rides on the dative of sphere: believers live and act <em>within the realm defined by</em> Christ.
        No English preposition quite reproduces it, which is why translations wobble between "in," "united
        to," and "through." The grammar is the theology here.
      </P>
      <P>
        <strong>Chains of agency.</strong> Greek can distinguish the ultimate agent (<Gk>ὑπό</Gk> + gen.)
        from the intermediate one (<Gk>διά</Gk> + gen.): "what was spoken <Gk>ὑπὸ κυρίου διὰ τοῦ
        προφήτου</Gk>" — <em>by</em> the Lord <em>through</em> the prophet (Matt 1:22). One verse, a whole
        doctrine of inspiration in two prepositions.
      </P>
      <P>
        <strong>Don't over-press εἰς.</strong> In classical Greek <Gk>εἰς</Gk> (motion) and
        <Gk> ἐν</Gk> (rest) were kept apart; in Koine they had begun to blur, and Mark can write
        <Gk> εἰς</Gk> where John writes <Gk>ἐν</Gk> with no difference intended. Arguments that lean hard on
        "εἰς must mean <em>into</em>" (e.g., in baptism texts) need corroboration from context, not just the
        lexicon.
      </P>
    </LevelOnly>
  </>
)
