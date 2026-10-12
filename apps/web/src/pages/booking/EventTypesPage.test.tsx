import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { EventTypesPage } from '@/pages/booking/EventTypesPage'
import { mockApi } from '@/test/mockApi'

function renderTypes() {
  return render(
    <MemoryRouter>
      <EventTypesPage />
    </MemoryRouter>,
  )
}

describe('EventTypesPage', () => {
  it('показывает Типы событий со ссылками на календарь', async () => {
    mockApi({
      'GET /api/event-types': () =>
        Response.json([
          { id: 'e1', name: 'Знакомство', description: 'Короткий созвон', duration: 15 },
          { id: 'e2', name: 'Менторинг', description: null, duration: 60 },
        ]),
    })
    renderTypes()

    expect(screen.getByText('Выберите тип события — и подходящее время.')).toBeInTheDocument()
    expect(await screen.findByText('Знакомство')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Знакомство/ })).toHaveAttribute('href', '/book/e1')
    expect(screen.getByRole('link', { name: /Менторинг/ })).toHaveAttribute('href', '/book/e2')
  })

  it('пустой список → «Пока нет доступных типов»', async () => {
    mockApi({ 'GET /api/event-types': () => Response.json([]) })
    renderTypes()

    expect(await screen.findByText('Пока нет доступных типов')).toBeInTheDocument()
  })

  it('ошибка API → понятное сообщение', async () => {
    mockApi({
      'GET /api/event-types': () => {
        throw new TypeError('fetch failed')
      },
    })
    renderTypes()

    expect(
      await screen.findByText('Записаться сейчас нельзя, попробуйте позже'),
    ).toBeInTheDocument()
  })
})
