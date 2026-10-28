import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyProgress, emptyState, type PersistedState } from '../src/types'
import {
  exportData,
  loadState,
  parseImport,
  sanitizeState,
  saveState,
} from '../src/services/storage'

const memory = new Map<string, string>()

beforeEach(() => {
  memory.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() {
      return memory.size
    },
  })
})

function sampleState(): PersistedState {
  const state = emptyState()
  state.settings = { ...state.settings, grades: [8], difficulty: 3, onboarded: true }
  state.progress['g7-angle'] = {
    ...emptyProgress(),
    level: 4,
    attempts: 5,
    correct: 4,
    recallSuccesses: 2,
    recallStreak: 2,
    understandSuccesses: 2,
    learnedAt: 1,
  }
  state.days['2026-10-28'] = { reviews: 5, correct: 4, wrong: 1, ms: 60000, sessions: 1 }
  return state
}

describe('LocalStorage и импорт', () => {
  it('сохраняет и восстанавливает состояние', () => {
    const state = sampleState()
    expect(saveState(state)).toBe(true)
    const loaded = loadState()
    expect(loaded.settings.grades).toEqual([8])
    expect(loaded.settings.difficulty).toBe(3)
    expect(loaded.progress['g7-angle'].level).toBe(4)
    expect(loaded.days['2026-10-28'].reviews).toBe(5)
  })

  it('безопасно обрабатывает повреждённые данные', () => {
    memory.set('geomaster.v1', '{битый json')
    const loaded = loadState()
    expect(loaded.settings.grades).toEqual([7, 8])
    expect(loaded.progress).toEqual({})
    expect(memory.get('geomaster.v1.corrupt')).toContain('битый json')
  })

  it('нормализует неизвестные поля и значения', () => {
    const sanitized = sanitizeState({
      version: 1,
      settings: {
        grades: [9],
        difficulty: 99,
        categories: ['nonsense'],
        topicIds: ['bad-topic'],
        count: 7,
        itemFilter: 'bad',
        theme: 'neon',
      },
      progress: {
        'bad-id': { level: 3 },
        'g7-angle': { level: 99, due: 'x', attempts: 2, history: 'no' },
      },
      days: { '2026-10-28': { reviews: 3, correct: 2, wrong: 1, ms: 1000, sessions: 1 } },
      sessions: [{ id: 'broken' }],
      routes: { 'bad-topic': {} },
      lastStudy: { itemIds: ['bad-id', 'g7-angle'] },
    })
    expect(sanitized).not.toBeNull()
    if (!sanitized) return
    expect(sanitized.settings.grades).toEqual([7, 8])
    expect(sanitized.settings.difficulty).toBe(3)
    expect(sanitized.settings.categories.length).toBe(7)
    expect(sanitized.settings.count).toBe(10)
    expect(sanitized.settings.theme).toBe('system')
    expect(sanitized.progress['bad-id']).toBeUndefined()
    expect(sanitized.progress['g7-angle'].level).toBe(6)
    expect(sanitized.progress['g7-angle'].due).toBeNull()
    expect(sanitized.days['2026-10-28'].reviews).toBe(3)
    expect(sanitized.sessions).toHaveLength(0)
    expect(sanitized.lastStudy?.itemIds).toEqual(['g7-angle'])
  })

  it('мигрирует данные без версии', () => {
    const sanitized = sanitizeState({
      settings: {
        grades: [7],
        difficulty: 2,
        categories: ['definition'],
        topicIds: [],
        count: 5,
        itemFilter: 'all',
        theme: 'dark',
      },
      progress: { 'g7-angle': { level: 2, attempts: 2 } },
    })
    expect(sanitized).not.toBeNull()
    if (!sanitized) return
    expect(sanitized.version).toBe(1)
    expect(sanitized.settings.theme).toBe('dark')
    expect(sanitized.progress['g7-angle'].level).toBe(2)
    expect(sanitized.days).toEqual({})
  })

  it('экспортирует и импортирует данные', () => {
    const state = sampleState()
    const json = exportData(state)
    const parsed = parseImport(json)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.state.settings.grades).toEqual([8])
    expect(parsed.state.progress['g7-angle'].level).toBe(4)
  })

  it('отклоняет чужой JSON', () => {
    const parsed = parseImport('{"hello":"world"}')
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error.length).toBeGreaterThan(0)
  })
})
