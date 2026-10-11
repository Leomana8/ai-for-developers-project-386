import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/SiteHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ADMIN_UNAVAILABLE_MESSAGE, ApiError, apiErrorMessage, getMeetings } from '@/lib/api'
import { formatDayTime } from '@/lib/datetime'
import type { components } from '@/api/schema'

type Meeting = components['schemas']['Meeting']

// /admin/meetings — предстоящие Встречи со стороны Владельца календаря (ADR-0002:
// маршруты Админки открыты, идентификации Владельца нет).
export function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getMeetings().then(
      (result) => {
        if (!cancelled) setMeetings(result)
      },
      (error: unknown) => {
        if (!cancelled) {
          // Сетевой сбой — текст Админки; ошибки API (конверт) — общие сообщения.
          setErrorMessage(
            error instanceof ApiError ? apiErrorMessage(error) : ADMIN_UNAVAILABLE_MESSAGE,
          )
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <SiteHeader section="admin" />
      <header className="flex flex-col items-start gap-2">
        <h1 className="font-heading text-3xl font-semibold">Предстоящие Встречи</h1>
        <Button asChild>
          <Link to="/admin/event-types/new">Создать тип события</Link>
        </Button>
      </header>

      <section aria-label="Предстоящие Встречи" className="flex flex-col gap-3">
        {errorMessage !== null ? (
          <div role="alert" className="text-sm text-destructive">
            {errorMessage}
          </div>
        ) : meetings === null ? (
          <p className="text-sm text-muted-foreground">Загружаем записи…</p>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет записей</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Гость</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>тип события</TableHead>
                <TableHead>Слот</TableHead>
                <TableHead>Создано</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>{meeting.guestName}</TableCell>
                  <TableCell>{meeting.guestEmail}</TableCell>
                  <TableCell>{meeting.eventTypeName}</TableCell>
                  <TableCell>{formatDayTime(meeting.start)}</TableCell>
                  <TableCell>{formatDayTime(meeting.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <div>
        <Button asChild variant="outline">
          <Link to="/">На главную</Link>
        </Button>
      </div>
    </main>
  )
}
