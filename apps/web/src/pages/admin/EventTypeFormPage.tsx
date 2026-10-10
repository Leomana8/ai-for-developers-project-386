import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ApiError, apiErrorMessage, createEventType } from '@/lib/api'

// /admin/event-types/new — создание Типа события «от имени Владельца».
// Клиент валидирует подсказкой; сервер — 422 со списком полей (docs/spec.md §5).
export function EventTypeFormPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Клиентская валидация зеркалит правила сервера: name ≤100,
  // duration — целое, кратно 15, от 15 до 90.
  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (name.trim() === '') errors.name = 'Укажите название'
    if (name.trim().length > 100) errors.name = 'Название не длиннее 100 символов'

    const durationValue = Number(duration)
    if (duration.trim() === '' || !Number.isInteger(durationValue)) {
      errors.duration = 'Укажите длительность в минутах'
    } else if (durationValue % 15 !== 0 || durationValue < 15 || durationValue > 90) {
      errors.duration = 'Длительность — кратна 15, от 15 до 90 минут'
    }

    return errors
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setErrorMessage(null)

    try {
      await createEventType({
        name: name.trim(),
        description: description.trim() === '' ? null : description.trim(),
        duration: Number(duration),
      })
      navigate('/admin/meetings')
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'validation_error') {
        setFieldErrors(error.fields)
      } else {
        setErrorMessage(apiErrorMessage(error))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Новый Тип события</h1>
        <p className="text-muted-foreground">
          Шаблон звонка, на который смогут записываться Гости.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Field data-invalid={fieldErrors.name !== undefined}>
          <FieldLabel htmlFor="event-type-name">Название</FieldLabel>
          <Input
            id="event-type-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
          />
          {fieldErrors.name !== undefined && (
            <FieldError errors={[{ message: fieldErrors.name }]} />
          )}
        </Field>

        <Field data-invalid={fieldErrors.description !== undefined}>
          <FieldLabel htmlFor="event-type-description">Описание</FieldLabel>
          <Input
            id="event-type-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />
          {fieldErrors.description !== undefined && (
            <FieldError errors={[{ message: fieldErrors.description }]} />
          )}
        </Field>

        <Field data-invalid={fieldErrors.duration !== undefined}>
          <FieldLabel htmlFor="event-type-duration">Длительность (минуты)</FieldLabel>
          <Input
            id="event-type-duration"
            name="duration"
            type="number"
            inputMode="numeric"
            step={15}
            min={15}
            max={90}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            required
          />
          {fieldErrors.duration !== undefined && (
            <FieldError errors={[{ message: fieldErrors.duration }]} />
          )}
        </Field>

        {errorMessage !== null && (
          <div role="alert" className="text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Создаём…' : 'Создать Тип события'}
        </Button>
      </form>

      <div>
        <Link to="/admin/meetings" className="text-sm underline-offset-4 hover:underline">
          К предстоящим Встречам
        </Link>
      </div>
    </main>
  )
}
