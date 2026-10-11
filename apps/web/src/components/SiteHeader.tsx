import { Link } from 'react-router-dom'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Section = 'book' | 'admin'

// Сквозной хедер вкладок (docs/spec.md §7): активная вкладка — текущая секция
// и не является ссылкой; неактивная ведёт в соседнюю секцию (/book или /admin).
export function SiteHeader({ section }: { section: Section }) {
  function tab(value: Section, label: string, to: string) {
    return value === section ? (
      <TabsTrigger value={value}>{label}</TabsTrigger>
    ) : (
      <TabsTrigger value={value} asChild>
        <Link to={to}>{label}</Link>
      </TabsTrigger>
    )
  }

  return (
    <Tabs value={section}>
      <TabsList>
        {tab('book', 'Запись', '/book')}
        {tab('admin', 'Админка', '/admin')}
      </TabsList>
    </Tabs>
  )
}
