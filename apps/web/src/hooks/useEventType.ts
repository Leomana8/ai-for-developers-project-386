import { useEffect, useState } from 'react'

import type { components } from '@/api/schema'
import { apiErrorMessage, getEventTypes } from '@/lib/api'

type EventType = components['schemas']['EventType']

// Загрузка Типа события для экранов гостевого потока: список типов с поиском
// по id. Состояние — status-union вместо сигнальных литералов в useState:
// четыре состояния читаются поимённо, а добавление нового не ломает ветвление.
export type EventTypeState =
  | { status: 'loading' }
  | { status: 'ready'; eventType: EventType }
  | { status: 'missing' }
  | { status: 'failed'; message: string }

export function useEventType(id: string | undefined): EventTypeState {
  const [loaded, setLoaded] = useState<(EventTypeState & { id: string }) | null>(null)

  useEffect(() => {
    if (id === undefined) return
    let cancelled = false
    getEventTypes().then(
      (types) => {
        if (cancelled) return
        const found = types.find((type) => type.id === id)
        setLoaded(
          found === undefined
            ? { id, status: 'missing' }
            : { id, status: 'ready', eventType: found },
        )
      },
      (error: unknown) => {
        if (cancelled) return
        setLoaded({ id, status: 'failed', message: apiErrorMessage(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id])

  // Данные протухают сразу со сменой id — до ответа показываем загрузку.
  // Сброс делается в рендере, а не в эффекте: setState внутри эффекта — это
  // лишний каскадный рендер (react(set-state-in-effect)).
  if (id === undefined || loaded === null || loaded.id !== id) return { status: 'loading' }
  return loaded
}
