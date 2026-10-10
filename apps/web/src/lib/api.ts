import createClient from 'openapi-fetch'

import type { components, paths } from '@/api/schema'

// База URL по умолчанию пустая → запросы идут относительными путями /api/*,
// которые проксирует Vite (см. vite.config.ts). Абсолютные URL не используем.
export const api = createClient<paths>()

type Availability = components['schemas']['Availability']
type ErrorEnvelope = components['schemas']['ErrorEnvelope']
type ErrorCode = components['schemas']['ErrorCode']
type EventType = components['schemas']['EventType']
type EventTypeCreate = components['schemas']['EventTypeCreate']
type Meeting = components['schemas']['Meeting']
type MeetingCreate = components['schemas']['MeetingCreate']

// Типизированная ошибка API: конверт { error: { code, message, fields } }
// из спеки разбирается в исключение, которое умеет читать UI.
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly fields: Record<string, string>

  constructor(envelope: ErrorEnvelope) {
    super(envelope.error.message)
    this.name = 'ApiError'
    this.code = envelope.error.code
    this.fields = envelope.error.fields
  }
}

// openapi-fetch кладёт в error распарсенное тело не-2xx ответа — по контракту
// это конверт, но прокси может отдать и не-JSON: проверяем форму, а не верим типам.
function isEnvelope(value: unknown): value is ErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ErrorEnvelope).error?.message === 'string'
  )
}

async function unwrap<T>(request: Promise<{ data?: T; error?: ErrorEnvelope }>): Promise<T> {
  const result = await request
  // error — тело не-2xx ответа; не-конверт (например, HTML от прокси) —
  // контрактное нарушение, обычный Error.
  if (isEnvelope(result.error)) throw new ApiError(result.error)
  if (result.data === undefined) throw new Error('Unexpected empty API response')
  return result.data
}

// Функции под эндпоинты спеки (docs/spec.md §6), решения карты #17.
export function getEventTypes(): Promise<EventType[]> {
  return unwrap(api.GET('/api/event-types'))
}

export function createEventType(body: EventTypeCreate): Promise<EventType> {
  return unwrap(api.POST('/api/event-types', { body }))
}

export function getSlots(eventTypeId: string): Promise<Availability> {
  return unwrap(api.GET('/api/event-types/{id}/slots', { params: { path: { id: eventTypeId } } }))
}

export function createMeeting(body: MeetingCreate): Promise<Meeting> {
  return unwrap(api.POST('/api/meetings', { body }))
}

export function getMeetings(): Promise<Meeting[]> {
  return unwrap(api.GET('/api/meetings'))
}

// Понятные сообщения для кодов ошибок из спеки; UI показывает их как есть.
// Неизвестные коды и сетевые сбои (fetch бросает TypeError) — общий текст.
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  slot_taken: 'Слот больше недоступен',
  out_of_window: 'Этот слот вне окна записи',
  validation_error: 'Проверьте правильность заполнения полей',
  not_found: 'Тип события не найден',
}

export const API_UNAVAILABLE_MESSAGE = 'Записаться сейчас нельзя, попробуйте позже'

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] ?? error.message
  }
  return API_UNAVAILABLE_MESSAGE
}
