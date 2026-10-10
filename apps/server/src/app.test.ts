import type { Server } from 'node:http'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createApp } from './app.js'

let server: Server
let baseUrl: string

beforeAll(async () => {
  server = createApp().listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  if (typeof address === 'object' && address !== null) {
    baseUrl = `http://127.0.0.1:${address.port}`
  }
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  )
})

it('smoke: app starts and /api/health responds 200', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok' })
})

it('GET /api/event-types returns an empty list', async () => {
  const response = await fetch(`${baseUrl}/api/event-types`)
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual([])
})

it('POST /api/event-types returns 201 with the created event type', async () => {
  const response = await fetch(`${baseUrl}/api/event-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Созвон', description: null, duration: 30 }),
  })
  expect(response.status).toBe(201)
  const created = await response.json()
  expect(created).toMatchObject({ name: 'Созвон', description: null, duration: 30 })
  expect(typeof created.id).toBe('string')
})

it('POST /api/event-types with an invalid body responds 422 with an error envelope', async () => {
  const response = await fetch(`${baseUrl}/api/event-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '', duration: 200 }),
  })
  expect(response.status).toBe(422)
  const payload = await response.json()
  expect(payload.error.code).toBe('validation_error')
  expect(typeof payload.error.message).toBe('string')
  expect(Object.keys(payload.error.fields).length).toBeGreaterThan(0)
})

it('POST /api/event-types without a body responds 422 with an error envelope', async () => {
  const response = await fetch(`${baseUrl}/api/event-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  })
  expect(response.status).toBe(422)
  const payload = await response.json()
  expect(payload.error.code).toBe('validation_error')
})

it('POST /api/event-types with malformed JSON responds 422 with an error envelope', async () => {
  const response = await fetch(`${baseUrl}/api/event-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not json',
  })
  expect(response.status).toBe(422)
  const payload = await response.json()
  expect(payload.error.code).toBe('validation_error')
})

it('GET /api/event-types/:id/slots responds 404 with an error envelope', async () => {
  const response = await fetch(
    `${baseUrl}/api/event-types/00000000-0000-0000-0000-000000000000/slots`,
  )
  expect(response.status).toBe(404)
  const payload = await response.json()
  expect(payload.error.code).toBe('not_found')
})

it('POST /api/meetings with a valid body responds 404 with an error envelope', async () => {
  const response = await fetch(`${baseUrl}/api/meetings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      eventTypeId: '00000000-0000-0000-0000-000000000000',
      start: '2026-10-10T09:00:00',
      guestName: 'Гость',
      guestEmail: 'guest@example.com',
    }),
  })
  expect(response.status).toBe(404)
  const payload = await response.json()
  expect(payload.error.code).toBe('not_found')
})

it('POST /api/meetings with an invalid email responds 422 with an error envelope', async () => {
  const response = await fetch(`${baseUrl}/api/meetings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      eventTypeId: '00000000-0000-0000-0000-000000000000',
      start: '2026-10-10T09:00:00',
      guestName: 'Гость',
      guestEmail: 'not-an-email',
    }),
  })
  expect(response.status).toBe(422)
  const payload = await response.json()
  expect(payload.error.code).toBe('validation_error')
})

it('GET /api/no-such-route responds 404 with an error envelope', async () => {
  const response = await fetch(`${baseUrl}/api/no-such-route`)
  expect(response.status).toBe(404)
  const payload = await response.json()
  expect(payload.error.code).toBe('not_found')
})
