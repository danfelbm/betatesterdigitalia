'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMaterial, updateMaterial } from '@/actions/materials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { EXPECTED_CATEGORIES, MATERIAL_FORMATS } from '@/lib/constants'
import type { Material, AnalysisState } from '@/types/database'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface MaterialFormProps {
  material?: Material
  states: AnalysisState[]
  isEditing?: boolean
}

export function MaterialForm({ material, states, isEditing }: MaterialFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    url: material?.url || '',
    format: material?.format || 'texto',
    expected_category: material?.expected_category || 'sin_alteraciones',
    source: material?.source || '',
    description: material?.description || '',
    subcategory: material?.subcategory || '',
    analysis_notes: material?.analysis_notes || '',
    analysis_state_id: material?.analysis_state_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const submitData = {
      ...formData,
      description: formData.description || null,
      subcategory: formData.subcategory || null,
      analysis_notes: formData.analysis_notes || null,
      analysis_state_id: formData.analysis_state_id || null,
    }

    let result
    if (isEditing && material) {
      result = await updateMaterial(material.id, submitData)
    } else {
      result = await createMaterial(submitData as any)
    }

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push('/materials')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Link href="/materials" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a materiales
      </Link>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://ejemplo.com/articulo"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">Formato *</Label>
              <Select
                id="format"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                required
              >
                {MATERIAL_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría esperada *</Label>
              <Select
                id="category"
                value={formData.expected_category}
                onChange={(e) => setFormData({ ...formData, expected_category: e.target.value as any })}
                required
              >
                {EXPECTED_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Fuente *</Label>
              <Input
                id="source"
                placeholder="Ej: El Tiempo, Colombiacheck, Midjourney"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Input
                id="subcategory"
                placeholder="Ej: Cadena WhatsApp, Dataset académico"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción breve del material..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado de análisis</Label>
            <Select
              id="state"
              value={formData.analysis_state_id}
              onChange={(e) => setFormData({ ...formData, analysis_state_id: e.target.value })}
            >
              <option value="">Sin estado</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas del análisis</Label>
              <Textarea
                id="notes"
                placeholder="Escribe aquí las observaciones del análisis de tu IA..."
                value={formData.analysis_notes}
                onChange={(e) => setFormData({ ...formData, analysis_notes: e.target.value })}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Usa este espacio para registrar los resultados del análisis de tu plataforma de IA.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Crear material'}
        </Button>
        <Link href="/materials">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  )
}
