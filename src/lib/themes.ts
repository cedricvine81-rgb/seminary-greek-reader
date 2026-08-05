// The Theology page's curated content. Retrieval (scripts/build-themes.ts) decides what is
// POSSIBLE to cite; this file decides what is WORTH citing, and says what each passage says.
//
// Every entry carries a `probe`: an exact phrase from the passage. It does two jobs. It is what
// the side pane searches for, so a click lands on the passage itself rather than a topic search;
// and it is the build-time proof that the citation is real — `npx tsx scripts/build-themes.ts
// resurrection --check` fails if a probe matches no passage, or matches one at a different
// address. A citation here therefore cannot drift out of true silently when a corpus is rebuilt.
//
// PROBES MUST BE COPIED, NOT TYPED. The sources use straight apostrophes ("swine's flesh"); an
// editor and a careless hand both produce curly ones, and the probe then matches nothing. This
// has cost two build failures already — Sabbath and Purity. When a probe spans an apostrophe,
// either paste the exact bytes or choose a span that avoids it. --check catches it every time,
// which is the point, but it is cheaper not to write it.
//
// Summaries are SIX OR SEVEN WORDS on purpose. Long enough to say what the passage claims, too
// short to be mistaken for the argument itself — the passage is the evidence, this is only the
// finding aid. They describe what a source says; they do not adjudicate whether it is right.

export interface TraditionMeta {
  id: string
  label: string
  dates: string
  /** One line on what this body of literature is, for a student who has not met it. */
  note: string
}

export const TRADITIONS: TraditionMeta[] = [
  {
    id: 'second-temple',
    label: 'Second Temple Jewish',
    dates: 'c. 300 BCE – 100 CE',
    note: 'Jewish writing between the Testaments and just after — the world the New Testament is written into.',
  },
  {
    id: 'rabbinic',
    label: 'Rabbinic',
    dates: 'c. 200 – 600 CE',
    note: 'Later than the New Testament. Evidence for how Judaism settled, not for what it held in the first century.',
  },
  {
    id: 'apostolic-fathers',
    label: 'Apostolic Fathers',
    dates: 'c. 95 – 150 CE',
    note: 'The earliest Christian writing outside the New Testament, overlapping the last of it.',
  },
  {
    id: 'church-fathers',
    label: 'Later Christian writers',
    dates: 'c. 150 – 400 CE',
    note: 'Christian argument once the questions have hardened into controversy.',
  },
  {
    id: 'greco-roman',
    label: 'Greek and Roman',
    dates: 'c. 400 BCE – 200 CE',
    note: 'The surrounding philosophical world, whose hope for the soul is not the Jewish hope for the body.',
  },
]

export interface TopicEntry {
  /** Catalog work id — resolved to a display name at render time, never stored. */
  work: string
  book?: number
  chapter: number
  verse: number
  tradition: string
  summary: string
  /** Exact phrase from the passage: what the pane searches, and what the build validates. */
  probe: string
  /**
   * The complete citation to show, replacing the usual "<work> <chapter>:<verse>".
   *
   * Only for a named text that sits INSIDE a larger work, where both the standard citation and
   * the address in this library are true and neither alone is usable. The Prayer of Manasseh is
   * the case: everyone cites it "Prayer of Manasseh 7", but it lives here as Odes 12:7, because
   * that is where the Septuagint manuscripts put it. Rendering the address would name a work the
   * reader does not recognise; rendering the standard citation as "Prayer of Manasseh 12:7"
   * would invent a chapter 12 of a fifteen-verse prayer.
   *
   * `work`/`chapter`/`verse` are untouched, so the link and --check still use the real address.
   */
  citeAs?: string
}

/** Sidebar sections, in reading order — roughly the order a systematic theology would take. */
export const THEME_GROUPS = [
  'God and the unseen',
  'Christ',
  'Sin and salvation',
  'Law and practice',
  'People and power',
  'Temple and community',
  'Last things',
] as const

export interface TopicPage {
  id: string
  label: string
  /** Which sidebar section this sits under. */
  group: (typeof THEME_GROUPS)[number]
  blurb: string
  /** What the sources do NOT say — as much a finding as what they do. */
  absences: string[]
  /** Canonical anchors the reader should have in mind; not in this corpus, so not linked. */
  canonicalAnchors: string
  entries: TopicEntry[]
}

