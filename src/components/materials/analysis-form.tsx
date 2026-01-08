'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitAnalysis, setMaterialInProgress, revertMaterialState } from '@/actions/analysis'
import { useMaterialLocks } from '@/hooks/use-material-locks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommentHistory } from './comment-history'
import { TagSelector } from './tag-selector'
import type { Material, AnalysisState, TagGroupWithTags, Comment } from '@/types/database'
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react'

interface AnalysisFormProps {
  material: Material
  comments: Comment[]
  materialTagIds: string[]
  states: AnalysisState[]
  tagGroups: TagGroupWithTags[]
  currentUserEmail: string
  previousStateId: string | null // Estado ANTERIOR del material (antes de "En progreso")
  isAdmin?: boolean
}

export function AnalysisForm({
  material,
  comments,
  materialTagIds,
  states,
  tagGroups,
  currentUserEmail,
  previousStateId,
  isAdmin = false,
}: AnalysisFormProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(materialTagIds))
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Ref para saber si se guardó (sobrevive renders)
  const wasSavedRef = useRef(false)
  const materialIdRef = useRef(material.id)

  // Hook de presencia para locks
  const { lockMaterial, unlockMaterial } = useMaterialLocks(currentUserEmail)

  // Estado visual actual
  const currentVisualState = states.find(s => s.id === selectedStateId)

  // Al montar: cambiar a "En progreso" y registrar lock
  useEffect(() => {
    const init = async () => {
      // Registrar lock de presencia
      lockMaterial(material.id)

      // Cambiar estado a "En progreso" en la BD
      await setMaterialInProgress(material.id)

      // Seleccionar estado "Analizado" por defecto
      const analyzedState = states.find(s => s.name.toLowerCase() === 'analizado')
      if (analyzedState) {
        setSelectedStateId(analyzedState.id)
      }

      setIsInitialized(true)
    }

    init()

    // Handler para cierre de pestaña/navegador
    const handleBeforeUnload = () => {
      if (!wasSavedRef.current) {
        navigator.sendBeacon(
          '/api/materials/revert-state',
          JSON.stringify({
            materialId: materialIdRef.current,
            previousStateId: previousStateId, // Volver al estado ANTERIOR, no a "Pendiente"
          })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unlockMaterial()

      // Al desmontar (navegación), revertir si no se guardó
      if (!wasSavedRef.current) {
        revertMaterialState(materialIdRef.current, previousStateId)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setIsLoading(true)
    wasSavedRef.current = true

    const result = await submitAnalysis(material.id, {
      comment: newComment.trim(),
      analysis_state_id: selectedStateId || null,
      tag_ids: Array.from(selectedTagIds),
    })

    if (result.error) {
      wasSavedRef.current = false
      setIsLoading(false)
      alert('Error: ' + result.error)
      return
    }

    router.push('/materials')
  }

  function handleCancel() {
    // wasSavedRef sigue en false, el cleanup del useEffect revertirá el estado
    router.push('/materials')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/materials"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            // No prevenir, dejar que navegue normalmente
            // El cleanup del useEffect manejará el revert
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a materiales
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Analizar Material</h1>
        <p className="text-muted-foreground">
          {material.source} - {material.description?.slice(0, 80)}
          {(material.description?.length || 0) > 80 ? '...' : ''}
        </p>
      </div>

      {/* URL del material */}
      <Card>
        <CardContent className="pt-4">
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {material.url}
          </a>
        </CardContent>
      </Card>

      {/* Estado actual - indicador visual */}
      {!isInitialized ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cambiando a estado "En progreso"...
        </div>
      ) : (
        <Badge color={states.find(s => s.name.toLowerCase() === 'en progreso')?.color}>
          En progreso
        </Badge>
      )}

      {/* Historial de comentarios */}
      {comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            <CommentHistory comments={comments} maxHeight="200px" isAdmin={isAdmin} />
          </CardContent>
        </Card>
      )}

      {/* Nuevo comentario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo Comentario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Escribe los resultados del análisis</Label>
            <Textarea
              id="comment"
              placeholder="Escribe aquí los resultados del análisis..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estado del análisis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="state">Selecciona el estado del análisis</Label>
            <Select
              id="state"
              value={selectedStateId}
              onChange={(e) => setSelectedStateId(e.target.value)}
            >
              <option value="">Seleccionar estado</option>
              {states
                .filter((state) => isAdmin || state.name.toLowerCase() !== 'en progreso')
                .map((state) => (
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
        </CardContent>
      </Card>

      {/* Etiquetas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <TagSelector
            groups={tagGroups}
            selectedTagIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading || !isInitialized}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar Análisis
        </Button>
      </div>
    </div>
  )
}
