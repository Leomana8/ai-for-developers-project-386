import type { components } from './api/schema.js'

type Availability = components['schemas']['Availability']
type Day = components['schemas']['Day']
type Meeting = components['schemas']['Meeting']
type Slot = components['schemas']['Slot']

// Константы сервера по спеке (docs/spec.md §5): Владелец их не задаёт.
export const GRID_MINUTES = 15
export const WORK_DAY_START_MINUTES = 9 * 60
export const WORK_DAY_END_MINUTES = 18 * 60
export const BOOKING_WINDOW_DAYS = 14

// Время в спеке — ISO 8601 без часового пояса в серверной зоне (docs/spec.md §6).
export function formatIso(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

function formatDate(date: Date): string {
  return formatIso(date).slice(0, 10)
}

function startOfDay(date: Date): Date {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

function addDays(day: Date, days: number): Date {
  const shifted = new Date(day)
  shifted.setDate(shifted.getDate() + days)
  return shifted
}

function atMinutes(day: Date, minutes: number): Date {
  const date = new Date(day)
  date.setHours(0, minutes, 0, 0)
  return date
}

// Занят ли интервал какой-нибудь Встречей: интервалы пересекаются, если начало
// одного раньше конца другого и наоборот. Занятость общая для всех Типов событий.
export function isOccupied(meetings: Meeting[], start: Date, end: Date): boolean {
  return meetings.some((m) => new Date(m.start) < end && new Date(m.end) > start)
}

// Является ли момент отметкой единой сетки (шаг 15 минут).
export function isGridMark(date: Date): boolean {
  return date.getSeconds() === 0 && date.getMinutes() % GRID_MINUTES === 0
}

// Пригоден ли момент для старта брони по спеке §5: окно записи
// [сегодня … сегодня+13] целиком, рабочее окно дня, будущие Слоты.
// Возвращает код контрактной ошибки 422 или null, если время подходит.
export function bookingStartError(
  start: Date,
  durationMinutes: number,
  now: Date,
): 'out_of_window' | null {
  const today = startOfDay(now)
  const day = startOfDay(start)
  if (day < today || day > addDays(today, BOOKING_WINDOW_DAYS - 1)) return 'out_of_window'

  const startMinutes = start.getHours() * 60 + start.getMinutes()
  if (
    startMinutes < WORK_DAY_START_MINUTES ||
    startMinutes + durationMinutes > WORK_DAY_END_MINUTES
  ) {
    return 'out_of_window'
  }

  // Прошедшие часы сегодняшнего дня недоступны: старт должен быть в будущем.
  if (start.getTime() <= now.getTime()) return 'out_of_window'

  return null
}

// Доступность по спеке §5: окно записи [сегодня … сегодня+13], единая сетка
// 15 минут, рабочее окно дня 09:00–18:00. Слот занимает duration/15 ячеек и
// не предлагается, если выходит за конец рабочего окна. Занятость общая для
// всех Типов событий; прошедшие часы сегодняшнего дня недоступны.
export function availability(
  eventTypeId: string,
  durationMinutes: number,
  meetings: Meeting[],
  now = new Date(),
): Availability {
  const today = startOfDay(now)
  const days: Day[] = []

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const day = addDays(today, offset)
    const slots: Slot[] = []

    for (
      let startMinutes = WORK_DAY_START_MINUTES;
      startMinutes + durationMinutes <= WORK_DAY_END_MINUTES;
      startMinutes += GRID_MINUTES
    ) {
      const start = atMinutes(day, startMinutes)
      const end = atMinutes(day, startMinutes + durationMinutes)
      const available = start.getTime() > now.getTime() && !isOccupied(meetings, start, end)
      slots.push({ start: formatIso(start), end: formatIso(end), available })
    }

    days.push({ date: formatDate(day), slots })
  }

  return {
    eventTypeId,
    window: { from: formatDate(today), to: formatDate(addDays(today, BOOKING_WINDOW_DAYS - 1)) },
    days,
  }
}
