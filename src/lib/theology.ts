// The Theology page's curated content. Retrieval (scripts/build-theology.ts) decides what is
// POSSIBLE to cite; this file decides what is WORTH citing, and says what each passage says.
//
// Every entry carries a `probe`: an exact phrase from the passage. It does two jobs. It is what
// the side pane searches for, so a click lands on the passage itself rather than a topic search;
// and it is the build-time proof that the citation is real — `npx tsx scripts/build-theology.ts
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

export interface TopicPage {
  id: string
  label: string
  blurb: string
  /** What the sources do NOT say — as much a finding as what they do. */
  absences: string[]
  /** Canonical anchors the reader should have in mind; not in this corpus, so not linked. */
  canonicalAnchors: string
  entries: TopicEntry[]
}

export const THEOLOGY_PAGES: TopicPage[] = [
  {
    id: 'resurrection',
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
      + 'against them — Josephus below, and the New Testament.',
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
      + 'Dead Sea Scrolls, which this library does not yet hold. The Testaments below hint at a '
      + 'priestly figure beside the king, but the full picture is missing.',
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
]
