/* ─────────────────────────────────────────────
   Chapter: The Alphabet & Pronunciation

   Built from the Beginning Greek Lesson 1 deck (remote set). The course
   follows Erasmian pronunciation; the schemes section compares Erasmian,
   reconstructed Koine, and Modern Greek as the user requested.
───────────────────────────────────────────── */

import Link from 'next/link'
import {
  MorphTable, TableAside, Gk, Ex, AsideLabel,
  P, SectionHeading, LevelOnly, Term, Practice, InfoBox,
  Tr,
} from '../shared'

export const PRONUNCIATION_CONTENT = (
  <>
    {/* ── 1 · English first (Beginning only) ─────────────── */}
    <LevelOnly level="beginning">
      <SectionHeading id="pronunciation.h.start-english-already">Start with English: you already know more than you think</SectionHeading>
      <P id="pronunciation.p.word-alphabet-just">
        The word "alphabet" is just the first two Greek letters — <em>alpha, beta</em> — run together.
        English borrowed its letters (via Rome) from this very system, so many Greek letters are old
        friends: <Gk>α β δ ε ι κ ο τ</Gk> look and sound roughly as you'd guess. Plenty of Greek words
        came along too: <Gk>κόσμος</Gk> (cosmos), <Gk>θρόνος</Gk> (throne), <Gk>παραβολή</Gk> (parable),
        <Gk> βάπτισμα</Gk> (baptism). Learning the alphabet is mostly meeting a few strangers and
        unmasking a few impostors.
      </P>
      <P id="pronunciation.p.alphabet-just-plumbing">
        And the alphabet is not just plumbing — Scripture makes theology out of it:
        <Gk> Ἐγώ εἰμι τὸ ἄλφα καὶ τὸ ὦ</Gk>, "I am the Alpha and the Omega" (Rev 1:8) — the first and
        last letters standing for the beginning and the end of everything. By the end of this chapter you
        can read that sentence aloud.
      </P>
    </LevelOnly>

    {/* ── 2 · The alphabet ───────────────────────────────── */}
    <SectionHeading id="pronunciation.h.letters">The 24 letters</SectionHeading>
    <LevelOnly level="beginning">
      <P id="pronunciation.p.here-full-alphabet">
        Here is the full alphabet with the sounds we use in class (the <strong>Erasmian</strong> scheme —
        more on the alternatives below). Say each letter's name aloud as you copy it out; the names
        themselves rehearse the sounds.
      </P>
    </LevelOnly>
    <TableAside
      sticky
      beginning={<>
        <AsideLabel><Tr id="pronunciation.al.while-read-table">While you read the table</Tr></AsideLabel>
        <p><Tr id="pronunciation.as.there-seven-vowels">There are <strong>seven vowels</strong>: α, ε, η, ι, ο, υ, ω.</Tr></p>
        <p><Tr id="pronunciation.as.before-sounds-like"><Gk>γ</Gk> before <Gk>γ, κ, χ, ξ</Gk> sounds like "ng": <Gk>ἄγγελος</Gk> = <em>angelos</em>.</Tr></p>
        <p><Tr id="pronunciation.as.sigma-wears-two">Sigma wears two costumes: <Gk>σ</Gk> anywhere in a word, <Gk>ς</Gk> only at the end — <Gk>κόσμος</Gk> has both.</Tr></p>
        <p><Tr id="pronunciation.as.differ-plain-rasped"><Gk>κ</Gk> and <Gk>χ</Gk> differ: plain k vs. the rasped "ch" of <em>loch</em>.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="pronunciation.as.handwriting-notes-class">Handwriting notes from class: <Gk>β δ ζ θ λ ξ</Gk> reach above the line; <Gk>β γ ζ η μ ξ ρ ς φ χ ψ</Gk> hang tails below it — unlike English, <Gk>κ</Gk> and <Gk>τ</Gk> stay small.</Tr></p>
        <p><Tr id="pronunciation.as.consonant-grid-dentals">The consonant grid (dentals τ δ θ · palatals κ γ χ · labials π β φ, plus sibilants and liquids) is worth absorbing now — it drives the consonant + σ mergers you'll meet in the Indicatives chapter.</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t1" tCols={[1, 2]} speakCols={[0]} flush title="The Greek alphabet (Erasmian sounds)" headers={['Letter', 'Name', 'Sound', 'Transliteration']} firstColIsData
        rows={[
          ['Α α', 'alpha', 'a as in “hat”', 'a'],
          ['Β β', 'beta', 'b', 'b'],
          ['Γ γ', 'gamma', 'hard g as in “get”', 'g'],
          ['Δ δ', 'delta', 'd', 'd'],
          ['Ε ε', 'epsilon', 'short e as in “met”', 'e'],
          ['Ζ ζ', 'zeta', 'z (dz)', 'z'],
          ['Η η', 'eta', 'long e as in “obey”', 'ē'],
          ['Θ θ', 'theta', 'th as in “thin”', 'th'],
          ['Ι ι', 'iota', 'i as in “hit”', 'i'],
          ['Κ κ', 'kappa', 'k', 'k'],
          ['Λ λ', 'lambda', 'l', 'l'],
          ['Μ μ', 'mu', 'm', 'm'],
          ['Ν ν', 'nu', 'n', 'n'],
          ['Ξ ξ', 'xi', 'x as in “relax”', 'x'],
          ['Ο ο', 'omicron', 'short o as in “not”', 'o'],
          ['Π π', 'pi', 'p', 'p'],
          ['Ρ ρ', 'rho', 'r', 'r'],
          ['Σ σ/ς', 'sigma', 's', 's'],
          ['Τ τ', 'tau', 't', 't'],
          ['Υ υ', 'upsilon', 'u', 'u / y'],
          ['Φ φ', 'phi', 'ph as in “phone”', 'ph'],
          ['Χ χ', 'chi', 'ch as in “loch”', 'ch'],
          ['Ψ ψ', 'psi', 'ps as in “lips”', 'ps'],
          ['Ω ω', 'omega', 'long o as in “tone”', 'ō'],
        ]}
        note="ς appears only as the last letter of a word; everywhere else sigma is σ."
      />
    </TableAside>

    {/* ── 3 · Tricky letters ─────────────────────────────── */}
    <SectionHeading id="pronunciation.h.impostors-letters-fool">The impostors: letters that fool English eyes</SectionHeading>
    <LevelOnly level="beginning">
      <P id="pronunciation.p.most-mistakes-first">
        Most mistakes in the first weeks come from six <strong>false friends</strong> — Greek letters that
        look like English letters but aren't. Drill these until the reflex dies:
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="pronunciation.al.three-groups-class">Three groups from class</Tr></AsideLabel>
        <p><Tr id="pronunciation.as.same-sound-new"><strong>Same sound, new shape</strong> (learn the shape): θ λ π φ.</Tr></p>
        <p><Tr id="pronunciation.as.false-friends-unlearn"><strong>False friends</strong> (unlearn the reflex): the table.</Tr></p>
        <p><Tr id="pronunciation.as.genuinely-new-one"><strong>Genuinely new</strong> (one sound each): ξ (relax), χ (chemical/loch), ψ (tops).</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="pronunciation.as.note-explains-english">The υ→y note explains English spellings of Greek loanwords: <Gk>μυστήριον</Gk> → mystery, <Gk>ψυχή</Gk> → psyche. When you transliterate, υ alone = y, but in diphthongs = u (αὐ → au).</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t2" tCols={[2]} flush title="False friends" headers={['Greek', 'Looks like', 'Actually is']} firstColIsData
        rows={[
          ['γ', 'y', 'g (as in “get”)'],
          ['η', 'n', 'ē (long e)'],
          ['μ', 'u', 'm'],
          ['ν', 'v', 'n'],
          ['ρ', 'p', 'r'],
          ['ω', 'w', 'ō (long o)'],
        ]}
      />
    </TableAside>
    <P id="pronunciation.p.vowels-also-pair">
      The vowels also pair off by length — two pairs share a letter shape for short and long, and three
      vowels do double duty:
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ε / η" en={<Tr id="pronunciation.ex.short-long-met">short e / long e (met / obey)</Tr>} />
        <Ex grc="ο / ω" en={<Tr id="pronunciation.ex.short-long-tone">short o / long o (not / tone)</Tr>} />
        <p><Tr id="pronunciation.as.can-each-short"><Gk>α, ι, υ</Gk> can each be short or long — same letter either way.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="pronunciation.as.short-long-system">This short/long system is why stem vowels "lengthen" in verb formation (<Gk>ποιέω → ἐποίησα</Gk>, <Gk>ε→η</Gk>) — the pairs you learn here are the machinery of the Contract Verbs chapter.</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t3" tCols={[0]} flush title="Short and long vowels" headers={['', 'a', 'e', 'i', 'o', 'u']} firstColIsData
        rows={[
          ['Short', 'α', 'ε', 'ι', 'ο', 'υ'],
          ['Long', 'α', 'η', 'ι', 'ω', 'υ'],
        ]}
      />
    </TableAside>

    {/* ── 4 · Breathings ─────────────────────────────────── */}
    <SectionHeading id="pronunciation.h.breathings-invisible">Breathings: the invisible h</SectionHeading>
    <P id="pronunciation.p.greek-letter-instead">
      Greek has no letter "h." Instead, every word that begins with a vowel carries a small mark called a
      <strong> breathing</strong>: a <strong>rough</strong> breathing (<Gk>ἁ</Gk>) adds an h-sound; a
      <strong> smooth</strong> breathing (<Gk>ἀ</Gk>) adds nothing — but must still be written. An initial
      <Gk> ρ</Gk> always takes the rough breathing too (<Gk>ῥ</Gk>), which is why English writes
      "rhetoric" and "rhythm" with <em>rh</em>.
    </P>
    <TableAside
      beginning={<>
        <Ex grc="ἅγιος" en={<Tr id="pronunciation.ex.hagios-holy-rough">hagios — holy (rough: h)</Tr>} />
        <Ex grc="ἄγγελος" en={<Tr id="pronunciation.ex.angelos-angel-smooth">angelos — angel (smooth: no h)</Tr>} />
        <p><Tr id="pronunciation.as.class-rule-breathings">Class rule: <strong>breathings are essential</strong> — never optional, even the silent smooth one.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="pronunciation.as.breathings-distinguish-real">Breathings distinguish real words — the pairs you keep meeting: <Gk>ἐν</Gk> "in" vs. <Gk>ἕν</Gk> "one"; <Gk>εἰς</Gk> "into" vs. <Gk>εἷς</Gk> "one"; <Gk>ἥ</Gk> relative "who" vs. <Gk>ἡ</Gk> article; <Gk>αὕτη</Gk> "this woman" vs. <Gk>αὐτή</Gk> "she."</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t4" tCols={[0, 2]} speakCols={[3]} flush title="Breathings" headers={['Breathing', 'Mark', 'Sound', 'Example']} firstColIsData
        rows={[
          ['Rough', '῾', 'h', 'ἅγιος (hagios)'],
          ['Smooth', '᾿', '(none)', 'ἄγγελος (angelos)'],
        ]}
        note="Every vowel-initial word carries one; initial ρ takes the rough breathing (ῥ)."
      />
    </TableAside>

    {/* ── 5 · Diphthongs ─────────────────────────────────── */}
    <SectionHeading id="pronunciation.h.diphthongs-iota-subscript">Diphthongs and the iota subscript</SectionHeading>
    <P id="pronunciation.p.diphthong-two-vowels">
      A <Term t="diphthong">diphthong</Term> is two vowels gliding into one sound. Greek has seven common
      ones, plus a ghost: when long <Gk>α, η, ω</Gk> combined with iota, the iota shrank to a tiny mark
      <em> underneath</em> — the <strong>iota subscript</strong> (<Gk>ᾳ ῃ ῳ</Gk>) — and went silent. You
      have been reading it all through the dative case (<Gk>τῷ λόγῳ</Gk>) without hearing it.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="pronunciation.al.spot-them-real">Spot them in a real verse</Tr></AsideLabel>
        <p><Tr id="pronunciation.as.now-when-john"><Gk>Ὁ δὲ Ἰωάννης ἀκούσας ἐν τῷ δεσμωτηρίῳ τὰ ἔργα τοῦ Χριστοῦ</Gk> — "Now when John heard in prison the works of Christ…" (Matt 11:2).</Tr></p>
        <p><Tr id="pronunciation.as.diphthongs-three-times">Diphthongs: <Gk>ου</Gk> (three times), <Gk>αι?</Gk> — no: <Gk>ἀκούσας</Gk> has <Gk>ου</Gk>; iota subscripts hide in <Gk>τῷ</Gk> and <Gk>δεσμωτηρίῳ</Gk>.</Tr></p>
      </>}
      intermediate={<>
        <p><Tr id="pronunciation.as.every-vowel-pair">Not every vowel pair is a diphthong: in <Gk>Ἰωάννης</Gk> the ω and α are separate syllables. When a normally-diphthong pair splits, editors mark a diaeresis: <Gk>Ἠσαΐας</Gk> (E-sa-i-as).</Tr></p>
        <p><Tr id="pronunciation.as.why-long-exist">Why "long αι, ηι, ωι do not exist": the iota subscript <em>is</em> those combinations, written under the long vowel.</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t5" tCols={[1, 2]} speakCols={[2]} flush title="The diphthongs" headers={['Diphthong', 'Sound', 'Example word']} firstColIsData
        rows={[
          ['αι', 'ai as in “aisle”', 'καί (and)'],
          ['ει', 'ei as in “veil”', 'εἰμί (I am)'],
          ['οι', 'oi as in “oil”', 'οἶκος (house)'],
          ['υι', 'ui as in “quit”', 'υἱός (son)'],
          ['αυ', 'ow as in “how”', 'αὐτός (he)'],
          ['ου', 'oo as in “soup”', 'οὐρανός (heaven)'],
          ['ευ / ηυ', 'eu as in “feud”', 'εὐαγγέλιον (gospel)'],
          ['ᾳ ῃ ῳ', '(iota silent)', 'τῷ λόγῳ (to the word)'],
        ]}
      />
    </TableAside>

    {/* ── 6 · Accents & punctuation ──────────────────────── */}
    <SectionHeading id="pronunciation.h.accents-punctuation">Accents and punctuation</SectionHeading>
    <LevelOnly level="beginning">
      <P id="pronunciation.p.greek-words-carry">
        Greek words carry accent marks — acute (<Gk>ά</Gk>), grave (<Gk>ὰ</Gk>), circumflex (<Gk>ᾶ</Gk>).
        For now, the class rule is blunt: <strong>breathings are essential; accents are unimportant</strong>.
        Read the accent as a stress mark ("say this syllable louder") and move on. Later you'll meet the
        handful of places where an accent is the only difference between words (<Gk>τις</Gk> "someone" vs.
        <Gk> τίς</Gk> "who?"; present <Gk>μένω</Gk> vs. future <Gk>μενῶ</Gk>) — the Pronouns and Liquid
        Verbs chapters flag them when they matter.
      </P>
    </LevelOnly>
    <TableAside
      beginning={<>
        <p><Tr id="pronunciation.as.question-mark-will">The question mark will ambush you once: what looks like an English semicolon <Gk>;</Gk> ends a Greek question.</Tr></p>
        <Ex grc="τίς εἶ;" en={<Tr id="pronunciation.ex.who">Who are you?</Tr>} />
      </>}
      intermediate={<>
        <p><Tr id="pronunciation.as.raised-dot-our">The raised dot <Gk>·</Gk> ≈ our colon/semicolon — you've seen it dividing clauses in every chapter's examples. Ancient manuscripts had none of this (nor spaces, nor lowercase); all punctuation in your printed text is editorial.</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t6" tCols={[1, 2]} flush title="Punctuation" headers={['Greek', 'English equivalent', 'Use']} firstColIsData
        rows={[
          ['.', 'period', 'end of sentence'],
          [',', 'comma', 'pause'],
          ['·', 'colon / semicolon', 'major break'],
          [';', 'question mark', 'end of question'],
        ]}
      />
    </TableAside>

    {/* ── 7 · Pronunciation schemes ──────────────────────── */}
    <SectionHeading id="pronunciation.h.one-alphabet-three">One alphabet, three pronunciations</SectionHeading>
    <P id="pronunciation.p.how-did-greek">
      How did Greek actually <em>sound</em>? It depends when — the language kept evolving for three
      thousand years — so today three schemes are in serious use, and honest teachers admit each is a
      choice, not a fact. We use <strong>Erasmian</strong> in class; here is the map:
    </P>
    <P id="pronunciation.p.erasmian-after-erasmus">
      <strong>Erasmian</strong> (after Erasmus, 1528) is the classroom convention of most seminaries and
      universities. Its virtue is pedagogical: <em>every letter and diphthong gets its own distinct
      sound</em>, so hearing a word tells you how to spell it, and spelling tells you how to say it. Its
      admitted vice: no Greek of any era ever quite spoke this way.
    </P>
    <P id="pronunciation.p.modern-greek-living">
      <strong>Modern Greek</strong> is the living tradition — how a billion services have been chanted in
      Greek churches. Its signature is <em>itacism</em>: the sounds of <Gk>η, ι, υ, ει, οι, υι</Gk> have
      all collapsed into "ee," while <Gk>β</Gk> became v and <Gk>δ</Gk> the soft th of "this." Beautiful,
      authentic to the continuing community — and hard on beginners, since six spellings share one sound.
    </P>
    <P id="pronunciation.p.reconstructed-koine-living">
      <strong>Reconstructed Koine</strong> (the "Living Koine" of scholars like Buth) aims at how Greek
      sounded in the first century — partway down the road from classical to modern: <Gk>β</Gk> already
      v-like, <Gk>αι</Gk> sounding like "eh," the h-breathing fading, but <Gk>η</Gk> and <Gk>ι</Gk> not
      yet merged. The best claim to being what Paul's letters sounded like read aloud.
    </P>
    <TableAside
      beginning={<>
        <AsideLabel><Tr id="pronunciation.al.why-choose-erasmian">Why we choose Erasmian</Tr></AsideLabel>
        <p><Tr id="pronunciation.as.because-learning-read">Because you are learning to <em>read and spell</em>, not to order coffee in Athens: one-sound-per-letter makes vocabulary stick and dictation possible. Whichever scheme you adopt later, consistency now is what matters.</Tr></p>
      </>}
    >
      <MorphTable id="pronunciation.t7" tCols={[0, 1, 2, 3]} flush title="The three schemes, side by side" headers={['Word', 'Erasmian (ours)', 'Reconstructed Koine', 'Modern Greek']} firstColIsData
        rows={[
          ['ἡμεῖς (we)', 'hay-MACE', 'eh-MEES', 'ee-MEES'],
          ['καί (and)', 'kai (as “eye”)', 'keh', 'keh'],
          ['βαπτίζω (I baptize)', 'bap-TID-zoh', 'vap-TEE-zo', 'vap-TEE-zo'],
          ['ἅγιος (holy)', 'HA-gi-os', 'HA-yos', 'A-yos (no h)'],
        ]}
      />
    </TableAside>

    {/* ── 8 · Try it ─────────────────────────────────────── */}
    <LevelOnly level="beginning"><SectionHeading id="pronunciation.h.try">Try it</SectionHeading></LevelOnly>
    <Practice id="pronunciation.pr1"
      title="Practice A — sound out the Greek"
      intro={<Tr id="pronunciation.intro.write-say-each">Write (or say) each word in English letters, then guess the meaning — these all became English words.</Tr>}
      items={[
        { q: <span className="normal-case">βάπτισμα</span>,
          a: <Tr id="pronunciation.pa.baptisma-baptism">baptisma — baptism.</Tr>},
        { q: <span className="normal-case">θρόνος</span>,
          a: <Tr id="pronunciation.pa.thronos-throne">thronos — throne.</Tr>},
        { q: <span className="normal-case">κόσμος</span>,
          a: <Tr id="pronunciation.pa.kosmos-world-cosmos">kosmos — world, cosmos. Note both sigmas: σ inside, ς at the end.</Tr>},
        { q: <span className="normal-case">παραβολή</span>,
          a: <Tr id="pronunciation.pa.parabole-parable">parabolē — parable.</Tr>},
        { q: <span className="normal-case">μυστήριον</span>,
          a: <Tr id="pronunciation.pa.mysterion-mystery-english">mystērion — mystery (υ → y in English).</Tr>},
        { q: <span className="normal-case">ψυχή</span>,
          a: <Tr id="pronunciation.pa.psyche-soul-psyche">psychē — soul, psyche. ψ = ps, χ = ch.</Tr>},
      ]}
    />
    <Practice id="pronunciation.pr2"
      title="Practice B — breathings, impostors, and names"
      intro={<Tr id="pronunciation.intro.watch-marks-false">Watch the marks and the false friends.</Tr>}
      items={[
        { q: <Tr id="pronunciation.q.h-sound">Which has the h-sound: <span className="normal-case">ἅγιος</span> or <span className="normal-case">ἄγγελος</span>?</Tr>,
          a: <Tr id="pronunciation.pa.rough-breathing-hagios"><span className="normal-case">ἅγιος</span> (rough breathing) = <em>hagios</em>; <span className="normal-case">ἄγγελος</span> (smooth) = <em>angelos</em> — and note γγ = "ng."</Tr>},
        { q: <Tr id="pronunciation.q.writing-ago">What's wrong with writing <span className="normal-case">αγω</span>?</Tr>,
          a: <Tr id="pronunciation.pa.vowel-initial-word">A vowel-initial word must carry a breathing: <span className="normal-case">ἄγω</span>. Smooth breathings are not optional.</Tr>},
        { q: <span className="normal-case">Παῦλος</span>,
          a: <Tr id="pronunciation.pa.paulos-paul-diphthong">Paulos — Paul. The diphthong αυ = "ow."</Tr>},
        { q: <span className="normal-case">Ἰερουσαλήμ</span>,
          a: <Tr id="pronunciation.pa.ierousalem-jerusalem-smooth">Ierousalēm — Jerusalem (smooth breathing on the Ι, ου = "oo").</Tr>},
        { q: <Tr id="pronunciation.q.nu-is-v">Is <span className="normal-case">ν</span> the English v?</Tr>,
          a: <Tr id="pronunciation.pa.false-friend-it's">No — false friend: it's n. (And ρ is r, not p.)</Tr>},
      ]}
    />

    {/* ── 9 · Into the text ──────────────────────────────── */}
    <InfoBox title={<Tr id="pronunciation.ib.read-real-thing">Now read the real thing</Tr>}>
      <p className="text-sm text-gray-700">
        <Tr id="pronunciation.ib.p1">You can already sound out Scripture. Open the </Tr>
        <Link href="/reader" className="text-brand-600 hover:underline"><Tr id="pronunciation.ib.link">Reader</Tr></Link>
        <Tr id="pronunciation.ib.p2"> at John 1:1 — <span className="normal-case">Ἐν ἀρχῇ ἦν ὁ λόγος</span>, "In the beginning was the
        Word" — and read it aloud: <em>en ar-CHAY ane ho LO-gos</em>. Every mark on those five words
        (breathings, an iota subscript, accents) is something you now recognize.</Tr>
      </p>
    </InfoBox>

    {/* ── 10 · Going deeper (Intermediate only) ──────────── */}
    <LevelOnly level="intermediate">
      <SectionHeading id="pronunciation.h.going-deeper-sound">Going deeper: sound history you can use</SectionHeading>
      <P id="pronunciation.p.itacism-manuscripts-converged">
        <strong>Itacism and the manuscripts.</strong> As <Gk>η, ι, υ, ει, οι</Gk> converged on "ee,"
        scribes taking dictation — or sounding out their exemplar — swapped those spellings freely. Most
        such variants are trivial, but some matter: <Gk>ἡμεῖς/ὑμεῖς</Gk> ("we/you") differ by exactly one
        itacized vowel, and the manuscripts of 1 John 1:4, 2 Cor 3:2, and Jude 5's neighbors split
        accordingly. When your apparatus shows an ε/αι or η/ι variant, think with your ears.
      </P>
      <P id="pronunciation.p.pitch-stress-classical">
        <strong>From pitch to stress.</strong> Classical accents marked musical <em>pitch</em> (the acute
        a rise, the circumflex a rise-and-fall); by the Koine period the system was collapsing into the
        plain stress accent Modern Greek keeps. That is why we can be relaxed about accents while insisting
        on breathings: in the first century the accents were already in flux, but initial /h/ still
        distinguished words.
      </P>
      <P id="pronunciation.p.letters-numbers-greek">
        <strong>The letters as numbers.</strong> Greek had no numerals — letters did the counting
        (α´ = 1, β´ = 2 … ι´ = 10, κ´ = 20), with three obsolete letters kept for the purpose. Hence
        Rev 13:18's "number of the beast," <Gk>χξϛ</Gk> = 600 + 60 + 6 — gematria assumes an alphabet
        that counts.
      </P>
    </LevelOnly>
  </>
)
