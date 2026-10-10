import createClient from 'openapi-fetch'

import type { paths } from '@/api/schema'

// База URL по умолчанию пустая → запросы идут относительными путями /api/*,
// которые проксирует Vite (см. vite.config.ts). Абсолютные URL не используем.
export const api = createClient<paths>()
