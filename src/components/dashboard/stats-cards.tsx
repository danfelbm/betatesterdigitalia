import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileStack, FileText, Image, Video } from 'lucide-react'

interface StatsCardsProps {
  total: number
  byCategory: Record<string, number>
  byFormat: Record<string, number>
}

export function StatsCards({ total, byFormat }: StatsCardsProps) {
  const formatIcons = {
    texto: FileText,
    imagen: Image,
    video: Video,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Materiales</CardTitle>
          <FileStack className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            URLs en el repositorio
          </p>
        </CardContent>
      </Card>

      {Object.entries(formatIcons).map(([format, Icon]) => (
        <Card key={format}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium capitalize">{format}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{byFormat[format] || 0}</div>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? Math.round(((byFormat[format] || 0) / total) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
