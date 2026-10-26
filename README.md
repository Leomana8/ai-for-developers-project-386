# Календарь звонков

[![hexlet-check](https://github.com/Leomana8/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Leomana8/ai-for-developers-project-386/actions)

🌐 Опубликованная версия: **https://call-calendar-zt5b.onrender.com**

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- **TypeScript** — язык проекта
- **Vite + React + shadcn/ui (Tailwind CSS 4)** — фронтенд (`apps/web`)
- **Express 5** — бэкенд (`apps/server`)
- **Vitest** — тесты, **oxlint** — линтер, **Prettier** — форматирование
- **release-please** — автоматические релизы по Conventional Commits

Требуется Node.js **22.12+**.

## Установка

```bash
git clone https://github.com/Leomana8/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm install
```

## Использование

```bash
# dev-режим: сервер :3001 + фронтенд :5173 (проксирует /api на сервер)
npm run dev

# проверка стиля, тесты и сборка
npm run lint
npm test
npm run build

# запуск собранного бэкенда
npm run build && npm run start
```

Откройте http://127.0.0.1:5173 и нажмите «Проверить /api/health» — фронтенд
сходит на бэкенд через прокси Vite.

Если порт 3001 недоступен (например, Windows зарезервировала его и возвращает
`EACCES`), задайте другой порт. Сервер и прокси Vite используют одну переменную
`PORT`. В PowerShell:

```powershell
$env:PORT = '4001'
npm run dev
```

## API-контракт

Контракт публичного API описан на [TypeSpec](https://typespec.io) в `spec/*.tsp`.
Генерация OpenAPI-спецификации (`spec/output/openapi.yaml`, OpenAPI 3.0):

```bash
npm run spec
```

Сгенерированный файл коммитится; CI проверяет его актуальность (`npm run spec:check`).

## Деплой

Приложение развёрнуто на Render: **https://call-calendar-zt5b.onrender.com** —
сервер отдаёт и API, и собранный фронтенд одним контейнером. План бесплатный,
поэтому сервис засыпает без запросов, и первый запуск может занять до минуты.

Образ собирается из `Dockerfile` в корне репозитория: стадия сборки ставит
зависимости и собирает бэкенд и фронтенд, рантайм-стадия содержит только
прод-зависимости и артефакты сборки. Порт приложение берёт из переменной
окружения `PORT` — он же используется при деплое и в автоматической проверке.

Локально тот же образ запускается так:

```bash
docker build -t call-calendar .
docker run --rm -p 8080:8080 -e PORT=8080 call-calendar
# приложение доступно на http://localhost:8080, /api/health — проверка живости
```

## Структура проекта

```
apps/
  web/     # фронтенд: Vite + React + shadcn/ui, http://localhost:5173
  server/  # бэкенд: Express + TypeScript, http://localhost:3001 (/api/health)
spec/      # API-контракт на TypeSpec → spec/output/openapi.yaml
```

## Коммиты

Проект использует [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:` и т.д. На основе истории таких коммитов
release-please автоматически собирает changelog и готовит release-PR.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
