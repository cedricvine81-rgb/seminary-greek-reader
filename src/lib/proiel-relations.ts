import type { SyntaxEntry } from './wallace-categories'

// ── PROIEL dependency relation derived from Lowfat SBLGNT syntax tree ─────────
//
// PROIEL (Pragmatic Resources in Old Indo-European Languages) annotates the GNT
// with dependency grammar: each word has a head and a grammatical relation label.
// We derive the same relation codes from the Lowfat phrase-structure roles so
// that students can learn both annotation frameworks from a single click.

const ROLE_TO_PROIEL: Record<string, string> = {
  v:    'PRED',
  s:    'SUBJ',
  o:    'OBJ',
  o2:   'OBJ2',
  io:   'OBL',
  p:    'COMP',
  vc:   'XOBJ',
  aux:  'AUX',
  adv:  'ADV',
  cc:   'COORD',
  conj: 'CONJ',
}

export interface ProielRelation {
  code: string
  name: string
  desc: string
}

export function getProielRelation(syn: SyntaxEntry | null): ProielRelation | null {
  if (!syn) return null

  const r   = syn.r
  const cls = syn.c
  const h   = syn.h
  const pr  = syn.pr
  const gr  = syn.gr
  const gc  = syn.gc

  let code: string

  if (syn.periph && cls === 'vp') {
    // Periphrastic participle: it is the verbal head (PRED), not the auxiliary
    code = 'PRED'
  } else if (r) {
    code = ROLE_TO_PROIEL[r] ?? 'ATR'
  } else if (cls === 'np' && h) {
    // Head of NP inherits the phrase's role from the parent or grandparent
    const inherited = pr ?? gr
    code = inherited ? (ROLE_TO_PROIEL[inherited] ?? 'ATR') : 'ATR'
  } else if (cls === 'np' && !h) {
    // Non-head inside an NP (article, adjective, genitive modifier)
    code = 'ATR'
  } else if (cls === 'pp' && h) {
    // Head of a PP (the noun governed by the preposition)
    const role = pr
    code = role ? (ROLE_TO_PROIEL[role] ?? 'OBL') : 'OBL'
  } else if (cls === 'pp') {
    // Preposition itself, heading a PP phrase
    code = pr ? (ROLE_TO_PROIEL[pr] ?? 'ADV') : 'ADV'
  } else if (cls === 'cl' && gc === 'np') {
    // Clause nominalized within an NP (substantival participle / articular infinitive)
    code = 'XOBJ'
  } else if (cls === 'cl') {
    const role = pr ?? gr
    code = role ? (ROLE_TO_PROIEL[role] ?? 'ADV') : 'ADV'
  } else if (cls === 'adjp') {
    code = pr ? (ROLE_TO_PROIEL[pr] ?? 'ATR') : 'ATR'
  } else if (cls === 'vp') {
    code = pr ? (ROLE_TO_PROIEL[pr] ?? 'PRED') : 'PRED'
  } else {
    return null
  }

  const info = PROIEL_INFO[code]
  if (!info) return null
  return { code, ...info }
}

