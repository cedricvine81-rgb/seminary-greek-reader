import { ColsTable, InfoBox } from '../shared'

export const CONJ_ADV_CONTENT = (
  <>
    <InfoBox title="Key terms">
      <ul className="space-y-1.5 list-disc list-inside">
        <li><strong>Phrase</strong> — a group of words that cannot stand alone as a sentence because it lacks a subject, a predicate, or both.</li>
        <li><strong>Clause</strong> — a group of words forming part of a sentence that contains a subject and a predicate.</li>
        <li><strong>Independent (main) clause</strong> — makes sense standing alone; usually begins with a <em>coordinating conjunction</em>.</li>
        <li><strong>Dependent (subordinate) clause</strong> — cannot stand alone; it functions like an adjective, adverb, or noun and begins with a <em>subordinate conjunction</em>.</li>
      </ul>
    </InfoBox>

    <ColsTable
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

    <ColsTable
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
      <p>Certain conjunctions tend to signal the mood of the verb in their clause:</p>
      <ul className="mt-1.5 space-y-1 list-disc list-inside">
        <li>Usually with the <strong>indicative</strong>: ὅτι, εἰ, καθώς, ὡς, γάρ &amp; ὅτε</li>
        <li>Usually with the <strong>subjunctive</strong>: ἵνα, ἐάν, μή, ἕως, ὅπως &amp; ὅταν</li>
      </ul>
    </InfoBox>

    <ColsTable
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

    <p className="text-sm font-semibold text-gray-800 mt-6 mb-1">Adverbs</p>
    <p className="text-sm text-gray-600 mb-3">Adverbs are not conjunctions — they modify verbs (they help explain the action).</p>
    <ColsTable
      headers={['How', 'When', 'Where']}
      rows={[
        ['how? — πῶς (103×)', 'when? — πότε (19×)', 'where? — ποῦ (48×)'],
        ['in this way, thus — οὕτως (208×)', 'then, at that time — τότε (160×)', 'there — ἐκεῖ (95×)'],
        ['again — πάλιν (141×)', 'now — νῦν (147×)', 'here, hither — ὧδε (61×)'],
        ['still, yet, even — ἔτι (93×)', 'now, already — ἤδη (61×)', 'outside — ἔξω (44×)'],
        ['more, rather — μᾶλλον (81×)', 'first, earlier — πρῶτον (57×)', 'near — ἐγγύς (33×)'],
        ['only, alone — μόνον (62×)', 'immediately — εὐθύς (51×)', 'from there — ἐκεῖθεν (27×)'],
        ['well — καλῶς (36×)', 'always — πάντοτε (41×)', <span key="neg" className="font-semibold text-gray-700">Negatives</span>],
        ['likewise — ὁμοίως (30×)', 'today — σήμερον (41×)', 'no, not — οὐ, οὐκ, οὐχ (1,623×)'],
        ['truly — ἀληθῶς (18×)', 'now, just now — ἄρτι (36×)', 'not — οὐχί (54×), μή (1,042×)'],
        ['badly — κακῶς (16×)', 'immediately — εὐθέως (36×)', 'no longer — οὐκέτι (47×)'],
        ['quickly — ταχέως (15×)', 'once, formerly — ποτέ (29×)', ''],
      ]}
    />

    <p className="text-sm font-semibold text-gray-800 mt-6 mb-1">Semantic labels</p>
    <p className="text-sm text-gray-600 mb-3">Semantic labels trace the logic of an argument — the main idea, then the basis for it — by showing how sentences connect. The columns group labels by logic, form, and clarification.</p>
    <ColsTable
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

    <p className="mt-5 text-xs text-gray-400 italic">
      Source: David Alan Black, <span className="not-italic">It&rsquo;s Still Greek to Me: An Easy-to-Understand Guide to Intermediate Greek</span> (Grand Rapids: Baker, 1998).
    </p>
  </>
)
