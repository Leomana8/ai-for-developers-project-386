import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3001)

const app = createApp({ seed: true })

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`)
})
