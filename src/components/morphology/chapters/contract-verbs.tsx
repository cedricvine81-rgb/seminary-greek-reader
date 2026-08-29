/* ─────────────────────────────────────────────
   Chapter: Contract Verbs  (-έω, -άω, -όω)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  MorphTable, TableAside, Gk, Ex, AsideLabel, gt,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples, InfoBox,
  DropdownPractice,  Tr,
} from '../shared'
import { ParseFrame } from '../ParseFrame'

export const CONTRACT_VERBS_CONTENT = (
  <>
    {/* The frame every verb parse fills in — same grid on every verb chapter. */}
    <ParseFrame />
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="contract-verbs.h.start-english-don't">Start with English: do not → don't</SectionHeading>
      <P id="contract-verbs.p.when-two-words">
        When two words rub together constantly, English squeezes them: <em>do not → don't</em>,
        <em> I am → I'm</em>. Nothing changes in meaning; the sounds just fuse. Greek does the same thing
        <em> inside</em> certain verbs. If a verb's <Term t="stem">stem</Term> ends in a short vowel —
        <Gk> ε, α,</Gk> or <Gk>ο</Gk> — that vowel collides with the connecting vowel of the ending, and
        the two <strong>contract</strong> into one long sound: <Gk>φιλέ‑ομεν → φιλοῦμεν</Gk>, "we love."
      </P>
      <P id="contract-verbs.p.dictionaries-list-uncontracted">
        Dictionaries list the uncontracted form (<Gk>φιλέω</Gk>) so you can see the stem — but you will
        <em> never</em> meet that spelling in an actual text; it always appears contracted (<Gk>φιλῶ</Gk>).
        These "contract verbs" include some of the most important words in the New Testament:
        <Gk> ἀγαπάω</Gk> "love," <Gk>ποιέω</Gk> "do/make," <Gk>λαλέω</Gk> "speak," <Gk>ζητέω</Gk> "seek,"
        <Gk> πληρόω</Gk> "fulfill."
      </P>
    </LevelOnly>

    {/* ── 2 · The rules ──────────────────────────────────── */}
    <SectionHeading id="contract-verbs.h.contraction-rules">The contraction rules</SectionHeading>
    <LevelOnly level="beginning">
      <P id="contract-verbs.p.each-stem-vowel">
        Each stem-vowel family has its own small rule-set. You don't need to produce these from scratch —
        you need to <em>recognize</em> the results, and the circumflex accent (<Gk>ῶ, εῖ, οῦ, ᾷ</Gk>) that
        contraction usually leaves behind, like a scar marking where two vowels fused.
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="contract-verbs.al.reading-tip">Reading tip</Tr></AsideLabel>
        <p><Tr id="contract-verbs.as.see-present-tense">See a present-tense verb wearing a <strong>circumflex</strong> on its ending (<Gk>ποιεῖ, ἀγαπᾷ, πληροῖ</Gk>)? It's a contract verb. Work back to the dictionary form by asking which family the vowels point to.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="contract-verbs.as.master-shortcuts-like">The master shortcuts: like vowels give the long version (<Gk>ε+ε=ει, ο+ο=ου</Gk>); an <Gk>ο</Gk>-sound anywhere wins (<Gk>→ ου/ω/οι</Gk>); <Gk>α</Gk> before an e-sound gives <Gk>α/ᾳ</Gk>; and a long vowel simply swallows a short one.</Tr></p>
      </>}
    >
      <MorphTable id="contract-verbs.t1" tCols={[2]} flush title="The three families" headers={['Family', 'Example', 'Key results']} firstColIsData
        rows={[
          ['-έω', 'ποιέω “do”', 'ε+ε=ει · ε+ο=ου · ε + long vowel = (swallowed)'],
          ['-άω', 'ἀγαπάω “love”', 'α+ε/η=α(ᾳ) · α+ο/ου/ω=ω'],
          ['-όω', 'πληρόω “fulfill”', 'ο+ε/ο/ου=ου · ο+η/ω=ω · ο+ῃ/ει=οι'],
        ]}
      />
    </TableAside>
    <LevelOnly level="beginning">
      <P id="contract-verbs.p.here-all-three">Here are all three families across the present active — compare column by column with <Gk>λύω</Gk>:</P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="contract-verbs.al.default-translations">Default translations</Tr></AsideLabel>
        <Ex grc="ποιῶ" en={<Tr id="contract-verbs.ex.make">I do / make</Tr>} />
        <Ex grc="ἀγαπῶμεν" en={<Tr id="contract-verbs.ex.love">we love</Tr>} />
        <Ex grc="πληροῖ" en={<Tr id="contract-verbs.ex.fulfills">he fulfills</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="contract-verbs.as.giveaway-where-all">-άω's giveaway is <Gk>ᾳ</Gk> where -έω has <Gk>ει</Gk> (<Gk>ἀγαπᾷ</Gk> vs. <Gk>ποιεῖ</Gk>); -όω's is <Gk>οι</Gk> (<Gk>πληροῖ</Gk>). The 1st sg. and pl. of all three converge on <Gk>ῶ / ‑οῦμεν/‑ῶμεν</Gk>.</Tr></p>
      </>}
    >
      <MorphTable id="contract-verbs.t2" flush title="Present Active Indicative — the three families" headers={['','Pers.','ποιέω','ἀγαπάω','πληρόω']}
        rows={[
          ['Sg.','1.','ποιῶ','ἀγαπῶ','πληρῶ'],
          ['','2.','ποιεῖς','ἀγαπᾷς','πληροῖς'],
          ['','3.','ποιεῖ','ἀγαπᾷ','πληροῖ'],
          ['Pl.','1.','ποιοῦμεν','ἀγαπῶμεν','πληροῦμεν'],
          ['','2.','ποιεῖτε','ἀγαπᾶτε','πληροῦτε'],
          ['','3.','ποιοῦσι(ν)','ἀγαπῶσι(ν)','πληροῦσι(ν)'],
        ]}
      />
    </TableAside>

    {/* ── 3 · Outside the present ────────────────────────── */}
    <DropdownPractice id="contract-verbs.d1"
      title="Practice — do the contraction"
      intro={<Tr id="contract-verbs.intro.merge-stem-vowel">Merge the stem vowel with the ending vowel.</Tr>}
      options={["φιλῶ", "φιλεῖτε", "ἀγαπῶμεν", "πληροῖ", "φιλοῦσιν", "ἀγαπᾷς"]}
      items={[
        { q: <span className="normal-case">φιλέ-ω →</span>, answer: "φιλῶ" },
        { q: <span className="normal-case">φιλέ-ετε →</span>, answer: "φιλεῖτε" },
        { q: <span className="normal-case">ἀγαπά-ομεν →</span>, answer: "ἀγαπῶμεν" },
        { q: <span className="normal-case">πληρό-ει →</span>, answer: "πληροῖ" },
        { q: <span className="normal-case">φιλέ-ουσιν →</span>, answer: "φιλοῦσιν" },
        { q: <span className="normal-case">ἀγαπά-εις →</span>, answer: "ἀγαπᾷς" },
      ]}
    />

    <SectionHeading id="contract-verbs.h.outside-present-vowel">Outside the present: the vowel grows up</SectionHeading>
    <P id="contract-verbs.p.contraction-only-happens">
      Contraction only happens where stem-vowel meets connecting vowel — the present and imperfect. In
      every other tense, the stem vowel simply <strong>lengthens</strong> before the tense marker
      (<Gk>ε→η, α→η, ο→ω</Gk>), and the verb behaves exactly like <Gk>λύω</Gk>:
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ποιέω → ποιήσω, ἐποίησα" en={<Tr id="contract-verbs.ex.will-did">I will do, I did</Tr>} />
        <Ex grc="ἀγαπάω → ἠγάπησα" en={<Tr id="contract-verbs.ex.loved">I loved</Tr>} />
        <Ex grc="πληρόω → πεπλήρωκα" en={<Tr id="contract-verbs.ex.fulfilled">I have fulfilled</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="contract-verbs.as.contract-verb-only">So a contract verb is only "hard" in two tenses. Meet <Gk>ἠγάπησεν</Gk> (John 3:16) and it parses like any 1st aorist: augment + lengthened stem + σ + ending.</Tr></p>
      </>}
    >
      <MorphTable id="contract-verbs.t3" tCols={[0, 2]} flush title="The lengthening rule — ποιέω" headers={['Tense', 'Form', 'What happened']} firstColIsData
        rows={[
          ['Present', 'ποιῶ', 'contraction'],
          ['Imperfect', 'ἐποίουν', 'contraction (+ augment)'],
          ['Future', 'ποιήσω', 'ε → η + σ'],
          ['Aorist', 'ἐποίησα', 'ε → η + σα'],
          ['Perfect', 'πεποίηκα', 'ε → η + κα'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Watch out ──────────────────────────────────── */}
    <DropdownPractice id="contract-verbs.d2"
      title="Practice — the grown-up vowel"
      intro={<Tr id="contract-verbs.intro.outside-present-stem">Outside the present the stem vowel lengthens before the identifier.</Tr>}
      options={["φιλέω — future (ε → η)", "ἀγαπάω — aorist (α → η)", "πληρόω — perfect (ο → ω)", "λαλέω — aorist (ε → η)", "ζητέω — future (ε → η)", "ποιέω — aorist (ε → η)"]}
      items={[
        { q: <span className="normal-case">φιλήσω</span>, answer: "φιλέω — future (ε → η)" },
        { q: <span className="normal-case">ἠγάπησεν</span>, answer: "ἀγαπάω — aorist (α → η)" },
        { q: <span className="normal-case">πεπλήρωκεν</span>, answer: "πληρόω — perfect (ο → ω)" },
        { q: <span className="normal-case">ἐλάλησα</span>, answer: "λαλέω — aorist (ε → η)" },
        { q: <span className="normal-case">ζητήσετε</span>, answer: "ζητέω — future (ε → η)" },
        { q: <span className="normal-case">ἐποίησεν</span>, answer: "ποιέω — aorist (ε → η)" },
      ]}
    />

    <SectionHeading id="contract-verbs.h.watch-out">Watch out</SectionHeading>
    <InfoBox>
      <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
        <li><Tr id="contract-verbs.wo.does-middle-infinitive"><Gk>ποιεῖ</Gk> is 3rd sg. ("he does") <em>and</em> the 2nd sg. middle; <Gk>ποιεῖν</Gk> is the infinitive — small differences, big meaning shifts.</Tr></li>
        <li><Tr id="contract-verbs.wo.live-contracts-irregularly"><Gk>ζάω</Gk> "live" contracts irregularly with η: <Gk>ζῇς, ζῇ, ζῆν</Gk>.</Tr></li>
        <li><Tr id="contract-verbs.wo.refuses-lengthen-future"><Gk>καλέω</Gk> refuses to lengthen: future <Gk>καλέσω</Gk>, aorist <Gk>ἐκάλεσα</Gk> — a famous exception.</Tr></li>
        <li><Tr id="contract-verbs.wo.liquid-futures-look">Liquid futures <em>look</em> like -έω presents (<Gk>μενῶ</Gk> "I will remain" vs. present <Gk>μένω</Gk>) — see the Liquid Verbs chapter; the accent is the clue.</Tr></li>
        <li><Tr id="contract-verbs.wo.imperfects-contract-verbs">Imperfects of contract verbs contract too: <Gk>ἐποίει</Gk> "he was doing," <Gk>ἠγάπα</Gk> "he loved (was loving)."</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 5 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="contract-verbs.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="contract-verbs.pr1"
      title="Practice — parse and translate"
      intro={<Tr id="contract-verbs.intro.name-family-then">Name the family (-έω / -άω / -όω), then the form.</Tr>}
      items={[
        { q: <span className="normal-case">λαλεῖ τῷ ὄχλῳ.</span>,
          a: <Tr id="contract-verbs.pa.speaks-crowd-present">"He speaks to the crowd" — λαλέω, present 3rd sg. (ε+ει=ει).</Tr>},
        { q: <span className="normal-case">ἀγαπᾷς με;</span>,
          a: <Tr id="contract-verbs.pa.love-present-john">"Do you love me?" — ἀγαπάω, present 2nd sg. (John 21:15's question).</Tr>},
        { q: <span className="normal-case">ζητοῦμεν τὴν βασιλείαν.</span>,
          a: <Tr id="contract-verbs.pa.seek-kingdom-present">"We seek the kingdom" — ζητέω, present 1st pl. (ε+ο=ου).</Tr>},
        { q: <span className="normal-case">ἠγάπησεν ὁ θεὸς τὸν κόσμον.</span>,
          a: <Tr id="contract-verbs.pa.god-loved-world">"God loved the world" — aorist of ἀγαπάω: augment + α→η + σα (John 3:16).</Tr>},
        { q: <span className="normal-case">ἵνα πληρωθῇ τὸ ῥηθέν.</span>,
          a: <Tr id="contract-verbs.pa.what-was-spoken">"That what was spoken might be fulfilled" — aorist passive subjunctive of πληρόω (ο→ω), Matthew's formula.</Tr>},
      ]}
    />

    {/* ── 6 · See it in the NT ───────────────────────────── */}
    <Practice id="contract-verbs.pr2"
      title="From class — parse the αω/οω forms (Lesson 9)"
      intro={<Tr id="contract-verbs.intro.parse-drill-classroom">The parse drill from the classroom deck. Say the full parsing out loud before revealing.</Tr>}
      items={[
        { q: <span className="normal-case">ἀγαπᾶται</span>, a: <Tr id="contract-verbs.pa.pres-mid-pass">Pres Mid/Pass Ind 3 Sg — ἀγαπάω, &ldquo;he/she is loved&rdquo;</Tr>},
        { q: <span className="normal-case">δεδικαιωμένος</span>, a: <Tr id="contract-verbs.pa.perf-mid-pass">Perf Mid/Pass Ptcp Nom Sg Masc — δικαιόω, &ldquo;having been justified&rdquo; (Luke 18:14)</Tr>},
        { q: <span className="normal-case">ἐρωτῶ</span>, a: <Tr id="contract-verbs.pa.pres-act-ind">Pres Act Ind 1 Sg — ἐρωτάω, &ldquo;I ask&rdquo;</Tr>},
        { q: <span className="normal-case">ἐπλήρουν</span>, a: <Tr id="contract-verbs.pa.impf-act-ind">Impf Act Ind 3 Pl <em>or</em> 1 Sg — πληρόω, &ldquo;they were / I was fulfilling&rdquo;</Tr>},
        { q: <span className="normal-case">ἀγαπήσεις</span>, a: <Tr id="contract-verbs.pa.fut-act-ind">Fut Act Ind 2 Sg — ἀγαπάω, &ldquo;you will love&rdquo; (Matt 22:39)</Tr>},
        { q: <span className="normal-case">ζῆν</span>, a: <Tr id="contract-verbs.pa.pres-act-infinitive">Pres Act Infinitive — ζάω, &ldquo;to live&rdquo;</Tr>},
        { q: <span className="normal-case">δικαιοῦται</span>, a: <Tr id="contract-verbs.pa.pres-mid-pass-2">Pres Mid/Pass Ind 3 Sg — δικαιόω, &ldquo;he/she is justified&rdquo;</Tr>},
        { q: <span className="normal-case">διψᾷ</span>, a: <Tr id="contract-verbs.pa.pres-act-ind-2">Pres Act Ind 3 Sg — διψάω, &ldquo;he/she thirsts&rdquo; (John 4)</Tr>},
      ]}
    />

    <LiveExamples
      intro={<Tr id="contract-verbs.intro.contract-verbs-carry">Contract verbs carry the NT's biggest themes — love, doing, speaking, fulfilling.</Tr>}
      links={[
        { label: <Tr id="contract-verbs.le.every-form-love">Every form of <span className="normal-case">ἀγαπάω</span> — the love verb</Tr>, lemma: 'ἀγαπάω' },
        { label: <Tr id="contract-verbs.le.every-form-make">Every form of <span className="normal-case">ποιέω</span> — do / make</Tr>, lemma: 'ποιέω' },
        { label: <Tr id="contract-verbs.le.every-form-speak">Every form of <span className="normal-case">λαλέω</span> — speak</Tr>, lemma: 'λαλέω' },
        { label: <Tr id="contract-verbs.le.every-form-fulfill">Every form of <span className="normal-case">πληρόω</span> — fulfill</Tr>, lemma: 'πληρόω' },
      ]}
    />

    {/* ── 7 · Going deeper (Intermediate only) ───────────── */}
  </>
)
