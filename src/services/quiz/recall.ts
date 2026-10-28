import type { Item, RecallQuestion } from '../../types'

const STOPWORDS = new Set([
  'это',
  'как',
  'что',
  'для',
  'или',
  'при',
  'если',
  'то',
  'его',
  'её',
  'их',
  'все',
  'всех',
  'всего',
  'через',
  'между',
  'который',
  'которая',
  'которые',
  'которых',
  'одной',
  'одного',
  'двух',
  'двумя',
  'равны',
  'равен',
  'равна',
  'равно',
  'является',
  'называется',
  'которая',
  'которое',
  'только',
  'также',
  'может',
  'быть',
  'него',
  'неё',
  'этой',
  'этот',
  'этого',
  'тогда',
  'стороны',
  'сторона',
])

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^а-яa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(text: string): string[] {
  return normalizeText(text).split(' ').filter(Boolean)
}

export function stem(word: string): string {
  const normalized = word.replace(/ё/g, 'е')
  if (normalized.length <= 4) return normalized
  return normalized.slice(0, Math.min(5, normalized.length - 1))
}

function stemsMatch(a: string, b: string): boolean {
  if (a === b) return true
  const min = Math.min(a.length, b.length)
  if (min < 4) return false
  return a.slice(0, 4) === b.slice(0, 4)
}

function groupMatches(group: string[], answerStems: string[]): boolean {
  return group.some((word) => {
    const target = stem(normalizeText(word))
    return target.length >= 3 && answerStems.some((candidate) => stemsMatch(target, candidate))
  })
}

export function autoKeyElements(item: Item): string[][] {
  const tokens = tokenize(`${item.statement} ${item.plain}`)
    .filter((token) => token.length >= 5 && !STOPWORDS.has(token))
    .map((token) => stem(token))
  const unique = Array.from(new Set(tokens)).slice(0, 5)
  if (unique.length === 0) {
    return [tokenize(item.title).filter((token) => token.length >= 4).slice(0, 2)]
  }
  return unique.map((word) => [word])
}

export function getKeyElements(item: Item): string[][] {
  const authored = item.recall?.keyElements
  if (authored && authored.length > 0) return authored
  return autoKeyElements(item)
}

export interface RecallEvaluation {
  auto: 'match' | 'partial' | 'mismatch'
  coverage: number
  found: string[]
  missing: string[]
  matchedTokens: number
}

export function evaluateRecall(answer: string, question: RecallQuestion): RecallEvaluation {
  const answerTokens = tokenize(answer)
  if (answerTokens.length < 3 || answer.trim().length < 12) {
    return {
      auto: 'mismatch',
      coverage: 0,
      found: [],
      missing: question.keyElements.map((group) => group[0]),
      matchedTokens: 0,
    }
  }

  const answerStems = answerTokens.map(stem)
  const found: string[] = []
  const missing: string[] = []
  for (const group of question.keyElements) {
    if (groupMatches(group, answerStems)) {
      found.push(group[0])
    } else {
      missing.push(group[0])
    }
  }
  const keyCoverage =
    question.keyElements.length > 0 ? found.length / question.keyElements.length : 0

  const referenceTokens = tokenize(question.answer)
  const referenceSet = new Set(referenceTokens.map(stem))
  const overlap = answerStems.filter((token) => referenceSet.has(token)).length
  const referenceCoverage = referenceTokens.length > 0 ? overlap / Math.max(3, referenceTokens.length) : 0
  const coverage = Math.max(keyCoverage, Math.min(1, referenceCoverage * 1.6))

  const auto: RecallEvaluation['auto'] =
    coverage >= 0.65 ? 'match' : coverage >= 0.32 ? 'partial' : 'mismatch'

  return {
    auto,
    coverage,
    found,
    missing,
    matchedTokens: answerTokens.length,
  }
}

export function makeRecallQuestion(item: Item, id?: string): RecallQuestion {
  const categoryPrompts: Record<Item['category'], string> = {
    definition: `Сформулируйте определение: «${item.title}».`,
    property: `Сформулируйте свойство: «${item.title}».`,
    criterion: `Сформулируйте признак: «${item.title}».`,
    theorem: `Сформулируйте теорему: «${item.title}».`,
    corollary: `Сформулируйте следствие: «${item.title}».`,
    axiom: `Сформулируйте аксиому: «${item.title}».`,
    formula: `Запишите формулу: «${item.title}».`,
  }
  const keyElements = getKeyElements(item)
  return {
    id: id ?? `recall-${item.id}`,
    kind: 'recall',
    topicId: item.topicId,
    itemIds: [item.id],
    itemId: item.id,
    prompt: categoryPrompts[item.category],
    explanation: item.plain,
    difficulty: item.difficulty,
    skill: 'reproduction',
    source: 'generated',
    typeLabel: 'Свободный ответ',
    answer: item.statement,
    hint:
      item.hint ??
      `Ориентиры: ${keyElements
        .slice(0, 3)
        .map((group) => group[0])
        .join(' · ')}`,
    keyElements,
    accepted: item.recall?.accepted,
  }
}
