import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HealthPage } from '@/pages/HealthPage'
import { mockApi } from '@/test/mockApi'

describe('HealthPage', () => {
  it('служебная страница — без хедера вкладок', () => {
    render(<HealthPage />)

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('запрашивает /api/health и показывает «Сервер отвечает ✓»', async () => {
    const health = vi.fn((_request: Request) => Response.json({ status: 'ok' }))
    mockApi({ 'GET /api/health': health })

    render(<HealthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Проверить /api/health' }))

    const [request] = health.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/api/health')
    expect(await screen.findByText('Сервер отвечает ✓')).toBeInTheDocument()
  })

  it('показывает «Сервер недоступен ✗» при ошибке запроса', async () => {
    mockApi({
      'GET /api/health': () => {
        throw new TypeError('fetch failed')
      },
    })

    render(<HealthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Проверить /api/health' }))

    expect(await screen.findByText('Сервер недоступен ✗')).toBeInTheDocument()
  })
})
