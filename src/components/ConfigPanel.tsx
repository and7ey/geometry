import type { Category, Difficulty } from '../types'
import { CATEGORIES, ITEMS, SECTIONS, countByCategory } from '../content'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, FILTER_LABELS } from '../types'
import { Button, Chip, Icon, Segmented } from './ui'
import { cn } from '../utils'
import { useStore } from '../app/store'
import { countByTopic } from '../content'
import { filterCounts, type StudyFilters } from '../services/filters'
import { useMemo } from 'react'

const MODES = [
  {
    value: 'study' as const,
    label: 'Изучение',
    description: 'Разобрать формулировки и примеры',
    icon: 'book' as const,
  },
  {
    value: 'flashcards' as const,
    label: 'Карточки',
    description: 'Вспомнить и честно оценить себя',
    icon: 'layers' as const,
  },
  {
    value: 'recall' as const,
    label: 'Воспроизведение',
    description: 'Сформулировать по памяти',
    icon: 'edit' as const,
  },
  {
    value: 'quiz' as const,
    label: 'Тест',
    description: 'Проверка с разбором ошибок',
    icon: 'list' as const,
  },
  {
    value: 'exam' as const,
    label: 'Экзамен',
    description: 'Без подсказок, итог в конце',
    icon: 'flag' as const,
  },
  {
    value: 'review' as const,
    label: 'Ошибки',
    description: 'Слабое — в первую очередь',
    icon: 'refresh' as const,
  },
]

const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  1: 'Базовые определения и простое узнавание',
  2: 'Формулировки, сравнение и применение',
  3: 'Тонкие различия, обратные теоремы, задачи',
}

