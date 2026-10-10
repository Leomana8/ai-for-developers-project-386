import { afterEach, describe, expect, it, vi } from 'vitest'

// В браузере `new Request('/api/health')` резолвится от origin страницы, но в
// jsdom `Request` — это undici, который требует абсолютный URL. Для клиента с
// пустой базой URL подменяем Request на браузероподобный, резолвящий `/…` к localhost.
class RelativeRequest extends Request {
  constructor(input: string | URL | Request, init?: RequestInit) {
    const resolved =
      typeof input === 'string' && input.startsWith('/')
        ? new URL(input, 'http://localhost')
        : input
    super(resolved, init)
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('api client (сгенерированный SDK)', () => {
  it('ходит на относительный /api/health и возвращает типизированный ответ', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('Request', RelativeRequest)

    // Динамический импорт после подмены глобальных fetch/Request: клиент создаётся
    // с подменёнными значениями (статический импорт создал бы его раньше).
    const { api } = await import('./api')

    const { data } = await api.GET('/api/health')

    expect(data).toEqual({ status: 'ok' })
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(request.url).toBe('http://localhost/api/health')
  })
})
