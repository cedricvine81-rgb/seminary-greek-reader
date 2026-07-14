'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronUp, X } from 'lucide-react'
import type { LexicalInfoPanel } from '@/types/lexicon'
import { ParsingPanel } from './ParsingPanel'

interface MobileParsingSheetProps {
  info: LexicalInfoPanel | null
  locked?: boolean
}

/**
 * Mobile-only replacement for the fixed 256px ParsingPanel.
 *
 * Collapsed, it's a one-line pill (word + parsing + gloss) that stays in flow so
 * the text panel height never jumps. Tapping the pill slides up a bottom sheet
 * with the full lexica (reusing ParsingPanel's 'sheet' variant); the sheet is
 * dismissed with the close button, a backdrop tap, or a swipe-down.
 *
 * Rendered inside a `lg:hidden` wrapper — desktop keeps the original panel.
 */
export function MobileParsingSheet({ info, locked }: MobileParsingSheetProps) {
  const [expanded, setExpanded] = useState(false)

  // If the underlying selection clears (e.g. exiting search), close the sheet.
  useEffect(() => { if (!info) setExpanded(false) }, [info])

  // Lock body scroll while the sheet is open so drags don't move the page behind it.
  useEffect(() => {
    if (!expanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [expanded])

  return (
    <>
      {/* Collapsed pill — always in flow to keep the text panel height stable */}
      <button
        type="button"
        onClick={() => { if (info) setExpanded(true) }}
        disabled={!info}
        aria-expanded={expanded}
        className={`w-full text-left rounded-none border px-4 py-2.5 flex items-center gap-3 transition-colors ${
          info ? 'bg-surface border-brand-300 active:bg-brand-50' : 'bg-surface border-gray-200'
        }`}
      >
        {!info ? (
          <span className="text-sm text-gray-400 italic">Tap a Greek word for parsing.</span>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="greek-text text-base font-semibold text-brand-800 shrink-0">{info.surface}</span>
                <span className="text-xs text-gray-500 truncate">{info.parsing}</span>
              </div>
              {info.gloss && <p className="text-xs text-gray-400 truncate mt-0.5">{info.gloss}</p>}
            </div>
            <ChevronUp size={18} className="shrink-0 text-gray-400" />
          </>
        )}
      </button>

      {/* Expanded bottom sheet */}
      <AnimatePresence>
        {expanded && info && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-2xl shadow-xl flex flex-col max-h-[75vh]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 340 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, i) => { if (i.offset.y > 100 || i.velocity.y > 600) setExpanded(false) }}
              role="dialog"
              aria-label="Parsing and lexical information"
            >
              {/* Grab handle */}
              <div className="pt-2 pb-1 flex justify-center shrink-0">
                <span className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Parsing &amp; lexica</span>
                <button onClick={() => setExpanded(false)} aria-label="Close" className="text-gray-400 -m-1 p-1">
                  <X size={18} />
                </button>
              </div>
              <ParsingPanel info={info} locked={locked} variant="sheet" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
