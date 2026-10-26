import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { EventTypeFormPage } from '@/pages/admin/EventTypeFormPage'
import { MeetingsPage } from '@/pages/admin/MeetingsPage'
import { mockApi } from '@/test/mockApi'

const upcomingMeeting = {
  id: 'm1',
  eventTypeId: 'e1',
  eventTypeName: 'Консультация',
  start: '2026-10-11T09:00:00',
  end: '2026-10-11T09:30:00',
  guestName: 'Иван Петров',
  guestEmail: 'ivan@example.com',
  createdAt: '2026-10-09T18:00:00',
}

function renderMeetings() {
  return render(
    <MemoryRouter>
      <MeetingsPage />
    </MemoryRouter>,
  )
}

describe('MeetingsPage', () => {
  it('показывает предстоящие Встречи в таблице', async () => {
    mockApi({ 'GET /api/meetings': () => Response.json([upcomingMeeting]) })
    renderMeetings()

    expect(await screen.findByText('Иван Петров')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('11 октября, 09:00')).toBeInTheDocument()
  })

  it('пустой список → «Пока нет записей»', async () => {
    mockApi({ 'GET /api/meetings': () => Response.json([]) })
    renderMeetings()

    expect(await screen.findByText('Пока нет записей')).toBeInTheDocument()
  })

  it('сетевой сбой → текст Админки, а не гостевой', async () => {
    mockApi({
      'GET /api/meetings': () => {
        throw new TypeError('fetch failed')
      },
    })
    renderMeetings()

    expect(await screen.findByText('Сервер недоступен, попробуйте позже')).toBeInTheDocument()
    expect(screen.queryByText('Записаться сейчас нельзя, попробуйте позже')).not.toBeInTheDocument()
  })

  it('ведёт к форме создания типа события', async () => {
    mockApi({ 'GET /api/meetings': () => Response.json([]) })
    renderMeetings()

    expect(screen.getByRole('link', { name: 'Создать тип события' })).toHaveAttribute(
      'href',
      '/admin/event-types/new',
    )
  })

  it('навигация без самоссылки: «На главную» ведёт на /', async () => {
    mockApi({ 'GET /api/meetings': () => Response.json([]) })
    renderMeetings()

    expect(screen.queryByRole('link', { name: 'Предстоящие Встречи' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/')
  })

  it('хедер: активна вкладка «Админка», неактивная «Запись» ведёт на /book', async () => {
    mockApi({ 'GET /api/meetings': () => Response.json([]) })
    renderMeetings()

    expect(screen.getByRole('tab', { name: 'Админка' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Запись' })).toHaveAttribute('href', '/book')
  })

  it('колонка таблицы — «тип события» со строчной', async () => {
    mockApi({ 'GET /api/meetings': () => Response.json([upcomingMeeting]) })
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

  it('создаёт Тип события и уходит к списку Встреч', async () => {
    let requestBody: unknown
    mockApi({
      'POST /api/event-types': async (request) => {
        requestBody = await request.json()
        return Response.json(
          { id: 'e2', name: 'Менторинг', description: null, duration: 60 },
          { status: 201 },
        )
      },
    })
    renderForm()
    fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: 'e2' } })

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    // Навигация на список Встреч после создания.
    expect(await screen.findByText('meetings')).toBeInTheDocument()
    // Тело запроса на границе /api (обработчик mockApi записывает его асинхронно).
    expect(requestBody).toEqual({ id: 'e2', name: 'Менторинг', description: null, duration: 60 })
    expect(screen.getByTestId('location').textContent).toBe('/admin/meetings')
  })

  it.each(['', 'Bad-ID', 'call--intro', 'a/b', 'a'.repeat(101)])(
    'не отправляет неверный идентификатор %j',
    async (id) => {
      const create = vi.fn()
      mockApi({ 'POST /api/event-types': create })
      renderForm()
      fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: id } })
      fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Созвон' } })
      fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '30' } })
      fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))
      expect(screen.getByLabelText('Идентификатор')).toHaveAttribute('aria-invalid', 'true')
      expect(create).not.toHaveBeenCalled()
    },
  )

  it('показывает ошибку занятого идентификатора и сохраняет ввод', async () => {
    mockApi({
      'POST /api/event-types': () =>
        Response.json(
          {
            error: {
              code: 'validation_error',
              message: 'Проверьте правильность заполнения полей',
              fields: { id: 'Этот идентификатор уже занят' },
            },
          },
          { status: 422 },
        ),
    })
    renderForm()
    fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: 'intro-call' } })
    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Созвон' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))
    expect(await screen.findByText('Этот идентификатор уже занят')).toBeInTheDocument()
    expect(screen.getByLabelText('Идентификатор')).toHaveValue('intro-call')
    expect(screen.getByTestId('location').textContent).toBe('/admin/event-types/new')
  })

  it('клиентская валидация: длительность не кратна 15 — не отправляет', async () => {
    const createEventType = vi.fn()
    mockApi({ 'POST /api/event-types': createEventType })
    renderForm()
    fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: 'e2' } })

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(
      await screen.findByText('Длительность — кратна 15, от 15 до 90 минут'),
    ).toBeInTheDocument()
    expect(createEventType).not.toHaveBeenCalled()
  })

  it('клиентская валидация: пустое название', async () => {
    const createEventType = vi.fn()
    mockApi({ 'POST /api/event-types': createEventType })
    renderForm()
    fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: 'e2' } })

    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(await screen.findByText('Укажите название')).toBeInTheDocument()
    expect(createEventType).not.toHaveBeenCalled()
  })

  it('сетевой сбой → текст Админки, а не гостевой', async () => {
    mockApi({
      'POST /api/event-types': () => {
        throw new TypeError('fetch failed')
      },
    })
    renderForm()
    fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: 'e2' } })

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(await screen.findByText('Сервер недоступен, попробуйте позже')).toBeInTheDocument()
    expect(screen.queryByText('Записаться сейчас нельзя, попробуйте позже')).not.toBeInTheDocument()
    expect((await screen.findByTestId('location')).textContent).toBe('/admin/event-types/new')
  })

  it('422 от сервера → ошибки полей из конверта', async () => {
    mockApi({
      'POST /api/event-types': () =>
        Response.json(
          {
            error: {
              code: 'validation_error',
              message: 'Проверьте правильность заполнения полей',
              // Сервер переводит правила валидатора в русский канон §5
              // (apps/server/src/openapi.ts), UI показывает тексты как есть.
              fields: { name: 'Название не длиннее 100 символов' },
            },
          },
          { status: 422 },
        ),
    })
    renderForm()
    fireEvent.input(screen.getByLabelText('Идентификатор'), { target: { value: 'e2' } })

    fireEvent.input(screen.getByLabelText('Название'), { target: { value: 'Менторинг' } })
    fireEvent.input(screen.getByLabelText(/Длительность/), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Создать тип события' }))

    expect(await screen.findByText('Название не длиннее 100 символов')).toBeInTheDocument()
    expect((await screen.findByTestId('location')).textContent).toBe('/admin/event-types/new')
  })
})
