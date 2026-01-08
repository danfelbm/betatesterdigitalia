'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { MaterialInsert, MaterialUpdate, ExpectedCategory, MaterialFormat } from '@/types/database'

export async function getMaterials(filters?: {
  category?: ExpectedCategory
  format?: MaterialFormat
  stateId?: string
  search?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  let query = supabase
    .from('materials')
    .select('*, analysis_state:analysis_states(*)')
    .eq('user_id', user.id)
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

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

export async function getMaterialById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  const { data, error } = await supabase
    .from('materials')
    .select('*, analysis_state:analysis_states(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

export async function createMaterial(material: MaterialInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  // Get default state if no state provided
  let stateId = material.analysis_state_id
  if (!stateId) {
    const { data: defaultState } = await supabase
      .from('analysis_states')
      .select('id')
      .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/materials')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function getMaterialStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  const { data: materials, error } = await supabase
    .from('materials')
    .select('id, expected_category, format, analysis_state_id, analysis_state:analysis_states(name, color)')
    .eq('user_id', user.id)

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
