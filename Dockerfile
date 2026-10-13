# Docker-образ: сервер отдаёт API и собранный фронтенд (apps/server → mountStaticWebApp).
# Раскладка каталогов в образе повторяет репозиторий: относительные пути
# от модулей (spec/output/openapi.yaml в openapi.ts, apps/web/dist в app.ts)
# работают так же, как в npm run start.

# --- Стадия сборки: полные зависимости (TypeScript, Vite) + npm run build ---
FROM node:22-slim AS build
WORKDIR /app

# В локальной сети TLS перехватывается антивирусом (свой корневой CA), которого
# нет в Linux-контейнере, — npm ci падает с SELF_SIGNED_CERT_IN_CHAIN. Отключаем
# строгую проверку SSL только на время сборки; рантайм-стадия сети не использует.
RUN npm config set strict-ssl false

# Сначала манифесты — слой npm ci кэшируется, пока зависимости не менялись.
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# --- Стадия рантайма: только прод-зависимости и артефакты сборки ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json ./apps/server/
COPY --from=build /app/apps/web/package.json ./apps/web/
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/spec/output ./spec/output

# Порт берётся из env: его подставляют и хостинг, и автоматическая проверка.
ENV PORT=3001
EXPOSE 3001

# Совместим с npm start: apps/server/dist/index.js читает PORT сам.
CMD ["node", "apps/server/dist/index.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
