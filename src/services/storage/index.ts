import { ITEM_BY_ID, TOPIC_BY_ID } from '../../content'
import type {
  ActiveSession,
  ReviewEvent,
  Category,
  DayStat,
  Grade,
  ItemFilter,
  ItemProgress,
  PersistedState,
  RouteProgress,
  SessionKind,
  SessionSummary,
  Settings,
  ThemePreference,
} from '../../types'
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  STORAGE_VERSION,
  emptyProgress,
  emptyState,
} from '../../types'

const SESSION_KEY = 'geomaster.activeSession'
const RESULT_KEY = 'geomaster.lastResult'
const CORRUPT_KEY = `${STORAGE_KEY}.corrupt`

const CATEGORIES: Category[] = [
  'definition',
  'property',
  'criterion',
  'theorem',
  'corollary',
  'axiom',
  'formula',
]
const SESSION_KINDS: SessionKind[] = ['study', 'flashcards', 'recall', 'quiz', 'exam', 'review']
const ITEM_FILTERS: ItemFilter[] = ['all', 'new', 'learned', 'errors', 'due']
const THEMES: ThemePreference[] = ['light', 'dark', 'system']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asInt(value: unknown, fallback: number, min: number, max: number): number {
  const number = Math.round(asNumber(value, fallback))
  return Math.min(max, Math.max(min, number))
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

export function sanitizeSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS }
  const grades = Array.isArray(raw.grades)
    ? unique(raw.grades.filter((grade): grade is Grade => grade === 7 || grade === 8))
    : []
  const categories = Array.isArray(raw.categories)
    ? unique(raw.categories.filter((value): value is Category => CATEGORIES.includes(value as Category)))
    : []
  const topicIds = Array.isArray(raw.topicIds)
    ? unique(
        raw.topicIds.filter(
          (value): value is string => typeof value === 'string' && TOPIC_BY_ID.has(value),
        ),
      )
    : []
  const countValue = raw.count
  const count =
    countValue === 'all' || [5, 10, 20, 30].includes(Number(countValue))
      ? (countValue === 'all' ? 'all' : (Number(countValue) as 5 | 10 | 20 | 30))
      : DEFAULT_SETTINGS.count
  return {
    grades: grades.length > 0 ? grades : [...DEFAULT_SETTINGS.grades],
    difficulty: asInt(raw.difficulty, DEFAULT_SETTINGS.difficulty, 1, 3) as 1 | 2 | 3,
    categories: categories.length > 0 ? categories : [...DEFAULT_SETTINGS.categories],
    topicIds,
    count,
    itemFilter: ITEM_FILTERS.includes(raw.itemFilter as ItemFilter)
      ? (raw.itemFilter as ItemFilter)
      : 'all',
    excludeMastered: asBool(raw.excludeMastered),
    mode: SESSION_KINDS.includes(raw.mode as SessionKind)
      ? (raw.mode as SessionKind)
      : DEFAULT_SETTINGS.mode,
    theme: THEMES.includes(raw.theme as ThemePreference)
      ? (raw.theme as ThemePreference)
      : 'system',
    onboarded: asBool(raw.onboarded),
  }
}

function sanitizeProgress(raw: unknown): Record<string, ItemProgress> {
  if (!isRecord(raw)) return {}
  const result: Record<string, ItemProgress> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (!ITEM_BY_ID.has(id) || !isRecord(value)) continue
    const base = emptyProgress()
    const history = Array.isArray(value.history)
      ? value.history
          .filter(isRecord)
          .slice(-12)
          .map((event): ReviewEvent => ({
            t: asNumber(event.t, 0),
            mode: SESSION_KINDS.includes(event.mode as SessionKind)
              ? (event.mode as SessionKind)
              : 'flashcards',
            result: (event.result === 'correct' || event.result === 'wrong' || event.result === 'partial'
              ? event.result
              : 'wrong') as ReviewEvent['result'],
            rating: (event.rating === 'again' ||
            event.rating === 'hard' ||
            event.rating === 'hint' ||
            event.rating === 'good'
              ? event.rating
              : undefined) as ReviewEvent['rating'],
            hints: asInt(event.hints, 0, 0, 20),
          }))
      : []
    result[id] = {
      ...base,
      level: asInt(value.level, 0, 0, 6),
      due: value.due === null ? null : asNumber(value.due, Number.NaN) || null,
      viewedAt: typeof value.viewedAt === 'number' ? value.viewedAt : undefined,
      learnedAt: typeof value.learnedAt === 'number' ? value.learnedAt : undefined,
      favorite: asBool(value.favorite),
      attempts: asInt(value.attempts, 0, 0, 100000),
      correct: asInt(value.correct, 0, 0, 100000),
      wrong: asInt(value.wrong, 0, 0, 100000),
      hintUses: asInt(value.hintUses, 0, 0, 100000),
      recallAttempts: asInt(value.recallAttempts, 0, 0, 100000),
      recallSuccesses: asInt(value.recallSuccesses, 0, 0, 100000),
      recallStreak: asInt(value.recallStreak, 0, 0, 100),
      understandAttempts: asInt(value.understandAttempts, 0, 0, 100000),
      understandSuccesses: asInt(value.understandSuccesses, 0, 0, 100000),
      lastResult:
        value.lastResult === 'correct' || value.lastResult === 'wrong' || value.lastResult === 'partial'
          ? value.lastResult
          : undefined,
      lastSeenAt: typeof value.lastSeenAt === 'number' ? value.lastSeenAt : undefined,
      lastReproducedAt:
        typeof value.lastReproducedAt === 'number' ? value.lastReproducedAt : undefined,
      unresolvedError: asBool(value.unresolvedError),
      history,
    }
  }
  return result
}

