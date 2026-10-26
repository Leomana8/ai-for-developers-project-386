import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 30_000,
  globalTimeout: 180_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:43173',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start',
      url: 'http://127.0.0.1:43001/api/health',
      env: { PORT: '43001', TZ: 'UTC' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -w apps/web -- --port 43173 --strictPort',
      url: 'http://127.0.0.1:43173/api/health',
      env: { PORT: '43001', TZ: 'UTC' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
