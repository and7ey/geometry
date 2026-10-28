import type { ReactNode } from 'react'
import { Icon, type IconName } from './ui'
import { cn } from '../utils'

const toneClasses = {
  accent: 'bg-accent-soft text-accent-ink',
  success: 'bg-success-soft text-success',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-surface-2 text-ink-2',
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: IconName
  tone?: keyof typeof toneClasses
  className?: string
}) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</div>
        {icon && (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', toneClasses[tone])}>
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>
      <div className="mt-1.5 font-serif text-[1.65rem] leading-none text-ink sm:text-[1.85rem]">{value}</div>
      {hint && <div className="mt-1.5 text-xs leading-relaxed text-ink-3">{hint}</div>}
    </div>
  )
}
