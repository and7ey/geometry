import type { ReactNode } from 'react'
import { cn } from '../../utils'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: ReactNode
  hint?: string
  disabled?: boolean
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  size = 'md',
}: {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg font-medium transition-colors disabled:opacity-40',
              size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-[0.8125rem]',
              active
                ? 'bg-surface text-ink shadow-sm ring-1 ring-line'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:bg-surface-2 disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{description}</span>}
      </span>
      <span
        className={cn(
          'mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors',
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-surface shadow-sm transition-transform',
            checked ? 'translate-x-[1.15rem]' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}
