/* ─────────────────────────────────────────────
   Chapter: parsing — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.
───────────────────────────────────────────── */

import {
  ColsTable, Gk, P, SectionHeading,
} from '../shared'

export const PARSING_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="parsing.h.conventions-will-meet">Conventions you will meet elsewhere</SectionHeading>
    <P id="parsing.p.case-number-gender">
      <strong>Case-number-gender vs gender-number-case.</strong> The order taught here — case first — is
      the standard of the introductory grammars (Mounce, Black, Croy) and of this course. Wallace&rsquo;s{' '}
      <em>Greek Grammar Beyond the Basics</em> and several parsing guides invert it to
      gender-number-case. Both name the same three slots; only the recitation order differs. Use
      case-number-gender in this course, and do not be thrown when a commentary writes
      &ldquo;masculine singular nominative.&rdquo;
    </P>
    <P id="parsing.p.mood-traditional-paradigms">
      <strong>Mood, or not.</strong> Traditional paradigms list the infinitive and participle alongside
      the four moods, which is convenient for parsing and wrong as grammar: neither is a mood, since
      neither makes an assertion. Say &ldquo;participle&rdquo; in the mood slot, but do not conclude
      that it is one.
    </P>
    <P id="parsing.p.ambiguity-normal-answer">
      <strong>Ambiguity is normal, and it is an answer.</strong> A great many forms are formally
      ambiguous, and the honest parse names the options rather than guessing:
    </P>
    <ColsTable id="parsing.ct5" tCols={[1, 2]}
      headers={['Form', 'Formally', 'How the context decides']}
      rows={[
        [<Gk>τέκνα</Gk>, 'nominative or accusative plural neuter', 'Neuter never distinguishes the two — find the verb and ask whether this is doing or being done to.'],
        [<Gk>γράφεται</Gk>, 'present middle or passive indicative 3rd singular', 'Middle and passive are identical outside the aorist and future. Sense, and any agent phrase (ὑπό + genitive), decides.'],
        [<Gk>τῆς φωνῆς</Gk>, 'genitive singular feminine', 'Unambiguous — but whether it is possession, source or objective genitive is syntax, not parsing.'],
        [<Gk>ἀνθρώπου</Gk>, 'genitive singular masculine', 'Compare ἀνθρώπους (accusative plural): one letter apart in sound, a different job entirely.'],
      ]}
      note="Naming both options is a complete parse. Silently picking one is not."
    />
    <P id="parsing.p.last-row-worth">
      That last row is worth dwelling on. Parsing tells you the <em>form</em>; it does not tell you the{' '}
      <em>function</em>. &ldquo;Genitive singular feminine&rdquo; is a parse; &ldquo;genitive of
      source&rdquo; is an exegetical claim that needs an argument. Keeping the two apart is most of what
      separates careful exegesis from proof-texting with a lexicon.
    </P>
  </>
)
