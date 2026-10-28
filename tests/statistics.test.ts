import { describe, expect, it } from 'vitest'
import { buildOverview, computeBestStreak, computeStreak } from '../src/services/statistics'
import { emptyProgress, emptyState, type DayStat, type ItemProgress } from '../src/types'
import { dayKey } from '../src/services/scheduling'

const NOW = new Date('2026-10-28T12:00:00+03:00').getTime()

function day(reviews: number): DayStat {
  return { reviews, correct: Math.max(0, reviews - 1), wrong: reviews > 0 ? 1 : 0, ms: 60000, sessions: 1 }
}

function progress(overrides: Partial<ItemProgress>): ItemProgress {
  return { ...emptyProgress(), ...overrides }
}

describe('статистика', () => {
  it('считает серию и лучшую серию', () => {
    const today = new Date(NOW)
    const keys = [0, 1, 2].map((offset) => {
      const date = new Date(today)
      date.setDate(date.getDate() - offset)
      return dayKey(date.getTime())
    })
    const days: Record<string, DayStat> = {
      [keys[0]]: day(3),
      [keys[1]]: day(2),
      [keys[2]]: day(1),
    }
    expect(computeStreak(days, NOW)).toBe(3)
    expect(computeBestStreak(days)).toBe(3)
  })

  it('не наказывает за пропуск сегодняшнего дня до его окончания', () => {
    const yesterday = new Date(NOW)
    yesterday.setDate(yesterday.getDate() - 1)
    const days = { [dayKey(yesterday.getTime())]: day(4) }
    expect(computeStreak(days, NOW)).toBe(1)
  })

  it('сводит просмотр, изучение, освоение и ошибки', () => {
    const state = emptyState()
    state.progress['g7-angle'] = progress({ viewedAt: NOW, attempts: 1, due: NOW + 86400000 })
    state.progress['g7-bisector'] = progress({
      viewedAt: NOW,
      learnedAt: NOW,
      level: 5,
      attempts: 6,
      recallSuccesses: 2,
      recallStreak: 2,
      understandSuccesses: 2,
      due: NOW + 86400000,
    })
    state.progress['g7-segment'] = progress({
      attempts: 2,
      wrong: 1,
      unresolvedError: true,
      due: NOW - 86400000,
      level: 1,
    })
    state.days[dayKey(NOW)] = day(5)
    state.sessions.push({
      id: 's',
      kind: 'flashcards',
      startedAt: NOW - 60000,
      endedAt: NOW,
      activeMs: 60000,
      config: {
        grades: [7],
        difficulty: 2,
        categories: ['definition'],
        topicIds: [],
        count: 10,
        itemFilter: 'all',
        excludeMastered: false,
      },
      title: 'Карточки',
      total: 5,
      correct: 4,
      wrong: 1,
      accuracy: 0.8,
      newItems: 5,
      reviewedItems: 0,
    })
    const overview = buildOverview(state, NOW)
    expect(overview.viewed).toBe(3)
    expect(overview.learned).toBe(1)
    expect(overview.mastered).toBe(1)
    expect(overview.errors).toBe(1)
    expect(overview.due).toBe(1)
    expect(overview.todayReviews).toBe(5)
    expect(overview.streak).toBe(1)
    expect(overview.sessions).toBe(1)
    expect(overview.recentSessions).toHaveLength(1)
    expect(overview.weakItems.length).toBeGreaterThan(0)
    expect(overview.byGrade[0].total).toBeGreaterThan(0)
    expect(overview.byTopic.every((row) => row.total >= 0)).toBe(true)
  })
})
