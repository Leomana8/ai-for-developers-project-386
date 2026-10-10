import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function BookingPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="font-heading text-3xl font-semibold">Выбор слота</h1>
      <p className="text-muted-foreground">
        Здесь появится календарь со свободными слотами. Скоро.
      </p>
      <Button asChild variant="outline">
        <Link to="/">На главную</Link>
      </Button>
    </main>
  )
}
