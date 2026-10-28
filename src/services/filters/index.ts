import type {
  Category,
  Difficulty,
  Grade,
  Item,
  ItemFilter,
  ItemProgress,
} from '../../types'
import { getStatus, isDue, isMastered, weakScore } from '../scheduling'

export interface StudyFilters {
  grades: Grade[]
  difficulty: Difficulty
  categories: Category[]
  topicIds: string[]
  itemFilter: ItemFilter
  excludeMastered: boolean
}

export function itemMatchesBaseFilters(
  item: Item,
  filters: StudyFilters,
  _progress: Record<string, ItemProgress>,
  _now: number,
): boolean {
  if (!filters.grades.includes(item.grade)) return false
  if (item.difficulty > filters.difficulty) return false
  if (!filters.categories.includes(item.category)) return false
  if (filters.topicIds.length > 0 && !filters.topicIds.includes(item.topicId)) return false
  return true
}

export function itemMatchesFilter(
  item: Item,
  filter: ItemFilter,
  progress: Record<string, ItemProgress>,
  now: number,
): boolean {
  const p = progress[item.id]
  switch (filter) {
    case 'new':
      return !p || (p.attempts === 0 && !p.viewedAt)
    case 'learned':
      return Boolean(p?.learnedAt)
    case 'errors':
      return Boolean(p?.unresolvedError)
    case 'due':
      return isDue(p, now)
    default:
      return true
  }
}

export function matchesAllFilters(
  item: Item,
  filters: StudyFilters,
  progress: Record<string, ItemProgress>,
  now: number,
): boolean {
  if (!itemMatchesBaseFilters(item, filters, progress, now)) return false
  if (filters.excludeMastered && isMastered(progress[item.id])) return false
  return itemMatchesFilter(item, filters.itemFilter, progress, now)
}

function priority(item: Item, progress: Record<string, ItemProgress>, now: number): number {
  const p = progress[item.id]
  if (!p) return 20
  if (isDue(p, now)) return 0
  if (p.unresolvedError) return 1
  const status = getStatus(p)
  if (status === 'attention') return 2
  if (status === 'new') return 10
  if (status === 'viewed') return 30
  if (status === 'learning') return 40
  if (status === 'learned') return 50
  return 60
}

export function selectItems(
  items: Item[],
  filters: StudyFilters,
  progress: Record<string, ItemProgress>,
  now = Date.now(),
): Item[] {
  return items
    .filter((item) => matchesAllFilters(item, filters, progress, now))
    .sort((a, b) => {
      const pa = priority(a, progress, now)
      const pb = priority(b, progress, now)
      if (pa !== pb) return pa - pb
      const wa = weakScore(progress[a.id])
      const wb = weakScore(progress[b.id])
      if (wa !== wb) return wb - wa
      const da = progress[a.id]?.due ?? 0
      const db = progress[b.id]?.due ?? 0
      if (da !== db) return da - db
      return a.title.localeCompare(b.title, 'ru')
    })
}

export function countBaseItems(
  items: Item[],
  filters: StudyFilters,
  progress: Record<string, ItemProgress>,
  now: number,
): number {
  return items.filter((item) => itemMatchesBaseFilters(item, filters, progress, now)).length
}

export function filterCounts(
  items: Item[],
  filters: StudyFilters,
  progress: Record<string, ItemProgress>,
  now: number,
): Record<ItemFilter, number> {
  const base = items.filter((item) => itemMatchesBaseFilters(item, filters, progress, now))
  const counts: Record<ItemFilter, number> = {
    all: 0,
    new: 0,
    learned: 0,
    errors: 0,
    due: 0,
  }
  for (const item of base) {
    if (filters.excludeMastered && isMastered(progress[item.id])) continue
    counts.all += 1
    for (const filter of ['new', 'learned', 'errors', 'due'] as const) {
      if (itemMatchesFilter(item, filter, progress, now)) counts[filter] += 1
    }
  }
  return counts
}

export function resolveTopicIds(filters: StudyFilters, items: Item[]): string[] {
  if (filters.topicIds.length > 0) return filters.topicIds
  return Array.from(new Set(items.filter((item) => filters.grades.includes(item.grade)).map((item) => item.topicId)))
}
