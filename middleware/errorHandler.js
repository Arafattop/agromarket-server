// Обработчик ошибок. Отличается от обычного middleware тем,
// что принимает четыре аргумента: (err, req, res, next).
// Express вызывает его, если кто-то передал ошибку в next(err)
// или async-маршрут выбросил исключение.
export function errorHandler(err, req, res, next) {
  // Если ответ уже начал отправляться, передаём ошибку дальше, иначе будет ещё одна ошибка
  if (res.headersSent) return next(err);

  // 22P02 — неверный формат для столбца (например, строка вместо числа)
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Неверный формат данных' });
  }

  // 23514 — нарушен CHECK, 23502 — NOT NULL, 23505 — UNIQUE
  if (['23514', '23502','23503', '23505'].includes(err.code)) {
    return res.status(400).json({ error: 'Данные не прошли проверку базы' });
  }

  // Некорректный JSON в теле запроса (это ошибка express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в запросе' });
  }

  // Всё остальное — наша ошибка. Подробности пишем в консоль сервера,
  // а клиенту отдаём общий текст, чтобы не раскрывать детали устройства.
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}