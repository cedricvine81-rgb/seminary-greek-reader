import { MorphTable, TableAside, Gk, Ex } from '../shared'

export const PREPOSITIONS_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>A preposition <strong>governs a case</strong> — the noun after it must be in the case shown. Learn each preposition with its case and gloss.</p>
        <Ex grc="ἐν τῷ οἴκῳ" en="in the house (dative)" />
        <Ex grc="εἰς τὸν οἶκον" en="into the house (accusative)" />
      </>}
      intermediate={<>
        <p>A rough logic underlies the cases: <strong>genitive</strong> = away / source, <strong>dative</strong> = rest / position, <strong>accusative</strong> = motion toward. These same words also fuse onto verbs as prefixes.</p>
      </>}
    >
      <MorphTable flush title="One-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
        rows={[
          ['ἀντί',    '+ genitive',   'instead of, in place of'],
          ['ἀπό',     '+ genitive',   'from, away from'],
          ['ἐκ / ἐξ', '+ genitive',   'out of, from'],
          ['εἰς',     '+ accusative', 'into, to'],
          ['πρός',    '+ accusative', 'to, toward'],
          ['ἐν',      '+ dative',     'in, among'],
          ['σύν',     '+ dative',     'with'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>These take <em>two</em> cases — and the case changes the meaning. Always check the ending of the following noun.</p>
        <Ex grc="διὰ τοῦ ἀγγέλου" en="through the messenger (gen.)" />
        <Ex grc="διὰ τὸν ὄχλον" en="because of the crowd (acc.)" />
      </>}
      intermediate={<>
        <p>The genitive typically keeps the "source / through" sense, the accusative the "toward / because-of" sense — the same gen.-vs-acc. logic you meet everywhere.</p>
      </>}
    >
      <MorphTable flush title="Two-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
        rows={[
          ['διά',  '+ genitive',  'through'],
          ['',     '+ accusative','because of'],
          ['κατά', '+ genitive',  'against, down from'],
          ['',     '+ accusative','according to, along'],
          ['μετά', '+ genitive',  'with'],
          ['',     '+ accusative','after'],
          ['ὑπό',  '+ genitive',  'by (agent)'],
          ['',     '+ accusative','under'],
        ]}
      />
    </TableAside>
    <TableAside
      beginning={<>
        <p>These take <em>three</em> cases — three senses. Let the case of the noun tell you which.</p>
        <Ex grc="ἐπὶ τῆς γῆς" en="on the earth (gen.)" />
        <Ex grc="ἐπὶ τὸ βιβλίον" en="onto the book (acc.)" />
      </>}
      intermediate={<>
        <p>In Koine the edges blur — <Gk>εἰς</Gk> and <Gk>ἐν</Gk> sometimes overlap — so weigh context alongside the case rather than trusting a one-word gloss.</p>
      </>}
    >
      <MorphTable flush title="Three-case Prepositions" headers={['', 'Case', 'Meaning']} firstColIsData
        rows={[
          ['ἐπί',  '+ genitive',  'on, over'],
          ['',     '+ dative',    'on, at'],
          ['',     '+ accusative','on, against'],
          ['παρά', '+ genitive',  'from beside'],
          ['',     '+ dative',    'beside, with'],
          ['',     '+ accusative','alongside'],
          ['περί', '+ genitive',  'about, concerning'],
          ['',     '+ dative',    'around, near'],
          ['',     '+ accusative','around'],
        ]}
      />
    </TableAside>
  </>
)
