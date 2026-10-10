import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from '@/pages/HomePage'

vi.mock('@/lib/api', () => ({
  getEventTypes: vi.fn(),
  apiErrorMessage: vi.fn(() => 'Записаться сейчас нельзя, попробуйте позже'),
}))

import { getEventTypes } from '@/lib/api'

const getEventTypesMock = vi.mocked(getEventTypes)

beforeEach(() => {
  getEventTypesMock.mockReset()
})

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('CTA «Записаться» ведёт на /book', () => {
    getEventTypesMock.mockReturnValue(new Promise(() => {}))
    renderHomePage()

    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/book')
  })

  it('показывает Типы событий из API со ссылкой на запись', async () => {
    getEventTypesMock.mockResolvedValue([
      { id: 'e1', name: 'Знакомство', description: 'Короткий созвон', duration: 15 },
      { id: 'e2', name: 'Консультация', description: null, duration: 30 },
    ])
    renderHomePage()

    expect(await screen.findByText('Знакомство')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('15 мин')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Знакомство/ })).toHaveAttribute('href', '/book/e1')
    expect(screen.getByRole('link', { name: /Консультация/ })).toHaveAttribute('href', '/book/e2')
  })

  it('пустой список → «Пока нет доступных типов»', async () => {
    getEventTypesMock.mockResolvedValue([])
    renderHomePage()

    expect(await screen.findByText('Пока нет доступных типов')).toBeInTheDocument()
  })

  it('ошибка API → понятное сообщение', async () => {
    getEventTypesMock.mockRejectedValue(new TypeError('fetch failed'))
    renderHomePage()

    expect(
      await screen.findByText('Записаться сейчас нельзя, попробуйте позже'),
    ).toBeInTheDocument()
  })
})
