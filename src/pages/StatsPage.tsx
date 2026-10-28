import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../app/store'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  InfoNote,
  PageHeader,
  ProgressBar,
  Ring,
  SectionTitle,
  StatCard,
  useToast,
} from '../components/ui'
import { ActivityChart, AccuracyBars, TopicMasteryBars } from '../components/Charts'
import { ITEMS } from '../content'
import { createSession } from '../services/session'
import { saveActiveSession } from '../services/storage'
import { formatDate, formatDuration, formatPercent, itemsLabel } from '../utils'

export function StatsPage() {
  const { state, settings, overview } = useStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { reproduction, understanding, avgLevel } = useMemo(() => {
    let recallAttempts = 0
    let recallSuccesses = 0
    let understandAttempts = 0
    let understandSuccesses = 0
    let levelSum = 0
    let counted = 0
    for (const item of ITEMS) {
      const p = state.progress[item.id]
      if (!p) continue
      recallAttempts += p.recallAttempts
      recallSuccesses += p.recallSuccesses
      understandAttempts += p.understandAttempts
      understandSuccesses += p.understandSuccesses
      levelSum += p.level
      counted += 1
    }
    return {
      reproduction: recallAttempts > 0 ? recallSuccesses / recallAttempts : null,
      understanding: understandAttempts > 0 ? understandSuccesses / understandAttempts : null,
      avgLevel: counted > 0 ? levelSum / counted : 0,
    }
  }, [state.progress])

  const repeatErrors = () => {
    if (overview.weakItems.length === 0) {
      toast('Слабых материалов пока нет.', 'info')
      return
    }
    const ids = overview.weakItems.map((row) => row.item.id)
    const session = createSession('review', settings, state.progress, {
      itemIds: ids,
      count: Math.min(20, ids.length),
      topicTitle: 'Слабые места',
    })
    if (session.questions.length === 0) {
      toast('Не удалось собрать занятие.', 'danger')
      return
    }
    saveActiveSession(session)
    navigate('/session')
  }

  const hasActivity = overview.solved > 0 || overview.viewed > 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Прогресс"
        title="Статистика"
        description="Просмотрено, изучено и освоено — разные вещи. Здесь видно, что уже держится, а что стоит вернуть в работу."
        actions={
          <>
            {overview.weakItems.length > 0 && (
              <Button onClick={repeatErrors} iconLeft={<Icon name="refresh" size={16} />}>
                Разобрать слабое
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/settings')} iconLeft={<Icon name="download" size={16} />}>
              Данные
            </Button>
          </>
        }
      />

      {!hasActivity && (
        <EmptyState
          icon="chart"
          title="Статистика появится после первого занятия"
          description="Пройдите несколько карточек или тест — здесь появятся точность, прогресс по темам и рекомендации."
          action={
            <Button onClick={() => navigate('/setup')} iconLeft={<Icon name="play" size={16} />}>
              Начать занятие
            </Button>
          }
        />
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Просмотрено"
          value={overview.viewed}
          hint={`из ${overview.total} материалов`}
          icon="eye"
          tone="neutral"
        />
        <StatCard
          label="Изучено"
          value={overview.learned}
          hint="было успешное воспроизведение или отметка"
          icon="book"
          tone="accent"
        />
        <StatCard
          label="Освоено"
          value={overview.mastered}
          hint="2+ воспроизведения, 2+ понимания, интервал ≥ 14 дней"
          icon="graduation"
          tone="success"
        />
        <StatCard
          label="Пора повторить"
          value={overview.due}
          hint="наступила дата повторения"
          icon="refresh"
          tone={overview.due > 0 ? 'warn' : 'neutral'}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Решено заданий" value={overview.solved} hint="тесты и свободные ответы" icon="list" />
        <StatCard
          label="Точность"
          value={formatPercent(overview.accuracy)}
          hint={`${overview.correct} верных ответов`}
          icon="target"
          tone="success"
        />
        <StatCard
          label="Время"
          value={formatDuration(overview.timeMs)}
          hint={`${overview.sessions} занятий`}
          icon="clock"
        />
        <StatCard
          label="Серия"
          value={`${overview.streak} дн.`}
          hint={`лучшая — ${overview.bestStreak} дней`}
          icon="flame"
          tone="warn"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle hint="14 дней">Активность</SectionTitle>
          <ActivityChart days={overview.activity} />
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-3">
            <span className="inline-block h-2 w-2 rounded-full bg-success" /> ≥ 80% верно
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-accent" /> 50–79%
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-warn" /> &lt; 50%
          </div>
        </Card>

        <Card>
          <SectionTitle hint="две разные способности">Воспроизведение и понимание</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-surface-2/40 p-3 text-center">
              <Ring value={reproduction ?? 0} size={78} stroke={6} tone="accent">
                <span className="text-sm font-semibold">{formatPercent(reproduction)}</span>
              </Ring>
              <div className="mt-2 text-xs font-medium">Воспроизведение</div>
              <div className="mt-0.5 text-[0.625rem] leading-relaxed text-ink-3">
                сформулировать по памяти
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/40 p-3 text-center">
              <Ring value={understanding ?? 0} size={78} stroke={6} tone="success">
                <span className="text-sm font-semibold">{formatPercent(understanding)}</span>
              </Ring>
              <div className="mt-2 text-xs font-medium">Понимание</div>
              <div className="mt-0.5 text-[0.625rem] leading-relaxed text-ink-3">
                применить и различить
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-ink-3">
            <span>Средний уровень: {avgLevel.toFixed(1)} из 6</span>
            <Chip tone="outline" size="sm">
              {overview.errors} с ошибками
            </Chip>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <SectionTitle hint="по типам материалов">Категории</SectionTitle>
          <AccuracyBars
            rows={overview.byCategory.map((row) => ({
              label: row.label,
              value: row.accuracy,
              meta: `${row.learned}/${row.total}`,
            }))}
          />
        </Card>
        <Card>
          <SectionTitle hint="7 и 8 класс">Классы</SectionTitle>
          <div className="space-y-4">
            {overview.byGrade.map((row) => (
              <div key={row.grade}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{row.grade} класс</span>
                  <span className="text-xs text-ink-3">
                    {row.mastered}/{row.total} освоено · {formatPercent(row.accuracy)}
                  </span>
                </div>
                <ProgressBar value={row.total > 0 ? row.mastered / row.total : 0} tone="success" />
                <div className="mt-1 text-[0.6875rem] text-ink-3">
                  {itemsLabel(row.learned)} изучено
                </div>
              </div>
            ))}
          </div>
          <InfoNote tone="info" title="Как считается освоение">
            Материал осваивается не после одного ответа: нужны минимум два уверенных воспроизведения, два верных
            применения и интервал повторения от 14 дней без нерешённых ошибок.
          </InfoNote>
        </Card>
      </div>

      <Card>
        <SectionTitle hint={`${overview.byTopic.length} тем`}>Прогресс по темам</SectionTitle>
        <TopicMasteryBars
          rows={overview.byTopic.map((row) => ({
            label: `${row.topic.title} · ${row.topic.grade} кл.`,
            percent: row.total > 0 ? row.mastered / row.total : 0,
            meta: `${row.mastered}/${row.total} · ${formatPercent(row.accuracy)}`,
          }))}
          limit={21}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="последние занятия">История</SectionTitle>
          {overview.recentSessions.length === 0 ? (
            <p className="text-sm text-ink-3">Занятий пока не было.</p>
          ) : (
            <div className="space-y-2">
              {overview.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/30 p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-3">
                    <Icon
                      name={
                        session.kind === 'exam'
                          ? 'flag'
                          : session.kind === 'study'
                            ? 'book'
                            : session.kind === 'flashcards'
                              ? 'layers'
                              : session.kind === 'recall'
                                ? 'edit'
                                : 'list'
                      }
                      size={15}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{session.title}</div>
                    <div className="text-[0.6875rem] text-ink-3">
                      {formatDate(session.endedAt)} · {formatDuration(session.activeMs)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {session.kind === 'study' ? session.total : `${Math.round(session.accuracy * 100)}%`}
                    </div>
                    <div className="text-[0.625rem] text-ink-3">
                      {session.kind === 'study' ? 'элементов' : `${session.correct}/${session.total}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle
            hint="по последним ответам"
            action={
              overview.weakItems.length > 0 ? (
                <button type="button" onClick={repeatErrors} className="text-xs text-accent-ink hover:underline">
                  Повторить все
                </button>
              ) : undefined
            }
          >
            Требуют внимания
          </SectionTitle>
          {overview.weakItems.length === 0 ? (
            <div className="rounded-xl border border-success/20 bg-success-soft/50 p-4 text-sm text-ink-2">
              Слабых мест по последним ответам нет. Отличная работа.
            </div>
          ) : (
            <div className="space-y-1.5">
              {overview.weakItems.map(({ item, progress }) => (
                <Link
                  key={item.id}
                  to={`/item/${item.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-2"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="shrink-0 text-[0.6875rem] text-ink-3">
                    {progress.wrong} ошибок · ур. {progress.level}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
