/* ─────────────────────────────────────────────
   Chapter: Demonstratives  (οὗτος, ἐκεῖνος — and friends)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
} from '../shared'

export const DEMONSTRATIVES_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading>Start with English: pointing words</SectionHeading>
      <P>
        "<em>This</em> book, not <em>that</em> one." English points with a near word (this/these) and a far
        word (that/those) — grammarians call them <strong>demonstratives</strong>, from the Latin for
        "point out." Greek has the same pair: <Gk>οὗτος</Gk> "this" (near) and <Gk>ἐκεῖνος</Gk> "that"
        (far — related to <Gk>ἐκεῖ</Gk>, "there").
      </P>
      <P>
        Like any pronoun-adjective, they agree with their noun in gender, case, and
        {' '}<Term t="number">number</Term> — and they are frequent: <Gk>οὗτος</Gk> alone occurs nearly 1,400
        times in the New Testament. Two things to learn: the forms (one quirky paradigm) and one surprising
        rule about position.
      </P>
    </LevelOnly>

    {/* ── 2 · Forms ──────────────────────────────────────── */}
    <SectionHeading>The forms: οὗτος and its shifting front end</SectionHeading>
    <P>
      The endings of <Gk>οὗτος</Gk> are the familiar 1st/2nd-declension set. The strangeness is at the
      <em> front</em>, and it follows two rules: the masculine and feminine nominatives begin with a rough
      breathing (<Gk>οὗ‑, αὕ‑</Gk>, matching the article's <Gk>ὁ, ἡ</Gk>); every other form begins
      with <Gk>τ</Gk>. And the first syllable's vowel echoes the ending's vowel class
      (<Gk>τούτου</Gk> but <Gk>ταύτης</Gk>).
    </P>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations</AsideLabel>
        <Ex grc="οὗτος ὁ ἄνθρωπος" en="this man" />
        <Ex grc="ταῦτα" en="these things (very common!)" />
        <Ex grc="μετὰ τοῦτο" en="after this" />
        <p>Standing alone, it's a pronoun: <Gk>οὗτος</Gk> "this one / he."</p>
      </>}
      intermediate={<>
        <p>Front-end rule: rough breathing in the nom. masc./fem. (where the article has it), <Gk>τ‑</Gk> everywhere else — exactly the article's own pattern.</p>
        <p>The neuter plural <Gk>ταῦτα</Gk> may be the most common demonstrative form in the NT — "these things."</p>
      </>}
    >
      <MorphTable flush title={gt("οὗτος, αὕτη, τοῦτο — this")} headers={['','','Masc.','Fem.','Neut.']}
        rows={[
          ['Sg.','Nom.','οὗτος','αὕτη','τοῦτο'],
          ['','Gen.','τούτου','ταύτης','τούτου'],
          ['','Dat.','τούτῳ','ταύτῃ','τούτῳ'],
          ['','Acc.','τοῦτον','ταύτην','τοῦτο'],
          ['Pl.','Nom.','οὗτοι','αὗται','ταῦτα'],
          ['','Gen.','τούτων','τούτων','τούτων'],
          ['','Dat.','τούτοις','ταύταις','τούτοις'],
          ['','Acc.','τούτους','ταύτας','ταῦτα'],
        ]}
      />
    </TableAside>
    <P>
      <Gk>ἐκεῖνος</Gk> is friendlier: completely regular endings (like <Gk>αὐτός</Gk>), no front-end games.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἐκεῖνος ὁ μαθητής" en="that disciple" />
        <Ex grc="ἐν ἐκείνῃ τῇ ἡμέρᾳ" en="on that day" />
      </>}
      intermediate={<>
        <p><Gk>ἄλλος</Gk> "other" and the reciprocal <Gk>ἀλλήλων</Gk> "one another" decline just like <Gk>ἐκεῖνος</Gk> — meet them here: <Gk>ἔλεγον πρὸς ἀλλήλους</Gk>, "they were saying to one another" (Mark 4:41).</p>
      </>}
    >
      <MorphTable flush title={gt("ἐκεῖνος, ἐκείνη, ἐκεῖνο — that")} headers={['','','Masc.','Fem.','Neut.']}
        rows={[
          ['Sg.','Nom.','ἐκεῖνος','ἐκείνη','ἐκεῖνο'],
          ['','Gen.','ἐκείνου','ἐκείνης','ἐκείνου'],
          ['','Dat.','ἐκείνῳ','ἐκείνῃ','ἐκείνῳ'],
          ['','Acc.','ἐκεῖνον','ἐκείνην','ἐκεῖνο'],
          ['Pl.','Nom.','ἐκεῖνοι','ἐκεῖναι','ἐκεῖνα'],
          ['','Gen.','ἐκείνων','ἐκείνων','ἐκείνων'],
          ['','Dat.','ἐκείνοις','ἐκείναις','ἐκείνοις'],
          ['','Acc.','ἐκείνους','ἐκείνας','ἐκεῖνα'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Position ───────────────────────────────────── */}
    <SectionHeading>The position surprise</SectionHeading>
    <P>
      Adjectives modifying an articular noun sit <em>inside</em> the article-unit (<Gk>ὁ καλὸς λόγος</Gk>).
      Demonstratives do the opposite: they stand in <strong>predicate position</strong> — outside the
      article — yet still mean a simple "this/that + noun": <Gk>οὗτος ὁ ἄνθρωπος</Gk> or
      <Gk> ὁ ἄνθρωπος οὗτος</Gk>, both "this man." Never "this <em>is</em> the man" — with demonstratives,
      the predicate position is just where they live.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="οὗτος ὁ λόγος" en="this word" />
        <Ex grc="ἐκείνη ἡ ἡμέρα" en="that day" />
        <p>Note the article is still there — demonstrative + article + noun.</p>
      </>}
      intermediate={<>
        <p>Standing alone, the demonstrative is a full pronoun and can even be the subject of an equative clause: <Gk>οὗτός ἐστιν ὁ υἱός μου</Gk>, "<em>this</em> is my Son" (Matt 3:17) — where "this one" points to Jesus just baptized.</p>
      </>}
    >
      <MorphTable flush title="Adjective vs. demonstrative position" headers={['Pattern', 'Meaning']} firstColIsData
        rows={[
          ['ὁ καλὸς λόγος', 'the good word (adjective inside)'],
          ['οὗτος ὁ λόγος', 'this word (demonstrative outside)'],
          ['καλὸς ὁ λόγος', 'the word is good (adjective outside = statement)'],
        ]}
      />
    </TableAside>

    {/* ── 4 · The relatives: ἑαυτοῦ and ἀλλήλων ──────────── */}
    <SectionHeading>Two cousins: "himself" and "one another"</SectionHeading>
    <P>
      Two more pointing-family pronouns complete the set. The reflexive <Gk>ἑαυτοῦ</Gk> ("himself /
      herself / itself") points the action back at its own subject: <Gk>σῴζει ἑαυτόν</Gk>, "he saves
      <em> himself</em>." The reciprocal <Gk>ἀλλήλων</Gk> ("one another") only exists in the plural — you
      need at least two to reciprocate: <Gk>ἀγαπᾶτε ἀλλήλους</Gk>, "love one another."
    </P>
    <LevelOnly level="intermediate">
      <P>
        Distinguish reflexive <Gk>ἑαυτόν</Gk> from intensive <Gk>αὐτός</Gk> by the delete-test you know
        from the Pronouns chapter: delete "himself," and if the meaning collapses it was reflexive
        (<Gk>σῴζει ἑαυτόν</Gk>), if unchanged it was intensive (<Gk>αὐτὸς ὁ κύριος σῴζει</Gk>).
      </P>
    </LevelOnly>

    {/* ── 5 · Watch out ──────────────────────────────────── */}
    <SectionHeading>Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Gk>αὕτη</Gk> ("this woman/she", rough breathing) vs. <Gk>αὐτή</Gk> ("she", smooth) — the breathing mark is the whole difference. Likewise <Gk>αὗται</Gk> vs. <Gk>αὐταί</Gk>.</li>
        <li><Gk>ταῦτα</Gk> ("these things") vs. <Gk>ταύτας</Gk> (acc. fem. pl.) — a one-letter trap in fast reading.</li>
        <li>Set phrases to recognize on sight: <Gk>μετὰ ταῦτα</Gk> "after these things," <Gk>διὰ τοῦτο</Gk> "for this reason," <Gk>ἐκ τούτου</Gk> "as a result."</li>
        <li>Demonstrative + article + noun is <em>not</em> a sentence — resist reading "this is the…" unless a verb (or equative context) demands it.</li>
      </ul>
    </InfoBox>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <SectionHeading>Try it</SectionHeading>
    <Practice
      title="Practice — parse and translate"
      intro={<>Vocabulary: <span className="normal-case">πρόβατον</span> "sheep" · <span className="normal-case">συνάγω</span> "gather" · <span className="normal-case">παραβολή</span> "parable."</>}
      items={[
        { q: <span className="normal-case">συνάγει ταῦτα τὰ πρόβατα.</span>,
          a: <>"She is gathering these sheep" — ταῦτα agrees with τὰ πρόβατα (neut. pl.).</> },
        { q: <span className="normal-case">φιλῶ ἐκεῖνον τὸν μαθητήν.</span>,
          a: <>"I love that disciple" — ἐκεῖνον, acc. masc. sg., predicate position.</> },
        { q: <span className="normal-case">οὗτός ἐστιν ὁ υἱός μου ὁ ἀγαπητός.</span>,
          a: <>"This is my beloved Son" (Matt 3:17) — οὗτος standing alone as subject.</> },
        { q: <span className="normal-case">ἐν ἐκείνῃ τῇ ἡμέρᾳ γνώσεσθε.</span>,
          a: <>"On that day you will know" (John 14:20) — dative of time.</> },
        { q: <span className="normal-case">διὰ τοῦτο λέγω ὑμῖν.</span>,
          a: <>"For this reason I say to you" — the set phrase διὰ τοῦτο.</> },
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<>The pointing words in place — notice how often they open or close an argument.</>}
      links={[
        { label: <>Every form of <span className="normal-case">οὗτος</span> — nearly 1,400 pointers</>, lemma: 'οὗτος' },
        { label: <>Every form of <span className="normal-case">ἐκεῖνος</span> — "that one," John's favourite</>, lemma: 'ἐκεῖνος' },
        { label: <>Every <span className="normal-case">ἀλλήλων</span> — the "one another" commands</>, lemma: 'ἀλλήλων' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading>Going deeper: pointing with attitude</SectionHeading>
      <P>
        <strong>Backward or forward?</strong> A demonstrative usually points back at what was just said
        (anaphoric: <Gk>μετὰ ταῦτα</Gk>), but it can point forward to what's coming (cataphoric):
        <Gk> αὕτη ἐστὶν ἡ ἐντολὴ ἡ ἐμή, ἵνα…</Gk> — "<em>this</em> is my commandment: that you love…"
        (John 15:12). John especially uses forward-pointing οὗτος to headline a definition before giving it.
      </P>
      <P>
        <strong>The contemptuous οὗτος.</strong> Pointing at a person can sneer: <Gk>οὗτος</Gk> as "this
        fellow" — <Gk>οὗτος ὁ ἄνθρωπος</Gk> on hostile lips (Luke 15:2, "this fellow welcomes sinners").
        Context supplies the tone English must add with "fellow."
      </P>
      <P>
        <strong>ἐκεῖνος as a title.</strong> In John's farewell discourse, <Gk>ἐκεῖνος</Gk> repeatedly
        refers to the coming Spirit-Paraclete (John 14:26; 16:13–14) — a masculine demonstrative tracking
        through the discourse. Note also the idiom <Gk>ἐν ἐκείνῃ τῇ ἡμέρᾳ</Gk>, "in that day," carrying
        eschatological weight inherited from the prophets.
      </P>
    </LevelOnly>
  </>
)
