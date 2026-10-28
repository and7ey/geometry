import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils'

export function Card({
  as: Tag = 'div',
  padding = true,
  className,
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'article' | 'li'
  padding?: boolean
  className?: string
  children: ReactNode
} & HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn(
        'rounded-card border border-line bg-surface shadow-card',
        padding && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export type ChipTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'outline'

const chipTones: Record<ChipTone, string> = {
  neutral: 'bg-surface-2 text-ink-2 border-transparent',
  accent: 'bg-accent-soft text-accent-ink border-accent/15',
  success: 'bg-success-soft text-success border-success/20',
  warn: 'bg-warn-soft text-warn border-warn/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  outline: 'bg-transparent text-ink-2 border-line',
}

export function Chip({
  tone = 'neutral',
  size = 'md',
  className,
  children,
  icon,
}: {
  tone?: ChipTone
  size?: 'sm' | 'md'
  className?: string
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none',
        size === 'sm' ? 'px-2 py-1 text-[0.6875rem]' : 'px-2.5 py-1.5 text-xs',
        chipTones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
