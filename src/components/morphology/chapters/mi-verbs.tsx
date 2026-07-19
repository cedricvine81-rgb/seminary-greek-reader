import { MorphTable, InfoBox, TableAside, Gk, Ex, AsideLabel, gt } from '../shared'

export const MI_VERBS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <AsideLabel>Meanings</AsideLabel>
        <Ex grc="δίδωμι" en="I give" />
        <Ex grc="τίθημι" en="I put / place" />
        <Ex grc="ἵστημι" en="I stand / set" />
      </>}
      intermediate={<>
        <p>Each has <strong>two stems</strong>: the reduplicated <em>present</em> stem (longer) for present + imperfect, and the shorter <em>verb</em> stem for future, aorist + perfect.</p>
      </>}
    >
      <MorphTable flush title={gt("‒μι Verb Stems")} headers={['-μι verb','Verb stem','Present stem']}
        rows={[
          ['δίδωμι','δο / δω','διδο / διδω'],
          ['τίθημι','θε / θη','τιθε / τιθη'],
          ['ἵστημι','στα / στη','ἱστα / ἱστη'],
        ]}
        note="The reduplicated present stem is lengthened in the singular (διδο → διδω, τιθε → τιθη, ἱστα → ἱστη)."
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>The iota reduplication (<Gk>δι‒, τι‒, ἱ‒</Gk>) marks the present. See it → the verb is present or imperfect.</p>
        <Ex grc="δίδωμί σοι" en="I give to you" />
      </>}
      intermediate={<>
        <p>Endings attach directly to the long stem (no connecting vowel), which is why the singular looks so different from <Gk>‒ω</Gk> verbs; the plural shortens the stem again.</p>
      </>}
    >
      <MorphTable flush title="Present Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
        rows={[
          ['Sg.','1.','δίδωμι','τίθημι','ἵστημι'],
          ['','2.','δίδως','τίθης','ἵστης'],
          ['','3.','δίδωσι(ν)','τίθησι(ν)','ἵστησι(ν)'],
          ['Pl.','1.','δίδομεν','τίθεμεν','ἵσταμεν'],
          ['','2.','δίδοτε','τίθετε','ἵστατε'],
          ['','3.','διδόασι(ν)','τιθέασι(ν)','ἱστᾶσι(ν)'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>No iota here — the aorist drops the reduplication and takes a <Gk>‒κα</Gk> marker (not <Gk>‒σα</Gk>).</p>
        <Ex grc="ἔδωκα" en="I gave" />
        <Ex grc="ἔθηκα" en="I put" />
      </>}
      intermediate={<>
        <p>The <Gk>‒κα</Gk> aorist can look like a perfect — tell them apart by reduplication (perfect) and context. <Gk>ἵστημι</Gk> keeps its <Gk>‒σα</Gk> (<Gk>ἔστησα</Gk>) and is transitive here ("I set up").</p>
      </>}
    >
      <MorphTable flush title="Aorist Active Indicative" headers={['','Pers.','δίδωμι','τίθημι','ἵστημι']}
        rows={[
          ['Sg.','1.','ἔδωκα','ἔθηκα','ἔστησα'],
          ['','2.','ἔδωκας','ἔθηκας','ἔστησας'],
          ['','3.','ἔδωκε(ν)','ἔθηκε(ν)','ἔστησε(ν)'],
          ['Pl.','1.','ἐδώκαμεν','ἐθήκαμεν','ἐστήσαμεν'],
          ['','2.','ἐδώκατε','ἐθήκατε','ἐστήσατε'],
          ['','3.','ἔδωκαν','ἔθηκαν','ἔστησαν'],
        ]}
      />
    </TableAside>
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
