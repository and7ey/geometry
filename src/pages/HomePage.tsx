import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../app/store'
import { Button, Card, Chip, Icon, InfoNote, ProgressBar, Ring, SectionTitle, StatCard } from '../components/ui'
import { ActivityChart } from '../components/Charts'
import { createSession } from '../services/session'
import { loadActiveSession, saveActiveSession } from '../services/storage'
import { TOPIC_BY_ID } from '../content'
import { formatDuration, itemsLabel } from '../utils'
import { useToast } from '../components/ui'
import type { Settings } from '../types'

function HeroArt() {
  return (
    <svg viewBox="0 0 360 260" className="h-full w-full" aria-hidden="true">
      <g opacity="0.5">
        <circle cx="250" cy="120" r="86" className="fill-none stroke-[var(--line-strong)]" strokeWidth="1.2" />
        <circle cx="250" cy="120" r="58" className="fill-none stroke-[var(--line-strong)]" strokeWidth="1" strokeDasharray="3 5" />
      </g>
      <path d="M88 214 170 52l82 162H88Z" className="fill-none stroke-[var(--ink-2)]" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M170 52v162" className="stroke-[var(--line-strong)]" strokeWidth="1" strokeDasharray="4 5" />
      <path d="M132 133a38 38 0 0 0 38 38" className="fill-none stroke-[var(--accent)]" strokeWidth="2" />
      <path d="M170 171a38 38 0 0 0 38-38" className="fill-none stroke-[var(--accent)]" strokeWidth="2" opacity="0.45" />
      <circle cx="170" cy="171" r="3" className="fill-[var(--accent)]" />
      <circle cx="250" cy="120" r="4" className="fill-[var(--accent)]" />
      <path d="m250 120 52-30" className="stroke-[var(--accent)]" strokeWidth="1.8" />
      <path d="M302 90a36 36 0 0 0 0 60" className="fill-none stroke-[var(--accent)]" strokeWidth="1.6" opacity="0.5" />
      <circle cx="74" cy="64" r="5" className="fill-[var(--ink-2)]" />
      <circle cx="316" cy="206" r="4" className="fill-[var(--accent)]" />
      <path d="M74 64 88 214M74 64l-38 106" className="stroke-[var(--line-strong)]" strokeWidth="1" strokeDasharray="3 5" />
    </svg>
  )
}

