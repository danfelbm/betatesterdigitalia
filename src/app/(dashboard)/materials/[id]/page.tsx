import { notFound } from 'next/navigation'
import { getMaterialById } from '@/actions/materials'
import { getAnalysisStates } from '@/actions/analysis-states'
import { MaterialForm } from '@/components/materials/material-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MaterialDetailPage({ params }: PageProps) {
  const { id } = await params

  const [materialResult, statesResult] = await Promise.all([
    getMaterialById(id),
    getAnalysisStates(),
  ])

  if (!materialResult.data) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Material</h1>
        <p className="text-muted-foreground">
          Modifica los datos y notas de análisis
        </p>
      </div>

      <MaterialForm
        material={materialResult.data}
        states={statesResult.data || []}
        isEditing
      />
    </div>
  )
}
