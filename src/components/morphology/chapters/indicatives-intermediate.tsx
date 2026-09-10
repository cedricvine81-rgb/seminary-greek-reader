/* ─────────────────────────────────────────────
   Chapter: indicatives — the INTERMEDIATE page

   Assembled the way chapters/nouns-intermediate.tsx was (see its header for the whole
   design): the level stopped being the shared page with blocks hidden and became its own
   document. Everything here MOVED — the LevelOnly-intermediate sections out of the shared
   chapter, and (where the card carried one) the syntax taxonomy promoted from the folded
   Going-deeper card into real sections. Same ids throughout, so the Spanish moved with it.

   The shared page now renders only at Beginning; new Intermediate depth belongs here.
───────────────────────────────────────────── */

import {
  Gk, P, SectionHeading, Term,
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const INDICATIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="indicatives.h.int-aspect">Aspect before time</SectionHeading>
    <P id="indicatives.p.int-aspect-primary">
      Aspect is the primary value of the Greek tense; time is secondary, and the indicative is
      the only mood where tense encodes time at all. The perfective (aorist) presents an action
      as a whole, the imperfective (present, imperfect) presents it as unfolding, and the
      stative (perfect, pluperfect) presents a resulting state. How the <em>forms</em> are built
      — the tense identifiers — stays on the Beginning page; what a tense <em>means</em> in a
      given sentence is the taxonomy below, one category at a time.
    </P>
    <SectionHeading id="indicatives.cg.present-imperfective-ongoing">Present (imperfective — ongoing)</SectionHeading>
    <CatGroup>
            <Cat id="indicatives.cat.progressive"name="Progressive" eg="“she is writing”" ex={[{ g: "κύριε, σῶσον, ἀπολλύμεθα", e: "Lord, save us! We are perishing", r: "Matt 8:25" }, { g: "πάντες ζητοῦσίν σε", e: "everyone is looking for you", r: "Mark 1:37" }]} how={<T id="indicatives.cat.progressive.h">Ask whether English wants “is —ing” at this moment. It is the default present, so name another category only if the context forces you to.</T>}><T id="indicatives.cat.progressive.d">action in progress right now</T></Cat>
            <Cat id="indicatives.cat.iterative"name="Iterative" ex={[{ g: "νηστεύω δὶς τοῦ σαββάτου", e: "I fast twice a week", r: "Luke 18:12" }, { g: "καθ’ ἡμέραν ἀποθνῄσκω", e: "I die daily", r: "1 Cor 15:31" }]} how={<T id="indicatives.cat.iterative.h">The context supplies a frequency — every day, always, whenever. The action is not running now; it recurs.</T>}><T id="indicatives.cat.iterative.d">a repeated / habitual action</T></Cat>
            <Cat id="indicatives.cat.extending-from-past"name="Extending-from-past" ex={[{ g: "τοσαῦτα ἔτη δουλεύω σοι", e: "these many years I have been serving you", r: "Luke 15:29" }, { g: "ἀπ’ ἀρχῆς μετ’ ἐμοῦ ἐστε", e: "you have been with me from the beginning", r: "John 15:27" }]} how={<T id="indicatives.cat.extending-from-past.h">There is an expression of duration — so many years, from the beginning — and the action still continues. English has to use a perfect: “I have been”.</T>}><T id="indicatives.cat.extending-from-past.d">began in the past and continues ("I have been…")</T></Cat>
            <Cat id="indicatives.cat.conative"name="Conative" ex={[{ g: "διὰ ποῖον ἔργον ἐμὲ λιθάζετε;", e: "for which deed are you trying to stone me?", r: "John 10:32" }, { g: "ἐν ὀλίγῳ με πείθεις Χριστιανὸν ποιῆσαι", e: "you are trying to persuade me to become a Christian", r: "Acts 26:28" }]} how={<T id="indicatives.cat.conative.h">The action is not achieved. Insert “is trying to” and see whether the context bears it out — it is often a stoning or a persuading that fails.</T>}><T id="indicatives.cat.conative.d">attempted or about-to-begin action ("is trying to…")</T></Cat>
            <Cat id="indicatives.cat.historical"name="Historical" eg="“Jesus says to them…”" ex={[{ g: "λέγει αὐτῇ Ἰησοῦς", e: "Jesus says to her", r: "John 20:15" }, { g: "ἔρχονται πάλιν εἰς Ἱεροσόλυμα", e: "they come again to Jerusalem", r: "Mark 11:27" }]} how={<T id="indicatives.cat.historical.h">A present-tense verb inside a plainly past narrative, almost always a verb of saying or coming. Mark uses it constantly; translate it as a past.</T>}><T id="indicatives.cat.historical.d">a present-tense verb narrating a past event (vivid)</T></Cat>
            <Cat id="indicatives.cat.futuristic"name="Futuristic" ex={[{ g: "ἔρχομαι πρὸς ὑμᾶς", e: "I am coming to you", r: "John 14:18" }, { g: "μετὰ δύο ἡμέρας τὸ πάσχα γίνεται", e: "after two days the Passover takes place", r: "Matt 26:2" }]} how={<T id="indicatives.cat.futuristic.h">A future time marker stands nearby and the present states the event as settled. That is the point of it: certainty, not timing.</T>}><T id="indicatives.cat.futuristic.d">a present form referring to a certain future event</T></Cat>
    </CatGroup>
    <SectionHeading id="indicatives.cg.imperfect-past-imperfective">Imperfect (past imperfective)</SectionHeading>
    <CatGroup>
            <Cat id="indicatives.cat.progressive-2"name="Progressive" eg="“he was teaching”" ex={[{ g: "ἐδίδασκεν αὐτούς", e: "he was teaching them", r: "Mark 2:13" }, { g: "ἐκάθητο παρὰ τὴν ὁδόν", e: "he was sitting beside the road", r: "Mark 10:46" }]} how={<T id="indicatives.cat.progressive-2.h">The default imperfect — “was —ing”. It supplies narrative background rather than the events that move the story on.</T>}><T id="indicatives.cat.progressive-2.d">ongoing action in past time</T></Cat>
            <Cat id="indicatives.cat.iterative-2"name="Iterative" ex={[{ g: "ἐπορεύοντο οἱ γονεῖς αὐτοῦ κατ’ ἔτος εἰς Ἱερουσαλήμ", e: "every year they went to Jerusalem", r: "Luke 2:41" }, { g: "ἐβαπτίζοντο ἐν τῷ Ἰορδάνῃ ποταμῷ", e: "they were being baptized in the Jordan River", r: "Mark 1:5" }]} how={<T id="indicatives.cat.iterative-2.h">Repetition in past time — “kept on”, “used to”. Look for a plural object or a repeated occasion in the context.</T>}><T id="indicatives.cat.iterative-2.d">a repeated action in the past ("kept on…")</T></Cat>
            <Cat id="indicatives.cat.ingressive-inceptive"name="Ingressive / Inceptive" eg="“he began to speak”" ex={[{ g: "ἀνοίξας τὸ στόμα αὐτοῦ ἐδίδασκεν αὐτούς", e: "he opened his mouth and began to teach them", r: "Matt 5:2" }, { g: "ἐξαλλόμενος ἔστη καὶ περιεπάτει", e: "leaping up, he stood and began to walk", r: "Acts 3:8" }]} how={<T id="indicatives.cat.ingressive-inceptive.h">The verb marks a beginning that the narrative then carries on — “began to”. Common with verbs of speaking once a scene has been set.</T>}><T id="indicatives.cat.ingressive-inceptive.d">focus on the start of the action</T></Cat>
            <Cat id="indicatives.cat.conative-2"name="Conative" ex={[{ g: "ὁ δὲ διεκώλυεν αὐτόν", e: "but John was trying to prevent him", r: "Matt 3:14" }, { g: "ἐκάλουν αὐτὸ Ζαχαρίαν", e: "they were going to name him Zechariah", r: "Luke 1:59" }]} how={<T id="indicatives.cat.conative-2.h">The attempt fails, and the context says so. Set it against the inceptive: inceptive starts and continues, conative starts and does not.</T>}><T id="indicatives.cat.conative-2.d">attempted past action ("was trying to…")</T></Cat>
    </CatGroup>
    <SectionHeading id="indicatives.cg.aorist-perfective-whole">Aorist (perfective — a whole action)</SectionHeading>
    <CatGroup>
            <Cat id="indicatives.cat.constative"name="Constative" ex={[{ g: "τεσσεράκοντα καὶ ἓξ ἔτεσιν οἰκοδομήθη ὁ ναὸς οὗτος", e: "this temple was built in forty-six years", r: "John 2:20" }, { g: "ἐβασίλευσεν ὁ θάνατος ἀπὸ Ἀδάμ", e: "death reigned from Adam", r: "Rom 5:14" }]} how={<T id="indicatives.cat.constative.h">The default aorist. If nothing in the context stresses the beginning or the end, call it constative and move on.</T>}><T id="indicatives.cat.constative.d">the action as a simple whole (the default aorist)</T></Cat>
            <Cat id="indicatives.cat.ingressive"name="Ingressive" eg="“he became rich”" ex={[{ g: "δι’ ὑμᾶς ἐπτώχευσεν πλούσιος ὤν", e: "though he was rich, for your sakes he became poor", r: "2 Cor 8:9" }, { g: "ἐσίγησεν πᾶν τὸ πλῆθος", e: "the whole crowd fell silent", r: "Acts 15:12" }]} how={<T id="indicatives.cat.ingressive.h">The verb is stative in the present — be rich, be silent, know — so the aorist marks entry into that state: “became”.</T>}><T id="indicatives.cat.ingressive.d">stresses entry into a state / action</T></Cat>
            <Cat id="indicatives.cat.culminative"name="Culminative" ex={[{ g: "ἔμαθον αὐτάρκης εἶναι", e: "I have learned to be content", r: "Phil 4:11" }, { g: "ἐνίκησεν ὁ λέων ὁ ἐκ τῆς φυλῆς Ἰούδα", e: "the Lion of the tribe of Judah has conquered", r: "Rev 5:5" }]} how={<T id="indicatives.cat.culminative.h">What the context cares about is the end-point — a task finished, a race run. English often wants a perfect here.</T>}><T id="indicatives.cat.culminative.d">stresses the completed end-point</T></Cat>
            <Cat id="indicatives.cat.gnomic"name="Gnomic" ex={[{ g: "ἐξηράνθη ὁ χόρτος καὶ τὸ ἄνθος ἐξέπεσεν", e: "the grass withers and the flower falls", r: "1 Pet 1:24" }, { g: "ἐδικαιώθη ἡ σοφία ἀπὸ τῶν τέκνων αὐτῆς", e: "wisdom is justified by her children", r: "Luke 7:35" }]} how={<T id="indicatives.cat.gnomic.h">No particular occasion is in view; the statement holds always. Proverbs, parables and illustrations from nature are where it lives.</T>}><T id="indicatives.cat.gnomic.d">a timeless / proverbial truth</T></Cat>
            <Cat id="indicatives.cat.epistolary"name="Epistolary" ex={[{ g: "σπουδαιοτέρως οὖν ἔπεμψα αὐτόν", e: "I am sending him to you", r: "Phil 2:28" }, { g: "ἔγραψά σοι", e: "I am writing to you", r: "Phlm 21" }]} how={<T id="indicatives.cat.epistolary.h">Only in letters, and only where the writer's present is the reader's past. “I wrote” means “I am writing, as you will read it”.</T>}><T id="indicatives.cat.epistolary.d">the writer's "now" written as a past ("I wrote")</T></Cat>
            <Cat id="indicatives.cat.dramatic"name="Dramatic" ex={[{ g: "νῦν ἐδοξάσθη ὁ υἱὸς τοῦ ἀνθρώπου", e: "now the Son of Man is glorified", r: "John 13:31" }, { g: "ἡ θυγάτηρ μου ἄρτι ἐτελεύτησεν", e: "my daughter has just now died", r: "Matt 9:18" }]} how={<T id="indicatives.cat.dramatic.h">A state just arrived at, put in the aorist for vividness. It is rare, and what gives it away is a present-time context around a past-tense form.</T>}><T id="indicatives.cat.dramatic.d">an immediate past, stated for vividness</T></Cat>
    </CatGroup>
    <SectionHeading id="indicatives.cg.perfect-future">Perfect & Future</SectionHeading>
    <CatGroup>
            <Cat id="indicatives.cat.intensive-perfect"name="Intensive Perfect" eg="“it stands finished”" ex={[{ g: "τετέλεσται", e: "it is finished (and stands so)", r: "John 19:30" }, { g: "γέγραπται", e: "it stands written", r: "Matt 4:4" }]} how={<T id="indicatives.cat.intensive-perfect.h">What is being asserted is the present result — “it stands written”. Where an English present translates it well, it is intensive.</T>}><T id="indicatives.cat.intensive-perfect.d">stresses the resulting present state</T></Cat>
            <Cat id="indicatives.cat.extensive-perfect"name="Extensive Perfect" ex={[{ g: "τὸν δρόμον τετέλεκα, τὴν πίστιν τετήρηκα", e: "I have finished the race, I have kept the faith", r: "2 Tim 4:7" }, { g: "ἐγὼ πεπίστευκα ὅτι σὺ εἶ ὁ Χριστός", e: "I have come to believe that you are the Christ", r: "John 11:27" }]} how={<T id="indicatives.cat.extensive-perfect.h">What is being asserted is the past act, with the state taken for granted — “has done”. Where an English perfect is needed, it is extensive.</T>}><T id="indicatives.cat.extensive-perfect.d">stresses the completed past act that produced the state</T></Cat>
            <Cat id="indicatives.cat.predictive-future"name="Predictive Future" eg="“he will come”" ex={[{ g: "αὐτὸς σώσει τὸν λαὸν αὐτοῦ", e: "he will save his people", r: "Matt 1:21" }, { g: "ὁ οὐρανὸς καὶ ἡ γῆ παρελεύσεται", e: "heaven and earth will pass away", r: "Matt 24:35" }]} how={<T id="indicatives.cat.predictive-future.h">The default future — a plain statement about what will happen. Assume it unless the sense is command or question.</T>}><T id="indicatives.cat.predictive-future.d">a plain prediction</T></Cat>
            <Cat id="indicatives.cat.imperatival-future"name="Imperatival Future" ex={[{ g: "ἀγαπήσεις τὸν πλησίον σου", e: "you shall love your neighbor", r: "Matt 22:39" }, { g: "οὐ φονεύσεις", e: "you shall not murder", r: "Matt 5:21" }]} how={<T id="indicatives.cat.imperatival-future.h">A second-person future, usually with <G>οὐ</G>, where the sense is law rather than prediction. The Ten Commandments are the model.</T>}><T id="indicatives.cat.imperatival-future.d">a future used as a command ("you shall not…")</T></Cat>
            <Cat id="indicatives.cat.deliberative-future"name="Deliberative Future" ex={[{ g: "κύριε, πρὸς τίνα ἀπελευσόμεθα;", e: "Lord, to whom shall we go?", r: "John 6:68" }, { g: "πῶς ἔτι ζήσομεν ἐν αὐτῇ;", e: "how shall we still live in it?", r: "Rom 6:2" }]} how={<T id="indicatives.cat.deliberative-future.h">It is a question, and the speaker is asking what ought to be done rather than what will happen. Usually first person.</T>}><T id="indicatives.cat.deliberative-future.d">a real or rhetorical question ("what shall we do?")</T></Cat>
    </CatGroup>
    <SectionHeading id="indicatives.h.going-deeper-tense">Further study: tense as interpretation</SectionHeading>
    <P id="indicatives.p.aspect-over-time">
      <strong>Aspect over time.</strong> In the indicative Greek tense marks both time and
      {' '}<Term t="aspect">aspect</Term>, but aspect is the deeper category: the imperfect paints a process,
      the aorist reports a whole, the perfect asserts a standing result. When Mark writes
      <Gk> ἐδίδασκεν</Gk> ("he was teaching"), he is setting a scene; when he switches to aorists, events
      march. Watching an author alternate imperfect and aorist is watching him direct your attention.
    </P>
    <P id="indicatives.p.historical-present-mark">
      <strong>The historical present.</strong> Mark loves narrating the past in the present tense —
      <Gk> λέγει αὐτῷ</Gk>, "he <em>says</em> to him" — the way an excited storyteller slips into "so then
      he <em>says</em> to me…". Translate as past, but notice the vividness the choice adds.
    </P>
    <P id="indicatives.p.divine-passive-passive">
      <strong>The divine passive.</strong> A passive with no agent stated often implies God as the actor:
      <Gk> ἠγέρθη</Gk>, "he <em>was raised</em>" (Rom 4:25) — raised <em>by God</em>. Jewish reverence for
      the divine name made this a natural idiom, and the NT uses it constantly in promises: "they shall be
      comforted" (Matt 5:4) — by whom? Exactly.
    </P>
    <P id="indicatives.p.caution-tense-choices">
      <strong>A caution.</strong> Tense choices are only exegetically loaded where the author had a live
      choice. Much aorist usage is simply default narration — resist sermons built on "the aorist means
      once-for-all." It does not; it means the author viewed the action as a whole.
    </P>
  </>
)
