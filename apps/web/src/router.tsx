import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

import { BookingPage } from '@/pages/BookingPage'
import { HealthPage } from '@/pages/HealthPage'
import { HomePage } from '@/pages/HomePage'

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/book', element: <BookingPage /> },
  { path: '/health', element: <HealthPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]
