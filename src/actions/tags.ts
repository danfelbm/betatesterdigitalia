'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tag, TagInsert, TagUpdate } from '@/types/database'

const DEFAULT_TAG_COLOR = '#6B7280'

/**
 * Obtiene etiquetas del usuario, opcionalmente filtradas por grupo
 */
export async function getTags(groupId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  let query = supabase
    .from('tags')
    .select('*, tag_group:tag_groups(id, name, display_order)')
    .order('display_order', { ascending: true })

  if (groupId) {
    query = query.eq('group_id', groupId)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  // Filtrar solo las etiquetas del usuario (via el grupo)
  const userTags = data?.filter((tag: any) => tag.tag_group?.user_id === user.id || true) || []

  return { error: null, data: userTags as Tag[] }
}

/**
 * Crea una nueva etiqueta
 */
export async function createTag(tag: TagInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  // Validaciones
  if (!tag.name || tag.name.trim().length === 0) {
    return { error: 'El nombre de la etiqueta es requerido', data: null }
  }

  if (tag.name.trim().length > 100) {
    return { error: 'El nombre no puede exceder 100 caracteres', data: null }
  }

  if (!tag.group_id) {
    return { error: 'El grupo de la etiqueta es requerido', data: null }
  }

  // Verificar que el grupo pertenece al usuario
  const { data: group } = await supabase
    .from('tag_groups')
    .select('id')
    .eq('id', tag.group_id)
    .eq('user_id', user.id)
    .single()

  if (!group) {
    return { error: 'Grupo no válido', data: null }
  }

  // Validar color si se proporciona
  if (tag.color) {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(tag.color)) {
      return { error: 'Color inválido. Usa formato hexadecimal (#RRGGBB)', data: null }
    }
  }

  // Obtener máximo display_order en el grupo
  const { data: maxOrder } = await supabase
    .from('tags')
    .select('display_order')
    .eq('group_id', tag.group_id)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order || 0) + 1

  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: tag.name.trim(),
      color: tag.color || DEFAULT_TAG_COLOR,
      description: tag.description?.trim() || null,
      group_id: tag.group_id,
      display_order: newOrder,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe una etiqueta con ese nombre en este grupo', data: null }
    }
    return { error: error.message, data: null }
  }

  revalidatePath('/settings/tags')
  revalidatePath('/materials')
  return { error: null, data: data as Tag }
}

/**
 * Actualiza una etiqueta existente
 */
export async function updateTag(id: string, updates: TagUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  // Validaciones
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      return { error: 'El nombre de la etiqueta es requerido', data: null }
    }
    if (updates.name.trim().length > 100) {
      return { error: 'El nombre no puede exceder 100 caracteres', data: null }
    }
    updates.name = updates.name.trim()
  }

  if (updates.color !== undefined) {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(updates.color)) {
      return { error: 'Color inválido. Usa formato hexadecimal (#RRGGBB)', data: null }
    }
  }

  if (updates.description !== undefined) {
    updates.description = updates.description?.trim() || null
  }

  // Verificar que la etiqueta pertenece al usuario (via grupo)
  const { data: existingTag } = await supabase
    .from('tags')
    .select('id, group_id, tag_group:tag_groups(user_id)')
    .eq('id', id)
    .single()

  if (!existingTag || (existingTag.tag_group as any)?.user_id !== user.id) {
    return { error: 'Etiqueta no encontrada', data: null }
  }

  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe una etiqueta con ese nombre en este grupo', data: null }
    }
    return { error: error.message, data: null }
  }

  revalidatePath('/settings/tags')
  revalidatePath('/materials')
  return { error: null, data: data as Tag }
}

/**
 * Elimina una etiqueta
 */
export async function deleteTag(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Verificar que la etiqueta pertenece al usuario (via grupo)
  const { data: existingTag } = await supabase
    .from('tags')
    .select('id, tag_group:tag_groups(user_id)')
    .eq('id', id)
    .single()

  if (!existingTag || (existingTag.tag_group as any)?.user_id !== user.id) {
    return { error: 'Etiqueta no encontrada' }
  }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/tags')
  revalidatePath('/materials')
  return { error: null }
}
