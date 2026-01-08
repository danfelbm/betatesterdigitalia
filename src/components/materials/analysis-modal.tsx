'use client'

import { useState, useEffect, useMemo } from 'react'
import { submitAnalysis, getAnalysisModalData } from '@/actions/analysis'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CommentHistory } from './comment-history'
import { TagSelector } from './tag-selector'
import type { Material, AnalysisState, TagGroupWithTags, Comment } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface AnalysisModalProps {
  material: Material
  states: AnalysisState[]
  tagGroups: TagGroupWithTags[]
  open: boolean
  onClose: () => void
}

export function AnalysisModal({ material, states, tagGroups, open, onClose }: AnalysisModalProps) {
  // Estados locales
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedStateId, setSelectedStateId] = useState<string>('')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Encontrar estados especiales por nombre
  const pendingState = useMemo(() =>
    states.find(s => s.name.toLowerCase() === 'pendiente'),
    [states]
  )
  const inProgressState = useMemo(() =>
    states.find(s => s.name.toLowerCase() === 'en progreso'),
    [states]
  )
  const analyzedState = useMemo(() =>
    states.find(s => s.name.toLowerCase() === 'analizado'),
    [states]
  )

  // Estado visual (mostrar "En progreso" mientras está abierto si estaba en Pendiente)
  const visualStateId = useMemo(() => {
    if (material.analysis_state_id === pendingState?.id && inProgressState) {
      return inProgressState.id
    }
    return selectedStateId || material.analysis_state_id || ''
  }, [material.analysis_state_id, pendingState, inProgressState, selectedStateId])

  const currentVisualState = states.find(s => s.id === visualStateId)

  // Cargar datos del modal
  useEffect(() => {
    if (open) {
      setIsLoadingData(true)
      getAnalysisModalData(material.id).then(result => {
        if (result.data) {
          setComments(result.data.comments)
          setSelectedTagIds(new Set(result.data.materialTagIds))
          // Inicializar estado seleccionado con el actual del material
          setSelectedStateId(material.analysis_state_id || '')
        }
        setIsLoadingData(false)
      })
      // Reset otros estados
      setNewComment('')
      setHasInteracted(false)
    }
  }, [open, material.id, material.analysis_state_id])

  // Cuando el usuario escribe, preseleccionar "Analizado"
  useEffect(() => {
    if (newComment.trim().length > 0 && !hasInteracted) {
      setHasInteracted(true)
      // Preseleccionar estado "Analizado" si existe
      if (analyzedState) {
        setSelectedStateId(analyzedState.id)
      }
    }
  }, [newComment, hasInteracted, analyzedState])

  const handleSave = async () => {
    setIsLoading(true)

    const result = await submitAnalysis(material.id, {
      comment: newComment.trim(),
      analysis_state_id: selectedStateId || null,
      tag_ids: Array.from(selectedTagIds),
    })

    setIsLoading(false)

    if (!result.error) {
      onClose()
    }
  }

  const handleClose = () => {
    if (hasInteracted && newComment.trim().length > 0) {
      if (!confirm('Tienes cambios sin guardar. ¿Descartar?')) {
        return
      }
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogClose onClose={handleClose} />
      <DialogHeader>
        <DialogTitle>Actualizar análisis</DialogTitle>
        <DialogDescription>
          {material.source} - {material.description?.slice(0, 60)}
          {(material.description?.length || 0) > 60 ? '...' : ''}
        </DialogDescription>
      </DialogHeader>

      <DialogContent className="space-y-5 max-h-[70vh] overflow-y-auto">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Historial de comentarios */}
            {comments.length > 0 && (
              <div className="space-y-2">
                <Label>Historial de análisis</Label>
                <CommentHistory comments={comments} maxHeight="150px" />
              </div>
            )}

            {/* Nuevo comentario */}
            <div className="space-y-2">
              <Label htmlFor="comment">Nuevo comentario</Label>
              <Textarea
                id="comment"
                placeholder="Escribe aquí los resultados del análisis..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Registra observaciones, resultados de detección, porcentajes de confianza, etc.
              </p>
            </div>

            {/* Selector de estado */}
            <div className="space-y-2">
              <Label htmlFor="state">Estado del análisis</Label>
              <Select
                id="state"
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
              >
                <option value="">Seleccionar estado</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </Select>
              {currentVisualState && (
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentVisualState.color }}
                  />
                  <span className="text-muted-foreground">
                    {currentVisualState.name}
                  </span>
                </div>
              )}
              {material.analysis_state_id === pendingState?.id && inProgressState && (
                <p className="text-xs text-blue-500">
                  Estado visual: En progreso (se actualizará al guardar)
                </p>
              )}
            </div>

            {/* Selector de etiquetas */}
            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <TagSelector
                groups={tagGroups}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>
          </>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || isLoadingData}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Actualizar análisis
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
