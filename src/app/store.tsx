import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type {
  ItemProgress,
  PersistedState,
  Rating,
  RouteProgress,
  SessionKind,
  SessionSummary,
  Settings,
} from '../types'
import { STORAGE_KEY, emptyState } from '../types'
import {
  applyFavorite,
  applyLearned,
  applyQuizResult,
  applyRating,
  applyRecallResult,
  applyStudyView,
  dayKey,
} from '../services/scheduling'
import { loadState, saveState, applyTheme, watchSystemTheme } from '../services/storage'
import { buildOverview, type Overview } from '../services/statistics'

type Action =
  | { type: 'replace'; state: PersistedState }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'view'; id: string }
  | { type: 'learn'; id: string }
  | { type: 'favorite'; id: string; value: boolean }
  | { type: 'rate'; id: string; rating: Rating; mode: SessionKind }
  | { type: 'recall'; id: string; self: Rating; auto: 'match' | 'partial' | 'mismatch'; hints: number }
  | { type: 'quiz'; id: string; correct: boolean; mode: SessionKind }
  | { type: 'finishSession'; summary: SessionSummary; activeMs: number; date: string }
  | { type: 'route'; topicId: string; stepKey: string; current: number }
  | { type: 'lastStudy'; itemIds: string[] }
  | { type: 'resetRoute'; topicId: string }
  | { type: 'resetProgress' }
  | { type: 'resetAll' }

function withDay(
  state: PersistedState,
  date: string,
  updater: (day: PersistedState['days'][string]) => void,
): PersistedState['days'] {
  const current = state.days[date] ?? { reviews: 0, correct: 0, wrong: 0, ms: 0, sessions: 0 }
  const next = { ...current }
  updater(next)
  return { ...state.days, [date]: next }
}

function setProgress(
  state: PersistedState,
  id: string,
  progress: ItemProgress,
): Record<string, ItemProgress> {
  return { ...state.progress, [id]: progress }
}

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'replace':
      return action.state
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'view': {
      const progress = applyStudyView(state.progress[action.id])
      return { ...state, progress: setProgress(state, action.id, progress) }
    }
    case 'learn': {
      const progress = applyLearned(state.progress[action.id])
      return { ...state, progress: setProgress(state, action.id, progress) }
    }
    case 'favorite': {
      const progress = applyFavorite(state.progress[action.id], action.value)
      return { ...state, progress: setProgress(state, action.id, progress) }
    }
    case 'rate': {
      const now = Date.now()
      const progress = applyRating(state.progress[action.id], action.rating, now, action.mode)
      return {
        ...state,
        progress: setProgress(state, action.id, progress),
        days: withDay(state, dayKey(now), (day) => {
          day.reviews += 1
          if (action.rating === 'good') day.correct += 1
          else day.wrong += 1
        }),
      }
    }
    case 'recall': {
      const now = Date.now()
      const progress = applyRecallResult(
        state.progress[action.id],
        action.self,
        action.auto,
        action.hints,
        now,
      )
      const success = action.self === 'good' && action.auto !== 'mismatch'
      return {
        ...state,
        progress: setProgress(state, action.id, progress),
        days: withDay(state, dayKey(now), (day) => {
          day.reviews += 1
          if (success) day.correct += 1
          else day.wrong += 1
        }),
      }
    }
    case 'quiz': {
      const now = Date.now()
      const progress = applyQuizResult(state.progress[action.id], action.correct, now, action.mode)
      return {
        ...state,
        progress: setProgress(state, action.id, progress),
        days: withDay(state, dayKey(now), (day) => {
          day.reviews += 1
          if (action.correct) day.correct += 1
          else day.wrong += 1
        }),
      }
    }
    case 'finishSession': {
      return {
        ...state,
        sessions: [...state.sessions, action.summary].slice(-50),
        days: withDay(state, action.date, (day) => {
          day.ms += Math.max(0, action.activeMs)
          day.sessions += 1
        }),
      }
    }
    case 'route': {
      const existing: RouteProgress = state.routes[action.topicId] ?? {
        topicId: action.topicId,
        startedAt: Date.now(),
        updatedAt: Date.now(),
        done: [],
        current: 0,
      }
      const done = existing.done.includes(action.stepKey)
        ? existing.done
        : [...existing.done, action.stepKey]
      return {
        ...state,
        routes: {
          ...state.routes,
          [action.topicId]: {
            ...existing,
            done,
            current: action.current,
            updatedAt: Date.now(),
          },
        },
      }
    }
    case 'lastStudy':
      return { ...state, lastStudy: { itemIds: action.itemIds, updatedAt: Date.now() } }
    case 'resetRoute': {
      const routes = { ...state.routes }
      delete routes[action.topicId]
      return { ...state, routes }
    }
    case 'resetProgress':
      return {
        ...state,
        progress: {},
        days: {},
        sessions: [],
        routes: {},
        lastStudy: null,
      }
    case 'resetAll':
      return emptyState()
    default:
      return state
  }
}

