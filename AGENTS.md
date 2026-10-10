# AGENTS.md

Календарь звонков — сервис для бронирования календаря. Учебный проект: TypeScript,
Vite + React + shadcn/ui (фронтенд), Express 5 (бэкенд). Монорепо на npm workspaces.

## Команды (запускать из корня)

| Команда                 | Что делает                                                             |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm run dev`           | сервер (:3001) + фронтенд (:5173) параллельно                          |
| `npm test`              | Vitest во всех приложениях                                             |
| `npm run lint`          | oxlint во всех приложениях                                             |
| `npm run format`        | Prettier по всему проекту                                              |
| `npm run spec`          | генерация OpenAPI из TypeSpec (`spec/*.tsp`)                           |
| `npm run spec:generate` | вся цепочка генерации: OpenAPI + типы клиента + типы сервера           |
| `npm run spec:client`   | генерация типов клиента из OpenAPI в `apps/web/src/api/schema.d.ts`    |
| `npm run spec:server`   | генерация типов сервера из OpenAPI в `apps/server/src/api/schema.d.ts` |
| `npm run build`         | сборка server (tsc) и web (vite)                                       |
| `npm run start`         | запуск собранного бэкенда                                              |

Требования: Node.js 22.12+.

## Устройство проекта

- `apps/web` — React + Vite + shadcn/ui. Точка входа `src/main.tsx`, стили `src/index.css` (Tailwind 4). Компоненты shadcn лежат в `src/components/ui/`, добавлять через `npx shadcn@latest add <component> -c apps/web`.
- `apps/server` — Express 5. `src/app.ts` создаёт приложение (экспортируется для тестов), `src/index.ts` его слушает. порты и хост через env (`PORT`, по умолчанию 3001).
- Фронтенд ходит на бэкенд только через `/api` — Vite проксирует `/api` на `:3001` (см. `apps/web/vite.config.ts`). Не использовать абсолютные URL вида `http://localhost:3001` в коде фронтенда.
- `spec` — API-контракт на TypeSpec. `spec/main.tsp` (маршруты) + `spec/models.tsp` (модели). `npm run spec` генерирует `spec/output/openapi.yaml` (коммитится, CI проверяет актуальность через `npm run spec:check`).
- Слой данных фронта — типизированный клиент `openapi-fetch` в `apps/web/src/lib/api.ts`; типы генерируются из `spec/output/openapi.yaml` в `apps/web/src/api/schema.d.ts` (`npm run spec:client`, drift-check — `npm run spec:client:check`). База URL пустая → запросы идут относительными `/api/*` (ADR-0004).
- Сервер потребляет ту же спеку: типы генерируются в `apps/server/src/api/schema.d.ts` (`npm run spec:server`, drift-check — `npm run spec:server:check`), цепочка целиком — `npm run spec:generate`. Запросы и ответы валидируются `express-openapi-validator` по `spec/output/openapi.yaml` (`apps/server/src/openapi.ts`); ошибки валидации — контрактный `ErrorEnvelope` со статусом 422 и кодом `validation_error`, незадокументированные пути — 404 `not_found`. Заготовки маршрутов лежат в `apps/server/src/routes/` по тегам спеки.
- Общие зависимости ставятся из корня: `npm i <pkg> -w apps/web` или `-w apps/server`.

## Правила

- **Conventional Commits** для всех коммитов (`feat:`, `fix:`, `chore:`, `refactor:` и т.д.) — по ним release-please собирает релизы. Тип в скобках по приложению: `feat(web): ...`, `fix(server): ...`.
- После изменений прогонять `npm run lint`, `npm test`, `npm run build` — в CI то же самое (`.github/workflows/ci.yml`).
- Файл `.github/workflows/hexlet-check.yml` не менять.
- Новый код — только TypeScript. Форматирование — Prettier, не настраивать ESLint (используется oxlint).
- Тесты: Vitest. Дымовой тест сервера в `apps/server/src/app.test.ts` — новый эндпоинт стоит начать с теста в том же стиле.

## Agent skills

### Issue tracker

Задачи ведутся в GitHub Issues этого репозитория (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Используются пять канонических лейблов без переименований (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` в корне репозитория. See `docs/agents/domain.md`.
