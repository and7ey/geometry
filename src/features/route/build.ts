import { ITEMS_BY_TOPIC, TOPIC_BY_ID } from '../../content'
import type { Category, RouteStage } from '../../types'

const ALL_CATEGORIES: Category[] = [
  'definition',
  'property',
  'criterion',
  'theorem',
  'corollary',
  'axiom',
  'formula',
]

export function buildRoute(topicId: string): RouteStage[] {
  const topic = TOPIC_BY_ID.get(topicId)
  const items = ITEMS_BY_TOPIC.get(topicId) ?? []
  if (!topic || items.length === 0) return []

  const has = (category: Category): boolean => items.some((item) => item.category === category)
  const stages: RouteStage[] = []

  if (has('definition')) {
    stages.push({
      key: 'definitions',
      title: 'Разберите определения',
      description: 'Прочитайте формулировки, примеры и типичные ошибки. Отметьте то, что уже понятно.',
      kind: 'study',
      categories: ['definition'],
      count: 'all',
    })
  }

  if (has('property')) {
    stages.push({
      key: 'properties',
      title: 'Запомните свойства',
      description: 'Карточки со свойствами: вспомните формулировку и честно оцените себя.',
      kind: 'flashcards',
      categories: ['property'],
      count: 10,
    })
  }

  if (has('criterion')) {
    stages.push({
      key: 'criteria',
      title: 'Разберите признаки',
      description: 'Признак — достаточное условие. Отдельно от свойства, чтобы не путать направление вывода.',
      kind: 'flashcards',
      categories: ['criterion'],
      count: 10,
    })
  }

  if (has('property') || has('criterion') || has('theorem')) {
    stages.push({
      key: 'discrimination',
      title: 'Свойство или признак?',
      description: 'Задания на различение похожих утверждений, прямых и обратных теорем.',
      kind: 'quiz',
      categories: ['property', 'criterion', 'theorem'],
      skills: ['property-criterion', 'discrimination', 'converse'],
      count: 8,
    })
  }

  stages.push({
    key: 'recall',
    title: 'Сформулируйте по памяти',
    description: 'Свободное воспроизведение без выбора ответа. Подсказка доступна, но она снижает оценку.',
    kind: 'recall',
    categories: ALL_CATEGORIES,
    count: 8,
  })

  stages.push({
    key: 'quiz',
    title: 'Проверьте себя',
    description: 'Смешанный тест по теме: формулировки, применение и вычисления.',
    kind: 'quiz',
    categories: ALL_CATEGORIES,
    count: 10,
  })

  stages.push({
    key: 'review',
    title: 'Закройте пробелы',
    description: 'Повторение ошибок и слабых мест именно по этой теме.',
    kind: 'review',
    categories: ALL_CATEGORIES,
    count: 10,
  })

  return stages
}
