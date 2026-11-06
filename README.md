![CI](https://github.com/ЛОГИН/agromarket-server/actions/workflows/ci.yml/badge.svg)

# АгроМаркет API

Backend для каталога и оптовых заявок «АгроМаркета». Express 5, данные из `data/db.json`, заявки пока в памяти.

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000 (перезапуск при сохранении)
```

Картинки товаров: положите файлы в `public/images/` (имена должны совпадать с `image` в `data/db.json`, например `mlk.jpg`). Доступны по адресу `http://localhost:3000/images/mlk.jpg`.

## Эндпоинты

| Метод | Путь | Описание | Ответы |
|-------|------|----------|--------|
| GET | /api/health | проверка сервера | 200 |
| GET | /api/about | информация о проекте | 200 |
| GET | /api/products | список товаров; `?search=мол`, `?maxPrice=1000`, `?sort=price` или `?sort=-price` (можно комбинировать) | 200, 400 |
| GET | /api/products/:id | один товар | 200, 404 |
| GET | /api/orders | список заявок | 200 |
| POST | /api/orders | новая заявка (JSON: name, email, quantity обязательны) | 201, 400 |

### Правила заявки (POST /api/orders)

- `name` — непустая строка;
- `email` — корректный формат;
- `quantity` — число, не меньше 10 (кг);
- остальные поля необязательны.

Пример ошибки: `{ "error": "Минимальный объём заказа — 10 кг" }` со статусом 400.

## Лабораторная 5 — ответы

- Content-Type у `res.send` и `res.json`: ...
- Что происходит без `next()` в middleware: ...
- Логгер после маршрутов: ...
- Отправка формы без `express.json()`: ...
- Почему CORS блокирует localhost:5173 → localhost:3000: ...
- Использовал(а) ли ИИ и для чего: ...

## Тестирование

1. Создать базу `agromarket_test` (pgAdmin или psql)
2. Скопировать `.env.example` или `.env.test.example` в `.env.test` и указать в нём тестовую базу
3. `npm test` — все тесты, `npm run test:watch` — режим наблюдения, `npm run coverage` — покрытие (Lines: ...%)

## Правила работы с Git

- Ветка `main` защищена: изменения только через Pull Request
- PR сливается после зелёного CI и одобрения ревьюера
- Ветки: `feature/...`, `fix/...`; коммиты: feat, fix, test, refactor, docs, ci, chore

## Лабораторная 8 — ответы

- Какие тесты упали, когда убрали adminOnly у POST, и почему: ...
- Покрытие (Lines) и одна непокрытая строка — почему её не проверяет ни один тест: ...
- Чем unit-тест requireRole отличается от интеграционного теста в access.test.js: ...
- Какие замечания я получил(а) на code-review и что исправил(а): ...
- Какие замечания я оставил(а) напарнику: ...
- Использовал(а) ли ИИ и для чего: ...
