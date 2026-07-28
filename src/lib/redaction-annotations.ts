// Tier-3 of the Synopsis compare feature: curated, pericope-level compositional-device
// annotations. Keyed by the EXACT pericope title in public/data/gospel-parallels.json
// (the key the Synopsis tab already matches anchors against), each entry names the
// narrative-level devices (see redaction-techniques.ts) that scholarship most often
// identifies in that episode, with a short classroom note.
//
// Editorial stance: notes describe what the texts observably do and how the devices
// are "often analyzed" — they present the compositional-device reading (Licona,
// following Theon/Quintilian/Plutarch) as a lens for discussion, not a verdict.
// SOURCE MODELS: both supported models assume Markan priority, so triple-tradition
// notes are shared. Where the double tradition makes the direction model-dependent,
// a note carries two wordings — `farrer` (Luke used Matthew; no Q) and `q`
// (Two-Source: Matthew and Luke independently used Q) — and the Synopsis tab's
// "Source model" toggle picks which one students see (default: Farrer). The compare
// tool itself remains direction-agnostic (any column can be the source), so either
// model is testable on screen. Hand-polish freely: this file is meant to grow
// pericope-by-pericope, like the rhetoric and gloss override sets.

import type { NarrativeDeviceName } from './redaction-techniques'

export type SourceModel = 'farrer' | 'q'
export const SOURCE_MODELS: { id: SourceModel; label: string }[] = [
  { id: 'farrer', label: 'Farrer — Luke used Matthew' },
  { id: 'q', label: 'Two-Source — Matthew & Luke used Q' },
]
export type PericopeAnnotation = { device: NarrativeDeviceName; note: string | { farrer: string; q: string } }
/** Resolve a note's text under the chosen source model. */
export const noteFor = (a: PericopeAnnotation, m: SourceModel): string =>
  typeof a.note === 'string' ? a.note : a.note[m]

