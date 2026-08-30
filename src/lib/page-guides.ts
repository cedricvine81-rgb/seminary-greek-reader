// Page guides — "what is this page for, and how do I use it?"
//
// Plain authored prose, one entry per study tool, resolved from the current route. No model,
// no corpus lookup, no per-question logic: this is documentation that happens to be delivered
// in context rather than in a manual nobody opens.
//
// WRITING RULE — keep entries conceptual, not pixel-level. "Right-click a word for its syntax
// categories" survives a redesign; "click the third button in the top bar" does not, and a
// guide that lies is worse than no guide because students trust it. When a control genuinely
// has to be named, name it by its label or its icon's meaning, never by position.
//
// These are deliberately in one file so a UI change has one obvious place to update — the same
// discipline that keeps the attribution strings honest.

export interface GuideSection {
  heading: string
  body: string
}

/** A keyboard or mouse interaction a student would never guess. */
export interface GuideGesture {
  /** What to do — "Right-click a word", "Shift". */
  does: string
  /** What happens. */
  gets: string
}

export interface PageGuide {
  id: string
  /** Shown as the panel heading. */
  title: string
  /** One sentence: what this page is for. Answers "am I in the right place?". */
  lede: string
  sections: GuideSection[]
  gestures?: GuideGesture[]
  /** Where to go next; hrefs are in-app routes. */
  related?: { label: string; href: string }[]
  /** Seminary Hebrew overlay: fields here replace their counterparts when the language
   *  track is Hebrew, so each surface describes the Hebrew experience (the MT reader, the
   *  Hebrew deck, Reception rather than Backgrounds…). Arrays replace whole, not merge. */
  hebrew?: Partial<Pick<PageGuide, 'title' | 'lede' | 'sections' | 'gestures' | 'related'>>
}

/** The guide as the current track should read it. */
export function resolveGuide(g: PageGuide, hebrewTrack: boolean): PageGuide {
  if (!hebrewTrack || !g.hebrew) return g
  return { ...g, ...g.hebrew, hebrew: g.hebrew }
}

// ── The study tools ──────────────────────────────────────────────────────────────────────

