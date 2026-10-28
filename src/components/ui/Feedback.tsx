import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { cn } from '../../utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-3">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[1.75rem] leading-tight sm:text-[2.15rem]">{title}</h1>
        {description && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode
  hint?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="flex items-baseline gap-2 text-[1.05rem] font-semibold sm:text-lg">
        {children}
        {hint && <span className="font-ui text-xs font-normal text-ink-3">{hint}</span>}
      </h2>
      {action}
    </div>
  )
}

export function EmptyState({
  icon = 'info',
  title,
  description,
  action,
  compact,
}: {
  icon?: IconName
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface/60 px-6 text-center',
        compact ? 'py-8' : 'py-14',
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-3">
        <Icon name={icon} size={21} />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-2">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

export function InfoNote({
  tone = 'info',
  title,
  children,
  icon,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'success'
  title?: string
  children: ReactNode
  icon?: IconName
}) {
  const defaultIcon: IconName = tone === 'warn' ? 'alert' : tone === 'danger' ? 'alert' : tone === 'success' ? 'check' : 'info'
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border p-3.5 text-sm leading-relaxed',
        tone === 'info' && 'border-accent/15 bg-accent-soft/60 text-ink-2',
        tone === 'warn' && 'border-warn/20 bg-warn-soft/70 text-ink-2',
        tone === 'danger' && 'border-danger/20 bg-danger-soft/70 text-ink-2',
        tone === 'success' && 'border-success/20 bg-success-soft/70 text-ink-2',
      )}
    >
      <Icon
        name={icon ?? defaultIcon}
        size={18}
        className={cn(
          'mt-0.5 shrink-0',
          tone === 'info' && 'text-accent',
          tone === 'warn' && 'text-warn',
          tone === 'danger' && 'text-danger',
          tone === 'success' && 'text-success',
        )}
      />
      <div>
        {title && <div className="mb-0.5 font-medium text-ink">{title}</div>}
        {children}
      </div>
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1.5 font-ui text-[0.6875rem] font-medium text-ink-3 shadow-sm">
      {children}
    </kbd>
  )
}
