'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Material, AnalysisState } from '@/types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseMaterialsRealtimeProps {
  initialMaterials: Material[]
  states: AnalysisState[]
}

interface MaterialRow {
  id: string
  url: string
  format: 'texto' | 'imagen' | 'video'
  expected_category: string
  source: string
  description: string | null
  subcategory: string | null
  analysis_notes: string | null
  analysis_state_id: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export function useMaterialsRealtime({ initialMaterials, states }: UseMaterialsRealtimeProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [isConnected, setIsConnected] = useState(false)

  // Función para encontrar el estado por ID
  const findState = useCallback((stateId: string | null): AnalysisState | null => {
    if (!stateId) return null
    return states.find(s => s.id === stateId) || null
  }, [states])

  // Actualizar materiales cuando cambian los iniciales (por navegación, etc.)
  useEffect(() => {
    setMaterials(initialMaterials)
  }, [initialMaterials])

  useEffect(() => {
    const supabase = createClient()

    // Crear canal para escuchar cambios en materials
    const channel = supabase
      .channel('materials-realtime')
      .on<MaterialRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'materials',
        },
        (payload: RealtimePostgresChangesPayload<MaterialRow>) => {
          const updatedRow = payload.new as MaterialRow

          setMaterials(prev => prev.map(material => {
            if (material.id === updatedRow.id) {
              // Actualizar el material con los nuevos datos
              return {
                ...material,
                analysis_state_id: updatedRow.analysis_state_id,
                analysis_state: findState(updatedRow.analysis_state_id),
                updated_at: updatedRow.updated_at,
                // Mantener tags y comments_count del estado anterior
                // ya que no vienen en el payload de Realtime
              }
            }
            return material
          }))
        }
      )
      .on<MaterialRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'materials',
        },
        (payload: RealtimePostgresChangesPayload<MaterialRow>) => {
          const newRow = payload.new as MaterialRow

          // Agregar el nuevo material al inicio de la lista
          const newMaterial: Material = {
            id: newRow.id,
            url: newRow.url,
            format: newRow.format,
            expected_category: newRow.expected_category as Material['expected_category'],
            source: newRow.source,
            description: newRow.description,
            subcategory: newRow.subcategory,
            analysis_notes: newRow.analysis_notes,
            analysis_state_id: newRow.analysis_state_id,
            user_id: newRow.user_id,
            created_at: newRow.created_at,
            updated_at: newRow.updated_at,
            analysis_state: findState(newRow.analysis_state_id),
            tags: [],
            comments_count: 0,
          }

          setMaterials(prev => [newMaterial, ...prev])
        }
      )
      .on<MaterialRow>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'materials',
        },
        (payload: RealtimePostgresChangesPayload<MaterialRow>) => {
          const oldRecord = payload.old as MaterialRow | null
          const deletedId = oldRecord?.id

          if (deletedId) {
            setMaterials(prev => prev.filter(m => m.id !== deletedId))
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Cleanup: desuscribirse al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [findState])

  return {
    materials,
    isConnected,
  }
}
