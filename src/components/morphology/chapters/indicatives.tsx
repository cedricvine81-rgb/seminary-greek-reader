import { MorphTable, TableAside, Gk, Ex, AsideLabel, gt } from '../shared'

export const INDICATIVES_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>Greek's present covers <em>both</em> English "I loose" and "I am loosing" — it does not distinguish the two.</p>
        <Ex grc="πιστεύω εἰς τὸν θεόν" en="I believe in God" />
        <Ex grc="ὁ Ἰησοῦς διδάσκει" en="Jesus teaches / is teaching" />
      </>}
      intermediate={<>
        <p>Present = <em>imperfective</em> aspect (ongoing). Watch for the <strong>historical present</strong> — a present-tense verb telling a past story for vividness (<Gk>λέγει αὐτῷ</Gk> = "he said to him").</p>
      </>}
    >
      <MorphTable flush title={gt("Present Tense — λύω (I loose, I am loosing)")} headers={['Person','Greek','Translation']}
        rows={[
          ['1st sg.','λύω','I am untying / I untie'],
          ['2nd sg.','λύεις','You are untying / you untie'],
          ['3rd sg.','λύει','He/she/it is untying'],
          ['1st pl.','λύομεν','We are untying / we untie'],
          ['2nd pl.','λύετε','You are untying / you untie'],
          ['3rd pl.','λύουσι(ν)','They are untying / they untie'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>Default translations (add the verb)</AsideLabel>
        <p><Gk>Present</Gk> active: "I ‒ / I am ‒ing" · mid/pass: "I am (being) ‒ed."</p>
        <p><Gk>Imperfect</Gk> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</p>
        <p>The imperfect's <Gk>ε‒</Gk> augment marks past time.</p>
      </>}
      intermediate={<>
        <p>The imperfect is <em>past imperfective</em> — ongoing or repeated action in the past ("kept on…, was beginning to…"), as opposed to the aorist's single, whole action.</p>
        <p>The 2nd-sg. middle (<Gk>ἐλύου, λύῃ</Gk>) lost an intervocalic <Gk>σ</Gk>, which is why it looks irregular.</p>
      </>}
    >
      <MorphTable flush title={gt("Present & Imperfect Full Paradigm — λύω")} headers={['','','Imp. Active','Imp. Mid/Pass','Pres. Active','Pres. Mid/Pass']}
        rows={[
          ['SG','1','ἔλυον','ἐλυόμην','λύω','λύομαι'],
          ['','2','ἔλυες','ἐλύου','λύεις','λύῃ (σαι)'],
          ['','3','ἔλυε(ν)','ἐλύετο','λύει','λύεται'],
          ['PL','1','ἐλύομεν','ἐλυόμεθα','λύομεν','λυόμεθα'],
          ['','2','ἐλύετε','ἐλύεσθε','λύετε','λύεσθε'],
          ['','3','ἔλυον','ἐλύοντο','λύουσι(ν)','λύονται'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>The verb "to be"</AsideLabel>
        <p><Gk>εἰμί</Gk> is irregular and very common — memorize it. It has no voice.</p>
        <Ex grc="ἐγώ εἰμι" en="I am" />
        <Ex grc="ἦν ὁ λόγος" en="the Word was" />
      </>}
      intermediate={<>
        <p><Gk>εἰμί</Gk> is an <strong>equative</strong> verb: it links the subject to a <em>predicate nominative</em>, so both stand in the nominative (<Gk>θεὸς ἦν ὁ λόγος</Gk>).</p>
        <p>Its future <Gk>ἔσομαι</Gk> is a middle (deponent) form.</p>
      </>}
    >
      <MorphTable flush title={gt("εἰμί — Present, Future & Imperfect Indicative")} headers={['Person','Present','Future','Imperfect']}
        rows={[
          ['I','εἰμί','ἔσομαι','ἦμην'],
          ['You (sg.)','εἶ','ἔσῃ','ἦς (or ἦσθα)'],
          ['He/she/it','ἐστί(ν)','ἔσται','ἦν'],
          ['We','ἐσμέν','ἐσόμεθα','ἦμεν (or ἦμεθα)'],
          ['You (pl.)','ἐστέ','ἔσεσθε','ἦτε'],
          ['They','εἰσί(ν)','ἔσονται','ἦσαν'],
        ]}
        note="Present Infinitive: εἶναι · Present Participle (Masc. Nom. Sg./Pl.): ὤν / ὄντες"
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Perfect = "I have ‒ed": a completed past act with a result that <em>still stands</em>. Its front-of-word flag is <strong>reduplication</strong> (<Gk>λε‒λυκα</Gk>).</p>
        <p>Pluperfect = "I had ‒ed": the same idea one step further back in time.</p>
      </>}
      intermediate={<>
        <p>The perfect stresses the <strong>present state</strong> produced by a past action — <Gk>γέγραπται</Gk> "it stands written." That resultative force is why it matters exegetically.</p>
      </>}
    >
      <MorphTable flush title={gt("Perfect & Pluperfect — λύω")} headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Perfect','Active','λέλυκα','I have loosed'],
          ['','Middle','λέλυμαι','I have loosed myself'],
          ['','Passive','λέλυμαι','I have been loosed'],
          ['Pluperfect','Active','ἐλελύκειν','I had loosed'],
          ['','Middle','ἐλελύμην','I had loosed myself'],
          ['','Passive','ἐλελύμην','I had been loosed'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <AsideLabel>Read across the voices</AsideLabel>
        <p><strong>Active</strong> = "I loose" (subject acts) · <strong>Middle</strong> = "I loose myself / for myself" · <strong>Passive</strong> = "I am loosed" (subject is acted on).</p>
      </>}
      intermediate={<>
        <p>The middle often means acting <em>in one's own interest</em>. The future/aorist passive show the <Gk>θη</Gk> marker (<Gk>λυθήσομαι, ἐλύθην</Gk>).</p>
        <p>Many middle-looking forms are simply <strong>deponents</strong> with an active meaning.</p>
      </>}
    >
      <MorphTable flush title={gt("Full Tense & Voice Paradigm — λύω (1st sg.)")} headers={['Tense','Voice','Form','Translation']}
        rows={[
          ['Present','Active','λύω','I loose'],
          ['','Middle','λύομαι','I loose myself'],
          ['','Passive','λύομαι','I am being loosed'],
          ['Future','Active','λύσω','I will loose'],
          ['','Middle','λύσομαι','I will loose myself'],
          ['','Passive','λυθήσομαι','I will be loosed'],
          ['Imperfect','Active','ἔλυον','I was loosing'],
          ['','Middle','ἐλυόμην','I was loosing myself'],
          ['','Passive','ἐλυόμην','I was being loosed'],
          ['Aorist','Active','ἔλυσα','I loosed'],
          ['','Middle','ἐλυσάμην','I loosed myself'],
          ['','Passive','ἐλύθην','I was loosed'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Spot the flag letter, then read the ending for person. <Gk>‒σ‒</Gk> future, <Gk>‒σα‒</Gk> aorist, <Gk>‒θη‒</Gk> aorist passive, <Gk>‒κα‒</Gk> perfect.</p>
      </>}
      intermediate={<>
        <p>Recognize the <em>family</em>, not an exact string: a <Gk>σ</Gk>-cluster = aorist/future, a <Gk>θ</Gk>-cluster = passive. Reduced forms appear right before certain endings.</p>
      </>}
    >
      <MorphTable flush title="Tense Identifiers" headers={['Identifier','Tense']}
        rows={[
          ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
          ['‒σα','1st Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1st Aorist (passive)'],
          ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle/passive)'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Build any tense from the present/imperfect base plus the modification shown.</p>
        <Ex grc="ἔλυον → ἔλυσα" en="+ σα = aorist “I loosed”" />
        <Ex grc="λύω → λύσω" en="+ σ = future “I will loose”" />
      </>}
      intermediate={<>
        <p>Run it backwards to parse an unknown form: strip the ending, spot the marker, subtract it, and you're left with the lexical stem to look up.</p>
      </>}
    >
      <MorphTable flush title="Applying Tense Identifiers to Endings" headers={['Tense','Modification to Base Endings']}
        rows={[
          ['Aorist active','Replace connecting vowel with σα  →  use Imperfect endings'],
          ['Aorist middle','Replace connecting vowel with σα  →  use Imperfect endings'],
          ['Aorist passive','Replace connecting vowel with θη  →  use Imperfect endings'],
          ['Perfect active','Replace connecting vowel with κα  →  use Imperfect endings'],
          ['Future active','Insert σ before connecting vowel  →  use Present endings'],
          ['Future middle','Insert σ before connecting vowel  →  use Present endings'],
          ['Future passive','Insert θησ before connecting vowel  →  use Present endings'],
          ['Perfect mid/pass','Delete connecting vowel  →  use Present endings'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>When the <Gk>σ</Gk> of the future/aorist meets a stem consonant, the two merge into a single letter.</p>
        <Ex grc="γραφ + σω → γράψω" en="I will write" />
        <Ex grc="κηρυκ + σω → κηρύξω" en="I will preach" />
      </>}
      intermediate={<>
        <p>The very same mergers drive the dative plural (<Gk>‒σι</Gk>) and many 3rd-declension nominatives — one rule, several places.</p>
      </>}
    >
      <MorphTable flush title={gt("Consonant + σ Combinations")} headers={['Stem ends in','+ σ','Result']}
        rows={[
          ['π, β, φ','+ σ','ψ'],
          ['τ, δ, θ, ζ','+ σ','σ'],
          ['κ, γ, χ, σ','+ σ','ξ'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>This shows the moving parts of a verb: an <strong>augment</strong> (<Gk>ε‒</Gk>) goes on the <em>front</em> for past tenses, and the <strong>identifier</strong> (<Gk>σ / θ</Gk>) goes <em>after</em> the stem.</p>
      </>}
      intermediate={<>
        <p>The passive builds on <Gk>θη / θησ</Gk>; the middle borrows the active's <Gk>σ</Gk> in the future and aorist. Stem + augment + identifier is the whole machine.</p>
      </>}
    >
      <MorphTable flush title={gt("Tense Stem Structure — λύ‒")} headers={['Tense','Active','Middle','Passive']}
        rows={[
          ['Present','λυ','λυ','λυ'],
          ['Future','λυ‒σ','λυ‒σ','λυ‒θησ'],
          ['Imperfect','ε‒λυ','ε‒λυ','ε‒λυ'],
          ['Aorist','ε‒λυ‒σ','ε‒λυ‒σ','ε‒λυ‒θ'],
        ]}
        note="ε = augment (past tenses); σ / θησ / θ = tense identifier"
      />
    </TableAside>
  </>
)
