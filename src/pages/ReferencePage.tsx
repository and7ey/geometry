import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../app/store'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  Segmented,
} from '../components/ui'
import { ItemCard } from '../components/ItemCard'
import { CATEGORIES, ITEMS, TOPICS } from '../content'
import { CATEGORY_LABELS, type Category } from '../types'
import { cn } from '../utils'

type GradeFilter = 'all' | '7' | '8'

function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е')
}

export function ReferencePage() {
  const { state } = useStore()
  const [grade, setGrade] = useState<GradeFilter>('all')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return ITEMS.filter((item) => {
      if (grade !== 'all' && String(item.grade) !== grade) return false
      if (category !== 'all' && item.category !== category) return false
      if (favoritesOnly && !state.progress[item.id]?.favorite) return false
      if (!q) return true
      return normalize(
        `${item.title} ${item.statement} ${item.plain} ${item.formula?.expression ?? ''} ${item.source}`,
      ).includes(q)
    })
  }, [grade, category, query, favoritesOnly, state.progress])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const item of filtered) {
      const list = map.get(item.topicId) ?? []
      list.push(item)
      map.set(item.topicId, list)
    }
    return TOPICS.filter((topic) => map.has(topic.id)).map((topic) => ({
      topic,
      items: map.get(topic.id) ?? [],
    }))
  }, [filtered])

  const reset = () => {
    setGrade('all')
    setCategory('all')
    setQuery('')
    setFavoritesOnly(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Учебник"
        title="Справочник"
        description="Все формулировки собраны по темам. Ищите по слову, фильтруйте по классу и типу, открывайте карточку для примеров и типичных ошибок."
        actions={
          <Chip tone="outline">
            {filtered.length} из {ITEMS.length}
          </Chip>
        }
      />

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти: «параллелограмм», «вписанный угол», «Пифагор»…"
              className="h-11 w-full rounded-xl border border-line bg-surface-2/60 pl-10 pr-10 text-sm text-ink placeholder:text-ink-3 focus:border-accent/40 focus:bg-surface focus:outline-none"
              aria-label="Поиск по справочнику"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink"
                aria-label="Очистить поиск"
              >
                <Icon name="x" size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              ariaLabel="Класс"
              value={grade}
              onChange={(value) => setGrade(value)}
              size="sm"
              options={[
                { value: 'all', label: 'Все' },
                { value: '7', label: '7 класс' },
                { value: '8', label: '8 класс' },
              ]}
            />
            <button
              type="button"
              onClick={() => setFavoritesOnly((value) => !value)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
                favoritesOnly
                  ? 'border-warn/35 bg-warn-soft text-warn'
                  : 'border-line bg-surface text-ink-3 hover:text-ink-2',
              )}
              aria-pressed={favoritesOnly}
            >
              <Icon name="star" size={14} />
              Избранное
            </button>
            <button
              type="button"
              onClick={reset}
              className="ml-auto text-xs text-ink-3 hover:text-ink-2 hover:underline"
            >
              Сбросить фильтры
            </button>
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setCategory('all')}
              aria-pressed={category === 'all'}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                category === 'all'
                  ? 'border-accent/30 bg-accent-soft text-accent-ink'
                  : 'border-line bg-surface text-ink-3 hover:text-ink-2',
              )}
            >
              Все типы
            </button>
            {CATEGORIES.map((value) => {
              const active = category === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  aria-pressed={active}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-accent/30 bg-accent-soft text-accent-ink'
                      : 'border-line bg-surface text-ink-3 hover:text-ink-2',
                  )}
                >
                  {CATEGORY_LABELS[value]}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {grouped.length === 0 && (
        <EmptyState
          icon="search"
          title="Ничего не найдено"
          description="Попробуйте другое слово или сбросьте фильтры. В справочнике 155 элементов по 21 теме."
          action={
            <Button variant="secondary" onClick={reset}>
              Сбросить фильтры
            </Button>
          }
        />
      )}

      <div className="space-y-8">
        {grouped.map(({ topic, items }) => (
          <section key={topic.id} className="animate-in">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Chip tone="outline" size="sm">
                    {topic.grade} класс
                  </Chip>
                  <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-ink-3">{topic.section}</span>
                </div>
                <h2 className="mt-1.5 text-xl">{topic.title}</h2>
                <p className="mt-0.5 text-xs text-ink-3">
                  {topic.description} · {items.length} из {ITEMS.filter((item) => item.topicId === topic.id).length}
                </p>
              </div>
              <Link
                to={`/route/${topic.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
              >
                <Icon name="route" size={14} /> Маршрут темы
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} progress={state.progress[item.id]} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