export function ConfigPanel({ onStart, startLabel }: { onStart: () => void; startLabel?: string }) {
  const { settings, updateSettings, state } = useStore()
  const now = Date.now()

  const baseFilters: StudyFilters = useMemo(
    () => ({
      grades: settings.grades,
      difficulty: settings.difficulty,
      categories: settings.categories,
      topicIds: settings.topicIds,
      itemFilter: 'all',
      excludeMastered: settings.excludeMastered,
    }),
    [settings],
  )
  const counts = useMemo(
    () => filterCounts(ITEMS, baseFilters, state.progress, now),
    [baseFilters, state.progress, now],
  )
  const available = useMemo(() => {
    const filters: StudyFilters = { ...baseFilters, itemFilter: settings.itemFilter }
    return filterCounts(ITEMS, filters, state.progress, now)[settings.itemFilter]
  }, [baseFilters, settings.itemFilter, state.progress, now])

  const gradeMode = settings.grades.length === 2 ? 'both' : String(settings.grades[0] ?? 7)
  const allTopicIds = ITEMS.filter((item) => settings.grades.includes(item.grade)).map((item) => item.topicId)
  const selectedTopics = settings.topicIds.length > 0 ? settings.topicIds : Array.from(new Set(allTopicIds))
  const selectedTopicSet = new Set(selectedTopics)

  const toggleCategory = (category: Category) => {
    const active = settings.categories.includes(category)
    if (active && settings.categories.length === 1) return
    updateSettings({
      categories: active
        ? settings.categories.filter((value) => value !== category)
        : [...settings.categories, category],
    })
  }

  const toggleTopic = (topicId: string) => {
    const next = selectedTopicSet.has(topicId)
      ? selectedTopics.filter((value) => value !== topicId)
      : [...selectedTopics, topicId]
    if (next.length === 0) return
    const allSelected = allTopicIds.every((id) => next.includes(id)) && next.length === new Set(allTopicIds).size
    updateSettings({ topicIds: allSelected ? [] : next })
  }

  const resetFilters = () => {
    updateSettings({
      difficulty: 2,
      categories: [...CATEGORIES],
      topicIds: [],
      count: 10,
      itemFilter: 'all',
      excludeMastered: false,
    })
  }

  const setGrade = (value: string) => {
    const grades = value === 'both' ? ([7, 8] as const) : ([Number(value) as 7 | 8] as const)
    const allowed = ITEMS.filter((item) => (grades as readonly number[]).includes(item.grade)).map((item) => item.topicId)
    const nextTopics = settings.topicIds.filter((id) => allowed.includes(id))
    updateSettings({
      grades: [...grades],
      topicIds: nextTopics.length === new Set(allowed).size ? [] : nextTopics,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Режим</h2>
          <span className="text-xs text-ink-3">Что будем делать</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode) => {
            const active = settings.mode === mode.value
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => updateSettings({ mode: mode.value })}
                className={cn(
                  'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
                  active
                    ? 'border-accent/45 bg-accent-soft/60 ring-1 ring-accent/20'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                )}
                aria-pressed={active}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink-3',
                  )}
                >
                  <Icon name={mode.icon} size={16} />
                </span>
                <span>
                  <span className="block text-[0.8125rem] font-semibold text-ink">{mode.label}</span>
                  <span className="mt-0.5 block text-[0.6875rem] leading-relaxed text-ink-3">
                    {mode.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Класс</h2>
          </div>
          <Segmented
            ariaLabel="Класс"
            value={gradeMode}
            onChange={setGrade}
            options={[
              { value: '7', label: '7 класс' },
              { value: '8', label: '8 класс' },
              { value: 'both', label: '7 и 8' },
            ]}
            className="w-full"
          />
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Количество</h2>
            <span className="text-xs text-ink-3">за занятие</span>
          </div>
          <Segmented
            ariaLabel="Количество заданий"
            value={String(settings.count)}
            onChange={(value) =>
              updateSettings({ count: value === 'all' ? 'all' : (Number(value) as 5 | 10 | 20 | 30) })
            }
            options={[
              { value: '5', label: '5' },
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '30', label: '30' },
              { value: 'all', label: 'Все' },
            ]}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Сложность</h2>
          <span className="text-xs text-ink-3">учитывает и материал, и тип проверки</span>
        </div>
        <Segmented
          ariaLabel="Сложность"
          value={String(settings.difficulty)}
          onChange={(value) => updateSettings({ difficulty: Number(value) as Difficulty })}
          options={([1, 2, 3] as Difficulty[]).map((difficulty) => ({
            value: String(difficulty),
            label: DIFFICULTY_LABELS[difficulty],
            hint: DIFFICULTY_HINTS[difficulty],
          }))}
          className="w-full"
        />
        <p className="mt-1.5 text-xs text-ink-3">{DIFFICULTY_HINTS[settings.difficulty]}</p>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Тип материала</h2>
          <button
            type="button"
            onClick={() => updateSettings({ categories: [...CATEGORIES] })}
            className="text-xs text-accent-ink hover:underline"
          >
            Выбрать всё
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((category) => {
            const active = settings.categories.includes(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(category)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-accent/30 bg-accent-soft text-accent-ink'
                    : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink-2',
                )}
              >
                {active && <Icon name="check" size={12} />}
                {CATEGORY_LABELS[category]}
                <span className={cn('tabular-nums', active ? 'text-accent-ink/70' : 'text-ink-3/70')}>
                  {countByCategory(category)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Темы <span className="font-normal text-ink-3">({selectedTopicSet.size})</span>
          </h2>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => updateSettings({ topicIds: [] })}
              className="text-accent-ink hover:underline"
            >
              Все темы
            </button>
          </div>
        </div>
        <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-line bg-surface p-3 pr-2">
          {SECTIONS.filter((section) => settings.grades.includes(section.grade)).map((section) => (
            <div key={`${section.grade}-${section.section}`}>
              <div className="mb-1.5 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-3">
                <span>{section.grade} класс</span>
                <span className="h-px flex-1 bg-line" />
                <span>{section.section}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {section.topics.map((topic) => {
                  const active = selectedTopicSet.has(topic.id)
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTopic(topic.id)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[0.6875rem] transition-colors',
                        active
                          ? 'border-accent/25 bg-accent-soft/70 text-accent-ink'
                          : 'border-line bg-surface-2/50 text-ink-3 hover:text-ink-2',
                      )}
                    >
                      {topic.title}
                      <span className="tabular-nums opacity-60">{countByTopic(topic.id)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Отбор материалов</h2>
          <span className="text-xs text-ink-3">по прогрессу</span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {(['all', 'new', 'learned', 'errors', 'due'] as const).map((filter) => {
            const active = settings.itemFilter === filter
            const count = counts[filter]
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={active}
                onClick={() => updateSettings({ itemFilter: filter })}
                disabled={count === 0}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:opacity-45',
                  active
                    ? 'border-accent/35 bg-accent-soft/60 text-accent-ink'
                    : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-3.5 w-3.5 items-center justify-center rounded-full border',
                      active ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
                    )}
                  >
                    {active && <Icon name="check" size={9} strokeWidth={3} />}
                  </span>
                  {FILTER_LABELS[filter]}
                </span>
                <span className="tabular-nums opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
        <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs text-ink-2">
          <input
            type="checkbox"
            checked={settings.excludeMastered}
            onChange={(event) => updateSettings({ excludeMastered: event.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Исключить освоенные материалы
        </label>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/60 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <Chip tone={available > 0 ? 'accent' : 'danger'} size="sm">
            {available > 0 ? `${available} доступно` : 'нет материалов'}
          </Chip>
          <span className="text-ink-3">
            {settings.count === 'all' ? 'все подходящие' : `до ${settings.count} за занятие`}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetFilters} iconLeft={<Icon name="refresh" size={14} />}>
            Сбросить
          </Button>
          <Button size="sm" onClick={onStart} disabled={available === 0} iconRight={<Icon name="arrow-right" size={15} />}>
            {startLabel ?? 'Начать'}
          </Button>
        </div>
      </div>
    </div>
  )
}
