import { describe, expect, it } from 'vitest'
import { ITEMS } from '../src/content'
import { filterCounts, selectItems, type StudyFilters } from '../src/services/filters'
import { applyLearned, applyRating, applyStudyView } from '../src/services/scheduling'
import { emptyProgress, type ItemProgress } from '../src/types'

const NOW = new Date('2026-10-28T12:00:00+03:00').getTime()
const DAY = 86400000

const base: StudyFilters = {
  grades: [7, 8],
  difficulty: 3,
  categories: ['definition', 'property', 'criterion', 'theorem', 'corollary', 'axiom', 'formula'],
  topicIds: [],
  itemFilter: 'all',
  excludeMastered: false,
}

function makeProgress(): Record<string, ItemProgress> {
  return {
    'g7-angle': { ...applyStudyView(undefined, NOW), ...{} },
    'g7-bisector': applyRating(undefined, 'good', NOW),
    'g7-segment': { ...applyLearned(undefined, NOW), attempts: 1, recallSuccesses: 2, recallStreak: 2, understandSuccesses: 2, level: 5 },
    'g8-pythagoras-theorem': { ...emptyProgress(), attempts: 1, due: NOW - DAY, wrong: 1, unresolvedError: true, level: 1 },
  }
}

describe('фильтрация материалов', () => {
  it('фильтрует по классу', () => {
    const seven = selectItems(ITEMS, { ...base, grades: [7] }, {}, NOW)
    expect(seven.length).toBeGreaterThan(0)
    expect(seven.every((item) => item.grade === 7)).toBe(true)
  })

  it('фильтрует по категории и накопительной сложности', () => {
    const definitions = selectItems(ITEMS, { ...base, categories: ['definition'], difficulty: 2 }, {}, NOW)
    expect(definitions.length).toBeGreaterThan(0)
    expect(definitions.every((item) => item.category === 'definition' && item.difficulty <= 2)).toBe(true)
  })

  it('фильтрует новые, изученные, ошибки и срок повторения', () => {
    const progress = makeProgress()
    const fresh = selectItems(ITEMS, { ...base, itemFilter: 'new' }, progress, NOW)
    expect(fresh.some((item) => item.id === 'g7-angle')).toBe(false)
    expect(fresh.some((item) => item.id === 'g7-ray')).toBe(true)

    const learned = selectItems(ITEMS, { ...base, itemFilter: 'learned' }, progress, NOW)
    expect(learned.map((item) => item.id)).toContain('g7-segment')
    expect(learned.map((item) => item.id)).toContain('g7-bisector')

    const errors = selectItems(ITEMS, { ...base, itemFilter: 'errors' }, progress, NOW)
    expect(errors.map((item) => item.id)).toContain('g8-pythagoras-theorem')

    const due = selectItems(ITEMS, { ...base, itemFilter: 'due' }, progress, NOW)
    expect(due.map((item) => item.id)).toContain('g8-pythagoras-theorem')
    expect(due.map((item) => item.id)).not.toContain('g7-ray')
  })

  it('исключает освоенные материалы', () => {
    const progress = makeProgress()
    const items = selectItems(ITEMS, { ...base, excludeMastered: true }, progress, NOW)
    expect(items.map((item) => item.id)).not.toContain('g7-segment')
  })

  it('считает доступные материалы по каждому фильтру', () => {
    const counts = filterCounts(ITEMS, base, makeProgress(), NOW)
    expect(counts.all).toBeGreaterThan(counts.new)
    expect(counts.errors).toBe(1)
    expect(counts.due).toBe(1)
  })
})
