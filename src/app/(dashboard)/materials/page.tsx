import Link from 'next/link'
import { getMaterials } from '@/actions/materials'
import { getAnalysisStates } from '@/actions/analysis-states'
import { getTagGroupsWithTags } from '@/actions/tag-groups'
import { MaterialsTable } from '@/components/materials/materials-table'
import { MaterialsFilters } from '@/components/materials/materials-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { TagGroupWithTags } from '@/types/database'

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

  const [materialsResult, statesResult, tagGroupsResult] = await Promise.all([
    getMaterials({
      category: params.category as any,
      format: params.format as any,
      stateId: params.state,
      search: params.search,
    }),
    getAnalysisStates(),
    getTagGroupsWithTags(),
  ])

  const materials = materialsResult.data || []
  const states = statesResult.data || []
  const tagGroups = (tagGroupsResult.data || []) as TagGroupWithTags[]

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

      <MaterialsTable materials={materials} states={states} tagGroups={tagGroups} />
    </div>
  )
}
