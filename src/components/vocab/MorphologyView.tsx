'use client'

import { useState } from 'react'
import clsx from 'clsx'

/* ─────────────────────────────────────────────
   Reusable helpers
───────────────────────────────────────────── */

interface MorphTableProps {
  title?: string
  headers: string[]
  rows: (string | null | undefined)[][]
  dividerRows?: number[]
  note?: string
}

function MorphTable({ title, headers, rows, dividerRows = [], note }: MorphTableProps) {
  const divSet = new Set(dividerRows)
  return (
    <div className="mb-5">
      {title && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {title}
        </p>
      )}
      <div className="w-fit max-w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {headers.map((h, i) => (
                <th key={i} className={clsx('px-3 py-2 font-semibold text-gray-700 text-xs tracking-wide whitespace-nowrap', i === 0 ? 'text-left' : 'text-center')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isDivider = divSet.has(ri)
              return (
                <tr key={ri} className={clsx(isDivider ? 'bg-gray-50 border-t border-gray-200' : 'bg-white', !isDivider && ri > 0 && 'border-t border-gray-100')}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={clsx('px-3 py-2', isDivider ? 'text-xs font-semibold text-gray-500 uppercase tracking-wide' : ci === 0 ? 'text-left text-xs font-medium text-gray-500 whitespace-nowrap' : 'text-center text-gray-900 text-base')}>
                      {cell ?? ''}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

function InfoBox({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
      {title && <p className="font-semibold text-gray-800 mb-1.5">{title}</p>}
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Top-level tab definitions
───────────────────────────────────────────── */

type MainTab = 'essentials' | 'nouns' | 'pronouns' | 'prepositions' | 'conjunctions' |
               'indicatives' | 'infinitives' | 'imperatives' | 'participles' | 'subjunctives' | 'mi-verbs'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'essentials',   label: 'Essentials'      },
  { id: 'nouns',        label: 'Nouns/Adj.'      },
  { id: 'pronouns',     label: 'Pronouns'        },
  { id: 'prepositions', label: 'Prepositions'    },
  { id: 'conjunctions', label: 'Conjunctions'    },
  { id: 'indicatives',  label: 'Indicatives'     },
  { id: 'infinitives',  label: 'Infinitives'     },
  { id: 'imperatives',  label: 'Imperatives'     },
  { id: 'participles',  label: 'Participles'     },
  { id: 'subjunctives', label: 'Subjunctives'    },
  { id: 'mi-verbs',     label: 'μι-Verbs'        },
]

/* ─────────────────────────────────────────────
   Essential sections (Ess. 1–8)
───────────────────────────────────────────── */

interface EssSection { id: number; label: string; title: string; content: React.ReactNode }

const ESS_SECTIONS: EssSection[] = [
  {
    id: 1, label: 'Ess. 1', title: '1st & 2nd Declension Endings',
    content: (
      <MorphTable headers={['', 'Masculine', 'Neuter', 'Feminine']} dividerRows={[0, 5]}
        rows={[
          ['Singular','','',''],
          ['Nom.','‒ος','‒ον','‒η'],['Gen.','‒ου','','‒ης'],
          ['Dat.','‒ῳ','','‒ῃ'],['Acc.','‒ον','','‒ην'],
          ['Plural','','',''],
          ['Nom.','‒οι','‒α','‒αι'],['Gen.','‒ων','','‒ων'],
          ['Dat.','‒οις','','‒αις'],['Acc.','‒ους','','‒ας'],
        ]}
        note="Empty neuter cells share the masculine ending."
      />
    ),
  },
  {
    id: 2, label: 'Ess. 2', title: '3rd Declension Endings',
    content: (
      <MorphTable headers={['', 'Masc / Fem', 'Neuter']} dividerRows={[0, 5]}
        rows={[
          ['Singular','',''],
          ['Nom.','‒ς  or  ‒(none)','‒(none)'],['Gen.','‒ος',''],
          ['Dat.','‒ι',''],['Acc.','‒α  or  ‒ν',''],
          ['Plural','',''],
          ['Nom.','‒ες','‒α'],['Gen.','‒ων',''],
          ['Dat.','‒σι',''],['Acc.','‒ας',''],
        ]}
        note="Empty neuter cells share the Masc/Fem ending."
      />
    ),
  },
  {
    id: 3, label: 'Ess. 3', title: 'Present & Imperfect Tense Endings',
    content: (
      <>
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-semibold text-center">
          <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1">Secondary · Past Tenses (+ ε augment)</div>
          <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1">Primary · Non-past Tenses</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorphTable title="Imperfect Endings" headers={['','','Active','Mid/Pass']}
            rows={[['SG','1','‒ον','‒ομην'],['','2','‒ες','‒ου'],['','3','‒ε(ν)','‒ετο'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ον','‒οντο']]}
          />
          <MorphTable title="Present Endings" headers={['','','Active','Mid/Pass']}
            rows={[['SG','1','‒ω','‒ομαι'],['','2','‒εις','‒ῃ (σαι)'],['','3','‒ει','‒εται'],
                   ['PL','1','‒ομεν','‒ομεθα'],['','2','‒ετε','‒εσθε'],['','3','‒ουσι(ν)','‒ονται']]}
          />
        </div>
      </>
    ),
  },
  {
    id: 4, label: 'Ess. 4', title: 'Tense Identifiers',
    content: (
      <MorphTable headers={['Identifier', 'Tense']}
        rows={[
          ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
          ['‒σα','1 Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1 Aorist (passive)'],
          ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle / passive)'],
        ]}
        note="Reduced forms (σ, θ, κ) appear when the identifier directly precedes certain endings."
      />
    ),
  },
  {
    id: 5, label: 'Ess. 5', title: 'Applying Tense Identifiers',
    content: (
      <>
        <p className="text-xs text-gray-500 mb-3">All other tenses use the Present or Imperfect endings as a base. The tense identifier modifies the connecting vowel as follows:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorphTable title="Secondary (Past) — use Imperfect endings" headers={['Tense','Modification']}
            rows={[['Aorist active','replace c.v. with σα'],['Aorist middle','replace c.v. with σα'],
                   ['Aorist passive','replace c.v. with θη'],['Perfect active','replace c.v. with κα']]}
          />
          <MorphTable title="Primary (Non-past) — use Present endings" headers={['Tense','Modification']}
            rows={[['Future active','insert σ before c.v.'],['Future middle','insert σ before c.v.'],
                   ['Future passive','insert θησ before c.v.'],['Perf. mid/pass','delete connecting vowel']]}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">c.v. = connecting vowel</p>
      </>
    ),
  },
  {
    id: 6, label: 'Ess. 6', title: 'Participle Endings',
    content: (
      <>
        <MorphTable title="6-A  ·  Present Participle of εἰμί  (ὤν, οὔσα, ὄν)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
          rows={[['Singular','','',''],['Nom.','ὤν','ὄν','οὔσα'],['Gen.','ὄντος','','οὔσης'],
                 ['Dat.','ὄντι','','οὔσῃ'],['Acc.','ὄντα','','οὖσαν'],['Plural','','',''],
                 ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων','','οὐσῶν'],
                 ['Dat.','ὄντσι','','οὔσαις'],['Acc.','ὄντας','','οὔσας']]}
          note="Empty neuter cells share the masculine ending."
        />
        <MorphTable title="6-B  ·  Middle / Passive Participle Endings  (‒μεν‒)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
          rows={[['Singular','','',''],['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου','','‒μενης'],
                 ['Dat.','‒μενῳ','','‒μενῃ'],['Acc.','‒μενον','','‒μενην'],['Plural','','',''],
                 ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων','','‒μενων'],
                 ['Dat.','‒μενοις','','‒μεναις'],['Acc.','‒μενους','','‒μενας']]}
          note="Empty neuter cells share the masculine ending."
        />
      </>
    ),
  },
  {
    id: 7, label: 'Ess. 7', title: 'Subjunctive & Imperative',
    content: (
      <>
        <MorphTable title="7-A  ·  Subjunctive of εἰμί" headers={['','Pers.','Form']}
          rows={[['SG','1','ὦ'],['','2','ᾖς'],['','3','ᾖ'],
                 ['PL','1','ὦμεν'],['','2','ἦτε'],['','3','ὦσι(ν)']]}
        />
        <div className="mb-3 rounded-md bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs text-indigo-800">
          <span className="font-semibold">Key endings to memorize — </span>
          3rd Singular: <span className="font-semibold">‒τω</span>&nbsp;&nbsp;|&nbsp;&nbsp;3rd Plural: <span className="font-semibold">‒τωσαν</span>
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">7-B  ·  Imperative Paradigms  (λύω)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MorphTable title="Present Active" headers={['','Pers.','Form']}
            rows={[['SG','2','λῦε'],['','3','λυέτω'],['PL','2','λύετε'],['','3','λυέτωσαν']]}
          />
          <MorphTable title="Aorist Active" headers={['','Pers.','Form']}
            rows={[['SG','2','λύσον'],['','3','λυσάτω'],['PL','2','λύσατε'],['','3','λυσάτωσαν']]}
          />
          <MorphTable title="Aorist Passive" headers={['','Pers.','Form']}
            rows={[['SG','2','λύθητι'],['','3','λυθήτω'],['PL','2','λύθητε'],['','3','λυθήτωσαν']]}
          />
          <MorphTable title="Present Middle / Passive" headers={['','Pers.','Form']}
            rows={[['SG','2','λύου'],['','3','λυέσθω'],['PL','2','λύεσθε'],['','3','λυέσθωσαν']]}
          />
          <MorphTable title="Aorist Middle" headers={['','Pers.','Form']}
            rows={[['SG','2','λύσαι'],['','3','λυσάσθω'],['PL','2','λύσασθε'],['','3','λυσάσθωσαν']]}
          />
        </div>
      </>
    ),
  },
  {
    id: 8, label: 'Ess. 8', title: '‒μι Verbs',
    content: (
      <div className="space-y-3 mb-5">
        <InfoBox title="1. Stem vowel alternates (short / long)">
          <p className="text-gray-500 text-xs mb-2">The stem vowel may appear in either its short or long form depending on the form.</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <span className="text-gray-500">Short / Long</span><span className="text-gray-500">Verb</span>
            <span className="font-medium">δο / δω</span><span>δίδωμι</span>
            <span className="font-medium">θε / θη</span><span>τίθημι</span>
            <span className="font-medium">στα / στη</span><span>ἵστημι</span>
            <span className="font-medium">ε / η</span><span>ἀφίημι</span>
          </div>
        </InfoBox>
        <InfoBox title="2. Iota reduplication">
          <p className="text-xs text-gray-500">Occurs <span className="font-semibold text-gray-700">only</span> in the present and imperfect tenses. The initial consonant is reduplicated with an iota (e.g., δι‒δω‒μι, τι‒θη‒μι, ἵ‒στη‒μι).</p>
        </InfoBox>
      </div>
    ),
  },
]

/* ─────────────────────────────────────────────
   Revision section content
───────────────────────────────────────────── */

const NOUNS_CONTENT = (
  <>
    <MorphTable title="1st & 2nd Declension Endings" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','‒ος','‒ον','‒η'],['Gen.','‒ου','','‒ης'],
        ['Dat.','‒ῳ','','‒ῃ'],['Acc.','‒ον','','‒ην'],
        ['Plural','','',''],
        ['Nom.','‒οι','‒α','‒αι'],['Gen.','‒ων','','‒ων'],
        ['Dat.','‒οις','','‒αις'],['Acc.','‒ους','','‒ας'],
      ]}
      note="Empty neuter cells share the masculine ending."
    />
    <MorphTable title="Article & Noun Paradigm" headers={['','','Art.','Noun','Art.','Noun','Art.','Noun']}
      rows={[
        ['','','Masc.','λόγος','Fem.','ἀρχή','Neut.','ἔργον'],
        ['Sg.','Nom.','ὁ','λόγος','ἡ','ἀρχή','τό','ἔργον'],
        ['','Gen.','τοῦ','λόγου','τῆς','ἀρχῆς','τοῦ','ἔργου'],
        ['','Dat.','τῷ','λόγῳ','τῇ','ἀρχῇ','τῷ','ἔργῳ'],
        ['','Acc.','τόν','λόγον','τήν','ἀρχήν','τό','ἔργον'],
        ['Pl.','Nom.','οἱ','λόγοι','αἱ','ἀρχαί','τά','ἔργα'],
        ['','Gen.','τῶν','λόγων','τῶν','ἀρχῶν','τῶν','ἔργων'],
        ['','Dat.','τοῖς','λόγοις','ταῖς','ἀρχαῖς','τοῖς','ἔργοις'],
        ['','Acc.','τούς','λόγους','τάς','ἀρχάς','τά','ἔργα'],
      ]}
    />
    <MorphTable title="3rd Declension Endings" headers={['','Masc./Fem.','Neuter']} dividerRows={[0,5]}
      rows={[
        ['Singular','',''],
        ['Nom.','‒ς  or  ‒(none)','‒(none)'],['Gen.','‒ος',''],
        ['Dat.','‒ι',''],['Acc.','‒α  or  ‒ν',''],
        ['Plural','',''],
        ['Nom.','‒ες','‒α'],['Gen.','‒ων',''],['Dat.','‒σι',''],['Acc.','‒ας',''],
      ]}
      note="Empty neuter cells share the Masc./Fem. ending."
    />
    <MorphTable title="πᾶς, πᾶσα, πᾶν  (all, every)" headers={['','','Masc. (3rd)','Fem. (1st)','Neut. (3rd)']}
      rows={[
        ['Sg.','Nom.','πᾶς','πᾶσα','πᾶν'],['','Gen.','παντός','πάσης','παντός'],
        ['','Dat.','παντί','πάσῃ','παντί'],['','Acc.','πάντα','πᾶσαν','πᾶν'],
        ['Pl.','Nom.','πάντες','πᾶσαι','πάντα'],['','Gen.','πάντων','πασῶν','πάντων'],
        ['','Dat.','πᾶσιν','πάσαις','πᾶσιν'],['','Acc.','πάντας','πάσας','πάντα'],
      ]}
    />
  </>
)

const PRONOUNS_CONTENT = (
  <>
    <MorphTable title="3rd Person Pronoun — αὐτός (he, she, it)" headers={['','','Masc.','Eng.','Fem.','Eng.','Neut.','Eng.']}
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
    <MorphTable title="1st & 2nd Person Pronouns" headers={['Case','1st Sg.','Eng.','1st Pl.','Eng.','2nd Sg.','Eng.','2nd Pl.']}
      rows={[
        ['Nom.','ἐγώ','I','ἡμεῖς','we','σύ','you','ὑμεῖς'],
        ['Gen.','ἐμοῦ / μου','of me','ἡμῶν','of us','σοῦ','of you','ὑμῶν'],
        ['Dat.','ἐμοί / μοι','to/for me','ἡμῖν','to/for us','σοί','to/for you','ὑμῖν'],
        ['Acc.','ἐμέ / με','me','ἡμᾶς','us','σέ','you','ὑμᾶς'],
      ]}
    />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MorphTable title="οὐδείς — no one, nothing" headers={['','Masc.','Fem.','Neut.']}
        rows={[
          ['Nom.','οὐδείς','οὐδεμία','οὐδέν'],
          ['Gen.','οὐδενός','οὐδεμιᾶς','οὐδενός'],
          ['Dat.','οὐδενί','οὐδεμιᾷ','οὐδενί'],
          ['Acc.','οὐδένα','οὐδεμίαν','οὐδέν'],
        ]}
        note="Used with indicative mood."
      />
      <MorphTable title="μηδείς — no one, nothing" headers={['','Masc.','Fem.','Neut.']}
        rows={[
          ['Nom.','μηδείς','μηδεμία','μηδέν'],
          ['Gen.','μηδενός','μηδεμιᾶς','μηδενός'],
          ['Dat.','μηδενί','μηδεμιᾷ','μηδενί'],
          ['Acc.','μηδένα','μηδεμίαν','μηδέν'],
        ]}
        note="Used with non-indicative moods."
      />
    </div>
    <MorphTable title="τις — Indefinite Pronoun (someone, anyone)" headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
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
    <MorphTable title="τίς — Interrogative Pronoun (who? what?)" headers={['','Masc. & Fem.','Eng.','Neut.','Eng.']}
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
  </>
)

const PREPOSITIONS_CONTENT = (
  <MorphTable title="Common Prepositions" headers={['Greek','Meaning']}
    rows={[
      ['ἀπό','from'],
      ['ἐπί','on, upon'],
      ['διά','through'],
      ['πρός','to, toward'],
      ['ἐκ / ἐξ','out of'],
      ['εἰς','into'],
      ['ἐν','in'],
      ['μετά','with; after (+ gen./acc.)'],
      ['σύν','with'],
      ['περί','around, about'],
      ['κατά','against; down from (+ gen./acc.)'],
      ['παρά','beside, from (+ gen./dat./acc.)'],
      ['ἐπί','on, over, at (+ gen./dat./acc.)'],
      ['ὑπό','by, under (+ gen./acc.)'],
      ['ἀντί','instead of, in place of'],
    ]}
  />
)

const CONJUNCTIONS_CONTENT = (
  <>
    <MorphTable title="Conditional Sentences" headers={['Class','Protasis','Apodosis']}
      rows={[
        ['First Class (Assumed True)','εἰ + Indicative','Any mood or tense'],
        ['Second Class (Contrary to Fact)','εἰ + Indicative','ἄν + Indicative'],
        ['Third Class (Probable / Future)','ἐάν + Subjunctive','Any mood or tense'],
      ]}
    />
  </>
)

const INDICATIVES_CONTENT = (
  <>
    <MorphTable title="Present Tense — λύω (I loose, I am loosing)" headers={['Person','Greek','Translation']}
      rows={[
        ['1st sg.','λύω','I am untying / I untie'],
        ['2nd sg.','λύεις','You are untying / you untie'],
        ['3rd sg.','λύει','He/she/it is untying'],
        ['1st pl.','λύομεν','We are untying / we untie'],
        ['2nd pl.','λύετε','You are untying / you untie'],
        ['3rd pl.','λύουσι(ν)','They are untying / they untie'],
      ]}
    />
    <MorphTable title="Present & Imperfect Full Paradigm — λύω" headers={['','','Imp. Active','Imp. Mid/Pass','Pres. Active','Pres. Mid/Pass']}
      rows={[
        ['SG','1','ἔλυον','ἐλυόμην','λύω','λύομαι'],
        ['','2','ἔλυες','ἐλύου','λύεις','λύῃ (σαι)'],
        ['','3','ἔλυε(ν)','ἐλύετο','λύει','λύεται'],
        ['PL','1','ἐλύομεν','ἐλυόμεθα','λύομεν','λυόμεθα'],
        ['','2','ἐλύετε','ἐλύεσθε','λύετε','λύεσθε'],
        ['','3','ἔλυον','ἐλύοντο','λύουσι(ν)','λύονται'],
      ]}
    />
    <MorphTable title="εἰμί — Present, Future & Imperfect Indicative" headers={['Person','Present','Future','Imperfect']}
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
    <MorphTable title="Perfect & Pluperfect — λύω" headers={['Tense','Voice','Form','Translation']}
      rows={[
        ['Perfect','Active','λέλυκα','I have loosed'],
        ['','Middle','λέλυμαι','I have loosed myself'],
        ['','Passive','λέλυμαι','I have been loosed'],
        ['Pluperfect','Active','ἐλελύκειν','I had loosed'],
        ['','Middle','ἐλελύμην','I had loosed myself'],
        ['','Passive','ἐλελύμην','I had been loosed'],
      ]}
    />
    <MorphTable title="Full Tense & Voice Paradigm — λύω (1st sg.)" headers={['Tense','Voice','Form','Translation']}
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
    <MorphTable title="Tense Identifiers" headers={['Identifier','Tense']}
      rows={[
        ['‒σ','Future (active and middle)'],['‒θησ','Future (passive)'],
        ['‒σα','1st Aorist (active and middle)'],['‒θη / ‒θε / ‒θ','1st Aorist (passive)'],
        ['‒κα / ‒κ','Perfect (active)'],['‒(none)','Perfect (middle/passive)'],
      ]}
    />
    <MorphTable title="Applying Tense Identifiers to Endings" headers={['Tense','Modification to Base Endings']}
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
    <MorphTable title="Consonant + σ Combinations" headers={['Stem ends in','+ σ','Result']}
      rows={[
        ['π, β, φ','+ σ','ψ'],
        ['τ, δ, θ, ζ','+ σ','σ'],
        ['κ, γ, χ, σ','+ σ','ξ'],
      ]}
    />
    <MorphTable title="Tense Stem Structure — λύ‒" headers={['Tense','Active','Middle','Passive']}
      rows={[
        ['Present','λυ','λυ','λυ'],
        ['Future','λυ‒σ','λυ‒σ','λυ‒θησ'],
        ['Imperfect','ε‒λυ','ε‒λυ','ε‒λυ'],
        ['Aorist','ε‒λυ‒σ','ε‒λυ‒σ','ε‒λυ‒θ'],
      ]}
      note="ε = augment (past tenses); σ / θησ / θ = tense identifier"
    />
  </>
)

const INFINITIVES_CONTENT = (
  <>
    <MorphTable title="Most Common Infinitive Forms — λύω" headers={['','Present Active','Aorist Active']}
      rows={[['Infinitive','λύειν','λύσαι']]}
    />
    <InfoBox title="Notes">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>The infinitive is translated as "to…"</li>
        <li>The Aorist infinitive has a σ suffix, but <em>no augment</em></li>
        <li>‒εω verbs follow normal rules: φιλεῖν, φιλῆσαι</li>
      </ul>
    </InfoBox>
  </>
)

const IMPERATIVES_CONTENT = (
  <>
    <MorphTable title="Most Common Imperative Forms — λύω" headers={['','Present Active','Aorist Active']}
      rows={[
        ['2nd Person Singular','λῦε','λύσον'],
        ['2nd Person Plural','λύετε','λύσατε'],
      ]}
    />
    <InfoBox title="Notes">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>These are 2nd person imperatives</li>
        <li>Aorist imperatives do <em>not</em> have the augment</li>
        <li>Aorist has σ suffix, as in the Indicative</li>
        <li>2nd pl. Present Imperative is identical to 2nd pl. Present Indicative</li>
        <li>‒εω verbs follow normal rules</li>
      </ul>
    </InfoBox>
  </>
)

const PARTICIPLES_CONTENT = (
  <>
    <MorphTable title="Present Participle of εἰμί (ὤν, οὖσα, ὄν)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','ὤν','ὄν','οὖσα'],['Gen.','ὄντος','','οὔσης'],
        ['Dat.','ὄντι','','οὔσῃ'],['Acc.','ὄντα','','οὖσαν'],
        ['Plural','','',''],
        ['Nom.','ὄντες','ὄντα','οὖσαι'],['Gen.','ὄντων','','οὐσῶν'],
        ['Dat.','οὖσι','','οὔσαις'],['Acc.','ὄντας','','οὔσας'],
      ]}
    />
    <MorphTable title="Present Active Participle — λύων, λύουσα, λύον" headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','λύων','λύουσα','λύον'],['Gen.','λύοντος','λυούσης','λύοντος'],
        ['Dat.','λύοντι','λυούσῃ','λύοντι'],['Acc.','λύοντα','λύουσαν','λύον'],
        ['Plural','','',''],
        ['Nom.','λύοντες','λύουσαι','λύοντα'],['Gen.','λυόντων','λυουσῶν','λυόντων'],
        ['Dat.','λύουσιν','λυούσαις','λύουσιν'],['Acc.','λύοντας','λυούσας','λύοντα'],
      ]}
    />
    <MorphTable title="Aorist Active Participle — λύσας, λύσασα, λύσαν" headers={['','Masc.','Fem.','Neut.']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','λύσας','λύσασα','λύσαν'],['Gen.','λύσαντος','λυσάσης','λύσαντος'],
        ['Dat.','λύσαντι','λυσάσῃ','λύσαντι'],['Acc.','λύσαντα','λύσασαν','λύσαν'],
        ['Plural','','',''],
        ['Nom.','λύσαντες','λύσασαι','λύσαντα'],['Gen.','λυσάντων','λυσασῶν','λυσάντων'],
        ['Dat.','λύσασιν','λυσάσαις','λύσασιν'],['Acc.','λύσαντας','λυσάσας','λύσαντα'],
      ]}
    />
    <MorphTable title="Middle / Passive Participle Endings (‒μεν‒ + endings of ἀγαθός)" headers={['','Masculine','Neuter','Feminine']} dividerRows={[0,5]}
      rows={[
        ['Singular','','',''],
        ['Nom.','‒μενος','‒μενον','‒μενη'],['Gen.','‒μενου','','‒μενης'],
        ['Dat.','‒μενῳ','','‒μενῃ'],['Acc.','‒μενον','','‒μενην'],
        ['Plural','','',''],
        ['Nom.','‒μενοι','‒μενα','‒μεναι'],['Gen.','‒μενων','','‒μενων'],
        ['Dat.','‒μενοις','','‒μεναις'],['Acc.','‒μενους','','‒μενας'],
      ]}
    />
    <MorphTable title="Middle/Passive Participle — Tense Identifier + ‒μεν‒" headers={['Tense','Identifier','Example (Masc. Nom. Sg.)']}
      rows={[
        ['Present m/p','‒ο‒μεν','λυόμενος'],
        ['Aorist middle','‒σα‒μεν','λυσάμενος'],
        ['Perfect m/p','(no c.v.)‒μεν','λελυμένος'],
      ]}
    />
    <InfoBox title="Parsing a Participle — Decision Process">
      <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
        <li>Has the stem been changed? No → regular; Yes → 2nd aorist (uses ‛o' present endings)</li>
        <li>What is the connecting vowel? ο/ου → present; α → aorist</li>
        <li>Is ‒μεν‒ present? No → active participle; Yes → middle/passive (or aorist middle)</li>
      </ol>
    </InfoBox>
  </>
)

