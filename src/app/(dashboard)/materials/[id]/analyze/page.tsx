import { notFound, redirect } from 'next/navigation'
import { getMaterialById } from '@/actions/materials'
import { getComments } from '@/actions/comments'
import { getMaterialTags } from '@/actions/analysis'
import { getAnalysisStates } from '@/actions/analysis-states'
import { getTagGroupsWithTags } from '@/actions/tag-groups'
import { getCurrentUser } from '@/lib/auth'
import { AnalysisForm } from '@/components/materials/analysis-form'
import type { TagGroupWithTags, Material, AnalysisState } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnalyzeMaterialPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const [materialResult, commentsResult, tagsResult, statesResult, tagGroupsResult] =
    await Promise.all([
      getMaterialById(id),
      getComments(id),
      getMaterialTags(id),
      getAnalysisStates(),
      getTagGroupsWithTags(),
    ])

  if (!materialResult.data) {
    notFound()
  }

  const material = materialResult.data
  const comments = commentsResult.data || []
  const materialTags = tagsResult.data || []
  const states = statesResult.data || []
  const tagGroups = (tagGroupsResult.data || []) as TagGroupWithTags[]

  // Determinar el estado al que revertir si se cancela
  // Si el material ya está "En progreso" (por un cleanup fallido anterior),
  // usar el estado "Pendiente" en su lugar para no quedarse atascado
  let previousStateId = material.analysis_state_id

  const currentState = material.analysis_state as AnalysisState | null
  if (currentState?.name?.toLowerCase() === 'en progreso') {
    const pendingState = states.find(s => s.name.toLowerCase() === 'pendiente')
    if (pendingState) {
      previousStateId = pendingState.id
    }
  }

  return (
    <AnalysisForm
      material={material as Material}
      comments={comments}
      materialTagIds={materialTags.map(t => t.id)}
      states={states}
      tagGroups={tagGroups}
      currentUserEmail={user.email || ''}
      previousStateId={previousStateId}
      isAdmin={user.role === 'admin'}
    />
  )
}
