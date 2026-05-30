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
  enclosingHeadPos?: string    // genitive: partOfSpeech of the enclosing head noun
  enclosingHeadLexeme?: string // genitive: lemma of the enclosing head noun (for partitive detection)
  mainVerbTense?: string | null // participle: tense of the nearest main clause verb (for attendant circumstance detection)
  nearbyConjunctionRole?: string  // a coordinating conjunction with a clause role (pr) appears within ~4 preceding words — signals compound subject/object rather than apposition
  prevHeadNounExists?: boolean    // when the preceding word is an article, the word before that article is a syntax head (h:true) — required for apposition detection
  nearbyModalVerb?: boolean       // a modal/auxiliary verb (δύναμαι, θέλω, etc.) appears within the preceding 4 words — signals complementary infinitive
  isArticular?: boolean           // the word immediately preceding this one is an article (used for Colwell's rule: articular nom = subject, anarthrous nom = predicate)
  hasPrecedingMh?: boolean        // μή appears in the 3 preceding words but οὐ μή emphatic negation is NOT in play — signals prohibition (μή + aorist subj) or negative purpose
  // ABS (Asian Bible Society) NT syntax tree function tag for this word
  absFunction?: string | null     // 'S' | 'O' | 'O2' | 'IO' | 'V' | 'P' | 'ADV' | 'VC'
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

// Lemmas and POS that typically govern a partitive genitive — the head noun denotes
// a subset or individual drawn from the genitive group.
const PARTITIVE_HEAD_LEMMAS = new Set([
  // cardinal numerals
  'εἷς', 'δύο', 'τρεῖς', 'τέσσαρες', 'πέντε', 'ἕξ', 'ἑπτά', 'ὀκτώ', 'ἐννέα', 'δέκα',
  'ἕνδεκα', 'δώδεκα', 'ἑκατόν', 'χίλιοι', 'μύριοι',
  // quantifiers and distributives
  'πολύς', 'ὀλίγος', 'πᾶς', 'ἅπας', 'ἕκαστος', 'ἑκάτερος', 'ἀμφότεροι',
  'οὐδείς', 'μηδείς',
  // ordinals / superlatives frequently used partitively
  'πρῶτος', 'ἔσχατος', 'μέγιστος', 'ἐλάχιστος', 'κράτιστος',
  // indefinite pronoun lemmas sometimes classed as adjective in tagging
  'τις',
])
const PARTITIVE_HEAD_POS = new Set(['Indefinite Pronoun', 'Interrogative Pronoun'])