const SUBJUNCTIVES_CONTENT = (
  <>
    <MorphTable title="Present Subjunctive — λύω" headers={['','Pers.','Active','Mid./Pass.']}
      rows={[
        ['SG','1','λύω','λύωμαι'],['','2','λύῃς','λύῃ'],['','3','λύῃ','λύηται'],
        ['PL','1','λύωμεν','λυώμεθα'],['','2','λύητε','λύησθε'],['','3','λύωσιν','λύωνται'],
      ]}
      note="I may (might) be loosing / I may be loosed"
    />
    <MorphTable title="Aorist Subjunctive — λύω" headers={['','Pers.','Active','Middle','Passive']}
      rows={[
        ['SG','1','λύσω','λύσωμαι','λυθῶ'],['','2','λύσῃς','λύσῃ','λυθῇς'],['','3','λύσῃ','λύσηται','λυθῇ'],
        ['PL','1','λύσωμεν','λυσώμεθα','λυθῶμεν'],['','2','λύσητε','λύσησθε','λυθῆτε'],['','3','λύσωσιν','λύσωνται','λυθῶσιν'],
      ]}
      note="I may (might) loose / I may be loosed"
    />
    <InfoBox title="Uses of the Subjunctive">
      <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
        <li><span className="font-medium">Indefinite clauses:</span> ἄν + subj — ὃς ἄν (whoever), ὅπου ἄν (wherever), ὅταν (whenever)</li>
        <li><span className="font-medium">Purpose clauses:</span> ἵνα / ὅπως + subj — "in order that…"</li>
        <li><span className="font-medium">Exhortations (Hortatory):</span> 1st pl. subj — "Let us…"</li>
        <li><span className="font-medium">Deliberation (Deliberative):</span> 1st pl. subj — "What should we…?"</li>
        <li><span className="font-medium">Prohibitions:</span> μή + aorist subj — "Do not…"</li>
        <li><span className="font-medium">Emphatic negation:</span> οὐ μή + aorist subj — "will definitely not…"</li>
      </ol>
    </InfoBox>
  </>
)

