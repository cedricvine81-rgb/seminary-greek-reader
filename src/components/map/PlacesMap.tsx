'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { MapPin, Search, X, Loader2 } from 'lucide-react'
import { useT, useLocale } from '@/lib/i18n/LocaleProvider'
import { formatNumber } from '@/lib/i18n/format'
import { openMasterSearch, hasMasterSearch } from '@/lib/master-search-bus'

// A map of every place the Texts library's authors name, drawn as SVG from data built by
// scripts/build-places.py. No tile server and no external request: the coastline ships with the
// app, which it has to, since the reader must work under exam lockdown and behind the CSP.
//
// Projection is equirectangular — longitude and latitude straight onto x and y. Over the
// Mediterranean that stretches the north a little, so latitude is scaled by cos(mid) to keep
// Greece and Egypt in roughly true proportion; nothing here needs a conformal projection.

interface Place {
  k: string                       // gazetteer key
  n: string                       // name as the translators spell it
  lat: number
  lon: number
  c: number                       // total mentions
  a: Record<string, number>       // mentions per author
}

const BBOX = { w: -13, s: 17, e: 68, n: 60 }
const MID_LAT_SCALE = Math.cos((((BBOX.s + BBOX.n) / 2) * Math.PI) / 180)
const W = 1000
const H = ((BBOX.n - BBOX.s) / (BBOX.e - BBOX.w)) * W / MID_LAT_SCALE

const x = (lon: number) => ((lon - BBOX.w) / (BBOX.e - BBOX.w)) * W
const y = (lat: number) => ((BBOX.n - lat) / (BBOX.n - BBOX.s)) * H

/** Dot radius from mention count — square-rooted, so Athens' 1,819 doesn't swallow the Aegean. */
const radius = (count: number) => Math.min(11, 1.6 + Math.sqrt(count) * 0.42)

