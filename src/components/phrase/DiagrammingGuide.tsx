'use client'
import Link from 'next/link'
import { ArrowLeft, Move, Slash, Brackets, Type, Magnet, Languages, RotateCcw, Printer, StickyNote } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'
import { DiagramCanvas, type DiagramData } from './DiagramCanvas'
import type { WordNodeT } from './PhraseExplorer'

/* ─────────────────────────────────────────────
   How-to guide for the Diagramming canvas (usability feedback: new users
   needed an explanation with pictures and a case for why diagramming is
   worth the effort).

   The "screenshots" are live read-only DiagramCanvas renders with baked
   layouts — always pixel-faithful to the real tool, theme-aware, and
   translated wherever the tool is.
───────────────────────────────────────────── */

// Example clause: John 1:1c — καὶ θεὸς ἦν ὁ λόγος.
const W = (id: string, w: string, gloss: string): WordNodeT => ({ t: 'w', id: `John.1.1.${id}`, w, gloss })
const DEMO_WORDS: WordNodeT[] = [
  W('13', 'καὶ', 'and'),
  W('14', 'θεὸς', 'God'),
  W('15', 'ἦν', 'was'),
  W('16', 'ὁ', 'the'),
  W('17', 'λόγος', 'Word'),
]
const k = (i: number) => `${DEMO_WORDS[i].id}#${i}`

// Step 1 — the fresh canvas: words stacked in verse order down the start edge.
const DEMO_COLUMN: DiagramData = {
  words: { [k(0)]: { x: 16, y: 16 }, [k(1)]: { x: 16, y: 66 }, [k(2)]: { x: 16, y: 116 }, [k(3)]: { x: 16, y: 166 }, [k(4)]: { x: 16, y: 216 } },
  lines: [],
}

// Step 2 — arranged on a Reed-Kellogg baseline: subject | verb \ predicate nominative,
// with the article hung beneath its noun.
const DEMO_ARRANGED: DiagramData = {
  words: {
    [k(0)]: { x: 24, y: 24 },     // καὶ floats above the clause
    [k(4)]: { x: 130, y: 70 },    // λόγος — subject on the baseline
    [k(2)]: { x: 300, y: 70 },    // ἦν — verb
    [k(1)]: { x: 440, y: 70 },    // θεὸς — predicate nominative
    [k(3)]: { x: 155, y: 165 },   // ὁ — article beneath λόγος
  },
  lines: [
    { x1: 110, y1: 120, x2: 560, y2: 120 },   // baseline
    { x1: 265, y1: 92, x2: 265, y2: 120 },    // subject | verb divider
    { x1: 425, y1: 92, x2: 400, y2: 120 },    // \ divider before the predicate nominative
    { x1: 175, y1: 120, x2: 150, y2: 162 },   // modifier slant down to the article
  ],
}

// Step 3 — labels and a clause bracket added.
const DEMO_LABELLED: DiagramData = {
  words: DEMO_ARRANGED.words,
  lines: [
    ...DEMO_ARRANGED.lines,
    { x1: 600, y1: 40, x2: 600, y2: 200, shape: 'bracket' },
  ],
  labels: [
    { x: 130, y: 40, text: 'subject' },
    { x: 420, y: 40, text: 'predicate nominative' },
    { x: 120, y: 205, text: 'article' },
    { x: 615, y: 110, text: 'main clause' },
  ],
}

function Demo({ data, caption }: { data: DiagramData; caption: string }) {
  return (
    <figure className="my-4">
      <DiagramCanvas words={DEMO_WORDS} initialData={data} readOnly minHeight={160} />
      <figcaption className="mt-1.5 text-xs text-gray-400">{caption}</figcaption>
    </figure>
  )
}

export function DiagrammingGuide() {
  const t = useT()
  const tools: { icon: React.ReactNode; nameKey: string; hintKey: string }[] = [
    { icon: <Move size={15} />,      nameKey: 'phr.move',        hintKey: 'phr.hint.move' },
    { icon: <Slash size={15} />,     nameKey: 'phr.drawLines',   hintKey: 'phr.hint.line' },
    { icon: <Brackets size={15} />,  nameKey: 'phr.bracketTool', hintKey: 'phr.hint.bracket' },
    { icon: <Type size={15} />,      nameKey: 'phr.addLabels',   hintKey: 'phr.hint.label' },
    { icon: <Magnet size={15} />,    nameKey: 'phr.straighten',  hintKey: 'phr.hint.magnet' },
    { icon: <Languages size={15} />, nameKey: 'phr.toggleGloss', hintKey: 'phr.hint.gloss' },
    { icon: <RotateCcw size={15} />, nameKey: 'phr.resetLayout', hintKey: 'phr.hint.reset' },
    { icon: <StickyNote size={15} />, nameKey: 'phr.note',       hintKey: 'dgg.tool.note' },
    { icon: <Printer size={15} />,   nameKey: 'phr.printPdf',    hintKey: 'dgg.tool.print' },
  ]
  const benefits = ['dgg.benefit1', 'dgg.benefit2', 'dgg.benefit3', 'dgg.benefit4', 'dgg.benefit5']

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <Link href="/exegesis?tab=phrasing" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
        <ArrowLeft size={14} /> {t('dgg.backToDiagramming')}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dgg.title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('dgg.intro')}</p>
      </div>

      {/* Why diagram? */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5">
        <h2 className="mb-2 text-base font-semibold text-brand-900">{t('dgg.benefitsTitle')}</h2>
        <ul className="space-y-1.5 text-sm leading-relaxed text-brand-800">
          {benefits.map(key => (
            <li key={key} className="flex gap-2"><span className="shrink-0 text-brand-500">•</span>{t(key)}</li>
          ))}
        </ul>
      </div>

      {/* Step by step */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900">{t('dgg.stepsTitle')}</h2>
        <p className="text-xs text-gray-400">{t('dgg.example')}</p>

        <div className="space-y-6 pt-1">
          <div>
            <p className="text-sm leading-relaxed text-gray-700"><span className="font-semibold text-gray-900">1.</span> {t('dgg.step1')}</p>
            <Demo data={DEMO_COLUMN} caption={t('dgg.caption1')} />
          </div>
          <div>
            <p className="text-sm leading-relaxed text-gray-700"><span className="font-semibold text-gray-900">2.</span> {t('dgg.step2')}</p>
            <Demo data={DEMO_ARRANGED} caption={t('dgg.caption2')} />
          </div>
          <div>
            <p className="text-sm leading-relaxed text-gray-700"><span className="font-semibold text-gray-900">3.</span> {t('dgg.step3')}</p>
            <Demo data={DEMO_LABELLED} caption={t('dgg.caption3')} />
          </div>
          <p className="text-sm leading-relaxed text-gray-700"><span className="font-semibold text-gray-900">4.</span> {t('dgg.step4')}</p>
        </div>
      </div>

      {/* The tools */}
      <div>
        <h2 className="mb-2 text-base font-semibold text-gray-900">{t('dgg.toolsTitle')}</h2>
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-surface">
          {tools.map(tool => (
            <li key={tool.nameKey} className="flex items-start gap-3 px-4 py-2.5">
              <span className="mt-0.5 shrink-0 rounded-md bg-gray-100 p-1.5 text-gray-600">{tool.icon}</span>
              <span className="text-sm">
                <span className="font-medium text-gray-900">{t(tool.nameKey)}</span>
                <span className="block text-gray-500">{t(tool.hintKey)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/exegesis?tab=phrasing" className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700">
        {t('dgg.cta')}
      </Link>
    </div>
  )
}
