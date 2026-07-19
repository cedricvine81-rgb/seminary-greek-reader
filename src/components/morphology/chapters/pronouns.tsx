import { MorphTable, TableAside, Gk, Ex, gt } from '../shared'

export const PRONOUNS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p><Gk>αὐτός</Gk> is the everyday "he / she / it, they." It agrees in gender with the noun it stands for.</p>
        <Ex grc="βλέπω αὐτόν" en="I see him" />
        <Ex grc="ὁ λόγος αὐτοῦ" en="his word" />
      </>}
      intermediate={<>
        <p><Gk>αὐτός</Gk> does triple duty: alone in an oblique case = "him"; in the attributive position (<Gk>ὁ αὐτός</Gk>) = "the same"; in the predicate position (<Gk>αὐτὸς ὁ…</Gk>) = intensive "himself."</p>
      </>}
    >
      <MorphTable flush title={gt("3rd Person Pronoun — αὐτός (he, she, it)")} headers={['','','Masc.','Eng.','Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg.','Nom.','αὐτός','he','αὐτή','she','αὐτό','it'],
          ['','Gen.','αὐτοῦ','his','αὐτῆς','her','αὐτοῦ','its'],
          ['','Dat.','αὐτῷ','to him','αὐτῇ','to her','αὐτῷ','to it'],
          ['','Acc.','αὐτόν','him','αὐτήν','her','αὐτό','it'],
          ['Pl.','Nom.','αὐτοί','they','αὐταί','they','αὐτά','they'],
          ['','Gen.','αὐτῶν','their','αὐτῶν','their','αὐτῶν','their'],
          ['','Dat.','αὐτοῖς','to them','αὐταῖς','to them','αὐτοῖς','to them'],
          ['','Acc.','αὐτούς','them','αὐτάς','them','αὐτά','them'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Greek usually leaves out "I / you" — the verb ending already says who acts. So when <Gk>ἐγώ</Gk> or <Gk>σύ</Gk> <em>do</em> appear, they add emphasis.</p>
        <Ex grc="ἐγὼ λέγω" en="I (myself) say" />
      </>}
      intermediate={<>
        <p>Each has an emphatic and an unemphatic (enclitic) form: <Gk>ἐμοῦ / μου</Gk>, <Gk>ἐμοί / μοι</Gk>, <Gk>ἐμέ / με</Gk>. The longer form is used for stress or after a preposition.</p>
      </>}
    >
      <MorphTable flush title="1st & 2nd Person Pronouns" headers={['Case','1st Sg.','Eng.','1st Pl.','Eng.','2nd Sg.','Eng.','2nd Pl.']}
        rows={[
          ['Nom.','ἐγώ','I','ἡμεῖς','we','σύ','you','ὑμεῖς'],
          ['Gen.','ἐμοῦ / μου','of me','ἡμῶν','of us','σοῦ','of you','ὑμῶν'],
          ['Dat.','ἐμοί / μοι','to/for me','ἡμῖν','to/for us','σοί','to/for you','ὑμῖν'],
          ['Acc.','ἐμέ / με','me','ἡμᾶς','us','σέ','you','ὑμᾶς'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Both mean "no one / nothing." Use <Gk>οὐδείς</Gk> with the indicative (statements of fact); use <Gk>μηδείς</Gk> with the other moods (commands, subjunctives, infinitives, participles).</p>
        <Ex grc="οὐδεὶς οἶδεν" en="no one knows" />
      </>}
      intermediate={<>
        <p>Both are built from a negative + <Gk>εἷς</Gk> ("not even one"). Unlike English, Greek can stack negatives for <em>emphasis</em> — two negatives do not cancel (<Gk>οὐκ … οὐδείς</Gk> = "not … anyone").</p>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MorphTable flush title={gt("οὐδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','οὐδείς','οὐδεμία','οὐδέν'],
            ['Gen.','οὐδενός','οὐδεμιᾶς','οὐδενός'],
            ['Dat.','οὐδενί','οὐδεμιᾷ','οὐδενί'],
            ['Acc.','οὐδένα','οὐδεμίαν','οὐδέν'],
          ]}
          note="Used with indicative mood."
        />
        <MorphTable flush title={gt("μηδείς — no one, nothing")} headers={['','Masc.','Fem.','Neut.']}
          rows={[
            ['Nom.','μηδείς','μηδεμία','μηδέν'],
            ['Gen.','μηδενός','μηδεμιᾶς','μηδενός'],
            ['Dat.','μηδενί','μηδεμιᾷ','μηδενί'],
            ['Acc.','μηδένα','μηδεμίαν','μηδέν'],
          ]}
          note="Used with non-indicative moods."
        />
      </div>
    </TableAside>
    <TableAside
      beginning={<>
        <p>Unaccented <Gk>τις</Gk> = "someone, anyone, a certain." It is <em>enclitic</em> — it leans on the previous word and has no accent of its own.</p>
        <Ex grc="ἄνθρωπός τις" en="a certain man" />
      </>}
      intermediate={<>
        <p><Gk>τις</Gk> can be a pronoun ("someone") or an adjective ("a certain …"). Tell it from the question word <Gk>τίς</Gk> purely by the <strong>accent</strong>.</p>
      </>}
    >
      <MorphTable flush title={gt("τις — Indefinite Pronoun (someone, anyone)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg. Nom.','τις','someone','τι','something'],
          ['Gen.','τινος','of someone','τινος','of something'],
          ['Dat.','τινι','to someone','τινι','to something'],
          ['Acc.','τινα','someone','τι','something'],
          ['Pl. Nom.','τινες','some (people)','τινα','some things'],
          ['Gen.','τινων','of some','τινων','of some things'],
          ['Dat.','τισι','to some','τισι','to some things'],
          ['Acc.','τινας','some (people)','τινα','some things'],
        ]}
        note="Enclitic — no accent on first syllable."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Accented <Gk>τίς</Gk> asks a question: "who? what?" The accent is the <em>only</em> difference from indefinite <Gk>τις</Gk>.</p>
        <Ex grc="τίς εἶ;" en="Who are you?" />
      </>}
      intermediate={<>
        <p>The neuter <Gk>τί</Gk> often means "why?" as well as "what?" (<Gk>τί ποιεῖτε;</Gk> "why are you doing this?").</p>
      </>}
    >
      <MorphTable flush title={gt("τίς — Interrogative Pronoun (who? what?)")} headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
        rows={[
          ['Sg. Nom.','τίς','who?','τί','which? what? why?'],
          ['Gen.','τίνος','whose?','τίνος','of which? what?'],
          ['Dat.','τίνι','to whom?','τίνι','to which?'],
          ['Acc.','τίνα','whom?','τί','which? what?'],
          ['Pl. Nom.','τίνες','who?','τίνα','which? what?'],
          ['Gen.','τίνων','whose?','τίνων','of which? what?'],
          ['Dat.','τίσι','to whom?','τίσι','to which?'],
          ['Acc.','τίνας','who?','τίνα','which? what?'],
        ]}
        note="Always accented — distinguished from τις by accent."
      />
    </TableAside>
  </>
)
