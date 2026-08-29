/* ─────────────────────────────────────────────
   Chapter: parsing — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.

   Category NAMES below are the standard apparatus of the intermediate grammars (Wallace,
   Black, Porter; behind them Burton and Robertson) used as the shared terminology they
   are. The explanations and English glosses are ours, and every Greek example is quoted
   from the text this app serves (NA1904) and checked by scripts/verify-examples.mjs.
───────────────────────────────────────────── */

import {
  ColsTable, Gk, P, SectionHeading
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const PARSING_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="parsing.h.int-syncretism">Where the forms run together</SectionHeading>
    <P id="parsing.p.int-lead">
      A Greek ending does not always identify one slot. Several endings serve two or three, and no amount of morphology will separate them — the sentence has to. Knowing exactly <em>which</em> forms are ambiguous is what turns parsing from decoding into reading, because it tells you where to stop consulting the paradigm and start consulting the context.
    </P>
    <SectionHeading id="parsing.cg.int-ambiguities">The regular ambiguities</SectionHeading>
    <CatGroup>
      <Cat id="parsing.cat.neuter-nom-acc" name="Neuter nominative and accusative" eg="τὰ δαιμόνια — subject or object?" ex={[{ g: "ἐγὼ ἐν Βεελζεβοὺλ ἐκβάλλω τὰ δαιμόνια", e: "I cast out the demons by Beelzebul", r: "Matt 12:27" }]}><T id="parsing.cat.neuter-nom-acc.d">always identical, singular and plural. Only the verb and word order say whether a neuter noun is doing or being done to</T></Cat>
      <Cat id="parsing.cat.middle-passive" name="Middle and passive" eg="γράφεται — “is written” or “writes for himself”" ex={[{ g: "ἐβαπτίζοντο ἐν τῷ Ἰορδάνῃ ποταμῷ ὑπ’ αὐτοῦ", e: "they were baptised in the river Jordan by him", r: "Matt 3:6" }]}><T id="parsing.cat.middle-passive.d">identical outside the aorist and future. An agent phrase with <G>ὑπό</G> settles it toward passive; otherwise the verb’s own habits decide</T></Cat>
      <Cat id="parsing.cat.first-decl-gen-acc" name="1st-declension genitive singular and accusative plural" eg="τῆς ἡμέρας / τὰς ἡμέρας" ex={[{ g: "ἐγὼ μεθ’ ὑμῶν εἰμι πάσας τὰς ἡμέρας", e: "I am with you all the days", r: "Matt 28:20" }]}><T id="parsing.cat.first-decl-gen-acc.d"><G>-ας</G> serves both in many nouns, and the article usually resolves it — which is one more reason to parse the article first</T></Cat>
      <Cat id="parsing.cat.contract-lookalikes" name="Contract look-alikes" eg="μενῶ (fut.) vs μένω (pres.)" ex={[{ g: "ὁ μένων ἐν ἐμοὶ κἀγὼ ἐν αὐτῷ", e: "the one who remains in me, and I in him", r: "John 15:5" }]}><T id="parsing.cat.contract-lookalikes.d">a liquid future wears the endings of an <G>-έω</G> present, so <G>μενῶ</G> “I will remain” and a present contract differ by accent alone</T></Cat>
    </CatGroup>
    <P id="parsing.p.int-honest">
      <strong>Naming the ambiguity is the answer.</strong> A parse that silently picks one option has not been done; a parse that says “nominative or accusative plural neuter, and the verb decides” has. The habit matters most in exactly the places where a translation has quietly chosen for you.
    </P>
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
