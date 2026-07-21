import { MorphTable, TableAside, Gk, Ex, AsideLabel, gt } from '../shared'

export interface EssSection { id: number; label: string; title: string; content: React.ReactNode }

export const ESS_SECTIONS: EssSection[] = [
  {
    id: 1, label: 'Ess. 1', title: '1st & 2nd Declension Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>What the endings tell you</AsideLabel>
          <p>The ending shows the noun's job. Masculine &amp; neuter nouns use the 2nd-declension columns; feminine nouns use the 1st.</p>
          <AsideLabel>Default translations</AsideLabel>
          <Ex grc="ὁ λόγος" en="the word (subject)" />
          <Ex grc="τοῦ λόγου" en="of the word" />
          <Ex grc="τῷ λόγῳ" en="to / for the word" />
          <Ex grc="τὸν λόγον" en="the word (direct object)" />
        </>}
        intermediate={<>
          <p>One paradigm covers nouns <em>and</em> adjectives. Endings repeat across genders (<Gk>‒ων</Gk> is the genitive plural everywhere), so let the article settle an ambiguous form.</p>
          <p>Two memory savers: neuter matches masculine except in the nom./acc., and neuter nom. = neuter acc.</p>
          <AsideLabel>In a sentence</AsideLabel>
          <Ex grc="ὁ ἀπόστολος λέγει τὸν λόγον τοῦ θεοῦ" en="the apostle speaks the word of God" />
        </>}
      >
        <MorphTable flush headers={['', 'Masc.', 'Neut.', 'Fem.', 'Sense']} dividerRows={[0, 5]} highlight="text-red-600" highlightCols={[1, 2, 3]}
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
    id: 2, label: 'Ess. 2', title: '3rd Declension Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Finding the stem</AsideLabel>
          <p>The stem hides in the nominative — find it by dropping <Gk>‒ος</Gk> from the genitive, then add the endings.</p>
          <Ex grc="σάρξ, σαρκός" en="flesh → stem σαρκ‒" />
          <AsideLabel>Default translations</AsideLabel>
          <Ex grc="ἡ σάρξ" en="the flesh (subject)" />
          <Ex grc="τῆς σαρκός" en="of the flesh" />
          <Ex grc="τῇ σαρκί" en="to / for the flesh" />
          <Ex grc="τὴν σάρκα" en="the flesh (object)" />
        </>}
        intermediate={<>
          <p>Parse a 3rd-declension noun from its <em>genitive</em>: when <Gk>‒ς</Gk> is added in the nominative, stem consonants (<Gk>τ, δ, θ</Gk>) drop out and disguise the word.</p>
          <p>The dative plural <Gk>‒σι(ν)</Gk> triggers the same consonant + <Gk>σ</Gk> changes you meet in the future and aorist.</p>
          <Ex grc="ἐλπίς, ἐλπίδος" en="hope → dat. pl. ἐλπίσι" />
        </>}
      >
        <MorphTable flush headers={['', 'Masc / Fem', 'Neuter', 'Sense']} dividerRows={[0, 5]} highlight="text-red-600" highlightCols={[1, 2]}
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
    id: 3, label: 'Ess. 3', title: 'Present & Imperfect Tense Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Who is acting (person key)</AsideLabel>
          <p>1 = I · 2 = you · 3 = he/she/it · then we · you (pl.) · they.</p>
          <AsideLabel>Default translations (add the verb)</AsideLabel>
          <p><Gk>Present</Gk> active: "I ‒, I am ‒ing" · mid/pass: "I am (being) ‒ed."</p>
          <p><Gk>Imperfect</Gk> active: "I was ‒ing" · mid/pass: "I was being ‒ed." The middle adds "for myself."</p>
          <Ex grc="λύομεν" en="we loose / we are loosing" />
          <Ex grc="ἐλυόμεθα" en="we were loosing (for ourselves)" />
        </>}
        intermediate={<>
          <p>These two rows are the <strong>base</strong> for the whole indicative — every other tense just inserts a marker and reuses them.</p>
          <p>The augment <Gk>ε‒</Gk> on the imperfect is the surest sign of a past-time indicative. Present/imperfect carry <em>imperfective</em> aspect (ongoing action).</p>
          <p>The 2nd-sg. middle <Gk>‒ῃ / ‒ου</Gk> looks odd because an intervocalic <Gk>σ</Gk> dropped out (<Gk>‒σαι → ‒ῃ</Gk>).</p>
        </>}
      >
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-semibold text-center">
          <div className="rounded-md bg-gray-200 border border-gray-300 text-gray-700 px-2 py-1">Secondary · Past Tenses (+ ε augment)</div>
          <div className="rounded-md bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1">Primary · Non-past Tenses</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable flush title="Imperfect Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ον','‒ομην'],['','2','‒ες','‒ου'],['','3','‒ε(ν)','‒ετο'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ον','‒οντο']]}
          />
          <MorphTable flush title="Present Endings" headers={['','','Active','Mid/Pass']} highlight="text-red-600" highlightCols={[2,3]}
            rows={[['SG','1','‒ω','‒ομαι'],['','2','‒εις','‒ῃ (σαι)'],['','3','‒ει','‒εται'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ουσι(ν)','‒ονται']]}
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 4, label: 'Ess. 4', title: 'Tense Identifiers',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>How to use this</AsideLabel>
          <p>A tense identifier is a "flag" letter added to the stem that tells you the tense at a glance. Spot the flag, then read the ending for person.</p>
          <Ex grc="λύω → λύσω" en="the ‒σ‒ makes it future: “I will loose”" />
          <Ex grc="ἔλυσα" en="the ‒σα‒ makes it aorist: “I loosed”" />
        </>}
        intermediate={<>
          <p>The identifier sits <em>between</em> the stem and the ending, so parsing is a two-step scan: find the marker (tense/voice), then read the ending (person/number).</p>
          <p>Recognize the <em>family</em> rather than an exact string: a <Gk>σ</Gk>-cluster = aorist/future, a <Gk>θ</Gk>-cluster = passive. The perfect's reduplication (<Gk>λε‒λυ‒κα</Gk>) reinforces its <Gk>‒κα</Gk>.</p>
        </>}
      >
        <MorphTable flush headers={['Identifier', 'Tense']} firstColIsData highlight="text-blue-600" highlightCols={[0]}
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
    id: 5, label: 'Ess. 5', title: 'Applying Tense Identifiers',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>The recipe</AsideLabel>
          <p>Start from the present or imperfect endings, then change the connecting vowel with the right identifier. Past tenses build on <em>imperfect</em> endings; non-past on <em>present</em> endings.</p>
          <Ex grc="ἔλυον → ἔλυσα" en="imperfect endings + σα = aorist “I loosed”" />
          <Ex grc="λύω → λύσω" en="present endings + σ = future “I will loose”" />
        </>}
        intermediate={<>
          <p>You never memorize a new paradigm, only a <em>transformation</em> of a base. "Insert" operations (future) keep primary endings; "replace" operations (aorist/perfect) reshape the connecting vowel and take secondary endings.</p>
          <p>Run it backwards to parse the unknown: strip the ending, spot the marker, subtract it, and you're left with the lexical stem to look up.</p>
        </>}
      >
        <p className="text-xs text-gray-500 mb-3">All other tenses use the Present or Imperfect endings as a base. The tense identifier modifies the connecting vowel as follows:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable flush title="Secondary (Past) — use Imperfect endings" headers={['Tense','Modification']}
            rows={[['Aorist active','replace c.v. with σα'],['Aorist middle','replace c.v. with σα'],
                   ['Aorist passive','replace c.v. with θη'],['Perfect active','replace c.v. with κα']]}
          />
          <MorphTable flush title="Primary (Non-past) — use Present endings" headers={['Tense','Modification']}
            rows={[['Future active','insert σ before c.v.'],['Future middle','insert σ before c.v.'],
                   ['Future passive','insert θησ before c.v.'],['Perf. mid/pass','delete connecting vowel']]}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">c.v. = connecting vowel</p>
      </TableAside>
    ),
  },
  {
    id: 6, label: 'Ess. 6', title: 'Participle Endings',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Default translations</AsideLabel>
          <p>Active participle = "‒ing"; middle/passive = "being ‒ed." The giveaway chunk <Gk>‒μεν‒</Gk> marks middle/passive.</p>
          <Ex grc="ὤν, οὖσα, ὄν" en="being" />
          <Ex grc="λύων" en="loosing" />
          <Ex grc="λυόμενος" en="being loosed" />
          <Ex grc="ὁ ἄνθρωπος ὁ λύων" en="the man who is loosing" />
        </>}
        intermediate={<>
          <p>A participle carries tense (aspect) and voice but <em>no person</em>, so translate it relative to the main verb: present participle = same time / ongoing, aorist participle = usually prior action.</p>
          <p>The active endings decline on a 3rd-declension pattern for masc./neut. (hence the <Gk>‒ντ‒</Gk>) plus 1st-declension for the feminine.</p>
        </>}
      >
        <div className="space-y-4">
          <MorphTable flush title={gt("6-A  ·  Present Participle of εἰμί  (ὤν, οὔσα, ὄν)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
            rows={[['Singular','','',''],['Nom.','ὤν','ὄν','οὔσα'],['Gen.','ὄντος →','ὄντος','οὔσης'],
                   ['Dat.','ὄντι →','ὄντι','οὔσῃ'],['Acc.','ὄντα','ὄν','οὖσαν'],['Plural','','',''],
                   ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων →','ὄντων','οὐσῶν'],
                   ['Dat.','οὖσι →','οὖσι','οὔσαις'],['Acc.','ὄντας','ὄντα','οὔσας']]}
            note="→ neuter takes the same ending as masculine  ·  Neuter Acc. = Neuter Nom."
          />
          <MorphTable flush title={gt("6-B  ·  Middle / Passive Participle Endings  (‒μεν‒)")} headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]} highlight="text-red-600"
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
    id: 7, label: 'Ess. 7', title: 'Subjunctive & Imperative',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>Default translations</AsideLabel>
          <p><Gk>Subjunctive</Gk> = "may / might / should" (its flag is the long vowel <Gk>ω/η</Gk>).</p>
          <p><Gk>Imperative</Gk> = a command. Learn <Gk>‒τω</Gk> "let him…" and <Gk>‒τωσαν</Gk> "let them…".</p>
          <Ex grc="λῦε" en="loose! (you, sg.)" />
          <Ex grc="λυέτω" en="let him loose" />
          <Ex grc="λύετε" en="loose! (you all)" />
        </>}
        intermediate={<>
          <p>Neither mood ever takes an augment — even the aorist subjunctive/imperative — because they express <em>aspect</em>, not time: aorist = a single whole action, present = ongoing.</p>
          <p>Greek's 3rd-person imperative has no clean English equal, so render it with "let / should."</p>
        </>}
      >
        <MorphTable flush title={<>7-A  ·  Subjunctive of <span className="normal-case">εἰμί</span></>} headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
          rows={[['SG','1','ὦ'],['','2','ᾖς'],['','3','ᾖ'],
                 ['PL','1','ὦμεν'],['','2','ἦτε'],['','3','ὦσι(ν)']]}
        />
        <div className="mt-3 mb-3 rounded-md bg-gray-100 border border-gray-200 px-3 py-2 text-xs text-gray-700">
          <span className="font-semibold">Key endings to memorize — </span>
          3rd Singular: <span className="font-semibold">‒τω</span>&nbsp;&nbsp;|&nbsp;&nbsp;3rd Plural: <span className="font-semibold">‒τωσαν</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{gt("7-B  ·  Imperative Paradigms  (λύω)")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MorphTable flush title="Present Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λῦε'],['','3','λυέτω'],['PL','2','λύετε'],['','3','λυέτωσαν']]}
          />
          <MorphTable flush title="Aorist Active" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσον'],['','3','λυσάτω'],['PL','2','λύσατε'],['','3','λυσάτωσαν']]}
          />
          <MorphTable flush title="Aorist Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύθητι'],['','3','λυθήτω'],['PL','2','λύθητε'],['','3','λυθήτωσαν']]}
          />
          <MorphTable flush title="Present Middle / Passive" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύου'],['','3','λυέσθω'],['PL','2','λύεσθε'],['','3','λυέσθωσαν']]}
          />
          <MorphTable flush title="Aorist Middle" headers={['','Pers.','Form']} highlight="text-red-600" highlightCols={[2]}
            rows={[['SG','2','λύσαι'],['','3','λυσάσθω'],['PL','2','λύσασθε'],['','3','λυσάσθωσαν']]}
          />
        </div>
      </TableAside>
    ),
  },
  {
    id: 8, label: 'Ess. 8', title: '‒μι Verbs',
    content: (
      <TableAside
        beginning={<>
          <AsideLabel>What makes them look strange</AsideLabel>
          <p><strong>Iota reduplication:</strong> in the present &amp; imperfect the first consonant repeats with an iota (<Gk>δι‒δω‒μι</Gk>). See an iota → it's present or imperfect.</p>
          <p>Every <em>other</em> tense drops the iota and follows the regular <Gk>λύω</Gk> pattern, and the aorist marker is <Gk>‒κα</Gk> (not <Gk>‒σα</Gk>).</p>
          <Ex grc="δίδωμί σοι" en="I give to you" />
          <Ex grc="ἔδωκα" en="I gave (aorist ‒κα)" />
        </>}
        intermediate={<>
          <p><Gk>‒μι</Gk> verbs have <strong>two stems</strong>: the present stem (longer, reduplicated) for present + imperfect; the verbal stem (shorter) for future, aorist + perfect.</p>
          <p><Gk>ἵστημι</Gk> is transitive in some tenses ("I set/place") but intransitive in others ("I stand"); its perfect <Gk>ἕστηκα</Gk> means a present state, "I stand."</p>
          <p>Many key NT terms are <Gk>‒μι</Gk> compounds — <Gk>ἀφίημι</Gk> "forgive," <Gk>παραδίδωμι</Gk> "hand over / betray."</p>
        </>}
      >
        <MorphTable flush title="Stem vowels (short / long)" headers={['Short / Long', 'Verb', 'Meaning']} firstColIsData
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