const MI_VERBS_CONTENT = (
  <>
    <MorphTable title="‒μι Verb Stems" headers={['-μι verb','Verb stem','Present stem']}
      rows={[
        ['δίδωμι','δο / δω','διδο / διδω'],
        ['τίθημι','θε / θη','τιθε / τιθη'],
        ['ἵστημι','στα / στη','ἱστα / ἱστη'],
      ]}
      note="The reduplicated present stem is lengthened in the singular (διδο → διδω, τιθε → τιθη, ἱστα → ἱστη)."
    />
    <MorphTable title="Present Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
      rows={[
        ['Sg.','1.','δίδωμι','τίθημι','ἵστημι'],
        ['','2.','δίδως','τίθης','ἵστης'],
        ['','3.','δίδωσι(ν)','τίθησι(ν)','ἵστησι(ν)'],
        ['Pl.','1.','δίδομεν','τίθεμεν','ἵσταμεν'],
        ['','2.','δίδοτε','τίθετε','ἵστατε'],
        ['','3.','διδόασι(ν)','τιθέασι(ν)','ἱστᾶσι(ν)'],
      ]}
    />
    <MorphTable title="Aorist Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
      rows={[
        ['Sg.','1.','ἔδωκα','ἔθηκα','ἔστησα'],
        ['','2.','ἔδωκας','ἔθηκας','ἔστησας'],
        ['','3.','ἔδωκε(ν)','ἔθηκε(ν)','ἔστησε(ν)'],
        ['Pl.','1.','ἐδώκαμεν','ἐθήκαμεν','ἐστήσαμεν'],
        ['','2.','ἐδώκατε','ἐθήκατε','ἐστήσατε'],
        ['','3.','ἔδωκαν','ἔθηκαν','ἔστησαν'],
      ]}
    />
    <InfoBox title="Key Features of ‒μι Verbs">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>Stem vowel alternates short/long: δο/δω, θε/θη, στα/στη</li>
        <li>Iota reduplication occurs <em>only</em> in present and imperfect tenses</li>
        <li>Perfect, Aorist, and Future use the short verb stem</li>
        <li>Present and Imperfect use the reduplicated (longer) stem</li>
      </ul>
    </InfoBox>
  </>
)

