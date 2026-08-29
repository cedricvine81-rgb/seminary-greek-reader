/* ─────────────────────────────────────────────
   Chapter: imperatives — the INTERMEDIATE page

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
import { Cat, CatGroup, T, G } from '@/components/vocab/morphology-explanations'

export const IMPERATIVES_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="imperatives.h.int-uses">The uses of the imperative</SectionHeading>
    <CatGroup>
            <Cat id="imperatives.cat.command"name="Command" eg="“Go and make disciples”" ex={[{ g: "πορευθέντες μαθητεύσατε πάντα τὰ ἔθνη", e: "go and make disciples of all nations", r: "Matt 28:19" }, { g: "ἀκολούθει μοι", e: "follow me", r: "Matt 9:9" }]}><T id="imperatives.cat.command.d">a straightforward order, usually superior to inferior</T></Cat>
            <Cat id="imperatives.cat.prohibition"name="Prohibition" eg="“do not fear”" ex={[{ g: "μὴ φοβοῦ, μόνον πίστευε", e: "do not fear, only believe", r: "Mark 5:36" }, { g: "μὴ κρίνετε, ἵνα μὴ κριθῆτε", e: "do not judge, so that you may not be judged", r: "Matt 7:1" }]}><T id="imperatives.cat.prohibition.d"><G>μή</G> + imperative forbids an action</T></Cat>
            <Cat id="imperatives.cat.request-entreaty"name="Request / Entreaty" eg="“give us this day our daily bread”" ex={[{ g: "τὸν ἄρτον ἡμῶν δὸς ἡμῖν σήμερον", e: "give us this day our daily bread", r: "Matt 6:11" }, { g: "κύριε, βοήθει μοι", e: "Lord, help me", r: "Matt 15:25" }]}><T id="imperatives.cat.request-entreaty.d">a polite appeal, often inferior to superior</T></Cat>
            <Cat id="imperatives.cat.permissive"name="Permissive" ex={[{ g: "ὃ ποιεῖς ποίησον τάχιον", e: "what you do, do quickly", r: "John 13:27" }, { g: "εἰ ὁ ἄπιστος χωρίζεται, χωριζέσθω", e: "if the unbeliever separates, let it be so", r: "1 Cor 7:15" }]}><T id="imperatives.cat.permissive.d">allows or tolerates an action ("let him do it")</T></Cat>
            <Cat id="imperatives.cat.conditional"name="Conditional" ex={[{ g: "λύσατε τὸν ναὸν τοῦτον, καὶ ἐγερῶ αὐτόν", e: "destroy this temple, and I will raise it up", r: "John 2:19" }, { g: "ἐγγίσατε τῷ θεῷ, καὶ ἐγγιεῖ ὑμῖν", e: "draw near to God, and he will draw near to you", r: "Jas 4:8" }]}><T id="imperatives.cat.conditional.d">an imperative that states a condition ("do X, and Y will follow")</T></Cat>
    </CatGroup>
    <SectionHeading id="imperatives.h.going-deeper-commands">Going deeper: commands with manners</SectionHeading>
    <P id="imperatives.p.request-just-order">
      <strong>Request, not just order.</strong> Direction of rank matters: an imperative from an inferior
      to a superior is an entreaty. Every petition of the Lord's Prayer is an aorist imperative —
      <Gk> ἁγιασθήτω, ἐλθέτω, γενηθήτω, δός, ἄφες</Gk> — prayer language, not barked orders. Translating
      "give us" as rude misreads the mood's range.
    </P>
    <P id="imperatives.p.permission-toleration-occasionally">
      <strong>Permission and toleration.</strong> Occasionally the imperative concedes rather than
      commands: <Gk>ὁ ἀδικῶν ἀδικησάτω ἔτι</Gk>, "let the evildoer still do evil" (Rev 22:11) — grim
      permission, not encouragement. Context, as ever, assigns the force.
    </P>
  </>
)
