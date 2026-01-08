'use client'

import { useState } from 'react'
import { deleteComment } from '@/actions/comments'
import type { Comment } from '@/types/database'
import { cn } from '@/lib/utils'
import { Trash2, Loader2 } from 'lucide-react'

interface CommentHistoryProps {
  comments: Comment[]
  maxHeight?: string
  className?: string
  isAdmin?: boolean
}

export function CommentHistory({
  comments,
  maxHeight = '200px',
  className,
  isAdmin = false,
}: CommentHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState(comments)

  if (!localComments || localComments.length === 0) {
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

  const handleDelete = async (commentId: string) => {
    if (!confirm('¿Eliminar este comentario? Esta acción no se puede deshacer.')) {
      return
    }

    setDeletingId(commentId)
    const result = await deleteComment(commentId)

    if (result.error) {
      alert('Error: ' + result.error)
      setDeletingId(null)
      return
    }

    // Actualizar lista local
    setLocalComments(prev => prev.filter(c => c.id !== commentId))
    setDeletingId(null)
  }

  return (
    <div
      className={cn('space-y-3 pr-2', maxHeight !== 'none' && 'overflow-y-auto', className)}
      style={maxHeight !== 'none' ? { maxHeight } : undefined}
    >
      {localComments.map((comment) => (
        <div
          key={comment.id}
          className="p-3 rounded-lg border bg-muted/30 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.created_at)}
            </span>
            <div className="flex items-center gap-2">
              {comment.analysis_state && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: comment.analysis_state.color }}
                >
                  {comment.analysis_state.name}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  title="Eliminar comentario"
                >
                  {deletingId === comment.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  )
}
