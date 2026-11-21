import { rateLimit } from 'express-rate-limit';

// Не больше 10 запросов входа/регистрации с одного IP за 15 минут.
// В тестах лимит отключён: тесты регистрируют много пользователей подряд.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',   // заголовки RateLimit и RateLimit-Policy
  legacyHeaders: false,
  message: { error: 'Слишком много попыток. Попробуйте через 15 минут' },
  skip: () => process.env.NODE_ENV === 'test',
});
