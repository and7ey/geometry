import type { Difficulty, Item, QuestionOption, SingleQuestion } from '../../types'
import { formatNumber, randomInt, shuffle } from './random'
import type { Rng } from './random'

export interface NumericBuild {
  prompt: string
  correct: string
  distractors: string[]
  explanation: string
}

export interface NumericTemplate {
  id: string
  topicId: string
  itemIds: string[]
  minDifficulty: Difficulty
  build: (rng: Rng) => NumericBuild
}

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 12, 15],
  [12, 16, 20],
]

function pickTriple(rng: Rng): [number, number, number] {
  return TRIPLES[randomInt(rng, 0, TRIPLES.length - 1)]
}

export const NUMERIC_TEMPLATES: NumericTemplate[] = [
  {
    id: 'num-adjacent',
    topicId: 'g7-angle-pairs',
    itemIds: ['g7-angle-pairs-sum'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 2, 15) * 10
      const correct = 180 - a
      return {
        prompt: `Один из смежных углов равен ${a}°. Найдите второй угол.`,
        correct: `${correct}°`,
        distractors: [`${a}°`, '90°', `${180 + a}°`],
        explanation: `Сумма смежных углов 180°, поэтому второй угол: 180° − ${a}° = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-triangle-third-angle',
    topicId: 'g7-angle-sum',
    itemIds: ['g7-angle-sum-theorem'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 3, 8) * 10
      let b = randomInt(rng, 4, 8) * 10
      if (a + b > 160) b = 160 - a
      const correct = 180 - a - b
      return {
        prompt: `Два угла треугольника равны ${a}° и ${b}°. Найдите третий угол.`,
        correct: `${correct}°`,
        distractors: [`${a + b}°`, `${360 - a - b}°`, `${180 - a}°`],
        explanation: `Сумма углов треугольника 180°: 180° − ${a}° − ${b}° = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-exterior',
    topicId: 'g7-angle-sum',
    itemIds: ['g7-exterior-angle-theorem'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 4, 8) * 10
      const b = randomInt(rng, 4, 8) * 10
      const correct = a + b
      return {
        prompt: `Два внутренних угла треугольника, не смежных с внешним, равны ${a}° и ${b}°. Найдите внешний угол.`,
        correct: `${correct}°`,
        distractors: [`${180 - correct}°`, `${a}°`, `${180 - a}°`],
        explanation: `Внешний угол равен сумме двух не смежных внутренних: ${a}° + ${b}° = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-isosceles-base',
    topicId: 'g7-isosceles',
    itemIds: ['g7-isosceles-angles'],
    minDifficulty: 2,
    build: (rng) => {
      const vertex = randomInt(rng, 1, 7) * 20
      const correct = (180 - vertex) / 2
      return {
        prompt: `В равнобедренном треугольнике угол при вершине равен ${vertex}°. Найдите угол при основании.`,
        correct: `${correct}°`,
        distractors: [`${vertex}°`, `${180 - vertex}°`, `${90 - vertex / 2}°`],
        explanation: `Углы при основании равны: (180° − ${vertex}°) : 2 = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-right-30',
    topicId: 'g7-right',
    itemIds: ['g7-right-30'],
    minDifficulty: 2,
    build: (rng) => {
      const hypotenuse = randomInt(rng, 4, 12) * 2
      const correct = hypotenuse / 2
      return {
        prompt: `В прямоугольном треугольнике гипотенуза равна ${hypotenuse} см, а один из острых углов равен 30°. Найдите катет против этого угла.`,
        correct: `${correct} см`,
        distractors: [`${hypotenuse} см`, `${hypotenuse * 2} см`, `${correct + 2} см`],
        explanation: `Катет против угла 30° равен половине гипотенузы: ${hypotenuse} : 2 = ${correct} см.`,
      }
    },
  },
  {
    id: 'num-parallel-same-side',
    topicId: 'g7-parallel',
    itemIds: ['g7-parallel-property-same-side'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 3, 15) * 10
      const correct = 180 - a
      return {
        prompt: `При параллельных прямых один из односторонних углов равен ${a}°. Найдите второй.`,
        correct: `${correct}°`,
        distractors: [`${a}°`, `${180 + a}°`, '90°'],
        explanation: `Сумма односторонних углов при параллельных прямых 180°: 180° − ${a}° = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-square-area',
    topicId: 'g8-areas',
    itemIds: ['g8-area-square'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 2, 12)
      const correct = a * a
      return {
        prompt: `Найдите площадь квадрата со стороной ${a} см.`,
        correct: `${correct} см²`,
        distractors: [`${4 * a} см²`, `${2 * a} см²`, `${correct * 2} см²`],
        explanation: `S = a² = ${a}² = ${correct} см².`,
      }
    },
  },
  {
    id: 'num-rectangle-area',
    topicId: 'g8-areas',
    itemIds: ['g8-area-rectangle'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 3, 12)
      let b = randomInt(rng, 2, 9)
      if (b === a) b = a === 9 ? 8 : a + 1
      const correct = a * b
      return {
        prompt: `Найдите площадь прямоугольника со сторонами ${a} см и ${b} см.`,
        correct: `${correct} см²`,
        distractors: [`${2 * (a + b)} см²`, `${a + b} см²`, `${correct * 2} см²`],
        explanation: `S = ab = ${a} · ${b} = ${correct} см².`,
      }
    },
  },
  {
    id: 'num-parallelogram-area',
    topicId: 'g8-areas',
    itemIds: ['g8-area-parallelogram'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 4, 12)
      const h = randomInt(rng, 2, 8)
      const correct = a * h
      return {
        prompt: `Сторона параллелограмма равна ${a} см, высота, проведённая к ней, — ${h} см. Найдите площадь.`,
        correct: `${correct} см²`,
        distractors: [`${correct / 2} см²`, `${2 * correct} см²`, `${a + h} см²`],
        explanation: `S = a · h = ${a} · ${h} = ${correct} см².`,
      }
    },
  },
  {
    id: 'num-triangle-area',
    topicId: 'g8-areas',
    itemIds: ['g8-area-triangle'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 2, 10) * 2
      const h = randomInt(rng, 1, 6) * 2
      const correct = (a * h) / 2
      return {
        prompt: `Основание треугольника равно ${a} см, высота к нему — ${h} см. Найдите площадь.`,
        correct: `${correct} см²`,
        distractors: [`${a * h} см²`, `${a + h} см²`, `${correct * 2} см²`],
        explanation: `S = ½ · a · h = ½ · ${a} · ${h} = ${correct} см².`,
      }
    },
  },
  {
    id: 'num-trapezoid-area',
    topicId: 'g8-areas',
    itemIds: ['g8-area-trapezoid'],
    minDifficulty: 3,
    build: (rng) => {
      let a = randomInt(rng, 1, 4) * 2
      let b = randomInt(rng, 3, 6) * 2
      if (b === a) b = a + 2
      const h = randomInt(rng, 2, 6)
      const correct = ((a + b) / 2) * h
      return {
        prompt: `Основания трапеции равны ${a} см и ${b} см, высота — ${h} см. Найдите площадь.`,
        correct: `${correct} см²`,
        distractors: [`${(a + b) * h} см²`, `${a * h} см²`, `${b * h} см²`],
        explanation: `S = ½(a + b)h = ½ · ${a + b} · ${h} = ${correct} см².`,
      }
    },
  },
  {
    id: 'num-rhombus-area',
    topicId: 'g8-areas',
    itemIds: ['g8-area-rhombus'],
    minDifficulty: 3,
    build: (rng) => {
      const d1 = randomInt(rng, 2, 6) * 2
      let d2 = randomInt(rng, 3, 7) * 2
      if (d2 === d1) d2 = d1 + 2
      const correct = (d1 * d2) / 2
      return {
        prompt: `Диагонали ромба равны ${d1} см и ${d2} см. Найдите площадь ромба.`,
        correct: `${correct} см²`,
        distractors: [`${d1 * d2} см²`, `${d1 + d2} см²`, `${correct * 2} см²`],
        explanation: `S = ½ d₁d₂ = ½ · ${d1} · ${d2} = ${correct} см².`,
      }
    },
  },
  {
    id: 'num-pythagoras-hypotenuse',
    topicId: 'g8-pythagoras',
    itemIds: ['g8-pythagoras-theorem'],
    minDifficulty: 2,
    build: (rng) => {
      const [x, y, z] = pickTriple(rng)
      const a = rng() < 0.5 ? x : y
      const b = a === x ? y : x
      return {
        prompt: `Катеты прямоугольного треугольника равны ${a} и ${b}. Найдите гипотенузу.`,
        correct: `${z}`,
        distractors: [`${a + b}`, `${z + 2}`, `${z - 2}`],
        explanation: `c = √(${a}² + ${b}²) = √${a * a + b * b} = ${z}.`,
      }
    },
  },
  {
    id: 'num-pythagoras-leg',
    topicId: 'g8-pythagoras',
    itemIds: ['g8-pythagoras-leg'],
    minDifficulty: 3,
    build: (rng) => {
      const [x, y, z] = pickTriple(rng)
      const known = rng() < 0.5 ? x : y
      const missing = known === x ? y : x
      return {
        prompt: `Гипотенуза прямоугольного треугольника равна ${z}, один из катетов — ${known}. Найдите второй катет.`,
        correct: `${missing}`,
        distractors: [`${z + known}`, `${z - known}`, `${missing + 1}`],
        explanation: `a = √(${z}² − ${known}²) = √${z * z - known * known} = ${missing}.`,
      }
    },
  },
  {
    id: 'num-midline-triangle',
    topicId: 'g8-midline',
    itemIds: ['g8-midline-theorem'],
    minDifficulty: 2,
    build: (rng) => {
      const base = randomInt(rng, 1, 6) * 4
      const correct = base / 2
      return {
        prompt: `Средняя линия треугольника параллельна стороне, равной ${base} см. Найдите среднюю линию.`,
        correct: `${correct} см`,
        distractors: [`${base} см`, `${base * 2} см`, `${base / 4} см`],
        explanation: `Средняя линия равна половине стороны: ${base} : 2 = ${correct} см.`,
      }
    },
  },
  {
    id: 'num-midline-trapezoid',
    topicId: 'g8-midline',
    itemIds: ['g8-midline-trapezoid-theorem'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 1, 4) * 2
      let b = randomInt(rng, 3, 6) * 2
      if (b === a) b = a + 2
      const correct = (a + b) / 2
      return {
        prompt: `Основания трапеции равны ${a} см и ${b} см. Найдите среднюю линию.`,
        correct: `${correct} см`,
        distractors: [`${a + b} см`, `${Math.abs(a - b)} см`, `${a + b + 2} см`],
        explanation: `Средняя линия равна полусумме оснований: (${a} + ${b}) : 2 = ${correct} см.`,
      }
    },
  },
  {
    id: 'num-quad-fourth-angle',
    topicId: 'g8-quadrilaterals',
    itemIds: ['g8-quadrilateral-sum'],
    minDifficulty: 2,
    build: (rng) => {
      const a = randomInt(rng, 6, 12) * 10
      const b = randomInt(rng, 6, 12) * 10
      const c = randomInt(rng, 6, 12) * 10
      const correct = 360 - a - b - c
      return {
        prompt: `Три угла выпуклого четырёхугольника равны ${a}°, ${b}° и ${c}°. Найдите четвёртый угол.`,
        correct: `${correct}°`,
        distractors: [`${180 - correct}°`, `${a + b + c}°`, '90°'],
        explanation: `Сумма углов четырёхугольника 360°: 360° − ${a + b + c}° = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-inscribed-angle',
    topicId: 'g8-circle-angles',
    itemIds: ['g8-inscribed-angle-theorem'],
    minDifficulty: 2,
    build: (rng) => {
      const arc = randomInt(rng, 2, 15) * 20
      const correct = arc / 2
      return {
        prompt: `Дуга окружности равна ${arc}°. Найдите вписанный угол, опирающийся на эту дугу.`,
        correct: `${correct}°`,
        distractors: [`${arc}°`, `${arc * 2}°`, `${360 - arc}°`],
        explanation: `Вписанный угол равен половине дуги: ${arc}° : 2 = ${correct}°.`,
      }
    },
  },
  {
    id: 'num-similarity-area',
    topicId: 'g8-similarity',
    itemIds: ['g8-similarity-area'],
    minDifficulty: 3,
    build: (rng) => {
      const k = randomInt(rng, 2, 4)
      const correct = k * k
      return {
        prompt: `Коэффициент подобия двух треугольников равен ${k}. Во сколько раз площадь второго треугольника больше площади первого?`,
        correct: `в ${correct} раз`,
        distractors: [`в ${k} раз`, `в ${2 * k} раз`, `в ${k * k * k} раз`],
        explanation: `Отношение площадей равно k² = ${k}² = ${correct}.`,
      }
    },
  },
  {
    id: 'num-trig',
    topicId: 'g8-trig',
    itemIds: ['g8-trig-table'],
    minDifficulty: 2,
    build: (rng) => {
      const angle = randomInt(rng, 0, 2) === 0 ? 30 : randomInt(rng, 0, 1) === 0 ? 45 : 60
      const fn = randomInt(rng, 0, 2) === 0 ? 'sin' : randomInt(rng, 0, 1) === 0 ? 'cos' : 'tg'
      const table: Record<string, Record<string, string>> = {
        sin: { '30': '½', '45': '√2/2', '60': '√3/2' },
        cos: { '30': '√3/2', '45': '√2/2', '60': '½' },
        tg: { '30': '√3/3', '45': '1', '60': '√3' },
      }
      const correct = table[fn][String(angle)]
      const allValues = ['½', '√2/2', '√3/2', '√3/3', '1', '√3']
      return {
        prompt: `Чему равен ${fn} ${angle}°?`,
        correct,
        distractors: allValues.filter((value) => value !== correct),
        explanation: `Табличное значение: ${fn} ${angle}° = ${correct}.`,
      }
    },
  },
]

export function makeNumericQuestion(
  template: NumericTemplate,
  rng: Rng,
  index: number,
): SingleQuestion {
  const data = template.build(rng)
  const candidates = Array.from(
    new Set(data.distractors.filter((value) => value !== data.correct && value.trim().length > 0)),
  )
  while (candidates.length < 3) {
    const offset = candidates.length + 1
    const fallback = `${formatNumber(offset * 7)}`
    if (!candidates.includes(fallback) && fallback !== data.correct) candidates.push(fallback)
  }
  const texts = shuffle([data.correct, ...candidates.slice(0, 3)], rng)
  const options: QuestionOption[] = texts.map((text, optionIndex) => ({
    id: `o${optionIndex}`,
    text,
    correct: text === data.correct,
  }))
  return {
    id: `num-${template.id}-${index}`,
    kind: 'single',
    topicId: template.topicId,
    itemIds: template.itemIds,
    prompt: data.prompt,
    explanation: data.explanation,
    difficulty: template.minDifficulty,
    skill: 'application',
    source: 'numeric',
    typeLabel: 'Задача',
    options,
  }
}

export function templateForItem(item: Item, rng: Rng): NumericTemplate | null {
  const matching = NUMERIC_TEMPLATES.filter((template) => template.topicId === item.topicId)
  if (matching.length === 0) return null
  return matching[Math.floor(rng() * matching.length)]
}
