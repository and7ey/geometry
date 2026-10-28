import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../app/store'
import {
  Button,
  Card,
  Chip,
  Icon,
  InfoNote,
  Kbd,
  Modal,
  ProgressBar,
  Ring,
} from '../components/ui'
import { ItemDetail } from '../components/ItemDetail'
import { CategoryChip, FigurePanel } from '../components/ItemBits'
import {
  ClozeQuestionView,
  MatchQuestionView,
  MultiQuestionView,
  SingleQuestionView,
  TrueFalseView,
} from '../features/quiz/QuestionView'
import { TOPIC_BY_ID, getItem } from '../content'
import {
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  saveLastResult,
} from '../services/storage'
import { buildResult, answerForFlashcard, toSummary } from '../services/session/result'
import { sessionItem } from '../services/session'
import { checkAnswer, correctAnswerText, isAnswerComplete } from '../services/quiz/check'
import { evaluateRecall, type RecallEvaluation } from '../services/quiz/recall'
import type { ActiveSession, Answer, Item, Question, Rating, RecallQuestion } from '../types'
import { SKILL_LABELS } from '../types'
import { cn, formatDuration } from '../utils'

const ratingOptions: { value: Rating; label: string; hint: string; className: string }[] = [
  { value: 'again', label: 'Не знал', hint: 'вернуть в конец', className: 'border-danger/25 bg-danger-soft text-danger hover:border-danger/45' },
  { value: 'hard', label: 'Затруднялся', hint: 'повтор завтра', className: 'border-warn/25 bg-warn-soft text-warn hover:border-warn/45' },
  { value: 'hint', label: 'С подсказкой', hint: 'без роста уровня', className: 'border-line bg-surface-2 text-ink-2 hover:border-line-strong' },
  { value: 'good', label: 'Знал уверенно', hint: 'интервал вырастет', className: 'border-success/25 bg-success-soft text-success hover:border-success/45' },
]

function cardSides(item: Item, index: number): { front: string; back: string; label: string; isTheorem: boolean } {
  if (item.card) return { front: item.card.front, back: item.card.back, label: item.card.typeLabel, isTheorem: Boolean(item.theorem) }
  const rotation = index % 3
  if (rotation === 1) {
    return {
      front: item.statement,
      back: item.title,
      label: 'Формулировка → название',
      isTheorem: Boolean(item.theorem),
    }
  }
  if (rotation === 2 && item.theorem) {
    return {
      front: `Дано: ${item.theorem.condition}`,
      back: `Следует: ${item.theorem.conclusion}`,
      label: 'Условие → вывод',
      isTheorem: true,
    }
  }
  return {
    front: item.title,
    back: item.statement,
    label: item.category === 'definition' ? 'Термин → определение' : 'Название → формулировка',
    isTheorem: Boolean(item.theorem),
  }
}

function ScoreRing({ correct, total }: { correct: number; total: number }) {
  const value = total > 0 ? correct / total : 0
  return (
    <Ring value={value} size={64} stroke={5} tone={value >= 0.8 ? 'success' : value >= 0.5 ? 'accent' : 'warn'}>
      <span className="text-xs font-semibold tabular-nums">{Math.round(value * 100)}%</span>
    </Ring>
  )
}

