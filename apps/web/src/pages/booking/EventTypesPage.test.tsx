import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { getEventTypes } from '@/lib/api'
import { EventTypesPage } from '@/pages/booking/EventTypesPage'

const getEventTypesMock = vi.mocked(getEventTypes)

beforeEach(() => {
  getEventTypesMock.mockReset()
})

function renderTypes() {
  return render(
    <MemoryRouter>
      <EventTypesPage />
    </MemoryRouter>,
  )
}

describe('EventTypesPage', () => {
  it('показывает Типы событий со ссылками на календарь', async () => {
    getEventTypesMock.mockResolvedValue([
      { id: 'e1', name: 'Знакомство', description: 'Короткий созвон', duration: 15 },
      { id: 'e2', name: 'Менторинг', description: null, duration: 60 },
    ])
    renderTypes()

    expect(screen.getByText('Выберите тип события — и подходящее время.')).toBeInTheDocument()
    expect(await screen.findByText('Знакомство')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Знакомство/ })).toHaveAttribute('href', '/book/e1')
    expect(screen.getByRole('link', { name: /Менторинг/ })).toHaveAttribute('href', '/book/e2')
  })

  it('пустой список → «Пока нет доступных типов»', async () => {
    getEventTypesMock.mockResolvedValue([])
    renderTypes()

    expect(await screen.findByText('Пока нет доступных типов')).toBeInTheDocument()
  })

  it('ошибка API → понятное сообщение', async () => {
    getEventTypesMock.mockRejectedValue(new TypeError('fetch failed'))
    renderTypes()

    expect(
      await screen.findByText('Записаться сейчас нельзя, попробуйте позже'),
    ).toBeInTheDocument()
  })
})
