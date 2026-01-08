'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  const [wasSaved, setWasSaved] = useState(false)

  // Guardar el estado anterior para poder revertir si se cancela
  const previousStateIdRef = useRef<string | null>(null)
  // Flag para saber si efectivamente se cambió el estado
  const stateWasChangedRef = useRef<boolean>(false)
  // Flag para evitar múltiples inicializaciones del modal
  const isInitializedRef = useRef<boolean>(false)
  // Guardar el material.id para detectar cambios reales
  const currentMaterialIdRef = useRef<string | null>(null)

  // Encontrar estados especiales por nombre
  const inProgressState = useMemo(() =>
    states.find(s => s.name.toLowerCase() === 'en progreso'),
    [states]
  )
  const analyzedState = useMemo(() =>
    states.find(s => s.name.toLowerCase() === 'analizado'),
    [states]
  )

  const currentVisualState = states.find(s => s.id === selectedStateId)

  // Al abrir el modal: cargar datos y cambiar estado a "En progreso"
  useEffect(() => {
    // Solo inicializar si:
    // 1. El modal está abierto
    // 2. No hemos inicializado aún O el material cambió
    const shouldInitialize = open && (
      !isInitializedRef.current ||
      currentMaterialIdRef.current !== material.id
    )

    if (shouldInitialize) {
      // Marcar como inicializado ANTES de cualquier otra cosa
      isInitializedRef.current = true
      currentMaterialIdRef.current = material.id

      setIsLoadingData(true)
      setWasSaved(false)
      stateWasChangedRef.current = false
      previousStateIdRef.current = null

      // Buscar el estado "En progreso" localmente (no depender del useMemo)
      const inProgressStateLocal = states.find(s => s.name.toLowerCase() === 'en progreso')

      // Cargar datos y cambiar estado a "En progreso" en paralelo
      Promise.all([
        getAnalysisModalData(material.id),
        setMaterialInProgress(material.id)
      ]).then(([dataResult, progressResult]) => {
        // Verificar que el modal sigue abierto y es el mismo material
        if (!isInitializedRef.current || currentMaterialIdRef.current !== material.id) {
          return // El modal se cerró o cambió de material, ignorar
        }

        if (dataResult.data) {
          setComments(dataResult.data.comments)
          setSelectedTagIds(new Set(dataResult.data.materialTagIds))
        }

        // Guardar el estado anterior y marcar que se cambió
        if (!progressResult.error) {
          previousStateIdRef.current = progressResult.previousStateId
          stateWasChangedRef.current = true
        }

        // Inicializar el selector con "En progreso"
        if (inProgressStateLocal) {
          setSelectedStateId(inProgressStateLocal.id)
        }

        setIsLoadingData(false)
      })

      // Reset otros estados
      setNewComment('')
      setHasInteracted(false)
    }

    // Cuando el modal se cierra, resetear el flag de inicialización
    if (!open) {
      isInitializedRef.current = false
      currentMaterialIdRef.current = null
    }
  }, [open, material.id, states])

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
    setWasSaved(true)

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

  const handleClose = async () => {
    if (hasInteracted && newComment.trim().length > 0) {
      if (!confirm('Tienes cambios sin guardar. ¿Descartar?')) {
        return
      }
    }

    // Si no se guardó nada y el estado fue cambiado, revertir al estado anterior
    if (!wasSaved && stateWasChangedRef.current) {
      await revertMaterialState(material.id, previousStateIdRef.current)
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
              <p className="text-xs text-muted-foreground">
                El estado se cambió a "En progreso" al abrir este modal.
                Si cancelas sin guardar, volverá al estado anterior.
              </p>
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
