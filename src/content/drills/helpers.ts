import type {
  ClozeQuestion,
  Difficulty,
  MatchQuestion,
  MultiQuestion,
  QuestionOption,
  QuestionSkill,
  SingleQuestion,
  TrueFalseQuestion,
} from '../../types'

interface DrillBase {
  id: string
  topicId: string
  itemIds: string[]
  prompt: string
  explanation: string
  difficulty: Difficulty
  skill?: QuestionSkill
  typeLabel: string
}

function options(items: string[], correct: number[]): QuestionOption[] {
  return items.map((text, index) => ({ id: `o${index}`, text, correct: correct.includes(index) }))
}

export function single(
  base: DrillBase,
  variants: string[],
  correct: number,
): SingleQuestion {
  return { ...base, kind: 'single', source: 'authored', options: options(variants, [correct]) }
}

export function multi(
  base: DrillBase,
  variants: string[],
  correct: number[],
): MultiQuestion {
  return { ...base, kind: 'multi', source: 'authored', options: options(variants, correct) }
}

export function tf(
  base: DrillBase,
  statement: string,
  answer: boolean,
  misconception?: string,
): TrueFalseQuestion {
  return { ...base, kind: 'truefalse', source: 'authored', statement, answer, misconception }
}

export function match(
  base: DrillBase,
  pairs: [string, string][],
): MatchQuestion {
  const left = pairs.map(([l]) => l)
  const right = pairs.map(([, r]) => r)
  // Детерминированно переставляем правую колонку, чтобы сопоставление не было построчным.
  const shift = Math.max(1, Math.floor(right.length / 2))
  const rotated = [...right.slice(shift), ...right.slice(0, shift)]
  const mapping = left.map((_, index) => (index - shift + right.length) % right.length)
  return {
    ...base,
    kind: 'match',
    source: 'authored',
    left,
    right: rotated,
    pairs: mapping,
  }
}

export function cloze(
  base: DrillBase,
  text: string,
  correctText: string,
  distractors: string[],
): ClozeQuestion {
  const correctIndex = 1
  const variants = [distractors[0], correctText, ...distractors.slice(1)]
  return {
    ...base,
    kind: 'cloze',
    source: 'authored',
    text,
    options: options(variants, [correctIndex]),
  }
}
