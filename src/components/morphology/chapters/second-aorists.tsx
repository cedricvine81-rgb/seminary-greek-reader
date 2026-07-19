import { MorphTable, InfoBox, TableAside, Gk, Ex } from '../shared'

export const SECOND_AORISTS_CONTENT = (
  <>
    <TableAside
      sticky
      beginning={<>
        <p>A <strong>2nd (strong) aorist</strong> is still just a simple past ("I did"), but it forms by <em>changing the stem</em> instead of adding <Gk>σα</Gk>. You memorize these like vocabulary.</p>
        <Ex grc="λαμβάνω → ἔλαβον" en="I take → I took" />
        <p>It uses the imperfect's endings, but with a changed stem — read the row left to right: present → aorist → meaning.</p>
      </>}
      intermediate={<>
        <p>Three clues together identify it: an <strong>augment</strong>, a stem <strong>different from the present</strong>, and <strong>no σα/θη</strong> marker.</p>
        <p>Some are <em>suppletive</em> — they borrow a whole different root (<Gk>λέγω → εἶπον</Gk>, <Gk>ὁράω → εἶδον</Gk>). Learn the aorist stem as part of the verb's principal parts.</p>
      </>}
    >
    <MorphTable
      flush
      title="40 Most Common 2nd Aorist Verbs"
      headers={['Present', '2nd Aorist', 'Definition']}
      firstColIsData
      rows={[
        ['ἄγω', 'ἤγαγον', 'I lead, bring'],
        ['ἁμαρτάνω', 'ἥμαρτον', 'I sin, miss the mark'],
        ['ἀποθνῄσκω', 'ἀπέθανον', 'I die'],
        ['βάλλω', 'ἔβαλον', 'I throw, put'],
        ['γίνομαι', 'ἐγενόμην', 'I become, happen (mid.)'],
        ['γινώσκω', 'ἔγνων', 'I know'],
        ['ἔρχομαι', 'ἦλθον', 'I come, go'],
        ['εὑρίσκω', 'εὗρον', 'I find'],
        ['ἔχω', 'ἔσχον', 'I have, hold'],
        ['λαμβάνω', 'ἔλαβον', 'I take, receive'],
        ['λέγω', 'εἶπον', 'I say, speak'],
        ['ὁράω', 'εἶδον', 'I see'],
        ['πάσχω', 'ἔπαθον', 'I suffer, experience'],
        ['πίνω', 'ἔπιον', 'I drink'],
        ['πίπτω', 'ἔπεσον', 'I fall'],
        ['φεύγω', 'ἔφυγον', 'I flee'],
        ['ἀναβαίνω', 'ἀνέβην', 'I go up, ascend'],
        ['ἀποστέλλω', 'ἀπέστειλα / ἀπέστειλον', 'I send (away)'],
        ['ἄρχω', 'ἦρξα / ἦρξον', 'I rule; (mid.) begin'],
        ['εἰσέρχομαι', 'εἰσῆλθον', 'I enter'],
        ['ἐξέρχομαι', 'ἐξῆλθον', 'I go out'],
        ['καταβαίνω', 'κατέβην', 'I go down, descend'],
        ['κατέρχομαι', 'κατῆλθον', 'I come down'],
        ['κρίνω', 'ἔκρινα / ἔκρινον', 'I judge'],
        ['λείπω', 'ἔλιπον', 'I leave, abandon'],
        ['μανθάνω', 'ἔμαθον', 'I learn'],
        ['προσέρχομαι', 'προσῆλθον', 'I come/go to'],
        ['συνάγω', 'συνήγαγον', 'I gather together'],
        ['τίκτω', 'ἔτεκον', 'I give birth to'],
        ['τρέχω', 'ἔδραμον', 'I run'],
        ['ἀπέρχομαι', 'ἀπῆλθον', 'I go away, depart'],
        ['ἄρχομαι', 'ἠρξάμην', 'I begin (mid.)'],
        ['βαίνω', 'ἔβην', 'I go, walk'],
        ['εἶπον', '(see λέγω)', 'I said (suppletive aorist)'],
        ['κλέπτω', 'ἔκλεψα / ἔκλαπον', 'I steal'],
        ['λανθάνω', 'ἔλαθον', 'I escape notice'],
        ['ὄλλυμι', 'ὤλεσα / ὤλομην', 'I destroy; (mid.) perish'],
        ['πείθω', 'ἔπιθον', 'I persuade'],
        ['πέμπω', 'ἔπεμψα / ἔπεμπον', 'I send'],
        ['φέρω', 'ἤνεγκον', 'I carry, bear, bring'],
      ]}
      note="Some verbs have both 1st and 2nd aorist forms. Where both exist, the more common form is listed."
    />
    </TableAside>
    <InfoBox>
      <p className="font-semibold text-gray-800 mb-1">Parsing a 2nd Aorist</p>
      <p>Look for: (1) augment on the verb, (2) no σα/θη suffix, (3) a different stem from the present.
        Use imperfect endings to identify person and number. Compare the stem to the principal parts of the verb.</p>
    </InfoBox>
  </>
)
