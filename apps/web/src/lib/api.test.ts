import { afterEach, describe, expect, it, vi } from 'vitest'

import type { components } from '@/api/schema'
import { RelativeRequest } from '@/test/mockApi'

// Клиент с пустой базой URL ходит относительными /api/* — подменять Request
// на браузероподобный (RelativeRequest) нужно и здесь, см. src/test/mockApi.ts.

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

describe('функции слоя данных', () => {
  // Динамический импорт после подмены глобальных fetch/Request.
  async function withFetch(response: Response) {
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('Request', RelativeRequest)
    return { ...(await import('./api')), fetchMock }
  }

  it('getEventTypes запрашивает /api/event-types и возвращает список', async () => {
    const eventTypes = [{ id: 'e1', name: 'Знакомство', description: null, duration: 15 }]
    const { getEventTypes, fetchMock } = await withFetch(Response.json(eventTypes, { status: 200 }))

    expect(await getEventTypes()).toEqual(eventTypes)
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(request.url).toBe('http://localhost/api/event-types')
  })

  it('getSlots передаёт id Типа события в путь', async () => {
    const { getSlots, fetchMock } = await withFetch(
      Response.json({ eventTypeId: 'e1', window: {}, days: [] }, { status: 200 }),
    )

    await getSlots('e1')
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(request.url).toBe('http://localhost/api/event-types/e1/slots')
  })

  it('createMeeting отправляет тело и возвращает Встречу', async () => {
    const meeting = {
      id: 'm1',
      eventTypeId: 'e1',
      eventTypeName: 'Консультация',
      start: '2026-10-11T09:00:00',
      end: '2026-10-11T09:30:00',
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
      createdAt: '2026-10-10T12:00:00',
    }
    const { createMeeting, fetchMock } = await withFetch(Response.json(meeting, { status: 201 }))

    const created = await createMeeting({
      eventTypeId: 'e1',
      start: '2026-10-11T09:00:00',
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    })
    expect(created).toEqual(meeting)

    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(request.url).toBe('http://localhost/api/meetings')
    expect(await request.json()).toEqual({
      eventTypeId: 'e1',
      start: '2026-10-11T09:00:00',
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    })
  })

  it('бросает типизированную ApiError из конверта ошибки', async () => {
    const { createMeeting } = await withFetch(
      Response.json(
        {
          error: {
            code: 'slot_taken',
            message: 'Slot is no longer available',
            fields: {},
          },
        },
        { status: 409 },
      ),
    )

    await expect(
      createMeeting({
        eventTypeId: 'e1',
        start: '2026-10-11T09:00:00',
        guestName: 'Иван Петров',
        guestEmail: 'ivan@example.com',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      code: 'slot_taken',
      fields: {},
    })
  })

  it('бросает обычный Error, если ответ пустой или не из конверта', async () => {
    const { getMeetings } = await withFetch(
      new Response('<html>Bad Gateway</html>', { status: 502 }),
    )

    await expect(getMeetings()).rejects.toThrow('Unexpected empty API response')
  })
})

describe('apiErrorMessage', () => {
  async function load() {
    return await import('./api')
  }

  it('маппит коды контракта на понятные сообщения', async () => {
    const { ApiError, apiErrorMessage } = await load()

    const cases: Array<[components['schemas']['ErrorCode'], string]> = [
      ['slot_taken', 'Слот больше недоступен'],
      ['out_of_window', 'Этот слот вне окна записи'],
      ['validation_error', 'Проверьте правильность заполнения полей'],
      ['not_found', 'Тип события не найден'],
    ]
    for (const [code, message] of cases) {
      const envelope = { error: { code, message: 'raw', fields: {} } }
      expect(apiErrorMessage(new ApiError(envelope))).toBe(message)
    }
  })

  it('сетевые сбои сводит к сообщению о недоступности', async () => {
    const { apiErrorMessage } = await load()
    expect(apiErrorMessage(new TypeError('fetch failed'))).toBe(
      'Записаться сейчас нельзя, попробуйте позже',
    )
  })
})
