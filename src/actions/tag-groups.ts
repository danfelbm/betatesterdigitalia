'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import type { TagGroup, TagGroupInsert, TagGroupUpdate } from '@/types/database'

/**
 * Obtiene todos los grupos de etiquetas
 * Ordenados por display_order ascendente
 */
export async function getTagGroups() {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: todos ven todos los grupos
  const { data, error } = await supabase
    .from('tag_groups')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { error: null, data: data as TagGroup[] }
}

/**
 * Obtiene grupos de etiquetas con sus etiquetas incluidas
 */
export async function getTagGroupsWithTags() {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: todos ven todos los grupos
  const { data, error } = await supabase
    .from('tag_groups')
    .select('*, tags(*)')
    .order('display_order', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  // Ordenar etiquetas dentro de cada grupo
  const groupsWithSortedTags = data?.map(group => ({
    ...group,
    tags: (group.tags || []).sort((a: any, b: any) => a.display_order - b.display_order)
  }))

  return { error: null, data: groupsWithSortedTags }
}

/**
 * Crea un nuevo grupo de etiquetas
 * Solo admin puede crear
 */
export async function createTagGroup(group: TagGroupInsert) {
  const supabase = await createClient()

  let user
  try {
    user = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado', data: null }
  }

  // Validación
  if (!group.name || group.name.trim().length === 0) {
    return { error: 'El nombre del grupo es requerido', data: null }
  }

  if (group.name.trim().length > 100) {
    return { error: 'El nombre no puede exceder 100 caracteres', data: null }
  }

  // Obtener máximo display_order actual
  const { data: maxOrder } = await supabase
    .from('tag_groups')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order || 0) + 1

  const { data, error } = await supabase
    .from('tag_groups')
    .insert({
      name: group.name.trim(),
      description: group.description?.trim() || null,
      user_id: user.id,
      display_order: newOrder,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un grupo con ese nombre', data: null }
    }
    return { error: error.message, data: null }
  }

  revalidatePath('/settings/tags')
  revalidatePath('/materials')
  return { error: null, data: data as TagGroup }
}

/**
 * Actualiza un grupo de etiquetas existente
 * Solo admin puede actualizar
 */
export async function updateTagGroup(id: string, updates: TagGroupUpdate) {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado', data: null }
  }

  // Validación
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      return { error: 'El nombre del grupo es requerido', data: null }
    }
    if (updates.name.trim().length > 100) {
      return { error: 'El nombre no puede exceder 100 caracteres', data: null }
    }
    updates.name = updates.name.trim()
  }

  if (updates.description !== undefined) {
    updates.description = updates.description?.trim() || null
  }

  const { data, error } = await supabase
    .from('tag_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un grupo con ese nombre', data: null }
    }
    return { error: error.message, data: null }
  }

  revalidatePath('/settings/tags')
  revalidatePath('/materials')
  return { error: null, data: data as TagGroup }
}

/**
 * Elimina un grupo de etiquetas y todas sus etiquetas asociadas (CASCADE)
 * Solo admin puede eliminar
 */
export async function deleteTagGroup(id: string) {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado' }
  }

  const { error } = await supabase
    .from('tag_groups')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/tags')
  revalidatePath('/materials')
  return { error: null }
}
