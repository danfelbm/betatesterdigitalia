'use client'

import { useState, useEffect, useMemo } from 'react'
import { submitAnalysis, getAnalysisModalData, setMaterialInProgress, revertMaterialState } from '@/actions/analysis'
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
  onLock: (materialId: string) => void
  onUnlock: () => void
}

export function AnalysisModal({
  material,
  states,
  tagGroups,
  open,
  onClose,
  onLock,
  onUnlock,
}: AnalysisModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [selectedStateId, setSelectedStateId] = useState<string>('')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  // SIMPLE: guardar el estado anterior aquí
  const [previousStateId, setPreviousStateId] = useState<string | null>(null)
  const [materialId, setMaterialId] = useState<string | null>(null)
  const [wasSaved, setWasSaved] = useState(false)

  const inProgressState = useMemo(
    () => states.find((s) => s.name.toLowerCase() === 'en progreso'),
    [states]
  )
  const analyzedState = useMemo(
    () => states.find((s) => s.name.toLowerCase() === 'analizado'),
    [states]
  )

  const currentVisualState = states.find((s) => s.id === selectedStateId)

  // Inicialización
  useEffect(() => {
    if (!open) return

    let cancelled = false

    const init = async () => {
      setIsLoadingData(true)
      setWasSaved(false)
      setMaterialId(material.id)

      // Presence lock
      onLock(material.id)

      // Cambiar a "En progreso"
      const result = await setMaterialInProgress(material.id)

      if (cancelled) return

      if (!result.error) {
        setPreviousStateId(result.previousStateId)
        console.log('✅ Estado anterior guardado:', result.previousStateId)
      } else {
        console.error('❌ Error:', result.error)
      }

      // Cargar datos
      const data = await getAnalysisModalData(material.id)

      if (cancelled) return

      if (data.data) {
        setComments(data.data.comments)
        setSelectedTagIds(new Set(data.data.materialTagIds))
        if (inProgressState) {
          setSelectedStateId(inProgressState.id)
        }
      }

      setIsLoadingData(false)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [open, material.id, onLock, inProgressState])

  // Auto-seleccionar "Analizado" al escribir
  useEffect(() => {
    if (newComment.trim().length > 0 && !hasInteracted) {
      setHasInteracted(true)
      if (analyzedState) {
        setSelectedStateId(analyzedState.id)
      }
    }
  }, [newComment, hasInteracted, analyzedState])

  // GUARDAR
  async function handleSave() {
    setIsLoading(true)
    setWasSaved(true)

    const result = await submitAnalysis(material.id, {
      comment: newComment.trim(),
      analysis_state_id: selectedStateId || null,
      tag_ids: Array.from(selectedTagIds),
    })

    setIsLoading(false)

    if (result.error) {
      setWasSaved(false)
      alert('Error: ' + result.error)
      return
    }

    // Limpiar y cerrar
    onUnlock()
    resetState()
    onClose()
  }

  // CERRAR (cancelar)
  async function handleClose() {
    if (hasInteracted && newComment.trim().length > 0) {
      if (!confirm('Tienes cambios sin guardar. ¿Descartar?')) {
        return
      }
    }

    console.log('🔄 Cerrando modal, wasSaved:', wasSaved, 'previousStateId:', previousStateId)

    // Solo revertir si NO se guardó
    if (!wasSaved && materialId && previousStateId !== undefined) {
      console.log('🔄 Revirtiendo a:', previousStateId)
      const result = await revertMaterialState(materialId, previousStateId)
      console.log('🔄 Resultado revert:', result)
    }

    onUnlock()
    resetState()
    onClose()
  }

  function resetState() {
    setComments([])
    setNewComment('')
    setSelectedStateId('')
    setSelectedTagIds(new Set())
    setHasInteracted(false)
    setPreviousStateId(null)
    setMaterialId(null)
    setWasSaved(false)
    setIsLoadingData(true)
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
            {comments.length > 0 && (
              <div className="space-y-2">
                <Label>Historial de análisis</Label>
                <CommentHistory comments={comments} maxHeight="150px" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comment">Nuevo comentario</Label>
              <Textarea
                id="comment"
                placeholder="Escribe aquí los resultados del análisis..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

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
                  <span className="text-muted-foreground">{currentVisualState.name}</span>
                </div>
              )}
            </div>

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
        <Button variant="outline" onClick={handleClose} disabled={isLoadingData}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading || isLoadingData}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
