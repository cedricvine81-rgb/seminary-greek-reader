import { MorphTable, InfoBox, TableAside, Gk, Ex, gt } from '../shared'

export const INFINITIVES_CONTENT = (
  <>
    <TableAside
      beginning={<>
        <p>The infinitive is the "to ‒" form. It has no person or number, so it never changes for "I / you / he."</p>
        <Ex grc="θέλω λύειν" en="I want to loose" />
        <Ex grc="λύσαι" en="to loose (aorist — σ, but no augment)" />
      </>}
      intermediate={<>
        <p>It's a <strong>verbal noun</strong>: it can take an article (<Gk>τό</Gk>) and even an accusative subject (<Gk>θέλω τὸν ἄγγελον ἀπελθεῖν</Gk> "I want the messenger to depart"). Present vs. aorist = aspect, not time.</p>
      </>}
    >
      <MorphTable flush title={gt("Most Common Infinitive Forms — λύω")} headers={['','Present Active','Aorist Active']}
        rows={[['Infinitive','λύειν','λύσαι']]}
      />
    </TableAside>
    <InfoBox title="Notes">
      <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
        <li>The infinitive is translated as "to…"</li>
        <li>The Aorist infinitive has a σ suffix, but <em>no augment</em></li>
        <li>‒εω verbs follow normal rules: φιλεῖν, φιλῆσαι</li>
      </ul>
    </InfoBox>
  </>
)
