import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { HomePage } from '@/pages/HomePage'

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('CTA «Записаться» ведёт на /book', () => {
    renderHomePage()

    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/book')
  })

  it('вкладка «Админка» ведёт на /admin', () => {
    renderHomePage()

    expect(screen.getByRole('tab', { name: 'Админка' })).toHaveAttribute('href', '/admin')
  })

  it('активная вкладка — «Запись»', () => {
    renderHomePage()

    expect(screen.getByRole('tab', { name: 'Запись' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Админка' })).toHaveAttribute('aria-selected', 'false')
  })
})
