'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AnalysisModal } from './analysis-modal'
import { useMaterialLocks } from '@/hooks/use-material-locks'
import { MousePointerClick, Lock } from 'lucide-react'
import type { Material, AnalysisState, TagGroupWithTags } from '@/types/database'

interface AnalysisButtonProps {
  material: Material
  states: AnalysisState[]
  tagGroups: TagGroupWithTags[]
  currentUserEmail: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function AnalysisButton({
  material,
  states,
  tagGroups,
  currentUserEmail,
  variant = 'outline',
  size = 'sm',
}: AnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { lockMaterial, unlockMaterial, getLocker } = useMaterialLocks(currentUserEmail)

  const locker = getLocker(material.id)
  const isLockedByOther = locker && locker.user_email !== currentUserEmail

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => !isLockedByOther && setIsOpen(true)}
        disabled={!!isLockedByOther}
        title={isLockedByOther ? `En análisis por ${locker?.user_email}` : 'Actualizar análisis'}
      >
        {isLockedByOther ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <MousePointerClick className="h-4 w-4 mr-2" />
        )}
        {isLockedByOther ? 'Bloqueado' : 'Actualizar análisis'}
      </Button>

      {isOpen && (
        <AnalysisModal
          material={material}
          states={states}
          tagGroups={tagGroups}
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onLock={lockMaterial}
          onUnlock={unlockMaterial}
        />
      )}
    </>
  )
}
