import { describe, expect, it } from 'vitest'

import type { components } from './api/schema.js'
import { availability } from './schedule.js'

type Availability = components['schemas']['Availability']
type Day = components['schemas']['Day']
type Meeting = components['schemas']['Meeting']

// Фиксированное «сейчас» — тесты не зависят от стенного часа (13.10.2026, 12:00).
const NOW = new Date(2026, 9, 13, 12, 0, 0)

function day(result: Availability, offset: number): Day {
  const date = new Date(NOW)
  date.setDate(date.getDate() + offset)
  const pad = (value: number): string => String(value).padStart(2, '0')
  const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const found = result.days.find((item) => item.date === iso)
  if (!found) throw new Error(`Day ${iso} is missing`)
  return found
}

const MEETING: Meeting = {
  id: 'meeting-1',
  eventTypeId: 'event-type-1',
  eventTypeName: 'Знакомство',
  start: '2026-10-13T14:00:00',
  end: '2026-10-13T14:15:00',
  guestName: 'Иван Петров',
  guestEmail: 'ivan@example.com',
  createdAt: '2026-10-12T10:00:00',
}

describe('availability', () => {
  it('не возвращает прошедшие и начинающиеся в «сейчас» Слоты сегодняшнего дня', () => {
    const today = day(availability('event-type-1', 15, [], NOW), 0)

    // Сетка 15 минут в окне 09:00–18:00 даёт 36 Слотов в день; из них
    // остаются только будущие: 12:15…17:45.
    expect(today.slots).toHaveLength(23)
    expect(today.slots[0]?.start).toBe('2026-10-13T12:15:00')
    expect(today.slots.at(-1)?.end).toBe('2026-10-13T18:00:00')
    for (const slot of today.slots) {
      expect(new Date(slot.start).getTime()).toBeGreaterThan(NOW.getTime())
    }
  })

  it('будущие дни окна не тронуты', () => {
    const result = availability('event-type-1', 15, [], NOW)

    expect(result.window).toEqual({ from: '2026-10-13', to: '2026-10-26' })
    expect(result.days).toHaveLength(14)
    // Старты 09:00…17:45 → 36 Слотов в день.
    expect(day(result, 1).slots).toHaveLength(36)
    expect(day(result, 1).slots[0]?.start).toBe('2026-10-14T09:00:00')
    expect(day(result, 1).slots.at(-1)?.end).toBe('2026-10-14T18:00:00')
  })

  it('available говорит только о занятости: занятый будущий Слот недоступен', () => {
    const today = day(availability('event-type-1', 15, [MEETING], NOW), 0)
    const byStart = new Map(today.slots.map((slot) => [slot.start, slot.available]))

    expect(byStart.get('2026-10-13T13:45:00')).toBe(true)
    expect(byStart.get('2026-10-13T14:00:00')).toBe(false) // Встреча 14:00–14:15
    expect(byStart.get('2026-10-13T14:15:00')).toBe(true)
  })
})
