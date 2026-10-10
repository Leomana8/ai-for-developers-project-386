import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

import { ConfirmPage } from '@/pages/booking/ConfirmPage'
import { EventTypesPage } from '@/pages/booking/EventTypesPage'
import { SlotPickerPage } from '@/pages/booking/SlotPickerPage'
import { SuccessPage } from '@/pages/booking/SuccessPage'
import { HealthPage } from '@/pages/HealthPage'
import { HomePage } from '@/pages/HomePage'

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/book', element: <EventTypesPage /> },
  // /book/success — статичный путь выше динамического /book/:eventTypeId
  { path: '/book/success', element: <SuccessPage /> },
  { path: '/book/:eventTypeId', element: <SlotPickerPage /> },
  { path: '/book/:eventTypeId/confirm', element: <ConfirmPage /> },
  { path: '/health', element: <HealthPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]