// Lemmas of GNT nouns that carry an implied verbal idea — they are deverbal nouns
// (derived from, or closely cognate with, a Greek verb) and therefore can take a
// subjective genitive (genitive performs the action) or objective genitive
// (genitive receives the action).  The check is applied to the ENCLOSING HEAD NOUN,
// not the genitive word itself.
const ACTION_NOUN_LEMMAS = new Set([
  // ── Love / Faith / Hope / Joy / Peace ────────────────────────────────────────
  'ἀγάπη',        // love (← ἀγαπάω)
  'πίστις',       // faith, faithfulness (← πιστεύω)
  'ἐλπίς',        // hope (← ἐλπίζω)
  'χαρά',         // joy (← χαίρω)
  'εἰρήνη',       // peace (← εἰρηνεύω)
  'χάρις',        // grace, favour
  // ── Knowledge / Wisdom ───────────────────────────────────────────────────────
  'γνῶσις',       // knowledge (← γινώσκω)
  'ἐπίγνωσις',    // full knowledge (← ἐπιγινώσκω)
  'σοφία',        // wisdom (← σοφίζω)
  'συνέσις',      // understanding (← συνίημι)
  'φρόνησις',     // prudence, insight (← φρονέω)
  // ── Righteousness / Judgment / Sin ───────────────────────────────────────────
  'δικαιοσύνη',   // righteousness (← δικαιόω)
  'ἁμαρτία',      // sin (← ἁμαρτάνω)
  'κρίσις',       // judgment (← κρίνω)
  'κρίμα',        // judgment, verdict (← κρίνω)
  'ὀργή',         // wrath (← ὀργίζομαι)
  // ── Salvation / Redemption / Life / Death ────────────────────────────────────
  'σωτηρία',      // salvation (← σώζω)
  'ζωή',          // life (← ζάω)
  'θάνατος',      // death (← θνήσκω)
  'ἀνάστασις',    // resurrection (← ἀνίστημι)
  'ἀπολύτρωσις',  // redemption (← ἀπολυτρόω)
  'λύτρωσις',     // redemption (← λυτρόω)
  'λύτρον',       // ransom (← λυτρόω)
  'ἀφέσις',       // forgiveness, release (← ἀφίημι)
  'καταλλαγή',    // reconciliation (← καταλλάσσω)
  // ── Glory / Testimony / Revelation ───────────────────────────────────────────
  'δόξα',         // glory (← δοξάζω)
  'μαρτυρία',     // testimony, witness (← μαρτυρέω)
  'μαρτύριον',    // testimony, evidence (← μαρτυρέω)
  'ἀποκάλυψις',   // revelation (← ἀποκαλύπτω)
  'φανέρωσις',    // manifestation (← φανερόω)
  // ── Gospel / Word / Hearing ──────────────────────────────────────────────────
  'εὐαγγέλιον',   // gospel (← εὐαγγελίζω)
  'λόγος',        // word, message (← λέγω)
  'ἀκοή',         // hearing, report (← ἀκούω)
  // ── Calling / Promise / Obedience ────────────────────────────────────────────
  'κλῆσις',       // calling (← καλέω)
  'ἐπαγγελία',    // promise (← ἐπαγγέλλω)
  'ὑπακοή',       // obedience (← ὑπακούω)
  'παρακοή',      // disobedience (← παρακούω)
  // ── Prayer / Worship / Sacrifice ─────────────────────────────────────────────
  'προσευχή',     // prayer (← προσεύχομαι)
  'δέησις',       // petition, prayer (← δέομαι)
  'εὐχαριστία',   // thanksgiving (← εὐχαριστέω)
  'θυσία',        // sacrifice (← θύω)
  'λατρεία',      // worship, service (← λατρεύω)
  'προσκύνησις',  // worship (← προσκυνέω)
  // ── Exhortation / Comfort / Confession ───────────────────────────────────────
  'παράκλησις',   // comfort, exhortation (← παρακαλέω)
  'ὁμολογία',     // confession (← ὁμολογέω)
  'εὐχή',         // prayer, vow (← εὔχομαι)
  // ── Desire / Fear / Grief ────────────────────────────────────────────────────
  'ἐπιθυμία',     // desire, craving (← ἐπιθυμέω)
  'φόβος',        // fear (← φοβέομαι)
  'λύπη',         // grief, sorrow (← λυπέω)
  'πένθος',       // mourning (← πενθέω)
  // ── Baptism / Sanctification ─────────────────────────────────────────────────
  'βάπτισμα',     // baptism (← βαπτίζω)
  'βαπτισμός',    // baptism, washing (← βαπτίζω)
  'ἁγιασμός',     // sanctification (← ἁγιάζω)
  // ── Rule / Judgment / Service (agent/action nouns with cognate verbs) ─────────
  'ἄρχων',        // ruler, leader (← ἄρχω — to rule, to lead); e.g. ἄρχων τῶν Ἰουδαίων
  'ἀρχή',         // rule, beginning (← ἄρχω)
  'ἡγεμών',       // governor, leader (← ἡγέομαι — to lead, to consider)
  'κριτής',       // judge (← κρίνω — to judge)
  'διδάσκαλος',   // teacher (← διδάσκω — to teach)
  'διδαχή',       // teaching (← διδάσκω)
  'διδασκαλία',   // teaching, doctrine (← διδάσκω)
  'ἀπόστολος',    // apostle, one sent (← ἀποστέλλω — to send)
  'ποιητής',      // doer, maker (← ποιέω — to do, to make)
  'ἐργάτης',      // worker (← ἐργάζομαι — to work)
  'ἔργον',        // work, deed (← ἐργάζομαι)
  'πρεσβεία',     // embassy, representation (← πρεσβεύω — to be an ambassador)
  'ἐντολή',       // commandment (← ἐντέλλομαι — to command)
  'κήρυγμα',      // proclamation (← κηρύσσω — to proclaim)
  'κῆρυξ',        // herald (← κηρύσσω)
  'νίκη',         // victory (← νικάω — to conquer)
  'νῖκος',        // victory (← νικάω)
])

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
  //
  // Text-edition guard: the syntax data was built from the SBLGNT, but the
  // chapter text uses a slightly different edition in a handful of verses
  // (e.g. John 3:36 omits δέ, shifting all subsequent word IDs by 1).
  // When PROIEL assigns r:'v' (predicate/verb role) to a word whose
  // morphology is nominal (Noun, Adjective, Pronoun — never Verb),
  // the data entry belongs to a neighbouring word from the other edition.
  // Discard it and track the mismatch for the downstream heuristic.
  const synRoleMisaligned = syn?.r === 'v' && pos !== 'Verb'
  const role  = (synRoleMisaligned ? undefined : syn?.r)
             ?? (syn?.c === 'np' ? (syn?.pr ?? (syn?.h ? syn?.gr : undefined)) : undefined)
             ?? (ctx?.maculaRole ?? undefined)

  const rawPrep = ctx?.governingPrep ?? null
  const inPP = rawPrep === 'none' ? false
             : rawPrep            ? true
             : cls === 'pp' || syn?.gc === 'pp'

  // Colwell's Rule: in a verbless equative clause (S-P), articular nominative = subject,
  // anarthrous nominative = predicate nominative. This overrides the database role when
  // Macula marks the clause as S-P and articularity (ctx.isArticular) is known.
  const colwellRole = (
    kase === 'Nominative' &&
    ctx?.maculaClauseRule === 'S-P' &&
    (role === 's' || role === 'p') &&
    pos !== 'Relative Pronoun' &&
    ctx?.isArticular !== undefined
  ) ? (ctx.isArticular ? 's' : 'p') : role

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
      // 1st/2nd person personal pronouns (μου, σου, ἡμῶν, ὑμῶν) store the
      // person number ('1', '2') in the casus field rather than 'Genitive'.
      // These forms are genitive by morphology and are virtually always possessive.
      if (pos === 'Personal Pronoun' && (kase === '1' || kase === '2' || kase === '3') && parse.number === 'G') {
        nomCats.push({ name: 'Possessive Genitive', desc: 'In the GNT, personal pronouns in the genitive (μου, σου, αὐτοῦ/αὐτῆς, ἡμῶν, ὑμῶν, αὐτῶν) are used almost exclusively as possessives — "my," "your," "his/her," "our," "their." Wallace identifies this as the most straightforward use of the genitive pronoun: the pronoun simply indicates the possessor of the head noun. No further contextual testing is needed in most cases (GGBB p. 81).', level: 'beginner' })
      }
      else if (role === 's')
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
      else if (colwellRole === 'p')
        nomCats.push({ name: 'Predicate Nominative', desc: 'In the GNT, the predicate nominative follows an equative verb and defines, classifies, or describes the subject — it does not perform or receive an action. To distinguish subject from predicate when two nominatives flank an equative verb: (1) the articular nominative is normally the subject; (2) the anarthrous nominative is normally the predicate (Colwell\'s Rule). In John 1:1, ὁ λόγος (articular) is the subject; θεός (anarthrous, placed first for emphasis) is the predicate.\n\nCommon GNT equative verbs: εἰμί (to be), γίνομαι (to become), ὑπάρχω (to exist/be), φαίνομαι (to appear/seem), καλέομαι (to be called), λέγομαι (to be called), ὀνομάζομαι (to be named) (GGBB p. 40).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole && ctx?.nearbyLinkingVerb && !ctx?.isArticular)
        nomCats.push({ name: 'Compound Predicate Nominative', desc: 'In the GNT, a compound predicate nominative consists of two or more anarthrous nominative nouns or noun phrases joined by a coordinating conjunction (καί, ἤ) that together predicate something about the subject via an equative verb.\n\nIdentifying marks:\n1. An equative verb (εἰμί, γίνομαι) is present in the clause.\n2. A conjunction (καί, ἤ) links this nominal to another predicate element.\n3. This nominal lacks an article — by Colwell\'s Rule, the anarthrous nominative in an equative clause is normally the predicate, not the subject.\n\nExample: ἡ δὲ τροφὴ αὐτοῦ ἦν ἀκρίδες καὶ μέλι ἄγριον — "his food was locusts and wild honey" (Matt 3:4). The subject τροφή is articular (ἡ τροφή); ἀκρίδες and μέλι are the two compound predicates, both anarthrous.\n\nDistinguish from a compound subject: compound subjects contain the actors who perform the verb\'s action; the conjunction between them is not accompanied by an equative verb predicating something about them. Colwell\'s Rule: when two nominatives flank an equative verb, the articular one is the subject and the anarthrous one(s) are the predicate (GGBB pp. 40–46, 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole)
        nomCats.push({ name: 'Compound Subject', desc: 'In the GNT, a compound subject consists of two or more nominative nouns or noun phrases joined by a coordinating conjunction (most commonly καί). Each element is a distinct entity that independently performs the action of the verb.\n\nIdentifying mark: a coordinating conjunction (καί, ἀλλά, ἤ) appears between the elements — "Jerusalem and all Judea and all the region of the Jordan went out to him" (Ἱεροσόλυμα καὶ πᾶσα ἡ Ἰουδαία καὶ πᾶσα ἡ περίχωρος τοῦ Ἰορδάνου, Matt 3:5).\n\nDistinguish from Nominative in Apposition: in apposition, NO conjunction links the two nominals — they stand directly adjacent and refer to the same entity ("John, that is, the Baptist," Ἰωάννης ὁ βαπτιστής, Matt 3:1). In a compound subject, the conjunction signals that the elements are different referents acting together. A singular verb with a compound subject (neuter plural rule or collective sense) is common in the GNT (GGBB pp. 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.prevHeadNounExists && colwellRole !== 's')
        nomCats.push({ name: 'Nominative in Apposition', desc: 'In the GNT, a nominative appositive renames or further identifies the preceding nominative noun, agreeing with it in case. The appositive refers to the same entity as its head noun — it adds a title, description, or clarifying name without changing the referent.\n\nTwo identifying marks:\n1. Both words are in the nominative and refer to the same person or thing.\n2. You can insert "that is" or "namely" between them without changing the meaning.\n3. No coordinating conjunction (καί, ἤ) stands between the head noun and the appositive — they are directly adjacent.\n\nCommon patterns:\n• Personal name + title or role: Ἰωάννης ὁ βαπτιστής — "John, that is, the Baptist" (Matt 3:1)\n• Pronoun + identifying noun: αὕτη ἐστὶν ἡ ἐντολή — "this is the commandment"\n\nApposition is distinct from a predicate nominative (which requires an equative verb) and from a compound subject (which uses a conjunction and has different referents) (GGBB pp. 48–50).', level: 'intermediate' })
      else if (colwellRole === 's')
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
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && (
        (ctx?.enclosingHeadLexeme && PARTITIVE_HEAD_LEMMAS.has(ctx.enclosingHeadLexeme)) ||
        (ctx?.enclosingHeadPos && PARTITIVE_HEAD_POS.has(ctx.enclosingHeadPos))
      ))
        nomCats.push({ name: 'Partitive Genitive', desc: 'In the GNT, the partitive genitive identifies the larger group or whole from which the head noun singles out a part, a member, or an individual. The head noun names the part; the genitive names the whole.\n\nCommon patterns:\n• Numeral + genitive: ἕνα τῶν μικρῶν τούτων — "one of these little ones" (Matt 10:42); εἷς τῶν δώδεκα — "one of the twelve" (Mark 14:10).\n• Quantifier + genitive: πολλοὶ τῶν Ἰουδαίων — "many of the Jews" (John 11:19); οὐδεὶς τῶν ἀνδρῶν — "none of the men" (Luke 14:24).\n• Ordinal/superlative + genitive: πρώτη πασῶν ἐντολή — "first of all commandments" (Mark 12:28); ὁ ἐλάχιστος πάντων — "the least of all" (Eph 3:8).\n• Interrogative/indefinite pronoun + genitive: τίς ἐξ ὑμῶν — "which of you?" (Matt 6:27); τις τῶν Φαρισαίων — "a certain one of the Pharisees" (Luke 7:36).\n\nDiagnostic: can you insert "drawn from" or "belonging to the group of" between the head noun and the genitive? If yes, partitive is the best reading.\n\nDistinguish from Descriptive Genitive: the descriptive genitive qualifies or characterizes the head noun ("king of the Jews" = Jewish king), whereas the partitive genitive treats the head noun as a subset of the genitive group ("one of the Jews" = one member from that group). The partitive genitive often appears with articular plural genitives (τῶν + noun) in the GNT (GGBB pp. 84–86).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.enclosingHeadCase === 'Genitive')
        nomCats.push({ name: 'Genitive of Apposition', desc: 'In the GNT, the genitive of apposition follows a head noun and renames or identifies it — the genitive and its head noun refer to the same entity. The genitive specifies what the head noun *is*, rather than showing who owns it or where it comes from.\n\nTwo identifying marks:\n1. Both words refer to the same person or thing.\n2. You can substitute "namely," "that is," or "which is" between them: Ἡσαΐου τοῦ προφήτου — "through Isaiah, namely the prophet" (Matt 3:3); τὸ σημεῖον τῆς περιτομῆς — "the sign of circumcision [= circumcision itself as the sign]" (Rom 4:11).\n\nCommon patterns:\n• Proper name + descriptive title in genitive: a person named, then identified by role (prophet, apostle, king).\n• Abstract head noun + concrete genitive content: the abstraction is identified by what it consists of — "the hope of glory" = the glory that is the hope (Col 1:27).\n\nDistinguish from Descriptive Genitive: apposition renames the head noun so that both refer to the same entity (Ἡσαΐου = τοῦ προφήτου, the same person). A descriptive genitive qualifies the head noun without naming the same thing — "king of the Jews" (Ἰουδαίων ≠ βασιλεύς, different referents). Test: can you substitute "namely" or "that is"? If yes, the genitive is appositive (GGBB pp. 95–100).', level: 'intermediate' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' &&
               ctx?.enclosingHeadLexeme && ACTION_NOUN_LEMMAS.has(ctx.enclosingHeadLexeme))
        nomCats.push({ name: 'Subjective or Objective Genitive', desc: 'In the GNT, a genitive that modifies an action noun — one that has a cognate verb and expresses an action or process — is either a subjective genitive or an objective genitive.\n\nDiagnostic test: mentally replace the head noun with its cognate verb and ask whether the genitive would become the subject or the object of that verb.\n\nSubjective Genitive — the genitive noun performs the action the head noun implies:\n• ἡ ἀγάπη τοῦ Χριστοῦ (2 Cor 5:14) — "the love Christ exercises" (Christ is the one who loves us)\n• ἡ κρίσις τοῦ θεοῦ (Rom 2:2) — "the judgment God renders" (God does the judging)\n• ἡ πίστις Ἰησοῦ Χριστοῦ (Gal 2:16, one reading) — "the faithfulness Christ himself demonstrates"\n\nObjective Genitive — the genitive noun receives the action the head noun implies:\n• ἡ ἀγάπη τοῦ κόσμου (1 John 2:15) — "love for the world" (the world is what is loved)\n• ἡ πίστις τοῦ εὐαγγελίου (Phil 1:27) — "faith in the gospel" (the gospel is what is believed)\n• ὁ φόβος τοῦ κυρίου (Acts 9:31) — "fear of the Lord" (the Lord is the one feared)\n\nBoth readings are grammatically possible with the same Greek phrase; context, parallel passages, and theology determine which is intended. The πίστις Χριστοῦ construction is among the most disputed in Pauline scholarship: is Christ the one who is faithful (subjective) or the one in whom we place faith (objective)? Apply the verb-substitution test and weigh the surrounding argument before committing to one reading (GGBB pp. 113–119).', level: 'intermediate' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np')
        nomCats.push({ name: 'Descriptive Genitive', desc: 'In the GNT, the descriptive genitive (also called the attributive or qualitative genitive) characterizes or qualifies the head noun by specifying its kind, nature, or sphere — functioning like an adjective. The genitive and the head noun refer to different things; the genitive describes what kind.\n\nTwo identifying marks:\n1. The head noun and the genitive are different referents — they do not name the same person or thing.\n2. You can rephrase the genitive as an adjective: "king of the Jews" = "Jewish king"; "Bethlehem of Judea" = "Judean Bethlehem."\n\nCommon patterns:\n• Geographical/ethnic qualifier: Βηθλέεμ τῆς Ἰουδαίας — "Bethlehem of Judea" (Matt 2:1); βασιλεὺς τῶν Ἰουδαίων — "king of the Jews" (Matt 2:2).\n• Genitive of quality or attribute: "body of sin" (σῶμα τῆς ἁμαρτίας, Rom 6:6); "works of the law" (ἔργα νόμου).\n\nDistinguish from Genitive of Apposition: apposition renames (head = genitive, same referent; test: "namely"); descriptive qualifies (head ≠ genitive, different referents; test: adjective paraphrase). Distinguish from Possessive Genitive: possession answers "whose?" while descriptive answers "what kind?" (GGBB pp. 79–86).', level: 'beginner' })
      else if (syn?.c === 'np' && !syn?.h)
        nomCats.push({ name: 'Genitive Modifier', desc: 'In the GNT, a genitive word that stands inside a noun phrase without being its syntactic head functions as a modifier of the phrase\'s head noun. The most common readings:\n\n• Possessive / Descriptive: the genitive defines whose or what kind — ἄγγελος κυρίου ("an angel of the Lord"), λόγος τοῦ θεοῦ ("the word of God"), τοῦ σταυροῦ τοῦ Χριστοῦ ("of the cross of Christ").\n\n• Appositive title: two proper names (or a name and a title) stand in the same noun phrase as genitive — Ἰησοῦ Χριστοῦ ("Jesus Christ"), Σίμωνος Πέτρου ("Simon Peter"). The second name is an appositional title identifying the same person.\n\n• Subjective / Objective genitive: if the head noun implies an action (ἀγάπη, πίστις, κρίσις), the genitive may be either the agent of that action (subjective) or its object (objective). Test: does the genitive perform or receive the action?\n\nFor concrete head nouns (angel, word, house, servant), possessive/descriptive is almost always correct. For action-noun heads, investigate subjective or objective. When two proper names stand adjacent in the same noun phrase, consider appositive title (GGBB pp. 72–136).', level: 'beginner' })
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
      // Apposition and compound checks must precede role === 'o': appositive NPs derive
      // role 'o' from the grandparent clause role (gr='o') and would otherwise be mislabelled
      // as direct objects. The gc === 'np' guard ensures we only fire for NPs nested inside
      // another NP (the outer object phrase), not for direct-object NPs sitting directly in a clause.
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.nearbyConjunctionRole)
        nomCats.push({ name: 'Compound Direct Object', desc: 'In the GNT, a compound direct object consists of two or more accusative nouns or noun phrases joined by a coordinating conjunction (καί, ἤ, ἀλλά), each receiving the action of the verb.\n\nIdentifying mark: a coordinating conjunction appears between the elements. Each element is a distinct entity sharing the same object role.\n\nDistinguish from Accusative in Apposition: in apposition, NO conjunction links the two accusatives — they stand directly adjacent and refer to the same entity. In a compound, the conjunction signals different referents sharing the same clause role. Distinguish from the double accusative: in a double accusative, one accusative is the object and the other predicates something of it — no conjunction links them (GGBB pp. 48–50, 248–249).', level: 'beginner' })
      else if (cls === 'np' && syn?.h && syn?.gc === 'np' && ctx?.prevHeadNounExists)
        nomCats.push({ name: 'Accusative in Apposition', desc: 'In the GNT, an accusative appositive renames or further identifies a preceding accusative noun, agreeing with it in case. The appositive refers to the same entity as its head noun — it adds a title, name, or descriptive clarification without introducing a new participant.\n\nThe attributive apposition pattern (article + appositive + article + title) is very common for identifying persons by role: τὸν Δαυεὶδ τὸν βασιλέα — "David the king" (Matt 1:6); Ἰησοῦν τὸν Ναζωραῖον — "Jesus the Nazarene." The second article signals that the appositive is in close apposition, further identifying the same person.\n\nTest: insert "namely" or "that is" between the head noun and this word. If both refer to the same person or thing, the relationship is appositive. No coordinating conjunction (καί, ἤ) stands between the head noun and the appositive.\n\nDistinguish from Compound Direct Object: a conjunction (καί, ἤ) between two accusatives signals a compound (two different entities); its absence signals apposition (same entity, further identified) (GGBB pp. 48–50).', level: 'intermediate' })
      else if (role === 'o' || ctx?.absFunction === 'O')
        nomCats.push({ name: 'Accusative Direct Object', desc: 'In the GNT, the accusative direct object is the most frequent use of the accusative, receiving the action of a transitive verb. It answers "whom?" or "what?" Verbs that take accusative objects include ἀγαπάω, βλέπω, λαμβάνω, and ποιέω. This is the default reading for an accusative when other uses cannot be confirmed (GGBB p. 179).', level: 'beginner' })
      // Heuristic fallback for text-edition mismatch: if PROIEL assigned r:'v' to this
      // nominal word (misaligned data from a different text edition), confirm via the
      // Macula clause-structure rule that the enclosing clause actually has a direct
      // object slot, then classify this accusative as the direct object.
      else if (synRoleMisaligned && !inPP &&
               ctx?.maculaClauseRule?.split('-').includes('O'))
        nomCats.push({ name: 'Accusative Direct Object', desc: 'In the GNT, the accusative direct object is the most frequent use of the accusative, receiving the action of a transitive verb. It answers "whom?" or "what?" Verbs that take accusative objects include ἀγαπάω, βλέπω, λαμβάνω, and ποιέω. This is the default reading for an accusative when other uses cannot be confirmed (GGBB p. 179).', level: 'beginner' })
      else if (role === 'vc')
        nomCats.push({ name: 'Predicate Accusative', desc: 'In the GNT, the predicate accusative occurs in a double-accusative construction with verbs of naming (καλέω), making (ποιέω), appointing (τίθημι), or considering (ἡγέομαι). One accusative is the direct object; the other predicates something of it — "he appointed them apostles" (Mark 3:14) (GGBB p. 182).', level: 'intermediate' })
      else if (role === 'adv')
        nomCats.push({ name: 'Adverbial Accusative', desc: 'In the GNT, the accusative used adverbially modifies the verb rather than receiving its action. Three major types:\n\n• Accusative of Extent of Time: answers "how long?" — "he fasted forty days and forty nights" (τεσσεράκοντα ἡμέρας καὶ νύκτας, Matt 4:2); "he remained there two years" (Acts 28:30). The most common adverbial accusative in the GNT.\n\n• Accusative of Extent of Space: answers "how far?" — "about a stone\'s throw away" (Luke 22:41). Less frequent than the temporal form.\n\n• Accusative of Manner (Adverbial Accusative): functions as an adverb — δωρεάν ("freely, without payment," Matt 10:8), μάτην ("in vain," Matt 15:9), ἀρχήν ("at all," John 8:25). Many Greek adverbs are fossilized accusative forms of nouns or adjectives.\n\nDiagnostic: if the accusative does not receive the verbal action and answers "how long?", "how far?", or "in what manner?", it is adverbial. The absence of a preposition and the inability to ask "whom/what?" of the verb confirms this (GGBB pp. 200–203).', level: 'intermediate' })
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
    else if (role === 'vc' || (role === 'o' && ctx?.nearbyModalVerb))
      cats.push({ name: 'Complementary Infinitive', desc: 'In the GNT, the complementary infinitive completes the thought of a "helping verb" that would be semantically incomplete without it. The infinitive supplies the action; the main verb supplies the modality (ability, desire, obligation, permission, imminence).\n\nGNT verbs that regularly take a complementary infinitive:\nθέλω (to will / want) · βούλομαι (to wish / desire) · δύναμαι (to be able / can) · μέλλω (to be about to / intend) · ἄρχομαι (to begin) · ὀφείλω (to owe / ought) · δεῖ (it is necessary) · ἔξεστιν (it is lawful/permitted) · ζητέω (to seek to) · ἐπιτρέπω (to permit) · ἀφίημι (to allow / let) · πειράομαι (to attempt)\n\nDiagnostic: remove the infinitive — if the main verb becomes semantically incomplete ("he was able ___?", "he wanted ___?"), the infinitive is complementary. The infinitive here carries the main lexical content; the governing verb contributes only modal force (GGBB pp. 598–601).', level: 'beginner' })
    else if (role === 'o')
      cats.push({ name: 'Substantival Infinitive (Object)', desc: 'In the GNT, the infinitive as direct object fills the object slot of the main verb. It most commonly appears as a complementary infinitive — completing verbs of desire, ability, beginning, or obligation: "he was not willing to come" (Matt 22:3), "they were not able to resist" (Acts 6:10). The infinitive here is the content of the wanting, being able, or beginning (GGBB p. 601).', level: 'beginner' })
    else
      cats.push({ name: 'Infinitive', desc: 'In the GNT, the infinitive serves several functions beyond direct object. The complementary infinitive is the most common, completing verbs of ability, desire, or beginning. Purpose infinitives appear with εἰς τό or πρός τό + infinitive. Result infinitives follow ὥστε. Temporal infinitives use ἐν τῷ (simultaneous action) or πρὶν (prior action). Causal infinitives use διὰ τό. Context — especially introductory prepositions and the main verb\'s semantics — identifies the specific function (GGBB pp. 590–611).', level: 'beginner' })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 7 — PARTICIPLE
  // ══════════════════════════════════════════════════════════════════════════
  let isSubstantivalParticiple = false
  if (isVerb && mood === 'Participle') {
    if (syn?.periph && syn?.c === 'vp')
      cats.push({ name: 'Periphrastic Participle', desc: 'In the GNT, periphrastic constructions (εἰμί + participle) are relatively common, especially in Luke-Acts and the Johannine letters. A present periphrastic (ἦν + present participle) stresses ongoing action: "he was teaching" (ἦν διδάσκων, Luke 5:17). A perfect periphrastic (ἦν + perfect participle) emphasizes a past completed state persisting into the narrative present. Luke uses periphrastics more than any other GNT author, often for stylistic vividness (GGBB p. 647).', level: 'intermediate' })
    else if (kase === 'Genitive' && cls === 'cl') {
      if (ctx?.hasGenitiveAbsSubject)
        cats.push({ name: 'Genitive Absolute', desc: 'In the GNT, the genitive absolute consists of a genitive noun or pronoun (the subject) paired with this genitive participle, forming a clause that is grammatically independent of the main sentence. Neither the subject nor the participle is syntactically connected to any element in the main clause — this independence is the defining feature.\n\nIdentification steps:\n1. Both the participle and its subject are in the genitive.\n2. The subject of the participle is not the same as (or co-referential with) the subject of the main verb.\n3. The construction sets a circumstantial backdrop — most commonly temporal.\n\nTranslation: "while…", "when…", or "after…" depending on whether the action is simultaneous with or prior to the main verb. The genitive absolute is especially frequent in narrative sections of the Gospels and Acts (e.g., αὐτοῦ ἐνθυμηθέντος, Matt 1:20 — "while he was considering these things") (GGBB p. 654).', level: 'intermediate' })
      else {
        cats.push({ name: 'Substantival Participle (Anarthrous)', desc: 'In the GNT, participles can function as nouns without the article, though the articular participle is far more common for this use. The anarthrous substantival participle typically fills a genitive slot — "the voice of one crying" (φωνὴ βοῶντος, Matt 3:3, citing Isa 40:3). Here the genitive participle names the actor or action that defines the head noun, equivalent to a genitive noun phrase.\n\nDistinguish from the genitive absolute: the absolute requires a genitive subject paired with the participle (a noun or pronoun that is not co-referential with the main clause subject). When no such genitive subject is present, the participle more likely functions substantivally — naming a person or action in the genitive case.\n\nAnarthrous substantival participles are more common in quotations from the LXX and in proverbial or general statements (GGBB pp. 619–620).', level: 'intermediate' })
        isSubstantivalParticiple = true
      }
    }
    else if (role === 'v' && cls === 'cl' && syn?.gc === 'np') {
      if (syn?.gr) {
        cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the articular substantival participle functions as a noun by using the article to nominalize an entire participial clause: τὸ ῥηθέν ("the thing spoken," Matt 1:22), τὸ γεγραμμένον ("what has been written"), τὰ ὑπάρχοντα ("one\'s possessions"). The article converts the clause into a nominal unit that can serve as subject, object, appositive, or any other nominal role in the sentence. This is distinct from the common ὁ πιστεύων ("the one who believes") pattern, which refers to a person; the neuter articular participle (τό + participle) typically refers to an action or content. The grandparent NP\'s role in the clause (gr) indicates how the nominalized unit functions (GGBB pp. 619–621).', level: 'beginner' })
        isSubstantivalParticiple = true
      }
      else if ((ctx?.precedingArticle || ctx?.isArticular) && !ctx?.nounBeforeArticle) {
        cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the articular substantival participle functions as a noun: the article directly precedes the participle and nominalizes it, making the entire participial unit refer to a person or class — ὁ πιστεύων ("the one who believes"), πᾶς ὁ βλέπων ("everyone who looks," Matt 5:28). Any adjective that precedes the article (like πᾶς) modifies the nominalized participial clause rather than serving as its head noun.\n\nThis is one of the most productive constructions in the GNT, especially in John and the Synoptics, where it defines a class of persons by their relationship to an action (GGBB pp. 619–621).', level: 'beginner' })
        isSubstantivalParticiple = true
      }
      else
        cats.push({ name: 'Adjectival (Attributive) Participle', desc: 'In the GNT, the attributive participle is used with the article to modify a specific noun in the clause, functioning like a relative clause — "the one who is about to come" (ὁ μέλλων ἔρχεσθαι, Matt 11:14), "the scribes who came down from Jerusalem" (οἱ ἀπὸ Ἱεροσολύμων καταβάντες, Mark 3:22). It restricts or defines its head noun rather than asserting something independently.\n\nTwo attributive positions:\n1. Article + participle + noun: ὁ πιστὸς δοῦλος ("the faithful servant")\n2. Noun + article + participle: ὁ δοῦλος ὁ πιστός (same meaning, more emphatic)\n\nContrast with the adverbial (circumstantial) participle, which modifies the verb and stands without an article (GGBB p. 617).', level: 'beginner' })
    }
    else if (role === 's' || role === 'o' || role === 'p') {
      cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the substantival participle functions as a noun and is most commonly articular, referring to a class of persons defined by the verbal action: ὁ πιστεύων ("the one who believes"), οἱ σῳζόμενοι ("those who are being saved"). This construction is widespread in John, Paul, and the Synoptics and often carries theological definition — describing believers, those who obey, or those who belong to Christ (GGBB p. 619).', level: 'beginner' })
      isSubstantivalParticiple = true
    }
    else if (cls === 'np') {
      if (ctx?.precedingArticle && !ctx?.nounBeforeArticle) {
        cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the articular substantival participle functions as a noun: the article directly precedes the participle and nominalizes it, making the entire participial unit refer to a person or class — ὁ πιστεύων ("the one who believes"), ὁ τεχθεὶς ("the one who was born," Matt 2:2). Any noun that follows (e.g., βασιλεὺς τῶν Ἰουδαίων) stands in apposition to the substantival participle rather than as its head. This is one of the most productive constructions in the GNT: John uses it to define believers (ὁ πιστεύων), Paul uses it for theological description, and the Synoptics use it in narrative identification (GGBB pp. 619–621).', level: 'beginner' })
        isSubstantivalParticiple = true
      }
      else if (ctx?.precedingArticle && ctx?.nounBeforeArticle)
        cats.push({ name: 'Adjectival (Attributive) Participle', desc: 'In the GNT, the attributive participle in the second position follows the pattern Noun + Article + Participle, where the article and participle together modify the preceding noun — τὸ ὕδωρ τὸ ζῶν ("the living water," John 4:10), ὁ δοῦλος ὁ πιστός ("the faithful servant"). The noun and the article-participle group agree in case, number, and gender. This position is more emphatic than the first position (article + participle + noun) and draws attention to the attributive quality. It functions like a relative clause restricting the noun (GGBB p. 617).', level: 'beginner' })
      else
        cats.push({ name: 'Adjectival (Attributive) Participle', desc: 'In the GNT, the attributive participle most commonly appears in the articular position (article + participle qualifying a noun) and functions like a relative clause. It is common in Johannine and Pauline literature: τὸ ὕδωρ τὸ ζῶν ("the living water," John 4:10), τοῖς ἀγαπῶσιν τὸν θεόν ("to those who love God," Rom 8:28). It restricts or describes the noun rather than asserting something about it (GGBB p. 617).', level: 'beginner' })
    }
    else if (tense === 'Aorist' && kase === 'Nominative' &&
             (ctx?.mainVerbTense === 'Aorist' || ctx?.mainVerbTense === 'Future') &&
             !ctx?.precedingArticle)
      cats.push({ name: 'Attendant Circumstance Participle', desc: 'In the GNT, the attendant circumstance participle expresses an action that is coordinate with the main verb rather than truly subordinate to it. Both the participle and the main verb describe separate events of equal weight, and the participle is translated as a main clause joined by "and."\n\nFive identifying marks (GGBB pp. 640–645):\n1. Tense: the participle is aorist.\n2. Main verb: the main verb is also aorist (or future or imperative).\n3. Case: the participle is nominative, agreeing with the subject.\n4. Position: the participle typically precedes the main verb.\n5. Genre: this use is common in narrative (Matthew, Mark, Acts) and rare in the epistles.\n\nTranslation pattern — translate BOTH as main verbs joined by "and":\n• ἐγερθεὶς παρέλαβεν — "he arose and took" (Matt 2:14), not "having arisen, he took."\n• ἀποκριθεὶς εἶπεν — "he answered and said" (the most frequent formula in the Synoptics).\n• πορευθέντες μαθητεύσατε — "go and make disciples" (Matt 28:19).\n\nDistinguish from the adverbial (circumstantial) participle:\n• The circumstantial participle is truly subordinate — it modifies the verb by expressing time, cause, means, or manner. It is typically translated "while," "after," "because," or "by."\n• The attendant circumstance participle is semantically coordinate — both actions are equally asserted. The test: if you can replace "having done X, he did Y" with "he did X and he did Y" without losing meaning, attendant circumstance is the right reading.\n• The circumstantial participle is common in all genres; attendant circumstance is concentrated in narrative.\n\nDistinguish from the substantival participle:\n• The substantival participle functions as a noun — it names a person or thing (ὁ πιστεύων = "the one who believes"). It almost always has an article.\n• The attendant circumstance participle is always anarthrous and retains a verbal (action) meaning rather than naming a person or class.\n• Test: can you replace the participle with a noun or pronoun? If yes, it may be substantival. If it names an action that precedes or accompanies the main verb, it is attendant circumstance (GGBB pp. 619–621, 640–645).', level: 'beginner' })
    else if ((ctx?.precedingArticle || ctx?.isArticular) && !ctx?.nounBeforeArticle) {
      // Articular participle with no noun before the article — always substantival.
      // This catch fires when syntax data is misaligned (text-edition mismatch) and
      // the earlier role/cls checks failed, but surface context (article immediately
      // before the participle, no head noun before that article) unambiguously
      // identifies the construction: ὁ ἀπειθῶν = "the one who disobeys."
      cats.push({ name: 'Substantival Participle', desc: 'In the GNT, the articular substantival participle functions as a noun: the article directly precedes the participle and nominalizes it, making the entire participial unit refer to a person or class of persons — ὁ πιστεύων ("the one who believes"), ὁ ἀπειθῶν ("the one who disobeys/does not believe"), οἱ σῳζόμενοι ("those who are being saved"). There is no separate noun for the article to modify; the article and the participial phrase together form the nominal unit.\n\nThis is one of the most theologically productive constructions in the GNT. John uses it to define the believer (ὁ πιστεύων εἰς τὸν υἱόν — "the one who believes in the Son," John 3:36) in direct contrast with the unbeliever (ὁ ἀπειθῶν τῷ υἱῷ — "the one who disobeys the Son"). Paul uses it for ethical description; the Synoptics for narrative identification.\n\nThe case of the articular participle reflects its function in the clause: nominative = subject, accusative = object, dative = indirect object or dative of interest, genitive = modifier (GGBB pp. 619–621).', level: 'beginner' })
      isSubstantivalParticiple = true
    }
    else {
      cats.push({ name: 'Adverbial (Circumstantial) Participle', desc: "In the GNT, the adverbial participle is the most common participle use. It is typically anarthrous and relates to the main verb by expressing the circumstance — time, cause, means, manner, condition, concession, or purpose — under which the main action occurs. Greek readers determine the specific relationship from context; the tense of the participle does not mechanically determine the relationship. Translation typically begins with 'while,' 'after,' 'because,' 'by,' or 'although' (GGBB p. 622).", level: 'beginner' })
      cats.push({ name: 'Adverbial Participle — Identifying the Use', desc: 'To determine which adverbial relationship this participle expresses, apply these tests in order:\n\n1. Temporal (most common): When does the main action occur? An aorist participle typically precedes the main verb in time ("after doing X, he did Y"); a present participle is typically contemporaneous ("while doing X, he did Y"). Translate: "after," "when," "while."\n\n2. Causal: Why does the main action occur? The participle gives the reason. Common when the participle precedes the main verb and explains it. Translate: "because," "since."\n\n3. Means: How is the main action accomplished? The participle names the instrument or method. Translate: "by doing X." Especially common in John and Acts for the means of a sign or action.\n\n4. Manner: In what way? The participle describes the style or quality of the action. Translate: "doing X" or as an adverb. Closely related to means; manner emphasizes the quality, means the method.\n\n5. Conditional: Under what condition? The participle functions like the protasis of a conditional sentence. Translate: "if." Identified when the action of the participle must precede or accompany the main verb as a condition.\n\n6. Concessive: Despite what? The action of the main verb is surprising in light of the participle. Translate: "although," "even though." Often indicated by context of contrast.\n\n7. Purpose: For what goal? The participle expresses intention, most naturally with future-oriented participles (rare in the GNT). Translate: "in order to."\n\nKey principle (Campbell / Wallace): the tense of the participle signals aspect — how the action is viewed — not its temporal relation to the main verb. Context is the decisive factor (GGBB pp. 622–640).', level: 'intermediate' })
    }

    // Append case-function description after the participle-use label.
    // For substantival participles, replace the generic case label with a
    // description of the clause role the participle fills by virtue of its case.
    // Skip entirely for genitive absolute (case already embedded in the label).
    if (kase === 'Genitive' && cls === 'cl') {
      // genitive absolute — no case label needed
    } else if (isSubstantivalParticiple) {
      if (kase === 'Nominative')
        cats.push({ name: 'Case Function — Subject', desc: 'In the GNT, a substantival participle in the nominative case functions as the subject of its clause. This is the most common case for the substantival participle: ὁ πιστεύων ("the one who believes") is the subject of whatever is predicated; πᾶς ὁ βλέπων γυναῖκα ("everyone who looks at a woman") is the subject of ἐμοίχευσεν (Matt 5:28). The nominative case marks the subject slot, and the article-participle unit fills it in place of a noun (GGBB p. 620).', level: 'beginner' })
      else if (kase === 'Accusative')
        cats.push({ name: 'Case Function — Direct Object', desc: 'In the GNT, a substantival participle in the accusative case functions as the direct object of a transitive verb. The article-participle unit receives the action of the governing verb in the same way a noun would: εἶδον τὸν ἐρχόμενον ("they saw the one who was coming"); βλέπω τοὺς ἀγαπῶντας τὸν θεόν ("I see those who love God"). The accusative case marks the object slot, and the participle clause fills it nominally (GGBB p. 620).', level: 'beginner' })
      else if (kase === 'Genitive')
        cats.push({ name: 'Case Function — Genitive Modifier', desc: 'In the GNT, a substantival participle in the genitive case functions as a modifier within a noun phrase — most commonly possessive or descriptive, identifying whose or what kind. The most frequent pattern is the anarthrous genitive participle: φωνὴ βοῶντος ("the voice of one crying," Matt 3:3). The genitive form fills the modifier slot of the enclosing noun phrase in the same way a genitive noun would. The genitive substantival participle is especially common in LXX-influenced texts and OT quotations (GGBB pp. 619–620).', level: 'beginner' })
      else if (kase === 'Dative')
        cats.push({ name: 'Case Function — Dative', desc: 'In the GNT, a substantival participle in the dative case fills a dative slot in its clause — most often as an indirect object or dative of interest. The article-participle unit names the person(s) to whom or for whom something pertains: τοῖς ἀγαπῶσιν τὸν θεόν ("to those who love God," Rom 8:28); τοῖς πιστεύουσιν ("for those who believe"). This dative pattern is especially productive in Paul and John for defining the community of faith (GGBB p. 620).', level: 'beginner' })
      else
        cats.push(...partCaseCats)
    } else {
      cats.push(...partCaseCats)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 8 — OTHER PARTS OF SPEECH
  // ══════════════════════════════════════════════════════════════════════════
  if (pos === 'Preposition')
    cats.push({ name: 'Preposition', desc: 'In the GNT, the 18 proper prepositions govern nouns in a specific case — accusative, genitive, or dative — and are among the most semantically dense words in the text. The case is lexically fixed by the preposition; several prepositions take more than one case with distinct meanings (e.g., διά + genitive = "through/by means of"; διά + accusative = "because of"). ἐν alone occurs over 2,700 times. Identifying the preposition and its case is the essential first step in analyzing any prepositional phrase (GGBB pp. 356–389).', level: 'beginner' })

  if (pos === 'Conjunction' || pos === 'Particle' || pos === 'Conditional') {
    const lex = ctx?.wordLexeme ?? null

    // ── Additive / Connective ──────────────────────────────────────────────────
    if (lex === 'καί' || lex === 'καὶ')
      cats.push({ name: 'καί — Connective / Additive', desc: 'Discourse function: ADDITIVE (most frequent), ASCENSIVE ("even"), or EPEXEGETICAL ("that is, namely").\n\nκαί is the most common word in both the GNT and LXX, occurring over 9,000 times in the NT alone. Its three main uses:\n\n1. Connective ("and") — joins words, phrases, or clauses of equal rank: καὶ ἦλθεν καὶ εἶπεν ("and he came and said"). This is the default Semitic paratactic style, especially in narrative. In the LXX it renders the Hebrew vav-consecutive, which Hebrew uses to chain narrative events.\n\n2. Ascensive ("even, indeed, also") — adds a surprising or climactic element: καὶ τελῶναι ποιοῦσιν τὸ αὐτό ("even tax-collectors do the same thing," Matt 5:46). The element introduced is stronger or more surprising than what preceded.\n\n3. Epexegetical ("that is, namely") — clarifies or specifies the preceding statement: τὴν δωρεάν, καὶ τὴν χάριν ("the gift, that is, the grace"). This is less common but important for identifying appositional structures.\n\nDisambiguating: context and word order determine which function is in play. In LXX narrative, καί at the start of a clause typically reflects the Hebrew vav and is best translated with light coordination ("and," "then") rather than weighted English prose connectives (GGBB pp. 668–671; BDF §442).', level: 'beginner' })

    else if (lex === 'τε')
      cats.push({ name: 'τε — Connective (Enclitic)', desc: 'Discourse function: ADDITIVE (weaker, more intimate connection than καί).\n\nτε is an enclitic postpositive connective that joins elements more tightly than καί, suggesting that the joined elements form a unified whole rather than a simple list. In the GNT it is especially common in Acts (where it often reflects elevated Lukan style) and in Paul. It frequently appears in the pair τε…καί ("both…and"), which creates a close, coordinate pair: Ἰουδαίοις τε καὶ Ἕλλησιν ("to both Jews and Greeks," Rom 1:16).\n\nIn the LXX, τε is rare compared to καί, appearing mainly in more literary sections. In the GNT it marks a connection that the author views as natural or closely linked — two events or groups that belong together (BDF §443; GGBB p. 671).', level: 'intermediate' })

    else if (lex === 'δέ' || lex === 'δὲ')
      cats.push({ name: 'δέ — Continuative / Mild Adversative', desc: 'Discourse function: CONTINUATIVE ("and, now, then") or MILD ADVERSATIVE ("but").\n\nδέ is a postpositive conjunction (always second position in its clause) and the second most common discourse connector in the GNT after καί. It has two primary functions:\n\n1. Continuative — advances the narrative or argument without implying contrast: ὁ δὲ εἶπεν ("and he said / then he said"). This is especially common in narrative. In the LXX, δέ often alternates with καί to vary narrative style.\n\n2. Mild adversative — introduces a contrast, correction, or qualification: λέγω ὑμῖν… ὑμεῖς δέ ("I say to you… but you"). The contrast is gentler than ἀλλά.\n\nμέν…δέ — when δέ is paired with a preceding μέν, it marks a formal contrast: ὁ μὲν…ὁ δέ ("the one…the other," "on the one hand…on the other"). This is a classical construction common in Paul and Hebrews.\n\nNarrative transition: at the start of a new pericope, δέ often signals a scene shift — "Now it happened that…" In Matthew\'s genealogy and John\'s discourses, δέ structures the flow of thought. Translation should be light: "and," "now," "but," "then" depending on context (GGBB pp. 671–673).', level: 'beginner' })

    else if (lex === 'μέν')
      cats.push({ name: 'μέν — Anticipatory Particle (μέν…δέ)', desc: 'Discourse function: CONTRASTIVE ANTICIPATION — sets up a contrast to be completed by a following δέ clause.\n\nμέν is a postpositive particle that almost never stands alone; it anticipates a following δέ (or sometimes ἀλλά, πλήν, or οὖν) that completes the contrast. The μέν…δέ construction is a classical idiom for structured antithesis: ὁ μὲν θερισμὸς πολύς, οἱ δὲ ἐργάται ὀλίγοι ("the harvest is plentiful, but the workers are few," Matt 9:37).\n\nWhen μέν occurs without a corresponding δέ, it may function as an emphatic particle ("indeed, to be sure") — sometimes called μέν solitarium. This is common in Paul: γέγραπται μέν ("it is indeed written").\n\nIn the LXX, μέν…δέ appears in more Hellenistic sections (e.g. 2–4 Maccabees) and marks careful rhetorical contrast. In the GNT, Hebrews uses it most extensively for theological contrasts (old covenant vs. new) (GGBB pp. 673–675; BDF §447).', level: 'intermediate' })

    // ── Adversative ───────────────────────────────────────────────────────────
    else if (lex === 'ἀλλά' || lex === 'ἀλλὰ' || lex === "ἀλλ᾿")
      cats.push({ name: 'ἀλλά — Strong Adversative', desc: 'Discourse function: STRONG ADVERSATIVE ("but, rather, on the contrary") — introduces a sharp contrast or correction.\n\nἀλλά is the primary strong adversative in the GNT, occurring over 630 times. Unlike the mild contrast of δέ, ἀλλά signals that what follows stands in direct opposition to or replaces what preceded:\n\n1. Contrast — corrects or negates: οὐ… ἀλλά ("not… but rather"): οὐκ ἦλθον καταλῦσαι ἀλλὰ πληρῶσαι ("I did not come to abolish but to fulfil," Matt 5:17). This construction is one of the most important rhetorical devices in the GNT.\n\n2. Concessive contrast — "nevertheless, yet": even when the preceding clause is conceded, ἀλλά signals a surprising reversal.\n\n3. Transitional — at the start of a new unit (rare): "but now, however."\n\nIn Pauline argument, ἀλλά frequently marks the hinge of a theological contrast (law vs. grace, flesh vs. Spirit). In the LXX it is less frequent than in the GNT, often rendering the Hebrew אַךְ ("however, but only"). Always translate with a strong English adversative: "but," "rather," "on the contrary" — never the lighter "and" (GGBB pp. 671–673; BDF §448).', level: 'beginner' })

    else if (lex === 'πλήν')
      cats.push({ name: 'πλήν — Adversative / Exceptive', desc: 'Discourse function: ADVERSATIVE-EXCEPTIVE ("but, however, nevertheless, except that").\n\nπλήν is a strong adversative that often introduces a qualification or exception to the preceding statement. It is more emphatic than δέ and can carry the force of "nevertheless" (concessive) or "except" (exceptive). In the GNT it is concentrated in Luke-Acts (Luke\'s preferred adversative alongside δέ) and the Pauline epistles.\n\nLuke uses πλήν frequently to signal a sharp contrast or pivot in a discourse unit: πλὴν οὐαὶ ὑμῖν ("but woe to you," Luke 6:24). In Paul, it marks a concessive pivot: πλὴν καὶ ὑμεῖς ("nevertheless, you also," Eph 5:33).\n\nIn the LXX it often renders the Hebrew אַךְ ("only, but") or בַּלְעֲדֵי ("except, apart from") (GGBB p. 673; BDF §449).', level: 'intermediate' })

    else if (lex === 'ὅμως')
      cats.push({ name: 'ὅμως — Concessive ("nevertheless")', desc: 'Discourse function: CONCESSIVE ("nevertheless, yet, still, all the same").\n\nὅμως concedes the truth or force of the preceding statement while asserting that it does not prevent the following: "even so, yet." In the GNT it is rare (John 12:42; 1 Cor 14:7; Gal 3:15) but carries significant rhetorical weight — the author acknowledges a potential counterargument before asserting the main point.\n\nIn the LXX it appears in Wisdom literature and more rhetorical sections. The discourse function is to hold two things in tension: what might be expected to follow from the previous clause is qualified or overridden (BDF §450).', level: 'intermediate' })

    else if (lex === 'μέντοι')
      cats.push({ name: 'μέντοι — Adversative / Emphatic', desc: 'Discourse function: ADVERSATIVE ("however, but") or EMPHATIC AFFIRMATION ("indeed, certainly").\n\nμέντοι (μέν + τοι) is a stronger, more emphatic form of μέν. In the GNT it occurs mainly in John (John 4:27; 7:13; 12:42; 20:5; 21:4) and Jude (v. 8). It signals either a sharp contrast ("however") or an emphatic assertion ("indeed"). In John\'s Gospel it often marks narrative asides that highlight surprising restraint or secrecy (e.g. "no one, however, said…").\n\nIn the LXX it appears in more literary sections (Wisdom, Maccabees). Context determines whether it is adversative or emphatic (BDF §451).', level: 'intermediate' })

    else if (lex === 'καίτοι' || lex === 'καίτοιγε' || lex === 'καίπερ' || lex === 'καίγε')
      cats.push({ name: 'καίτοι / καίπερ — Concessive', desc: 'Discourse function: CONCESSIVE ("and yet, though, although, even though").\n\nThese compound particles introduce a concessive clause — acknowledging a fact that might be expected to prevent the main assertion, but does not:\n• καίτοι ("and yet") — Acts 14:17; Heb 4:3\n• καίτοιγε ("and yet indeed") — Acts 17:27\n• καίπερ ("although") — often with a participle: "although he was a Son…" (Heb 5:8)\n• καίγε ("and indeed, and yet") — LXX usage, also in Acts 2:18\n\nThe concessive relationship is logically significant: the main clause holds despite what the καίπερ/καίτοι clause might lead one to expect. In Hebrews, this construction is a key rhetorical device for arguing from the lesser to the greater (a minori ad maius) (GGBB pp. 634–635; BDF §425).', level: 'intermediate' })

    // ── Purpose / Content ─────────────────────────────────────────────────────
    else if (lex === 'ἵνα' || lex === "ἵν᾿")
      cats.push({ name: 'ἵνα — Purpose / Content / Result', desc: 'Discourse function: PURPOSE ("in order that"), CONTENT ("that"), or RESULT ("so that").\n\nἵνα + subjunctive is one of the most frequent and theologically significant constructions in the GNT (650+ occurrences). Its three uses:\n\n1. Purpose (most common) — states the goal of the main action: ἵνα σωθῶσιν ("in order that they might be saved"). Answers the question "why?" or "for what purpose?" Distinguish from result: purpose is intended, result is actual.\n\n2. Content / Epexegetical — introduces the content of a noun, adjective, or verb of speaking, knowing, or desiring: αὕτη ἐστὶν ἡ ἐντολή, ἵνα ἀγαπᾶτε ἀλλήλους ("this is the commandment, that you love one another," John 15:12). Here ἵνα nominalizes a verbal idea.\n\n3. Result — the actual outcome rather than the intended purpose: ἵνα πληρωθῇ ("so that it was fulfilled," in the Matthean formula). Many of Matthew\'s fulfilment citations use ἵνα for accomplished result, not prospective purpose.\n\nIn the LXX, ἵνα is less frequent than in the GNT and often renders Hebrew לְמַעַן ("in order that"). The distinction between purpose and result is theologically significant in Pauline soteriology (e.g. Rom 5:20–21) (GGBB pp. 472–476; BDF §369).', level: 'beginner' })

    else if (lex === 'ὅπως')
      cats.push({ name: 'ὅπως — Purpose / Content', desc: 'Discourse function: PURPOSE ("in order that, so that") or CONTENT ("how, that").\n\nὅπως + subjunctive expresses purpose, functioning like ἵνα but with a slightly more classical flavor. It is less common than ἵνα in the GNT (185 occurrences) and often appears in quotations from the LXX.\n\n1. Purpose — the standard function: ὅπως γένησθε υἱοὶ τοῦ πατρὸς ὑμῶν ("in order that you may be sons of your Father," Matt 5:45).\n\n2. Content after verbs of asking, praying, or planning — "how, that": προσεύχεσθε ὅπως ("pray that…," Matt 9:38). Here ὅπως introduces the content of the prayer.\n\nIn the LXX, ὅπως renders Hebrew לְמַעַן and פֶּן (purpose clauses) and appears in legal and wisdom literature. Its presence often signals a slightly more formal register than ἵνα (GGBB p. 476; BDF §369).', level: 'beginner' })

    // ── Causal / Explanatory ──────────────────────────────────────────────────
    else if (lex === 'ὅτι')
      cats.push({ name: 'ὅτι — Causal / Declarative', desc: 'Discourse function: CAUSAL ("because, since") or DECLARATIVE/CONTENT ("that" — introduces indirect discourse or content).\n\nὅτι is the third most common word in the GNT (4,700+ occurrences) and has two primary functions:\n\n1. Declarative / Content — introduces the content of a verb of saying, knowing, believing, or perceiving (indirect discourse): λέγω ὅτι ("I say that…"), οἴδαμεν ὅτι ("we know that…"). This is the most common GNT use. The ὅτι clause is the content of the mental or verbal act — it answers "what?"\n\n2. Causal — gives the reason for the preceding: ἐμακαρίσαν με… ὅτι ἐποίησέν μοι μεγάλα ("they call me blessed… because he has done great things for me," Luke 1:48–49). Answers "why?"\n\n3. LXX-specific: recitative ὅτι introduces direct speech (equivalent to quotation marks): εἶπεν ὅτι "Ἐγώ εἰμι" ("he said, \'I am\'"). This Semitic use, reflecting Hebrew כִּי, is especially common in John\'s Gospel.\n\nDisambiguating: if the subject of the ὅτι clause is different from the main clause subject and the main verb is a communication/perception verb → declarative. If ὅτι follows a description of a state and gives the reason → causal (GGBB pp. 678–681; BDF §§394, 456).', level: 'beginner' })

    else if (lex === 'γάρ')
      cats.push({ name: 'γάρ — Explanatory / Causal', desc: 'Discourse function: EXPLANATORY ("for, you see") or CAUSAL ("because") — always postpositive (second position in its clause).\n\nγάρ is the primary explanatory/causal connector in the GNT (1,000+ occurrences). It always sits in second position and looks backward — it explains, grounds, or supports what was just stated.\n\n1. Explanatory — unpacks or clarifies the preceding statement: ἦν γὰρ διδάσκων ("for he was teaching" — explains why the crowds were astonished, Matt 7:29). The γάρ clause answers "why?" or "how so?"\n\n2. Causal — gives the theological or logical ground: τὸ γὰρ ὀψώνιον τῆς ἁμαρτίας θάνατος ("for the wages of sin is death," Rom 6:23). Grounds the preceding exhortation.\n\n3. Inferential (rare) — occasionally introduces the conclusion of an argument rather than its support.\n\nIn LXX usage, γάρ often renders Hebrew כִּי in its explanatory sense. In Pauline argumentation, γάρ chains are used to build extended theological grounds (e.g. Romans 1–3): each γάρ clause provides the basis for the next. Recognizing γάρ as backward-pointing (grounding, not forward-advancing) is essential for tracing the logic of Pauline argument (GGBB pp. 658–661; BDF §452).', level: 'beginner' })

    else if (lex === 'διότι')
      cats.push({ name: 'διότι — Causal / Declarative', desc: 'Discourse function: CAUSAL ("because, for the reason that") or DECLARATIVE ("that").\n\nδιότι (διά + ὅτι) is a strengthened causal conjunction, occurring 226 times (primarily in LXX; 23 times in GNT). It more emphatically states the ground or reason than simple ὅτι:\n\n1. Causal — the primary function: provides the reason or basis for the preceding: διότι ἐτάπεινωσεν τὴν δούλην αὐτοῦ ("because he has looked on the humble state of his servant," Luke 1:48). The causal force is stronger than ὅτι.\n\n2. Declarative — introduces content of what is said or known (rarer): διότι ἐστίν ("that it is").\n\nIn the LXX, διότι is especially common in the Psalms and prophetic literature as a strong causal connector (rendering Hebrew כִּי, עַל כֵּן). In the GNT it appears mainly in Luke-Acts and the Pauline epistles. It is often interchangeable with ὅτι but carries more explicit causal weight (GGBB p. 679; BDF §456).', level: 'intermediate' })

    else if (lex === 'ἐπεί' || lex === 'ἐπεὶ' || lex === 'ἐπειδή' || lex === 'ἐπειδὴ' || lex === 'ἐπειδήπερ')
      cats.push({ name: 'ἐπεί / ἐπειδή — Causal / Temporal', desc: 'Discourse function: CAUSAL ("since, because") or TEMPORAL ("when, after").\n\nἐπεί and ἐπειδή introduce subordinate clauses that can be either causal or temporal depending on context:\n\n1. Causal (more common in GNT) — "since, because, inasmuch as": ἐπεὶ πῶς κρινεῖ ὁ θεός ("since then how will God judge…," Rom 3:6). The causal function gives the reason or ground, often following a rhetorical question.\n\n2. Temporal — "when, after": ἐπειδὴ ἐπλήρωσεν ("when he had finished," Luke 7:1).\n\nἐπειδήπερ (Luke 1:1) is the most emphatic form: "inasmuch as, since indeed." It opens Luke\'s prologue with a formal causal clause acknowledging the prior work of other gospel writers.\n\nIn the LXX, ἐπεί renders Hebrew כִּי and אַחֲרֵי אֲשֶׁר in causal and temporal senses. In the GNT, the causal sense dominates in the epistles; the temporal sense is more common in narrative (GGBB p. 679; BDF §§456, 455).', level: 'intermediate' })

    else if (lex === 'καθότι')
      cats.push({ name: 'καθότι — Causal / Proportional', desc: 'Discourse function: CAUSAL ("because, inasmuch as") or PROPORTIONAL ("according as, insofar as").\n\nκαθότι is a compound conjunction (κατά + ὅτι) occurring 16 times, primarily in LXX and Luke-Acts. Its two uses:\n\n1. Causal — "because, since": καθότι οὐκ εἶχεν τέκνα ("because they had no children," Luke 1:7).\n\n2. Proportional — "according as, to the degree that": καθότι ἄν τις εὐπορεῖτο ("according as each had means," Acts 2:45).\n\nIn the LXX it renders Hebrew כַּאֲשֶׁר ("as, according as") and כִּי ("because"). It is a mark of Lukan style and appears in more formal or literary registers (GGBB p. 679; BDF §453).', level: 'intermediate' })

    // ── Inferential / Resultative ─────────────────────────────────────────────
    else if (lex === 'οὖν')
      cats.push({ name: 'οὖν — Inferential / Resumptive', desc: 'Discourse function: INFERENTIAL ("therefore, so, then") or RESUMPTIVE/TRANSITIONAL ("so then, now") — always postpositive.\n\nοὖν is a postpositive inferential particle (489 occurrences in GNT) that looks backward to draw a conclusion or move the discourse forward:\n\n1. Inferential — draws a logical conclusion from what was stated: παρακαλῶ οὖν ὑμᾶς ("I urge you therefore…," Rom 12:1). The οὖν signals that the exhortation follows logically from the preceding theological argument (Rom 1–11). This is the classic Pauline "hinge" — moving from indicative to imperative.\n\n2. Resumptive / Transitional — resumes the narrative after a digression or parenthesis: Ἰησοῦς οὖν ("Jesus therefore / so Jesus…"). John uses οὖν almost 200 times in this way, making it a signature feature of his Gospel.\n\n3. Emphatic affirmation (rare) — strengthens a command: ποιήσατε οὖν ("do it then!").\n\nIn LXX usage, οὖν is rare; the Hebraic text uses other logical connectors. Its density in John and Paul signals the logical structure of argumentation that the reader must trace (GGBB pp. 673–678; BDF §451).', level: 'beginner' })

    else if (lex === 'διό' || lex === 'διὸ' || lex === 'διόπερ')
      cats.push({ name: 'διό — Inferential ("therefore")', desc: 'Discourse function: INFERENTIAL RESULT ("therefore, for this reason, wherefore") — draws a strong logical conclusion.\n\nδιό (διά + ὅ, "on account of which") and διόπερ ("for this very reason") introduce a conclusion that directly results from the preceding argument. Unlike οὖν (which can be weakly transitional), διό always carries genuine logical force — the following clause is a necessary consequence:\n\nδιὸ παρακαλεῖτε ἀλλήλους ("therefore encourage one another," 1 Thess 5:11). διὸ ἀνέχεσθε ἀλλήλων ("therefore bear with one another," Col 3:13).\n\nIn Paul\'s letters, διό marks the turning points of ethical argument — the conclusion the reader is meant to act on. It is more logically emphatic than οὖν and more specific than ἄρα.\n\nδιόπερ ("for this very reason") adds the intensive περ for extra emphasis (1 Cor 8:13; 10:14) (GGBB p. 673; BDF §451).', level: 'beginner' })

    else if (lex === 'τοιγαροῦν')
      cats.push({ name: 'τοιγαροῦν — Emphatic Inferential', desc: 'Discourse function: EMPHATIC INFERENTIAL ("therefore indeed, for that very reason, so then").\n\nτοιγαροῦν is a compound inferential particle (τοι + γάρ + οὖν) expressing a strong, emphatic conclusion from the preceding argument. It is the most emphatic "therefore" in the Greek lexicon and is rare in the GNT (1 Thess 4:8; Heb 12:1). Its strength signals that the author regards the following conclusion as the climactic, inescapable result of everything that has been argued.\n\nIn the LXX, it renders Hebrew לָכֵן ("therefore, because of this") in emphatic contexts. In Hebrews 12:1, τοιγαροῦν concludes the great cloud of witnesses passage and introduces the climactic exhortation (BDF §451).', level: 'intermediate' })

    // ── Conditional ───────────────────────────────────────────────────────────
    else if (lex === 'εἰ' || lex === 'εἴ' || lex === 'εἴπερ' || lex === 'εἴτοι')
      cats.push({ name: 'εἰ — Conditional Particle', desc: 'Discourse function: CONDITIONAL ("if") — introduces the protasis (if-clause) of a conditional sentence.\n\nεἰ is the standard conditional particle for first- and second-class conditions in the GNT:\n\n1. First-class condition (assumed true) — εἰ + indicative in the protasis: εἰ υἱὸς εἶ τοῦ θεοῦ ("if you are the Son of God" — assumed true for argument, Matt 4:3). The speaker grants the premise for the sake of argument.\n\n2. Second-class condition (contrary to fact) — εἰ + past indicative + ἄν in the apodosis: εἰ ἦτε τέκνα τοῦ Ἀβραάμ... ἐποιεῖτε ἄν ("if you were children of Abraham… you would be doing," John 8:39). Implies the condition is NOT true.\n\nεἴπερ ("if indeed, if at all") adds the emphatic particle περ, expressing a condition the speaker regards as doubtful or significant: εἴπερ ἐστέ ("if indeed you are…," 1 Pet 2:3).\n\nIn the LXX, εἰ is the standard translation of Hebrew אִם ("if") in conditional clauses. It also appears in oaths: εἰ εἰσελεύσονται ("they shall surely not enter") — a Hebraism where εἰ + future = strong negation (GGBB pp. 682–699; BDF §372).', level: 'beginner' })

    else if (lex === 'ἐάν' || lex === 'ἐὰν' || lex === 'ἐᾶν')
      cats.push({ name: 'ἐάν — Conditional (Third Class)', desc: 'Discourse function: CONDITIONAL ("if, whenever") — introduces a third-class condition with subjunctive; the condition is viewed as possible or probable.\n\nἐάν (εἰ + ἄν) is the standard particle for the third-class conditional, always followed by the subjunctive:\n\nThird-class condition (probable future) — ἐάν + subjunctive: ἐάν τις φυλάξῃ τὸν λόγον μου ("if anyone keeps my word," John 8:51). The condition is presented as genuinely possible — the speaker does not prejudge the outcome.\n\nFrom a discourse perspective, ἐάν introduces an open possibility that the audience is invited to act upon. In epistolary and paraenetic contexts (James, 1 John), ἐάν-conditions invite the reader to self-examine.\n\nἐάν can also function as an indefinite temporal particle — "whenever": ἐάν with a present subjunctive often means "whenever (this happens)." This is equivalent to ὅταν in many contexts.\n\nIn the LXX, ἐάν commonly renders Hebrew אִם and כִּי in conditional clauses (GGBB pp. 696–699; BDF §373).', level: 'beginner' })

    else if (lex === 'εἴτε')
      cats.push({ name: 'εἴτε — Disjunctive Conditional ("whether…or")', desc: 'Discourse function: DISJUNCTIVE CONDITIONAL — presents a pair of alternatives exhaustively: "whether… or."\n\nεἴτε always appears in correlated pairs (εἴτε…εἴτε) to cover all possible cases exhaustively: εἴτε ζῶμεν εἴτε ἀποθνῄσκομεν ("whether we live or we die," Rom 14:8). The construction signals that the statement holds true regardless of which alternative obtains.\n\nIn Paul, εἴτε…εἴτε is a key rhetorical device for universal application — the exhortation or claim applies in every circumstance. It is common in 1 Corinthians and Romans in discussions of spiritual gifts and corporate identity (GGBB p. 699; BDF §454).', level: 'intermediate' })

    // ── Result ────────────────────────────────────────────────────────────────
    else if (lex === 'ὥστε')
      cats.push({ name: 'ὥστε — Result', desc: 'Discourse function: RESULT ("so that, with the result that, so as to") — states the actual or natural outcome of the main action.\n\nὥστε introduces result clauses in two constructions:\n\n1. ὥστε + infinitive (most common) — natural or actual result: ὥστε τοὺς ὄχλους θαυμάζειν ("so that the crowds marveled," Matt 9:33). The infinitive construction is more common in narrative and signals a consequence that naturally follows.\n\n2. ὥστε + indicative — actual result, often emphatic: ὥστε ὁ νόμος ἁγία ("so then, the law is holy," Rom 7:12). The indicative stresses that the result actually occurred or is actually true.\n\n3. ὥστε as an inferential conjunction — "therefore, so then" (beginning a clause): ὥστε, ἀδελφοί μου ("therefore, my brothers," Phil 4:1). In this use it is similar to οὖν and introduces the logical conclusion.\n\nDisambiguate from purpose (ἵνα): purpose = intended goal; result = actual outcome. ὥστε + infinitive can be either natural result or intended purpose, but the default is result (GGBB pp. 590–592; BDF §391).', level: 'beginner' })

    // ── Disjunctive ───────────────────────────────────────────────────────────
    else if (lex === 'ἤ' || lex === 'ἢ' || lex === 'ἦ' || lex === 'ἤπερ' || lex === 'ἤτοι')
      cats.push({ name: 'ἤ — Disjunctive / Comparative', desc: 'Discourse function: DISJUNCTIVE ("or") or COMPARATIVE ("than").\n\nἤ has two primary functions:\n\n1. Disjunctive — presents alternatives: οὐδεὶς δύναται δυσὶ κυρίοις δουλεύειν… ἢ… ἤ ("no one can serve two masters… either… or," Matt 6:24). In questions, it often introduces the second option: ποτέρῳ θέλετε… τῷ Βαραββᾷ ἢ Ἰησοῦν ("which do you want… Barabbas or Jesus," Matt 27:17).\n\n2. Comparative — introduces the second element of a comparison after a comparative adjective or adverb: μεγαλύτερος αὐτῶν ἐστιν ἢ Ἰωάννης ("he is greater than John"). In the LXX, this use reflects the Hebrew מִן of comparison.\n\nἤτοι ("either… or") is a more emphatic disjunctive, presenting the options as exhaustive (Rom 6:16).\n\nIn LXX and GNT rhetoric, the disjunctive ἤ is used to force a choice, as in Jesus\'s "either…or" constructions that exclude middle-ground responses (GGBB p. 672; BDF §446).', level: 'beginner' })

    else if (lex === 'οὔτε')
      cats.push({ name: 'οὔτε — Negative Disjunctive ("neither…nor")', desc: 'Discourse function: NEGATIVE DISJUNCTIVE — joins negative alternatives exhaustively: "neither… nor."\n\nοὔτε…οὔτε is the compound negative that presents two (or more) negated alternatives as jointly excluded: οὔτε θάνατος οὔτε ζωή… δυνήσεται ἡμᾶς χωρίσαι ("neither death nor life… will be able to separate us," Rom 8:38–39). The construction emphatically rules out all listed possibilities.\n\nIn the LXX, οὔτε frequently renders the Hebrew לֹא…וְלֹא ("not…and not") in legal and prophetic declarations. In the GNT, Paul uses οὔτε…οὔτε climactically in doxological passages (GGBB p. 672; BDF §445).', level: 'beginner' })

    else if (lex === 'οὐδέ' || lex === 'οὐδὲ' || lex === "οὐδ᾿")
      cats.push({ name: 'οὐδέ — Negative Additive ("and not, nor, not even")', desc: 'Discourse function: NEGATIVE ADDITIVE — adds a negative element to what preceded: "and not, nor, not even."\n\nοὐδέ has two functions:\n\n1. Connective negative — "and not, nor": continues a negation across clauses or items in a list: οὐ… οὐδέ ("not… nor").\n\n2. Ascensive negative — "not even": intensifies the negation to a surprising extreme: οὐδὲ ὁ υἱός ("not even the Son," Matt 24:36). The ascensive use introduces the most extreme negative case.\n\nIn the LXX, οὐδέ renders Hebrew וְלֹא ("and not") in legal prohibitions and narrative. In the GNT, Paul and Matthew use οὐδέ to build ascending negations in rhetorical arguments (GGBB p. 672; BDF §445).', level: 'beginner' })

    else if (lex === 'μηδέ' || lex === 'μηδὲ')
      cats.push({ name: 'μηδέ — Negative Additive (with μή)', desc: 'Discourse function: NEGATIVE ADDITIVE — "and not, nor, not even" in subjective/volitional contexts (where μή is used instead of οὐ).\n\nμηδέ is the μή-equivalent of οὐδέ. It appears in commands, prohibitions, purpose clauses, conditions, and indirect speech — contexts where Greek uses μή rather than οὐ for negation:\n\nμηδὲ μεριμνᾶτε ("do not be anxious," Matt 6:31 — continuing a prohibition). μηδέ appears in chains of negative commands (μή… μηδέ… μηδέ) in the epistolary paraenesis.\n\nIn the LXX, it renders Hebrew וְלֹא in negative commands (prohibitions in the Decalogue and legal material). Its presence signals that the negation is subjective or volitional — prohibition or purpose rather than objective denial (GGBB p. 672; BDF §445).', level: 'intermediate' })

    else if (lex === 'μήτε')
      cats.push({ name: 'μήτε — Negative Disjunctive (with μή)', desc: 'Discourse function: NEGATIVE DISJUNCTIVE — "neither… nor" in volitional/subjunctive contexts.\n\nμήτε is the μή-equivalent of οὔτε, used in prohibitions, purpose clauses, and conditions: μήτε… μήτε ("neither… nor" where μή is required). In the GNT it frequently appears in chains of prohibitions: μήτε ὀμόσητε μήτε τὸν οὐρανόν μήτε τὴν γῆν ("swear neither by heaven nor by earth," James 5:12).\n\nIn the LXX, μήτε renders prohibitive negatives in legal contexts. Its function is identical to οὔτε but in contexts requiring the μή-form of negation (GGBB p. 672; BDF §445).', level: 'intermediate' })

    // ── Temporal ──────────────────────────────────────────────────────────────
    else if (lex === 'ὅταν' || lex === 'ὁπόταν')
      cats.push({ name: 'ὅταν — Temporal ("whenever, when")', desc: 'Discourse function: TEMPORAL — introduces a temporal clause with an indefinite or repeated aspect: "whenever, when."\n\nὅταν (ὅτε + ἄν) + subjunctive indicates either:\n\n1. Indefinite future — "when (at some future point)": ὅταν ἔλθῃ ὁ υἱὸς τοῦ ἀνθρώπου ("when the Son of Man comes," Matt 25:31). The subjunctive marks the event as anticipated but not yet determined.\n\n2. Iterative — "whenever (habitually)": ὅταν προσεύχησθε ("whenever you pray," Matt 6:5). The action recurs under certain conditions — a general temporal statement.\n\nIn the LXX, ὅταν renders Hebrew בְּ + infinitive construct and כִּי in temporal clauses. In the GNT, it is especially common in eschatological sayings (where the future time is indefinite) and in general instructions (where the action recurs). Distinguish from ὅτε (definite past time) and ἡνίκα (specifically when a condition is met) (GGBB p. 679; BDF §382).', level: 'beginner' })

    else if (lex === 'ὡς' || lex === 'ὧς' || lex === 'ὣς')
      cats.push({ name: 'ὡς — Comparative / Temporal / Content', desc: 'Discourse function: COMPARATIVE ("as, like"), TEMPORAL ("when, while, after"), or CONTENT/MANNER ("how, that").\n\nὡς is one of the most versatile connectors in Greek, occurring 1,244 times in the data. Its main functions:\n\n1. Comparative — "as, like, just as": ὡς ὁ κύριος δέδωκεν ("as the Lord gave," 1 Cor 3:5). Introduces a comparison for illustration or argument.\n\n2. Temporal — "when, while, as": ὡς δὲ εἶδεν ("and when he saw…"). In narrative, ὡς + indicative/participle marks a time relationship, usually contemporaneous.\n\n3. Content / Indirect discourse — "how, that": ἀγνοεῖτε ὡς… ("do you not know how/that…"). Introduces the content of a mental act.\n\n4. Causal (rare) — "since, inasmuch as": ὡς ἐν ἡμέρᾳ ("as if in daytime" / "since it is daytime," Rom 13:13).\n\n5. Approximative — "about, approximately": ὡς ἔτη τριάκοντα ("about thirty years old," Luke 3:23).\n\nIn the LXX, ὡς is the primary comparison marker, often rendering Hebrew כְּ ("as, like"). Distinguishing comparative from temporal ὡς requires attention to the verb mood and the narrative context (GGBB p. 679; BDF §§453, 425).', level: 'intermediate' })

    else if (lex === 'ὡσεί' || lex === 'ὡσεὶ')
      cats.push({ name: 'ὡσεί — Comparative ("as if, like, about")', desc: 'Discourse function: COMPARATIVE ("as if, as it were, like") or APPROXIMATIVE ("about, approximately").\n\nὡσεί (ὡς + εἰ, "as if") introduces a comparison that may be approximate or hypothetical:\n\n1. Comparative — "as if, like": ὡσεὶ πυρός ("like fire," Acts 2:3). The comparison is visual or analogical — not necessarily implying the thing literally is what it appears.\n\n2. Approximative — "about, approximately": ὡσεὶ ἀπὸ σταδίων δεκαπέντε ("about fifteen stadia away," John 11:18). Common in Luke-Acts for numerical approximations.\n\nIn the LXX, ὡσεί renders Hebrew כְּ in similes and approximations. In narrative it introduces the comparison in theophanic visions (e.g. Ezekiel) where divine appearances are described as "like" known things (BDF §453).', level: 'intermediate' })

    else if (lex === 'ἕως')
      cats.push({ name: 'ἕως — Temporal / Extent ("until, while, as far as")', desc: 'Discourse function: TEMPORAL ("until, while") or EXTENT ("as far as, up to").\n\nἕως (255 occurrences, primarily LXX) has two main uses:\n\n1. Temporal — introduces a time limit: ἕως οὗ ἔλθῃ ("until he comes"). With the subjunctive it marks a future boundary; with the indicative a past boundary. It answers "until when?"\n\n2. Extent — spatial or metaphorical limit: ἕως οὐρανοῦ ("as far as heaven," Matt 11:23). This spatial use is common in LXX geography and in the prophetic language of height and depth.\n\nIn the LXX, ἕως renders Hebrew עַד ("until, up to") in both temporal and spatial senses, making it one of the most frequent Septuagintalisms. In GNT fulfillment formulas (e.g. Matt 1:25: ἕως οὗ ἔτεκεν — "until she had given birth"), ἕως marks the boundary before which something holds, implying nothing about what follows (GGBB p. 679; BDF §383).', level: 'intermediate' })

    else if (lex === 'ἐπάν')
      cats.push({ name: 'ἐπάν — Temporal ("when, as soon as")', desc: 'Discourse function: TEMPORAL — introduces a future temporal clause: "when, as soon as, whenever."\n\nἐπάν (ἐπεί + ἄν) is a compound temporal conjunction that introduces a future temporal clause with the subjunctive: ἐπὰν εὕρητε ("when you find," Matt 2:8). It is rare in the GNT (Matt 2:8; Luke 11:22, 34) but appears in LXX narrative.\n\nIt differs from ὅτε (definite past time) and ὅταν (iterative) by being specifically future-oriented and immediate — "as soon as, the moment that." The sense is often urgent or conditional (BDF §382).', level: 'intermediate' })

    // ── Negative Purpose / Fear ────────────────────────────────────────────────
    else if (lex === 'μήπως')
      cats.push({ name: 'μήπως — Negative Purpose / Fear ("lest, for fear that")', desc: 'Discourse function: NEGATIVE PURPOSE ("lest, in order that not") or FEAR CLAUSE ("for fear that, lest perhaps").\n\nμήπως (μή + πως, "lest somehow") introduces clauses expressing fear or cautionary purpose:\n\n1. Negative purpose — "lest, so that… not": used after verbs of action to state what the action aims to prevent: μήπως κηρύξας ἄλλοις αὐτὸς ἀδόκιμος γένωμαι ("lest after proclaiming to others I myself become disqualified," 1 Cor 9:27).\n\n2. Fear / anxiety clause — after verbs of fearing or concern: φοβοῦμαι μήπως ("I fear lest perhaps"). The clause states what the speaker dreads.\n\nIn the LXX, μήπως renders Hebrew פֶּן ("lest") in cautionary statements and legal warnings. In the GNT, Paul uses it in passages of pastoral anxiety about his congregations (2 Cor 11:3; Gal 4:11) (GGBB pp. 476–477; BDF §370).', level: 'intermediate' })

    // ── Comparative ───────────────────────────────────────────────────────────
    else if (lex === 'καθὼς' || lex === 'καθώς')
      cats.push({ name: 'καθὼς — Comparative / Manner ("just as, even as")', desc: 'Discourse function: COMPARATIVE/MANNER ("just as, even as, according as") — introduces a clause of correspondence or standard.\n\nκαθὼς introduces a clause that provides the model, standard, or basis for correspondence:\n\n1. Comparative standard — "just as… so also": καθὼς ἐν τῷ Ἀδὰμ πάντες ἀποθνῄσκουσιν ("just as in Adam all die…," 1 Cor 15:22). The καθὼς clause provides the pattern; the main clause states the corresponding reality.\n\n2. Explanatory / Grounding — "even as, in accordance with the fact that": the καθὼς clause cites a prior fact (Scripture, command, or established reality) as the basis for what follows.\n\n3. Manner — "in the way that, according to how": describes the manner of the main action.\n\nIn the LXX, καθὼς renders Hebrew כַּאֲשֶׁר ("just as, according as") and is especially common in legal and covenantal contexts ("just as I commanded"). In the GNT, John uses καθὼς to express the Father-Son relationship as a model for the Son-disciples relationship (John 15:12; 17:18) (GGBB p. 679; BDF §453).', level: 'beginner' })

    // ── Fallback ──────────────────────────────────────────────────────────────
    else if (cls === 'cl')
      cats.push({ name: 'Subordinating Conjunction', desc: 'In the GNT and LXX, subordinating conjunctions introduce dependent clauses that specify the logical relationship between the subordinate clause and the main clause. The major categories:\n\n• Purpose: ἵνα, ὅπως ("in order that")\n• Result: ὥστε ("so that")\n• Causal: ὅτι, διότι, γάρ ("because, since, for")\n• Inferential: οὖν, διό ("therefore, so then")\n• Conditional: εἰ, ἐάν ("if")\n• Temporal: ὅτε, ὅταν, ἕως, ἐπεί ("when, until, since")\n• Comparative: ὡς, καθὼς ("as, just as")\n• Concessive: καίπερ, εἰ καί ("although, even if")\n\nIdentifying the type of subordinate clause is the first step in tracing the author\'s logic and is essential for accurate translation (GGBB pp. 668–685; BDF §§369–456).', level: 'intermediate' })
    else
      cats.push({ name: 'Coordinating Conjunction / Particle', desc: 'In the GNT and LXX, coordinating conjunctions and particles connect elements of equal grammatical rank or signal the author\'s logical move at the discourse level. The main classes:\n\n• Additive: καί ("and"), τε ("and, both…and")\n• Adversative: δέ ("but, now"), ἀλλά ("but, rather"), πλήν ("but, nevertheless")\n• Disjunctive: ἤ ("or"), οὔτε…οὔτε ("neither…nor")\n• Negative additive: οὐδέ ("and not, not even"), μηδέ ("and not")\n• Inferential: οὖν ("therefore, so"), διό ("therefore"), γάρ ("for")\n• Contrastive anticipatory: μέν (anticipates a δέ clause)\n• Concessive: ὅμως ("nevertheless"), μέντοι ("however")\n\nPostpositive particles (δέ, γάρ, οὖν, μέν) are always in second position in their clause — they never stand first. Their position and function are key markers of the author\'s discourse strategy (GGBB pp. 668–685; BDF §§442–454).', level: 'beginner' })
  }

  if (pos === 'Adverb')
    cats.push({ name: 'Adverb', desc: 'In the GNT, adverbs are indeclinable and typically modify the verb. Common adverbs include οὕτως ("thus/so"), ἤδη ("already"), νῦν ("now"), πάλιν ("again"), and ὄντως ("really/certainly"). Many are fossilized case forms (accusatives or datives). Their position often signals emphasis. Adverbs of time, manner, and degree frequently carry theological weight in key GNT assertions (GGBB pp. 293–296).', level: 'beginner' })

  return cats
}
