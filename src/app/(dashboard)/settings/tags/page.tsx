import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getTagGroupsWithTags } from '@/actions/tag-groups'
import { TagsManager } from '@/components/settings/tags-manager'
import type { TagGroupWithTags } from '@/types/database'

export default async function TagsSettingsPage() {
  const user = await getCurrentUser()

  // Solo admin puede gestionar etiquetas
  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: groups } = await getTagGroupsWithTags()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grupos de Etiquetas</h1>
        <p className="text-muted-foreground">
          Organiza tus etiquetas en grupos para clasificar y enriquecer el análisis de materiales
        </p>
      </div>
      <TagsManager groups={(groups || []) as TagGroupWithTags[]} />
    </div>
  )
}