export const THEME_PAGES: TopicPage[] = [
  {
    id: 'godhead',
    group: 'God and the unseen',
    label: 'God, and whether God is one',
    blurb:
      'Everyone here says God is one. They do not agree on what that rules out. Aristeas has a Jewish '
      + 'courtier tell the king that Greeks worship the same God under the name of Zeus; Josephus, on '
      + 'the same shelf, mocks the Greek gods as smiths and weavers. And the oneness has seams in it '
      + 'from the start: Philo finds two powers in it, the Targum puts the Word inside the very verse '
      + 'that denies any other God, and the Yerushalmi silences a prayer for implying two. Justin then '
      + 'says out loud what that liturgy was silencing — “another God and Lord”, subordinate to the '
      + 'Maker. Nothing here is yet a doctrine of the Trinity; that page is separate.',
    canonicalAnchors:
      'The anchors are Deuteronomy 6:4 (“Hear, O Israel: the LORD our God, the LORD is one”), '
      + 'Deuteronomy 32:39 and Isaiah 45:5–7. They are canonical and sit outside this corpus, but the '
      + 'Targums below are translating them, and almost everything else is arguing from them.',
    absences: [
      'The classic rabbinic discussion of “two powers in heaven” is in the Babylonian Talmud, at '
      + 'Sanhedrin 38b — where the angel Metatron is the problem — and Ḥagigah 14a. The Bavli is in '
      + 'this library and those pages are there, but in Aramaic only: the available English '
      + 'translation is licensed non-commercially and this app cannot use it. So they can be read '
      + 'in Texts by someone who reads Aramaic, and they are invisible to this page and to search, '
      + 'both of which are built from the English. What is left here is the Yerushalmi ruling below, '
      + 'where a prayer is silenced and the reason given runs to two words.',
      'Nobody on this page argues the other side in their own voice. Irenaeus is refuting people who '
      + 'held that the world was made by a lesser god than the Father, and he is the only reason we '
      + 'know what they said: no Marcionite or Valentinian text is in this library, and none was ever '
      + 'copied by the church that kept these manuscripts. Every two-gods position here is quoted by '
      + 'its opponent.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // Aristeas and Josephus are the poles. Both are Jewish, both are addressing Greeks, and they
      // take opposite views of whether the Greek gods are the same God misnamed or no gods at all.
      { work: 'sibylline', chapter: 3, verse: 12, tradition: 'second-temple',
        summary: 'God is one: sovereign, ineffable, dwelling in heaven',
        probe: 'Of the immortal Maker? God is one' },
      { work: 'aristeas', chapter: 1, verse: 15, tradition: 'second-temple',
        summary: 'Greeks worship the same God, calling him Zeus',
        probe: 'They worship the same God' },
      { work: 'against-apion', book: 2, chapter: 1, verse: 242, tradition: 'second-temple',
        summary: 'Gods who are smiths, weavers, warriors, harpers',
        probe: 'that one god is a smith, and another goddess is a weaver' },
      { work: '4Macc', chapter: 5, verse: 24, tradition: 'second-temple',
        summary: 'The law teaches worship of one only God',
        probe: 'we worship the one only God becomingly' },
      { work: 'antiquities', book: 3, chapter: 5, verse: 91, tradition: 'second-temple',
        summary: 'First commandment: one God, worship him only',
        probe: 'there is but one God, and that we ought to worship him only' },
      { work: 'against-apion', book: 2, chapter: 1, verse: 193, tradition: 'second-temple',
        summary: 'One temple for one God, common to all',
        probe: 'There ought also to be but one temple for one God' },
      { work: '2enoch', chapter: 33, verse: 9, tradition: 'second-temple',
        summary: 'Creator of all things; no other God',
        probe: 'how there is no other God but me' },
      { work: 'philo-flight', chapter: 1, verse: 71, tradition: 'second-temple',
        summary: '“Let us make man” — plural speech, single Creator',
        probe: 'as if speaking to several persons' },
      { work: 'philo-abraham', chapter: 1, verse: 145, tradition: 'second-temple',
        summary: 'Two powers in God: beneficent and chastising',
        probe: 'of the two powers of God, one is a beneficent power' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'tg-psj-deuteronomy', chapter: 26, verse: 17, tradition: 'rabbinic',
        summary: 'Israel confesses the Lord with one confession',
        probe: 'The Lord have you confessed with one confession' },
      { work: 'tg-psj-deuteronomy', chapter: 32, verse: 39, tradition: 'rabbinic',
        summary: 'No other God beside me — I, in my Word',
        probe: 'there is no other God beside Me: I, in My Word' },
      { work: 'y-megillah', chapter: 4, verse: 10, tradition: 'rabbinic',
        summary: 'A prayer silenced: it implies two powers',
        probe: 'may the good ones bless You, is the way of heretics' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-1clement', chapter: 46, verse: 6, tradition: 'apostolic-fathers',
        summary: 'One God, one Christ, one Spirit of grace',
        probe: 'Have we not one God and one Christ and one Spirit' },
      { work: 'af-2clement', chapter: 20, verse: 5, tradition: 'apostolic-fathers',
        summary: 'To the only God invisible, Father of truth',
        probe: 'To the only God invisible, the Father of truth' },
      { work: 'af-ign-magnesians', chapter: 8, verse: 2, tradition: 'apostolic-fathers',
        summary: 'One God, manifested through his Son, his Word',
        probe: 'there is one God who manifested Himself through Jesus Christ His Son' },
      { work: 'af-ign-ephesians', chapter: 7, verse: 2, tradition: 'apostolic-fathers',
        summary: 'One physician: generate and ingenerate, God in man',
        probe: 'generate and ingenerate, God in man' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      // Justin says plainly what the Yerushalmi ruling above was closing off, and he says it TO a
      // Jew, in a dialogue. Whether "another God and Lord subject to the Maker" is compatible with
      // Deuteronomy 6:4 is precisely what is being argued, and neither side here concedes.
      { work: 'justin-dialogue', chapter: 56, verse: 3, tradition: 'church-fathers',
        summary: 'Another God and Lord, subject to the Maker',
        probe: 'another God and Lord subject to the Maker of all things' },
      { work: 'anf-irenaeus-1', chapter: 22, verse: 1, tradition: 'church-fathers',
        summary: 'Rule of truth: one God, making by his Word',
        probe: 'there is one God Almighty, who made all things by His Word' },
      { work: 'anf-irenaeus-4', chapter: 32, verse: 1, tradition: 'church-fathers',
        summary: 'Both testaments come from one and the same God',
        probe: 'proving that both were truly from one and the same God' },
      { work: 'athanasius-arians-3', chapter: 4, verse: 1, tradition: 'church-fathers',
        summary: 'Identity of Godhead, unity of essence, two persons',
        probe: 'the identity of Godhead and the unity of Essence' },
      // ── Greek and Roman ──────────────────────────────────────────────────────────────
      // Word for word, the Stoic and Plutarchan claim is Aristeas' claim: one god, many names. It
      // is not the same religion. Neither of these excludes the temples, and that is the difference
      // the Jewish sources above are all insisting on.
      { work: 'greco-diogenes-laertius', chapter: 7, verse: 135, tradition: 'greco-roman',
        summary: 'God one with Reason, Fate and Zeus',
        probe: 'God is one and the same with Reason, Fate, and Zeus' },
      { work: 'plutarch-isis-osiris', chapter: 67, verse: 1, tradition: 'greco-roman',
        summary: 'One ordering reason, named differently by each nation',
        probe: 'have different names in different nations' },
    ],
  },
  {
    id: 'trinity',
    group: 'God and the unseen',
    label: 'Father, Son and Spirit',
    blurb:
      'Triadic language before the creeds. Read in order, these passages show a formula arriving '
      + 'long before a doctrine: the Didache and 1 Clement name the three and explain nothing, '
      + 'Justin ranks them — and puts the angels in the list, between the Son and the Spirit — and '
      + 'only with Athanasius does the vocabulary of essence and origin appear. What almost nobody '
      + 'here does is claim the three are one God in the sense Nicaea will mean; that is being '
      + 'worked out, in public, against opponents.',
    canonicalAnchors:
      'The anchors are Matthew 28:19 (“baptising them in the name of the Father and of the Son and '
      + 'of the Holy Spirit”), 2 Corinthians 13:14 and 1 Corinthians 12:4–6. They are canonical and '
      + 'sit outside this corpus, and the Didache below is quoting the first of them almost word for '
      + 'word — which is the point: what the earliest writers have is that sentence, not a theory '
      + 'about it.',
    absences: [
      'There is no Jewish or rabbinic material on this page, and that is a result rather than a gap '
      + 'in the search. Querying this corpus for triadic language returns plenty of Second Temple '
      + 'and rabbinic hits, and every one of them is counting to three about something else — a '
      + 'threefold table in Josephus, three men who may say grace together in the Mishnah, Philo on '
      + 'the properties of the number three. The single passage below is the closest thing the '
      + 'Jewish sources hold, and it is a prayer about how anyone could know God’s counsel, not a '
      + 'statement about God’s inner life.',
      'The two texts that made this a doctrine are not in this library. Theophilus of Antioch is the '
      + 'first writer known to use the word τριάς of God (To Autolycus 2.15), and Tertullian’s '
      + 'Against Praxeas is the first sustained argument for three persons in one substance — the '
      + 'formula the Latin church kept. Both are public domain and both are simply not here yet.',
      'Nothing here is the Nicene Creed. Athanasius is arguing his way toward it and against Arius, '
      + 'but the conciliar texts themselves — Nicaea in 325, Constantinople in 381 — belong to a '
      + 'genre this library does not collect.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // ONE entry, deliberately. See the first absence: the corpus returns dozens of Jewish "three"
      // passages and they are all arithmetic. This is the only place where God, wisdom and holy
      // spirit act together in a Jewish text, and it is still not a Trinity — wisdom and spirit are
      // what God GIVES and SENDS, which is a claim about revelation, not about God's own being.
      { work: 'Wis', chapter: 9, verse: 17, tradition: 'second-temple',
        summary: 'God gives wisdom and sends his Spirit',
        probe: 'except thou give wisdom, and send thy Holy Spirit from above' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-didache', chapter: 7, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Baptise into Father, Son and Holy Spirit',
        probe: 'baptize in the name of the Father and of the Son and of the Holy Spirit' },
      { work: 'af-1clement', chapter: 58, verse: 2, tradition: 'apostolic-fathers',
        summary: 'An oath sworn by all three together',
        probe: 'as God liveth, and the Lord Jesus Christ liveth, and the Holy Spirit' },
      { work: 'af-ign-magnesians', chapter: 13, verse: 1, tradition: 'apostolic-fathers',
        summary: 'In the Son and Father and the Spirit',
        probe: 'in the Son and Father and in the Spirit' },
      { work: 'af-mart-polycarp', chapter: 14, verse: 3, tradition: 'apostolic-fathers',
        summary: 'Dying prayer: glory through, with, and Spirit',
        probe: 'through whom with Him and the Holy Spirit be glory' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      // Justin 6 is the passage that will not fit a later scheme and should not be smoothed over:
      // the list runs Father, Son, "the host of the other good angels", and then the prophetic
      // Spirit. Whatever he means by it, he is not reciting a creed he already has.
      { work: 'justin-1apology', chapter: 6, verse: 1, tradition: 'church-fathers',
        summary: 'Worship of Father, Son, angels, and prophetic Spirit',
        probe: 'the host of the other good angels who follow and are made like to Him' },
      { work: 'justin-1apology', chapter: 61, verse: 1, tradition: 'church-fathers',
        summary: 'Washing in the name of all three',
        probe: 'and of our Saviour Jesus Christ, and of the Holy Spirit' },
      { work: 'origen-celsus-8', chapter: 12, verse: 1, tradition: 'church-fathers',
        summary: 'Celsus: you honour a servant beside God',
        probe: 'they think it no offense against God if they worship also His servant' },
      { work: 'eusebius-pe-11', chapter: 20, verse: 1, tradition: 'church-fathers',
        summary: 'The Spirit ranked third, likened to Plato’s third',
        probe: 'class the Holy Spirit in the third place' },
      { work: 'athanasius-arians-3', chapter: 15, verse: 1, tradition: 'church-fathers',
        summary: 'Not three origins: sun and its radiance',
        probe: 'we do not introduce three Origins or three Fathers' },
      { work: 'athanasius-arians-1', chapter: 6, verse: 1, tradition: 'church-fathers',
        summary: 'Arius: the Word is God in name',
        probe: 'He, as others, is God only in name' },
    ],
  },
  {
    id: 'holy-spirit',
    group: 'God and the unseen',
    label: 'The Spirit of God',
    blurb:
      'The same words cover several different things here, and telling them apart is most of the '
      + 'work. The Spirit seizes a prophet and puts words in his mouth; it also makes a craftsman '
      + 'good at his craft, flees from a dishonest thought, rests on the coming king, and — in one '
      + 'rabbinic ladder — is a rung you climb to. The Targums narrow it deliberately, translating '
      + 'the divine Spirit as the “spirit of prophecy”, a phrase with no Hebrew original. What is '
      + 'hardest to find anywhere before the Christian writers is the Spirit as someone rather than '
      + 'something.',
    canonicalAnchors:
      'The anchors are Numbers 11:25–29, Isaiah 11:2 and 61:1, Joel 2:28–29 and Psalm 51:11. They '
      + 'are canonical and sit outside this corpus; the Targums below are translating two of them, '
      + 'and Barnabas is quoting a third.',
    absences: [
      'The rabbinic statement that everyone quotes — that when the last prophets, Haggai, Zechariah '
      + 'and Malachi, died, the Holy Spirit ceased from Israel — is in this library and cannot be '
      + 'read on this page. It is Tosefta Sotah 13, and the Tosefta is here in Hebrew only: the '
      + 'available English is a partial community translation under a licence this app cannot use. '
      + 'The same sentence recurs in the Babylonian Talmud (Yoma 9b, Sanhedrin 11a), which is here '
      + 'in Aramaic only for the same reason. So the corpus holds the text and this page cannot '
      + 'quote it — which is why nothing below says the Spirit ever stopped.',
      'Qumran is missing, and for this topic that is the largest gap of all. The Community Rule '
      + 'sets out two spirits, of truth and of falsehood, given to every person in measure, and the '
      + 'Thanksgiving Hymns speak of a holy spirit in the speaker himself. No public-domain or '
      + 'openly licensed English of the scrolls exists, so nothing of it is here.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // Note the range this covers, and resist harmonising it. Philo's Bezaleel gets the Holy
      // Spirit in order to do metalwork; Josephus' Balaam is overpowered by it and cannot keep
      // quiet; Wisdom's flees a dishonest thought. These are not three descriptions of one thing.
      { work: 'philo-giants', chapter: 1, verse: 23, tradition: 'second-temple',
        summary: 'Bezaleel filled with the Spirit — for craftsmanship',
        probe: 'filled him with his Holy Spirit, and with wisdom' },
      { work: 'philo-giants', chapter: 1, verse: 19, tradition: 'second-temple',
        summary: 'The Spirit does not remain among the fleshly',
        probe: 'My spirit shall not remain among men for ever' },
      { work: 'antiquities', book: 4, chapter: 6, verse: 119, tradition: 'second-temple',
        summary: 'Balaam: seized, words not his own',
        probe: 'when the Spirit of God seizes upon us' },
      { work: 'Wis', chapter: 1, verse: 5, tradition: 'second-temple',
        summary: 'The holy spirit flees deceit and unrighteousness',
        probe: 'For the holy spirit of discipline will flee deceit' },
      { work: 'Wis', chapter: 9, verse: 17, tradition: 'second-temple',
        summary: 'God’s counsel unknown unless he sends it',
        probe: 'except thou give wisdom, and send thy Holy Spirit from above' },
      { work: 'Sir', chapter: 39, verse: 6, tradition: 'second-temple',
        summary: 'The scribe filled with a spirit of understanding',
        probe: 'he shall be filled with the spirit of understanding' },
      { work: 'Sus', chapter: 1, verse: 45, tradition: 'second-temple',
        summary: 'God raises the holy spirit of a boy',
        probe: 'the Lord raised up the holy spirit of a young youth' },
      { work: 'PsSol', chapter: 17, verse: 37, tradition: 'second-temple',
        summary: 'The coming king made mighty by holy spirit',
        probe: 'God will make him mighty by means of (His) holy spirit' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      // The targumic pattern is measurable rather than impressionistic: across 7,108 verses of
      // Targum in this library, "Holy Spirit" occurs 17 times and "spirit of prophecy" 15 — and
      // the second phrase renders no Hebrew expression. It is the translator's gloss, and it
      // decides what the Spirit is for.
      { work: 'tg-isaiah', chapter: 40, verse: 13, tradition: 'rabbinic',
        summary: 'Who directed the Spirit in the prophets’ mouths?',
        probe: 'Who hath directed the Holy Spirit in the mouth of all the prophets' },
      { work: 'tg-isaiah', chapter: 11, verse: 2, tradition: 'rabbinic',
        summary: 'Spirit of prophecy resting on the branch',
        probe: 'there shall dwell upon him the spirit of prophecy' },
      { work: 'tg-psj-numbers', chapter: 11, verse: 25, tradition: 'rabbinic',
        summary: 'Shared with seventy, and Moses loses nothing',
        probe: 'so that Mosheh lost nothing thereof' },
      { work: 'tg-psj-exodus', chapter: 33, verse: 16, tradition: 'rabbinic',
        summary: 'Withheld from the nations — Israel’s distinguishing mark',
        probe: 'in the withholdment of the Spirit of prophecy from the nations' },
      { work: 'tg-psj-genesis', chapter: 27, verse: 5, tradition: 'rabbinic',
        summary: 'Rebekah overhears by the Holy Spirit',
        probe: 'And Rivekah heard by the Holy Spirit' },
      { work: 'y-sotah', chapter: 5, verse: 4, tradition: 'rabbinic',
        summary: 'At the sea, the least sang like Moses',
        probe: 'Even the most insignificant in Israel sang the song just as Moses did' },
      { work: 'm-sotah', chapter: 9, verse: 15, tradition: 'rabbinic',
        summary: 'A ladder of virtues, the Spirit near the top',
        probe: 'piety leads to the Holy Spirit' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      // Hermas is the interesting one: the Spirit lodges in a person and can be crowded out by a
      // bad temper, which is nearer to Wisdom 1:5 above than to anything creedal — and at 43:9 the
      // agent who fills the prophet is an ANGEL of the prophetic spirit.
      { work: 'af-1clement', chapter: 2, verse: 2, tradition: 'apostolic-fathers',
        summary: 'An abundant outpouring fell upon all',
        probe: 'An abundant outpouring also of the Holy Spirit fell upon all' },
      { work: 'af-barnabas', chapter: 14, verse: 9, tradition: 'apostolic-fathers',
        summary: 'The Spirit is upon me: anointed to preach',
        probe: 'The Spirit of the Lord is upon Me, wherefore He anointed Me' },
      { work: 'af-hermas', chapter: 33, verse: 2, tradition: 'apostolic-fathers',
        summary: 'A bad temper darkens the indwelling Spirit',
        probe: 'not being darkened by another evil spirit' },
      { work: 'af-hermas', chapter: 43, verse: 9, tradition: 'apostolic-fathers',
        summary: 'An angel of the prophetic spirit fills him',
        probe: 'the angel of the prophetic spirit, who is attached to him' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'justin-dialogue', chapter: 88, verse: 1, tradition: 'church-fathers',
        summary: 'Women and men among us hold the gifts',
        probe: 'women and men who possess gifts of the Spirit of God' },
      { work: 'anf-irenaeus-4', chapter: 20, verse: 8, tradition: 'church-fathers',
        summary: 'The Spirit showed the prophets things to come',
        probe: 'the Spirit of God pointed out by the prophets things to come' },
    ],
  },
  {
    id: 'angels',
    group: 'God and the unseen',
    label: 'Angels and the heavenly court',
    blurb:
      'Angels get names, ranks, jobs and a history here that the Hebrew Bible never gives them, and '
      + 'the sources are unembarrassed about where that came from: a rabbi in the Yerushalmi says '
      + 'flatly that the names came up from Babylonia with the exiles. 1 Enoch supplies the story '
      + 'everyone else is reacting to — two hundred of them come down, marry, teach metalwork and '
      + 'cosmetics and astrology, and their dead offspring become the demons. Jubilees sorts the '
      + 'angels into departments on the first day of creation and puts one over every nation except '
      + 'Israel. And in Origen a pagan critic is already asking the awkward question: if you honour '
      + 'these beings, how many gods do you have?',
    canonicalAnchors:
      'The anchors are Genesis 6:1–4, Deuteronomy 32:8 (in the Greek, “according to the number of '
      + 'the angels of God”), Daniel 10 and 12:1, and Isaiah 6. They are canonical and sit outside '
      + 'this corpus; 1 Enoch is expanding the first, Jubilees the second, and Daniel is where '
      + 'Michael and Gabriel get their names in scripture at all.',
    absences: [
      'What you are reading of 1 Enoch is a translation of a translation. The Book of the Watchers '
      + 'was written in Aramaic, was read in Greek by the writers of the New Testament, and survives '
      + 'complete only in Ge‘ez — Ethiopic — from which R. H. Charles made the English below. The '
      + 'Aramaic is fragments from Qumran and the Greek is partial. Where a phrase matters, it is '
      + 'worth remembering how far it has travelled.',
      'The angelic liturgy is missing. The Songs of the Sabbath Sacrifice, from Qumran, are the one '
      + 'text that shows what the heavenly court was imagined to be DOING — priestly angels serving '
      + 'in a heavenly sanctuary, week by week — and no public-domain or openly licensed English of '
      + 'the scrolls exists. Everything below sees angels from the earth looking up.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: '1enoch', chapter: 6, verse: 2, tradition: 'second-temple',
        summary: 'Angels see the daughters of men, descend',
        probe: 'Come, let us choose us wives from among the children of men' },
      { work: '1enoch', chapter: 8, verse: 1, tradition: 'second-temple',
        summary: 'Azazel taught weapons, metals, jewellery, eye-paint',
        probe: 'Azâzêl taught men to make swords, and knives, and shields' },
      { work: '1enoch', chapter: 9, verse: 1, tradition: 'second-temple',
        summary: 'Four archangels look down and see bloodshed',
        probe: 'Michael, Uriel, Raphael, and Gabriel looked down from heaven' },
      { work: '1enoch', chapter: 20, verse: 1, tradition: 'second-temple',
        summary: 'A list: the names of the watching angels',
        probe: 'these are the names of the holy angels who watch' },
      { work: '1enoch', chapter: 15, verse: 8, tradition: 'second-temple',
        summary: 'Dead giants become the evil spirits here',
        probe: 'shall be called evil spirits upon the earth' },
      { work: 'jubilees', chapter: 2, verse: 2, tradition: 'second-temple',
        summary: 'Created day one: angels of fire, wind, cloud',
        probe: 'the angels of the presence, and the angels of sanctification' },
      { work: 'jubilees', chapter: 15, verse: 31, tradition: 'second-temple',
        summary: 'Spirits set over the nations, to mislead them',
        probe: 'over all hath He placed spirits in authority to lead them astray' },
      { work: 'jubilees', chapter: 15, verse: 32, tradition: 'second-temple',
        summary: 'Over Israel no angel: God rules directly',
        probe: 'over Israel He did not appoint any angel or spirit' },
      { work: 'Tob', chapter: 5, verse: 4, tradition: 'second-temple',
        summary: 'Raphael hired as a travelling companion, unrecognised',
        probe: 'he found Raphael that was an angel' },
      { work: 'testament-of-abraham-a', chapter: 10, verse: 1, tradition: 'second-temple',
        summary: 'Michael flies Abraham on a cherub chariot',
        probe: 'took Abraham upon a chariot of the cherubim' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      // Resh Laqish's remark is the most self-aware sentence on this page. He is not denying the
      // angels; he is dating their NAMES, and dating them to the exile.
      { work: 'y-rosh-hashanah', chapter: 1, verse: 2, tradition: 'rabbinic',
        summary: 'The angels’ names came up from Babylonia',
        probe: 'the names of angels were in their hands from Babylonia' },
      { work: 'tg-psj-exodus', chapter: 24, verse: 1, tradition: 'rabbinic',
        summary: 'Michael, Prince of Wisdom, speaks for God',
        probe: 'And Michael, the Prince of Wisdom, said to Mosheh' },
      { work: 'tg-psj-genesis', chapter: 32, verse: 25, tradition: 'rabbinic',
        summary: 'The wrestler argues about an unpaid tithe',
        probe: 'an Angel contended with him in the likeness of a man' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-hermas', chapter: 69, verse: 3, tradition: 'apostolic-fathers',
        summary: 'Michael puts the law in believers’ hearts',
        probe: 'the great and glorious angel is Michael, who hath the power over this people' },
      { work: 'af-ign-trallians', chapter: 5, verse: 2, tradition: 'apostolic-fathers',
        summary: 'He knows the ranks, and claims no standing',
        probe: 'the arrays of the angels and the musterings of the principalities' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'origen-celsus-8', chapter: 13, verse: 1, tradition: 'church-fathers',
        summary: 'Whether Gabriel and Michael may be worshipped',
        probe: 'to Gabriel and Michael, and the other angels and archangels' },
      { work: 'athanasius-arians-3', chapter: 14, verse: 1, tradition: 'church-fathers',
        summary: 'When the Father works, no angel works',
        probe: 'it is not that any Angel works' },
      // ── Greek and Roman ──────────────────────────────────────────────────────────────
      // Same word, different world. Hesiod's watchers are Zeus' inspectors of human justice, and
      // they never fall, never marry, and teach nobody anything. The overlap is the surveillance,
      // not the story.
      { work: 'hesiod-works-and-days', chapter: 2, verse: 250, tradition: 'greco-roman',
        summary: 'Thirty thousand spirits watching mortals’ crooked judgements',
        probe: 'thrice ten thousand spirits, watchers of mortal men' },
    ],
  },
  {
    id: 'satan-evil',
    group: 'God and the unseen',
    label: 'Satan and the origin of evil',
    blurb:
      'Four different answers, and they do not combine. Evil came down from outside, when the '
      + 'watchers fell (1 Enoch, Jubilees). It came from Adam, and we inherit it as a wicked heart '
      + '(4 Ezra). It is a faculty inside each person, the evil inclination, with a good one beside '
      + 'it (the Mishnah, the Testaments). Or it began in envy — the devil was expelled for refusing '
      + 'to bow to Adam, and has hated him since (the Life of Adam and Eve). Sirach rules out the '
      + 'lot of them in two lines: do not say the Lord made you fall. And Celsus, from outside, '
      + 'thinks the whole apparatus is an admission that your God cannot cope.',
    canonicalAnchors:
      'The anchors are Genesis 3, Genesis 6:1–4, Job 1–2, Zechariah 3:1–2 and 1 Chronicles 21:1 — '
      + 'where “Satan” incites David, against 2 Samuel 24:1, where it is the LORD’s own anger. They '
      + 'are canonical and sit outside this corpus. Job is the pattern Jubilees is rewriting below, '
      + 'with Mastema taking the accuser’s part and proposing the sacrifice of Isaac.',
    absences: [
      'The Testament of Solomon is not in this library, and it is the text a student of demonology '
      + 'would want first: a catalogue of individual demons, each interrogated by Solomon, each '
      + 'giving its name, the ailment it causes and the angel who thwarts it. It is public domain in '
      + 'F. C. Conybeare’s 1898 translation and is simply not here yet.',
      'Nothing on this page is a system. Every text below answers the question in passing, while '
      + 'telling a story or ruling on a case, and none of them sets out to reconcile its answer with '
      + 'anyone else’s. The first Christian writer to treat the fall of the devil as a doctrine to '
      + 'be argued rather than a story to be told is Origen in On First Principles — of which this '
      + 'library has only Against Celsus.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // Grouped by ANSWER, not by date: watchers, then inherited heart, then inclination, then
      // envy. Reading them in a block is what shows they are alternatives rather than a sequence.
      { work: 'jubilees', chapter: 10, verse: 6, tradition: 'second-temple',
        summary: 'Mastema bargains to keep a tenth',
        probe: 'let some of them remain before me, and let them harken to my voice' },
      { work: 'jubilees', chapter: 17, verse: 16, tradition: 'second-temple',
        summary: 'Mastema proposes the sacrifice of Isaac',
        probe: 'And the prince Mastema came and said before God' },
      { work: '2enoch', chapter: 31, verse: 4, tradition: 'second-temple',
        summary: 'Satanail thrown out; his intelligence unchanged',
        probe: 'The devil is the evil spirit of the lower places' },
      { work: '1enoch', chapter: 54, verse: 6, tradition: 'second-temple',
        summary: 'The four archangels cast them into the furnace',
        probe: 'cast them on that day into the burning furnace' },
      { work: '2esdras', chapter: 3, verse: 21, tradition: 'second-temple',
        summary: 'Adam’s wicked heart, and all born after',
        probe: 'For the first Adam bearing a wicked heart transgressed' },
      { work: '2esdras', chapter: 7, verse: 118, tradition: 'second-temple',
        summary: 'You sinned, and the evil fell on everyone',
        probe: 'the evil is not fallen on thee alone, but upon all of us' },
      { work: 'tp-asher', chapter: 1, verse: 8, tradition: 'second-temple',
        summary: 'Inclining to the evil inclination, ruled by Beliar',
        probe: 'But if it incline to the evil inclination' },
      { work: 'lae', chapter: 14, verse: 3, tradition: 'second-temple',
        summary: 'I will not worship a younger, inferior being',
        probe: 'I will not worship an inferior and younger being' },
      { work: 'lae', chapter: 12, verse: 1, tradition: 'second-temple',
        summary: 'All my hostility and envy is for you',
        probe: 'all my hostility, envy, and sorrow is for thee' },
      { work: 'Wis', chapter: 2, verse: 24, tradition: 'second-temple',
        summary: 'Death entered the world through the devil’s envy',
        probe: 'through envy of the devil came death into the world' },
      // Sirach is here to be disagreed with. He is the oldest voice on the page and he refuses
      // every externalising answer the others give — including, two verses later, the one about
      // being left in the hand of your own counsel.
      { work: 'Sir', chapter: 15, verse: 11, tradition: 'second-temple',
        summary: 'Do not say the Lord made you fall',
        probe: 'Say not thou, It is through the Lord that I fell away' },
      { work: 'Sir', chapter: 15, verse: 14, tradition: 'second-temple',
        summary: 'Left from the beginning in his own counsel',
        probe: 'left him in the hand of his counsel' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'm-avot', chapter: 2, verse: 11, tradition: 'rabbinic',
        summary: 'Evil eye, evil inclination, hatred: three destroyers',
        probe: 'an evil eye, the evil inclination, and hatred for humankind' },
      { work: 'tg-psj-genesis', chapter: 3, verse: 6, tradition: 'rabbinic',
        summary: 'Eve sees Sammael, the angel of death',
        probe: 'And the woman beheld Sammael, the angel of death' },
      { work: 'tg-psj-leviticus', chapter: 16, verse: 8, tradition: 'rabbinic',
        summary: 'One lot for the Name, one for Azazel',
        probe: 'one lot for the Name of the Lord, and one lot for Azazel' },
      { work: 'm-yoma', chapter: 4, verse: 1, tradition: 'rabbinic',
        summary: 'The urn, the two lots, the goat',
        probe: 'On one was inscribed: “For the Name”, and on the other: “For Azazel.”' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-barnabas', chapter: 18, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Two ways, with angels stationed on each',
        probe: 'on the other the angels of Satan' },
      { work: 'af-ign-ephesians', chapter: 13, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Meeting together throws down Satan’s powers',
        probe: 'the powers of Satan are cast down' },
      { work: 'af-polycarp', chapter: 7, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Denying the cross makes you of the devil',
        probe: 'whosoever shall not confess the testimony of the Cross, is of the devil' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'origen-celsus-6', chapter: 42, verse: 1, tradition: 'church-fathers',
        summary: 'Celsus: an adversary means your God is helpless',
        probe: 'creating an adversary to God , the devil' },
      // ── Greek and Roman ──────────────────────────────────────────────────────────────
      // The Persian scheme Plutarch reports is the nearest thing in the Greek world to what the
      // Jewish texts above are doing, and the difference is exact: Horomazes and Arimanius are two
      // gods of equal standing. Mastema has to ask permission.
      { work: 'plutarch-isis-osiris', chapter: 46, verse: 1, tradition: 'greco-roman',
        summary: 'Zoroaster’s two gods: light against pitchy darkness',
        probe: 'two rival workmen, the one whereof they make to be the maker of good things' },
    ],
  },
  {
    id: 'resurrection',
    group: 'Last things',
    label: 'Resurrection and the afterlife',
    blurb:
      'What happens after death. These sources do not agree, and the disagreement is the point: '
      + 'Greek immortality of the soul and Jewish resurrection of the body are different hopes, '
      + 'several texts hold both at once, and one first-century Jewish party denied any afterlife '
      + 'at all.',
    canonicalAnchors:
      'The canonical anchors are Daniel 12:2 (“many who sleep in the dust of the earth shall awake”) '
      + 'and Isaiah 26:19. They sit outside this corpus, which covers non-canonical sources, but every '
      + 'text below is written with them in view.',
    absences: [
      'No source here describes resurrection as the soul simply surviving death — where the body is '
      + 'not raised, the writers say so plainly (4 Maccabees, Philo), and they are drawing on Greek '
      + 'philosophy when they do.',
      'The Sadducees left no writings. Everything known about their denial comes from people arguing '
      + 'against them: Josephus in Antiquities 18.1.16, cited above, and the New Testament.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: '1enoch', chapter: 22, verse: 2, tradition: 'second-temple',
        summary: 'Four hollow places hold the waiting dead',
        probe: 'four hollow places, deep and wide' },
      { work: '1enoch', chapter: 22, verse: 3, tradition: 'second-temple',
        summary: 'Spirits of the dead separated until judgement',
        probe: 'These hollow places have been created' },
      { work: '1enoch', chapter: 102, verse: 5, tradition: 'second-temple',
        summary: 'Righteous souls descend to Sheol in grief',
        probe: 'your soul into Sheol has descended in grief' },
      { work: '2Macc', chapter: 7, verse: 9, tradition: 'second-temple',
        summary: 'The King of the world will raise us',
        probe: 'the King of the world shall raise us up' },
      { work: '2Macc', chapter: 7, verse: 14, tradition: 'second-temple',
        summary: 'Resurrection hoped for; denied to the persecutor',
        probe: 'to look for hope from God to be raised up again' },
      { work: '2Macc', chapter: 12, verse: 44, tradition: 'second-temple',
        summary: 'Offering for the dead assumes they rise',
        probe: 'if he had not hoped that they that were slain should have risen again' },
      { work: '4Macc', chapter: 14, verse: 6, tradition: 'second-temple',
        summary: 'Martyrs gain immortality, not a raised body',
        probe: 'agreed unto death for religion' },
      { work: '4Macc', chapter: 17, verse: 12, tradition: 'second-temple',
        summary: 'Immortality and eternal life crown endurance',
        probe: 'namely, immortality, eternal life' },
      { work: 'Wis', chapter: 3, verse: 1, tradition: 'second-temple',
        summary: 'Righteous souls rest untormented in God’s hand',
        probe: 'the souls of the righteous are in the hand of God' },
      { work: '2baruch', chapter: 30, verse: 2, tradition: 'second-temple',
        summary: 'All who sleep in hope shall rise',
        probe: 'all who have fallen asleep in hope of Him shall rise again' },
      { work: '2baruch', chapter: 23, verse: 5, tradition: 'second-temple',
        summary: 'Sheol receives the dead until the count completes',
        probe: 'Sheol will receive the dead' },
      { work: '2enoch', chapter: 65, verse: 7, tradition: 'second-temple',
        summary: 'An incorruptible paradise replaces all mortal things',
        probe: 'a paradise bright and incorruptible' },
      { work: 'lae', chapter: 51, verse: 2, tradition: 'second-temple',
        summary: 'The seventh day signs the coming resurrection',
        probe: 'the seventh day is the sign of the resurrection' },
      // Josephus — the three parties, which is the passage a Judaism-and-NT course turns on.
      { work: 'antiquities', book: 18, chapter: 1, verse: 14, tradition: 'second-temple',
        summary: 'Pharisees: souls immortal, the virtuous live again',
        probe: 'souls have an immortal rigor in them' },
      { work: 'antiquities', book: 18, chapter: 1, verse: 16, tradition: 'second-temple',
        summary: 'Sadducees: souls die together with the bodies',
        probe: 'That souls die with the bodies' },
      { work: 'jewish-war', book: 2, chapter: 8, verse: 156, tradition: 'second-temple',
        summary: 'Essenes: immortal souls reach the blessed islands',
        probe: 'allot the islands of the blessed to their brave men' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'm-sanhedrin', chapter: 10, verse: 1, tradition: 'rabbinic',
        summary: 'Denying resurrection forfeits the world to come',
        probe: 'resurrection is not a biblical doctrine' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-1clement', chapter: 24, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Christ raised as firstfruit of the resurrection',
        probe: 'He made the Lord Jesus Christ the firstfruit' },
      { work: 'af-1clement', chapter: 24, verse: 3, tradition: 'apostolic-fathers',
        summary: 'Day following night argues the resurrection pattern',
        probe: 'Day and night show unto us the resurrection' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'anf-irenaeus-5', chapter: 31, verse: 2, tradition: 'church-fathers',
        summary: 'Christ first-begotten from the dead, three days below',
        probe: 'the Lord observed the law of the dead' },
      { work: 'anf-irenaeus-5', chapter: 32, verse: 1, tradition: 'church-fathers',
        summary: 'The resurrection of the just is bodily',
        probe: 'the mystery of the resurrection of the just' },
      { work: 'origen-celsus-6', chapter: 36, verse: 1, tradition: 'church-fathers',
        summary: 'Rejects transmigration while defending bodily resurrection',
        probe: 'death ceases in the world when the sin of the world dies' },
      // ── Greek and Roman ──────────────────────────────────────────────────────────────
      { work: 'greco-diogenes-laertius', chapter: 3, verse: 67, tradition: 'greco-roman',
        summary: 'Plato: the soul transmigrates through many bodies',
        probe: 'the soul is immortal, that by transmigration it puts on many bodies' },
      { work: 'greco-diogenes-laertius', chapter: 8, verse: 4, tradition: 'greco-roman',
        summary: 'Pythagoras claimed memory of former lives',
        probe: 'he had once been Aethalides' },
      { work: 'plutarch-delays-of-divine-vengeance', chapter: 17, verse: 1, tradition: 'greco-roman',
        summary: 'Argues the soul’s immortality from divine justice',
        probe: 'as if the soul were immortal' },
    ],
  },
  {
    id: 'israel',
    group: 'People and power',
    label: 'Israel: people, land and restoration',
    blurb:
      'Who Israel is and what is promised to it. Two arguments run through these texts: the hope '
      + 'that the scattered tribes will be gathered back to the land, and — once Christians are '
      + 'writing — the claim that the covenant has changed hands. The second is stated most '
      + 'bluntly by Barnabas, and it is worth reading him next to Tobit rather than on his own.',
    canonicalAnchors:
      'The anchors are Deuteronomy 30:1–5 (scattering and regathering), Jeremiah 31 (the new '
      + 'covenant), and Ezekiel 37. They are canonical and so sit outside this corpus, but every '
      + 'text below assumes them.',
    absences: [
      'Restoration in these texts is national and territorial: a king, a land, tribes settled on '
      + 'it. None of them describes it as the salvation of individuals out of the world, which is '
      + 'how later Christian readers most often hear the word.',
      'No Second Temple Jewish source here spiritualises the land into a metaphor. That move is '
      + 'Christian and it is late: it appears in this corpus only with Barnabas and Justin.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'Tob', chapter: 13, verse: 3, tradition: 'second-temple',
        summary: 'Scattered among the nations as God’s discipline',
        probe: 'for he hath scattered us among them' },
      { work: 'Tob', chapter: 13, verse: 5, tradition: 'second-temple',
        summary: 'God will gather them from all nations',
        probe: 'will gather us out of all nations' },
      { work: 'Tob', chapter: 14, verse: 5, tradition: 'second-temple',
        summary: 'A second temple, lesser than the first',
        probe: 'bring them again into the land' },
      { work: 'tp-naphtali', chapter: 5, verse: 8, tradition: 'second-temple',
        summary: 'The twelve tribes carried off by empires',
        probe: 'shall possess in captivity the twelve tribes' },
      { work: 'assumption-moses', chapter: 2, verse: 1, tradition: 'second-temple',
        summary: 'The land promised and given to the fathers',
        probe: 'into the land which He determined and promised to give to their fathers' },
      { work: 'pseudo-philo', chapter: 19, verse: 10, tradition: 'second-temple',
        summary: 'The land shown to Moses, promised to Israel',
        probe: 'This is the land which I will give to my people' },
      { work: '2baruch', chapter: 5, verse: 1, tradition: 'second-temple',
        summary: 'God’s own inheritance led away captive',
        probe: 'lead your inheritance into captivity' },
      { work: '2esdras', chapter: 1, verse: 24, tradition: 'second-temple',
        summary: 'God turns from Jacob to other nations',
        probe: 'I will turn me to other nations' },
      { work: 'antiquities', book: 8, chapter: 7, verse: 198, tradition: 'second-temple',
        summary: 'Ten tribes torn from the house of David',
        probe: 'he would give ten tribes to a servant' },
      { work: 'PsSol', chapter: 8, verse: 28, tradition: 'second-temple',
        summary: 'Prayer that God gather Israel’s dispersed',
        probe: 'Gather together the dispersed of Israel' },
      { work: 'PsSol', chapter: 11, verse: 2, tradition: 'second-temple',
        summary: 'Good tidings in Jerusalem: God has visited',
        probe: 'For God hath had pity on Israel in visiting them' },
      { work: 'PsSol', chapter: 17, verse: 26, tradition: 'second-temple',
        summary: 'The king gathers and judges a holy people',
        probe: 'he shall gather together a holy people' },
      { work: 'PsSol', chapter: 17, verse: 28, tradition: 'second-temple',
        summary: 'Tribes resettled; no alien sojourns among them',
        probe: 'divide them according to their tribes upon the land' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'tg-isaiah', chapter: 35, verse: 10, tradition: 'rabbinic',
        summary: 'The redeemed gathered from captivity to Zion',
        probe: 'they shall be gathered from the midst of their captivity' },
      { work: 'tg-isaiah', chapter: 51, verse: 11, tradition: 'rabbinic',
        summary: 'Everlasting joy for those brought back',
        probe: 'shall be gathered together out of their captivity' },
      { work: 'tg-psj-exodus', chapter: 12, verse: 42, tradition: 'rabbinic',
        summary: 'Four nights of redemption written before God',
        probe: 'Four nights are there written in the Book of Memorials' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-1clement', chapter: 8, verse: 4, tradition: 'apostolic-fathers',
        summary: 'Israel called to repent and be forgiven',
        probe: 'Repent ye, O house of Israel' },
      { work: 'af-barnabas', chapter: 4, verse: 7, tradition: 'apostolic-fathers',
        summary: 'The covenant is ours; Israel lost it',
        probe: 'Ours it is; but they lost it in this way for ever' },
      { work: 'af-barnabas', chapter: 4, verse: 8, tradition: 'apostolic-fathers',
        summary: 'Israel forfeited the covenant at the calf',
        probe: 'But they lost it by turning unto idols' },
      { work: 'af-hermas', chapter: 94, verse: 2, tradition: 'apostolic-fathers',
        summary: 'Twelve tribes read as the world’s nations',
        probe: 'These twelve tribes which inhabit the whole world are twelve nations' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'justin-dialogue', chapter: 135, verse: 1, tradition: 'church-fathers',
        summary: 'Christ named Israel; Christians the true race',
        probe: 'the Holy One of Israel, who have made known Israel your King' },
    ],
  },
  {
    id: 'messiah',
    group: 'Christ',
    label: 'Messiah and messianic expectation',
    blurb:
      'What was hoped for, before anyone claimed it had arrived. These sources do not describe one '
      + 'expectation but several: a Davidic king who clears Jerusalem of foreign rule, a priestly '
      + 'figure alongside him, a star, a hidden man revealed at the end — and in 4 Ezra a messiah '
      + 'who reigns four hundred years and then dies. Read them before reading the Gospels, not after.',
    canonicalAnchors:
      'The anchors are Numbers 24:17 (a star out of Jacob), 2 Samuel 7 (the promise to David), '
      + 'Isaiah 11, Psalm 2 and Psalm 110. They are canonical and sit outside this corpus; every '
      + 'text below is working from them.',
    absences: [
      'Nothing here makes the messiah divine, or has him die for sin. 4 Ezra does have him die — '
      + 'but at the close of his reign, as the age ends, and nothing is said to be achieved by it. '
      + 'A student looking for a suffering, atoning messiah in Second Temple Judaism will not find '
      + 'one in this library. Note carefully what that does NOT mean: atoning death itself is here, '
      + 'stated plainly in 4 Maccabees, where the martyrs\u2019 blood is a purification and a '
      + 'propitiation for the nation. The idea existed; it was simply not attached to the messiah. '
      + 'The Atonement page sets those passages out.',
      'The expectation of TWO messiahs, one of Aaron and one of Israel, is known mainly from the '
      + 'Dead Sea Scrolls, which this library does not yet hold. The Testaments of the Twelve '
      + 'Patriarchs — a set of farewell speeches attributed to Jacob\u2019s sons, cited here as '
      + 'Testament of Judah and Testament of Levi \u2014 hint at a priestly figure beside the king '
      + '(Testament of Levi 8:14), but the full picture is missing.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'PsSol', chapter: 17, verse: 21, tradition: 'second-temple',
        summary: 'Raise up their king, the son of David',
        probe: 'raise up unto them their king, the son of David' },
      { work: 'PsSol', chapter: 17, verse: 30, tradition: 'second-temple',
        summary: 'He purges Jerusalem; the nations serve him',
        probe: 'he shall have the heathen nations to serve him under his yoke' },
      { work: 'PsSol', chapter: 17, verse: 32, tradition: 'second-temple',
        summary: 'A righteous king, taught of God, Lord’s anointed',
        probe: 'he (shall be) a righteous king, taught of God' },
      { work: 'PsSol', chapter: 17, verse: 34, tradition: 'second-temple',
        summary: 'The Lord Himself is the messiah’s king',
        probe: 'The Lord Himself is his king' },
      { work: '2esdras', chapter: 7, verse: 28, tradition: 'second-temple',
        summary: 'A messiah revealed, reigning four hundred years',
        probe: 'shall rejoice them that remain four hundred years' },
      { work: '2baruch', chapter: 70, verse: 9, tradition: 'second-temple',
        summary: 'Survivors delivered to God’s servant the Messiah',
        probe: 'delivered into the hands of My servant Messiah' },
      { work: 'tp-judah', chapter: 24, verse: 1, tradition: 'second-temple',
        summary: 'A star arises from Jacob in peace',
        probe: 'shall a star arise to you from Jacob in peace' },
      { work: 'tp-judah', chapter: 24, verse: 6, tradition: 'second-temple',
        summary: 'A rod of righteousness reaching the Gentiles',
        probe: 'shall grow a rod of righteousness to the Gentiles' },
      { work: 'tp-levi', chapter: 8, verse: 14, tradition: 'second-temple',
        summary: 'A king in Judah establishing a new priesthood',
        probe: 'a king shall arise in Judah, and shall establish a new priesthood' },
      { work: 'jewish-war', book: 6, chapter: 5, verse: 312, tradition: 'second-temple',
        summary: 'An ambiguous oracle: a world ruler from Judaea',
        probe: 'one from their country should become governor of the habitable earth' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'tg-isaiah', chapter: 4, verse: 2, tradition: 'rabbinic',
        summary: 'The Messiah of the Lord: joy and glory',
        probe: 'shall the Messiah of the Lord be for joy and for glory' },
      { work: 'tg-isaiah', chapter: 9, verse: 5, tradition: 'rabbinic',
        summary: 'The child of Isaiah 9 read messianically',
        probe: 'The prophet said to the house of David' },
      { work: 'tg-isaiah', chapter: 10, verse: 27, tradition: 'rabbinic',
        summary: 'The nations broken before the Messiah',
        probe: 'the nations shall be broken from before the Messiah' },
      { work: 'tg-isaiah', chapter: 11, verse: 6, tradition: 'rabbinic',
        summary: 'Peace multiplied in the days of Messiah',
        probe: 'In the days of the Messiah of Israel peace shall be multiplied' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-barnabas', chapter: 12, verse: 10, tradition: 'apostolic-fathers',
        summary: 'Denies the messiah is David’s son merely',
        probe: 'Christ is the son of David' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'justin-dialogue', chapter: 49, verse: 1, tradition: 'church-fathers',
        summary: 'Trypho: anointed by election, then became Christ',
        probe: 'to have been anointed by election' },
      { work: 'justin-dialogue', chapter: 52, verse: 1, tradition: 'church-fathers',
        summary: 'Two advents argued from Jacob’s blessing',
        probe: 'there would be two advents of Christ' },
    ],
  },
  {
    id: 'son-of-david',
    group: 'Christ',
    label: 'Son of David',
    blurb:
      'A claim that grew louder as it became less plausible. Sirach states the dynastic principle — '
      + 'the kingship belongs to David’s posterity alone, as the priesthood does to Aaron’s — and '
      + 'Josephus then counts the kings of David’s line and stops. After the exile the only Davidide '
      + 'in office is Zerubbabel. The Psalms of Solomon pray for a son of David precisely because '
      + 'the throne has been taken by people with no right to it; and when the last Hasmonean '
      + 'objects to Herod, he appeals to his own family, not to David’s. Herod then burns the '
      + 'genealogical archives. By the time Christians assert the descent, nobody could have checked '
      + 'it — and Barnabas says it does not matter anyway.',
    canonicalAnchors:
      'The anchors are 2 Samuel 7:12–16 (your throne shall be established for ever), Isaiah 11:1 '
      + '(a shoot from the stump of Jesse), Jeremiah 23:5 and 33:17, and — pulling the other way — '
      + 'Jeremiah 22:24–30, the curse on Jechoniah, which Irenaeus below has to argue around. The '
      + 'two genealogies of Jesus, Matthew 1 and Luke 3, are likewise canonical and sit outside '
      + 'this corpus; Eusebius below is trying to reconcile them.',
    absences: [
      'No text in this library contains an actual Davidic pedigree. Everyone asserts the descent and '
      + 'nobody sets out the line — which is exactly what Eusebius’ report of the burned archives '
      + 'would predict, and it means the claim cannot be tested from any source here. What survives '
      + 'is assertion, an argument about two conflicting lists, and a family of smallholders in '
      + 'Galilee who said yes when an emperor asked them.',
      'The other side of the question is missing. The clearest ancient Jewish arguments AGAINST '
      + 'Jesus’ Davidic descent are quoted only by the Christians answering them — Trypho in Justin '
      + 'concedes the messiah will be Davidic and disputes almost everything else — and no Jewish '
      + 'text in this corpus engages the claim directly.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'Sir', chapter: 45, verse: 25, tradition: 'second-temple',
        summary: 'Kingship to David’s posterity as priesthood to Aaron’s',
        probe: 'the inheritance of the king should be to his posterity alone' },
      { work: 'Sir', chapter: 48, verse: 15, tradition: 'second-temple',
        summary: 'After the exile, a ruler still in David’s house',
        probe: 'there remained a small people, and a ruler in the house of David' },
      { work: '1Esd', chapter: 5, verse: 5, tradition: 'second-temple',
        summary: 'Zerubbabel, of the house of David, returning',
        probe: 'the son of Salathiel, of the house of David' },
      { work: 'PsSol', chapter: 17, verse: 4, tradition: 'second-temple',
        summary: 'God swore David’s kingdom would never fail',
        probe: 'swaredst to him touching his seed that never should his kingdom fail' },
      { work: 'PsSol', chapter: 17, verse: 6, tradition: 'second-temple',
        summary: 'Usurpers laid waste the throne of David',
        probe: 'They laid waste the throne of David in tumultuous arrogance' },
      { work: 'PsSol', chapter: 17, verse: 21, tradition: 'second-temple',
        summary: 'Raise up their king, the son of David',
        probe: 'raise up unto them their king, the son of David' },
      // Josephus closes the dynasty in a sentence, and then reports the objection to Herod — which
      // is NOT that he is not a Davidide. Antigonus wants the throne for the Hasmoneans, his own
      // house, which had no Davidic claim either. Nobody in the room is arguing from 2 Samuel 7.
      { work: 'antiquities', book: 10, chapter: 8, verse: 143, tradition: 'second-temple',
        summary: 'Twenty-one kings of David’s race, then none',
        probe: 'ended their lives, being in number twenty-one' },
      { work: 'antiquities', book: 14, chapter: 15, verse: 403, tradition: 'second-temple',
        summary: 'Herod objected to as a private man, half-Jew',
        probe: 'who was no more than a private man, and an Idumean' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'tg-isaiah', chapter: 9, verse: 6, tradition: 'rabbinic',
        summary: 'No end to the throne of David',
        probe: 'There shall be no end to the throne of David' },
      { work: 'tg-isaiah', chapter: 22, verse: 22, tradition: 'rabbinic',
        summary: 'The key of David’s house placed in his hand',
        probe: 'the government of the house of David, in his hand' },
      { work: 'tg-isaiah', chapter: 8, verse: 6, tradition: 'rabbinic',
        summary: 'The people refuse the house of David’s rule',
        probe: 'this people refuseth the kingdom of the house of David' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-ign-ephesians', chapter: 18, verse: 2, tradition: 'apostolic-fathers',
        summary: 'Of David’s seed and of the Holy Spirit',
        probe: 'of the seed of David but also of the Holy Ghost' },
      { work: 'af-ign-romans', chapter: 7, verse: 3, tradition: 'apostolic-fathers',
        summary: 'The bread of God: flesh of David’s seed',
        probe: 'the flesh of Christ who was of the seed of David' },
      { work: 'af-barnabas', chapter: 12, verse: 10, tradition: 'apostolic-fathers',
        summary: 'Calling him David’s son is the error',
        probe: 'Since then men will say that Christ is the son of David' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      // Hegesippus' story, in Eusebius, is the only place in this library where anybody's Davidic
      // descent is put to anyone in authority — and the answer is thirty-nine acres and calluses.
      { work: 'eusebius-he-3', chapter: 20, verse: 1, tradition: 'church-fathers',
        summary: 'Domitian questions Jude’s grandsons, sees their hands',
        probe: 'Information was given that they belonged to the family of David' },
      { work: 'eusebius-he-1', chapter: 7, verse: 1, tradition: 'church-fathers',
        summary: 'Herod burned the archives, hiding ignoble extraction',
        probe: 'burned all the genealogical records' },
      { work: 'anf-irenaeus-3', chapter: 21, verse: 9, tradition: 'church-fathers',
        summary: 'Jechoniah’s curse: Joseph’s son could not inherit',
        probe: 'if indeed He had been the son of Joseph, He could not' },
    ],
  },
  {
    id: 'king-of-israel',
    group: 'Christ',
    label: 'Kingship over Israel',
    blurb:
      'Almost nobody here is comfortable with a king. Josephus coins a word — theocracy — to say '
      + 'that Israel’s constitution has no room for one, and dates the monarchy from the moment the '
      + 'aristocracy ended. The Hasmoneans are made rulers “until there should arise a faithful '
      + 'prophet”, a clause that concedes the arrangement is provisional; a generation later '
      + 'Aristobulus puts on a diadem anyway. Rome then imposes an aristocracy, Herod takes the '
      + 'title by grant of the Senate, and the rabbis write a law of the king centuries after there '
      + 'is one to apply it to — a law made mostly of restrictions. The Psalms of Solomon want a '
      + 'king, but are careful to say who his king is.',
    canonicalAnchors:
      'The anchors are 1 Samuel 8 (Israel asks for a king and is warned what he will take), '
      + 'Deuteronomy 17:14–20 (the law of the king, which the Mishnah below is expounding), and '
      + 'Judges 8:23, where Gideon refuses: “the LORD shall rule over you.” They are canonical and '
      + 'sit outside this corpus, but the ambivalence they contain is the whole of this page.',
    absences: [
      'The kings themselves left nothing. Everything below is written about the Hasmoneans and '
      + 'Herod by people who came after them or disliked them — Josephus above all, writing under '
      + 'Roman patronage a century later. No Hasmonean or Herodian document survives in this '
      + 'library, and their coins and inscriptions, which are the one contemporary evidence for how '
      + 'they styled themselves, are not texts and are not collected here.',
      'The fourth sect below is missing in its own voice. Josephus is the only reason we know that '
      + 'a party existed holding that God alone was ruler and that Roman tribute was therefore '
      + 'apostasy — and he blames them for the destruction of the country. Nothing they wrote '
      + 'survives anywhere. The one position on this page that had to be argued at the cost of a '
      + 'war is known solely through its most hostile witness.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // Against Apion 2:165 is where the word "theocracy" enters any language. Josephus is
      // inventing a term because the Greek political vocabulary — monarchy, oligarchy, democracy,
      // which Herodotus lays out below — has no slot for what he wants to claim about Israel.
      { work: 'against-apion', book: 2, chapter: 1, verse: 165, tradition: 'second-temple',
        summary: 'A new word coined for it: theocracy',
        probe: 'may be termed a Theocracy' },
      { work: 'antiquities', book: 6, chapter: 12, verse: 268, tradition: 'second-temple',
        summary: 'Saul: first king once the aristocracy ended',
        probe: 'the first king who reigned after our aristocracy' },
      { work: '1Macc', chapter: 14, verse: 41, tradition: 'second-temple',
        summary: 'Simon rules until a faithful prophet arises',
        probe: 'until there should arise a faithful prophet' },
      { work: 'antiquities', book: 13, chapter: 11, verse: 301, tradition: 'second-temple',
        summary: 'Aristobulus puts a diadem on his head',
        probe: 'first of all put a diadem on his head' },
      { work: 'jewish-war', book: 1, chapter: 8, verse: 169, tradition: 'second-temple',
        summary: 'Rome reorganises the government as an aristocracy',
        probe: 'ordained the other political government to be by an aristocracy' },
      { work: 'antiquities', book: 18, chapter: 1, verse: 23, tradition: 'second-temple',
        summary: 'A fourth sect: God is their only ruler',
        probe: 'say that God is to be their only Ruler and Lord' },
      { work: 'PsSol', chapter: 17, verse: 42, tradition: 'second-temple',
        summary: 'The king of Israel whom God knows',
        probe: 'This (will be) the majesty of the king of Israel' },
      { work: 'PsSol', chapter: 17, verse: 34, tradition: 'second-temple',
        summary: 'And the Lord himself is his king',
        probe: 'The Lord Himself is his king' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      // A complete constitutional law for an office that had not existed for well over a century,
      // and the memorable provisions are all limits — including the one that puts him outside the
      // courts in both directions.
      { work: 'm-sanhedrin', chapter: 2, verse: 2, tradition: 'rabbinic',
        summary: 'The king neither judges nor is judged',
        probe: 'The king can neither judge nor be judged' },
      { work: 'm-sanhedrin', chapter: 2, verse: 4, tradition: 'rabbinic',
        summary: 'Eighteen wives; his road has no limit',
        probe: 'The king’s road has no limit' },
      { work: 'm-sanhedrin', chapter: 2, verse: 5, tradition: 'rabbinic',
        summary: 'Nobody may see him bathing, or use his sceptre',
        probe: 'none may sit on his throne and none may make use of his scepter' },
      { work: 'y-sanhedrin', chapter: 10, verse: 2, tradition: 'rabbinic',
        summary: 'Three kings excluded from the world to come',
        probe: 'Three kings and four private persons have no part in the Future World' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'justin-1apology', chapter: 11, verse: 1, tradition: 'church-fathers',
        summary: 'Our kingdom is not the one you fear',
        probe: 'you suppose, without making any inquiry, that we speak of a human kingdom' },
      { work: 'eusebius-he-3', chapter: 20, verse: 1, tradition: 'church-fathers',
        summary: 'Peasant heirs: the kingdom is not earthly',
        probe: 'it was not a temporal nor an earthly kingdom' },
      // ── Greek and Roman ──────────────────────────────────────────────────────────────
      // Herodotus stages the argument Josephus is refusing to have. Three Persians debate which
      // constitution is best and monarchy wins — on the grounds that one excellent man is better
      // than any assembly. Josephus' answer is that the one is not a man.
      { work: 'herodotus-histories-3', chapter: 80, verse: 3, tradition: 'greco-roman',
        summary: 'Monarchy corrupts even the best man alive',
        probe: 'How can monarchy be a fit thing' },
      { work: 'herodotus-histories-3', chapter: 82, verse: 1, tradition: 'greco-roman',
        summary: 'Darius replies that monarchy is best',
        probe: 'I hold that monarchy is' },
    ],
  },
  {
    id: 'son-of-man',
    group: 'Christ',
    label: 'The Son of Man',
    blurb:
      'Two quite different things share these words. Ordinarily “son of man” is Semitic for a human '
      + 'being, and usually a frail one — Sirach uses it to say we are not immortal, Judith to say '
      + 'God is not the sort of thing that wavers. Then in the Parables of Enoch it becomes a title '
      + 'for somebody: a definite figure, always “that Son of Man”, hidden with God before creation, '
      + 'seated on the throne of glory, given the judgement, worshipped by kings. 4 Ezra sees the '
      + 'same figure rise out of the sea and God calls him “my Son”. And then Enoch’s own book, at '
      + 'the very end, tells Enoch that he is the man.',
    canonicalAnchors:
      'Everything here comes out of Daniel 7:13–14 — one like a son of man, coming with the clouds, '
      + 'given dominion — read alongside Psalm 8:4 and Ezekiel, where God addresses the prophet as '
      + '“son of man” about ninety times and means simply “mortal”. Daniel is canonical and sits '
      + 'outside this corpus. Note that it is also one of the two biblical books for which no Targum '
      + 'was ever made, so there is no ancient Jewish translation of that verse to consult.',
    absences: [
      'The dating problem is the thing to know, and it is a gap in the evidence rather than in this '
      + 'library. The Parables of Enoch — chapters 37–71, the whole of the Son of Man material below '
      + '— are the ONE section of 1 Enoch of which no copy was found at Qumran, while every other '
      + 'section was. So we cannot show that this figure was being read in the first century, and '
      + 'scholars date the Parables anywhere from the first century BCE to the end of the first CE. '
      + 'Whether they are background to the Gospels or a parallel to them is genuinely open.',
      'The rabbis do not use it as a title. There is one further discussion, of Daniel 7:13 and how '
      + 'a second throne could stand beside God’s, in the Babylonian Talmud at Sanhedrin 98a — which '
      + 'is in this library in Aramaic only, its English being non-commercially licensed. The '
      + 'Targum passages below show the ordinary idiom surviving, and nothing more than that.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // The two idiom passages come FIRST on purpose. A student who meets 1 Enoch 46 cold will
      // read a title into every occurrence of the phrase, in this corpus and in the Gospels;
      // seeing Sirach use it to mean "we die" is the cheapest correction available.
      { work: 'Sir', chapter: 17, verse: 30, tradition: 'second-temple',
        summary: 'Plain idiom: the son of man is mortal',
        probe: 'because the son of man is not immortal' },
      { work: 'Jdt', chapter: 8, verse: 16, tradition: 'second-temple',
        summary: 'God is not a son of man, to waver',
        probe: 'neither is he as the son of man, that he should be wavering' },
      { work: '1enoch', chapter: 46, verse: 2, tradition: 'second-temple',
        summary: 'Who is that Son of Man, and whence?',
        probe: 'concerning that Son of Man, who he was, and whence he was' },
      { work: '1enoch', chapter: 46, verse: 4, tradition: 'second-temple',
        summary: 'He unseats kings and breaks the strong',
        probe: 'Shall raise up the kings and the mighty from their seats' },
      { work: '1enoch', chapter: 48, verse: 2, tradition: 'second-temple',
        summary: 'Named before the Head of Days',
        probe: 'that Son of Man was named In the presence of the Lord of Spirits' },
      { work: '1enoch', chapter: 62, verse: 7, tradition: 'second-temple',
        summary: 'Hidden from the beginning, revealed to the elect',
        probe: 'from the beginning the Son of Man was hidden' },
      { work: '1enoch', chapter: 62, verse: 5, tradition: 'second-temple',
        summary: 'Seen on the throne of his glory',
        probe: 'When they see that Son of Man Sitting on the throne of his glory' },
      { work: '1enoch', chapter: 62, verse: 9, tradition: 'second-temple',
        summary: 'Kings fall down, worship, and beg mercy',
        probe: 'And worship and set their hope upon that Son of Man' },
      { work: '1enoch', chapter: 69, verse: 27, tradition: 'second-temple',
        summary: 'The sum of judgement handed to him',
        probe: 'the sum of judgement was given unto the Son of Man' },
      // The identification. Everything above reads as a heavenly being distinct from Enoch — and
      // then the angel tells Enoch it is him. Whether 71 belongs with 37–70 is disputed, which is
      // exactly why the passage is here rather than tidied away.
      { work: '1enoch', chapter: 71, verse: 14, tradition: 'second-temple',
        summary: 'The angel tells Enoch: this is you',
        probe: 'This is the Son of Man who is born unto righteousness' },
      { work: '2esdras', chapter: 13, verse: 3, tradition: 'second-temple',
        summary: 'A man from the sea, flying with clouds',
        probe: 'that man waxed strong with the thousands of heaven' },
      { work: '2esdras', chapter: 13, verse: 32, tradition: 'second-temple',
        summary: 'God calls the ascending man “my Son”',
        probe: 'then shall my Son be declared, whom thou sawest as a man ascending' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'tg-isaiah', chapter: 51, verse: 12, tradition: 'rabbinic',
        summary: 'Idiom intact: a son of man, like grass',
        probe: 'of a mortal man or of a son of man, who is counted like grass' },
      { work: 'tg-isaiah', chapter: 56, verse: 2, tradition: 'rabbinic',
        summary: 'The son of man who keeps the Sabbath',
        probe: 'the son of man that layeth hold on it' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      // Barnabas refuses the phrase as a title outright, which shows it was not obvious to every
      // early Christian that it was one. Ignatius, at the same date, is happy to use both.
      { work: 'af-barnabas', chapter: 12, verse: 10, tradition: 'apostolic-fathers',
        summary: 'Not a son of man, but the Son of God',
        probe: 'it is Jesus, not a son of man, but the Son of God' },
      { work: 'af-ign-ephesians', chapter: 20, verse: 2, tradition: 'apostolic-fathers',
        summary: 'Of David’s race, Son of Man and Son of God',
        probe: 'who is Son of Man and Son of God' },
    ],
  },
  {
    id: 'son-of-god',
    group: 'Christ',
    label: 'Son of God',
    blurb:
      'In the Jewish sources this is a relationship, and it is offered widely. Israel is God’s '
      + 'firstborn son; the man who provides for orphans becomes “as the son of the Most High”; '
      + 'anyone who lives virtuously is among the sons of God; the angels are sons of God in '
      + 'Genesis 6, which is how 1 Enoch reads them. Philo, reaching for something more, gives the '
      + 'title to the Logos and immediately concedes that no human being may be worthy of it. '
      + 'The one text that comes close to the Gospels’ use is Wisdom 2, where the righteous man '
      + 'calls God his father and his enemies decide to test whether God will in fact rescue him. '
      + 'Christian writers then make it a title for one person — and spend the next three centuries '
      + 'explaining how that differs from everyone else being called it.',
    canonicalAnchors:
      'The anchors are Exodus 4:22 (Israel is my firstborn son), 2 Samuel 7:14 and Psalm 2:7 (“you '
      + 'are my son, today I have begotten you” — said to the king at his enthronement), Hosea 11:1, '
      + 'and Genesis 6:2. They are canonical and sit outside this corpus. 1 Clement below quotes '
      + 'Psalm 2:7 straight, which is worth noticing: the verse it applies to Christ was originally '
      + 'a coronation formula for a man.',
    absences: [
      'The closest verbal parallel to the Gospels is at Qumran and is not here. 4Q246, an Aramaic '
      + 'fragment, says of a coming figure that “he shall be called the Son of God, and they shall '
      + 'call him the son of the Most High” — the same pair of phrases, in the same order, as Luke '
      + '1:32–35. Whether its subject is a messiah or a foreign king is still argued. No '
      + 'public-domain or openly licensed English of the scrolls exists, so the text a student most '
      + 'needs for this topic is the one they cannot read here.',
      'Beware of 2 Esdras on this page. Its chapters 3–14 are a Jewish apocalypse of about 100 CE, '
      + 'but chapters 1–2 and 15–16 are later Christian additions, and it is in chapter 2 that the '
      + 'phrase “the Son of God, whom they have confessed in the world” appears. Quoted as Jewish '
      + 'evidence it would prove the opposite of what it seems to. Nothing from those chapters is '
      + 'cited below.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // Wisdom 2 first: it is the passage a reader of the passion narrative will recognise, and
      // its "son of God" is a righteous man being taunted, not a divine being.
      { work: 'Wis', chapter: 2, verse: 16, tradition: 'second-temple',
        summary: 'He boasts that God is his father',
        probe: 'maketh his boast that God is his father' },
      { work: 'Wis', chapter: 2, verse: 18, tradition: 'second-temple',
        summary: 'If he is God’s son, God will rescue him',
        probe: 'For if the just man be the son of God, he will help him' },
      { work: 'Sir', chapter: 4, verse: 10, tradition: 'second-temple',
        summary: 'Care for orphans and become the Most High’s son',
        probe: 'so shalt thou be as the son of the most High' },
      { work: 'philo-spec-laws', chapter: 1, verse: 318, tradition: 'second-temple',
        summary: 'Those who live virtuously are sons of God',
        probe: 'those who do what is pleasing to nature and virtuous are the sons of God' },
      // Philo gives the title to the Logos and, in the next sentence, doubts that any human
      // qualifies for it. Both halves matter, which is why both verses are here.
      { work: 'philo-confusion', chapter: 1, verse: 146, tradition: 'second-temple',
        summary: 'None worthy yet; be shaped by his firstborn Word',
        probe: 'any one who is worthy to be called a son of God' },
      { work: 'philo-confusion', chapter: 1, verse: 147, tradition: 'second-temple',
        summary: 'Not yet sons of God — children, at least',
        probe: 'if we are not yet suitable to be called the sons of God' },
      { work: '1enoch', chapter: 106, verse: 5, tradition: 'second-temple',
        summary: 'Noah’s birth: resembling the sons of heaven',
        probe: 'resembling the sons of the God of heaven' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      // Two hits in the whole rabbinic corpus here, and this is the usable one. The sonship is
      // corporate: it belongs to Israel, and the Targum keeps it there.
      { work: 'tg-psj-exodus', chapter: 4, verse: 22, tradition: 'rabbinic',
        summary: 'Israel is my firstborn son',
        probe: 'Israel is My first-born son' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-1clement', chapter: 36, verse: 4, tradition: 'apostolic-fathers',
        summary: 'Psalm 2 applied: today I have begotten you',
        probe: 'Thou art My Son, I this day have begotten thee' },
      { work: 'af-ign-ephesians', chapter: 20, verse: 2, tradition: 'apostolic-fathers',
        summary: 'Son of Man and Son of God together',
        probe: 'who is Son of Man and Son of God' },
      // Hermas asks the question out loud, which no later writer could have done so casually.
      { work: 'af-hermas', chapter: 58, verse: 5, tradition: 'apostolic-fathers',
        summary: 'Why is the Son of God shown as a servant?',
        probe: 'is the Son of God represented in the parable in the guise of a servant' },
      { work: 'af-mart-polycarp', chapter: 17, verse: 3, tradition: 'apostolic-fathers',
        summary: 'Him we adore; the martyrs we merely cherish',
        probe: 'For Him, being the Son of God, we adore' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'origen-celsus-8', chapter: 14, verse: 1, tradition: 'church-fathers',
        summary: 'Celsus: drop the Son, worship the Father only',
        probe: 'If you should tell them that Jesus is not the Son of God' },
      { work: 'athanasius-arians-2', chapter: 59, verse: 1, tradition: 'church-fathers',
        summary: 'Made sons by calling; he is Son by nature',
        probe: 'God not only created them to be men, but called them to be sons' },
    ],
  },
  {
    id: 'sabbath',
    group: 'Law and practice',
    label: 'Sabbath',
    blurb:
      'The seventh day: who keeps it, how strictly, what counts as work, and what happens when '
      + 'keeping it costs your life. The Maccabean crisis is the sharpest test here — a thousand '
      + 'died rather than fight on it, and the decision taken afterwards changed the rule. Later, '
      + 'Christian writers stop keeping it, and say plainly that they have.',
    canonicalAnchors:
      'The anchors are Genesis 2:2–3, Exodus 20:8–11, Deuteronomy 5:12–15 (which gives a different '
      + 'reason from Exodus) and Isaiah 58:13–14. They are canonical and sit outside this corpus; '
      + 'every text below is arguing from them.',
    absences: [
      'No source here argues about WHICH day the Sabbath falls on. The seventh day is assumed by '
      + 'every writer, Jewish and Christian alike. Where the Christian writers part company they '
      + 'stop keeping it rather than move it — Ignatius sets the Lord’s day beside it, not over it.',
      'The rabbinic material here \u2014 the Yerushalmi and the Targums \u2014 is second century and later. For '
      + 'first-century practice the witnesses are Jubilees, the Maccabean books, Philo and '
      + 'Josephus, and they are far thinner on the detail of what counts as work.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'jubilees', chapter: 2, verse: 18, tradition: 'second-temple',
        summary: 'Angels keep the Sabbath in heaven with God',
        probe: 'He hath bidden us to keep the Sabbath with Him' },
      { work: 'jubilees', chapter: 2, verse: 26, tradition: 'second-temple',
        summary: 'Whoever defiles the Sabbath shall surely die',
        probe: 'he who defiles it shall surely die' },
      { work: '1Macc', chapter: 2, verse: 34, tradition: 'second-temple',
        summary: 'They refuse to profane the Sabbath day',
        probe: 'to profane the sabbath day' },
      { work: '1Macc', chapter: 2, verse: 38, tradition: 'second-temple',
        summary: 'A thousand die rather than fight',
        probe: 'they slew them, with their wives and children' },
      { work: '1Macc', chapter: 2, verse: 41, tradition: 'second-temple',
        summary: 'They decree to fight if attacked',
        probe: 'we will fight against him: neither will we die all' },
      { work: 'antiquities', book: 1, chapter: 1, verse: 33, tradition: 'second-temple',
        summary: 'Rest on the seventh day traced to creation',
        probe: 'the seventh day was a rest, and a release from the labor' },
      { work: 'antiquities', book: 18, chapter: 9, verse: 319, tradition: 'second-temple',
        summary: 'An enemy counts on Jews not fighting',
        probe: 'the sabbath, which is among the Jews a day of rest from all sorts of work' },
      { work: 'against-apion', book: 2, chapter: 1, verse: 21, tradition: 'second-temple',
        summary: 'Josephus reports a Greek slander about the Sabbath',
        probe: 'they had buboes in their groins' },
      { work: 'philo-moses', chapter: 2, verse: 216, tradition: 'second-temple',
        summary: 'Jews hold philosophical discussion on the seventh day',
        probe: 'the Jews hold philosophical discussions on the seventh day' },
      { work: 'pseudo-philo', chapter: 11, verse: 8, tradition: 'second-temple',
        summary: 'No work, but praise in the congregation',
        probe: 'saving that therein ye praise the Lord in the congregation' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'y-shabbat', chapter: 7, verse: 2, tradition: 'rabbinic',
        summary: 'Thirty-nine categories of forbidden work listed',
        probe: 'There are 39 categories of work' },
      { work: 'y-shabbat', chapter: 16, verse: 7, tradition: 'rabbinic',
        summary: 'A Gentile extinguishing a fire: neither told',
        probe: 'If a Gentile comes to extinguish' },
      { work: 'tg-psj-exodus', chapter: 35, verse: 2, tradition: 'rabbinic',
        summary: 'Sabbath work punished by death by stoning',
        probe: 'dying he shall die by the casting of stones' },
      { work: 'tg-isaiah', chapter: 56, verse: 2, tradition: 'rabbinic',
        summary: 'Blessed is the one who keeps it undefiled',
        probe: 'every one that shall keep the Sabbath from polluting it' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-barnabas', chapter: 15, verse: 3, tradition: 'apostolic-fathers',
        summary: 'The Sabbath read from the creation account',
        probe: 'Of the Sabbath He speaketh in the beginning of the creation' },
      { work: 'af-barnabas', chapter: 15, verse: 5, tradition: 'apostolic-fathers',
        summary: 'True rest awaits the Son’s coming',
        probe: 'when His Son shall come, and shall abolish the time of the Lawless One' },
      { work: 'af-ign-magnesians', chapter: 9, verse: 1, tradition: 'apostolic-fathers',
        summary: 'No longer sabbaths, but the Lord’s day',
        probe: 'no longer observing sabbaths but fashioning their lives after the Lord' },
      { work: 'af-diognetus', chapter: 4, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Jewish Sabbath scruples dismissed as superstition',
        probe: 'their superstition relating to the sabbath' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'justin-dialogue', chapter: 23, verse: 3, tradition: 'church-fathers',
        summary: 'The elements themselves keep no Sabbaths',
        probe: 'the elements are not idle, and keep no Sabbaths' },
      { work: 'origen-celsus-6', chapter: 61, verse: 1, tradition: 'church-fathers',
        summary: 'Argues God’s rest is not idleness',
        probe: 'ceased on the seventh day from all His works' },
      // ── Greek and Roman ──────────────────────────────────────────────────────────────
      { work: 'plutarch-table-talk-4', chapter: 6, verse: 2, tradition: 'greco-roman',
        summary: 'A Greek reads Jewish feasts as Bacchic',
        probe: 'the greatest and most holy solemnity of the Jews' },
    ],
  },
  {
    id: 'law',
    group: 'Law and practice',
    label: 'Law and commandments',
    blurb:
      'Torah as gift, as wisdom, as a fence, and as something later Christians read straight past. '
      + 'The question that divides these sources is not whether the law is good — they all say it '
      + 'is — but what it is FOR, and who it binds. Read alongside Sabbath, which is the same '
      + 'argument at close range.',
    canonicalAnchors:
      'The anchors are Exodus 19–24, Deuteronomy, and Psalm 119. The first-century controversy that '
      + 'matters most — whether Gentiles must keep the law — is in Acts 15 and Galatians. All of '
      + 'that is canonical and sits outside this corpus.',
    absences: [
      'The argument about Gentiles and the law is not here. This library shows what the law meant '
      + 'to those who kept it, and what Christians said once they had stopped; the controversy '
      + 'itself is in the New Testament. Nothing below is a party to it.',
      'Nothing here is a law code. The Mishnah is one, and it is in the library — but it is second '
      + 'century, so it shows the law as the rabbis settled it, not as anyone kept it while the '
      + 'Temple stood.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'Sir', chapter: 24, verse: 23, tradition: 'second-temple',
        summary: 'Wisdom identified outright with the law of Moses',
        probe: 'the book of the covenant of the most high God' },
      { work: 'aristeas', chapter: 1, verse: 139, tradition: 'second-temple',
        summary: 'The Lawgiver fenced Israel round with ramparts',
        probe: 'fenced us round with impregnable ramparts' },
      { work: '4Macc', chapter: 5, verse: 17, tradition: 'second-temple',
        summary: 'Not to transgress the law at any point',
        probe: 'we ought not in any point to transgress the law' },
      { work: 'philo-abraham', chapter: 1, verse: 275, tradition: 'second-temple',
        summary: 'Abraham kept the law before it was written',
        probe: 'this man fulfilled the divine law' },
      { work: 'philo-husbandry', chapter: 1, verse: 31, tradition: 'second-temple',
        summary: 'An unvarying law of nature governs the soul',
        probe: 'the unvarying law of nature' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'm-avot', chapter: 1, verse: 1, tradition: 'rabbinic',
        summary: 'Torah handed down; make a fence around it',
        probe: 'Moses received the Torah at Sinai' },
      { work: 'm-avot', chapter: 1, verse: 2, tradition: 'rabbinic',
        summary: 'The world stands on Torah, service, piety',
        probe: 'the world stands upon three things' },
      { work: 'y-berakhot', chapter: 2, verse: 3, tradition: 'rabbinic',
        summary: 'Kingdom of Heaven accepted before the commandments',
        probe: 'accept the Kingdom of Heaven before he accepts the yoke' },
      { work: 'tg-psj-deuteronomy', chapter: 4, verse: 2, tradition: 'rabbinic',
        summary: 'Neither add to the commandments nor diminish',
        probe: 'Ye shall not add to the words that I teach you' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-barnabas', chapter: 10, verse: 2, tradition: 'apostolic-fathers',
        summary: 'Food laws meant morally, never about eating',
        probe: 'it is not a commandment of God that they should not bite' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'justin-dialogue', chapter: 16, verse: 1, tradition: 'church-fathers',
        summary: 'Circumcision of the heart urged against the flesh',
        probe: 'circumcise the hardness of your hearts' },
    ],
  },
  {
    id: 'temple',
    group: 'Temple and community',
    label: 'Temple and sanctuary',
    blurb:
      'The house on the mount — and what people said about it once it was gone. Two moves run '
      + 'through these texts, and both start before 70 CE: the real temple is the one in heaven, '
      + 'of which this is a copy; and the real temple is the community, or the human heart. '
      + 'Barnabas 16 puts both together and draws the conclusion.',
    canonicalAnchors:
      'The anchors are 1 Kings 6–8 (Solomon builds it), Ezekiel 40–48 (the visionary temple) and '
      + 'Isaiah 66:1–2 (“what house will you build for me?”). They are canonical and sit outside '
      + 'this corpus; the writers below all quote or assume them.',
    absences: [
      'Middot describes the building in the present tense — the Temple Mount five hundred cubits '
      + 'square, five gates, an altar of thirty-two — but it was compiled generations after 70 CE '
      + 'and its authors never saw it standing. Read it as a memory reconstructed from tradition '
      + 'and scripture, not as a survey.',
      'After Barnabas the Christian writers largely stop arguing about the building. They move to '
      + 'sacrifice and priesthood instead, which are separate questions and belong on their own '
      + 'pages; that is why the later Christian section here is empty rather than thin.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: '2baruch', chapter: 4, verse: 3, tradition: 'second-temple',
        summary: 'The true building was prepared before Paradise',
        probe: 'This building now built in your midst is not that which is revealed with Me' },
      { work: '2baruch', chapter: 6, verse: 7, tradition: 'second-temple',
        summary: 'Vessels removed from the Holy of Holies beforehand',
        probe: 'take from there the veil, and holy ark' },
      { work: 'Wis', chapter: 9, verse: 8, tradition: 'second-temple',
        summary: 'The temple copies a tabernacle prepared from the beginning',
        probe: 'a resemblance of the holy tabernacle' },
      { work: 'Jdt', chapter: 9, verse: 8, tradition: 'second-temple',
        summary: 'Enemies purpose to defile the sanctuary',
        probe: 'they have purposed to defile thy sanctuary' },
      { work: 'philo-spec-laws', chapter: 1, verse: 66, tradition: 'second-temple',
        summary: 'The universe itself is the truest temple',
        probe: 'the universal world as the highest and truest temple of God' },
      { work: 'against-apion', book: 2, chapter: 1, verse: 12, tradition: 'second-temple',
        summary: 'Josephus dates the first tabernacle against a critic',
        probe: 'is manifest from the works of Moses' },
      { work: 'jewish-war', book: 1, chapter: 1, verse: 28, tradition: 'second-temple',
        summary: 'The temple burnt, against Caesar’s own consent',
        probe: 'how the temple was burnt, against the consent of Caesar' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'y-yoma', chapter: 1, verse: 1, tradition: 'rabbinic',
        summary: 'High priest isolated seven days beforehand',
        probe: 'Seven days before the Day of Atonement one isolates the High Priest' },
      { work: 'y-yoma', chapter: 1, verse: 5, tradition: 'rabbinic',
        summary: 'The elders adjure the high priest before entry',
        probe: 'They adjure him; this finishes their task' },
      { work: 'tg-psj-exodus', chapter: 28, verse: 43, tradition: 'rabbinic',
        summary: 'Vestments required on pain of flaming fire',
        probe: 'that they may not receive the punishment of flaming fire' },
      { work: 'm-middot', chapter: 1, verse: 3, tradition: 'rabbinic',
        summary: 'Five gates counted round the Temple Mount',
        probe: 'There were five gates to the Temple Mount' },
      { work: 'm-middot', chapter: 2, verse: 1, tradition: 'rabbinic',
        summary: 'The Mount measured five hundred cubits square',
        probe: 'The Temple Mount was five hundred cubits by five hundred cubits' },
      { work: 'm-middot', chapter: 3, verse: 1, tradition: 'rabbinic',
        summary: 'The altar thirty-two cubits, stepped inward',
        probe: 'The altar was thirty-two cubits by thirty-two' },
      { work: 'm-tamid', chapter: 1, verse: 1, tradition: 'rabbinic',
        summary: 'Priests keep watch in three places nightly',
        probe: 'In three places the priests keep watch in the Temple' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-barnabas', chapter: 6, verse: 15, tradition: 'apostolic-fathers',
        summary: 'The holy temple is the heart’s abode',
        probe: 'a holy temple unto the Lord, my brethren, is the abode of our heart' },
      { work: 'af-barnabas', chapter: 16, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Hope set on the building, not its maker',
        probe: 'set their hope on the building, and not on their God' },
      { work: 'af-barnabas', chapter: 16, verse: 4, tradition: 'apostolic-fathers',
        summary: 'Pulled down because they went to war',
        probe: 'for because they went to war it was pulled down' },
      { work: 'af-barnabas', chapter: 16, verse: 9, tradition: 'apostolic-fathers',
        summary: 'God now dwells within the believer’s habitation',
        probe: 'God dwelleth truly in our habitation within us' },
    ],
  },
  {
    id: 'priesthood',
    group: 'Temple and community',
    label: 'Priesthood and mediation',
    blurb:
      'Who stands between God and the people. Three strands run here and they do not quite meet: '
      + 'the Aaronic line and its vestments; Melchizedek, a priest with no genealogy who fascinated '
      + 'Philo and Josephus alike; and the Christian ordering of ministry, which borrows the '
      + 'Levitical pattern for its shape while pointedly not calling anyone a priest.',
    canonicalAnchors:
      'The anchors are Exodus 28–29 and Leviticus 8–9 (Aaron consecrated), Numbers 16–18, and '
      + 'Psalm 110:4 — “a priest for ever after the order of Melchizedek” — which is the verse the '
      + 'whole Melchizedek strand hangs on. The Christian argument is worked out in Hebrews. All of '
      + 'that is canonical and sits outside this corpus.',
    absences: [
      'No source here calls a Christian minister a priest. 1 Clement reaches for the Levitical '
      + 'pattern — high priest, priests, levites, layman — but to argue for ORDER, not to claim the '
      + 'office; Ignatius has bishop, presbytery and deacons and never uses priestly language of '
      + 'them. Whatever happened later, it has not happened yet in these texts.',
      'Nor is there a priesthood here without a sanctuary to serve in. Even the writers arguing '
      + 'that the temple is finished keep reasoning from the Levitical pattern rather than '
      + 'discarding it.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'Sir', chapter: 45, verse: 7, tradition: 'second-temple',
        summary: 'Everlasting covenant of priesthood given to Aaron',
        probe: 'gave him the priesthood among the people' },
      { work: 'Sir', chapter: 50, verse: 1, tradition: 'second-temple',
        summary: 'Simon the high priest repairs the house',
        probe: 'Simon the high priest, the son of Onias' },
      { work: 'tp-levi', chapter: 5, verse: 2, tradition: 'second-temple',
        summary: 'Priesthood granted to Levi until God comes',
        probe: 'I have given thee the blessings of the priesthood' },
      { work: 'tp-levi', chapter: 8, verse: 10, tradition: 'second-temple',
        summary: 'Diadem and incense: Levi invested in vision',
        probe: 'placed on my head a diadem of priesthood' },
      { work: 'philo-alleg-interp', chapter: 3, verse: 79, tradition: 'second-temple',
        summary: 'Melchizedek made high priest with no antecedent',
        probe: 'his own high Priest' },
      { work: 'philo-alleg-interp', chapter: 3, verse: 82, tradition: 'second-temple',
        summary: 'Melchizedek brings wine instead of water',
        probe: 'Melchisedek shall bring forward wine instead of water' },
      { work: 'jewish-war', book: 6, chapter: 10, verse: 438, tradition: 'second-temple',
        summary: 'Melchizedek: righteous king and first priest',
        probe: 'called [Melchisedek], the Righteous King' },
      { work: 'antiquities', book: 11, chapter: 3, verse: 62, tradition: 'second-temple',
        summary: 'A king funds the priests’ sacred garments',
        probe: 'those sacred garments wherein they used to worship God' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'm-yoma', chapter: 3, verse: 9, tradition: 'rabbinic',
        summary: 'High priest flanked by deputy and family head',
        probe: 'the deputy high priest at his right' },
      { work: 'm-sotah', chapter: 7, verse: 6, tradition: 'rabbinic',
        summary: 'Priestly blessing said differently inside the Temple',
        probe: 'In the province (outside of the Temple) it was said as three blessings' },
      { work: 'y-megillah', chapter: 1, verse: 10, tradition: 'rabbinic',
        summary: 'Anointed and merely invested high priests distinguished',
        probe: 'a High Priest anointed with the anointing oil and one invested' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-1clement', chapter: 40, verse: 2, tradition: 'apostolic-fathers',
        summary: 'Offerings at fixed times, never in disorder',
        probe: 'not to be done rashly or in disorder' },
      { work: 'af-1clement', chapter: 40, verse: 5, tradition: 'apostolic-fathers',
        summary: 'High priest, priests, levites, layman: each bound',
        probe: 'The layman is bound by the layman' },
      { work: 'af-ign-ephesians', chapter: 4, verse: 1, tradition: 'apostolic-fathers',
        summary: 'The presbytery attuned to the bishop like strings',
        probe: 'your honourable presbytery, which is worthy of God, is attuned to the bishop' },
      { work: 'af-ign-polycarp', chapter: 6, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Heed bishop, presbyters and deacons together',
        probe: 'I am devoted to those who are subject to the bishop' },
      // ── Later Christian writers ──────────────────────────────────────────────────────
      { work: 'athanasius-arians-2', chapter: 8, verse: 1, tradition: 'church-fathers',
        summary: 'Aaron read as a shadow of Christ',
        probe: 'this Aaron shadowed out according to the Law' },
      { work: 'eusebius-he-1', chapter: 3, verse: 1, tradition: 'church-fathers',
        summary: 'Moses called the high priest “Christ”, anointed',
        probe: 'Moses was the first to make known the name of Christ' },
    ],
  },
  {
    id: 'atonement',
    group: 'Sin and salvation',
    label: 'Atonement and sacrifice',
    blurb:
      'How sin is dealt with. The ritual answer is the Day of Atonement, described here by Philo, '
      + 'Josephus, the Targums and the rabbis. The other answer is the one a reader of the New '
      + 'Testament will not expect to find in Jewish sources at all: in 4 Maccabees the deaths of '
      + 'the martyrs are a purification and a propitiation for the nation.',
    canonicalAnchors:
      'The anchors are Leviticus 16 (the Day of Atonement and the two goats), Leviticus 17:11 '
      + '(“the life of the flesh is in the blood”) and Isaiah 53. They are canonical and sit '
      + 'outside this corpus; every text below is working from them.',
    absences: [
      'The scapegoat is described again and again and explained nowhere. Not one source here says '
      + 'HOW the sin gets onto the goat, or why sending it away removes anything. The mechanism a '
      + 'modern reader wants is simply not a question these writers ask.',
      'Vicarious atoning death is here — but it belongs to MARTYRS, not to a messiah. 4 Maccabees '
      + 'says the blood of the pious saved Israel; no Jewish source in this library says anything '
      + 'of the kind about an anointed king. That distinction is the whole point, and the Messiah '
      + 'page makes the same one from the other side.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: '4Macc', chapter: 6, verse: 29, tradition: 'second-temple',
        summary: 'Let my blood be their purification, my life recompense',
        probe: 'Let my blood be a purification for them' },
      { work: '4Macc', chapter: 17, verse: 22, tradition: 'second-temple',
        summary: 'The martyrs’ propitiatory death saved Israel',
        probe: 'the blood of those pious ones, and their propitiatory death' },
      { work: '2Macc', chapter: 7, verse: 38, tradition: 'second-temple',
        summary: 'In us may the Almighty’s wrath cease',
        probe: 'the wrath of the Almighty, which is justly brought upon all our nation, may cease' },
      { work: 'antiquities', book: 3, chapter: 10, verse: 241, tradition: 'second-temple',
        summary: 'The scapegoat, an expiation for the whole multitude',
        probe: 'to be an expiation for the sins of the whole multitude' },
      { work: 'philo-planter', chapter: 1, verse: 61, tradition: 'second-temple',
        summary: 'Two goats cast by lot each year',
        probe: 'to take by lot two goats' },
      { work: 'Sir', chapter: 7, verse: 31, tradition: 'second-temple',
        summary: 'Honour the priest; give the trespass offering',
        probe: 'Fear the Lord, and honour the priest' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'tg-psj-exodus', chapter: 30, verse: 10, tradition: 'rabbinic',
        summary: 'Aaron expiates the altar’s horns once yearly',
        probe: 'once in the year shall he make atonement upon it' },
      { work: 'm-shevuot', chapter: 1, verse: 3, tradition: 'rabbinic',
        summary: 'Goat and Day of Atonement together bring atonement',
        probe: 'together with the day of atonement bring atonement' },
      { work: 'y-shevuot', chapter: 1, verse: 7, tradition: 'rabbinic',
        summary: 'The bull’s blood atones for the priests alone',
        probe: 'the blood of the bull atones for Cohanim' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-barnabas', chapter: 2, verse: 5, tradition: 'apostolic-fathers',
        summary: 'God declares he is full of burnt offerings',
        probe: 'What to Me is the multitude of your sacrifices' },
      { work: 'af-barnabas', chapter: 7, verse: 6, tradition: 'apostolic-fathers',
        summary: 'Two goats, fair and alike, read typologically',
        probe: 'Take two goats, fair and alike' },
      { work: 'af-1clement', chapter: 7, verse: 4, tradition: 'apostolic-fathers',
        summary: 'The blood of Christ, shed for our salvation',
        probe: 'Let us fix our eyes on the blood of Christ' },
    ],
  },
  {
    id: 'circumcision',
    group: 'Law and practice',
    label: 'Circumcision and identity',
    blurb:
      'The covenant sign, and the question it forces: what must a Gentile who joins Israel actually '
      + 'do? Josephus tells the story of King Izates, who asked two Jewish teachers and got two '
      + 'opposite answers — which is the first-century argument of Acts 15 and Galatians, preserved '
      + 'from the Jewish side by someone with no stake in the Christian outcome.',
    canonicalAnchors:
      'The anchors are Genesis 17 (the covenant in the flesh), Exodus 12:48 (the circumcised '
      + 'stranger may keep Passover) and Deuteronomy 30:6 (circumcised hearts). The Christian '
      + 'argument is Acts 15 and Galatians. All canonical, all outside this corpus.',
    absences: [
      'No source here spiritualises circumcision AND drops the practice. Jubilees has both the '
      + 'flesh and the heart and means both; Barnabas is the first writer in this library to say '
      + 'the physical rite is abolished, and he is a Christian writing after the fact.',
      'The Izates story is the closest thing here to the Acts 15 debate, but it is one episode '
      + 'reported by one historian. There is no Jewish text in this library setting out a general '
      + 'rule for what a Gentile adherent must do.',
    ],
    entries: [
      { work: 'jubilees', chapter: 15, verse: 12, tradition: 'second-temple',
        summary: 'Circumcise on the eighth day, every generation',
        probe: 'the child on the eighth day ye shall circumcise' },
      { work: 'jubilees', chapter: 1, verse: 23, tradition: 'second-temple',
        summary: 'God will circumcise the heart’s foreskin too',
        probe: 'I will circumcise the foreskin of their heart' },
      { work: '1Macc', chapter: 1, verse: 15, tradition: 'second-temple',
        summary: 'They made themselves uncircumcised, forsaking the covenant',
        probe: 'made themselves uncircumcised, and forsook the holy covenant' },
      { work: '1Macc', chapter: 1, verse: 60, tradition: 'second-temple',
        summary: 'Women executed for circumcising their children',
        probe: 'they put to death certain women, that had caused their children to be circumcised' },
      { work: 'antiquities', book: 1, chapter: 10, verse: 192, tradition: 'second-temple',
        summary: 'Circumcision keeps Abraham’s posterity unmixed',
        probe: 'in order to keep his posterity unmixed with others' },
      { work: 'antiquities', book: 20, chapter: 2, verse: 38, tradition: 'second-temple',
        summary: 'Izates assumes he must be circumcised to convert',
        probe: 'he could not be thoroughly a Jew unless he were circumcised' },
      { work: 'antiquities', book: 20, chapter: 2, verse: 42, tradition: 'second-temple',
        summary: 'Ananias: God will forgive the omission',
        probe: 'God would forgive him, though he did not perform the operation' },
      { work: 'antiquities', book: 20, chapter: 2, verse: 44, tradition: 'second-temple',
        summary: 'Eleazar: omitting it breaks the principal law',
        probe: 'Thou dost not consider, O king! that thou unjustly breakest the principal of those laws' },
      { work: 'philo-qg', chapter: 3, verse: 48, tradition: 'second-temple',
        summary: 'Philo gives medical and moral reasons together',
        probe: 'He orders the freeborn to be circumcised' },
      { work: 'tg-psj-genesis', chapter: 17, verse: 11, tradition: 'rabbinic',
        summary: 'A sign of the covenant between God’s Word and you',
        probe: 'as a sign of the covenant between My Word and you' },
      { work: 'tg-psj-exodus', chapter: 12, verse: 48, tradition: 'rabbinic',
        summary: 'A proselyte must be circumcised to keep Passover',
        probe: 'let every male belonging to him be circumcised' },
      { work: 'af-barnabas', chapter: 9, verse: 1, tradition: 'apostolic-fathers',
        summary: 'It is the heart that God circumcised',
        probe: 'it is our heart which He circumcised' },
      { work: 'af-barnabas', chapter: 9, verse: 3, tradition: 'apostolic-fathers',
        summary: 'Fleshly circumcision abolished; an evil angel taught it',
        probe: 'the circumcision, in which they have confidence, is abolished' },
    ],
  },
  {
    id: 'purity',
    group: 'Law and practice',
    label: 'Purity, food and the table',
    blurb:
      'Clean and unclean — what may be eaten, what defiles by contact, and who may eat with whom. '
      + 'Under persecution this stops being housekeeping and becomes the thing people die over: '
      + 'both Maccabean martyrdoms begin with a refusal to eat.',
    canonicalAnchors:
      'The anchors are Leviticus 11 (clean and unclean creatures), Leviticus 12–15 (bodily '
      + 'impurity) and Numbers 19 (the red heifer). They are canonical and sit outside this corpus.',
    absences: [
      'Nothing here explains WHY contact transmits impurity. As with the scapegoat, the mechanism '
      + 'is assumed rather than argued — the sources tell you what defiles, never how.',
      'Purity law is worked out in detail only in the rabbinic material, which is second century '
      + 'and later. For the first century the witnesses are crisis narratives and outsiders’ '
      + 'descriptions, so what survives is the boundary under pressure rather than at rest.',
    ],
    entries: [
      { work: '1Macc', chapter: 1, verse: 47, tradition: 'second-temple',
        summary: 'Swine and unclean beasts ordered on altars',
        probe: 'flesh, and unclean beasts' },
      { work: '2Macc', chapter: 6, verse: 18, tradition: 'second-temple',
        summary: 'Eleazar constrained to eat swine’s flesh',
        probe: 'Eleazar, one of the principal scribes' },
      { work: '2Macc', chapter: 7, verse: 1, tradition: 'second-temple',
        summary: 'Seven brothers compelled to taste it',
        probe: 'compelled by the king against the law to taste swine' },
      { work: 'against-apion', book: 2, chapter: 1, verse: 203, tradition: 'second-temple',
        summary: 'Bathing required after intercourse, soul and body',
        probe: 'there is a defilement contracted thereby, both in soul and body' },
      { work: 'philo-moses', chapter: 2, verse: 139, tradition: 'second-temple',
        summary: 'The laver of mirrors: look into your mind',
        probe: 'the materials of which this vessel was composed were mirrors' },
      { work: 'm-eduyot', chapter: 5, verse: 3, tradition: 'rabbinic',
        summary: 'Whether Ecclesiastes defiles the hands, disputed',
        probe: 'The book of Ecclesiastes does not defile the hands' },
      { work: 'm-chagigah', chapter: 3, verse: 8, tradition: 'rabbinic',
        summary: 'Temple vessels immersed; beware touching the table',
        probe: 'How did they undertake the purification of the Temple court' },
      { work: 'tg-psj-numbers', chapter: 6, verse: 9, tradition: 'rabbinic',
        summary: 'A sudden death defiles the Nazirite’s vow',
        probe: 'he unawares defile the head of his vow' },
      { work: 'af-didache', chapter: 6, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Bear what yoke of the Lord you can',
        probe: 'if thou art able to bear the whole yoke of the Lord' },
    ],
  },
  {
    id: 'free-will',
    group: 'Sin and salvation',
    label: 'Free will and providence',
    blurb:
      'How much is fate and how much is choice. Josephus sorts the three Jewish parties by exactly '
      + 'this question — it is the same passage that divides them over resurrection — and Sirach and '
      + '2 Baruch answer it as directly as any ancient text does: a man is left in the hand of his '
      + 'own counsel, and each of us is the Adam of his own soul.',
    canonicalAnchors:
      'The anchors are Deuteronomy 30:19 (“I have set before you life and death — choose life”) and '
      + 'Genesis 4:7. They are canonical and sit outside this corpus; Sirach in particular is '
      + 'writing straight out of them.',
    absences: [
      'Qumran’s determinism — the two spirits, the lot of light and the lot of darkness — is the '
      + 'sharpest Jewish position on this question and it is absent, because this library holds no '
      + 'Dead Sea Scrolls. Josephus says the Essenes made everything the work of fate; we cannot '
      + 'read them saying it themselves.',
      'No source here separates the question from responsibility. Nobody argues that fate excuses '
      + 'anyone; even the most deterministic account reported by Josephus is offered as a party '
      + 'position, not as a defence.',
    ],
    entries: [
      { work: 'Sir', chapter: 15, verse: 14, tradition: 'second-temple',
        summary: 'God left man in the hand of his counsel',
        probe: 'left him in the hand of his counsel' },
      { work: 'Sir', chapter: 15, verse: 16, tradition: 'second-temple',
        summary: 'Fire and water set before you: choose',
        probe: 'He hath set fire and water before thee' },
      { work: '2baruch', chapter: 54, verse: 15, tradition: 'second-temple',
        summary: 'Adam sinned first, but each prepares his own',
        probe: 'Each one of them has prepared for his own soul torment to come' },
      { work: '2baruch', chapter: 54, verse: 19, tradition: 'second-temple',
        summary: 'Each of us is the Adam of his soul',
        probe: 'each of us has been the Adam of his own soul' },
      { work: 'antiquities', book: 13, chapter: 5, verse: 171, tradition: 'second-temple',
        summary: 'Three sects differing on human action',
        probe: 'three sects among the Jews, who had different opinions concerning human actions' },
      { work: 'antiquities', book: 13, chapter: 5, verse: 172, tradition: 'second-temple',
        summary: 'Pharisees: some acts fated, some ours',
        probe: 'some actions, but not all, are the work of fate' },
      { work: 'antiquities', book: 13, chapter: 5, verse: 173, tradition: 'second-temple',
        summary: 'Sadducees deny fate outright, all being ours',
        probe: 'they take away fate, and say there is no such thing' },
      { work: 'af-didache', chapter: 1, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Two ways, one of life, one of death',
        probe: 'There are two ways, one of life and one of death' },
      { work: 'af-didache', chapter: 5, verse: 1, tradition: 'apostolic-fathers',
        summary: 'The way of death set out in full',
        probe: 'But the way of death is this' },
    ],
  },
  {
    id: 'assembly',
    group: 'Temple and community',
    label: 'The assembly: church and synagogue',
    blurb:
      'How the gathered community describes and orders itself. Both the Greek words behind “church” '
      + 'and “synagogue” simply mean an assembly, and in these sources they are not yet two '
      + 'institutions — Pseudo-Philo has a synagogue praying with one accord, and Philo has Jews '
      + 'meeting on the seventh day in places he calls by the same name.',
    canonicalAnchors:
      'The anchors are Deuteronomy 23 and Numbers 16 for the assembly of Israel, and Acts and the '
      + 'letters for the Christian one. All canonical, all outside this corpus.',
    absences: [
      'The separation of church from synagogue is not described anywhere in this library. Ignatius '
      + 'assumes it and Barnabas argues past it, but no text narrates it happening — the parting of '
      + 'the ways is visible here only in its results.',
      'The rabbinic entries describe the synagogue as a BUILDING with rules attached, which is '
      + 'second-century evidence. How a first-century synagogue actually met is shown here only '
      + 'from outside, by Philo and by Josephus on the Essenes.',
    ],
    entries: [
      { work: 'philo-good-person', chapter: 1, verse: 81, tradition: 'second-temple',
        summary: 'Seventh-day meetings in places called synagogues',
        probe: 'frequent the sacred places which are cal' },
      { work: 'pseudo-philo', chapter: 25, verse: 6, tradition: 'second-temple',
        summary: 'Elders and the whole synagogue pray together',
        probe: 'all the elders and the whole synagogue prayed with one accord' },
      { work: '1Macc', chapter: 14, verse: 28, tradition: 'second-temple',
        summary: 'A great congregation of priests, people, elders',
        probe: 'in the great congregation of the priests, and people, and rulers' },
      { work: 'philo-flaccus', chapter: 1, verse: 74, tradition: 'second-temple',
        summary: 'Thirty-eight elders of the Jewish council arrested',
        probe: 'thirty-eight members of our council of elders' },
      { work: 'jewish-war', book: 2, chapter: 8, verse: 122, tradition: 'second-temple',
        summary: 'Essenes hold everything in common, despising riches',
        probe: 'These men are despisers of riches' },
      { work: 'm-eruvin', chapter: 10, verse: 10, tradition: 'rabbinic',
        summary: 'A ruling recalled from a synagogue in Tiberias',
        probe: 'It happened in a synagogue in Tiberias' },
      { work: 'm-sotah', chapter: 9, verse: 15, tradition: 'rabbinic',
        summary: 'What ceased in Israel as each teacher died',
        probe: 'When Rabbi Meir died, the composers of fables ceased' },
      { work: 'af-hermas', chapter: 6, verse: 6, tradition: 'apostolic-fathers',
        summary: 'The elders of the Church told to walk rightly',
        probe: 'say unto the elders of the Church' },
      { work: 'af-hermas', chapter: 8, verse: 2, tradition: 'apostolic-fathers',
        summary: 'The book to be given to the elders',
        probe: 'if I had already given the book to the elders' },
    ],
  },
  {
    id: 'second-coming',
    group: 'Last things',
    label: 'The day of the Lord and the coming',
    blurb:
      'God’s decisive arrival. The Jewish sources here describe God himself coming to judge — '
      + '1 Enoch has him come with ten thousands of his holy ones — and they reckon the times '
      + 'carefully without ever expecting anyone to come BACK. A second coming needs a first, and '
      + 'that premise is Christian; the difference between the two halves of this page is the point '
      + 'of it.',
    canonicalAnchors:
      'The anchors are Joel 2, Amos 5:18–20 (“woe to you who desire the day of the Lord”), '
      + 'Zechariah 14 and Daniel 7. The Christian expectation is worked out in the Gospels, 1 '
      + 'Thessalonians and Revelation. All canonical, all outside this corpus.',
    absences: [
      'No Jewish source here expects a figure to RETURN. They expect God to come, or the day to '
      + 'arrive; 1 Enoch 1:9 is the sharpest statement of it and the subject is the Lord himself. '
      + 'The word “second” is doing real work in the Christian phrase, and it has no Jewish '
      + 'counterpart in this library.',
      'Nor is there a timetable. 4 Ezra insists the times are measured and numbered, and then '
      + 'declines to say by how much; the calculating that later Christian writers go in for — '
      + 'Barnabas already reckoning six thousand years — has no Jewish parallel here.',
    ],
    entries: [
      { work: '1enoch', chapter: 1, verse: 9, tradition: 'second-temple',
        summary: 'He comes with ten thousands of his holy ones',
        probe: 'He cometh with ten thousands of His holy ones' },
      { work: '2baruch', chapter: 13, verse: 3, tradition: 'second-temple',
        summary: 'Preserved as a witness to the consummation',
        probe: 'preserved to the consummation of the times' },
      { work: '2esdras', chapter: 4, verse: 37, tradition: 'second-temple',
        summary: 'The times measured and numbered, unmoved',
        probe: 'By measure hath he measured the times' },
      { work: '2esdras', chapter: 9, verse: 1, tradition: 'second-temple',
        summary: 'Measure the time; watch the signs pass',
        probe: 'Measure thou the time diligently in itself' },
      { work: 'tg-isaiah', chapter: 18, verse: 3, tradition: 'rabbinic',
        summary: 'The trumpet sounds; you shall hear redemption',
        probe: 'the trumpet shall sound, ye shall hear of redemption' },
      { work: 'af-didache', chapter: 16, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Be ready: you know not the hour',
        probe: 'ye know not the hour in which our Lord cometh' },
      { work: 'af-2clement', chapter: 12, verse: 1, tradition: 'apostolic-fathers',
        summary: 'We do not know the day of appearing',
        probe: 'since we know not the day of God' },
      { work: 'af-2clement', chapter: 17, verse: 4, tradition: 'apostolic-fathers',
        summary: 'He comes to gather nations and redeem',
        probe: 'Herein He speaketh of the day of His appearing' },
      { work: 'af-barnabas', chapter: 15, verse: 4, tradition: 'apostolic-fathers',
        summary: 'Six thousand years: a day is a millennium',
        probe: 'in six thousand years the Lord shall bring all things to an end' },
      { work: 'eusebius-he-3', chapter: 31, verse: 3, tradition: 'church-fathers',
        summary: 'The dead rise at the Lord’s coming in glory',
        probe: 'which shall rise again on the last day, at the coming of the Lord' },
    ],
  },
  {
    id: 'judgment',
    group: 'Last things',
    label: 'Judgment',
    blurb:
      'The reckoning. These sources are far more interested in the verdict than the procedure: fire '
      + 'for the ungodly, glory for the justified, and — in 2 Baruch — both sides visibly changed so '
      + 'that each can see what the other has become. What almost none of them describe is how the '
      + 'judging is actually done.',
    canonicalAnchors:
      'The anchors are Daniel 7:9–10 (the books opened), Malachi 3 and Psalm 1. They are canonical '
      + 'and sit outside this corpus; the writers below assume them throughout.',
    absences: [
      'Only ONE text here describes the machinery at all. The Testament of Abraham has the '
      + 'balance, the angels who write down sins and righteous deeds, and the fiery test; every '
      + 'other source on this page gives the verdict and stops. One witness is not a consensus, '
      + 'and the scene should not be read back into writers who never describe it.',
      'The criterion is deeds, stated flatly and without qualification by every source here. '
      + 'Nothing in this library weighs faith, intention or status against them, or discusses what '
      + 'happens when they conflict.',
    ],
    entries: [
      { work: '1enoch', chapter: 10, verse: 6, tradition: 'second-temple',
        summary: 'Cast into the fire on the great day',
        probe: 'on the day of the great judgement he shall be cast into the fire' },
      { work: 'Jdt', chapter: 16, verse: 17, tradition: 'second-temple',
        summary: 'Fire and worms in their flesh, wept forever',
        probe: 'in putting fire and worms in their flesh' },
      { work: '2baruch', chapter: 51, verse: 1, tradition: 'second-temple',
        summary: 'The condemned altered, the justified glorified',
        probe: 'the aspect of those who are condemned be afterwards changed' },
      { work: '2baruch', chapter: 51, verse: 5, tradition: 'second-temple',
        summary: 'Each sees the other transformed, positions reversed',
        probe: 'over whom they are now exalted' },
      { work: 'jubilees', chapter: 3, verse: 10, tradition: 'second-temple',
        summary: 'The commandment written on heavenly tablets',
        probe: 'the commandment is written on the heavenly tablets' },
      { work: 'testament-of-abraham-a', chapter: 12, verse: 1, tradition: 'second-temple',
        summary: 'A balance, a fire, a throne between gates',
        probe: 'holding in his hand a balance' },
      { work: 'testament-of-abraham-a', chapter: 13, verse: 1, tradition: 'second-temple',
        summary: 'Two angels write down sins and righteousness',
        probe: 'these are they that write down the sins' },
      { work: 'testament-of-abraham-b', chapter: 12, verse: 1, tradition: 'second-temple',
        summary: 'Abraham shown the place of judgment itself',
        probe: 'after Abraham had seen the place of judgment' },
      { work: 'philo-cherubim', chapter: 1, verse: 72, tradition: 'second-temple',
        summary: 'Brought before the judgment-seat of God',
        probe: 'being brought before the judgment-seat of God' },
      { work: 'm-avot', chapter: 3, verse: 1, tradition: 'rabbinic',
        summary: 'Know before whom you will give account',
        probe: 'before whom you are destined to give an account' },
      { work: 'tg-psj-deuteronomy', chapter: 5, verse: 11, tradition: 'rabbinic',
        summary: 'False swearing unacquitted at the great judgment',
        probe: 'in the day of the great judgment, will not acquit' },
      { work: 'tg-psj-genesis', chapter: 38, verse: 25, tradition: 'rabbinic',
        summary: 'Tamar implores mercy in her hour',
        probe: 'Mercy I implore from Thee, O Lord' },
      { work: 'af-polycarp', chapter: 6, verse: 2, tradition: 'apostolic-fathers',
        summary: 'All stand at the judgment-seat of Christ',
        probe: 'we must all stand at the judgment-seat of Christ' },
    ],
  },
  {
    id: 'repentance',
    group: 'Sin and salvation',
    label: 'Repentance and forgiveness',
    blurb:
      'Turning back, and whether there is a limit to how often you may. Sirach says do not put it '
      + 'off; Wisdom says God gives room for it on purpose; the Mishnah rules that saying “I shall '
      + 'sin and repent” forfeits the chance. Then Hermas draws a line no Jewish source here draws, '
      + 'allowing the baptised one further repentance and no more. The Prayer of Manasseh belongs '
      + 'to a different order from all of these: everything else on this page talks about repentance, '
      + 'and the prayer performs it, in the voice of the penitent himself.',
    canonicalAnchors:
      'The anchors are Ezekiel 18 and 33, Hosea 14, Joel 2:12–13 and Jonah 3. They are canonical '
      + 'and sit outside this corpus; Sirach and 1 Clement are both arguing straight out of them. '
      + 'The Prayer of Manasseh has a narrative anchor rather than a doctrinal one: 2 Chronicles '
      + '33:12–13 says the captive king prayed and was heard, without saying what he prayed. The '
      + 'prayer supplies the missing words, which is why it exists.',
    absences: [
      'Nobody here argues back against Hermas. Limiting the baptised to a single further repentance '
      + 'is the sharpest position anyone on this page takes, and the controversy it caused belongs '
      + 'to the century after this corpus ends.',
      'The Qumran material is missing, and it is the one body of evidence that would show repentance '
      + 'as a communal rite rather than an individual act — the covenant-renewal confession of the '
      + 'Community Rule, where the whole assembly says together that they have done wickedly. No '
      + 'public-domain or openly licensed English translation of the scrolls exists, so the Dead Sea '
      + 'Scrolls shelf of this library is still empty.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      // The Prayer of Manasseh leads because it is the only text here in the first person, and
      // because it says something none of the others do: that repentance was appointed for
      // sinners and NOT for the righteous patriarchs (12:8). Read next to 1 Clement 7:5 below —
      // repentance offered to every generation — the two are not saying the same thing.
      // It is Ode 12 of the Septuagint Odes, which is where the manuscripts put it.
      { work: 'Odes', chapter: 12, verse: 7, tradition: 'second-temple', citeAs: 'Prayer of Manasseh 7',
        summary: 'Repentance appointed for sinners, that they be saved',
        probe: 'hast appointed repentance unto sinners, that they may be saved' },
      { work: 'Odes', chapter: 12, verse: 8, tradition: 'second-temple', citeAs: 'Prayer of Manasseh 8',
        summary: 'Not appointed for the just, but for me',
        probe: 'hast not appointed repentance to the just' },
      { work: 'Odes', chapter: 12, verse: 9, tradition: 'second-temple', citeAs: 'Prayer of Manasseh 9',
        summary: 'Sins outnumbering the sands of the sea',
        probe: 'I have sinned above the number of the sands of the sea' },
      { work: 'Odes', chapter: 12, verse: 11, tradition: 'second-temple', citeAs: 'Prayer of Manasseh 11',
        summary: 'Bowing the knee of the heart, begging grace',
        probe: 'Now therefore I bow the knee of mine heart' },
      { work: 'Odes', chapter: 12, verse: 13, tradition: 'second-temple', citeAs: 'Prayer of Manasseh 13',
        summary: 'Forgive; do not reserve evil; God of penitents',
        probe: 'thou art the God, even the God of them that repent' },
      { work: 'Sir', chapter: 5, verse: 7, tradition: 'second-temple',
        summary: 'Do not put off turning to the Lord',
        probe: 'Make no tarrying to turn to the Lord' },
      { work: 'Sir', chapter: 17, verse: 25, tradition: 'second-temple',
        summary: 'Return, forsake sins, pray before his face',
        probe: 'Return unto the Lord, and forsake thy sins' },
      { work: 'Wis', chapter: 12, verse: 10, tradition: 'second-temple',
        summary: 'Judging slowly, God gave room to repent',
        probe: 'thou gavest them place of repentance' },
      { work: 'josaseneth', chapter: 10, verse: 16, tradition: 'second-temple',
        summary: 'Aseneth in sackcloth, sprinkled with ashes',
        probe: 'she took sackcloth and wrapped it round her waist' },
      { work: 'philo-rewards', chapter: 1, verse: 15, tradition: 'second-temple',
        summary: 'Repentance contends for a prize of its own',
        probe: 'another contest in which repentance contends for the prize' },
      { work: 'philo-rewards', chapter: 1, verse: 169, tradition: 'second-temple',
        summary: 'God defends the fortunes of those repenting',
        probe: 'God will nourish the virtues against the enemies of those who have repented' },
      // ── Rabbinic ─────────────────────────────────────────────────────────────────────
      { work: 'm-yoma', chapter: 8, verse: 8, tradition: 'rabbinic',
        summary: 'Repentance atones for the lighter transgressions',
        probe: 'Repentance effects atonement for light transgressions' },
      { work: 'm-yoma', chapter: 8, verse: 9, tradition: 'rabbinic',
        summary: 'Planning to sin and repent forfeits repentance',
        probe: 'I shall sin and repent, sin and repent' },
      { work: 'tg-isaiah', chapter: 6, verse: 10, tradition: 'rabbinic',
        summary: 'Hearts made dull lest they turn and heal',
        probe: 'lest they see with their eyes' },
      // ── Apostolic Fathers ────────────────────────────────────────────────────────────
      { work: 'af-1clement', chapter: 7, verse: 5, tradition: 'apostolic-fathers',
        summary: 'Every generation given a place for repentance',
        probe: 'hath given a place for repentance unto them that desire to turn' },
      { work: 'af-1clement', chapter: 7, verse: 6, tradition: 'apostolic-fathers',
        summary: 'Noah preached it; the obedient were saved',
        probe: 'Noah preached repentance' },
      { work: 'af-2clement', chapter: 16, verse: 1, tradition: 'apostolic-fathers',
        summary: 'Opportunity remains while there is still time',
        probe: 'we have found no small opportunity for repentance' },
      { work: 'af-hermas', chapter: 29, verse: 8, tradition: 'apostolic-fathers',
        summary: 'The repentant received, but not often',
        probe: 'one who hath sinned and repented must be received' },
      { work: 'af-hermas', chapter: 110, verse: 1, tradition: 'apostolic-fathers',
        summary: 'The shepherd names himself angel of repentance',
        probe: 'I, the shepherd, the angel of repentance' },
    ],
  },
]
