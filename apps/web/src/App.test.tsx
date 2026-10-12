import { render, screen } from '@testing-library/react'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { routes } from '@/router'
import { mockApi } from '@/test/mockApi'

// Страницы ходят в /api при маунте — по умолчанию отвечаем пустыми списками.
beforeEach(() => {
  mockApi({
    'GET /api/event-types': () => Response.json([]),
    'GET /api/meetings': () => Response.json([]),
  })
})

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
    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/book')
  })

  it('страница записи показывает список типов (пусто по умолчанию)', async () => {
    renderAt('/book')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Запись на звонок')
    expect(await screen.findByText('Пока нет доступных типов')).toBeInTheDocument()
  })

  it('неизвестный маршрут уводит на главную', () => {
    renderAt('/no-such-page')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Звонок без переписки')
  })

  it('/book/success без router state показывает общий текст и повторную запись', () => {
    renderAt('/book/success')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Вы записаны!')
    expect(screen.getByRole('link', { name: 'Записаться ещё' })).toHaveAttribute('href', '/book')
  })

  it('/admin редиректит на список предстоящих Встреч', async () => {
    renderAt('/admin')

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Предстоящие Встречи',
    )
    expect(screen.getByRole('link', { name: 'Создать тип события' })).toHaveAttribute(
      'href',
      '/admin/event-types/new',
    )
  })
})

describe('сквозной хедер', () => {
  it('гостевая страница: активна вкладка «Запись», «Админка» ведёт на /admin', async () => {
    renderAt('/book')

    expect(screen.getByRole('tab', { name: 'Запись' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Админка' })).toHaveAttribute('href', '/admin')
  })

  it('админ-страница: активна вкладка «Админка», «Запись» ведёт на /book', async () => {
    renderAt('/admin/meetings')

    expect(screen.getByRole('tab', { name: 'Админка' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Запись' })).toHaveAttribute('href', '/book')
  })

  it('/health — служебная страница без хедера вкладок', async () => {
    renderAt('/health')

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Состояние сервера')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})
