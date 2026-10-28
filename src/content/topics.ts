import type { Topic } from '../types/content'
import { defineTopic } from './helpers'

export const TOPICS: Topic[] = [
  // 7 класс
  defineTopic({
    id: 'g7-basics',
    grade: 7,
    section: 'Начала геометрии',
    title: 'Начальные понятия и углы',
    description: 'Точка, прямая, отрезок, луч, угол, измерение и биссектриса.',
  }),
  defineTopic({
    id: 'g7-angle-pairs',
    grade: 7,
    section: 'Начала геометрии',
    title: 'Смежные и вертикальные углы',
    description: 'Пара углов при пересечении прямых и их свойства.',
  }),
  defineTopic({
    id: 'g7-triangle',
    grade: 7,
    section: 'Треугольники',
    title: 'Треугольник и равенство',
    description: 'Элементы треугольника, виды и равные треугольники.',
  }),
  defineTopic({
    id: 'g7-congruence',
    grade: 7,
    section: 'Треугольники',
    title: 'Признаки равенства треугольников',
    description: 'Три признака и их применение.',
  }),
  defineTopic({
    id: 'g7-medians',
    grade: 7,
    section: 'Треугольники',
    title: 'Медиана, биссектриса, высота',
    description: 'Чевьи треугольника: определения и различия.',
  }),
  defineTopic({
    id: 'g7-isosceles',
    grade: 7,
    section: 'Треугольники',
    title: 'Равнобедренный треугольник',
    description: 'Свойства и признак равнобедренного треугольника.',
  }),
  defineTopic({
    id: 'g7-parallel',
    grade: 7,
    section: 'Параллельность и углы',
    title: 'Параллельные прямые',
    description: 'Углы при секущей, признаки, аксиома и свойства.',
  }),
  defineTopic({
    id: 'g7-angle-sum',
    grade: 7,
    section: 'Параллельность и углы',
    title: 'Сумма углов треугольника',
    description: 'Теорема о сумме углов, внешний угол, неравенство треугольника.',
  }),
  defineTopic({
    id: 'g7-right',
    grade: 7,
    section: 'Параллельность и углы',
    title: 'Прямоугольные треугольники',
    description: 'Катеты, гипотенуза, угол 30° и расстояния.',
  }),
  defineTopic({
    id: 'g7-circle',
    grade: 7,
    section: 'Параллельность и углы',
    title: 'Окружность',
    description: 'Центр, радиус, хорда, диаметр и дуга.',
  }),

  // 8 класс
  defineTopic({
    id: 'g8-quadrilaterals',
    grade: 8,
    section: 'Четырёхугольники',
    title: 'Четырёхугольники',
    description: 'Элементы, выпуклость и сумма углов.',
  }),
  defineTopic({
    id: 'g8-parallelogram',
    grade: 8,
    section: 'Четырёхугольники',
    title: 'Параллелограмм',
    description: 'Свойства и признаки параллелограмма.',
  }),
  defineTopic({
    id: 'g8-special-quads',
    grade: 8,
    section: 'Четырёхугольники',
    title: 'Прямоугольник, ромб, квадрат',
    description: 'Особые параллелограммы и их отличия.',
  }),
  defineTopic({
    id: 'g8-trapezoid',
    grade: 8,
    section: 'Четырёхугольники',
    title: 'Трапеция',
    description: 'Виды трапеции и её свойства.',
  }),
  defineTopic({
    id: 'g8-midline',
    grade: 8,
    section: 'Четырёхугольники',
    title: 'Средняя линия и теорема Фалеса',
    description: 'Средние линии треугольника и трапеции, пропорциональные отрезки.',
  }),
  defineTopic({
    id: 'g8-areas',
    grade: 8,
    section: 'Площади и подобие',
    title: 'Площади фигур',
    description: 'Площади квадрата, прямоугольника, параллелограмма, треугольника, трапеции.',
  }),
  defineTopic({
    id: 'g8-pythagoras',
    grade: 8,
    section: 'Площади и подобие',
    title: 'Теорема Пифагора',
    description: 'Прямая и обратная теоремы, египетский треугольник.',
  }),
  defineTopic({
    id: 'g8-similarity',
    grade: 8,
    section: 'Площади и подобие',
    title: 'Подобные треугольники',
    description: 'Коэффициент подобия, признаки и пропорциональные отрезки.',
  }),
  defineTopic({
    id: 'g8-trig',
    grade: 8,
    section: 'Площади и подобие',
    title: 'Синус, косинус, тангенс',
    description: 'Отношения в прямоугольном треугольнике и табличные значения.',
  }),
  defineTopic({
    id: 'g8-circle-angles',
    grade: 8,
    section: 'Окружность',
    title: 'Касательные и углы в окружности',
    description: 'Касательная, центральный и вписанный углы.',
  }),
  defineTopic({
    id: 'g8-inscribed',
    grade: 8,
    section: 'Окружность',
    title: 'Вписанная и описанная окружности',
    description: 'Центры, радиусы и замечательные точки треугольника.',
  }),
]

export const TOPIC_BY_ID = new Map(TOPICS.map((topic) => [topic.id, topic]))

export const SECTIONS = Array.from(
  TOPICS.reduce((map, topic) => {
    const key = `${topic.grade}:${topic.section}`
    if (!map.has(key)) map.set(key, { grade: topic.grade, section: topic.section, topics: [] as Topic[] })
    map.get(key)!.topics.push(topic)
    return map
  }, new Map<string, { grade: 7 | 8; section: string; topics: Topic[] }>()),
).map(([, value]) => value)
