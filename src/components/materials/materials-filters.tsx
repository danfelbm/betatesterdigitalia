'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EXPECTED_CATEGORIES, MATERIAL_FORMATS } from '@/lib/constants'
import type { AnalysisState } from '@/types/database'
import { X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'

interface MaterialsFiltersProps {
  states: AnalysisState[]
}

export function MaterialsFilters({ states }: MaterialsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/materials?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/materials')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search)
  }

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por URL, fuente o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Select
          value={searchParams.get('category') || ''}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="w-[200px]"
        >
          <option value="">Todas las categorías</option>
          {EXPECTED_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>

        <Select
          value={searchParams.get('format') || ''}
          onChange={(e) => updateFilter('format', e.target.value)}
          className="w-[150px]"
        >
          <option value="">Todos los formatos</option>
          {MATERIAL_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>

        <Select
          value={searchParams.get('state') || ''}
          onChange={(e) => updateFilter('state', e.target.value)}
          className="w-[180px]"
        >
          <option value="">Todos los estados</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
