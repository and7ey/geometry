import type { Category, Difficulty, Grade, ThemePreference } from './content'
import type { ItemFilter, RouteProgress, SessionConfig, SessionKind } from './quiz'

export type Rating = 'again' | 'hard' | 'hint' | 'good'

export type ItemStatus = 'new' | 'viewed' | 'learning' | 'learned' | 'mastered' | 'attention'

export interface ReviewEvent {
  t: number
  mode: SessionKind
  result: 'correct' | 'wrong' | 'partial'
  rating?: Rating
  hints: number
}

export interface ItemProgress {
  level: number
  due: number | null
  viewedAt?: number
  learnedAt?: number
  favorite: boolean
  attempts: number
  correct: number
  wrong: number
  hintUses: number
  recallAttempts: number
  recallSuccesses: number
  recallStreak: number
  understandAttempts: number
  understandSuccesses: number
  lastResult?: 'correct' | 'wrong' | 'partial'
  lastSeenAt?: number
  lastReproducedAt?: number
  unresolvedError: boolean
  history: ReviewEvent[]
}

export interface DayStat {
  reviews: number
  correct: number
  wrong: number
  ms: number
  sessions: number
}

export interface SessionSummary {
  id: string
  kind: SessionKind
  startedAt: number
  endedAt: number
  activeMs: number
  config: SessionConfig
  title: string
  total: number
  correct: number
  wrong: number
  accuracy: number
  newItems: number
  reviewedItems: number
}

export interface Settings {
  grades: Grade[]
  difficulty: Difficulty
  categories: Category[]
  topicIds: string[]
  count: number | 'all'
  itemFilter: ItemFilter
  excludeMastered: boolean
  mode: SessionKind
  theme: ThemePreference
  onboarded: boolean
}

export interface PersistedState {
  version: 1
  settings: Settings
  progress: Record<string, ItemProgress>
  days: Record<string, DayStat>
  sessions: SessionSummary[]
  routes: Record<string, RouteProgress>
  lastStudy: { itemIds: string[]; updatedAt: number } | null
}

export interface AppState extends PersistedState {
  hydrated: boolean
}

export const STORAGE_KEY = 'geomaster.v1'
export const STORAGE_VERSION = 1

export const DEFAULT_SETTINGS: Settings = {
  grades: [7, 8],
  difficulty: 2,
  categories: ['definition', 'property', 'criterion', 'theorem', 'corollary', 'axiom', 'formula'],
  topicIds: [],
  count: 10,
  itemFilter: 'all',
  excludeMastered: false,
  mode: 'flashcards',
  theme: 'system',
  onboarded: false,
}

export function emptyProgress(): ItemProgress {
  return {
    level: 0,
    due: null,
    favorite: false,
    attempts: 0,
    correct: 0,
    wrong: 0,
    hintUses: 0,
    recallAttempts: 0,
    recallSuccesses: 0,
    recallStreak: 0,
    understandAttempts: 0,
    understandSuccesses: 0,
    unresolvedError: false,
    history: [],
  }
}

export function emptyState(): PersistedState {
  return {
    version: STORAGE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
    days: {},
    sessions: [],
    routes: {},
    lastStudy: null,
  }
}

export const FILTER_LABELS: Record<ItemFilter, string> = {
  all: 'Все материалы',
  new: 'Только новые',
  learned: 'Только изученные',
  errors: 'Только ошибки',
  due: 'Пора повторить',
}
