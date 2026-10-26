import type { components } from './api/schema.js'

type EventType = components['schemas']['EventType']
type EventTypeCreate = components['schemas']['EventTypeCreate']
type Meeting = components['schemas']['Meeting']

// Хранилище за тонким интерфейсом: маршруты не знают, что данные лежат в Map,
// не зависят от реализации хранения. Решение карты #8: in-memory, без персистентности;
// Слоты не хранятся — вычисляются из сетки и занятости Встречами.
export type Store = {
  eventTypes: {
    list(): EventType[]
    get(id: string): EventType | undefined
    add(input: EventTypeCreate): EventType | undefined
  }
  meetings: {
    list(): Meeting[]
    add(meeting: Meeting): Meeting
  }
}

// Каждый вызов создаёт независимое хранилище: свежее — на каждый createApp().
export function createStore(): Store {
  const eventTypes = new Map<string, EventType>()
  const meetings = new Map<string, Meeting>()

  return {
    eventTypes: {
      list: () => [...eventTypes.values()],
      get: (id) => eventTypes.get(id),
      add: (input) => {
        if (eventTypes.has(input.id)) return undefined
        const eventType: EventType = {
          id: input.id,
          name: input.name,
          description: input.description ?? null,
          duration: input.duration,
        }
        eventTypes.set(eventType.id, eventType)
        return eventType
      },
    },
    meetings: {
      list: () => [...meetings.values()],
      add: (meeting) => {
        meetings.set(meeting.id, meeting)
        return meeting
      },
    },
  }
}