const PROIEL_INFO: Record<string, { name: string; desc: string }> = {
  PRED: {
    name: 'Predicate',
    desc: 'The verbal head of the clause — the finite verb that carries the main assertion. Every clause has one PRED. In dependency grammar this is the root node: every other word in the clause depends on it directly or indirectly.',
  },
  SUBJ: {
    name: 'Subject',
    desc: 'The nominal dependent that the predicate agrees with. In Greek this is typically a nominative noun phrase, but it may be an infinitive, a participle clause, or a pronoun implied by the verb ending. When a pronoun subject is expressed, it adds emphasis or contrast.',
  },
  OBJ: {
    name: 'Object',
    desc: 'The primary object of a transitive verb, normally in the accusative. In PROIEL this relation covers direct objects (accusative), genitive objects (verbs like ἅπτομαι, κρατέω), and dative objects (verbs like πιστεύω, ἀκολουθέω) — the case is determined by the verb\'s lexical requirements.',
  },
  OBJ2: {
    name: 'Secondary Object',
    desc: 'The second object in a double-accusative construction. The first accusative (OBJ) is the direct object; OBJ2 is the complement that predicates something of it (object-complement type: καλέω, ποιέω) or the content conveyed (person-thing type: διδάσκω, αἰτέω).',
  },
  OBL: {
    name: 'Oblique',
    desc: 'An oblique argument required by the verb but not its primary object — typically an indirect object (dative of recipient), a prepositional complement, or a genitive complement. Unlike ADV, OBL is argument-licensed: removing it would leave the clause incomplete.',
  },
  COMP: {
    name: 'Complement',
    desc: 'A predicate complement following a copular or semi-copular verb (εἰμί, γίνομαι, καλέομαι, ὑπάρχω). The COMP predicates something of the subject (predicate nominative) or, in a double-accusative construction, of the object (predicate accusative). It is linked to the subject/object by the verb without any case change in the complement itself.',
  },
  XOBJ: {
    name: 'Open Clausal Complement',
    desc: 'An infinitive or participial clause that functions as a clausal argument of the main verb, with its subject controlled by (co-referential with) the main clause subject or object. Common after verbs of commanding, desiring, and believing (θέλω, κελεύω, νομίζω). The "open" label means the embedded subject is not expressed but is resolved from context.',
  },
  AUX: {
    name: 'Auxiliary',
    desc: 'An auxiliary verb forming a periphrastic construction with a participle. In the GNT, periphrastic forms (εἰμί + present/perfect participle) are common in Luke-Acts and highlight ongoing or stative aspect. The participle carries the main verbal meaning; the auxiliary encodes tense-mood-person.',
  },
  ADV: {
    name: 'Adverbial',
    desc: 'A modifier that specifies the circumstance of the verbal action — time, place, manner, cause, purpose, condition, or concession. In Greek, ADV dependents include adverbs, prepositional phrases, and circumstantial participles. Unlike OBL, an ADV is not lexically required by the verb and can be removed without making the clause incomplete.',
  },
  ATR: {
    name: 'Attribute',
    desc: 'A modifier of a nominal head — an adjective, article, genitive modifier, relative clause, or appositive NP that limits or describes the noun. In Greek, ATR is the most common nominal dependency relation. The attribute agrees with or is governed by the head noun and restricts its reference.',
  },
  APOS: {
    name: 'Apposition',
    desc: 'A nominal element that refers to the same entity as its head and is placed next to it to rename or further identify it (e.g., Σίμωνα ὃν ἐπωνόμασεν Πέτρον — "Simon, whom he named Peter"). The appositive typically agrees in case with the head noun.',
  },
  COORD: {
    name: 'Coordinator',
    desc: 'A coordinating conjunction (καί, δέ, ἀλλά, οὐδέ, ἤ) that links two elements of equal rank. In PROIEL dependency trees the conjunction itself is given the relation of the first conjunct it governs, and the coordinated elements carry the CONJ relation.',
  },
  CONJ: {
    name: 'Conjunct',
    desc: 'An element joined to another by a coordinating conjunction. In PROIEL, the second (and subsequent) conjuncts carry the CONJ relation and attach to the first conjunct or to the conjunction itself. Conjuncts share the same grammatical role as the element they are coordinated with.',
  },
  XADV: {
    name: 'Adverbial Participle',
    desc: 'An adverbial (circumstantial) participle dependent on the main predicate, with its subject controlled by the main clause subject. Unlike XOBJ (where the subject is the object of the main verb), XADV participles modify the verbal action circumstantially — expressing time, cause, means, concession, or manner.',
  },
  VOC: {
    name: 'Vocative',
    desc: 'A nominal element in the vocative case (or a nominative used as one) that directly addresses a person or personified entity. The vocative is syntactically independent of the surrounding clause and carries no argument relation to the verb. It is frequent in direct speech, prayers, and epistolary greetings.',
  },
}
