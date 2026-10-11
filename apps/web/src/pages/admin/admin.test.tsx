import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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
  ADMIN_UNAVAILABLE_MESSAGE: 'Сервер недоступен, попробуйте позже',
}))

import { ApiError, createEventType, getMeetings } from '@/lib/api'
import { EventTypeFormPage } from '@/pages/admin/EventTypeFormPage'
import { MeetingsPage } from '@/pages/admin/MeetingsPage'

const getMeetingsMock = vi.mocked(getMeetings)

beforeEach(() => {
  getMeetingsMock.mockReset()
})

function renderMeetings() {
  return render(
    <MemoryRouter>
      <MeetingsPage />
    </MemoryRouter>,
  )
}

describe('MeetingsPage', () => {
  it('показывает предстоящие Встречи в таблице', async () => {
    getMeetingsMock.mockResolvedValue([
      {
        id: 'm1',
        eventTypeId: 'e1',
        eventTypeName: 'Консультация',
        start: '2026-10-11T09:00:00',
        end: '2026-10-11T09:30:00',
        guestName: 'Иван Петров',
        guestEmail: 'ivan@example.com',
        createdAt: '2026-10-09T18:00:00',
      },
    ])
    renderMeetings()

    expect(await screen.findByText('Иван Петров')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('11 октября, 09:00')).toBeInTheDocument()
  })

  it('пустой список → «Пока нет записей»', async () => {
    getMeetingsMock.mockResolvedValue([])
    renderMeetings()

    expect(await screen.findByText('Пока нет записей')).toBeInTheDocument()
  })

  it('сетевой сбой → текст Админки, а не гостевой', async () => {
    getMeetingsMock.mockRejectedValue(new TypeError('fetch failed'))
    renderMeetings()

    expect(await screen.findByText('Сервер недоступен, попробуйте позже')).toBeInTheDocument()
    expect(screen.queryByText('Записаться сейчас нельзя, попробуйте позже')).not.toBeInTheDocument()
  })

  it('ведёт к форме создания типа события', async () => {
    getMeetingsMock.mockResolvedValue([])
    renderMeetings()

    expect(screen.getByRole('link', { name: 'Создать тип события' })).toHaveAttribute(
      'href',
      '/admin/event-types/new',
    )
  })

  it('навигация без самоссылки: «На главную» ведёт на /', async () => {
    getMeetingsMock.mockResolvedValue([])
    renderMeetings()

    expect(screen.queryByRole('link', { name: 'Предстоящие Встречи' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/')
  })

  it('хедер: активна вкладка «Админка», неактивная «Запись» ведёт на /book', async () => {
    getMeetingsMock.mockResolvedValue([])
    renderMeetings()

    expect(screen.getByRole('tab', { name: 'Админка' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Запись' })).toHaveAttribute('href', '/book')
  })

  it('колонка таблицы — «тип события» со строчной', async () => {
    getMeetingsMock.mockResolvedValue([
      {
        id: 'm1',
        eventTypeId: 'e1',
        eventTypeName: 'Консультация',
        start: '2026-10-11T09:00:00',
        end: '2026-10-11T09:30:00',
        guestName: 'Иван Петров',
        guestEmail: 'ivan@example.com',
        createdAt: '2026-10-09T18:00:00',
      },
    ])
    renderMeetings()

    expect(await screen.findByRole('columnheader', { name: 'тип события' })).toBeInTheDocument()
  })
})

describe('EventTypeFormPage', () => {
  function LocationProbe() {
    const location = useLocation()
    return <output data-testid="location">{location.pathname}</output>
  }

  function renderForm() {
    return render(
      <MemoryRouter initialEntries={['/admin/event-types/new']}>
        <Routes>
          <Route path="/admin/meetings" element={<div>meetings</div>} />
          <Route path="/admin/event-types/new" element={<EventTypeFormPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    )
  }

  beforeEach(() => {
    vi.mocked(createEventType).mockReset()
  })

  it('создаёт Тип события и уходит к списку Встреч', async () => {
    const createEventTypeMock = vi.mocked(createEventType)
    createEventTypeMock.mockResolvedValue({
      id: 'e2',
      name: 'Менторинг',
      description: null,
      duration: 60,
    })
    renderForm()

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(createEventTypeMock).toHaveBeenCalledWith({
      name: 'Менторинг',
      description: null,
      duration: 60,
    })
    // Навигация на список Встреч после создания.
    expect(await screen.findByText('meetings')).toBeInTheDocument()
    expect(screen.getByTestId('location').textContent).toBe('/admin/meetings')
  })

  it('клиентская валидация: длительность не кратна 15 — не отправляет', async () => {
    renderForm()

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(
      await screen.findByText('Длительность — кратна 15, от 15 до 90 минут'),
    ).toBeInTheDocument()
    expect(createEventType).not.toHaveBeenCalled()
  })

  it('клиентская валидация: пустое название', async () => {
    renderForm()

    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(await screen.findByText('Укажите название')).toBeInTheDocument()
    expect(createEventType).not.toHaveBeenCalled()
  })

  it('сетевой сбой → текст Админки, а не гостевой', async () => {
    vi.mocked(createEventType).mockRejectedValue(new TypeError('fetch failed'))
    renderForm()

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(await screen.findByText('Сервер недоступен, попробуйте позже')).toBeInTheDocument()
    expect(screen.queryByText('Записаться сейчас нельзя, попробуйте позже')).not.toBeInTheDocument()
    expect((await screen.findByTestId('location')).textContent).toBe('/admin/event-types/new')
  })

  it('422 от сервера → ошибки полей из конверта', async () => {
    const createEventTypeMock = vi.mocked(createEventType)
    createEventTypeMock.mockRejectedValue(
      new ApiError({
        error: {
          code: 'validation_error',
          message: 'Invalid request',
          fields: { name: 'too long' },
        },
      }),
    )
    renderForm()

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(await screen.findByText('too long')).toBeInTheDocument()
    expect((await screen.findByTestId('location')).textContent).toBe('/admin/event-types/new')
  })
})
