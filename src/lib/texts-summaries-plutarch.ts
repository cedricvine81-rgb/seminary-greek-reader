// Summaries for the Plutarch corpus, merged into TEXT_SUMMARIES by texts-summaries.ts.
//
// Kept in its own module because Plutarch alone is 148 catalog works — the Parallel Lives with
// their synkriseis, the Moralia, and the nine books of the Table Talk — which would otherwise
// more than double the length of texts-summaries.ts.
//
// Same caveat as the authored entries there: these are AI-drafted at an introductory level,
// reflecting mainstream scholarship but NOT verified against specific peer-reviewed sources.
// They are served with `aiDrafted: true`, so the popover shows its caveat. Corrections welcome.
//
// The Lives share their first two sections — the same biographer, and the same paired-Lives
// design — so PL() supplies those from the pairing alone and each entry says only what is
// particular to it. Same idea for PM() across the Moralia.
import type { TextSummarySection } from './texts-summaries'

interface AuthoredSummary { sections: TextSummarySection[] }

const PLUTARCH_AUTHOR =
  'By Plutarch of Chaeronea (c. 46 – c. 120 CE), biographer, moral essayist, Platonist, and for the last decades of his life a priest at Delphi.'

function S5(authorship: string, context: string, contents: string, significance: string, nt: string): AuthoredSummary {
  return {
    sections: [
      { heading: 'Authorship', body: authorship },
      { heading: 'Historical Context', body: context },
      { heading: 'Contents', body: contents },
      { heading: 'Theological Significance', body: significance },
      { heading: 'Relationship to New Testament', body: nt },
    ],
  }
}

/** A Life: `pairing` completes the sentence "One of the Parallel Lives, …". */
function PL(pairing: string, contents: string, significance: string, nt: string): AuthoredSummary {
  return S5(PLUTARCH_AUTHOR, `One of the Parallel Lives, ${pairing}.`, contents, significance, nt)
}

/** A synkrisis — the short formal comparison Plutarch appends to most pairs. */
function PC(pair: string, contents: string): AuthoredSummary {
  return S5(
    PLUTARCH_AUTHOR,
    `The synkrisis, or formal comparison, that closes the paired Lives of ${pair}. Plutarch appends one to most of his pairs; a few, including Alexander–Caesar and Phocion–Cato, have none or have lost it.`,
    contents,
    'The comparisons are where Plutarch states his moral verdicts most openly, weighing the two men against each other rather than simply narrating. They show the criteria — self-control, use of power, conduct toward friends and enemies — by which he judges a life.',
    'The synkrisis is a set rhetorical exercise (see Theon’s Progymnasmata, also in this library), and the technique of praising one figure by measured comparison with another lies behind such New Testament passages as the comparison of Christ with Moses and with the angels in Hebrews.',
  )
}

/** A Moralia essay: `context` is the occasion, since these vary work by work. */
function PM(context: string, contents: string, significance: string, nt: string): AuthoredSummary {
  return S5(PLUTARCH_AUTHOR, context, contents, significance, nt)
}

const GREEK_ROMAN_PAIR =
  'Plutarch’s design sets a Greek and a Roman side by side so that each is measured against the other'

