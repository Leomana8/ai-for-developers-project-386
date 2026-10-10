import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Конфиг Vitest вынесен из vite.config.ts: vitest поставляет собственный `vite`,
// чьи типы конфликтуют с плагинами проекта на `vite` 8 (rolldown).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
