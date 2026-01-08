'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import type {
  SubmitAnalysisData,
  SubmitAnalysisResult,
  Comment,
  Material,
  Tag,
  TagGroupWithTags,
  AnalysisState
} from '@/types/database'

/**
 * Actualiza el estado del material a "En progreso" al abrir el modal
 * Retorna el ID del estado anterior para poder revertir si se cancela
 * Todos los usuarios autenticados pueden cambiar estados
 */
export async function setMaterialInProgress(
  materialId: string
): Promise<{ error: string | null; previousStateId: string | null }> {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', previousStateId: null }
  }

  // Obtener el material actual y el estado "En progreso"
  const [materialResult, statesResult] = await Promise.all([
    supabase
      .from('materials')
      .select('id, analysis_state_id')
      .eq('id', materialId)
      .single(),
    supabase
      .from('analysis_states')
      .select('id, name')
  ])

  if (materialResult.error || !materialResult.data) {
    return { error: 'Material no encontrado', previousStateId: null }
  }

  const inProgressState = statesResult.data?.find(
    s => s.name.toLowerCase() === 'en progreso'
  )

  if (!inProgressState) {
    return { error: 'Estado "En progreso" no encontrado', previousStateId: null }
  }

  const previousStateId = materialResult.data.analysis_state_id

  // Si ya está en progreso, no hacer nada
  if (previousStateId === inProgressState.id) {
    return { error: null, previousStateId }
  }

  // Actualizar a "En progreso"
  const { error: updateError } = await supabase
    .from('materials')
    .update({
      analysis_state_id: inProgressState.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId)

  if (updateError) {
    return { error: updateError.message, previousStateId: null }
  }

  revalidatePath('/materials')
  return { error: null, previousStateId }
}

/**
 * Revierte el estado del material al estado anterior (si se cancela el modal sin cambios)
 * Todos los usuarios autenticados pueden revertir estados
 */
export async function revertMaterialState(
  materialId: string,
  previousStateId: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado' }
  }

  const { error: updateError } = await supabase
    .from('materials')
    .update({
      analysis_state_id: previousStateId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', materialId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/materials')
  return { error: null }
}

/**
 * Acción compuesta para submit del modal de análisis
 * Realiza en una sola llamada:
 * 1. Crea el comentario de análisis (si hay contenido)
 * 2. Actualiza el estado del material
 * 3. Actualiza las etiquetas del material
 * Todos los usuarios autenticados pueden analizar
 */
