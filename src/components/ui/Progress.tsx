import { cn } from '../../utils'

export function ProgressBar({
  value,
  tone = 'accent',
  size = 'md',
  className,
  label,
}: {
  value: number
  tone?: 'accent' | 'success' | 'warn' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}) {
  const toneClass = {
    accent: 'bg-accent',
    success: 'bg-success',
    warn: 'bg-warn',
    danger: 'bg-danger',
  }[tone]
  const height = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }[size]
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-3', height, className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', toneClass)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function Ring({
  value,
  size = 76,
  stroke = 6,
  tone = 'accent',
  children,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: 'accent' | 'success' | 'warn' | 'danger'
  children?: React.ReactNode
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, value))
  const toneClass = {
    accent: 'text-accent',
    success: 'text-success',
    warn: 'text-warn',
    danger: 'text-danger',
  }[tone]
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn('transition-[stroke-dashoffset] duration-700', toneClass)}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  )
}
