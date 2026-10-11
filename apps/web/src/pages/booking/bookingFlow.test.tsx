import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '@/router'

vi.mock('@/lib/api', () => ({
  api: { GET: vi.fn() },
  getEventTypes: vi.fn(),
  createEventType: vi.fn(),
  getSlots: vi.fn(),
  createMeeting: vi.fn(),
  getMeetings: vi.fn(),
  apiErrorMessage: vi.fn(() => 'Записаться сейчас нельзя, попробуйте позже'),
  ApiError: class ApiError extends Error {
    code: string
    fields: Record<string, string>
    constructor(envelope: {
      error: { code: string; message: string; fields: Record<string, string> }
    }) {
      super(envelope.error.message)
      this.code = envelope.error.code
      this.fields = envelope.error.fields
    }
  },
  API_UNAVAILABLE_MESSAGE: 'Записаться сейчас нельзя, попробуйте позже',
}))

import { ApiError, createMeeting, getEventTypes, getSlots } from '@/lib/api'

const createMeetingMock = vi.mocked(createMeeting)
const getEventTypesMock = vi.mocked(getEventTypes)
const getSlotsMock = vi.mocked(getSlots)

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
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

beforeEach(() => {
  getEventTypesMock.mockReset()
  getSlotsMock.mockReset()
  createMeetingMock.mockReset()
})

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
    getEventTypesMock.mockResolvedValue([eventType])
    const today = isoDay(0)
    getSlotsMock.mockResolvedValue({
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
    })
    createMeetingMock.mockImplementation(async (body) => ({
      id: 'm1',
      eventTypeId: body.eventTypeId,
      eventTypeName: 'Консультация',
      start: body.start,
      end: `${today}T09:30:00`,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      createdAt: '2026-10-10T12:00:00',
    }))

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

    expect(createMeetingMock).toHaveBeenCalledWith({
      eventTypeId: 'e1',
      start: `${today}T09:00:00`,
      guestName: 'Иван Петров',
      guestEmail: 'ivan@example.com',
    })
    expect(await screen.findByRole('heading', { name: 'Вы записаны!' })).toBeInTheDocument()
    expect(screen.getByText(/Иван Петров/)).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe('/book/success')
  })

  it('409 → «Слот больше недоступен» и возврат к календарю', async () => {
    getEventTypesMock.mockResolvedValue([eventType])
    const today = isoDay(0)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: isoDay(13) },
      days: [
        {
          date: today,
          slots: [{ start: `${today}T09:00:00`, end: `${today}T09:30:00`, available: true }],
        },
      ],
    })
    createMeetingMock.mockRejectedValue(
      new ApiError({
        error: { code: 'slot_taken', message: 'Slot is no longer available', fields: {} },
      }),
    )

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Слот больше недоступен')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать другой слот' }))
    expect(await screen.findByRole('heading', { name: 'Выберите Слот' })).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(`/book/e1`)
  })

  it('422 out_of_window → «Слот больше недоступен» и возврат к календарю', async () => {
    // Слот был предложен календарём, но к моменту отправки его время прошло.
    getEventTypesMock.mockResolvedValue([eventType])
    const today = isoDay(0)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: isoDay(13) },
      days: [
        {
          date: today,
          slots: [{ start: `${today}T09:00:00`, end: `${today}T09:30:00`, available: true }],
        },
      ],
    })
    createMeetingMock.mockRejectedValue(
      new ApiError({
        error: {
          code: 'out_of_window',
          message: 'Slot is outside the booking window',
          fields: { start: 'outside the booking window or working hours' },
        },
      }),
    )

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Слот больше недоступен')).toBeInTheDocument()
    expect(
      await screen.findByText('Время этого Слота уже прошло — выберите другой Слот.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Выбрать другой слот' }))
    expect(await screen.findByRole('heading', { name: 'Выберите Слот' })).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe(`/book/e1`)
  })

  it('клиентская валидация: пустое имя — «Укажите имя», запрос не уходит', async () => {
    getEventTypesMock.mockResolvedValue([eventType])
    const today = isoDay(0)
    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Email'), {
      target: { value: 'ivan@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Укажите имя')).toBeInTheDocument()
    expect(createMeetingMock).not.toHaveBeenCalled()
  })

  it('клиентская валидация: неверный email — «Похоже, в email ошибка», запрос не уходит', async () => {
    getEventTypesMock.mockResolvedValue([eventType])
    const today = isoDay(0)
    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('Похоже, в email ошибка')).toBeInTheDocument()
    expect(createMeetingMock).not.toHaveBeenCalled()
  })

  it('422 → ошибки полей из конверта', async () => {
    // Подсказки клиентской валидации пройдены; сервер вернул ошибки полей —
    // рендерим их как есть (тексты сервера — технический fallback, §5).
    getEventTypesMock.mockResolvedValue([eventType])
    const today = isoDay(0)
    createMeetingMock.mockRejectedValue(
      new ApiError({
        error: {
          code: 'validation_error',
          message: 'Invalid request',
          fields: { guestEmail: 'must be a valid email' },
        },
      }),
    )

    renderBooking(`/book/e1/confirm?start=${encodeURIComponent(`${today}T09:00:00`)}`)

    fireEvent.input(await screen.findByLabelText('Имя'), { target: { value: 'Иван Петров' } })
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Записаться' }))

    expect(await screen.findByText('must be a valid email')).toBeInTheDocument()
  })
})
