import Link from 'next/link'
import { getMaterials } from '@/actions/materials'
import { getAnalysisStates } from '@/actions/analysis-states'
import { MaterialsTable } from '@/components/materials/materials-table'
import { MaterialsFilters } from '@/components/materials/materials-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{
    category?: string
    format?: string
    state?: string
    search?: string
  }>
}

export default async function MaterialsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const [materialsResult, statesResult] = await Promise.all([
    getMaterials({
      category: params.category as any,
      format: params.format as any,
      stateId: params.state,
      search: params.search,
    }),
    getAnalysisStates(),
  ])

  const materials = materialsResult.data || []
  const states = statesResult.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materiales</h1>
          <p className="text-muted-foreground">
            {materials.length} materiales en el repositorio
          </p>
        </div>
        <Link href="/materials/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo material
          </Button>
        </Link>
      </div>

      <MaterialsFilters states={states} />

      <MaterialsTable materials={materials} states={states} />
    </div>
  )
}
