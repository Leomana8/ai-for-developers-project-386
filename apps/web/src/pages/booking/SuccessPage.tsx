import { Link, useLocation } from 'react-router-dom'

import { SiteHeader } from '@/components/SiteHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDayTime } from '@/lib/datetime'
import type { components } from '@/api/schema'

type Meeting = components['schemas']['Meeting']

// /book/success — успех Записи. Данные Встречи приходят в router state;
// при прямом заходе показываем общее сообщение с повторной записью.
export function SuccessPage() {
  const location = useLocation()
  const meeting = (location.state as { meeting?: Meeting } | null)?.meeting

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-start justify-center gap-6 px-6 py-16">
      <SiteHeader section="book" />
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Вы записаны!</h1>
        <p className="text-muted-foreground">
          {meeting === undefined
            ? 'Запись оформлена. Подтверждение придёт на email.'
            : 'Подтверждение придёт на email.'}
        </p>
      </header>

      {meeting !== undefined && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{meeting.eventTypeName}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Когда: </span>
              {formatDayTime(meeting.start)}
            </p>
            <p>
              <span className="text-muted-foreground">Гость: </span>
              {meeting.guestName} ({meeting.guestEmail})
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link to="/book">Записаться ещё</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">На главную</Link>
        </Button>
      </div>
    </main>
  )
}
