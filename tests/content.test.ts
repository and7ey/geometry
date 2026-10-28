import { describe, expect, it } from 'vitest'
import { ITEMS, TOPICS, TOPIC_BY_ID } from '../src/content'
import { AUTHORED_DRILLS } from '../src/content/drills'
import { NUMERIC_TEMPLATES, makeNumericQuestion } from '../src/services/quiz/numeric'
import { mulberry32 } from '../src/services/quiz/random'
import { ITEMS_BY_TOPIC } from '../src/content'
import type { FigureType } from '../src/types'

const FIGURES: FigureType[] = [
  'angle-pairs',
  'parallel-cut',
  'triangle-cevians',
  'congruent-triangles',
  'isosceles',
  'triangle-angles',
  'right-triangle',
  'quadrilateral',
  'parallelogram-diagonals',
  'midline',
  'areas',
  'pythagoras',
  'similar',
  'trig',
  'circle-angles',
  'circle-basics',
  'inscribed-circle',
]

describe('учебный контент', () => {
  it('содержит не менее 150 элементов и все темы', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(150)
    expect(TOPICS.length).toBeGreaterThanOrEqual(20)
    for (const topic of TOPICS) {
      expect((ITEMS_BY_TOPIC.get(topic.id) ?? []).length, topic.id).toBeGreaterThanOrEqual(4)
    }
  })

  it('имеет уникальные id и корректные ссылки', () => {
    const ids = new Set<string>()
    for (const item of ITEMS) {
      expect(ids.has(item.id), `дубликат ${item.id}`).toBe(false)
      ids.add(item.id)
    }
    for (const item of ITEMS) {
      const topic = TOPIC_BY_ID.get(item.topicId)
      expect(topic, `${item.id}: тема ${item.topicId}`).toBeTruthy()
      expect(topic?.grade).toBe(item.grade)
      for (const related of item.related) {
        expect(ids.has(related), `${item.id}: related ${related}`).toBe(true)
        expect(related).not.toBe(item.id)
      }
      expect(item.statement.trim().length).toBeGreaterThan(20)
      expect(item.plain.trim().length).toBeGreaterThan(20)
      expect(item.example.trim().length).toBeGreaterThan(5)
      expect(item.misconceptions.length).toBeGreaterThan(0)
      expect(item.source.trim().length).toBeGreaterThan(0)
      if (item.figure) {
        expect(FIGURES, `${item.id}: figure ${item.figure.type}`).toContain(item.figure.type)
      }
      if (item.category === 'formula') {
        expect(item.formula, `${item.id}: формула`).toBeTruthy()
      }
      if (item.recall) {
        expect(item.recall.keyElements.length).toBeGreaterThan(0)
        for (const group of item.recall.keyElements) {
          expect(group.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('авторские задания корректны', () => {
    const itemIds = new Set(ITEMS.map((item) => item.id))
    const drillIds = new Set<string>()
    for (const drill of AUTHORED_DRILLS) {
      expect(drillIds.has(drill.id), `дубликат ${drill.id}`).toBe(false)
      drillIds.add(drill.id)
      expect(TOPIC_BY_ID.has(drill.topicId), drill.id).toBe(true)
      expect(drill.explanation.trim().length).toBeGreaterThan(10)
      for (const id of drill.itemIds) {
        expect(itemIds.has(id), `${drill.id}: item ${id}`).toBe(true)
      }
      if (drill.kind === 'single') {
        expect(drill.options.length).toBeGreaterThanOrEqual(2)
        expect(drill.options.filter((option) => option.correct)).toHaveLength(1)
      }
      if (drill.kind === 'multi') {
        expect(drill.options.filter((option) => option.correct).length).toBeGreaterThanOrEqual(2)
      }
      if (drill.kind === 'match') {
        expect(drill.left.length).toBe(drill.right.length)
        expect(new Set(drill.pairs).size).toBe(drill.pairs.length)
        for (const index of drill.pairs) {
          expect(index).toBeGreaterThanOrEqual(0)
          expect(index).toBeLessThan(drill.right.length)
        }
      }
      if (drill.kind === 'cloze') {
        expect(drill.text).toMatch(/\{\{.*\}\}/)
        expect(drill.options.filter((option) => option.correct)).toHaveLength(1)
      }
      if (drill.kind === 'truefalse') {
        expect(typeof drill.answer).toBe('boolean')
      }
    }
  })

  it('числовые шаблоны дают корректные четыре варианта', () => {
    for (const template of NUMERIC_TEMPLATES) {
      expect(TOPIC_BY_ID.has(template.topicId), template.id).toBe(true)
      for (let seed = 0; seed < 30; seed += 1) {
        const question = makeNumericQuestion(template, mulberry32(seed + 1), seed)
        expect(question.options).toHaveLength(4)
        expect(new Set(question.options.map((option) => option.text)).size).toBe(4)
        expect(question.options.filter((option) => option.correct)).toHaveLength(1)
      }
    }
  })
})
