'use client'
import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useApi } from '@/lib/api-client'
import { format } from 'date-fns'

interface AuditRow {
  id: string
  createdAt: string
  actorId: string | null
  actorEmail: string | null
  action: string
  targetType: string | null
  targetId: string | null
  before: unknown
  after: unknown
  context: unknown
}

interface AuditResponse {
  rows: AuditRow[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  actions: string[]
}

function JsonCell({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false)
  if (value === null || value === undefined) {
    return <span className="text-gray-300 text-xs">—</span>
  }
  const text = JSON.stringify(value, null, 2)
  const oneLine = JSON.stringify(value)
  return (
    <div className="text-xs">
      {open ? (
        <pre className="whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded p-2 max-h-40 overflow-auto">{text}</pre>
      ) : (
        <span className="text-gray-600 font-mono truncate inline-block max-w-[200px] align-middle">{oneLine}</span>
      )}
      <button onClick={() => setOpen(o => !o)} className="ml-1 text-brand-700 hover:underline text-[10px] uppercase tracking-wide">
        {open ? 'hide' : 'expand'}
      </button>
    </div>
  )
}

export function AdminAuditLog() {
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')
  const [targetId, setTargetId] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (action) params.set('action', action)
  if (targetType) params.set('targetType', targetType)
  if (targetId) params.set('targetId', targetId)
  params.set('page', String(page))

  const { data, isLoading, mutate } = useApi<AuditResponse>(`/api/admin/audit?${params.toString()}`)

  function clearFilters() {
    setAction(''); setTargetType(''); setTargetId(''); setPage(1)
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <CardTitle>Audit Log</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => mutate()}>Refresh</Button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Read-only record of sensitive admin/instructor actions. Newest first. {data && <span>{data.total} total entries.</span>}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <Select
          label="Action"
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1) }}
          options={[{ value: '', label: 'All actions' }, ...((data?.actions ?? []).map(a => ({ value: a, label: a })))]}
        />
        <Select
          label="Target type"
          value={targetType}
          onChange={e => { setTargetType(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'All types' },
            { value: 'User', label: 'User' },
            { value: 'Course', label: 'Course' },
            { value: 'Assignment', label: 'Assignment' },
          ]}
        />
        <Input
          label="Target id"
          value={targetId}
          onChange={e => { setTargetId(e.target.value); setPage(1) }}
          placeholder="cmq..."
        />
        <div className="flex items-end">
          <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-400 animate-pulse">Loading audit entries…</p>}

      {data && data.rows.length === 0 && (
        <p className="text-sm text-gray-400 italic py-4">No audit entries match these filters.</p>
      )}

      {data && data.rows.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 pr-3 whitespace-nowrap">When</th>
                  <th className="pb-2 pr-3">Actor</th>
                  <th className="pb-2 pr-3">Action</th>
                  <th className="pb-2 pr-3">Target</th>
                  <th className="pb-2 pr-3">Before</th>
                  <th className="pb-2">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap text-gray-500 text-xs">
                      {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 text-xs">
                      {r.actorEmail ?? <span className="text-gray-300">system</span>}
                    </td>
                    <td className="py-2 pr-3 font-medium text-gray-800 text-xs whitespace-nowrap">{r.action}</td>
                    <td className="py-2 pr-3 text-gray-500 text-xs">
                      {r.targetType ? `${r.targetType}` : <span className="text-gray-300">—</span>}
                      {r.targetId && <div className="font-mono text-[10px] text-gray-400 truncate max-w-[140px]">{r.targetId}</div>}
                    </td>
                    <td className="py-2 pr-3"><JsonCell value={r.before} /></td>
                    <td className="py-2"><JsonCell value={r.after} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">
              Page {data.page} of {data.totalPages} · showing {data.rows.length} of {data.total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                ← Prev
              </Button>
              <Button size="sm" variant="secondary" disabled={data.page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                Next →
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
