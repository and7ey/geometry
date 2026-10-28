import type { Curriculum, Item, Topic } from '../types/content'

export function defineTopic(topic: Topic): Topic {
  return topic
}

type ItemInput = Omit<Item, 'curriculum' | 'related' | 'misconceptions'> &
  Partial<Pick<Item, 'curriculum' | 'related' | 'misconceptions'>>

export function defineItem(item: ItemInput): Item {
  return {
    curriculum: 'base' as Curriculum,
    related: [],
    misconceptions: [],
    ...item,
  }
}

export function keyElements(...groups: string[][]): string[][] {
  return groups
}
