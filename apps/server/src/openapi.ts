import path from 'node:path'
import { fileURLToPath } from 'node:url'

import * as OpenApiValidator from 'express-openapi-validator'
import type { ErrorRequestHandler } from 'express'

import type { ErrorEnvelope } from './errors.js'
import { errorEnvelope } from './errors.js'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

// Спека коммитится в spec/output корня репо. Путь считаем от модуля,
// чтобы работало и в dev (src через tsx), и в сборке (dist через npm run start),
// и в тестах (vitest запускается из apps/server).
export const openApiSpecPath = path.resolve(
  moduleDir,
  '..',
  '..',
  '..',
  'spec',
  'output',
  'openapi.yaml',
)

// Валидация запросов и ответов идёт по той же спеке, из которой генерируются
// типы фронта и сервера, — отдельного источника правды не появляется.
export function openApiValidator() {
  return OpenApiValidator.middleware({
    apiSpec: openApiSpecPath,
    validateRequests: true,
    validateResponses: true,
    // Незадокументированные пути пропускаем: их ловит catch-all в app.ts
    // и отвечает 404 с контрактным ErrorEnvelope.
    ignoreUndocumented: true,
  })
}

type ValidatorIssue = { path?: string; message?: string }

function isValidatorFailure(err: unknown): err is { status: number; errors: ValidatorIssue[] } {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { status?: unknown }).status === 'number' &&
    Array.isArray((err as { errors?: unknown }).errors)
  )
}

function isBodyParseFailure(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: unknown }).type === 'entity.parse.failed'
  )
}

// Любая ошибка валидации запроса — это контрактный 422 с ErrorEnvelope
// (код validation_error): в спеке нет 400/415, поэтому все клиентские
// нарушения (тело, формат, content-type) маппим в один статус.
// Ошибки 5xx (в т.ч. от response-валидации — это баг обработчика)
// не переписываем и отдаём дальше стандартному обработчику Express.
export const validationErrorHandler: ErrorRequestHandler<Record<string, string>, ErrorEnvelope> = (
  err,
  _req,
  res,
  next,
) => {
  if (isValidatorFailure(err) && err.status < 500) {
    const fields: Record<string, string> = {}
    for (const issue of err.errors) {
      const key = issue.path ?? 'request'
      const message = issue.message ?? 'Invalid value'
      fields[key] = key in fields ? `${fields[key]}; ${message}` : message
    }
    const message = err.errors[0]?.message ?? 'Request validation failed'
    res.status(422).json(errorEnvelope('validation_error', message, fields))
    return
  }

  if (isBodyParseFailure(err)) {
    res
      .status(422)
      .json(errorEnvelope('validation_error', 'Malformed JSON body', { body: 'invalid JSON' }))
    return
  }

  next(err)
}
