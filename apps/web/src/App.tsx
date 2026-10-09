import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type HealthStatus = 'unknown' | 'ok' | 'error'

function App() {
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
    <div className="flex min-h-svh items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Календарь звонков</CardTitle>
          <CardDescription>Каркас приложения собран. Проверим бэкенд.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
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
        </CardContent>
      </Card>
    </div>
  )
}

export default App
