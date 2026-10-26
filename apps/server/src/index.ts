import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3001)

const app = createApp({ seed: true })

app.listen(port, (error?: Error) => {
  if (error) {
    console.error(`Failed to listen on port ${port}:`, error)
    process.exitCode = 1
    return
  }
  console.log(`Server is listening on http://localhost:${port}`)
})
