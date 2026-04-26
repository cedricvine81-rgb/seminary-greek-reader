interface MaterialProgressTrackerProps {
  total: number
  viewed: number
}

export function MaterialProgressTracker({ total, viewed }: MaterialProgressTrackerProps) {
  const pct = total > 0 ? Math.round((viewed / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{viewed}/{total} viewed</span>
    </div>
  )
}
