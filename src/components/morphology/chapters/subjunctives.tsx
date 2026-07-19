import { MorphTable, InfoBox, TableAside, Gk, Ex, gt } from '../shared'

export const SUBJUNCTIVES_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>The subjunctive = "may / might / should." Its flag is the <strong>long vowel</strong> <Gk>ω/η</Gk> where the indicative had <Gk>ο/ε</Gk>.</p>
        <Ex grc="ἵνα λύῃ" en="in order that he may loose" />
      </>}
      intermediate={<>
        <p>The present subjunctive carries <em>imperfective</em> aspect (ongoing) — never past time. It usually follows a "flag word" like <Gk>ἵνα</Gk> or <Gk>ἐάν</Gk>.</p>
      </>}
    >
      <MorphTable flush title={gt("Present Subjunctive — λύω")} headers={['','Pers.','Active','Mid./Pass.']}
        rows={[
          ['SG','1','λύω','λύωμαι'],['','2','λύῃς','λύῃ'],['','3','λύῃ','λύηται'],
          ['PL','1','λύωμεν','λυώμεθα'],['','2','λύητε','λύησθε'],['','3','λύωσιν','λύωνται'],
        ]}
        note="I may (might) be loosing / I may be loosed"
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The aorist subjunctive views the action as a single whole — but it is <em>not</em> past (no augment).</p>
        <Ex grc="ἐὰν λύσῃ" en="if he looses" />
      </>}
      intermediate={<>
        <p>Aspect only: aorist = perfective (a whole action), present = ongoing. Prohibitions use <Gk>μή</Gk> + aorist subjunctive ("don't ever…"), and <Gk>οὐ μή</Gk> + aorist subjunctive is the strongest "no."</p>
      </>}
    >
      <MorphTable flush title={gt("Aorist Subjunctive — λύω")} headers={['','Pers.','Active','Middle','Passive']}
        rows={[
          ['SG','1','λύσω','λύσωμαι','λυθῶ'],['','2','λύσῃς','λύσῃ','λυθῇς'],['','3','λύσῃ','λύσηται','λυθῇ'],
          ['PL','1','λύσωμεν','λυσώμεθα','λυθῶμεν'],['','2','λύσητε','λύσησθε','λυθῆτε'],['','3','λύσωσιν','λύσωνται','λυθῶσιν'],
        ]}
        note="I may (might) loose / I may be loosed"
      />
    </TableAside>
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
