import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiErrorMessage, getEventTypes } from '@/lib/api'
import type { components } from '@/api/schema'

type EventType = components['schemas']['EventType']

const steps = [
  {
    title: 'Владелец открывает время',
    description: 'Свободные Слоты публикуются в календаре — видно, что доступно.',
  },
  {
    title: 'Гость выбирает Слот',
    description: 'Один клик по подходящему времени — и Слот ваш.',
  },
  {
    title: 'Встреча назначена',
    description: 'Остаётся только позвонить: ничего уточнять не нужно.',
  },
]

export function HomePage() {
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
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col items-start gap-4">
        <Badge variant="secondary">Запись без авторизации</Badge>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Звонок без переписки и согласований
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Свободное время видно сразу: выберите Слот и запишитесь на звонок в пару кликов.
        </p>
        <Button asChild size="lg">
          <Link to="/book">Записаться</Link>
        </Button>
      </header>

      <section className="flex flex-col gap-6" aria-labelledby="available-now">
        <h2 id="available-now" className="font-heading text-2xl font-semibold">
          Что доступно прямо сейчас
        </h2>
        {errorMessage !== null ? (
          <div role="alert" className="text-sm text-destructive">
            {errorMessage}
          </div>
        ) : eventTypes === null ? (
          <p className="text-sm text-muted-foreground">Загружаем доступные типы…</p>
        ) : eventTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет доступных типов</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {eventTypes.map((eventType) => (
              <li key={eventType.id}>
                <Link
                  to={`/book/${eventType.id}`}
                  className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Card className="h-full transition-colors hover:bg-muted/50">
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

      <section className="flex flex-col gap-6" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="font-heading text-2xl font-semibold">
          Как это работает
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <span className="text-muted-foreground">{index + 1}. </span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.description}</CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
        Календарь звонков — учебный проект.
      </footer>
    </div>
  )
}
