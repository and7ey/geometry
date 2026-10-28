import { ITEMS } from '../../content'
import type {
  Category,
  DayStat,
  Grade,
  Item,
  ItemProgress,
  PersistedState,
  SessionSummary,
  Topic,
} from '../../types'
import { TOPICS } from '../../content'
import { CATEGORY_SHORT } from '../../types'
import { dayKey, endOfDay, getStatus, isDue, isMastered, weakScore } from '../scheduling'

export const DAILY_GOAL = 10

export interface ScoreRow {
  total: number
  learned: number
  mastered: number
  attention: number
  solved: number
  correct: number
  accuracy: number | null
}

export interface TopicRow extends ScoreRow {
  topic: Topic
}

export interface GradeRow extends ScoreRow {
  grade: Grade
}

export interface CategoryRow extends ScoreRow {
  category: Category
  label: string
}

export interface ActivityDay {
  key: string
  label: string
  reviews: number
  correct: number
  accuracy: number | null
}

export interface Overview {
  total: number
  viewed: number
  learned: number
  mastered: number
  due: number
  attention: number
  errors: number
  favorites: number
  solved: number
  correct: number
  wrong: number
  accuracy: number | null
  timeMs: number
  sessions: number
  streak: number
  bestStreak: number
  todayReviews: number
  dailyGoal: number
  byGrade: GradeRow[]
  byTopic: TopicRow[]
  byCategory: CategoryRow[]
  activity: ActivityDay[]
  recentSessions: SessionSummary[]
  weakItems: { item: Item; progress: ItemProgress }[]
  dueItems: Item[]
}

function blank(): ScoreRow {
  return { total: 0, learned: 0, mastered: 0, attention: 0, solved: 0, correct: 0, accuracy: null }
}

function add(row: ScoreRow, progress: ItemProgress | undefined): void {
  row.total += 1
  if (!progress) return
  if (progress.learnedAt) row.learned += 1
  if (isMastered(progress)) row.mastered += 1
  if (getStatus(progress) === 'attention') row.attention += 1
  row.solved += progress.understandAttempts + progress.recallAttempts
  row.correct += progress.understandSuccesses + progress.recallSuccesses
}

function finish(row: ScoreRow): void {
  row.accuracy = row.solved > 0 ? row.correct / row.solved : null
}

export function computeStreak(days: Record<string, DayStat>, now = Date.now()): number {
  let cursor = new Date(now)
  cursor.setHours(12, 0, 0, 0)
  if ((days[dayKey(cursor.getTime())]?.reviews ?? 0) === 0) {
    cursor = new Date(cursor.getTime() - 86400000)
  }
  let streak = 0
  while ((days[dayKey(cursor.getTime())]?.reviews ?? 0) > 0) {
    streak += 1
    cursor = new Date(cursor.getTime() - 86400000)
  }
  return streak
}

export function computeBestStreak(days: Record<string, DayStat>): number {
  const keys = Object.keys(days)
    .filter((key) => (days[key]?.reviews ?? 0) > 0)
    .sort()
  let best = 0
  let current = 0
  let previous: number | null = null
  for (const key of keys) {
    const time = new Date(`${key}T12:00:00`).getTime()
    if (previous !== null && Math.round((time - previous) / 86400000) === 1) {
      current += 1
    } else {
      current = 1
    }
    best = Math.max(best, current)
    previous = time
  }
  return best
}

function lastDays(count: number, now: number): ActivityDay[] {
  const result: ActivityDay[] = []
  const formatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setDate(date.getDate() - offset)
    date.setHours(12, 0, 0, 0)
    result.push({
      key: dayKey(date.getTime()),
      label: formatter.format(date).replace('.', ''),
      reviews: 0,
      correct: 0,
      accuracy: null,
    })
  }
  return result
}

