import { Router } from 'express'

import type { RequestHandler } from 'express'

import type { components } from '../api/schema.js'

type Health = components['schemas']['Health']

export const diagnosticsRouter = Router()

const check: RequestHandler<Record<string, string>, Health> = (_req, res) => {
  res.json({ status: 'ok' })
}

diagnosticsRouter.get('/', check)
