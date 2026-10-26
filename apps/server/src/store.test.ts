import { describe, expect, it } from 'vitest'

import { createStore } from './store.js'

describe('event type identifiers', () => {
  it('rejects a duplicate without changing the event type referenced by a meeting', () => {
    const store = createStore()
    const original = store.eventTypes.add({ id: 'intro-call', name: 'Знакомство', duration: 15 })
    store.meetings.add({
      id: 'meeting-1',
      eventTypeId: 'intro-call',
      eventTypeName: 'Знакомство',
      start: '2026-10-27T09:00:00',
      end: '2026-10-27T09:15:00',
      guestName: 'Иван',
      guestEmail: 'ivan@example.com',
      createdAt: '2026-10-26T09:00:00',
    })
    expect(store.eventTypes.add({ id: 'intro-call', name: 'Другое', duration: 60 })).toBeUndefined()
    expect(store.eventTypes.get('intro-call')).toEqual(original)
    expect(store.eventTypes.list()).toEqual([original])
    expect(store.meetings.list()[0]?.eventTypeId).toBe(original?.id)
  })
})
