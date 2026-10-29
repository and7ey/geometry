import { AUTHORED_DRILLS } from '../../content/drills'
import type {
  Difficulty,
  Item,
  ItemProgress,
  Question,
  QuestionKind,
  QuestionOption,
  QuestionSkill,
  SessionKind,
} from '../../types'
import { isDue, isMastered, weakScore } from '../scheduling'
import { makeNumericQuestion, NUMERIC_TEMPLATES } from './numeric'
import { balancedSample, hashSeed, mulberry32, sample, shuffle, uniqueTexts, type Rng } from './random'
import { makeRecallQuestion } from './recall'

type Direction = 'term' | 'statement' | 'conclusion'

export interface GenerateQuizInput {
  items: Item[]
  count: number | 'all'
  difficulty: Difficulty
  topicIds: string[]
  seed: string
  mode?: 'quiz' | 'exam'
  skills?: QuestionSkill[]
}

export interface GenerateReviewInput extends GenerateQuizInput {
  progress: Record<string, ItemProgress>
}

function optionList(texts: string[], correct: string, rng: Rng): QuestionOption[] | null {
  const distractors = uniqueTexts(texts)
    .filter((text) => text !== correct)
    .slice(0, 3)
  if (distractors.length < 3) return null
  return shuffle([correct, ...distractors], rng).map((text, index) => ({
    id: `o${index}`,
    text,
    correct: text === correct,
  }))
}

function statementText(item: Item): string {
  return item.formula?.expression ?? item.statement
}

function makeItemQuestion(
  item: Item,
  direction: Direction,
  pool: Item[],
  rng: Rng,
): Question | null {
  const others = pool.filter((candidate) => candidate.id !== item.id)
  const sameCategory = others.filter((candidate) => candidate.category === item.category)
  const source = sameCategory.length >= 3 ? sameCategory : others
  if (source.length < 3) return null

  if (direction === 'term') {
    const correct = statementText(item)
    const options = optionList(source.map(statementText), correct, rng)
    if (!options) return null
    return {
      id: `gen-${item.id}-term`,
      kind: 'single',
      topicId: item.topicId,
      itemIds: [item.id],
      prompt:
        item.category === 'formula'
          ? `Выберите верную формулу: «${item.title}».`
          : `Выберите верную формулировку: «${item.title}».`,
      explanation: `${item.title}. ${item.statement} ${item.plain}`,
      difficulty: item.difficulty,
      skill: 'recognition',
      source: 'generated',
      typeLabel: item.category === 'formula' ? 'Выбор формулы' : 'Выбор формулировки',
      options,
    }
  }

  if (direction === 'statement') {
    const correct = item.title
    const options = optionList(source.map((candidate) => candidate.title), correct, rng)
    if (!options) return null
    const prompt =
      item.category === 'formula'
        ? `Как называется формула ${item.formula?.expression ?? item.statement}?`
        : `Как называется утверждение: «${item.statement}»?`
    return {
      id: `gen-${item.id}-statement`,
      kind: 'single',
      topicId: item.topicId,
      itemIds: [item.id],
      prompt,
      explanation: `Это «${item.title}». ${item.plain}`,
      difficulty: item.difficulty,
      skill: 'discrimination',
      source: 'generated',
      typeLabel: 'Название по формулировке',
      options,
    }
  }

  const theoremItems = source.filter((candidate) => candidate.theorem)
  if (!item.theorem || theoremItems.length < 3) return null
  const correct = item.theorem.conclusion
  const options = optionList(
    theoremItems.map((candidate) => candidate.theorem?.conclusion ?? ''),
    correct,
    rng,
  )
  if (!options) return null
  return {
    id: `gen-${item.id}-conclusion`,
    kind: 'single',
    topicId: item.topicId,
    itemIds: [item.id],
    prompt: `Какое заключение у утверждения «${item.title}»?`,
    explanation: `Условие: ${item.theorem.condition}. Заключение: ${item.theorem.conclusion}.`,
    difficulty: item.difficulty,
    skill: 'application',
    source: 'generated',
    typeLabel: 'Условие и заключение',
    options,
  }
}

function prepareAuthored(question: Question, rng: Rng): Question {
  if (question.kind === 'single' || question.kind === 'multi' || question.kind === 'cloze') {
    return { ...question, options: shuffle(question.options, rng) }
  }
  return question
}

function directionsFor(difficulty: Difficulty): Direction[] {
  if (difficulty === 1) return ['term']
  if (difficulty === 2) return ['term', 'statement']
  return ['statement', 'term', 'conclusion']
}

function targetCount(input: GenerateQuizInput, authoredCount: number, numericCount: number): number {
  if (input.count !== 'all') return Math.min(input.count, 120)
  return Math.min(120, input.items.length + authoredCount + numericCount)
}

