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

        setLockedMaterials(newLocks)
      })
      .on('presence', { event: 'join' }, () => {
        // Lock añadido - sync se encarga de actualizar el estado
      })
      .on('presence', { event: 'leave' }, () => {
        // Lock liberado - sync se encarga de actualizar el estado
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [currentUserEmail, supabase])

  const lockMaterial = useCallback(
    (materialId: string) => {
      const channel = channelRef.current
      if (!channel || !currentUserEmail) return

      const lockInfo: LockInfo = {
        material_id: materialId,
        user_email: currentUserEmail,
        locked_at: new Date().toISOString(),
      }

      channel.track(lockInfo).catch((err) => {
        console.error('[Presence] Error al bloquear:', err)
      })

      currentLockRef.current = materialId
    },
    [currentUserEmail]
  )

  const unlockMaterial = useCallback(() => {
    const channel = channelRef.current
    if (!channel) return

    channel.untrack().catch((err) => {
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
