import Link from 'next/link'
import { FileText, ExternalLink } from 'lucide-react'

interface Material {
  id: string
  title: string
  description?: string | null
  fileUrl?: string | null
  weekNumber?: number | null
  createdAt: string
}

interface MaterialListProps {
  materials: Material[]
  canEdit?: boolean
}

export function MaterialList({ materials, canEdit }: MaterialListProps) {
  if (materials.length === 0) {
    return <p className="text-sm text-gray-400 italic py-4">No materials yet.</p>
  }

  const grouped: Record<number, Material[]> = {}
  const noWeek: Material[] = []
  for (const m of materials) {
    if (m.weekNumber != null) {
      grouped[m.weekNumber] = [...(grouped[m.weekNumber] ?? []), m]
    } else {
      noWeek.push(m)
    }
  }

  function renderMaterial(m: Material) {
    return (
      <div key={m.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-2">
          <FileText size={16} className="text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{m.title}</p>
            {m.description && <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {m.fileUrl && (
            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800">
              <ExternalLink size={14} />
            </a>
          )}
          {canEdit && (
            <Link href={`/instructor/materials/${m.id}`} className="text-xs text-gray-500 hover:text-gray-800">
              Edit
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([week, items]) => (
        <div key={week}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Week {week}</h3>
          <div className="space-y-1">{items.map(renderMaterial)}</div>
        </div>
      ))}
      {noWeek.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">General</h3>
          <div className="space-y-1">{noWeek.map(renderMaterial)}</div>
        </div>
      )}
    </div>
  )
}
