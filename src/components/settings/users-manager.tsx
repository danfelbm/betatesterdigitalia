'use client'

import { useState } from 'react'
import { createUser, updateUserRole, deleteUser } from '@/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types/database'
import { UserPlus, Trash2, Loader2, Shield, User } from 'lucide-react'

interface UserWithEmail {
  id: string
  email: string
  role: UserRole
  created_at: string
}

interface UsersManagerProps {
  users: UserWithEmail[]
  currentUserId: string
}

export function UsersManager({ users: initialUsers, currentUserId }: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('regular')

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const result = await createUser(newEmail, newPassword, newRole)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Usuario creado exitosamente')
      setNewEmail('')
      setNewPassword('')
      setNewRole('regular')
      setIsCreating(false)
      // Refresh the page to get updated users
      window.location.reload()
    }

    setIsLoading(false)
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setError(null)
    const result = await updateUserRole(userId, role)

    if (result.error) {
      setError(result.error)
    } else {
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role } : u
      ))
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return
    }

    setError(null)
    const result = await deleteUser(userId)

    if (result.error) {
      setError(result.error)
    } else {
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Mensajes de error/éxito */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-100 dark:bg-green-900/20 rounded-md">
          {success}
        </div>
      )}

      {/* Botón para crear usuario */}
      {!isCreating && (
        <Button onClick={() => setIsCreating(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      )}

      {/* Formulario de creación */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <option value="regular">Regular</option>
                  <option value="admin">Administrador</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Usuarios ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay usuarios registrados.
            </p>
          ) : (
            <div className="divide-y">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId

                return (
                  <div
                    key={user.id}
                    className={`py-3 flex items-center justify-between gap-4 ${
                      isCurrentUser ? 'bg-muted/30 -mx-4 px-4 rounded' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                          : 'bg-muted'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {user.email}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Creado: {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrentUser ? (
                        <Badge color={user.role === 'admin' ? '#f59e0b' : '#6b7280'}>
                          {user.role === 'admin' ? 'Admin' : 'Regular'}
                        </Badge>
                      ) : (
                        <Select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="w-32"
                        >
                          <option value="regular">Regular</option>
                          <option value="admin">Admin</option>
                        </Select>
                      )}

                      {!isCurrentUser && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
