import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { Icon } from './ui'
import { useStore } from '../app/store'
import { cn } from '../utils'
import type { ThemePreference } from '../types'

const navItems = [
  { to: '/', label: 'Главная', icon: 'home' as const, end: true },
  { to: '/setup', label: 'Тренажёр', icon: 'sliders' as const },
  { to: '/reference', label: 'Справочник', icon: 'book' as const },
  { to: '/stats', label: 'Статистика', icon: 'chart' as const },
]

const themeOrder: ThemePreference[] = ['system', 'light', 'dark']

function ThemeToggle() {
  const { settings, updateSettings } = useStore()
  const theme = settings.theme
  const icon = theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'
  const label =
    theme === 'light' ? 'Светлая тема' : theme === 'dark' ? 'Тёмная тема' : 'Как в системе'
  const next = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]
  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: next })}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      title={`${label}. Переключить на «${next === 'system' ? 'как в системе' : next === 'light' ? 'светлую' : 'тёмную'}»`}
      aria-label={`Тема: ${label}. Переключить`}
    >
      <Icon name={icon} size={15} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  )
}

export function Header() {
  const { overview } = useStore()
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Основная навигация">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors',
                  isActive ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          {overview.streak > 0 && (
            <span
              className="hidden items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-medium text-ink-2 sm:flex"
              title={`Серия занятий: ${overview.streak}`}
            >
              <Icon name="flame" size={14} className="text-warn" />
              {overview.streak}
            </span>
          )}
          <ThemeToggle />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink',
                isActive && 'bg-surface text-ink',
              )
            }
            aria-label="Настройки"
            title="Настройки"
          >
            <Icon name="settings" size={16} />
          </NavLink>
        </div>
      </div>
    </header>
  )
}

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Мобильная навигация"
    >
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-ink-3',
              )
            }
          >
            <Icon name={item.icon} size={19} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
