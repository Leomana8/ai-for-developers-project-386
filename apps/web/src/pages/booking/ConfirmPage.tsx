import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { SiteHeader } from '@/components/SiteHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useEventType } from '@/hooks/useEventType'
import { ApiError, apiErrorMessage, createMeeting } from '@/lib/api'
import { formatDayTime, isValidDateTime } from '@/lib/datetime'
import { isValidEmail } from '@/lib/validation'

// Отдельного статуса «ошибка» нет: любой сбой уже показан через slotStatus,
// fieldErrors или errorMessage, и четвёртое состояние было бы мёртвым.
type Submission = 'idle' | 'submitting'

// Слот был предложен календарём, но к моменту отправки занят (409 slot_taken)
// или уже вне окна (422 out_of_window). Текст алерта по §7 у обоих один.
type SlotStatus = 'none' | 'taken' | 'expired'

// /book/:eventTypeId/confirm?start= — подтверждение Записи: имя и email Гостя.
export function ConfirmPage() {
  const { eventTypeId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const eventTypeState = useEventType(eventTypeId)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submission, setSubmission] = useState<Submission>('idle')
  const [slotStatus, setSlotStatus] = useState<SlotStatus>('none')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const start = searchParams.get('start')

  // Клиентская валидация зеркалит правила сервера; тексты — канон §5 «Запись».
  // Формат email берём из lib/validation, а не из своего regex: подсказка
  // обязана отвергать ровно то же, что и `@format("email")` валидатора.
  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    const name = guestName.trim()
    const email = guestEmail.trim()
    if (name === '') errors.guestName = 'Укажите имя'
    else if (name.length > 100) errors.guestName = 'Имя не длиннее 100 символов'
    if (email === '') errors.guestEmail = 'Укажите email'
    else if (email.length > 254) errors.guestEmail = 'Email не длиннее 254 символов'
    else if (!isValidEmail(email)) errors.guestEmail = 'Похоже, в email ошибка'
    return errors
  }

  // Невалидный start= из URL — как его отсутствие: format() date-fns бросает
  // RangeError на Invalid Date, и без этой проверки падает всё приложение.
  if (!eventTypeId || start === null || !isValidDateTime(start)) {
    return <Navigate to="/book" replace />
  }

  // Возврат в календарь — на день выбранного Слота, без потери контекста (§4 п. 22).
  const backToSlots = `/book/${eventTypeId}?date=${encodeURIComponent(start.slice(0, 10))}`

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submission === 'submitting' || !eventTypeId || start === null) return

    setSlotStatus('none')
    setFieldErrors({})
    setErrorMessage(null)

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmission('submitting')

    try {
      const meeting = await createMeeting({
        eventTypeId,
        start,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      })
      navigate('/book/success', { state: { meeting } })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'slot_taken') {
        // 409 — гонка за Слот.
        setSlotStatus('taken')
      } else if (error instanceof ApiError && error.code === 'out_of_window') {
        // 422 out_of_window — Слот был предложен календарём, но к моменту
        // отправки его время прошло (§8).
        setSlotStatus('expired')
      } else if (error instanceof ApiError && error.code === 'validation_error') {
        setFieldErrors(error.fields)
      } else {
        setErrorMessage(apiErrorMessage(error))
      }
      setSubmission('idle')
    }
  }

  const submitting = submission === 'submitting'
  const eventType = eventTypeState.status === 'ready' ? eventTypeState.eventType : null

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-6 py-16">
      <SiteHeader section="book" />
      <header className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Шаг 2 из 2
        </Badge>
        <h1 className="font-heading text-3xl font-semibold">Подтвердите Запись</h1>
        {eventType !== null && (
          <p className="text-muted-foreground">
            {eventType.name}, {eventType.duration} мин — {formatDayTime(start)}
          </p>
        )}
      </header>

      {eventTypeState.status === 'loading' ? (
        <p className="text-sm text-muted-foreground">Загружаем тип события…</p>
      ) : eventTypeState.status === 'missing' ? (
        <div role="alert" className="flex flex-col gap-3 text-sm">
          <p className="text-destructive">Тип события не найден</p>
          <Button asChild variant="outline" className="w-fit">
            <Link to="/book">К списку типов</Link>
          </Button>
        </div>
      ) : eventTypeState.status === 'failed' ? (
        <div role="alert" className="text-sm text-destructive">
          {eventTypeState.message}
        </div>
      ) : slotStatus !== 'none' ? (
        <Alert role="alert">
          <AlertTitle>Слот больше недоступен</AlertTitle>
          <Button className="w-fit" onClick={() => navigate(backToSlots, { replace: true })}>
            Выбрать другой слот
          </Button>
        </Alert>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <Field data-invalid={fieldErrors.guestName !== undefined}>
            <FieldLabel htmlFor="guest-name">Имя</FieldLabel>
            <Input
              id="guest-name"
              name="guestName"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              autoComplete="name"
              required
            />
            {fieldErrors.guestName !== undefined && (
              <FieldError errors={[{ message: fieldErrors.guestName }]} />
            )}
          </Field>

          <Field data-invalid={fieldErrors.guestEmail !== undefined}>
            <FieldLabel htmlFor="guest-email">Email</FieldLabel>
            <Input
              id="guest-email"
              name="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              autoComplete="email"
              required
            />
            {fieldErrors.guestEmail !== undefined && (
              <FieldError errors={[{ message: fieldErrors.guestEmail }]} />
            )}
          </Field>

          {fieldErrors.start !== undefined && (
            <div role="alert" className="text-sm text-destructive">
              {fieldErrors.start}
            </div>
          )}
          {errorMessage !== null && (
            <div role="alert" className="text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Записываем…' : 'Записаться'}
          </Button>
        </form>
      )}

      <Button asChild variant="outline">
        <Link to={backToSlots}>Назад к слотам</Link>
      </Button>
    </main>
  )
}
