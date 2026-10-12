import { vi } from 'vitest'

// В браузере `new Request('/api/…')` резолвится от origin страницы, но в jsdom
// `Request` — это undici, которому нужен абсолютный URL. Подменяем Request на
// браузероподобный, резолвящий `/…` к localhost.
export class RelativeRequest extends Request {
  constructor(input: string | URL | Request, init?: RequestInit) {
    const resolved =
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, 'http://localhost')
        : input
    super(resolved, init)
  }
}

// Обработчик эндпоинта: получает исходный Request (тело читается через
// `await request.json()`), возвращает Response. Брошенный TypeError моделирует
// сетевой сбой (Сервер недоступен).
export type ApiHandler = (request: Request) => Response | Promise<Response>

let handlers: Record<string, ApiHandler> = {}

// Шов веб-тестов — граница /api (fetch), docs/spec.md §8: компонентные тесты
// мокают fetch, а не модуль слоя данных. Клиент openapi-fetch захватывает
// globalThis.fetch/Request при создании (модуль @/lib/api), поэтому stub
// ставится из setup.ts до загрузки тестовых файлов, а в самих тестах
// подменяются только маршруты через mockApi().
export function installApiMock(): void {
  globalThis.Request = RelativeRequest
  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const request = input instanceof Request ? input : new RelativeRequest(input)
    const { pathname } = new URL(request.url)
    const handler = handlers[`${request.method} ${pathname}`]
    if (handler === undefined) {
      throw new Error(`mockApi: нет обработчика для ${request.method} ${pathname}`)
    }
    return handler(request)
  }) as unknown as typeof fetch
}

// Подменяет (или дополняет) маршруты на время теста; ключи —
// 'GET /api/event-types', 'POST /api/meetings' и т.п. Маршруты сбрасываются
// после каждого теста (resetApiMock в setup.ts).
export function mockApi(routes: Record<string, ApiHandler>): void {
  handlers = { ...handlers, ...routes }
}

export function resetApiMock(): void {
  handlers = {}
}
