import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMaterialById } from '@/actions/materials'
import { getComments } from '@/actions/comments'
import { getMaterialTags } from '@/actions/analysis'
import { getTagGroupsWithTags } from '@/actions/tag-groups'
import { getAnalysisStates } from '@/actions/analysis-states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CommentHistory } from '@/components/materials/comment-history'
import { TagChip } from '@/components/ui/tag-chip'
import { AnalysisButton } from '@/components/materials/analysis-button'
import { EXPECTED_CATEGORIES, MATERIAL_FORMATS } from '@/lib/constants'
import {
  ExternalLink,
  ArrowLeft,
  FileText,
  Image,
  Video,
  Calendar,
  Clock,
  Tag as TagIcon,
  MessageSquare,
} from 'lucide-react'
import type { TagGroupWithTags, Material } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

const formatIcons = {
  texto: FileText,
  imagen: Image,
  video: Video,
}

export default async function MaterialShowPage({ params }: PageProps) {
  const { id } = await params

  const [materialResult, commentsResult, tagsResult, statesResult, tagGroupsResult] = await Promise.all([
    getMaterialById(id),
    getComments(id),
    getMaterialTags(id),
    getAnalysisStates(),
    getTagGroupsWithTags(),
  ])

  if (!materialResult.data) {
    notFound()
  }

  const material = materialResult.data
  const comments = commentsResult.data || []
  const tags = tagsResult.data || []
  const states = statesResult.data || []
  const tagGroups = (tagGroupsResult.data || []) as TagGroupWithTags[]

  const category = EXPECTED_CATEGORIES.find(c => c.value === material.expected_category)
  const format = MATERIAL_FORMATS.find(f => f.value === material.format)
  const FormatIcon = formatIcons[material.format]
  const state = material.analysis_state

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Agrupar etiquetas por grupo para mostrarlas organizadas
  const tagsByGroup = tagGroups.map(group => ({
    group,
    tags: tags.filter(tag => tag.group_id === group.id),
  })).filter(g => g.tags.length > 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/materials" className="hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm">Volver a materiales</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{material.source}</h1>
          {material.subcategory && (
            <p className="text-muted-foreground">{material.subcategory}</p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir URL
            </Button>
          </a>
          <AnalysisButton
            material={material as Material}
            states={states}
            tagGroups={tagGroups}
          />
        </div>
      </div>

      {/* Estado y categoría */}
      <div className="flex flex-wrap gap-3">
        {state && (
          <Badge color={state.color} className="text-sm px-3 py-1">
            {state.name}
          </Badge>
        )}
        <Badge color={category?.color} className="text-sm px-3 py-1">
          {category?.label}
        </Badge>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FormatIcon className="h-4 w-4" />
          <span className="text-sm capitalize">{format?.label || material.format}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Descripción */}
          {material.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{material.description}</p>
              </CardContent>
            </Card>
          )}

          {/* URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">URL del Material</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {material.url}
              </a>
            </CardContent>
          </Card>

          {/* Comentarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Historial de Análisis
                <span className="text-muted-foreground font-normal">
                  ({comments.length} comentario{comments.length !== 1 ? 's' : ''})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                <CommentHistory comments={comments} maxHeight="none" />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay comentarios de análisis aún.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Etiquetas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Etiquetas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tagsByGroup.length > 0 ? (
                <div className="space-y-4">
                  {tagsByGroup.map(({ group, tags: groupTags }) => (
                    <div key={group.id} className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {group.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groupTags.map(tag => (
                          <TagChip key={tag.id} tag={tag} size="sm" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin etiquetas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Creado</p>
                  <p>{formatDate(material.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Última actualización</p>
                  <p>{formatDate(material.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas legacy (si existen) */}
          {material.analysis_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-amber-600">
                  Notas Antiguas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  (Migradas del sistema anterior)
                </p>
                <p className="text-sm whitespace-pre-wrap">{material.analysis_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
