// Catalogue of New Testament rhetorical figures for the Exegesis "Rhetoric" tab.
//
// The classification of figures follows E. W. Bullinger, *Figures of Speech Used in the Bible*
// (1898, public domain) — omission / addition-repetition / change (comparison, substitution,
// arrangement, emphasis). Occurrences are a curated selection of well-attested NT examples
// (Bullinger + standard rhetorical-critical handbooks), not an exhaustive index; explanations
// are written in plain language. Bengel's Gnomon note for each occurrence verse is fetched
// separately into /data/rhetoric/bengel.json and shown alongside.

export type DeviceGroup = 'comparison' | 'substitution' | 'omission' | 'repetition' | 'arrangement' | 'emphasis'

export const GROUP_LABEL: Record<DeviceGroup, string> = {
  comparison: 'Comparison', substitution: 'Substitution', omission: 'Omission',
  repetition: 'Repetition', arrangement: 'Arrangement', emphasis: 'Emphasis & tone',
}
// Chip colours (same style as the Backgrounds tab).
export const GROUP_COLOR: Record<DeviceGroup, string> = {
  comparison: 'bg-blue-50 border-blue-200 text-blue-800',
  substitution: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  omission: 'bg-amber-50 border-amber-200 text-amber-800',
  repetition: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  arrangement: 'bg-purple-50 border-purple-200 text-purple-800',
  emphasis: 'bg-rose-50 border-rose-200 text-rose-800',
}

export interface Occurrence { ref: string; note?: string }   // note = why this verse illustrates the figure
export interface Device {
  id: string
  name: string          // English name
  greek?: string        // Greek/Latin technical name
  group: DeviceGroup
  definition: string    // plain-language explanation
  occurrences: Occurrence[]
}

