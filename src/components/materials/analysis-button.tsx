'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AnalysisModal } from './analysis-modal'
import { MousePointerClick } from 'lucide-react'
import type { Material, AnalysisState, TagGroupWithTags } from '@/types/database'

interface AnalysisButtonProps {
  material: Material
  states: AnalysisState[]
  tagGroups: TagGroupWithTags[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function AnalysisButton({
  material,
  states,
  tagGroups,
  variant = 'outline',
  size = 'sm',
}: AnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setIsOpen(true)}>
        <MousePointerClick className="h-4 w-4 mr-2" />
        Actualizar análisis
      </Button>

      {isOpen && (
        <AnalysisModal
          material={material}
          states={states}
          tagGroups={tagGroups}
          open={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