export const PAGE_GUIDES: PageGuide[] = [
  {
    id: 'reader',
    title: 'The Reader',
    lede: 'Read continuous Greek or Hebrew with the lexicon, parsing and syntax a click away.',
    sections: [
      {
        heading: 'Finding a passage',
        body: 'Type a reference into the search box — "John 3:16", "Rom 8", "Matt 5:3-12" all work. Typing a Greek word instead searches for it, and the NT / LXX / HB buttons switch which corpus you are reading. The text keeps loading as you scroll, so you can read past the end of a chapter without doing anything.',
      },
      {
        heading: 'Understanding a word',
        body: 'Hovering any word fills the panel below with its lexical entry, parsing and glosses. That panel follows your mouse, which is useful while reading and annoying while writing — press Shift to freeze it on the word you are looking at, and Shift again to release it.',
      },
      {
        heading: 'Syntax',
        body: 'Right-clicking a word opens its syntax categories, drawn from four independent treebanks: Wallace, PROIEL, GBI and the ABS Syntax Database. They disagree with each other, which is the point — where they differ, the construction is genuinely contested. You can turn individual sources off in the menu if the comparison is more noise than help.',
      },
      {
        heading: 'Reading with a translation',
        body: 'The translation selector adds a translation beside or beneath the Greek. The Berean Standard Bible is aligned word by word against the Greek New Testament; the others appear verse by verse. Choosing "Greek only" removes it again.',
      },
    ],
    gestures: [
      { does: 'Hover a word', gets: 'lexical entry, parsing and glosses in the panel below' },
      { does: 'Shift', gets: 'freezes the parsing panel on the current word — Shift again to unfreeze' },
      { does: 'Right-click a word', gets: 'syntax categories, plus search options for that word' },
      { does: '⌘K / Ctrl-K', gets: 'search across every corpus and translation' },
    ],
    related: [
      { label: 'Grammar — the paradigms behind the parsing', href: '/grammar' },
      { label: 'Exegesis — work through a passage in depth', href: '/exegesis' },
    ],
  },

  {
    id: 'grammar',
    hebrew: {
      title: 'Hebrew Grammar',
      lede: 'A full first-year Hebrew grammar, from the alphabet to the weak verbs.',
      sections: [
        {
          heading: 'One text, twenty-two chapters',
          body: 'The chapters run in a standard first-year order: the script and pointing, the noun system (article, prepositions, construct state, suffixes), then the verb — Qal first, the waw-consecutive that carries all narrative, and each derived stem in turn, with the weak verbs and a syntax chapter to close. There is no level toggle here; how the chapters map onto your course is your instructor\u2019s call.',
        },
        {
          heading: 'Paradigms and drills',
          body: 'Every paradigm is set out with the endings marked, and most chapters end with tap-to-reveal parse drills. The parsing vocabulary — stem, conjugation, person, gender, number — is exactly what the Reader\u2019s parsing pane and the morphology quizzes use, so nothing here needs translating between tools.',
        },
        {
          heading: 'The weak-verb table',
          body: 'The Weak Verbs chapter is built around one reference table: each class with its perfect, imperfect, wayyiqtol and infinitive side by side. It is meant for returning to, not memorising — the five narrative verbs listed beneath it are the ones to over-learn.',
        },
      ],
      related: [
        { label: 'Vocabulary — the Hebrew deck', href: '/vocab' },
        { label: 'Reader — the forms in the text', href: '/reader' },
      ],
    },
    title: 'Grammar',
    lede: 'A full Greek grammar, from the alphabet to μι-verbs, written at two levels.',
    sections: [
      {
        heading: 'Beginning and Intermediate',
        body: 'The level toggle changes what the page shows, not just how much of it. Beginning gives you the English-grammar starting point, the paradigms, worked examples and practice drills. Intermediate drops the drills and adds the syntax categories — the functions each form can carry, after Wallace — plus a closing section on the interpretive questions the forms raise. Your choice is remembered.',
      },
      {
        heading: 'Minimums',
        body: 'The Minimums tab holds the eight paradigm sets that carry the most weight: master these and most of the New Testament becomes readable. They are worth returning to long after you have moved past them.',
      },
      {
        heading: 'Practice',
        body: 'On Beginning, most chapters carry drills with immediate feedback, sentences taken from class, and a guided worked example that reveals one step at a time. The "Quiz me" control inside a drill blanks the table it is testing, so you answer from memory rather than by reading upward.',
      },
      {
        heading: 'Seeing it in real text',
        body: 'Each chapter ends with links into the tagged New Testament — every genitive noun, every aorist participle, and so on. These open a search beside the chapter rather than navigating away, so you can check a claim without losing your place.',
      },
    ],
    gestures: [
      { does: 'Tap a dotted-underlined term', gets: 'a plain-English definition of that grammatical term' },
      { does: 'Tap adjacent words in a drill', gets: 'answers reveal individually — mark yourself right or wrong and the block keeps your score on this device' },
    ],
    related: [
      { label: 'Vocabulary — the words to go with the forms', href: '/vocab' },
      { label: 'Reader — see the forms in continuous text', href: '/reader' },
    ],
  },

  {
    id: 'vocab',
    title: 'Vocabulary',
    lede: 'Flashcards and quizzes for Greek and Hebrew, ordered by how often a word actually occurs.',
    sections: [
      {
        heading: 'How the deck is ordered',
        body: 'Words are grouped by frequency, so the earliest sections are the ones that pay off fastest — the handful of words that make up a large share of every page. Working down the list in order is usually better than picking sections that look interesting.',
      },
      {
        heading: 'Greek and Hebrew',
        body: 'The language toggle switches the whole deck between Greek and Hebrew. They track separately, so progress in one does not disturb the other.',
      },
      {
        heading: 'Review',
        body: 'A quiz can draw a proportion of its questions from sections you have already finished. That is what keeps earlier vocabulary from quietly fading while you learn new words, and it is worth leaving on even though it makes each quiz slightly harder.',
      },
    ],
    related: [
      { label: 'Grammar — the forms these words appear in', href: '/grammar' },
    ],
  },

  {
    id: 'search',
    title: 'Search',
    lede: 'One search across the Greek New Testament, the Septuagint, the translations and the background library.',
    sections: [
      {
        heading: 'What you can type',
        body: 'A Greek word, an English word, a phrase in quotation marks, or a reference. The tabs above the results show how many hits each corpus has, so you can see at a glance whether a word is common in the New Testament but rare in the Septuagint — often the more interesting fact.',
      },
      {
        heading: 'Typing Greek without a Greek keyboard',
        body: 'Type Beta Code and it converts as you go: "logos" becomes λογος. This works throughout the app, not only here.',
      },
      {
        heading: 'Narrowing',
        body: 'The scope selector restricts a search to one corpus, one translation or one background collection, and you can further limit it to particular books. The context slider around each result widens the surrounding verses, crossing chapter boundaries where needed.',
      },
      {
        heading: 'Where it opens',
        body: 'Search opens as a panel beside whatever you were reading, so results can be compared with the passage that prompted them. The full page still exists for direct links and for longer sessions.',
      },
    ],
    gestures: [
      { does: '⌘K / Ctrl-K', gets: 'opens search from anywhere in the app' },
      { does: 'Right-click a word in the Reader', gets: 'searches that word or its lemma without retyping it' },
    ],
    related: [
      { label: 'Construct search — search by grammar rather than by word', href: '/search/construct' },
    ],
  },

  {
    id: 'construct',
    title: 'Construct search',
    lede: 'Search for grammatical constructions rather than words — every articular infinitive, every genitive absolute.',
    sections: [
      {
        heading: 'What makes this different',
        body: 'Ordinary search finds words. This finds shapes: a preposition governing a particular case, a participle agreeing with a noun, a subjunctive after ἵνα. You are describing a pattern, and the search returns every place in the corpus that matches it — across the Greek New Testament, the Septuagint, the Hebrew Bible and the wider library.',
      },
      {
        heading: 'Start from a preset',
        body: 'The presets are the fastest way in, and the fastest way to learn the query language: pick one that resembles what you want, run it, then modify it. Building a query from nothing is possible but rarely the quickest route.',
      },
      {
        heading: 'Refining a query',
        body: 'Terms can require agreement with each other, exclude a feature rather than require it, and be scoped to a clause or a distance. Searching across all texts at once gives a distribution instead of a hit list — useful for showing that a construction clusters in one author.',
      },
      {
        heading: 'One thing to watch',
        body: 'Word-distance is counted in gaps, not in words: two words either side of a term is a distance of three, not two. If a query returns less than you expected, widening the distance by one is usually the fix.',
      },
    ],
    related: [
      { label: 'Search — find words and phrases instead', href: '/search' },
    ],
  },

  {
    id: 'texts',
    title: 'Texts',
    lede: 'The background library — Josephus, Philo, the Apostolic Fathers, the Targums, the Mishnah, the Greco-Roman authors and more.',
    sections: [
      {
        heading: 'Finding a work',
        body: 'The Texts menu opens by category, then by author where a category has several, then by work. Once a work is open, clicking its title drops down a book-chapter-verse cascade for jumping to a specific passage.',
      },
      {
        heading: 'Greek and English together',
        body: 'Where a work has both, the display selector switches between the original, the translation, or the two in parallel columns. Not every work has a Greek text — some are English-only because no public-domain edition of the original was available.',
      },
      {
        heading: 'Reading around a citation',
        body: 'Search within the open work to find a phrase, and use the Summary for an orientation to a work you have not read before. Where a Greek text is tagged, clicking a word gives you its parsing just as in the Reader.',
      },
    ],
    related: [
      { label: 'Exegesis → Backgrounds — see which of these a verse cites', href: '/exegesis?tab=backgrounds' },
    ],
  },

  // ── Exegesis: one entry for the page, then one per tab ────────────────────────────────

  {
    id: 'register',
    title: 'Register',
    lede: 'Find which works in the library write Greek like the one you are reading — and see exactly what makes them alike.',
    sections: [
      {
        heading: 'What it measures, and what it does not',
        body: 'Register is the level and texture of the Greek: how often a writer reaches for participles, particles, the article, subordination. It is not authorship. Works of the same genre often score alike whoever wrote them — Hebrews ranks first against Romans here — so read a high ranking as "these read similarly", and let the table under each result tell you why.',
      },
      {
        heading: 'Choosing what to compare',
        body: 'Type a reference for Scripture — "Mark", "Luke 1-2", "Mark 4:1-9" all work, in English or in your own book names, and the box completes the pericope as you type. For anything else, pick a title from the library list below the box. A whole book is answered instantly; a passage is measured on the spot.',
      },
      {
        heading: 'Passages are the interesting part',
        body: 'A whole work averages its own variety away. Luke 3-24 ranks with Matthew, Mark and Acts — the synoptic register. Luke 1-2 ranks with 1 Kingdoms, Judith, Tobit and Daniel: the infancy narrative septuagintalizes, and comparing the two halves is how you watch it happen.',
      },
      {
        heading: 'Three ways of measuring',
        body: 'Common words compares how often each text uses the 150 words the whole library uses most — largely the grammatical ones, so it tracks how a sentence is built. Syntax compares the rate of each construction. Subject words compares the vocabulary that is NOT among those common 150, so it follows what a text is about as much as how it is written. Each result explains itself in the terms of the lens you chose.',
      },
      {
        heading: 'Reading the numbers',
        body: 'Every figure is a rate per 1,000 words, so texts of very different lengths sit side by side. Distance is the average difference between two profiles: 0 is identical, and about 1.0 is no more alike than two works picked at random. The bar runs on a fixed scale, so a first-placed result with a short bar is telling you the work has no close kin anywhere in the library. Any column heading will explain itself if you tap it.',
      },
      {
        heading: 'Classical and Koine, by genre',
        body: 'The last two columns say what the same feature does in Classical Attic prose and in the Greek of the Hellenistic era, so you can judge whether a figure is remarkable. They default to the genre of the text you are comparing — a Gospel against narrative, a letter against letters — and you can pin any other pool to see whether a habit belongs to the genre or to the Greek at large. Where the library holds nothing of a genre in a period, the column says so rather than substituting an average: there is no Classical epistolography here at all.',
      },
      {
        heading: 'Taking it away',
        body: 'Print / save as PDF produces a document rather than a screenshot: the full ranking, the evidence for the leading parallels with verse references for every shared trait, the method, and the edition and morphology behind every text cited. The web address carries whatever you are looking at, so a comparison can be sent to a class.',
      },
    ],
    gestures: [
      { does: 'Tab or →', gets: 'Accepts the grey completion in the reference box' },
      { does: 'Tap a result', gets: 'Opens the evidence: what the two texts share, and where they differ' },
      { does: 'Tap a column heading', gets: 'Explains what that column is' },
    ],
    related: [
      { label: 'Texts — read the works being compared', href: '/texts' },
      { label: 'Construct search — find the constructions this counts', href: '/search/construct' },
    ],
  },

  {
    id: 'themes',
    title: 'Themes',
    lede: 'A subject index over the background library: what the ancient sources actually say about resurrection, purity, the Sabbath and the rest.',
    sections: [
      {
        heading: 'The third way into the library',
        body: 'The Texts library can be browsed by author and searched by word. This is the axis a seminary question usually starts from: by topic. Pick a theme and you get the passages that bear on it, grouped and summarised, each one opening into the reader.',
      },
      {
        heading: 'Where the passages come from',
        body: 'Every citation was returned by a real search of the corpus and then checked against the text — none is recalled from memory. The summaries are machine-drafted from the passage itself and hand-checked, and the page says so.',
      },
      {
        heading: 'What the sources do not say',
        body: 'Each theme ends with the absences: positions you might expect to find and do not. This is the part a word search cannot give you, and for an essay it is often the more useful half.',
      },
    ],
    related: [
      { label: 'Texts — read the sources in full', href: '/texts' },
      { label: 'Search — find a word across the library', href: '/search' },
    ],
  },

  {
    id: 'map',
    title: 'Places',
    lede: 'Where the library\u2019s authors say things happened — every place they name, on one map.',
    sections: [
      {
        heading: 'What is plotted',
        body: 'Place names tagged in the Texts library, with the number of times each is mentioned. The dots are sized by how often a place comes up, so the shape of an author\u2019s world is visible before you read a word of them.',
      },
      {
        heading: 'Narrowing it down',
        body: 'Filter by author to see one writer\u2019s geography on its own — Josephus\u2019s Judaea against Herodotus\u2019s Aegean — or search for a place by name. Zoom and pan to move around; Reset returns to the whole map.',
      },
      {
        heading: 'From a place to the passages',
        body: 'Tap a place for its mention count and a link that searches the library for it, so you can go straight from the dot to the sentences behind it.',
      },
    ],
    related: [
      { label: 'Texts — the works these places come from', href: '/texts' },
    ],
  },

  {
    id: 'notes',
    title: 'Notes',
    lede: 'Everything you have written, in one notebook: verse notes, highlights and margin notes from every part of the app.',
    sections: [
      {
        heading: 'One notebook, many surfaces',
        body: 'A note made on a verse in the Reader, in the Exegesis workspace, on a background text or in a Grammar chapter all arrive here. Notes stay in step across open tabs, so a note written in one place shows up in another without a reload.',
      },
      {
        heading: 'Finding a note again',
        body: 'Notes can be filed in folders and searched. Each one keeps its reference, so opening it takes you back to the passage it was written on.',
      },
    ],
    related: [
      { label: 'Reader — where most notes are written', href: '/reader' },
      { label: 'Exegesis — the workspace notebook', href: '/exegesis?tab=notes' },
    ],
  },

  {
    id: 'exegesis',
    hebrew: {
      sections: [
        {
          heading: 'How the tabs relate',
          body: 'They are not a sequence to work through. Each is a different question you might ask of the same verses: how does it parse, how does it divide, where is this story told twice, what do the ancient versions read, what does Scripture itself reuse, how has the verse been received, what have commentators said, and what do you think. Move between them as the passage demands.',
        },
        {
          heading: 'The passage box',
          body: 'One reference drives every tab. Changing it moves every view at once, so you can parse a verse, then set it beside Chronicles, then read its Targum, without retyping anything.',
        },
        {
          heading: 'Per-view settings',
          body: 'Each tab has its own menu holding the settings that apply to that view — text size, source visibility, and the copyright statements for whatever data that tab is showing. On a phone, the same menu is also where you switch tabs.',
        },
      ],
    },
    title: 'The Exegesis workspace',
    lede: 'Nine views of one passage — put a reference in the box at the top and every tab follows it.',
    sections: [
      {
        heading: 'How the tabs relate',
        body: 'They are not a sequence to work through. Each is a different question you might ask of the same verses: how does it parse, how does it divide, who else tells this story, what do the manuscripts read, what is it quoting, how is it argued, what have others said, and what do you think. Move between them as the passage demands.',
      },
      {
        heading: 'The passage box',
        body: 'One reference drives all nine tabs. Changing it moves every view at once, so you can parse a verse, then look at its manuscripts, then its Old Testament background, without retyping anything.',
      },
      {
        heading: 'Per-view settings',
        body: 'Each tab has its own menu holding the settings that apply to that view — text size, source visibility, and the copyright statements for whatever data that tab is showing. On a phone, the same menu is also where you switch tabs.',
      },
    ],
    related: [
      { label: 'Reader — read continuously instead', href: '/reader' },
    ],
  },

  {
    id: 'exegesis:workspace',
    hebrew: {
      lede: 'Parse a Hebrew passage word by word and write your own translation of it.',
      sections: [
        {
          heading: 'What to do here',
          body: 'Each word can be given its parsing — stem, conjugation, person, gender, number, in whatever shorthand your course uses — and its syntactic function, and each verse has a box for your translation. The fields are free text: the app can already parse every word, so what this view records is your account of the passage, not its.',
        },
        {
          heading: 'Reading help',
          body: 'Clicking a word shows its dictionary parsing from the tagged text, so you can check your answer after committing to one. The verses run right to left as they should; your annotations sit with the word they belong to.',
        },
        {
          heading: 'Keeping your work',
          body: 'Signed in, sessions can be saved and reopened later, and a finished passage can be exported as a PDF to hand in or print.',
        },
      ],
    },
    title: 'Exegesis · Syntax',
    lede: 'Parse a passage word by word and write your own translation of it.',
    sections: [
      {
        heading: 'What to do here',
        body: 'Each word can be given its parsing and its syntactic function, and each verse has a box for your translation. The point is the doing: the app can already parse every word, so what this view records is your account of the passage, not its.',
      },
      {
        heading: 'Glosses',
        body: 'You can have glosses shown for words below a frequency you choose — so the vocabulary you have not met yet is supplied, while the words you should know are not. Set it high while you are starting out and lower it as your vocabulary grows.',
      },
      {
        heading: 'Keeping your work',
        body: 'Signed in, sessions can be saved and reopened later, and a finished passage can be exported as a PDF to hand in or print.',
      },
    ],
  },

  {
    id: 'exegesis:phrasing',
    hebrew: {
      lede: 'See the passage laid out by clause and phrase, right to left, rather than as a run of words.',
      sections: [
        {
          heading: 'What you are looking at',
          body: 'The indentation reflects the clause-and-phrase analysis of the tagged Hebrew Bible: subordinate elements sit under what they modify, and the whole tree mirrors right-to-left with the text. Where a written word is really two — a preposition welded to its noun — the pieces appear where the syntax puts them, each with its own gloss.',
        },
        {
          heading: 'Using it',
          body: 'This is the view for "where does the wayyiqtol chain break, and what is fronted?" — the questions Hebrew narrative turns on. A clause label at the top of each box gives the constituent order (V-S-O and its variations), so word-order departures are visible at a glance.',
        },
        {
          heading: 'Drawing your own diagram',
          body: 'The Diagram view (the default — the toggle at the top left switches to the phrase tree) makes each sentence a canvas: drag the Hebrew words wherever your analysis puts them, and use the line, bracket, and label tools to mark the connections. Drag a box around several words to move them as a group, click a drawn line to move or reshape it, and undo any slip. Your layout is saved as you work — and the "How to" link opens a worked example.',
        },
      ],
    },
    title: 'Exegesis · Diagramming',
    lede: 'See the passage laid out by clause and phrase — or diagram it yourself.',
    sections: [
      {
        heading: 'What you are looking at',
        body: 'The indentation reflects the syntactic tree from the treebank data: subordinate elements sit under what they modify. Long, tangled sentences — Ephesians 1, for instance — become far easier to hold in view once the subordination is visible.',
      },
      {
        heading: 'Using it',
        body: 'This is the view to reach for when the question is "what is the main verb, and what hangs off it?" It is also the fastest way to see that a phrase you assumed modified one thing actually modifies another.',
      },
      {
        heading: 'Drawing your own diagram',
        body: 'The Diagram view (the default — the toggle at the top left switches to the phrase tree) makes each sentence a canvas: drag the Greek words wherever your analysis puts them, and use the line, bracket, and label tools to mark the phrasing. Drag a box around several words to move them as a group, click a drawn line to move or reshape it, and undo any slip. Your layout is saved as you work — and the "How to" link opens a worked example.',
      },
    ],
  },

  {
    id: 'exegesis:synopsis',
    hebrew: {
      lede: 'Samuel–Kings beside Chronicles, with the Chronicler\u2019s editorial changes marked.',
      sections: [
        {
          heading: 'Comparing accounts',
          body: 'Anchor a passage with a parallel — most of Samuel and Kings, the Psalms doublets, Isaiah 36–39, Jeremiah 52 — and the accounts appear in columns of pointed Hebrew. This is where redaction criticism of the Old Testament starts: what the Chronicler adds, drops or rewords is visible immediately rather than reconstructed from memory.',
        },
        {
          heading: 'Editorial changes',
          body: 'The compare mode marks each word as kept, added, omitted, substituted or moved, and reports how much of the source\u2019s wording is retained — which turns an impression that "the Chronicler softened this" into something measurable.',
        },
      ],
    },
    title: 'Exegesis · Synopsis',
    lede: 'Gospel parallels side by side, with the editorial changes marked.',
    sections: [
      {
        heading: 'Comparing accounts',
        body: 'Add the parallel passages and the accounts appear in columns. The comparison is where redaction criticism starts: what one evangelist adds, drops or rewords is visible immediately rather than reconstructed from memory.',
      },
      {
        heading: 'Editorial changes',
        body: 'The compare mode marks the kinds of change being made and reports how much of the wording is retained, which turns an impression that "Matthew tightened this" into something measurable.',
      },
    ],
  },

  {
    id: 'exegesis:variants',
    hebrew: {
      lede: 'The Masoretic text beside the ancient versions, verse by verse.',
      sections: [
        {
          heading: 'What you are looking at',
          body: 'For the Old Testament the comparison is versional: the Hebrew beside the Septuagint, the Targum where one is embedded (the Pentateuch and Isaiah), and an English control. Where a version differs from the Hebrew in front of you, it may be witnessing a different Hebrew text — that observation is the beginning of Old Testament textual criticism.',
        },
        {
          heading: 'A caution about verse numbers',
          body: 'In a few books — Psalms, Jeremiah, Job, Esther, Daniel — the Septuagint\u2019s versification genuinely diverges, and the view says so when you are in one. There the rows pair by number, not necessarily by content: read the columns as texts, not as an alignment.',
        },
        {
          heading: 'What this is not',
          body: 'A manuscript apparatus like the one printed in BHS remains under copyright and is not reproduced here. What you see are complete ancient texts in parallel, which is also where a first course actually begins.',
        },
      ],
    },
    title: 'Exegesis · Variants',
    lede: 'What the manuscripts actually read, witness by witness.',
    sections: [
      {
        heading: 'Reading the collation',
        body: 'Each row is a manuscript and each column a point of variation, in the style of a Swanson collation. The data covers the uncials and ninety papyri. Clicking a witness tells you what it is, when it dates from, and why it matters — worth doing, because the weight of a reading depends entirely on who is carrying it.',
      },
      {
        heading: 'Diplomatic view',
        body: 'Normally the manuscript text is shown in readable, accented form. Diplomatic view shows it as transcribed instead — bare, unaccented, with the medial sigma — which is what you want when the question concerns the writing itself rather than the words.',
      },
    ],
  },

  {
    id: 'exegesis:backgrounds',
    hebrew: {
      title: 'Exegesis \u00b7 Reception',
      lede: 'How this passage was received: where Scripture and the early readers took it.',
      sections: [
        {
          heading: 'Reception, not background',
          body: 'For an Old Testament passage the traffic mostly runs the other way: rather than asking what the verse draws on, this view gathers what draws on the verse — every New Testament citation of it in the apparatus, opened in place, with the note explaining the connection.',
        },
        {
          heading: 'The Targums',
          body: 'For the Pentateuch and Isaiah, each chapter links its Targum — the Aramaic interpretive rendering read in the synagogue. Where the Targum expands or softens the Hebrew, you are watching the earliest running commentary at work.',
        },
        {
          heading: 'The library',
          body: 'Citations into the Mishnah, the Talmud, Josephus, Philo and the rest open in place, and the whole library can be searched for a phrase — useful when a turn of expression feels formulaic and you want to know whose formula it was.',
        },
      ],
    },
    title: 'Exegesis · Backgrounds',
    lede: 'What this passage quotes, echoes, or shares a world with.',
    sections: [
      {
        heading: 'Cross-references',
        body: 'The apparatus gathers Old Testament citations and the parallels noted in the standard reference works, so you can see at a glance what a verse is drawing on.',
      },
      {
        heading: 'The background library',
        body: 'Citations into Josephus, Philo, the Apostolic Fathers, the Targums, the Mishnah and the rest open in place. You can also search the whole library for a phrase — useful when a turn of expression feels idiomatic and you want to know whether it is.',
      },
      {
        heading: 'A caution',
        body: 'A parallel is not a source. That two texts share wording may mean dependence, a common tradition, or simply that both are writing ordinary Greek about a common subject. The apparatus finds candidates; the argument is still yours.',
      },
    ],
  },

  {
    id: 'exegesis:allusions',
    hebrew: {
      lede: 'Hunt the Hebrew Bible\u2019s reuse of itself, with the evidence weighed in front of you.',
      sections: [
        {
          heading: 'Inner-biblical allusion',
          body: 'Scripture quotes Scripture long before the New Testament does: the grace formula of Exodus 34 echoes through the Prophets and Psalms, Genesis 1 stands behind Psalm 8. Tap the loaded words of your passage and the search ranks the rest of the Hebrew Bible by how strongly it shares them.',
        },
        {
          heading: 'Rarity is the argument',
          body: 'Sharing a common word proves nothing; sharing a rare one, or a rare pair in sequence, is evidence. The dotted words are the rare ones, and the search weighs matches accordingly — the same method used for New Testament allusions to the Septuagint, pointed at the Hebrew.',
        },
        {
          heading: 'You make the case',
          body: 'The checklist beside the results walks the standard tests. The app fills in what can be measured; whether the parallel is an allusion, a formula, or a coincidence remains your judgment — which is the skill being practised.',
        },
      ],
    },
    title: 'Exegesis · Allusions',
    lede: 'Hunt for Septuagint allusions behind a New Testament passage, following Allison’s method.',
    sections: [
      {
        heading: 'How to use it',
        body: 'Select the words that feel loaded — or take the suggestion, which picks the ones distinctive enough in the Septuagint to count as evidence — and search. Candidates come back ranked, strongest first.',
      },
      {
        heading: 'Why rarity matters',
        body: 'Sharing a rare word is evidence; sharing a common one is not. The ranking weights each shared word by how rare it is in the Septuagint, and looks for runs of words appearing in the same order, which is what distinguishes a quotation from a coincidence.',
      },
      {
        heading: 'The checklist',
        body: 'Allison’s tests run down the side. The app answers the two it can measure — whether the source is named, and whether words have been transplanted — and leaves the rest to you, because they are judgments about circumstance and structure that no amount of word-counting settles.',
      },
    ],
  },

  {
    id: 'exegesis:rhetoric',
    hebrew: {
      lede: 'The figures at work in a Hebrew passage — including the ones that only Hebrew has.',
      sections: [
        {
          heading: 'Reading the three columns',
          body: 'The pointed Hebrew sits on the left with click-to-parse, the figures found in each verse in the middle, and an explanation on the right with Keil & Delitzsch on that verse underneath. The figures come from Bullinger, who catalogued the whole Bible, not the New Testament only.',
        },
        {
          heading: 'Hebrew poetics',
          body: 'The teal “Poetics & structure” group is where Hebrew verse is actually built: parallelism in Lowth’s three kinds (synonymous, antithetic, synthetic), chiasmus, inclusio, refrain, merism, and acrostic. Several of these — the acrostics above all — leave no trace in an English translation, so a reader who has only the English cannot see them at all.',
        },
        {
          heading: 'What it is for',
          body: 'Naming a figure is not the end of the work, but it is often the start: recognising that a construction is deliberate rather than incidental changes what you think the writer is doing with it.',
        },
      ],
    },
    title: 'Exegesis · Rhetoric',
    lede: 'The figures of speech at work in a passage, with Bengel’s commentary alongside.',
    sections: [
      {
        heading: 'Reading the three columns',
        body: 'The passage sits on the left, the figures identified in it in the middle, and an explanation on the right. The figures follow Bullinger’s classification and are grouped by type, so related devices sit together.',
      },
      {
        heading: 'What it is for',
        body: 'Naming a figure is not the end of the work, but it is often the start: recognising that a construction is deliberate rather than incidental changes what you think the author is doing with it.',
      },
    ],
  },

  {
    id: 'exegesis:commentary',
    hebrew: {
      lede: 'The Hebrew on the left, Keil & Delitzsch tracking your place on the right.',
      sections: [
        {
          heading: 'Reading with the commentary',
          body: 'The pointed Hebrew scrolls on the left with click-to-parse; the commentary pane follows whichever verse you are on. For the Old Testament the commentary is Keil & Delitzsch — still the fullest scholarly commentary on the whole Hebrew Bible in the public domain, philological enough to repay reading with the text open.',
        },
        {
          heading: 'Its habits',
          body: 'K&D often treats several verses as one unit, so the note shown for a verse may begin a few verses earlier — and a handful of stretches (genealogies especially) have no verse-by-verse note at all. Clicking a neighbouring verse finds the discussion.',
        },
      ],
    },
    title: 'Exegesis · Commentary',
    lede: 'Public-domain commentary on the open passage.',
    sections: [
      {
        heading: 'Using it',
        body: 'The commentary follows the passage in the box above. Text size and line spacing can be adjusted for longer reading, and the copyright statement for whatever is being shown is in the menu.',
      },
      {
        heading: 'What to expect',
        body: 'These are older works, freely licensed, and they show their age in places. They are most useful for the questions they raise and the parallels they gather, rather than as a settled verdict.',
      },
    ],
  },

  {
    id: 'exegesis:notes',
    title: 'Exegesis · Notes',
    lede: 'Your own notes, attached to the verses they belong to.',
    sections: [
      {
        heading: 'How notes attach',
        body: 'A note belongs to a verse, so it comes back whenever you return to that verse anywhere in the app — the note icons in the Reader and in this workspace are the same notes. Folders keep a long-running project separate from day-to-day reading.',
      },
      {
        heading: 'Reading comfort',
        body: 'Text size and line spacing are adjustable and apply to every note pane at once, so a setting chosen here follows you to the Reader.',
      },
    ],
  },
]

