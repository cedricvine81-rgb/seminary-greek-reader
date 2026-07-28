'use client'
// Explainer panel for the Synopsis Compare mode: the ancient editorial techniques
// (Theon / Quintilian / Licona), how each maps to the color-coding, and where to read
// more. Rendered inline below the synopsis columns when the user opens the key.

import { WORD_LEVEL, NARRATIVE_LEVEL, TECHNIQUE_SOURCES, type TechniqueRef } from '@/lib/redaction-techniques'

function Refs({ refs }: { refs: TechniqueRef[] }) {
  return (
    <span className="text-[11px] text-gray-400">
      {refs.map((r, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {r.url
            ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{r.label}</a>
            : r.label}
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
          taught writers to retell a source in their own words. Theon names exactly four ways
          (<span className="italic">Progymnasmata</span> 101.7&ndash;9): <span className="font-medium">variation in syntax, addition, subtraction,
          substitution</span>, &ldquo;plus combinations of these.&rdquo; Compare mode detects those four automatically.
          The narrative-level devices below them (catalogued by Michael Licona from Plutarch&rsquo;s parallel
          <span className="italic"> Lives</span>) work at the level of the whole episode — the colors give you the evidence,
          but naming the device is your exegetical judgment.
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
        Sources: <Refs refs={TECHNIQUE_SOURCES} />. Quintilian links open the public-domain Butler
        translation (LacusCurtius / Perseus); Theon&rsquo;s <span className="italic">Progymnasmata</span> has no public-domain
        English translation — the standard one is George A. Kennedy, <span className="italic">Progymnasmata: Greek Textbooks
        of Prose Composition and Rhetoric</span> (SBL, 2003).
      </p>
    </div>
  )
}
