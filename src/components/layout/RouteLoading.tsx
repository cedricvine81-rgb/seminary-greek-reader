// The instant response to a menu click. Rendered by the loading.tsx files while the next
// page's server component runs — before these existed, clicking a menu item changed NOTHING
// on screen until the server answered, so a cold start (10+ seconds) read as "the menu is
// broken" and got reported as exactly that.
//
// Static by necessity: DashboardShell queries the database (pending counts, subscription),
// and a loading state must render from the bundle alone. So this mimics the shell's frame —
// same sidebar width, same content padding — and shimmers where the page will be. The
// sidebar swaps real → placeholder → real during navigation; a stable-looking frame that
// responds instantly beats a perfectly stable one that doesn't.
export function RouteLoading() {
  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar placeholder — matches Sidebar.tsx: w-56, desktop only */}
      <aside className="w-56 shrink-0 hidden lg:flex flex-col bg-surface border-r border-gray-100 min-h-screen pt-6 px-4 gap-3">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-8 rounded-lg bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </aside>

      {/* Content placeholder — matches DashboardShell's <main> */}
      <main className="flex-1 min-w-0 p-4 lg:p-8 bg-gray-50 pb-20 lg:pb-8">
        <div className="h-8 w-64 rounded-lg bg-gray-200 animate-pulse mb-6" />
        <div className="space-y-4 max-w-4xl">
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse [animation-delay:120ms]" />
          <div className="h-28 rounded-2xl bg-gray-100 animate-pulse [animation-delay:240ms]" />
        </div>
      </main>
    </div>
  )
}