export function SessionPage() {
  const navigate = useNavigate()
  const { state, finishSession, completeRouteStep, rate, recall, quiz, markViewed, markLearned, toggleFavorite } =
    useStore()
  const [session, setSession] = useState<ActiveSession | null>(() => loadActiveSession())
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [evaluations, setEvaluations] = useState<Record<string, RecallEvaluation>>({})
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({})
  const [hintOpen, setHintOpen] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [studyListOpen, setStudyListOpen] = useState(false)
  const [flashHint, setFlashHint] = useState(false)
  const lastSave = useRef(0)

  useEffect(() => {
    if (!session) return
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSession((current) =>
          current ? { ...current, activeMs: current.activeMs + 1000, lastTickAt: Date.now() } : current,
        )
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [Boolean(session)])

  useEffect(() => {
    if (!session) return
    const now = Date.now()
    if (now - lastSave.current > 1200) {
      saveActiveSession(session)
      lastSave.current = now
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    const onBeforeUnload = () => saveActiveSession(session)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [session])

  const studyItem = session?.kind === 'study' ? sessionItem(session, session.index) : undefined
  const flashItem = session?.kind === 'flashcards' ? sessionItem(session, session.index) : undefined

  useEffect(() => {
    if (studyItem) markViewed(studyItem.id)
  }, [studyItem?.id, markViewed])

  const question: Question | undefined =
    session && session.questions.length > 0 ? session.questions[session.index] : undefined
  const answer = question ? session?.answers[question.id] : undefined
  const isChecked = question ? Boolean(checked[question.id]) : false
  const currentEvaluation = question?.kind === 'recall' ? evaluations[question.id] : undefined
  const correctCount = useMemo(() => {
    if (!session) return 0
    return session.questions.reduce((sum, item) => {
      const given = session.answers[item.id]
      if (!given) return sum
      return sum + (checkAnswer(item, given).correct ? 1 : 0)
    }, 0)
  }, [session])

  if (!session) return <Navigate to="/setup" replace />

  const progress =
    session.kind === 'study' || session.kind === 'flashcards'
      ? session.itemIds.length > 0
        ? (session.index + 1) / session.itemIds.length
        : 0
      : session.questions.length > 0
        ? (session.index + 1) / session.questions.length
        : 0

  const persistAnswer = (next: Answer) => {
    if (!question) return
    setSession((current) =>
      current ? { ...current, answers: { ...current.answers, [question.id]: next } } : current,
    )
  }

  const advance = (current: ActiveSession = session) => {
    const nextIndex = current.index + 1
    if (nextIndex >= (current.kind === 'study' || current.kind === 'flashcards' ? current.itemIds.length : current.questions.length)) {
      finish(current)
      return
    }
    setSession({ ...current, index: nextIndex, revealed: false })
    setHintOpen(false)
    setFlashHint(false)
  }

  const finish = (current: ActiveSession) => {
    const endedAt = Date.now()
    const result = buildResult({ ...current, activeMs: current.activeMs }, state.progress, endedAt)
    saveLastResult(result)
    finishSession(toSummary(result), result.activeMs)
    if (result.route) {
      completeRouteStep(result.route.topicId, result.route.stepKey, 0)
    }
    clearActiveSession()
    navigate('/results')
  }

  const handleCheck = () => {
    if (!session || !question || !answer || !isAnswerComplete(question, answer)) return
    if (question.kind === 'recall') {
      const evaluation = evaluateRecall((answer as { text: string }).text, question as RecallQuestion)
      setEvaluations((current) => ({ ...current, [question.id]: evaluation }))
      setChecked((current) => ({ ...current, [question.id]: true }))
      setSession({
        ...session,
        answers: {
          ...session.answers,
          [question.id]: { ...(answer as Extract<Answer, { kind: 'recall' }>), auto: evaluation.auto },
        },
      })
      return
    }
    setChecked((current) => ({ ...current, [question.id]: true }))
    const result = checkAnswer(question, answer)
    const itemId = question.itemIds[0]
    if (itemId) quiz(itemId, result.correct, session.kind)
  }

  const handleRecallSelf = (rating: Rating) => {
    if (!session || !question || question.kind !== 'recall' || !answer) return
    const evaluation = evaluations[question.id]
    if (!evaluation) return
    const text = (answer as { text: string }).text
    const nextAnswer: Answer = { kind: 'recall', text, auto: evaluation.auto, self: rating }
    setSession({ ...session, answers: { ...session.answers, [question.id]: nextAnswer } })
    const hints = hintsUsed[question.id] ?? 0
    recall(question.itemId, rating, evaluation.auto, hints)
    setChecked((current) => ({ ...current, [question.id]: true }))
  }

  const handleExamAnswer = () => {
    if (!session || !question || !answer || !isAnswerComplete(question, answer)) return
    const result = checkAnswer(question, answer)
    const itemId = question.itemIds[0]
    if (itemId) quiz(itemId, result.correct, 'exam')
    const updated: ActiveSession = { ...session, answers: { ...session.answers, [question.id]: answer } }
    advance(updated)
  }

  const rateFlashcard = (rating: Rating) => {
    if (!session || !flashItem) return
    rate(flashItem.id, rating, 'flashcards')
    let nextSession: ActiveSession = {
      ...session,
      answers: { ...session.answers, [flashItem.id]: answerForFlashcard(rating) },
    }
    const requeued = session.requeued ?? []
    if (rating === 'again' && !requeued.includes(flashItem.id)) {
      nextSession = {
        ...nextSession,
        itemIds: [...nextSession.itemIds, flashItem.id],
        requeued: [...requeued, flashItem.id],
      }
    }
    advance(nextSession)
  }

  const revealFlash = () => {
    if (!session) return
    setSession({ ...session, revealed: true })
    setFlashHint(false)
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (session.kind === 'flashcards' && flashItem) {
        if (event.code === 'Space' && !session.revealed) {
          event.preventDefault()
          revealFlash()
          return
        }
        if (session.revealed && ['1', '2', '3', '4'].includes(event.key)) {
          event.preventDefault()
          const rating = ratingOptions[Number(event.key) - 1]
          if (rating) rateFlashcard(rating.value)
        }
        return
      }

      if (question && !isChecked && question.kind !== 'recall' && question.kind !== 'match') {
        if (question.kind === 'single' || question.kind === 'cloze') {
          const index = Number(event.key) - 1
          const option = question.options[index]
          if (option) {
            event.preventDefault()
            persistAnswer({ kind: question.kind, optionId: option.id } as Answer)
          }
        }
        if (question.kind === 'multi' && /^[1-6]$/.test(event.key)) {
          const option = question.options[Number(event.key) - 1]
          if (option) {
            event.preventDefault()
            const selected = answer?.kind === 'multi' ? new Set(answer.optionIds) : new Set<string>()
            if (selected.has(option.id)) selected.delete(option.id)
            else selected.add(option.id)
            persistAnswer({ kind: 'multi', optionIds: Array.from(selected) })
          }
        }
        if (question.kind === 'truefalse' && (event.key === '1' || event.key === '2')) {
          event.preventDefault()
          persistAnswer({ kind: 'truefalse', value: event.key === '1' })
        }
      }
      if (event.key === 'Enter') {
        if (session.kind === 'exam' && question && answer && isAnswerComplete(question, answer)) {
          event.preventDefault()
          handleExamAnswer()
          return
        }
        if (isChecked) {
          event.preventDefault()
          advance()
          return
        }
        if (
          session.kind !== 'exam' &&
          question &&
          answer &&
          isAnswerComplete(question, answer)
        ) {
          event.preventDefault()
          handleCheck()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [session, question, answer, isChecked, flashItem, session.revealed, hintsUsed])

  const renderQuestionBody = () => {
    if (!question) return null
    const locked = isChecked
    switch (question.kind) {
      case 'single':
        return <SingleQuestionView question={question} answer={answer} onChange={persistAnswer} locked={locked} />
      case 'multi':
        return <MultiQuestionView question={question} answer={answer} onChange={persistAnswer} locked={locked} />
      case 'truefalse':
        return <TrueFalseView question={question} answer={answer} onChange={persistAnswer} locked={locked} />
      case 'match':
        return <MatchQuestionView question={question} answer={answer} onChange={persistAnswer} locked={locked} />
      case 'cloze':
        return <ClozeQuestionView question={question} answer={answer} onChange={persistAnswer} locked={locked} />
      case 'recall':
        return (
          <RecallPanel
            question={question}
            answer={answer}
            checked={isChecked}
            evaluation={currentEvaluation}
            hintOpen={hintOpen}
            onHint={() => {
              setHintOpen(true)
              setHintsUsed((current) => ({ ...current, [question.id]: 1 }))
            }}
            onChange={(text) =>
              persistAnswer({ kind: 'recall', text, auto: 'mismatch', self: null })
            }
            onSelf={handleRecallSelf}
            hintsUsed={hintsUsed[question.id] ?? 0}
          />
        )
      default:
        return null
    }
  }

  const feedback =
    question && isChecked ? checkAnswer(question, answer as Answer) : null

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setConfirmFinish(true)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink-2 transition-colors hover:bg-surface-2"
        >
          <Icon name="arrow-left" size={14} /> Выйти
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{session.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-[0.6875rem] text-ink-3">
            <span>
              {session.kind === 'study' || session.kind === 'flashcards'
                ? `${session.index + 1} из ${session.itemIds.length}`
                : `Задание ${Math.min(session.index + 1, session.questions.length)} из ${session.questions.length}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={11} /> {formatDuration(session.activeMs)}
            </span>
            {session.requeued.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>+{session.requeued.length} на повтор</span>
              </>
            )}
          </div>
        </div>
        {session.kind === 'quiz' || session.kind === 'review' ? (
          <ScoreRing correct={correctCount} total={session.questions.length} />
        ) : session.kind === 'exam' ? (
          <Chip tone="outline" size="sm">
            {Object.keys(session.answers).length} / {session.questions.length} отвечено
          </Chip>
        ) : null}
      </div>

      <ProgressBar value={progress} className="mb-5" />

      {session.kind === 'study' && studyItem && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-7">
            <ItemDetail
              item={studyItem}
              learned={Boolean(state.progress[studyItem.id]?.learnedAt)}
              favorite={Boolean(state.progress[studyItem.id]?.favorite)}
              onLearn={() => markLearned(studyItem.id)}
              onFavorite={() => toggleFavorite(studyItem.id)}
            />
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={session.index === 0}
                onClick={() => setSession({ ...session, index: session.index - 1 })}
                iconLeft={<Icon name="chevron-left" size={15} />}
              >
                Назад
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStudyListOpen(true)}
                iconLeft={<Icon name="list" size={15} />}
              >
                Список
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (session.index + 1 >= session.itemIds.length) finish(session)
                else setSession({ ...session, index: session.index + 1 })
              }}
              iconRight={<Icon name="arrow-right" size={15} />}
            >
              {session.index + 1 >= session.itemIds.length ? 'Завершить изучение' : 'Следующий'}
            </Button>
          </div>
        </div>
      )}

      {session.kind === 'flashcards' && flashItem && (
        <div>
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-surface-2/50 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip category={flashItem.category} size="sm" />
                <Chip tone="outline" size="sm">
                  {flashItem.grade} класс
                </Chip>
                {TOPIC_BY_ID.get(flashItem.topicId) && (
                  <Chip tone="neutral" size="sm">
                    {TOPIC_BY_ID.get(flashItem.topicId)?.title}
                  </Chip>
                )}
                <span className="ml-auto text-[0.6875rem] text-ink-3">{cardSides(flashItem, session.index).label}</span>
              </div>
            </div>
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-8 text-center sm:px-10">
              {!session.revealed ? (
                <>
                  <div className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
                    Вспомните
                  </div>
                  <div className="statement max-w-xl text-[1.35rem] leading-snug sm:text-[1.6rem]">
                    {cardSides(flashItem, session.index).front}
                  </div>
                  {flashItem.theorem && cardSides(flashItem, session.index).isTheorem && (
                    <div className="mt-4 text-xs text-ink-3">Нужно назвать заключение и условие.</div>
                  )}
                  <Button className="mt-6" size="lg" onClick={revealFlash} iconLeft={<Icon name="eye" size={16} />}>
                    Показать ответ
                  </Button>
                  <div className="mt-3 text-[0.6875rem] text-ink-3">
                    <Kbd>Пробел</Kbd> — перевернуть
                  </div>
                </>
              ) : (
                <div className="animate-in w-full">
                  <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">Ответ</div>
                  <div className="statement mx-auto mt-2 max-w-2xl text-left text-[1.075rem] leading-relaxed sm:text-[1.15rem]">
                    {cardSides(flashItem, session.index).back}
                  </div>
                  <div className="mx-auto mt-4 max-w-2xl text-left text-sm leading-relaxed text-ink-2">
                    {flashItem.plain}
                  </div>
                  {flashItem.figure && (
                    <div className="mx-auto mt-4 max-w-sm">
                      <FigurePanel figure={flashItem.figure} />
                    </div>
                  )}
                  {!flashHint && flashItem.hint && (
                    <button
                      type="button"
                      onClick={() => setFlashHint(true)}
                      className="mt-3 text-xs text-accent-ink hover:underline"
                    >
                      Показать подсказку
                    </button>
                  )}
                  {flashHint && flashItem.hint && (
                    <div className="mx-auto mt-3 max-w-xl rounded-lg bg-warn-soft px-3 py-2 text-left text-xs text-ink-2">
                      {flashItem.hint}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {session.revealed && (
            <div className="mt-4">
              <div className="mb-2 text-center text-xs text-ink-3">Насколько уверенно вы вспомнили?</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ratingOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => rateFlashcard(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3 text-center transition-colors',
                      option.className,
                    )}
                  >
                    <span className="text-[0.8125rem] font-semibold">{option.label}</span>
                    <span className="text-[0.625rem] opacity-70">{option.hint}</span>
                    <span className="mt-1 text-[0.625rem] opacity-50">
                      <Kbd>{index + 1}</Kbd>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {question && session.kind !== 'study' && session.kind !== 'flashcards' && (
        <div>
          <Card className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="accent" size="sm">
                {question.typeLabel}
              </Chip>
              {question.skill && (
                <Chip tone="outline" size="sm">
                  {SKILL_LABELS[question.skill]}
                </Chip>
              )}
              <Chip tone="neutral" size="sm">
                {question.difficulty === 1 ? 'начальная' : question.difficulty === 2 ? 'средняя' : 'высокая'}
              </Chip>
              {TOPIC_BY_ID.get(question.topicId) && (
                <span className="ml-auto text-[0.6875rem] text-ink-3">
                  {TOPIC_BY_ID.get(question.topicId)?.title}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-[1.15rem] leading-snug sm:text-[1.3rem]">{question.prompt}</h1>
            <div className="mt-5">{renderQuestionBody()}</div>
          </Card>

          {feedback && isChecked && question.kind !== 'recall' && (
            <div
              className={cn(
                'mt-4 rounded-card border p-4',
                feedback.correct
                  ? 'border-success/30 bg-success-soft/60'
                  : feedback.partial
                    ? 'border-warn/30 bg-warn-soft/60'
                    : 'border-danger/30 bg-danger-soft/60',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full',
                    feedback.correct
                      ? 'bg-success text-on-accent'
                      : feedback.partial
                        ? 'bg-warn text-on-accent'
                        : 'bg-danger text-on-accent',
                  )}
                >
                  <Icon name={feedback.correct ? 'check' : feedback.partial ? 'minus' : 'x'} size={15} />
                </span>
                <span className="text-sm font-semibold">
                  {feedback.correct ? 'Верно' : feedback.partial ? 'Частично верно' : 'Неверно'}
                </span>
              </div>
              {!feedback.correct && (
                <div className="mt-3 rounded-lg bg-surface/70 p-3 text-sm leading-relaxed">
                  <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    Правильный ответ
                  </div>
                  <div className="text-ink">{correctAnswerText(question)}</div>
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{question.explanation}</p>
              {question.kind === 'truefalse' && question.misconception && !feedback.correct && (
                <p className="mt-2 text-xs leading-relaxed text-ink-3">{question.misconception}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-ink-3">
              {question.kind === 'single' || question.kind === 'multi' || question.kind === 'truefalse' ? (
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <Kbd>1</Kbd>–<Kbd>4</Kbd> выбор · <Kbd>Enter</Kbd> далее
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              {session.kind === 'exam' ? (
                <Button onClick={handleExamAnswer} disabled={!isAnswerComplete(question, answer)}>
                  {session.index + 1 >= session.questions.length ? 'Завершить экзамен' : 'Ответить'}
                  <Icon name="arrow-right" size={15} />
                </Button>
              ) : question.kind === 'recall' ? (
                isChecked && answer?.kind === 'recall' && answer.self ? (
                  <Button onClick={() => advance()} iconRight={<Icon name="arrow-right" size={15} />}>
                    {session.index + 1 >= session.questions.length ? 'Завершить' : 'Далее'}
                  </Button>
                ) : isChecked ? (
                  <span className="text-xs text-ink-3">Оцените свой ответ выше</span>
                ) : (
                  <Button onClick={handleCheck} disabled={!isAnswerComplete(question, answer)}>
                    Проверить
                  </Button>
                )
              ) : !isChecked ? (
                <Button onClick={handleCheck} disabled={!isAnswerComplete(question, answer)}>
                  Проверить
                </Button>
              ) : (
                <Button onClick={() => advance()} iconRight={<Icon name="arrow-right" size={15} />}>
                  {session.index + 1 >= session.questions.length ? 'Завершить' : 'Далее'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Завершить занятие?"
        description={
          session.kind === 'study'
            ? 'Изученные отметки сохранятся, статистика обновится.'
            : 'Неотвеченные задания будут считаться ошибками. Прогресс по уже данным ответам сохранится.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmFinish(false)}>
              Продолжить
            </Button>
            <Button variant="danger" onClick={() => finish(session)}>
              Завершить
            </Button>
          </>
        }
      />

      <Modal
        open={studyListOpen}
        onClose={() => setStudyListOpen(false)}
        title="Материалы занятия"
        description={`${session.itemIds.length} элементов в текущей подборке`}
        size="lg"
      >
        <div className="max-h-[55dvh] space-y-1 overflow-y-auto">
          {session.itemIds.map((id, index) => {
            const item = getItem(id)
            if (!item) return null
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSession({ ...session, index })
                  setStudyListOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  index === session.index ? 'bg-accent-soft text-accent-ink' : 'text-ink-2 hover:bg-surface-2',
                )}
              >
                <span className="w-5 shrink-0 text-[0.6875rem] tabular-nums text-ink-3">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {state.progress[id]?.learnedAt && <Icon name="check" size={13} className="text-success" />}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

function RecallPanel({
  question,
  answer,
  checked,
  evaluation,
  hintOpen,
  onHint,
  onChange,
  onSelf,
  hintsUsed,
}: {
  question: RecallQuestion
  answer: Answer | undefined
  checked: boolean
  evaluation?: RecallEvaluation
  hintOpen: boolean
  onHint: () => void
  onChange: (text: string) => void
  onSelf: (rating: Rating) => void
  hintsUsed: number
}) {
  const text = answer?.kind === 'recall' ? answer.text : ''
  const self = answer?.kind === 'recall' ? answer.self : null
  return (
    <div>
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        disabled={checked}
        rows={5}
        placeholder="Сформулируйте ответ своими словами…"
        className="w-full resize-y rounded-xl border border-line bg-surface-2/50 p-3.5 text-sm leading-relaxed text-ink placeholder:text-ink-3 focus:border-accent/40 focus:bg-surface focus:outline-none disabled:opacity-80"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[0.6875rem] text-ink-3">
          Автопроверка сравнивает ключевые элементы, а не понимает смысл произвольного текста.
        </div>
        {!checked && !hintOpen && (
          <button
            type="button"
            onClick={onHint}
            className="inline-flex items-center gap-1 text-xs text-accent-ink hover:underline"
          >
            <Icon name="lightbulb" size={13} /> Подсказка
          </button>
        )}
        {hintOpen && <Chip tone="warn" size="sm">подсказка использована</Chip>}
      </div>

      {hintOpen && (
        <div className="mt-2 rounded-lg border border-warn/20 bg-warn-soft/70 p-3 text-xs leading-relaxed text-ink-2">
          {question.hint}
        </div>
      )}

      {checked && evaluation && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Предварительная проверка
              </div>
              <Chip
                tone={evaluation.auto === 'match' ? 'success' : evaluation.auto === 'partial' ? 'warn' : 'danger'}
                size="sm"
              >
                {evaluation.auto === 'match'
                  ? 'похоже на верный ответ'
                  : evaluation.auto === 'partial'
                    ? 'частично'
                    : 'ключевые элементы не найдены'}
              </Chip>
            </div>
            <div className="mt-2">
              <ProgressBar
                value={evaluation.coverage}
                tone={evaluation.auto === 'match' ? 'success' : evaluation.auto === 'partial' ? 'warn' : 'danger'}
              />
              <div className="mt-1.5 text-xs text-ink-3">
                Найдено ориентиров: {evaluation.found.length} из {evaluation.found.length + evaluation.missing.length}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {evaluation.found.map((word) => (
                <Chip key={`f-${word}`} tone="success" size="sm">
                  {word}
                </Chip>
              ))}
              {evaluation.missing.map((word) => (
                <Chip key={`m-${word}`} tone="danger" size="sm">
                  {word}
                </Chip>
              ))}
            </div>
            {hintsUsed > 0 && (
              <div className="mt-2 text-[0.6875rem] text-warn">Была использована подсказка — уровень не вырастет.</div>
            )}
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent-soft/40 p-4">
            <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-ink">
              Эталонная формулировка
            </div>
            <p className="statement mt-1.5 text-[0.9375rem]">{question.answer}</p>
          </div>

          {!self ? (
            <div>
              <div className="mb-2 text-xs text-ink-3">Теперь оцените себя — это важнее автопроверки.</div>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => onSelf('good')}
                  className="rounded-xl border border-success/30 bg-success-soft px-3 py-2.5 text-sm font-medium text-success hover:border-success/50"
                >
                  Сформулировал верно
                </button>
                <button
                  type="button"
                  onClick={() => onSelf('hard')}
                  className="rounded-xl border border-warn/30 bg-warn-soft px-3 py-2.5 text-sm font-medium text-warn hover:border-warn/50"
                >
                  С трудом
                </button>
                <button
                  type="button"
                  onClick={() => onSelf('again')}
                  className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger hover:border-danger/50"
                >
                  Не смог
                </button>
              </div>
            </div>
          ) : (
            <InfoNote tone={self === 'good' ? 'success' : self === 'hard' ? 'warn' : 'danger'}>
              Оценка: {self === 'good' ? 'сформулировал верно' : self === 'hard' ? 'с трудом' : 'не смог'}.
              Интервал повторения обновлён.
            </InfoNote>
          )}
        </div>
      )}
    </div>
  )
}
