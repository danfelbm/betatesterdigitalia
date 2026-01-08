'use client'

import { Check } from 'lucide-react'
import type { TagGroupWithTags } from '@/types/database'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  groups: TagGroupWithTags[]
  selectedTagIds: Set<string>
  onChange: (tagIds: Set<string>) => void
  disabled?: boolean
}

export function TagSelector({ groups, selectedTagIds, onChange, disabled = false }: TagSelectorProps) {
  const toggleTag = (tagId: string) => {
    if (disabled) return

    const newSelected = new Set(selectedTagIds)
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId)
    } else {
      newSelected.add(tagId)
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
      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{group.name}</span>
            {group.description && (
              <span className="text-xs text-muted-foreground">({group.description})</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.tags.length === 0 ? (
              <span className="text-xs text-muted-foreground">Sin etiquetas</span>
            ) : (
              group.tags.map((tag) => {
                const isSelected = selectedTagIds.has(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    disabled={disabled}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-sm transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    title={tag.description || undefined}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
