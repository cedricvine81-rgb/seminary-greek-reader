// Short "Authorship" and "Contents" blurbs for each work in the Texts library, surfaced as the
// two floating popovers beside an open text's title (see TextsReader). Where a work already has a
// vetted entry in backgrounds-summaries.ts (the Second Temple student guide), that entry's
// Authorship + Contents sections are reused; everything else is authored here.
//
// The Contents blurb is a brief whole-book overview (a few sentences), NOT a chapter-by-chapter
// index. Entries are AI-drafted at an introductory, non-technical level — corrections welcome.
import { BACKGROUND_SUMMARIES } from './backgrounds-summaries'
import type { CatalogWork } from './texts-catalog'

export interface TextSummary {
  authorship: string
  contents: string
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// Index the vetted Backgrounds summaries by normalized title so a Texts work can borrow its
// Authorship + Contents sections when the names match.
const _bgByName = new Map<string, { authorship: string; contents: string }>()
for (const cat of BACKGROUND_SUMMARIES) {
  for (const w of cat.works) {
    const body = (h: string) => w.sections.find(s => s.heading.toLowerCase() === h)?.body ?? ''
    _bgByName.set(norm(w.title), { authorship: body('authorship'), contents: body('contents') })
  }
}

/** Authorship + Contents blurbs for an open Texts work, or null if none is known. */
export function getTextSummary(work: Pick<CatalogWork, 'id' | 'name'>): TextSummary | null {
  const authored = TEXT_SUMMARIES[work.id]
  if (authored) return authored
  const bg = _bgByName.get(norm(work.name)) ?? _bgByName.get(norm(work.name.replace(/\s*\(.*\)$/, '')))
  if (bg && (bg.authorship || bg.contents)) return { authorship: bg.authorship, contents: bg.contents }
  return null
}

// Authored blurbs, keyed by CatalogWork.id, for works not covered by backgrounds-summaries.ts.
export const TEXT_SUMMARIES: Record<string, TextSummary> = {
  // ── Apocrypha (works without an existing summary) ──────────────────────────────
  EsthGr: {
    authorship: 'The Greek version of Esther expands the Hebrew book with six substantial "Additions" of unknown authorship, likely composed in the 2nd–1st century BCE. A colophon attributes the translation to a Lysimachus of Jerusalem.',
    contents: 'It retells the deliverance of the Jews of Persia through Queen Esther and Mordecai, but adds dreams, prayers, royal edicts, and an explicit religious framing that the Hebrew text lacks — most notably naming God, who is never mentioned in the Hebrew.',
  },
  '2esdras': {
    authorship: 'A composite apocalypse (also called 4 Ezra) whose central Jewish core was written in Hebrew or Aramaic around 100 CE, later wrapped in Christian additions (chapters 1–2 and 15–16) and preserved mainly in Latin.',
    contents: 'Ezra questions God about the suffering of Israel and the justice of the world after the fall of Jerusalem; through seven visions and dialogues with the angel Uriel he is led toward the hope of a coming age, a messianic deliverer, and final judgment.',
  },
  Sir: {
    authorship: 'Written in Hebrew by Jesus ben Sira, a Jerusalem scribe, around 180 BCE, and translated into Greek by his grandson (who supplies a dated preface) after 132 BCE.',
    contents: 'A long collection of wisdom instruction on daily conduct, friendship, speech, wealth, women, and the fear of the Lord, closing with a "Praise of the Fathers" that celebrates Israel’s great figures from the patriarchs to the high priest Simon.',
  },
  EpJer: {
    authorship: 'An anonymous work presented as a letter of Jeremiah to the exiles, actually composed later (perhaps 4th–2nd century BCE) and sometimes attached as the sixth chapter of Baruch.',
    contents: 'A sustained satire against idolatry, arguing again and again that the gods of Babylon are powerless man-made images that cannot see, speak, or save, and warning the exiles not to fear or worship them.',
  },
  DanLXX: {
    authorship: 'The Old Greek translation of Daniel (distinct from the later, more widely used Theodotion version), rendering the 2nd-century-BCE Hebrew-Aramaic book together with its Greek additions.',
    contents: 'The court tales of Daniel and his friends under Babylonian and Persian kings, followed by apocalyptic visions of successive empires and the end, plus the additions (the Prayer of Azariah, Song of the Three, Susanna, and Bel and the Dragon).',
  },
  Odes: {
    authorship: 'A liturgical appendix to the Psalter in some Septuagint manuscripts, gathering songs of diverse biblical and early-Christian authorship for use in worship.',
    contents: 'A collection of scriptural canticles — such as the songs of Moses, Hannah, and the three young men, together with New Testament songs like the Magnificat — assembled as a hymnbook of prayer and praise.',
  },

  // ── Josephus (works without an existing summary) ───────────────────────────────
  antiquities: {
    authorship: 'Written in Greek by the Jewish historian Flavius Josephus and completed around 93–94 CE in Rome, under Flavian patronage.',
    contents: 'A twenty-book history of the Jewish people from creation to the eve of the revolt against Rome (66 CE), retelling the biblical narrative and then carrying the story through the Second Temple period, the Hasmoneans, Herod, and Roman rule.',
  },
  life: {
    authorship: 'Josephus’s own autobiography, appended to the Antiquities and written in Greek in the 90s CE.',
    contents: 'A largely self-justifying memoir focused on his command in Galilee at the start of the Jewish revolt, defending his conduct against the rival account of Justus of Tiberias.',
  },

  // ── Philo of Alexandria ────────────────────────────────────────────────────────
  'philo-creation': {
    authorship: 'By Philo of Alexandria, the Jewish philosopher (c. 20 BCE – c. 50 CE), writing in Greek.',
    contents: 'A philosophical reading of Genesis 1–3, presenting Moses’s creation account in harmony with Platonic and Stoic thought — the cosmos as the work of a good God, ordered by the divine Logos, with humanity made in the divine image.',
  },
  'philo-alleg-interp': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A verse-by-verse allegorical commentary on Genesis 2–3, treating Adam, Eve, and the garden as symbols of the mind, sense-perception, and the soul’s struggle between virtue and pleasure.',
  },
  'philo-cherubim': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An allegorical exposition prompted by the expulsion from Eden and the cherubim guarding the way, moving into the meaning of the flaming sword, Cain and Abel, and the soul’s offerings to God.',
  },
  'philo-sacrifices': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An allegory of Cain and Abel as two dispositions of the soul — self-love versus devotion to God — reflecting on why God accepted one offering and rejected the other.',
  },
  'philo-worse': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A continuation on Cain and Abel, arguing that the lover of self (the "worse") assails the lover of God (the "better") yet cannot truly destroy virtue.',
  },
  'philo-posterity': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An allegorical treatment of Cain’s descendants and exile, exploring what it means to "go out from the presence of God" and the barrenness of a life cut off from the divine.',
  },
  'philo-giants': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A reading of Genesis 6 and the "sons of God," interpreting angels, giants, and the Spirit of God in terms of souls, bodies, and the moral life rather than myth.',
  },
  'philo-unchangeable': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'Prompted by Genesis 6:4–12, an argument that God does not "repent" or change, and that biblical language of divine emotion is accommodated to human understanding.',
  },
  'philo-husbandry': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An allegory built on Noah as a "husbandman," contrasting the skilled cultivation of the soul’s virtues with mere unskilled toil.',
  },
  'philo-planter': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A companion piece on Noah the planter of a vineyard, reading the planting of trees as God’s cultivation of virtue in the world and the soul.',
  },
  'philo-drunkenness': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'On the symbolism of wine and drunkenness in Scripture, distinguishing foolish intoxication from the "sober drunkenness" of the soul caught up in God.',
  },
  'philo-sobriety': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A short sequel on Noah’s sobriety after wine, on blessing and cursing (Shem, Ham, Japheth), and the wisdom of the awakened, self-controlled mind.',
  },
  'philo-confusion': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An allegorical reading of Babel and the confusion of tongues as the scattering of a soul in rebellion against God, contrasted with the unifying power of the divine Logos.',
  },
  'philo-migration': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'On Abraham’s call to leave country, kindred, and father’s house (Genesis 12), read as the soul’s journey away from the body and the senses toward God.',
  },
  'philo-heir': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An exposition of God’s covenant promise to Abraham (Genesis 15), on who is fit to be "heir" of divine things and on the dividing of the sacrifice as a lesson in the ordering of the cosmos.',
  },
  'philo-congress': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An allegory of Abraham, Sarah, and Hagar in which Hagar represents the preliminary studies (grammar, rhetoric, geometry, and the like) that prepare the soul for the wisdom symbolized by Sarah.',
  },
  'philo-flight': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'On the flight of Hagar and later of Jacob, treating themes of fleeing, seeking, and finding, and the cities of refuge as figures of the soul’s escape from passion.',
  },
  'philo-names': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'On the renaming of Abram to Abraham and Sarai to Sarah, reading the change of names as marking stages of the soul’s progress toward virtue and knowledge of God.',
  },
  'philo-dreams': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE); two surviving books of an originally larger work.',
    contents: 'A treatise on God-sent dreams in Scripture — Jacob’s ladder and the dreams of Joseph, Pharaoh, and others — classified and interpreted as the soul’s encounters with the divine.',
  },
  'philo-abraham': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A biography of Abraham as the model of the virtuous life, presenting him as one who attained wisdom by nature and faith, with his story read both literally and allegorically.',
  },
  'philo-joseph': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A portrait of Joseph as the ideal statesman, using his rise in Egypt to reflect on political life, self-mastery, and the governance of a well-ordered soul and society.',
  },
  'philo-moses': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE); in two books.',
    contents: 'A life of Moses presenting him as the perfect king, lawgiver, priest, and prophet, aimed partly at a non-Jewish audience to commend the greatness of Israel’s legislator.',
  },
  'philo-decalogue': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An exposition of the Ten Commandments as the summary headings of the Law, explaining why they were given directly by God and how they organize all other commandments.',
  },
  'philo-spec-laws': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE); in four books.',
    contents: 'A systematic treatment of the particular laws of Moses arranged under the Ten Commandments, covering worship, oaths, the Sabbath and festivals, marriage and family, justice, and the virtues.',
  },
  'philo-virtues': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'An account of the virtues fostered by the Mosaic law — courage, humanity (philanthropy), repentance, and nobility — showing the Law as a school of ethical character.',
  },
  'philo-rewards': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'On the rewards promised to the good and the punishments awaiting the wicked, concluding Philo’s exposition of the Law with blessings and curses and the hope of Israel’s restoration.',
  },
  'philo-good-person': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A philosophical defense of the Stoic paradox that only the morally good person is truly free, illustrated with examples including a notable description of the Essenes.',
  },
  'philo-contemplative': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A description of the Therapeutae, a contemplative Jewish community near Alexandria, praising their ascetic, prayerful life of Scripture study as the ideal of the contemplative existence.',
  },
  'philo-eternity': {
    authorship: 'Attributed to Philo of Alexandria (c. 20 BCE – c. 50 CE), though its authenticity is debated.',
    contents: 'A philosophical treatise arguing, largely on Stoic and Aristotelian grounds, that the world is uncreated and imperishable — eternal in its ordered existence.',
  },
  'philo-flaccus': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A historical account of the persecution of the Jews of Alexandria under the Roman prefect Flaccus, presenting his downfall and punishment as evidence of divine justice.',
  },
  'philo-hypothetica': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE); preserved only in fragments quoted by Eusebius.',
    contents: 'An apology (defense) of the Jewish people and their laws before a pagan readership, summarizing Israel’s history and customs, including another account of the Essenes.',
  },
  'philo-providence': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE); surviving mainly in Armenian and Greek fragments.',
    contents: 'A dialogue defending divine providence against objections, arguing that God governs the world justly despite the apparent prosperity of the wicked and suffering of the good.',
  },
  'philo-embassy': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE).',
    contents: 'A first-hand account of the Jewish embassy to the emperor Gaius (Caligula), whom Philo leads, describing the crisis over Caligula’s demand to be worshipped and his plan to place his statue in the Jerusalem temple.',
  },
  'philo-qg': {
    authorship: 'By Philo of Alexandria (c. 20 BCE – c. 50 CE); preserved largely in Armenian.',
    contents: 'A running commentary on Genesis in question-and-answer form, giving both literal and allegorical explanations of the text verse by verse.',
  },
  'philo-world': {
    authorship: 'A short cosmological piece transmitted in the Philonic corpus; its authenticity is uncertain.',
    contents: 'A brief account of the structure and ordering of the physical world, appended to the collection as a supplementary treatise.',
  },
  'philo-fragments': {
    authorship: 'Assorted passages attributed to Philo of Alexandria (c. 20 BCE – c. 50 CE), surviving as quotations in later authors.',
    contents: 'A miscellany of fragments and excerpts from lost or partial Philonic works, gathered as an appendix.',
  },

  // ── Septuagint (Old Testament) ─────────────────────────────────────────────────
  Gen: { authorship: 'Traditionally ascribed to Moses; modern scholarship sees the Pentateuch as woven from earlier sources and edited over centuries. This is the Greek (Septuagint) translation of the 3rd century BCE.', contents: 'The book of beginnings: creation, the fall, the flood, and Babel, then the family story of the patriarchs Abraham, Isaac, Jacob, and Joseph down to Israel’s descent into Egypt.' },
  Exod: { authorship: 'Traditionally Moses; the Greek translation belongs to the earliest stratum of the Septuagint.', contents: 'Israel’s slavery in Egypt, the exodus under Moses, the covenant and law at Sinai, and the building of the tabernacle.' },
  Lev: { authorship: 'Traditionally Moses; part of the priestly legislation of the Pentateuch.', contents: 'Laws of sacrifice, priesthood, purity, and holiness, including the Day of Atonement and the Holiness Code.' },
  Num: { authorship: 'Traditionally Moses; part of the Pentateuch.', contents: 'Israel’s wilderness wanderings from Sinai toward Canaan, with censuses, rebellions, and further legislation.' },
  Deut: { authorship: 'Traditionally Moses; widely linked by scholars to reform in the 7th century BCE.', contents: 'Moses’s farewell speeches restating the law and covenant on the plains of Moab, ending with his death.' },
  JoshB: { authorship: 'Anonymous; the Septuagint Joshua (Codex Vaticanus tradition) is a shorter, distinct form of the book.', contents: 'The conquest and division of the promised land under Joshua, and the covenant renewal at Shechem.' },
  JudgB: { authorship: 'Anonymous; a compilation of older tradition in Greek dress.', contents: 'The turbulent era of the "judges" — cyclical apostasy, oppression, and deliverance through leaders like Deborah, Gideon, and Samson.' },
  Ruth: { authorship: 'Anonymous.', contents: 'The story of Ruth the Moabite, whose loyalty to Naomi and marriage to Boaz place her in the ancestry of King David.' },
  '1Sam': { authorship: 'Anonymous; Samuel–Kings form a continuous history.', contents: 'From Samuel and the last judges to the rise and fall of Saul and the emergence of David.' },
  '2Sam': { authorship: 'Anonymous; continues 1 Samuel.', contents: 'The reign of David — his triumphs, his sin with Bathsheba, and the troubles within his household.' },
  '1Kgs': { authorship: 'Anonymous; part of the deuteronomistic history.', contents: 'Solomon’s reign and temple, the division of the kingdom, and the prophets Elijah and Elisha.' },
  '2Kgs': { authorship: 'Anonymous; continues 1 Kings.', contents: 'The parallel decline of Israel and Judah down to the fall of Samaria and the Babylonian exile.' },
  '1Chr': { authorship: 'Anonymous ("the Chronicler"), post-exilic.', contents: 'Genealogies from Adam, then a temple-centered retelling of David’s reign.' },
  '2Chr': { authorship: 'Anonymous ("the Chronicler"), post-exilic.', contents: 'Solomon’s temple and the kings of Judah, ending with the exile and the edict of Cyrus.' },
  Ezra: { authorship: 'Associated with Ezra; part of the Ezra–Nehemiah history.', contents: 'The return from Babylon, the rebuilding of the temple, and Ezra’s reform of the community.' },
  Neh: { authorship: 'Drawing on Nehemiah’s memoirs.', contents: 'The rebuilding of Jerusalem’s walls and the renewal of the covenant under Nehemiah and Ezra.' },
  Job: { authorship: 'Anonymous; a poetic masterpiece of uncertain date.', contents: 'The suffering of the righteous Job, his debates with his friends, and God’s answer from the whirlwind.' },
  Ps: { authorship: 'A collection of 150 psalms of many authors, many linked to David; the Greek Psalter includes an extra Psalm 151.', contents: 'Israel’s hymnbook of praise, lament, thanksgiving, and trust, gathered for worship.' },
  Prov: { authorship: 'Associated with Solomon and other sages.', contents: 'Collections of proverbs and wisdom instruction on wise and righteous living.' },
  Eccl: { authorship: 'Attributed to "Qoheleth," the son of David; date debated.', contents: 'A searching reflection on the fleeting, "vaporous" nature of life and the call to fear God and enjoy his gifts.' },
  Song: { authorship: 'Attributed to Solomon.', contents: 'A cycle of love poetry between a bride and bridegroom, read allegorically in Jewish and Christian tradition.' },
  Isa: { authorship: 'Ascribed to the 8th-century prophet Isaiah; scholars often distinguish later material within it.', contents: 'Oracles of judgment and hope for Judah, the promise of a coming king and servant, and visions of restoration.' },
  Jer: { authorship: 'The prophet Jeremiah, with his scribe Baruch; the Greek text is shorter and differently ordered than the Hebrew.', contents: 'Warnings of Jerusalem’s fall to Babylon, calls to repentance, and the promise of a new covenant.' },
  Lam: { authorship: 'Traditionally Jeremiah.', contents: 'Five poems mourning the destruction of Jerusalem, ending with a plea for restoration.' },
  Ezek: { authorship: 'The priest-prophet Ezekiel, exiled in Babylon.', contents: 'Visions of God’s glory, judgment on Jerusalem and the nations, and the promise of a new heart, dry bones raised, and a restored temple.' },
  Hos: { authorship: 'The 8th-century prophet Hosea.', contents: 'Israel’s unfaithfulness portrayed through Hosea’s troubled marriage, with judgment tempered by God’s enduring love.' },
  Joel: { authorship: 'The prophet Joel; date uncertain.', contents: 'A locust plague as a sign of the Day of the Lord, with a call to repentance and the promise of God’s Spirit poured out.' },
  Amos: { authorship: 'The 8th-century shepherd-prophet Amos.', contents: 'Sharp oracles against social injustice and empty worship in the northern kingdom, with a closing note of restoration.' },
  Obad: { authorship: 'The prophet Obadiah; the shortest Old Testament book.', contents: 'A single oracle of judgment against Edom for its violence toward Judah.' },
  Jonah: { authorship: 'Anonymous narrative about the prophet Jonah.', contents: 'Jonah’s flight from God’s call, the great fish, and his reluctant preaching to Nineveh, teaching God’s mercy to the nations.' },
  Mic: { authorship: 'The 8th-century prophet Micah.', contents: 'Judgment on Samaria and Jerusalem alongside hope of a ruler from Bethlehem and the famous call to "do justice, love mercy, and walk humbly."' },
  Nah: { authorship: 'The prophet Nahum.', contents: 'An oracle proclaiming the downfall of Nineveh, capital of Assyria.' },
  Hab: { authorship: 'The prophet Habakkuk.', contents: 'A dialogue with God over the problem of evil, answered by the call that "the righteous shall live by faith," ending in a hymn of trust.' },
  Zeph: { authorship: 'The prophet Zephaniah.', contents: 'Warnings of the Day of the Lord against Judah and the nations, closing with a promise of joy for a humble remnant.' },
  Hag: { authorship: 'The post-exilic prophet Haggai.', contents: 'Brief oracles urging the returned exiles to rebuild the temple, with promises of future glory.' },
  Zech: { authorship: 'The post-exilic prophet Zechariah.', contents: 'Night visions and oracles encouraging the temple’s rebuilding and looking ahead to a coming king and the Lord’s reign.' },
  Mal: { authorship: 'The post-exilic prophet Malachi (or "my messenger").', contents: 'Disputations rebuking careless worship and unfaithfulness, promising a coming messenger and the Day of the Lord.' },

  // ── Pseudepigrapha (works without an existing summary) ─────────────────────────
  '1enoch': {
    authorship: 'A composite apocalypse ascribed to Enoch, actually written by several anonymous Jewish authors between roughly the 3rd century BCE and the 1st century CE; preserved fully in Ethiopic.',
    contents: 'Five sections including the Watchers’ fall and the origin of evil, astronomical and calendar lore, dream visions of history, and the "Similitudes" with their heavenly Son of Man — a major source for later ideas of angels, judgment, and afterlife.',
  },
  '2baruch': {
    authorship: 'A Jewish apocalypse attributed to Baruch, Jeremiah’s scribe, written after 70 CE and preserved in Syriac.',
    contents: 'Responding to the fall of Jerusalem, Baruch receives visions and dialogues with God about suffering, resurrection, the coming Messiah, and the consolation of the Law.',
  },
  '2enoch': {
    authorship: 'An apocalypse ascribed to Enoch, of debated Jewish (possibly 1st-century CE) origin, preserved in Slavonic.',
    contents: 'Enoch is taken up through the seven (or ten) heavens, shown their secrets, instructed by God about creation and the moral life, and returns to teach his sons before his final ascent.',
  },
  apocmoses: {
    authorship: 'The Greek form of the Life of Adam and Eve, an anonymous Jewish work (with later Christian transmission) of the early centuries CE.',
    contents: 'The story of Adam and Eve after Eden — their penance, Adam’s death and burial, Eve’s retelling of the fall, and hopes for resurrection.',
  },
  '3baruch': {
    authorship: 'A Greek apocalypse attributed to Baruch, of Jewish origin with Christian editing, from the early centuries CE.',
    contents: 'Grieving over Jerusalem, Baruch is guided by an angel through five heavens, viewing cosmic wonders and the fates of the righteous and wicked.',
  },
  'pseudo-philo': {
    authorship: 'A retelling of biblical history wrongly attributed to Philo (hence "Pseudo-Philo"), by an anonymous Jewish author of the 1st century CE; also called Biblical Antiquities (L.A.B.).',
    contents: 'A rewritten Bible running from Adam to David, filling in gaps with expanded stories, speeches, and legends — notably about the judges and figures like Kenaz and Jephthah’s daughter.',
  },
  'ascension-of-isaiah': {
    authorship: 'A composite work combining a Jewish "Martyrdom of Isaiah" with Christian apocalyptic material, reaching its present form in the early Christian centuries.',
    contents: 'Isaiah is sawn in two by King Manasseh, then in a vision ascends through the seven heavens and foresees the descent, incarnation, and exaltation of Christ.',
  },
  'tp-reuben': { authorship: 'One of the Testaments of the Twelve Patriarchs, farewell speeches ascribed to Jacob’s sons; Jewish in origin with Christian editing, from around the 2nd century BCE onward.', contents: 'Reuben’s deathbed confession of his sin with Bilhah, warning his descendants against the temptations of lust and the "spirits of deceit."' },
  'tp-simeon': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Simeon warns against envy, recalling his jealousy of Joseph, and urges single-hearted goodness.' },
  'tp-levi': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Levi recounts visions of his elevation to the priesthood and instructs his sons in wisdom, righteousness, and the future of the priestly line.' },
  'tp-judah': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Judah warns against the twin dangers of wine and sexual sin and money, while foretelling kingship arising from his line.' },
  'tp-issachar': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Issachar commends the virtue of "singleness of heart" and honest, generous simplicity of life.' },
  'tp-zebulun': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Zebulun urges compassion and mercy toward all people, recalling his pity for Joseph.' },
  'tp-dan': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Dan warns against anger and lying and exhorts his sons to love truth and the Lord.' },
  'tp-naphtali': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Naphtali teaches on the good order of nature and calls for a life lived in harmony with God’s design.' },
  'tp-gad': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Gad confesses his hatred of Joseph and warns against the destructive power of hatred, commending love.' },
  'tp-asher': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Asher contrasts the "two ways" of virtue and vice and warns against double-faced hypocrisy.' },
  'tp-joseph': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Joseph recounts his endurance of temptation and suffering, holding himself up as a model of chastity and patient forgiveness.' },
  'tp-benjamin': { authorship: 'From the Testaments of the Twelve Patriarchs (Jewish with Christian editing).', contents: 'Benjamin praises the "pure mind," urging his sons toward goodness and pointing ahead to a coming redemption.' },

  // ── Targums ────────────────────────────────────────────────────────────────────
  'tg-isaiah': {
    authorship: 'The Aramaic Targum (interpretive translation) of Isaiah, part of the official Targum of the Prophets (Targum Jonathan), reaching its form in the early centuries CE.',
    contents: 'An expansive Aramaic rendering of Isaiah for the synagogue that paraphrases and interprets as it translates, notably developing messianic readings of key passages.',
  },
  'tg-psj-genesis': { authorship: 'Targum Pseudo-Jonathan, an expansive Aramaic paraphrase of the Torah, compiled over centuries and reaching its present form in the early medieval period.', contents: 'A richly expanded Aramaic Genesis that weaves midrashic legends, halakhic details, and interpretive comment into the narrative from creation to Joseph.' },
  'tg-psj-exodus': { authorship: 'Targum Pseudo-Jonathan (expansive Aramaic paraphrase of the Torah).', contents: 'An amplified Aramaic Exodus, adding narrative and legal expansions to the story of the exodus, Sinai, and the tabernacle.' },
  'tg-psj-leviticus': { authorship: 'Targum Pseudo-Jonathan (expansive Aramaic paraphrase of the Torah).', contents: 'An interpretive Aramaic Leviticus that elaborates the sacrificial and purity laws with halakhic detail.' },
  'tg-psj-numbers': { authorship: 'Targum Pseudo-Jonathan (expansive Aramaic paraphrase of the Torah).', contents: 'An expanded Aramaic Numbers, embellishing the wilderness narratives and laws with legend and comment.' },
  'tg-psj-deuteronomy': { authorship: 'Targum Pseudo-Jonathan (expansive Aramaic paraphrase of the Torah).', contents: 'An amplified Aramaic Deuteronomy that paraphrases Moses’s speeches and laws with interpretive additions.' },

  // ── Apostolic Fathers (works without an existing summary) ──────────────────────
  'af-ign-ephesians': { authorship: 'By Ignatius, bishop of Antioch, written to churches while he traveled under guard to martyrdom in Rome, c. 107–117 CE.', contents: 'A warm letter praising the Ephesians’ unity, urging obedience to their bishop, and warning against false teaching.' },
  'af-ign-magnesians': { authorship: 'By Ignatius of Antioch, c. 107–117 CE.', contents: 'An appeal to the Magnesians for unity under their (young) bishop and against Judaizing practices.' },
  'af-ign-trallians': { authorship: 'By Ignatius of Antioch, c. 107–117 CE.', contents: 'A call to the Trallians to respect their clergy and to hold firmly to the reality of Christ’s incarnation against docetic denial.' },
  'af-ign-romans': { authorship: 'By Ignatius of Antioch, c. 107–117 CE.', contents: 'A striking letter begging the Roman Christians not to prevent his martyrdom, which he longs to embrace as union with Christ.' },
  'af-ign-philadelphians': { authorship: 'By Ignatius of Antioch, c. 107–117 CE.', contents: 'An exhortation to unity around the bishop and the Eucharist, warning against division and Judaizing.' },
  'af-ign-smyrnaeans': { authorship: 'By Ignatius of Antioch, c. 107–117 CE.', contents: 'A defense of Christ’s real bodily suffering and resurrection against docetists, and an early witness to "catholic" church order.' },
  'af-ign-polycarp': { authorship: 'By Ignatius of Antioch, addressed to Polycarp, bishop of Smyrna, c. 107–117 CE.', contents: 'Pastoral counsel to Polycarp on shepherding his flock, endurance, and steadfastness.' },
  'af-polycarp': { authorship: 'By Polycarp, bishop of Smyrna and disciple of the apostle John, early 2nd century CE.', contents: 'A pastoral letter to the Philippians urging righteousness, endurance, and sound teaching, densely woven with New Testament language.' },
  'af-didache': { authorship: 'An anonymous early Christian church manual ("The Teaching of the Twelve Apostles"), likely late 1st or early 2nd century CE.', contents: 'Instruction on the "two ways" of life and death, followed by directions for baptism, fasting, the Eucharist, and church order.' },
  'af-barnabas': { authorship: 'An anonymous letter traditionally ascribed to Barnabas, actually by an unknown author, early 2nd century CE.', contents: 'A strongly allegorical argument that the Old Testament, rightly read, points to Christ, with its own version of the "two ways."' },
  'af-diognetus': { authorship: 'An anonymous Christian apology addressed to "Diognetus," 2nd century CE.', contents: 'An elegant defense of Christianity that ridicules idolatry, distinguishes Christians from Jews, and famously describes Christians as the "soul of the world."' },
  'af-mart-polycarp': { authorship: 'An eyewitness account from the church of Smyrna, mid-2nd century CE.', contents: 'The earliest detailed Christian martyrdom narrative, recounting the arrest, trial, and death by fire of the aged bishop Polycarp.' },

  // ── Church Fathers ─────────────────────────────────────────────────────────────
  'justin-dialogue': { authorship: 'By Justin Martyr, a Christian philosopher and apologist, c. 155–160 CE.', contents: 'A long dialogue with a Jew named Trypho arguing from the Scriptures that Jesus is the Messiah and that the church is the true heir of God’s promises.' },
  'justin-1apology': { authorship: 'By Justin Martyr, addressed to the emperor Antoninus Pius, c. 155 CE.', contents: 'A defense of Christians against slander, an account of their beliefs and worship (including baptism and the Eucharist), and an argument that prophecy is fulfilled in Christ.' },
  'justin-2apology': { authorship: 'By Justin Martyr, a shorter sequel to his First Apology, c. 155–160 CE.', contents: 'A protest against the unjust punishment of Christians, arguing for their innocence and the reasonableness of their faith.' },
  'anf-irenaeus-1': { authorship: 'By Irenaeus, bishop of Lyons, c. 180 CE; Book 1 of Against Heresies.', contents: 'A detailed description of the various Gnostic systems, especially the Valentinians, laying out their myths in order to expose them.' },
  'anf-irenaeus-2': { authorship: 'By Irenaeus of Lyons, c. 180 CE; Book 2 of Against Heresies.', contents: 'A reasoned refutation of Gnostic teaching, arguing that it is incoherent and contrary to the one Creator God.' },
  'anf-irenaeus-3': { authorship: 'By Irenaeus of Lyons, c. 180 CE; Book 3 of Against Heresies.', contents: 'A positive case from Scripture and apostolic tradition for one God and one Christ, appealing to the churches’ shared teaching.' },
  'anf-irenaeus-4': { authorship: 'By Irenaeus of Lyons, c. 180 CE; Book 4 of Against Heresies.', contents: 'An argument from the words of Jesus for the unity of the two Testaments and the one God of both.' },
  'anf-irenaeus-5': { authorship: 'By Irenaeus of Lyons, c. 180 CE; Book 5 of Against Heresies.', contents: 'A defense of the resurrection of the flesh and an account of last things, including his hope of a coming kingdom.' },

  // ── Greco-Roman ────────────────────────────────────────────────────────────────
  'greco-epictetus-discourses-1': { authorship: 'The teaching of the Stoic philosopher Epictetus (c. 55–135 CE), recorded by his pupil Arrian.', contents: 'Book 1 of the Discourses: practical Stoic lessons on what is "up to us," freedom, and living according to reason and nature.' },
  'greco-epictetus-discourses-2': { authorship: 'Epictetus, recorded by Arrian.', contents: 'Book 2 of the Discourses: further conversations on maintaining tranquility, right judgment, and moral progress.' },
  'greco-epictetus-discourses-3': { authorship: 'Epictetus, recorded by Arrian.', contents: 'Book 3 of the Discourses: teaching on training the will, enduring hardship, and the calling of the philosopher.' },
  'greco-epictetus-discourses-4': { authorship: 'Epictetus, recorded by Arrian.', contents: 'Book 4 of the Discourses: reflections on freedom, integrity, and steadfastness before power and death.' },
  'greco-epictetus-enchiridion': { authorship: 'A handbook distilling Epictetus’s teaching, compiled by Arrian.', contents: 'A concise manual of Stoic maxims on distinguishing what is and is not in our control and living with equanimity.' },
  'greco-diogenes-laertius': { authorship: 'By Diogenes Laertius, a biographer of the 3rd century CE.', contents: 'Lives and Opinions of Eminent Philosophers — biographies, anecdotes, and summaries of doctrine for the major Greek philosophical schools, a chief source for their history.' },

  // ── Mishnah (compiled c. 200 CE under Judah ha-Nasi; order noted) ───────────────
  'm-berakhot': { authorship: 'Part of the Mishnah, the foundational rabbinic law code redacted by Judah ha-Nasi c. 200 CE; tractate of the order Zeraim (Seeds).', contents: 'Rules for the recitation of the Shema, the Amidah prayer, and blessings over food and other occasions.' },
  'm-peah': { authorship: 'Mishnah, order Zeraim (Seeds).', contents: 'Laws of the harvest gifts left for the poor — the corner of the field (peah), gleanings, and the forgotten sheaf.' },
  'm-demai': { authorship: 'Mishnah, order Zeraim (Seeds).', contents: 'Rules for produce that may not have been properly tithed ("doubtful" produce) and how to handle it.' },
  'm-sheviit': { authorship: 'Mishnah, order Zeraim (Seeds).', contents: 'The laws of the seventh (sabbatical) year, when the land rests and debts are released.' },
  'm-terumot': { authorship: 'Mishnah, order Zeraim (Seeds).', contents: 'Regulations for the heave-offering (terumah) given to the priests from produce.' },
  'm-bikkurim': { authorship: 'Mishnah, order Zeraim (Seeds).', contents: 'The bringing of first fruits to the temple and the accompanying declaration.' },
  'm-shabbat': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'The detailed laws of the Sabbath, including the categories of forbidden work.' },
  'm-eruvin': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'Rules for the "eruv," the legal boundaries and enclosures that permit carrying and movement on the Sabbath.' },
  'm-pesachim': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'The laws of Passover — removing leaven, the paschal sacrifice, and the seder meal.' },
  'm-shekalim': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'The annual half-shekel temple tax and the administration of temple finances.' },
  'm-yoma': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'The temple service of the Day of Atonement (Yom Kippur) and its laws of fasting and repentance.' },
  'm-beitzah': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'What work is permitted on festival days, framed by the case of an egg laid on a holiday.' },
  'm-taanit': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'Public fast days, especially those called in times of drought and distress.' },
  'm-moed-katan': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'The intermediate days of the Passover and Sukkot festivals and the laws of mourning.' },
  'm-chagigah': { authorship: 'Mishnah, order Moed (Appointed Times).', contents: 'The festival pilgrimage offerings and appearance at the temple on the three pilgrim feasts.' },
  'm-yevamot': { authorship: 'Mishnah, order Nashim (Women).', contents: 'The law of levirate marriage (a widow and her deceased husband’s brother) and the release ceremony (halitzah).' },
  'm-ketubot': { authorship: 'Mishnah, order Nashim (Women).', contents: 'Marriage contracts, the wife’s financial rights, and related obligations between spouses.' },
  'm-nedarim': { authorship: 'Mishnah, order Nashim (Women).', contents: 'The law of vows — how they are made, interpreted, and annulled.' },
  'm-nazir': { authorship: 'Mishnah, order Nashim (Women).', contents: 'The vow of the Nazirite — abstaining from wine, avoiding corpses, and letting the hair grow.' },
  'm-sotah': { authorship: 'Mishnah, order Nashim (Women).', contents: 'The ordeal of the wife suspected of adultery (Numbers 5) and related matters.' },
  'm-gittin': { authorship: 'Mishnah, order Nashim (Women).', contents: 'The law of divorce and the writing and delivery of the bill of divorce (get).' },
  'm-kiddushin': { authorship: 'Mishnah, order Nashim (Women).', contents: 'The law of betrothal — how a marriage is legally contracted — and questions of lineage.' },
  'm-bava-kamma': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'Civil law of damages and torts — injuries caused by persons, animals, and property.' },
  'm-bava-metzia': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'Civil law of lost property, deposits, loans, hiring, and disputed ownership.' },
  'm-bava-batra': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'Law of real estate, partnership, sales, inheritance, and legal documents.' },
  'm-sanhedrin': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'The courts and judicial procedure, capital cases and modes of execution, and the doctrine of the world to come.' },
  'm-makkot': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'The penalty of flogging, false witnesses, and the cities of refuge.' },
  'm-shevuot': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'The law of oaths — their types, obligations, and consequences.' },
  'm-eduyot': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'A collection of legal "testimonies" handed down from earlier sages, preserving disputed rulings.' },
  'm-avodah-zarah': { authorship: 'Mishnah, order Nezikin (Damages).', contents: 'Laws governing relations with idolatry and idolaters, including forbidden trade and objects.' },
  'm-avot': { authorship: 'Mishnah, order Nezikin (Damages); known as "Ethics of the Fathers."', contents: 'A chain of tradition from Sinai through the sages, gathered as maxims of ethical and religious wisdom.' },
  'm-keritot': { authorship: 'Mishnah, order Kodashim (Holy Things).', contents: 'Sins punishable by "excision" (karet) and the sin-offerings that atone for them.' },
  'm-zevachim': { authorship: 'Mishnah, order Kodashim (Holy Things).', contents: 'The laws of animal sacrifices — how they are offered, and what invalidates them.' },
  'm-chullin': { authorship: 'Mishnah, order Kodashim (Holy Things).', contents: 'The slaughter of non-consecrated animals for food and the dietary laws, including meat and milk.' },
  'm-temurah': { authorship: 'Mishnah, order Kodashim (Holy Things).', contents: 'The law of substituting one sacrificial animal for another and the status of the exchange.' },
  'm-tamid': { authorship: 'Mishnah, order Kodashim (Holy Things).', contents: 'A description of the daily morning burnt-offering and the routine of the temple service.' },
  'm-negaim': { authorship: 'Mishnah, order Tohorot (Purities).', contents: 'The diagnosis and purity laws of "leprosy" (tzaraat) on skin, garments, and houses.' },
  'm-niddah': { authorship: 'Mishnah, order Tohorot (Purities).', contents: 'The laws of menstrual and related ritual impurity and purification.' },
  'm-tahorot': { authorship: 'Mishnah, order Tohorot (Purities).', contents: 'General laws of ritual purity and the transmission of impurity to foods and vessels.' },
  'm-yadayim': { authorship: 'Mishnah, order Tohorot (Purities).', contents: 'The ritual washing of hands and related purity questions, including a famous discussion of which books "defile the hands" (are sacred).' },
}
