'use client'

import { Check } from 'lucide-react'
import type { TagGroupWithTags } from '@/types/database'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  groups: TagGroupWithTags[]
  selectedTagIds: Set<string>
  onChange: (tagIds: Set<string>) => void
  disabled?: boolean
  showValidation?: boolean
}

export function TagSelector({ groups, selectedTagIds, onChange, disabled = false, showValidation = false }: TagSelectorProps) {

  // Check if a single-selection group has a valid selection
  const isGroupValid = (group: TagGroupWithTags): boolean => {
    if (group.selection_type !== 'single') return true
    if (group.tags.length === 0) return true // No tags to select

    const groupTagIds = new Set(group.tags.map(t => t.id))
    return Array.from(selectedTagIds).some(id => groupTagIds.has(id))
  }

  const toggleTag = (tagId: string, groupId: string) => {
    if (disabled) return

    const newSelected = new Set(selectedTagIds)
    const group = groups.find(g => g.id === groupId)

    if (!group) return

    if (group.selection_type === 'single') {
      // For single selection groups:
      // 1. Remove any previously selected tag from THIS group
      // 2. Add the new tag (don't allow deselection - must always have one)
      const groupTagIds = new Set(group.tags.map(t => t.id))

      // Check if clicking on already selected tag - don't allow deselection
      if (selectedTagIds.has(tagId)) {
        return // Do nothing - can't deselect in single mode
      }

      // Remove tags from this group
      for (const id of selectedTagIds) {
        if (groupTagIds.has(id)) {
          newSelected.delete(id)
        }
      }

      // Always select the new one
      newSelected.add(tagId)

    } else {
      // Multiple selection: normal toggle behavior
      if (newSelected.has(tagId)) {
        newSelected.delete(tagId)
      } else {
        newSelected.add(tagId)
      }
    }

    onChange(newSelected)
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No hay grupos de etiquetas configurados.
        <br />
        <span className="text-xs">Puedes crearlos en Configuración → Etiquetas</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const hasValidSelection = isGroupValid(group)
        const showError = showValidation && group.selection_type === 'single' && !hasValidSelection

        return (
          <div
            key={group.id}
            className={cn(
              "space-y-2 p-3 rounded-lg border transition-colors",
              showError
                ? "border-destructive bg-destructive/5"
                : "border-transparent"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{group.name}</span>
              {group.selection_type === 'single' && (
                <span className="text-destructive">*</span>
              )}
              {group.description && (
                <span className="text-xs text-muted-foreground">({group.description})</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {group.selection_type === 'single'
                ? 'Selecciona una opción (obligatorio)'
                : 'Puedes seleccionar varias opciones'}
            </p>
            <div className="flex flex-col gap-1">
              {group.tags.length === 0 ? (
                <span className="text-xs text-muted-foreground">Sin etiquetas</span>
              ) : (
                group.tags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id, group.id)}
                      disabled={disabled}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Checkbox/Radio indicator */}
                      <div className={cn(
                        'flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-colors',
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/40'
                      )}>
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>

                      {/* Color dot + name + description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm font-medium">{tag.name}</span>
                        </div>
                        {tag.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
