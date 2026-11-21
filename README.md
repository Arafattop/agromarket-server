![CI](https://github.com/Arafattop/agromarket-server/actions/workflows/ci.yml/badge.svg)

# АгроМаркет API

Сервер для каталога и заявок «АгроМаркета». Express 5, PostgreSQL, JWT, роли user и admin.

## Запуск локально

```bash
npm install
npm run db:init    # создаёт таблицы, товары и админа (только локальная база)
npm run dev        # http://localhost:3000
```

Картинки товаров лежат в `public/images/`, открываются по `http://localhost:3000/images/имя.jpg`.

## Переменные окружения

Файл `.env` в git не попадает. Пример лежит в `.env.example`.

```
DATABASE_URL=postgresql://postgres:ПАРОЛЬ@localhost:5433/agromarket
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=длинная_случайная_строка
JWT_EXPIRES_IN=2h
ADMIN_EMAIL=admin@agromarket.kz
ADMIN_PASSWORD=пароль_админа
```

Секретный ключ можно сделать так:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Эндпоинты

| Метод | Путь | Доступ | Ответы |
|---|---|---|---|
| GET | /api/health | все | 200, 503 |
| GET | /api/about | все | 200 |
| GET | /api/categories | все | 200 |
| POST | /api/auth/register | все | 201, 400, 409, 429 |
| POST | /api/auth/login | все | 200, 400, 401, 429 |
| GET | /api/auth/me | токен | 200, 401, 404 |
| GET | /api/products | все | 200, 400 |
| GET | /api/products/:id | все | 200, 400, 404 |
| POST | /api/products | admin | 201, 400, 401, 403 |
| PUT | /api/products/:id | admin | 200, 400, 401, 403, 404 |
| DELETE | /api/products/:id | admin | 204, 400, 401, 403, 404 |
| POST | /api/orders | все | 201, 400 |
| GET | /api/orders | admin | 200, 401, 403 |
| PATCH | /api/orders/:id | admin | 200, 400, 401, 403, 404 |

Фильтры каталога: `?search=мол`, `?maxPrice=1000`, `?sort=price` или `?sort=-price`. Можно комбинировать.

## Тесты

1. Создай базу `agromarket_test`.
2. Скопируй `.env.test.example` в `.env.test` и поставь свой пароль.
3. Запусти:

```bash
npm test              # все тесты
npm run test:watch    # следит за изменениями
npm run coverage      # покрытие, строка Lines: ...%
```

Тестовая база пересоздаётся перед каждым запуском. Если в адресе базы нет слова `test`, тесты не запустятся: это защита от случайного стирания основной базы.

## Безопасность

- helmet: защитные заголовки, `X-Powered-By` отключён
- CORS разрешён только для адресов из `CORS_ORIGIN`
- Rate limit на вход и регистрацию: 10 запросов с одного IP за 15 минут
- Валидация данных через zod: регистрация, вход, товары, заявки
- Тело запроса не больше 10 КБ

## Продакшен

- Сайт: https://agromarket-react-theta.vercel.app
- API: https://agromarket-api-login-3z19.onrender.com/api/health
- Схема: React на Vercel, Express на Render (Frankfurt), PostgreSQL на Neon (Frankfurt)

Переменные для продакшена задаются в панелях Render, Vercel и в GitHub (Secrets и Variables), в репозиторий они не попадают.

Деплой: PR → CI (тесты) → merge в `main` → деплой через deploy hook Render → smoke-тест.

## Git

- `main` защищена, изменения идут через Pull Request
- ветки: `feature/...`, `fix/...`, `security/...`
- коммиты короткие и понятные: `feat:`, `fix:`, `test:`, `docs:`, `ci:`
