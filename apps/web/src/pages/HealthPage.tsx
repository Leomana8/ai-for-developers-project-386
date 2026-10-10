import { useState } from 'react'

import { Button } from '@/components/ui/button'

type HealthStatus = 'unknown' | 'ok' | 'error'

export function HealthPage() {
  const [status, setStatus] = useState<HealthStatus>('unknown')

  async function checkHealth() {
    try {
      const response = await fetch('/api/health')
      const body = (await response.json()) as { status: string }
      setStatus(response.ok && body.status === 'ok' ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="font-heading text-3xl font-semibold">Состояние сервера</h1>
      <div className="flex items-center gap-3">
        <Button onClick={checkHealth}>Проверить /api/health</Button>
        <span
          className={
            status === 'ok'
              ? 'text-sm text-green-600'
              : status === 'error'
                ? 'text-sm text-red-600'
                : 'text-sm text-muted-foreground'
          }
        >
          {status === 'ok' && 'Сервер отвечает ✓'}
          {status === 'error' && 'Сервер недоступен ✗'}
          {status === 'unknown' && 'Статус не проверялся'}
        </span>
      </div>
    </main>
  )
}
