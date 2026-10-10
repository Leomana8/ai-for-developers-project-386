# Возможности shadcn/ui: календарь, формы, ввод

Research для wayfinder-тикета [#18](https://github.com/Leomana8/ai-for-developers-project-386/issues/18).
Дата: 2026-10-10. Все факты ниже — из первичных источников (документация shadcn/ui, JSON-реестр
shadcn, документация React DayPicker, npm registry). Где факт не подтверждён источником — это
помечено явно.

## 1. Конфигурация этого репозитория

- В `apps/web` используется CLI shadcn **v4** (`shadcn` `^4.21.4` в `apps/web/package.json`).
- Стиль в `apps/web/components.json` — **`radix-nova`** (база **Radix UI**). Поэтому:
  - страницы документации нужного варианта — `https://ui.shadcn.com/docs/components/radix/<name>`;
  - registry-item — `https://ui.shadcn.com/r/styles/radix-nova/<name>.json`.
- Алиасы: `components → @/components`, `ui → @/components/ui`, `utils → @/lib/utils`, Tailwind v4
  (`tailwind.config` пустой), `cssVariables: true`, иконки — Lucide.
- Уже установлены: `cn`, `class-variance-authority`, `radix-ui` (объединённый пакет), `lucide-react`,
  `shadcn`, `tw-animate-css`. Уже добавлены компоненты `button` и `card`.
- **Отсутствуют**: `react-day-picker`, `date-fns`, `react-hook-form`, `@hookform/resolvers`, `zod`,
  `sonner`.

## 2. Как ставить компоненты

Команда из корня репозитория (как зафиксировано в `AGENTS.md`):

```bash
npx shadcn@latest add <component> -c apps/web
```

`-c`/`--cwd` — «the working directory» ([docs: CLI](https://ui.shadcn.com/docs/cli)). Полезные
флаги того же `add`: `-y/--yes`, `-o/--overwrite`, `--dry-run` (предпросмотр без записи),
`--diff`, `--view`.

Проверено локально (`--dry-run`, ничего не записано):

```bash
npx shadcn@latest add calendar input badge alert table select label textarea -c apps/web --dry-run -y
```

Результат dry-run:

- создаёт `apps/web/src/components/ui/{input,badge,alert,table,select,label,textarea,calendar}.tsx`;
- **перезаписывает `button.tsx`** (calendar зависит от `button`, а он уже есть);
- добавляет зависимости: `cn`, `react-day-picker@latest`, `date-fns`.

> Примечание по окружению: в этой машине `npx shadcn` падал с
> `self-signed certificate in certificate chain` (корпоративный прокси). Обход — временно
> `NODE_TLS_REJECT_UNAUTHORIZED=0` или `NODE_EXTRA_CA_CERTS` с корневым сертификатом. Это
> окруженческая проблема, не свойство shadcn.

Реестр-элементы (radix-nova) и то, что они тянут. `dependencies` — npm-пакеты,
`registryDependencies` — другие элементы реестра (ставятся автоматически):

| Элемент       | `dependencies`                                  | `registryDependencies` | Комментарий                                        |
| ------------- | ----------------------------------------------- | ---------------------- | -------------------------------------------------- |
| `calendar`    | `cn`, `react-day-picker@latest`, `date-fns`     | `button`               | Обёртка над React DayPicker                         |
| `field`       | `cn`                                            | `label`, `separator`   | Семейство `Field` для форм                          |
| `input`       | `cn`                                            | —                      | Нативный `<input>`                                  |
| `textarea`    | `cn`                                            | —                      | Нативный `<textarea>`                               |
| `label`       | `cn`                                            | —                      | `radix-ui` `Label`                                  |
| `select`      | `cn`                                            | —                      | `radix-ui` `Select`                                 |
| `radio-group` | `cn`                                            | —                      | `radix-ui` `RadioGroup`                             |
| `badge`       | `cn`                                            | —                      | `radix-ui` `Slot` только для `asChild`              |
| `alert`       | `cn`                                            | —                      | без Radix                                           |
| `table`       | `cn`                                            | —                      | чистые `<table>`-обёртки                            |
| `dialog`      | `cn`                                            | `button`               | `radix-ui` `Dialog`                                 |
| `sonner`      | `sonner`, `next-themes`                         | —                      | тосты (успех/ошибка)                                |
| `form`        | —                                               | —                      | **пустой элемент: только `{name, type}`, без файлов** |

Важные выводы по зависимостям:

- Большинство элементов требует только `cn` — он уже есть. `radix-ui` тоже уже есть.
- `calendar` — единственный в этом списке, кто тянет **новые** npm-пакеты: `react-day-picker` и
  `date-fns`.
- `react-day-picker@latest` на момент research — **10.0.2**; он сам зависит от `date-fns@^4.1.0` и
  `@date-fns/tz@^1.4.1` ([npm](https://registry.npmjs.org/react-day-picker/latest)). То есть
  `date-fns` в реестре указан отдельно (нужен примерам Date Picker для `format`), но придёт и
  транзитивно. В сгенерированном `calendar.tsx` (radix-nova) импорта `date-fns` нет — использовать
  его в своём коде или нет, решаете вы.
- **Компонента `Form` больше нет.** Элемент `form` в реестре radix-nova пустой (нет файлов и
  зависимостей). shadcn теперь предлагает собирать формы из **React Hook Form** (или TanStack Form /
  Formisch) + семейства **`Field`**. Библиотеки `react-hook-form`, `@hookform/resolvers`, `zod`
  ставятся вручную (registry-item их не тянет).

## 3. Календарь и сетка

`Calendar` из shadcn — тонкая обёртка над [React DayPicker](https://daypicker.dev), все пропсы
DayPicker пробрасываются ([docs](https://ui.shadcn.com/docs/components/radix/calendar)).
Полезные для задачи возможности (по [докам DayPicker v10](https://daypicker.dev)):

**Режимы выбора (`mode`)** — `"single"` | `"multiple"` | `"range"` | `"default"`
([selection-modes](https://daypicker.dev/selections/selection-modes)). Выбор управляемый:
`selected` + `onSelect`, плюс `required`.

**Отключение дат (`disabled`)** принимает matcher или массив matcher'ов
([disabling-dates](https://daypicker.dev/selections/disabling-dates)):

| Matcher          | Что делает                                             |
| ---------------- | ------------------------------------------------------ |
| `boolean`        | отключить все даты                                     |
| `Date` / `Date[]`| конкретная дата / список дат                           |
| `{ from, to }`   | диапазон (включительно)                                |
| `{ before }`     | всё раньше даты (не включая)                           |
| `{ after }`      | всё позже даты (не включая)                            |
| `{ before, after }` | между датами                                        |
| `{ dayOfWeek: [0,6] }` | дни недели (0 = вс)                              |
| `(date) => boolean` | произвольная функция                                 |

Отключённые даты **нельзя выбрать** в любом режиме
([PropsBase.disabled](https://daypicker.dev/api/react/interfaces/PropsBase)).

**Ограничение окна навигации**: `startMonth` / `endMonth` ограничивают доступные для перелистывания
месяцы; `disableNavigation` / `hideNavigation` управляют кнопками навигации; `hidden` (matcher)
прячет даты из сетки ([PropsBase](https://daypicker.dev/api/react/interfaces/PropsBase)).

**Сетка и месяцы**: `numberOfMonths` (по умолчанию 1), `pagedNavigation`, `fixedWeeks` (всегда 6
недель — против «прыжков» высоты), `showOutsideDays`, `showWeekNumber`, `weekStartsOn` (0 = вс),
`ISOWeek` ([grid-and-months](https://daypicker.dev/docs/grid-and-months)).

**Диапазоны (`mode="range"`)**: `excludeDisabled` (исключить отключённые даты из диапазона),
`min`/`max` (ночей), `resetOnSelect`, `required`
([range-mode](https://daypicker.dev/selections/range-mode)).

## 4. Что это значит для окна в 14 дней

Требование спецификации (issue #3): показывать только окно ближайших 14 дней; записываться можно
только внутри него.

- **Нет отдельного пропса «N-дневное окно».** DayPicker раскладывает сетку по месяцам/неделям. Это
  не подтверждено никаким источником как встроенная возможность — её нет.
- Рабочий приём (все части подтверждены доками):
  1. `disabled` из matcher'ов `{ before: start }` и `{ after: end }` — гасит всё вне окна
     (обе границы исключающие, поэтому границы окна надо задавать с учётом этого);
  2. `startMonth`/`endMonth` — не даёт уйти навигацией за пределы окна;
  3. `mode="single"` + `selected`/`onSelect` — управляемый выбор дня (день, внутри которого
     показываются Слоты);
  4. `weekStartsOn={1}` — неделя с понедельника (RU-локализация), `locale`/`timeZone` при
     необходимости.
- Для «двух недель на экране» можно попробовать `numberOfMonths={2}` + `fixedWeeks`, но это даёт
  **два календарных месяца**, а не ровно 14 дней; обрезка до 14 дней всё равно делается через
  `disabled`/`hidden`. Точная визуальная раскладка «ровно 14 дней в ряд» в DayPicker не
  предусмотрена — это открытый вопрос дизайна, а не готовый проп.
- Кастомные ячейки: `components` + `modifiers`/`modifiersClassNames` позволяют рисовать в дне
  число свободных Слотов (пример «Booked dates»/«Custom Cell Size» на странице Calendar).
- `Calendar` принимает `timeZone` и `locale` — важно для корректного выбора дня без сдвига
  ([Calendar docs](https://ui.shadcn.com/docs/components/radix/calendar)).

## 5. Формы и ввод

- **Формы**: по [гайду React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) shadcn
  использует `react-hook-form` (`useForm`, `Controller`), `@hookform/resolvers` (`zodResolver`) и
  `zod`, а разметку/ошибки — через `Field`-компоненты: `Field`, `FieldLabel`, `FieldContent`,
  `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`, `FieldLegend`, `FieldSeparator`
  (registry-item `field`).
- Элемент управления получает `data-invalid` на `Field` и `aria-invalid` на инпуте; ошибки —
  `<FieldError errors={[fieldState.error]} />`.
- Для разных типов полей (Input, Textarea, Select, Checkbox, Radio Group, Switch) в гайде есть
  готовые паттерны `Controller`.
- Эти библиотеки **не** приходят из реестра: их надо поставить самому, например
  `npm i react-hook-form @hookform/resolvers zod -w apps/web`.
- **Ввод**: `Input` (нативный input), `Textarea`, `Label`, `Select`, `RadioGroup` — все требуют
  только `cn` (кроме Radix-примитивов, которые уже установлены).

## 6. Обратная связь, списки, статусы

- `Badge` — статусы (например «свободен/занят»), варианты `default/secondary/destructive/outline/ghost/link`.
- `Alert` — состояния «слотов нет» / «сервер недоступен» (вариант `destructive`, части
  `AlertTitle`/`AlertDescription`/`AlertAction`).
- `Table` — список предстоящих Встреч (`Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`/`TableCaption`).
- `Sonner` (тосты) — «явное подтверждение успеха после Записи»; тянет `sonner` + `next-themes`
  (для темы). Альтернатива — `Alert` или `Dialog` для подтверждения.

## 7. Риски, ограничения, открытые вопросы

- **`button.tsx` будет перезаписан** при `add calendar` (registryDependency `button`). Если есть
  правки в `button.tsx` — сохранить/сравнить (`--diff`) или подтвердить `--overwrite`.
- **Конфликт имён/пакетов DayPicker.** Документация DayPicker v10 в примерах импортирует
  `@daypicker/react`, а сгенерированный shadcn `calendar.tsx` импортирует из `react-day-picker`.
  Оба пакета существуют (`react-day-picker@10.0.2` и `@daypicker/react@10.0.2`, второй зависит от
  первого). Что именно будет использовано — `react-day-picker`, как в коде shadcn и в его
  registry. Причины расхождения в документации не подтверждены источником.
- **`date-fns`** объявлен зависимостью `calendar` в реестре, но в самом `calendar.tsx` не
  импортируется. Это не ошибка, но не стоит считать, что он «нужен для календаря» — он нужен
  примерам и вашему форматированию дат.
- **Число версий/дат в примерах DayPicker** (например, «October 2026») — это демо-данные, не
  гарантия стабильности API; перед реализацией стоит сверяться с актуальной версией доков.
- **14 дней**: готового пропса нет; реализация окна — комбинация `disabled` + `startMonth`/
  `endMonth`. Точная визуальная раскладка — дизайн-решение.
- Часовые пояса и локаль: `timeZone`/`locale`/`weekStartsOn` есть, но конкретная стратегия ТЗ
  (часовые пояса) — ещё открытый пункт карты.

## 8. Источники

- shadcn/ui — Installation, CLI, Monorepo: <https://ui.shadcn.com/docs/cli>,
  <https://ui.shadcn.com/docs/monorepo>
- shadcn/ui — Calendar (Radix): <https://ui.shadcn.com/docs/components/radix/calendar>
- shadcn/ui — Field: <https://ui.shadcn.com/docs/components/radix/field>
- shadcn/ui — Date Picker: <https://ui.shadcn.com/docs/components/radix/date-picker>
- shadcn/ui — React Hook Form: <https://ui.shadcn.com/docs/forms/react-hook-form>
- shadcn registry items (radix-nova): `https://ui.shadcn.com/r/styles/radix-nova/<name>.json`
  (`calendar`, `field`, `input`, `textarea`, `label`, `select`, `radio-group`, `badge`, `alert`,
  `table`, `dialog`, `sonner`, `form`)
- React DayPicker v10 (daypicker.dev):
  <https://daypicker.dev/selections/selection-modes>,
  <https://daypicker.dev/selections/disabling-dates>,
  <https://daypicker.dev/selections/range-mode>,
  <https://daypicker.dev/docs/grid-and-months>,
  <https://daypicker.dev/api/react/interfaces/PropsBase>
- npm: <https://registry.npmjs.org/react-day-picker/latest>, <https://registry.npmjs.org/@daypicker/react/latest>
