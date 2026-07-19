import { MorphTable, TableAside, Gk, Ex } from '../shared'

export const CONJUNCTIONS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>A conditional has an "if" clause (protasis) and a "then" clause (apodosis). Count the words to classify it: <Gk>εἰ</Gk> = One Word (1st) · <Gk>εἰ … ἄν</Gk> = Two Words (2nd) · <Gk>ἐάν</Gk> = Three Letters (3rd).</p>
        <Ex grc="εἰ υἱὸς εἶ τοῦ θεοῦ…" en="if you are the Son of God… (1st class)" />
      </>}
      intermediate={<>
        <p>Classify by the <em>protasis</em>. The class shows the speaker's rhetorical stance, not objective fact — a 1st-class condition can frame something known to be false. A <strong>"would"</strong> in English (and <Gk>ἄν</Gk> in Greek) flags the contrary-to-fact 2nd class.</p>
      </>}
    >
      <MorphTable flush title="Conditional Sentences" headers={['Class','Protasis','Apodosis']}
        rows={[
          ['First Class (Assumed True)','εἰ + Indicative','Any mood or tense'],
          ['Second Class (Contrary to Fact)','εἰ + Indicative','ἄν + Indicative'],
          ['Third Class (Probable / Future)','ἐάν + Subjunctive','Any mood or tense'],
        ]}
      />
    </TableAside>
  </>
)
