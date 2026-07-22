// Catalogue of New Testament rhetorical figures for the Exegesis "Rhetoric" tab.
//
// Classification follows E. W. Bullinger, *Figures of Speech Used in the Bible* (1898, public
// domain) — comparison / substitution / omission / repetition / arrangement / emphasis.
// Occurrences are a curated, comprehensive-but-not-exhaustive selection of well-attested NT
// examples spanning all 27 books (Bullinger + standard rhetorical-critical handbooks);
// explanations are in plain language. Bengel's Gnomon note for each occurrence verse is
// fetched into /data/rhetoric/bengel.json and shown alongside. Single-chapter books use the
// form "Book 1:v".

export type DeviceGroup = 'comparison' | 'substitution' | 'omission' | 'repetition' | 'arrangement' | 'emphasis'

export const GROUP_LABEL: Record<DeviceGroup, string> = {
  comparison: 'Comparison', substitution: 'Substitution', omission: 'Omission',
  repetition: 'Repetition', arrangement: 'Arrangement', emphasis: 'Emphasis & tone',
}
export const GROUP_COLOR: Record<DeviceGroup, string> = {
  comparison: 'bg-blue-50 border-blue-200 text-blue-800',
  substitution: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  omission: 'bg-amber-50 border-amber-200 text-amber-800',
  repetition: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  arrangement: 'bg-purple-50 border-purple-200 text-purple-800',
  emphasis: 'bg-rose-50 border-rose-200 text-rose-800',
}

// source: undefined = drawn from a printed source (Bullinger / standard handbooks); 'editorial'
// = identified editorially (AI-assisted, reviewed), shown with an "Editorial" badge + caveat.
export interface Occurrence { ref: string; note?: string; source?: 'editorial' }
export interface Device {
  id: string
  name: string
  greek?: string
  group: DeviceGroup
  definition: string
  occurrences: Occurrence[]
}

