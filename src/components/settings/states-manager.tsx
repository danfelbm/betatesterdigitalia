'use client'

import { useState } from 'react'
import { createAnalysisState, updateAnalysisState, deleteAnalysisState, setDefaultState } from '@/actions/analysis-states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import type { AnalysisState } from '@/types/database'
import { Plus, Trash2, Star, Pencil, Check, X } from 'lucide-react'

interface StatesManagerProps {
  states: AnalysisState[]
}

const COLORS = [
  '#FCD34D', '#60A5FA', '#34D399', '#F87171', '#A78BFA',
  '#FB923C', '#2DD4BF', '#F472B6', '#818CF8', '#4ADE80',
]

// Estados del sistema que no se pueden modificar ni eliminar
const PROTECTED_STATES = ['pendiente', 'en progreso']

const isProtectedState = (stateName: string) => {
  return PROTECTED_STATES.includes(stateName.toLowerCase())
}

export function StatesManager({ states }: StatesManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await createAnalysisState({
      name: newName.trim(),
      color: newColor,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setNewName('')
      setIsAdding(false)
    }
    setIsLoading(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await updateAnalysisState(id, {
      name: editName.trim(),
      color: editColor,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setEditingId(null)
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este estado? Los materiales con este estado quedarán sin estado asignado.')) return
    setIsLoading(true)
    setError(null)

    const result = await deleteAnalysisState(id)
    if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  const handleSetDefault = async (id: string) => {
    setIsLoading(true)
    await setDefaultState(id)
    setIsLoading(false)
  }

  const startEdit = (state: AnalysisState) => {
    setEditingId(state.id)
    setEditName(state.name)
    setEditColor(state.color)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {states.map((state) => (
              <div
                key={state.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {editingId === state.id ? (
                  <>
                    <div className="flex gap-1">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className={`w-6 h-6 rounded-full border-2 ${
                            editColor === color ? 'border-foreground' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdate(state.id)}
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: state.color }}
                    />
                    <span className={`flex-1 font-medium ${isProtectedState(state.name) ? 'text-muted-foreground' : ''}`}>
                      {state.name}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSetDefault(state.id)}
                      disabled={state.is_default || isLoading || isProtectedState(state.name)}
                      title={isProtectedState(state.name) ? 'Estado del sistema' : 'Establecer como defecto'}
                    >
                      <Star className={`h-4 w-4 ${state.is_default ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(state)}
                      disabled={isProtectedState(state.name)}
                      title={isProtectedState(state.name) ? 'Estado del sistema - no editable' : 'Editar'}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(state.id)}
                      disabled={state.is_default || isLoading || isProtectedState(state.name)}
                      className="hover:text-destructive"
                      title={isProtectedState(state.name) ? 'Estado del sistema - no eliminable' : 'Eliminar'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {states.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No hay estados definidos. Crea uno para comenzar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdding ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newColor === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del estado</Label>
              <Input
                id="name"
                placeholder="Ej: Revisado, Aprobado, Rechazado..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={isLoading || !newName.trim()}>
                Crear estado
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Agregar nuevo estado
        </Button>
      )}
    </div>
  )
}
