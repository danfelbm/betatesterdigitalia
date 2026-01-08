'use client'

import { useState } from 'react'
import { updateMaterial } from '@/actions/materials'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Material, AnalysisState } from '@/types/database'
import { Check } from 'lucide-react'

interface StateModalProps {
  material: Material
  states: AnalysisState[]
  open: boolean
  onClose: () => void
}

export function StateModal({ material, states, open, onClose }: StateModalProps) {
  const [selectedStateId, setSelectedStateId] = useState(material.analysis_state_id || '')
  const [notes, setNotes] = useState(material.analysis_notes || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    await updateMaterial(material.id, {
      analysis_state_id: selectedStateId || null,
      analysis_notes: notes || null,
    })
    setIsLoading(false)
    onClose()
  }

  const currentState = states.find(s => s.id === selectedStateId)

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogClose onClose={onClose} />
      <DialogHeader>
        <DialogTitle>Actualizar análisis</DialogTitle>
        <DialogDescription>
          {material.source} - {material.description?.slice(0, 50)}...
        </DialogDescription>
      </DialogHeader>

      <DialogContent className="space-y-4">
        <div className="space-y-2">
          <Label>Estado del análisis</Label>
          <div className="grid grid-cols-2 gap-2">
            {states.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => setSelectedStateId(state.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                  selectedStateId === state.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: state.color }}
                />
                <span className="text-sm font-medium flex-1">{state.name}</span>
                {selectedStateId === state.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas del análisis IA (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Escribe aquí los resultados del análisis de tu plataforma de IA..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground">
            Registra observaciones, resultados de detección, porcentajes de confianza, etc.
          </p>
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} isLoading={isLoading}>
          Guardar cambios
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
