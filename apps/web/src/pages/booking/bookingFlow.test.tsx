import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { routes } from '@/router'
import { mockApi } from '@/test/mockApi'

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}

function Routes() {
  return useRoutes(routes)
}

function renderBooking(path = '/book') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
      <LocationProbe />
    </MemoryRouter>,
  )
}

const eventType = {
  id: 'e1',
  name: 'Консультация',
  description: 'Разбор вопроса',
  duration: 30,
}

// Дни окна: локальные даты, чтобы не зависеть от часового пояса.
function isoDay(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

describe('гостевой поток записи', () => {
  it('от выбора Типа события до экрана успеха', async () => {
    const today = isoDay(0)
    let meetingBody: unknown
    mockApi({
      'GET /api/event-types': () => Response.json([eventType]),
      'GET /api/event-types/e1/slots': () =>
        Response.json({
          eventTypeId: 'e1',
          window: { from: today, to: isoDay(13) },
          days: [
            {
              date: today,
              slots: [
                { start: `${today}T09:00:00`, end: `${today}T09:30:00`, available: true },
                { start: `${today}T09:30:00`, end: `${today}T10:00:00`, available: false },
              ],
            },
          ],
        }),
      'POST /api/meetings': async (request) => {
        meetingBody = await request.json()
        const body = meetingBody as {
          eventTypeId: string
          start: string
          guestName: string
          guestEmail: string
        }
        return Response.json(
          {
            id: 'm1',
            eventTypeId: body.eventTypeId,
            eventTypeName: eventType.name,
            start: body.start,
            end: `${today}T09:30:00`,
            guestName: body.guestName,
            guestEmail: body.guestEmail,
            createdAt: '2026-10-10T12:00:00',
          },
          { status: 201 },
        )
      },
    })

    renderBooking('/book')

    // Шаг 1: Тип события → календарь и Слоты.
    fireEvent.click(await screen.findByRole('link', { name: /Консультация/ }))
    expect(await screen.findByRole('heading', { name: 'Выберите Слот' })).toBeInTheDocument()

    // Шаг 2: занятый Слот отключен, свободный выбирается, «Продолжить» — на подтверждение.
    expect(await screen.findByRole('button', { name: '09:30' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '09:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
    expect(await screen.findByRole('heading', { name: 'Подтвердите Запись' })).toBeInTheDocument()

    // Шаг 3: имя и email → Запись.
    fireEvent.input(screen.getByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByRole('heading', { name: 'Вы записаны!' })).toBeInTheDocument()
    // Тело запроса на границе /api (обработчик mockApi записывает его асинхронно).
    expect(meetingBody).toEqual({
      eventTypeId: 'e1',
      start: `${today}T09:00:00`,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    })
    expect(screen.getByText(/Иван Петров/)).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe('/book/success')
  })

  it('409 → «Слот больше недоступен» и возврат к календарю на день Слота', async () => {
    const today = isoDay(0)
    mockApi({
      'GET /api/event-types': () => Response.json([eventType]),
      'GET /api/event-types/e1/slots': () =>
        Response.json({
          eventTypeId: 'e1',
          window: { from: today, to: isoDay(13) },
          days: [
            {
              date: today,
              slots: [{ start: `${today}T09:00:00`, end: `${today}T09:30:00`, available: true }],
            },
          ],
        }),
      'POST /api/meetings': () =>
        Response.json(
          { error: { code: 'slot_taken', message: 'Слот больше недоступен', fields: {} } },
          { status: 409 },
        ),
    })

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Слот больше недоступен')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать другой слот' }))
    expect(await screen.findByRole('heading', { name: 'Выберите Слот' })).toBeInTheDocument()
    // День выбранного Слота сохраняется (story 22 — возврат без потери контекста).
    expect(screen.getByTestId('location').textContent).toBe(`/book/e1?date=${today}`)
  })

  it('422 out_of_window → «Слот больше недоступен» и возврат к календарю', async () => {
    // Слот был предложен календарём, но к моменту отправки его время прошло.
    const today = isoDay(0)
    mockApi({
      'GET /api/event-types': () => Response.json([eventType]),
      'GET /api/event-types/e1/slots': () =>
        Response.json({
          eventTypeId: 'e1',
          window: { from: today, to: isoDay(13) },
          days: [
            {
              date: today,
              slots: [{ start: `${today}T09:00:00`, end: `${today}T09:30:00`, available: true }],
            },
          ],
        }),
      'POST /api/meetings': () =>
        Response.json(
          {
            error: {
              code: 'out_of_window',
              message: 'Этот слот вне окна записи',
              fields: { start: 'Слот вне окна записи или рабочего времени (09:00–18:00)' },
            },
          },
          { status: 422 },
        ),
    })

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Слот больше недоступен')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать другой слот' }))
    expect(await screen.findByRole('heading', { name: 'Выберите Слот' })).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(`/book/e1?date=${today}`)
  })

  it('клиентская валидация: пустое имя — «Укажите имя», запрос не уходит', async () => {
    const today = isoDay(0)
    const postMeeting = vi.fn()
    mockApi({
      'GET /api/event-types': () => Response.json([eventType]),
      'POST /api/meetings': postMeeting,
    })

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Email'), {
      target: { value: 'ivan@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Укажите имя')).toBeInTheDocument()
    expect(postMeeting).not.toHaveBeenCalled()
  })

  it('клиентская валидация: неверный email — «Похоже, в email ошибка», запрос не уходит', async () => {
    const today = isoDay(0)
    const postMeeting = vi.fn()
    mockApi({
      'GET /api/event-types': () => Response.json([eventType]),
      'POST /api/meetings': postMeeting,
    })

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Похоже, в email ошибка')).toBeInTheDocument()
    expect(postMeeting).not.toHaveBeenCalled()
  })

  it('422 → ошибки полей из конверта', async () => {
    // Подсказки клиентской валидации пройдены; сервер вернул ошибки полей —
    // рендерим их как есть (тексты сервера — технический fallback, §5).
    const today = isoDay(0)
    mockApi({
      'GET /api/event-types': () => Response.json([eventType]),
      'POST /api/meetings': () =>
        Response.json(
          {
            error: {
              code: 'validation_error',
              message: 'Проверьте правильность заполнения полей',
              fields: { guestEmail: 'must be a valid email' },
            },
          },
          { status: 422 },
        ),
    })

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('must be a valid email')).toBeInTheDocument()
  })
})
