export type Grade = 7 | 8
export type Category = 'definition' | 'property' | 'criterion' | 'theorem' | 'corollary' | 'axiom' | 'formula'
export type Difficulty = 1 | 2 | 3
export type Curriculum = 'base' | 'extended'
export type ThemePreference = 'light' | 'dark' | 'system'

export type FigureType =
  | 'angle-pairs'
  | 'parallel-cut'
  | 'triangle-cevians'
  | 'congruent-triangles'
  | 'isosceles'
  | 'triangle-angles'
  | 'right-triangle'
  | 'quadrilateral'
  | 'parallelogram-diagonals'
  | 'midline'
  | 'areas'
  | 'pythagoras'
  | 'similar'
  | 'trig'
  | 'circle-angles'
  | 'circle-basics'
  | 'inscribed-circle'

export interface FigureSpec {
  type: FigureType
  /** Вариант внутри типа: например, median / bisector / altitude. */
  variant?: string
  caption?: string
}

export interface RecallData {
  /** Группы синонимов: каждое совпадение хотя бы с одним словом группы считается найденным смысловым элементом. */
  keyElements: string[][]
  /** Дополнительные полные формулировки, которые считаются верными. */
  accepted?: string[]
}

export interface TheoremMeta {
  condition: string
  conclusion: string
  converseId?: string
  proofIdea?: string
}

export interface FormulaMeta {
  expression: string
  variables: string
}

export interface Item {
  id: string
  title: string
  grade: Grade
  topicId: string
  category: Category
  difficulty: Difficulty
  /** Полная школьная формулировка. */
  statement: string
  /** Объяснение простыми словами. */
  plain: string
  example: string
  misconceptions: string[]
  related: string[]
  source: string
  curriculum: Curriculum
  figure?: FigureSpec
  theorem?: TheoremMeta
  formula?: FormulaMeta
  recall?: RecallData
  hint?: string
  /** Авторская сторона карточки, если автоматическая не подходит. */
  card?: { front: string; back: string; typeLabel: string }
}

export interface Topic {
  id: string
  grade: Grade
  section: string
  title: string
  description: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  definition: 'Определение',
  property: 'Свойство',
  criterion: 'Признак',
  theorem: 'Теорема',
  corollary: 'Следствие',
  axiom: 'Аксиома',
  formula: 'Формула',
}

export const CATEGORY_SHORT: Record<Category, string> = {
  definition: 'Определения',
  property: 'Свойства',
  criterion: 'Признаки',
  theorem: 'Теоремы',
  corollary: 'Следствия',
  axiom: 'Аксиомы',
  formula: 'Формулы',
}

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  definition: 'Что означает термин и чем задаётся фигура.',
  property: 'Что верно для фигуры, если она уже дана.',
  criterion: 'Достаточное условие: когда фигуру можно распознать.',
  theorem: 'Утверждение с условием и заключением, которое доказывают.',
  corollary: 'Прямое следствие из уже доказанной теоремы.',
  axiom: 'Исходное утверждение, принимаемое без доказательства.',
  formula: 'Соотношение для вычисления длины, угла или площади.',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Начальная',
  2: 'Средняя',
  3: 'Высокая',
}

export const GRADE_LABELS: Record<Grade, string> = {
  7: '7 класс',
  8: '8 класс',
}

export const GRADE_TOPICS: Record<Grade, string> = {
  7: '7 класс',
  8: '8 класс',
}
