import type { MorphParse } from '@/types/morphology'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyntaxEntry {
  r?: string      // role: s, v, o, io, p, vc, aux
  c?: string      // parent wg class: cl, np, pp, vp
  pr?: string     // parent wg role
  gr?: string     // grandparent wg role
  gc?: string     // grandparent wg class
  h?: boolean     // head of phrase
  cond?: number   // conditional class (1–4)
  periph?: boolean
}

export interface SyntaxContext {
  governingPrep?: string | null
  precedingConj?: string | null
  nearbyLinkingVerb?: boolean
  emphNeg?: boolean
  wordLexeme?: string | null   // lexeme of the word being analyzed
  clauseHasO2?: boolean        // clause contains a second accusative object (double accusative)
  hasGenitiveAbsSubject?: boolean  // a genitive subject word (r:'s', c:'cl') is within ±3 words
  precedingArticle?: boolean   // participle: the word immediately before is an article
  nounBeforeArticle?: boolean  // participle: the word before that article is a noun/pronoun (→ 2nd-position attributive)
  enclosingHeadCase?: string   // genitive: case of the head noun that contains this genitive (word before the article that precedes this word)
  nearbyConjunctionRole?: string  // a coordinating conjunction with a clause role (pr) appears within ~4 preceding words — signals compound subject/object rather than apposition
  prevHeadNounExists?: boolean    // when the preceding word is an article, the word before that article is a syntax head (h:true) — required for apposition detection
  isArticular?: boolean           // the word immediately preceding this one is an article (used for Colwell's rule: articular nom = subject, anarthrous nom = predicate)
  hasPrecedingMh?: boolean        // μή appears in the 3 preceding words but οὐ μή emphatic negation is NOT in play — signals prohibition (μή + aorist subj) or negative purpose
  // Macula Greek (Clear Bible) Nestle 1904 lowfat — explicit structural data
  maculaRole?:        string | null  // role of the word's enclosing phrase: s, o, p, io, o2, adv, vc
  maculaPhraseClass?: string | null  // class of the enclosing phrase: np, vp, pp, adjp, advp
  maculaClauseRule?:  string | null  // structural pattern of the enclosing clause: S-V-O, P2CL, etc.
  maculaClauseRole?:  string | null  // how the enclosing clause functions in a higher clause: s, o, adv, p
}

export interface WallaceCategory {
  name: string
  desc: string
  level: 'beginner' | 'intermediate'
}

// ── Prepositional governance tables ──────────────────────────────────────────

const ACC_PREPS = new Set([
  'εἰς', 'ἀνά', 'ὑπέρ',
  'κατά', 'διά', 'μετά',
  'πρός', 'παρά', 'ἐπί', 'περί',
])

const GEN_PREPS = new Set([
  'ἀπό', 'ἐκ', 'ἐξ',
  'πρό', 'ἀντί', 'χωρίς',
  'ὑπό', 'ὑπέρ',
  'κατά', 'διά',
  'παρά', 'ἐπί', 'περί', 'μετά',
])

const DAT_PREPS = new Set([
  'ἐν', 'σύν',
  'παρά', 'ἐπί', 'πρός',
])

const PREP_GLOSSES: Record<string, string> = {
  'εἰς':   'into / toward / for (purpose)',
  'ἀνά':   'up along / each / throughout',
  'κατά':  '(acc.) according to / against | (gen.) down from / against',
  'διά':   '(gen.) through / by means of | (acc.) because of / for the sake of',
  'μετά':  '(gen.) with | (acc.) after',
  'πρός':  'to / toward / with / against',
  'παρά':  '(gen.) from | (dat.) beside / with | (acc.) beside / contrary to',
  'ἐπί':   '(gen.) on / over / during | (dat.) on / at | (acc.) onto / against',
  'περί':  '(gen.) concerning / about | (acc.) around',
  'ὑπέρ':  '(gen.) on behalf of / for | (acc.) above / beyond',
  'ὑπό':   '(gen.) by (agent) | (acc.) under',
  'ἀπό':   'from / away from',
  'ἐκ':    'out of / from',
  'ἐξ':    'out of / from',
  'πρό':   'before (place or time)',
  'ἀντί':  'instead of / in place of / in exchange for',
  'χωρίς': 'apart from / without',
  'ἐν':    'in / among / by / with',
  'σύν':   'with / together with',
}

const FULL_CASES = new Set(['Nominative', 'Genitive', 'Dative', 'Accusative', 'Vocative'])

// ── Main function ─────────────────────────────────────────────────────────────

