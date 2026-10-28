import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Icon } from './Icon'
import { cn } from '../../utils'

type Tone = 'info' | 'success' | 'danger'

interface ToastItem {
  id: number
  message: string
  tone: Tone
}

interface ToastValue {
  toast: (message: string, tone?: Tone) => void
}

const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<number[]>([])

  const toast = useCallback((message: string, tone: Tone = 'info') => {
    counter.current += 1
    const id = counter.current
    setItems((current) => [...current.slice(-2), { id, message, tone }])
    const timer = window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 3600)
    timers.current.push(timer)
  }, [])

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
        role="status"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'animate-in pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-float',
              item.tone === 'success' && 'border-success/25 bg-surface text-ink',
              item.tone === 'danger' && 'border-danger/25 bg-surface text-ink',
              item.tone === 'info' && 'border-line bg-surface text-ink',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                item.tone === 'success' && 'bg-success-soft text-success',
                item.tone === 'danger' && 'bg-danger-soft text-danger',
                item.tone === 'info' && 'bg-accent-soft text-accent-ink',
              )}
            >
              <Icon
                name={item.tone === 'success' ? 'check' : item.tone === 'danger' ? 'alert' : 'info'}
                size={14}
              />
            </span>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('ToastProvider не найден')
  return value
}
