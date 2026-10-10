import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'
import { notFoundEnvelope } from '../errors.js'

type ErrorEnvelope = components['schemas']['ErrorEnvelope']

// Слоты — под-ресурс Типа события: GET /api/event-types/:id/slots.
export const slotsRouter = Router()

// Хранилища ещё нет: Типа события с таким id не существует → 404 из спеки.
const list: RequestHandler<Record<string, string>, ErrorEnvelope> = (_req, res) => {
  res.status(404).json(notFoundEnvelope('Event type not found'))
}

slotsRouter.get('/:id/slots', list)
