import { X } from 'lucide-react'
import type { Tag } from '@/types/database'
import { cn } from '@/lib/utils'

interface TagChipProps {
  tag: Tag
  size?: 'xs' | 'sm' | 'md'
  removable?: boolean
  onRemove?: () => void
  className?: string
}

export function TagChip({ tag, size = 'sm', removable = false, onRemove, className }: TagChipProps) {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
  }

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  }

  const iconSizeClasses = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border bg-background font-medium',
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn('rounded-full shrink-0', dotSizeClasses[size])}
        style={{ backgroundColor: tag.color }}
      />
      <span className="truncate max-w-[100px]">{tag.name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="shrink-0 hover:text-destructive transition-colors"
        >
          <X className={iconSizeClasses[size]} />
        </button>
      )}
    </span>
  )
}

interface TagChipsProps {
  tags: Tag[]
  size?: 'xs' | 'sm' | 'md'
  maxVisible?: number
  className?: string
}

export function TagChips({ tags, size = 'xs', maxVisible = 3, className }: TagChipsProps) {
  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, maxVisible)
  const remainingCount = tags.length - maxVisible

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleTags.map((tag) => (
        <TagChip key={tag.id} tag={tag} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
