'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import type { Profile, UserRole } from '@/types/database'

interface UserWithEmail extends Profile {
  email: string
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

  // Obtener perfiles con emails de auth.users
  // Nota: Necesitamos hacer un JOIN con auth.users, pero desde el cliente
  // no podemos acceder a esa tabla directamente. Usamos una vista o función RPC.

  // Opción simple: obtener perfiles y luego los emails
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (profilesError) {
    return { error: profilesError.message, data: null }
  }

  // Para obtener emails, necesitamos una función RPC o vista en Supabase
  // Por ahora, retornamos los perfiles sin email (se mostrará el ID)
  const usersWithEmail: UserWithEmail[] = (profiles || []).map(p => ({
    ...p,
    email: `Usuario ${p.id.slice(0, 8)}...`, // Placeholder - necesita RPC
  }))

  return { error: null, data: usersWithEmail }
}

/**
 * Crea un nuevo usuario usando Admin API
 * Solo admin puede crear usuarios
 * Usa un API route para no exponer service_role key
 */
export async function createUser(
  email: string,
  password: string,
  role: UserRole = 'regular'
): Promise<{ error: string | null; data: { id: string } | null }> {
  // Validaciones básicas
  if (!email || !email.includes('@')) {
    return { error: 'Email inválido', data: null }
  }

  if (!password || password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres', data: null }
  }

  try {
    // Construir URL base (Vercel provee VERCEL_URL automáticamente)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Llamar al API route que usa Admin API
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Error al crear usuario', data: null }
    }

    revalidatePath('/settings/users')
    return { error: null, data: { id: result.userId } }

  } catch (error) {
    console.error('Error creating user:', error)
    return { error: 'Error de conexión', data: null }
  }
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
 * Usa una función RPC para tener permisos de eliminar de auth.users
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

  // Usar función RPC para eliminar completamente (profiles + auth.users)
  const { error: deleteError } = await supabase
    .rpc('delete_user_completely', { user_id: userId })

  if (deleteError) {
    // Si la función RPC no existe, intentar solo con profiles
    if (deleteError.message.includes('does not exist')) {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        return { error: profileError.message }
      }
      return { error: null }
    }
    return { error: deleteError.message }
  }

  revalidatePath('/settings/users')
  return { error: null }
}