export const DEVICES: Device[] = [
  // ── Comparison ──────────────────────────────────────────────────────────────────────
  {
    id: 'simile', name: 'Simile', greek: 'ὁμοίωσις', group: 'comparison',
    definition: 'An explicit comparison of two unlike things using “like” or “as.” Stated openly, so gentler than a metaphor.',
    occurrences: [
      { ref: 'Matt 10:16', note: '“wise as serpents and innocent as doves”' },
      { ref: 'Matt 13:33', note: 'the kingdom is “like” leaven' },
      { ref: 'Matt 17:2', note: 'his face shone “as the sun”' },
      { ref: 'Matt 23:27', note: '“like” whitewashed tombs' },
      { ref: 'Mark 1:10', note: 'the Spirit descending “like a dove”' },
      { ref: 'Luke 10:18', note: '“I saw Satan fall like lightning”' },
      { ref: 'Luke 22:44', note: 'sweat “like drops of blood”' },
      { ref: 'John 3:8', note: 'the Spirit is “like the wind”' },
      { ref: 'Acts 2:2', note: 'a sound “as of a rushing mighty wind”' },
      { ref: '1 Corinthians 13:12', note: '“now we see as in a mirror, dimly”' },
      { ref: '1 Corinthians 15:8', note: '“as to one untimely born”' },
      { ref: '1 Thessalonians 5:2', note: 'the day comes “as a thief in the night”' },
      { ref: '1 Peter 1:24', note: '“all flesh is as grass”' },
      { ref: '1 Peter 5:8', note: 'the devil “as a roaring lion”' },
      { ref: 'James 1:6', note: 'the doubter “like a wave of the sea”' },
      { ref: 'Revelation 1:14', note: 'hair “white as wool, as snow”; eyes “as a flame”' },
      { ref: 'Jude 1:12', note: '“clouds without water … waves … wandering stars” (a string of similes, vv. 12–13)' },
    ],
  },
  {
    id: 'metaphor', name: 'Metaphor', greek: 'μεταφορά', group: 'comparison',
    definition: 'An implied comparison that calls one thing another (“A is B”), without “like” or “as.”',
    occurrences: [
      { ref: 'Matt 5:13', note: '“you are the salt of the earth”' },
      { ref: 'Matt 5:14', note: '“you are the light of the world”' },
      { ref: 'Matt 7:15', note: 'false prophets are “ravenous wolves”' },
      { ref: 'Matt 9:37', note: '“the harvest is plentiful, the labourers few”' },
      { ref: 'Mark 8:15', note: '“the leaven of the Pharisees”' },
      { ref: 'Luke 13:32', note: '“go tell that fox” (Herod)' },
      { ref: 'John 1:29', note: '“the Lamb of God”' },
      { ref: 'John 6:35', note: '“I am the bread of life”' },
      { ref: 'John 8:12', note: '“I am the light of the world”' },
      { ref: 'John 10:11', note: '“I am the good shepherd”' },
      { ref: 'John 15:5', note: '“I am the vine, you are the branches”' },
      { ref: 'Romans 11:17', note: 'Gentiles “grafted in” to the olive tree' },
      { ref: '1 Corinthians 3:2', note: '“I fed you with milk, not solid food”' },
      { ref: '1 Corinthians 5:7', note: '“Christ our Passover” — purge the old leaven' },
      { ref: 'Ephesians 6:11', note: '“the whole armour of God”' },
      { ref: 'Colossians 1:18', note: 'Christ “the head of the body, the church”' },
      { ref: '2 Timothy 2:3', note: '“a good soldier of Christ Jesus”' },
      { ref: 'Hebrews 6:19', note: 'hope “an anchor of the soul”' },
      { ref: 'James 3:6', note: '“the tongue is a fire”' },
      { ref: '1 Peter 2:5', note: '“living stones … a spiritual house”' },
      { ref: '1 John 1:5', note: '“God is light”' },
      { ref: '1 John 4:8', note: '“God is love”' },
    ],
  },
  // ── Substitution ────────────────────────────────────────────────────────────────────
  {
    id: 'metonymy', name: 'Metonymy', greek: 'μετωνυμία', group: 'substitution',
    definition: 'Naming something by a word closely associated with it — the cause for the effect, the container for its contents, the author for his writings.',
    occurrences: [
      { ref: 'Matt 3:5', note: '“Jerusalem and all Judea went out” = the people' },
      { ref: 'Matt 26:39', note: '“let this cup pass” — the cup = the suffering' },
      { ref: 'Mark 10:38', note: '“the cup that I drink” = my passion' },
      { ref: 'Luke 16:29', note: '“Moses and the prophets” = their writings' },
      { ref: 'Acts 15:21', note: '“Moses … is read” = the law of Moses' },
      { ref: 'Romans 3:30', note: '“the circumcision” = the Jews' },
      { ref: '1 Corinthians 11:25', note: '“the cup” = the new covenant it seals' },
      { ref: 'Galatians 2:9', note: '“the circumcision / the uncircumcision” = Jews / Gentiles' },
      { ref: 'Philippians 3:3', note: '“we are the circumcision”' },
      { ref: 'Hebrews 12:24', note: 'the “blood” that “speaks”' },
      { ref: '2 John 1:12', note: '“paper and ink” = a written letter' },
    ],
  },
  {
    id: 'synecdoche', name: 'Synecdoche', greek: 'συνεκδοχή', group: 'substitution',
    definition: 'Substituting a part for the whole (or the whole for a part) — “all the world” for the empire, “flesh and blood” for human beings.',
    occurrences: [
      { ref: 'Matt 6:11', note: '“daily bread” = all that we need' },
      { ref: 'Matt 16:17', note: '“flesh and blood” = mere human agency' },
      { ref: 'Luke 2:1', note: '“all the world” = the Roman empire' },
      { ref: 'Acts 27:37', note: '“souls” = persons' },
      { ref: 'Romans 3:20', note: '“no flesh” = no human being' },
      { ref: '1 Corinthians 1:29', note: '“no flesh should glory”' },
      { ref: 'Galatians 1:16', note: '“flesh and blood” = any human counsel' },
    ],
  },
  {
    id: 'merism', name: 'Merism', group: 'substitution',
    definition: 'Naming two opposite extremes to take in everything between — “heaven and earth” for the whole created order.',
    occurrences: [
      { ref: 'Matt 5:18', note: '“till heaven and earth pass away” = for all time' },
      { ref: 'Matt 11:25', note: '“Lord of heaven and earth” = of everything' },
      { ref: 'Matt 28:18', note: '“all authority in heaven and on earth”' },
      { ref: 'Acts 4:24', note: '“you made heaven and earth, the sea, and all that is in them”' },
      { ref: 'Philippians 2:10', note: '“in heaven and on earth and under the earth”' },
      { ref: 'Colossians 1:16', note: '“all things … in heaven and on earth”' },
      { ref: 'Revelation 1:8', note: '“the Alpha and the Omega” = beginning to end, all' },
      { ref: 'Revelation 22:13', note: '“the first and the last, the beginning and the end”' },
    ],
  },
  // ── Omission ────────────────────────────────────────────────────────────────────────
  {
    id: 'ellipsis', name: 'Ellipsis', greek: 'ἔλλειψις', group: 'omission',
    definition: 'A word or words are deliberately left out and must be supplied by the reader — creating compression and force.',
    occurrences: [
      { ref: 'Matt 25:9', note: '“not so, lest [there be] not enough”' },
      { ref: 'Romans 5:18', note: '“as … so also …” with verbs supplied' },
      { ref: '1 Corinthians 6:13', note: '“food for the stomach, and the stomach for food”' },
      { ref: '2 Corinthians 9:6', note: '“he who sows sparingly [will reap] sparingly”' },
      { ref: 'Galatians 2:9', note: '“we [should go] to the Gentiles, they to the circumcision”' },
      { ref: '2 Thessalonians 2:3', note: 'the apodosis is left unstated (“that day will not come…”)' },
    ],
  },
  {
    id: 'asyndeton', name: 'Asyndeton', greek: 'ἀσύνδετον', group: 'omission',
    definition: 'Conjunctions are omitted between items in a series, producing a rapid, weighty, piled-up effect.',
    occurrences: [
      { ref: 'Matt 15:19', note: 'the list of evils without connectives' },
      { ref: 'Romans 1:29', note: 'the vice-list runs on without “and”' },
      { ref: '1 Corinthians 3:12', note: '“gold, silver, precious stones, wood, hay, straw”' },
      { ref: '2 Corinthians 7:11', note: 'a rush of nouns without connectives' },
      { ref: 'Galatians 5:22', note: '“love, joy, peace, patience …” (the fruit of the Spirit)' },
      { ref: '1 Timothy 3:16', note: 'the six clauses of the “mystery of godliness”' },
      { ref: '2 Timothy 3:2', note: 'the vice-list of the last days' },
    ],
  },
  {
    id: 'aposiopesis', name: 'Aposiopesis', greek: 'ἀποσιώπησις', group: 'omission',
    definition: 'A sentence is broken off unfinished, as if the speaker cannot or will not go on.',
    occurrences: [
      { ref: 'Luke 13:9', note: '“and if it bears fruit —; but if not …”' },
      { ref: 'Luke 19:42', note: '“if you had known …” — the sentence trails off' },
      { ref: 'John 6:62', note: '“what if you were to see …?” left hanging' },
      { ref: 'Acts 23:9', note: '“if a spirit or an angel has spoken to him —”' },
      { ref: 'Romans 9:22', note: '“What if God … endured …” — the thought breaks off' },
    ],
  },
  {
    id: 'zeugma', name: 'Zeugma', greek: 'ζεῦγμα', group: 'omission',
    definition: 'One verb is made to govern two objects, though it strictly fits only one — the second borrows the verb by economy.',
    occurrences: [
      { ref: 'Luke 1:64', note: '“his mouth was opened and his tongue [loosed]”' },
      { ref: '1 Corinthians 3:2', note: '“I fed you with milk, not [gave you] solid food”' },
      { ref: '1 Timothy 4:3', note: '“forbidding to marry, [commanding] to abstain from foods”' },
    ],
  },
  // ── Repetition ──────────────────────────────────────────────────────────────────────
  {
    id: 'anaphora', name: 'Anaphora', greek: 'ἀναφορά', group: 'repetition',
    definition: 'The same word or phrase begins a series of successive clauses, hammering a theme.',
    occurrences: [
      { ref: 'Matt 5:3', note: '“Blessed are …” through the Beatitudes' },
      { ref: 'Matt 6:2', note: '“When you give … pray … fast” (6:2, 5, 16)' },
      { ref: 'Matt 23:13', note: '“Woe to you, scribes and Pharisees …” repeated' },
      { ref: 'Luke 6:20', note: '“Blessed are you …” (the Lukan Beatitudes)' },
      { ref: 'Romans 8:35', note: '“shall tribulation, or distress, or persecution …?”' },
      { ref: '1 Corinthians 13:4', note: '“Love is … love …”' },
      { ref: '2 Corinthians 6:4', note: '“in much endurance, in afflictions, in hardships …”' },
      { ref: '2 Corinthians 11:26', note: '“in perils of … in perils of …”' },
      { ref: 'Hebrews 11:4', note: '“By faith …” repeated down the chapter' },
      { ref: 'James 3:17', note: '“wisdom … is pure, then peaceable, gentle …”' },
    ],
  },
  {
    id: 'epizeuxis', name: 'Epizeuxis', greek: 'ἐπίζευξις', group: 'repetition',
    definition: 'Immediate repetition of a word for intense emphasis or emotion, with nothing between.',
    occurrences: [
      { ref: 'Matt 7:21', note: '“Lord, Lord”' },
      { ref: 'Matt 23:37', note: '“Jerusalem, Jerusalem”' },
      { ref: 'Mark 15:34', note: '“Eloi, Eloi”' },
      { ref: 'Luke 8:24', note: '“Master, Master”' },
      { ref: 'Luke 10:41', note: '“Martha, Martha”' },
      { ref: 'Luke 22:31', note: '“Simon, Simon”' },
      { ref: 'Acts 9:4', note: '“Saul, Saul”' },
      { ref: 'Galatians 1:8', note: '“let him be accursed” repeated (v. 9)' },
      { ref: 'Revelation 18:2', note: '“fallen, fallen is Babylon”' },
    ],
  },
  {
    id: 'polysyndeton', name: 'Polysyndeton', greek: 'πολυσύνδετον', group: 'repetition',
    definition: 'Conjunctions (“and … and … nor … nor …”) are piled up to slow the pace and weight every item.',
    occurrences: [
      { ref: 'Luke 14:21', note: '“the poor, and the maimed, and the halt, and the blind”' },
      { ref: 'Romans 2:19', note: '“a guide … a light … an instructor … a teacher …”' },
      { ref: 'Romans 8:38', note: '“nor … nor … nor …” through vv. 38–39' },
      { ref: 'Revelation 5:12', note: '“power, and riches, and wisdom, and strength …”' },
      { ref: 'Revelation 7:12', note: '“blessing, and glory, and wisdom, and thanksgiving …”' },
    ],
  },
  {
    id: 'pleonasm', name: 'Pleonasm', greek: 'πλεονασμός', group: 'repetition',
    definition: 'A deliberate redundancy — more words than strictly needed — to underline or solemnise a statement.',
    occurrences: [
      { ref: 'Matt 5:2', note: '“he opened his mouth and taught them”' },
      { ref: 'John 1:20', note: '“he confessed, and denied not, but confessed”' },
      { ref: 'Acts 2:30', note: '“being a prophet, and knowing …”' },
      { ref: 'Philippians 1:23', note: '“to depart and to be with Christ” — piled for weight' },
      { ref: 'Revelation 3:17', note: '“wretched and miserable and poor and blind and naked”' },
    ],
  },
  // ── Arrangement ─────────────────────────────────────────────────────────────────────
  {
    id: 'chiasmus', name: 'Chiasmus', greek: 'χιασμός', group: 'arrangement',
    definition: 'An inverted, mirror-image arrangement (A–B–B′–A′). The crossing often puts emphasis at the centre or ties the outer terms together.',
    occurrences: [
      { ref: 'Matt 6:24', note: 'hate–love … hold to–despise (the two masters)' },
      { ref: 'Matt 7:6', note: 'dogs–swine … trample–tear (A–B–B′–A′)' },
      { ref: 'Matt 23:12', note: '“exalts → humbled; humbles → exalted”' },
      { ref: 'Mark 2:27', note: '“sabbath for man … man for the sabbath”' },
      { ref: 'Luke 1:52', note: '“put down the mighty … exalted the lowly”' },
      { ref: 'Romans 10:9', note: 'mouth–heart … heart–mouth (vv. 9–10)' },
      { ref: 'Colossians 3:11', note: 'the crossed pairs “Greek/Jew … slave/free”' },
      { ref: 'Philemon 1:5', note: 'love–faith … Lord Jesus–saints (a chiastic pair)' },
    ],
  },
  {
    id: 'antithesis', name: 'Antithesis', greek: 'ἀντίθεσις', group: 'arrangement',
    definition: 'Two opposite ideas are deliberately set side by side so that each sharpens the other.',
    occurrences: [
      { ref: 'Matt 5:21', note: '“You have heard … but I say to you” (5:21–48)' },
      { ref: 'Matt 7:13', note: 'the narrow gate set against the wide' },
      { ref: 'John 3:6', note: '“flesh gives birth to flesh; Spirit to spirit”' },
      { ref: 'Romans 6:23', note: '“the wages of sin … the free gift of God”' },
      { ref: 'Romans 8:5', note: 'those “according to the flesh” vs. “the Spirit”' },
      { ref: '1 Corinthians 15:42', note: '“sown … raised” (perishable/imperishable)' },
      { ref: '2 Corinthians 4:18', note: '“the things seen … the things unseen”' },
      { ref: '2 Corinthians 6:8', note: '“by honour and dishonour, by evil report and good”' },
      { ref: 'Galatians 5:17', note: 'the flesh against the Spirit' },
      { ref: '1 Peter 3:18', note: '“put to death in the flesh, made alive in the Spirit”' },
      { ref: '3 John 1:11', note: '“do not imitate evil but imitate good”' },
    ],
  },
  {
    id: 'parallelism', name: 'Parallelism', group: 'arrangement',
    definition: 'Successive lines echo one another in structure — saying the same thing twice (synonymous) or balancing matched clauses.',
    occurrences: [
      { ref: 'Matt 7:7', note: '“ask … seek … knock” — three matched lines' },
      { ref: 'Luke 1:46', note: 'the Magnificat’s paired lines (vv. 46–55)' },
      { ref: 'John 1:3', note: '“all things were made … without him nothing was made”' },
      { ref: 'Romans 11:33', note: 'the paired exclamations (vv. 33–35)' },
      { ref: '2 Corinthians 6:14', note: 'the five balanced rhetorical questions (vv. 14–16)' },
    ],
  },
  {
    id: 'inclusio', name: 'Inclusio', group: 'arrangement',
    definition: 'A section is “book-ended” by repeating a word or idea at its start and finish, framing everything between.',
    occurrences: [
      { ref: 'Matt 1:23', note: '“God with us” — echoed by “I am with you always” (28:20)' },
      { ref: 'Matt 5:3', note: '“theirs is the kingdom” frames the Beatitudes (v. 10)' },
      { ref: 'Matt 7:16', note: '“by their fruits” (also v. 20)' },
      { ref: 'John 1:1', note: '“the Word was God” … “the only God” (v. 18) frame the prologue' },
      { ref: 'Romans 1:5', note: '“the obedience of faith” — echoed at 16:26' },
      { ref: 'Revelation 1:8', note: '“Alpha and Omega” — framing with 22:13' },
    ],
  },
  {
    id: 'climax', name: 'Climax', greek: 'κλῖμαξ / gradatio', group: 'arrangement',
    definition: 'A chain of steps in which the end of one clause becomes the start of the next, building to a peak.',
    occurrences: [
      { ref: 'Romans 5:3', note: 'tribulation → perseverance → character → hope (vv. 3–5)' },
      { ref: 'Romans 8:29', note: 'foreknew → predestined → called → justified → glorified' },
      { ref: 'Romans 10:14', note: 'call → believe → hear → preach → send (vv. 14–15)' },
      { ref: '2 Peter 1:5', note: 'faith → virtue → knowledge → … love (vv. 5–7)' },
      { ref: 'James 1:15', note: 'desire → sin → death' },
    ],
  },
  {
    id: 'parenthesis', name: 'Parenthesis', group: 'arrangement',
    definition: 'An explanatory aside dropped into the sentence, which could be lifted out without breaking the grammar.',
    occurrences: [
      { ref: 'Matt 24:15', note: '“(let the reader understand)”' },
      { ref: 'Mark 7:19', note: '“(thus he declared all foods clean)”' },
      { ref: 'John 4:2', note: '“(although Jesus himself did not baptize)”' },
      { ref: 'Romans 5:13', note: 'the aside on law and sin (vv. 13–17)' },
      { ref: 'Ephesians 2:5', note: '“(by grace you have been saved)” inserted' },
      { ref: 'Ephesians 3:1', note: 'Paul breaks off, resuming the thought at v. 14' },
    ],
  },
  // ── Emphasis & tone ─────────────────────────────────────────────────────────────────
  {
    id: 'hyperbole', name: 'Hyperbole', greek: 'ὑπερβολή', group: 'emphasis',
    definition: 'Deliberate exaggeration, not meant literally, that drives a point home vividly.',
    occurrences: [
      { ref: 'Matt 5:29', note: '“pluck out your eye … cut off your hand”' },
      { ref: 'Matt 7:3', note: 'the “log” in your own eye' },
      { ref: 'Matt 17:20', note: 'faith “as a mustard seed” moves a mountain' },
      { ref: 'Matt 19:24', note: '“a camel through the eye of a needle”' },
      { ref: 'Matt 23:24', note: '“strain out a gnat and swallow a camel”' },
      { ref: 'Mark 11:23', note: '“say to this mountain, Be removed …”' },
      { ref: 'Luke 14:26', note: '“hate his own father and mother …” (by comparison)' },
      { ref: 'John 12:19', note: '“the world has gone after him”' },
      { ref: 'John 21:25', note: '“the world itself could not contain the books”' },
      { ref: 'Galatians 4:15', note: '“you would have plucked out your eyes for me”' },
      { ref: 'Colossians 1:23', note: '“preached to every creature under heaven”' },
    ],
  },
  {
    id: 'litotes', name: 'Litotes', greek: 'λιτότης', group: 'emphasis',
    definition: 'Understatement that affirms by denying the contrary (“no small …”, “not ashamed”) — often a quiet way of saying much.',
    occurrences: [
      { ref: 'Acts 1:5', note: '“not many days hence”' },
      { ref: 'Acts 12:18', note: '“no small stir”' },
      { ref: 'Acts 14:28', note: '“no little time”' },
      { ref: 'Acts 17:4', note: '“not a few” of the leading women' },
      { ref: 'Acts 19:11', note: '“no ordinary miracles”' },
      { ref: 'Acts 21:39', note: '“a citizen of no mean city”' },
      { ref: 'Acts 26:19', note: '“I was not disobedient”' },
      { ref: 'Acts 26:26', note: '“this was not done in a corner”' },
      { ref: 'Acts 27:20', note: '“no small tempest”' },
      { ref: 'Romans 1:16', note: '“I am not ashamed of the gospel” (= I am proud of it)' },
      { ref: '1 Corinthians 11:22', note: '“shall I praise you? I will not”' },
    ],
  },
  {
    id: 'irony', name: 'Irony', greek: 'εἰρωνεία', group: 'emphasis',
    definition: 'Saying the opposite of what is meant, so the real sense is felt through the contrast — often gently mocking.',
    occurrences: [
      { ref: 'Matt 27:29', note: 'the soldiers mock: “Hail, King of the Jews!”' },
      { ref: 'Mark 7:9', note: '“you nicely set aside the commandment of God”' },
      { ref: 'John 3:10', note: '“are you the teacher of Israel and do not know …?”' },
      { ref: 'Acts 26:28', note: '“almost you persuade me …”' },
      { ref: '1 Corinthians 4:8', note: '“already you have become rich, you have reigned as kings”' },
      { ref: '1 Corinthians 4:10', note: '“we are fools … but you are wise”' },
      { ref: '2 Corinthians 11:19', note: '“you gladly bear with fools”' },
      { ref: '2 Corinthians 12:13', note: '“forgive me this wrong!”' },
      { ref: 'James 2:19', note: '“you do well; the demons also believe”' },
    ],
  },
  {
    id: 'erotesis', name: 'Rhetorical question', greek: 'ἐρώτησις', group: 'emphasis',
    definition: 'A question asked for effect, not for an answer — to affirm, deny, or provoke thought more forcibly than a statement.',
    occurrences: [
      { ref: 'Matt 6:26', note: '“Are you not of more value than they?”' },
      { ref: 'Matt 7:9', note: '“which of you, if his son asks for bread, will give a stone?”' },
      { ref: 'Matt 16:26', note: '“what will it profit a man …?”' },
      { ref: 'Mark 8:36', note: '“what does it profit … to gain the world and lose his soul?”' },
      { ref: 'John 18:38', note: '“What is truth?”' },
      { ref: 'Romans 6:1', note: '“Shall we continue in sin …?”' },
      { ref: 'Romans 7:24', note: '“Who will deliver me …?”' },
      { ref: 'Romans 8:31', note: '“If God is for us, who can be against us?” (vv. 31–35)' },
      { ref: 'Romans 9:19', note: '“Why does he still find fault?”' },
      { ref: 'Romans 11:34', note: '“Who has known the mind of the Lord?”' },
      { ref: '1 Corinthians 1:20', note: '“Where is the wise? … Has not God made foolish …?”' },
      { ref: '1 Corinthians 9:1', note: '“Am I not free? Am I not an apostle?”' },
      { ref: '1 Corinthians 15:55', note: '“O death, where is your sting?”' },
      { ref: 'Galatians 3:1', note: '“O foolish Galatians, who has bewitched you?”' },
      { ref: 'James 4:1', note: '“What causes quarrels among you?”' },
    ],
  },
  {
    id: 'personification', name: 'Personification', greek: 'προσωποποιΐα', group: 'emphasis',
    definition: 'Giving human traits, actions, or speech to something impersonal or abstract (sin, death, love, Scripture, creation).',
    occurrences: [
      { ref: 'Matt 6:34', note: '“tomorrow will be anxious for itself”' },
      { ref: 'Matt 11:19', note: '“wisdom is justified by her deeds”' },
      { ref: 'Romans 5:14', note: '“death reigned from Adam to Moses”' },
      { ref: 'Romans 6:12', note: 'sin as a would-be king (“let not sin reign”)' },
      { ref: 'Romans 7:11', note: 'sin “deceived me and … killed me”' },
      { ref: 'Romans 8:22', note: 'creation “groans” together' },
      { ref: '1 Corinthians 13:4', note: 'Love “is patient … is kind … does not envy”' },
      { ref: 'Galatians 3:8', note: 'the Scripture “foreseeing … preached beforehand”' },
      { ref: 'Galatians 3:22', note: '“the Scripture has shut up all under sin”' },
      { ref: 'Hebrews 12:24', note: 'the blood that “speaks”' },
      { ref: 'James 5:4', note: 'the withheld wages that “cry out”' },
    ],
  },
  {
    id: 'hendiadys', name: 'Hendiadys', greek: 'ἓν διὰ δυοῖν', group: 'emphasis',
    definition: 'One idea expressed by two words joined with “and,” the second really qualifying the first (“hope and resurrection” = hope of the resurrection).',
    occurrences: [
      { ref: 'Luke 21:15', note: '“a mouth and wisdom” = wise speech' },
      { ref: 'Acts 23:6', note: '“the hope and resurrection of the dead” = hope of the resurrection' },
      { ref: 'Colossians 2:8', note: '“philosophy and empty deceit”' },
      { ref: '2 Timothy 1:10', note: '“life and immortality” = immortal life' },
      { ref: 'Titus 2:13', note: '“the blessed hope and appearing” = hope of the appearing' },
    ],
  },
  {
    id: 'paronomasia', name: 'Paronomasia (wordplay)', greek: 'παρονομασία', group: 'emphasis',
    definition: 'A play on words that sound alike but differ in sense — puns, rhyme, and near-repetition the Greek makes audible.',
    occurrences: [
      { ref: 'Matt 16:18', note: 'Πέτρος (Peter) / πέτρα (rock)' },
      { ref: 'Acts 8:30', note: 'γινώσκεις / ἀναγινώσκεις (“do you know … what you read?”)' },
      { ref: 'Romans 1:29', note: 'φθόνου / φόνου (envy / murder)' },
      { ref: 'Romans 2:1', note: 'κρίνεις / κατακρίνεις (“you judge … you condemn”)' },
      { ref: 'Romans 12:3', note: 'φρονεῖν / ὑπερφρονεῖν / σωφρονεῖν' },
      { ref: '1 Corinthians 7:31', note: 'χρώμενοι / καταχρώμενοι (using / using up)' },
      { ref: '2 Corinthians 3:2', note: 'γινωσκομένη / ἀναγινωσκομένη (known / read)' },
      { ref: '2 Corinthians 4:8', note: 'ἀπορούμενοι / ἐξαπορούμενοι (perplexed / despairing)' },
      { ref: 'Philippians 3:2', note: 'κατατομή / περιτομή (mutilation / circumcision, v. 3)' },
      { ref: '2 Thessalonians 3:11', note: 'ἐργαζομένους / περιεργαζομένους (working / busybodies)' },
      { ref: 'Philemon 1:11', note: 'Onesimus (“useful”): ἄχρηστον / εὔχρηστον' },
      { ref: 'Philemon 1:20', note: 'ὀναίμην — “let me have benefit,” a pun on Onesimus' },
    ],
  },
  {
    id: 'oxymoron', name: 'Oxymoron / paradox', greek: 'ὀξύμωρον', group: 'emphasis',
    definition: 'A pointed pairing of apparently contradictory terms that expresses a deeper truth (“dying, and behold we live”).',
    occurrences: [
      { ref: 'Matt 10:39', note: '“whoever finds his life will lose it …”' },
      { ref: 'Matt 20:16', note: '“the last will be first, and the first last”' },
      { ref: 'Matt 23:11', note: '“the greatest among you shall be your servant”' },
      { ref: 'Mark 8:35', note: '“whoever loses his life … will save it”' },
      { ref: 'John 11:25', note: '“though he die, yet shall he live”' },
      { ref: 'John 12:24', note: 'the grain must die to bear fruit' },
      { ref: '1 Corinthians 1:25', note: '“the foolishness of God is wiser than men”' },
      { ref: '1 Corinthians 7:22', note: 'the Lord’s freedman / Christ’s slave' },
      { ref: '2 Corinthians 6:9', note: '“as dying, and behold we live …” (vv. 9–10)' },
      { ref: '2 Corinthians 8:9', note: '“though he was rich, yet … he became poor”' },
      { ref: '2 Corinthians 12:10', note: '“when I am weak, then I am strong”' },
      { ref: 'Galatians 2:20', note: '“I live; yet not I, but Christ lives in me”' },
      { ref: 'Philippians 3:7', note: '“gain … I counted as loss”' },
      { ref: '1 Timothy 5:6', note: 'she “is dead while she lives”' },
    ],
  },
  {
    id: 'apostrophe', name: 'Apostrophe', greek: 'ἀποστροφή', group: 'emphasis',
    definition: 'A sudden turn from the audience to address someone or something absent, dead, or abstract directly.',
    occurrences: [
      { ref: 'Matt 11:21', note: '“Woe to you, Chorazin! … Bethsaida!”' },
      { ref: 'Luke 10:13', note: 'the same address to the absent towns' },
      { ref: 'Romans 2:1', note: '“O man, whoever you are who judges …”' },
      { ref: 'Romans 9:20', note: '“O man, who are you to answer back to God?”' },
      { ref: '1 Corinthians 15:55', note: 'the speaker turns to address “death” itself' },
      { ref: 'Galatians 3:1', note: '“O foolish Galatians …”' },
      { ref: 'James 4:13', note: '“Come now, you who say, Today or tomorrow …”' },
      { ref: 'James 5:1', note: '“Come now, you rich, weep …”' },
    ],
  },
  {
    id: 'allegory', name: 'Allegory', greek: 'ἀλληγορία', group: 'emphasis',
    definition: 'An extended metaphor: a whole passage in which the surface story stands throughout for a deeper spiritual meaning.',
    occurrences: [
      { ref: 'John 10:1', note: 'the shepherd, the door, and the sheepfold (vv. 1–16)' },
      { ref: 'John 15:1', note: 'the vine and the branches (vv. 1–8)' },
      { ref: 'Romans 11:17', note: 'the olive tree and its grafted branches (vv. 17–24)' },
      { ref: '1 Corinthians 3:10', note: 'building on the foundation (vv. 10–15)' },
      { ref: 'Galatians 4:24', note: 'Hagar and Sarah — “this is spoken allegorically”' },
      { ref: 'Ephesians 6:11', note: 'the armour of God (vv. 11–17)' },
    ],
  },
  {
    id: 'apodioxis', name: 'Apodioxis (emphatic denial)', greek: 'μὴ γένοιτο', group: 'emphasis',
    definition: 'An indignant rejection of a false inference as utterly abhorrent — Paul’s “God forbid!” / “By no means!” (μὴ γένοιτο), the hallmark rebuttal of his diatribe style.',
    occurrences: [
      { ref: 'Luke 20:16', note: '“God forbid” — the crowd’s recoil at the vineyard verdict' },
      { ref: 'Romans 3:4', note: '“God forbid: yea, let God be true, but every man a liar”' },
      { ref: 'Romans 3:6', note: '“God forbid: for then how shall God judge the world?”' },
      { ref: 'Romans 3:31', note: '“do we then make void the law …? God forbid”' },
      { ref: 'Romans 6:2', note: '“How shall we … live any longer therein? God forbid”' },
      { ref: 'Romans 6:15', note: '“shall we sin, because … under grace? God forbid”' },
      { ref: 'Romans 7:7', note: '“Is the law sin? God forbid”' },
      { ref: 'Romans 7:13', note: '“was … that which is good made death …? God forbid”' },
      { ref: 'Romans 9:14', note: '“Is there unrighteousness with God? God forbid”' },
      { ref: 'Romans 11:1', note: '“Hath God cast away his people? God forbid”' },
      { ref: 'Romans 11:11', note: '“have they stumbled that they should fall? God forbid”' },
      { ref: '1 Corinthians 6:15', note: '“members of an harlot? God forbid”' },
      { ref: 'Galatians 2:17', note: '“is … Christ the minister of sin? God forbid”' },
      { ref: 'Galatians 3:21', note: '“is the law then against the promises …? God forbid”' },
      { ref: 'Galatians 6:14', note: '“God forbid that I should glory, save in the cross”' },
    ],
  },
]

