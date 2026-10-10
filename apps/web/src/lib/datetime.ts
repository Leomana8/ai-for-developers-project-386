import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

// Время в API — ISO 8601 без часового пояса ('2026-10-11T09:00:00').
// В Date такие строки парсятся по локали браузера, а 'YYYY-MM-DD' — как UTC,
// поэтому даты без времени разбираем в локальную полночь вручную.
export function parseIsoDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1)
}

export function isoDay(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatDayTime(iso: string): string {
  return format(new Date(iso), 'd MMMM, HH:mm', { locale: ru })
}

export function formatDayLabel(iso: string): string {
  return format(parseIsoDay(iso), 'd MMMM', { locale: ru })
}

export function formatTimeOfDay(iso: string): string {
  return iso.slice(11, 16)
}
