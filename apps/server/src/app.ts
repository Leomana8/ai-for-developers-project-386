import express from 'express'

import { notFoundEnvelope } from './errors.js'
import { openApiValidator, validationErrorHandler } from './openapi.js'
import { diagnosticsRouter } from './routes/diagnostics.js'
import { eventTypesRouter } from './routes/event-types.js'
import { meetingsRouter } from './routes/meetings.js'
import { slotsRouter } from './routes/slots.js'

export function createApp() {
  const app = express()

  // Порядок важен: тело парсится до валидатора, валидатор — до маршрутов;
  // catch-all для незадокументированных путей и обработчик ошибок — в конце.
  app.use(express.json())
  app.use(openApiValidator())

  app.use('/api/event-types', eventTypesRouter)
  // Слоты — под-ресурс Типа события: /api/event-types/:id/slots
  app.use('/api/event-types', slotsRouter)
  app.use('/api/meetings', meetingsRouter)
  app.use('/api/health', diagnosticsRouter)

  // Пути, которых нет в спеке, валидатор пропускает — отвечаем 404
  // с контрактным ErrorEnvelope вместо дефолтной HTML-ошибки Express.
  app.use('/api', (_req, res) => {
    res.status(404).json(notFoundEnvelope())
  })

  app.use(validationErrorHandler)

  return app
}
