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
]
