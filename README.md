# gameHoldTheProcess

Исследовательская игра-симулятор «Удержи процесс»: игрок наблюдает за графиком
процесса, реагирует на советы ИИ (верные и ложные), останавливает процесс при
угрозе «взрыва» и пользуется платными подсказками. Действия игроков
(остановки, паузы, подсказки, реакция на советы) сохраняются и доступны
исследователю для анализа, включая выгрузку в CSV и расчёт статистик.

## Стек

- **Сервер** (`server/`) — Go, Gin, sqlx, PostgreSQL, JWT-аутентификация.
  Слои: `pkg/handler` → `pkg/service` → `pkg/repository`; доменные модели в
  корне модуля; миграции в `server/schema/` (формат golang-migrate).
- **Клиент** (`client/`) — React 19, Vite, MobX, MUI, Chart.js, react-router.
  Тесты на Vitest. Требуется Node.js 22+.

## Локальный запуск

### База данных

Нужен PostgreSQL. Параметры подключения — в `server/configs/config.yml`
(любое значение можно переопределить переменной окружения: `db.host` →
`DB_HOST` и т.д.).

Миграции (нужен [golang-migrate](https://github.com/golang-migrate/migrate)):

```bash
migrate -path server/schema \
  -database "postgres://postgres:PASSWORD@localhost:5433/game_hold_the_process_db?sslmode=disable" \
  up
```

### Сервер

Создать `server/.env`:

```
DB_PASSWORD=...
JWT_SIGNING_KEY=...
PASSWORD_SALT=...
```

Запуск:

```bash
cd server
go run ./cmd
```

Тесты: `go test ./...`

### Клиент

В `client/.env` указать адрес API: `VITE_API_URL='http://localhost:5439/'`

```bash
cd client
npm ci
npm run dev
```

Тесты: `npm test` (Vitest). Продакшен-сборка: `npm run build` → `client/build/`.

## Деплой

Деплой выполняется существующим скриптом на сервере. Со стороны репозитория
важно помнить:

- сервер читает конфиг из `server/configs/config.yml`; любое значение можно
  переопределить переменной окружения (`db.host` → `DB_HOST` и т.д.);
- секреты передаются через переменные окружения `DB_PASSWORD`,
  `JWT_SIGNING_KEY`, `PASSWORD_SALT` (файл `server/.env` опционален);
- миграции — `server/schema/` в формате golang-migrate, применяются командой
  `migrate -path server/schema -database "postgres://..." up`;
- клиент собирается Vite (`npm ci && npm run build`, требуется Node.js 22+),
  адрес API задаётся переменной `VITE_API_URL` на этапе сборки.
