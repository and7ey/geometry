import { describe, expect, it } from 'vitest'
import { ITEMS } from '../src/content'
import { generateQuizQuestions, generateRecallQuestions } from '../src/services/quiz/generate'
import { checkAnswer, correctAnswerText, isAnswerComplete } from '../src/services/quiz/check'
import { evaluateRecall, makeRecallQuestion } from '../src/services/quiz/recall'
import type { Answer, Question } from '../src/types'

function answerFor(question: Question): Answer {
  switch (question.kind) {
    case 'single':
    case 'cloze':
      return { kind: question.kind, optionId: question.options.find((option) => option.correct)?.id ?? null }
    case 'multi':
      return { kind: 'multi', optionIds: question.options.filter((option) => option.correct).map((option) => option.id) }
    case 'truefalse':
      return { kind: 'truefalse', value: question.answer }
    case 'match':
      return { kind: 'match', mapping: question.pairs }
    case 'recall':
      return { kind: 'recall', text: question.answer, auto: 'match', self: 'good' }
  }
}

describe('генерация и проверка заданий', () => {
  const items = ITEMS.filter((item) => item.grade === 7)

  it('собирает задания нужного объёма без повторов', () => {
    const questions = generateQuizQuestions({
      items,
      count: 20,
      difficulty: 3,
      topicIds: [],
      seed: 'seed-1',
    })
    expect(questions.length).toBeGreaterThan(10)
    expect(questions.length).toBeLessThanOrEqual(20)
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    for (const question of questions) {
      if (question.kind === 'single') {
        expect(question.options).toHaveLength(4)
        expect(question.options.filter((option) => option.correct)).toHaveLength(1)
        expect(new Set(question.options.map((option) => option.text)).size).toBe(4)
      }
    }
  })

  it('не выходит за выбранную сложность', () => {
    const questions = generateQuizQuestions({
      items,
      count: 10,
      difficulty: 1,
      topicIds: [],
      seed: 'seed-2',
    })
    expect(questions.every((question) => question.difficulty <= 1)).toBe(true)
  })

  it('правильный ответ принимается для каждого типа', () => {
    const topics = ['g7-angle-pairs', 'g7-parallel', 'g7-right']
    for (const topicId of topics) {
      const questions = generateQuizQuestions({
        items: ITEMS.filter((item) => item.topicId === topicId),
        count: 6,
        difficulty: 3,
        topicIds: [topicId],
        seed: `topic-${topicId}`,
      })
      for (const question of questions) {
        const answer = answerFor(question)
        const result = checkAnswer(question, answer)
        expect(result.correct, `${question.kind} ${question.id}`).toBe(true)
        expect(correctAnswerText(question).length).toBeGreaterThan(0)
        expect(isAnswerComplete(question, answer)).toBe(true)
      }
    }
  })

  it('неверный ответ не принимается', () => {
    const questions = generateQuizQuestions({
      items,
      count: 12,
      difficulty: 2,
      topicIds: [],
      seed: 'wrong-1',
    })
    for (const question of questions) {
      if (question.kind === 'single') {
        const wrong = question.options.find((option) => !option.correct)
        if (!wrong) continue
        const result = checkAnswer(question, { kind: 'single', optionId: wrong.id })
        expect(result.correct).toBe(false)
      }
    }
  })

  it('свободный ответ проверяет ключевые элементы и не понимает произвольный текст', () => {
    const item = ITEMS.find((candidate) => candidate.id === 'g8-pythagoras-theorem')
    expect(item).toBeTruthy()
    if (!item) return
    const question = makeRecallQuestion(item)
    const good = evaluateRecall('Квадрат гипотенузы равен сумме квадратов катетов', question)
    expect(good.auto).toBe('match')
    const bad = evaluateRecall('Биссектриса делит угол пополам', question)
    expect(bad.auto).toBe('mismatch')
  })

  it('свободное воспроизведение собирается по выбранным элементам', () => {
    const questions = generateRecallQuestions(items, 5, 'recall-1')
    expect(questions).toHaveLength(5)
    expect(questions.every((question) => question.kind === 'recall')).toBe(true)
  })
})
