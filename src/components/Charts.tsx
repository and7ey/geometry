import { cn } from '../utils'
import type { ActivityDay } from '../services/statistics'

export function ActivityChart({ days }: { days: ActivityDay[] }) {
  const max = Math.max(4, ...days.map((day) => day.reviews))
  return (
    <div>
      <div className="flex h-28 items-end gap-1.5 sm:gap-2" role="img" aria-label="Активность за две недели">
        {days.map((day) => {
          const height = day.reviews === 0 ? 3 : Math.max(8, Math.round((day.reviews / max) * 96))
          const tone =
            day.accuracy === null
              ? 'bg-surface-3'
              : day.accuracy >= 0.8
                ? 'bg-success'
                : day.accuracy >= 0.5
                  ? 'bg-accent'
                  : 'bg-warn'
          return (
            <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div
                className="flex w-full flex-1 items-end"
                title={`${day.key}: ${day.reviews} повторений${day.accuracy === null ? '' : `, ${Math.round(day.accuracy * 100)}% верно`}`}
              >
                <div
                  className={cn('w-full rounded-t-[4px] transition-[height] duration-500', tone, day.reviews === 0 && 'opacity-60')}
                  style={{ height: `${height}px` }}
                />
              </div>
              <span className="text-[0.625rem] text-ink-3">{day.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AccuracyBars({
  rows,
}: {
  rows: { label: string; value: number | null; meta?: string }[]
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-2">{row.label}</span>
            <span className="shrink-0 tabular-nums text-xs text-ink-3">
              {row.value === null ? 'нет данных' : `${Math.round(row.value * 100)}%`}
              {row.meta && <span className="ml-1.5">{row.meta}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                row.value === null
                  ? 'bg-surface-3'
                  : row.value >= 0.8
                    ? 'bg-success'
                    : row.value >= 0.55
                      ? 'bg-accent'
                      : 'bg-warn',
              )}
              style={{ width: `${Math.round((row.value ?? 0) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TopicMasteryBars({
  rows,
  limit = 8,
}: {
  rows: { label: string; percent: number; meta?: string }[]
  limit?: number
}) {
  return (
    <div className="space-y-3">
      {rows.slice(0, limit).map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-2">{row.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-ink-3">
              {Math.round(row.percent * 100)}%
              {row.meta && <span className="ml-1.5">{row.meta}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${Math.round(row.percent * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
