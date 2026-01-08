interface ProgressOverviewProps {
  title: string
  data: Record<string, { count: number; color: string }>
}

export function ProgressOverview({ title, data }: ProgressOverviewProps) {
  const total = Object.values(data).reduce((sum, item) => sum + item.count, 0)
  const entries = Object.entries(data)

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold mb-4">{title}</h3>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin datos</p>
      ) : (
        <>
          <div className="flex h-4 overflow-hidden rounded-full bg-muted mb-4">
            {entries.map(([name, { count, color }]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0
              if (percentage === 0) return null
              return (
                <div
                  key={name}
                  className="h-full transition-all"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                  title={`${name}: ${count} (${Math.round(percentage)}%)`}
                />
              )
            })}
          </div>

          <div className="space-y-2">
            {entries.map(([name, { count, color }]) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 text-sm">{name}</span>
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