export const PLUTARCH_SUMMARIES: Record<string, AuthoredSummary> = {
  // ── The Parallel Lives ───────────────────────────────────────────────────────────────
  'plutarch-theseus': PL(
    'paired with Romulus as the two founder-heroes, both of doubtful birth and both standing where legend passes into history',
    'The legendary founder of Athens: his journey from Troezen clearing the road of brigands, the killing of the Minotaur and abandonment of Ariadne, the unification of Attica, the war with the Amazons, and his fall from power and death on Scyros.',
    'Plutarch opens by admitting he is entering territory where fable has not yet given way to fact, and asks the reader’s indulgence — an unusually explicit statement of a historian’s difficulty with legendary material.',
    'The preface is a standard reference point in discussions of how ancient writers signalled the difference between reliable and legendary tradition, a question regularly raised about the Gospels’ infancy narratives.',
  ),
  'plutarch-romulus': PL(
    'paired with Theseus, founder against founder',
    'The founding of Rome: the exposure of the twins and their nursing by the she-wolf, the quarrel in which Remus dies, the rape of the Sabine women and the settlement that followed, Romulus’ reign, and his disappearance in a storm.',
    'Plutarch reports, without endorsing, the tradition that Romulus was carried up to the gods and afterwards appeared to a witness who testified to it — and he records the sceptics who thought the senate had murdered him.',
    'The disappearance-and-appearance of Romulus, with its named witness, is the most-discussed pagan parallel to the resurrection and ascension traditions, and Plutarch’s handling of it — reporting the story alongside the accusation of a cover-up — is itself part of the comparison.',
  ),
  'plutarch-lycurgus': PL(
    'paired with Numa, the two lawgivers who shaped a people’s whole way of life',
    'The Spartan lawgiver: the land redistribution, the iron currency, the common messes, the rearing and education of the young, the treatment of women and of the helots, and his self-imposed death to bind Sparta to his laws for ever.',
    'Lycurgus is presented as legislating not merely for conduct but for character, on the conviction that a society is formed by its habits of eating, marrying and educating rather than by its statutes.',
    'The fullest ancient account of Spartan discipline, and the classic source for the ancient ideal of a community whose common life is legislated in detail — a comparison often drawn with the community rules of Qumran and with Acts’ picture of goods held in common.',
  ),
  'plutarch-numa': PL(
    'paired with Lycurgus as the lawgiver who formed Rome’s religion as Lycurgus formed Sparta’s discipline',
    'The Sabine successor of Romulus: his reluctant acceptance of the kingship, his reported converse with the nymph Egeria, the institution of the priesthoods, the calendar and the rites, and a reign remembered as unbroken peace.',
    'Numa civilises Rome by religion rather than arms, and Plutarch treats the claim of divine instruction with characteristic care — allowing that a lawgiver may need such a claim to make a rough people receive his laws.',
    'The primary ancient account of the origins of Roman public religion, and so of the sacrificial and priestly world in which the early Christians refused to participate.',
  ),
  'plutarch-solon': PL(
    'paired with Publicola, the two who framed constitutions for a free people',
    'The Athenian lawgiver and poet: the cancellation of debts and liberation of those enslaved for them, the census classes and the reform of the courts, his refusal of tyranny, his travels, and his meeting with Croesus.',
    'Solon’s answer to Croesus — that no one should be called happy before his end — is Plutarch’s clearest statement of the instability of prosperity and the folly of judging a life while it is still being lived.',
    'The debt-release stands behind ancient discussion of the jubilee and of release from debt, and the maxim on judging a life only at its end is a commonplace of the moral literature the New Testament writers shared.',
  ),
  'plutarch-publicola': PL(
    'paired with Solon as the founder of the Roman republic’s liberties',
    'Valerius Publicola, one of the first consuls: his part in expelling the Tarquins, the laws granting appeal to the people, his lowering of the fasces before the assembly, the defence of Rome against Porsena, and his death in poverty.',
    'Publicola’s deliberate self-limiting — lowering his own insignia before the people, pulling down a house that looked too lordly — makes him Plutarch’s model of power that restrains itself.',
    'A study in the voluntary renunciation of status by a man who had it, which is the shape of the argument in Philippians 2 and of Jesus’ teaching that greatness is shown in service.',
  ),
  'plutarch-themistocles': PL(
    'paired with Camillus, each the saviour of his city and each repaid with exile',
    'The architect of Athenian sea power: the building of the fleet, the stratagem that forced the battle of Salamis and broke the Persian invasion, his later ostracism, and his flight to end his days as a pensioner of the Persian king.',
    'Plutarch is fascinated by a cleverness that saves a state and then cannot be lived with, and by the ingratitude of democracies toward the men who rescue them.',
    'The Persian wars he decided created the Greek world of the New Testament, and his career is a standing ancient example of the prophet or benefactor rejected by his own people.',
  ),
  'plutarch-camillus': PL(
    'paired with Themistocles, both saviours of their cities and both driven out',
    'Marcus Furius Camillus, called Rome’s second founder: the capture of Veii, his exile on a charge over the spoils, his recall after the Gauls sacked Rome, and his defeat of them and refusal to let the city be abandoned.',
    'Camillus returns to serve the city that condemned him, and Plutarch presents the restraint of his anger as the greater victory.',
    'A study of a man wronged by his own community who then saves it — the pattern the New Testament applies to Joseph, to Moses, and above all to Christ rejected by his own.',
  ),
  'plutarch-pericles': PL(
    'paired with Fabius Maximus, two leaders whose strength was patience under criticism',
    'The leading Athenian of the fifth century: his political rise, the building of the Parthenon and the Acropolis programme, his oratory and his self-command, the coming of the Peloponnesian War, and his death in the plague.',
    'Plutarch praises above all Pericles’ mildness and freedom from anger under provocation, and treats his refusal to be hurried by popular pressure as the mark of a mind governed by reason.',
    'Indispensable background to the Athens of Acts 17, and a portrait of the public speaker whose authority rests on character — the standard against which ancient readers measured a persuasive figure.',
  ),
  'plutarch-fabius-maximus': PL(
    'paired with Pericles for the same steady patience under attack',
    'Fabius Maximus Cunctator, "the Delayer": his dictatorship after Rome’s disasters against Hannibal, the strategy of refusing battle and shadowing the enemy, the contempt this earned him, and his vindication at Cannae.',
    'Fabius endures the charge of cowardice rather than risk the state, and Plutarch makes his willingness to be misunderstood the centre of the portrait.',
    'The classic ancient study of a leader who accepts public shame for the sake of those he leads, and of the difference between courage and rashness.',
  ),
  'plutarch-alcibiades': PL(
    'paired with Coriolanus, two brilliant men who turned their gifts against their own cities',
    'The gifted and unstable Athenian: his education near Socrates, the mutilation of the Herms and his recall from the Sicilian expedition, his desertion to Sparta and then to Persia, his return in triumph, and his final fall and murder.',
    'Alcibiades is Plutarch’s great study of talent without stable character — a man who could take the colour of any company he was in, and whose charm was itself the danger.',
    'The standing ancient example of gifts divorced from character, the concern behind the New Testament’s insistence that leaders be tested and of proven conduct rather than merely able.',
  ),
  'plutarch-coriolanus': PL(
    'paired with Alcibiades as the Roman who made war on his own people',
    'Caius Marcius Coriolanus: his valour in the field, his contempt for the plebeians and consequent banishment, his alliance with Rome’s enemies the Volscians, his march on the city, and his turning back at the pleading of his mother.',
    'Plutarch traces the ruin to an ungoverned temper never disciplined in youth, and makes the point that valour without affability is unusable in a city.',
    'A study of anger as the destroyer of a great man, and of intercession — a mother’s appeal turning away a destroyer from a city — which is the shape of the intercession narratives from Abraham and Moses onward.',
  ),
  'plutarch-timoleon': PL(
    'paired with Aemilius Paulus as men whose careers ran with unusual good fortune',
    'The Corinthian who freed Syracuse: his consent to his own brother’s death for attempting tyranny, his expedition to Sicily, the defeat of the Carthaginians at the Crimisus, the expulsion of the tyrants, and his honoured retirement and blindness.',
    'Timoleon’s career raises Plutarch’s recurring question about the part fortune plays beside virtue; he presents a man whose designs succeeded so smoothly that his contemporaries credited divine favour.',
    'A sustained ancient reflection on providence and success — whether a life that prospers does so by character, by luck, or by the gods’ backing.',
  ),
  'plutarch-aemilius-paulus': PL(
    'paired with Timoleon, both fortunate in their public careers and tried in their private ones',
    'Lucius Aemilius Paulus, conqueror of Macedonia: his career and censorship, the campaign that ended at Pydna and finished the Macedonian kingdom, his treatment of the captive Perseus, his triumph, and the death of his two sons in the days around it.',
    'The triumph and the funerals together are Plutarch’s sharpest picture of the mixture of fortunes in a single life, and of the composure with which a man ought to meet them.',
    'The overthrow of Macedon reshaped the Hellenistic world; the account of Paulus bearing public triumph and private bereavement together is one of antiquity’s most quoted studies of endurance. Perseus’ text of this Life begins at chapter 2.',
  ),
  'plutarch-pelopidas': PL(
    'paired with Marcellus, two commanders who died through their own boldness',
    'The Theban liberator: the conspiracy that freed Thebes from its Spartan garrison, the Sacred Band and the victory at Leuctra with Epaminondas, his embassy to Persia, his imprisonment by Alexander of Pherae, and his death at Cynoscephalae.',
    'Plutarch admires the friendship of Pelopidas and Epaminondas as a partnership without rivalry, and blames the recklessness in battle that a general owes it to his men to restrain.',
    'The best ancient account of the friendship of two leaders in shared work, and a sustained argument that a leader’s life belongs to those who depend on him.',
  ),
  'plutarch-marcellus': PL(
    'paired with Pelopidas for the same courage and the same fatal rashness',
    'Marcus Claudius Marcellus, "the sword of Rome": his single combat and winning of the spolia opima, his campaigns against Hannibal, the long siege of Syracuse against the engines of Archimedes, and his death in an ambush.',
    'The capture of Syracuse, with Marcellus weeping over the city and the killing of Archimedes against his orders, is Plutarch’s study of a humane man carried by war beyond what he intended.',
    'The fullest ancient narrative of the siege of Syracuse and the death of Archimedes, and a reflection on the plundering of a conquered city’s sacred things.',
  ),
  'plutarch-aristides': PL(
    'paired with Cato the Elder, two men of famous integrity and very different tempers',
    'Aristides "the Just": his rivalry with Themistocles, his ostracism and the story of the citizen who asked him to write his own name on the sherd, his part at Salamis and Plataea, his assessment of the tribute for the Delian League, and his death in poverty.',
    'Plutarch presents justice as the virtue that most resembles the divine, because it does good without needing anything; Aristides is his standing example of public office held without private gain.',
    'The ancient world’s model of the incorruptible official, and a reference point for the New Testament’s requirement that overseers be free from the love of money.',
  ),
  'plutarch-cato-the-elder': PL(
    'paired with Aristides, both bywords for probity',
    'Marcus Porcius Cato the Censor: his rise as a new man, his farming and frugality, his severity as censor, his prosecutions and his hostility to Greek refinement, and his insistence that Carthage be destroyed.',
    'Plutarch admires the self-discipline but is openly uneasy at the hardness — noting Cato’s selling off of worn-out slaves as beneath a decent man, since kindness should extend further than usefulness.',
    'A study of rigour without mercy, and Plutarch’s explicit argument that goodness must extend past what is owed — the direction in which the New Testament’s teaching on mercy runs.',
  ),
  'plutarch-philopoemen': PL(
    'paired with Titus Flamininus, the Greek and the Roman who each claimed to have freed Greece',
    'Philopoemen of Megalopolis, called "the last of the Greeks": his reform of Achaean arms and tactics, his victories over Sparta, his long leadership of the Achaean League, and his capture and death by poison.',
    'Plutarch honours a man who worked for Greek self-government as it was slipping away, and is candid about the ambition mixed into the patriotism.',
    'The setting for the Achaean League’s absorption by Rome, the last stage of the process that made the Greece of Acts a Roman province.',
  ),
  'plutarch-flamininus': PL(
    'paired with Philopoemen, the two liberators of Greece',
    'Titus Quinctius Flamininus: his victory over Philip V at Cynoscephalae, the proclamation at the Isthmian games declaring the Greeks free, his settlement of Greece, and his later pursuit of Hannibal to his death.',
    'The proclamation of freedom and the crowd’s reaction is Plutarch’s set-piece on the word "liberty" in the mouth of a conqueror, and on how much such a declaration was worth.',
    'The classic ancient scene of a public herald proclaiming freedom to an assembled crowd, and a case study in what "freedom" meant when granted by an imperial power.',
  ),
  'plutarch-pyrrhus': PL(
    'paired with Caius Marius, two great soldiers who could not stop making war',
    'Pyrrhus of Epirus: his adventurous rise, his campaigns in Italy and Sicily against Rome and Carthage, the victories so costly they gave us the phrase "Pyrrhic", his wars in Macedonia and the Peloponnese, and his death in a street fight at Argos.',
    'Plutarch’s Pyrrhus can win anything and keep nothing; the Life is a study of restlessness, of a man who could not be content with what he had gained.',
    'The ancient portrait of ambition that consumes its own achievements, and the source of the proverbial victory that ruins the victor.',
  ),
  'plutarch-marius': PL(
    'paired with Pyrrhus for the same soldiering gifts and the same inability to rest',
    'Caius Marius: his rise as a new man, the reform of the Roman army, the defeat of Jugurtha and of the Cimbri and Teutones, his seven consulships, the struggle with Sulla, his flight and return, and the massacres of his last days.',
    'Plutarch shows a great career destroyed by the appetite for more of the same honour, and by an old age unable to give up what it had held.',
    'Essential background to the collapse of the Roman republic, and one of antiquity’s starkest studies of ambition outliving the capacity that earned it.',
  ),
  'plutarch-lysander': PL(
    'paired with Sulla, two victors who used their victories badly',
    'The Spartan admiral who won the Peloponnesian War: the destruction of the Athenian fleet at Aegospotami, the taking of Athens and the installing of the Thirty, the flood of wealth into Sparta, his intrigues over the kingship, and his death in battle.',
    'Plutarch judges that Lysander’s victory ruined Sparta by bringing in the money and the empire Lycurgus had excluded — success as the corrupter of the state that achieves it.',
    'The end of the Peloponnesian War and the beginning of Sparta’s decline; a case study in wealth entering a community that was built to do without it.',
  ),
  'plutarch-sulla': PL(
    'paired with Lysander, both conquerors of their own countrymen',
    'Lucius Cornelius Sulla: his war against Mithridates and sack of Athens, his march on Rome, the proscriptions in which his enemies were listed and killed for reward, his dictatorship and constitutional settlement, and his voluntary retirement and death.',
    'Sulla’s claim to be the favourite of Fortune runs through the Life, and Plutarch sets it against the cruelty of the proscriptions to ask what such "luck" is worth.',
    'The proscriptions are antiquity’s clearest picture of state terror by published list; the sack of Athens is background to the city Paul later visited.',
  ),
  'plutarch-cimon': PL(
    'paired with Lucullus, two commanders famous for open-handed generosity',
    'Cimon son of Miltiades: his early disrepute and reform, his victories over the Persians culminating at the Eurymedon, his generosity with his estates, his pro-Spartan policy and ostracism, and his death on campaign at Cyprus.',
    'Cimon’s throwing open his fields and vineyards to any citizen who needed them is Plutarch’s model of wealth used as though it were common property.',
    'A pagan portrait of voluntary open-handedness with private property, regularly set beside the sharing of goods described in Acts.',
  ),
  'plutarch-lucullus': PL(
    'paired with Cimon for generosity, and contrasted for what each did with his leisure',
    'Lucius Licinius Lucullus: his brilliant campaigns against Mithridates and Tigranes, his reform of the ruinous debts of the province of Asia, the mutiny that ended his command, and the famous luxury of his retirement.',
    'Plutarch treats the retirement as the harder test: a man who had governed himself in the field gave himself to expense and display when there was nothing left to conquer.',
    'His relief of the debts of Asia is valuable evidence for provincial indebtedness in the region of the churches of Revelation, and his later life a study in what prosperity does to a man with nothing to do.',
  ),
  'plutarch-nicias': PL(
    'paired with Crassus, two men whose caution and greed respectively destroyed great armies',
    'Nicias the Athenian: his wealth and scrupulous piety, the peace that bears his name, his reluctant command of the Sicilian expedition, the delay after the eclipse of the moon, and the annihilation of the Athenian force and his own execution.',
    'The eclipse is the pivot: a devout man’s reading of an omen destroys an army, and Plutarch weighs superstition against religion as carefully here as anywhere in his works.',
    'The central ancient case study of superstition — deisidaimonia — with fatal consequences, to be read beside Plutarch’s own essay On Superstition and Paul’s use of the same word-group at Athens in Acts 17.',
  ),
  'plutarch-crassus': PL(
    'paired with Nicias, both leaders of armies destroyed far from home',
    'Marcus Licinius Crassus: the fortune built on fires and proscriptions, his suppression of the revolt of Spartacus, his membership of the first triumvirate, and the invasion of Parthia that ended in the disaster at Carrhae and his death.',
    'Plutarch makes avarice the engine of the whole life, and Carrhae its verdict — a man who had everything destroyed by wanting a glory he had not earned.',
    'The fullest ancient account of the Spartacus revolt and of Carrhae, and antiquity’s standing example of the love of money as the root of ruin.',
  ),
  'plutarch-eumenes': PL(
    'paired with Sertorius, two able commanders leading forces that were never really theirs',
    'Eumenes of Cardia, secretary to Alexander and then a general in the wars of the successors: his loyalty to the royal house, his victories against Antigonus, and his betrayal by his own Silver Shields, who traded him for their baggage.',
    'Plutarch is drawn to a Greek outsider commanding Macedonian troops who despised him, and to a betrayal for the sake of possessions.',
    'The wars of the successors created the Hellenistic kingdoms of Daniel and the Maccabees, and the story of the men who sold their general for their baggage is an ancient parable of possessions overriding loyalty.',
  ),
  'plutarch-sertorius': PL(
    'paired with Eumenes, both exiles commanding foreign armies',
    'Quintus Sertorius: his career in Spain in opposition to Sulla’s Rome, the state he built among the Lusitanians, the white fawn he presented as a token of divine counsel, his long resistance to Pompey, and his murder at a banquet by his own officers.',
    'The tame fawn is Plutarch’s clearest example of a leader using a claim of divine communication to hold the loyalty of a people — reported plainly, with its purpose explained.',
    'A candid ancient account of religious claims put to political use, useful in discussion of how such claims were heard and assessed in the Greco-Roman world.',
  ),
  'plutarch-agesilaus': PL(
    'paired with Pompey, two men who held enormous authority and lost it',
    'Agesilaus, king of Sparta: his lameness and disputed accession, his Asian campaign against Persia and recall to defend Sparta, the defeat at Leuctra and the invasion of Laconia, and his last service as a mercenary in Egypt.',
    'Plutarch admires the simplicity and obedience to law of a king who lived like a private citizen, while judging that his partisanship for friends damaged Sparta.',
    'A portrait of authority exercised without display, and a study of the tension between personal loyalty to friends and the duty of an office.',
  ),
  'plutarch-pompey': PL(
    'paired with Agesilaus, both at the summit of power and both brought down',
    'Pompey the Great: his early victories and triumphs, the clearing of the pirates from the Mediterranean, the eastern settlement that reorganised Syria and Judaea, the alliance and then the war with Caesar, the defeat at Pharsalus, and his murder on the shore of Egypt.',
    'Plutarch’s Pompey is a man whose reputation outran his judgement; the Life closes with the greatest Roman of his day killed by a subordinate in a small boat.',
    'His eastern settlement, including the capture of Jerusalem and entry into the temple in 63 BCE, created the Roman Judaea of the Gospels — indispensable background to the New Testament’s political world.',
  ),
  'plutarch-alexander': PL(
    'paired with Julius Caesar, the two men whose careers most changed the world they were born into',
    'Alexander the Great from his birth and education under Aristotle, through the conquest of the Persian empire and the march to India, to his death at Babylon in 323 BCE.',
    'Plutarch opens by saying he writes lives and not histories, and that a small saying or a jest often reveals character better than a battle with thousands dead — the clearest ancient statement of biographical method.',
    'Alexander’s conquests created the Hellenistic world in which the New Testament was written and its Greek was spoken; the methodological preface is regularly compared with the Gospel writers’ selection of incident.',
  ),
  'plutarch-caesar': PL(
    'paired with Alexander; unusually, no comparison between the two survives',
    'Julius Caesar: his early defiance of Sulla, his rise through the offices, the conquest of Gaul, the crossing of the Rubicon and the civil war, the dictatorship, and the conspiracy and assassination on the Ides of March.',
    'Plutarch traces the assassination’s consequences to show that Caesar’s daemon or guardian power pursued the killers, ending in the vengeance of Philippi — his most explicit narrative of divine retribution in the Lives.',
    'The making of the Roman imperial system under which Jesus was tried and Paul appealed to Caesar, and an extended ancient treatment of divine justice working itself out in political events.',
  ),
  'plutarch-phocion': PL(
    'paired with Cato the Younger, two upright men serving states going under',
    'Phocion the Athenian: his blunt opposition to the popular orators, his repeated election as general, his counsel of accommodation with Macedon, and his condemnation and execution by the very city that had elected him forty-five times.',
    'Plutarch presents a man who told his city the truth it did not want and was killed for it, and who forgave in the act of dying.',
    'The classic ancient portrait of the honest counsellor destroyed by the crowd he served — a pattern the New Testament applies to the prophets and to Jesus himself.',
  ),
  'plutarch-cato-the-younger': PL(
    'paired with Phocion, both incorruptible and both defeated',
    'Marcus Porcius Cato Uticensis: his Stoic austerity from youth, his opposition to Caesar and to Pompey alike, his mission to Cyprus, his part in the civil war, and his suicide at Utica after reading Plato’s Phaedo.',
    'Cato’s death is antiquity’s most famous philosophical suicide, and Plutarch narrates it as the considered act of a man who would not accept a pardon that implied a master.',
    'The Stoic ideal of the free man who cannot be coerced, and the ancient debate over voluntary death, both of which frame New Testament discussion of martyrdom and of the freedom of the servant of Christ.',
  ),
  'plutarch-agis': PL(
    'the first of the four reforming Lives paired as Agis and Cleomenes against the two Gracchi; Perseus keeps Agis and Cleomenes in one document, and this is its first book',
    'Agis IV of Sparta: his attempt to restore the discipline and land distribution of Lycurgus, the cancellation of debts, the resistance of the wealthy and of his colleague Leonidas, and his betrayal, trial and strangling with his mother and grandmother.',
    'Plutarch tells of a young king who gave up his own estates first and was destroyed by those who would not follow, and treats the reform as genuine and its defeat as the fault of greed.',
    'An ancient narrative of debt cancellation and land redistribution attempted on religious and traditional grounds, and of a reformer killed by the propertied interest.',
  ),
  'plutarch-cleomenes': PL(
    'the second book of the paired Agis and Cleomenes, set against the Gracchi',
    'Cleomenes III of Sparta: his revival of the reform by force, the killing of the ephors, the redistribution of land and restoration of the old training, his war with the Achaean League, defeat at Sellasia, exile in Egypt, and death in a failed rising at Alexandria.',
    'Plutarch weighs a good end pursued by violent means, and gives Cleomenes an admiration he withholds from the methods.',
    'A study in whether a just reform may be imposed by force, and a vivid picture of Ptolemaic Alexandria, the city of the Septuagint and of Philo.',
  ),
  'plutarch-tiberius-gracchus': PL(
    'the Roman half of the reforming quartet, answering Agis; Perseus keeps the two Gracchi in one document, and this is its first book',
    'Tiberius Sempronius Gracchus: the land law to resettle the dispossessed on the public land, the deposition of his fellow tribune Octavius, the charge that he sought a crown, and his killing with hundreds of his followers on the Capitol.',
    'Plutarch reports Tiberius’ appeal that the beasts of Italy had holes and the men who fought for her had nothing — and treats the reform as just and its suppression as the republic’s first political murder.',
    'The saying about the beasts having lairs while men who fight for Italy have nowhere to lay their heads is regularly compared with Jesus’ words on the foxes’ holes and the Son of Man having nowhere to lay his head.',
  ),
  'plutarch-caius-gracchus': PL(
    'the second book of the paired Gracchi, answering Cleomenes',
    'Caius Sempronius Gracchus: his tribunates, the corn law and the road-building, the extension of the reform programme and of the citizenship, his loss of popular support, and his death by a servant’s hand as the mob closed in.',
    'Plutarch admires the eloquence and the concern for the poor, and marks the point where reform hardened into faction.',
    'The origin of the grain distribution that fed the Roman poor, and background to the New Testament world’s assumptions about patronage and the feeding of the urban population.',
  ),
  'plutarch-demosthenes': PL(
    'paired with Cicero, the greatest orator of each language',
    'Demosthenes of Athens: his overcoming of a speech impediment by relentless training, the Philippics urging resistance to Macedon, the defeat at Chaeronea, the affair of Harpalus and his exile, and his suicide by poison in the temple of Poseidon.',
    'Plutarch makes the labour behind the eloquence the point — a natural weakness conquered by discipline — and notes that Demosthenes could not always live up to the courage he urged on others.',
    'The ancient standard of persuasive speech, against which the New Testament’s claim to preach without rhetorical display in 1 Corinthians is measured.',
  ),
  'plutarch-cicero': PL(
    'paired with Demosthenes, orator against orator',
    'Marcus Tullius Cicero: his rise as a new man on the strength of his speaking, the consulship and the suppression of Catiline, his exile and recall, his wit and his vanity, his last stand against Antony in the Philippics, and his death in the proscriptions.',
    'Plutarch admires the eloquence and the consulship but is frank about the boasting, and finds the courage of the end greater than that of the middle years.',
    'The fullest ancient life of the man whose letters and speeches are our best evidence for late republican Rome, and a study of gifts of speech accompanied by an appetite for praise.',
  ),
  'plutarch-demetrius': PL(
    'paired with Mark Antony; Plutarch says openly that this pair is offered as a warning rather than a model',
    'Demetrius Poliorcetes, "the Besieger": his victories and reverses in the wars of Alexander’s successors, the liberation and then the occupation of Athens where he was received with divine honours, his brief kingship of Macedon, and his captivity and death in drink.',
    'In the preface Plutarch defends including bad examples, on the ground that we learn what to avoid by seeing it; Demetrius is great gifts spent on appetite.',
    'The reception of Demetrius at Athens with hymns addressing him as a present god is among the best evidence for ruler-cult language, the background to the imperial titles the New Testament reserves for Christ.',
  ),
  'plutarch-antony': PL(
    'paired with Demetrius as the second of the two Lives Plutarch offers as warnings',
    'Mark Antony: his rise after Caesar’s assassination, the triumvirate and the proscriptions, his rule in the East, the relationship with Cleopatra, the defeat at Actium, and the deaths of them both in Alexandria.',
    'A moral study of a capable and generous man undone by appetite and infatuation, in which Plutarch is careful to record the loyalty Antony inspired as well as the ruin he caused.',
    'It documents the Roman East a generation before Paul — Ephesus, Tarsus, the client kingdoms — and illustrates the moral biography that shaped Greco-Roman expectations of how a life should be told.',
  ),
  'plutarch-dion': PL(
    'paired with Brutus, two Platonists who took up arms against tyranny',
    'Dion of Syracuse: his friendship with Plato and attempt to educate the tyrant Dionysius, his exile, his return and liberation of Syracuse, his difficulties in governing what he had freed, and his assassination by Callippus.',
    'Plutarch is interested in a philosopher trying to make a state good and finding the practice harder than the theory.',
    'The classic ancient test of whether philosophy can reform political power, and a study of the tyrannicide’s dilemma.',
  ),
  'plutarch-brutus': PL(
    'paired with Dion, the Roman philosopher who killed a tyrant',
    'Marcus Junius Brutus: his character and studies, his part in the conspiracy against Caesar, the struggle with Antony and Octavian, the appearance of his evil genius before Philippi, and his defeat and suicide.',
    'Plutarch presents a genuinely good man doing a terrible thing from principle, and treats the apparition before Philippi as a real visitation.',
    'The most sympathetic ancient portrait of a conscientious political assassin, and a narrative in which supernatural warning and moral consequence are openly linked.',
  ),
  'plutarch-aratus': PL(
    'not part of the Greek–Roman pairs but addressed to a descendant of its subject, and transmitted with the Lives',
    'Aratus of Sicyon: his liberation of his native city, his long leadership of the Achaean League, the night capture of the Acrocorinth, his wars with Sparta and with Macedon, and his death, reportedly by slow poison from Philip V.',
    'Plutarch, writing for the man’s descendant, is unusually direct about both the courage and the failures of nerve in the field.',
    'The essential narrative of the Achaean League, the last serious attempt at Greek federal independence before Rome.',
  ),
  'plutarch-artaxerxes': PL(
    'not one of the paired Lives; a Persian subject standing on its own',
    'Artaxerxes II of Persia: the revolt of his brother Cyrus the Younger and the battle of Cunaxa, the intrigues of the court, the influence of the queen mother Parysatis, and the cruelties of the royal household.',
    'Plutarch dwells on the mildness of the king set against the savagery around him, and on the corrosive effect of a court where everything is settled by influence.',
    'The best-known ancient portrait of the Persian court after Xenophon, useful background to the court settings of Esther, Daniel and Nehemiah.',
  ),
  'plutarch-galba': PL(
    'one of two surviving Lives of Roman emperors, from a separate series and not part of the parallel scheme',
    'Servius Sulpicius Galba: his elevation by the armies after Nero’s fall, his severity and parsimony toward the soldiers who had raised him, his adoption of Piso, and his murder in the Forum by Otho’s men after a reign of some seven months.',
    'Plutarch draws the moral that an emperor made by the army is at the army’s mercy, and that a good man may still be a bad ruler.',
    'A first-hand-quality account of the year of four emperors (69 CE), the political convulsion within a decade of the fall of Jerusalem and the setting of much late New Testament writing.',
  ),
  'plutarch-otho': PL(
    'the companion to Galba, from the same series of imperial Lives',
    'Marcus Salvius Otho: his seizure of power after Galba’s murder, his brief reign, the war against Vitellius, the defeat at Bedriacum, and his suicide to spare further civil bloodshed.',
    'Plutarch is struck that a man of notoriously loose life died better than he had lived, sparing his soldiers a further war he might have continued.',
    'Continues the narrative of the year of four emperors, and offers an ancient reflection on a whole life redeemed, in the estimate of onlookers, by its final act.',
  ),

  // ── The comparisons (synkriseis) ─────────────────────────────────────────────────────
  'plutarch-comp-theseus-romulus': PC('Theseus and Romulus',
    'Plutarch weighs the two founders: the advantages each began with, their treatment of women, their conduct toward kinsmen, and whether founding a city from strength or from weakness is the greater achievement.'),
  'plutarch-comp-lycurgus-numa': PC('Lycurgus and Numa',
    'A comparison of two lawgivers — one forming a people by discipline and the other by religion — and of which settlement proved the more durable and the more humane.'),
  'plutarch-comp-solon-publicola': PC('Solon and Publicola',
    'Plutarch compares the Athenian and Roman constitutional reformers on their laws, their handling of debt and property, and the good fortune Publicola had in seeing his work take hold.'),
  'plutarch-comp-pericles-fabius': PC('Pericles and Fabius Maximus',
    'The two are compared on the difficulty of the circumstances each faced, their patience under public criticism, and their use of delay as a deliberate strategy.'),
  'plutarch-comp-alcibiades-coriolanus': PC('Alcibiades and Coriolanus',
    'A comparison of two men who bore arms against their own cities, weighing charm against austerity, and asking which betrayal was the less pardonable and which man was the more governable.'),
  'plutarch-comp-timoleon-aemilius': PC('Timoleon and Aemilius Paulus',
    'Plutarch compares the two on the part fortune played in their successes, and on how each bore private grief alongside public honour.'),
  'plutarch-comp-pelopidas-marcellus': PC('Pelopidas and Marcellus',
    'Both commanders died through their own boldness, and Plutarch judges the rashness severely: a general owes his life to the army that depends on it.'),
  'plutarch-comp-aristides-cato': PC('Aristides and Cato the Elder',
    'A comparison of two famously upright men, weighing Aristides’ poverty against Cato’s acquisitiveness, and asking whether Cato’s hardness toward slaves and dependants is compatible with real virtue.'),
  'plutarch-comp-philopoemen-flamininus': PC('Philopoemen and Titus Flamininus',
    'Plutarch compares the Greek and the Roman who each claimed to have freed Greece, weighing service to one’s own people against liberation granted by a stronger power.'),
  'plutarch-comp-lysander-sulla': PC('Lysander and Sulla',
    'Two victors are compared on how they used their victories, on the cruelty of their settlements, and on the wealth and bloodshed each brought into his own city.'),
  'plutarch-comp-cimon-lucullus': PC('Cimon and Lucullus',
    'A comparison of two generous commanders, weighing their campaigns and, above all, what each did with his wealth and his retirement.'),
  'plutarch-comp-nicias-crassus': PC('Nicias and Crassus',
    'Plutarch compares the two disasters, judging Nicias’ scruple less culpable than Crassus’ greed, since the one was dragged into his expedition and the other sought his out.'),
  'plutarch-comp-sertorius-eumenes': PC('Sertorius and Eumenes',
    'Two exiles commanding armies not their own are compared on their generalship and on the manner of the betrayals that killed them both.'),
  'plutarch-comp-agesilaus-pompey': PC('Agesilaus and Pompey',
    'A comparison of two men who held vast authority, weighing their acquisition of power, their obedience to law, and the very different ends they met.'),
  'plutarch-comp-agis-cleomenes-gracchi': PC('Agis and Cleomenes with the two Gracchi',
    'Plutarch compares the Spartan kings and the Roman tribunes as reformers on behalf of the poor, weighing their aims, their methods, and the violence that ended all four.'),
  'plutarch-comp-demosthenes-cicero': PC('Demosthenes and Cicero',
    'The two great orators are compared on their style, their political courage, their conduct in exile, and their vanity — Plutarch finding Cicero the more boastful and Demosthenes the more consistent.'),
  'plutarch-comp-demetrius-antony': PC('Demetrius and Antony',
    'The two cautionary Lives are compared on their gifts, their appetites, and their falls, closing the pair Plutarch offered as a warning rather than a model.'),
  'plutarch-comp-dion-brutus': PC('Dion and Brutus',
    'A comparison of two philosophers who struck at tyranny, weighing their motives, the justice of each act, and their fitness to govern what they had freed.'),

  // ── The Moralia: education, character and the moral life ─────────────────────────────
  'plutarch-education-of-children': PM(
    'An essay of disputed authenticity, transmitted first in the Moralia and much read in later centuries as a manual for parents.',
    'Advice on the whole upbringing of a freeborn child: the character of the parents, the choice of nurses and tutors, the value of a liberal education, the training of memory, and the handling of adolescence.',
    'It argues that character is formed by habit under instruction, and that the parent’s own conduct teaches more than any precept.',
    'Its assumptions about instruction, discipline and the responsibility of fathers illuminate the household codes of Ephesians and Colossians and the qualification that an overseer manage his own household well.',
  ),
  'plutarch-study-of-poetry': PM(
    'Addressed to a father whose son was beginning to read the poets, at a time when Homer and the tragedians were the staple of education.',
    'How a young reader should handle poetry that depicts the gods behaving badly and vice going unpunished: not by banning it, but by reading critically, noting where the poet reports rather than approves, and drawing moral profit from the whole.',
    'Plutarch defends imaginative literature against the charge that it corrupts, arguing that trained judgement, not censorship, is the remedy.',
    'The best surviving ancient statement of how a religious reader should approach morally difficult texts — the same problem faced in reading the harder narratives of the Old Testament.',
  ),
  'plutarch-listening-to-lectures': PM(
    'Written for a young man just assuming the toga virilis and beginning philosophical study.',
    'How to listen well: attending without contentiousness, resisting the temptation to admire style over substance, not confusing enjoyment with profit, and knowing when applause is flattery of the speaker and self-deception in the hearer.',
    'Plutarch insists that hearing is an active discipline for which the hearer is responsible, not a passive reception of what a speaker chooses to give.',
    'Directly relevant to the New Testament’s repeated concern with how the word is heard — the parable of the sower, James on hearers who are not doers, and Paul’s warnings against admiring speakers for their eloquence.',
  ),
  'plutarch-flatterer-and-friend': PM(
    'Addressed to a man of standing, for whom flattery was an occupational hazard.',
    'How to tell a flatterer from a true friend: the flatterer’s imitation of one’s own opinions, his praise of faults, his avoidance of anything unwelcome — and the corresponding marks of genuine frankness, together with advice on how to give and receive candid rebuke.',
    'The essay makes frank speech, parrhēsia, the test of real friendship, and treats self-love as the reason flattery succeeds.',
    'Parrhēsia is a key New Testament word, and the discussion of how to rebuke a friend without wounding him bears directly on Galatians 2, Matthew 18, and the pastoral correction described in the epistles.',
  ),
  'plutarch-progress-in-virtue': PM(
    'Written against the Stoic doctrine that one is either wise or not, with no middle ground.',
    'Signs by which a person may know he is improving: steadier resolve, dreams that no longer betray him, less concern for reputation, readiness to be corrected, and the gradual replacement of effort by inclination.',
    'Plutarch argues for real if imperfect progress in the moral life against an all-or-nothing account of virtue.',
    'The nearest pagan analogue to the New Testament’s language of growth and sanctification — the believer who is neither perfect nor unchanged, and who may look for evidence of progress.',
  ),
  'plutarch-profit-by-enemies': PM(
    'Addressed to a man engaged in public life, where enmity was unavoidable.',
    'How an enemy may be turned to advantage: as a spur to self-discipline, a watchman who reports one’s faults truthfully, an occasion for practising restraint, and a training-ground for bearing insult.',
    'Plutarch argues that the injury an enemy intends can be converted into benefit by the way it is received — the harm depending on the response rather than the act.',
    'The closest pagan approach to the teaching on enemies in the Sermon on the Mount, though Plutarch’s ground is self-improvement rather than love of the enemy for his own sake — a difference worth pressing.',
  ),
  'plutarch-having-many-friends': PM(
    'A short essay against the fashion for collecting acquaintances.',
    'An argument that friendship in the full sense cannot be multiplied: it requires time, shared trials and constancy, and a man who claims many friends has in fact none.',
    'Friendship is treated as a demanding good requiring exclusivity of attention, not as an accumulation of goodwill.',
    'Useful for reading the New Testament’s language of friendship, and for understanding the ancient assumption that real friends are few — against which Jesus’ calling of his disciples friends stands out.',
  ),
  'plutarch-on-chance': PM(
    'A brief piece, probably a rhetorical exercise, on the relative claims of luck and intelligence.',
    'An argument that human life is directed by prudence rather than by chance: the arts, the crafts and the virtues are all the work of reason, and what we credit to fortune is generally the work of judgement.',
    'It defends the moral seriousness of human choice against a fatalism that would leave nothing to deliberation.',
    'Background to the ancient debate about fortune, providence and human responsibility that surfaces in New Testament discussions of God’s purpose and human decision.',
  ),
  'plutarch-virtue-and-vice': PM(
    'A short declamation, closer to rhetoric than to sustained argument.',
    'A comparison of the settled tranquillity that virtue brings with the inner disturbance of vice, arguing that external goods change nothing if the mind is disordered.',
    'Happiness is located wholly in the state of the soul rather than in circumstances — the position Plutarch shares with the Stoics whom he elsewhere attacks.',
    'A close pagan parallel to Paul’s claim to have learned contentment in any circumstance, and to the New Testament’s location of peace in the inner person.',
  ),
  'plutarch-consolation-to-apollonius': PM(
    'A letter of condolence to a friend who had lost a son; its authenticity has been doubted, but it preserves a full anthology of consolatory arguments.',
    'The standard consolations, densely illustrated from the poets and philosophers: the universality of death, the shortness of life, the release from evils, the impropriety of excessive grief, and the hope entertained by some of a better state after death.',
    'It gathers, more fully than any other surviving text, what an educated pagan could say to the bereaved — and how far short of assurance it stops.',
    'The indispensable comparison for 1 Thessalonians 4, where Paul consoles the bereaved explicitly as those who do not grieve like the rest, who have no hope.',
  ),
  'plutarch-keeping-well': PM(
    'Cast as a conversation, addressed to men whose studies and public duties made them neglect their bodies.',
    'Practical advice on health: moderation in food and drink, attention to early symptoms, exercise suited to a scholar’s life, and the refusal to treat the body’s needs as beneath a philosopher’s notice.',
    'It insists that care of the body is part of the care of the self, since a disordered body obstructs the mind’s work.',
    'Illuminates ancient assumptions about the body, temperance and self-control — the background to the New Testament’s treatment of the body as the temple of the Spirit and to Paul’s athletic imagery.',
  ),
  'plutarch-advice-to-bride-and-groom': PM(
    'A wedding present addressed to two former pupils, Pollianus and Eurydice, at the start of their marriage.',
    'Forty-eight short precepts on married life: mutual accommodation, the management of anger and of money, the handling of in-laws, the wife’s sharing of her husband’s friends and gods, and the encouragement of the wife’s philosophical education.',
    'Plutarch treats marriage as a partnership requiring the cultivation of character on both sides, and is unusual among ancient writers in urging that a wife be educated.',
    'The most important pagan comparison for the New Testament household codes — close enough in form to show what is conventional in Ephesians 5, Colossians 3 and 1 Peter 3, and different enough to show what is not.',
  ),
  'plutarch-dinner-of-the-seven-wise-men': PM(
    'A literary symposium, imagining a banquet given by Periander at Corinth for the Seven Sages.',
    'Table conversation among the sages on kingship and household management, on the best form of government, on frugal diet, and — in the closing section — the story of Arion carried to shore by a dolphin.',
    'Plutarch uses the fiction to show wisdom as something exercised in conversation and hospitality rather than delivered in lectures.',
    'A well-developed example of the symposium as a literary form, the genre against which the meal scenes of Luke’s Gospel and the discourse at the Last Supper in John are often read.',
  ),
  'plutarch-on-superstition': PM(
    'An early work, sharply argued, attacking superstition as worse than outright unbelief.',
    'A comparison of atheism and deisidaimonia: the atheist merely fails to believe in the gods, while the superstitious man believes in gods who are cruel, and so lives in fear, misreads every event as a threat, and is driven to degrading rites and even to human sacrifice.',
    'Plutarch argues that a false conception of God does more damage than none at all, and that fear is not reverence — genuine piety being confident and glad.',
    'The essential text for the New Testament word-group deisidaimonia, which Paul uses of the Athenians in Acts 17:22 and Festus of Jewish disputes in Acts 25:19 — a word poised, exactly as here, between "religious" and "superstitious".',
  ),
  'plutarch-sayings-of-kings': PM(
    'A collection of apophthegms, prefaced by a dedication to the emperor Trajan.',
    'Short remembered sayings of Persian, Egyptian, Greek, Macedonian and Roman rulers and commanders, arranged by speaker from Artaxerxes to Augustus and beyond.',
    'The preface argues that a man’s brief sayings reveal his mind more surely than his actions, since deeds are shaped by circumstance and words by choice — the principle underlying the Lives.',
    'The best surviving evidence for how sayings were collected, remembered and attributed in the ancient world, which is directly relevant to the study of the Gospel tradition of the sayings of Jesus. The Greek here numbers each saying; the public-domain English gives one block per figure, so the two are paired at the level of the figure.',
  ),
  'plutarch-sayings-of-spartans': PM(
    'A companion collection to the Sayings of Kings, gathering the Laconic apophthegms.',
    'Sayings attributed to Spartans, arranged by speaker from Agasicles onward, together with the celebrated anonymous retorts — brevity, defiance and understatement being the point throughout.',
    'The collection embodies the Spartan conviction that few words well chosen show a trained mind, and that speech is a discipline like any other.',
    'Valuable for the study of how memorable sayings circulate, attach to famous names, and are preserved in collections — the process behind the sayings material in the Gospels. Paired at the level of the figure, since the Greek numbers each saying and the public-domain English does not.',
  ),
  'plutarch-bravery-of-women': PM(
    'Addressed to Clea, priestess at Delphi, and prompted by a conversation about whether courage is the same in women as in men.',
    'A series of narratives of courageous action by women, both collective (the women of Argos, of Phocis, of Chios) and individual (Camma, Timocleia, Aretaphila), gathered as evidence for the thesis.',
    'Plutarch argues explicitly that virtue is one and the same in women and men, differing only in circumstance — a notably strong claim in an ancient moralist.',
    'An important corrective to assumptions about ancient views of women, and useful background to the prominence of women in the Gospels and in Paul’s letters.',
  ),
  'plutarch-parallel-stories': PM(
    'A collection whose authenticity is widely doubted; many of its cited sources cannot be traced.',
    'Pairs of Greek and Roman stories on matching themes, told briefly and each attributed to a named authority.',
    'Whatever its authorship, it shows the pairing habit of mind that governs the Lives applied mechanically to anecdote.',
    'Of interest chiefly as evidence of how sources were cited — and invented — in the ancient world.',
  ),
  'plutarch-fortune-of-the-romans': PM(
    'A declamation, probably delivered as a display piece, on whether Rome’s empire was owed to luck or to merit.',
    'An argument that Fortune and Virtue contended for Rome and that Fortune laid down her wings to settle there, illustrated from the whole span of Roman history.',
    'It treats the rise of an empire as a theological question — whether such success is providential, deserved, or accidental.',
    'Directly relevant to how Jews and Christians under Rome explained its dominance, and to the New Testament’s treatment of governing authorities as instituted by God.',
  ),
  'plutarch-fortune-of-alexander': PM(
    'Two rhetorical declamations arguing the case that Alexander owed his success to virtue rather than to luck.',
    'A sustained defence of Alexander as a philosopher in arms, whose conquests spread civilisation and whose self-command matched his daring — with Fortune presented as his opponent rather than his patron.',
    'It advances the idea that Alexander sought to unite mankind under one rational order, making empire a philosophical project.',
    'The clearest ancient statement of the ideal of a single humanity brought together across national boundaries — a secular analogue to the New Testament’s vision of one people drawn from every nation.',
  ),
  'plutarch-glory-of-athens': PM(
    'A short declamation, comparing Athens’ soldiers with her writers and artists.',
    'An argument that Athens won more renown by her deeds in war than by her poets, painters and historians — with the famous remark that Thucydides makes his reader a spectator, and that painting is silent poetry.',
    'It reflects on how far the record of an action can be separated from the action itself.',
    'The source of some of antiquity’s most quoted remarks on narrative vividness — enargeia — the quality ancient critics prized and modern readers often notice in the Gospel of Mark.',
  ),
  'plutarch-isis-osiris': PM(
    'Addressed to Clea, a priestess at Delphi, at a time when Egyptian cults were spreading through the empire.',
    'The myth of Isis, Osiris and Typhon, retold in full and then interpreted allegorically as a philosophical account of the divine, of matter, and of the soul, with a long discussion of Egyptian religion, its symbols and its priesthood.',
    'It argues that the myths of the nations point, when rightly read, to one divine reality apprehended under many names.',
    'The fullest ancient account of a mystery-cult myth, central to discussion of dying-and-rising deities and of the religious environment in which the early church proclaimed a risen Lord.',
  ),

  // ── The Moralia: Delphi, the divine, and providence ──────────────────────────────────
  'plutarch-the-e-at-delphi': PM(
    'One of the Delphic dialogues, written from Plutarch’s long service as a priest of Apollo there.',
    'A conversation on the meaning of the letter E inscribed at Delphi: successive speakers propose that it stands for a number, for a logical particle, or for the address "Thou art", the last taken as a confession that God alone truly is, while all else is in flux.',
    'The closing interpretation — that being belongs to God and becoming to everything else — is among the most striking statements of divine immutability in pagan literature.',
    'A remarkable pagan parallel to the divine name as "I am", and to the New Testament’s contrast between the God who does not change and a creation that passes away.',
  ),
  'plutarch-oracles-at-delphi': PM(
    'A Delphic dialogue prompted by the observation that the oracle no longer answered in hexameter verse.',
    'A discussion of why the Pythia now speaks in prose: not because the god’s power has failed, but because the medium is human and adapts to the age, the god using the prophetess as an instrument whose own quality shapes the result.',
    'It develops a careful account of inspiration in which the divine impulse is genuine but is conveyed through, and limited by, the human agent.',
    'The most useful pagan discussion for thinking about prophecy and inspiration — how a message may be truly given and yet bear the marks of the person who delivers it.',
  ),
  'plutarch-obsolescence-of-oracles': PM(
    'A Delphic dialogue on the decline of the oracles across the Greek world.',
    'Explanations offered in turn: depopulation, the withdrawal or death of the daemons who mediate between gods and men — including the famous report of the cry that great Pan is dead — and physical accounts of the exhalations at the shrine.',
    'It sets out a demonology of intermediate beings, and considers whether such beings can die.',
    'The principal ancient text on daemons as intermediaries, the conceptual background to New Testament language about spiritual powers; the story of the death of Pan was much used by later Christian writers.',
  ),
  'plutarch-can-virtue-be-taught': PM(
    'A short piece, evidently the opening of a lecture rather than a finished essay.',
    'A brief argument that virtue must be teachable, since we take pains to teach lesser things, and since without teaching there could be no reason for reproach or praise.',
    'It defends moral instruction as effective, against the view that character is simply given.',
    'Bears on the New Testament’s assumption that believers can be taught to live rightly, and on the relation of instruction to transformation.',
  ),
  'plutarch-on-moral-virtue': PM(
    'A philosophical essay written against the Stoic account of the soul.',
    'An argument, following Plato and Aristotle, that the soul has a rational and an irrational part, and that moral virtue consists not in eliminating the passions but in the rational part governing them — against the Stoic view that the passions are simply mistaken judgements to be extirpated.',
    'It defends the moderation rather than the eradication of feeling as the goal of the moral life.',
    'The clearest ancient statement of the alternative to Stoic apatheia, and useful for reading the New Testament’s treatment of anger, grief and desire as things to be governed rather than abolished.',
  ),
  'plutarch-control-of-anger': PM(
    'A dialogue in which a friend describes how he cured himself of a violent temper.',
    'Practical means of mastering anger: observing its ugliness in others, imposing silence at the moment of provocation, postponing punishment, reducing one’s demands on servants and dependants, and remembering how trivial the causes usually are.',
    'Anger is treated as a habit that can be unlearned by deliberate practice, not a fixed feature of temperament.',
    'The fullest ancient handbook on anger management, valuable beside the New Testament’s repeated commands about anger, slowness to speak, and refusing to let the sun go down on wrath.',
  ),
  'plutarch-tranquillity-of-mind': PM(
    'Written at a friend’s request, and admittedly assembled from Plutarch’s own notebooks.',
    'How to attain euthymia: not by changing one’s circumstances but by governing one’s judgement of them — choosing work suited to one’s nature, refusing comparison with others, attending to the good one has rather than the good one lacks, and recalling past blessings.',
    'Contentment is located wholly in the mind’s use of its circumstances, and is presented as attainable by practice.',
    'The closest pagan parallel to Paul’s statement that he has learned to be content in any state, and to the New Testament’s treatment of anxiety.',
  ),
  'plutarch-brotherly-love': PM(
    'Addressed to two brothers, and written when Plutarch judged fraternal affection to be in decline.',
    'On preserving affection between brothers: yielding in disputes over inheritance, avoiding rivalry and comparison, managing differences of fortune and ability, handling the friends and wives who divide brothers, and behaving toward a brother’s children as toward one’s own.',
    'Plutarch treats the natural bond of brothers as something requiring deliberate cultivation, easily destroyed by small competitions.',
    'A striking parallel to the New Testament’s pervasive use of philadelphia for relations among Christians — literally "brotherly love", the very word of this essay’s title.',
  ),
  'plutarch-affection-for-offspring': PM(
    'A short essay, apparently incomplete, on whether love of one’s children is natural.',
    'An argument from the behaviour of animals toward their young that parental affection is rooted in nature rather than in calculation of advantage, since the young can offer nothing in return.',
    'It uses natural affection as evidence that nature inclines living things to disinterested care.',
    'Bears on the New Testament’s appeals to what nature teaches, and on its use of parental love as an image of God’s dealing with his people.',
  ),
  'plutarch-vice-and-unhappiness': PM(
    'A brief declamation, probably the introduction to a longer treatment.',
    'An argument that vice by itself suffices to make a person miserable, since it brings its own disturbance and needs no external misfortune to complete it.',
    'Wretchedness is presented as internal to wrongdoing rather than a punishment added to it.',
    'A close pagan analogue to the biblical idea that sin carries its own consequence, and to Romans 1, where the wrath of God is revealed in men being given over to what they have chosen.',
  ),
  'plutarch-soul-or-body': PM(
    'A short rhetorical piece comparing the diseases of the soul with those of the body.',
    'An argument that the soul’s disorders are worse: they are not felt as illness by the one who has them, they are not sought to be cured, and they are contracted by choice.',
    'The central point is that the worst maladies are those the sufferer does not recognise as maladies.',
    'Illuminates the New Testament’s use of sickness and blindness as images for a spiritual condition unrecognised by those in it.',
  ),
  'plutarch-on-talkativeness': PM(
    'An essay on garrulity as a disease of character, written with unusual liveliness.',
    'The nature and cure of talkativeness: the babbler’s inability to keep a secret, his deafness to others, the harm he does himself, and remedies including deliberate silence, delay before answering, and reflection on occasions when speech has ruined its speaker.',
    'Plutarch treats the failure to control the tongue as a moral disorder with consequences for others, not a mere social nuisance.',
    'The best pagan comparison for James 3 on the tongue, and for the New Testament’s repeated warnings about idle words and the discipline of speech.',
  ),
  'plutarch-on-being-a-busybody': PM(
    'A companion piece to On Talkativeness, on the appetite for other people’s affairs.',
    'On polypragmosynē: the curiosity that pries into neighbours’ misfortunes and household secrets, its roots in malice and idleness, and cures including redirecting the attention to one’s own business and to the study of nature and history.',
    'It diagnoses inquisitiveness about others as a way of avoiding attention to oneself.',
    'Directly parallel to the New Testament’s condemnation of the busybody, periergos — the word used in 1 Timothy 5:13 and 2 Thessalonians 3:11.',
  ),
  'plutarch-love-of-wealth': PM(
    'An essay against philargyria, addressed to the ordinary respectable pursuit of money.',
    'An argument that the love of money is distinguished by never being satisfied: the miser gets no use from what he has, labours to acquire what he will not spend, and is poorer in enjoyment than the genuinely poor.',
    'Wealth is treated as valuable only in use, so that hoarding is self-defeating as well as wrong.',
    'Philargyria is the exact word of 1 Timothy 6:10, "the love of money is a root of all kinds of evil"; this essay is its fullest pagan treatment.',
  ),
  'plutarch-on-compliancy': PM(
    'On the fault of being unable to say no — the excessive shame that yields against one’s judgement.',
    'An analysis of dysōpia: the man who cannot refuse a request, lends what he cannot spare, endorses what he disbelieves, and is ruined by an inability to bear another’s displeasure; with training in refusing small things first.',
    'It distinguishes genuine modesty from the weakness that cannot resist pressure, and treats the latter as a failure of nerve rather than a kindness.',
    'Bears on the New Testament’s call to please God rather than men, and on Paul’s insistence that he did not shape his message to win approval.',
  ),
  'plutarch-envy-and-hate': PM(
    'A short analytical essay distinguishing two feelings commonly confused.',
    'An argument that hatred is directed at those thought wicked and may be justified, while envy is directed at those thought fortunate and never can be; hatred can be openly avowed, envy never is.',
    'Envy is exposed as uniquely shameful because it resents a good rather than an evil.',
    'Illuminates the New Testament’s lists of vices, where envy recurs, and the Gospels’ statement that Jesus was handed over out of envy.',
  ),
  'plutarch-praising-oneself': PM(
    'Addressed to a public man who must sometimes speak of his own achievements.',
    'When and how a person may praise himself without giving offence: in self-defence, to encourage others, or to correct a false account — with the qualifications of admitting faults, crediting fortune or God, and avoiding comparison with the hearer.',
    'Plutarch treats self-praise as normally repellent but sometimes necessary, and works out the conditions carefully.',
    'The essential background to Paul’s "boasting" in 2 Corinthians 10–12, where he apologises for speaking of himself, pleads necessity, and boasts of weakness — moves this essay lets us see as deliberate.',
  ),
  'plutarch-delays-of-divine-vengeance': PM(
    'A dialogue prompted by the objection that God punishes the wicked too late, or not at all.',
    'Answers offered in turn: delay allows repentance, gives time for the wicked to be used as instruments, teaches men patience, and punishes inwardly before it punishes outwardly; the dialogue closes with the vision of Thespesius, taken to the other world and shown the punishment of souls.',
    'It is Plutarch’s most sustained theodicy, arguing that divine justice is slow because it is educative rather than merely retributive.',
    'The most important pagan parallel to 2 Peter 3, where the Lord is said not to be slow but patient, not willing that any should perish; the vision of Thespesius also invites comparison with the parable of the rich man and Lazarus.',
  ),
  'plutarch-on-fate': PM(
    'A treatise of disputed authorship, setting out a Platonist account of destiny.',
    'A technical distinction between fate as a law or ordinance and fate as the sequence of events, with an argument that fate is conditional — that human choices are genuinely ours while their consequences follow by an established order — together with a discussion of providence and of what depends on us.',
    'It attempts to reconcile a divine ordering of the world with real human responsibility.',
    'Valuable background to New Testament passages holding together God’s determined purpose and human accountability, as in Acts 2:23.',
  ),
  'plutarch-sign-of-socrates': PM(
    'A dialogue set during the liberation of Thebes from its Spartan garrison, interweaving action and philosophy.',
    'Conversation among the conspirators, framing an extended discussion of what Socrates’ daimonion was: a voice, an omen, or the promptings of a higher mind — capped by the myth of Timarchus, who descends into the cave of Trophonius and sees the fate of souls.',
    'It develops an account of the daemon as the higher part of the soul, and of the soul’s destiny after death.',
    'A key text for ancient conceptions of a guiding spirit and of divine guidance conveyed inwardly rather than by oracle, and for its picture of the afterlife.',
  ),
  'plutarch-on-exile': PM(
    'A consolation addressed to a man banished from his home city.',
    'Arguments that exile is not among the real evils: the universe is a single homeland, place is indifferent to happiness, many great men did their best work in banishment, and it is opinion rather than the fact that makes exile painful.',
    'It advances a cosmopolitan understanding of belonging, in which the wise person is at home anywhere.',
    'The closest pagan analogue to the New Testament’s language of Christians as strangers and exiles whose citizenship is elsewhere, in Philippians 3, Hebrews 11 and 1 Peter.',
  ),
  'plutarch-consolation-to-his-wife': PM(
    'A letter written to his wife Timoxena on the death of their two-year-old daughter, while he was away from home.',
    'Plutarch praises his wife’s restraint at the funeral, argues against both excessive mourning and forced insensibility, recalls the child’s character, and closes with the hope, drawn from their shared initiation in the mysteries, that the soul survives.',
    'It is the most personal of his works, and the point at which his philosophical consolations are tested by his own grief.',
    'The most affecting pagan text on the death of a child and the hope of survival, and a direct comparison for Christian consolation of the bereaved.',
  ),
  'plutarch-dialogue-on-love': PM(
    'A dialogue set at Thespiae during the festival of the Erotidia, framed by the story of a young man carried off by a wealthy widow.',
    'A debate on whether love between men or married love is the higher, resolved decisively in favour of marriage as the fullest form of Eros; with a discussion of the god Eros and of love as a divine madness that leads the soul upward.',
    'It marks a significant shift in ancient thought by locating the highest form of love in marriage.',
    'Important background to the New Testament’s treatment of marriage and sexuality, and to the vocabulary of love in a culture whose assumptions differed sharply from the biblical writers’.',
  ),
  'plutarch-love-stories': PM(
    'A short collection of romantic tales, generally judged not to be Plutarch’s own.',
    'Five brief narratives of love, jealousy and violent death, told without moralising.',
    'Of slight philosophical weight, but evidence of the popular taste in stories that circulated alongside the moral essays.',
    'Useful for the study of the ancient novel and popular narrative, the wider literary world in which the Gospels and apocryphal Acts were read.',
  ),

  // ── The Moralia: politics and public life ────────────────────────────────────────────
  'plutarch-philosopher-and-men-in-power': PM(
    'A short piece arguing that philosophers should not avoid the company of the powerful.',
    'An argument that the philosopher who instructs a ruler benefits everyone the ruler governs, so that such association is a public service rather than flattery or self-advancement.',
    'It defends engagement with political power as a form of usefulness, against a withdrawn ideal of the philosophic life.',
    'Bears on the early Christian question of how far believers should engage with, or withdraw from, the structures of imperial society.',
  ),
  'plutarch-to-an-uneducated-ruler': PM(
    'Addressed to a ruler without philosophical training, probably a Roman of high rank.',
    'An argument that a ruler needs reason to govern him as he governs others; that law is the image of God in the state and the ruler its servant; and that power without understanding magnifies whatever the man already is.',
    'The claim that the ruler is an image of God and answerable to divine law is the essay’s core, making authority derivative rather than absolute.',
    'A close pagan parallel to Romans 13, where the ruler is God’s servant for good, and to the New Testament’s framing of all authority as delegated and accountable.',
  ),
  'plutarch-old-man-in-public-affairs': PM(
    'Addressed to Euphanes, urging him not to retire from public life in old age.',
    'An argument that the elderly should continue in public service: their judgement compensates for lost vigour, retirement is a kind of desertion, and the counsel of experience is what a state most needs.',
    'It treats service as a lifelong obligation rather than a stage of life, and old age as bringing gains as well as losses.',
    'Illuminates the standing of elders in the ancient world, and so the New Testament’s appointment of presbyteroi and its instructions about older men and women.',
  ),
  'plutarch-precepts-of-statecraft': PM(
    'Advice to a young Greek entering public life in a city under Roman rule.',
    'Practical political counsel: entering politics from conviction rather than ambition, knowing the temper of one’s people, managing rivals, choosing which honours to accept — and a frank recognition that Greek cities now act under Roman oversight, so that the statesman must not stir up what he cannot control.',
    'It works out how to act honourably within real and acknowledged limits on one’s freedom of action.',
    'The best single text on how a provincial Greek city actually functioned under Rome — the civic world of Ephesus, Corinth and Thessalonica in Acts.',
  ),
  'plutarch-monarchy-democracy-oligarchy': PM(
    'A fragment, evidently the opening of a lecture that does not survive complete.',
    'The beginning of a comparison of the three constitutions, breaking off early in the argument.',
    'Too brief to develop a position, but attesting Plutarch’s engagement with the standard constitutional debate.',
    'Of interest for the political vocabulary shared with Hellenistic Jewish writers such as Philo and Josephus.',
  ),
  'plutarch-we-ought-not-to-borrow': PM(
    'A sharp essay against borrowing money, aimed at people of means who ran into debt to keep up appearances.',
    'An argument that debt is a voluntary slavery: the borrower loses his freedom, the interest never rests, and the whole arrangement is entered into to sustain a display nobody requires. Plutarch urges selling superfluities and living within one’s means.',
    'Freedom is treated as inseparable from independence of others’ money.',
    'Valuable background to the New Testament’s parables of debtors and creditors, and to a world in which debt could end in bondage.',
  ),
  'plutarch-ten-orators': PM(
    'A compilation of the lives of the Attic orators, generally judged not to be Plutarch’s own work.',
    'Brief biographies of the ten canonical Athenian orators — Antiphon, Andocides, Lysias, Isocrates, Isaeus, Aeschines, Lycurgus, Demosthenes, Hyperides and Dinarchus — with anecdotes, decrees and lists of works.',
    'Its value is documentary rather than philosophical, preserving records that would otherwise be lost.',
    'Useful for the history of Greek rhetoric, the discipline that shaped the education of educated readers of the New Testament.',
  ),
  'plutarch-aristophanes-and-menander': PM(
    'An epitome — a summary made by a later hand of a fuller comparison now lost.',
    'A comparison of the two comic poets strongly favouring Menander: Aristophanes is judged coarse, uneven and addressed to the crowd, while Menander is praised for a style suited to every occasion and for characters true to life.',
    'It shows the later ancient preference for refinement and moral seriousness over vigour and satire.',
    'Menander is quoted at 1 Corinthians 15:33 ("bad company corrupts good morals"), and this essay explains why he, rather than Aristophanes, was the comic poet an educated first-century reader would know.',
  ),
  'plutarch-malice-of-herodotus': PM(
    'A polemical essay attacking Herodotus for bias, unusual in Plutarch for its sustained hostility.',
    'A systematic charge-sheet: that Herodotus uses harsh words where mild ones would serve, prefers the discreditable version, disparages the Boeotians and Corinthians, credits barbarian sources, and insinuates blame while appearing to report.',
    'Whatever its fairness, it sets out explicit criteria for detecting bias in a historian.',
    'The most valuable ancient text on how one writer assessed another’s historical reliability — directly relevant to the criteria applied to the Gospels and Acts as historical sources.',
  ),

  // ── The Moralia: nature, animals and the physical world ──────────────────────────────
  'plutarch-natural-phenomena': PM(
    'A collection in the tradition of Aristotelian "problems", posing questions about the natural world.',
    'Some forty questions on natural causes — mostly concerning water, plants, animals and the sea — each followed by one or more proposed explanations rather than a settled answer.',
    'It shows an educated approach to nature that seeks causes while remaining open about them.',
    'Illuminates the assumptions about the natural world held by educated readers in the New Testament period.',
  ),
  'plutarch-face-on-the-moon': PM(
    'A dialogue combining astronomy, physics and myth, and among the most ambitious of the Moralia.',
    'A discussion of what the markings on the moon are — reflections, or features of a solid body — with arguments that the moon is an earth-like body, followed by the myth of the soul’s ascent, in which mind is separated from soul on the moon and returns to the sun.',
    'It joins physical inquiry to an eschatology in which the soul undergoes a second death and is purified.',
    'One of the fullest ancient accounts of the soul’s ascent after death, valuable for comparison with New Testament and intertestamental pictures of the afterlife.',
  ),
  'plutarch-principle-of-cold': PM(
    'A physical treatise addressed to a friend, inquiring whether cold is a positive thing.',
    'An argument that cold is not merely the absence of heat but has its own principle, with earth, water and air each canvassed as its substance and evidence drawn from freezing, from medicine and from ordinary observation.',
    'It defends the reality of a quality often treated as a mere privation.',
    'Of interest for ancient physics and for the analogical use of hot and cold in moral and religious language, as in the letter to Laodicea in Revelation 3.',
  ),
  'plutarch-fire-or-water': PM(
    'A short declamation arguing both sides of a set question.',
    'The case for water and the case for fire as the more useful element, argued from their roles in life, agriculture, cookery and craft.',
    'A display piece rather than a philosophical treatise, valuable as an example of arguing a thesis on either side.',
    'Illustrates the rhetorical training in arguing both sides of a question that shaped ancient education and argumentative style.',
  ),
  'plutarch-cleverness-of-animals': PM(
    'A dialogue prompted by a debate over whether land or sea animals are the more intelligent.',
    'Two speakers argue the case for each in turn, with a wealth of observed and reported animal behaviour, prefaced by an argument that animals possess reason in some degree and are therefore owed just treatment.',
    'It maintains that animals reason, and draws the moral conclusion that cruelty to them is wrong.',
    'Background to ancient debate about the standing of animals, and to the biblical concern for the treatment of beasts.',
  ),
  'plutarch-beasts-are-rational': PM(
    'A comic dialogue in which Odysseus argues with Gryllus, one of his men turned into a pig by Circe and unwilling to be changed back.',
    'Gryllus argues that animals are braver, more temperate and more naturally virtuous than human beings, whose vices are inventions of their own, and declines Odysseus’ offer to restore him.',
    'Under the joke lies a serious case that much human wickedness is cultural rather than natural.',
    'A witty ancient challenge to human self-estimation, useful beside biblical passages that send the sluggard to the ant and set human folly against animal instinct.',
  ),
  'plutarch-eating-of-flesh-1': PM(
    'The first of two declamations against eating meat, in the Pythagorean tradition.',
    'An argument that meat-eating is unnatural to human beings, that the first man to eat flesh did something monstrous, and that the burden of proof lies on the carnivore rather than the abstainer.',
    'It grounds abstention in compassion and in a claim about what human nature was made for.',
    'Useful background to the New Testament’s discussions of meat and abstention in Romans 14 and 1 Corinthians 8–10, and to ancient ascetic practice.',
  ),
  'plutarch-eating-of-flesh-2': PM(
    'The second declamation on the same theme; both survive incomplete.',
    'Further argument against flesh-eating, adding the Pythagorean doctrine of the transmigration of souls as a reason for restraint, and answering the objection that animals would otherwise overrun the earth.',
    'It links diet to belief about the soul, making abstention a consequence of metaphysics.',
    'Evidence for the religious dietary abstentions current in the New Testament world, and for the reasoning that lay behind them.',
  ),

  // ── The Moralia: Plato, the Stoics and the Epicureans ────────────────────────────────
  'plutarch-platonic-questions': PM(
    'A set of exegetical problems on difficult passages in Plato, written from Plutarch’s standpoint as a Platonist.',
    'Ten questions, each posing a difficulty in the Platonic dialogues — on the Timaeus, the Republic, the Theaetetus and others — and canvassing solutions.',
    'It shows Platonism as a tradition of textual interpretation, in which authority is exercised by reading a master’s text closely.',
    'The method — posing a difficulty in an authoritative text and resolving it — is the same as that of contemporary Jewish and Christian exegesis.',
  ),
  'plutarch-generation-of-the-soul': PM(
    'A technical treatise for his sons on the hardest passage of Plato’s Timaeus.',
    'An interpretation of the making of the world-soul out of divisible and indivisible being, with a critique of rival readings and a mathematical treatment of the harmonic proportions Plato assigns to it.',
    'Plutarch argues, against most Platonists, that the world had a real beginning in time and that a disorderly soul pre-existed the ordered one.',
    'Valuable for the middle-Platonic doctrine of God, matter and the world-soul, which is the philosophical background against which the Logos theology of John’s prologue was heard.',
  ),
  'plutarch-stoic-self-contradictions': PM(
    'A polemical treatise against the Stoics, one of three such works in the Moralia.',
    'A collection of passages in which, Plutarch argues, Chrysippus and the early Stoics contradict themselves or their own practice — on providence, on the passions, on the wise man, and on the relation of their doctrines to ordinary life.',
    'Its value is largely documentary: it quotes early Stoic writings that are otherwise lost.',
    'One of the principal sources for early Stoic doctrine, and so for the philosophy Paul encountered at Athens in Acts 17.',
  ),
  'plutarch-stoics-and-poets': PM(
    'A short summary treatise, a companion to the other anti-Stoic works.',
    'A brief argument that Stoic paradoxes are stranger than anything in the poets, whose worst extravagances the Stoics outdo in sober prose.',
    'It attacks Stoicism by the rhetorical method of showing its claims to be less credible than acknowledged fiction.',
    'Further evidence for the Stoic positions current in the first century and for how they struck an educated contemporary.',
  ),
  'plutarch-common-conceptions': PM(
    'The longest of the anti-Stoic treatises, cast as a dialogue.',
    'An argument that Stoic doctrine violates the common conceptions — the shared intuitions of mankind — on providence, on good and evil, on the wise man’s indifference, on mixture and on the destruction of the world by fire.',
    'It appeals to common human intuition as a criterion by which a philosophy may be tested.',
    'A rich source for Stoic physics and ethics, and an example of arguing from what all people naturally acknowledge — the move Paul makes in Romans 1–2.',
  ),
  'plutarch-epicurus-pleasant-life': PM(
    'A dialogue attacking the Epicurean account of happiness.',
    'An argument that the Epicurean life is not even pleasant on its own terms: it excludes the pleasures of learning and of public action, provides no consolation in adversity, and, by denying providence and survival, takes away the hopes that most gladden the mind.',
    'The closing section argues that belief in providence and in the soul’s survival is itself a source of joy that Epicureanism forfeits.',
    'The fullest ancient argument that hope beyond death makes a difference to present life — the assumption underlying 1 Corinthians 15 and 1 Thessalonians 4.',
  ),
  'plutarch-reply-to-colotes': PM(
    'A reply to a treatise by the Epicurean Colotes, who had argued that the doctrines of other philosophers make life impossible.',
    'A defence of Democritus, Parmenides, Plato, Socrates, the Cyrenaics and others against Colotes’ charges, turning the accusation back on Epicureanism itself.',
    'It preserves, in the course of the refutation, a great deal of the earlier philosophy under attack.',
    'A major source for pre-Socratic and Academic thought, and evidence for how philosophical schools polemicised against one another in the period.',
  ),
  'plutarch-live-unknown': PM(
    'A short attack on the Epicurean maxim lathe biōsas, "live unnoticed".',
    'An argument that the counsel to live unknown is self-defeating and ignoble: it withholds from others the good one might do, and its author could not have followed it without our never hearing of him.',
    'It insists that virtue is by nature communicative and that obscurity is not a moral good.',
    'A sharp counterpoint to the New Testament’s teaching on hidden almsgiving and prayer — the two positions differ instructively over what is hidden and from whom.',
  ),

  // ── The Table Talk ───────────────────────────────────────────────────────────────────
  // One summary for all nine books: getTextSummary strips a trailing book number, so
  // 'plutarch-table-talk-7' resolves here.
  'plutarch-table-talk': PM(
    'Nine books of dinner-table conversations, dedicated to Plutarch’s friend Sossius Senecio and drawn from real gatherings at Chaeronea, Athens, Rome and Delphi.',
    'Ninety-five "questions" arising over dinner, each stated and then debated by the guests: whether philosophy is a fit subject at table, why old men read better at a distance, why the sea is salt, why Jews abstain from pork, why A is the first letter, and much besides — mixed literary, scientific, medical and religious puzzles, with the arguments given rather than a verdict.',
    'The form itself carries the point: truth is pursued sociably, by people arguing in good humour, and the questions of daily life are worth serious thought.',
    'The fullest surviving picture of the ancient banquet as an occasion for structured conversation — the setting of Luke’s meal scenes and of the Corinthian gatherings Paul corrects in 1 Corinthians 11. Book 4 includes a rare pagan discussion of Jewish food laws and of the God the Jews worship.',
  ),
}
