'use client'
import { useEffect, useState, type RefObject } from 'react'
import clsx from 'clsx'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { useT } from '@/lib/i18n/LocaleProvider'

/* ─────────────────────────────────────────────
   Grammar chapter sidebar (self-study feedback: the flat strip of 20+ chapter
   tabs was overwhelming, and the order of material was invisible).

   Chapters live in a numbered list down the left; the open chapter shows its
   section subheadings beneath it (numbered N.M), which scroll-and-expand the
   matching section. The section list is DISCOVERED from the rendered chapter
   (every SectionHeading renders an h3[data-msec]) rather than maintained as a
   parallel registry for 40+ chapter files.
───────────────────────────────────────────── */

export interface TocSection { id: string; label: React.ReactNode; no: string }

/** Read the rendered chapter's section headings; assign ids and visible numbers. */
export function useSectionToc(
  containerRef: RefObject<HTMLElement | null>,
  chapterNo: number | null,
  deps: unknown[],
): TocSection[] {
  const [sections, setSections] = useState<TocSection[]>([])
  useEffect(() => {
    const root = containerRef.current
    if (!root) { setSections([]); return }
    const els = Array.from(root.querySelectorAll<HTMLHeadingElement>('h3[data-msec]'))
    setSections(els.map((el, i) => {
      if (!el.id) el.id = `msec-${i + 1}`
      const no = chapterNo != null ? `${chapterNo}.${i + 1}` : String(i + 1)
      // The visible in-page number (rendered by CSS from this attribute); headings that
      // already carry their own numbered circle (n=…) keep it and skip the prefix.
      el.setAttribute('data-secno', no)
      // textContent includes a hand-numbered circle's digits — strip them for the label.
      return { id: el.id, no, label: (el.textContent ?? '').replace(/^\s*\d+\s*/, '').trim() }
    }))
    // Children can re-mount after the fold state was applied (level/transliteration
    // toggles, translated prose arriving) — have every heading re-assert its fold.
    let timer: ReturnType<typeof setTimeout> | undefined
    const obs = new MutationObserver(() => {
      clearTimeout(timer)
      // setTimeout, not rAF: rAF never fires in a hidden tab, and content routinely
      // finishes loading while the reader is on another tab.
      timer = setTimeout(() => window.dispatchEvent(new Event('morph-fold-reassert')), 60)
    })
    obs.observe(root, { childList: true, subtree: true })
    return () => { obs.disconnect(); clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return sections
}

export interface SidebarItem {
  id: string
  label: React.ReactNode
  /** Position in the pedagogical sequence; omitted for reference material. */
  no?: number
  done?: boolean
}

export function ChapterSidebar({ groups, activeId, onSelect, sections, onSection }: {
  groups: { heading: string; items: SidebarItem[] }[]
  activeId: string
  onSelect: (id: string) => void
  /** Section list of the ACTIVE chapter (from useSectionToc, or hand-built). */
  sections: TocSection[]
  /** Overrides the default behaviour (expand + scroll to the section's heading). */
  onSection?: (id: string) => void
}) {
  const jump = (id: string) => {
    if (onSection) { onSection(id); return }
    window.dispatchEvent(new CustomEvent('morph-expand-section', { detail: id }))
  }
  return (
    <nav className="hidden lg:block w-60 shrink-0 print:hidden">
      <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-3 pb-6 border-r border-gray-100">
        {groups.map(g => (
          <div key={g.heading} className="mb-4">
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{g.heading}</p>
            <ul className="space-y-0.5">
              {g.items.map(item => {
                const active = item.id === activeId
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className={clsx(
                        'flex w-full items-baseline gap-1.5 rounded-lg px-2 py-1 text-left text-sm transition-colors',
                        active ? 'bg-brand-50 font-semibold text-brand-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      )}
                    >
                      {item.no != null && (
                        <span className={clsx('w-5 shrink-0 text-right text-xs tabular-nums', active ? 'text-brand-600' : 'text-gray-400')}>
                          {item.no}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {item.done && <span className="shrink-0 text-xs text-green-600">✓</span>}
                    </button>
                    {/* The open chapter unfolds its own outline. */}
                    {active && sections.length > 0 && (
                      <ul className="mb-1 mt-0.5 space-y-0.5 border-l border-brand-100 pl-2" style={{ marginInlineStart: item.no != null ? '1.6rem' : '0.5rem' }}>
                        {sections.map(sec => (
                          <li key={sec.id}>
                            <button
                              type="button"
                              onClick={() => jump(sec.id)}
                              className="flex w-full items-baseline gap-1.5 rounded px-1.5 py-0.5 text-left text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-700"
                            >
                              <span className="shrink-0 text-[11px] tabular-nums text-gray-400">{sec.no}</span>
                              <span className="min-w-0 flex-1">{sec.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}

/** Expand-all / collapse-all controls for the chapter's sections. */
export function FoldAllControls() {
  const t = useT()
  const fire = (mode: 'expanded' | 'collapsed') =>
    window.dispatchEvent(new CustomEvent('morph-fold-all', { detail: mode }))
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <button
        type="button"
        title={t('morph.expandAll')}
        aria-label={t('morph.expandAll')}
        onClick={() => fire('expanded')}
        className="rounded-md px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        <ChevronsUpDown size={15} />
      </button>
      <button
        type="button"
        title={t('morph.collapseAll')}
        aria-label={t('morph.collapseAll')}
        onClick={() => fire('collapsed')}
        className="rounded-md px-2 py-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        <ChevronsDownUp size={15} />
      </button>
    </div>
  )
}
