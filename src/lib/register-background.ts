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

export interface BackgroundSection {
  id: string
  heading: string
  paragraphs: string[]
  /** Works named in the section — displayed as a short reading list, not a bibliography. */
  reading?: string[]
}

export const BACKGROUND_LEDE =
  'Register — the level and texture of a text’s language — has been described for Greek in three '
  + 'traditions that rarely cite one another: the ancient critics writing about their own '
  + 'language, the modern historical linguistics of Koine, and register theory proper as it came '
  + 'into biblical studies from Halliday. This tool measures things all three care about. What '
  + 'follows is where its two named axes come from, and what they cannot settle.'

export const BACKGROUND: BackgroundSection[] = [
  {
    id: 'ancients',
    heading: 'The ancient critics had names for this',
    paragraphs: [
      'The distinction the tool measures as PERIODICITY is Aristotle’s. In Rhetoric 3.9 he '
      + 'separates λέξις εἰρομένη — "strung-on" style, whose clauses are simply added one after '
      + 'another and which he says has no end in itself but stops when the subject stops — from '
      + 'λέξις κατεστραμμένη, the periodic style, whose clauses are folded into a whole that can '
      + 'be held in the mind at once. He thought the first archaic and the second an improvement. '
      + 'Whatever one makes of that judgement, the distinction is real and countable: it is the '
      + 'difference between joining clauses with καί and embedding them as participles, '
      + 'infinitives and ὅτι-clauses.',
      'Later critics multiplied the categories. Demetrius (On Style) works with four χαρακτῆρες '
      + '— plain, grand, elegant and forceful. Dionysius of Halicarnassus (On Literary '
      + 'Composition) gives three ἁρμονίαι: austere, polished, and a blend of the two. Latin '
      + 'rhetoric’s three genera dicendi — grand, middle, plain — is the same instinct in another '
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
      'Aristotle, Rhetoric 3.9',
      'Demetrius, On Style',
      'Dionysius of Halicarnassus, On Literary Composition',
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
      + 'Geoffrey Horrocks’s Greek: A History of the Language and its Speakers is the usual '
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
      'Geoffrey Horrocks, Greek: A History of the Language and its Speakers',
      'Anneli Aejmelaeus, On the Trail of the Septuagint Translators',
      'John A. L. Lee, A Lexical Study of the Septuagint Version of the Pentateuch',
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
      'F. Blass and A. Debrunner, A Greek Grammar of the New Testament (tr. Funk)',
      'Adolf Deissmann, Light from the Ancient East',
      'Chrys C. Caragounis, The Development of Greek and the New Testament',
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
      'M. A. K. Halliday and Ruqaiya Hasan, Language, Context, and Text',
      'Stanley E. Porter, Studies in the Greek New Testament',
      'Jeffrey T. Reed, A Discourse Analysis of Philippians',
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
      + 'outside both. Measuring the distance to each centre separately was tried first and is '
      + 'useless — in 150 dimensions everything is far from every average, and Lucian and Genesis '
      + 'came out indistinguishable.',
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
