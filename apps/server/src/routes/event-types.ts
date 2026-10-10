import { randomUUID } from 'node:crypto'

import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'

type EventType = components['schemas']['EventType']
type EventTypeCreate = components['schemas']['EventTypeCreate']

// Заготовки маршрутов: хранилища ещё нет, отвечаем минимальными валидными
// ответами из спеки; их соответствие контракту страхует response-валидация.
export const eventTypesRouter = Router()

const list: RequestHandler<Record<string, string>, EventType[]> = (_req, res) => {
  res.json([])
}

const create: RequestHandler<Record<string, string>, EventType, EventTypeCreate> = (req, res) => {
  const created: EventType = {
    id: randomUUID(),
    name: req.body.name,
    description: req.body.description ?? null,
    duration: req.body.duration,
  }

  res.status(201).json(created)
}

eventTypesRouter.get('/', list)
eventTypesRouter.post('/', create)
