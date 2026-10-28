import { useState } from 'react'
import type { Answer, ClozeQuestion, MatchQuestion, MultiQuestion, Question, SingleQuestion, TrueFalseQuestion } from '../../types'
import { cn } from '../../utils'
import { Icon } from '../../components/ui'

interface ViewProps<T extends Question> {
  question: T
  answer: Answer | undefined
  onChange: (answer: Answer) => void
  locked: boolean
}

const letters = ['A', 'B', 'C', 'D', 'E', 'F']

function optionClass(selected: boolean, correct: boolean, locked: boolean, hasCorrectMark = true): string {
  if (locked && hasCorrectMark) {
    if (correct) return 'border-success/50 bg-success-soft text-ink'
    if (selected) return 'border-danger/50 bg-danger-soft text-ink'
    return 'border-line bg-surface text-ink-3'
  }
  return selected
    ? 'border-accent/50 bg-accent-soft text-ink ring-1 ring-accent/20'
    : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-surface-2'
}

export function SingleQuestionView({ question, answer, onChange, locked }: ViewProps<SingleQuestion>) {
  const selectedId = answer?.kind === 'single' ? answer.optionId : null
  return (
    <div className="grid gap-2">
      {question.options.map((option, index) => {
        const selected = selectedId === option.id
        return (
          <button
            key={option.id}
            type="button"
            disabled={locked}
            onClick={() => onChange({ kind: 'single', optionId: option.id })}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border p-3 text-left text-[0.9375rem] leading-relaxed transition-colors disabled:cursor-default',
              optionClass(selected, option.correct, locked),
            )}
            aria-pressed={selected}
          >
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[0.6875rem] font-semibold',
                locked && option.correct
                  ? 'border-success/40 bg-success text-on-accent'
                  : locked && selected
                    ? 'border-danger/40 bg-danger text-on-accent'
                    : selected
                      ? 'border-accent bg-accent text-on-accent'
                      : 'border-line-strong text-ink-3',
              )}
            >
              {locked && option.correct ? <Icon name="check" size={13} /> : letters[index] ?? index + 1}
            </span>
            <span className="min-w-0 flex-1">{option.text}</span>
          </button>
        )
      })}
    </div>
  )
}

export function MultiQuestionView({ question, answer, onChange, locked }: ViewProps<MultiQuestion>) {
  const selected = answer?.kind === 'multi' ? new Set(answer.optionIds) : new Set<string>()
  const toggle = (id: string) => {
    if (locked) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange({ kind: 'multi', optionIds: Array.from(next) })
  }
  return (
    <div className="grid gap-2">
      {question.options.map((option) => {
        const isSelected = selected.has(option.id)
        return (
          <button
            key={option.id}
            type="button"
            disabled={locked}
            onClick={() => toggle(option.id)}
            aria-pressed={isSelected}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl border p-3 text-left text-[0.9375rem] leading-relaxed transition-colors disabled:cursor-default',
              optionClass(isSelected, option.correct, locked),
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                locked && option.correct
                  ? 'border-success bg-success text-on-accent'
                  : isSelected
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-line-strong',
              )}
            >
              {(isSelected || (locked && option.correct)) && <Icon name="check" size={12} strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">{option.text}</span>
          </button>
        )
      })}
      <p className="text-xs text-ink-3">Можно выбрать несколько вариантов.</p>
    </div>
  )
}

