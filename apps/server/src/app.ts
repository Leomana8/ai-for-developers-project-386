import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import express, { type Express } from 'express'

import { notFoundEnvelope } from './errors.js'
import { openApiValidator, validationErrorHandler } from './openapi.js'
import { diagnosticsRouter } from './routes/diagnostics.js'
import { eventTypesRouter } from './routes/event-types.js'
import { meetingsRouter } from './routes/meetings.js'
import { slotsRouter } from './routes/slots.js'
import { seedStore } from './seed.js'
import { createStore } from './store.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

// Собранный фронтенд (npm run build -w apps/web) лежит рядом по реповой
// раскладке: apps/web/dist. Пути от модуля работают и в dev (src через tsx),
// и в сборке (dist), и в Docker-образе — та же схема, что со спекой в openapi.ts.
export const webDistDir = path.resolve(moduleDir, '..', '..', 'web', 'dist')

// Раздаём статикой собранный SPA: файлы из dist, а для любого GET вне /api
// (маршруты роутера фронта) — index.html. Монтируем ПОСЛЕ catch-all '/api',
// чтобы контрактные 404 ErrorEnvelope для API-путей сохранились. Если dist
// нет (dev, чистый клон, тесты) — ничего не монтируем, поведение прежнее.
export function mountStaticWebApp(app: Express, distDir: string = webDistDir): boolean {
  const indexHtml = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexHtml)) return false

  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }
    res.sendFile(indexHtml)
  })
  return true
}

export type CreateAppOptions = {
  /** Накатить демо-сид: Типы событий и будущие Встречи (apps/server/src/seed.ts). */
  seed?: boolean
  /** Каталог со собранным фронтендом; false — не раздавать статику вовсе. */
  webDist?: string | false
}

export function createApp({ seed = false, webDist = webDistDir }: CreateAppOptions = {}) {
  // Свежее хранилище на каждый createApp() — изоляция данных в тестах (решение #8).
  const store = createStore()
  if (seed) seedStore(store)

  const app = express()

  // Порядок важен: тело парсится до валидатора, валидатор — до маршрутов;
  // catch-all для незадокументированных путей и обработчик ошибок — в конце.
  app.use(express.json())
  app.use(openApiValidator())

  app.use('/api/event-types', eventTypesRouter(store))
  // Слоты — под-ресурс Типа события: /api/event-types/:id/slots
  app.use('/api/event-types', slotsRouter(store))
  app.use('/api/meetings', meetingsRouter(store))
  app.use('/api/health', diagnosticsRouter)

  // Пути, которых нет в спеке, валидатор пропускает — отвечаем 404
  // с контрактным ErrorEnvelope вместо дефолтной HTML-ошибки Express.
  app.use('/api', (_req, res) => {
    res.status(404).json(notFoundEnvelope())
  })

  // Продакшен-режим: сервер отдаёт собранный фронтенд (Docker-образ, npm start).
  if (webDist !== false) mountStaticWebApp(app, webDist)

  app.use(validationErrorHandler)

  return app
}
