'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import type { Comment, CommentInsert } from '@/types/database'

/**
 * Obtiene todos los comentarios de un material
 * Incluye información del estado al momento del comentario
 * Ordenados por fecha de creación descendente (más reciente primero)
 */
export async function getComments(materialId: string) {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: todos pueden ver comentarios de cualquier material
  const { data, error } = await supabase
    .from('comments')
    .select('*, analysis_state:analysis_states(id, name, color)')
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: null }
  }

  return { error: null, data: data as Comment[] }
}

/**
 * Crea un nuevo comentario de análisis
 * Los comentarios son INMUTABLES - no se pueden editar ni eliminar
 * Todos los usuarios autenticados pueden comentar
 */
export async function createComment(comment: CommentInsert) {
  const supabase = await createClient()

  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Validaciones
  if (!comment.material_id) {
    return { error: 'El ID del material es requerido', data: null }
  }

  if (!comment.content || comment.content.trim().length === 0) {
    return { error: 'El contenido del comentario es requerido', data: null }
  }

  if (comment.content.trim().length > 5000) {
    return { error: 'El comentario no puede exceder 5000 caracteres', data: null }
  }

  // Verificar que el material existe (sin filtro de user_id)
  const { data: material } = await supabase
    .from('materials')
    .select('id')
    .eq('id', comment.material_id)
    .single()

  if (!material) {
    return { error: 'Material no encontrado', data: null }
  }

  // Si se proporciona analysis_state_id, verificar que existe
  if (comment.analysis_state_id) {
    const { data: state } = await supabase
      .from('analysis_states')
      .select('id')
      .eq('id', comment.analysis_state_id)
      .single()

    if (!state) {
      return { error: 'Estado de análisis no válido', data: null }
    }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      material_id: comment.material_id,
      user_id: user.id,
      content: comment.content.trim(),
      analysis_state_id: comment.analysis_state_id || null,
    })
    .select('*, analysis_state:analysis_states(id, name, color)')
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/materials')
  revalidatePath(`/materials/${comment.material_id}`)
  revalidatePath('/dashboard')
  return { error: null, data: data as Comment }
}

/**
 * Obtiene el conteo de comentarios para múltiples materiales
 * Útil para la tabla de materiales
 */
export async function getCommentsCount(materialIds: string[]) {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  if (materialIds.length === 0) {
    return { error: null, data: {} }
  }

  const { data, error } = await supabase
    .from('comments')
    .select('material_id')
    .in('material_id', materialIds)

  if (error) {
    return { error: error.message, data: null }
  }

  // Contar comentarios por material
  const counts = data?.reduce((acc, comment) => {
    acc[comment.material_id] = (acc[comment.material_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return { error: null, data: counts }
}