// ── Landmark passages (hand-curated) ─────────────────────────────────────────────────
// Well-attested figures in high-value teaching passages across the NT, layered on top of
// the sets above (and the Bullinger per-book data). Standard rhetorical-critical readings;
// each note is plain language. Merged into DEVICES below by id, deduped by ref so a verse
// the base set or Bullinger already lists is never doubled.
const LANDMARKS: Record<string, Occurrence[]> = {
  metaphor: [
    { ref: 'John 6:51', note: '“I am the living bread which came down from heaven”' },
    { ref: 'John 10:9', note: '“I am the door of the sheep”' },
    { ref: 'John 14:6', note: '“I am the way, the truth, and the life”' },
    { ref: '1 Corinthians 12:27', note: '“ye are the body of Christ”' },
    { ref: 'Ephesians 2:20', note: 'Christ Jesus “the chief corner stone”' },
    { ref: 'Ephesians 5:23', note: '“the husband is the head of the wife”' },
    { ref: '2 Timothy 4:7', note: '“I have fought a good fight” (athletic/military metaphor)' },
    { ref: 'Hebrews 12:29', note: '“our God is a consuming fire”' },
    { ref: 'Revelation 5:5', note: '“the Lion of the tribe of Juda”' },
    { ref: 'Revelation 22:16', note: '“the bright and morning star”' },
  ],
  metonymy: [
    { ref: 'Matt 10:34', note: '“not … peace, but a sword” — sword = war/division' },
    { ref: 'Luke 22:20', note: '“this cup is the new testament in my blood”' },
    { ref: 'Romans 13:4', note: '“he beareth not the sword in vain” — sword = judicial power' },
    { ref: '1 Corinthians 10:21', note: '“the cup of the Lord … the table of the Lord”' },
  ],
  synecdoche: [
    { ref: 'John 1:14', note: '“the Word was made flesh” — flesh = a full human being' },
    { ref: 'Acts 2:41', note: '“about three thousand souls” — souls = persons' },
    { ref: 'Romans 16:4', note: '“laid down their own necks” — necks = their very lives' },
    { ref: '1 Corinthians 11:26', note: '“as often as ye eat this bread” — bread = the whole meal' },
  ],
  merism: [
    { ref: 'Matt 5:45', note: 'sun on “evil and … good,” rain on “just and … unjust” = all alike' },
    { ref: 'Romans 14:8', note: '“whether we live … or die, we are the Lord’s”' },
    { ref: '1 Corinthians 3:22', note: '“the world, or life, or death … present, or … to come” = all' },
    { ref: 'Ephesians 3:18', note: '“breadth, and length, and depth, and height” = the whole immensity' },
    { ref: 'Revelation 21:6', note: '“the Alpha and Omega, the beginning and the end”' },
  ],
  antithesis: [
    { ref: 'Matt 7:17', note: '“good tree … good fruit; … corrupt tree … evil fruit”' },
    { ref: 'John 1:17', note: '“the law … by Moses; grace and truth … by Jesus Christ”' },
    { ref: 'John 3:36', note: '“believeth … hath life; believeth not … shall not see life”' },
    { ref: 'Romans 5:19', note: '“by one man’s disobedience … by the obedience of one”' },
    { ref: 'Romans 8:6', note: '“to be carnally minded is death; … spiritually minded is life”' },
    { ref: '1 Corinthians 15:22', note: '“in Adam all die … in Christ … made alive”' },
    { ref: '2 Corinthians 3:6', note: '“the letter killeth, but the spirit giveth life”' },
    { ref: '2 Corinthians 5:21', note: '“made him … sin … that we might be made … righteousness”' },
    { ref: 'Galatians 6:8', note: '“soweth to … flesh … corruption; … to the Spirit … life”' },
    { ref: '1 Thessalonians 5:5', note: '“children of light … not of the night, nor of darkness”' },
    { ref: '1 John 2:9', note: '“in the light, and hateth his brother, is in darkness”' },
  ],
  chiasmus: [
    { ref: 'Romans 2:7', note: 'life→glory … wrath … wrath → glory-honour (A–B–B′–A′, vv. 7–10)' },
  ],
  parallelism: [
    { ref: 'Matt 7:24', note: 'the wise vs. foolish builder — matched clauses (vv. 24–27)' },
    { ref: 'Philippians 2:6', note: 'the Christ-hymn’s balanced strophes (vv. 6–11)' },
    { ref: 'Colossians 1:15', note: 'the hymn to Christ’s supremacy (vv. 15–20)' },
    { ref: 'Revelation 22:11', note: '“he that is unjust … unjust still … he that is holy … holy still”' },
  ],
  anaphora: [
    { ref: 'Hebrews 11:3', note: '“Through faith …” — the refrain that drives the chapter' },
    { ref: '1 Corinthians 13:7', note: '“beareth all … believeth all … hopeth all … endureth all”' },
    { ref: '1 John 2:12', note: '“I write unto you …” repeated (vv. 12–14)' },
  ],
  epizeuxis: [
    { ref: 'Luke 13:34', note: '“O Jerusalem, Jerusalem”' },
    { ref: 'Luke 23:21', note: '“Crucify him, crucify him”' },
    { ref: 'Revelation 4:8', note: '“Holy, holy, holy” — the threefold Sanctus' },
    { ref: 'Revelation 8:13', note: '“Woe, woe, woe, to the inhabiters of the earth”' },
  ],
  polysyndeton: [
    { ref: 'Romans 9:4', note: '“the adoption, and the glory, and the covenants, and the … law …”' },
  ],
  hyperbole: [
    { ref: 'Matt 18:22', note: '“Until seventy times seven”' },
    { ref: 'Mark 1:5', note: '“all … Judaea … all … baptized” — sweeping generalisation' },
    { ref: 'Acts 17:6', note: '“these that have turned the world upside down”' },
  ],
  litotes: [
    { ref: 'Acts 28:2', note: '“shewed us no little kindness”' },
    { ref: 'Hebrews 4:15', note: '“not an high priest which cannot be touched with … our infirmities”' },
  ],
  irony: [
    { ref: 'John 11:50', note: 'Caiaphas’ unwitting irony: “expedient that one man should die”' },
    { ref: '2 Corinthians 11:5', note: '“not a whit behind the very chiefest apostles”' },
  ],
  erotesis: [
    { ref: 'Romans 3:1', note: '“What advantage then hath the Jew?”' },
    { ref: 'Romans 4:1', note: '“What shall we say then that Abraham … hath found?”' },
    { ref: 'Romans 6:15', note: '“shall we sin, because we are … under grace?”' },
    { ref: 'Romans 8:32', note: '“how shall he not … also freely give us all things?”' },
    { ref: 'Romans 8:34', note: '“Who is he that condemneth?”' },
    { ref: 'Romans 9:14', note: '“Is there unrighteousness with God?”' },
    { ref: '1 Corinthians 6:2', note: '“know ye not that the saints shall judge the world?”' },
    { ref: '1 Corinthians 15:12', note: '“how say some … that there is no resurrection?”' },
    { ref: 'James 2:14', note: '“What doth it profit … though a man say he hath faith …?”' },
    { ref: 'James 3:11', note: '“Doth a fountain send forth … sweet water and bitter?”' },
  ],
  personification: [
    { ref: 'Romans 10:6', note: '“the righteousness which is of faith speaketh on this wise”' },
    { ref: '1 Corinthians 12:15', note: '“if the foot shall say, Because I am not the hand …”' },
  ],
  oxymoron: [
    { ref: '1 Corinthians 3:18', note: '“let him become a fool, that he may be wise”' },
  ],
  hendiadys: [
    { ref: 'John 4:23', note: '“in spirit and in truth” = in true, Spirit-given worship' },
  ],
  inclusio: [
    { ref: 'Matt 4:23', note: '“teaching … preaching … healing” frames the ministry (echoed at 9:35)' },
  ],
}

