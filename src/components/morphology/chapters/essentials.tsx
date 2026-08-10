import { MorphTable, TableAside, Gk, Ex, AsideLabel, gt , Tr } from '../shared'

// label and title are rendered as children in MorphologyView, so they can hold a <Tr>.
export interface EssSection { id: number; label: React.ReactNode; title: React.ReactNode; content: React.ReactNode }

export const ESS_SECTIONS: EssSection[] = [
  {
    id: 1, label: <Tr id="essentials.s1.label">Min. 1</Tr>, title: <Tr id="essentials.s1.title">1st & 2nd Declension Endings</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.what-endings-tell">What the endings tell you</Tr></AsideLabel>
          <p><Tr id="essentials.as.ending-shows-noun's">The ending shows the noun's job. Masculine &amp; neuter nouns use the 2nd-declension columns; feminine nouns use the 1st.</Tr></p>
          <AsideLabel><Tr id="essentials.al.default-translations">Default translations</Tr></AsideLabel>
          <Ex grc="ὁ λόγος" en={<Tr id="essentials.ex.word-subject">the word (subject)</Tr>} />
          <Ex grc="τοῦ λόγου" en={<Tr id="essentials.ex.word">of the word</Tr>} />
          <Ex grc="τῷ λόγῳ" en={<Tr id="essentials.ex.word-2">to / for the word</Tr>} />
          <Ex grc="τὸν λόγον" en={<Tr id="essentials.ex.word-direct-object">the word (direct object)</Tr>} />
        </>}
        intermediate={<>
          <p><Tr id="essentials.as.one-paradigm-covers">One paradigm covers nouns <em>and</em> adjectives.</Tr></p>
          <AsideLabel><Tr id="essentials.al.sentence">In a sentence</Tr></AsideLabel>
          <Ex grc="ὁ ἀπόστολος λέγει τὸν λόγον τοῦ θεοῦ" en={<Tr id="essentials.ex.apostle-speaks-word">the apostle speaks the word of God</Tr>} />
        </>}
      >
        <MorphTable id="essentials.t1" tCols={[0, 4]} flush headers={['', 'Masc.', 'Neut.', 'Fem.', 'Sense']} dividerRows={[0, 5]} highlight="text-red-600" highlightCols={[1, 2, 3]}
          rows={[
            ['Singular','','','',''],
            ['Nom.','‒ος','‒ον','‒η','subject'],['Gen.','‒ου →','‒ου','‒ης','of'],
            ['Dat.','‒ῳ →','‒ῳ','‒ῃ','to / for'],['Acc.','‒ον','= Nom.','‒ην','object'],
            ['Plural','','','',''],
            ['Nom.','‒οι','‒α','‒αι','subject'],['Gen.','‒ων →','‒ων','‒ων','of'],
            ['Dat.','‒οις →','‒οις','‒αις','to / for'],['Acc.','‒ους','= Nom.','‒ας','object'],
          ]}
          note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
        />
      </TableAside>
    ),
  },
  {
    id: 2, label: <Tr id="essentials.s2.label">Min. 2</Tr>, title: <Tr id="essentials.s2.title">3rd Declension Endings</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.finding-stem">Finding the stem</Tr></AsideLabel>
          <p><Tr id="essentials.as.stem-hides-nominative">The stem hides in the nominative — find it by dropping <Gk>‒ος</Gk> from the genitive, then add the endings.</Tr></p>
          <Ex grc="σάρξ, σαρκός" en={<Tr id="essentials.ex.flesh-stem">flesh → stem σαρκ‒</Tr>} />
          <AsideLabel><Tr id="essentials.al.default-translations-2">Default translations</Tr></AsideLabel>
          <Ex grc="ἡ σάρξ" en={<Tr id="essentials.ex.flesh-subject">the flesh (subject)</Tr>} />
          <Ex grc="τῆς σαρκός" en={<Tr id="essentials.ex.flesh">of the flesh</Tr>} />
          <Ex grc="τῇ σαρκί" en={<Tr id="essentials.ex.flesh-2">to / for the flesh</Tr>} />
          <Ex grc="τὴν σάρκα" en={<Tr id="essentials.ex.flesh-object">the flesh (object)</Tr>} />
        </>}
        intermediate={<>
          <AsideLabel><Tr id="essentials.al.worked-example">Worked example</Tr></AsideLabel>
          <Ex grc="ἐλπίς, ἐλπίδος" en={<Tr id="essentials.ex.hope-dat">hope → dat. pl. ἐλπίσι</Tr>} />
        </>}
      >
        <MorphTable id="essentials.t2" tCols={[0, 1, 2, 3]} flush headers={['', 'Masc / Fem', 'Neuter', 'Sense']} dividerRows={[0, 5]} highlight="text-red-600" highlightCols={[1, 2]}
          rows={[
            ['Singular','','',''],
            ['Nom.','‒ς  or  ‒(none)','‒(none)','subject'],['Gen.','‒ος →','‒ος','of'],
            ['Dat.','‒ι →','‒ι','to / for'],['Acc.','‒α  or  ‒ν','= Nom.','object'],
            ['Plural','','',''],
            ['Nom.','‒ες','‒α','subject'],['Gen.','‒ων →','‒ων','of'],
            ['Dat.','‒σι →','‒σι','to / for'],['Acc.','‒ας','= Nom.','object'],
          ]}
          note="→ neuter takes the same ending as Masc/Fem  ·  Neuter Acc. = Neuter Nom."
        />
      </TableAside>
    ),
  },
  {
    id: 3, label: <Tr id="essentials.s3.label">Min. 3</Tr>, title: <Tr id="essentials.s3.title">Present & Imperfect Tense Endings</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.who-acting-person">Who is acting (person key)</Tr></AsideLabel>
          <p><Tr id="essentials.as.she-then">1 = I · 2 = you · 3 = he/she/it · then we · you (pl.) · they.</Tr></p>
          <AsideLabel><Tr id="essentials.al.default-translations-add">Default translations (add the verb)</Tr></AsideLabel>
          <p><Tr id="essentials.as.present-active-ing"><strong>Present</strong> active: "I ‒, I am ‒ing" · mid/pass: "I am (being) ‒ed."</Tr></p>
          <p><Tr id="essentials.as.imperfect-active-was"><strong>Imperfect</strong> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</Tr></p>
          <Ex grc="λύομεν" en={<Tr id="essentials.ex.loose-loosing">we loose / we are loosing</Tr>} />
          <Ex grc="ἐλυόμεθα" en={<Tr id="essentials.ex.were-loosing-ourselves">we were loosing (for ourselves)</Tr>} />
        </>}
        intermediate={<>
          <p><Tr id="essentials.as.present-imperfect-carry">Present/imperfect carry <em>imperfective</em> aspect (ongoing action).</Tr></p>
        </>}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-semibold text-center">
          <div className="rounded-md bg-gray-200 border border-gray-300 text-gray-700 px-2 py-1">Secondary · Past Tenses (+ ε augment)</div>
          <div className="rounded-md bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1">Primary · Non-past Tenses</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable id="essentials.t3" tCols={[0, 1]} flush title="Imperfect Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ον','‒ομην'],['','2','‒ες','‒ου'],['','3','‒ε(ν)','‒ετο'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ον','‒οντο']]}
          />
          <MorphTable id="essentials.t4" tCols={[0, 1]} flush title="Present Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ω','‒ομαι'],['','2','‒εις','‒ῃ (σαι)'],['','3','‒ει','‒εται'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ουσι(ν)','‒ονται']]}
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 4, label: <Tr id="essentials.s4.label">Min. 4</Tr>, title: <Tr id="essentials.s4.title">Tense Identifiers</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.how-use">How to use this</Tr></AsideLabel>
          <p><Tr id="essentials.as.tense-identifier-flag">A tense identifier is a "flag" letter added to the stem that tells you the tense at a glance. Spot the flag, then read the ending for person.</Tr></p>
          <Ex grc="λύω → λύσω" en={<Tr id="essentials.ex.makes-future-will">the ‒σ‒ makes it future: “I will loose”</Tr>} />
          <Ex grc="ἔλυσα" en={<Tr id="essentials.ex.makes-aorist-loosed">the ‒σα‒ makes it aorist: “I loosed”</Tr>} />
        </>}
      >
        <MorphTable id="essentials.t5" tCols={[1]} flush headers={['Identifier', 'Tense']} firstColIsData highlight="text-blue-600" highlightCols={[0]}
          rows={[
            ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
            ['‒σα','1 Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1 Aorist (passive)'],
            ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle / passive)'],
          ]}
          note="Reduced forms (σ, θ, κ) appear when the identifier directly precedes certain endings."
        />
      </TableAside>
    ),
  },
  {
    id: 5, label: <Tr id="essentials.s5.label">Min. 5</Tr>, title: <Tr id="essentials.s5.title">Applying Tense Identifiers</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.recipe">The recipe</Tr></AsideLabel>
          <p><Tr id="essentials.as.start-present-imperfect">Start from the present or imperfect endings, then change the connecting vowel with the right identifier. Past tenses build on <em>imperfect</em> endings; non-past on <em>present</em> endings.</Tr></p>
          <Ex grc="ἔλυον → ἔλυσα" en={<Tr id="essentials.ex.imperfect-endings-aorist">imperfect endings + σα = aorist “I loosed”</Tr>} />
          <Ex grc="λύω → λύσω" en={<Tr id="essentials.ex.present-endings-future">present endings + σ = future “I will loose”</Tr>} />
        </>}
      >
        <p className="text-xs text-gray-500 mb-3">All other tenses use the Present or Imperfect endings as a base. The tense identifier modifies the connecting vowel as follows:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable id="essentials.t6" tCols={[0, 1]} flush title="Secondary (Past) — use Imperfect endings" headers={['Tense','Modification']}
            rows={[['Aorist active','replace c.v. with σα'],['Aorist middle','replace c.v. with σα'],
                   ['Aorist passive','replace c.v. with θη'],['Perfect active','replace c.v. with κα']]}
          />
          <MorphTable id="essentials.t7" tCols={[0, 1]} flush title="Primary (Non-past) — use Present endings" headers={['Tense','Modification']}
            rows={[['Future active','insert σ before c.v.'],['Future middle','insert σ before c.v.'],
                   ['Future passive','insert θησ before c.v.'],['Perf. mid/pass','delete connecting vowel']]}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">c.v. = connecting vowel</p>
      </TableAside>
    ),
  },
  {
    id: 6, label: <Tr id="essentials.s6.label">Min. 6</Tr>, title: <Tr id="essentials.s6.title">Participle Endings</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.default-translations-3">Default translations</Tr></AsideLabel>
          <p><Tr id="essentials.as.active-participle-ing">Active participle = "‒ing"; middle/passive = "being ‒ed." The giveaway chunk <Gk>‒μεν‒</Gk> marks middle/passive.</Tr></p>
          <Ex grc="ὤν, οὖσα, ὄν" en={<Tr id="essentials.ex.being">being</Tr>} />
          <Ex grc="λύων" en={<Tr id="essentials.ex.loosing">loosing</Tr>} />
          <Ex grc="λυόμενος" en={<Tr id="essentials.ex.being-loosed">being loosed</Tr>} />
          <Ex grc="ὁ ἄνθρωπος ὁ λύων" en={<Tr id="essentials.ex.man-who-loosing">the man who is loosing</Tr>} />
        </>}
      >
        <div className="space-y-4">
          <MorphTable id="essentials.t8" tCols={[0]} flush title="6-A  ·  Present Participle of εἰμί  (ὤν, οὔσα, ὄν)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
            rows={[['Singular','','',''],['Nom.','ὤν','ὄν','οὔσα'],['Gen.','ὄντος →','ὄντος','οὔσης'],
                   ['Dat.','ὄντι →','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],['Plural','','',''],
                   ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων →','ὄντων','οὐσῶν'],
                   ['Dat.','οὖσι →','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας']]}
            note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
          />
          <MorphTable id="essentials.t9" tCols={[0]} flush title="6-B  ·  Middle / Passive Participle Endings  (‒μεν‒)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
            rows={[['Singular','','',''],['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου →','‒μενου','‒μενης'],
                   ['Dat.','‒μενῳ →','‒μενῳ','‒μενῃ'],['Acc.','‒μενον','= Nom.','‒μενην'],['Plural','','',''],
                   ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων →','‒μενων','‒μενων'],
                   ['Dat.','‒μενοις →','‒μενοις','‒μεναις'],['Acc.','‒μενους','= Nom.','‒μενας']]}
            note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 7, label: <Tr id="essentials.s7.label">Min. 7</Tr>, title: <Tr id="essentials.s7.title">Subjunctive & Imperative</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.default-translations-4">Default translations</Tr></AsideLabel>
          <p><Tr id="essentials.as.subjunctive-may-might"><strong>Subjunctive</strong> = "may / might / should" (its flag is the long vowel <Gk>ω/η</Gk>).</Tr></p>
          <p><Tr id="essentials.as.imperative-command-learn"><strong>Imperative</strong> = a command. Learn <Gk>‒τω</Gk> "let him…" and <Gk>‒τωσαν</Gk> "let them…".</Tr></p>
          <Ex grc="λῦε" en={<Tr id="essentials.ex.loose">loose! (you, sg.)</Tr>} />
          <Ex grc="λυέτω" en={<Tr id="essentials.ex.let-him-loose">let him loose</Tr>} />
          <Ex grc="λύετε" en={<Tr id="essentials.ex.loose-all">loose! (you all)</Tr>} />
        </>}
      >
        <MorphTable id="essentials.t10" tCols={[0]} flush title={<>7-A  ·  Subjunctive of <span className="normal-case">εἰμί</span></>} headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
          rows={[['SG','1','ὦ'],['','2','ᾖς'],['','3','ᾖ'],
                 ['PL','1','ὦμεν'],['','2','ἦτε'],['','3','ὦσι(ν)']]}
        />
        <div className="mt-3 mb-3 rounded-md bg-gray-100 border border-gray-200 px-3 py-2 text-xs text-gray-700">
          <span className="font-semibold">Key endings to memorize — </span>
          3rd Singular: <span className="font-semibold">‒τω</span>&nbsp;&nbsp;|&nbsp;&nbsp;3rd Plural: <span className="font-semibold">‒τωσαν</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{gt("7-B  ·  Imperative Paradigms  (λύω)")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable id="essentials.t11" tCols={[0]} flush title="Present Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λῦε'],['','3','λυέτω'],['PL','2','λύετε'],['','3','λυέτωσαν']]}
          />
          <MorphTable id="essentials.t12" tCols={[0]} flush title="Aorist Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσον'],['','3','λυσάτω'],['PL','2','λύσατε'],['','3','λυσάτωσαν']]}
          />
          <MorphTable id="essentials.t13" tCols={[0]} flush title="Aorist Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύθητι'],['','3','λυθήτω'],['PL','2','λύθητε'],['','3','λυθήτωσαν']]}
          />
          <MorphTable id="essentials.t14" tCols={[0]} flush title="Present Middle / Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύου'],['','3','λυέσθω'],['PL','2','λύεσθε'],['','3','λυέσθωσαν']]}
          />
          <MorphTable id="essentials.t15" tCols={[0]} flush title="Aorist Middle" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσαι'],['','3','λυσάσθω'],['PL','2','λύσασθε'],['','3','λυσάσθωσαν']]}
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 8, label: <Tr id="essentials.s8.label">Min. 8</Tr>, title: <Tr id="essentials.s8.title">‒μι Verbs</Tr>,
    content: (
      <TableAside
        beginning={<>
          <AsideLabel><Tr id="essentials.al.what-makes-them">What makes them look strange</Tr></AsideLabel>
          <p><Tr id="essentials.as.iota-reduplication-present"><strong>Iota reduplication:</strong> in the present &amp; imperfect the first consonant repeats with an iota (<Gk>δι‒δω‒μι</Gk>). See an iota → it's present or imperfect.</Tr></p>
          <p><Tr id="essentials.as.every-other-tense">Every <em>other</em> tense drops the iota and follows the regular <Gk>λύω</Gk> pattern, and the aorist marker is <Gk>‒κα</Gk> (not <Gk>‒σα</Gk>).</Tr></p>
          <Ex grc="δίδωμί σοι" en={<Tr id="essentials.ex.give">I give to you</Tr>} />
          <Ex grc="ἔδωκα" en={<Tr id="essentials.ex.gave-aorist">I gave (aorist ‒κα)</Tr>} />
        </>}
        intermediate={<>
          <p><Tr id="essentials.as.verbs-two-stems"><Gk>‒μι</Gk> verbs have <strong>two stems</strong>: the present stem (longer, reduplicated) for present + imperfect; the verbal stem (shorter) for future, aorist + perfect.</Tr></p>
          <p><Tr id="essentials.as.transitive-some-tenses"><Gk>ἵστημι</Gk> is transitive in some tenses ("I set/place") but intransitive in others ("I stand"); its perfect <Gk>ἕστηκα</Gk> means a present state, "I stand."</Tr></p>
          <p><Tr id="essentials.as.many-key-terms">Many key NT terms are <Gk>‒μι</Gk> compounds — <Gk>ἀφίημι</Gk> "forgive," <Gk>παραδίδωμι</Gk> "hand over / betray."</Tr></p>
        </>}
      >
        <MorphTable id="essentials.t16" tCols={[2]} flush title="Stem vowels (short / long)" headers={['Short / Long', 'Verb', 'Meaning']} firstColIsData
          rows={[
            ['δο / δω','δίδωμι','I give'],
            ['θε / θη','τίθημι','I put / place'],
            ['στα / στη','ἵστημι','I stand'],
            ['ε / η','ἀφίημι','I forgive / release'],
          ]}
          note="The stem vowel appears short or long depending on the form."
        />
      </TableAside>
    ),
  },
]
