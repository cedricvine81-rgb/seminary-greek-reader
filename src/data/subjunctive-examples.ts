/**
 * NT Greek subjunctive use examples for morphology quizzes.
 */

export interface SubjunctiveExample {
  greek: string
  translation: string
  type: string        // correctAnswer
  explanation: string
  reference: string
}

export const SUBJUNCTIVE_TYPES = [
  'Hortatory (Let us…)',
  'Deliberative (What should we…?)',
  'Purpose (ἵνα / ὅπως)',
  'Result (ὥστε)',
  'Conditional (ἐάν + 3rd Class)',
  'Prohibitive (μή + Aorist)',
  'Emphatic Negation (οὐ μή)',
  'Indefinite Temporal (ὅταν / ἕως)',
] as const

export type SubjunctiveType = typeof SUBJUNCTIVE_TYPES[number]

export const SUBJUNCTIVE_EXAMPLES: SubjunctiveExample[] = [
  // ── Hortatory ──
  {
    greek: 'ἀγαπῶμεν ἀλλήλους',
    translation: 'Let us love one another',
    type: 'Hortatory (Let us…)',
    explanation: '1st person plural present subjunctive. The speaker includes himself in the exhortation.',
    reference: '1 John 4:7',
  },
  {
    greek: 'προσερχώμεθα οὖν μετὰ παρρησίας τῷ θρόνῳ τῆς χάριτος',
    translation: 'Let us therefore draw near with confidence to the throne of grace',
    type: 'Hortatory (Let us…)',
    explanation: '1st person plural present subjunctive. An exhortation including the writer.',
    reference: 'Heb 4:16',
  },
  {
    greek: 'εἴπωμεν τὰ κακά, ἵνα ἔλθῃ τὰ ἀγαθά',
    translation: 'Let us do evil that good may come',
    type: 'Hortatory (Let us…)',
    explanation: '1st person plural aorist subjunctive (εἴπωμεν). Paul quotes a slanderous misrepresentation.',
    reference: 'Rom 3:8',
  },
  {
    greek: 'ἀπολάβωμεν ἃ ἐπράξαμεν',
    translation: 'Let us receive what we have done',
    type: 'Hortatory (Let us…)',
    explanation: '1st person plural aorist subjunctive. The penitent thief on the cross.',
    reference: 'Luke 23:41',
  },

  // ── Deliberative ──
  {
    greek: 'τί οὖν ἐροῦμεν; ἐπιμένωμεν τῇ ἁμαρτίᾳ;',
    translation: 'What then shall we say? Shall we continue in sin?',
    type: 'Deliberative (What should we…?)',
    explanation: '1st person plural present subjunctive in a rhetorical question. Paul asks what the logical response to grace would be.',
    reference: 'Rom 6:1',
  },
  {
    greek: 'ποῦ ἀγοράσωμεν ἄρτους ἵνα φάγωσιν οὗτοι;',
    translation: 'Where are we to buy bread so that these people may eat?',
    type: 'Deliberative (What should we…?)',
    explanation: '1st person plural aorist subjunctive. Jesus tests Philip with a question about what to do.',
    reference: 'John 6:5',
  },
  {
    greek: 'τί φάγωμεν; ἢ τί πίωμεν; ἢ τί περιβαλώμεθα;',
    translation: 'What shall we eat? Or what shall we drink? Or what shall we wear?',
    type: 'Deliberative (What should we…?)',
    explanation: '1st person plural aorist subjunctives. Anxious questions about necessities of life.',
    reference: 'Matt 6:31',
  },

  // ── Purpose ──
  {
    greek: 'οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον, ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν, ἵνα πᾶς ὁ πιστεύων μὴ ἀπόληται',
    translation: 'For God so loved the world that he gave his only Son, so that everyone who believes may not perish',
    type: 'Purpose (ἵνα / ὅπως)',
    explanation: 'ἵνα + aorist subjunctive (ἀπόληται). The ἵνα clause expresses the purpose of God giving his Son.',
    reference: 'John 3:16',
  },
  {
    greek: 'ἵνα τὰ ἔθνη ἐν τῷ σώματι αὐτοῦ εὐλογηθῶσιν',
    translation: 'so that in Christ Jesus the blessing of Abraham might come to the Gentiles',
    type: 'Purpose (ἵνα / ὅπως)',
    explanation: 'ἵνα + aorist subjunctive (εὐλογηθῶσιν). Expresses the purpose of redemption from the curse.',
    reference: 'Gal 3:14',
  },
  {
    greek: 'ὅπως πληρωθῇ τὸ ῥηθὲν ὑπὸ τοῦ προφήτου',
    translation: 'so that what was spoken by the prophet might be fulfilled',
    type: 'Purpose (ἵνα / ὅπως)',
    explanation: 'ὅπως + aorist subjunctive (πληρωθῇ). Matthew uses ὅπως frequently for purpose/result clauses.',
    reference: 'Matt 2:15',
  },
  {
    greek: 'ἵνα ζωὴν ἔχητε καὶ περισσὸν ἔχητε',
    translation: 'so that they may have life and have it abundantly',
    type: 'Purpose (ἵνα / ὅπως)',
    explanation: 'ἵνα + present subjunctive (ἔχητε). Jesus states the purpose of his coming.',
    reference: 'John 10:10',
  },
  {
    greek: 'ἵνα εἰρήνην ἔχητε ἐν ἐμοί',
    translation: 'so that in me you may have peace',
    type: 'Purpose (ἵνα / ὅπως)',
    explanation: 'ἵνα + present subjunctive (ἔχητε). Jesus states the purpose of his disclosure of coming trouble.',
    reference: 'John 16:33',
  },

  // ── Result ──
  {
    greek: 'οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον, ὥστε τὸν υἱὸν τὸν μονογενῆ ἔδωκεν',
    translation: 'For God so loved the world that he gave his only Son',
    type: 'Result (ὥστε)',
    explanation: 'ὥστε + indicative (ἔδωκεν) expressing actual result. The love was so great that it resulted in the gift of the Son.',
    reference: 'John 3:16',
  },
  {
    greek: 'ὥστε τὸν υἱὸν τοῦ ἀνθρώπου κύριον εἶναι τοῦ σαββάτου',
    translation: 'so that the Son of Man is lord of the Sabbath',
    type: 'Result (ὥστε)',
    explanation: 'ὥστε + infinitive (εἶναι). Natural result clause.',
    reference: 'Mark 2:28',
  },

  // ── Conditional (3rd Class) ──
  {
    greek: 'ἐὰν τὰς ἐντολάς μου τηρήσητε, μενεῖτε ἐν τῇ ἀγάπῃ μου',
    translation: 'If you keep my commandments, you will abide in my love',
    type: 'Conditional (ἐάν + 3rd Class)',
    explanation: 'ἐάν + aorist subjunctive (τηρήσητε). Third class condition: probable or possible future.',
    reference: 'John 15:10',
  },
  {
    greek: 'ἐὰν ὁμολογῶμεν τὰς ἁμαρτίας ἡμῶν, πιστός ἐστιν καὶ δίκαιος',
    translation: 'If we confess our sins, he is faithful and righteous',
    type: 'Conditional (ἐάν + 3rd Class)',
    explanation: 'ἐάν + present subjunctive (ὁμολογῶμεν). An open, ongoing condition.',
    reference: '1 John 1:9',
  },

  // ── Prohibitive ──
  {
    greek: 'μὴ θησαυρίζετε ὑμῖν θησαυροὺς ἐπὶ τῆς γῆς',
    translation: 'Do not store up for yourselves treasures on earth',
    type: 'Prohibitive (μή + Aorist)',
    explanation: 'μή + present imperative (θησαυρίζετε) — a command to stop an ongoing action. Note: prohibition can use either present imperative or aorist subjunctive.',
    reference: 'Matt 6:19',
  },
  {
    greek: 'μὴ φοβηθῇς, μόνον πίστευε',
    translation: 'Do not fear, only believe',
    type: 'Prohibitive (μή + Aorist)',
    explanation: 'μή + aorist subjunctive (φοβηθῇς) prohibiting a specific future action.',
    reference: 'Mark 5:36',
  },
  {
    greek: 'μὴ κρίνετε, ἵνα μὴ κριθῆτε',
    translation: 'Do not judge, so that you will not be judged',
    type: 'Prohibitive (μή + Aorist)',
    explanation: 'μή + present imperative (κρίνετε) — prohibition of an ongoing action.',
    reference: 'Matt 7:1',
  },
  {
    greek: 'μηδὲν μεριμνᾶτε',
    translation: 'Do not be anxious about anything',
    type: 'Prohibitive (μή + Aorist)',
    explanation: 'μή (μηδέν) + present imperative (μεριμνᾶτε). Prohibition of habitual anxiety.',
    reference: 'Phil 4:6',
  },

  // ── Emphatic Negation ──
  {
    greek: 'οὐ μὴ εἰσέλθῃ εἰς αὐτὴν πᾶν κοινόν',
    translation: 'Nothing unclean will ever enter it',
    type: 'Emphatic Negation (οὐ μή)',
    explanation: 'οὐ μή + aorist subjunctive (εἰσέλθῃ). The strongest Greek negation — absolutely will not.',
    reference: 'Rev 21:27',
  },
  {
    greek: 'οὐ μὴ ἀπολέσῃ τὸν μισθὸν αὐτοῦ',
    translation: 'He will certainly not lose his reward',
    type: 'Emphatic Negation (οὐ μή)',
    explanation: 'οὐ μή + aorist subjunctive (ἀπολέσῃ). Emphatic future negation.',
    reference: 'Matt 10:42',
  },
  {
    greek: 'οὐ μὴ ἐξέλθῃς ἐκεῖθεν, ἕως ἂν ἀποδῷς τὸν ἔσχατον κοδράντην',
    translation: 'You will never get out of there until you have paid the last penny',
    type: 'Emphatic Negation (οὐ μή)',
    explanation: 'οὐ μή + aorist subjunctive (ἐξέλθῃς). Absolute negation of future possibility.',
    reference: 'Matt 5:26',
  },
  {
    greek: 'ὁ ἐρχόμενος πρός με οὐ μὴ πεινάσῃ',
    translation: 'Whoever comes to me will never go hungry',
    type: 'Emphatic Negation (οὐ μή)',
    explanation: 'οὐ μή + aorist subjunctive (πεινάσῃ). Jesus makes an absolute promise.',
    reference: 'John 6:35',
  },

  // ── Indefinite Temporal ──
  {
    greek: 'ὅταν δὲ ἔλθῃ ἐκεῖνος, τὸ πνεῦμα τῆς ἀληθείας, ὁδηγήσει ὑμᾶς ἐν τῇ ἀληθείᾳ πάσῃ',
    translation: 'When that one comes, the Spirit of truth, he will guide you into all truth',
    type: 'Indefinite Temporal (ὅταν / ἕως)',
    explanation: 'ὅταν + aorist subjunctive (ἔλθῃ). Indefinite future temporal clause: when (at whatever time) he comes.',
    reference: 'John 16:13',
  },
  {
    greek: 'ὅταν γὰρ ἴδητε ταῦτα γινόμενα, γινώσκετε ὅτι ἐγγύς ἐστιν',
    translation: 'For when you see these things happening, know that he is near',
    type: 'Indefinite Temporal (ὅταν / ἕως)',
    explanation: 'ὅταν + aorist subjunctive (ἴδητε). The time is indefinite — whenever these signs are seen.',
    reference: 'Mark 13:29',
  },
  {
    greek: 'ἕως ἂν παρέλθῃ ὁ οὐρανὸς καὶ ἡ γῆ, ἰῶτα ἓν οὐ μὴ παρέλθῃ ἀπὸ τοῦ νόμου',
    translation: 'Until heaven and earth pass away, not one jot shall pass from the Law',
    type: 'Indefinite Temporal (ὅταν / ἕως)',
    explanation: 'ἕως + aorist subjunctive (παρέλθῃ). Indefinite temporal clause with ἕως ἄν.',
    reference: 'Matt 5:18',
  },
  {
    greek: 'ὅταν νηστεύητε, μὴ γίνεσθε ὡς οἱ ὑποκριταί',
    translation: 'When you fast, do not become like the hypocrites',
    type: 'Indefinite Temporal (ὅταν / ἕως)',
    explanation: 'ὅταν + present subjunctive (νηστεύητε). An indefinite, repeated action.',
    reference: 'Matt 6:16',
  },
]
