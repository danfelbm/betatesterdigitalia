import type { Comment } from '@/types/database'
import { cn } from '@/lib/utils'

interface CommentHistoryProps {
  comments: Comment[]
  maxHeight?: string
  className?: string
}

export function CommentHistory({ comments, maxHeight = '200px', className }: CommentHistoryProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        No hay comentarios anteriores
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={cn('space-y-3 overflow-y-auto pr-2', className)}
      style={{ maxHeight }}
    >
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-3 rounded-lg border bg-muted/30 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
            {comment.analysis_state && (
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: comment.analysis_state.color }}
              >
                {comment.analysis_state.name}
              </span>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  )
}
