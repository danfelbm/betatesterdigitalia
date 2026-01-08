import { getMaterialStats } from '@/actions/materials'
import { getAnalysisStates } from '@/actions/analysis-states'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ProgressOverview } from '@/components/dashboard/progress-overview'
import { EXPECTED_CATEGORIES } from '@/lib/constants'

export default async function DashboardPage() {
  const [statsResult, statesResult] = await Promise.all([
    getMaterialStats(),
    getAnalysisStates(),
  ])

  const stats = statsResult.data
  const states = statesResult.data || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen del repositorio de material de prueba AMI
        </p>
      </div>

      <StatsCards
        total={stats?.total || 0}
        byCategory={stats?.byCategory || {}}
        byFormat={stats?.byFormat || {}}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <ProgressOverview
          title="Por Estado de Análisis"
          data={stats?.byState || {}}
        />

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Por Categoría</h3>
          <div className="space-y-3">
            {EXPECTED_CATEGORIES.map((cat) => {
              const count = stats?.byCategory?.[cat.value] || 0
              const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={cat.value} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-sm">{cat.label}</span>
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {stats?.total === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No hay materiales en el repositorio todavía.
          </p>
          <p className="text-sm text-muted-foreground">
            Ejecuta el script de seed o agrega materiales manualmente desde la sección de Materiales.
          </p>
        </div>
      )}
    </div>
  )
}
