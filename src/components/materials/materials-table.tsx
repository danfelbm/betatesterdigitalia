'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteMaterial } from '@/actions/materials'
import { Badge } from '@/components/ui/badge'
import { AnalysisModal } from './analysis-modal'
import { TagChips } from '@/components/ui/tag-chip'
import { EXPECTED_CATEGORIES } from '@/lib/constants'
import { useMaterialsRealtime } from '@/hooks/use-materials-realtime'
import { useMaterialLocks } from '@/hooks/use-material-locks'
import type { Material, AnalysisState, TagGroupWithTags } from '@/types/database'
import { ExternalLink, Trash2, FileText, Image, Video, MessageSquare, MousePointerClick, Eye, Wifi, WifiOff, Loader2, Lock } from 'lucide-react'

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

export function MaterialsTable({ initialMaterials, states, tagGroups, isAdmin = false, currentUserEmail }: MaterialsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  // Hook para actualización en tiempo real de datos
  const { materials, isConnected: isRealtimeConnected } = useMaterialsRealtime({
    initialMaterials,
    states,
  })

  // Hook para sistema de locks con Presence
  const {
    lockMaterial,
    unlockMaterial,
    getLocker,
    isConnected: isPresenceConnected,
  } = useMaterialLocks(currentUserEmail)

  const isConnected = isRealtimeConnected && isPresenceConnected

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este material?')) return
    setDeletingId(id)
    await deleteMaterial(id)
    setDeletingId(null)
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
                const isLockedByOther = locker && locker.user_email !== currentUserEmail
                const isLockedByMe = locker && locker.user_email === currentUserEmail

                return (
                  <tr
                    key={material.id}
                    className={`${
                      isLockedByOther
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 opacity-60'
                        : isLockedByMe
                        ? 'bg-green-50/50 dark:bg-green-950/20'
                        : 'hover:bg-muted/50'
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
                      <div className="flex items-center justify-end gap-2">
                        {/* Estado con botón de editar análisis */}
                        <button
                          onClick={() => !isLockedByOther && setSelectedMaterial(material)}
                          disabled={!!isLockedByOther}
                          className={`group flex items-center gap-1.5 transition-opacity ${
                            isLockedByOther
                              ? 'cursor-not-allowed'
                              : 'hover:opacity-80 cursor-pointer'
                          }`}
                          title={isLockedByOther ? `En análisis por ${locker?.user_email}` : 'Editar análisis'}
                        >
                          <Badge
                            color={state?.color}
                            className={isLockedByOther ? 'cursor-not-allowed' : 'cursor-pointer'}
                          >
                            {state?.name || 'Sin estado'}
                          </Badge>
                          {isLockedByOther ? (
                            <Lock className="h-3.5 w-3.5 text-blue-500" />
                          ) : isLockedByMe ? (
                            <Loader2 className="h-3.5 w-3.5 text-green-500 animate-spin" />
                          ) : (
                            <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                          )}
                          {hasComments && (
                            <span className="flex items-center gap-0.5 text-blue-500" title={`${material.comments_count} comentario(s)`}>
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-[10px]">{material.comments_count}</span>
                            </span>
                          )}
                        </button>
                        {/* Mostrar quién tiene el lock */}
                        {isLockedByOther && locker && (
                          <span className="text-xs text-blue-500 max-w-[100px] truncate" title={locker.user_email}>
                            {locker.user_email.split('@')[0]}
                          </span>
                        )}

                        {/* Separador */}
                        <span className="h-4 w-px bg-border" />

                        {/* Otras acciones */}
                        <Link
                          href={`/materials/${material.id}/show`}
                          className="p-2 hover:bg-muted rounded-md"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-md"
                          title="Abrir URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(material.id)}
                            disabled={deletingId === material.id}
                            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {selectedMaterial && (
        <AnalysisModal
          material={selectedMaterial}
          states={states}
          tagGroups={tagGroups}
          open={!!selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onLock={lockMaterial}
          onUnlock={unlockMaterial}
        />
      )}
    </>
  )
}
