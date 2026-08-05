// Curated query sets for the Theology page. THIS FILE IS THE SCHOLARSHIP.
//
// The summaries on the page are written from passages these queries return; the queries decide
// what a student sees. A model is never asked to recall which passages discuss a topic — see the
// header of scripts/build-themes.ts for why that distinction is load-bearing.
//
// Terms are English because the retrieval facet is English (backgrounds-search-en). Greek and
// Hebrew terms belong here too once the grc facet is wired in — noted per topic where they
// would add reach.

// ── ADDING A TOPIC ───────────────────────────────────────────────────────────────────────
// 1. Write the query set here.  2. `npx tsx scripts/build-themes.ts --survey` to see what the
// corpus holds per tradition.  3. `npx tsx scripts/build-themes.ts <id>` to read candidates.
// 4. Curate entries into src/lib/theology.ts.  5. `--check` to prove every citation resolves.
//
// THE TRAP, which has caught this file twice: a word with a precise theological sense usually
// also has a mundane one, and the corpus is full of the mundane one.
//
//   · "only begotten" gave the TRINITY 38 Second Temple Jewish hits. Every one was an ordinary
//     only child — Tobit's Sarah, Josephus' Isaac. Those sources contain no Trinity at all, and
//     the page would have taught that anachronism with a straight face.
//   · "exile" and "captivity" gave ISRAEL 577 Greco-Roman hits: Danaus and Hercules, not Babylon.
//
// Both looked like healthy coverage in the survey, because a hit count cannot tell you a hit is
// wrong. So: gate any everyday word with `needsContext`, make the `context` list specific to the
// topic (never include the gated word itself — that is circular), and read a sample from EVERY
// tradition before curating. A high count in a tradition you did not expect is a bug until
// proven otherwise.

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

const q = (label: string, re: RegExp, weight: number, needsContext = false): TopicQuery =>
  ({ label, re, weight, needsContext })

