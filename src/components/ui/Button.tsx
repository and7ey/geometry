import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft' | 'success'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover shadow-sm border border-transparent',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-2 hover:border-line-strong',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink border border-transparent',
  danger: 'bg-danger text-on-accent hover:opacity-90 border border-transparent shadow-sm',
  dangerSoft: 'bg-danger-soft text-danger border border-danger/25 hover:border-danger/45',
  success: 'bg-success text-on-accent hover:opacity-90 border border-transparent shadow-sm',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[0.8125rem] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[0.9375rem] gap-2.5 rounded-xl',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconLeft?: ReactNode
  iconRight?: ReactNode
  full?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  full,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-[background-color,border-color,color,opacity,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}
