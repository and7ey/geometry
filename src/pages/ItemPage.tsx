import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../app/store'
import { Button, Card, Chip, EmptyState, Icon, ProgressBar } from '../components/ui'
import { ItemDetail } from '../components/ItemDetail'
import { getItem, getTopic } from '../content'
import { getStatus, itemAccuracy, masteryProgress } from '../services/scheduling'
import { createSession } from '../services/session'
import { saveActiveSession } from '../services/storage'
import { StatusChip } from '../components/ItemBits'
import { formatDate, formatPercent } from '../utils'
import { useToast } from '../components/ui'
import { ITEMS } from '../content'

export function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, settings, markViewed, markLearned, toggleFavorite } = useStore()
  const { toast } = useToast()
  const item = id ? getItem(id) : undefined

  useEffect(() => {
    if (item) markViewed(item.id)
  }, [item, markViewed])

  if (!item) {
    return (
      <EmptyState
        icon="search"
        title="Элемент не найден"
        description="Возможно, ссылка устарела. Откройте справочник и найдите нужную формулировку."
        action={
          <Button onClick={() => navigate('/reference')} iconLeft={<Icon name="book" size={16} />}>
            В справочник
          </Button>
        }
      />
    )
  }

  const progress = state.progress[item.id]
  const topic = getTopic(item.topicId)
  const status = getStatus(progress)
  const learned = Boolean(progress?.learnedAt)
  const favorite = Boolean(progress?.favorite)
  const topicItems = ITEMS.filter((candidate) => candidate.topicId === item.topicId)
  const index = topicItems.findIndex((candidate) => candidate.id === item.id)
  const previous = index > 0 ? topicItems[index - 1] : undefined
  const next = index >= 0 && index < topicItems.length - 1 ? topicItems[index + 1] : undefined

  const start = (kind: 'flashcards' | 'recall') => {
    const session = createSession(kind, settings, state.progress, {
      itemIds: [item.id],
      count: 1,
      topicId: item.topicId,
      topicTitle: item.title,
    })
    saveActiveSession(session)
    navigate('/session')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <Link to="/reference" className="inline-flex items-center gap-1 hover:text-ink-2">
          <Icon name="arrow-left" size={14} /> Справочник
        </Link>
        {topic && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/route/${topic.id}`} className="hover:text-ink-2">
              {topic.title}
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Card className="p-5 sm:p-7">
          <ItemDetail
            item={item}
            learned={learned}
            favorite={favorite}
            onLearn={() => {
              markLearned(item.id)
              toast('Отмечено как изученное.', 'success')
            }}
            onFavorite={() => toggleFavorite(item.id)}
          />
        </Card>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Прогресс</span>
              <StatusChip status={status} />
            </div>
            <div className="mt-3">
              <ProgressBar value={masteryProgress(progress)} />
              <div className="mt-1.5 flex justify-between text-[0.6875rem] text-ink-3">
                <span>уровень {progress?.level ?? 0} из 6</span>
                <span>{Math.round(masteryProgress(progress) * 100)}%</span>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-3">Точность</dt>
                <dd className="text-ink-2">{formatPercent(itemAccuracy(progress))}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-3">Попыток</dt>
                <dd className="text-ink-2">{progress?.attempts ?? 0}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-3">Повторить</dt>
                <dd className="text-ink-2">
                  {progress?.due ? formatDate(progress.due) : 'ещё не назначено'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-3">Воспр. / понимание</dt>
                <dd className="text-ink-2">
                  {progress?.recallSuccesses ?? 0} / {progress?.understandSuccesses ?? 0}
                </dd>
              </div>
            </dl>
            <div className="mt-4 space-y-2">
              <Button full size="sm" onClick={() => start('flashcards')} iconLeft={<Icon name="layers" size={15} />}>
                Карточка
              </Button>
              <Button
                full
                size="sm"
                variant="secondary"
                onClick={() => start('recall')}
                iconLeft={<Icon name="edit" size={15} />}
              >
                Сформулировать
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Тема</div>
            <div className="mt-1.5 text-sm font-medium">{topic?.title ?? 'Без темы'}</div>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">{topic?.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone="outline" size="sm">
                {item.grade} класс
              </Chip>
              <Chip tone="outline" size="sm">
                Сложность {item.difficulty}
              </Chip>
            </div>
            <Link
              to={`/route/${item.topicId}`}
              className="mt-4 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-accent/30 hover:text-accent-ink"
            >
              Маршрут по теме
              <Icon name="chevron-right" size={14} />
            </Link>
          </Card>

          <div className="flex gap-2">
            {previous && (
              <Link
                to={`/item/${previous.id}`}
                className="flex flex-1 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-ink-3 hover:text-ink-2"
                title={previous.title}
              >
                <Icon name="chevron-left" size={14} /> Назад
              </Link>
            )}
            {next && (
              <Link
                to={`/item/${next.id}`}
                className="flex flex-1 items-center justify-end gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-ink-3 hover:text-ink-2"
                title={next.title}
              >
                Далее <Icon name="chevron-right" size={14} />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
