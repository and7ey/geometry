import type { Answer, CheckResult, Question } from '../../types'

export function isAnswerComplete(question: Question, answer: Answer | undefined): boolean {
  if (!answer || answer.kind !== question.kind) return false
  switch (answer.kind) {
    case 'single':
    case 'cloze':
      return Boolean(answer.optionId)
    case 'multi':
      return answer.optionIds.length > 0
    case 'truefalse':
      return answer.value !== null
    case 'match':
      return answer.mapping.length === (question as { left: string[] }).left.length && answer.mapping.every((value) => value >= 0)
    case 'recall':
      return answer.text.trim().length > 0
  }
}

export function checkAnswer(question: Question, answer: Answer): CheckResult {
  if (answer.kind !== question.kind) {
    return { correct: false, partial: false, score: 0, correctText: correctAnswerText(question) }
  }

  switch (question.kind) {
    case 'single': {
      const option = question.options.find((item) => item.id === (answer as { optionId: string | null }).optionId)
      const correct = Boolean(option?.correct)
      return { correct, partial: false, score: correct ? 1 : 0, correctText: correctAnswerText(question) }
    }
    case 'cloze': {
      const option = question.options.find((item) => item.id === (answer as { optionId: string | null }).optionId)
      const correct = Boolean(option?.correct)
      return { correct, partial: false, score: correct ? 1 : 0, correctText: correctAnswerText(question) }
    }
    case 'multi': {
      const selected = new Set((answer as { optionIds: string[] }).optionIds)
      const correctOptions = question.options.filter((option) => option.correct)
      const wrongSelected = question.options.filter((option) => !option.correct && selected.has(option.id))
      const allCorrect = correctOptions.every((option) => selected.has(option.id))
      const correct = allCorrect && wrongSelected.length === 0
      const selectedCorrect = correctOptions.filter((option) => selected.has(option.id)).length
      const partial = !correct && selectedCorrect > 0 && wrongSelected.length === 0
      return {
        correct,
        partial,
        score: correct ? 1 : selectedCorrect / Math.max(1, correctOptions.length) * 0.5,
        correctText: correctAnswerText(question),
      }
    }
    case 'truefalse': {
      const correct = (answer as { value: boolean | null }).value === question.answer
      return { correct, partial: false, score: correct ? 1 : 0, correctText: correctAnswerText(question) }
    }
    case 'match': {
      const mapping = (answer as { mapping: number[] }).mapping
      const correctPairs = question.pairs.reduce(
        (sum, expected, index) => sum + (mapping[index] === expected ? 1 : 0),
        0,
      )
      const correct = correctPairs === question.pairs.length
      return {
        correct,
        partial: !correct && correctPairs > 0,
        score: correctPairs / Math.max(1, question.pairs.length),
        correctText: correctAnswerText(question),
      }
    }
    case 'recall': {
      const recall = answer as { self: string | null; auto: string }
      const self = recall.self
      const auto = recall.auto
      const correct = self === 'good' && auto !== 'mismatch'
      const partial = (self === 'good' && auto === 'mismatch') || self === 'hard'
      return {
        correct,
        partial,
        score: correct ? 1 : partial ? 0.5 : 0,
        correctText: question.answer,
      }
    }
  }
}

export function correctAnswerText(question: Question): string {
  switch (question.kind) {
    case 'single':
    case 'multi':
      return question.options
        .filter((option) => option.correct)
        .map((option) => option.text)
        .join('; ')
    case 'cloze':
      return question.options.find((option) => option.correct)?.text ?? ''
    case 'truefalse':
      return question.answer ? 'Верно' : 'Неверно'
    case 'match':
      return question.left
        .map((left, index) => `${left} — ${question.right[question.pairs[index]]}`)
        .join('; ')
    case 'recall':
      return question.answer
  }
}

export function answerText(question: Question, answer: Answer | undefined): string {
  if (!answer || answer.kind !== question.kind) return 'Нет ответа'
  switch (question.kind) {
    case 'single':
    case 'cloze': {
      const option = question.options.find((item) => item.id === (answer as { optionId: string | null }).optionId)
      return option?.text ?? 'Нет ответа'
    }
    case 'multi': {
      const selected = new Set((answer as { optionIds: string[] }).optionIds)
      const texts = question.options.filter((option) => selected.has(option.id)).map((option) => option.text)
      return texts.length > 0 ? texts.join('; ') : 'Нет ответа'
    }
    case 'truefalse': {
      const value = (answer as { value: boolean | null }).value
      return value === null ? 'Нет ответа' : value ? 'Верно' : 'Неверно'
    }
    case 'match': {
      const mapping = (answer as { mapping: number[] }).mapping
      const parts = mapping
        .map((right, index) =>
          right >= 0 ? `${question.left[index]} — ${question.right[right]}` : null,
        )
        .filter((value): value is string => Boolean(value))
      return parts.length > 0 ? parts.join('; ') : 'Нет ответа'
    }
    case 'recall':
      return (answer as { text: string }).text.trim() || 'Нет ответа'
  }
}
