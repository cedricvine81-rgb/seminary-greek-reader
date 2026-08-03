// The Theology page's curated content. Retrieval (scripts/build-themes.ts) decides what is
// POSSIBLE to cite; this file decides what is WORTH citing, and says what each passage says.
//
// Every entry carries a `probe`: an exact phrase from the passage. It does two jobs. It is what
// the side pane searches for, so a click lands on the passage itself rather than a topic search;
// and it is the build-time proof that the citation is real — `npx tsx scripts/build-themes.ts
// resurrection --check` fails if a probe matches no passage, or matches one at a different
// address. A citation here therefore cannot drift out of true silently when a corpus is rebuilt.
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
      { work: 'psalms-of-solomon', chapter: 8, verse: 28, tradition: 'second-temple',
        summary: 'Prayer that God gather Israel’s dispersed',
        probe: 'Gather together the dispersed of Israel' },
      { work: 'psalms-of-solomon', chapter: 11, verse: 2, tradition: 'second-temple',
        summary: 'Good tidings in Jerusalem: God has visited',
        probe: 'For God hath had pity on Israel in visiting them' },
      { work: 'psalms-of-solomon', chapter: 17, verse: 26, tradition: 'second-temple',
        summary: 'The king gathers and judges a holy people',
        probe: 'he shall gather together a holy people' },
      { work: 'psalms-of-solomon', chapter: 17, verse: 28, tradition: 'second-temple',
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
      + 'one in this library.',
      'The expectation of TWO messiahs, one of Aaron and one of Israel, is known mainly from the '
      + 'Dead Sea Scrolls, which this library does not yet hold. The Testaments of the Twelve '
      + 'Patriarchs — a set of farewell speeches attributed to Jacob\u2019s sons, cited here as '
      + 'Testament of Judah and Testament of Levi \u2014 hint at a priestly figure beside the king '
      + '(Testament of Levi 8:14), but the full picture is missing.',
    ],
    entries: [
      // ── Second Temple Jewish ─────────────────────────────────────────────────────────
      { work: 'psalms-of-solomon', chapter: 17, verse: 21, tradition: 'second-temple',
        summary: 'Raise up their king, the son of David',
        probe: 'raise up unto them their king, the son of David' },
      { work: 'psalms-of-solomon', chapter: 17, verse: 30, tradition: 'second-temple',
        summary: 'He purges Jerusalem; the nations serve him',
        probe: 'he shall have the heathen nations to serve him under his yoke' },
      { work: 'psalms-of-solomon', chapter: 17, verse: 32, tradition: 'second-temple',
        summary: 'A righteous king, taught of God, Lord’s anointed',
        probe: 'he (shall be) a righteous king, taught of God' },
      { work: 'psalms-of-solomon', chapter: 17, verse: 34, tradition: 'second-temple',
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
      'The temple’s measurements and its daily service are set out in the Mishnah tractates Middot '
      + 'and Tamid, which this library does not hold. The rabbinic entries here are Yoma — the Day '
      + 'of Atonement — and the Targums, so what survives is the ritual of one day rather than the '
      + 'ordinary working of the place.',
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
]
