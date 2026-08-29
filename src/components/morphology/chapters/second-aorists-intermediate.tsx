/* ─────────────────────────────────────────────
   Chapter: 2nd-aorists — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.
───────────────────────────────────────────── */

import {
  Gk, P, SectionHeading,
} from '../shared'

export const SECOND_AORISTS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="second-aorists.h.going-deeper-narrative's">Going deeper: narrative's engine room</SectionHeading>
    <P id="second-aorists.p.narrative-glue-luke">
      <strong>ἐγένετο as narrative glue.</strong> Luke especially loves opening scenes with
      <Gk> καὶ ἐγένετο</Gk> — the King James' "and it came to pass" — a Septuagintalism echoing Hebrew
      narrative style (<Gk>וַיְהִי</Gk>). It rarely needs translating as an event; it is a curtain-raiser.
      Spotting it tunes your ear to Luke's deliberately biblical register.
    </P>
    <P id="second-aorists.p.suppletion-information-when">
      <strong>Suppletion is information.</strong> When one verb's principal parts come from different
      roots (<Gk>λέγω / ἐρῶ / εἶπον</Gk>; <Gk>ὁράω / ὄψομαι / εἶδον</Gk>), each root once was its own
      verb. That is why <Gk>εἶδον</Gk> shares a root with "idea" and "video" (ϝιδ‑, "see") — etymology
      that occasionally illuminates, and always helps memory.
    </P>
    <P id="second-aorists.p.first-second-forms">
      <strong>First and second forms side by side.</strong> Some verbs show both aorists
      (<Gk>ἀπέστειλα / ἀπέστειλον</Gk>), and Koine was slowly regularizing toward 1st-aorist endings
      even on 2nd-aorist stems (<Gk>εἶπαν</Gk> for <Gk>εἶπον</Gk> in many manuscripts). Treat the
      variation as spelling, not meaning.
    </P>
  </>
)
