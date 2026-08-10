/* ─────────────────────────────────────────────
   Chapter: Conjunctions & Adverbs
   (after David Alan Black, It's Still Greek to Me, 1998)

   Textbook chapter (see chapters/nouns.tsx for the template).
───────────────────────────────────────────── */

import {
  ColsTable, InfoBox, TableAside, Gk, Ex,
  P, SectionHeading, LevelOnly, Term, Practice, LiveExamples,
  DropdownPractice,  Tr,
} from '../shared'

export const CONJ_ADV_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="conj-adv.h.start-english-road">Start with English: the road signs of a text</SectionHeading>
      <P id="conj-adv.p.strip-paragraph-little">
        Strip a paragraph of its little connecting words — <em>and, but, therefore, because, however</em> —
        and the facts survive but the <em>logic</em> vanishes: you can no longer tell what follows from
        what, what contrasts with what, what explains what. Those little words are the road signs of
        thought, and reading well means watching them.
      </P>
      <P id="conj-adv.p.greek-unusually-generous">
        Greek is unusually generous with road signs. Nearly every sentence begins with a connective, and
        because Greek word order is free, these signs — <strong>conjunctions</strong> — carry even more of
        the logical load than in English. This chapter is your sign-catalogue: conjunctions that join
        equals, conjunctions that subordinate, and the <strong>adverbs</strong> (how? when? where? words)
        that fill out a verb's circumstances.
      </P>
    </LevelOnly>

    <InfoBox title="Key terms">
      <ul className="space-y-1.5 list-disc list-inside">
        <li><Tr id="conj-adv.wo.phrase-group-words"><strong>Phrase</strong> — a group of words that cannot stand alone as a sentence because it lacks a subject, a predicate, or both.</Tr></li>
        <li><Tr id="conj-adv.wo.clause-group-words"><strong>Clause</strong> — a group of words forming part of a sentence that contains a subject and a predicate.</Tr></li>
        <li><Tr id="conj-adv.wo.independent-main-clause"><strong>Independent (main) clause</strong> — makes sense standing alone; usually begins with a <em>coordinating conjunction</em>.</Tr></li>
        <li><Tr id="conj-adv.wo.dependent-subordinate-clause"><strong>Dependent (subordinate) clause</strong> — cannot stand alone; it functions like an adjective, adverb, or noun and begins with a <em>subordinate conjunction</em>.</Tr></li>
      </ul>
    </InfoBox>

    {/* ── 2 · Coordinating ───────────────────────────────── */}
    <SectionHeading id="conj-adv.h.joining-equals-coordinating">Joining equals: the coordinating conjunctions</SectionHeading>
    <P id="conj-adv.p.these-link-clause">
      These link clause to clause on the level — and, but, or, therefore, for. The frequency counts are
      worth a glance: <Gk>καί</Gk> alone occurs over nine thousand times, and the four giants
      (<Gk>καί, δέ, γάρ, οὖν</Gk>) steer almost every NT paragraph.
    </P>
    <ColsTable id="conj-adv.ct1" tCols={[0, 1]}
      title="Independent clauses — coordinating conjunctions"
      headers={['Function', 'Conjunctions']}
      rows={[
        ['Continuation / connective', 'καί (9,158×), δέ (2,792×), τέ (215×) — “and”'],
        ['Adversative / contrastive', 'ἀλλά (638×), δέ (2,792×) — “but”; πλήν (27×) — “however”'],
        ['Correlative', 'μέν … δέ, καί … καί — “on the one hand … on the other”'],
        ['Disjunctive', 'ἤ (343×), εἴτε (65×) — “or”, “whether”'],
        ['Inferential', 'οὖν (499×), διό (53×), ἄρα (53×) — “therefore”'],
        ['Explanatory / causal', 'γάρ (1,041×), διό (53×) — “for”, “for this reason”'],
        ['Negative', 'οὐδέ (143×), οὔτε (87×), μηδέ (56×) — “and not”'],
      ]}
    />

    {/* ── 3 · Subordinating ──────────────────────────────── */}
    <DropdownPractice id="conj-adv.d1"
      title="Practice — the coordinators"
      options={["and / also / even", "but / and (mild turn)", "but (strong contrast)", "for (gives the reason)", "therefore", "or"]}
      items={[
        { q: <span className="normal-case">καί</span>, answer: "and / also / even" },
        { q: <span className="normal-case">δέ</span>, answer: "but / and (mild turn)" },
        { q: <span className="normal-case">ἀλλά</span>, answer: "but (strong contrast)" },
        { q: <span className="normal-case">γάρ</span>, answer: "for (gives the reason)" },
        { q: <span className="normal-case">οὖν</span>, answer: "therefore" },
        { q: <span className="normal-case">ἤ</span>, answer: "or" },
      ]}
    />

    <SectionHeading id="conj-adv.h.joining-unequals-subordinate">Joining unequals: the subordinate conjunctions</SectionHeading>
    <P id="conj-adv.p.these-open-dependent">
      These open a dependent <Term t="clause">clause</Term> — one that hangs on the main clause and answers
      a question about it: why? when? where? to what end? Meet the sign, ask the question:
    </P>
    <ColsTable id="conj-adv.ct2" tCols={[0, 1]}
      title="Dependent clauses — subordinate conjunctions"
      headers={['Function', 'Conjunctions']}
      rows={[
        ['Purpose', 'ἵνα (663×), ὅπως (53×) — “in order to”'],
        ['Result', 'ὥστε (83×), ὅπως (53×), ἵνα (663×) — “so that”'],
        ['Cause', 'ὅτι (1,296×), ὡς (504×) — “because”'],
        ['Condition', 'εἰ (502×), ἐάν (333×) — “if”'],
        ['Concession', 'εἰ καί, κἄν (17×) — “even if”, “although”'],
        ['Comparison', 'ὡς (504×), καθώς (182×) — “as”, “just as”'],
        ['Content / discourse', 'ὅτι (1,296×) — “that”'],
        ['Place', 'ὅπου (82×) — “where”'],
        ['Time', 'ὅτε (103×) — “when”; ὅταν (123×) — “whenever”; ἕως (146×) — “until”'],
      ]}
    />
    <InfoBox title="Mood indicators">
      <p><Tr id="conj-adv.as.certain-conjunctions-tend">Certain conjunctions tend to signal the mood of the verb in their clause:</Tr></p>
      <ul className="mt-1.5 space-y-1 list-disc list-inside">
        <li><Tr id="conj-adv.wo.usually-indicative-amp">Usually with the <strong>indicative</strong>: ὅτι, εἰ, καθώς, ὡς, γάρ &amp; ὅτε</Tr></li>
        <li><Tr id="conj-adv.wo.usually-subjunctive-amp">Usually with the <strong>subjunctive</strong>: ἵνα, ἐάν, μή, ἕως, ὅπως &amp; ὅταν</Tr></li>
      </ul>
    </InfoBox>
    <ColsTable id="conj-adv.ct3" tCols={[0, 1]}
      title="Expressions that introduce independent clauses"
      headers={['Demonstrative', 'Interrogative']}
      rows={[
        ['μετὰ τοῦτο — “after this”', 'κατὰ τί — “how?”'],
        ['διὰ τοῦτο — “for this reason”', 'διὰ τί — “why?”'],
        ['ἐπὶ τοῦτο — “for this reason”', 'εἰς τί — “why?”'],
        ['ἐκ τούτου — “as a result of this”', ''],
      ]}
      note="These prepositional phrases open sentences as set expressions — they are not modifiers. They also introduce commands, lists, or a new topic."
    />

    {/* ── 4 · Adverbs ────────────────────────────────────── */}
    <DropdownPractice id="conj-adv.d2"
      title="Practice — the subordinators"
      options={["that / because", "in order that", "whenever", "as / when", "if", "just as"]}
      items={[
        { q: <span className="normal-case">ὅτι</span>, answer: "that / because" },
        { q: <span className="normal-case">ἵνα</span>, answer: "in order that" },
        { q: <span className="normal-case">ὅταν</span>, answer: "whenever" },
        { q: <span className="normal-case">ὡς</span>, answer: "as / when" },
        { q: <span className="normal-case">εἰ</span>, answer: "if" },
        { q: <span className="normal-case">καθώς</span>, answer: "just as" },
      ]}
    />

    <SectionHeading id="conj-adv.h.adverbs-how-when">Adverbs: how, when, where</SectionHeading>
    <P id="conj-adv.p.adverbs-conjunctions-modify">
      Adverbs are not conjunctions — they modify verbs, filling in the action's circumstances. Most Greek
      adverbs of manner end in <Gk>‑ως</Gk> (from adjectives: <Gk>καλός</Gk> "good" → <Gk>καλῶς</Gk>
      "well"), which makes them easy to spot on sight.
    </P>
    <ColsTable id="conj-adv.ct4" tCols={[0, 1, 2]}
      headers={['How', 'When', 'Where']}
      rows={[
        ['how? — πῶς (103×)', 'when? — πότε (19×)', 'where? — ποῦ (48×)'],
        ['in this way, thus — οὕτως (208×)', 'then, at that time — τότε (160×)', 'there — ἐκεῖ (95×)'],
        ['again — πάλιν (141×)', 'now — νῦν (147×)', 'here, hither — ὧδε (61×)'],
        ['still, yet, even — ἔτι (93×)', 'now, already — ἤδη (61×)', 'outside — ἔξω (44×)'],
        ['more, rather — μᾶλλον (81×)', 'first, earlier — πρῶτον (57×)', 'near — ἐγγύς (33×)'],
        ['only, alone — μόνον (62×)', 'immediately — εὐθύς (51×)', 'from there — ἐκεῖθεν (27×)'],
        ['well — καλῶς (36×)', 'always — πάντοτε (41×)', <span key="neg" className="font-semibold text-gray-700"><Tr id="conj-adv.ct4.neg">Negatives</Tr></span>],
        ['likewise — ὁμοίως (30×)', 'today — σήμερον (41×)', 'no, not — οὐ, οὐκ, οὐχ (1,623×)'],
        ['truly — ἀληθῶς (18×)', 'now, just now — ἄρτι (36×)', 'not — οὐχί (54×), μή (1,042×)'],
        ['badly — κακῶς (16×)', 'immediately — εὐθέως (36×)', 'no longer — οὐκέτι (47×)'],
        ['quickly — ταχέως (15×)', 'once, formerly — ποτέ (29×)', ''],
      ]}
    />

    {/* ── 5 · Semantic labels ────────────────────────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="conj-adv.h.semantic-labels-naming">Semantic labels: naming the moves of an argument</SectionHeading>
      <P id="conj-adv.p.beyond-naming-conjunctions">
        Beyond naming conjunctions, discourse analysis names what each <em>sentence</em> is doing — the
        move it makes in the argument. These labels (after Black) let you outline a paragraph's logic: the
        main assertion, its grounds, restatements, illustrations, and so on.
      </P>
      <ColsTable id="conj-adv.ct5" tCols={[0, 1, 2]}
        title="Proposition labels (in addition to the conjunction labels above)"
        headers={['Logic', 'Form', 'Clarification']}
        rows={[
          ['Event or Action', 'Situation – Response', 'Introduction'],
          ['Assertion', 'Problem – Resolution', 'Conclusion'],
          ['– Idea – Ground', 'Rhetorical question', 'Summary'],
          ['Expansion', 'Entreaty', 'List, Series'],
          ['Restatement', 'Exhortation or Warning', 'Parallel'],
          ['– Alternative', 'Exclamation', 'Apposition'],
          ['– Explanation', 'Desire (wish or hope)', 'Identification'],
          ['– Manner', 'Promise', 'Description'],
          ['– Question – Answer', 'Illustration / Example', 'Verification'],
        ]}
      />
    </LevelOnly>

    {/* ── 6 · Try it ─────────────────────────────────────── */}
    <DropdownPractice id="conj-adv.d3"
      title="Practice — the little adverbs"
      options={["now", "then", "there", "again", "immediately", "here"]}
      items={[
        { q: <span className="normal-case">νῦν</span>, answer: "now" },
        { q: <span className="normal-case">τότε</span>, answer: "then" },
        { q: <span className="normal-case">ἐκεῖ</span>, answer: "there" },
        { q: <span className="normal-case">πάλιν</span>, answer: "again" },
        { q: <span className="normal-case">εὐθύς</span>, answer: "immediately", note: <Tr id="conj-adv.n.euthys">Mark’s favourite word.</Tr> },
        { q: <span className="normal-case">ὧδε</span>, answer: "here" },
      ]}
    />

    <LevelOnly level="beginning"><SectionHeading id="conj-adv.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="conj-adv.pr1"
      title="Practice — name the sign's function"
      intro={<Tr id="conj-adv.intro.each-connective-coordinating">For each connective: coordinating or subordinating? And what logical move does it make?</Tr>}
      items={[
        { q: <span className="normal-case">ἐγὼ ἐβάπτισα ὑμᾶς ὕδατι, αὐτὸς δὲ βαπτίσει ὑμᾶς πνεύματι.</span>,
          a: <Tr id="conj-adv.pa.coordinating-here-contrastive">δέ — coordinating, here contrastive: "I baptized you with water, <em>but</em> he will baptize you with the Spirit" (Mark 1:8).</Tr>},
        { q: <span className="normal-case">πιστεύω· βοήθει μου τῇ ἀπιστίᾳ.</span>,
          a: <Tr id="conj-adv.pa.conjunction-all-asyndeton">No conjunction at all (asyndeton) — the abrupt jump mirrors the father's urgency: "I believe; help my unbelief!" (Mark 9:24).</Tr>},
        { q: <span className="normal-case">ὅτι ἠγάπησεν πολύ</span>,
          a: <Tr id="conj-adv.pa.subordinating-causal-because">ὅτι — subordinating, causal: "<em>because</em> she loved much" (Luke 7:47).</Tr>},
        { q: <span className="normal-case">σπουδάσωμεν οὖν εἰσελθεῖν.</span>,
          a: <Tr id="conj-adv.pa.coordinating-inferential-therefore">οὖν — coordinating, inferential: "<em>therefore</em> let us strive to enter" (Heb 4:11) — drawing the conclusion of the argument before it.</Tr>},
        { q: <span className="normal-case">ἡ γὰρ ἀγάπη τοῦ Χριστοῦ συνέχει ἡμᾶς.</span>,
          a: <Tr id="conj-adv.pa.coordinating-explanatory-love">γάρ — coordinating, explanatory: "<em>for</em> the love of Christ compels us" (2 Cor 5:14) — grounding what was just said.</Tr>},
      ]}
    />

    {/* ── 7 · See it in the NT ───────────────────────────── */}
    <LiveExamples
      intro={<Tr id="conj-adv.intro.follow-one-connective">Follow one connective through a whole book and watch an author's habits emerge.</Tr>}
      links={[
        { label: <Tr id="conj-adv.le.every-therefore-hinge">Every <span className="normal-case">οὖν</span> — "therefore": the hinge of arguments (John and Romans love it)</Tr>, lemma: 'οὖν' },
        { label: <Tr id="conj-adv.le.every-grounds-beneath">Every <span className="normal-case">γάρ</span> — "for": the grounds beneath each claim</Tr>, lemma: 'γάρ' },
        { label: <Tr id="conj-adv.le.every-strong-contrast">Every <span className="normal-case">ἀλλά</span> — "but": strong contrast</Tr>, lemma: 'ἀλλά' },
        { label: <Tr id="conj-adv.le.every-just-comparison">Every <span className="normal-case">καθώς</span> — "just as": comparison and pattern</Tr>, lemma: 'καθώς' },
      ]}
    />

    {/* ── 8 · Going deeper (Intermediate only) ───────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="conj-adv.h.going-deeper-reading">Going deeper: reading by the signs</SectionHeading>
      <P id="conj-adv.p.both-translate-twins">
        <strong>δέ vs. καί.</strong> Both translate "and," but they are not twins: <Gk>καί</Gk> simply
        adds; <Gk>δέ</Gk> marks a new development — a step forward in the story or argument. Mark strings
        scenes with <Gk>καί</Gk> (breathless, paratactic); Matthew and Luke often re-edit the same scenes
        with <Gk>δέ</Gk> (structured, developmental). An author's connective habits are part of his voice.
      </P>
      <P id="conj-adv.p.chains-paul-reasons">
        <strong>γάρ chains.</strong> Paul reasons in <Gk>γάρ</Gk>: claim, ground, ground of the ground.
        Romans 1:16–18 hangs three <Gk>γάρ</Gk> clauses in a row — outline them and the argument's skeleton
        stands out. When you preach a Pauline text, the <Gk>γάρ</Gk> chain often <em>is</em> the sermon
        outline.
      </P>
      <P id="conj-adv.p.asyndeton-because-greek">
        <strong>Asyndeton.</strong> Because Greek so regularly connects sentences, the <em>absence</em> of
        a connective (asyndeton) is itself a signal — abruptness, solemnity, a new section (common in John;
        striking in commands: <Gk>ἐγείρεσθε, ἄγωμεν</Gk>, "Rise, let us go," Mark 14:42). When the road
        signs suddenly stop, slow down.
      </P>
    </LevelOnly>

    <p className="mt-5 text-xs text-gray-400 italic">
      Source: David Alan Black, <span className="not-italic">It&rsquo;s Still Greek to Me: An Easy-to-Understand Guide to Intermediate Greek</span> (Grand Rapids: Baker, 1998).
    </p>
  </>
)
