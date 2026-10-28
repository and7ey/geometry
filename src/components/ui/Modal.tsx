import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { cn } from '../../utils'

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(8,12,18,0.48)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'animate-in max-h-[92dvh] w-full overflow-y-auto rounded-t-panel border border-line bg-surface p-5 shadow-float outline-none safe-bottom sm:rounded-panel sm:p-6',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-lg',
          size === 'lg' && 'sm:max-w-2xl',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-xl">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-ink-2">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-2 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Закрыть"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
