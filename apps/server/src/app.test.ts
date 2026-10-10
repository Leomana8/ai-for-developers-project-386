import type { Server } from 'node:http'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createApp } from './app.js'

type RunningServer = { server: Server; baseUrl: string }

function listenOnRandomPort(app = createApp()): Promise<RunningServer> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0)
    server.once('listening', () => {
      const address = server.address()
      if (typeof address !== 'object' || address === null) {
        reject(new Error('Server did not report an address'))
        return
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` })
    })
  })
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
}

let server: Server
let baseUrl: string

beforeAll(async () => {
  ;({ server, baseUrl } = await listenOnRandomPort())
})

afterAll(async () => {
  await closeServer(server)
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

it('POST /api/event-types with a duration not a multiple of 15 responds 422 with fields', async () => {
  const response = await fetch(`${baseUrl}/api/event-types`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Созвон', duration: 40 }),
  })
  expect(response.status).toBe(422)
  const payload = await response.json()
  expect(payload.error.code).toBe('validation_error')
  expect(Object.keys(payload.error.fields)).toContain('duration')
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

describe('createApp({ seed: true })', () => {
  let seeded: RunningServer

  beforeAll(async () => {
    seeded = await listenOnRandomPort(createApp({ seed: true }))
  })

  afterAll(async () => {
    await closeServer(seeded.server)
  })

  it('GET /api/event-types returns seeded event types with durations 15/30/60', async () => {
    const response = await fetch(`${seeded.baseUrl}/api/event-types`)
    expect(response.status).toBe(200)
    const eventTypes = (await response.json()) as Array<{ id: string; duration: number }>
    expect(eventTypes).toHaveLength(3)
    expect(eventTypes.map((t) => t.duration).sort((a, b) => a - b)).toEqual([15, 30, 60])
    for (const eventType of eventTypes) {
      expect(eventType.id).toEqual(expect.any(String))
    }
  })

  it('keeps created event types for the same app instance; description is optional', async () => {
    const create = await fetch(`${seeded.baseUrl}/api/event-types`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Созвон', duration: 45 }),
    })
    expect(create.status).toBe(201)
    const created = await create.json()
    expect(created).toMatchObject({ name: 'Созвон', description: null, duration: 45 })

    const list = await fetch(`${seeded.baseUrl}/api/event-types`)
    const eventTypes = await list.json()
    expect(eventTypes).toHaveLength(4)
    expect(eventTypes).toEqual(expect.arrayContaining([created]))
  })
})

describe('createApp() storage isolation', () => {
  it('each app instance gets a fresh store', async () => {
    const first = await listenOnRandomPort()
    const second = await listenOnRandomPort()
    try {
      const create = await fetch(`${first.baseUrl}/api/event-types`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Созвон', duration: 30 }),
      })
      expect(create.status).toBe(201)

      const list = await fetch(`${second.baseUrl}/api/event-types`)
      expect(await list.json()).toEqual([])
    } finally {
      await closeServer(first.server)
      await closeServer(second.server)
    }
  })
})
