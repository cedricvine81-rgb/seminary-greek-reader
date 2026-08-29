/* ─────────────────────────────────────────────
   Chapter: pronunciation — the INTERMEDIATE page

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

export const PRONUNCIATION_INTERMEDIATE_CONTENT = (
  <>
    <SectionHeading id="pronunciation.h.going-deeper-sound">Going deeper: sound history you can use</SectionHeading>
    <P id="pronunciation.p.itacism-manuscripts-converged">
      <strong>Itacism and the manuscripts.</strong> As <Gk>η, ι, υ, ει, οι</Gk> converged on "ee,"
      scribes taking dictation — or sounding out their exemplar — swapped those spellings freely. Most
      such variants are trivial, but some matter: <Gk>ἡμεῖς/ὑμεῖς</Gk> ("we/you") differ by exactly one
      itacized vowel, and the manuscripts of 1 John 1:4, 2 Cor 3:2, and Jude 5's neighbors split
      accordingly. When your apparatus shows an ε/αι or η/ι variant, think with your ears.
    </P>
    <P id="pronunciation.p.pitch-stress-classical">
      <strong>From pitch to stress.</strong> Classical accents marked musical <em>pitch</em> (the acute
      a rise, the circumflex a rise-and-fall); by the Koine period the system was collapsing into the
      plain stress accent Modern Greek keeps. That is why we can be relaxed about accents while insisting
      on breathings: in the first century the accents were already in flux, but initial /h/ still
      distinguished words.
    </P>
    <P id="pronunciation.p.letters-numbers-greek">
      <strong>The letters as numbers.</strong> Greek had no numerals — letters did the counting
      (α´ = 1, β´ = 2 … ι´ = 10, κ´ = 20), with three obsolete letters kept for the purpose. Hence
      Rev 13:18's "number of the beast," <Gk>χξϛ</Gk> = 600 + 60 + 6 — gematria assumes an alphabet
      that counts.
    </P>
  </>
)