export function PlacesMap() {
  const t = useT()
  const locale = useLocale()
  const [places, setPlaces] = useState<Place[] | null>(null)
  const [land, setLand] = useState<number[][][] | null>(null)
  const [author, setAuthor] = useState<string>('all')
  const [selected, setSelected] = useState<Place | null>(null)
  const [hover, setHover] = useState<Place | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState({ x: 0, y: 0, w: W, h: H })
  const drag = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/places/gazetteer.json').then(r => r.json()),
      fetch('/data/places/land.json').then(r => r.json()),
    ]).then(([g, l]) => { setPlaces(g.places); setLand(l) }).catch(() => setPlaces([]))
  }, [])

  const authors = useMemo(() => {
    if (!places) return []
    const counts = new Map<string, number>()
    for (const p of places) for (const [a, c] of Object.entries(p.a)) counts.set(a, (counts.get(a) ?? 0) + c)
    // Array.from, not a spread: the tsconfig target makes spreading a Map iterator an error,
    // and next dev does not run that check — only the production build does.
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [places])

  // Filtering by author re-counts each place, so a dot's size always means "mentions by whoever
  // is currently selected" rather than its total across the library.
  const shown = useMemo(() => {
    if (!places) return []
    const list = author === 'all'
      ? places
      : places.filter(p => p.a[author]).map(p => ({ ...p, c: p.a[author] }))
    const q = query.trim().toLowerCase()
    return q ? list.filter(p => p.n.toLowerCase().includes(q)) : list
  }, [places, author, query])

  function zoom(factor: number, cx: number, cy: number) {
    setView(v => {
      const w = Math.min(W, Math.max(W / 40, v.w * factor))
      const h = w * (H / W)
      return {
        w, h,
        x: Math.min(W - w, Math.max(0, cx - (cx - v.x) * (w / v.w))),
        y: Math.min(H - h, Math.max(0, cy - (cy - v.y) * (h / v.h))),
      }
    })
  }

  function toSvg(e: { clientX: number; clientY: number }) {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return { cx: view.x + view.w / 2, cy: view.y + view.h / 2 }
    return {
      cx: view.x + ((e.clientX - r.left) / r.width) * view.w,
      cy: view.y + ((e.clientY - r.top) / r.height) * view.h,
    }
  }

  if (places === null) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" size={20} />
      </div>
    )
  }

  const scale = view.w / W        // < 1 when zoomed in; keeps strokes and labels a constant size

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('map.findPlace')}
            aria-label={t('map.findPlaceAria')}
            className="w-52 rounded-lg border border-gray-200 bg-surface py-1.5 pl-8 pr-3 text-sm"
          />
        </div>
        <select
          value={author}
          onChange={e => { setAuthor(e.target.value); setSelected(null) }}
          aria-label={t('map.filterByAuthor')}
          className="rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-sm"
        >
          <option value="all">{t('map.allAuthors', { n: formatNumber(places.length, locale) })}</option>
          {authors.map(([a, c]) => <option key={a} value={a}>{a} ({formatNumber(c, locale)})</option>)}
        </select>
        <span className="text-xs text-gray-500">{t('map.placesShown', { n: formatNumber(shown.length, locale) })}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => zoom(1 / 1.5, view.x + view.w / 2, view.y + view.h / 2)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-brand-50" aria-label={t('map.zoomIn')}>+</button>
          <button onClick={() => zoom(1.5, view.x + view.w / 2, view.y + view.h / 2)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-brand-50" aria-label={t('map.zoomOut')}>−</button>
          <button onClick={() => setView({ x: 0, y: 0, w: W, h: H })}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-brand-50">{t('map.reset')}</button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-surface">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          onWheel={e => { const { cx, cy } = toSvg(e); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, cx, cy) }}
          onPointerDown={e => { drag.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; (e.target as Element).setPointerCapture?.(e.pointerId) }}
          onPointerMove={e => {
            if (!drag.current) return
            const r = svgRef.current!.getBoundingClientRect()
            setView(v => ({
              ...v,
              x: Math.min(W - v.w, Math.max(0, drag.current!.vx - ((e.clientX - drag.current!.sx) / r.width) * v.w)),
              y: Math.min(H - v.h, Math.max(0, drag.current!.vy - ((e.clientY - drag.current!.sy) / r.height) * v.h)),
            }))
          }}
          onPointerUp={() => { drag.current = null }}
          onPointerLeave={() => { drag.current = null; setHover(null) }}
        >
          <rect x={0} y={0} width={W} height={H} className="fill-[var(--map-sea)]" />
          {land?.map((ring, i) => (
            <polygon key={i} className="fill-[var(--map-land)] stroke-[var(--map-coast)]"
              strokeWidth={0.6 * scale}
              points={ring.map(([lo, la]) => `${x(lo).toFixed(1)},${y(la).toFixed(1)}`).join(' ')} />
          ))}

          {shown.map(p => {
            const r = radius(p.c) * Math.max(0.45, Math.sqrt(scale))
            const on = selected?.k === p.k || hover?.k === p.k
            return (
              <circle
                key={p.k} cx={x(p.lon)} cy={y(p.lat)} r={r}
                className={on ? 'fill-brand-600' : 'fill-brand-500/70'}
                stroke="white" strokeWidth={0.7 * scale}
                onPointerEnter={() => setHover(p)}
                onPointerLeave={() => setHover(null)}
                onClick={e => { e.stopPropagation(); setSelected(p) }}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${p.n} — ${p.c.toLocaleString()} mention${p.c === 1 ? '' : 's'}`}</title>
              </circle>
            )
          })}

          {/* Names appear once zoomed in, biggest places first, so the map is legible at every scale. */}
          {scale < 0.55 && shown.filter(p => p.c >= (scale < 0.2 ? 2 : 12)).map(p => (
            <text key={`t-${p.k}`} x={x(p.lon) + radius(p.c) * Math.max(0.45, Math.sqrt(scale)) + 2.5 * scale}
              y={y(p.lat) + 3 * scale} fontSize={9 * scale}
              className="pointer-events-none fill-[var(--map-label)]">{p.n}</text>
          ))}
        </svg>

        {hover && !selected && (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-popover px-2.5 py-1.5 text-xs shadow-md">
            <span className="font-medium text-gray-800">{hover.n}</span>
            <span className="ml-2 text-gray-500">{hover.c.toLocaleString()} mention{hover.c === 1 ? '' : 's'}</span>
          </div>
        )}

        {selected && (
          <div className="absolute right-2 top-2 max-h-[calc(100%-1rem)] w-64 overflow-y-auto rounded-xl border border-gray-200 bg-popover p-3 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <MapPin size={14} className="text-brand-600" />{selected.n}
              </h3>
              <button onClick={() => setSelected(null)} aria-label={t('map.close')} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {selected.lat.toFixed(2)}°{selected.lat >= 0 ? 'N' : 'S'}, {Math.abs(selected.lon).toFixed(2)}°{selected.lon >= 0 ? 'E' : 'W'}
              {' · '}{t('map.mentionCount', { count: selected.c, n: formatNumber(selected.c, locale) })}
            </p>
            <ul className="mt-2 space-y-0.5">
              {Object.entries(selected.a).sort((a, b) => b[1] - a[1]).map(([a, c]) => (
                <li key={a} className="flex justify-between gap-3 text-xs text-gray-700">
                  <span>{a}</span><span className="tabular-nums text-gray-500">{formatNumber(c, locale)}</span>
                </li>
              ))}
            </ul>
            {/* Opens the app-wide search pane beside the map rather than navigating away from
                it — globals.css squeezes #app-content, so the map stays visible on the left and
                the passages appear on the right. Falls back to the search page where the pane
                isn't mounted (it isn't during a lockdown exam). */}
            {hasMasterSearch() ? (
              <button
                type="button"
                onClick={() => openMasterSearch({ query: selected.n, scope: 'bg:all' })}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
              >
                <Search size={12} /> {t('map.findInTexts', { place: selected.n })}
              </button>
            ) : (
              <Link
                href={`/search?q=${encodeURIComponent(selected.n)}&in=bg:all`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
              >
                <Search size={12} /> {t('map.findInTexts', { place: selected.n })}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