function sanitizeDays(raw: unknown): Record<string, DayStat> {
  if (!isRecord(raw)) return {}
  const entries: [string, DayStat][] = []
  for (const [key, value] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !isRecord(value)) continue
    entries.push([
      key,
      {
        reviews: asInt(value.reviews, 0, 0, 1000000),
        correct: asInt(value.correct, 0, 0, 1000000),
        wrong: asInt(value.wrong, 0, 0, 1000000),
        ms: asInt(value.ms, 0, 0, 1000000000),
        sessions: asInt(value.sessions, 0, 0, 100000),
      },
    ])
  }
  entries.sort(([a], [b]) => a.localeCompare(b))
  return Object.fromEntries(entries.slice(-400))
}

function sanitizeSession(raw: unknown): SessionSummary | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !isRecord(raw.config)) return null
  const kind = raw.kind
  if (!SESSION_KINDS.includes(kind as SessionKind)) return null
  const config = raw.config
  return {
    id: raw.id,
    kind: kind as SessionKind,
    startedAt: asNumber(raw.startedAt, 0),
    endedAt: asNumber(raw.endedAt, 0),
    activeMs: asNumber(raw.activeMs, 0),
    title: asString(raw.title, 'Занятие'),
    config: {
      grades: Array.isArray(config.grades)
        ? (config.grades.filter((g): g is Grade => g === 7 || g === 8) as Grade[])
        : [7, 8],
      difficulty: asInt(config.difficulty, 2, 1, 3) as 1 | 2 | 3,
      categories: Array.isArray(config.categories)
        ? (config.categories.filter((c): c is Category => CATEGORIES.includes(c as Category)) as Category[])
        : [...CATEGORIES],
      topicIds: Array.isArray(config.topicIds)
        ? (config.topicIds.filter((t): t is string => typeof t === 'string') as string[])
        : [],
      count: config.count === 'all' ? 'all' : (asInt(config.count, 10, 1, 100) as number),
      itemFilter: ITEM_FILTERS.includes(config.itemFilter as ItemFilter)
        ? (config.itemFilter as ItemFilter)
        : 'all',
      excludeMastered: asBool(config.excludeMastered),
    },
    total: asInt(raw.total, 0, 0, 100000),
    correct: asInt(raw.correct, 0, 0, 100000),
    wrong: asInt(raw.wrong, 0, 0, 100000),
    accuracy: Math.max(0, Math.min(1, asNumber(raw.accuracy, 0))),
    newItems: asInt(raw.newItems, 0, 0, 100000),
    reviewedItems: asInt(raw.reviewedItems, 0, 0, 100000),
  }
}

function sanitizeSessions(raw: unknown): SessionSummary[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(sanitizeSession)
    .filter((value): value is SessionSummary => Boolean(value))
    .slice(-50)
}

function sanitizeRoutes(raw: unknown): Record<string, RouteProgress> {
  if (!isRecord(raw)) return {}
  const result: Record<string, RouteProgress> = {}
  for (const [topicId, value] of Object.entries(raw)) {
    if (!TOPIC_BY_ID.has(topicId) || !isRecord(value)) continue
    result[topicId] = {
      topicId,
      startedAt: asNumber(value.startedAt, 0),
      updatedAt: asNumber(value.updatedAt, 0),
      done: Array.isArray(value.done)
        ? value.done.filter((v): v is string => typeof v === 'string').slice(0, 20)
        : [],
      current: asInt(value.current, 0, 0, 20),
    }
  }
  return result
}

