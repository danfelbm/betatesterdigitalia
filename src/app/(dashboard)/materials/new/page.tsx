import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAnalysisStates } from '@/actions/analysis-states'
import { MaterialForm } from '@/components/materials/material-form'

export default async function NewMaterialPage() {
  const user = await getCurrentUser()

  // Solo admin puede crear materiales
  if (user?.role !== 'admin') {
    redirect('/materials')
  }

  const { data: states } = await getAnalysisStates()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Material</h1>
        <p className="text-muted-foreground">
          Agrega una nueva URL al repositorio de pruebas
        </p>
      </div>

      <MaterialForm states={states || []} />
    </div>
  )
}
