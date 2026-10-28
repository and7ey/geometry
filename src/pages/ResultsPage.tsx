import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../app/store'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  Ring,
  SectionTitle,
  StatCard,
} from '../components/ui'
import { ActivityChart, AccuracyBars } from '../components/Charts'
import { TOPIC_BY_ID } from '../content'
import { loadLastResult, saveActiveSession } from '../services/storage'
import { createSession } from '../services/session'
import { useToast } from '../components/ui'
import { formatDuration, formatPercent, truncate } from '../utils'
import { DIFFICULTY_LABELS, type SessionResult } from '../types'

export function ResultsPage() {
  const navigate = useNavigate()
  const { settings, state, overview } = useStore()
  const { toast } = useToast()
  const [result] = useState<SessionResult | null>(() => loadLastResult<SessionResult>())

  if (!result) {
    return (
      <EmptyState
        icon="chart"
        title="Пока нет результатов"
        description="Пройдите занятие — здесь появится разбор ответов, ошибки и рекомендации."
        action={
          <Button onClick={() => navigate('/setup')} iconLeft={<Icon name="play" size={16} />}>
            Начать занятие
          </Button>
        }
      />
    )
  }

  const isStudy = result.kind === 'study'
  const isExam = result.kind === 'exam'
  const accuracy = result.accuracy
  const wrongItems = result.wrongAnswers
  const uniqueWrongIds = Array.from(new Set(wrongItems.map((item) => item.itemId).filter(Boolean)))

  const repeatErrors = () => {
    if (uniqueWrongIds.length === 0) return
    const session = createSession('review', settings, state.progress, {
      itemIds: uniqueWrongIds,
      count: Math.min(20, uniqueWrongIds.length),
      topicTitle: 'Разбор ошибок',
    })
    if (session.questions.length === 0) {
      toast('Не удалось собрать занятие по ошибкам.', 'danger')
      return
    }
    saveActiveSession(session)
    navigate('/session')
  }

  const topicRows = Object.entries(result.byTopic)
    .map(([topicId, row]) => ({
      label: TOPIC_BY_ID.get(topicId)?.title ?? topicId,
      value: row.total > 0 ? row.correct / row.total : 0,
      meta: `${row.correct}/${row.total}`,
      total: row.total,
    }))
    .sort((a, b) => a.value - b.value)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Итоги занятия"
        title={result.title}
        description={
          isStudy
            ? 'Материалы просмотрены. Отметки «изучено» и избранное сохранены.'
            : isExam
              ? 'Экзамен завершён. Ниже — результат, устойчивость знаний и темы для повторения.'
              : 'Разбор ответов: что получилось, где ошибки и что делать дальше.'
        }
        actions={
          <>
            {wrongItems.length > 0 && !isStudy && (
              <Button onClick={repeatErrors} iconLeft={<Icon name="refresh" size={16} />}>
                Повторить ошибки
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/setup')} iconLeft={<Icon name="sliders" size={16} />}>
              Новое занятие
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="outline" size="sm">
          {result.config.grades.length === 2 ? '7–8 класс' : `${result.config.grades[0]} класс`}
        </Chip>
        <Chip tone="outline" size="sm">
          {DIFFICULTY_LABELS[result.config.difficulty]}
        </Chip>
        <Chip tone="outline" size="sm">
          {result.config.categories.length === 7 ? 'все типы' : `${result.config.categories.length} типов`}
        </Chip>
        <Chip tone="outline" size="sm">
          {result.newItems} новых · {result.reviewedItems} повторено
        </Chip>
        <span className="text-xs text-ink-3">{formatDuration(result.activeMs)}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center justify-center text-center">
          {isStudy ? (
            <>
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <Icon name="book" size={32} />
              </span>
              <div className="mt-4 font-serif text-3xl">{result.total}</div>
              <div className="text-xs text-ink-3">элементов в подборке</div>
            </>
          ) : (
            <>
              <Ring
                value={accuracy}
                size={132}
                stroke={9}
                tone={accuracy >= 0.8 ? 'success' : accuracy >= 0.55 ? 'accent' : 'warn'}
              >
                <span className="font-serif text-3xl">{Math.round(accuracy * 100)}%</span>
                <span className="text-[0.6875rem] text-ink-3">точность</span>
              </Ring>
              <div className="mt-4 text-sm font-medium">
                {result.correct} из {result.total} верно
              </div>
              <div className="mt-1 text-xs text-ink-3">
                {result.wrong} ошибок · {result.partial} частично
              </div>
            </>
          )}
          <div className="mt-5 grid w-full grid-cols-2 gap-2 border-t border-line pt-4 text-left">
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.1em] text-ink-3">Время</div>
              <div className="text-sm font-medium">{formatDuration(result.activeMs)}</div>
            </div>
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.1em] text-ink-3">Темы</div>
              <div className="text-sm font-medium">{topicRows.length}</div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Верно"
            value={result.correct}
            hint={isStudy ? 'для изучения точность не считается' : `из ${result.total} заданий`}
            icon="check"
            tone="success"
          />
          <StatCard
            label="Ошибки"
            value={result.wrong}
            hint={result.wrong > 0 ? 'попали в работу над ошибками' : 'ошибок нет'}
            icon="alert"
            tone={result.wrong > 0 ? 'danger' : 'neutral'}
          />
          <StatCard
            label="Изучено за сессию"
            value={result.newItems}
            hint="новых материалов впервые в работе"
            icon="sparkles"
            tone="accent"
          />
          <StatCard
            label="Повторено"
            value={result.reviewedItems}
            hint="материалов уже были в работе"
            icon="refresh"
            tone="neutral"
          />
        </div>
      </div>

      {isExam && result.stability && (
        <Card>
          <SectionTitle hint="40% точность + 30% воспроизведение + 30% удержание">Устойчивость знаний</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-[1fr_1.2fr] sm:items-center">
            <div className="flex items-center gap-4">
              <Ring
                value={result.stability.score}
                size={92}
                stroke={8}
                tone={result.stability.score >= 0.75 ? 'success' : result.stability.score >= 0.5 ? 'accent' : 'warn'}
              >
                <span className="font-serif text-xl">{Math.round(result.stability.score * 100)}%</span>
              </Ring>
              <p className="text-xs leading-relaxed text-ink-2">
                Оценка учитывает не только процент верных ответов, но и то, насколько материал воспроизводится по
                памяти и как долго удерживается по интервалам.
              </p>
            </div>
            <AccuracyBars
              rows={[
                { label: 'Точность ответов', value: result.stability.accuracy, meta: '40%' },
                { label: 'Воспроизведение без подсказок', value: result.stability.reproduction, meta: '30%' },
                { label: 'Удержание (интервал ≥ 7 дней)', value: result.stability.retention, meta: '30%' },
              ]}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="чем ниже, тем важнее повторить">По темам</SectionTitle>
          {topicRows.length > 0 ? (
            <AccuracyBars rows={topicRows} />
          ) : (
            <p className="text-sm text-ink-3">В этом занятии не было заданий по темам.</p>
          )}
        </Card>
        <Card>
          <SectionTitle hint="последние 14 дней">Динамика</SectionTitle>
          <ActivityChart days={overview.activity} />
          <div className="mt-3 flex items-center justify-between text-xs text-ink-3">
            <span>Серия: {overview.streak} дн.</span>
            <Link to="/stats" className="font-medium text-accent-ink hover:underline">
              Вся статистика →
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle hint={`${wrongItems.length} ${wrongItems.length === 1 ? 'запись' : 'записей'}`}>
          Разбор ошибок
        </SectionTitle>
        {wrongItems.length === 0 ? (
          <div className="rounded-xl border border-success/20 bg-success-soft/60 p-4 text-sm text-ink-2">
            Ошибок в этом занятии нет. {isStudy ? 'Отметки сохранены.' : 'Можно увеличить сложность или перейти к другой теме.'}
          </div>
        ) : (
          <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {wrongItems.map((wrong, index) => (
              <details
                key={`${wrong.prompt}-${index}`}
                className="group rounded-xl border border-line bg-surface-2/30 open:bg-surface"
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 p-3.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-soft text-[0.625rem] font-semibold text-danger">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink-2">
                    {truncate(wrong.prompt, 150)}
                  </span>
                  <Icon name="chevron-down" size={16} className="mt-0.5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-3 border-t border-line px-3.5 py-3 text-sm">
                  <div>
                    <div className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Ваш ответ</div>
                    <div className="mt-0.5 text-danger">{wrong.givenText || 'Нет ответа'}</div>
                  </div>
                  <div>
                    <div className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Правильно</div>
                    <div className="mt-0.5 text-ink">{wrong.correctText}</div>
                  </div>
                  <p className="text-xs leading-relaxed text-ink-3">{wrong.explanation}</p>
                  {wrong.itemId && (
                    <Link
                      to={`/item/${wrong.itemId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
                    >
                      Открыть карточку <Icon name="chevron-right" size={13} />
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {result.route && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/route/${result.route?.topicId}`)}
            iconLeft={<Icon name="route" size={16} />}
          >
            Вернуться к маршруту
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/stats')} iconLeft={<Icon name="chart" size={16} />}>
          Статистика
        </Button>
        <Button variant="ghost" onClick={() => navigate('/reference')} iconLeft={<Icon name="book" size={16} />}>
          Справочник
        </Button>
        <span className="ml-auto text-[0.6875rem] text-ink-3">
          Точность за всё время: {formatPercent(overview.accuracy)}
        </span>
      </div>
    </div>
  )
}
