import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import { installApiMock, resetApiMock } from './mockApi'

// Stub fetch/Request ставится до загрузки тестовых файлов: клиент openapi-fetch
// (@/lib/api) захватывает глобальные fetch/Request при создании.
installApiMock()

afterEach(() => {
  cleanup()
  resetApiMock()
})
