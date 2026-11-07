// Обработчик ошибок: четыре аргумента, поэтому Express узнаёт его как error handler
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Ошибки express.json()
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Слишком большой запрос' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }

  // Ошибки PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Такая запись уже существует' });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Неверный формат данных' });
  }
  if (['23514', '23502', '23503'].includes(err.code)) {
    return res.status(400).json({ error: 'Данные не прошли проверку базы' });
  }

  // Ошибки 4xx с собственным текстом — отдаём текст клиенту
  const status = err.status || err.statusCode;
  if (status && status < 500) {
    return res.status(status).json({ error: err.message });
  }

  // Всё остальное — наша ошибка. В лог пишем всё, клиенту в продакшене — общую фразу
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({ error: isProd ? 'Внутренняя ошибка сервера' : err.message });
}
