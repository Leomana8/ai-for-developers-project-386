import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiErrorMessage, getEventTypes } from '@/lib/api'
import type { components } from '@/api/schema'

type EventType = components['schemas']['EventType']

// /book — список Типов событий, с которых начинается Запись.
export function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getEventTypes().then(
      (types) => {
        if (!cancelled) setEventTypes(types)
      },
      (error: unknown) => {
        if (!cancelled) setErrorMessage(apiErrorMessage(error))
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Запись на звонок</h1>
        <p className="text-muted-foreground">Выберите Тип события — и подходящее время.</p>
      </header>

      <section aria-label="Типы событий" className="flex flex-col gap-4">
        {errorMessage !== null ? (
          <div role="alert" className="text-sm text-destructive">
            {errorMessage}
          </div>
        ) : eventTypes === null ? (
          <p className="text-sm text-muted-foreground">Загружаем доступные типы…</p>
        ) : eventTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет доступных типов</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {eventTypes.map((eventType) => (
              <li key={eventType.id}>
                <Link
                  to={`/book/${eventType.id}`}
                  className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        {eventType.name}
                        <Badge variant="secondary">{eventType.duration} мин</Badge>
                      </CardTitle>
                      {eventType.description !== null && (
                        <CardDescription>{eventType.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button asChild variant="outline">
        <Link to="/">На главную</Link>
      </Button>
    </main>
  )
}
