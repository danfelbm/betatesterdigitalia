'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteMaterial, resetMaterialAnalysis } from '@/actions/materials'
import { Badge } from '@/components/ui/badge'
import { TagChips } from '@/components/ui/tag-chip'
import { EXPECTED_CATEGORIES } from '@/lib/constants'
import { useMaterialsRealtime } from '@/hooks/use-materials-realtime'
import { useMaterialLocks } from '@/hooks/use-material-locks'
import type { Material, AnalysisState, TagGroupWithTags } from '@/types/database'
import { ExternalLink, Trash2, FileText, Image, Video, MessageSquare, Eye, Wifi, WifiOff, Loader2, Lock, Send, RotateCcw } from 'lucide-react'

interface MaterialsTableProps {
  initialMaterials: Material[]
  states: AnalysisState[]
  tagGroups: TagGroupWithTags[]
  isAdmin?: boolean
  currentUserEmail: string
}

const formatIcons = {
  texto: FileText,
  imagen: Image,
  video: Video,
}

export function MaterialsTable({ initialMaterials, states, isAdmin = false, currentUserEmail }: MaterialsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

  // Hook para actualización en tiempo real de datos
  const { materials, isConnected: isRealtimeConnected } = useMaterialsRealtime({
    initialMaterials,
    states,
  })

  // Hook para sistema de locks con Presence
  const {
    getLocker,
    isConnected: isPresenceConnected,
  } = useMaterialLocks(currentUserEmail)

  const isConnected = isRealtimeConnected && isPresenceConnected

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Evitar que el clic propague al row
    if (!confirm('¿Estás seguro de eliminar este material?')) return
    setDeletingId(id)
    await deleteMaterial(id)
    setDeletingId(null)
  }

  const handleReset = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Resetear este material? Se cambiará a "Pendiente" y se eliminarán sus etiquetas.')) return
    setResettingId(id)
    const result = await resetMaterialAnalysis(id)
    if (result.error) {
      alert('Error: ' + result.error)
    }
    setResettingId(null)
  }

  const handleRowClick = (materialId: string, isLocked: boolean) => {
    if (!isLocked) {
      router.push(`/materials/${materialId}/analyze`)
    }
  }

  const getStateInfo = (material: Material) => {
    const stateData = material.analysis_state as unknown
    const state = Array.isArray(stateData) ? stateData[0] : stateData
    return state as AnalysisState | null
  }

  if (materials.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No se encontraron materiales.</p>
      </div>
    )
  }

  return (
    <>
      {/* Indicador de conexión en tiempo real */}
      <div className="flex items-center justify-end mb-2">
        <div
          className={`flex items-center gap-1.5 text-xs ${
            isConnected ? 'text-green-600' : 'text-muted-foreground'
          }`}
          title={isConnected ? 'Conectado - actualizaciones en tiempo real' : 'Desconectado'}
        >
          {isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{isConnected ? 'En vivo' : 'Sin conexión'}</span>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Formato</th>
                <th className="px-4 py-3 text-left font-medium">Fuente</th>
                <th className="px-4 py-3 text-left font-medium">Categoría</th>
                <th className="px-4 py-3 text-left font-medium">Descripción</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials.map((material) => {
                const category = EXPECTED_CATEGORIES.find(
                  (c) => c.value === material.expected_category
                )
                const FormatIcon = formatIcons[material.format]
                const state = getStateInfo(material)
                const hasComments = (material.comments_count || 0) > 0
                const hasTags = material.tags && material.tags.length > 0

                // Sistema de locks basado en Presence
                const locker = getLocker(material.id)
                const isLockedByMe = locker && locker.user_email === currentUserEmail
                const isLocked = !!locker // Cualquier lock (mío o de otro)

                return (
                  <tr
                    key={material.id}
                    onClick={() => handleRowClick(material.id, isLocked)}
                    className={`${
                      isLocked
                        ? isLockedByMe
                          ? 'bg-green-100/70 dark:bg-green-950/40 opacity-60 cursor-not-allowed'
                          : 'bg-muted/30 opacity-50 cursor-not-allowed'
                        : 'hover:bg-muted/50 cursor-pointer'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FormatIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{material.format}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[150px]">
                        <p className="font-medium truncate">{material.source}</p>
                        {material.subcategory && (
                          <p className="text-xs text-muted-foreground truncate">
                            {material.subcategory}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={category?.color}>{category?.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] space-y-1">
                        <p className="truncate text-muted-foreground">
                          {material.description || '-'}
                        </p>
                        {hasTags && (
                          <TagChips tags={material.tags!} size="xs" maxVisible={2} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Indicador de lock */}
                        {isLocked && locker && (
                          <div className={`flex items-center gap-1.5 ${isLockedByMe ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {isLockedByMe ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs max-w-[80px] truncate" title={locker.user_email}>
                              {isLockedByMe ? 'Tú' : locker.user_email.split('@')[0]}
                            </span>
                          </div>
                        )}

                        <Badge color={state?.color}>
                          {state?.name || 'Sin estado'}
                        </Badge>

                        {hasComments && (
                          <span className="flex items-center gap-0.5 text-blue-500" title={`${material.comments_count} comentario(s)`}>
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-[10px]">{material.comments_count}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRowClick(material.id, isLocked)}
                          disabled={isLocked}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isLocked ? `Bloqueado por ${locker?.user_email}` : "Analizar y enviar reporte"}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Enviar reporte</span>
                        </button>
                        <Link
                          href={`/materials/${material.id}/show`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-muted transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </Link>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Abrir</span>
                        </a>
                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => handleReset(e, material.id)}
                              disabled={resettingId === material.id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-amber-500/10 hover:text-amber-600 transition-colors disabled:opacity-50"
                              title="Resetear análisis (volver a Pendiente)"
                            >
                              {resettingId === material.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, material.id)}
                              disabled={deletingId === material.id}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
