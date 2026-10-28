import { describe, expect, it } from 'vitest'
import { emptyProgress, type ItemProgress } from '../src/types'
import {
  applyQuizResult,
  applyRating,
  applyRecallResult,
  getStatus,
  isDue,
  isMastered,
  intervalDays,
} from '../src/services/scheduling'

const NOW = new Date('2026-10-28T12:00:00+03:00').getTime()
const DAY = 86400000

function progress(overrides: Partial<ItemProgress> = {}): ItemProgress {
  return { ...emptyProgress(), ...overrides }
}

describe('интервальное повторение', () => {
  it('уверенный ответ повышает уровень и назначает интервал', () => {
    let p = applyRating(undefined, 'good', NOW)
    expect(p.level).toBe(1)
    expect(p.due).toBe(NOW + intervalDays(1) * DAY)
    expect(p.learnedAt).toBe(NOW)
    expect(p.recallSuccesses).toBe(1)
    p = applyRating(p, 'good', NOW + DAY)
    expect(p.level).toBe(2)
    expect(p.due).toBe(NOW + DAY + 3 * DAY)
  })

  it('«не знал» понижает уровень и возвращает карточку в сессию', () => {
    const start = progress({ level: 4, recallStreak: 3 })
    const next = applyRating(start, 'again', NOW)
    expect(next.level).toBe(2)
    expect(next.recallStreak).toBe(0)
    expect(next.unresolvedError).toBe(true)
    expect(next.due).toBe(NOW + 10 * 60 * 1000)
  })

  it('подсказка не повышает уровень', () => {
    const next = applyRating(undefined, 'hint', NOW)
    expect(next.level).toBe(0)
    expect(next.hintUses).toBe(1)
    expect(next.due).toBe(NOW + DAY)
  })

  it('подсказка в свободном ответе блокирует повышение даже при самооценке «верно»', () => {
    const next = applyRecallResult(undefined, 'good', 'match', 1, NOW)
    expect(next.level).toBe(0)
    expect(next.recallSuccesses).toBe(0)
    expect(next.hintUses).toBeGreaterThanOrEqual(1)
  })

  it('ошибка в тесте понижает уровень и ставит материал в очередь', () => {
    const start = progress({ level: 3, understandAttempts: 1, understandSuccesses: 1 })
    const next = applyQuizResult(start, false, NOW)
    expect(next.level).toBe(2)
    expect(next.unresolvedError).toBe(true)
    expect(next.due).toBe(NOW)
    expect(next.understandAttempts).toBe(2)
    expect(next.understandSuccesses).toBe(1)
  })

  it('верный ответ в тесте не заменяет воспроизведение, но снимает ошибку', () => {
    const start = progress({ level: 3, unresolvedError: true, due: NOW })
    const next = applyQuizResult(start, true, NOW)
    expect(next.level).toBe(3)
    expect(next.unresolvedError).toBe(false)
    expect(next.understandSuccesses).toBe(1)
    expect(next.due).toBeGreaterThan(NOW)
  })

  it('освоение требует уровня, воспроизведений и понимания', () => {
    const almost = progress({
      level: 5,
      recallSuccesses: 1,
      recallStreak: 1,
      understandSuccesses: 2,
    })
    expect(isMastered(almost)).toBe(false)
    const mastered = progress({
      level: 5,
      recallSuccesses: 2,
      recallStreak: 2,
      understandSuccesses: 2,
    })
    expect(isMastered(mastered)).toBe(true)
    expect(getStatus(mastered)).toBe('mastered')
  })

  it('просмотр не считается изучением', () => {
    const viewed = progress({ viewedAt: NOW })
    expect(getStatus(viewed)).toBe('viewed')
    expect(isMastered(viewed)).toBe(false)
  })

  it('просроченное повторение попадает в очередь до конца дня', () => {
    expect(isDue(progress({ attempts: 1, due: NOW - DAY }), NOW)).toBe(true)
    expect(isDue(progress({ attempts: 1, due: NOW + 2 * DAY }), NOW)).toBe(false)
    expect(isDue(progress({ attempts: 0, due: NOW - DAY }), NOW)).toBe(false)
  })
})
