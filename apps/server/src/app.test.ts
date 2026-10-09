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
