import type { components } from './api/schema.js'

export type ErrorCode = components['schemas']['ErrorCode']
export type ErrorEnvelope = components['schemas']['ErrorEnvelope']

// Контрактный конверт ошибок из спеки (components.schemas.ErrorEnvelope).
export function errorEnvelope(
  code: ErrorCode,
  message: string,
  fields: Record<string, string> = {},
): ErrorEnvelope {
  return { error: { code, message, fields } }
}

export function notFoundEnvelope(message = 'Resource not found'): ErrorEnvelope {
  return errorEnvelope('not_found', message)
}
