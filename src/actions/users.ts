'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'
import type { Profile, UserRole } from '@/types/database'

interface UserWithEmail extends Profile {
  email: string
}

// Cliente admin para operaciones que requieren service_role
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Obtiene todos los usuarios con sus perfiles
 * Solo admin puede ver esta información
 */
export async function getUsers(): Promise<{
  error: string | null
  data: UserWithEmail[] | null
}> {
  const supabase = await createClient()

  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  // Verificar que es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No autorizado', data: null }
  }

  // Obtener perfiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (profilesError) {
    return { error: profilesError.message, data: null }
  }

  // Placeholder para emails - necesita RPC en Supabase
  const usersWithEmail: UserWithEmail[] = (profiles || []).map(p => ({
    ...p,
    email: `Usuario ${p.id.slice(0, 8)}...`,
  }))

  return { error: null, data: usersWithEmail }
}

/**
 * Crea un nuevo usuario usando Admin API directamente
 * Solo admin puede crear usuarios
 */
export async function createUser(
  email: string,
  password: string,
  role: UserRole = 'regular'
): Promise<{ error: string | null; data: { id: string } | null }> {
  const supabase = await createClient()

  // Validaciones básicas
  if (!email || !email.includes('@')) {
    return { error: 'Email inválido', data: null }
  }

  if (!password || password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres', data: null }
  }

  // Verificar que el usuario actual es admin
  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado', data: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No autorizado', data: null }
  }

  // Usar cliente admin para crear usuario
  const adminClient = getAdminClient()

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    return { error: createError.message, data: null }
  }

  // Actualizar rol si no es 'regular'
  if (role && role !== 'regular' && newUser.user) {
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', newUser.user.id)
  }

  revalidatePath('/settings/users')
  return { error: null, data: { id: newUser.user?.id || '' } }
}

/**
 * Actualiza el rol de un usuario
 * Solo admin puede cambiar roles
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado' }
  }

  // Verificar que es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No autorizado' }
  }

  // No permitir cambiar el propio rol
  if (userId === user.id) {
    return { error: 'No puedes cambiar tu propio rol' }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/settings/users')
  return { error: null }
}

/**
 * Elimina un usuario completamente (profiles + auth.users)
 * Solo admin puede eliminar usuarios
 */
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  let user
  try {
    user = await requireAuth()
  } catch {
    return { error: 'No autenticado' }
  }

  // Verificar que es admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'No autorizado' }
  }

  // No permitir eliminarse a sí mismo
  if (userId === user.id) {
    return { error: 'No puedes eliminarte a ti mismo' }
  }

  // Usar cliente admin para eliminar usuario de auth.users
  const adminClient = getAdminClient()
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // El profile se elimina automáticamente por ON DELETE CASCADE o trigger

  revalidatePath('/settings/users')
  return { error: null }
}
