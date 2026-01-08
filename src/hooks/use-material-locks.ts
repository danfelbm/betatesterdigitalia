'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface LockInfo {
  material_id: string
  user_email: string
  locked_at: string
}

interface UseMaterialLocksReturn {
  lockedMaterials: Map<string, LockInfo>
  lockMaterial: (materialId: string) => void
  unlockMaterial: () => void
  isLocked: (materialId: string) => boolean
  isLockedByMe: (materialId: string) => boolean
  getLocker: (materialId: string) => LockInfo | null
  isConnected: boolean
}

/**
 * Hook para manejar locks de materiales usando Supabase Realtime Presence.
 * Cuando un usuario cierra la pestaña/navegador, el lock se libera automáticamente.
 */
export function useMaterialLocks(currentUserEmail: string): UseMaterialLocksReturn {
  const [lockedMaterials, setLockedMaterials] = useState<Map<string, LockInfo>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const currentLockRef = useRef<string | null>(null)

  // Crear cliente una sola vez
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!currentUserEmail) return

    console.log('[Presence] Iniciando conexión para:', currentUserEmail)

    const channel = supabase.channel('material-locks', {
      config: {
        presence: {
          key: currentUserEmail,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState<LockInfo>()
        const newLocks = new Map<string, LockInfo>()

        console.log('[Presence] Sync - estado actual:', presenceState)

        // Convertir el estado de presencia a un Map de locks por material_id
        Object.values(presenceState).forEach((presences) => {
          presences.forEach((presence) => {
            // Solo agregar si tiene material_id
            if (presence.material_id) {
              newLocks.set(presence.material_id, {
                material_id: presence.material_id,
                user_email: presence.user_email,
                locked_at: presence.locked_at,
              })
            }
          })
        })

        console.log('[Presence] Locks actualizados:', Array.from(newLocks.entries()))
        setLockedMaterials(newLocks)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] Join:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] Leave:', key, leftPresences)
      })
      .subscribe(async (status) => {
        console.log('[Presence] Estado de suscripción:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      console.log('[Presence] Limpiando canal')
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [currentUserEmail, supabase])

  const lockMaterial = useCallback(
    (materialId: string) => {
      const channel = channelRef.current
      if (!channel || !currentUserEmail) {
        console.warn('[Presence] No se puede lockear: canal no conectado')
        return
      }

      const lockInfo: LockInfo = {
        material_id: materialId,
        user_email: currentUserEmail,
        locked_at: new Date().toISOString(),
      }

      console.log('[Presence] Intentando bloquear material:', materialId)
      channel.track(lockInfo).then(() => {
        console.log('[Presence] Material bloqueado exitosamente:', materialId)
      }).catch((err) => {
        console.error('[Presence] Error al bloquear:', err)
      })

      currentLockRef.current = materialId
    },
    [currentUserEmail]
  )

  const unlockMaterial = useCallback(() => {
    const channel = channelRef.current
    if (!channel) {
      console.warn('[Presence] No se puede desbloquear: canal no conectado')
      return
    }

    console.log('[Presence] Intentando desbloquear material:', currentLockRef.current)
    channel.untrack().then(() => {
      console.log('[Presence] Material desbloqueado exitosamente')
    }).catch((err) => {
      console.error('[Presence] Error al desbloquear:', err)
    })

    currentLockRef.current = null
  }, [])

  const isLocked = useCallback(
    (materialId: string) => {
      return lockedMaterials.has(materialId)
    },
    [lockedMaterials]
  )

  const isLockedByMe = useCallback(
    (materialId: string) => {
      const lock = lockedMaterials.get(materialId)
      return lock?.user_email === currentUserEmail
    },
    [lockedMaterials, currentUserEmail]
  )

  const getLocker = useCallback(
    (materialId: string) => {
      return lockedMaterials.get(materialId) || null
    },
    [lockedMaterials]
  )

  return {
    lockedMaterials,
    lockMaterial,
    unlockMaterial,
    isLocked,
    isLockedByMe,
    getLocker,
    isConnected,
  }
}