export async function submitAnalysis(
  materialId: string,
  data: SubmitAnalysisData
): Promise<{ error: string | null; data: SubmitAnalysisResult | null }> {
  const supabase = await createClient()

  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Validaciones
  if (!materialId) {
    return { error: 'El ID del material es requerido', data: null }
  }

  const hasComment = data.comment && data.comment.trim().length > 0

  if (hasComment && data.comment.trim().length > 5000) {
    return { error: 'El comentario no puede exceder 5000 caracteres', data: null }
  }

  // Verificar que el material existe (sin filtro de user_id)
  const { data: material, error: materialError } = await supabase
    .from('materials')
    .select('id')
    .eq('id', materialId)
    .single()

  if (materialError || !material) {
    return { error: 'Material no encontrado', data: null }
  }

  // Validar estado si se proporciona
  if (data.analysis_state_id) {
    const { data: state } = await supabase
      .from('analysis_states')
      .select('id')
      .eq('id', data.analysis_state_id)
      .single()

    if (!state) {
      return { error: 'Estado de análisis no válido', data: null }
    }
  }

  // Validar etiquetas si se proporcionan
  if (data.tag_ids.length > 0) {
    const { data: validTags } = await supabase
      .from('tags')
      .select('id')
      .in('id', data.tag_ids)

    if (!validTags || validTags.length !== data.tag_ids.length) {
      return { error: 'Una o más etiquetas no son válidas', data: null }
    }
  }

  // === EJECUTAR OPERACIONES ===

  let createdComment: Comment | null = null
  let updatedMaterial: Material | null = null

  try {
    // 1. Crear comentario (si hay contenido)
    if (hasComment) {
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          material_id: materialId,
          user_id: user.id,
          content: data.comment.trim(),
          analysis_state_id: data.analysis_state_id || null,
        })
        .select('*, analysis_state:analysis_states(id, name, color)')
        .single()

      if (commentError) {
        throw new Error(`Error al crear comentario: ${commentError.message}`)
      }

      createdComment = commentData as Comment
    }

    // 2. Actualizar estado del material
    const { data: materialData, error: materialUpdateError } = await supabase
      .from('materials')
      .update({
        analysis_state_id: data.analysis_state_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)
      .select('*, analysis_state:analysis_states(*)')
      .single()

    if (materialUpdateError) {
      throw new Error(`Error al actualizar material: ${materialUpdateError.message}`)
    }

    updatedMaterial = materialData as Material

    // 3. Actualizar etiquetas del material (DELETE + INSERT)
    // Primero eliminar todas las etiquetas existentes
    const { error: deleteTagsError } = await supabase
      .from('material_tags')
      .delete()
      .eq('material_id', materialId)

    if (deleteTagsError) {
      throw new Error(`Error al eliminar etiquetas: ${deleteTagsError.message}`)
    }

    // Luego insertar las nuevas etiquetas
    if (data.tag_ids.length > 0) {
      const tagInserts = data.tag_ids.map(tagId => ({
        material_id: materialId,
        tag_id: tagId,
      }))

      const { error: insertTagsError } = await supabase
        .from('material_tags')
        .insert(tagInserts)

      if (insertTagsError) {
        throw new Error(`Error al insertar etiquetas: ${insertTagsError.message}`)
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return { error: message, data: null }
  }

  // Revalidar rutas
  revalidatePath('/materials')
  revalidatePath(`/materials/${materialId}`)
  revalidatePath('/dashboard')

  return {
    error: null,
    data: {
      comment: createdComment,
      material: updatedMaterial,
    }
  }
}

/**
 * Obtiene todos los datos necesarios para el modal de análisis
 * Útil para cargar todo en una sola llamada
 */
export async function getAnalysisModalData(materialId: string): Promise<{
  error: string | null
  data: {
    material: Material
    comments: Comment[]
    materialTagIds: string[]
    tagGroups: TagGroupWithTags[]
    states: AnalysisState[]
  } | null
}> {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Ejecutar todas las consultas en paralelo (sin filtros de user_id)
  const [
    materialResult,
    commentsResult,
    materialTagsResult,
    groupsResult,
    tagsResult,
    statesResult
  ] = await Promise.all([
    // Material con estado
    supabase
      .from('materials')
      .select('*, analysis_state:analysis_states(*)')
      .eq('id', materialId)
      .single(),
    // Comentarios
    supabase
      .from('comments')
      .select('*, analysis_state:analysis_states(id, name, color)')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false }),
    // IDs de etiquetas del material
    supabase
      .from('material_tags')
      .select('tag_id')
      .eq('material_id', materialId),
    // Grupos de etiquetas (compartidos)
    supabase
      .from('tag_groups')
      .select('*')
      .order('display_order', { ascending: true }),
    // Todas las etiquetas (compartidas)
    supabase
      .from('tags')
      .select('*')
      .order('display_order', { ascending: true }),
    // Estados de análisis (compartidos)
    supabase
      .from('analysis_states')
      .select('*')
      .order('display_order', { ascending: true })
  ])

  if (materialResult.error || !materialResult.data) {
    return { error: 'Material no encontrado', data: null }
  }

  // Organizar etiquetas por grupo
  const tagGroups: TagGroupWithTags[] = (groupsResult.data || []).map(group => ({
    ...group,
    tags: (tagsResult.data || []).filter((tag: Tag) => tag.group_id === group.id)
  }))

  return {
    error: null,
    data: {
      material: materialResult.data as Material,
      comments: (commentsResult.data || []) as Comment[],
      materialTagIds: (materialTagsResult.data || []).map(mt => mt.tag_id),
      tagGroups,
      states: (statesResult.data || []) as AnalysisState[]
    }
  }
}

/**
 * Obtiene las etiquetas de un material
 */
export async function getMaterialTags(materialId: string): Promise<{
  error: string | null
  data: Tag[] | null
}> {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  const { data, error } = await supabase
    .from('material_tags')
    .select('tag:tags(*)')
    .eq('material_id', materialId)

  if (error) {
    return { error: error.message, data: null }
  }

  const tags = data?.map((mt: any) => mt.tag).filter(Boolean) || []

  return { error: null, data: tags as Tag[] }
}
