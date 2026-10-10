import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'
import { errorEnvelope } from '../errors.js'
import type { Store } from '../store.js'

type EventType = components['schemas']['EventType']
type EventTypeCreate = components['schemas']['EventTypeCreate']
type ErrorEnvelope = components['schemas']['ErrorEnvelope']

// Роут создается на каждый createApp() — вместе со своим хранилищем.
// Ограничения полей (name, description, диапазон duration) проверяет
// openapi-валидатор; здесь — только то, что контракту не выражается.
export function eventTypesRouter(store: Store): Router {
  const router = Router()

  const list: RequestHandler<Record<string, string>, EventType[]> = (_req, res) => {
    res.json(store.eventTypes.list())
  }

  const create: RequestHandler<
    Record<string, string>,
    EventType | ErrorEnvelope,
    EventTypeCreate
  > = (req, res) => {
    // «Кратно 15» в OpenAPI не выражается — дополняем валидатор серверной проверкой.
    if (req.body.duration % 15 !== 0) {
      res.status(422).json(
        errorEnvelope('validation_error', 'Invalid request', {
          duration: 'must be a multiple of 15',
        }),
      )
      return
    }

    res.status(201).json(store.eventTypes.add(req.body))
  }

  router.get('/', list)
  router.post('/', create)

  return router
}
