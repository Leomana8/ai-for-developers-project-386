import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { HealthPage } from '@/pages/HealthPage'

vi.mock('@/lib/api', () => ({
  api: { GET: vi.fn() },
}))

const getMock = vi.mocked(api.GET)

beforeEach(() => {
  getMock.mockReset()
})

describe('HealthPage', () => {
  it('запрашивает /api/health и показывает «Сервер отвечает ✓»', async () => {
    getMock.mockResolvedValue({ data: { status: 'ok' } })

    render(<HealthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Проверить /api/health' }))

    expect(getMock).toHaveBeenCalledWith('/api/health')
    expect(await screen.findByText('Сервер отвечает ✓')).toBeInTheDocument()
  })

  it('показывает «Сервер недоступен ✗» при ошибке запроса', async () => {
    getMock.mockRejectedValue(new Error('network'))

    render(<HealthPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Проверить /api/health' }))

    expect(await screen.findByText('Сервер недоступен ✗')).toBeInTheDocument()
  })
})