interface StoreValue {
  state: PersistedState
  settings: Settings
  overview: Overview
  updateSettings: (patch: Partial<Settings>) => void
  markViewed: (id: string) => void
  markLearned: (id: string) => void
  toggleFavorite: (id: string) => void
  rate: (id: string, rating: Rating, mode: SessionKind) => void
  recall: (id: string, self: Rating, auto: 'match' | 'partial' | 'mismatch', hints: number) => void
  quiz: (id: string, correct: boolean, mode: SessionKind) => void
  finishSession: (summary: SessionSummary, activeMs: number) => void
  completeRouteStep: (topicId: string, stepKey: string, current: number) => void
  resetRoute: (topicId: string) => void
  replaceState: (state: PersistedState) => void
  resetProgress: () => void
  resetAll: () => void
  setLastStudy: (itemIds: string[]) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const skipSave = useRef(false)
  const saveTimer = useRef<number | null>(null)

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    dispatch({ type: 'settings', patch })
  }, [])

  const markViewed = useCallback((id: string) => dispatch({ type: 'view', id }), [])
  const markLearned = useCallback((id: string) => dispatch({ type: 'learn', id }), [])
  const toggleFavorite = useCallback(
    (id: string) => {
      const value = !state.progress[id]?.favorite
      dispatch({ type: 'favorite', id, value })
    },
    [state.progress],
  )
  const rate = useCallback(
    (id: string, rating: Rating, mode: SessionKind) => dispatch({ type: 'rate', id, rating, mode }),
    [],
  )
  const recall = useCallback(
    (id: string, self: Rating, auto: 'match' | 'partial' | 'mismatch', hints: number) =>
      dispatch({ type: 'recall', id, self, auto, hints }),
    [],
  )
  const quiz = useCallback(
    (id: string, correct: boolean, mode: SessionKind) => dispatch({ type: 'quiz', id, correct, mode }),
    [],
  )
  const finishSession = useCallback((summary: SessionSummary, activeMs: number) => {
    dispatch({ type: 'finishSession', summary, activeMs, date: dayKey(Date.now()) })
  }, [])
  const completeRouteStep = useCallback((topicId: string, stepKey: string, current: number) => {
    dispatch({ type: 'route', topicId, stepKey, current })
  }, [])
  const replaceState = useCallback((next: PersistedState) => dispatch({ type: 'replace', state: next }), [])
  const resetRoute = useCallback((topicId: string) => dispatch({ type: 'resetRoute', topicId }), [])
  const resetProgress = useCallback(() => dispatch({ type: 'resetProgress' }), [])
  const resetAll = useCallback(() => dispatch({ type: 'resetAll' }), [])
  const setLastStudy = useCallback((itemIds: string[]) => {
    dispatch({ type: 'lastStudy', itemIds })
  }, [])

  useEffect(() => {
    applyTheme(state.settings.theme)
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveState(state)
    }, 120)
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    }
  }, [state])

  useEffect(() => {
    const onChange = () => applyTheme(state.settings.theme)
    return watchSystemTheme(state.settings.theme, onChange)
  }, [state.settings.theme])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return
      const next = loadState()
      skipSave.current = true
      dispatch({ type: 'replace', state: next })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const overview = useMemo(() => buildOverview(state), [state])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      settings: state.settings,
      overview,
      updateSettings,
      markViewed,
      markLearned,
      toggleFavorite,
      rate,
      recall,
      quiz,
      finishSession,
      completeRouteStep,
      resetRoute,
      replaceState,
      resetProgress,
      resetAll,
      setLastStudy,
    }),
    [
      state,
      overview,
      updateSettings,
      markViewed,
      markLearned,
      toggleFavorite,
      rate,
      recall,
      quiz,
      finishSession,
      completeRouteStep,
      resetRoute,
      replaceState,
      resetProgress,
      resetAll,
      setLastStudy,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('StoreProvider не найден')
  return value
}
