# Changelog

## [1.2.1](https://github.com/Leomana8/ai-for-developers-project-386/compare/v1.2.0...v1.2.1) (2026-10-17)


### Bug Fixes

* **agent:** правила доступа в V1-формате — GitHub-экшен ставит OpenCode V1 ([2becdcc](https://github.com/Leomana8/ai-for-developers-project-386/commit/2becdccef931af5f6b4b57f596ef8d2f11112f3e))
* **agent:** правила доступа в V1-формате — GitHub-экшен ставит OpenCode V1 ([ceb8311](https://github.com/Leomana8/ai-for-developers-project-386/commit/ceb83117deb6a49871ffbb2ed600721cc9b6c255))

## [1.2.0](https://github.com/Leomana8/ai-for-developers-project-386/compare/v1.1.1...v1.2.0) (2026-10-13)


### Features

* **deploy:** один Docker-образ отдаёт API и собранный фронтенд ([0ec749c](https://github.com/Leomana8/ai-for-developers-project-386/commit/0ec749c4013febb3f1c4bbcbdc0cb8cbfe562f8b))
* **server:** отдавать собранный фронтенд в production ([8dbc451](https://github.com/Leomana8/ai-for-developers-project-386/commit/8dbc4512252a216bd8eb00d2b4f2839e13ce7ee3))


### Bug Fixes

* **server:** не отдавать прошедшие Слоты сегодняшнего дня ([b1e5368](https://github.com/Leomana8/ai-for-developers-project-386/commit/b1e5368702b6e1742f84a7a3c1ec077828ab623c))
* **server:** не отдавать прошедшие Слоты сегодняшнего дня ([2b155d7](https://github.com/Leomana8/ai-for-developers-project-386/commit/2b155d79e5b8b7cbcd855efe13d7613a04017e39)), closes [#41](https://github.com/Leomana8/ai-for-developers-project-386/issues/41)

## [1.1.1](https://github.com/Leomana8/ai-for-developers-project-386/compare/v1.1.0...v1.1.1) (2026-10-13)


### Bug Fixes

* **web:** календарь выбора Слота на русском ([14016b9](https://github.com/Leomana8/ai-for-developers-project-386/commit/14016b9d65781c653aefb760d96fc3b2207a50b3)), closes [#37](https://github.com/Leomana8/ai-for-developers-project-386/issues/37)
* **web:** невалидный start= в URL не роняет подтверждение ([bb9ff0c](https://github.com/Leomana8/ai-for-developers-project-386/commit/bb9ff0cd225559fe18614a9771961be2eea0a427))
* **web:** невалидный start= в URL не роняет подтверждение ([fcd1573](https://github.com/Leomana8/ai-for-developers-project-386/commit/fcd15732eb2b27feea4b408bfe3023be92182ed3)), closes [#35](https://github.com/Leomana8/ai-for-developers-project-386/issues/35)
* **web:** невалидный start= в URL не роняет подтверждение ([406b4f9](https://github.com/Leomana8/ai-for-developers-project-386/commit/406b4f935562f82e62c0d94916bb09a9e590d7cf)), closes [#35](https://github.com/Leomana8/ai-for-developers-project-386/issues/35)

## [1.1.0](https://github.com/Leomana8/ai-for-developers-project-386/compare/v1.0.0...v1.1.0) (2026-10-12)


### Features

* «Календарь звонков» — Типы событий, Слоты, Встречи и экраны web ([a7dd1c5](https://github.com/Leomana8/ai-for-developers-project-386/commit/a7dd1c53edbfe923345cb63690dd06b819becd0a))
* **server:** in-memory store, seed and Event Types endpoints ([0a82ae1](https://github.com/Leomana8/ai-for-developers-project-386/commit/0a82ae17b1a898012181c24b99973670528c581b))
* **server:** meeting creation and upcoming meetings list ([a422f26](https://github.com/Leomana8/ai-for-developers-project-386/commit/a422f262d078be77c525f572fe4a303a26f38205))
* **server:** slot availability in a 14-day booking window ([bc89d60](https://github.com/Leomana8/ai-for-developers-project-386/commit/bc89d602052603989e8ec0cf16bc8ec5192fdecf))
* **server:** валидация запросов по спеке и заготовки маршрутов ([165fbba](https://github.com/Leomana8/ai-for-developers-project-386/commit/165fbbae607d62cb67ed176bfd9fde2d10a2824d))
* **server:** типы API из OpenAPI и цепочка генерации ([c5b7647](https://github.com/Leomana8/ai-for-developers-project-386/commit/c5b76472bcaaa2ab27e2c92bbbee794548eed0a4))
* **web:** admin area ([fd2517b](https://github.com/Leomana8/ai-for-developers-project-386/commit/fd2517bf0d86f5443faef3f870b9c62f4e0e1177))
* **web:** guest booking flow ([ae67263](https://github.com/Leomana8/ai-for-developers-project-386/commit/ae672638d5cb16be6c042c693a365e1a8943a531))
* **web:** homepage with event types from the API ([386618a](https://github.com/Leomana8/ai-for-developers-project-386/commit/386618aabc0acfdc7b0beabb9220b8411d0a2f16))
* **web:** typed data layer and shadcn components ([c0ad33a](https://github.com/Leomana8/ai-for-developers-project-386/commit/c0ad33aff152f9484bdc0a6f5cd2c3de3bd03744))
* **web:** вкладки «Запись»/«Админка» на главной ([d9f6d75](https://github.com/Leomana8/ai-for-developers-project-386/commit/d9f6d7525f548945bd4602f3cd91438a781b899f)), closes [#33](https://github.com/Leomana8/ai-for-developers-project-386/issues/33)
* **web:** клиентский SDK из TypeSpec (openapi-fetch) ([1faf1fc](https://github.com/Leomana8/ai-for-developers-project-386/commit/1faf1fca2ff9bddf0c4a2d95c2bd3b3dc4f59b4c))
* **web:** подсказки валидации на подтверждении записи ([7d56f34](https://github.com/Leomana8/ai-for-developers-project-386/commit/7d56f34e413686e374a3bc95ee46361a31cde593))
* **web:** сквозной хедер вкладок и тексты экранов по §7 спеки ([d24f3a1](https://github.com/Leomana8/ai-for-developers-project-386/commit/d24f3a1c15d50cbba10ea29fbcf33c65d5982f21))
* клиентский SDK и серверная валидация по OpenAPI-контракту ([0ff5880](https://github.com/Leomana8/ai-for-developers-project-386/commit/0ff5880409ed6ec05de2efbc89bbc2b98ef34c8f))


### Bug Fixes

* **server:** канонические русские message конверта ошибок по §6 ([470c601](https://github.com/Leomana8/ai-for-developers-project-386/commit/470c60198a17ab67331ea2d09e7d3b321a0a9c2f))
* **server:** канонические русские тексты полевых ошибок ([69bba06](https://github.com/Leomana8/ai-for-developers-project-386/commit/69bba06c4ffb87ba0e23fbbedc7d32c2941a8334))
* **server:** ключи полей 422 — имена полей тела, не JSON Pointer ([07f6eac](https://github.com/Leomana8/ai-for-developers-project-386/commit/07f6eacd12008ce621b588fc8664e1cb48fc466f))
* **web:** алерт недоступности Слота строго по §7 и возврат на выбранный день ([b35b204](https://github.com/Leomana8/ai-for-developers-project-386/commit/b35b2048ffbbc78a70900d1ed030bbd190d4ccf0))
* **web:** заметная обработка 422 out_of_window на подтверждении записи ([5016473](https://github.com/Leomana8/ai-for-developers-project-386/commit/501647395c62b9a7b4dcd795c9eabb867481b8c6))
* **web:** текст недоступности для Админки ([20f73f1](https://github.com/Leomana8/ai-for-developers-project-386/commit/20f73f1fc0151789f939ce53eb863f2560c0d98c))
* **web:** число свободных Слотов видно и при нуле ([8aee61c](https://github.com/Leomana8/ai-for-developers-project-386/commit/8aee61cd03bfff234ee46fb873efbe92170563f5))

## 1.0.0 (2026-10-10)


### Features

* scaffold monorepo with vite + shadcn/ui frontend, express backend, vitest, oxlint, prettier, CI and release-please ([a1e94fc](https://github.com/Leomana8/ai-for-developers-project-386/commit/a1e94fcd7318a9a89ee2b6a1a81f093ff8f62c54))
* **web:** главная страница сервиса и переход на запись ([48326f4](https://github.com/Leomana8/ai-for-developers-project-386/commit/48326f45b4f8f62ceb94c755a3d66eb3ae3d80cd))