export function TrueFalseView({ question, answer, onChange, locked }: ViewProps<TrueFalseQuestion>) {
  const value = answer?.kind === 'truefalse' ? answer.value : null
  return (
    <div>
      <div className="statement rounded-xl border border-line bg-surface-2/60 p-4">{question.statement}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { value: true, label: 'Верно', icon: 'check' as const },
          { value: false, label: 'Неверно', icon: 'x' as const },
        ].map((option) => {
          const selected = value === option.value
          const isCorrect = option.value === question.answer
          return (
            <button
              key={option.label}
              type="button"
              disabled={locked}
              onClick={() => onChange({ kind: 'truefalse', value: option.value })}
              className={cn(
                'flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors disabled:cursor-default',
                locked
                  ? isCorrect
                    ? 'border-success/50 bg-success-soft text-success'
                    : selected
                      ? 'border-danger/50 bg-danger-soft text-danger'
                      : 'border-line bg-surface text-ink-3'
                  : selected
                    ? 'border-accent/50 bg-accent-soft text-accent-ink'
                    : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
              )}
            >
              <Icon name={option.icon} size={17} />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MatchQuestionView({ question, answer, onChange, locked }: ViewProps<MatchQuestion>) {
  const mapping = answer?.kind === 'match' ? answer.mapping : question.left.map(() => -1)
  const [activeLeft, setActiveLeft] = useState(0)
  const setPair = (leftIndex: number, rightIndex: number) => {
    if (locked) return
    const next = [...mapping]
    const previous = next.indexOf(rightIndex)
    if (previous >= 0) next[previous] = -1
    next[leftIndex] = rightIndex
    onChange({ kind: 'match', mapping: next })
    const nextEmpty = next.findIndex((value) => value < 0)
    if (nextEmpty >= 0) setActiveLeft(nextEmpty)
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        {question.left.map((left, index) => {
          const assigned = mapping[index]
          const correct = assigned === question.pairs[index]
          return (
            <button
              key={left}
              type="button"
              disabled={locked}
              onClick={() => setActiveLeft(index)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm',
                locked
                  ? correct
                    ? 'border-success/40 bg-success-soft'
                    : 'border-danger/40 bg-danger-soft'
                  : assigned >= 0
                    ? 'border-accent/30 bg-accent-soft/50'
                    : 'border-line bg-surface',
                index === activeLeft && !locked && 'ring-1 ring-accent/30',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[0.6875rem] font-semibold text-ink-3">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">{left}</span>
              {assigned >= 0 && (
                <span className="max-w-[45%] truncate rounded bg-surface px-1.5 py-0.5 text-[0.6875rem] text-ink-2">
                  {question.right[assigned]}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="space-y-2">
        {question.right.map((right, rightIndex) => {
          const owner = mapping.indexOf(rightIndex)
          return (
            <button
              key={right}
              type="button"
              disabled={locked}
              onClick={() => {
                if (owner >= 0) setPair(owner, -1)
                else setPair(activeLeft, rightIndex)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors',
                owner >= 0
                  ? 'border-accent/35 bg-accent-soft/60 text-ink'
                  : 'border-line bg-surface text-ink-2 hover:bg-surface-2',
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[0.6875rem] font-semibold text-ink-3">
                {letters[rightIndex] ?? rightIndex + 1}
              </span>
              <span className="min-w-0 flex-1">{right}</span>
              {owner >= 0 && <span className="text-[0.6875rem] text-ink-3">→ {owner + 1}</span>}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-ink-3 sm:col-span-2">
        Нажмите на левый пункт, затем на подходящий правый. Повторное нажатие снимает пару.
      </p>
    </div>
  )
}

export function ClozeQuestionView({ question, answer, onChange, locked }: ViewProps<ClozeQuestion>) {
  const selectedId = answer?.kind === 'cloze' ? answer.optionId : null
  const selected = question.options.find((option) => option.id === selectedId)
  const parts = question.text.split(/\{\{.*?\}\}/)
  return (
    <div>
      <div className="statement rounded-xl border border-line bg-surface-2/60 p-4">
        {parts[0]}
        <span
          className={cn(
            'mx-1 inline-flex min-w-24 justify-center rounded-md border-b-2 px-2 py-0.5 align-baseline',
            selected ? 'border-accent text-accent-ink' : 'border-line-strong text-ink-3',
          )}
        >
          {selected?.text ?? '…'}
        </span>
        {parts[1]}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isSelected = selectedId === option.id
          return (
            <button
              key={option.id}
              type="button"
              disabled={locked}
              onClick={() => onChange({ kind: 'cloze', optionId: option.id })}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default',
                optionClass(isSelected, option.correct, locked),
              )}
            >
              <span className="mr-2 text-[0.6875rem] text-ink-3">{letters[index]}</span>
              {option.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