export const DEVICES: Device[] = [
  // ── Comparison ──────────────────────────────────────────────────────────────────────
  {
    id: 'simile', name: 'Simile', greek: 'ὁμοίωσις', group: 'comparison',
    definition: 'An explicit comparison of two unlike things using “like” or “as.” The comparison is stated openly, which makes it gentler than a metaphor.',
    occurrences: [
      { ref: 'Matt 13:31', note: 'the kingdom is “like” a mustard seed' },
      { ref: 'Matt 23:27', note: '“like” whitewashed tombs' },
      { ref: '1 Peter 1:24', note: '“all flesh is as grass”' },
      { ref: 'James 1:6', note: 'the doubter is “like a wave of the sea”' },
    ],
  },
  {
    id: 'metaphor', name: 'Metaphor', greek: 'μεταφορά', group: 'comparison',
    definition: 'An implied comparison that calls one thing another (“A is B”), without “like” or “as.” Stronger than a simile because the identification is direct.',
    occurrences: [
      { ref: 'John 10:9', note: '“I am the door”' },
      { ref: 'John 15:5', note: '“I am the vine, you are the branches”' },
      { ref: 'Matt 5:13', note: '“you are the salt of the earth”' },
      { ref: 'Matt 5:14', note: '“you are the light of the world”' },
      { ref: 'John 6:35', note: '“I am the bread of life”' },
    ],
  },
  // ── Substitution ────────────────────────────────────────────────────────────────────
  {
    id: 'metonymy', name: 'Metonymy', greek: 'μετωνυμία', group: 'substitution',
    definition: 'Naming something by a word closely associated with it rather than the thing itself — e.g. the cause for the effect, the container for its contents, the author for his writings.',
    occurrences: [
      { ref: 'Luke 16:29', note: '“Moses and the prophets” = their writings' },
      { ref: '1 Corinthians 11:25', note: '“the cup” = what it contains / the covenant' },
      { ref: 'Romans 3:30', note: '“the circumcision” = the Jews' },
      { ref: 'Luke 1:32', note: '“the throne of David” = David’s royal line' },
    ],
  },
  {
    id: 'synecdoche', name: 'Synecdoche', greek: 'συνεκδοχή', group: 'substitution',
    definition: 'Substituting a part for the whole (or the whole for a part) — e.g. “all the world” for the empire, “flesh and blood” for human beings.',
    occurrences: [
      { ref: 'Luke 2:1', note: '“all the world” = the Roman empire' },
      { ref: 'Matt 16:17', note: '“flesh and blood” = mere human agency' },
      { ref: 'Acts 27:37', note: '“souls” = persons' },
      { ref: 'Romans 1:16', note: '“to the Jew first” — the nation named by its representatives' },
    ],
  },
  // ── Omission ────────────────────────────────────────────────────────────────────────
  {
    id: 'ellipsis', name: 'Ellipsis', greek: 'ἔλλειψις', group: 'omission',
    definition: 'A word or words are deliberately left out and must be supplied by the reader. The gap creates compression and often force.',
    occurrences: [
      { ref: '2 Corinthians 9:6', note: '“he who sows sparingly [will reap] sparingly”' },
      { ref: 'Matt 25:9', note: '“not so, lest [there be] not enough”' },
      { ref: 'Romans 5:18', note: '“as … so also …” with verbs supplied' },
    ],
  },
  {
    id: 'asyndeton', name: 'Asyndeton', greek: 'ἀσύνδετον', group: 'omission',
    definition: 'Conjunctions are omitted between items in a series, producing a rapid, weighty, piled-up effect.',
    occurrences: [
      { ref: '1 Timothy 3:16', note: 'the six clauses of the “mystery of godliness”' },
      { ref: '2 Timothy 3:2', note: 'the vice-list runs without connectives' },
      { ref: '2 Corinthians 7:11', note: 'a rush of nouns without “and”' },
    ],
  },
  {
    id: 'aposiopesis', name: 'Aposiopesis', greek: 'ἀποσιώπησις', group: 'omission',
    definition: 'A sentence is broken off unfinished, as if the speaker cannot or will not go on — leaving the hearer to complete it.',
    occurrences: [
      { ref: 'Luke 13:9', note: '“and if it bears fruit —; but if not …”' },
      { ref: 'Luke 19:42', note: '“if you had known …” — the sentence trails off' },
    ],
  },
  // ── Repetition ──────────────────────────────────────────────────────────────────────
  {
    id: 'anaphora', name: 'Anaphora', greek: 'ἀναφορά', group: 'repetition',
    definition: 'The same word or phrase begins a series of successive clauses, hammering a theme.',
    occurrences: [
      { ref: 'Matt 5:3', note: '“Blessed are …” repeated through the Beatitudes' },
      { ref: '1 Corinthians 13:4', note: '“Love is … love …”' },
      { ref: 'Hebrews 11:4', note: '“By faith …” repeated down the chapter' },
    ],
  },
  {
    id: 'epizeuxis', name: 'Epizeuxis', greek: 'ἐπίζευξις', group: 'repetition',
    definition: 'Immediate repetition of a word for intense emphasis or emotion, with nothing between.',
    occurrences: [
      { ref: 'Matt 23:37', note: '“Jerusalem, Jerusalem”' },
      { ref: 'Luke 10:41', note: '“Martha, Martha”' },
      { ref: 'Mark 15:34', note: '“Eloi, Eloi”' },
      { ref: 'Galatians 1:8', note: '“let him be accursed” repeated (v. 9)' },
    ],
  },
  {
    id: 'polysyndeton', name: 'Polysyndeton', greek: 'πολυσύνδετον', group: 'repetition',
    definition: 'The opposite of asyndeton: conjunctions (“and … and … nor … nor …”) are piled up to slow the pace and give weight to every item.',
    occurrences: [
      { ref: 'Romans 8:38', note: '“nor … nor … nor …” through vv. 38–39' },
      { ref: 'Luke 14:21', note: '“the poor, and the maimed, and the halt, and the blind”' },
      { ref: 'Revelation 5:12', note: '“power, and riches, and wisdom, and strength …”' },
    ],
  },
  // ── Arrangement ─────────────────────────────────────────────────────────────────────
  {
    id: 'chiasmus', name: 'Chiasmus', greek: 'χιασμός', group: 'arrangement',
    definition: 'An inverted, mirror-image arrangement (A–B–B′–A′). The crossing pattern often puts the emphasis at the centre or ties the outer terms together.',
    occurrences: [
      { ref: 'Matt 6:24', note: 'hate–love … hold to–despise (the two masters)' },
      { ref: 'Mark 2:27', note: '“sabbath for man … man for the sabbath”' },
      { ref: 'Matt 7:6', note: 'dogs–swine … trample–tear (A–B–B′–A′)' },
      { ref: 'Matt 19:30', note: '“first last, and last first”' },
    ],
  },
  {
    id: 'inclusio', name: 'Inclusio', group: 'arrangement',
    definition: 'A section is “book-ended” by repeating a word or idea at its start and finish, framing everything between as a unit.',
    occurrences: [
      { ref: 'Matt 5:3', note: '“theirs is the kingdom of heaven” frames the Beatitudes (v. 10)' },
      { ref: 'Matt 7:16', note: '“by their fruits you shall know them” (also v. 20)' },
      { ref: 'Romans 1:5', note: '“the obedience of faith” — echoed at 16:26' },
    ],
  },
  {
    id: 'climax', name: 'Climax', greek: 'κλῖμαξ / gradatio', group: 'arrangement',
    definition: 'A chain of steps in which the end of one clause becomes the start of the next, building to a peak.',
    occurrences: [
      { ref: 'Romans 5:3', note: 'tribulation → perseverance → character → hope (vv. 3–5)' },
      { ref: 'Romans 8:29', note: 'foreknew → predestined → called → justified → glorified (vv. 29–30)' },
      { ref: '2 Peter 1:5', note: 'faith → virtue → knowledge → … (vv. 5–7)' },
    ],
  },
  // ── Emphasis & tone ─────────────────────────────────────────────────────────────────
  {
    id: 'hyperbole', name: 'Hyperbole', greek: 'ὑπερβολή', group: 'emphasis',
    definition: 'Deliberate exaggeration, not meant to be taken literally, that drives a point home vividly.',
    occurrences: [
      { ref: 'Matt 5:29', note: '“pluck out your eye … cut off your hand”' },
      { ref: 'Matt 7:3', note: 'the “log” in your own eye' },
      { ref: 'Matt 23:24', note: '“strain out a gnat and swallow a camel”' },
      { ref: 'John 21:25', note: '“the world itself could not contain the books”' },
    ],
  },
  {
    id: 'litotes', name: 'Litotes', greek: 'λιτότης', group: 'emphasis',
    definition: 'Understatement that affirms something by denying its opposite (“no small …”, “not ashamed”) — often a quiet way of saying a great deal.',
    occurrences: [
      { ref: 'Acts 21:39', note: '“a citizen of no mean city”' },
      { ref: 'Romans 1:16', note: '“I am not ashamed of the gospel” (= I am proud of it)' },
      { ref: 'Acts 1:5', note: '“not many days hence”' },
      { ref: 'Acts 12:18', note: '“no small stir”' },
    ],
  },
  {
    id: 'irony', name: 'Irony', greek: 'εἰρωνεία', group: 'emphasis',
    definition: 'Saying the opposite of what is meant, so that the real sense is felt through the contrast — often gently mocking.',
    occurrences: [
      { ref: '1 Corinthians 4:8', note: '“already you have become rich, you have reigned as kings”' },
      { ref: '2 Corinthians 11:19', note: '“you gladly bear with fools”' },
      { ref: '2 Corinthians 12:13', note: '“forgive me this wrong!”' },
    ],
  },
  {
    id: 'erotesis', name: 'Rhetorical question', greek: 'ἐρώτησις', group: 'emphasis',
    definition: 'A question asked for effect rather than for an answer — to affirm, deny, or provoke thought more forcibly than a statement could.',
    occurrences: [
      { ref: 'Romans 8:31', note: '“If God is for us, who can be against us?” (vv. 31–35)' },
      { ref: 'Galatians 3:1', note: '“O foolish Galatians, who has bewitched you?”' },
      { ref: 'Romans 6:1', note: '“Shall we continue in sin …?”' },
      { ref: '1 Corinthians 15:55', note: '“O death, where is your sting?”' },
    ],
  },
  {
    id: 'personification', name: 'Personification', greek: 'προσωποποιΐα', group: 'emphasis',
    definition: 'Giving human traits, actions, or speech to something impersonal or abstract (sin, death, love, Scripture, creation).',
    occurrences: [
      { ref: '1 Corinthians 13:4', note: 'Love “is patient … is kind … does not envy”' },
      { ref: 'Romans 7:11', note: 'sin “deceived me and … killed me”' },
      { ref: 'Romans 8:22', note: 'creation “groans” together' },
      { ref: 'Galatians 3:8', note: 'the Scripture “foreseeing … preached beforehand”' },
    ],
  },
  {
    id: 'hendiadys', name: 'Hendiadys', greek: 'ἓν διὰ δυοῖν', group: 'emphasis',
    definition: 'One idea expressed by two words joined with “and,” where the second really qualifies the first (“hope and resurrection” = hope of the resurrection).',
    occurrences: [
      { ref: 'Acts 23:6', note: '“the hope and resurrection of the dead” = hope of the resurrection' },
      { ref: 'Luke 21:15', note: '“a mouth and wisdom” = wise speech' },
      { ref: 'Colossians 2:8', note: '“philosophy and empty deceit”' },
    ],
  },
  {
    id: 'paronomasia', name: 'Paronomasia (wordplay)', greek: 'παρονομασία', group: 'emphasis',
    definition: 'A play on words that sound alike but differ in sense — puns, rhyme, and near-repetition that the Greek makes audible.',
    occurrences: [
      { ref: 'Matt 16:18', note: 'Πέτρος (Peter) / πέτρα (rock)' },
      { ref: 'Philippians 3:2', note: 'κατατομή (mutilation) / περιτομή (circumcision, v. 3)' },
      { ref: 'Romans 1:29', note: 'φθόνου / φόνου (envy / murder)' },
      { ref: 'Philemon 11', note: 'Onesimus (“useful”): ἄχρηστον / εὔχρηστον' },
    ],
  },
  {
    id: 'oxymoron', name: 'Oxymoron', greek: 'ὀξύμωρον', group: 'emphasis',
    definition: 'A pointed pairing of apparently contradictory terms that expresses a deeper truth (“dying, and behold we live”).',
    occurrences: [
      { ref: '2 Corinthians 6:9', note: '“as dying, and behold we live … as poor, yet making many rich” (vv. 9–10)' },
      { ref: '2 Corinthians 12:10', note: '“when I am weak, then I am strong”' },
      { ref: '1 Timothy 5:6', note: 'she “is dead while she lives”' },
    ],
  },
  {
    id: 'apostrophe', name: 'Apostrophe', greek: 'ἀποστροφή', group: 'emphasis',
    definition: 'A sudden turn from the audience to address someone or something absent, dead, or abstract directly.',
    occurrences: [
      { ref: '1 Corinthians 15:55', note: 'the speaker turns to address “death” itself' },
      { ref: 'Romans 2:1', note: '“O man, whoever you are who judges …”' },
      { ref: 'James 5:1', note: '“Come now, you rich, weep …”' },
    ],
  },
]