/* ─────────────────────────────────────────────
   Revision section map
───────────────────────────────────────────── */

const REVISION_CONTENT: Record<MainTab, React.ReactNode> = {
  essentials:   null,
  nouns:        NOUNS_CONTENT,
  pronouns:     PRONOUNS_CONTENT,
  prepositions: PREPOSITIONS_CONTENT,
  conjunctions: CONJUNCTIONS_CONTENT,
  indicatives:  INDICATIVES_CONTENT,
  infinitives:  INFINITIVES_CONTENT,
  imperatives:  IMPERATIVES_CONTENT,
  participles:  PARTICIPLES_CONTENT,
  subjunctives: SUBJUNCTIVES_CONTENT,
  'mi-verbs':   MI_VERBS_CONTENT,
}

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */

export function MorphologyView() {
  const [mainTab, setMainTab] = useState<MainTab>('essentials')
  const [essId, setEssId]     = useState(1)

  const activeEss = ESS_SECTIONS.find(s => s.id === essId)!

  return (
    <div className="flex flex-col min-h-0">
      {/* Page heading */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Essential Endings</h1>
      </div>

      {/* Main tab bar */}
      <div className="overflow-x-auto">
        <div className="flex gap-1.5 px-4 py-2 border-b border-gray-100 bg-white min-w-max">
          {MAIN_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                mainTab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mainTab === 'essentials' ? (
          <>
            {/* Ess. 1–8 sub-navigation */}
            <div className="flex gap-1.5 flex-wrap px-4 py-3 border-b border-gray-100 bg-white">
              {ESS_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setEssId(s.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    essId === s.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="px-4 py-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">{activeEss.title}</h2>
              {activeEss.content}
            </div>
          </>
        ) : (
          <div className="px-4 py-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              {MAIN_TABS.find(t => t.id === mainTab)?.label}
            </h2>
            {REVISION_CONTENT[mainTab]}
          </div>
        )}
      </div>
    </div>
  )
}
