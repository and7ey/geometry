import { ITEMS, TOPIC_BY_ID } from '../../content'
import type {
  ActiveSession,
  Answer,
  ItemProgress,
  SessionResult,
  SessionSummary,
  StabilityBreakdown,
} from '../../types'
import { answerText, checkAnswer, correctAnswerText } from '../quiz/check'

export function buildResult(
  session: ActiveSession,
  progress: Record<string, ItemProgress>,
  endedAt = Date.now(),
): SessionResult {
  const byTopic: SessionResult['byTopic'] = {}
  const wrongAnswers: SessionResult['wrongAnswers'] = []
  let total = 0
  let correct = 0
  let wrong = 0
  let partial = 0

  const addTopic = (topicId: string, ok: boolean): void => {
    if (!topicId) return
    const row = byTopic[topicId] ?? { total: 0, correct: 0 }
    row.total += 1
    if (ok) row.correct += 1
    byTopic[topicId] = row
  }

  if (session.kind === 'study') {
    total = session.itemIds.length
  } else if (session.kind === 'flashcards') {
    const uniqueIds = Array.from(new Set(session.itemIds))
    total = uniqueIds.length
    for (const itemId of uniqueIds) {
      const answer = session.answers[itemId]
      const item = ITEMS.find((candidate) => candidate.id === itemId)
      if (!answer || answer.kind !== 'recall' || !answer.self) {
        if (item) {
          wrong += 1
          addTopic(item.topicId, false)
        }
        continue
      }
      const ok = answer.self === 'good'
      if (ok) {
        correct += 1
      } else if (answer.self === 'hard' || answer.self === 'hint') {
        partial += 1
        wrong += 1
      } else {
        wrong += 1
      }
      addTopic(item?.topicId ?? '', ok)
      if (!ok && item) {
        wrongAnswers.push({
          itemId,
          prompt: `Карточка: ${item.title}`,
          correctText: item.statement,
          explanation: item.plain,
          givenText:
            answer.self === 'again'
              ? 'Не знал'
              : answer.self === 'hard'
                ? 'Затруднялся'
                : 'Знал с подсказкой',
        })
      }
    }
  } else {
    total = session.questions.length
    for (const question of session.questions) {
      const answer = session.answers[question.id] as Answer | undefined
      if (!answer) {
        wrong += 1
        addTopic(question.topicId, false)
        wrongAnswers.push({
          itemId: question.itemIds[0] ?? '',
          prompt: question.prompt,
          correctText: correctAnswerText(question),
          explanation: question.explanation,
          givenText: 'Нет ответа',
        })
        continue
      }
      const result = checkAnswer(question, answer)
      if (result.correct) {
        correct += 1
      } else if (result.partial) {
        partial += 1
        wrong += 1
      } else {
        wrong += 1
      }
      addTopic(question.topicId, result.correct)
      if (!result.correct) {
        wrongAnswers.push({
          itemId: question.itemIds[0] ?? '',
          prompt: question.prompt,
          correctText: result.correctText,
          explanation: question.explanation,
          givenText: answerText(question, answer),
        })
      }
    }
  }

  const accuracy = total > 0 ? correct / total : 0
  let stability: StabilityBreakdown | undefined
  if (session.kind === 'exam' && session.itemIds.length > 0) {
    const reproduction =
      session.itemIds.filter((id) => (progress[id]?.recallSuccesses ?? 0) >= 2).length /
      session.itemIds.length
    const retention =
      session.itemIds.filter((id) => (progress[id]?.level ?? 0) >= 3).length / session.itemIds.length
    stability = {
      accuracy,
      reproduction,
      retention,
      score: accuracy * 0.4 + reproduction * 0.3 + retention * 0.3,
    }
  }

  return {
    id: session.id,
    kind: session.kind,
    title: session.title,
    config: session.config,
    startedAt: session.startedAt,
    endedAt,
    activeMs: session.activeMs,
    total,
    correct,
    wrong,
    partial,
    accuracy,
    wrongAnswers,
    byTopic,
    newItems: session.newItemCount,
    reviewedItems: session.reviewedCount,
    stability,
    route: session.route,
  }
}

export function toSummary(result: SessionResult): SessionSummary {
  return {
    id: result.id,
    kind: result.kind,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    activeMs: result.activeMs,
    config: result.config,
    title: result.title,
    total: result.total,
    correct: result.correct,
    wrong: result.wrong,
    accuracy: result.accuracy,
    newItems: result.newItems,
    reviewedItems: result.reviewedItems,
  }
}

export function resultTopicRows(result: SessionResult): { topicId: string; label: string; accuracy: number }[] {
  return Object.entries(result.byTopic)
    .map(([topicId, row]) => ({
      topicId,
      label: TOPIC_BY_ID.get(topicId)?.title ?? topicId,
      accuracy: row.total > 0 ? row.correct / row.total : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

export function resultItemIds(result: SessionResult): string[] {
  return Array.from(new Set(result.wrongAnswers.map((answer) => answer.itemId).filter(Boolean)))
}

export function answerForFlashcard(rating: 'again' | 'hard' | 'hint' | 'good'): Answer {
  return {
    kind: 'recall',
    text: '',
    auto: 'match',
    self: rating,
  }
}
