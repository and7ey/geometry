import type { Category, Grade, Item, Topic } from '../types/content'
import { G7_BASICS } from './g7/basics'
import { G7_PARALLEL } from './g7/parallel'
import { G7_TRIANGLES } from './g7/triangles'
import { G8_AREAS } from './g8/areas'
import { G8_CIRCLE } from './g8/circle'
import { G8_QUADS } from './g8/quads'
import { G8_SIMILARITY } from './g8/similarity'
import { SECTIONS, TOPICS, TOPIC_BY_ID } from './topics'

export { TOPICS, TOPIC_BY_ID, SECTIONS }

export const ITEMS: Item[] = [
  ...G7_BASICS,
  ...G7_TRIANGLES,
  ...G7_PARALLEL,
  ...G8_QUADS,
  ...G8_AREAS,
  ...G8_SIMILARITY,
  ...G8_CIRCLE,
]

export const ITEM_BY_ID = new Map<string, Item>(ITEMS.map((item) => [item.id, item]))

export const ITEMS_BY_TOPIC = new Map<string, Item[]>()
for (const item of ITEMS) {
  const list = ITEMS_BY_TOPIC.get(item.topicId) ?? []
  list.push(item)
  ITEMS_BY_TOPIC.set(item.topicId, list)
}

export const TOPICS_BY_GRADE: Record<Grade, Topic[]> = {
  7: TOPICS.filter((topic) => topic.grade === 7),
  8: TOPICS.filter((topic) => topic.grade === 8),
}

export const CATEGORIES: Category[] = [
  'definition',
  'property',
  'criterion',
  'theorem',
  'corollary',
  'axiom',
  'formula',
]

export const ALL_ITEM_IDS = ITEMS.map((item) => item.id)

export function getItem(id: string): Item | undefined {
  return ITEM_BY_ID.get(id)
}

export function getTopic(id: string): Topic | undefined {
  return TOPIC_BY_ID.get(id)
}

export function getRelated(item: Item): Item[] {
  return item.related.map((id) => ITEM_BY_ID.get(id)).filter((value): value is Item => Boolean(value))
}

export function itemsForTopics(topicIds: string[]): Item[] {
  if (topicIds.length === 0) return ITEMS
  const set = new Set(topicIds)
  return ITEMS.filter((item) => set.has(item.topicId))
}

export function countByTopic(topicId: string): number {
  return ITEMS_BY_TOPIC.get(topicId)?.length ?? 0
}

export function countByCategory(category: Category): number {
  return ITEMS.filter((item) => item.category === category).length
}

export const CONTENT_STATS = {
  items: ITEMS.length,
  grade7: ITEMS.filter((item) => item.grade === 7).length,
  grade8: ITEMS.filter((item) => item.grade === 8).length,
  topics: TOPICS.length,
}