// ── Resolution ───────────────────────────────────────────────────────────────────────────

const BY_ID = new Map(PAGE_GUIDES.map(g => [g.id, g]))

export function guideById(id: string): PageGuide | undefined {
  return BY_ID.get(id)
}

/** Every Exegesis sub-guide, in tab order — the panel offers these as a picker. */
export const EXEGESIS_GUIDE_IDS = PAGE_GUIDES
  .filter(g => g.id.startsWith('exegesis:'))
  .map(g => g.id)

/**
 * Which guide covers the page at this URL. Returns undefined for pages that have no guide
 * (settings, dashboards, marketing) — the trigger hides itself rather than opening an empty
 * panel.
 *
 * Exegesis reads its active tab from the query string, which ExegesisTabs keeps in sync as
 * you switch tabs. It writes that with history.replaceState, so the value is correct whenever
 * the panel opens; the panel additionally offers a picker so any tab's guide can be read from
 * any tab.
 */
export function guideForPath(pathname: string, search: string): PageGuide | undefined {
  const path = pathname.replace(/\/+$/, '') || '/'

  if (path === '/tools/register') return BY_ID.get('register')
  if (path.startsWith('/themes')) return BY_ID.get('themes')
  if (path.startsWith('/map')) return BY_ID.get('map')
  if (path.startsWith('/notes')) return BY_ID.get('notes')
  if (path === '/search/construct') return BY_ID.get('construct')
  if (path.startsWith('/search')) return BY_ID.get('search')
  if (path.startsWith('/reader')) return BY_ID.get('reader')
  if (path.startsWith('/grammar')) return BY_ID.get('grammar')
  if (path.startsWith('/vocab')) return BY_ID.get('vocab')
  if (path.startsWith('/texts')) return BY_ID.get('texts')

  if (path.startsWith('/exegesis')) {
    const tab = new URLSearchParams(search).get('tab')
    return (tab && BY_ID.get(`exegesis:${tab}`)) || BY_ID.get('exegesis')
  }
  return undefined
}
