import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: { GET: vi.fn() },
  getEventTypes: vi.fn(),
  createEventType: vi.fn(),
  getSlots: vi.fn(),
  createMeeting: vi.fn(),
  getMeetings: vi.fn(),
  apiErrorMessage: vi.fn(() => 'Записаться сейчас нельзя, попробуйте позже'),
  ApiError: class ApiError extends Error {
    code: string
    fields: Record<string, string>
    constructor(envelope: {
      error: { code: string; message: string; fields: Record<string, string> }
    }) {
      super(envelope.error.message)
      this.code = envelope.error.code
      this.fields = envelope.error.fields
    }
  },
  API_UNAVAILABLE_MESSAGE: 'Записаться сейчас нельзя, попробуйте позже',
}))

import { apiErrorMessage, getSlots } from '@/lib/api'
import { formatDayLabel } from '@/lib/datetime'
import { SlotPickerPage } from '@/pages/booking/SlotPickerPage'

const getSlotsMock = vi.mocked(getSlots)
const apiErrorMessageMock = vi.mocked(apiErrorMessage)

// Локальные даты окна (offset от сегодня), чтобы не зависеть от часового пояса.
function dayIso(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

beforeEach(() => {
  getSlotsMock.mockReset()
  apiErrorMessageMock.mockClear()
})

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
  it('по умолчанию показывает первый день окна; занятые Слоты отключены', async () => {
    const today = dayIso(0)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: dayIso(13) },
      days: [
        {
          date: today,
          slots: [
            { start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false },
            { start: `${today}T09:15:00`, end: `${today}T09:30:00`, available: true },
          ],
        },
      ],
    })
    renderPicker()

    const busy = await screen.findByRole('button', { name: '09:00' })
    expect(busy).toBeDisabled()
    expect(screen.getByRole('button', { name: '09:15' })).toBeEnabled()
  })

  it('на дне видно число свободных Слотов', async () => {
    const today = dayIso(0)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: dayIso(13) },
      days: [
        {
          date: today,
          slots: [
            { start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false },
            { start: `${today}T09:15:00`, end: `${today}T09:30:00`, available: true },
            { start: `${today}T09:30:00`, end: `${today}T09:45:00`, available: true },
          ],
        },
      ],
    })
    renderPicker()

    // Имя дня — из aria-label; число свободных Слотов видно в тексте кнопки.
    const todayButton = await screen.findByRole('button', { name: formatDayLabel(today) })
    expect(todayButton.textContent).toContain('·2')
  })

  it('день без свободных Слотов → «На этот день нет свободных слотов»', async () => {
    const today = dayIso(0)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: dayIso(13) },
      days: [
        {
          date: today,
          slots: [{ start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: false }],
        },
      ],
    })
    renderPicker()

    expect(await screen.findByText('На этот день нет свободных слотов')).toBeInTheDocument()
  })

  it('смена дня обновляет URL и показывает его Слоты, сбрасывая выбор', async () => {
    const today = dayIso(0)
    const tomorrow = dayIso(1)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: dayIso(13) },
      days: [
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
      ],
    })
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
    getSlotsMock.mockRejectedValue(new TypeError('fetch failed'))
    renderPicker()

    expect(
      await screen.findByText('Записаться сейчас нельзя, попробуйте позже'),
    ).toBeInTheDocument()
  })

  it('показывает окно записи в заголовке дня', async () => {
    const today = dayIso(0)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: today, to: dayIso(13) },
      days: [
        {
          date: today,
          slots: [{ start: `${today}T09:00:00`, end: `${today}T09:15:00`, available: true }],
        },
      ],
    })
    renderPicker()

    expect(await screen.findByRole('heading', { name: formatDayLabel(today) })).toBeInTheDocument()
  })

  it('день из URL ?date= выбирается сразу', async () => {
    const tomorrow = dayIso(1)
    getSlotsMock.mockResolvedValue({
      eventTypeId: 'e1',
      window: { from: dayIso(0), to: dayIso(13) },
      days: [
        {
          date: tomorrow,
          slots: [{ start: `${tomorrow}T10:00:00`, end: `${tomorrow}T10:15:00`, available: true }],
        },
      ],
    })
    renderPicker(`/book/e1?date=${tomorrow}`)

    expect(await screen.findByRole('button', { name: '10:00' })).toBeInTheDocument()
  })
})
