import { randomUUID } from 'node:crypto'

import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'
import { errorEnvelope, notFoundEnvelope } from '../errors.js'
import { bookingStartError, formatIso, isGridMark, isOccupied } from '../schedule.js'
import type { Store } from '../store.js'

type Meeting = components['schemas']['Meeting']
type MeetingCreate = components['schemas']['MeetingCreate']
type ErrorEnvelope = components['schemas']['ErrorEnvelope']

// Время в спеке — ISO 8601 без часового пояса в серверной зоне (docs/spec.md §6).
const ISO_NO_TIMEZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/

function parseStart(value: string): Date | null {
  if (!ISO_NO_TIMEZONE.test(value)) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function meetingsRouter(store: Store): Router {
  const router = Router()

  // Предстоящие Встречи (start >= сейчас), по возрастанию start; без пагинации.
  const list: RequestHandler<Record<string, string>, Meeting[]> = (_req, res) => {
    const now = new Date().getTime()
    const upcoming = store.meetings
      .list()
      .filter((m) => new Date(m.start).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    res.json(upcoming)
  }

  const create: RequestHandler<Record<string, string>, Meeting | ErrorEnvelope, MeetingCreate> = (
    req,
    res,
  ) => {
    const eventType = store.eventTypes.get(req.body.eventTypeId)
    if (!eventType) {
      res.status(404).json(notFoundEnvelope('Event type not found'))
      return
    }

    // Нормализация: trim; email в нижний регистр (docs/spec.md §5 «Запись»).
    const guestName = req.body.guestName.trim()
    const guestEmail = req.body.guestEmail.trim().toLowerCase()
    if (guestName === '') {
      res
        .status(422)
        .json(
          errorEnvelope('validation_error', 'Invalid request', { guestName: 'must not be blank' }),
        )
      return
    }

    const start = parseStart(req.body.start)
    if (start === null || !isGridMark(start)) {
      res.status(422).json(
        errorEnvelope('validation_error', 'Invalid request', {
          start: 'must be an ISO 8601 timestamp without time zone on a 15-minute grid mark',
        }),
      )
      return
    }

    const timeError = bookingStartError(start, eventType.duration, new Date())
    if (timeError !== null) {
      res.status(422).json(
        errorEnvelope(timeError, 'Slot is outside the booking window', {
          start: 'outside the booking window or working hours',
        }),
      )
      return
    }

    // Гонка на один Слот разрешается 409 (docs/spec.md §5 «Запись»).
    const end = new Date(start.getTime() + eventType.duration * 60_000)
    if (isOccupied(store.meetings.list(), start, end)) {
      res.status(409).json(errorEnvelope('slot_taken', 'Slot is no longer available'))
      return
    }

    // Названия Типов событий неизменяемы, поэтому дублируем name без снапшота.
    const meeting: Meeting = {
      id: randomUUID(),
      eventTypeId: eventType.id,
      eventTypeName: eventType.name,
      start: formatIso(start),
      end: formatIso(end),
      guestName,
      guestEmail,
      createdAt: formatIso(new Date()),
    }
    res.status(201).json(store.meetings.add(meeting))
  }

  router.get('/', list)
  router.post('/', create)

  return router
}
