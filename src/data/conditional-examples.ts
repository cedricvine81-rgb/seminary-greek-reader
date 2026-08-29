/**
 * NT Greek conditional sentence examples for morphology quizzes.
 * Each entry contains a Greek sentence, its type, and an explanation.
 */

export interface ConditionalExample {
  greek: string           // The Greek conditional sentence or clause
  translation: string     // English translation
  type: string            // The conditional type (used as correctAnswer)
  explanation: string     // Brief grammatical note shown after answering
  reference: string       // NT reference
}

export const CONDITIONAL_TYPES = [
  'First Class (Simple / Assumptive)',
  'Second Class (Contrary to Fact)',
  'Third Class (Probable / Possible)',
] as const

export type ConditionalType = typeof CONDITIONAL_TYPES[number]

export const CONDITIONAL_EXAMPLES: ConditionalExample[] = [
  // ── First Class (εἰ + indicative) — assumes condition as true for argument ──
  {
    greek: 'εἰ υἱὸς εἶ τοῦ θεοῦ, εἰπὲ ἵνα οἱ λίθοι οὗτοι ἄρτοι γένωνται.',
    translation: 'If you are the Son of God, command these stones to become bread.',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + present indicative (εἶ). The condition is assumed as true for the sake of argument.',
    reference: 'Matt 4:3',
  },
  {
    greek: 'εἰ ὁ θεὸς πατὴρ ὑμῶν ἦν, ἠγαπᾶτε ἂν ἐμέ.',
    translation: 'If God were your father, you would love me.',
    type: 'Second Class (Contrary to Fact)',
    explanation: 'εἰ + imperfect indicative (ἦν) with ἄν + imperfect in apodosis. Condition is contrary to fact in present time.',
    reference: 'John 8:42',
  },
  {
    greek: 'ἐὰν ἀγαπᾶτέ με, τὰς ἐντολὰς τὰς ἐμὰς τηρήσετε.',
    translation: 'If you love me, you will keep my commandments.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'ἐάν + present subjunctive (ἀγαπᾶτε). The condition is probable or possible in future time.',
    reference: 'John 14:15',
  },
  {
    greek: 'εἰ γὰρ νεκροὶ οὐκ ἐγείρονται, οὐδὲ Χριστὸς ἐγήγερται.',
    translation: 'For if the dead are not raised, then Christ has not been raised either.',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + present indicative (ἐγείρονται). Paul assumes this for the sake of argument to show the logical consequence.',
    reference: '1 Cor 15:16',
  },
  {
    greek: 'εἰ γὰρ ἐπιστεύετε Μωϋσεῖ, ἐπιστεύετε ἂν ἐμοί.',
    translation: 'For if you believed Moses, you would believe me.',
    type: 'Second Class (Contrary to Fact)',
    explanation: 'εἰ + imperfect indicative (ἐπιστεύετε) with ἄν + imperfect in apodosis. The Jews did not believe Moses (contrary to fact).',
    reference: 'John 5:46',
  },
  {
    greek: 'ἐὰν εἴπωμεν ὅτι ἁμαρτίαν οὐκ ἔχομεν, ἑαυτοὺς πλανῶμεν.',
    translation: 'If we say that we have no sin, we deceive ourselves.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'ἐάν + aorist subjunctive (εἴπωμεν). The condition is presented as a real possibility.',
    reference: '1 John 1:8',
  },
  {
    greek: 'εἰ δὲ Χριστὸς οὐκ ἐγήγερται, ματαία ἡ πίστις ὑμῶν.',
    translation: 'And if Christ has not been raised, your faith is futile.',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + perfect indicative (ἐγήγερται). Paul assumes this hypothetically to demonstrate the consequence.',
    reference: '1 Cor 15:17',
  },
  {
    greek: 'εἰ ἐκ τοῦ κόσμου ἦτε, ὁ κόσμος ἂν τὸ ἴδιον ἐφίλει.',
    translation: 'If you were of the world, the world would love its own.',
    type: 'Second Class (Contrary to Fact)',
    explanation: 'εἰ + imperfect indicative (ἦτε) with ἄν + imperfect in apodosis. The disciples are not of the world (contrary to fact).',
    reference: 'John 15:19',
  },
  {
    greek: 'ἐὰν τις θέλῃ θέλημα αὐτοῦ ποιεῖν, γνώσεται περὶ τῆς διδαχῆς.',
    translation: 'If anyone desires to do his will, he will know about the teaching.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'ἐάν + present subjunctive (θέλῃ). An open future condition presented as a genuine possibility.',
    reference: 'John 7:17',
  },
  {
    greek: 'εἰ ὁ θεὸς ὑπὲρ ἡμῶν, τίς καθ’ ἡμῶν;',
    translation: 'If God is for us, who is against us?',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + indicative. Paul argues FROM the premise, not about whether it holds.',
    reference: 'Rom 8:31',
  },
  {
    greek: 'εἰ δὲ ἐν πνεύματι θεοῦ ἐγὼ ἐκβάλλω τὰ δαιμόνια, ἄρα ἔφθασεν ἐφ᾽ ὑμᾶς ἡ βασιλεία τοῦ θεοῦ.',
    translation: 'But if I cast out demons by the Spirit of God, then the kingdom of God has come upon you.',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + present indicative (ἐκβάλλω). Jesus assumes this as true for the sake of the argument.',
    reference: 'Matt 12:28',
  },
  {
    greek: 'ἐὰν οὖν ὁ υἱὸς ὑμᾶς ἐλευθερώσῃ, ὄντως ἐλεύθεροι ἔσεσθε.',
    translation: 'If the Son sets you free, you will be truly free.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'εἰ with aorist subjunctive (ἐλευθερώσῃ). Some manuscripts use ἐάν; the condition is a genuine future possibility.',
    reference: 'John 8:36',
  },
  {
    greek: 'εἰ ἤμεθα ἐν ταῖς ἡμέραις τῶν πατέρων ἡμῶν, οὐκ ἂν ἤμεθα κοινωνοὶ αὐτῶν.',
    translation: 'If we had lived in the days of our fathers, we would not have been partners with them.',
    type: 'Second Class (Contrary to Fact)',
    explanation: 'εἰ + imperfect indicative (ἦμεν) with ἄν + imperfect in apodosis. Contrary to fact in past time.',
    reference: 'Matt 23:30',
  },
  {
    greek: 'ἐὰν ὁμολογῶμεν τὰς ἁμαρτίας ἡμῶν, πιστός ἐστιν καὶ δίκαιος.',
    translation: 'If we confess our sins, he is faithful and righteous.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'ἐάν + present subjunctive (ὁμολογῶμεν). An ongoing, repeatable condition.',
    reference: '1 John 1:9',
  },
  {
    greek: 'εἰ δὲ τὸ πνεῦμα τοῦ ἐγείραντος Ἰησοῦν ἐκ νεκρῶν οἰκεῖ ἐν ὑμῖν, ζῳοποιήσει καὶ τὰ θνητὰ σώματα ὑμῶν.',
    translation: 'But if the Spirit of him who raised Jesus from the dead dwells in you, he will also give life to your mortal bodies.',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + present indicative (οἰκεῖ). Paul assumes this condition is true for his readers.',
    reference: 'Rom 8:11',
  },
  {
    greek: 'εἰ ἦς ὧδε, οὐκ ἂν ἀπέθανεν ὁ ἀδελφός μου.',
    translation: 'If you had been here, my brother would not have died.',
    type: 'Second Class (Contrary to Fact)',
    explanation: 'εἰ + imperfect indicative (ἔζης) with ἄν + aorist indicative in apodosis. Jesus was not there (contrary to fact).',
    reference: 'John 11:21',
  },
  {
    greek: 'ἐὰν μὴ στραφῆτε καὶ γένησθε ὡς τὰ παιδία, οὐ μὴ εἰσέλθητε εἰς τὴν βασιλείαν τῶν οὐρανῶν.',
    translation: 'Unless you turn and become like children, you will never enter the kingdom of heaven.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'ἐάν + aorist subjunctive (στραφῆτε, γένησθε). A future condition with a strong warning.',
    reference: 'Matt 18:3',
  },
  {
    greek: 'εἰ δὲ ἐν δακτύλῳ θεοῦ ἐκβάλλω τὰ δαιμόνια, ἄρα ἔφθασεν ἐφ’ ὑμᾶς ἡ βασιλεία τοῦ θεοῦ.',
    translation: 'But if I cast out demons by the finger of God, then the kingdom of God has come upon you.',
    type: 'First Class (Simple / Assumptive)',
    explanation: 'εἰ + present indicative (ἐκβάλλω). Jesus presents this as an assumed fact.',
    reference: 'Luke 11:20',
  },
  {
    greek: 'ἐὰν δὲ καὶ ἀθλῇ τις, οὐ στεφανοῦται ἐὰν μὴ νομίμως ἀθλήσῃ.',
    translation: 'And also if anyone competes, he is not crowned unless he competes according to the rules.',
    type: 'Third Class (Probable / Possible)',
    explanation: 'ἐάν + present subjunctive (ἀθλῇ). A general condition applicable to anyone.',
    reference: '2 Tim 2:5',
  },
  {
    greek: 'εἰ δὲ ἐγνώκειτε τί ἐστιν ἔλεος θέλω καὶ οὐ θυσίαν, οὐκ ἂν κατεδικάσατε τοὺς ἀναιτίους.',
    translation: 'For if you had known what this means — I desire mercy and not sacrifice — you would not have condemned the innocent.',
    type: 'Second Class (Contrary to Fact)',
    explanation: 'εἰ + pluperfect indicative (ἤδειτε) with ἄν + aorist in apodosis. They did not know (contrary to fact).',
    reference: 'Matt 12:7',
  },
]
