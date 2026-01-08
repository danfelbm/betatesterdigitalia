'use client'

import { useState } from 'react'
import { createTagGroup, updateTagGroup, deleteTagGroup } from '@/actions/tag-groups'
import { createTag, updateTag, deleteTag } from '@/actions/tags'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TagGroupWithTags, Tag } from '@/types/database'
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react'

interface TagsManagerProps {
  groups: TagGroupWithTags[]
}

const COLORS = [
  '#FCD34D', '#60A5FA', '#34D399', '#F87171', '#A78BFA',
  '#FB923C', '#2DD4BF', '#F472B6', '#818CF8', '#4ADE80',
  '#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6',
]

export function TagsManager({ groups }: TagsManagerProps) {
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)))

  // Form states
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupDescription, setEditGroupDescription] = useState('')

  const [addingTagToGroupId, setAddingTagToGroupId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(COLORS[0])
  const [newTagDescription, setNewTagDescription] = useState('')

  const [editTagName, setEditTagName] = useState('')
  const [editTagColor, setEditTagColor] = useState('')
  const [editTagDescription, setEditTagDescription] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // Group handlers
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await createTagGroup({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setNewGroupName('')
      setNewGroupDescription('')
      setIsAddingGroup(false)
    }
    setIsLoading(false)
  }

  const handleUpdateGroup = async (id: string) => {
    if (!editGroupName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await updateTagGroup(id, {
      name: editGroupName.trim(),
      description: editGroupDescription.trim() || null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setEditingGroupId(null)
    }
    setIsLoading(false)
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('¿Eliminar este grupo y todas sus etiquetas?')) return
    setIsLoading(true)
    setError(null)

    const result = await deleteTagGroup(id)
    if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  const startEditGroup = (group: TagGroupWithTags) => {
    setEditingGroupId(group.id)
    setEditGroupName(group.name)
    setEditGroupDescription(group.description || '')
  }

  // Tag handlers
  const handleAddTag = async (groupId: string) => {
    if (!newTagName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await createTag({
      group_id: groupId,
      name: newTagName.trim(),
      color: newTagColor,
      description: newTagDescription.trim() || null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setNewTagName('')
      setNewTagColor(COLORS[0])
      setNewTagDescription('')
      setAddingTagToGroupId(null)
    }
    setIsLoading(false)
  }

  const handleUpdateTag = async (id: string) => {
    if (!editTagName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await updateTag(id, {
      name: editTagName.trim(),
      color: editTagColor,
      description: editTagDescription.trim() || null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setEditingTagId(null)
    }
    setIsLoading(false)
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('¿Eliminar esta etiqueta?')) return
    setIsLoading(true)
    setError(null)

    const result = await deleteTag(id)
    if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  const startEditTag = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditTagName(tag.name)
    setEditTagColor(tag.color)
    setEditTagDescription(tag.description || '')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Lista de grupos */}
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              {editingGroupId === group.id ? (
                <div className="flex-1 space-y-2">
                  <Input
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    placeholder="Nombre del grupo"
                    className="h-8"
                    autoFocus
                  />
                  <Input
                    value={editGroupDescription}
                    onChange={(e) => setEditGroupDescription(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateGroup(group.id)}
                      disabled={isLoading}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingGroupId(null)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => toggleGroupExpanded(group.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      {group.description && (
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-2">
                      {group.tags.length} etiqueta{group.tags.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditGroup(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={isLoading}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardHeader>

          {expandedGroups.has(group.id) && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {/* Lista de etiquetas */}
                {group.tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                  >
                    {editingTagId === tag.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-1 flex-wrap">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditTagColor(color)}
                              className={`w-6 h-6 rounded-full border-2 ${
                                editTagColor === color ? 'border-foreground' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Input
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          placeholder="Nombre"
                          className="h-8"
                        />
                        <Input
                          value={editTagDescription}
                          onChange={(e) => setEditTagDescription(e.target.value)}
                          placeholder="Descripción (opcional)"
                          className="h-8"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTag(tag.id)}
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTagId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{tag.name}</span>
                          {tag.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {tag.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditTag(tag)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTag(tag.id)}
                          disabled={isLoading}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {/* Agregar nueva etiqueta */}
                {addingTagToGroupId === group.id ? (
                  <div className="p-3 rounded-lg border space-y-3">
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-1 flex-wrap">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewTagColor(color)}
                            className={`w-6 h-6 rounded-full border-2 ${
                              newTagColor === color ? 'border-foreground' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Nombre de la etiqueta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción (opcional)</Label>
                      <Input
                        value={newTagDescription}
                        onChange={(e) => setNewTagDescription(e.target.value)}
                        placeholder="Descripción breve"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddTag(group.id)}
                        disabled={isLoading || !newTagName.trim()}
                      >
                        Crear etiqueta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddingTagToGroupId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingTagToGroupId(group.id)
                      setNewTagName('')
                      setNewTagColor(COLORS[0])
                      setNewTagDescription('')
                    }}
                    className="w-full justify-start text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar etiqueta
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {groups.length === 0 && !isAddingGroup && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay grupos de etiquetas. Crea uno para comenzar.
          </CardContent>
        </Card>
      )}

      {/* Agregar nuevo grupo */}
      {isAddingGroup ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Nombre del grupo</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ej: Nivel de confianza, Tipo de contenido..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Breve descripción del grupo"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGroup} disabled={isLoading || !newGroupName.trim()}>
                Crear grupo
              </Button>
              <Button variant="outline" onClick={() => setIsAddingGroup(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsAddingGroup(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar nuevo grupo
        </Button>
      )}
    </div>
  )
}
