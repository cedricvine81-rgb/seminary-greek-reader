// Curated query sets for the Theology page. THIS FILE IS THE SCHOLARSHIP.
//
// The summaries on the page are written from passages these queries return; the queries decide
// what a student sees. A model is never asked to recall which passages discuss a topic — see the
// header of scripts/build-theology.ts for why that distinction is load-bearing.
//
// Terms are English because the retrieval facet is English (backgrounds-search-en). Greek and
// Hebrew terms belong here too once the grc facet is wired in — noted per topic where they
// would add reach.

export interface TopicQuery {
  label: string
  re: RegExp
  weight: number
  /** Too common to stand alone ("soul", "judgment"); counts only alongside a `context` term. */
  needsContext?: boolean
}

export interface Topic {
  id: string
  label: string
  /** Shown under the heading — what the topic covers and, just as importantly, what it does not. */
  blurb: string
  queries: TopicQuery[]
  context: RegExp[]
  minScore: number
  perWorkCap: number
}

export const TOPICS: Topic[] = [
  {
    id: 'resurrection',
    label: 'Resurrection and the afterlife',
    blurb:
      'What happens after death: bodily resurrection, the immortality of the soul, the intermediate '
      + 'state, and judgment. The sources disagree sharply — Greek immortality of the soul and Jewish '
      + 'bodily resurrection are different hopes, and several texts hold both at once.',
    queries: [
      // Distinctive — a hit is almost certainly on topic.
      { label: 'resurrection', re: /\bresurrect(ion|ed)?\b/, weight: 4 },
      { label: 'raised-from-dead', re: /\brais(e|ed|ing) (up )?(again |from )?the dead\b|\brise from the dead\b/, weight: 4 },
      { label: 'rise-again', re: /\bris(e|en|ing) again\b/, weight: 4 },
      { label: 'live-again', re: /\bliv(e|ing) again\b|\brevive[ds]?\b/, weight: 3 },
      { label: 'immortal-soul', re: /\bimmortal(ity)? of the soul\b|\bimmortal soul\b/, weight: 4 },
      { label: 'immortality', re: /\bimmortal(ity)?\b/, weight: 2 },
      { label: 'incorruption', re: /\bincorrupt(ion|ible)\b/, weight: 3 },
      { label: 'eternal-life', re: /\b(eternal|everlasting) life\b|\blife everlasting\b/, weight: 3 },
      { label: 'world-to-come', re: /\b(world|age) to come\b/, weight: 3 },
      { label: 'hades', re: /\bhades\b|\bsheol\b|\btartarus\b/, weight: 3 },
      { label: 'gehenna', re: /\bgehenna\b/, weight: 3 },
      { label: 'paradise', re: /\bparadise\b/, weight: 2 },
      { label: 'abrahams-bosom', re: /\bbosom of abraham\b/, weight: 4 },
      { label: 'transmigration', re: /\btransmigrat(e|ion)\b|\bmetempsychosis\b|\bpass into another body\b/, weight: 4 },
      { label: 'sleep-of-death', re: /\bsleep of death\b|\bawak(e|en|ened) (out of |from )?(the )?(dust|sleep)\b/, weight: 3 },
      // Added after the first pass returned neither 1 Enoch 22 nor Josephus on the Greek
      // afterlife: the texts that matter most here often never use the word "resurrection".
      // 1 Enoch describes the dead in "hollow places"; Josephus reaches for "islands of the
      // blessed" to explain the Essenes to a Greek reader.
      { label: 'chambers-of-dead', re: /\bhollow places\b|\bchambers?\b(?=[^.]{0,80}\b(spirit|soul|dead)s?\b)|\bspirits of the dead\b|\bsouls of the (righteous|dead)\b/, weight: 4 },
      { label: 'blessed-isles', re: /\bislands? of the blessed\b|\belysian\b|\bplace of rest\b/, weight: 3 },
      { label: 'intermediate-state', re: /\buntil the (great )?judg(e)?ment\b|\bday of judgment\b|\bgreat day\b/, weight: 2 },
      { label: 'no-resurrection', re: /\bno resurrection\b|\bneither .{0,30}resurrection\b|\bdeny(ing)? the resurrection\b|\bsoul (dies|perishes) with the body\b/, weight: 5 },
      // Common on their own — only count beside a death/afterlife word.
      { label: 'soul-after-death', re: /\bsoul[s]?\b/, weight: 1, needsContext: true },
      { label: 'judgment-of-dead', re: /\bjudgment\b|\bjudgement\b/, weight: 1, needsContext: true },
      { label: 'dust', re: /\bdust\b/, weight: 1, needsContext: true },
    ],
    context: [/\bdead\b/, /\bdeath\b/, /\bdie[ds]?\b/, /\bgrave\b/, /\btomb\b/, /\bperish\b/, /\bmortal\b/, /\bhades\b/, /\bsheol\b/],
    minScore: 3,
    perWorkCap: 6,
  },
]
