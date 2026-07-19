import { MorphTable, InfoBox, TableAside, Gk, Ex, gt } from '../shared'

export const PARTICIPLES_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p><Gk>ὤν, οὖσα, ὄν</Gk> = "being." Translate the article + participle as "the one who is…"</p>
        <Ex grc="ὁ ὢν ἐν τῷ οὐρανῷ" en="the one who is in heaven" />
      </>}
      intermediate={<>
        <p><Gk>εἰμί</Gk> has only a present participle; it helps build <em>periphrastic</em> tenses (<Gk>ἦν διδάσκων</Gk> "he was teaching").</p>
      </>}
    >
      <MorphTable flush title={gt("Present Participle of εἰμί (ὤν, οὖσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','ὤν','ὄν','οὖσα'],['Gen.','ὄντος','ὄντος','οὔσης'],
          ['Dat.','ὄντι','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],
          ['Plural','','',''],
          ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων','ὄντων','οὐσῶν'],
          ['Dat.','οὖσι','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας'],
        ]}
        note="Neuter Gen. & Dat. = Masculine  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Present active participle = "loosing" — action going on at the <em>same time</em> as the main verb (Simultaneous).</p>
        <Ex grc="ὁ λύων τὸν δοῦλον" en="the one loosing the slave" />
      </>}
      intermediate={<>
        <p>It declines on a 3rd-declension pattern for masc./neut. (note the <Gk>‒ντ‒</Gk>) plus 1st-declension for the feminine — the same split as <Gk>πᾶς</Gk>.</p>
      </>}
    >
      <MorphTable flush title={gt("Present Active Participle — λύων, λύουσα, λύον")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','λύων','λύουσα','λύον'],['Gen.','λύοντος','λυούσης','λύοντος'],
          ['Dat.','λύοντι','λυούσῃ','λύοντι'],['Acc.','λύοντα','λύουσαν','λύον'],
          ['Plural','','',''],
          ['Nom.','λύοντες','λύουσαι','λύοντα'],['Gen.','λυόντων','λυουσῶν','λυόντων'],
          ['Dat.','λύουσιν','λυούσαις','λύουσιν'],['Acc.','λύοντας','λυούσας','λύοντα'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Aorist active participle = "having loosed" — action that happened <em>before</em> the main verb (Sequence).</p>
        <Ex grc="λύσας τὸν δοῦλον ἀπῆλθεν" en="having loosed the slave, he left" />
      </>}
      intermediate={<>
        <p>Note there is <strong>no augment</strong> (augments live only in the indicative). The aorist participle marks relative time, not absolute past.</p>
      </>}
    >
      <MorphTable flush title={gt("Aorist Active Participle — λύσας, λύσασα, λύσαν")} headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','λύσας','λύσασα','λύσαν'],['Gen.','λύσαντος','λυσάσης','λύσαντος'],
          ['Dat.','λύσαντι','λυσάσῃ','λύσαντι'],['Acc.','λύσαντα','λύσασαν','λύσαν'],
          ['Plural','','',''],
          ['Nom.','λύσαντες','λύσασαι','λύσαντα'],['Gen.','λυσάντων','λυσασῶν','λυσάντων'],
          ['Dat.','λύσασιν','λυσάσαις','λύσασιν'],['Acc.','λύσαντας','λυσάσας','λύσαντα'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The chunk <Gk>‒μεν‒</Gk> marks a middle/passive participle: "being loosed."</p>
        <Ex grc="ὁ λυόμενος" en="the one being loosed" />
      </>}
      intermediate={<>
        <p>These take the regular 1st/2nd-declension endings of <Gk>ἀγαθός</Gk> — fully predictable, unlike the active's 3rd-declension pattern.</p>
      </>}
    >
      <MorphTable flush title={gt("Middle / Passive Participle Endings (‒μεν‒ + endings of ἀγαθός)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου','‒μενου','‒μενης'],
          ['Dat.','‒μενῳ','‒μενῳ','‒μενῃ'],['Acc.','‒μενον','= Nom.','‒μενην'],
          ['Plural','','',''],
          ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων','‒μενων','‒μενων'],
          ['Dat.','‒μενοις','‒μενοις','‒μεναις'],['Acc.','‒μενους','= Nom.','‒μενας'],
        ]}
        note="Neuter Gen. & Dat. = Masculine  ·  Neuter Acc. = Neuter Nom."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>Build a middle/passive participle from tense marker + <Gk>‒μεν‒</Gk>. The connecting vowel tells the tense.</p>
        <Ex grc="λυόμενος" en="being loosed (present)" />
        <Ex grc="λελυμένος" en="having been loosed (perfect)" />
      </>}
      intermediate={<>
        <p>Reading it in reverse: <Gk>ο</Gk> before <Gk>‒μεν‒</Gk> = present, <Gk>σα</Gk> = aorist middle, and no connecting vowel (with reduplication) = perfect.</p>
      </>}
    >
      <MorphTable flush title={gt("Middle/Passive Participle — Tense Identifier + ‒μεν‒")} headers={['Tense','Identifier','Example (Masc. Nom. Sg.)']}
        rows={[
          ['Present m/p','‒ο‒μεν','λυόμενος'],
          ['Aorist middle','‒σα‒μεν','λυσάμενος'],
          ['Perfect m/p','(no c.v.)‒μεν','λελυμένος'],
        ]}
      />
    </TableAside>
    <InfoBox title="Parsing a Participle — Decision Process">
      <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
        <li>Has the stem been changed? No → regular; Yes → 2nd aorist (uses ‛o' present endings)</li>
        <li>What is the connecting vowel? ο/ου → present; α → aorist</li>
        <li>Is ‒μεν‒ present? No → active participle; Yes → middle/passive (or aorist middle)</li>
      </ol>
    </InfoBox>
  </>
)