export function buildOverview(state: PersistedState, now = Date.now()): Overview {
  const { progress, days, sessions } = state
  const overview: Overview = {
    total: ITEMS.length,
    viewed: 0,
    learned: 0,
    mastered: 0,
    due: 0,
    attention: 0,
    errors: 0,
    favorites: 0,
    solved: 0,
    correct: 0,
    wrong: 0,
    accuracy: null,
    timeMs: 0,
    sessions: 0,
    streak: computeStreak(days, now),
    bestStreak: computeBestStreak(days),
    todayReviews: days[dayKey(now)]?.reviews ?? 0,
    dailyGoal: DAILY_GOAL,
    byGrade: [],
    byTopic: [],
    byCategory: [],
    activity: lastDays(14, now),
    recentSessions: [...sessions].slice(-8).reverse(),
    weakItems: [],
    dueItems: [],
  }

  const gradeRows: Record<Grade, ScoreRow> = { 7: blank(), 8: blank() }
  const topicRows = new Map<string, ScoreRow>()
  const categoryRows = new Map<Category, ScoreRow>()

  for (const item of ITEMS) {
    const p = progress[item.id]
    if (p?.viewedAt || (p && p.attempts > 0)) overview.viewed += 1
    if (p?.learnedAt) overview.learned += 1
    if (isMastered(p)) overview.mastered += 1
    if (p?.favorite) overview.favorites += 1
    if (p && isDue(p, now)) {
      overview.due += 1
      overview.dueItems.push(item)
    }
    if (p?.unresolvedError) overview.errors += 1
    if (getStatus(p) === 'attention') overview.attention += 1
    if (p) {
      overview.solved += p.understandAttempts + p.recallAttempts
      overview.correct += p.understandSuccesses + p.recallSuccesses
      if (p.lastResult === 'wrong') overview.wrong += 1
    }

    add(gradeRows[item.grade], p)
    if (!topicRows.has(item.topicId)) topicRows.set(item.topicId, blank())
    add(topicRows.get(item.topicId)!, p)
    if (!categoryRows.has(item.category)) categoryRows.set(item.category, blank())
    add(categoryRows.get(item.category)!, p)

    if (p && (p.unresolvedError || p.wrong > 0) && weakScore(p) > 0) {
      overview.weakItems.push({ item, progress: p })
    }
  }

  overview.accuracy = overview.solved > 0 ? overview.correct / overview.solved : null
  overview.timeMs = Object.values(days).reduce((sum, day) => sum + day.ms, 0)
  overview.sessions = Object.values(days).reduce((sum, day) => sum + day.sessions, 0)

  for (const grade of [7, 8] as const) {
    finish(gradeRows[grade])
    overview.byGrade.push({ grade, ...gradeRows[grade] })
  }

  for (const topic of TOPICS) {
    const row = topicRows.get(topic.id) ?? blank()
    finish(row)
    overview.byTopic.push({ topic, ...row })
  }

  const categoryOrder: Category[] = [
    'definition',
    'property',
    'criterion',
    'theorem',
    'corollary',
    'axiom',
    'formula',
  ]
  for (const category of categoryOrder) {
    const row = categoryRows.get(category) ?? blank()
    finish(row)
    overview.byCategory.push({ category, label: CATEGORY_SHORT[category], ...row })
  }

  overview.weakItems.sort((a, b) => weakScore(b.progress) - weakScore(a.progress))
  overview.weakItems = overview.weakItems.slice(0, 12)
  overview.dueItems.sort((a, b) => (progress[a.id]?.due ?? 0) - (progress[b.id]?.due ?? 0))

  const activityMap = new Map(overview.activity.map((day) => [day.key, day]))
  for (const [key, value] of Object.entries(days)) {
    const target = activityMap.get(key)
    if (!target) continue
    target.reviews = value.reviews
    target.correct = value.correct
    target.accuracy = value.reviews > 0 ? value.correct / value.reviews : null
  }

  return overview
}

export function dueTodayCount(state: PersistedState, now = Date.now()): number {
  return ITEMS.filter((item) => isDue(state.progress[item.id], now)).length
}

export function todayEnd(now = Date.now()): number {
  return endOfDay(now)
}
