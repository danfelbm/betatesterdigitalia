'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import type { MaterialInsert, MaterialUpdate, ExpectedCategory, MaterialFormat, Material, Tag } from '@/types/database'

export async function getMaterials(filters?: {
  category?: ExpectedCategory
  format?: MaterialFormat
  stateId?: string
  tagIds?: string[]  // Filtrar por etiquetas
  search?: string
}) {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: todos ven todos los materiales
  let query = supabase
    .from('materials')
    .select('*, analysis_state:analysis_states(*)')
    .order('created_at', { ascending: false })

  if (filters?.category) {
    query = query.eq('expected_category', filters.category)
  }

  if (filters?.format) {
    query = query.eq('format', filters.format)
  }

  if (filters?.stateId) {
    query = query.eq('analysis_state_id', filters.stateId)
  }

  if (filters?.search) {
    query = query.or(`description.ilike.%${filters.search}%,source.ilike.%${filters.search}%,url.ilike.%${filters.search}%`)
  }

  const { data: materials, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  if (!materials || materials.length === 0) {
    return { error: null, data: [] }
  }

  const materialIds = materials.map(m => m.id)

  // Obtener etiquetas para todos los materiales
  const { data: materialTags } = await supabase
    .from('material_tags')
    .select('material_id, tag:tags(id, name, color, group_id, description, display_order, created_at)')
    .in('material_id', materialIds)

  // Obtener conteo de comentarios para todos los materiales
  const { data: comments } = await supabase
    .from('comments')
    .select('material_id')
    .in('material_id', materialIds)

  // Mapear etiquetas por material
  const tagsByMaterial = materialTags?.reduce((acc, mt: any) => {
    if (!acc[mt.material_id]) {
      acc[mt.material_id] = []
    }
    if (mt.tag) {
      acc[mt.material_id].push(mt.tag as Tag)
    }
    return acc
  }, {} as Record<string, Tag[]>) || {}

  // Mapear conteo de comentarios por material
  const commentsCounts = comments?.reduce((acc, c) => {
    acc[c.material_id] = (acc[c.material_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Enriquecer materiales con etiquetas y conteo
  let enrichedMaterials = materials.map(material => ({
    ...material,
    tags: tagsByMaterial[material.id] || [],
    comments_count: commentsCounts[material.id] || 0,
  })) as Material[]

  // Filtrar por etiquetas si se especifica
  if (filters?.tagIds && filters.tagIds.length > 0) {
    enrichedMaterials = enrichedMaterials.filter(material =>
      filters.tagIds!.some(tagId =>
        material.tags?.some(tag => tag.id === tagId)
      )
    )
  }

  return { error: null, data: enrichedMaterials }
}

export async function getMaterialById(id: string) {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: todos pueden ver cualquier material
  const { data: material, error } = await supabase
    .from('materials')
    .select('*, analysis_state:analysis_states(*)')
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  // Obtener etiquetas del material
  const { data: materialTags } = await supabase
    .from('material_tags')
    .select('tag:tags(id, name, color, group_id, description, display_order, created_at)')
    .eq('material_id', id)

  const tags = materialTags
    ?.map((mt: any) => mt.tag)
    .filter(Boolean) as Tag[] || []

  // Obtener conteo de comentarios
  const { data: comments } = await supabase
    .from('comments')
    .select('id')
    .eq('material_id', id)

  const enrichedMaterial = {
    ...material,
    tags,
    comments_count: comments?.length || 0,
  }

  return { error: null, data: enrichedMaterial as Material }
}

export async function createMaterial(material: MaterialInsert) {
  const supabase = await createClient()

  let user
  try {
    user = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado', data: null }
  }

  // Get default state if no state provided
  let stateId = material.analysis_state_id
  if (!stateId) {
    const { data: defaultState } = await supabase
      .from('analysis_states')
      .select('id')
      .eq('is_default', true)
      .single()

    stateId = defaultState?.id
  }

  const { data, error } = await supabase
    .from('materials')
    .insert({
      ...material,
      user_id: user.id,
      analysis_state_id: stateId,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/materials')
  revalidatePath('/dashboard')
  return { error: null, data }
}

export async function updateMaterial(id: string, updates: MaterialUpdate) {
  const supabase = await createClient()

  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Si no es admin, solo permitir cambiar analysis_state_id
  if (user.role !== 'admin') {
    const allowedFields = ['analysis_state_id']
    const updateKeys = Object.keys(updates)
    const hasDisallowedFields = updateKeys.some(k => !allowedFields.includes(k))

    if (hasDisallowedFields) {
      return { error: 'No tienes permisos para editar este material', data: null }
    }
  }

  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/materials')
  revalidatePath(`/materials/${id}`)
  revalidatePath('/dashboard')
  return { error: null, data }
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado' }
  }

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/materials')
  revalidatePath('/dashboard')
  return { error: null }
}

/**
 * Resetea el análisis de un material (solo admin)
 * - Cambia el estado a "Pendiente"
 * - Elimina todas las etiquetas asignadas
 * - NO elimina los comentarios (historial)
 */
export async function resetMaterialAnalysis(materialId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado' }
  }

  // Buscar el estado "Pendiente"
  const { data: pendingState } = await supabase
    .from('analysis_states')
    .select('id')
    .ilike('name', 'pendiente')
    .single()

  if (!pendingState) {
    return { error: 'Estado "Pendiente" no encontrado' }
  }

  // Actualizar el estado del material a "Pendiente"
  const { error: updateError } = await supabase
    .from('materials')
    .update({
      analysis_state_id: pendingState.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Eliminar todas las etiquetas del material
  const { error: deleteTagsError } = await supabase
    .from('material_tags')
    .delete()
    .eq('material_id', materialId)

  if (deleteTagsError) {
    return { error: deleteTagsError.message }
  }

  revalidatePath('/materials')
  revalidatePath(`/materials/${materialId}`)
  revalidatePath('/dashboard')

  return { error: null }
}

export async function getMaterialStats() {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: estadísticas de todos los materiales
  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, expected_category, format, analysis_state_id, analysis_state:analysis_states(name, color)')

  if (error) {
    return { error: error.message, data: null }
  }

  const total = materials.length

  const byCategory = materials.reduce((acc, m) => {
    acc[m.expected_category] = (acc[m.expected_category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byFormat = materials.reduce((acc, m) => {
    acc[m.format] = (acc[m.format] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const byState = materials.reduce((acc, m) => {
    // Supabase returns joined data as array or object depending on the relation
    const stateData = m.analysis_state as unknown
    const state = Array.isArray(stateData) ? stateData[0] : stateData
    const stateName = (state as any)?.name || 'Sin estado'
    const stateColor = (state as any)?.color || '#6B7280'
    if (!acc[stateName]) {
      acc[stateName] = { count: 0, color: stateColor }
    }
    acc[stateName].count++
    return acc
  }, {} as Record<string, { count: number; color: string }>)

  return {
    error: null,
    data: {
      total,
      byCategory,
      byFormat,
      byState,
    },
  }
}