function migrateState(raw: Record<string, unknown>): Record<string, unknown> {
  const version = typeof raw.version === 'number' ? raw.version : 0
  // v0 — состояние до появления поля version: те же секции, но без версии.
  if (version === 0) {
    return {
      ...raw,
      version: STORAGE_VERSION,
      days: isRecord(raw.days) ? raw.days : {},
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
      routes: isRecord(raw.routes) ? raw.routes : {},
    }
  }
  // Более новые версии читаем как есть: неизвестные поля отбрасываются sanitize.
  return raw
}

export function sanitizeState(raw: unknown): PersistedState | null {
  if (!isRecord(raw)) return null
  if (raw.version !== undefined && typeof raw.version !== 'number') return null
  const source = migrateState(raw)
  const lastStudyRaw = source.lastStudy
  let lastStudy: PersistedState['lastStudy'] = null
  if (isRecord(lastStudyRaw) && Array.isArray(lastStudyRaw.itemIds)) {
    const itemIds = unique(
      lastStudyRaw.itemIds.filter((id): id is string => typeof id === 'string' && ITEM_BY_ID.has(id)),
    ).slice(0, 300)
    if (itemIds.length > 0) {
      lastStudy = { itemIds, updatedAt: asNumber(lastStudyRaw.updatedAt, Date.now()) }
    }
  }
  return {
    version: STORAGE_VERSION,
    settings: sanitizeSettings(source.settings),
    progress: sanitizeProgress(source.progress),
    days: sanitizeDays(source.days),
    sessions: sanitizeSessions(source.sessions),
    routes: sanitizeRoutes(source.routes),
    lastStudy,
  }
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed: unknown = JSON.parse(raw)
    const state = sanitizeState(parsed)
    if (!state) {
      localStorage.setItem(CORRUPT_KEY, raw)
      return emptyState()
    }
    return state
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) localStorage.setItem(CORRUPT_KEY, raw)
    } catch {
      /* ignore */
    }
    return emptyState()
  }
}

export function saveState(state: PersistedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    try {
      const trimmed: PersistedState = {
        ...state,
        progress: Object.fromEntries(
          Object.entries(state.progress).map(([id, progress]) => [id, { ...progress, history: [] }]),
        ),
        sessions: state.sessions.slice(-10),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      return true
    } catch {
      return false
    }
  }
}

export interface ExportedData {
  app: 'geomaster'
  version: number
  exportedAt: number
  state: PersistedState
}

export function exportData(state: PersistedState): string {
  const payload: ExportedData = {
    app: 'geomaster',
    version: STORAGE_VERSION,
    exportedAt: Date.now(),
    state,
  }
  return JSON.stringify(payload, null, 2)
}

export function parseImport(raw: string): { ok: true; state: PersistedState } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return { ok: false, error: 'Файл не содержит объект данных.' }
    const candidate = parsed.app === 'geomaster' && isRecord(parsed.state) ? parsed.state : parsed
    if (!isRecord(candidate)) return { ok: false, error: 'Файл не содержит объект данных.' }
    const hasKnownField = ['version', 'settings', 'progress', 'days', 'sessions'].some(
      (key) => key in candidate,
    )
    if (!hasKnownField) {
      return { ok: false, error: 'Это не файл GeoMaster: не найдены настройки или прогресс.' }
    }
    const state = sanitizeState(candidate)
    if (!state) return { ok: false, error: 'Не удалось распознать структуру данных GeoMaster.' }
    return { ok: true, state }
  } catch {
    return { ok: false, error: 'Файл повреждён или это не JSON.' }
  }
}

export function downloadExport(state: PersistedState): void {
  const blob = new Blob([exportData(state)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `geomaster-backup-${date}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function saveActiveSession(session: ActiveSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* ignore */
  }
}

export function loadActiveSession(): ActiveSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.id !== 'string') return null
    if (!SESSION_KINDS.includes(parsed.kind as SessionKind)) return null
    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.itemIds)) return null
    return parsed as unknown as ActiveSession
  } catch {
    return null
  }
}

export function clearActiveSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function saveLastResult(result: unknown): void {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result))
  } catch {
    /* ignore */
  }
}

export function loadLastResult<T>(): T | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function applyTheme(preference: ThemePreference): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = preference === 'dark' || (preference === 'system' && prefersDark)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function watchSystemTheme(preference: ThemePreference, onChange: () => void): () => void {
  if (preference !== 'system') return () => undefined
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export { STORAGE_KEY, CORRUPT_KEY }
