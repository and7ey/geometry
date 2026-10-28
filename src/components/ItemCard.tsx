import { Link } from 'react-router-dom'
import type { Item, ItemProgress } from '../types'
import { getTopic } from '../content'
import { getStatus } from '../services/scheduling'
import { CategoryChip, StatusChip } from './ItemBits'
import { Icon } from './ui'
import { truncate } from '../utils'

export function ItemCard({ item, progress }: { item: Item; progress?: ItemProgress }) {
  const topic = getTopic(item.topicId)
  const status = getStatus(progress)
  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex flex-col rounded-card border border-line bg-surface p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-accent/35"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryChip category={item.category} size="sm" />
        {status !== 'new' && <StatusChip status={status} />}
        {progress?.favorite && <Icon name="star" size={13} className="ml-auto text-warn" />}
      </div>
      <h3 className="mt-2 text-[0.9375rem] font-semibold leading-snug text-ink group-hover:text-accent-ink">
        {item.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-3">
        {truncate(item.statement, 130)}
      </p>
      <div className="mt-auto flex items-center gap-2 pt-3 text-[0.6875rem] text-ink-3">
        <span>{item.grade} класс</span>
        {topic && (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{topic.title}</span>
          </>
        )}
        <Icon name="chevron-right" size={13} className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  )
}
