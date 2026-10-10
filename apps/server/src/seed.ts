import { randomUUID } from 'node:crypto'

import type { components } from './api/schema.js'
import type { Store } from './store.js'

type Meeting = components['schemas']['Meeting']

// Владелец календаря — не сущность данных (решение карты #5): константа «от имени
// которой» создаются Типы событий; серверных данных и API для Владельца нет.
export const OWNER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Владелец календаря',
  email: 'owner@example.com',
} as const

// Время в спеке — ISO 8601 без часового пояса в серверной зоне (docs/spec.md §6).
function formatIso(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

// Дата через offsetDays дней от «сегодня», startMinutes — минуты от начала дня.
function span(offsetDays: number, startMinutes: number, durationMinutes: number) {
  const start = new Date()
  start.setDate(start.getDate() + offsetDays)
  start.setHours(0, startMinutes, 0, 0)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return { start: formatIso(start), end: formatIso(end) }
}

// Демо-данные с датами относительно «сегодня» (внутри окна 14 дней, решение #19):
// чтобы календарь и предстоящие Встречи не «протухали». Тесты по умолчанию
// сид не накатывают — данные в тестах создаются через HTTP.
export function seedStore(store: Store): void {
  const intro = store.eventTypes.add({
    name: 'Знакомство',
    description: 'Короткий бесплатный созвон: обсудим задачу и формат работы',
    duration: 15,
  })
  const consult = store.eventTypes.add({
    name: 'Консультация',
    description: 'Разбор конкретного вопроса по коду или архитектуре',
    duration: 30,
  })
  const mentoring = store.eventTypes.add({
    name: 'Менторинг',
    description: 'Длинная встреча: ревью проекта и план развития',
    duration: 60,
  })

  const createdAt = formatIso(new Date())
  const guests: Array<Omit<Meeting, 'id'>> = [
    {
      eventTypeId: intro.id,
      eventTypeName: intro.name,
      ...span(1, 9 * 60, 15),
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
      createdAt,
    },
    {
      eventTypeId: consult.id,
      eventTypeName: consult.name,
      ...span(1, 10 * 60, 30),
      guestName: 'Мария Кузнецова',
      guestEmail: 'maria@example.com',
      createdAt,
    },
    {
      eventTypeId: mentoring.id,
      eventTypeName: mentoring.name,
      ...span(2, 14 * 60, 60),
      guestName: 'Алексей Смирнов',
      guestEmail: 'alexey@example.com',
      createdAt,
    },
    {
      eventTypeId: consult.id,
      eventTypeName: consult.name,
      ...span(5, 11 * 60, 30),
      guestName: 'Ольга Иванова',
      guestEmail: 'olga@example.com',
      createdAt,
    },
  ]

  for (const guest of guests) {
    store.meetings.add({ id: randomUUID(), ...guest })
  }
}
