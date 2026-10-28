import type { Category, Difficulty, Grade } from './content'

export type QuestionKind = 'single' | 'multi' | 'truefalse' | 'match' | 'cloze' | 'recall'

export type QuestionSkill =
  | 'recognition'
  | 'reproduction'
  | 'application'
  | 'discrimination'
  | 'converse'
  | 'property-criterion'

export interface QuestionOption {
  id: string
  text: string
  correct: boolean
}

interface QuestionBase {
  id: string
  kind: QuestionKind
  topicId: string
  itemIds: string[]
  prompt: string
  explanation: string
  difficulty: Difficulty
  skill?: QuestionSkill
  source: 'authored' | 'generated' | 'numeric'
  /** Короткая подпись типа задания для интерфейса. */
  typeLabel: string
}

export interface SingleQuestion extends QuestionBase {
  kind: 'single'
  options: QuestionOption[]
}

export interface MultiQuestion extends QuestionBase {
  kind: 'multi'
  options: QuestionOption[]
}

export interface TrueFalseQuestion extends QuestionBase {
  kind: 'truefalse'
  statement: string
  answer: boolean
  misconception?: string
}

export interface MatchQuestion extends QuestionBase {
  kind: 'match'
  left: string[]
  right: string[]
  /** pairs[i] — индекс правильного элемента right для left[i]. */
  pairs: number[]
}

export interface ClozeQuestion extends QuestionBase {
  kind: 'cloze'
  /** Текст с маркером {{...}} вместо пропуска. */
  text: string
  options: QuestionOption[]
}

export interface RecallQuestion extends QuestionBase {
  kind: 'recall'
  itemId: string
  answer: string
  hint?: string
  keyElements: string[][]
  accepted?: string[]
}

export type Question =
  | SingleQuestion
  | MultiQuestion
  | TrueFalseQuestion
  | MatchQuestion
  | ClozeQuestion
  | RecallQuestion

export type Answer =
  | { kind: 'single'; optionId: string | null }
  | { kind: 'multi'; optionIds: string[] }
  | { kind: 'truefalse'; value: boolean | null }
  | { kind: 'match'; mapping: number[] }
  | { kind: 'cloze'; optionId: string | null }
  | { kind: 'recall'; text: string; auto: 'match' | 'partial' | 'mismatch'; self: 'again' | 'hard' | 'hint' | 'good' | null }

export interface CheckResult {
  correct: boolean
  partial: boolean
  score: number
  correctText: string
}

export interface AnswerCheck {
  question: Question
  answer: Answer
  result: CheckResult
}

export const SKILL_LABELS: Record<QuestionSkill, string> = {
  recognition: 'Узнавание',
  reproduction: 'Воспроизведение',
  application: 'Применение',
  discrimination: 'Различение',
  converse: 'Обратная теорема',
  'property-criterion': 'Свойство и признак',
}

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  single: 'Один ответ',
  multi: 'Несколько ответов',
  truefalse: 'Верно или неверно',
  match: 'Сопоставление',
  cloze: 'Пропуск в формулировке',
  recall: 'Свободный ответ',
}

export interface SessionConfig {
  grades: Grade[]
  difficulty: Difficulty
  categories: Category[]
  topicIds: string[]
  count: number | 'all'
  itemFilter: ItemFilter
  excludeMastered: boolean
}

export type ItemFilter = 'all' | 'new' | 'learned' | 'errors' | 'due'

export type SessionKind = 'study' | 'flashcards' | 'recall' | 'quiz' | 'exam' | 'review'

export interface SessionStep {
  key: string
  label: string
  kind: SessionKind
}

export interface ActiveSession {
  id: string
  kind: SessionKind
  startedAt: number
  lastTickAt: number
  activeMs: number
  config: SessionConfig
  itemIds: string[]
  questions: Question[]
  answers: Record<string, Answer>
  index: number
  revealed: boolean
  route?: { topicId: string; stepKey: string }
  title: string
  newItemCount: number
  reviewedCount: number
  requeued: string[]
}

export interface WrongAnswerRecord {
  itemId: string
  prompt: string
  correctText: string
  explanation: string
  givenText: string
}

export interface StabilityBreakdown {
  accuracy: number
  reproduction: number
  retention: number
  score: number
}

export interface SessionResult {
  id: string
  kind: SessionKind
  title: string
  config: SessionConfig
  startedAt: number
  endedAt: number
  activeMs: number
  total: number
  correct: number
  wrong: number
  partial: number
  accuracy: number
  wrongAnswers: WrongAnswerRecord[]
  byTopic: Record<string, { total: number; correct: number }>
  newItems: number
  reviewedItems: number
  stability?: StabilityBreakdown
  route?: { topicId: string; stepKey: string }
}

export interface RouteStage {
  key: string
  title: string
  description: string
  kind: SessionKind
  categories: Category[]
  skills?: QuestionSkill[]
  count?: number | 'all'
  difficulty?: Difficulty
}

export interface RouteDefinition {
  topicId: string
  stages: RouteStage[]
}

export interface RouteProgress {
  topicId: string
  startedAt: number
  updatedAt: number
  done: string[]
  current: number
}
