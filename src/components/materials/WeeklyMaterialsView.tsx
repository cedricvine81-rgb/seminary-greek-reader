import { MaterialList } from './MaterialList'

interface Material {
  id: string; title: string; description?: string | null; fileUrl?: string | null
  weekNumber?: number | null; createdAt: string
}

interface WeeklyMaterialsViewProps {
  materials: Material[]
  currentWeek?: number
}

export function WeeklyMaterialsView({ materials, currentWeek }: WeeklyMaterialsViewProps) {
  const thisWeek = currentWeek
    ? materials.filter(m => m.weekNumber === currentWeek)
    : []
  const other = materials.filter(m => !currentWeek || m.weekNumber !== currentWeek)

  return (
    <div className="space-y-6">
      {thisWeek.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">This Week (Week {currentWeek})</h2>
          <MaterialList materials={thisWeek} />
        </div>
      )}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">All Materials</h2>
        <MaterialList materials={other} />
      </div>
    </div>
  )
}
