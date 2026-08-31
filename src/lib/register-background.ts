/**
 * The scholarly background to the Register tool.
 *
 * Authored prose, in one file, for the same reason the page guides are: documentation that
 * happens to be delivered in context. It is longer than a guide because the question it
 * answers is not "how do I use this?" but "what tradition is this measurement standing in,
 * and what does it not settle?" — and a tool that reports a number in the scholarship's own
 * vocabulary owes the reader that.
 *
 * WRITING RULE: name the position and whose it is; mark the contested ones as contested. A
 * student may cite this, so anything stated flatly here has to be safe to repeat.
 */

/**
 * One entry in a section's reading list, in SBL form: author, title, reference.
 *
 * The title is carried apart from the author so it can be italicised without markup, and
 * ancient works are named by their SBL abbreviation — the abbreviation IS the citation form,
 * and a student copying a line out of here should be copying something they can paste into a
 * paper. `href` is set only where this library actually holds the text, so a link always
 * leads to the work itself rather than to a search for it.
 */
export interface Reading {
  author?: string
  /** Italicised. SBL abbreviation for an ancient work, full title for a modern one. */
  title: string
  ref?: string
  href?: string
}

/** A comparison in the Register tool that demonstrates the section's claim. */
export interface TryIt {
  /** Message key for the link's label. */
  key: string
  href: string
}

export interface BackgroundSection {
  id: string
  heading: string
  paragraphs: string[]
  /**
   * Sub-sections, each with its own heading, prose and bullets. Used where one section covers
   * several things a reader wants to look up separately rather than read straight through.
   */
  groups?: { heading: string; paragraphs: string[]; items?: string[] }[]
  /** Works named in the section — a short reading list, not a bibliography. */
  reading?: Reading[]
  /** Claims in this section that the tool can be made to show. */
  tryIt?: TryIt[]
}

export const BACKGROUND_LEDE =
  'Register — the level and texture of a text’s language — has been described for Greek in three '
  + 'traditions that rarely cite one another: the ancient critics writing about their own '
  + 'language, the modern historical linguistics of Koine, and register theory proper as it came '
  + 'into biblical studies from Halliday. This tool measures things all three care about. What '
  + 'follows is where its two named axes come from, and what they cannot settle.'

