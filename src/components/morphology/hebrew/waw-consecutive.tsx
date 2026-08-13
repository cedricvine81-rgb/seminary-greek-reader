/* ─────────────────────────────────────────────
   Hebrew chapter: The Waw-Consecutive

   Wayyiqtol — the backbone of Hebrew narrative — and its mirror
   weqatal. The single most important chapter for actually reading.
───────────────────────────────────────────── */

import { MorphTable, InfoBox, P, SectionHeading, Practice, Hb, HbEx } from '../shared'

export const HB_WAW = (
  <>
    <P>
      Open any page of Hebrew narrative and most clauses begin the same way: <Hb>וַיּ…</Hb>{' '}
      &ldquo;and he…&rdquo;. This is the <strong>wayyiqtol</strong> (sequential imperfect):
      a special waw — <Hb>וַ</Hb> plus doubling — welded onto the imperfect, and the whole
      thing means simple <em>past</em>. It is how Hebrew tells a story: and he arose, and he
      went, and he said…
    </P>

    <SectionHeading n={1}>The form</SectionHeading>
    <MorphTable
      title="Wayyiqtol of קטל"
      headers={['', 'Imperfect', 'Wayyiqtol', 'Meaning']}
      hCols={[1, 2]}
      tCols={[3]}
      rows={[
        ['3ms', 'יִקְטֹל', 'וַיִּקְטֹל', 'and he killed'],
        ['3fs', 'תִּקְטֹל', 'וַתִּקְטֹל', 'and she killed'],
        ['1cs', 'אֶקְטֹל', 'וָאֶקְטֹל', 'and I killed'],
        ['3mp', 'יִקְטְלוּ', 'וַיִּקְטְלוּ', 'and they killed'],
      ]}
      note="וַ + dagesh forte in the prefix letter. Before א (which refuses doubling) the vowel lengthens: וָאֶקְטֹל."
    />
    <P>
      Where a verb has a shortened (jussive-style) imperfect, the wayyiqtol uses it — which is
      why the commonest narrative verbs look clipped: <Hb>וַיְהִי</Hb> &ldquo;and it
      was&rdquo; (not <Hb>וַיִּהְיֶה</Hb>), <Hb>וַיַּרְא</Hb> &ldquo;and he saw,&rdquo;{' '}
      <Hb>וַיָּמָת</Hb> &ldquo;and he died,&rdquo; <Hb>וַיֹּאמֶר</Hb> &ldquo;and he
      said.&rdquo;
    </P>

    <SectionHeading n={2}>Weqatal: the mirror</SectionHeading>
    <P>
      The perfect plays the same trick in reverse. <Hb>וְ</Hb> + perfect
      (<strong>weqatal</strong>) does not mean &ldquo;and he did&rdquo; — it carries{' '}
      <em>imperfect</em> force, continuing commands, instructions and futures:
    </P>
    <MorphTable
      title="The two sequential forms"
      headers={['Form', 'Looks like', 'Acts like', 'Home territory']}
      tCols={[2, 3]}
      hCols={[1]}
      firstColIsData
      rows={[
        ['wayyiqtol', 'וַיִּקְטֹל', 'perfect (past)', 'narrative'],
        ['weqatal', 'וְקָטַל', 'imperfect (future / command)', 'law, instruction, prophecy'],
      ]}
      note="In weqatal the stress often moves to the last syllable: וְשָׁמַרְתָּ֫. The plain-waw perfect (simple “and” + past) also exists — context tells them apart."
    />
    <HbEx he="וְאָהַבְתָּ אֵת יְהוָה אֱלֹהֶיךָ" en={<>“And you shall love the LORD your God” (Deut 6:5) — a perfect in form, a command in force: weqatal.</>} />

    <SectionHeading n={3}>Reading narrative</SectionHeading>
    <P>
      The chain <Hb>וַיּ… וַיּ… וַיּ…</Hb> is the story&rsquo;s spine; the subject follows its
      verb. When a narrator breaks the chain — <Hb>וְ</Hb> + something <em>other</em> than a
      verb first — the mainline pauses for background, contrast, or a new scene:{' '}
      <Hb>וְהַנָּחָשׁ הָיָה עָרוּם</Hb>, &ldquo;now the serpent was crafty&rdquo; (Gen 3:1).
    </P>
    <HbEx he="וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי־אוֹר" en={<>“And God said, ‘Let there be light,’ and there was light” (Gen 1:3) — wayyiqtol, jussive, wayyiqtol: three chapters of grammar in seven words.</>} />

    <InfoBox title="Watch for">
      <p className="mb-1">Don’t confuse <Hb>וַ</Hb> + dagesh (sequential) with plain <Hb>וְ</Hb> + imperfect (“and he will…”). The patach and the doubling are the signature.</p>
      <p className="mb-1"><Hb>וַיְהִי</Hb> also serves as a discourse marker — “and it came to pass” — often followed by a time phrase before the story resumes.</p>
      <p>In the 1cs, וָ before א: <Hb>וָאֹמַר</Hb> “and I said.”</p>
    </InfoBox>

    <Practice
      level="both"
      title="Parse these"
      items={[
        { q: <Hb>וַיִּשְׁמַע</Hb>, a: <>Qal wayyiqtol (sequential imperfect) 3ms of <Hb>שׁמע</Hb> — “and he heard.”</> },
        { q: <Hb>וַתֹּאמֶר</Hb>, a: <>Qal wayyiqtol 3fs of <Hb>אמר</Hb> — “and she said.”</> },
        { q: <Hb>וְשָׁמַרְתָּ</Hb>, a: <>Qal weqatal (sequential perfect) 2ms of <Hb>שׁמר</Hb> — “and you shall keep.”</> },
        { q: <>Why is <Hb>וַיְהִי</Hb> so short?</>, a: <>Wayyiqtol prefers the shortened (jussive) form where one exists: יִהְיֶה → יְהִי, plus וַ. Qal wayyiqtol 3ms of <Hb>היה</Hb>.</> },
      ]}
    />
  </>
)
