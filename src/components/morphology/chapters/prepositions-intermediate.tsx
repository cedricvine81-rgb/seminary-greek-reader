/* ─────────────────────────────────────────────
   Chapter: prepositions — the INTERMEDIATE page

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
  Gk, P, SectionHeading
} from '../shared'
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const PREPOSITIONS_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="prepositions.h.int-case-decides">The case decides the meaning</SectionHeading>
    <P id="prepositions.p.int-case-lead">
      A lexicon entry for a Greek preposition is not one meaning but a small map, and the case of the noun that follows is what selects the region. Eight prepositions govern more than one case, and for those the case is not agreement — it is <em>information</em>. Read past the preposition to the ending before you translate.
    </P>
    <SectionHeading id="prepositions.cg.int-two-case">Prepositions that take two cases</SectionHeading>
    <CatGroup>
      <Cat id="prepositions.cat.dia" name="διά" eg="gen. “through” · acc. “because of”" ex={[{ g: "πάντα δι’ αὐτοῦ ἐγένετο", e: "all things were made through him", r: "John 1:3" }, { g: "διὰ τοῦτό με ὁ πατὴρ ἀγαπᾷ", e: "for this reason the Father loves me", r: "John 10:17" }]}><T id="prepositions.cat.dia.d">with the genitive, motion or agency <em>through</em>; with the accusative, the reason <em>because of</em> which</T></Cat>
      <Cat id="prepositions.cat.kata" name="κατά" eg="gen. “against” · acc. “according to”" ex={[{ g: "ὁ μὴ ὢν μετ’ ἐμοῦ κατ’ ἐμοῦ ἐστιν", e: "whoever is not with me is against me", r: "Matt 12:30" }, { g: "κατὰ τὰς γραφάς", e: "according to the Scriptures", r: "1 Cor 15:3" }]}><T id="prepositions.cat.kata.d">with the genitive, <em>down from</em> or <em>against</em>; with the accusative, <em>according to</em> — the standard by which something is measured</T></Cat>
      <Cat id="prepositions.cat.meta" name="μετά" eg="gen. “with” · acc. “after”" ex={[{ g: "ἐγὼ μεθ’ ὑμῶν εἰμι πάσας τὰς ἡμέρας", e: "I am with you all the days", r: "Matt 28:20" }, { g: "μετὰ τρεῖς ἡμέρας ἀναστήσεται", e: "after three days he will rise", r: "Mark 10:34" }]}><T id="prepositions.cat.meta.d">with the genitive, accompaniment — <em>with</em>; with the accusative, sequence — <em>after</em></T></Cat>
      <Cat id="prepositions.cat.hyper" name="ὑπέρ" eg="gen. “for, on behalf of” · acc. “above”" ex={[{ g: "Χριστὸς ἀπέθανεν ὑπὲρ τῶν ἁμαρτιῶν ἡμῶν", e: "Christ died for our sins", r: "1 Cor 15:3" }, { g: "οὐκ ἔστιν μαθητὴς ὑπὲρ τὸν διδάσκαλον", e: "a disciple is not above his teacher", r: "Matt 10:24" }]}><T id="prepositions.cat.hyper.d">with the genitive, <em>on behalf of</em> — the great substitution preposition; with the accusative, spatial or comparative <em>above, beyond</em></T></Cat>
      <Cat id="prepositions.cat.hypo" name="ὑπό" eg="gen. “by (agent)” · acc. “under”" ex={[{ g: "ἐβαπτίζοντο ἐν τῷ Ἰορδάνῃ ποταμῷ ὑπ’ αὐτοῦ", e: "they were baptised in the river Jordan by him", r: "Matt 3:6" }, { g: "ἵνα μου ὑπὸ τὴν στέγην εἰσέλθῃς", e: "that you should come under my roof", r: "Matt 8:8" }]}><T id="prepositions.cat.hypo.d">with the genitive, the personal agent <em>by</em> whom a passive verb acts; with the accusative, position <em>under</em></T></Cat>
    </CatGroup>
    <SectionHeading id="prepositions.cg.int-three-case">Prepositions that take three</SectionHeading>
    <CatGroup>
      <Cat id="prepositions.cat.epi" name="ἐπί" eg="gen./dat./acc. “on, at, to”" ex={[{ g: "ἐξουσίαν ἔχει ὁ υἱὸς τοῦ ἀνθρώπου ἐπὶ τῆς γῆς", e: "the Son of Man has authority on earth", r: "Mark 2:10" }, { g: "οὐκ ἐπ’ ἄρτῳ μόνῳ ζήσεται ὁ ἄνθρωπος", e: "man shall not live on bread alone", r: "Matt 4:4" }]}><T id="prepositions.cat.epi.d">the widest range of all — <em>on, over, at, against, in the time of</em>. Genitive tends to contact or period, dative to basis or occasion, accusative to motion onto or extent</T></Cat>
      <Cat id="prepositions.cat.para" name="παρά" eg="gen. “from” · dat. “with” · acc. “alongside”" ex={[{ g: "παρὰ ἀνθρώποις τοῦτο ἀδύνατόν ἐστιν", e: "with men this is impossible", r: "Matt 19:26" }, { g: "περιπατῶν παρὰ τὴν θάλασσαν", e: "walking beside the sea", r: "Matt 4:18" }]}><T id="prepositions.cat.para.d">with the genitive, <em>from beside</em> (a source, usually personal); with the dative, <em>beside, in the presence of</em>; with the accusative, motion <em>to the side of</em>, or comparison</T></Cat>
      <Cat id="prepositions.cat.peri" name="περί" eg="gen. “concerning” · acc. “around”" ex={[{ g: "ἦλθεν ἵνα μαρτυρήσῃ περὶ τοῦ φωτός", e: "he came to bear witness concerning the light", r: "John 1:7" }, { g: "περὶ δὲ τὴν ἑνδεκάτην ἐξελθὼν", e: "and going out about the eleventh hour", r: "Matt 20:6" }]}><T id="prepositions.cat.peri.d">with the genitive, the topic — <em>concerning, about</em>; with the accusative, the circle — <em>around</em></T></Cat>
    </CatGroup>
    <P id="prepositions.p.int-caution">
      <strong>Two cautions.</strong> First, the case is decisive but the <em>region</em> is broad: <Gk>ἐπί</Gk> with the genitive can be place, time or authority, and only the sentence picks. Second, a preposition compounded onto a verb does not always keep its own force — Koine freely uses compounds as near-synonyms of the simple verb, so <Gk>ἐπιγινώσκω</Gk> may or may not mean “know <em>fully</em>.” Check the author’s usage before building an argument on a prefix.
    </P>
    <P id="prepositions.p.two-refinements-first">
      Two refinements. First, remember from the verb chapter that compounds take their augment
      <em>after</em> the preposition (<Gk>ἐξέβαλον</Gk>, "they cast out"). Second, compounding can
      intensify rather than redirect (<Gk>γινώσκω</Gk> "know" → <Gk>ἐπιγινώσκω</Gk> "know fully") —
      though in Koine some compounds have faded to near-synonyms of the simple verb; check usage before
      building an argument on the prefix.
    </P>
    <SectionHeading id="prepositions.h.going-deeper-theology">Going deeper: theology in small words</SectionHeading>
    <P id="prepositions.p.paul's-signature-phrase">
      <strong>ἐν Χριστῷ.</strong> Paul's signature phrase — "in Christ," some 80+ times with its variants —
      rides on the dative of sphere: believers live and act <em>within the realm defined by</em> Christ.
      No English preposition quite reproduces it, which is why translations wobble between "in," "united
      to," and "through." The grammar is the theology here.
    </P>
    <P id="prepositions.p.chains-agency-greek">
      <strong>Chains of agency.</strong> Greek can distinguish the ultimate agent (<Gk>ὑπό</Gk> + gen.)
      from the intermediate one (<Gk>διά</Gk> + gen.): "what was spoken <Gk>ὑπὸ κυρίου διὰ τοῦ
      προφήτου</Gk>" — <em>by</em> the Lord <em>through</em> the prophet (Matt 1:22). One verse, a whole
      doctrine of inspiration in two prepositions.
    </P>
    <P id="prepositions.p.don't-over-press">
      <strong>Don't over-press εἰς.</strong> In classical Greek <Gk>εἰς</Gk> (motion) and
      <Gk> ἐν</Gk> (rest) were kept apart; in Koine they had begun to blur, and Mark can write
      <Gk> εἰς</Gk> where John writes <Gk>ἐν</Gk> with no difference intended. Arguments that lean hard on
      "εἰς must mean <em>into</em>" (e.g., in baptism texts) need corroboration from context, not just the
      lexicon.
    </P>
  </>
)
