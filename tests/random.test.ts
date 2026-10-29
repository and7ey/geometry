import { describe, expect, it } from 'vitest'
import { ITEM_BY_ID } from '../src/content'
import { balancedSample, mulberry32 } from '../src/services/quiz/random'
import { createSession } from '../src/services/session'
import { generateQuizQuestions, generateRecallQuestions, generateReviewQuestions } from '../src/services/quiz/generate'
import { DEFAULT_SETTINGS, type Settings } from '../src/types'
import { ITEMS } from '../src/content'

const settings: Settings = {
  ...DEFAULT_SETTINGS,
  grades: [7, 8],
  difficulty: 3,
  count: 5,
  topicIds: [],
  categories: [...DEFAULT_SETTINGS.categories],
  itemFilter: 'all',
}

function topicsOf(items: { topicId: string }[]): Set<string> {
  return new Set(items.map((item) => item.topicId))
}

describe('выбор материалов без повторов тем', () => {
  it('balancedSample выдаёт по одному элементу из разных тем', () => {
    const pool = [
      ...Array.from({ length: 8 }, (_, index) => ({ id: `a${index}`, topic: 'a' })),
      ...Array.from({ length: 3 }, (_, index) => ({ id: `b${index}`, topic: 'b' })),
      ...Array.from({ length: 2 }, (_, index) => ({ id: `c${index}`, topic: 'c' })),
    ]
    const picked = balancedSample(pool, 5, (item) => item.topic, mulberry32(42))
    expect(picked).toHaveLength(5)
    expect(new Set(picked.map((item) => item.topic))).toEqual(new Set(['a', 'b', 'c']))
    expect(new Set(picked.map((item) => item.id)).size).toBe(5)
  })

  it('карточки начинают занятие с разных тем', () => {
    const first = createSession('flashcards', settings, {}, { seed: 'seed-a' })
    const second = createSession('flashcards', settings, {}, { seed: 'seed-b' })
    const firstTopics = topicsOf(first.itemIds.map((id) => ITEM_BY_ID.get(id)!))
    const secondTopics = topicsOf(second.itemIds.map((id) => ITEM_BY_ID.get(id)!))
    expect(first.itemIds).toHaveLength(5)
    expect(firstTopics.size).toBe(5)
    expect(secondTopics.size).toBe(5)
    expect(first.itemIds.join('|')).not.toBe(second.itemIds.join('|'))
  })

  it('тест и воспроизведение не сваливаются в одну тему', () => {
    const quiz = generateQuizQuestions({
      items: ITEMS,
      count: 10,
      difficulty: 2,
      topicIds: [],
      seed: 'quiz-seed',
    })
    const quizTopics = topicsOf(quiz.flatMap((question) => question.itemIds.map((id) => ITEM_BY_ID.get(id)!)))
    expect(quizTopics.size).toBeGreaterThanOrEqual(4)

    const recall = generateRecallQuestions(ITEMS, 6, 'recall-seed')
    expect(
      topicsOf(
        recall
          .filter((question) => question.kind === 'recall')
          .map((question) => ITEM_BY_ID.get(question.itemId)!),
      ).size,
    ).toBeGreaterThanOrEqual(5)
  })

  it('повторение ошибок отдаёт приоритет слабым, но не теряет разнообразие', () => {
    const weakItems: typeof ITEMS = []
    const seenTopics = new Set<string>()
    for (const item of ITEMS.filter((candidate) => candidate.grade === 7)) {
      if (seenTopics.has(item.topicId)) continue
      seenTopics.add(item.topicId)
      weakItems.push(item)
      if (weakItems.length === 6) break
    }
    const progress = Object.fromEntries(
      weakItems.map((item) => [
        item.id,
        {
          level: 0,
          due: Date.now(),
          favorite: false,
          attempts: 2,
          correct: 0,
          wrong: 2,
          hintUses: 1,
          recallAttempts: 2,
          recallSuccesses: 0,
          recallStreak: 0,
          understandAttempts: 2,
          understandSuccesses: 0,
          unresolvedError: true,
          history: [],
        },
      ]),
    )
    const questions = generateReviewQuestions({
      items: ITEMS.filter((item) => item.grade === 7),
      count: 8,
      difficulty: 2,
      topicIds: [],
      seed: 'review-seed',
      progress,
    })
    expect(questions.length).toBeGreaterThan(0)
    expect(topicsOf(questions.flatMap((question) => question.itemIds.map((id) => ITEM_BY_ID.get(id)!))).size)
      .toBeGreaterThanOrEqual(3)
  })
})
