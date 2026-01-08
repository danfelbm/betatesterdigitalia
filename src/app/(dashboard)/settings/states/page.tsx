import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAnalysisStates } from '@/actions/analysis-states'
import { StatesManager } from '@/components/settings/states-manager'

export default async function StatesSettingsPage() {
  const user = await getCurrentUser()

  // Solo admin puede gestionar estados
  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: states } = await getAnalysisStates()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estados de Análisis</h1>
        <p className="text-muted-foreground">
          Personaliza los estados para trackear el progreso del análisis de cada material
        </p>
      </div>

      <StatesManager states={states || []} />
    </div>
  )
}
