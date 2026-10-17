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

type ValidatorIssue = { path?: string; errorCode?: string }

// JSON Pointer валидатора ('/body/guestName') → имя поля запроса ('guestName'):
// ключи полей в ErrorEnvelope должны совпадать с ключами тела (спека §5 —
// «422 со списком полей»), иначе клиент не сопоставит их с формами.
// Указатели вне тела ('/start') нормализуем без ведущего слэша, пустой — 'request'.
function fieldKey(issuePath: string | undefined): string {
  if (issuePath === undefined || issuePath === '') return 'request'
  const parts = issuePath.split('/').filter(Boolean)
  if (parts[0] === 'body') return parts.slice(1).join('.') || 'body'
  return parts.join('.')
}

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

// Ошибка поля ajv → русский текст канона §5. UI показывает поля конверта как
// есть, поэтому технические сообщения ('must match format "email"') в интерфейс
// попадать не должны. Ключ — имя поля запроса, значение — тексты по коду
// правила валидатора; незаданная комбинация — общий текст (лучше, чем чужой язык).
const FIELD_TEXTS: Record<string, Record<string, string>> = {
  guestName: {
    required: 'Укажите имя',
    minLength: 'Укажите имя',
    maxLength: 'Имя не длиннее 100 символов',
  },
  guestEmail: {
    required: 'Укажите email',
    format: 'Похоже, в email ошибка',
    maxLength: 'Email не длиннее 254 символов',
  },
  name: {
    required: 'Укажите название',
    minLength: 'Укажите название',
    maxLength: 'Название не длиннее 100 символов',
  },
  description: { maxLength: 'Описание не длиннее 500 символов' },
  duration: {
    required: 'Укажите длительность в минутах',
    type: 'Укажите длительность в минутах',
    minimum: 'Длительность — кратна 15, от 15 до 90 минут',
    maximum: 'Длительность — кратна 15, от 15 до 90 минут',
  },
}

const DEFAULT_FIELD_TEXT = 'Некорректное значение поля'

// Код правила из errorCode ('maxLength.openapi.validation') — самого keyword
// express-openapi-validator в ошибку не кладёт.
function fieldMessage(field: string, errorCode: string | undefined): string {
  const keyword = errorCode?.split('.')[0] ?? ''
  return FIELD_TEXTS[field]?.[keyword] ?? DEFAULT_FIELD_TEXT
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
      const key = fieldKey(issue.path)
      const message = fieldMessage(key, issue.errorCode)
      fields[key] = key in fields ? `${fields[key]}; ${message}` : message
    }
    // Канон message конверта — docs/spec.md §6.
    res
      .status(422)
      .json(errorEnvelope('validation_error', 'Проверьте правильность заполнения полей', fields))
    return
  }

  if (isBodyParseFailure(err)) {
    res.status(422).json(
      errorEnvelope('validation_error', 'Некорректное тело запроса', {
        body: 'Некорректный JSON',
      }),
    )
    return
  }

  next(err)
}