/** Death/afterlife words — the proximity gate for topics about what follows dying. */
const DEATH = [/\bdead\b/, /\bdeath\b/, /\bdie[ds]?\b/, /\bgrave\b/, /\btomb\b/, /\bperish\b/, /\bmortal\b/]
/** Divine-subject words — the gate for topics where a common noun needs God in view. */
const DIVINE = [/\bgod\b/, /\blord\b/, /\bmost high\b/, /\balmighty\b/, /\bheaven\b/, /\bdivine\b/]
/** Covenant/Israel words — the gate for topics about law, identity and practice. */
const COVENANT = [/\bcovenant\b/, /\bisrael\b/, /\bmoses\b/, /\blaw\b/, /\bcommandment/, /\bfathers\b/]

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

  // ── God and the unseen world ──────────────────────────────────────────────────────────
  { id: 'godhead', label: 'God, and whether God is one',
    blurb: 'The oneness of God and how Jewish and Christian writers hold it while speaking of Word, Wisdom, Spirit and Son.',
    queries: [
      q('shema', /\bhear,? o israel\b|\bthe lord is one\b|\bone god\b|\bonly god\b/, 4),
      q('monotheism', /\bthere is no other\b|\bbeside me there is none\b|\bno god but\b/, 4),
      q('unbegotten', /\bunbegotten\b|\bingenerate\b|\bwithout beginning\b/, 3),
      q('creator', /\bmaker of (all|heaven)\b|\bcreator of\b/, 2),
      q('names-of-god', /\bmost high\b|\balmighty\b|\bineffable\b|\bunnameable\b/, 2),
      q('two-powers', /\btwo powers\b|\bsecond god\b|\banother god\b/, 5),
      q('god', /\bgod\b/, 1, true),
    ], context: [/\bone\b/, /\balone\b/, /\bunity\b/, /\bnature\b/, /\bessence\b/, /\bsubstance\b/], minScore: 4, perWorkCap: 6 },

  { id: 'trinity', label: 'Father, Son and Spirit',
    blurb: 'Triadic language before the creeds: how the earliest writers name Father, Son and Spirit together, and how far that is from Nicaea.',
    queries: [
      q('triad', /\bfather,? (the )?son,? and (the )?holy (spirit|ghost)\b|\bfather and (the )?son and\b/, 5),
      q('same-substance', /\bconsubstantial\b|\bof one substance\b|\bhomoousi/, 5),
      q('begotten', /\bonly[- ]begotten (son|god)\b|\bbegotten (of|from) the father\b|\bonly[- ]begotten\b(?=[^.]{0,40}\b(god|father|christ|lord)\b)/, 4),
      q('proceeds', /\bproceed(s|eth|ing) from the father\b/, 4),
      q('three', /\btrinity\b|\bthree persons\b|\bthreefold\b/, 5),
      q('spirit-and-son', /\bspirit\b/, 1, true),
    ], context: [/\bfather\b/, /\bson\b/, /\bword\b/, /\bdivin/], minScore: 4, perWorkCap: 6 },

  { id: 'holy-spirit', label: 'The Spirit of God',
    blurb: 'The Spirit as God’s power, as prophetic inspiration, and as a person — three uses that do not always sit together.',
    queries: [
      q('holy-spirit', /\bholy (spirit|ghost)\b/, 4),
      q('spirit-of-god', /\bspirit of (the )?(god|lord|the most high)\b/, 4),
      q('spirit-rested', /\bspirit (rested|came|fell) upon\b|\bfilled with the spirit\b/, 4),
      q('prophetic-spirit', /\bprophetic spirit\b|\bspirit of prophecy\b/, 4),
      q('gifts', /\bgifts of the spirit\b|\bspiritual gifts\b/, 3),
      q('spirit', /\bspirit\b/, 1, true),
    ], context: [/\bgod\b/, /\bprophe/, /\bpour/, /\bholy\b/, /\binspir/], minScore: 4, perWorkCap: 6 },

  { id: 'angels', label: 'Angels and the heavenly court',
    blurb: 'Named angels, the hosts, the watchers, and the council around God’s throne — thickest in the Pseudepigrapha, thinnest in the rabbis.',
    queries: [
      q('archangels', /\bmichael\b|\bgabriel\b|\braphael\b|\buriel\b|\bphanuel\b/, 4),
      q('watchers', /\bwatchers\b|\bsons of god\b|\bgiants\b|\bnephilim\b/, 4),
      q('host', /\bhost of heaven\b|\bheavenly host\b|\barmies of heaven\b/, 3),
      q('ranks', /\bcherubim\b|\bseraphim\b|\bthrones\b|\bprincipalities\b|\barchangel/, 3),
      q('angel', /\bangel[s]?\b/, 2),
      q('throne', /\bthrone of (god|glory|the most high)\b|\bcouncil\b/, 2),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'satan-evil', label: 'Satan and the origin of evil',
    blurb: 'Where evil came from: fallen watchers, Adam’s sin, an evil inclination, or an adversary — the sources answer differently.',
    queries: [
      q('satan', /\bsatan\b|\bbeliar\b|\bbelial\b|\bmastema\b|\bsammael\b|\bazazel\b/, 5),
      q('devil', /\bdevil\b|\bthe evil one\b|\btempter\b/, 4),
      q('demons', /\bdemon[s]?\b|\bunclean spirit/, 3),
      q('fall-of-angels', /\bfell from heaven\b|\bcast (down|out) (of|from) heaven\b|\bfallen angels\b/, 4),
      q('evil-inclination', /\bevil inclination\b|\byetzer\b|\bevil heart\b/, 4),
      q('origin-of-sin', /\bwhence (came|comes) evil\b|\borigin of (sin|evil)\b/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  // ── Christ ────────────────────────────────────────────────────────────────────────────
  { id: 'messiah', label: 'Messiah and messianic expectation',
    blurb: 'What was hoped for before it was claimed: an anointed king, a priest, two messiahs, or a heavenly figure.',
    queries: [
      q('messiah', /\bmessiah\b|\banointed one\b|\bchrist\b/, 4),
      q('branch', /\bbranch of david\b|\broot of jesse\b|\bshoot\b|\bsceptre\b/, 4),
      q('son-of-david', /\bson of david\b|\bthrone of david\b|\bkingdom of david\b/, 4),
      // "anointed priest" is the CULTIC high priest of Leviticus 4 and Mishnah Zevachim, not a
      // messiah — weighted at 5 it buried Psalms of Solomon 17 under Leviticus and Horayot. The
      // two-messiahs idea proper (Aaron and Israel) is Qumran's, and this library has no Dead Sea
      // Scrolls, so only the named forms stay.
      q('two-messiahs', /\bmessiah of aaron\b|\bmessiah of israel\b|\btwo messiahs\b/, 5),
      q('lords-anointed', /\banointed of the lord\b|\bthe lord.{0,3}s anointed\b|\bhis anointed\b/, 5),
      q('king-messiah', /\btheir king,? the son of david\b|\brighteous king\b|\bking messiah\b/, 5),
      q('star', /\bstar (shall|will) (come|rise)\b|\bstar out of jacob\b/, 4),
      q('expectation', /\bhe (that|who) (is|was) to come\b|\bawait(ing)? the\b/, 2, true),
    ], context: [/\bdeliver/, /\bredeem/, /\bking\b/, /\bkingdom\b/, /\bisrael\b/], minScore: 4, perWorkCap: 6 },

  { id: 'son-of-man', label: 'The Son of Man',
    blurb: 'The heavenly figure of Daniel 7 and the Enochic parables, and the ordinary Semitic idiom it also is.',
    queries: [
      q('son-of-man', /\bson of man\b/, 5),
      q('clouds', /\bclouds of heaven\b|\bcoming (with|on) the clouds\b/, 4),
      q('elect-one', /\bthe elect one\b|\bthe righteous one\b|\bthat son of man\b/, 5),
      q('ancient-of-days', /\bancient of days\b|\bhead of days\b/, 5),
      q('enthroned', /\bseated on the throne of (his )?glory\b|\bsit upon the throne\b/, 3),
    ], context: [], minScore: 4, perWorkCap: 6 },

  // The next three sit beside 'messiah' and must not simply repeat it. Each asks a narrower
  // question that the sources answer differently: WHO IS ENTITLED to rule (son-of-david), what
  // actual kingship looked like and whether Israel should have one at all (king-of-israel), and
  // who gets called God's son (son-of-god) — which in this corpus is mostly not the messiah.
  { id: 'son-of-david', label: 'Son of David',
    blurb: 'The dynastic claim: the promise to David, who was entitled to the throne, and the '
      + 'awkward fact that nobody ruling Judaea in this period descended from him.',
    queries: [
      q('son-of-david', /\bson of david\b|\bseed of david\b|\boffspring of david\b/, 5),
      q('house-of-david', /\bhouse of david\b|\bthrone of david\b|\bkingdom of david\b/, 4),
      q('branch', /\bbranch\b|\broot of jesse\b|\bstem of jesse\b/, 3, true),
      q('covenant-with-david', /\bcovenant (with|unto) david\b|\bsware unto david\b|\bpromised to david\b/, 5),
      q('david', /\bdavid\b/, 1, true),
    ],
    // Not the mundane David: the gate wants dynasty and succession, not the harp or Goliath.
    context: [/\bking\b/, /\bthrone\b/, /\bseed\b/, /\breign\b/, /\banointed\b/, /\bmessiah\b/, /\bkingdom\b/],
    minScore: 4, perWorkCap: 6 },

  { id: 'king-of-israel', label: 'Kingship over Israel',
    blurb: 'Whether Israel should have a king at all, what the law allows him, and what the '
      + 'Hasmoneans and Herod actually did with the title.',
    queries: [
      q('king-of-israel', /\bking of (the )?(jews|israel)\b|\bkings of israel\b/, 5),
      q('law-of-the-king', /\bthe king (must|shall) not multiply\b|\blaw of the king\b|\bset a king over\b/, 5),
      q('crown-taken', /\bassumed the (crown|diadem)\b|\bput on the (crown|diadem)\b|\bproclaimed king\b|\btook the title of king\b/, 5),
      q('theocracy', /\btheocracy\b|\baristocracy\b|\bno king but\b|\bgod (alone )?(is|be) (their|our) king\b/, 5),
      q('high-priest-and-king', /\bhigh priest and king\b|\bboth (king and|priest and)\b/, 4),
      q('reign', /\breigned\b|\bkingship\b/, 1, true),
    ],
    context: [/\bisrael\b/, /\bjews\b/, /\bjudaea\b/, /\bjerusalem\b/, /\blaw\b/, /\bpriest/],
    minScore: 4, perWorkCap: 6 },

  { id: 'son-of-god', label: 'Son of God',
    blurb: 'Who is called God’s son here — Israel, the king, the righteous sufferer, the angels — '
      + 'and how much distance there is between any of that and a divine Christ.',
    queries: [
      q('son-of-god', /\bson of (the )?(god|most high)\b|\bsons of (the )?(living )?god\b/, 5),
      q('my-son', /\bthou art my son\b|\bhe shall be (to me )?(a|my) son\b|\bcall me[,]? my father\b/, 5),
      q('firstborn-son', /\bmy (firstborn|first-born) son\b|\bisrael is my son\b/, 5),
      q('children-of-god', /\bchildren of god\b|\bsons of the most high\b/, 3),
      q('boast-god-his-father', /\bboasteth that god is his father\b|\bgod (is|be) his father\b/, 5),
      q('begotten', /\bbegotten\b/, 1, true),
    ],
    context: [/\bfather\b/, /\bgod\b/, /\bmost high\b/, /\bdivin/],
    minScore: 4, perWorkCap: 6 },

  { id: 'wisdom-logos', label: 'Wisdom, Word and pre-existence',
    blurb: 'Wisdom present at creation, Philo’s Logos, and how Jewish speech about God’s agent shaped Christian speech about Christ.',
    queries: [
      q('logos', /\blogos\b|\bthe word of god\b|\bdivine word\b/, 4),
      q('wisdom-personified', /\bwisdom (was|is) (created|with|beside)\b|\bwisdom (cried|calleth|sayeth)\b/, 5),
      q('before-creation', /\bbefore the (world|ages|foundation)\b|\bfrom the beginning\b|\bpre[- ]?exist/, 4),
      q('firstborn', /\bfirstborn of (all )?creation\b|\bfirst[- ]?begotten\b/, 4),
      q('image', /\bimage of (the invisible )?god\b|\beffulgence\b|\bbrightness of\b/, 3),
      q('craftsman', /\bmaster (workman|craftsman)\b|\bfashioner\b|\barchetyp/, 3),
    ], context: [], minScore: 4, perWorkCap: 6 },

  // ── Sin, salvation and the human condition ────────────────────────────────────────────
  { id: 'atonement', label: 'Atonement and sacrifice',
    blurb: 'How sin is dealt with: blood, the Day of Atonement, the death of the righteous, and whether any of it transfers.',
    queries: [
      q('atonement', /\batonement\b|\bexpiat/, 5),
      q('day-of-atonement', /\bday of atonement\b|\byom kippur\b|\bscapegoat\b|\bmercy[- ]seat\b|\bpropitiat/, 5),
      q('blood', /\bblood of the\b|\bsprinkl(e|ed|ing) (the )?blood\b|\bshedding of blood\b/, 3),
      q('sin-offering', /\bsin[- ]offering\b|\bburnt offering\b|\bwhole burnt\b|\bsacrifice for sin\b/, 4),
      q('vicarious', /\bdied for\b|\bgave himself for\b|\bransom for\b|\bin their stead\b|\bbear the sins\b/, 4),
      q('sacrifice', /\bsacrific/, 1, true),
    ], context: [/\bsin\b/, /\batone/, /\bforgiv/, /\bcleans/, /\bpriest\b/, /\baltar\b/], minScore: 4, perWorkCap: 6 },

  { id: 'redemption', label: 'Redemption and ransom',
    blurb: 'Being bought back — from Egypt, from exile, from death, from the powers. The metaphor is legal and commercial before it is theological.',
    queries: [
      q('redeem', /\bredeem(ed|er|s|eth|ing)?\b|\bredemption\b/, 4),
      q('ransom', /\bransom(ed)?\b|\bprice\b(?=[^.]{0,60}\b(bought|paid|redeem)\b)/, 4),
      q('deliverance', /\bdeliver(ed|ance|er)\b/, 2, true),
      q('bought', /\bbought with a price\b|\bpurchased\b/, 3),
      q('exodus-pattern', /\bout of (the land of )?egypt\b|\bhouse of bondage\b|\bwith a mighty hand\b/, 3),
      q('captivity', /\bset (the )?captives? free\b|\brelease\b(?=[^.]{0,50}\bcaptiv)/, 3),
    ], context: [/\bsin\b/, /\bslav/, /\bbond/, /\bsav/, /\bfree\b/, /\blord\b/], minScore: 4, perWorkCap: 6 },

  { id: 'sin-fall', label: 'Sin and the fall',
    blurb: 'Whether Adam’s sin is inherited, imitated, or beside the point; and whether the flood watchers explain evil better than Eden does.',
    queries: [
      q('adams-sin', /\bsin of adam\b|\btransgression of adam\b|\badam.{0,25}(sinned|fell|transgressed)\b/, 5),
      q('fall', /\bfell from\b(?=[^.]{0,50}\b(grace|glory|paradise)\b)|\b(expelled|cast|driven) (out )?(from|out of) (the garden|paradise|eden)\b/, 3),
      q('serpent', /\bserpent\b|\bdeceived (the woman|eve)\b|\bbeguiled\b/, 3),
      q('forbidden-tree', /\btree of (the )?knowledge\b|\bforbidden (fruit|tree)\b|\beat of the tree\b/, 4),
      q('death-entered', /\bdeath (entered|came) (into )?the world\b|\bbrought death\b|\bcause of death\b/, 5),
      q('all-sinned', /\ball (have )?sinned\b|\bno one (is )?righteous\b|\bborn (in|of) sin\b|\bconceived in\b/, 4),
      q('inherited', /\bevery one .{0,30}(is|becomes) (the )?adam\b|\beach of us .{0,25}his own adam\b|\bfrom him .{0,30}(sin|death) (came|passed)\b/, 5),
      q('transgression', /\btransgress(ion|ed|or)\b|\biniquit/, 2, true),
      q('sin', /\bsin(s|ned|ful|ner)?\b/, 1, true),
      q('inclination', /\bevil inclination\b|\bevil heart\b|\bhard heart\b/, 4),
    ], context: [/\badam\b/, /\beve\b/, /\bparadise\b/, /\bdeath\b/, /\bcommandment/, /\bserpent\b/], minScore: 4, perWorkCap: 6 },

  { id: 'free-will', label: 'Free will and providence',
    blurb: 'How much is fate and how much is choice — the question Josephus uses to sort the Jewish parties, and the Fathers use against the Gnostics.',
    queries: [
      q('fate', /\bfate\b|\bdestiny\b|\bnecessity\b(?=[^.]{0,60}\b(choice|will|action)\b)/, 4),
      q('free-choice', /\bfree will\b|\bfree choice\b|\bin (their|our|his) own power\b|\bat men.{0,3} own choice\b/, 5),
      q('two-ways', /\btwo ways\b|\bway of life and .{0,15}death\b|\bset before (you|him|them) (life|good)\b/, 4),
      q('providence', /\bprovidence\b|\bforeknow/, 3),
      q('predestined', /\bpredestin/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'repentance', label: 'Repentance and forgiveness',
    blurb: 'Turning, confession and pardon — how forgiveness is sought where the Temple stands and where it no longer does.',
    queries: [
      q('repent', /\brepent(ance|ed|s|eth)?\b|\bturn(ed|ing)? (back |again )?to (the )?(lord|god)\b/, 4),
      q('forgive', /\bforgive(n|ness|th)?\b|\bpardon(ed)?\b|\bremission of sins\b/, 4),
      q('confess', /\bconfess(ed|ion|ing)?\b(?=[^.]{0,60}\bsin)/, 4),
      q('mercy', /\bmercy\b|\bcompassion\b|\bslow to anger\b/, 2, true),
      q('cleanse', /\bcleanse(d)? (from|of) (all )?(sin|unrighteous)/, 4),
      q('return', /\bturn from (his|their|your) (wicked )?way\b|\bamend (your|their) ways\b/, 3),
    ], context: [/\bsin\b/, /\btransgress/, /\bgod\b/, /\blord\b/, /\biniquit/], minScore: 4, perWorkCap: 6 },

  { id: 'justification', label: 'Righteousness, works and covenant',
    blurb: 'What makes a person righteous before God — the question behind “works of the law”, read from the Jewish side.',
    queries: [
      q('justified', /\bjustifi(ed|cation|es)\b|\breckoned .{0,20}righteousness\b|\bcounted .{0,20}righteousness\b/, 5),
      q('works-of-law', /\bworks of the law\b|\bdeeds of the law\b/, 5),
      q('righteous-by', /\brighteous before god\b|\bfound righteous\b|\bdeclared righteous\b/, 4),
      q('faith', /\bfaith\b|\bfaithfulness\b/, 1, true),
      q('merit', /\bmerit(s)?\b|\breward according to\b|\bweighed in the balance\b/, 3),
      q('covenant-membership', /\bcovenant\b/, 1, true),
    ], context: [/\brighteous/, /\blaw\b/, /\bworks\b/, /\bjustif/, /\bgod\b/], minScore: 4, perWorkCap: 6 },

  { id: 'grace-election', label: 'Grace, election and the chosen',
    blurb: 'Being chosen: Israel, the remnant, the elect, and what election is understood to guarantee.',
    queries: [
      q('elect', /\belect\b|\bthe chosen\b|\bchosen (people|race|nation|ones)\b/, 4),
      q('remnant', /\bremnant\b/, 4),
      q('grace', /\bgrace\b|\bunmerited\b|\bfavou?r (of|with) god\b/, 3),
      q('called', /\bcalled\b(?=[^.]{0,50}\b(god|lord|name)\b)|\bcalling\b/, 2, true),
      q('foreknown', /\bfrom the foundation of the world\b|\bbefore (they|he|we) (were|was)\b/, 3),
    ], context: [/\bgod\b/, /\bisrael\b/, /\bpeople\b/, /\bcovenant\b/], minScore: 4, perWorkCap: 6 },

  // ── Law, practice and identity ────────────────────────────────────────────────────────
  { id: 'sabbath', label: 'Sabbath',
    blurb: 'The seventh day: how it is kept, how strictly, what counts as work, and how Greek and Roman writers saw it from outside.',
    queries: [
      q('sabbath', /\bsabbath[s]?\b/, 4),
      q('seventh-day', /\bseventh day\b|\bday of rest\b/, 4),
      q('sabbath-work', /\bwork on the sabbath\b|\bprofane the sabbath\b|\bbreak(ing)? the sabbath\b|\bkeep the sabbath\b/, 5),
      q('sabbath-limit', /\bsabbath day.{0,3}s journey\b|\bthirty[- ]nine\b|\bprimary (labours|categories)\b/, 5),
      q('rest', /\brest(ed)? (on|from)\b/, 2, true),
      q('outsider-view', /\bevery seventh day\b|\bidleness\b(?=[^.]{0,60}\bjew)/, 3),
    ], context: [/\bsabbath/, /\bseventh\b/, /\bday\b/, /\bwork\b/, /\bcommandment/], minScore: 4, perWorkCap: 6 },

  { id: 'law', label: 'Law and commandments',
    blurb: 'Torah as gift, as burden, as wisdom, and as the thing Gentiles need not keep — the fault line the New Testament sits on.',
    queries: [
      q('law-of-moses', /\blaw of moses\b|\bthe law and the prophets\b|\btorah\b/, 4),
      // "keep the commandments" is said everywhere by everyone and distinguishes nothing; at
      // weight 3 it buried the passages where a position on Torah is actually being argued.
      q('commandments', /\bcommandment[s]?\b|\bprecept[s]?\b|\bstatutes\b|\bordinances\b/, 1, true),
      q('fence', /\bfence (about|around) the (law|torah)\b|\bhedge\b(?=[^.]{0,40}\blaw\b)|\bmake a fence\b/, 5),
      q('whole-law', /\bthe whole law\b|\ball the law\b|\bevery commandment\b|\bleast of these\b/, 4),
      q('law-and-prophets', /\blaw and the prophets\b/, 4),
      q('unwritten-law', /\bunwritten law\b|\blaw of nature\b|\bliving law\b|\blaw unto themselves\b/, 5),
      q('tradition-of-elders', /\btradition[s]? of the (elders|fathers)\b|\boral (law|torah)\b|\bmen of the great\b/, 5),
      q('abolish-law', /\babolish(ed|ing)? the law\b|\bend of the law\b|\bdestroy the law\b|\bno longer under (the )?law\b|\blaw .{0,20}temporary\b/, 5),
      q('law-before-moses', /\bbefore (the law|moses) was\b|\bkept the law before\b|\bpatriarchs .{0,30}law\b/, 5),
      q('keep-law', /\bkeep(ing)? the (law|commandments)\b|\bobserve the (law|commandments)\b|\bdoers of the law\b/, 4),
      q('law-eternal', /\blaw (is|shall be) eternal\b|\bnot one jot\b|\bnever pass away\b/, 4),
      q('yoke', /\byoke of the law\b|\byoke of bondage\b|\bburden\b(?=[^.]{0,50}\blaw\b)/, 4),
      q('written-in-heart', /\bwritten (up)?on (their|the) hearts?\b|\bunwritten law\b|\blaw of nature\b/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'circumcision', label: 'Circumcision and identity',
    blurb: 'The covenant sign: what it marks, whether it can be spiritualised, and what a Gentile who wants in must do.',
    queries: [
      q('circumcision', /\bcircumcis(e|ed|ion)\b|\buncircumcis/, 5),
      q('covenant-sign', /\bsign of the covenant\b|\bcovenant in (your|the) flesh\b|\beighth day\b/, 4),
      q('circumcision-of-heart', /\bcircumcis(e|ed|ion) of the heart\b|\bcircumcise (your|the) heart\b/, 5),
      q('proselyte', /\bproselyte[s]?\b|\bbecome a jew\b|\bjudaiz/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'purity', label: 'Purity, food and the table',
    blurb: 'Clean and unclean: food laws, washing, corpse impurity, and who may eat with whom — the practical shape of separation.',
    queries: [
      q('clean-unclean', /\b(un)?clean(ness)?\b(?=[^.]{0,60}\b(eat|food|touch|defil|pure)\b)|\bdefile(d|ment)?\b/, 4),
      q('food-laws', /\bforbidden (food|meat)\b|\bswine.{0,3}s? flesh\b|\bthings strangled\b|\bkosher\b|\beat no\b/, 4),
      q('washing', /\bwash(ing|ed)? (their|the|his) hands\b|\bpurificat/, 4),
      q('corpse-impurity', /\btouch(es|ed|ing)? (a|the) (dead|corpse)\b|\bred heifer\b|\bwater of purification\b/, 4),
      q('table-fellowship', /\beat with\b(?=[^.]{0,50}\b(gentile|sinner|greek)\b)|\bat table with\b/, 4),
      q('idol-food', /\bmeat[s]? (offered|sacrificed) (to|unto) idols\b|\bidol[- ]sacrifice/, 5),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'fasting-almsgiving', label: 'Fasting and almsgiving',
    blurb: 'Two of the three pillars of Jewish piety (prayer has its own page): how they are done, how publicly, and what they are thought to achieve.',
    queries: [
      q('fasting', /\bfast(ing|ed|s)?\b(?=[^.]{0,60}\b(pray|day|week|humbl|afflict)\b)|\bfast twice\b/, 4),
      q('almsgiving', /\balms(giving|deeds)?\b|\bgive to the poor\b|\bcharity\b/, 4),
      q('secret', /\bin secret\b(?=[^.]{0,60}\b(pray|alms|fast)\b)|\bnot .{0,20}as the hypocrites\b/, 4),
    ], context: [/\bgod\b/, /\blord\b/, /\bheaven\b/, /\bfast/, /\balms/], minScore: 4, perWorkCap: 6 },

  { id: 'wealth', label: 'Wealth, poverty and possessions',
    blurb: 'Riches as blessing and as danger; the poor as pious; and the community of goods some groups actually practised.',
    queries: [
      q('rich-warning', /\bwoe (unto|to) (you|the) rich\b|\brich man\b(?=[^.]{0,60}\b(hard|kingdom|judg)\b)|\blove of money\b/, 4),
      q('poor-pious', /\bthe poor\b(?=[^.]{0,60}\b(righteous|god|blessed|humble)\b)|\bpoor and needy\b/, 3),
      q('community-of-goods', /\ball things (in )?common\b|\bcommon (purse|stock|fund)\b|\bdespise riches\b/, 5),
      q('mammon', /\bmammon\b|\btreasure (in|upon) (heaven|earth)\b/, 4),
      q('usury', /\busury\b|\blend(ing)?\b(?=[^.]{0,40}\binterest\b)/, 3),
    ], context: [], minScore: 4, perWorkCap: 6 },

  // ── Temple, priesthood and community ──────────────────────────────────────────────────
  { id: 'temple', label: 'Temple and sanctuary',
    blurb: 'The house on the mount, the heavenly pattern behind it, the community imagined as a temple, and what its destruction meant.',
    queries: [
      q('temple', /\btemple\b|\bsanctuary\b|\bholy place\b|\bholy of holies\b/, 4),
      q('tabernacle', /\btabernacle\b|\btent of (meeting|witness)\b/, 4),
      q('heavenly-temple', /\btemple (in|of) heaven\b|\bheavenly (temple|sanctuary)\b|\bpattern (shown|showed)\b/, 5),
      q('community-temple', /\b(ye|you) are (the |a )?temple\b|\btemple of god\b(?=[^.]{0,60}\b(ye|you|we|us)\b)|\bspiritual house\b/, 5),
      q('destruction', /\bdestroy(ed)? the temple\b|\bburn(ed|t) the (temple|house)\b|\bnot one stone\b/, 4),
      q('veil', /\bveil\b(?=[^.]{0,40}\b(temple|sanctuary|holy)\b)|\bcurtain\b/, 3),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'priesthood', label: 'Priesthood and mediation',
    blurb: 'Who stands between God and Israel: the Aaronic line, Melchizedek, the high priest, and a priesthood of all.',
    queries: [
      q('high-priest', /\bhigh[- ]priest\b/, 4),
      q('priesthood', /\bpriesthood\b|\bpriestly\b|\bsons of aaron\b|\blevites?\b/, 4),
      q('melchizedek', /\bmelchizedek\b|\bmelchisedec\b/, 5),
      q('intercede', /\bintercede\b|\bintercession\b|\bmake atonement for the people\b/, 4),
      q('royal-priesthood', /\broyal priesthood\b|\bkingdom of priests\b|\ba priest for ever\b/, 5),
      q('priest', /\bpriest[s]?\b/, 1, true),
    ], context: [/\baltar\b/, /\bsacrific/, /\btemple\b/, /\batone/, /\boffering\b/], minScore: 4, perWorkCap: 6 },

  { id: 'assembly', label: 'The assembly: church and synagogue',
    blurb: 'How the gathered community describes itself — ekklēsia, synagogue, the many, the holy ones — and how it orders itself.',
    queries: [
      q('church', /\bchurch(es)?\b|\bekklesia\b|\bassembly of (god|the lord|the saints)\b/, 4),
      q('synagogue', /\bsynagogue[s]?\b|\bhouse of (prayer|study)\b/, 4),
      q('congregation', /\bcongregation\b|\bthe many\b|\bcommunity\b(?=[^.]{0,50}\b(rule|order|member)\b)/, 3),
      q('offices', /\bbishop[s]?\b|\bpresbyter[s]?\b|\belder[s]?\b|\bdeacon[s]?\b|\boverseer[s]?\b/, 4),
      q('saints', /\bthe saints\b|\bholy ones\b|\bbrethren\b/, 2, true),
      q('unity', /\bone body\b|\bmembers (of|one)\b|\bschism\b|\bdivision[s]? among\b/, 3),
    ], context: [/\bgod\b/, /\bchrist\b/, /\bgather/, /\bassembl/, /\bchurch\b/], minScore: 4, perWorkCap: 6 },

  { id: 'baptism', label: 'Baptism and ritual washing',
    blurb: 'Immersion before and after John: proselyte washing, the mikveh, daily ablution, and Christian initiation.',
    queries: [
      q('baptism', /\bbaptism\b|\bbaptiz(e|ed|ing)\b|\bbaptist\b/, 5),
      q('immersion', /\bimmers(e|ed|ion)\b|\bplunge(d)? into\b|\bdip(ped)? (himself|in)\b/, 4),
      q('ritual-bath', /\bbath(e|ed|ing)\b(?=[^.]{0,60}\b(pure|purif|holy|water)\b)|\bwater[s]? of purification\b|\bliving water\b/, 4),
      q('washing-regeneration', /\bwashing of regeneration\b|\bborn (again|of water)\b|\bnew birth\b/, 5),
      q('forgiveness-baptism', /\bbaptism .{0,30}(repentance|remission|forgiveness)\b/, 5),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'mission', label: 'Mission, the nations and the proselyte',
    blurb: 'Whether Israel’s God is for the nations too — pilgrimage of the Gentiles, active proselytising, and Christian sending.',
    queries: [
      q('nations', /\b(the )?nations\b|\bgentile[s]?\b|\bheathen\b/, 2, true),
      q('light-to-nations', /\blight (to|of|unto) the (nations|gentiles)\b|\bsalvation .{0,25}ends of the earth\b/, 5),
      q('pilgrimage', /\bnations shall (come|flow|stream)\b|\ball nations shall\b|\bcome up to jerusalem\b/, 4),
      q('proselytise', /\bcompass sea and land\b|\bmake one proselyte\b|\bwin (over|them)\b|\bconvert(ed|ing)? (the )?(gentile|greek|nation)/, 5),
      q('sent', /\bsent (them |us |me )?(out |forth )?(to|unto|into)\b(?=[^.]{0,50}\b(nation|world|gentile)\b)|\bpreach(ed|ing)? .{0,20}to (all|every)\b/, 4),
      q('god-fearers', /\bgod[- ]fearing\b|\bworshipp?ers of god\b|\bdevout (greeks|men)\b/, 4),
    ], context: [/\bgod\b/, /\bisrael\b/, /\blord\b/, /\bnation/, /\bgentile/], minScore: 4, perWorkCap: 6 },

  // ── Last things ───────────────────────────────────────────────────────────────────────
  { id: 'second-coming', label: 'The day of the Lord and the coming',
    blurb: 'God’s decisive arrival — the day of the Lord in the prophets, and the parousia the earliest Christians expected soon.',
    queries: [
      // "his coming" and "that day" are ordinary English and caught Esther's feast and Zorobabel
      // arriving at the temple. Bare "appearing" is worse. Require the eschatological subject.
      q('parousia', /\bparousia\b|\bcoming of the lord\b|\bhis (glorious )?appearing\b|\bhis coming\b(?=[^.]{0,60}\b(judg|glory|kingdom|end|world|again)\b)/, 4),
      q('day-of-lord', /\bday of the lord\b|\bgreat day of\b|\bthat day\b(?=[^.]{0,60}\b(judg|wrath|end|world|come again)\b)/, 4),
      q('come-again', /\bcome again\b|\bshall come with\b(?=[^.]{0,40}\b(glory|clouds|angels|power)\b)|\bdescend from heaven\b|\bcoming in glory\b/, 5),
      q('trumpet-end', /\blast trump\b|\btrumpet shall sound\b|\bsummons of the trumpet\b/, 4),
      q('soon', /\bat hand\b|\bshortly\b(?=[^.]{0,40}\bcome\b)|\bnot delay\b|\bquickly\b(?=[^.]{0,30}\bcome\b)/, 3),
      q('signs', /\bsigns of\b(?=[^.]{0,40}\b(end|times|coming)\b)|\bbirth[- ]pangs\b|\bwars and rumou?rs\b/, 4),
      q('watch', /\bwatch (therefore|ye)\b|\bknow(eth)? not (the|what) (day|hour)\b|\bthief in the night\b/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'judgment', label: 'Judgment',
    blurb: 'The books opened, the balance, the fire — who judges, when, and on what basis.',
    queries: [
      q('great-judgment', /\bgreat judg(e)?ment\b|\bday of judg(e)?ment\b|\bjudg(e)?ment[- ]seat\b/, 5),
      q('books-opened', /\bbooks were opened\b|\bbook of life\b|\bwritten in the book\b|\brecord(ed)? .{0,25}deeds\b/, 5),
      q('weighed', /\bweighed in the balance\b|\bscales\b(?=[^.]{0,40}\b(judg|deed|righteous)\b)/, 4),
      q('fire', /\beternal fire\b|\bunquenchable fire\b|\bfurnace\b|\blake of fire\b/, 4),
      q('recompense', /\baccording to (his|their) (works|deeds)\b|\brender to (each|every)\b|\brewards? and punishments?\b/, 4),
      q('judge', /\bjudg(e|es|ed|ing|ment)\b/, 1, true),
    ], context: [/\bgod\b/, /\blord\b/, /\brighteous/, /\bwicked\b/, /\bdeed/, /\bsin\b/], minScore: 4, perWorkCap: 6 },

  { id: 'kingdom', label: 'The kingdom of God',
    blurb: 'God’s reign: present or coming, earthly or heavenly, national or universal.',
    queries: [
      q('kingdom-of-god', /\bkingdom of (god|heaven|the most high)\b/, 5),
      q('reign', /\bthe lord (shall|will) reign\b|\bhis kingdom\b(?=[^.]{0,50}\b(everlasting|for ever|eternal)\b)|\beverlasting kingdom\b/, 4),
      q('messianic-age', /\bmessianic\b|\bdays of the messiah\b|\bthousand years\b|\bmillenni/, 4),
      q('banquet', /\bfeast\b(?=[^.]{0,50}\b(kingdom|abraham|messiah)\b)|\bsit down with abraham\b|\bmessianic banquet\b/, 4),
      q('kingdom', /\bkingdom\b/, 1, true),
    ], context: [/\bgod\b/, /\bheaven\b/, /\blord\b/, /\bmessiah\b/, /\breign\b/], minScore: 4, perWorkCap: 6 },

  { id: 'antichrist', label: 'Antichrist, tribulation and the end',
    blurb: 'The last adversary and the distress before the end — Beliar, the man of lawlessness, the abomination, the beast.',
    queries: [
      q('antichrist', /\bantichrist\b|\bman of (sin|lawlessness)\b|\bson of perdition\b/, 5),
      q('beliar-end', /\bbeliar\b|\bbelial\b(?=[^.]{0,80}\b(come|last|end|king)\b)/, 4),
      q('abomination', /\babomination of desolation\b|\bdesolating sacrilege\b/, 5),
      q('beast', /\bthe beast\b|\bfour beasts\b|\blittle horn\b/, 4),
      q('tribulation', /\btribulation\b|\btime of trouble\b|\bsuch as (was|has) not been\b|\bdistress of nations\b/, 4),
      q('deceiver', /\bdeceiv(e|er|ing) the (world|elect|many)\b|\bfalse (prophet|christ|messiah)/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  // ── People, place and power ───────────────────────────────────────────────────────────
  { id: 'israel', label: 'Israel: people, land and restoration',
    blurb: 'Who Israel is and what is promised to it — the twelve tribes, the land, exile and regathering, the remnant, and the question of whether anyone else can be counted in. Distinct from Grace and election, which asks what being chosen secures; this asks who the chosen are.',
    queries: [
      q('twelve-tribes', /\btwelve tribes\b|\btribes of israel\b|\bten tribes\b|\bhouse of (israel|jacob|judah)\b/, 4),
      q('my-people', /\bmy people\b|\bhis people\b|\bpeople of god\b|\bchosen (people|nation|race)\b/, 3),
      q('the-land', /\bthe land\b(?=[^.]{0,70}\b(promis|inherit|give|possess|father)\b)|\bland of (your|their|our) (fathers|inheritance)\b|\binherit the land\b/, 4),
      q('exile', /\bexile[ds]?\b|\bcaptivity\b|\bdispersion\b|\bdiaspora\b|\bscattered (among|abroad)\b/, 4, true),
      q('restoration', /\bgather (them|you|the outcasts)\b|\bbring (them|you) back\b|\brestore (the fortunes|israel|the kingdom)\b|\bregather/, 4),
      q('remnant-israel', /\bremnant of (israel|jacob|my people)\b|\bthose who (are )?left\b/, 4),
      q('seed-of-abraham', /\bseed of abraham\b|\bchildren of abraham\b|\boffspring of abraham\b/, 4),
      q('true-israel', /\bisrael of god\b|\btrue (israel|jew)\b|\bjew inwardly\b|\bnot all .{0,20}israel\b/, 5),
      q('zion', /\bzion\b|\bjerusalem\b/, 1, true),
    ], context: [/\bisrael\b/, /\bjacob\b/, /\bjudah\b/, /\bjerusalem\b/, /\bzion\b/, /\bbabylon\b/, /\bcovenant\b/, /\babraham\b/, /\bjews?\b/], minScore: 4, perWorkCap: 6 },

  { id: 'government', label: 'Rulers, empire and the state',
    blurb: 'Living under power that is not your own: kingship, Rome, taxes and the census, obedience and its limits, prayer for the emperor, and the point at which the faithful refuse.',
    queries: [
      q('rulers', /\brulers?\b|\bmagistrate[s]?\b|\bgovernor[s]?\b|\bprocurator\b|\bprefect\b/, 3),
      q('emperor', /\bcaesar\b|\bemperor\b|\baugustus\b|\btiberius\b|\bnero\b|\bthe senate\b/, 4),
      q('kingship', /\bking(ship|dom)? of\b(?=[^.]{0,50}\b(earth|men|nations|this world)\b)|\banoint(ed)? .{0,15}king\b|\bset a king over\b/, 3),
      q('authority-from-god', /\bpower[s]? that be\b|\bauthority .{0,25}(from|of) god\b|\bgod (gives|gave|appoints) .{0,25}(king|rule|power)\b|\bordained (of|by) god\b/, 5),
      q('taxes', /\btribute\b|\btax(es|ation)?\b|\bcensus\b|\bpoll[- ]tax\b|\bcustom(s)?\b(?=[^.]{0,40}\b(pay|receiv|collect)\b)/, 4),
      q('obedience', /\bsubject (to|unto) (the )?(higher|governing|ruling)\b|\bobey (the )?(king|ruler|magistrate|authorit)\b|\bhonou?r the king\b/, 5),
      q('pray-for-rulers', /\bpray for (the )?(king|emperor|those in authority|rulers)\b|\bprayers .{0,25}for kings\b/, 5),
      q('refusal', /\brefus(e|ed|ing) to (sacrifice|swear|worship)\b|\bwe (must|ought to) obey god rather\b|\bnot (worship|serve) the (image|emperor)\b/, 5),
      q('tyranny', /\btyrant\b|\btyranny\b|\bdespot\b|\bunjust (rule|ruler|judge)\b/, 4),
    ], context: [], minScore: 4, perWorkCap: 6 },

  { id: 'prayer', label: 'Prayer',
    blurb: 'How prayer is made: fixed hours and postures, the Shema and the benedictions, intercession for others, and the argument over whether prayer replaces sacrifice once the Temple is gone.',
    queries: [
      q('shema', /\bhear,? o israel\b|\brecite the shema\b|\bthe shema\b/, 5),
      q('benedictions', /\beighteen benedictions\b|\bthe amidah\b|\bstanding prayer\b|\bblessed art thou\b|\bbenediction[s]?\b/, 4),
      q('hours', /\bthree times a day\b|\bhour of prayer\b|\bmorning and evening\b|\bninth hour\b|\bfixed (times|hours)\b/, 4),
      q('posture', /\b(kneel|knelt|bow(ed)?)\b(?=[^.]{0,50}\bpray)/, 3),
      q('toward-jerusalem', /\btoward[s]? jerusalem\b|\bfacing the (temple|sanctuary|holy)\b/, 4),
      q('intercession', /\bpray(ed|s|ing)? for\b|\bmake supplication for\b|\bintercede\b/, 3),
      q('house-of-prayer', /\bhouse of prayer\b/, 4),
      q('our-father', /\bour father (which|who) art\b|\bwhen (ye|you) pray,? say\b|\bthe lord.{0,3}s prayer\b/, 5),
      q('prayer-availeth', /\bprayer of (the|a) righteous\b|\bprayer availeth\b|\bheard (his|their|my) prayer\b/, 4),
      q('prayer-not-sacrifice', /\bprayer .{0,30}instead of\b|\boffering of (the )?lips\b|\bsacrifice of praise\b|\bbetter than sacrifice\b/, 5),
      q('pray', /\bpray(er|ers|ed|ing|s)?\b/, 1, true),
    ], context: [/\bgod\b/, /\blord\b/, /\bheaven\b/, /\bsupplicat/, /\bworship\b/, /\bfast/], minScore: 4, perWorkCap: 6 },
]
