import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../app/store'
import { Button, Card, Chip, EmptyState, Icon, PageHeader, ProgressBar } from '../components/ui'
import { ITEMS_BY_TOPIC, TOPIC_BY_ID } from '../content'
import { buildRoute } from '../features/route/build'
import { createSession } from '../services/session'
import { saveActiveSession } from '../services/storage'
import { CATEGORY_SHORT, type RouteStage } from '../types'
import { itemsLabel } from '../utils'

const modeLabels: Record<string, string> = {
  study: 'изучение',
  flashcards: 'карточки',
  recall: 'воспроизведение',
  quiz: 'тест',
  exam: 'экзамен',
  review: 'ошибки',
}

export function RoutePage() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { state, settings, resetRoute } = useStore()
  const topic = topicId ? TOPIC_BY_ID.get(topicId) : undefined
  const items = topicId ? (ITEMS_BY_TOPIC.get(topicId) ?? []) : []
  const stages = topicId ? buildRoute(topicId) : []

  if (!topic || stages.length === 0) {
    return (
      <EmptyState
        icon="route"
        title="Маршрут не найден"
        description="Для этой темы пока нет материалов. Откройте справочник и выберите другую тему."
        action={
          <Button onClick={() => navigate('/reference')} iconLeft={<Icon name="book" size={16} />}>
            В справочник
          </Button>
        }
      />
    )
  }

  const route = state.routes[topic.id]
  const done = new Set(route?.done ?? [])
  const firstOpen = stages.findIndex((stage) => !done.has(stage.key))
  const completed = done.size
  const progress = stages.length > 0 ? completed / stages.length : 0
  const nextStage = firstOpen >= 0 ? stages[firstOpen] : stages[0]

  const startStage = (stage: RouteStage, index: number) => {
    const session = createSession(stage.kind, settings, state.progress, {
      topicId: topic.id,
      topicTitle: `${topic.title} · ${stage.title}`,
      categories: stage.categories,
      count: stage.count ?? 10,
      skills: stage.skills,
      difficulty: stage.difficulty ?? settings.difficulty,
      route: { topicId: topic.id, stepKey: stage.key },
    })
    const empty =
      session.kind === 'study' || session.kind === 'flashcards'
        ? session.itemIds.length === 0
        : session.questions.length === 0
    if (empty) return
    saveActiveSession(session)
    navigate('/session')
    void index
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <Link to="/reference" className="inline-flex items-center gap-1 hover:text-ink-2">
          <Icon name="arrow-left" size={14} /> Справочник
        </Link>
        <span aria-hidden="true">/</span>
        <span>{topic.section}</span>
      </div>

      <PageHeader
        eyebrow={`${topic.grade} класс · маршрут темы`}
        title={topic.title}
        description={topic.description}
        actions={
          <Button
            onClick={() => startStage(nextStage, Math.max(0, firstOpen))}
            iconLeft={<Icon name={completed > 0 ? 'play' : 'route'} size={16} />}
          >
            {completed === 0 ? 'Начать маршрут' : completed >= stages.length ? 'Пройти ещё раз' : 'Продолжить'}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Прогресс маршрута</div>
            <div className="mt-0.5 text-xs text-ink-3">
              {completed} из {stages.length} этапов · {itemsLabel(items.length)}
            </div>
          </div>
          {completed > 0 && (
            <button
              type="button"
              onClick={() => resetRoute(topic.id)}
              className="text-xs text-ink-3 hover:text-danger"
            >
              Сбросить маршрут
            </button>
          )}
        </div>
        <ProgressBar value={progress} className="mt-3" />
      </Card>

      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isDone = done.has(stage.key)
          const isCurrent = index === firstOpen
          return (
            <div
              key={stage.key}
              className={`flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center ${
                isCurrent
                  ? 'border-accent/40 bg-accent-soft/35'
                  : isDone
                    ? 'border-line bg-surface-2/40'
                    : 'border-line bg-surface'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  isDone
                    ? 'border-success/30 bg-success-soft text-success'
                    : isCurrent
                      ? 'border-accent bg-accent text-on-accent'
                      : 'border-line bg-surface-2 text-ink-3'
                }`}
              >
                {isDone ? <Icon name="check" size={16} /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[0.9375rem] font-semibold">{stage.title}</h3>
                  <Chip tone="outline" size="sm">
                    {modeLabels[stage.kind] ?? stage.kind}
                  </Chip>
                  <Chip tone="neutral" size="sm">
                    {stage.categories.length === 1
                      ? CATEGORY_SHORT[stage.categories[0]]
                      : 'смешанно'}
                  </Chip>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">{stage.description}</p>
              </div>
              <Button
                size="sm"
                variant={isCurrent ? 'primary' : isDone ? 'ghost' : 'secondary'}
                onClick={() => {
                  if (isDone) {
                    resetRoute(topic.id)
                    return
                  }
                  startStage(stage, index)
                }}
                disabled={isDone}
                iconRight={isDone ? undefined : <Icon name="arrow-right" size={14} />}
              >
                {isDone ? 'Пройдено' : isCurrent ? 'Начать этап' : 'Можно начать'}
              </Button>
            </div>
          )
        })}
      </div>

      <Card className="bg-surface-2/40">
        <div className="flex gap-3">
          <Icon name="lightbulb" size={18} className="mt-0.5 shrink-0 text-warn" />
          <div className="text-xs leading-relaxed text-ink-2">
            <div className="mb-0.5 font-medium text-ink">Как устроен маршрут</div>
            Сначала вы разбираете определения, затем свойства и признаки, отдельно тренируете различение похожих
            утверждений, после — свободное воспроизведение, тест и работа над ошибками. Этапы можно проходить в любом
            порядке, прогресс сохраняется.
          </div>
        </div>
      </Card>
    </div>
  )
}
