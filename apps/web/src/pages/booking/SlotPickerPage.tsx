import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { SiteHeader } from '@/components/SiteHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { apiErrorMessage, getEventTypes, getSlots } from '@/lib/api'
import { formatDayLabel, formatTimeOfDay, isoDay, parseIsoDay } from '@/lib/datetime'
import type { components } from '@/api/schema'

type Availability = components['schemas']['Availability']
type EventType = components['schemas']['EventType']

// /book/:eventTypeId?date= — календарь окна записи и выбор Слота.
// Состояние дня живёт в URL; выбранный Слот сбрасывается при смене дня.
export function SlotPickerPage() {
  const { eventTypeId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [availability, setAvailability] = useState<Availability | null>(null)
  const [eventType, setEventType] = useState<EventType | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  useEffect(() => {
    if (!eventTypeId) return
    let cancelled = false
    getSlots(eventTypeId).then(
      (result) => {
        if (!cancelled) setAvailability(result)
      },
      (error: unknown) => {
        if (!cancelled) setErrorMessage(apiErrorMessage(error))
      },
    )
    return () => {
      cancelled = true
    }
  }, [eventTypeId])

  // Сводка типа события — списком типов с поиском по id (как на подтверждении);
  // при сбое сводку просто не показываем, сетка Слотов ни на что не влияет.
  useEffect(() => {
    if (!eventTypeId) return
    let cancelled = false
    getEventTypes().then(
      (types) => {
        if (!cancelled) setEventType(types.find((type) => type.id === eventTypeId) ?? null)
      },
      () => {
        if (!cancelled) setEventType(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [eventTypeId])

  // Число свободных Слотов на каждом дне календаря (хук — до ранних return).
  const freeCountByDay = useMemo(() => {
    const counts = new Map<string, number>()
    for (const day of availability?.days ?? []) {
      counts.set(day.date, day.slots.filter((slot) => slot.available).length)
    }
    return counts
  }, [availability])

  if (!eventTypeId) return <Navigate to="/book" replace />

  const bookingWindow = availability?.window
  const selectedIso = searchParams.get('date') ?? bookingWindow?.from
  const selectedDay = availability?.days.find((day) => day.date === selectedIso)

  function selectDate(day: Date | undefined) {
    if (day === undefined) return
    setSelectedSlot(null)
    setSearchParams({ date: isoDay(day) }, { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-6 py-16">
      <SiteHeader section="book" />
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Шаг 1 из 2
        </Badge>
        <h1 className="font-heading text-3xl font-semibold">Выберите Слот</h1>
        {eventType !== null && (
          <p className="text-muted-foreground">
            {eventType.name}, {eventType.duration} мин
          </p>
        )}
      </header>

      {errorMessage !== null ? (
        <div role="alert" className="text-sm text-destructive">
          {errorMessage}
        </div>
      ) : availability === null || bookingWindow === undefined ? (
        <p className="text-sm text-muted-foreground">Загружаем свободное время…</p>
      ) : (
        <>
          <Calendar
            mode="single"
            selected={selectedIso !== undefined ? parseIsoDay(selectedIso) : undefined}
            onSelect={selectDate}
            disabled={[
              { before: parseIsoDay(bookingWindow.from) },
              { after: parseIsoDay(bookingWindow.to) },
            ]}
            startMonth={parseIsoDay(bookingWindow.from)}
            endMonth={parseIsoDay(bookingWindow.to)}
            showOutsideDays={false}
            components={{
              DayButton: ({ day, ...dayButtonProps }) => {
                const count = freeCountByDay.get(isoDay(day.date)) ?? 0
                return (
                  <CalendarDayButton
                    {...dayButtonProps}
                    day={day}
                    aria-label={formatDayLabel(isoDay(day.date))}
                  >
                    {dayButtonProps.children}
                    {/* Число свободных Слотов на каждом дне, включая 0 (§4 п. 11) */}
                    <span className="tabular-nums">·{count}</span>
                  </CalendarDayButton>
                )
              },
            }}
          />

          {selectedDay !== undefined && (
            <section
              aria-label={`Слоты на ${formatDayLabel(selectedDay.date)}`}
              className="flex flex-col gap-3"
            >
              <h2 className="text-lg font-semibold">{formatDayLabel(selectedDay.date)}</h2>
              {selectedDay.slots.every((slot) => !slot.available) ? (
                <p className="text-sm text-muted-foreground">На этот день нет свободных слотов</p>
              ) : (
                <div className="flex flex-wrap gap-2" role="group">
                  {selectedDay.slots.map((slot) => (
                    <Button
                      key={slot.start}
                      variant={selectedSlot === slot.start ? 'default' : 'outline'}
                      disabled={!slot.available}
                      aria-pressed={selectedSlot === slot.start}
                      onClick={() => setSelectedSlot(slot.start)}
                    >
                      {formatTimeOfDay(slot.start)}
                    </Button>
                  ))}
                </div>
              )}
            </section>
          )}

          {selectedSlot !== null && (
            <Button
              size="lg"
              onClick={() =>
                navigate(`/book/${eventTypeId}/confirm?start=${encodeURIComponent(selectedSlot)}`)
              }
            >
              Продолжить
            </Button>
          )}
        </>
      )}

      <Button asChild variant="outline">
        <Link to="/book">К списку типов</Link>
      </Button>
    </main>
  )
}