// Merge the landmark occurrences into their devices (dedupe by ref).
for (const d of DEVICES) {
  const extra = LANDMARKS[d.id]
  if (!extra) continue
  const seen = new Set(d.occurrences.map(o => o.ref))
  for (const o of extra) if (!seen.has(o.ref)) { d.occurrences.push(o); seen.add(o.ref) }
}

// ── Editorial entries (AI-assisted, reviewed) ────────────────────────────────────────
// Figures editorially identified in passages the printed sources (Bullinger et al.) leave
// uncatalogued — chiefly narrative, where coverage was thinnest. NOT drawn from a printed
// source, so each is tagged source:'editorial' and the UI shows an "Editorial" badge + a
// caveat. Only added where the figure is clear and standard; skipped if a sourced entry
// already covers the verse (so the badge only ever marks genuinely editorial calls).
const EDITORIAL: Record<string, Occurrence[]> = {
  antithesis: [
    { ref: 'Matt 8:20', note: '“foxes have holes … the Son of man hath not where to lay his head”' },
    { ref: 'Mark 5:39', note: '“the damsel is not dead, but sleepeth”' },
    { ref: 'Luke 15:24', note: '“was dead, and is alive again; was lost, and is found”' },
    { ref: 'Luke 15:32', note: 'the father repeats “was dead … alive; … lost … found”' },
    { ref: 'John 3:30', note: '“He must increase, but I must decrease”' },
    { ref: 'John 9:25', note: '“whereas I was blind, now I see”' },
    { ref: 'Luke 24:6', note: '“He is not here, but is risen”' },
    { ref: 'Acts 5:29', note: '“We ought to obey God rather than men”' },
    { ref: 'Acts 20:35', note: '“It is more blessed to give than to receive”' },
  ],
  erotesis: [
    { ref: 'Luke 1:34', note: '“How shall this be, seeing I know not a man?”' },
    { ref: 'Mark 4:38', note: '“carest thou not that we perish?”' },
    { ref: 'John 1:46', note: '“Can there any good thing come out of Nazareth?”' },
    { ref: 'Matt 16:15', note: '“whom say ye that I am?”' },
    { ref: 'Luke 10:29', note: '“And who is my neighbour?”' },
    { ref: 'Luke 24:5', note: '“Why seek ye the living among the dead?”' },
    { ref: 'Matt 27:46', note: '“My God, my God, why hast thou forsaken me?”' },
    { ref: 'John 21:15', note: '“lovest thou me more than these?”' },
  ],
  irony: [
    { ref: 'Matt 27:42', note: '“He saved others; himself he cannot save” — the mockers’ unwitting truth' },
    { ref: 'Luke 23:35', note: '“let him save himself, if he be Christ”' },
    { ref: 'John 19:5', note: 'Pilate’s “Behold the man!” — dramatic irony' },
    { ref: 'John 19:19', note: 'the titulus “JESUS OF NAZARETH THE KING OF THE JEWS”' },
  ],
  epizeuxis: [
    { ref: 'John 19:6', note: '“Crucify him, crucify him”' },
  ],
  metaphor: [
    { ref: 'Matt 16:6', note: '“beware of the leaven of the Pharisees”' },
    { ref: 'John 2:19', note: '“Destroy this temple, and in three days I will raise it up” (his body)' },
  ],
  hyperbole: [
    { ref: 'Mark 1:33', note: '“all the city was gathered together at the door”' },
    { ref: 'Luke 15:7', note: '“joy … over one sinner … more than over ninety and nine”' },
  ],
  personification: [
    { ref: 'Luke 19:40', note: '“the stones would immediately cry out”' },
  ],
  oxymoron: [
    { ref: 'Mark 10:31', note: '“many that are first shall be last; and the last first”' },
    { ref: 'John 11:26', note: '“whosoever liveth and believeth in me shall never die”' },
  ],
  parallelism: [
    { ref: 'Luke 2:14', note: '“Glory to God in the highest, and on earth peace”' },
  ],
  merism: [
    { ref: 'Matt 8:11', note: '“many shall come from the east and west” = from everywhere' },
  ],
  climax: [
    { ref: 'Acts 1:8', note: '“Jerusalem … Judaea … Samaria … the uttermost part of the earth”' },
  ],
}

// Merge editorial entries in, tagged source:'editorial'; skip any ref already covered by a
// sourced entry (so the badge only marks genuinely editorial calls).
for (const d of DEVICES) {
  const extra = EDITORIAL[d.id]
  if (!extra) continue
  const seen = new Set(d.occurrences.map(o => o.ref))
  for (const o of extra) if (!seen.has(o.ref)) { d.occurrences.push({ ...o, source: 'editorial' }); seen.add(o.ref) }
}