export function generateQuizQuestions(input: GenerateQuizInput): Question[] {
  const rng = mulberry32(hashSeed(input.seed))
  const eligible = input.items.filter((item) => item.difficulty <= input.difficulty)
  if (eligible.length === 0) return []

  const topics = new Set(
    input.topicIds.length > 0 ? input.topicIds : eligible.map((item) => item.topicId),
  )
  const authoredPool = AUTHORED_DRILLS.filter(
    (drill) =>
      topics.has(drill.topicId) &&
      drill.difficulty <= input.difficulty &&
      (!input.skills || input.skills.length === 0 || input.skills.includes(drill.skill ?? 'recognition')),
  )
  const numericPool = NUMERIC_TEMPLATES.filter(
    (template) => topics.has(template.topicId) && template.minDifficulty <= input.difficulty,
  )
  const target = targetCount(input, authoredPool.length, numericPool.length)
  const questions: Question[] = []
  const used = new Set<string>()

  const add = (question: Question | null): void => {
    if (!question || used.has(question.id) || questions.length >= target) return
    used.add(question.id)
    questions.push(question)
  }

  const curatedKinds: QuestionKind[] = ['multi', 'match', 'truefalse', 'cloze']
  const curated: Question[] = []
  for (const kind of curatedKinds) {
    const candidates = authoredPool.filter((drill) => drill.kind === kind)
    if (candidates.length > 0) curated.push(shuffle(candidates, rng)[0])
  }
  const curatedForTarget = curated.slice(0, Math.max(0, target - 1))
  const itemShare =
    input.skills && input.skills.length > 0
      ? 0
      : Math.max(1, target - curatedForTarget.length)
  const chosenItems = balancedSample(eligible, itemShare, (item) => item.topicId, rng)
  const chosenSet = new Set(chosenItems.map((item) => item.id))

  for (const item of chosenItems) {
    const directions = shuffle(directionsFor(input.difficulty), rng)
    let question: Question | null = null
    for (const direction of directions) {
      question = makeItemQuestion(item, direction, eligible, rng)
      if (question) break
    }
    if (rng() < 0.28) {
      const topicDrills = shuffle(
        authoredPool.filter((drill) => drill.topicId === item.topicId),
        rng,
      )
      const drill = topicDrills.find((candidate) => !used.has(candidate.id))
      if (drill) question = prepareAuthored(drill, rng)
    }
    add(question)
  }

  for (const drill of curatedForTarget) {
    if (questions.length >= target) break
    add(prepareAuthored(drill, rng))
  }

  for (const drill of balancedSample(authoredPool, authoredPool.length, (item) => item.topicId, rng)) {
    if (questions.length >= target) break
    add(prepareAuthored(drill, rng))
  }

  if (numericPool.length > 0) {
    let counter = 0
    for (let round = 0; round < 3 && questions.length < target; round += 1) {
      for (const template of shuffle(numericPool, rng)) {
        if (questions.length >= target) break
        counter += 1
        add(makeNumericQuestion(template, rng, counter))
      }
    }
  }

  for (const item of chosenItems) {
    if (questions.length >= target) break
    for (const direction of directionsFor(input.difficulty)) {
      add(makeItemQuestion(item, direction, eligible, rng))
      if (questions.length >= target) break
    }
  }

  if (questions.length < target) {
    const rest = balancedSample(
      eligible.filter((item) => !chosenSet.has(item.id)),
      eligible.length,
      (item) => item.topicId,
      rng,
    )
    for (const item of rest) {
      if (questions.length >= target) break
      for (const direction of directionsFor(input.difficulty)) {
        add(makeItemQuestion(item, direction, eligible, rng))
        if (questions.length >= target) break
      }
    }
  }

  return shuffle(questions, rng)
}

export function generateRecallQuestions(
  items: Item[],
  count: number | 'all',
  seed: string,
): Question[] {
  const rng = mulberry32(hashSeed(seed))
  const target = count === 'all' ? items.length : Math.min(count, items.length)
  return balancedSample(items, target, (item) => item.topicId, rng).map((item) =>
    makeRecallQuestion(item),
  )
}

export function generateReviewQuestions(input: GenerateReviewInput): Question[] {
  const { progress } = input
  const rng = mulberry32(hashSeed(input.seed))
  const target =
    input.count === 'all'
      ? Math.min(60, input.items.length)
      : Math.min(input.count, Math.min(60, input.items.length))

  const scored = [...input.items].sort((a, b) => {
    const pa = progress[a.id]
    const pb = progress[b.id]
    const dueA = isDue(pa) ? 3 : 0
    const dueB = isDue(pb) ? 3 : 0
    return weakScore(pb) + dueB - (weakScore(pa) + dueA)
  })

  const weakScored = scored.filter((item) => !isMastered(progress[item.id]))
  const masteredPool = scored.filter((item) => isMastered(progress[item.id]))
  let chosen = weakScored.slice(0, target)
  if (masteredPool.length > 0 && target >= 5 && chosen.length >= 3) {
    chosen = [...chosen.slice(0, target - 1), ...sample(masteredPool, 1, rng)]
  }
  const recallCandidates = chosen.filter((item) => (progress[item.id]?.recallSuccesses ?? 0) < 2)
  const recallCount = Math.min(recallCandidates.length, Math.ceil(target / 2))
  const recallItems = recallCandidates.slice(0, recallCount)
  const recallSet = new Set(recallItems.map((item) => item.id))

  const recallQuestions = recallItems.map((item) => makeRecallQuestion(item))
  const quizItems = chosen.filter((item) => !recallSet.has(item.id))
  const remaining = Math.max(0, target - recallQuestions.length)
  const quizQuestions =
    remaining > 0
      ? generateQuizQuestions({
          items: quizItems.length > 0 ? quizItems : chosen,
          count: remaining,
          difficulty: input.difficulty,
          topicIds: input.topicIds,
          seed: `${input.seed}-quiz`,
          mode: 'quiz',
        })
      : []

  return shuffle([...recallQuestions, ...quizQuestions], rng).slice(0, Math.max(target, 1))
}

export function buildQuestions(
  kind: SessionKind,
  input: GenerateQuizInput & { progress: Record<string, ItemProgress> },
): Question[] {
  switch (kind) {
    case 'recall':
      return generateRecallQuestions(input.items, input.count, input.seed)
    case 'review':
      return generateReviewQuestions(input)
    case 'quiz':
    case 'exam':
      return generateQuizQuestions(input)
    default:
      return []
  }
}