export const PERICOPE_ANNOTATIONS: Record<string, PericopeAnnotation[]> = {
  'Baptism of Jesus': [
    { device: 'Transferal', note: 'The heavenly voice addresses Jesus in Mark 1:11 and Luke 3:22 ("You are my beloved Son") but speaks about him in Matt 3:17 ("This is my beloved Son") — the address appears transferred from Jesus to the bystanders, turning a private word into a public identification.' },
    { device: 'Expansion of narrative details', note: 'Matt 3:14–15 alone records John’s protest and Jesus’ reply ("to fulfill all righteousness"), expanding the scene to answer a question the bare event raises — why the sinless one accepts a baptism of repentance.' },
  ],
  'Temptation of Jesus': [
    { device: 'Compression', note: 'Mark 1:12–13 gives the whole forty days two verses and no dialogue; Matthew supplies the three-test debate, which Luke takes over. Whether Mark compressed a fuller tradition or Matthew expanded Mark’s summary, reading the two-verse account beside the full one shows how much a summary can presuppose.' },
    { device: 'Displacement', note: {
      farrer: 'Luke reorders Matthew’s sequence: Matthew climaxes on the mountain with worship refused (4:8–10), Luke re-sequences to end at the temple in Jerusalem (4:9) — where his Gospel begins and ends. A deliberate Lukan re-staging for his Jerusalem-centered design.',
      q: 'Matthew and Luke share Q’s temptation dialogue but order the last two tests differently. Most critics think Matthew preserves Q’s climax (the "Away, Satan!" dismissal caps the worship test) and Luke re-sequenced to end at the temple in Jerusalem, where his Gospel begins and ends.',
    } },
  ],
  "Centurion's servant": [
    { device: 'Transferal', note: 'In Matt 8:5–13 the centurion comes and speaks in person; in Luke 7:1–10 he sends Jewish elders and then friends, never meeting Jesus. Ancient convention heard an envoy’s words as the sender’s own speech — so if embassies stood behind the event, Matthew’s face-to-face telling is a legitimate transferal; and Luke’s staging keeps the centurion’s words his even at a distance. Either way, the tradition’s best test case for the device.' },
    { device: 'Expansion of narrative details', note: {
      farrer: 'On the Farrer view, Luke unfolds Matthew’s compact scene into two embassies, adding the elders’ testimonial ("he loves our nation and built us our synagogue") — expansion serving Luke’s persistent theme of worthy gentiles who honor Israel.',
      q: 'On the Two-Source view both drew the story from Q, and critics split over which changed the approach: Luke adding the embassies (their testimonial is thoroughly Lukan in theme) or Matthew removing them for speed. The comparison itself shows what is at stake in the choice.',
    } },
  ],
  'Gerasene demoniac': [
    { device: 'Compression', note: 'Mark 5:1–20 runs twenty verses; Matt 8:28–34 keeps seven, cutting the chains-and-tombs description, the "Legion" dialogue, and the healed man’s commission. What Matthew keeps is the exorcism and the town’s rejection.' },
    { device: 'Conflation', note: 'Matthew has two demoniacs where Mark and Luke have one (cf. the same doubling at the Jericho healing, Matt 20:30). One common analysis: Matthew conflates a second known case into the scene; another: he doubles to provide the two witnesses the Law requires.' },
  ],
  'Healing the paralytic at Capernaum': [
    { device: 'Simplification', note: 'Matt 9:1–8 omits the crowd and the roof entirely — the paralytic is simply "brought" to Jesus. Mark’s vivid dig-through-the-roof detail (Mark 2:4) is the kind of complicating circumstance simplification removes.' },
  ],
  'Daughter of Jairus': [
    { device: 'Compression', note: 'In Mark 5 and Luke 8 the girl is dying when Jairus arrives and dies during the delay, reported by messengers. Matt 9:18 compresses the two stages into one: Jairus states at the outset "my daughter has just died," and the messengers vanish. The time-course is shortened without changing the outcome.' },
  ],
  'Woman with the issue of blood': [
    { device: 'Simplification', note: 'Mark 5:26 says she "suffered much under many physicians… and grew worse"; Luke (the physician, per tradition) softens to "could not be healed by anyone," and Matthew drops the doctors altogether. Each retelling smooths a detail with less charitable implications.' },
    { device: 'Compression', note: 'Matthew tells the whole intercalated episode in three verses (9:20–22) against Mark’s eleven, cutting the disciples’ objection and the woman’s fearful confession.' },
  ],
  'Blind man near Jericho': [
    { device: 'Spotlighting', note: 'Mark alone names Bartimaeus (10:46) — a spotlight on a figure his audience may have known. Matthew has two anonymous blind men; Luke one. The named individual and the doubled pair are the same tension as at Gadara.' },
    { device: 'Displacement', note: 'Mark and Matthew place the healing as Jesus leaves Jericho; Luke 18:35 as he approaches it — a small but classic test case for how loosely ancient narrative handles itinerary details.' },
  ],
  'Cursing the fig tree': [
    { device: 'Compression', note: 'Mark 11 splits the episode over two days with the temple action sandwiched between (cursed one morning, found withered the next). Matt 21:19–20 compresses: the tree withers "at once" and the disciples marvel on the spot. Licona treats this as a parade example of compression.' },
    { device: 'Displacement', note: 'The compression entails re-placing the temple cleansing: Mark’s intercalation (fig tree – temple – fig tree) becomes Matthew’s sequential telling (temple, then fig tree whole).' },
  ],
  'Cleansing of the Temple': [
    { device: 'Displacement', note: 'John 2:13–17 sets a temple cleansing at the opening of the ministry; the Synoptics in the final week. Either John displaced the event forward for theological programmatics (the replacement of the temple), a Synoptist displaced it backward, or there were two cleansings — the classic discussion case.' },
  ],
  'Anointing at Bethany': [
    { device: 'Displacement', note: 'Mark 14:1–3 dates the anointing two days before Passover; John 12:1 six days before. One of them has moved the scene to serve his passion-week architecture — John to open the week, Mark to interlock it with Judas’ bargain.' },
    { device: 'Spotlighting', note: 'The critics of the "waste" sharpen across tellings: "some" (Mark 14:4) → "the disciples" (Matt 26:8) → "Judas Iscariot" (John 12:4). John spotlights the one whose objection mattered; the woman likewise becomes Mary of Bethany only in John.' },
  ],
  'Rejection at Nazareth': [
    { device: 'Displacement', note: 'Mark 6 and Matt 13 place the Nazareth rejection mid-ministry; Luke 4:16–30 moves it to the very front as a programmatic frontispiece — Luke 4:23 even has the crowd cite deeds "done at Capernaum" that Luke hasn’t narrated yet, a seam left by the relocation.' },
    { device: 'Expansion of narrative details', note: 'Luke alone supplies the synagogue liturgy: the Isaiah 61 reading, "today this scripture is fulfilled," and the Elijah/Elisha sermon that provokes the violence.' },
  ],
  'Calling of the first disciples': [
    { device: 'Compression', note: 'Mark 1:16–20 and Matt 4:18–22 give an instant call-and-response with no backstory; Luke 5 expands with the miraculous catch that motivates it, and John 1 recounts a prior meeting by the Jordan. The Synoptic "immediately they left their nets" may compress an acquaintance the fuller accounts unpack.' },
  ],
  "The Lord's Prayer": [
    { device: 'Displacement', note: {
      farrer: 'Matthew houses the prayer inside the Sermon on the Mount (Matt 6); Luke lifts it out and re-sets it on the journey, prompted by a disciple’s "Lord, teach us to pray" (11:1) — teaching re-homed into a scene of Jesus himself at prayer, Luke’s favorite frame.',
      q: 'Q transmitted the prayer without a narrative home; Matthew housed it in his sermon anthology, Luke in a scene of Jesus at prayer on the journey (11:1). Placement is each evangelist’s own choice — and each placement interprets.',
    } },
    { device: 'Paraphrase', note: {
      farrer: 'Luke’s form is notably shorter ("Father" for "Our Father in heaven"; no "your will be done…"). On the Farrer view, Luke has trimmed Matthew’s fuller wording — or substituted the form his own churches prayed. Either way, liturgy was already shaping the tradition’s words.',
      q: 'Luke’s shorter form ("Father"; no "your will be done…") is usually judged closer to Q, with Matthew’s fuller wording expanded in liturgical use — the reverse of the Farrer reading. This pericope is the neatest test of how the source model changes who edited whom.',
    } },
  ],
  'Commissioning the Twelve': [
    { device: 'Conflation', note: {
      farrer: 'Matthew 10 gathers all the mission teaching into one charge to the Twelve, conflating Mark’s sending (Mark 6) with further sayings; Luke — with Matthew in hand — splits the material back out: Mark’s sending of the Twelve (Luke 9) and a second sending of the Seventy-two (Luke 10) that carries Matthew’s extra sayings ("lambs among wolves," "the worker deserves his wages"). Anthology and redistribution are the same editorial freedom, running in opposite directions.',
      q: 'Matthew 10 conflates two sources into one charge — Mark’s sending of the Twelve and Q’s mission discourse — while Luke keeps them apart: Mark’s material for the Twelve (Luke 9), Q’s for the Seventy-two (Luke 10). One evangelist merged his sources; the other preserved their seams as two sendings.',
    } },
  ],
  'Mustard seed': [
    { device: 'Paraphrase', note: '"Kingdom of God" (Mark 4:30; Luke 13:18) becomes "kingdom of heaven" (Matt 13:31) — Licona’s own first example of paraphrase: same referent, reverent rewording for a Jewish audience. Mark’s "greatest of all shrubs" also grows into a "tree" in Matthew and Luke.' },
  ],
  'Exorcising at sunset': [
    { device: 'Compression', note: 'Mark 1:32 doubles the time marker ("that evening, when the sun had set") and says the "whole city" gathered while Jesus healed "many"; Matt 8:16 keeps one time marker and has him heal "all." Tightening plus totalizing is Matthew’s standard redactional signature in miracle summaries.' },
    { device: 'Simplification', note: 'The crowded doorway, the whole-city scene, and the gag on the demons all drop out of Matthew — what remains is the healing and a fulfillment citation (Isa 53:4) Matthew adds instead.' },
  ],
  'Feeding the 5000': [
    { device: 'Spotlighting', note: 'The Synoptics have "the disciples" act collectively; John 6:5–9 spotlights Philip ("where shall we buy bread?") and Andrew (the boy with the loaves) by name. Same scene, lit differently.' },
  ],
  'Walking on water': [
    { device: 'Expansion of narrative details', note: 'Matt 14:28–31 alone adds Peter’s walk and sinking — an expansion serving Matthew’s persistent interest in Peter as representative disciple ("O you of little faith").' },
    { device: 'Compression', note: 'John 6:21 ends abruptly — they willingly receive him, "and immediately the boat was at the land" — compressing the calming-and-arrival the Synoptics narrate.' },
  ],
  'Transfiguration': [
    { device: 'Paraphrase', note: '"After six days" (Mark 9:2; Matt 17:1) becomes "about eight days after these sayings" (Luke 9:28) — most likely inclusive counting plus Luke’s hedging "about": a reminder that ancient time references are routinely round, not chronometric.' },
    { device: 'Expansion of narrative details', note: 'Luke alone reports the conversation’s subject — Moses and Elijah speak of Jesus’ "exodus" at Jerusalem (9:31) — and the disciples’ heavy sleep, details that theologize the scene.' },
  ],
  'Rich young man': [
    { device: 'Paraphrase', note: '"Why do you call me good? No one is good but God alone" (Mark 10:18) is reworded in Matt 19:17 as "Why do you ask me about what is good?" — a much-discussed paraphrase that preserves the pointer to God’s unique goodness while heading off a possible mishearing (that Jesus disclaimed goodness).' },
  ],
  'Peter denies Jesus': [
    { device: 'Spotlighting', note: 'The challengers differ in every account — one servant girl twice (Mark), two different girls (Matt), a girl then two men (Luke), a doorkeeper and bystanders (John). Each evangelist spotlights different faces in the courtyard crowd; the three denials before cockcrow stay fixed.' },
    { device: 'Simplification', note: 'Mark alone has two cock-crows (14:30, 72); Matthew, Luke, and John simplify to one. The simpler version keeps the prophecy-and-fulfillment structure while shedding a counting detail.' },
  ],
  'The empty tomb': [
    { device: 'Spotlighting', note: 'Luke 24:12 has Peter alone run to the tomb; John 20:3–8 has Peter and the beloved disciple. Luke appears to hold the spotlight on Peter — note his plural "some of those with us went to the tomb" at 24:24, which concedes company the earlier verse doesn’t mention.' },
    { device: 'Simplification', note: 'One angelic figure in Mark and Matthew; two in Luke and John. On the usual analysis the fuller cast is original and the single-messenger accounts spotlight the speaker — mentioning one is not denying two.' },
  ],
  'Women at the tomb': [
    { device: 'Spotlighting', note: 'John 20:1 names only Mary Magdalene, yet her report in 20:2 says "WE do not know where they have laid him" — a seam showing the other women present in the Synoptic lists have been left offstage rather than denied.' },
  ],

  // ── Infancy and Galilean ministry ─────────────────────────────────────────
  'Genealogy of Jesus': [
    { device: 'Compression', note: 'Matt 1:8 jumps from Joram to Uzziah, omitting three kings (Ahaziah, Joash, Amaziah), and 1:11 skips Jehoiakim — compression in service of the 3×14 design Matthew announces at 1:17 (fourteen is the numerical value of "David" in Hebrew). "Father of" in ancient genealogies happily means "ancestor of."' },
  ],
  'Birth of Jesus': [
    { device: 'Spotlighting', note: {
      farrer: 'Matthew narrates the nativity entirely through Joseph (his dilemma, his dreams, his decisions); Luke through Mary (the annunciation, the Magnificat, "Mary treasured these things"). On the Farrer view, Luke writes with Matthew’s Joseph-centered account in view and deliberately complements it — two spotlights on one event, each omitting nearly everything the other tells without contradicting it.',
      q: 'Matthew narrates the nativity entirely through Joseph; Luke through Mary. On the Two-Source view the infancy narratives are independent (Q held sayings, not birth stories) — which makes their complementary spotlights the more striking: two tellings of one event that barely overlap, yet converge on Bethlehem, the virgin conception, and the name.',
    } },
  ],
  'Return to Nazareth': [
    { device: 'Compression', note: {
      farrer: 'Luke 2:39 moves the family straight from the temple to Nazareth ("when they had performed everything according to the Law… they returned"); Matthew narrates magi, Egypt, and Archelaus in between. On the Farrer view Luke knew that material and compressed over it — a compressed account is silent, not exclusive.',
      q: 'Luke 2:39 moves the family straight from the temple to Nazareth; Matthew narrates magi, Egypt, and Archelaus in between. On the Two-Source view the accounts are independent: Luke’s summary simply does not cover the interval Matthew fills — silence, not exclusion, either way.',
    } },
  ],
  'Ministry of John the Baptist': [
    { device: 'Transferal', note: {
      farrer: 'The "brood of vipers" speech targets the Pharisees and Sadducees in Matt 3:7 but "the crowds" in Luke 3:7. On the Farrer view, Luke has re-aimed Matthew’s leadership polemic at everyone — universalizing the call to repentance, as he habitually does.',
      q: 'The "brood of vipers" speech targets the Pharisees and Sadducees in Matt 3:7 but "the crowds" in Luke 3:7. Q’s speech had one audience; either Matthew sharpened it against the leadership (his habit) or Luke universalized it (his habit) — a small case where each evangelist’s known tendencies pull in opposite directions.',
    } },
    { device: 'Expansion of narrative details', note: 'Luke 3:10–14 alone adds the crowd’s, tax collectors’, and soldiers’ "What then shall we do?" exchanges; John’s Gospel recasts the whole ministry as the Baptist’s self-testimony under official interrogation (John 1:19–28).' },
  ],
  'Return to Galilee': [
    { device: 'Compression', note: 'Mark 1:14 and Matt 4:12 step directly from John’s arrest to Galilee, compressing out the early Judean ministry that John 1–4 narrates (John 3:24 explicitly notes John "had not yet been put in prison" during it). The Synoptic jump is a time-compression, not a denial of the interval.' },
  ],
  'Exorcism at Capernaum': [
    { device: 'Simplification', note: 'Mark 1:26 has the demon "convulsing" (σπαράξαν) the man as it leaves; Luke 4:35 writes "having thrown him down… it came out without harming him" — softening the violence and adding the reassurance. Luke’s medical sensitivity is a running redactional trait worth tracking.' },
  ],
  'Beatitudes': [
    { device: 'Paraphrase', note: {
      farrer: '"Blessed are the poor in spirit" (Matt 5:3, third person) becomes "Blessed are you poor" (Luke 6:20, direct address). On the Farrer view Luke has sharpened Matthew — de-spiritualizing the poverty (consistent with his Gospel’s economics), trimming nine beatitudes to four, and matching them with four woes.',
      q: '"Blessed are you poor" (Luke 6:20) beside "Blessed are the poor in spirit" (Matt 5:3): on the Two-Source view Luke’s blunt second-person form is usually judged closer to Q, with Matthew interpreting — "in spirit" spelling out a spiritual poverty his community could own. The classic case for studying how wording sets a saying’s scope.',
    } },
    { device: 'Displacement', note: {
      farrer: 'Matthew stages the sermon "on the mountain" (5:1), with new-Sinai overtones; Luke restages it "on a level place" (6:17) after a night of prayer on the mountain — deliberate Lukan re-staging, not a disagreement about geography.',
      q: 'Q transmitted the sermon’s sayings without scenery; Matthew staged them "on the mountain" (new Sinai), Luke "on a level place" after a night of prayer. Each evangelist built the stage his theology called for.',
    } },
  ],
  'Expounding the Law': [
    { device: 'Conflation', note: {
      farrer: 'The Sermon on the Mount is Matthew’s composed anthology — teaching gathered into one programmatic discourse, as ancient biographers grouped material topically. Luke, with Matthew in hand, redistributes much of it (6:29–36; 12:57–59; 16:18) into his journey narrative, re-homing each saying where his story needs it. Anthology and dispersal are the same freedom in opposite directions.',
      q: 'Much of Matt 5 appears scattered across Luke (6:29–36; 12:57–59; 16:18). On the Two-Source view Matthew anthologized Q’s sayings into one programmatic sermon while Luke largely kept Q’s scattered arrangement — so whether the Sermon on the Mount was assembled or dismembered is exactly what the source models dispute.',
    } },
  ],
  'Lamp under a bushel': [
    { device: 'Displacement', note: 'The same lamp saying serves three homes: the disciples as world-light (Matt 5:14–15), the purpose of parables (Mark 4:21), and the hearing of the word (Luke 8:16). Short sayings were portable — evangelists (and Jesus himself, itinerantly) re-homed them where they served.' },
  ],
  'Birds of the air / do not worry': [
    { device: 'Paraphrase', note: {
      farrer: 'Matt 6:26 "birds of the air… your heavenly Father feeds them" becomes Luke 12:24 "consider the ravens… God feeds them" — Luke sharpening Matthew with an unclean scavenger: if God feeds even ravens, how much more you. Matthew’s "heavenly Father" stays behind as his sermon’s signature idiom.',
      q: 'Matt 6:26 has "birds of the air… your heavenly Father"; Luke 12:24 "consider the ravens… God." Luke’s unclean scavenger is often judged Q’s original (the harder image), generalized by Matthew — though "heavenly Father" is so Matthean that each wording bears its author’s fingerprints either way.',
    } },
  ],
  'Discourse on judging': [
    { device: 'Paraphrase', note: {
      farrer: 'The speck-and-log saying is nearly verbatim between Matt 7:3–5 and Luke 6:41–42 — agreement so close in the Greek that it is best explained by direct copying: Luke transcribing Matthew. Run compare mode here to watch literary dependence with your own eyes.',
      q: 'The speck-and-log saying is nearly verbatim between Matt 7:3–5 and Luke 6:41–42 — on the Two-Source view, both evangelists copying Q almost untouched. Run compare mode here to see how faithfully a written source could be transmitted when neither author had reason to change it.',
    } },
  ],
  'A tree and its fruit': [
    { device: 'Displacement', note: {
      farrer: 'Matthew deploys the fruit-test twice — against false prophets (7:15–20) and against the Pharisees (12:33–35); Luke 6:43–45 folds the two applications back into one generic teaching. A doublet inside one Gospel is direct evidence of an evangelist re-applying a saying to new targets.',
      q: 'Matthew deploys Q’s fruit-test twice — against false prophets (7:15–20) and the Pharisees (12:33–35) — while Luke gives it once, generically (6:43–45), likely as Q had it. Matthew’s doublet is direct evidence of an evangelist re-applying a source’s saying to new targets.',
    } },
  ],
  'Wise and foolish builders': [
    { device: 'Paraphrase', note: {
      farrer: 'Matthew’s builder chooses rock over sand and faces rain, floods, and wind; Luke redraws the scene — a foundation dug down to rock against a river’s torrent (6:48), plausibly for readers outside Palestine — while the two-hearer punchline structure stands untouched.',
      q: 'Matthew’s rock-versus-sand storm scene and Luke’s dug foundation against a river torrent (6:48) are two renderings of Q’s closing parable; whose scenery is Q’s is debated, but the redrawn staging around a fixed structure is paraphrase either way.',
    } },
  ],
  'Cleansing a leper': [
    { device: 'Simplification', note: 'Mark’s Jesus is stirred with strong emotion (1:41; some manuscripts read "moved with anger") and "sternly charged" the man, who then disobeys and broadcasts the healing (1:45). Matthew and Luke drop the emotions and the disobedience — smoothing details that invite hard questions.' },
    { device: 'Compression', note: 'Matt 8:1–4 keeps the encounter and the command to the priest but cuts Mark’s aftermath entirely, ending on the pronouncement — a pronouncement-story shape Matthew prefers for miracle accounts.' },
  ],
  "Healing Peter's mother-in-law": [
    { device: 'Spotlighting', note: 'In Mark 1:30 the household "told him about her" and in Luke "they appealed to him"; Matt 8:14 removes the intermediaries — Jesus sees, touches, heals. Matthew regularly trims the supporting cast until only Jesus and the sufferer remain in the light.' },
    { device: 'Paraphrase', note: 'Mark: he "raised her up, taking her by the hand"; Luke 4:39: he "rebuked the fever," treating it almost as a hostile power — each retelling colors the same cure with its own theology of healing.' },
  ],
  'Calming the storm': [
    { device: 'Paraphrase', note: 'The disciples’ cry mutates tellingly: "Teacher, do you not care that we are perishing?" (Mark 4:38) → "Save us, Lord; we are perishing" (Matt 8:25) → "Master, Master, we are perishing" (Luke 8:24). Matthew turns Mark’s reproach of Jesus into a prayer — paraphrase doing pastoral work.' },
    { device: 'Simplification', note: 'Matthew also drops Mark’s "just as he was" and the other boats, and moves Jesus’ rebuke of the disciples BEFORE the miracle — softening the scene’s disorder and the disciples’ irreverence in one stroke.' },
  ],
  'Calling of Matthew': [
    { device: 'Transferal', note: 'Mark 2:14 and Luke 5:27 call the tax collector "Levi"; Matt 9:9 calls him "Matthew," matching the apostolic list (10:3 "Matthew the tax collector"). If one man bore both names, no device is present; if not, the First Gospel has transferred the call scene — the double name is exactly why this pericope repays close comparison.' },
  ],
  'New wine into old wineskins': [
    { device: 'Expansion of narrative details', note: 'Luke 5:39 alone appends "no one after drinking old wine desires new, for he says, ‘The old is good’" — a wry expansion that complicates the parable’s point and is hard to explain as anyone’s invention but preserved tradition or Luke’s own literary shaping.' },
  ],
  'Not peace but a sword': [
    { device: 'Paraphrase', note: '"I have not come to bring peace, but a sword" (Matt 10:34) stands beside "but rather division" (Luke 12:51). Whether Luke read the saying in Matthew (Farrer) or in Q, the direction is the same: the harder metaphor is unpacked into plain speech — and Luke prefixes the fire-and-baptism sayings Matthew lacks. An image being interpreted in transmission.' },
  ],
  'Messengers from John the Baptist': [
    { device: 'Expansion of narrative details', note: 'Luke 7:21 adds that "in that hour" Jesus performed healings before the messengers’ eyes, turning "tell John what you hear and see" (Matt 11:4) into an enacted demonstration. Whether Luke found the exchange in Matthew (Farrer) or in Q, he has staged as proof what his source left as report.' },
  ],
  'Lord of the Sabbath': [
    { device: 'Simplification', note: 'Mark 2:26 sets the shewbread episode "when Abiathar was high priest" — but 1 Sam 21 names Ahimelech, Abiathar’s father. Matthew and Luke both silently drop the name. Watching two evangelists independently remove a difficulty is redaction criticism at its most visible.' },
    { device: 'Expansion of narrative details', note: 'Matt 12:5–7 alone adds the temple-priests argument and the Hosea 6:6 citation ("I desire mercy, not sacrifice") — expansion that converts a precedent-claim into a full halakhic case.' },
  ],
  'Man with a withered hand': [
    { device: 'Transferal', note: 'In Mark 3:4 and Luke 6:9 Jesus poses the lawfulness question; in Matt 12:10 the opponents ask it ("Is it lawful to heal on the Sabbath?" — so that they might accuse him). The question has changed mouths, recasting who sets the trap.' },
    { device: 'Expansion of narrative details', note: 'Matthew adds the sheep-in-a-pit argument (12:11–12), grounding the healing in an a-fortiori appeal his hearers already granted.' },
  ],
  'Exorcising a blind and mute man': [
    { device: 'Displacement', note: 'Matthew tells this exorcism twice — 9:32–34 and 12:22–24 — a doublet framing two different discourses, while Mark 3 attaches the Beelzebul charge to no exorcism at all. The controversy material was clearly detachable from its narrative trigger and was re-homed as each Gospel’s architecture required.' },
  ],
  'Strong man parable': [
    { device: 'Paraphrase', note: 'Mark 3:27’s compact burglar image ("no one can plunder the strong man’s house unless he first binds him") becomes in Luke 11:21–22 an armed palace guarded until "one stronger than he" strips his armor and divides the spoil — the same logic, elaborated toward Isaiah 53:12’s language of dividing spoils.' },
  ],
  'The unforgivable sin': [
    { device: 'Displacement', note: 'Mark 3:28–29 and Matt 12:31–32 anchor the blasphemy saying to the Beelzebul accusation ("because they said, ‘He has an unclean spirit’"); Luke 12:10 relocates it into teaching on confessing the Son of Man under persecution. The new home changes what the warning most naturally means — a prime exhibit for how placement is interpretation.' },
  ],
  "Jesus' true relatives": [
    { device: 'Simplification', note: 'Mark 3:21 has Jesus’ family set out to seize him, saying "He is out of his mind" — perhaps the hardest family notice in the Gospels. Matthew and Luke both omit it, keeping only the arrival and the "whoever does God’s will" pronouncement. The most discussed softening in the Synoptic tradition.' },
  ],
  'Parable of the Sower': [
    { device: 'Paraphrase', note: 'The harvest climbs thirty-sixty-hundredfold in Mark 4:8 but descends hundred-sixty-thirty in Matt 13:8; Luke 8:8 keeps only "a hundredfold." Ordering and selection of the same figures — paraphrase at the level of rhetorical build.' },
    { device: 'Compression', note: 'Luke’s whole telling is the leanest (one yield figure, no sun-scorching detail), compressing the parable while preserving every soil.' },
  ],
  'Leaven': [
    { device: 'Paraphrase', note: 'Matt 13:33 and Luke 13:20–21 agree almost word-for-word ("leaven… three measures of flour… all leavened") — agreement this close means direct copying: Luke transcribing Matthew (Farrer) or both transcribing Q (Two-Source). Either way, a specimen of how stable a written saying could remain when no one had reason to change it.' },
  ],
  'Beheading of John the Baptist': [
    { device: 'Compression', note: 'Luke 9:7–9 reduces Mark’s banquet narrative (Herodias, the dance, the oath, the platter — Mark 6:21–29) to Herod’s puzzled retrospect: "John I beheaded, but who is this?" The whole grisly episode survives only as a flashback clause.' },
    { device: 'Simplification', note: 'Mark’s Herod fears, protects, and gladly hears John (6:19–20), executing him only when trapped; Matt 14:5 flattens the psychology — Herod "wanted to put him to death" but feared the crowd. Fewer moving parts, starker villain.' },
  ],
  'Healing at Gennesaret': [
    { device: 'Compression', note: 'Matt 14:34–36 halves Mark’s summary (6:53–56), dropping the marketplaces and the region-wide running to-and-fro while keeping the fringe-of-the-garment detail and adding his signature totality: "as many as touched it were made well."' },
  ],
  'Discourse on defilement': [
    { device: 'Simplification', note: 'Mark 7:19 closes the saying with the editorial bombshell "(Thus he declared all foods clean)". Matthew, writing for a Torah-observant audience, has no such gloss and instead ends "to eat with unwashed hands does not defile" (15:20) — trimming the radical inference back to the original controversy about handwashing.' },
    { device: 'Compression', note: 'Matthew also compresses Mark’s double explanation (crowd + house scene) and drops the parade of vices to a shorter list — tightening a sprawling discourse into his usual disputation shape.' },
  ],
  "Canaanite woman's daughter": [
    { device: 'Paraphrase', note: 'Mark’s "Syrophoenician by birth" (7:26) becomes Matthew’s archaizing "Canaanite" (15:22) — one word recasting the encounter as Israel-meets-Canaan, with all its biblical freight.' },
    { device: 'Expansion of narrative details', note: 'Matthew expands the dialogue: the disciples beg him to send her away, Jesus states "I was sent only to the lost sheep of the house of Israel," and the woman kneels with "Lord, help me" (15:23–25) — three beats absent from Mark that heighten both the obstacle and the faith that overcomes it.' },
  ],
  'Feeding the 4000': [
    { device: 'Conflation', note: 'The standing question here runs the other way: is this a second event or a doublet of the 5000 told twice in different (gentile?) dress? Mark and Matthew clearly treat them as two — Jesus himself counts baskets from both (Mark 8:19–20) — so whatever the tradition-history, the evangelists refused to conflate them. Compare the two feedings side by side to see why the question arises.' },
  ],

  // ── Toward Jerusalem, passion, and resurrection ───────────────────────────
  'Confession of Peter': [
    { device: 'Expansion of narrative details', note: 'Matt 16:17–19 alone adds the blessing of Simon — "flesh and blood has not revealed this… on this rock I will build my church" — expanding Mark’s terse confession-and-silencing (8:29–30) into the charter text of Petrine ministry. Luke meanwhile drops the location and adds his signature note that Jesus "was praying alone" (9:18).' },
  ],
  'Boy possessed by a demon': [
    { device: 'Compression', note: 'Mark spends sixteen verses (9:14–29); Matthew eight, Luke seven. Gone in the shorter tellings: the arguing scribes, the boy’s case history, and the father’s "I believe; help my unbelief!" (Mark 9:24) — a reminder that compression has costs, since that lost sentence is many readers’ favorite in Mark.' },
    { device: 'Simplification', note: 'Mark’s two-stage ending (the boy "like a corpse… but Jesus took him by the hand and lifted him") is smoothed to an instant cure in Matt 17:18 ("the boy was healed from that hour").' },
  ],
  'The greatest / little children': [
    { device: 'Simplification', note: 'In Mark 9:33–34 Jesus asks what they were discussing and the disciples fall silent, ashamed — they had argued over rank. Matt 18:1 reframes: the disciples openly ask "Who is the greatest in the kingdom?" The embarrassing quarrel becomes a theological question; the Twelve come off cleaner in the retelling.' },
  ],
  'Parable of the Lost Sheep': [
    { device: 'Displacement', note: {
      farrer: 'Matt 18:10–14 houses the parable in church instruction about "little ones" who stray; Luke 15:4–7 re-homes it against Pharisees grumbling over sinners ("joy in heaven over one sinner who repents"). On the Farrer view Luke lifted Matthew’s community parable into his great lost-and-found chapter — placement supplying a sharper moral.',
      q: 'Luke 15:4–7 aims the parable at Pharisees grumbling over sinners; Matt 18:10–14 at church care for straying "little ones." On the Two-Source view Luke’s sinner-setting is usually judged closer to Q, with Matthew ecclesializing the parable for community discipline. Same shepherd, two flocks — placement supplies the moral.',
    } },
  ],
  'Divorce and celibacy': [
    { device: 'Paraphrase', note: 'Mark 10:11–12 envisages either spouse divorcing (a Roman-law scenario); Matt 19:9 speaks only of the husband and adds the exception clause "except for sexual immorality" — the wording of one saying adapted to two legal worlds, and the most consequential paraphrase debate in the Gospels.' },
    { device: 'Expansion of narrative details', note: 'Matt 19:10–12 alone appends the disciples’ shocked "better not to marry" and the eunuch-for-the-kingdom saying — expansion that turns a controversy story into teaching on celibacy.' },
  ],
  'Jesus predicts his death': [
    { device: 'Paraphrase', note: 'The third prediction grows in precision: Mark 10:34 has mocking, spitting, flogging, killing; Matt 20:19 names crucifixion; Luke 18:31 adds "everything written by the prophets will be accomplished" and notes the disciples understood none of it. John 12:23–33 recasts the whole theme as the hour of glorification and being "lifted up."' },
  ],
  'Son of Man came to serve': [
    { device: 'Transferal', note: 'In Mark 10:35 James and John request the thrones themselves; in Matt 20:20 their MOTHER kneels to ask. Either Matthew shields the apostles by transferring the ambition, or he preserves the family lobbying Mark abbreviates — the debate is the device in miniature (Jesus’ answer stays addressed to the brothers in both: "You [plural] do not know what you are asking").' },
    { device: 'Displacement', note: 'Luke has no Zebedee scene here; his rank-dispute and "I am among you as one who serves" appear at the Last Supper table (22:24–27) — service teaching relocated to the meal that enacts it.' },
  ],
  'Triumphal entry (Palm Sunday)': [
    { device: 'Expansion of narrative details', note: 'Matthew quotes Zech 9:9 outright and alone has two animals — "a donkey, and a colt with her… he sat on them" (21:7) — usually analyzed as expansion matching the citation’s poetic parallelism. Luke instead expands the descent with Jesus weeping over Jerusalem (19:41–44).' },
    { device: 'Paraphrase', note: 'The acclamation is retuned per audience: "Hosanna" (Mark/Matt), "glory in the highest" with no Aramaic (Luke 19:38, echoing his nativity angels), "the King of Israel" (John 12:13). Same shout, four scripts.' },
  ],
  'Authority questioned': [
    { device: 'Paraphrase', note: 'This controversy runs nearly word-for-word across all three Synoptics — question, counter-question about John’s baptism, the leaders’ trapped reasoning, "neither will I tell you." Turn on compare mode here to see how fixed a controversy dialogue could be; the variation is almost all connective tissue.' },
  ],
  'Wicked husbandmen': [
    { device: 'Transferal', note: 'In Mark 12:9 and Luke 20:16 Jesus pronounces the owner’s verdict himself; in Matt 21:41 the HEARERS answer — "He will put those wretches to a miserable death" — condemning themselves out of their own mouths. The verdict has been transferred to the audience, a rhetorically sharper staging.' },
    { device: 'Expansion of narrative details', note: 'Matthew alone adds the application "the kingdom of God will be taken away from you and given to a people producing its fruits" (21:43), making the parable’s target explicit.' },
  ],
  'Great Banquet': [
    { device: 'Paraphrase', note: {
      farrer: 'Matt 22 tells of a king’s wedding feast, murdered envoys, and a burned city; Luke 14 of a man’s dinner, insulting excuses, and the poor compelled in. On the Farrer view Luke has reworked Matthew’s allegory-heavy version back toward table-fellowship realism — paraphrase at maximum stretch (unless two similar parables were told on different occasions).',
      q: 'Luke 14’s dinner with excuses and Matt 22’s royal wedding with murdered envoys and a burned city are two very free renderings of one banquet parable — on the Two-Source view, Matthew allegorizing Q toward Jerusalem’s fate while Luke stays nearer the table. Paraphrase at maximum stretch (unless two parables lie behind the two texts).',
    } },
    { device: 'Conflation', note: 'Matt 22:11–14 (the guest without a wedding garment) reads like a second parable spliced onto the first — a seam most commentators mark as Matthean conflation of related banquet material.' },
  ],
  'Render unto Caesar': [
    { device: 'Paraphrase', note: 'Another near-verbatim controversy: the flattery, the denarius, "whose image and inscription?", and the punchline agree closely across the Synoptics, with only the framing spies (Luke 20:20) and exit lines varying. A good control case — the tradition could transmit tightly when it chose.' },
  ],
  'Woes to the Pharisees': [
    { device: 'Conflation', note: 'Matthew 23 is a composed indictment: woes that Luke distributes across a dinner scene (Luke 11:37–52) plus Mark’s short warning against the scribes (12:38–40) are gathered into one climactic temple discourse. Compare Luke’s table setting to watch the same woes serve a different dramatic frame.' },
    { device: 'Displacement', note: {
      farrer: 'Mark 12:38–40’s short warning against the scribes is the seed; Matthew grows it into the seven woes of chapter 23, and Luke — using both — keeps Mark’s warning in place (20:45–47) while re-staging Matthew’s woes at an earlier Pharisee’s dinner (11:37–52). Two inheritances, two homes.',
      q: 'Luke keeps his sources apart: Mark’s short warning stays in the temple (20:45–47) and Q’s woes are staged at a Pharisee’s dinner (11:37–52); Matthew merges both into the single temple indictment of chapter 23. One evangelist conflated his sources, the other preserved their separate settings.',
    } },
  ],
  "The widow's mite": [
    { device: 'Compression', note: 'Luke 21:1–4 tightens Mark 12:41–44: the summoned disciples disappear, and Mark’s explanation for Roman readers ("two lepta, which make a quadrans") drops out. Nothing is added; the scene is simply pared to its pronouncement.' },
  ],
  'Olivet Discourse / Second Coming': [
    { device: 'Paraphrase', note: 'Mark 13:14’s cipher "the abomination of desolation standing where he ought not (let the reader understand)" becomes in Luke 21:20 "when you see Jerusalem surrounded by armies" — the Danielic riddle decoded for gentile readers. The clearest large-scale case of interpretive paraphrase in the tradition.' },
    { device: 'Expansion of narrative details', note: 'Matthew extends the discourse with a parable block (the thief, the virgins, the talents, the sheep and goats — chs. 24:37–25:46) that Mark lacks and Luke scatters elsewhere: expansion by anthology.' },
  ],
  'Budding fig tree': [
    { device: 'Paraphrase', note: 'A tight triple-tradition saying; Luke’s one audible touch is "the fig tree and ALL the trees" (21:29) — generalizing Judea’s signature tree for readers who may never have seen one. Small-bore paraphrase with an audience rationale.' },
  ],
  'Faithful servant': [
    { device: 'Displacement', note: 'Matthew keeps the watchful-servant material inside the Olivet discourse (24:42–51); Luke places it mid-journey with Peter asking "Lord, are you telling this parable for us or for all?" (12:41). One saying-cluster, two narrative homes and two audiences.' },
    { device: 'Expansion of narrative details', note: 'Luke 12:47–48 adds the graded beatings ("many blows… few blows… to whom much was given") — an expansion on responsibility proportional to knowledge that Matthew lacks.' },
  ],
  'Talents / Minas': [
    { device: 'Paraphrase', note: {
      farrer: 'Matthew’s three servants receive vast, unequal talents; Luke’s ten receive one mina each. On the Farrer view Luke has reworked Matthew’s parable wholesale — sums, cast, and returns all changed while the plot skeleton (entrusting, reckoning, the fearful servant’s cloth) holds. A case study in how much surface a parable could shed in retelling.',
      q: 'Matthew’s talents and Luke’s minas diverge so far — sums, cast, returns — that on the Two-Source view critics debate whether one Q parable lies behind both or the versions reached the evangelists separately. Either way the fixed skeleton under the shifting surface is the lesson: plot travels, wording doesn’t have to.',
    } },
    { device: 'Conflation', note: 'Luke’s version interleaves a throne-claimant plot — citizens hating the nobleman, an embassy, executions on his return (19:12,14,27), echoing Archelaus’ journey to Rome — widely read as a second parable conflated with the minas story.' },
  ],
  "Judas' bargain": [
    { device: 'Expansion of narrative details', note: 'Mark 14:11 says only that the priests promised money; Matt 26:15 fixes the sum at thirty pieces of silver (with Zech 11:12 in the background), and Luke 22:3 supplies the darkest motive-note in the tradition: "Satan entered into Judas." Each expansion answers a different why.' },
  ],
  'Last Supper': [
    { device: 'Paraphrase', note: 'The institution words descend in two liturgical streams: "this is my blood of the covenant, poured out for many" (Mark 14:24/Matt 26:28, Matthew adding "for the forgiveness of sins") beside "this cup… the new covenant in my blood" (Luke 22:20, with Paul in 1 Cor 11:25). Worship communities were already shaping the wording before the Gospels were written.' },
    { device: 'Displacement', note: 'John sets the meal "before the feast of the Passover" (13:1) with the crucifixion on preparation day (19:14), while the Synoptics present a Passover meal — the most argued chronological displacement in the Gospels, whether John moved the death to the hour the lambs were slain or the Synoptics folded the meal into Passover.' },
  ],
  "Peter's denial predicted": [
    { device: 'Displacement', note: 'Mark 14:27–31 and Matthew place the prediction on the walk to Gethsemane; Luke 22:31–34 and John 13:36–38 set it at the supper table. One tradition, two stagings — and Luke’s table version carries the unique "Satan demanded to sift you… I have prayed for you" saying.' },
    { device: 'Simplification', note: 'Mark alone has "before the rooster crows TWICE" (14:30); the others say simply "before the rooster crows." The fulfillment scene keeps score accordingly — a small case of the tradition shedding a counting detail while the prophecy-fulfillment frame stands.' },
  ],
  'Gethsemane': [
    { device: 'Compression', note: 'Mark and Matthew narrate three prayer-cycles with three returns to sleeping disciples; Luke 22:39–46 compresses to a single cycle framed by "pray that you may not enter into temptation." John has no agony scene at all — its echo sounds earlier, at 12:27 ("Now is my soul troubled…").' },
    { device: 'Expansion of narrative details', note: 'Luke 22:43–44 (the strengthening angel and sweat "like great drops of blood") is expansion with an asterisk: the verses are double-bracketed in NA28, absent from many early witnesses — a place where textual criticism and redaction criticism meet.' },
  ],
  'Kiss of Judas': [
    { device: 'Paraphrase', note: 'Jesus’ word at the kiss differs in each telling: silence (Mark), "Friend, do what you came for" (Matt 26:50), "Judas, would you betray the Son of Man with a kiss?" (Luke 22:48). Each evangelist scripts the moment’s meaning; none contradicts the gesture.' },
    { device: 'Spotlighting', note: 'John omits the kiss entirely: Jesus steps forward, asks "Whom do you seek?", and his "I am he" fells the arresting party (18:4–6). The spotlight swings from Judas’ treachery to Jesus’ sovereignty — John narrates an arrest that Jesus conducts.' },
  ],
  'Arrest of Jesus': [
    { device: 'Spotlighting', note: 'All four report the severed ear; only John names the swordsman (Peter) and the servant (Malchus, 18:10). The Synoptics’ anonymous "one of those standing by" may be protective anonymity while participants lived — John, writing later, can turn the lights on.' },
    { device: 'Expansion of narrative details', note: 'Luke 22:51 alone adds "and he touched his ear and healed him" — the tradition’s only healing of an enemy in the act of arresting Jesus, and a thoroughly Lukan touch.' },
  ],
  'Sanhedrin trial': [
    { device: 'Compression', note: 'Mark and Matthew narrate a night session plus a morning consultation; Luke 22:66 compresses to one morning hearing. John displaces further: an informal interrogation before Annas (18:12–24), with the decisive council held weeks earlier (11:47–53).' },
    { device: 'Paraphrase', note: 'The climactic answer shifts: "I am" (Mark 14:62) → "You have said so" (Matt 26:64) → split questions with "You say that I am" (Luke 22:67–70). Whether Matthew’s idiom is affirmation-with-reserve, and why Mark is boldest, is a classic seminar hour.' },
  ],
  'Jesus before Pilate': [
    { device: 'Expansion of narrative details', note: 'Each evangelist expands Mark’s spare hearing differently: Matthew adds Pilate’s wife’s dream and the handwashing (27:19,24), Luke inserts the transfer to Herod Antipas (23:6–12), John unfolds the inside/outside drama and the "What is truth?" dialogue (18:33–38). Comparing them shows four authors filling the same silence with their own emphases.' },
  ],
  'Carrying the cross': [
    { device: 'Spotlighting', note: 'The Synoptics have Simon of Cyrene carry the cross; John 19:17 says Jesus went out "bearing the cross by himself." John’s spotlight (and perhaps a glance at Isaac carrying the wood, Gen 22:6) holds on Jesus alone — while Mark’s naming of Simon’s sons Alexander and Rufus (15:21) spotlights men his readers evidently knew.' },
    { device: 'Expansion of narrative details', note: 'Luke 23:27–31 alone adds the daughters of Jerusalem and the green-wood saying — an expansion that turns the road to the cross into one last prophetic oracle over the city.' },
  ],
  'Crucifixion': [
    { device: 'Paraphrase', note: 'The titulus reads differently in all four Gospels ("The King of the Jews," Mark 15:26; "This is Jesus, the King of the Jews," Matt; "This is the King of the Jews," Luke; "Jesus of Nazareth, the King of the Jews," John) — four paraphrases of one placard, and the tidiest proof that verbatim precision was not the ancients’ standard of truthfulness.' },
    { device: 'Spotlighting', note: 'Each evangelist selects different words from the cross: the cry of dereliction (Mark/Matt), the three prayers of mercy and trust (Luke), the three words of completion (John). And Mark/Matt have both bandits revile Jesus where Luke 23:39–43 spotlights the one who turned — selection and spotlight, not contradiction, on the usual analysis.' },
  ],
  'Resurrection appearances': [
    { device: 'Spotlighting', note: 'John 20:14–16 gives Mary Magdalene alone the first appearance ("Mary." — "Rabboni!"), where Matt 28:9 has "the women" meet him together. One account spotlights the named witness; note that Mark 16:9–11 here belongs to the Longer Ending, absent from the earliest manuscripts — flag that for students before building on it.' },
  ],
  'Appearance to the apostles': [
    { device: 'Expansion of narrative details', note: 'Luke 24:36–43 expands the appearance with flesh-and-bones proofs — "touch me and see," the broiled fish eaten before them — answering the suspicion that they saw a spirit. John 20:19–20 keeps the locked doors and the wounds; each expansion serves its Gospel’s argument about the risen body.' },
  ],
  'Great Commission': [
    { device: 'Compression', note: 'Read straight through, Luke 24 seems to run from Easter evening to the ascension in one day — yet Acts 1:3 (same author) spreads the appearances over forty days. Luke compressed his Gospel’s ending and decompressed it in Acts: the tradition’s single clearest self-attested case of deliberate compression.' },
    { device: 'Displacement', note: 'Matthew’s commission is on a Galilean mountain (28:16); Luke keeps everything in and around Jerusalem, as his two-volume geography requires. Each evangelist stages the sending where his book’s architecture points.' },
  ],
  'Ascension': [
    { device: 'Compression', note: 'Luke 24:50–53 narrates the ascension as if on Easter day; Acts 1:9–11 dates it forty days later with a cloud, two men in white, and the promise of return. Same author, same event, two time-scales and two levels of detail — the interpretive key Licona presses for reading Gospel chronology generally.' },
  ],
}
