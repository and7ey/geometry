import { Link } from 'react-router-dom'
import { cn } from '../utils'

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="GeoMaster — на главную"
    >
      <svg width="34" height="34" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="16" fill="var(--accent)" />
        <path d="M15 47 31 17l16 30H15Z" stroke="var(--on-accent)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="31" cy="33" r="7.5" stroke="var(--on-accent)" strokeWidth="3" />
        <path d="M31 25.5v15M23.5 33h15" stroke="var(--on-accent)" strokeWidth="2" opacity=".55" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-serif text-[1.15rem] font-semibold tracking-tight text-ink">GeoMaster</span>
          <span className="mt-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ink-3">
            геометрия 7–8
          </span>
        </span>
      )}
    </Link>
  )
}
