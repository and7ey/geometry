import { CATEGORY_LABELS, DIFFICULTY_LABELS, type Category, type Difficulty, type ItemStatus } from '../types'
import { Chip, type ChipTone } from './ui'
import { Figure } from './Figure'
import type { FigureSpec } from '../types'

const categoryTone: Record<Category, ChipTone> = {
  definition: 'accent',
  property: 'success',
  criterion: 'warn',
  theorem: 'accent',
  corollary: 'neutral',
  axiom: 'danger',
  formula: 'success',
}

export function CategoryChip({ category, size }: { category: Category; size?: 'sm' | 'md' }) {
  return (
    <Chip tone={categoryTone[category]} size={size}>
      {CATEGORY_LABELS[category]}
    </Chip>
  )
}

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Chip tone="outline" size="sm">
      {DIFFICULTY_LABELS[difficulty]}
    </Chip>
  )
}

const statusMeta: Record<ItemStatus, { label: string; tone: ChipTone }> = {
  new: { label: 'Новое', tone: 'outline' },
  viewed: { label: 'Просмотрено', tone: 'neutral' },
  learning: { label: 'В работе', tone: 'accent' },
  learned: { label: 'Изучено', tone: 'success' },
  mastered: { label: 'Освоено', tone: 'success' },
  attention: { label: 'Требует внимания', tone: 'danger' },
}

export function StatusChip({ status }: { status: ItemStatus }) {
  const meta = statusMeta[status]
  return (
    <Chip tone={meta.tone} size="sm">
      {meta.label}
    </Chip>
  )
}

export function FigurePanel({
  figure,
  className,
  showNote,
}: {
  figure: FigureSpec
  className?: string
  showNote?: boolean
}) {
  return (
    <div className={className}>
      <div className="rounded-card border border-line bg-bg-soft/60 px-3 py-2">
        <Figure spec={figure} />
      </div>
      {figure.caption && (
        <div className="mt-1.5 flex gap-2 px-1 text-[0.75rem] leading-relaxed text-ink-3">
          <span>{figure.caption}</span>
          {showNote && <span className="text-ink-3/70">· схема условная</span>}
        </div>
      )}
    </div>
  )
}
