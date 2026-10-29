export type Rng = () => number

export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(input: T[], rng: () => number): T[] {
  const result = [...input]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

export function sample<T>(input: T[], count: number, rng: () => number): T[] {
  if (count >= input.length) return shuffle(input, rng)
  return shuffle(input, rng).slice(0, count)
}

/**
 * Берёт элементы по кругу из разных тем: сначала по одному из каждой темы,
 * затем второй круг и так далее. Так короткая тренировка не сваливается
 * в одну тему только потому, что она стоит первой в сортировке.
 */
export function balancedSample<T>(
  input: T[],
  count: number,
  topicOf: (item: T) => string,
  rng: () => number,
): T[] {
  if (count <= 0 || input.length === 0) return []
  const limit = Math.min(count, input.length)
  const groups = new Map<string, T[]>()
  for (const item of input) {
    const key = topicOf(item)
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  }
  const topicOrder = shuffle(Array.from(groups.keys()), rng)
  const queues = topicOrder.map((key) => shuffle(groups.get(key) ?? [], rng))
  const result: T[] = []
  while (result.length < limit) {
    let addedInRound = false
    for (const queue of queues) {
      if (result.length >= limit) break
      const item = queue.shift()
      if (item !== undefined) {
        result.push(item)
        addedInRound = true
      }
    }
    if (!addedInRound) break
  }
  return result
}

export function pick<T>(input: T[], rng: () => number): T {
  return input[Math.floor(rng() * input.length)]
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function uniqueTexts(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
