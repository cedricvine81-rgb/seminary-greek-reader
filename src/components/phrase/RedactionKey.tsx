'use client'
// Explainer panel for the Synopsis Compare mode: the ancient editorial techniques
// (Theon / Quintilian / Licona), how each maps to the color-coding, and where to read
// more. Rendered inline below the synopsis columns when the user opens the key.

import { BookOpen } from 'lucide-react'
import { WORD_LEVEL, NARRATIVE_LEVEL, TECHNIQUE_SOURCES, type TechniqueRef } from '@/lib/redaction-techniques'
import { openProsePassage } from '@/lib/prose-panel-bus'

// A citation. Sources embedded in this app (Theon, Quintilian) open in the side panel
// beside the key, so a student can read the ancient text against the passage that cited
// it; everything else stays an ordinary external link.
function Refs({ refs }: { refs: TechniqueRef[] }) {
  return (
    <span className="text-[11px] text-gray-400">
      {refs.map((r, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {r.passage ? (
            <button
              type="button"
              onClick={() => openProsePassage(r.passage!)}
              title="Read this passage beside the page"
              className="inline-flex items-baseline gap-0.5 text-brand-600 hover:underline"
            >
              <BookOpen size={11} className="translate-y-px" aria-hidden />
              {r.label}
            </button>
          ) : r.url ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{r.label}</a>
          ) : r.label}
        </span>
      ))}
    </span>
  )
}

/** The colored chip showing how a word-level technique is marked in the columns. */
function Swatch({ tag, children }: { tag: string; children: React.ReactNode }) {
  return <span className={`rc-mark rc-${tag} rounded px-1.5 py-0.5 text-xs font-medium text-gray-800 whitespace-nowrap`}>{children}</span>
}

export function RedactionKey() {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 space-y-5 text-sm">
      <div>
        <h3 className="font-semibold text-gray-800">Editorial techniques of ancient authors</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">
          The compositional exercises every Greco-Roman student practiced — preserved in Theon&rsquo;s{' '}
          <span className="italic">Progymnasmata</span> and Quintilian&rsquo;s <span className="italic">Institutio Oratoria</span> —
          taught writers to retell a source in their own words. In his chapter <span className="italic">On Paraphrase</span>{' '}
          Theon names four ways: <span className="font-medium">variation in syntax, addition, subtraction,
          substitution</span>, plus combinations of them. Compare mode detects those four automatically.
          The narrative-level devices below them (catalogued by Michael Licona from Plutarch&rsquo;s parallel
          <span className="italic"> Lives</span>) work at the level of the whole episode — the colors give you the evidence,
          but naming the device is your exegetical judgment. Examples here are worded from Markan
          priority, which both major source models share; where a note&rsquo;s direction depends on whether
          Luke used Matthew (Farrer) or Matthew and Luke independently used Q (Two-Source), the note
          follows the <span className="font-medium">Source model</span> selector beside the device chips. The compare
          tool itself takes no position — make any column the source to test a direction of dependence.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Word-level modes — colored automatically</h4>
        <ul className="space-y-3">
          <li className="flex flex-col gap-0.5">
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs font-medium text-gray-700 w-fit">plain — verbatim agreement</span>
            <span className="text-xs text-gray-500">Unmarked words are identical in form to the source: the copied core both columns share.</span>
          </li>
          {WORD_LEVEL.map(t => (
            <li key={t.tag} className="flex flex-col gap-0.5">
              <span className="flex items-baseline gap-2 flex-wrap">
                <Swatch tag={t.tag}>{t.name}</Swatch>
                <span className="text-[11px] italic text-gray-400">{t.ancient}</span>
              </span>
              <span className="text-xs text-gray-500">{t.description}</span>
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">Example:</span> {t.example}</span>
              <Refs refs={t.refs} />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Narrative-level devices — read from the evidence</h4>
        <ul className="grid gap-3 sm:grid-cols-2">
          {NARRATIVE_LEVEL.map(t => (
            <li key={t.name} className="rounded-lg border border-gray-200 p-2.5 flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-700">{t.name}</span>
              <span className="text-xs text-gray-500">{t.description}</span>
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">Example:</span> {t.example}</span>
              <span className="text-xs text-gray-500"><span className="font-medium text-gray-600">In the colors:</span> {t.lookFor}</span>
              <Refs refs={t.refs} />
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-gray-400">
        Sources: <Refs refs={TECHNIQUE_SOURCES} />. Citations marked with a book icon open here in a
        side panel, beside this key. Theon&rsquo;s Greek breaks off in the chapter on law: the
        earlier chapters (through <span className="italic">On the Chreia</span>) survive in Greek and can be read in this app,
        but the closing pedagogical chapters — including <span className="italic">On Paraphrase</span>, the source of the four
        modes above — are lost in Greek and survive only in a classical-Armenian version. The standard
        English of those is George A. Kennedy, <span className="italic">Progymnasmata: Greek Textbooks of Prose Composition
        and Rhetoric</span> (SBL, 2003), which is under copyright; page references to Spengel/Walz exist
        only for the Greek-extant part.
      </p>
    </div>
  )
}
