import { Link } from 'react-router-dom'
import type { Item } from '../types'
import { GRADE_LABELS } from '../types'
import { getRelated, getTopic } from '../content'
import { Button, Chip, Icon } from './ui'
import { CategoryChip, DifficultyChip, FigurePanel } from './ItemBits'

export function ItemDetail({
  item,
  learned,
  favorite,
  onLearn,
  onFavorite,
  compact,
}: {
  item: Item
  learned?: boolean
  favorite?: boolean
  onLearn?: () => void
  onFavorite?: () => void
  compact?: boolean
}) {
  const topic = getTopic(item.topicId)
  const related = getRelated(item)
  return (
    <article className={compact ? '' : 'animate-in'}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="outline" size="sm">
          {GRADE_LABELS[item.grade]}
        </Chip>
        {topic && (
          <Chip tone="neutral" size="sm">
            {topic.title}
          </Chip>
        )}
        <CategoryChip category={item.category} size="sm" />
        <DifficultyChip difficulty={item.difficulty} />
        {item.curriculum === 'extended' && (
          <Chip tone="warn" size="sm">
            Расширение
          </Chip>
        )}
      </div>

      <h1 className="mt-3 text-[1.65rem] leading-tight sm:text-[2rem]">{item.title}</h1>

      <div className={item.figure ? 'mt-5 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start' : 'mt-5'}>
        <div>
          <div className="rounded-xl border border-line bg-surface-2/70 p-4 sm:p-5">
            <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Формулировка
            </div>
            <p className="statement">{item.statement}</p>
            {item.formula && (
              <div className="mt-3 rounded-lg border border-line bg-surface px-4 py-3">
                <div className="font-serif text-lg text-accent-ink">{item.formula.expression}</div>
                <div className="mt-1 text-xs text-ink-3">{item.formula.variables}</div>
              </div>
            )}
          </div>

          <section className="mt-5">
            <h2 className="mb-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-ink-3">
              Простыми словами
            </h2>
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">{item.plain}</p>
          </section>

          {item.theorem && (
            <section className="mt-5 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface p-3.5">
                <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  Условие
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{item.theorem.condition}</p>
              </div>
              <div className="rounded-xl border border-accent/20 bg-accent-soft/50 p-3.5">
                <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-ink">
                  Заключение
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink">{item.theorem.conclusion}</p>
              </div>
              {item.theorem.proofIdea && (
                <div className="rounded-xl border border-line bg-surface p-3.5 sm:col-span-2">
                  <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Идея доказательства
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">{item.theorem.proofIdea}</p>
                </div>
              )}
            </section>
          )}

          <section className="mt-5">
            <h2 className="mb-1.5 text-sm font-semibold uppercase tracking-[0.08em] text-ink-3">Пример</h2>
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">{item.example}</p>
          </section>

          {item.misconceptions.length > 0 && (
            <section className="mt-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-3">
                Типичные ошибки
              </h2>
              <ul className="space-y-2">
                {item.misconceptions.map((mistake) => (
                  <li key={mistake} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
                    <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {item.figure && (
          <div className="lg:sticky lg:top-20">
            <FigurePanel figure={item.figure} showNote />
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-6 border-t border-line pt-5">
          <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-ink-3">
            Связанные элементы
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/item/${candidate.id}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-2 transition-colors hover:border-accent/30 hover:text-ink"
              >
                <span className="truncate">{candidate.title}</span>
                <Icon name="chevron-right" size={13} className="shrink-0 text-ink-3" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <span>Основание: {item.source}</span>
        <div className="flex flex-wrap gap-2">
          {onFavorite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFavorite}
              iconLeft={<Icon name="star" size={15} className={favorite ? 'text-warn' : ''} />}
            >
              {favorite ? 'В избранном' : 'В избранное'}
            </Button>
          )}
          {onLearn && (
            <Button
              variant={learned ? 'secondary' : 'primary'}
              size="sm"
              onClick={onLearn}
              iconLeft={<Icon name={learned ? 'check' : 'graduation'} size={15} />}
            >
              {learned ? 'Изучено' : 'Отметить изученным'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
