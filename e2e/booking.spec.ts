import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import type { components } from '../apps/web/src/api/schema'

type EventType = components['schemas']['EventType']
type Meeting = components['schemas']['Meeting']
type Availability = components['schemas']['Availability']

test('гость записывается на звонок через настоящий API', async ({ page, request }) => {
  const name = `E2E ${randomUUID()}`
  const created = await request.post('/api/event-types', {
    data: { name, description: 'Браузерная проверка записи', duration: 30 },
  })
  expect(created.status()).toBe(201)
  const eventType: EventType = await created.json()

  const availabilityResponse = await request.get(`/api/event-types/${eventType.id}/slots`)
  expect(availabilityResponse.ok()).toBeTruthy()
  const availability: Availability = await availabilityResponse.json()
  // Берём будущий день из серверного окна: сегодняшний слот может уже пройти.
  const day = availability.days.find(
    (candidate) =>
      candidate.date > availability.window.from && candidate.slots.some((slot) => slot.available),
  )
  if (!day) throw new Error('API не предложил свободный будущий день')
  const slot = day.slots.find((candidate) => candidate.available)
  if (!slot) throw new Error('API не предложил свободный слот')
  const date = new Date(`${day.date}T12:00:00Z`)
  const dayLabel = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date)

  await page.goto('/book')
  await page.getByRole('link', { name: new RegExp(name) }).click()
  await expect(page.getByRole('heading', { name: 'Выберите Слот' })).toBeVisible()
  // Если выбранный день в следующем месяце, перелистываем сам календарь.
  if (day.date.slice(0, 7) !== availability.window.from.slice(0, 7)) {
    await page.getByRole('button', { name: /next month/i }).click()
  }
  await page.getByRole('button', { name: dayLabel, exact: true }).click()
  await page.getByRole('button', { name: slot.start.slice(11, 16), exact: true }).click()
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Подтвердите Запись' })).toBeVisible()
  await page.getByLabel('Имя', { exact: true }).fill('Иван Петров')
  await page.getByLabel('Email', { exact: true }).fill('booking-e2e@example.com')
  await page.getByRole('button', { name: 'Записаться', exact: true }).click()

  await expect(page).toHaveURL('/book/success')
  await expect(page.getByRole('heading', { name: 'Вы записаны!' })).toBeVisible()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await expect(page.getByText('Иван Петров (booking-e2e@example.com)')).toBeVisible()
  await expect(page.getByText(`Когда: ${dayLabel}, ${slot.start.slice(11, 16)}`)).toBeVisible()

  const meetingsResponse = await request.get('/api/meetings')
  expect(meetingsResponse.ok()).toBeTruthy()
  const meetings: Meeting[] = await meetingsResponse.json()
  expect(meetings.filter((meeting) => meeting.eventTypeId === eventType.id)).toEqual([
    expect.objectContaining({
      eventTypeId: eventType.id,
      eventTypeName: name,
      start: slot.start,
      end: slot.end,
      guestName: 'Иван Петров',
      guestEmail: 'booking-e2e@example.com',
    }),
  ])
})