export const BACKGROUND: BackgroundSection[] = [
  {
    id: 'labels',
    heading: 'Different Forms of Greek',
    paragraphs: [
      'Three of the labels on this page name different kinds of thing, and sorting them out '
      + 'first makes the rest readable: one is a PERIOD, one a DIALECT, and one the common '
      + 'language that followed them both. They tangle because Athens’ fourth-century prose '
      + 'became the standard all later Greek was measured against — so the name of a place '
      + 'ended up meaning a level of style.',
    ],
    groups: [
      {
        heading: 'Classical Greek',
        paragraphs: [
          'CLASSICAL is a period: roughly the fifth and fourth centuries BC, the two centuries '
          + 'before Alexander. The prose of those two centuries makes up this library’s '
          + '"Classical" pool — Athenian oratory above all, with Plato, Xenophon, Thucydides '
          + 'and Aristotle, and Herodotus writing Ionic alongside them.',
          'Its signature is texture, and texture is what this tool counts. Clauses fold '
          + 'inside one another rather than lying end to end. The optative, a whole verbal mood '
          + 'for wishes and possibilities (γένοιτο, "may it come to pass"), is in daily use. A '
          + 'repertoire of small steering particles tells the reader how each clause leans. '
          + 'When Luke opens Ἐπειδήπερ πολλοὶ ἐπεχείρησαν ἀνατάξασθαι διήγησιν, "Inasmuch as '
          + 'many have undertaken to compile a narrative" (Luke 1:1), he is writing that '
          + 'architecture deliberately, four centuries after it was ordinary.',
        ],
        items: [
          'fold clauses inside one another — participles, infinitives, ὅτι- and ἵνα-clauses '
          + 'carry 57% of its clause links, against 43% in the Koine average',
          'steer every clause with particles — μέν … δέ, "on the one hand … on the other"; δή, '
          + '"indeed"; γε, "at least": 28.7 per 1,000 words against Koine’s 5.3. Plato’s '
          + '_Gorgias_ uses bare γε 149 times; Mark, never',
          'keep the optative in daily use — 7.4 per 1,000 words against 1.4',
          'reach for the infinitive — 46.5 per 1,000 words against Koine’s 18.4: βούλομαι '
          + 'λέγειν, "I wish to speak", where later Greek begins to say θέλω ἵνα, "I want '
          + 'that …"',
        ],
      },
      {
        heading: 'Attic Greek',
        paragraphs: [
          'ATTIC is a dialect, not a period: the Greek of Athens, one local variety among many. '
          + 'Alongside it stood IONIC, the dialect of Herodotus, close enough that the two '
          + 'together make up the Classical pool here. Attic’s shibboleth is a sound — ττ where '
          + 'other Greek writes σσ: θάλαττα against θάλασσα, "sea".',
          'These are habits, not walls, and the library itself shows the seams. Thucydides, an '
          + 'Athenian writing at the height of the classical period, uses θάλασσα throughout — '
          + 'his generation of Attic kept the older spelling. Plutarch, writing under Roman '
          + 'emperors, reaches for θάλαττα again and again, because by his day the Attic form '
          + 'had become a mark of cultivation. That is ATTICISM: a choice about register made '
          + 'centuries later, and the reason this tool’s second axis reports a direction — '
          + 'toward the Classical average or the Koine one — rather than presuming to read off '
          + 'a date.',
        ],
        items: [
          'writes ττ where other Greek writes σσ — θάλαττα for θάλασσα, "sea": the New '
          + 'Testament has θάλασσα 48 times and θάλαττα never, while Plutarch, Atticizing '
          + 'under Rome, writes θάλαττα 171 times',
          'in its older layer, writes ξύν for σύν, "with" — Thucydides has ξυν- forms more '
          + 'than 600 times; the New Testament, never',
        ],
      },
      {
        heading: 'Koine Greek',
        paragraphs: [
          'KOINE (ἡ κοινὴ διάλεκτος, "the common dialect") is what came next. When Alexander’s '
          + 'conquests made Greek the working language from Egypt to the Indus, the dialects '
          + 'levelled into one shared tongue, built mostly on Attic, written by everyone from '
          + 'an Alexandrian clerk to Paul of Tarsus.',
          'It is the same language made plainer, more regular, more explicit. Where classical '
          + 'prose subordinates, Koine strings its clauses on καί, "and". The optative dwindles '
          + 'to a fossil, and Paul’s μὴ γένοιτο, "may it never be!", is nearly all of it that '
          + 'survives in his letters. The particles thin to a handful, ἵνα spreads into places '
          + 'the infinitive used to hold, and the New Testament writes θάλασσα every time — '
          + 'θάλαττα, never.',
        ],
        items: [
          'string its clauses on καί, "and" — 75.9 per 1,000 words against Classical prose’s '
          + '52.2; Septuagintal narrative opens καὶ ἐγένετο, "and it came to pass", 57 times '
          + 'in Genesis alone',
          'send ἵνα into the infinitive’s territory — θέλω ἵνα δῷς μοι, "I want you to give '
          + 'me" (Mark 6:25): ἵνα runs 2.6 per 1,000 words against the Classical 0.8',
          'let the optative fossilize — 1.4 per 1,000 words, in Paul mostly the set phrase μὴ '
          + 'γένοιτο, "may it never be!" (ten times in Romans)',
          'thin the particles to δέ, γάρ and οὖν — the literary set τε, μέν, δή, γε falls to '
          + '5.3 per 1,000 words',
          'lean on the aorist as the workhorse narrative tense — 75.8 per 1,000 words against '
          + '55.9',
        ],
      },
    ],
  },
  {
    id: 'ancients',
    heading: 'The ancient critics had names for this',
    paragraphs: [
      'The distinction the tool measures as PERIODICITY is Aristotle’s. In _Rhet._ 3.9 he '
      + 'separates λέξις εἰρομένη — "strung-on" style, whose clauses are simply added one after '
      + 'another and which he says has no end in itself but stops when the subject stops — from '
      + 'λέξις κατεστραμμένη, the periodic style, whose clauses are folded into a whole that can '
      + 'be held in the mind at once. He thought the first archaic and the second an improvement. '
      + 'Whatever one makes of that judgement, the distinction is real and countable: it is the '
      + 'difference between joining clauses with καί and embedding them as participles, '
      + 'infinitives and ὅτι-clauses.',
      'Later critics multiplied the categories. Demetrius (_Eloc._) works with four χαρακτῆρες '
      + '— plain, grand, elegant and forceful. Dionysius of Halicarnassus (_Comp._) gives three '
      + 'ἁρμονίαι: austere, polished, and a blend of the two. Latin rhetoric’s three _genera '
      + 'dicendi_ — Quintilian sets them out at _Inst._ 12.10 — is the same instinct in another '
      + 'language. None of these is a taxonomy a computer can apply, because each depends on '
      + 'judgements about sound and effect. Aristotle’s is the exception, and that is why it is '
      + 'the one implemented here.',
      'Two further ancient labels matter for the other axis. ATTICISM was the movement, gathering '
      + 'from the first century BC, that held the Attic prose of the fourth century to be the only '
      + 'proper Greek and set out to write it again. ASIANISM was what its partisans called the '
      + 'ornate contemporary style they were reacting against. An imperial author writing Attic is '
      + 'making a choice about register, not exhibiting a date — which is exactly why this tool '
      + 'labels its second axis by direction rather than by period.',
    ],
    reading: [
      { author: 'Aristotle', title: 'Rhet.', ref: '3.9', href: '/texts?work=aristotle-rhetoric' },
      { author: 'Demetrius', title: 'Eloc.' },
      { author: 'Dionysius of Halicarnassus', title: 'Comp.' },
      { author: 'Quintilian', title: 'Inst.', ref: '12.10', href: '/texts?work=quintilian-12' },
    ],
  },
  {
    id: 'koine',
    heading: 'The modern description of Koine',
    paragraphs: [
      'Historical linguistics describes post-classical Greek as a range rather than a single '
      + 'thing, usually running from an Atticizing literary extreme (Lucian, Philostratus, Dio '
      + 'Chrysostom) through literary Koine (Polybius, Strabo, Plutarch, Josephus, Philo) to the '
      + 'documentary Greek of the papyri and, below that, writing that is simply substandard. '
      + 'Geoffrey Horrocks’s _Greek: A History of the Language and its Speakers_ is the usual '
      + 'reference for the whole sweep.',
      'The Septuagint is treated as its own case, because it is translation. A substantial '
      + 'literature on "translation technique" — Tov, Aejmelaeus, Sollamo and others — asks how '
      + 'far each translator followed the Hebrew clause for clause, and the answer varies book by '
      + 'book. That variation is visible in this tool: Genesis is the most paratactic text in the '
      + 'library, which is what rendering Hebrew narrative clause for clause produces.',
      'Imitation of that translated Greek is called SEPTUAGINTALISM, and it is a register choice '
      + 'made by writers who were perfectly able to write otherwise. Luke is the standard example, '
      + 'and it is the clearest thing this tool shows: compare Luke 1–2 with Luke 3–24 and the '
      + 'infancy narrative ranks with 1 Kingdoms, Judith and Tobit while the rest of the Gospel '
      + 'ranks with Matthew, Mark and Acts.',
    ],
    reading: [
      { author: 'Geoffrey Horrocks', title: 'Greek: A History of the Language and its Speakers' },
      { author: 'Anneli Aejmelaeus', title: 'On the Trail of the Septuagint Translators' },
      { author: 'John A. L. Lee', title: 'A Lexical Study of the Septuagint Version of the Pentateuch' },
    ],
    tryIt: [
      { key: 'reg.bg.try.lukeInfancy', href: '/tools/register?ref=Luke+1-2' },
      { key: 'reg.bg.try.lukeRest', href: '/tools/register?ref=Luke+3-24' },
      { key: 'reg.bg.try.genesis', href: '/tools/register?ref=Genesis&lens=syntax' },
    ],
  },
  {
    id: 'nt',
    heading: 'The New Testament on that scale',
    paragraphs: [
      'Since Blass it has been conventional to rank the New Testament books on a literary '
      + 'continuum: Hebrews and Luke–Acts at the literary end — the preface of Luke, 1:1–4, being '
      + 'the single most classicizing sentence in the collection — with James and 1 Peter high, '
      + 'Paul in the middle, and Mark, John and Revelation at the plainer or more Semitized end. '
      + 'The tool reproduces that ordering on periodicity without being told it: Revelation '
      + 'lowest, then Mark, then Matthew and Luke, with Acts above the Gospel of Luke, and '
      + 'Hebrews and 1 Peter at the top.',
      'SEMITISM is the standard label for features attributed to Hebrew or Aramaic influence, '
      + 'subdivided into Hebraism and Aramaism, and further into interference (a bilingual writing '
      + 'Greek) and translation (a text rendered from a Semitic original). The categories are '
      + 'useful; the attribution of any particular feature to one of them is usually arguable.',
      'One older position is now largely abandoned and worth knowing about, because the '
      + 'secondary literature is full of it. Through the nineteenth century biblical Greek was '
      + 'often treated as a distinct dialect — a special language of Scripture, memorably '
      + 'dismissed as "the Greek of the Holy Ghost". Adolf Deissmann’s work on the papyri from the '
      + '1890s showed that a great deal of what had been thought peculiar to the New Testament was '
      + 'ordinary in the documentary Greek of the period. The strongest twentieth-century '
      + 'restatement of the older view was Nigel Turner’s, in the fourth volume of the '
      + 'Moulton grammar; it has not persuaded most subsequent scholarship. What survives is '
      + '"Semitizing register" — a way of writing — rather than "Jewish Greek", a separate tongue.',
    ],
    reading: [
      { author: 'F. Blass and A. Debrunner', title: 'A Greek Grammar of the New Testament and Other Early Christian Literature' },
      { author: 'Adolf Deissmann', title: 'Light from the Ancient East' },
      { author: 'Chrys C. Caragounis', title: 'The Development of Greek and the New Testament' },
    ],
    tryIt: [
      { key: 'reg.bg.try.hebrews', href: '/tools/register?ref=Hebrews&lens=syntax' },
      { key: 'reg.bg.try.mark', href: '/tools/register?ref=Mark&lens=syntax' },
      { key: 'reg.bg.try.revelation', href: '/tools/register?ref=Revelation&lens=syntax' },
    ],
  },
  {
    id: 'register-theory',
    heading: 'Register in the technical sense',
    paragraphs: [
      'The word "register" as a term of art comes from M. A. K. Halliday, for whom it is the '
      + 'configuration of language that a situation calls forth, analysed as field (what is going '
      + 'on), tenor (who is involved and how they stand to one another) and mode (the part '
      + 'language is playing). It entered New Testament study chiefly through Stanley Porter, and '
      + 'through discourse-analytical work such as Jeffrey Reed’s on Philippians.',
      'On that definition register is a property of the SITUATION, and what a text exhibits are '
      + 'its linguistic realizations. This tool measures the realizations. It cannot see the '
      + 'situation, and it should not be read as though it could: two texts scoring alike here '
      + 'have been shown to share habits of construction, which is evidence about register and '
      + 'not a description of it.',
    ],
    reading: [
      { author: 'M. A. K. Halliday and Ruqaiya Hasan', title: 'Language, Context, and Text' },
      { author: 'Stanley E. Porter', title: 'Studies in the Greek New Testament' },
      { author: 'Jeffrey T. Reed', title: 'A Discourse Analysis of Philippians' },
    ],
  },
  {
    id: 'axes',
    heading: 'What the two axes actually do',
    paragraphs: [
      'PERIODICITY is the share of clause-linking done by subordination rather than coordination: '
      + 'participles, infinitives, ὅτι and ἵνα against καί and δέ. It is a proportion, so length '
      + 'does not enter it. The obvious objection is that καί coordinates nouns as well as '
      + 'clauses and is therefore overcounted; that is true, and it shifts every text in the same '
      + 'direction, leaving the ordering — which is what anyone reads this for — intact.',
      'CLASSICAL LEAN places a text on the line between the average Classical profile and the '
      + 'average Koine one, by projecting its word-frequency profile onto the axis between those '
      + 'two centres. +1 is the Classical average and −1 the Koine average; a text can fall '
      + 'outside both.',
      'It is not called Atticism, and two results are the reason. The Classical pool in this '
      + 'library is 123 forensic speeches against two histories, so the axis really measures '
      + 'distance from Attic ORATORY: Thucydides, idiosyncratic by any standard, scores well below '
      + 'Plato on it. And it disagrees with periodicity. Hebrews and 1 Peter are the most periodic '
      + 'books in the New Testament and yet lean further from Attic than John does, because they '
      + 'build their sentences elaborately out of Septuagintal vocabulary. A text can be '
      + 'rhetorically wrought in thoroughly Koine words, and a label reading "Atticism" would have '
      + 'hidden that behind a claim the number cannot support.',
      'Neither axis settles anything about authorship, date or dependence. They are descriptions '
      + 'of how a text is built, offered in the vocabulary the argument has always used, so that '
      + 'an impression — "Hebrews is more literary than Mark" — can be checked against something '
      + 'countable, and so that the places where the count disagrees with the impression become '
      + 'visible instead of staying invisible.',
    ],
  },
]
