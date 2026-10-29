import { ITEMS } from '../../content'
import type {
  ActiveSession,
  Category,
  Item,
  ItemProgress,
  Question,
  QuestionSkill,
  SessionConfig,
  SessionKind,
  Settings,
} from '../../types'
import { selectItems, type StudyFilters } from '../filters'
import { buildQuestions } from '../quiz/generate'
import { balancedSample, hashSeed, mulberry32 } from '../quiz/random'

export function filtersFromSettings(settings: Settings): StudyFilters {
  return {
    grades: settings.grades,
    difficulty: settings.difficulty,
    categories: settings.categories,
    topicIds: settings.topicIds,
    itemFilter: settings.itemFilter,
    excludeMastered: settings.excludeMastered,
  }
}

export function configFromSettings(settings: Settings): SessionConfig {
  return {
    grades: settings.grades,
    difficulty: settings.difficulty,
    categories: settings.categories,
    topicIds: settings.topicIds,
    count: settings.count,
    itemFilter: settings.itemFilter,
    excludeMastered: settings.excludeMastered,
  }
}

const kindTitles: Record<SessionKind, string> = {
  study: 'Изучение',
  flashcards: 'Карточки',
  recall: 'Воспроизведение',
  quiz: 'Тест',
  exam: 'Экзамен',
  review: 'Работа над ошибками',
}

export interface CreateSessionOptions {
  topicId?: string
  topicTitle?: string
  categories?: Category[]
  count?: number | 'all'
  skills?: QuestionSkill[]
  difficulty?: Settings['difficulty']
  seed?: string
  itemIds?: string[]
  route?: { topicId: string; stepKey: string }
}

export function createSession(
  kind: SessionKind,
  settings: Settings,
  progress: Record<string, ItemProgress>,
  options: CreateSessionOptions = {},
): ActiveSession {
  const filters: StudyFilters = {
    ...filtersFromSettings(settings),
    ...(options.topicId ? { topicIds: [options.topicId] } : {}),
    ...(options.categories ? { categories: options.categories } : {}),
    ...(options.difficulty ? { difficulty: options.difficulty } : {}),
  }
  if (kind === 'review') {
    filters.itemFilter = 'all'
    filters.excludeMastered = false
  }

  let selected = selectItems(ITEMS, filters, progress, Date.now())
  if (options.itemIds && options.itemIds.length > 0) {
    const allowed = new Set(options.itemIds)
    selected = ITEMS.filter((item) => allowed.has(item.id))
  }
  const count = options.count ?? (kind === 'study' ? 'all' : settings.count)
  const config: SessionConfig = {
    grades: filters.grades,
    difficulty: filters.difficulty,
    categories: filters.categories,
    topicIds: filters.topicIds,
    count,
    itemFilter: filters.itemFilter,
    excludeMastered: filters.excludeMastered,
  }

  const seed = options.seed ?? `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let itemIds: string[] = []
  let questions: Question[] = []

  if (kind === 'study' || kind === 'flashcards') {
    const rng = mulberry32(hashSeed(seed))
    const wanted = kind === 'study' || count === 'all' ? selected.length : count
    const list = balancedSample(selected, wanted, (item) => item.topicId, rng)
    itemIds = list.map((item) => item.id)
  } else {
    const generated = buildQuestions(kind, {
      items: selected,
      count,
      difficulty: filters.difficulty,
      topicIds: config.topicIds,
      seed,
      mode: kind === 'exam' ? 'exam' : 'quiz',
      progress,
      skills: options.skills,
    })
    questions = generated
    itemIds = Array.from(new Set(generated.flatMap((question) => question.itemIds)))
  }

  const newItemCount = itemIds.filter((id) => {
    const p = progress[id]
    return !p || (p.attempts === 0 && !p.viewedAt)
  }).length

  const topicSuffix = options.topicTitle ? ` · ${options.topicTitle}` : ''
  return {
    id: seed,
    kind,
    startedAt: Date.now(),
    lastTickAt: Date.now(),
    activeMs: 0,
    config,
    itemIds,
    questions,
    answers: {},
    index: 0,
    revealed: false,
    route: options.route,
    title: `${kindTitles[kind]}${topicSuffix}`,
    newItemCount,
    reviewedCount: itemIds.length - newItemCount,
    requeued: [],
  }
}

export function sessionItem(session: ActiveSession, index: number): Item | undefined {
  const id = session.itemIds[index]
  return id ? ITEMS.find((item) => item.id === id) : undefined
}

export function sessionSeed(session: ActiveSession): string {
  return String(hashSeed(session.id))
}
