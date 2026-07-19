import { MorphTable, InfoBox, TableAside, Gk, Ex } from '../shared'

export const DEPONENTS_CONTENT = (
  <>
    <TableAside
      sticky
      beginning={<>
        <p>A <strong>deponent</strong> looks middle/passive (ending in <Gk>‒ομαι</Gk>) but means something <em>active</em>. Just translate it actively — the middle/passive form is its only form.</p>
        <Ex grc="ἔρχομαι" en="I come / go" />
        <Ex grc="ἀποκρίνομαι" en="I answer" />
      </>}
      intermediate={<>
        <p>Parse it exactly as a middle/passive (tense, person, number), then use the active gloss. Some are <strong>middle</strong> in the future/aorist, others <strong>passive</strong> (<Gk>ἀποκρίνομαι → ἀπεκρίθην</Gk>).</p>
        <p>Many now argue the Greek <strong>middle voice</strong> genuinely fits these verbs (subject-affectedness) rather than being a defective active — but the practical rule (active meaning) still holds.</p>
      </>}
    >
    <MorphTable
      flush
      title="40 Most Common Deponent Verbs"
      headers={['Pres. (1st sg.)', 'Fut.', 'Aor.', 'Definition']}
      firstColIsData
      rows={[
        ['ἄρχομαι', 'ἄρξομαι', 'ἠρξάμην', 'I begin'],
        ['ἀποκρίνομαι', '—', 'ἀπεκρίθην', 'I answer'],
        ['γίνομαι', 'γενήσομαι', 'ἐγενόμην', 'I become, am, happen'],
        ['δέχομαι', 'δέξομαι', 'ἐδεξάμην', 'I receive, accept'],
        ['δύναμαι', 'δυνήσομαι', 'ἠδυνήθην', 'I am able, can'],
        ['ἔρχομαι', 'ἐλεύσομαι', 'ἦλθον', 'I come, go'],
        ['ἐργάζομαι', 'ἐργάσομαι', 'ἠργασάμην', 'I work, do, accomplish'],
        ['εὐαγγελίζομαι', '—', 'εὐηγγελισάμην', 'I proclaim good news'],
        ['εὔχομαι', 'εὔξομαι', 'ηὐξάμην', 'I pray, wish'],
        ['θαυμάζω', 'θαυμάσομαι', 'ἐθαύμασα', 'I marvel, wonder (semi-dep.)'],
        ['κάθομαι', 'καθήσομαι', '—', 'I sit'],
        ['λογίζομαι', 'λογίσομαι', 'ἐλογισάμην', 'I reckon, consider, count'],
        ['ὁράω / ὄψομαι', 'ὄψομαι', 'εἶδον', 'I see (fut./aor. suppl.)'],
        ['ὀνομάζομαι', '—', 'ὠνομάσθην', 'I am named, called'],
        ['παραγίνομαι', 'παραγενήσομαι', 'παρεγενόμην', 'I arrive, appear'],
        ['πορεύομαι', 'πορεύσομαι', 'ἐπορεύθην', 'I go, travel, journey'],
        ['προσεύχομαι', 'προσεύξομαι', 'προσηυξάμην', 'I pray'],
        ['προσέρχομαι', 'προσελεύσομαι', 'προσῆλθον', 'I come/go to, approach'],
        ['σπένδομαι', '—', 'ἐσπείσθην', 'I am poured out (as offering)'],
        ['συνέρχομαι', 'συνελεύσομαι', 'συνῆλθον', 'I come together, assemble'],
        ['ἀγωνίζομαι', 'ἀγωνίσομαι', 'ἠγωνισάμην', 'I compete, strive, fight'],
        ['ἀνακρίνομαι', '—', 'ἀνεκρίθην', 'I examine, judge'],
        ['ἀντιλέγομαι', '—', 'ἀντελέχθην', 'I contradict, oppose'],
        ['βούλομαι', 'βουλήσομαι', 'ἐβουλήθην', 'I wish, want, will'],
        ['γεύομαι', 'γεύσομαι', 'ἐγευσάμην', 'I taste, experience'],
        ['διαλογίζομαι', '—', 'διελογισάμην', 'I discuss, reason, debate'],
        ['ἐκπορεύομαι', 'ἐκπορεύσομαι', 'ἐξεπορεύθην', 'I go out, come out from'],
        ['ἐπιστρέφω / ‒ομαι', 'ἐπιστρέψω', 'ἐπεστράφην', 'I turn to, return'],
        ['θέλω / βούλομαι', 'θελήσω', 'ἠθέλησα', 'I will, wish, desire (semi-dep.)'],
        ['κατεργάζομαι', '—', 'κατειργασάμην', 'I accomplish, produce, bring about'],
        ['κομίζομαι', 'κομίσομαι', 'ἐκομισάμην', 'I receive, obtain'],
        ['μάχομαι', 'μαχέσομαι', 'ἐμαχεσάμην', 'I fight, quarrel'],
        ['μετανοέω / ‒ομαι', 'μετανοήσω', 'μετενόησα', 'I repent, change my mind'],
        ['μιμέομαι', 'μιμήσομαι', 'ἐμιμησάμην', 'I imitate, follow the example of'],
        ['ὀδύρομαι', '—', 'ὠδυράμην', 'I grieve, lament, mourn'],
        ['παρακαλέομαι', '—', 'παρεκλήθην', 'I comfort, encourage (pass. dep.)'],
        ['παρατίθεμαι', '—', 'παρεθέμην', 'I set before, entrust (mid.)'],
        ['σώζομαι / σώζω', 'σωθήσομαι', 'ἐσώθην', 'I am saved (pass. used as dep.)'],
        ['ὑπάρχω / ‒ομαι', '—', '—', 'I exist, am (by nature)'],
        ['φοβέομαι', 'φοβηθήσομαι', 'ἐφοβήθην', 'I fear, am afraid'],
      ]}
      note="Dash (—) indicates no separate form exists or it is not attested in the NT. Some verbs are semi-deponent (active forms exist in some tenses)."
    />
    </TableAside>
    <InfoBox>
      <p className="font-semibold text-gray-800 mb-1">Parsing Deponents</p>
      <p>When you see a verb with middle/passive endings but an active meaning in your lexicon, you have a deponent.
        Parse as you would any middle or passive form, but translate with the active meaning given in the lexicon.</p>
    </InfoBox>
  </>
)
