import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import type { components } from '@/api/schema'
import { formatDayLabel } from '@/lib/datetime'
import { SlotPickerPage } from '@/pages/booking/SlotPickerPage'
import { mockApi } from '@/test/mockApi'

type Day = components['schemas']['Availability']['days'][number]

// Локальные даты окна (offset от сегодня), чтобы не зависеть от часового пояса.
function dayIso(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Сводка типа события на календаре: по умолчанию тип найден.
beforeEach(() => {
  mockApi({
    'GET /api/event-types': () =>
      Response.json([{ id: 'e1', name: 'Консультация', description: null, duration: 30 }]),
  })
})

function mockSlots(days: Day[]) {
  mockApi({
    'GET /api/event-types/e1/slots': () =>
      Response.json({ eventTypeId: 'e1', window: { from: dayIso(0), to: dayIso(13) }, days }),
  })
}

function renderPicker(path = '/book/e1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {/* useParams работает только внутри совпавшего Route */}
      <Routes>
        <Route path="/book/:eventTypeId" element={<SlotPickerPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SlotPickerPage', () => {
  it('под заголовком видна сводка выбранного типа события', async () => {
    mockSlots([])
    renderPicker()

    expect(await screen.findByText('Консультация, 30 мин')).toBeInTheDocument()
  })

  it('по умолчанию показывает первый день окна; занятые Слоты отключены', async () => {
    const today = dayIso(0)
    mockSlots([
      {
        date: today,
        slots: [
          { start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false },
          { start: `${today}T09:15:00`, end: `${today}T09:30:00`, available: true },
        ],
      },
    ])
    renderPicker()

    const busy = await screen.findByRole('button', { name: '09:00' })
    expect(busy).toBeDisabled()
    expect(screen.getByRole('button', { name: '09:15' })).toBeEnabled()
  })

  it('на дне видно число свободных Слотов', async () => {
    const today = dayIso(0)
    mockSlots([
      {
        date: today,
        slots: [
          { start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false },
          { start: `${today}T09:15:00`, end: `${today}T09:30:00`, available: true },
          { start: `${today}T09:30:00`, end: `${today}T09:45:00`, available: true },
        ],
      },
    ])
    renderPicker()

    // Имя дня — из aria-label; число свободных Слотов видно в тексте кнопки.
    const todayButton = await screen.findByRole('button', { name: formatDayLabel(today) })
    expect(todayButton.textContent).toContain('·2')
  })

  it('день без свободных Слотов показывает число 0 (§4 п. 11)', async () => {
    const today = dayIso(0)
    mockSlots([
      {
        date: today,
        slots: [{ start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false }],
      },
    ])
    renderPicker()

    const todayButton = await screen.findByRole('button', { name: formatDayLabel(today) })
    expect(todayButton.textContent).toContain('·0')
  })

  it('день без свободных Слотов → «На этот день нет свободных слотов»', async () => {
    const today = dayIso(0)
    mockSlots([
      {
        date: today,
        slots: [{ start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false }],
      },
    ])
    renderPicker()

    expect(await screen.findByText('На этот день нет свободных слотов')).toBeInTheDocument()
  })

  it('смена дня обновляет URL и показывает его Слоты, сбрасывая выбор', async () => {
    const today = dayIso(0)
    const tomorrow = dayIso(1)
    mockSlots([
      {
        date: today,
        slots: [{ start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: true }],
      },
      {
        date: tomorrow,
        slots: [
          { start: `${tomorrow}T10:00:00`, end: `${tomorrow}T10:15:00`, available: true },
          { start: `${tomorrow}T10:15:00`, end: `${tomorrow}T10:30:00`, available: true },
        ],
      },
    ])
    renderPicker(`/book/e1?date=${today}`)

    // Сегодняшний день выбран из URL; выбираем Слот…
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }))
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeInTheDocument()

    // …затем кликаем завтрашний день: URL с date= и новые Слоты.
    fireEvent.click(screen.getByRole('button', { name: formatDayLabel(tomorrow) }))
    expect(await screen.findByRole('button', { name: '10:00' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Продолжить' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10:15' })).toBeEnabled()
  })

  it('ошибка API → понятное сообщение', async () => {
    mockApi({
      'GET /api/event-types/e1/slots': () => {
        throw new TypeError('fetch failed')
      },
    })
    renderPicker()

    expect(
      await screen.findByText('Записаться сейчас нельзя, попробуйте позже'),
    ).toBeInTheDocument()
  })

  it('показывает окно записи в заголовке дня', async () => {
    const today = dayIso(0)
    mockSlots([
      {
        date: today,
        slots: [{ start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: true }],
      },
    ])
    renderPicker()

    expect(await screen.findByRole('heading', { name: formatDayLabel(today) })).toBeInTheDocument()
  })

  it('день из URL ?date= выбирается сразу', async () => {
    const tomorrow = dayIso(1)
    mockSlots([
      {
        date: tomorrow,
        slots: [{ start: `${tomorrow}T10:00:00`, end: `${tomorrow}T10:15:00`, available: true }],
      },
    ])
    renderPicker(`/book/e1?date=${tomorrow}`)

    expect(await screen.findByRole('button', { name: '10:00' })).toBeInTheDocument()
  })

  it('календарь на русском, неделя начинается с понедельника', async () => {
    // Окно в будущем, чтобы месяц в заголовке не зависел от текущей даты.
    mockApi({
      'GET /api/event-types/e1/slots': () =>
        Response.json({
          eventTypeId: 'e1',
          window: { from: '2026-10-05', to: '2026-10-19' },
          days: [],
        }),
    })
    const { container } = renderPicker()

    // Заголовок месяца в русской локали (date-fns ru, родительный падеж).
    expect(await screen.findByText('октябрь 2026')).toBeInTheDocument()
    // Дни недели от «пн», а не от «вс»: локаль ru плюс начало недели с понедельника.
    const weekdays = [...container.querySelectorAll('thead th')].map((cell) => cell.textContent)
    expect(weekdays).toEqual(['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'])
    // aria-label навигации тоже русский, а не en-US по умолчанию.
    expect(screen.getByRole('button', { name: 'Перейти к предыдущему месяцу' })).toBeInTheDocument()
  })
})
