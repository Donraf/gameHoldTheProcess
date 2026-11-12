# Клиент gameHoldTheProcess

Фронтенд игры-симулятора «Удержи процесс». React 19, Vite, MobX, MUI,
Chart.js, react-router.

Требуется Node.js 22+.

## Настройка

Создать `.env` с адресом API:

```
VITE_API_URL='http://localhost:5439/'
```

## Команды

```bash
npm ci          # установка зависимостей
npm run dev     # dev-сервер (по умолчанию http://localhost:3000)
npm test        # тесты (Vitest)
npm run build   # продакшен-сборка в build/
```

Статика из `public/` (например, `public/media/` с видеогайдами) копируется
в сборку как есть.

Общая информация о проекте — в корневом [README](../README.md).