export function getWallaceCategories(
  syn: SyntaxEntry | null,
  parse: MorphParse | undefined,
  ctx?: SyntaxContext,
): WallaceCategory[] {
  if (!parse) return []

  const pos   = parse.partOfSpeech ?? ''
  const mood  = parse.mood ?? ''
  const tense = (parse.tense ?? '').replace(/^2nd\s+/, '')
  const kase  = parse.casus ?? ''
  const cls   = syn?.c
  // Lowfat encodes grammatical role on the phrase, not the word.
  // Anarthrous nouns: the parent role (pr) is set directly.
  // Articular nouns: the article sits at the outer NP level with pr set;
  // the noun head is one level deeper and carries the role in gr instead.
  // Only inherit gr for the head (h:true) to avoid non-head modifiers
  // (genitive NPs, adjectives) picking up their parent NP's clause role.
  // Fall back to Macula phrase role when lowfat data is absent.
  const role  = syn?.r
             ?? (syn?.c === 'np' ? (syn?.pr ?? (syn?.h ? syn?.gr : undefined)) : undefined)
             ?? (ctx?.maculaRole ?? undefined)

  const rawPrep = ctx?.governingPrep ?? null
  const inPP = rawPrep === 'none' ? false
             : rawPrep            ? true
             : cls === 'pp' || syn?.gc === 'pp'

  const isNominal = pos === 'Noun' || pos === 'Adjective' || pos === 'Demonstrative'
                    || (pos?.includes('Pronoun') ?? false)
  const isVerb    = pos === 'Verb'

  const cats: WallaceCategory[] = []
  // For participles the case description comes after the participle use, so we
  // buffer it here during STEP 2 and splice it in after STEP 7.
  const partCaseCats: WallaceCategory[] = []

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — PREPOSITIONAL GOVERNANCE (highest priority for nominals)
  // ══════════════════════════════════════════════════════════════════════════
  if (isNominal && inPP) {
    // Substantival adjectives inside a PP fill a noun role and also carry a
    // prepositional case. Show the adjectival function first so students
    // understand *why* the word is there, then show *what case* governs it.
    if (pos === 'Adjective' && cls === 'np' && syn?.h) {
      cats.push({
        name: 'Substantival Adjective',
        desc: 'In the GNT, a substantival adjective functions as a noun — it heads a noun phrase without a separate head noun. This is especially common with the article: οἱ πτωχοί = "the poor (people)"; τὸ ἀγαθόν = "the good (thing)"; πολλοί = "many (people)." The gender of the article and adjective signals the referent: masculine/feminine = persons; neuter = things or abstract concepts.\n\nWithout the article, substantival adjectives are identified by clause structure: they fill a nominal slot (subject, object, etc.) where no separate noun is present. This is common in Pauline paraenesis and wisdom sayings.\n\nThe case of a substantival adjective reflects its function in the clause, not agreement with a head noun (GGBB pp. 308–309).',
        level: 'beginner',
      })
    }

    const prep  = rawPrep && rawPrep !== 'none' ? rawPrep : null
    const gloss = prep ? PREP_GLOSSES[prep] : null
    const prepClause = prep && gloss ? ` (${prep}: "${gloss}")` : ''

    if (kase === 'Accusative' || (prep && ACC_PREPS.has(prep) && !DAT_PREPS.has(prep) && kase !== 'Genitive' && kase !== 'Dative')) {
      cats.push({
        name: 'Accusative after Certain Prepositions',
        desc: `In the GNT, prepositions such as εἰς, κατά, διά (causal sense), μετά (temporal sense), and πρός consistently govern the accusative${prepClause}. The case is fixed by the preposition — the noun itself carries no independent case function apart from the prepositional phrase. This is one of the most common syntactical patterns in the GNT (GGBB pp. 369–389).`,
        level: 'beginner',
      })
    } else if (kase === 'Genitive' || (prep && GEN_PREPS.has(prep) && !DAT_PREPS.has(prep) && kase !== 'Accusative' && kase !== 'Dative')) {
      cats.push({
        name: 'Genitive after Certain Prepositions',
        desc: `In the GNT, prepositions such as ἀπό, ἐκ/ἐξ, πρό, ἀντί, χωρίς, and ὑπό consistently govern the genitive${prepClause}. The case is determined by the preposition alone, not by the noun's relationship to the verb or to another noun. The genitive is the most frequent prepositional case in the GNT (GGBB pp. 356–368).`,
        level: 'beginner',
      })
    } else if (kase === 'Dative' || (prep && DAT_PREPS.has(prep) && kase !== 'Accusative' && kase !== 'Genitive')) {
      cats.push({
        name: 'Dative after Certain Prepositions',
        desc: `In the GNT, ἐν and σύν always govern the dative${prepClause}. ἐν alone is one of the most frequent words in the entire GNT, appearing in a wide range of local, instrumental, and sphere-of-life expressions. The case is controlled entirely by the preposition (GGBB pp. 369–372).`,
        level: 'beginner',
      })
    } else {
      cats.push({
        name: 'Object of Preposition',
        desc: `This noun is governed by a preposition${prepClause}. Select the specific preposition below to identify whether it takes the accusative, genitive, or dative and to narrow the syntactical function (GGBB pp. 356–389).`,
        level: 'beginner',
      })
    }
    return cats
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — NOMINAL CATEGORIES
  // For participles, case categories are buffered and appended after STEP 7.
  // ══════════════════════════════════════════════════════════════════════════
  if (isNominal || (isVerb && (mood === 'Participle' || mood === 'Infinitive'))) {
    const nomCats = (isVerb && mood === 'Participle') ? partCaseCats : cats

    // ── Adjective use detection (attributive / predicate / substantival) ──────
    // Must run before case-role logic so that adjectives that are non-head
    // members of an NP are not misread as the NP's clause role (e.g. direct
    // object), and adjectives that head an NP are labelled substantival first.
    if (pos === 'Adjective') {
      if (cls === 'np' && !syn?.h) {
        // Non-head inside a noun phrase → attributive modifier of the head noun
        nomCats.push({
          name: 'Attributive Adjective',
          desc: 'In the GNT, an attributive adjective modifies a noun directly within a noun phrase, agreeing with it in gender, number, and case. The attributive position is identified by the article-adjective relationship: the adjective stands between the article and noun (ἡ δερματίνη ζώνη — "the leather belt"), or it follows an articular noun (ζώνη ἡ δερματίνη). In either arrangement the article reaches across to the adjective, signalling that the two belong together as a unit.\n\nContrast the predicate position, in which the adjective stands outside the article-noun unit and makes a claim about the noun through or instead of a copular verb: ἡ ζώνη δερματίνη or δερματίνη ἡ ζώνη — "the belt is leather."\n\nThe case of an attributive adjective is determined entirely by agreement with its head noun, not by any independent clause function. It receives no separate syntactical label (GGBB pp. 306–309).',
          level: 'beginner',
        })
        return cats
      }
      if (syn?.r === 'p' || (role === 'p' && cls !== 'np')) {
        // Predicate complement position → predicate adjective
        nomCats.push({
          name: 'Predicate Adjective',
          desc: 'In the GNT, a predicate adjective makes a claim about the subject (or object) without being tied to the noun by the article. Its position distinguishes it from an attributive adjective: the predicate adjective stands outside the article-noun unit — ἡ ζώνη δερματίνη or δερματίνη ἡ ζώνη ("the belt is leather"). When a copular verb (εἰμί, γίνομαι, ὑπάρχω) is present, the adjective is its predicate complement; when the copula is absent, supply "is" or "are" in translation.\n\nDiagnostic test: if the article belongs to the noun alone (not to the adjective), and the adjective asserts something about the noun rather than simply restricting it, the predicate position is in view.\n\nPredicate adjectives agree with the subject in gender, number, and case. They are common in OT quotations, doctrinal affirmations, and the Johannine "I am" sayings (GGBB pp. 307–309).',
          level: 'beginner',
        })
        return cats
      }
      if (cls === 'np' && syn?.h && !(kase === 'Genitive' && syn?.gc === 'np')) {
        // Head of a noun phrase → substantival adjective (fall through to case logic
        // so the student also sees the clause role: subject, object, etc.).
        // Exclude genitive modifiers nested inside another NP (e.g. τῶν Ἰουδαίων
        // in βασιλεὺς τῶν Ἰουδαίων) — those show Descriptive Genitive instead.
        nomCats.push({
          name: 'Substantival Adjective',
          desc: 'In the GNT, a substantival adjective functions as a noun — it heads a noun phrase without a separate head noun. This is especially common with the article: οἱ πτωχοί = "the poor (people)"; τὸ ἀγαθόν = "the good (thing)"; πολλοί = "many (people)." The gender of the article and adjective signals the referent: masculine/feminine = persons; neuter = things or abstract concepts.\n\nWithout the article, substantival adjectives are identified by clause structure: they fill a nominal slot (subject, object, etc.) where no separate noun is present. This is common in Pauline paraenesis and wisdom sayings.\n\nThe case of a substantival adjective reflects its function in the clause, not agreement with a head noun (GGBB pp. 308–309).',
          level: 'beginner',
        })
        // Do not return — fall through to case branches so role is also shown
      }
    }

    if (!FULL_CASES.has(kase) && isNominal) {
      if (role === 's')
        nomCats.push({ name: 'Subject', desc: 'In the GNT, this indeclinable proper name functions as the subject — the nominative whose action or state the verb describes. Since it carries no case ending, the subject role is confirmed by verb agreement, word order, or a coreferential pronoun. The subject answers "who?" or "what?" before the verb (GGBB p. 38).', level: 'beginner' })
      else if (role === 'o')
        nomCats.push({ name: 'Direct Object', desc: 'In the GNT, indeclinable proper names serving as direct object are identified by clause structure rather than case ending. Word order and the transitivity of the verb confirm the object function (GGBB p. 179).', level: 'beginner' })
      else if (role === 'io')
        nomCats.push({ name: 'Indirect Object', desc: 'In the GNT, indeclinable proper names functioning as indirect object are identified from clause structure. They answer "to whom?" or "for whom?" in relation to the verbal action (GGBB p. 142).', level: 'beginner' })
      else if (role === 'p')
        nomCats.push({ name: 'Predicate Nominative', desc: 'In the GNT, this indeclinable proper name functions as the predicate nominative following an equative verb. It defines or classifies the subject rather than performing or receiving an action. Its function is determined by clause structure rather than case form.\n\nCommon GNT equative verbs: εἰμί (to be), γίνομαι (to become), ὑπάρχω (to exist/be), φαίνομαι (to appear/seem), καλέομαι (to be called), λέγομαι (to be called), ὀνομάζομαι (to be named) (GGBB p. 40).', level: 'beginner' })
      else
        nomCats.push({ name: 'Indeclinable Proper Name', desc: 'In the GNT, many Semitic proper names (Ἀβραάμ, Δαυίδ, Ἰσραήλ, and others) do not inflect for case. Their syntactical role — subject, object, or otherwise — must be read from word order and clause structure rather than from any ending (GGBB p. 59).', level: 'beginner' })
    }

    else if (kase === 'Nominative') {
      if (pos === 'Relative Pronoun')
        nomCats.push({ name: 'Relative Pronoun — Subject', desc: 'In the GNT, a relative pronoun (ὅς, ἥ, ὅ) in the nominative functions as the subject of its relative clause — "the one who believes," "everyone who hears." Its gender and number agree with its antecedent in the main clause; its nominative case is determined by its role within the relative clause, not by the antecedent. This pattern is very common in John ("ὁ πιστεύων εἰς αὐτόν") and Paul, where the relative pronoun defines a class of persons by their relationship to Christ. When the relative pronoun is attracted to the case of its antecedent instead, this is called attraction of the relative (GGBB pp. 337–339).', level: 'beginner' })
      else if (pos === 'Personal Pronoun' && ctx?.wordLexeme === 'αὐτός' && role !== 's')
        nomCats.push({ name: 'Intensive Pronoun', desc: 'In the GNT, αὐτός in the nominative outside its normal subject-pronoun function serves as an intensive pronoun — "he himself," "she herself," "they themselves." It adds emphasis or contrast to the subject, often highlighting the unexpected agent or the personal involvement of the subject: "he himself will save his people" (Matt 1:21); "the Spirit himself intercedes" (Rom 8:26).\n\nThe intensive αὐτός is always anarthrous in the nominative (no article immediately before it) and stands in the predicate position. Contrast with αὐτός in the attributive position (article + αὐτός + noun = "the same"), which expresses identity rather than emphasis.\n\nDiagnostic: if removing αὐτός leaves the sentence grammatically complete but less emphatic, it is intensive. If it simply substitutes for a third-person noun, it is a regular personal pronoun (GGBB pp. 348–349).', level: 'intermediate' })
      else if (role === 'p')
        nomCats.push({ name: 'Predicate Nominative', desc: 'In the GNT, the predicate nominative follows an equative verb and defines, classifies, or describes the subject — it does not perform or receive an action. To distinguish subject from predicate when two nominatives flank an equative verb: (1) the articular nominative is normally the subject; (2) the anarthrous nominative is normally the predicate (Colwell\'s Rule). In John 1:1, ὁ λόγος (articular) is the subject; θεός (anarthrous, placed first for emphasis) is the predicate.\n\nCommon GNT equative verbs: εἰμί (to be), γίνομαι (to become), ὑπάρχω (to exist/be), φαίνομαι (to appear/seem), καλέομαι (to be called), λέγομαι (to be called), ὀνομάζομαι (to be named) (GGBB p. 40).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole && ctx?.nearbyLinkingVerb && !ctx?.isArticular)
        nomCats.push({ name: 'Compound Predicate Nominative', desc: 'In the GNT, a compound predicate nominative consists of two or more anarthrous nominative nouns or noun phrases joined by a coordinating conjunction (καί, ἤ) that together predicate something about the subject via an equative verb.\n\nIdentifying marks:\n1. An equative verb (εἰμί, γίνομαι) is present in the clause.\n2. A conjunction (καί, ἤ) links this nominal to another predicate element.\n3. This nominal lacks an article — by Colwell\'s Rule, the anarthrous nominative in an equative clause is normally the predicate, not the subject.\n\nExample: ἡ δὲ τροφὴ αὐτοῦ ἦν ἀκρίδες καὶ μέλι ἄγριον — "his food was locusts and wild honey" (Matt 3:4). The subject τροφή is articular (ἡ τροφή); ἀκρίδες and μέλι are the two compound predicates, both anarthrous.\n\nDistinguish from a compound subject: compound subjects contain the actors who perform the verb\'s action; the conjunction between them is not accompanied by an equative verb predicating something about them. Colwell\'s Rule: when two nominatives flank an equative verb, the articular one is the subject and the anarthrous one(s) are the predicate (GGBB pp. 40–46, 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole)
        nomCats.push({ name: 'Compound Subject', desc: 'In the GNT, a compound subject consists of two or more nominative nouns or noun phrases joined by a coordinating conjunction (most commonly καί). Each element is a distinct entity that independently performs the action of the verb.\n\nIdentifying mark: a coordinating conjunction (καί, ἀλλά, ἤ) appears between the elements — "Jerusalem and all Judea and all the region of the Jordan went out to him" (Ἱεροσόλυμα καὶ πᾶσα ἡ Ἰουδαία καὶ πᾶσα ἡ περίχωρος τοῦ Ἰορδάνου, Matt 3:5).\n\nDistinguish from Nominative in Apposition: in apposition, NO conjunction links the two nominals — they stand directly adjacent and refer to the same entity ("John, that is, the Baptist," Ἰωάννης ὁ βαπτιστής, Matt 3:1). In a compound subject, the conjunction signals that the elements are different referents acting together. A singular verb with a compound subject (neuter plural rule or collective sense) is common in the GNT (GGBB pp. 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.prevHeadNounExists && role !== 's')
        nomCats.push({ name: 'Nominative in Apposition', desc: 'In the GNT, a nominative appositive renames or further identifies the preceding nominative noun, agreeing with it in case. The appositive refers to the same entity as its head noun — it adds a title, description, or clarifying name without changing the referent.\n\nTwo identifying marks:\n1. Both words are in the nominative and refer to the same person or thing.\n2. You can insert "that is" or "namely" between them without changing the meaning.\n3. No coordinating conjunction (καί, ἤ) stands between the head noun and the appositive — they are directly adjacent.\n\nCommon patterns:\n• Personal name + title or role: Ἰωάννης ὁ βαπτιστής — "John, that is, the Baptist" (Matt 3:1)\n• Pronoun + identifying noun: αὕτη ἐστὶν ἡ ἐντολή — "this is the commandment"\n\nApposition is distinct from a predicate nominative (which requires an equative verb) and from a compound subject (which uses a conjunction and has different referents) (GGBB pp. 48–50).', level: 'intermediate' })
      else if (role === 's')
        nomCats.push({ name: 'Subject', desc: 'In the GNT, the subject nominative names who or what performs or experiences the verbal action — the nominative the verb is about and agrees with in person and number. To distinguish it from a predicate nominative: the subject is the topic of the clause; the predicate describes or defines it. Greek routinely omits pronoun subjects since the verb ending already encodes person and number; when a pronoun subject is expressed, it adds emphasis or contrast (GGBB p. 38).', level: 'beginner' })
      else if (ctx?.nearbyLinkingVerb)
        nomCats.push({ name: 'Predicate Nominative', desc: 'In the GNT, the predicate nominative follows an equative verb and defines, classifies, or describes the subject — it does not perform or receive an action. To distinguish subject from predicate when two nominatives flank an equative verb: (1) the articular nominative is normally the subject; (2) the anarthrous nominative is normally the predicate (Colwell\'s Rule). In John 1:1, ὁ λόγος (articular) is the subject; θεός (anarthrous, placed first for emphasis) is the predicate.\n\nCommon GNT equative verbs: εἰμί (to be), γίνομαι (to become), ὑπάρχω (to exist/be), φαίνομαι (to appear/seem), καλέομαι (to be called), λέγομαι (to be called), ὀνομάζομαι (to be named) (GGBB p. 40).', level: 'beginner' })
      else
        nomCats.push({ name: 'Nominative', desc: 'In the GNT, a nominative without a confirmed subject or predicate role should be tested in order:\n1. Is an equative verb present? If so, this is likely a predicate nominative.\n2. Does it rename another nominative? If so, it is a nominative of apposition (e.g., Rev 1:5).\n3. Is it a parenthetical gloss standing apart from the clause? It may be a nominative absolute.\n4. Is it used for direct address in place of the vocative? That is the nominative of address.\nClause structure and context distinguish these uses (GGBB pp. 37–61).', level: 'intermediate' })
    }

    else if (kase === 'Genitive') {
      if (cls === 'cl' && role === 's')
        nomCats.push({ name: 'Genitive Absolute (Subject)', desc: 'In the GNT, a genitive absolute consists of a genitive noun or pronoun (the subject) paired with a genitive participle, forming a clause that is grammatically independent of the main sentence. This word is the subject of that absolute clause — it names the actor of the participle\'s action.\n\nThree identifying marks:\n1. Both this word and its participle are in the genitive.\n2. This subject is not co-referential with the subject of the main clause — it stands free from the main sentence\'s grammar.\n3. The construction sets a temporal or circumstantial backdrop: "after he sat down…" (καθίσαντος αὐτοῦ, Matt 5:1); "while he was still speaking…" (αὐτοῦ λαλοῦντος, Matt 17:5).\n\nGenitive absolutes are especially frequent in narrative sections of the Gospels and Acts. A pronoun subject (αὐτοῦ, αὐτῆς, αὐτῶν) is the most common form; a full noun subject occurs when the actor has not been previously introduced (GGBB p. 654).', level: 'intermediate' })
      else if (pos === 'Personal Pronoun' && cls === 'cl' && role !== 'o' && role !== 'adv')
        nomCats.push({ name: 'Genitive Absolute (Subject)', desc: 'In the GNT, a genitive absolute consists of a genitive noun or pronoun (the subject) paired with a genitive participle, forming a clause grammatically independent of the main sentence. This pronoun is the subject of the absolute clause — it names the actor whose action sets the circumstantial backdrop. Translate with "while he/she/they…" or "after he/she/they…" depending on the temporal relationship (GGBB p. 654).', level: 'intermediate' })
      else if (role === 'o')
        nomCats.push({ name: 'Genitive Direct Object', desc: 'In the GNT, certain verbs govern their direct object in the genitive rather than the accusative. The genitive here functions like an accusative object — it receives or is affected by the verbal action — but the case is lexically required by the verb.\n\nCommon GNT verbs that take a genitive object:\nἅπτομαι (to touch) · ἀκούω (to hear, of persons) · κρατέω (to seize, hold fast) · ἐπιθυμέω (to desire, long for) · μιμνήσκομαι / μνημονεύω (to remember) · δέομαι (to ask, pray) · γεύομαι (to taste) · ἄρχω (to rule over) · ἐπιλαμβάνομαι (to take hold of) · ἀντέχομαι (to hold fast to) (GGBB pp. 131–134).', level: 'beginner' })
      else if (role === 'adv')
        nomCats.push({ name: 'Adverbial Genitive', desc: 'In the GNT, the genitive used adverbially modifies the verb rather than a noun, expressing time or manner.\n\n• Genitive of Time (within which): the genitive specifies the general period during which an action occurs — "by night" (νυκτός, Matt 2:14), "during winter" (χειμῶνος, Matt 24:20). Unlike the dative of time (which marks a point in time), the genitive indicates the broader span or kind of time within which something happens.\n\n• Genitive of Manner: the genitive expresses how an action is performed — "truthfully" (ἀληθείας), "freely" (χάριτος). This use overlaps with the adverb and is identified when a genitive noun functions like an adverbial modifier of the verb.\n\nDiagnostic: Does the genitive answer "during what period?" (time) or "in what manner?" (manner)? Neither reading requires a head noun — the genitive stands free from any nominal modifier relationship (GGBB pp. 122–124).', level: 'intermediate' })
      else if (pos === 'Personal Pronoun')
        nomCats.push({ name: 'Possessive Genitive', desc: 'In the GNT, personal pronouns in the genitive (μου, σου, αὐτοῦ/αὐτῆς, ἡμῶν, ὑμῶν, αὐτῶν) are used almost exclusively as possessives — "my," "your," "his/her," "our," "their." Wallace identifies this as the most straightforward use of the genitive pronoun: the pronoun simply indicates the possessor of the head noun. No further contextual testing is needed in most cases (GGBB p. 81).', level: 'beginner' })
      else if (pos === 'Relative Pronoun')
        nomCats.push({ name: 'Genitive Relative Pronoun', desc: 'In the GNT, a relative pronoun in the genitive (οὗ, ἧς, ὧν) either indicates possession within its relative clause — "whose" — or is governed by a preposition or verb that takes the genitive. Its gender and number agree with the antecedent in the main clause; its case is determined by its function within the relative clause itself (GGBB pp. 337–338).', level: 'intermediate' })
      else if (pos === 'Demonstrative')
        nomCats.push({ name: 'Demonstrative / Possessive Genitive', desc: 'In the GNT, a demonstrative pronoun in the genitive (τούτου, ταύτης, τούτων; ἐκείνου, ἐκείνης, ἐκείνων) functions possessively or as a partitive — "of this one," "of that one," "of these things." The demonstrative genitive often carries emphatic force compared to a simple personal pronoun possessive (GGBB pp. 325–334).', level: 'intermediate' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.enclosingHeadCase === 'Genitive')
        nomCats.push({ name: 'Genitive of Apposition', desc: 'In the GNT, the genitive of apposition follows a head noun and renames or identifies it — the genitive and its head noun refer to the same entity. The genitive specifies what the head noun *is*, rather than showing who owns it or where it comes from.\n\nTwo identifying marks:\n1. Both words refer to the same person or thing.\n2. You can substitute "namely," "that is," or "which is" between them: Ἡσαΐου τοῦ προφήτου — "through Isaiah, namely the prophet" (Matt 3:3); τὸ σημεῖον τῆς περιτομῆς — "the sign of circumcision [= circumcision itself as the sign]" (Rom 4:11).\n\nCommon patterns:\n• Proper name + descriptive title in genitive: a person named, then identified by role (prophet, apostle, king).\n• Abstract head noun + concrete genitive content: the abstraction is identified by what it consists of — "the hope of glory" = the glory that is the hope (Col 1:27).\n\nDistinguish from Descriptive Genitive: apposition renames the head noun so that both refer to the same entity (Ἡσαΐου = τοῦ προφήτου, the same person). A descriptive genitive qualifies the head noun without naming the same thing — "king of the Jews" (Ἰουδαίων ≠ βασιλεύς, different referents). Test: can you substitute "namely" or "that is"? If yes, the genitive is appositive (GGBB pp. 95–100).', level: 'intermediate' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np')
        nomCats.push({ name: 'Descriptive Genitive', desc: 'In the GNT, the descriptive genitive (also called the attributive or qualitative genitive) characterizes or qualifies the head noun by specifying its kind, nature, or sphere — functioning like an adjective. The genitive and the head noun refer to different things; the genitive describes what kind.\n\nTwo identifying marks:\n1. The head noun and the genitive are different referents — they do not name the same person or thing.\n2. You can rephrase the genitive as an adjective: "king of the Jews" = "Jewish king"; "Bethlehem of Judea" = "Judean Bethlehem."\n\nCommon patterns:\n• Geographical/ethnic qualifier: Βηθλέεμ τῆς Ἰουδαίας — "Bethlehem of Judea" (Matt 2:1); βασιλεὺς τῶν Ἰουδαίων — "king of the Jews" (Matt 2:2).\n• Genitive of quality or attribute: "body of sin" (σῶμα τῆς ἁμαρτίας, Rom 6:6); "works of the law" (ἔργα νόμου).\n\nDistinguish from Genitive of Apposition: apposition renames (head = genitive, same referent; test: "namely"); descriptive qualifies (head ≠ genitive, different referents; test: adjective paraphrase). Distinguish from Possessive Genitive: possession answers "whose?" while descriptive answers "what kind?" (GGBB pp. 79–86).', level: 'beginner' })
      else if (syn?.c === 'np' && !syn?.h)
        nomCats.push({ name: 'Possessive Genitive', desc: 'In the GNT, a genitive noun that modifies another noun within a noun phrase most commonly expresses possession or description — it limits or defines the head noun. This is the default reading for a genitive modifier when no other cue is present (e.g., ἄγγελος κυρίου = "an angel of the Lord"; λόγος τοῦ θεοῦ = "the word of God").\n\nIf the head noun implies an action (e.g., ἀγάπη, πίστις, κρίσις), test further:\n• Subjective genitive: the genitive performs the action of the head noun — "God\'s love [for us]" (God loves).\n• Objective genitive: the genitive receives the action — "love toward God" (someone loves God).\n• Partitive genitive: the genitive names the whole — "some of the crowd."\n• Genitive of apposition: the genitive names the same thing as the head noun — "the sign of circumcision" = circumcision itself.\n\nFor concrete head nouns (angel, word, house, servant), possessive is almost always correct (GGBB pp. 72–136).', level: 'beginner' })
      else
        nomCats.push({ name: 'Genitive — Intermediate Uses', desc: 'Possessive, prepositional, absolute, and adverbial genitives are handled by other detectors. This genitive likely falls into one of the following intermediate categories:\n\n• Subjective Genitive: the genitive performs the action implied in the head noun — ἡ ἀγάπη τοῦ θεοῦ = "God\'s love [for us]" (God is the one who loves). Common with action nouns (ἀγάπη, πίστις, κρίσις).\n\n• Objective Genitive: the genitive receives the action implied in the head noun — ἡ ἀγάπη τοῦ θεοῦ = "love toward God" (God is the object of love). Diagnosed when the genitive could be the object if the head noun were a verb.\n\n• Partitive Genitive: the genitive names the whole of which the head noun is a part — "some of the crowd," "one of the twelve." Common with numerals, pronouns, and superlatives.\n\n• Genitive of Apposition: the genitive renames or identifies the head noun — "the sign of circumcision" = circumcision itself as the sign (Rom 4:11). Test: can you substitute "namely" or "which is"?\n\n• Ablative (Genitive of Separation): the genitive expresses the source from which separation occurs — "apart from the law," "far from God." Common after verbs and adjectives of separation or distance.\n\n• Genitive of Comparison: follows a comparative adjective — "greater than John," "more precious than silver." The genitive replaces the ἤ + nominative construction (GGBB pp. 72–136).', level: 'intermediate' })
    }

    else if (kase === 'Dative') {
      if (pos === 'Relative Pronoun')
        nomCats.push({ name: 'Relative Pronoun — Dative', desc: 'In the GNT, a relative pronoun (ᾧ, ᾗ, οἷς) in the dative functions within its relative clause as an indirect object, a dative of interest, or is governed by a verb or preposition that requires the dative. Its gender and number agree with its antecedent; its dative case is determined by its role inside the relative clause (GGBB pp. 337–339).', level: 'intermediate' })
      else if (role === 'io')
        nomCats.push({ name: 'Dative Indirect Object', desc: 'In the GNT, the dative indirect object is the most common dative use, appearing frequently with verbs of giving, speaking, showing, and sending. It answers "to whom?" or "for whom?" and is translated with "to" or "for" before the noun. Verbs like δίδωμι, λέγω, and ἀποστέλλω regularly take a dative indirect object (GGBB p. 142).', level: 'beginner' })
      else if (role === 'o')
        nomCats.push({ name: 'Dative Direct Object', desc: 'In the GNT, certain verbs govern their direct object in the dative rather than the accusative. These verbs are often intransitive in form but take a dative that functions as their primary object — translated into English as a direct object without "to" or "for."\n\nCommon GNT verbs that take a dative object:\nπιστεύω (to believe, trust) · ἀκολουθέω (to follow) · διακονέω (to serve, minister to) · δουλεύω (to serve as a slave to) · λατρεύω (to serve, worship) · ὑπακούω (to obey) · ἀπειθέω (to disobey) · ἀρέσκω (to please) · προσκυνέω (to worship, bow before) · παραγγέλλω (to command) · εὐχαριστέω (to give thanks to) (GGBB pp. 171–172).', level: 'beginner' })
      else if (role === 'adv')
        nomCats.push({ name: 'Adverbial Dative', desc: 'In the GNT, datives that modify the verb adverbially (rather than serving as its argument) fall into several categories. Identifying the specific type is often exegetically decisive:\n\n• Dative of Means / Instrument: by what the action is performed — "by faith" (πίστει), "by the Spirit" (Πνεύματι). No preposition; translate "by" or "with." Common in Paul for the means of justification and sanctification.\n\n• Dative of Manner: how the action is performed — "with boldness" (παρρησίᾳ), "with joy" (χαρᾷ). Translate "with" or as an adverb. Distinguished from means: manner describes the quality of the action, means describes its instrument.\n\n• Dative of Sphere: the realm within which something is true — "poor in spirit" (τῷ πνεύματι, Matt 5:3), "weak in faith" (τῇ πίστει, Rom 14:1). Translate "in the sphere of." Theologically significant when Paul describes believers as "dead to sin" (τῇ ἁμαρτίᾳ, Rom 6:11).\n\n• Dative of Reference / Respect: the frame of reference for the statement — "free with reference to sin," "alive with respect to God." Closely related to sphere; reference highlights the limiting frame rather than the domain.\n\n• Dative of Time (When): a point in time — "on the third day" (τῇ τρίτῃ ἡμέρᾳ). Contrast with the genitive of time, which indicates the period within which.\n\nDiagnostic order: means → manner → sphere → reference → time (GGBB pp. 155–175).', level: 'intermediate' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole)
        nomCats.push({ name: 'Compound Dative', desc: 'In the GNT, a compound dative consists of two or more dative nouns or noun phrases joined by a coordinating conjunction (καί, ἤ, ἀλλά), each functioning in the same dative role — indirect object, dative of interest, dative of manner, etc.\n\nIdentifying mark: a coordinating conjunction appears between the elements. Each element is a distinct entity sharing the same dative function in the clause.\n\nDistinguish from Dative in Apposition: in apposition, NO conjunction links the two datives — they stand directly adjacent and refer to the same entity. In a compound, the conjunction signals that the elements are different referents sharing the same clause role (GGBB pp. 48–50, 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.prevHeadNounExists)
        nomCats.push({ name: 'Dative in Apposition', desc: 'In the GNT, a dative appositive renames or further identifies a preceding dative noun, agreeing with it in case. Like all apposition, the two nouns refer to the same entity — the appositive adds a title, name, or clarifying description.\n\nTest: insert "namely" or "that is" between the head noun and this word. If both refer to the same referent, the relationship is appositive. No coordinating conjunction (καί, ἤ) stands between the head noun and the appositive — they are directly adjacent.\n\nDative apposition occurs wherever a dative noun is further specified: indirect objects with identifying titles, datives of interest with appended descriptions. It is less frequent than nominative or genitive apposition but follows the same principle of grammatical agreement and semantic co-reference (GGBB pp. 48–50).', level: 'intermediate' })
      else
        nomCats.push({ name: 'Dative', desc: 'In the GNT, dative nouns without a confirmed argument role express a range of relationships. A dative of advantage or disadvantage (dative of interest) asks whose benefit or harm is in view — "he died for us," "sin is reckoned against them." A dative of association (sociative dative) expresses accompaniment — "together with all the saints" (σὺν πᾶσιν τοῖς ἁγίοις). Test: does it answer "to/for whom?" (indirect object), "by/with what?" (means), "in what sphere?" (sphere), "when?" (time), or "whose benefit?" (interest)? (GGBB pp. 137–175).', level: 'intermediate' })
    }

    else if (kase === 'Accusative') {
      // Detect double-accusative position from Lowfat roles
      const isO2 = role === 'o2' || syn?.r === 'o2' || syn?.gr === 'o2'
      const isO1inDoubleAcc = !isO2 && !!ctx?.clauseHasO2 && (role === 'o' || syn?.gr === 'o')

      if (pos === 'Relative Pronoun')
        nomCats.push({ name: 'Relative Pronoun — Accusative', desc: 'In the GNT, a relative pronoun (ὅν, ἥν, ὅ) in the accusative functions as the direct object of the verb in its relative clause — "the one whom he sent," "the word which you heard." Its gender and number agree with its antecedent; its accusative case is determined by its role within the relative clause, independent of the antecedent\'s case. When the relative is attracted into the case of its antecedent instead of keeping its proper accusative, this is called attraction of the relative — a common GNT phenomenon, especially in Luke-Acts (GGBB pp. 337–339).', level: 'beginner' })
      else if (isO2)
        nomCats.push({ name: 'Object Complement — Double Accusative', desc: 'In the GNT, the double accusative of object and complement takes two accusatives with one verb: a direct object and a predicate complement that makes a claim about that object. This word is the complement — it names, identifies, or characterizes the direct object. The test: if you can insert "to be" between the two accusatives and the result makes sense, the second accusative is a complement rather than a second direct object (e.g., καλέσουσιν τὸ ὄνομα αὐτοῦ Ἐμμανουήλ — "they will call his name [to be] Immanuel," Matt 1:23; ποιήσω ὑμᾶς ἁλιεῖς — "I will make you [to be] fishers," Matt 4:19).\n\nCommon GNT verbs taking an object-complement double accusative:\nκαλέω (to call/name) · ὀνομάζω (to name) · λέγω (to call) · ποιέω (to make/appoint as) · τίθημι (to appoint as) · ἡγέομαι (to consider as) · νομίζω (to consider as) · εὑρίσκω (to find/regard as) · ἀποδείκνυμι (to demonstrate as) (GGBB pp. 181–189).', level: 'beginner' })
      else if (isO1inDoubleAcc)
        nomCats.push({ name: 'Direct Object — Double Accusative Construction', desc: 'In the GNT, this accusative is the primary direct object in a double accusative construction — the clause contains a second accusative alongside it. Identify which of the two types applies:\n\n1. Object-Complement: the second accusative predicates something of this object — naming, identifying, or characterizing it. The complement can be mentally linked to the object with "to be." Verbs: καλέω (to call), ποιέω (to make/appoint), τίθημι (to appoint), ἡγέομαι (to consider), νομίζω (to consider), ὀνομάζω (to name) (GGBB pp. 181–189).\n\n2. Person-Thing: the clause has a person accusative and a thing accusative — one is the recipient and the other is the content conveyed. Verbs: διδάσκω (to teach), ἐρωτάω (to ask), αἰτέω (to ask for), ὑπομιμνήσκω / ἀναμιμνήσκω (to remind), ἐνδύω (to clothe) (GGBB pp. 179–181).\n\nCheck the lexeme of the verb: if it is a verb of calling or appointing, the object-complement type is most likely; if it is a verb of teaching, asking, or reminding, the person-thing type is most likely.', level: 'beginner' })
      else if (role === 'o')
        nomCats.push({ name: 'Accusative Direct Object', desc: 'In the GNT, the accusative direct object is the most frequent use of the accusative, receiving the action of a transitive verb. It answers "whom?" or "what?" Verbs that take accusative objects include ἀγαπάω, βλέπω, λαμβάνω, and ποιέω. This is the default reading for an accusative when other uses cannot be confirmed (GGBB p. 179).', level: 'beginner' })
      else if (role === 'vc')
        nomCats.push({ name: 'Predicate Accusative', desc: 'In the GNT, the predicate accusative occurs in a double-accusative construction with verbs of naming (καλέω), making (ποιέω), appointing (τίθημι), or considering (ἡγέομαι). One accusative is the direct object; the other predicates something of it — "he appointed them apostles" (Mark 3:14) (GGBB p. 182).', level: 'intermediate' })
      else if (role === 'adv')
        nomCats.push({ name: 'Adverbial Accusative', desc: 'In the GNT, the accusative used adverbially modifies the verb rather than receiving its action. Three major types:\n\n• Accusative of Extent of Time: answers "how long?" — "he fasted forty days and forty nights" (τεσσεράκοντα ἡμέρας καὶ νύκτας, Matt 4:2); "he remained there two years" (Acts 28:30). The most common adverbial accusative in the GNT.\n\n• Accusative of Extent of Space: answers "how far?" — "about a stone\'s throw away" (Luke 22:41). Less frequent than the temporal form.\n\n• Accusative of Manner (Adverbial Accusative): functions as an adverb — δωρεάν ("freely, without payment," Matt 10:8), μάτην ("in vain," Matt 15:9), ἀρχήν ("at all," John 8:25). Many Greek adverbs are fossilized accusative forms of nouns or adjectives.\n\nDiagnostic: if the accusative does not receive the verbal action and answers "how long?", "how far?", or "in what manner?", it is adverbial. The absence of a preposition and the inability to ask "whom/what?" of the verb confirms this (GGBB pp. 200–203).', level: 'intermediate' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole)
        nomCats.push({ name: 'Compound Direct Object', desc: 'In the GNT, a compound direct object consists of two or more accusative nouns or noun phrases joined by a coordinating conjunction (καί, ἤ, ἀλλά), each receiving the action of the verb.\n\nIdentifying mark: a coordinating conjunction appears between the elements. Each element is a distinct entity sharing the same object role.\n\nDistinguish from Accusative in Apposition: in apposition, NO conjunction links the two accusatives — they stand directly adjacent and refer to the same entity. In a compound, the conjunction signals different referents sharing the same clause role. Distinguish from the double accusative: in a double accusative, one accusative is the object and the other predicates something of it — no conjunction links them (GGBB pp. 48–50, 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.prevHeadNounExists)
        nomCats.push({ name: 'Accusative in Apposition', desc: 'In the GNT, an accusative appositive renames or further identifies a preceding accusative noun, agreeing with it in case. The appositive refers to the same entity as its head noun — it adds a title, name, or descriptive clarification without introducing a new participant.\n\nTest: insert "namely" or "that is" between the head noun and this word. If both refer to the same person or thing, the relationship is appositive. No coordinating conjunction (καί, ἤ) stands between the head noun and the appositive — they are directly adjacent.\n\nAccusative apposition is common after direct objects with proper names or titles: "they saw Jesus, the Christ" — Ἰησοῦν τὸν Χριστόν (GGBB pp. 48–50).', level: 'intermediate' })
      else
        nomCats.push({ name: 'Accusative', desc: 'In the GNT, accusatives that are not direct objects typically function adverbially. An accusative of manner describes how an action is done; an accusative of extent measures duration or distance; an accusative of respect limits the scope of the predicate. Consider whether this accusative modifies the verb rather than receiving its action (GGBB pp. 176–205).', level: 'intermediate' })
    }

    else if (kase === 'Vocative') {
      nomCats.push({ name: 'Vocative of Address', desc: 'In the GNT, the vocative appears frequently in direct speech — addressing God, Jesus, or persons. It is syntactically independent of the surrounding clause. The articular nominative is sometimes substituted for the vocative, especially in Revelation. Common GNT vocatives include κύριε, πάτερ, and ἀδελφοί (GGBB p. 67).', level: 'beginner' })
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — ARTICLE
  // ══════════════════════════════════════════════════════════════════════════
  if (pos === 'Article') {
    if (cls === 'np' && !syn?.h)
      cats.push({ name: 'Substantizer', desc: 'In the GNT, the article substantizes participles (ὁ πιστεύων = "the one who believes"), adjectives (οἱ πτωχοί = "the poor"), infinitives (τὸ πιστεύειν = "believing"), adverbs, and prepositional phrases, converting them into nouns that can fill any nominal slot in the clause. This is a highly productive construction throughout the GNT (GGBB p. 236).', level: 'intermediate' })
    else
      cats.push({ name: 'Definite Article', desc: 'In the GNT, the article identifies its noun as known, unique, or previously introduced. Its presence or absence carries major exegetical weight: it governs the Granville Sharp rule (two nouns sharing one article refer to one person), Colwell\'s rule (anarthrous predicate nominatives before the verb tend to be definite), and Sharp constructions in Christological texts (e.g., Titus 2:13). An anarthrous noun is not automatically indefinite — context and genre determine definiteness (GGBB pp. 206–290).', level: 'beginner' })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 — FINITE VERB
  // ══════════════════════════════════════════════════════════════════════════
  if (isVerb && mood !== 'Participle' && mood !== 'Infinitive') {

    if (mood === 'Indicative') {
      if (syn?.cond === 1 || (ctx?.precedingConj === 'εἰ' && tense !== 'Future'))
        cats.push({ name: 'First-Class Condition', desc: 'In the GNT, first-class conditions (εἰ + indicative) assume the premise for the sake of argument — not necessarily because it is actually true. Jesus uses them to argue from granted premises: "If you then, being evil, know how to give good gifts..." (Matt 7:11). The condition only asserts what is granted rhetorically, not what is factually so (GGBB p. 450).', level: 'beginner' })
      else if (syn?.cond === 2)
        cats.push({ name: 'Second-Class Condition', desc: 'In the GNT, second-class conditions (εἰ + secondary indicative, ἄν in the apodosis) treat the premise as contrary to fact. They occur about 50 times and argue from unreal scenarios: "If they had known, they would not have crucified the Lord of glory" (1 Cor 2:8). The condition explicitly denies the reality of the premise (GGBB p. 694).', level: 'intermediate' })
      else if (tense === 'Present') {
        cats.push({ name: 'Present Indicative', desc: 'In the GNT, the present indicative most often describes an action in progress or a condition currently existing. It also expresses timeless truths (gnomic: "God is love," 1 John 4:8), vivid past narration (historical present, especially common in Mark), habitual actions (customary), and certain future events (futuristic). The historical present is so frequent in Mark that its force must be evaluated individually. Context determines which use is in view (GGBB pp. 514–539).', level: 'beginner' })
        cats.push({ name: 'Present — Identifying the Nuance', desc: 'Apply these tests to determine which present use is in view:\n\n1. Progressive (default): Action currently in progress — "he is teaching." Most common; use this unless another cue overrides it.\n\n2. Customary / Iterative: A repeated or habitual pattern — "he always fasts twice a week" (Luke 18:12). Look for adverbs of frequency or universal statements.\n\n3. Gnomic: A timeless truth that experience has proved — "God is love" (1 John 4:8). No temporal anchor; translate with the English simple present.\n\n4. Historical Present: A vivid past narrative in the present tense, extremely common in Mark (λέγει, ἔρχεται). Translate with the English simple past in most narrative contexts.\n\n5. Futuristic: A future event so certain it is described as if present — "I am going to the Father" (John 14:12). Requires an unambiguous future-pointing context.\n\nThe verb\'s Aktionsart constrains interpretation: stative verbs rarely appear as historical presents; activity verbs appear in all five uses (GGBB pp. 514–539).', level: 'intermediate' })
      } else if (tense === 'Imperfect') {
        cats.push({ name: 'Imperfect Indicative', desc: 'In the GNT, the imperfect describes a past action as ongoing, repeated, or attempted. The progressive imperfect is most common: "he was teaching" (ἐδίδασκεν). The conative imperfect captures an attempted but incomplete action: "he was trying to prevent him" (Matt 3:14, ἐκώλυεν). The ingressive imperfect marks entry into a state. Distinguishing these nuances requires attention to context and the lexical meaning of the verb (GGBB pp. 540–553).', level: 'beginner' })
        cats.push({ name: 'Imperfect — Conative, Progressive, or Ingressive?', desc: 'To determine the imperfect nuance, apply these diagnostic steps:\n\n1. Progressive (default): The action was in progress at a past reference point — "he was teaching" (ἐδίδασκεν). Use this unless another marker overrides it.\n\n2. Conative (attempted action): The verb implies effort that was not completed. Look for context suggesting resistance or failure — "he was trying to prevent him" (Matt 3:14, ἐκώλυεν). Verbs of motion, persuasion, and prevention are especially prone to this reading.\n\n3. Ingressive (entry into a state): The imperfect focuses on the onset of a process. Common with stative verbs where the beginning of the condition is in view.\n\n4. Iterative: A repeatedly occurring past action — supported by adverbials of frequency and the context.\n\nKey diagnostic: if the surrounding clause implies resistance, incompletion, or interruption, test for the conative before defaulting to the progressive (GGBB pp. 540–553).', level: 'intermediate' })
      } else if (tense === 'Aorist') {
        cats.push({ name: 'Aorist Indicative', desc: 'In the GNT, the aorist indicative is the most common past-tense form, viewing the action as a whole without reference to its duration or progress. The constative aorist summarizes: "God loved the world" (ἠγάπησεν, John 3:16). The ingressive aorist stresses entry into a state: "he became rich" (ἐπτώχευσεν, 2 Cor 8:9). The culminative focuses on the end result: "he finished the course" (2 Tim 4:7). Context and verb lexeme indicate which nuance is intended (GGBB pp. 554–565).', level: 'beginner' })
        cats.push({ name: 'Aorist — Constative, Ingressive, Culminative, or Gnomic?', desc: 'To determine the aorist nuance, apply these tests in sequence:\n\n1. Constative (default): The action is summarized as a whole without specifying onset or completion. Most narrative aorists are constative — "God loved the world" (John 3:16). If no other cue is present, treat the aorist as constative.\n\n2. Ingressive: The verb marks entry into a state or the onset of a process. Look for stative or process verbs (βασιλεύω, πλουτέω, πιστεύω) where context points to a change of state — "he became rich" (ἐπτώχευσεν, 2 Cor 8:9).\n\n3. Culminative: The context focuses on the end-result of a completed process. Common with achievement and completion verbs (εὑρίσκω, λαμβάνω, τελέω) — "he finished the course" (2 Tim 4:7).\n\n4. Gnomic: A timeless proverbial truth stated as an already-proved fact. Found in wisdom and paraenetic contexts — "the flower falls" (James 1:11). Translate with the English simple present.\n\n5. Epistolary: The author writes from the reader\'s temporal perspective, treating a present dispatch as past. Common in Pauline closings — "I am sending Tychicus" (Eph 6:22).\n\nThe verb\'s Aktionsart (lexical aspect) is the decisive factor: stative verbs in the aorist skew ingressive; process verbs skew culminative; most event verbs default to constative (GGBB pp. 554–565).', level: 'intermediate' })
      } else if (tense === 'Perfect') {
        cats.push({ name: 'Perfect Indicative', desc: 'In the GNT, the perfect typically expresses a past action with continuing present effects — its most theologically significant tense. The intensive perfect stresses the present state: γέγραπται ("it stands written"), used when citing Scripture. The extensive perfect stresses the completed action: "I have fought the good fight" (2 Tim 4:7). The culminating use is τετέλεσται ("It is finished," John 19:30), combining both aspects. The perfect carries more present-consequence force than any other Greek tense (GGBB pp. 572–582).', level: 'beginner' })
        cats.push({ name: 'Perfect — Intensive or Extensive?', desc: 'The perfect\'s two main nuances require careful distinction:\n\n1. Intensive (Resultative): Stresses the present state produced by a past act. The past action recedes; the current condition is in focus. γέγραπται ("it stands written") — the abiding scriptural authority is what is asserted. πέπεισμαι ("I am convinced") — the state of conviction persists.\n\n2. Extensive (Consummative): Stresses the completed past act, though its effects remain. "I have fought the good fight" (2 Tim 4:7) — the completion of the fight is emphasized.\n\nDiagnostic: Can you paraphrase with "it now is…" (intensive) or "it has been accomplished…" (extensive)? The intensive is more common in the GNT.\n\nTheological significance: the intensive perfect undergirds key NT assertions — γέγονεν ("now is," Rev 21:6), τετέλεσται ("it is finished," John 19:30), ἐγήγερται ("he is risen," 1 Cor 15:4). In each, the present consequence of the past event is precisely what the author asserts (GGBB pp. 572–582).', level: 'intermediate' })
      } else if (tense === 'Pluperfect')
        cats.push({ name: 'Pluperfect Indicative', desc: 'In the GNT, the pluperfect is rare (about 86 occurrences) and describes a past state or action that preceded another past point. The intensive pluperfect stresses the past state: "the door had been shut" (John 20:19). The extensive stresses the prior completed action that produced it. Because it is rare, its presence often signals special emphasis on a background condition preceding the main narrative event (GGBB pp. 583–586).', level: 'intermediate' })
      else if (tense === 'Future') {
        cats.push({ name: 'Future Indicative', desc: 'In the GNT, the future indicative most commonly makes a predictive assertion: "you will see the Son of Man seated at the right hand of Power" (Matt 26:64). In OT quotations it often carries imperatival force following LXX usage: "you shall love the Lord your God" (Matt 22:37). Deliberative futures pose rhetorical questions about what should be done: "What shall we say?" (Rom 6:1). The predictive use is by far the most common (GGBB pp. 566–571).', level: 'beginner' })
        cats.push({ name: 'Future — Predictive, Imperatival, or Deliberative?', desc: 'Three uses of the future require distinction:\n\n1. Predictive (default): A straightforward assertion about a coming event — "you will see the Son of Man" (Matt 26:64). Apply this when no other marker is present.\n\n2. Imperatival: The future states a command, especially in OT citations following LXX conventions — "you shall love the Lord your God" (Matt 22:37, citing Deut 6:5); "you shall not murder" (Matt 5:21). Identified by OT allusion or second-person moral/legal content.\n\n3. Deliberative: A rhetorical question using the future to ask what should be done — "What shall we say?" (Rom 6:1); "Shall we continue in sin?" (Rom 6:15). Always a question; often introduces a theological objection Paul then refutes.\n\nIn prophetic contexts, also watch for the proleptic future — a future event described with such certainty that it may be rendered as already accomplished (GGBB pp. 566–571).', level: 'intermediate' })
      }
    }

    else if (mood === 'Subjunctive') {
      const person = parse.person ?? ''
      const number = parse.number ?? ''

      if (ctx?.emphNeg)
        cats.push({ name: 'Subjunctive — Emphatic Negation (οὐ μή)', desc: 'In the GNT, οὐ μή + subjunctive (usually aorist) is the strongest negation available in Greek — it categorically rules out any future possibility of the action occurring. The double negative intensifies rather than cancels: οὐ contributes indicative-type denial; μή adds subjunctive-type anticipatory negation, together forming an absolute prohibition or denial. This construction occurs throughout the sayings of Jesus and in OT quotations ("heaven and earth will by no means pass away," Matt 24:35; "whoever keeps my word will never see death," John 8:51).\n\nTranslate: "will never," "by no means," "certainly not." It differs from simple μή + subjunctive (prohibition) and from ordinary indicative negation (οὐ/οὐκ) in its emphatic, absolute force. Wallace counts it as one of the most vivid constructions in Greek (GGBB p. 468).', level: 'intermediate' })
      else if (syn?.cond === 3 || ctx?.precedingConj === 'ἐάν')
        cats.push({ name: 'Subjunctive — Third-Class Condition (ἐάν)', desc: 'In the GNT, third-class conditions use ἐάν (= εἰ + ἄν) + subjunctive in the protasis and any mood/tense in the apodosis. They are by far the most common conditional type in the GNT, with more than 300 examples. Third-class conditions present a future possibility — the speaker regards the condition as real in its possibility but does not assert whether it will actually be fulfilled.\n\nStructure: ἐάν + subjunctive (protasis) → indicative/imperative/future (apodosis)\nExample: ἐάν τις τὸν λόγον μου τηρήσῃ — "if anyone keeps my word" (John 8:51).\n\nThe subjunctive in the protasis captures the tentative, open quality: the condition is genuinely possible, but the speaker leaves the outcome open. This differs from first-class conditions (εἰ + indicative = assumed true for argument) and second-class conditions (εἰ + indicative past = assumed false). Third-class conditions are especially common in Johannine and Pauline exhortatory contexts (GGBB pp. 696–699).', level: 'beginner' })
      else if (ctx?.precedingConj === 'ἵνα' || ctx?.precedingConj === 'ὅπως')
        cats.push({ name: 'Subjunctive — Purpose / Result Clause (ἵνα)', desc: 'In the GNT, ἵνα (or ὅπως) + subjunctive is one of the most frequent constructions, occurring over 650 times. Its primary function is to express purpose — "in order that," answering "why?" about the preceding action or command. It also expresses result — "so that" — and in later Koine style, content or epexegesis (what the action consists of).\n\nDistinguishing purpose from result is often theologically decisive: was the cross purposed by God to achieve atonement, or did atonement merely result from it? Purpose ἵνα looks forward (goal-oriented); result ἵνα looks backward (describing what follows).\n\nTest:\n• Purpose: the main verb implies intention, command, or design — "he sent his son in order that the world might be saved" (John 3:17).\n• Result: the ἵνα clause describes the outcome — "he was born blind so that the works of God might be displayed" (John 9:3).\n• Epexegetical: the ἵνα clause defines what a noun or pronoun means — "this is the will of God, namely that you abstain" (1 Thess 4:3).\n\nThe subjunctive after ἵνα is the standard GNT form; the optative occasionally appears in more literary authors (GGBB pp. 472–476).', level: 'beginner' })
      else if (person === 'First' && number === 'Plural')
        cats.push({ name: 'Subjunctive — Hortatory', desc: 'In the GNT, the hortatory subjunctive uses a first-person plural present or aorist subjunctive to invite or urge shared action — "let us…" The speaker includes themselves among those being exhorted, giving the construction a corporate or communal tone. It is the Greek equivalent of the English cohortative.\n\nExamples: ἀγαπῶμεν ἀλλήλους — "let us love one another" (1 John 4:7); προσερχώμεθα — "let us draw near" (Heb 4:16); φοβηθῶμεν — "let us fear" (Heb 4:1).\n\nAspect matters:\n• Present hortatory: calls for ongoing or habitual action — "let us keep on loving one another."\n• Aorist hortatory: calls for a specific, decisive act — "let us go," "let us approach."\n\nThe hortatory subjunctive is common in epistolary paraenesis (Pauline and Hebrews) and in narrative sections where characters urge collective action. It is the primary means of issuing first-person plural commands in Greek, since Greek has no first-person imperative (GGBB pp. 464–465).', level: 'beginner' })
      else if (ctx?.hasPrecedingMh && tense === 'Aorist')
        cats.push({ name: 'Subjunctive — Prohibition (μή + Aorist)', desc: 'In the GNT, μή + aorist subjunctive expresses a prohibition — a command not to do something. The aorist aspect focuses on the action as a whole: the prohibition forbids beginning or doing the act at all ("do not start to," "do not do").\n\nThis construction contrasts with μή + present imperative, which commands someone to stop an action already in progress. The aorist subjunctive prohibition prevents the action before it starts; the present imperative prohibition stops it once underway.\n\nStructure: μή + aorist subjunctive (2nd person singular or plural)\nExamples: μὴ νομίσητε — "do not suppose" (Matt 5:17); μὴ μεριμνήσητε — "do not be anxious" (Matt 6:31); μή φοβηθῆτε — "do not fear" (Matt 10:31).\n\nThe μή here is the standard negative for subjunctive and imperative moods (Greek uses μή, not οὐ, with non-indicative moods). The subjunctive form rather than the imperative is chosen specifically for the aorist prohibition because no second-person aorist imperative is used for negative commands in the GNT (GGBB pp. 469–470).', level: 'intermediate' })
      else if (ctx?.hasPrecedingMh)
        cats.push({ name: 'Subjunctive — Negative Purpose / Fear Clause (μή)', desc: 'In the GNT, μή + present or aorist subjunctive (without a preceding οὐ) can express negative purpose — "lest," "in order that…not" — or introduce a fear clause after verbs of fearing or warning.\n\nNegative purpose: equivalent to ἵνα μή — "in order that X might not happen." Common in cautionary commands and warnings.\n\nFear clause: after verbs such as φοβέομαι, βλέπω (in the sense of "watch out"), or ὁράω ("see to it"), μή + subjunctive expresses what is feared — "I fear lest you have believed in vain" (Gal 4:11); "see to it that no one misleads you" (Matt 24:4).\n\nDistinguish from prohibition: prohibition uses μή + aorist subjunctive as the main construction of the sentence (no prior verb of fearing). Fear and negative purpose clauses depend on a main verb expressing caution, concern, or intent (GGBB pp. 473–476).', level: 'intermediate' })
      else if (ctx?.precedingConj === 'ἄν' || ctx?.precedingConj === 'ὅταν')
        cats.push({ name: 'Subjunctive — Indefinite Relative/Temporal Clause', desc: 'In the GNT, the indefinite relative/temporal construction pairs a relative or temporal particle with ἄν + subjunctive to express an open, generalized condition — the action applies to any person, time, or circumstance that fulfills it.\n\nCommon patterns:\n• ὅς/ὅστις ἄν + subjunctive: "whoever" — any person who fulfills the condition (Matt 10:32–33; Mark 8:35; 1 Cor 11:27).\n• ὅταν (= ὅτε + ἄν) + subjunctive: "whenever" — any time the condition is met (Matt 6:2; Mark 13:11; John 10:4).\n• ἕως ἄν + subjunctive: "until" — action continues up to the point the condition is fulfilled (Matt 5:18; Mark 14:25).\n• ὅπου ἄν + subjunctive: "wherever" — generalized location (Mark 6:10; 14:14).\n\nThe ἄν particle marks the clause as indefinite — it signals that no specific occasion is in view, only the general type. The subjunctive captures the open, potential character: not a specific past event, but any occurrence of the type.\n\nDistinguish from the third-class condition (ἐάν = εἰ + ἄν), which is a genuine condition about a single future scenario. Indefinite relative clauses with ὅστις ἄν assert a universal principle — "whoever denies me, I also will deny" — rather than a contingent if-then relationship (GGBB pp. 478–480).', level: 'beginner' })
      else
        cats.push({ name: 'Subjunctive', desc: 'In the GNT, the subjunctive is the mood of probability, anticipation, and contingency — it presents the action as possible, expected, or desired rather than as a simple fact. When no specific introductory particle or morphological signal narrows the use, consider these categories in order:\n\n1. Deliberative: a rhetorical or genuine question asking what to do — "what shall we say?" (τί οὖν ἐροῦμεν;) — common in Paul.\n2. Indefinite relative/temporal: ὅς ἄν, ὅταν, ἕως ἄν + subjunctive — "whoever," "whenever," "until."\n3. Conditional: εἰ + subjunctive (rare, often in later texts).\n\nCheck the preceding clause for ἵνα/ὅπως (purpose/result), ἐάν (third-class condition), μή (prohibition or negative purpose), or οὐ μή (emphatic negation). If the verb is first person plural, consider the hortatory use ("let us…") (GGBB pp. 461–480).', level: 'beginner' })
    }

    else if (mood === 'Imperative') {
      cats.push({ name: 'Imperative', desc: 'In the GNT, the imperative mood expresses commands, requests, and prohibitions. The present imperative calls for continuous or habitual action, or — with μή — for stopping an action in progress (μή + present imperative = "stop doing X"). The aorist imperative calls for a specific act to be performed. Aspect in the imperative is often exegetically significant: "be being filled with the Spirit" (Eph 5:18, present) versus "repent" (Acts 2:38, aorist). Prohibition uses μή + aorist subjunctive rather than aorist imperative (GGBB pp. 485–492).', level: 'beginner' })
      cats.push({ name: 'Imperative — Present vs. Aorist Aspect', desc: 'The tense of the imperative carries aspectual force that is often exegetically decisive:\n\n1. Present Imperative: Commands an ongoing, continuous, or habitual action — "be doing X" or "keep on doing X." With μή: "stop doing what you are already doing" (μή + present imperative = cessation of an action in progress).\n\n2. Aorist Imperative: Commands a specific, punctiliar act to be performed — "do X" (no reference to duration). With μή + aorist subjunctive: prohibition of an action not yet begun ("do not start").\n\nDiagnostic questions:\n• Is the command for an ongoing lifestyle or a one-time act?\n• Is the context calling for cessation (stop) or prevention (don\'t start)?\n\nExamples of exegetical significance:\n• "Be filled with the Spirit" (Eph 5:18, present) — continuous, ongoing filling.\n• "Repent" (Acts 2:38, aorist) — a decisive, once-for-all turning.\n• "Do not be anxious" (Phil 4:6, present) — stop the ongoing anxiety.\n• "Do not give dogs what is holy" (Matt 7:6, aorist) — do not do this at all (GGBB pp. 485–492).', level: 'intermediate' })
    }

    else if (mood === 'Optative') {
      cats.push({ name: 'Optative', desc: 'In the GNT, the optative is rare (68 occurrences) and expresses a wish or remote possibility. Its most recognizable use is μὴ γένοιτο ("may it never be!"), Paul\'s emphatic rejection of a proposed conclusion — appearing 14 times in Romans and Galatians. It also appears in prayers ("may the Lord direct your hearts," 2 Thess 3:5) and in indirect questions (Acts 17:11). Its rarity makes each occurrence worth careful attention (GGBB pp. 480–484).', level: 'intermediate' })
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 5 — CONDITIONAL MARKERS
  // ══════════════════════════════════════════════════════════════════════════
  if (syn?.cond === 1 && mood !== 'Indicative')
    cats.push({ name: 'First-Class Condition', desc: 'In the GNT, first-class conditions assume the protasis for the sake of the argument, not as a factual claim. They introduce the εἰ + indicative clause. Any part of the conditional sentence not in the indicative is still identified as part of a first-class condition by the structure of the surrounding clause (GGBB p. 450).', level: 'beginner' })
  if (syn?.cond === 2 && mood !== 'Indicative')
    cats.push({ name: 'Second-Class Condition', desc: 'In the GNT, second-class conditions treat the protasis as contrary to fact. They occur about 50 times and argue from explicitly unreal scenarios. This word appears in the apodosis or elsewhere in a second-class conditional sentence whose εἰ + secondary indicative structure marks it as contrary-to-fact (GGBB p. 694).', level: 'intermediate' })
  if (syn?.cond === 4)
    cats.push({ name: 'Fourth-Class Condition', desc: 'In the GNT, fourth-class conditions (εἰ + optative in the protasis) express a merely remote possibility. No complete fourth-class conditional sentence is preserved in the GNT where both protasis and apodosis are in the optative; only partial examples survive, as in Acts 24:19 and 1 Pet 3:14 (GGBB p. 699).', level: 'intermediate' })

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 6 — INFINITIVE
  // ══════════════════════════════════════════════════════════════════════════
  if (isVerb && mood === 'Infinitive') {
    const infPrep = ctx?.governingPrep ?? null
    if (ctx?.precedingConj === 'ὥστε')
      cats.push({ name: 'Result Infinitive (ὥστε)', desc: 'In the GNT, ὥστε + infinitive expresses result — the actual or intended outcome of the main action: "so that the crowds marveled" (ὥστε θαυμάζειν τοὺς ὄχλους, Matt 9:33); "so as to deceive, if possible, even the elect" (Matt 24:24). The result may be actual (what happened) or natural (what normally follows). ὥστε + infinitive is more common than ὥστε + indicative and is the standard result construction in the GNT. Distinguish from ἵνα + subjunctive, which more commonly expresses purpose (GGBB pp. 590–592).', level: 'beginner' })
    else if (ctx?.precedingConj === 'πρίν')
      cats.push({ name: 'Temporal Infinitive (πρίν)', desc: 'In the GNT, πρίν (or πρὶν ἤ) + infinitive introduces a temporal clause expressing prior time — "before [the action of the infinitive] happens": "before the rooster crows" (πρὶν ἀλέκτορα φωνῆσαι, Matt 26:34); "before Abraham was" (πρὶν Ἀβραὰμ γενέσθαι, John 8:58). The infinitive clause indicates the boundary before which the main action occurs. This construction is equivalent to a subordinate temporal clause with a finite verb (GGBB pp. 603–605).', level: 'beginner' })
    else if (infPrep === 'εἰς' || infPrep === 'πρός')
      cats.push({ name: 'Purpose Infinitive (Articular)', desc: `In the GNT, ${infPrep === 'εἰς' ? 'εἰς τό' : 'πρός τό'} + infinitive is the standard articular construction for expressing purpose — "in order to," "for the purpose of": "he came not to abolish but to fulfil" (Matt 5:17); "present your bodies… for the purpose of doing good" (Rom 12:1–2). The article (τό) nominalizes the infinitive so the preposition can govern it. εἰς τό leans toward goal-oriented purpose; πρός τό sometimes shades toward intended result. Both are clearly telic — they answer "why?" or "for what purpose?" (GGBB pp. 590, 607–611).`, level: 'beginner' })
    else if (infPrep === 'διά')
      cats.push({ name: 'Causal Infinitive (Articular)', desc: 'In the GNT, διὰ τό + infinitive expresses cause — "because of [the action of the infinitive]," "on account of doing": "because he had no root" (διὰ τὸ μὴ ἔχειν ῥίζαν, Matt 13:6); "because he saw that it pleased the Jews" (Acts 12:3). The infinitive clause states the reason behind the main action. This is the causal counterpart to εἰς τό (purpose): purpose asks "for what goal?"; cause asks "for what reason that already exists?" (GGBB pp. 596–597).', level: 'beginner' })
    else if (infPrep === 'ἐν')
      cats.push({ name: 'Temporal Infinitive (Articular)', desc: 'In the GNT, ἐν τῷ + infinitive expresses contemporaneous time — "while [doing]," "during [the action of]": "while he was sowing" (ἐν τῷ σπείρειν αὐτόν, Matt 13:4); "as he drew near to Jericho" (Luke 18:35). The action of the infinitive is simultaneous with the main verb. This construction is especially common in Luke, who uses it as a Septuagintalism modeled on the Hebrew בְּ + infinitive construct. Contrast πρίν + infinitive (prior time) and μετά + articular infinitive (subsequent time) (GGBB pp. 594–596).', level: 'beginner' })
    else if (role === 's')
      cats.push({ name: 'Substantival Infinitive (Subject)', desc: 'In the GNT, the infinitive as subject commonly appears in impersonal constructions with an adjective or noun as the predicate: "it is good to give thanks," "it is necessary to obey God." It fills the subject slot of the clause and is often articular (τὸ + infinitive). The articular infinitive as subject is a distinctively Greek construction (GGBB p. 601).', level: 'beginner' })
    else if (role === 'o')
      cats.push({ name: 'Substantival Infinitive (Object)', desc: 'In the GNT, the infinitive as direct object fills the object slot of the main verb. It most commonly appears as a complementary infinitive — completing verbs of desire, ability, beginning, or obligation: "he was not willing to come" (Matt 22:3), "they were not able to resist" (Acts 6:10). The infinitive here is the content of the wanting, being able, or beginning (GGBB p. 601).', level: 'beginner' })
    else if (role === 'vc')
      cats.push({ name: 'Complementary Infinitive', desc: 'In the GNT, the complementary infinitive completes the thought of a "helping verb" that would be semantically incomplete without it. The infinitive supplies the action; the main verb supplies the modality (ability, desire, obligation, permission, imminence).\n\nGNT verbs that regularly take a complementary infinitive:\nθέλω (to will / want) · βούλομαι (to wish / desire) · δύναμαι (to be able / can) · μέλλω (to be about to / intend) · ἄρχομαι (to begin) · ὀφείλω (to owe / ought) · δεῖ (it is necessary) · ἔξεστιν (it is lawful/permitted) · ζητέω (to seek to) · ἐπιτρέπω (to permit) · ἀφίημι (to allow / let) · πειράομαι (to attempt)\n\nDiagnostic: remove the infinitive — if the main verb becomes semantically incomplete ("he was able ___?", "he wanted ___?"), the infinitive is complementary. The infinitive here carries the main lexical content; the governing verb contributes only modal force (GGBB pp. 598–601).', level: 'beginner' })
    else
      cats.push({ name: 'Infinitive', desc: 'In the GNT, the infinitive serves several functions beyond direct object. The complementary infinitive is the most common, completing verbs of ability, desire, or beginning. Purpose infinitives appear with εἰς τό or πρός τό + infinitive. Result infinitives follow ὥστε. Temporal infinitives use ἐν τῷ (simultaneous action) or πρὶν (prior action). Causal infinitives use διὰ τό. Context — especially introductory prepositions and the main verb\'s semantics — identifies the specific function (GGBB pp. 590–611).', level: 'beginner' })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 7 — PARTICIPLE
  // ══════════════════════════════════════════════════════════════════════════
  if (isVerb && mood === 'Participle') {
    if (syn?.periph && syn?.c === 'vp')
      cats.push({ name: 'Periphrastic Participle', desc: 'In the GNT, periphrastic constructions (εἰμί + participle) are relatively common, especially in Luke-Acts and the Johannine letters. A present periphrastic (ἦν + present participle) stresses ongoing action: "he was teaching" (ἦν διδάσκων, Luke 5:17). A perfect periphrastic (ἦν + perfect participle) emphasizes a past completed state persisting into the narrative present. Luke uses periphrastics more than any other GNT author, often for stylistic vividness (GGBB p. 647).', level: 'intermediate' })
    else if (kase === 'Genitive' && cls === 'cl') {
      if (ctx?.hasGenitiveAbsSubject)
        cats.push({ name: 'Genitive Absolute', desc: 'In the GNT, the genitive absolute consists of a genitive noun or pronoun (the subject) paired with this genitive participle, forming a clause that is grammatically independent of the main sentence. Neither the subject nor the participle is syntactically connected to any element in the main clause — this independence is the defining feature.\n\nIdentification steps:\n1. Both the participle and its subject are in the genitive.\n2. The subject of the participle is not the same as (or co-referential with) the subject of the main verb.\n3. The construction sets a circumstantial backdrop — most commonly temporal.\n\nTranslation: "while…", "when…", or "after…" depending on whether the action is simultaneous with or prior to the main verb. The genitive absolute is especially frequent in narrative sections of the Gospels and Acts (e.g., αὐτοῦ ἐνθυμηθέντος, Matt 1:20 — "while he was considering these things") (GGBB p. 654).', level: 'intermediate' })
      else
        cats.push({ name: 'Substantival Participle (Anarthrous)', desc: 'In the GNT, participles can function as nouns without the article, though the articular participle is far more common for this use. The anarthrous substantival participle typically fills a genitive slot — "the voice of one crying" (φωνὴ βοῶντος, Matt 3:3, citing Isa 40:3). Here the genitive participle names the actor or action that defines the head noun, equivalent to a genitive noun phrase.\n\nDistinguish from the genitive absolute: the absolute requires a genitive subject paired with the participle (a noun or pronoun that is not co-referential with the main clause subject). When no such genitive subject is present, the participle more likely functions substantivally — naming a person or action in the genitive case.\n\nAnarthrous substantival participles are more common in quotations from the LXX and in proverbial or general statements (GGBB pp. 619–620).', level: 'intermediate' })
    }
    else if (role === 'v' && cls === 'cl' && syn?.gc === 'np') {
      if (syn?.gr)
        // The participial clause has a grammatical role in its grandparent context → it functions as a noun
        cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the articular substantival participle functions as a noun by using the article to nominalize an entire participial clause: τὸ ῥηθέν ("the thing spoken," Matt 1:22), τὸ γεγραμμένον ("what has been written"), τὰ ὑπάρχοντα ("one\'s possessions"). The article converts the clause into a nominal unit that can serve as subject, object, appositive, or any other nominal role in the sentence. This is distinct from the common ὁ πιστεύων ("the one who believes") pattern, which refers to a person; the neuter articular participle (τό + participle) typically refers to an action or content. The grandparent NP\'s role in the clause (gr) indicates how the nominalized unit functions (GGBB pp. 619–621).', level: 'beginner' })
      else
        // The participial clause merely modifies the NP's head noun → attributive/adjectival function
        cats.push({ name: 'Adjectival (Attributive) Participle', desc: 'In the GNT, the attributive participle is used with the article to modify a specific noun in the clause, functioning like a relative clause — "the one who is about to come" (ὁ μέλλων ἔρχεσθαι, Matt 11:14), "the scribes who came down from Jerusalem" (οἱ ἀπὸ Ἱεροσολύμων καταβάντες, Mark 3:22). It restricts or defines its head noun rather than asserting something independently.\n\nTwo attributive positions:\n1. Article + participle + noun: ὁ πιστὸς δοῦλος ("the faithful servant")\n2. Noun + article + participle: ὁ δοῦλος ὁ πιστός (same meaning, more emphatic)\n\nContrast with the adverbial (circumstantial) participle, which modifies the verb and stands without an article (GGBB p. 617).', level: 'beginner' })
    }
    else if (role === 's' || role === 'o' || role === 'p')
      cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the substantival participle functions as a noun and is most commonly articular, referring to a class of persons defined by the verbal action: ὁ πιστεύων ("the one who believes"), οἱ σῳζόμενοι ("those who are being saved"). This construction is widespread in John, Paul, and the Synoptics and often carries theological definition — describing believers, those who obey, or those who belong to Christ (GGBB p. 619).', level: 'beginner' })
    else if (cls === 'np') {
      if (ctx?.precedingArticle && !ctx?.nounBeforeArticle)
        // Article immediately before the participle, no noun before that article →
        // the article nominalizes the participle itself (substantival use).
        // Any noun that follows stands in apposition to the substantival participle.
        cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the articular substantival participle functions as a noun: the article directly precedes the participle and nominalizes it, making the entire participial unit refer to a person or class — ὁ πιστεύων ("the one who believes"), ὁ τεχθεὶς ("the one who was born," Matt 2:2). Any noun that follows (e.g., βασιλεὺς τῶν Ἰουδαίων) stands in apposition to the substantival participle rather than as its head. This is one of the most productive constructions in the GNT: John uses it to define believers (ὁ πιστεύων), Paul uses it for theological description, and the Synoptics use it in narrative identification (GGBB pp. 619–621).', level: 'beginner' })
      else if (ctx?.precedingArticle && ctx?.nounBeforeArticle)
        // Noun + Article + Participle (second attributive position): the noun
        // owns its own article that also governs the following participle.
        cats.push({ name: 'Adjectival (Attributive) Participle', desc: 'In the GNT, the attributive participle in the second position follows the pattern Noun + Article + Participle, where the article and participle together modify the preceding noun — τὸ ὕδωρ τὸ ζῶν ("the living water," John 4:10), ὁ δοῦλος ὁ πιστός ("the faithful servant"). The noun and the article-participle group agree in case, number, and gender. This position is more emphatic than the first position (article + participle + noun) and draws attention to the attributive quality. It functions like a relative clause restricting the noun (GGBB p. 617).', level: 'beginner' })
      else
        cats.push({ name: 'Adjectival (Attributive) Participle', desc: 'In the GNT, the attributive participle most commonly appears in the articular position (article + participle qualifying a noun) and functions like a relative clause. It is common in Johannine and Pauline literature: τὸ ὕδωρ τὸ ζῶν ("the living water," John 4:10), τοῖς ἀγαπῶσιν τὸν θεόν ("to those who love God," Rom 8:28). It restricts or describes the noun rather than asserting something about it (GGBB p. 617).', level: 'beginner' })
    }
    else {
      cats.push({ name: 'Adverbial (Circumstantial) Participle', desc: "In the GNT, the adverbial participle is the most common participle use. It is typically anarthrous and relates to the main verb by expressing the circumstance — time, cause, means, manner, condition, concession, or purpose — under which the main action occurs. Greek readers determine the specific relationship from context; the tense of the participle does not mechanically determine the relationship. Translation typically begins with 'while,' 'after,' 'because,' 'by,' or 'although' (GGBB p. 622).", level: 'beginner' })
      cats.push({ name: 'Adverbial Participle — Identifying the Use', desc: 'To determine which adverbial relationship this participle expresses, apply these tests in order:\n\n1. Temporal (most common): When does the main action occur? An aorist participle typically precedes the main verb in time ("after doing X, he did Y"); a present participle is typically contemporaneous ("while doing X, he did Y"). Translate: "after," "when," "while."\n\n2. Causal: Why does the main action occur? The participle gives the reason. Common when the participle precedes the main verb and explains it. Translate: "because," "since."\n\n3. Means: How is the main action accomplished? The participle names the instrument or method. Translate: "by doing X." Especially common in John and Acts for the means of a sign or action.\n\n4. Manner: In what way? The participle describes the style or quality of the action. Translate: "doing X" or as an adverb. Closely related to means; manner emphasizes the quality, means the method.\n\n5. Conditional: Under what condition? The participle functions like the protasis of a conditional sentence. Translate: "if." Identified when the action of the participle must precede or accompany the main verb as a condition.\n\n6. Concessive: Despite what? The action of the main verb is surprising in light of the participle. Translate: "although," "even though." Often indicated by context of contrast.\n\n7. Purpose: For what goal? The participle expresses intention, most naturally with future-oriented participles (rare in the GNT). Translate: "in order to."\n\nKey principle (Campbell / Wallace): the tense of the participle signals aspect — how the action is viewed — not its temporal relation to the main verb. Context is the decisive factor (GGBB pp. 622–640).', level: 'intermediate' })
    }
    // Append case description after participle use — skip for genitive absolute
    // participles (the case is already part of the construction label)
    cats.push(...(kase === 'Genitive' && cls === 'cl' ? [] : partCaseCats))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 8 — OTHER PARTS OF SPEECH
  // ══════════════════════════════════════════════════════════════════════════
  if (pos === 'Preposition')
    cats.push({ name: 'Preposition', desc: 'In the GNT, the 18 proper prepositions govern nouns in a specific case — accusative, genitive, or dative — and are among the most semantically dense words in the text. The case is lexically fixed by the preposition; several prepositions take more than one case with distinct meanings (e.g., διά + genitive = "through/by means of"; διά + accusative = "because of"). ἐν alone occurs over 2,700 times. Identifying the preposition and its case is the essential first step in analyzing any prepositional phrase (GGBB pp. 356–389).', level: 'beginner' })

  if (pos === 'Conjunction' || pos === 'Particle' || pos === 'Conditional') {
    const lex = ctx?.wordLexeme ?? null
    if (lex === 'ἵνα' || lex === 'ὅπως')
      cats.push({ name: 'ἵνα + Subjunctive', desc: 'In the GNT, ἵνα (or ὅπως) introduces a subjunctive clause that most commonly expresses purpose — "in order that." It also expresses result — "so that" — and in later GNT style, content or epexegesis. ἵνα + subjunctive is one of the most frequent constructions in the GNT, occurring over 650 times. The distinction between purpose and result often carries theological weight: was the cross purposed or merely resulted in atonement? Context and the meaning of the main verb determine the specific function (GGBB pp. 472–476).', level: 'beginner' })
    else if (cls === 'cl')
      cats.push({ name: 'Subordinating Conjunction', desc: 'In the GNT, subordinating conjunctions introduce dependent clauses that specify the relationship to the main clause: purpose (ἵνα, ὅπως), cause (ὅτι, διότι, γάρ), condition (εἰ, ἐάν), result (ὥστε), time (ὅτε, ἐπεί, ὡς), or concession (εἰ καί, κἄν). Correctly identifying the type of subordinate clause is essential for understanding the author\'s logic and for accurate translation (GGBB pp. 668–685).', level: 'intermediate' })
    else
      cats.push({ name: 'Conjunction / Particle', desc: 'In the GNT, coordinating conjunctions (καί, δέ, ἀλλά, οὐδέ) connect elements of equal grammatical rank. Postpositive particles (γάρ, οὖν, μέν) signal the author\'s logical or transitional moves — γάρ introduces explanation or support, οὖν draws an inference, μέν anticipates a contrasting δέ clause. Reading these connectives carefully is essential for tracing the flow of Paul\'s arguments, John\'s discourses, and narrative transitions in the Gospels (GGBB pp. 668–685).', level: 'beginner' })
  }

  if (pos === 'Adverb')
    cats.push({ name: 'Adverb', desc: 'In the GNT, adverbs are indeclinable and typically modify the verb. Common adverbs include οὕτως ("thus/so"), ἤδη ("already"), νῦν ("now"), πάλιν ("again"), and ὄντως ("really/certainly"). Many are fossilized case forms (accusatives or datives). Their position often signals emphasis. Adverbs of time, manner, and degree frequently carry theological weight in key GNT assertions (GGBB pp. 293–296).', level: 'beginner' })

  return cats
}
