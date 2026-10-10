import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  {
    title: 'Открываем время',
    description: 'Владелец календаря публикует свободные слоты времени.',
  },
  {
    title: 'Выбираете слот',
    description: 'Одно нажатие — и время за вами.',
  },
  {
    title: 'Встреча забронирована',
    description: 'Больше ничего не нужно уточнять и согласовывать.',
  },
]

export function HomePage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col items-start gap-4">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Звонок без переписки и согласований
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Свободное время как на ладони: выбирайте слот и бронируйте в один клик.
        </p>
        <Button asChild size="lg">
          <Link to="/book">Записаться на звонок</Link>
        </Button>
      </header>

      <section className="flex flex-col gap-6" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="font-heading text-2xl font-semibold">
          Как это работает
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <span className="text-muted-foreground">{index + 1}. </span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.description}</CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto border-t pt-6 text-sm text-muted-foreground">
        Календарь звонков — учебный проект.
      </footer>
    </div>
  )
}
