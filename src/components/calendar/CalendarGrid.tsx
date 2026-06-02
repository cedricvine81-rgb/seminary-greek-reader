'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, format,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CalendarEvent {
  id: string
  title: string
  type: string
  dueDate: string        // ISO string
  href: string           // where clicking the chip navigates
  courseName?: string    // shown on instructor view
  isCompleted?: boolean  // student: grays out chip
  isPublished?: boolean  // instructor: drafts shown faded
}

// ── Colour map matching existing assignment type badges ────────────────────────

const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  VOCABULARY_QUIZ:      { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500',   label: 'Vocab' },
  PASSAGE_VOCABULARY:   { bg: 'bg-indigo-100',  text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Passage' },
  MORPHOLOGY_QUIZ:      { bg: 'bg-purple-100',  text: 'text-purple-800', dot: 'bg-purple-500', label: 'Morph' },
  TRANSLATION_EXERCISE: { bg: 'bg-green-100',   text: 'text-green-800',  dot: 'bg-green-500',  label: 'Trans' },
}
const FALLBACK_STYLE = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Quiz' }

function getStyle(type: string) {
  return TYPE_STYLES[type] ?? FALLBACK_STYLE
}

// ── Legend ─────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {Object.entries(TYPE_STYLES).map(([, s]) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

// ── Event chip ─────────────────────────────────────────────────────────────────

function EventChip({ event }: { event: CalendarEvent }) {
  const s = getStyle(event.type)
  const faded = event.isCompleted || event.isPublished === false
  const label = event.courseName
    ? `${s.label} · ${event.courseName}`
    : event.title.length > 22 ? event.title.slice(0, 20) + '…' : event.title

  return (
    <Link
      href={event.href}
      title={`${event.title}${event.courseName ? ` — ${event.courseName}` : ''}`}
      className={`
        block rounded px-1.5 py-0.5 text-xs font-medium leading-tight truncate transition-opacity
        ${s.bg} ${s.text}
        ${faded ? 'opacity-50' : 'hover:opacity-80'}
        ${event.isPublished === false ? 'ring-1 ring-dashed ring-gray-400' : ''}
      `}
    >
      {label}
    </Link>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  events: CalendarEvent[]
  initialDate?: string   // ISO — defaults to today
}

export function CalendarGrid({ events, initialDate }: Props) {
  const [current, setCurrent] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  )

  const monthStart  = startOfMonth(current)
  const monthEnd    = endOfMonth(current)
  const gridStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd     = endOfWeek(monthEnd,    { weekStartsOn: 0 })

  // Build week rows
  const weeks: Date[][] = []
  let day = gridStart
  while (day <= gridEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1) }
    weeks.push(week)
  }

  // Index events by date string
  const byDate: Record<string, CalendarEvent[]> = {}
  for (const e of events) {
    const key = format(new Date(e.dueDate), 'yyyy-MM-dd')
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(e)
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {format(current, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent(d => subMonths(d, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            Today
          </button>
          <button
            onClick={() => setCurrent(d => addMonths(d, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t border-gray-200">
        {weeks.flatMap(week =>
          week.map(day => {
            const key     = format(day, 'yyyy-MM-dd')
            const dayEvts = byDate[key] ?? []
            const inMonth = isSameMonth(day, current)
            const today   = isToday(day)

            return (
              <div
                key={key}
                className={`
                  min-h-[90px] border-r border-b border-gray-200 p-1.5 flex flex-col gap-1
                  ${!inMonth ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                {/* Date number */}
                <span className={`
                  self-end text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                  ${today ? 'bg-brand-600 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}
                `}>
                  {format(day, 'd')}
                </span>

                {/* Event chips — show up to 3, then +N more */}
                {dayEvts.slice(0, 3).map(e => (
                  <EventChip key={e.id} event={e} />
                ))}
                {dayEvts.length > 3 && (
                  <span className="text-xs text-gray-400 px-1">
                    +{dayEvts.length - 3} more
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Legend */}
      <Legend />
    </div>
  )
}
