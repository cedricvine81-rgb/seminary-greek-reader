// Society of Biblical Literature (SBL Handbook of Style, 2nd ed.) abbreviations for the
// primary-source categories cited in the Backgrounds cross-reference apparatus, plus the
// edition/license abbreviations used throughout this app's own source attributions.
// Curated to the works this app actually cites — not the full SBL Handbook.

export interface AbbrevGroup {
  label: string
  items: { abbr: string; full: string }[]
}

export const SBL_ABBREVIATIONS: AbbrevGroup[] = [
  {
    label: 'Old Testament',
    items: [
      { abbr: 'Gen', full: 'Genesis' }, { abbr: 'Exod', full: 'Exodus' }, { abbr: 'Lev', full: 'Leviticus' },
      { abbr: 'Num', full: 'Numbers' }, { abbr: 'Deut', full: 'Deuteronomy' }, { abbr: 'Josh', full: 'Joshua' },
      { abbr: 'Judg', full: 'Judges' }, { abbr: 'Ruth', full: 'Ruth' }, { abbr: '1–2 Sam', full: '1–2 Samuel' },
      { abbr: '1–2 Kgs', full: '1–2 Kings' }, { abbr: '1–2 Chr', full: '1–2 Chronicles' }, { abbr: 'Ezra', full: 'Ezra' },
      { abbr: 'Neh', full: 'Nehemiah' }, { abbr: 'Esth', full: 'Esther' }, { abbr: 'Job', full: 'Job' },
      { abbr: 'Ps/Pss', full: 'Psalms' }, { abbr: 'Prov', full: 'Proverbs' }, { abbr: 'Eccl', full: 'Ecclesiastes' },
      { abbr: 'Song', full: 'Song of Songs' }, { abbr: 'Isa', full: 'Isaiah' }, { abbr: 'Jer', full: 'Jeremiah' },
      { abbr: 'Lam', full: 'Lamentations' }, { abbr: 'Ezek', full: 'Ezekiel' }, { abbr: 'Dan', full: 'Daniel' },
      { abbr: 'Hos', full: 'Hosea' }, { abbr: 'Joel', full: 'Joel' }, { abbr: 'Amos', full: 'Amos' },
      { abbr: 'Obad', full: 'Obadiah' }, { abbr: 'Jonah', full: 'Jonah' }, { abbr: 'Mic', full: 'Micah' },
      { abbr: 'Nah', full: 'Nahum' }, { abbr: 'Hab', full: 'Habakkuk' }, { abbr: 'Zeph', full: 'Zephaniah' },
      { abbr: 'Hag', full: 'Haggai' }, { abbr: 'Zech', full: 'Zechariah' }, { abbr: 'Mal', full: 'Malachi' },
    ],
  },
  {
    label: 'New Testament',
    items: [
      { abbr: 'Matt', full: 'Matthew' }, { abbr: 'Mark', full: 'Mark' }, { abbr: 'Luke', full: 'Luke' },
      { abbr: 'John', full: 'John' }, { abbr: 'Acts', full: 'Acts' }, { abbr: 'Rom', full: 'Romans' },
      { abbr: '1–2 Cor', full: '1–2 Corinthians' }, { abbr: 'Gal', full: 'Galatians' }, { abbr: 'Eph', full: 'Ephesians' },
      { abbr: 'Phil', full: 'Philippians' }, { abbr: 'Col', full: 'Colossians' }, { abbr: '1–2 Thess', full: '1–2 Thessalonians' },
      { abbr: '1–2 Tim', full: '1–2 Timothy' }, { abbr: 'Titus', full: 'Titus' }, { abbr: 'Phlm', full: 'Philemon' },
      { abbr: 'Heb', full: 'Hebrews' }, { abbr: 'Jas', full: 'James' }, { abbr: '1–2 Pet', full: '1–2 Peter' },
      { abbr: '1–3 John', full: '1–3 John' }, { abbr: 'Jude', full: 'Jude' }, { abbr: 'Rev', full: 'Revelation' },
    ],
  },
  {
    label: 'Septuagint / Apocrypha (LXX)',
    items: [
      { abbr: 'Tob', full: 'Tobit' }, { abbr: 'Jdt', full: 'Judith' }, { abbr: 'Add Esth', full: 'Additions to Esther' },
      { abbr: '1–2 Esd', full: '1–2 Esdras' }, { abbr: '1–4 Macc', full: '1–4 Maccabees' }, { abbr: 'Wis', full: 'Wisdom of Solomon' },
      { abbr: 'Sir', full: 'Sirach / Ecclesiasticus' }, { abbr: 'Bar', full: 'Baruch' }, { abbr: 'Ep Jer', full: 'Epistle of Jeremiah' },
      { abbr: 'Sus', full: 'Susanna' }, { abbr: 'Bel', full: 'Bel and the Dragon' }, { abbr: 'Pr Man', full: 'Prayer of Manasseh' },
      { abbr: 'Ps 151', full: 'Psalm 151' }, { abbr: 'Odes', full: 'Odes (LXX appendix)' }, { abbr: 'Pss. Sol.', full: 'Psalms of Solomon' },
      { abbr: 'LXX', full: 'Septuagint' },
    ],
  },
  {
    label: 'Dead Sea Scrolls',
    items: [
      { abbr: 'CD', full: 'Damascus Document (Cairo Genizah copy)' }, { abbr: '1QS', full: 'Rule of the Community (Serekh ha-Yaḥad)' },
      { abbr: '1QSa', full: 'Rule of the Congregation (appendix to 1QS)' }, { abbr: '1QM', full: 'War Scroll (Milḥamah)' },
      { abbr: '1QpHab', full: 'Pesher Habakkuk' }, { abbr: '1QH', full: 'Thanksgiving Hymns (Hodayot)' },
      { abbr: '1QapGen', full: 'Genesis Apocryphon' }, { abbr: '11QT', full: 'Temple Scroll' },
      { abbr: '11QPs', full: 'Psalms Scroll' }, { abbr: '4Q', full: 'Cave 4 Qumran manuscript (numbered, e.g. 4Q174)' },
      { abbr: '1Q, 2Q…11Q', full: 'Manuscript from Qumran Cave 1, 2, …11' }, { abbr: 'MMT (4QMMT)', full: 'Miqṣat Ma῾aśe ha-Torah' },
      { abbr: 'frg.', full: 'fragment' },
    ],
  },
  {
    label: 'Second Temple / Pseudepigrapha',
    items: [
      { abbr: '1 En.', full: '1 Enoch (Ethiopic Apocalypse)' }, { abbr: '2 En.', full: '2 Enoch (Slavonic Apocalypse)' },
      { abbr: 'Jub.', full: 'Jubilees' }, { abbr: 'T. 12 Patr.', full: 'Testaments of the Twelve Patriarchs' },
      { abbr: 'T. Levi / T. Jud. / etc.', full: 'Testament of Levi / Judah / (each patriarch)' },
      { abbr: 'Let. Aris.', full: 'Letter of Aristeas' }, { abbr: 'Sib. Or.', full: 'Sibylline Oracles' },
      { abbr: 'L.A.B.', full: 'Liber Antiquitatum Biblicarum (Pseudo-Philo)' }, { abbr: '4 Ezra', full: '4 Ezra (2 Esdras 3–14)' },
      { abbr: '2 Bar.', full: '2 Baruch (Syriac Apocalypse)' }, { abbr: '3 Bar.', full: '3 Baruch (Greek Apocalypse)' },
      { abbr: 'Odes Sol.', full: 'Odes of Solomon' }, { abbr: 'Ps.-Philo', full: 'Pseudo-Philo' },
      { abbr: 'Jos. Asen.', full: 'Joseph and Aseneth' },
    ],
  },
  {
    label: 'Christian Apocrypha',
    items: [
      { abbr: 'Gos. Thom.', full: 'Gospel of Thomas' }, { abbr: 'Gos. Pet.', full: 'Gospel of Peter' },
      { abbr: 'Gos. Phil.', full: 'Gospel of Philip' }, { abbr: 'Prot. Jas.', full: 'Protevangelium of James' },
      { abbr: 'Acts Paul', full: 'Acts of Paul' }, { abbr: 'Acts Pet.', full: 'Acts of Peter' },
      { abbr: 'Ep. Apos.', full: 'Epistula Apostolorum' }, { abbr: 'Corp. herm.', full: 'Corpus Hermeticum' },
      { abbr: '1–2 Clem.', full: '1–2 Clement' }, { abbr: 'Barn.', full: 'Epistle of Barnabas' },
      { abbr: 'Herm.', full: 'Shepherd of Hermas' },
    ],
  },
  {
    label: 'Rabbinic Literature',
    items: [
      { abbr: 'm.', full: 'Mishnah (prefix, e.g. m. Sanh.)' }, { abbr: 't.', full: 'Tosefta (prefix)' },
      { abbr: 'b.', full: 'Babylonian Talmud (prefix)' }, { abbr: 'y.', full: 'Jerusalem/Palestinian Talmud (prefix)' },
      { abbr: 'Mek.', full: 'Mekilta (de Rabbi Ishmael)' }, { abbr: 'Sifra', full: 'Sifra (on Leviticus)' },
      { abbr: 'Sifre', full: 'Sifre (on Numbers/Deuteronomy)' }, { abbr: 'Gen. Rab. / Exod. Rab. / etc.', full: 'Genesis Rabbah / Exodus Rabbah / (Midrash Rabbah on each book)' },
      { abbr: 'Tg. Onq.', full: 'Targum Onqelos' }, { abbr: 'Tg. Neof.', full: 'Targum Neofiti' },
      { abbr: 'Tg. Ps.-J.', full: 'Targum Pseudo-Jonathan' }, { abbr: 'Frg. Tg.', full: 'Fragmentary Targum(s)' },
      { abbr: 'Tg. Isa. / Tg. Onq. Gen. / etc.', full: 'Targum on the named book' },
    ],
  },
  {
    label: 'Greco-Roman Literature',
    items: [
      { abbr: 'Ant.', full: 'Josephus, Jewish Antiquities' }, { abbr: 'J.W.', full: 'Josephus, Jewish War' },
      { abbr: 'Ag. Ap.', full: 'Josephus, Against Apion' }, { abbr: 'Life', full: 'Josephus, The Life' },
      { abbr: 'Opif.', full: 'Philo, On the Creation (De Opificio Mundi)' }, { abbr: 'Leg.', full: 'Philo, Allegorical Interpretation (Legum Allegoriae)' },
      { abbr: 'QG', full: 'Philo, Questions and Answers on Genesis' }, { abbr: 'QE', full: 'Philo, Questions and Answers on Exodus' },
      { abbr: 'Plato, Tim.', full: 'Plato, Timaeus' }, { abbr: 'Aristotle, Metaph.', full: 'Aristotle, Metaphysics' },
      { abbr: 'Plut.', full: 'Plutarch (works cited by title)' }, { abbr: 'Cicero, Nat. d.', full: 'Cicero, De Natura Deorum' },
      { abbr: 'Seneca, Ep.', full: 'Seneca, Epistulae Morales' }, { abbr: 'Iamblichus, Myst.', full: 'Iamblichus, On the Mysteries' },
      { abbr: 'Anaxagoras, frg.', full: 'Anaxagoras of Clazomenae, fragment (per Diels–Kranz numbering)' },
    ],
  },
  {
    label: 'Copyright & editions used in this app',
    items: [
      { abbr: 'PD', full: 'Public domain — no copyright restrictions' },
      { abbr: 'CC BY 4.0', full: 'Creative Commons Attribution 4.0 International' },
      { abbr: 'CC BY-SA 3.0 / 4.0', full: 'Creative Commons Attribution-ShareAlike 3.0 / 4.0' },
      { abbr: 'CC BY-SA 3.0 US', full: 'Creative Commons Attribution-ShareAlike 3.0 United States (Perseus Digital Library texts)' },
      { abbr: 'NA1904', full: 'Nestle 1904 Greek New Testament (public domain)' },
      { abbr: 'Rahlfs 1935', full: 'Rahlfs’ Septuaginta, 1935 edition (public domain)' },
      { abbr: 'Brenton', full: 'Brenton’s 1851 English translation of the Septuagint (public domain)' },
      { abbr: 'BSB', full: 'Berean Standard Bible (public domain)' },
      { abbr: 'WEB', full: 'World English Bible (public domain)' },
      { abbr: 'KJV', full: 'King James Version (public domain)' },
      { abbr: 'Whiston', full: 'William Whiston’s 1737 translation of Josephus (public domain)' },
    ],
  },
]
