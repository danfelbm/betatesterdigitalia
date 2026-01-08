'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import type { AnalysisStateInsert, AnalysisStateUpdate } from '@/types/database'

export async function getAnalysisStates() {
  const supabase = await createClient()

  try {
    await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Datos compartidos: todos ven todos los estados
  const { data, error } = await supabase
    .from('analysis_states')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

export async function createAnalysisState(state: AnalysisStateInsert) {
  const supabase = await createClient()

  let user
  try {
    user = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado', data: null }
  }

  // Get max display_order
  const { data: maxOrder } = await supabase
    .from('analysis_states')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const newOrder = (maxOrder?.display_order || 0) + 1

  const { data, error } = await supabase
    .from('analysis_states')
    .insert({
      ...state,
      user_id: user.id,
      display_order: state.display_order ?? newOrder,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/settings/states')
  revalidatePath('/materials')
  return { error: null, data }
}

export async function updateAnalysisState(id: string, updates: AnalysisStateUpdate) {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado', data: null }
  }

  const { data, error } = await supabase
    .from('analysis_states')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  revalidatePath('/settings/states')
  revalidatePath('/materials')
  return { error: null, data }
}

export async function deleteAnalysisState(id: string) {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado' }
  }

  // Check if it's the default state
  const { data: state } = await supabase
    .from('analysis_states')
    .select('is_default')
    .eq('id', id)
    .single()

  if (state?.is_default) {
    return { error: 'No puedes eliminar el estado por defecto' }
  }

  const { error } = await supabase
    .from('analysis_states')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/states')
  revalidatePath('/materials')
  return { error: null }
}

export async function setDefaultState(id: string) {
  const supabase = await createClient()

  try {
    await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No autorizado' }
  }

  // Remove default from all states
  await supabase
    .from('analysis_states')
    .update({ is_default: false })

  // Set new default
  const { error } = await supabase
    .from('analysis_states')
    .update({ is_default: true })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/states')
  return { error: null }
}
