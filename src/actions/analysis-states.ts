'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisStateInsert, AnalysisStateUpdate } from '@/types/database'

export async function getAnalysisStates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  const { data, error } = await supabase
    .from('analysis_states')
    .select('*')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true })

  if (error) {
    return { error: error.message, data: null }
  }

  return { error: null, data }
}

export async function createAnalysisState(state: AnalysisStateInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  // Get max display_order
  const { data: maxOrder } = await supabase
    .from('analysis_states')
    .select('display_order')
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado', data: null }
  }

  const { data, error } = await supabase
    .from('analysis_states')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Check if it's the default state
  const { data: state } = await supabase
    .from('analysis_states')
    .select('is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (state?.is_default) {
    return { error: 'No puedes eliminar el estado por defecto' }
  }

  const { error } = await supabase
    .from('analysis_states')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/states')
  revalidatePath('/materials')
  return { error: null }
}

export async function setDefaultState(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  // Remove default from all states
  await supabase
    .from('analysis_states')
    .update({ is_default: false })
    .eq('user_id', user.id)

  // Set new default
  const { error } = await supabase
    .from('analysis_states')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/states')
  return { error: null }
}
