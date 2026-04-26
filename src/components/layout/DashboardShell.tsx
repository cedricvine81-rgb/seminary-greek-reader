import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface DashboardShellProps {
  role: 'INSTRUCTOR' | 'STUDENT'
  children: ReactNode
  pageTitle?: string
  pageDescription?: string
  actions?: ReactNode
}

export function DashboardShell({
  role, children, pageTitle, pageDescription, actions
}: DashboardShellProps) {
  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar role={role} />
      <main className="flex-1 min-w-0 p-6 lg:p-8 bg-gray-50">
        {(pageTitle || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              {pageTitle && (
                <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
              )}
              {pageDescription && (
                <p className="text-sm text-gray-500 mt-0.5">{pageDescription}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
