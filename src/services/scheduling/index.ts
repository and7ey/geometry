import type { ItemProgress, ItemStatus, Rating } from '../../types'
import { emptyProgress } from '../../types'

export const DAY_MS = 24 * 60 * 60 * 1000
export const LEVEL_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60] as const
export const MASTERY_LEVEL = 5

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function endOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

export function dayKey(timestamp: number): string {
  const date = new Date(timestamp)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * DAY_MS
}

export function intervalDays(level: number): number {
  const index = Math.max(0, Math.min(level, LEVEL_INTERVALS_DAYS.length - 1))
  return LEVEL_INTERVALS_DAYS[index]
}

export function isMastered(progress: ItemProgress | undefined): boolean {
  if (!progress) return false
  return (
    progress.level >= MASTERY_LEVEL &&
    progress.recallSuccesses >= 2 &&
    progress.recallStreak >= 2 &&
    progress.understandSuccesses >= 2 &&
    !progress.unresolvedError
  )
}

export type { ItemStatus }

export function getStatus(progress: ItemProgress | undefined): ItemStatus {
  if (!progress) return 'new'
  if (isMastered(progress)) return 'mastered'
  if (progress.unresolvedError) return 'attention'
  if (progress.learnedAt) return 'learned'
  if (progress.viewedAt) return 'viewed'
  if (progress.attempts > 0) return 'learning'
  return 'new'
}

export function isDue(progress: ItemProgress | undefined, now = Date.now()): boolean {
  if (!progress || progress.attempts === 0 || progress.due == null) return false
  return progress.due <= endOfDay(now)
}

export function retention(progress: ItemProgress): number {
  return Math.max(0, Math.min(1, progress.level / (LEVEL_INTERVALS_DAYS.length - 1)))
}

export function itemAccuracy(progress: ItemProgress | undefined): number | null {
  if (!progress) return null
  const solved = progress.understandAttempts + progress.recallAttempts
  if (solved === 0) return null
  return (progress.understandSuccesses + progress.recallSuccesses) / solved
}

export function masteryProgress(progress: ItemProgress | undefined): number {
  if (!progress) return 0
  if (isMastered(progress)) return 1
  const levelPart = Math.min(progress.level, MASTERY_LEVEL) / MASTERY_LEVEL
  const recallPart = Math.min(progress.recallSuccesses, 2) / 2
  const understandPart = Math.min(progress.understandSuccesses, 2) / 2
  const cleanPart = progress.unresolvedError ? 0 : 1
  return Math.min(0.99, (levelPart * 0.4 + recallPart * 0.3 + understandPart * 0.2 + cleanPart * 0.1))
}

export function recallAccuracy(progress: ItemProgress): number | null {
  if (progress.recallAttempts === 0) return null
  return progress.recallSuccesses / progress.recallAttempts
}

function withHistory(progress: ItemProgress, event: ItemProgress['history'][number]): ItemProgress['history'] {
  return [...progress.history.slice(-11), event]
}

