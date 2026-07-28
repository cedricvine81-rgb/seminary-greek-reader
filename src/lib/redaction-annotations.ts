// Tier-3 of the Synopsis compare feature: curated, pericope-level compositional-device
// annotations. Keyed by the EXACT pericope title in public/data/gospel-parallels.json
// (the key the Synopsis tab already matches anchors against), each entry names the
// narrative-level devices (see redaction-techniques.ts) that scholarship most often
// identifies in that episode, with a short classroom note.
//
// Editorial stance: notes describe what the texts observably do and how the devices
// are "often analyzed" — they present the compositional-device reading (Licona,
// following Theon/Quintilian/Plutarch) as a lens for discussion, not a verdict.
// Hand-polish freely: this file is meant to grow pericope-by-pericope, like the
// rhetoric and gloss override sets.

import type { NarrativeDeviceName } from './redaction-techniques'

export type PericopeAnnotation = { device: NarrativeDeviceName; note: string }

export const PERICOPE_ANNOTATIONS: Record<string, PericopeAnnotation[]> = {
  'Baptism of Jesus': [
    { device: 'Transferal', note: 'The heavenly voice addresses Jesus in Mark 1:11 and Luke 3:22 ("You are my beloved Son") but speaks about him in Matt 3:17 ("This is my beloved Son") — the address appears transferred from Jesus to the bystanders, turning a private word into a public identification.' },
    { device: 'Expansion of narrative details', note: 'Matt 3:14–15 alone records John’s protest and Jesus’ reply ("to fulfill all righteousness"), expanding the scene to answer a question the bare event raises — why the sinless one accepts a baptism of repentance.' },
  ],
  'Temptation of Jesus': [
    { device: 'Compression', note: 'Mark 1:12–13 compresses the whole forty days into two verses with no dialogue; Matthew and Luke give the three-test exchange in full. Reading Mark beside the others shows how much a compressed account can presuppose.' },
    { device: 'Displacement', note: 'Matthew and Luke order the second and third temptations differently (temple then kingdoms in Matt 4; kingdoms then temple in Luke 4). At least one evangelist has re-sequenced for climactic effect — Matthew ends on worship, Luke ends at the temple where his Gospel also closes.' },
  ],
  "Centurion's servant": [
    { device: 'Transferal', note: 'In Matt 8:5–13 the centurion comes and speaks in person; in Luke 7:1–10 he sends Jewish elders and then friends, never meeting Jesus. Matthew appears to transfer the delegation’s words to the man himself — ancient audiences heard a message delivered through envoys as the sender’s own speech.' },
    { device: 'Simplification', note: 'Dropping the two delegations lets Matthew tell the story in half the space while keeping the saying he cares about ("not even in Israel have I found such faith") word-for-word.' },
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
    { device: 'Displacement', note: 'Matthew sets the prayer inside the Sermon on the Mount (Matt 6); Luke 11 places it later, on the road, prompted by a disciple’s request. Since itinerant teachers repeated material, this may be double tradition rather than displacement — but at least one evangelist chose its literary home.' },
    { device: 'Paraphrase', note: 'Luke’s form is notably shorter ("Father" for "Our Father in heaven"; no "your will be done…"). Two wordings of one prayer both circulating as THE prayer is itself a lesson in how ancient authors handled even liturgical speech.' },
  ],
  'Commissioning the Twelve': [
    { device: 'Conflation', note: 'Matthew 10 folds into one discourse instructions that Mark and Luke distribute across two missions — the Twelve (Mark 6/Luke 9) and the Seventy-two (Luke 10): the "lambs among wolves," town-by-town judgment, and "the worker deserves his food" material sits in Luke’s second sending. A textbook conflation of related speech material.' },
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
}
