import { render, screen } from '@testing-library/react'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { routes } from '@/router'

function Routes() {
  return useRoutes(routes)
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
    </MemoryRouter>,
  )
}

describe('маршрутизация', () => {
  it('главная показывает заголовок и ведёт на страницу записи', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Звонок без переписки')
    expect(screen.getByRole('link', { name: 'Записаться на звонок' })).toHaveAttribute(
      'href',
      '/book',
    )
  })

  it('страница записи показывает заглушку выбора слота', () => {
    renderAt('/book')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Выбор слота')
  })

  it('неизвестный маршрут уводит на главную', () => {
    renderAt('/no-such-page')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Звонок без переписки')
  })
})