export function applyRating(
  current: ItemProgress | undefined,
  rating: Rating,
  now = Date.now(),
  mode: ItemProgress['history'][number]['mode'] = 'flashcards',
): ItemProgress {
  const progress: ItemProgress = { ...(current ?? emptyProgress()) }
  const history = [...progress.history]
  progress.attempts += 1
  progress.lastSeenAt = now

  if (rating === 'again') {
    progress.level = Math.max(0, progress.level - 2)
    progress.wrong += 1
    progress.recallStreak = 0
    progress.unresolvedError = true
    progress.lastResult = 'wrong'
    progress.due = now + 10 * 60 * 1000
    progress.recallAttempts += 1
    history.push({ t: now, mode, result: 'wrong', rating, hints: 0 })
  } else if (rating === 'hard') {
    progress.level = Math.max(0, progress.level - 1)
    progress.wrong += 1
    progress.recallStreak = 0
    progress.unresolvedError = true
    progress.lastResult = 'partial'
    progress.due = addDays(now, 1)
    progress.recallAttempts += 1
    history.push({ t: now, mode, result: 'partial', rating, hints: 0 })
  } else if (rating === 'hint') {
    progress.hintUses += 1
    progress.recallStreak = 0
    progress.unresolvedError = true
    progress.lastResult = 'partial'
    progress.due = addDays(now, 1)
    progress.recallAttempts += 1
    history.push({ t: now, mode, result: 'partial', rating, hints: 1 })
  } else {
    progress.level = Math.min(LEVEL_INTERVALS_DAYS.length - 1, progress.level + 1)
    progress.correct += 1
    progress.recallAttempts += 1
    progress.recallSuccesses += 1
    progress.recallStreak += 1
    progress.learnedAt = progress.learnedAt ?? now
    progress.lastReproducedAt = now
    progress.unresolvedError = false
    progress.lastResult = 'correct'
    progress.due = addDays(now, intervalDays(progress.level))
    history.push({ t: now, mode, result: 'correct', rating, hints: 0 })
  }

  progress.history = history.slice(-12)
  return progress
}

export function applyRecallResult(
  current: ItemProgress | undefined,
  self: Rating,
  auto: 'match' | 'partial' | 'mismatch',
  hintsUsed: number,
  now = Date.now(),
): ItemProgress {
  const effective = hintsUsed > 0 && self === 'good' ? 'hint' : self
  const next = applyRating(current, effective, now, 'recall')
  if (effective !== 'hint') next.hintUses += hintsUsed
  if (self === 'good' && auto === 'mismatch') {
    next.recallSuccesses = Math.max(0, next.recallSuccesses - 1)
    next.recallStreak = 0
    next.unresolvedError = true
    next.lastResult = 'partial'
  }
  if (self === 'good' && auto === 'match') {
    next.learnedAt = next.learnedAt ?? now
  }
  return next
}

export function applyStudyView(current: ItemProgress | undefined, now = Date.now()): ItemProgress {
  const progress: ItemProgress = { ...(current ?? emptyProgress()) }
  progress.viewedAt = progress.viewedAt ?? now
  return progress
}

export function applyLearned(current: ItemProgress | undefined, now = Date.now()): ItemProgress {
  const progress: ItemProgress = { ...(current ?? emptyProgress()) }
  progress.viewedAt = progress.viewedAt ?? now
  progress.learnedAt = progress.learnedAt ?? now
  return progress
}

export function applyFavorite(current: ItemProgress | undefined, favorite: boolean): ItemProgress {
  const progress: ItemProgress = { ...(current ?? emptyProgress()) }
  progress.favorite = favorite
  return progress
}

export function applyQuizResult(
  current: ItemProgress | undefined,
  correct: boolean,
  now = Date.now(),
  mode: ItemProgress['history'][number]['mode'] = 'quiz',
): ItemProgress {
  const progress: ItemProgress = { ...(current ?? emptyProgress()) }
  progress.understandAttempts += 1
  progress.lastSeenAt = now
  progress.attempts += 1

  if (correct) {
    progress.understandSuccesses += 1
    progress.correct += 1
    progress.lastResult = 'correct'
    progress.unresolvedError = false
    progress.due = Math.max(progress.due ?? now, addDays(now, 1))
    progress.history = withHistory(progress, { t: now, mode, result: 'correct', hints: 0 })
  } else {
    progress.wrong += 1
    progress.level = Math.max(0, progress.level - 1)
    progress.recallStreak = 0
    progress.lastResult = 'wrong'
    progress.unresolvedError = true
    progress.due = now
    progress.history = withHistory(progress, { t: now, mode, result: 'wrong', hints: 0 })
  }

  return progress
}

export function weakScore(progress: ItemProgress | undefined): number {
  if (!progress) return 0
  let score = 0
  if (progress.unresolvedError) score += 5
  score += Math.max(0, 3 - progress.level)
  score += Math.max(0, 2 - progress.recallStreak)
  score += progress.wrong * 0.5
  if (progress.hintUses > 0) score += 1
  return score
}