export function HomePage() {
  const { settings, overview, state, updateSettings } = useStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const today = Math.min(1, overview.todayReviews / overview.dailyGoal)
  const activeSession = loadActiveSession()

  const continueLearning = () => {
    navigate(activeSession ? '/session' : '/setup')
  }

  const startDue = () => {
    const next: Settings = {
      ...settings,
      mode: 'flashcards',
      itemFilter: 'due',
      count: 20,
      excludeMastered: false,
      onboarded: true,
    }
    updateSettings({ mode: next.mode, itemFilter: 'due', count: 20, excludeMastered: false, onboarded: true })
    const session = createSession('flashcards', next, state.progress)
    if (session.itemIds.length === 0) {
      toast('На сегодня повторений нет. Можно начать новую тему.', 'info')
      navigate('/setup')
      return
    }
    saveActiveSession(session)
    navigate('/session')
  }

  const startErrors = () => {
    const next: Settings = { ...settings, mode: 'review', itemFilter: 'errors', onboarded: true }
    updateSettings({ mode: 'review', itemFilter: 'errors', onboarded: true })
    const session = createSession('review', next, state.progress)
    if (session.questions.length === 0) {
      toast('Ошибок пока нет — отличный результат.', 'success')
      navigate('/setup')
      return
    }
    saveActiveSession(session)
    navigate('/session')
  }

  const weakestTopics = [...overview.byTopic]
    .filter((row) => row.total > 0)
    .sort((a, b) => a.mastered / a.total - b.mastered / b.total || b.total - a.total)
    .slice(0, 3)

  return (
    <div className="space-y-8">
      {!settings.onboarded && (
        <InfoNote tone="info" title="Первый запуск" icon="sparkles">
          Настройте первое занятие: класс, сложность, типы материалов и темы. GeoMaster запомнит выбор, а прогресс
          сохранит в этом браузере.{' '}
          <Link to="/setup" className="font-medium text-accent-ink underline decoration-accent/40 underline-offset-2">
            Настроить занятие
          </Link>
        </InfoNote>
      )}

      <section className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
        <div className="paper-grid grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="accent" size="sm">
                учебник-тренажёр
              </Chip>
              <Chip tone="outline" size="sm">
                7–8 класс
              </Chip>
              <Chip tone="outline" size="sm">
                {overview.total} элементов
              </Chip>
            </div>
            <h1 className="mt-4 max-w-xl text-[1.9rem] leading-[1.08] sm:text-[2.6rem]">
              Геометрия, которую вы действительно помните
            </h1>
            <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-ink-2">
              Определения, свойства, признаки и теоремы — на карточках, в свободном воспроизведении и в тестах.
              Интервальное повторение возвращает к слабому в нужный момент.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button size="lg" onClick={() => navigate('/setup')} iconLeft={<Icon name="play" size={17} />}>
                Начать тренировку
              </Button>
              {overview.due > 0 && (
                <Button size="lg" variant="secondary" onClick={startDue} iconLeft={<Icon name="refresh" size={17} />}>
                  Повторить {overview.due}
                </Button>
              )}
              {overview.due === 0 && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/reference')}
                  iconLeft={<Icon name="book" size={17} />}
                >
                  Открыть справочник
                </Button>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="lock" size={14} /> данные остаются в браузере
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="target" size={14} /> цель — {overview.dailyGoal} повторений в день
              </span>
            </div>
          </div>
          <div className="relative hidden min-h-[280px] items-center justify-center p-4 lg:flex">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Освоено"
          value={`${overview.mastered} / ${overview.total}`}
          hint={`${overview.learned} изучено · ${overview.viewed} просмотрено`}
          icon="graduation"
          tone="success"
        />
        <StatCard
          label="Повторить сегодня"
          value={overview.due}
          hint={overview.due > 0 ? 'уже ждут в очереди' : 'очередь на сегодня пуста'}
          icon="refresh"
          tone={overview.due > 0 ? 'accent' : 'neutral'}
        />
        <StatCard
          label="Требуют внимания"
          value={overview.errors}
          hint={overview.errors > 0 ? 'ошибки и ответы с подсказкой' : 'ошибок нет'}
          icon="alert"
          tone={overview.errors > 0 ? 'danger' : 'neutral'}
        />
        <StatCard
          label="Серия"
          value={`${overview.streak} дн.`}
          hint={`лучшая — ${overview.bestStreak} · ${formatDuration(overview.timeMs)} всего`}
          icon="flame"
          tone="warn"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="flex items-center gap-5">
            <Ring value={today} size={92} stroke={7}>
              <span className="font-serif text-xl text-ink">{overview.todayReviews}</span>
              <span className="text-[0.625rem] text-ink-3">из {overview.dailyGoal}</span>
            </Ring>
            <div className="min-w-0">
              <h2 className="text-lg">Сегодня</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                {overview.todayReviews === 0
                  ? 'Ещё нет повторений. Десять минут — и день засчитан.'
                  : overview.todayReviews >= overview.dailyGoal
                    ? 'Дневная цель выполнена. Можно остановиться или продолжить.'
                    : `Осталось ${overview.dailyGoal - overview.todayReviews} до цели.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={continueLearning}>
                  {activeSession ? 'Продолжить занятие' : 'Продолжить'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/stats')}>
                  Статистика
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium text-ink-2">Активность за 14 дней</span>
              <span className="text-[0.6875rem] text-ink-3">{overview.sessions} занятий</span>
            </div>
            <ActivityChart days={overview.activity} />
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={startDue}
            className="group flex flex-col items-start rounded-card border border-line bg-surface p-5 text-left transition-colors hover:border-accent/35"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
              <Icon name="refresh" size={18} />
            </span>
            <span className="mt-3 text-sm font-semibold">Повторить на сегодня</span>
            <span className="mt-1 text-xs leading-relaxed text-ink-3">
              {overview.due > 0 ? `${overview.due} материалов ждут повторения` : 'Очередь пуста — можно учить новое'}
            </span>
            <span className="mt-auto pt-4 text-xs font-medium text-accent-ink opacity-0 transition-opacity group-hover:opacity-100">
              Начать →
            </span>
          </button>
          <button
            type="button"
            onClick={startErrors}
            className="group flex flex-col items-start rounded-card border border-line bg-surface p-5 text-left transition-colors hover:border-danger/35"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-soft text-danger">
              <Icon name="alert" size={18} />
            </span>
            <span className="mt-3 text-sm font-semibold">Работа над ошибками</span>
            <span className="mt-1 text-xs leading-relaxed text-ink-3">
              {overview.errors > 0 ? `${overview.errors} материалов требуют внимания` : 'Пока ошибок нет'}
            </span>
            <span className="mt-auto pt-4 text-xs font-medium text-danger opacity-0 transition-opacity group-hover:opacity-100">
              Разобрать →
            </span>
          </button>
          <Link
            to="/setup"
            className="group flex flex-col items-start rounded-card border border-line bg-surface p-5 transition-colors hover:border-accent/35"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
              <Icon name="filter" size={18} />
            </span>
            <span className="mt-3 text-sm font-semibold">Выбрать темы</span>
            <span className="mt-1 text-xs leading-relaxed text-ink-3">
              21 тема, 7 типов материала, три уровня сложности
            </span>
            <span className="mt-auto pt-4 text-xs font-medium text-accent-ink opacity-0 transition-opacity group-hover:opacity-100">
              Настроить →
            </span>
          </Link>
          <Link
            to="/stats"
            className="group flex flex-col items-start rounded-card border border-line bg-surface p-5 transition-colors hover:border-accent/35"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
              <Icon name="chart" size={18} />
            </span>
            <span className="mt-3 text-sm font-semibold">Статистика</span>
            <span className="mt-1 text-xs leading-relaxed text-ink-3">
              Точность {overview.accuracy === null ? '—' : `${Math.round(overview.accuracy * 100)}%`} · воспроизведение
              и понимание отдельно
            </span>
            <span className="mt-auto pt-4 text-xs font-medium text-accent-ink opacity-0 transition-opacity group-hover:opacity-100">
              Открыть →
            </span>
          </Link>
        </div>
      </section>

      <section>
        <SectionTitle
          hint="последовательный маршрут по теме"
          action={
            <Link to="/reference" className="text-xs font-medium text-accent-ink hover:underline">
              Все темы
            </Link>
          }
        >
          Выучить тему целиком
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          {weakestTopics.map((row) => {
            const topic = TOPIC_BY_ID.get(row.topic.id)
            if (!topic) return null
            const percent = row.total > 0 ? row.mastered / row.total : 0
            return (
              <Link
                key={topic.id}
                to={`/route/${topic.id}`}
                className="group rounded-card border border-line bg-surface p-4 transition-colors hover:border-accent/35"
              >
                <div className="flex items-center justify-between gap-2">
                  <Chip tone="outline" size="sm">
                    {topic.grade} класс
                  </Chip>
                  <Icon name="route" size={15} className="text-ink-3" />
                </div>
                <h3 className="mt-2 text-[0.9375rem] font-semibold group-hover:text-accent-ink">{topic.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">{itemsLabel(row.total)} · {row.learned} изучено</p>
                <div className="mt-3">
                  <ProgressBar value={percent} size="sm" />
                  <div className="mt-1.5 flex justify-between text-[0.6875rem] text-ink-3">
                    <span>{Math.round(percent * 100)}% освоено</span>
                    <span>Маршрут →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="rounded-panel border border-line bg-surface p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: 'book' as const, title: 'Поймите', text: 'Определения, условия теорем, примеры и типичные ошибки — в одном месте.' },
            { icon: 'layers' as const, title: 'Повторите', text: 'Карточки с честной самооценкой и интервалами 1–3–7–14–30 дней.' },
            { icon: 'target' as const, title: 'Проверьте', text: 'Тесты и свободное воспроизведение показывают, где знание ещё шаткое.' },
          ].map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-2">
                <Icon name={step.icon} size={17} />
              </span>
              <div>
                <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  Шаг {index + 1}
                </div>
                <h3 className="mt-0.5 text-base">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
