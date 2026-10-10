import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'
import { notFoundEnvelope } from '../errors.js'

type Meeting = components['schemas']['Meeting']
type ErrorEnvelope = components['schemas']['ErrorEnvelope']

export const meetingsRouter = Router()

const list: RequestHandler<Record<string, string>, Meeting[]> = (_req, res) => {
  res.json([])
}

// Встречу нельзя создать, пока нет хранилища Типов событий → 404 из спеки
// (тело запроса при этом уже проверено валидатором по MeetingCreate).
const create: RequestHandler<Record<string, string>, ErrorEnvelope> = (_req, res) => {
  res.status(404).json(notFoundEnvelope('Event type not found'))
}

meetingsRouter.get('/', list)
meetingsRouter.post('/', create)
