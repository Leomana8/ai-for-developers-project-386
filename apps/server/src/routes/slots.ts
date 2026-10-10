import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'
import { notFoundEnvelope } from '../errors.js'
import { availability } from '../schedule.js'
import type { Store } from '../store.js'

type Availability = components['schemas']['Availability']
type ErrorEnvelope = components['schemas']['ErrorEnvelope']

// Слоты — под-ресурс Типа события: GET /api/event-types/:id/slots.
export function slotsRouter(store: Store): Router {
  const router = Router()

  const list: RequestHandler<Record<string, string>, Availability | ErrorEnvelope> = (req, res) => {
    const eventType = store.eventTypes.get(req.params.id)
    if (!eventType) {
      res.status(404).json(notFoundEnvelope('Event type not found'))
      return
    }

    // Занятость общая: считаем Встречи всех Типов событий.
    res.json(availability(eventType.id, eventType.duration, store.meetings.list()))
  }

  router.get('/:id/slots', list)

  return router
}
