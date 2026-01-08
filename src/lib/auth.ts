import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
}

/**
 * Obtiene el usuario actual con su rol
 * Retorna null si no está autenticado
 */
export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email || '',
    role: (profile?.role as UserRole) || 'regular'
  }
}

/**
 * Verifica si el usuario actual es admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Obtiene el usuario actual o lanza error si no está autenticado
 */
export async function requireAuth(): Promise<UserWithRole> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }
  return user
}

/**
 * Obtiene el usuario actual o lanza error si no es admin
 */
export async function requireAdmin(): Promise<UserWithRole> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('No autenticado')
  }
  if (user.role !== 'admin') {
    throw new Error('No tienes permisos de administrador')
  }
  return user
}
