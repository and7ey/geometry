export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function itemsLabel(count: number): string {
  return `${count} ${pluralize(count, 'элемент', 'элемента', 'элементов')}`
}

export function questionsLabel(count: number): string {
  return `${count} ${pluralize(count, 'задание', 'задания', 'заданий')}`
}

export function minutesLabel(minutes: number): string {
  return `${minutes} ${pluralize(minutes, 'минута', 'минуты', 'минут')}`
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatDateShort(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(
    new Date(timestamp),
  )
}

export function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)} с`
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours} ч ${rest} мин` : `${hours} ч`
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${Math.round(value * 100)}%`
}
