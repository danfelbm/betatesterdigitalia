import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUsers } from '@/actions/users'
import { UsersManager } from '@/components/settings/users-manager'

export default async function UsersSettingsPage() {
  const user = await getCurrentUser()

  // Solo admin puede gestionar usuarios
  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: users, error } = await getUsers()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Crea y administra los usuarios que pueden acceder a la plataforma
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          Error cargando usuarios: {error}
        </div>
      )}

      <UsersManager
        users={users || []}
        currentUserId={user.id}
      />
    </div>
  )
}
