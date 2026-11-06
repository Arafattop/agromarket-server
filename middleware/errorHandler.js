// Обработчик ошибок: четыре аргумента, поэтому Express считает его error handler'ом
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Ошибки express.json(): тело слишком большое или битый JSON
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

  // Всё остальное — наша ошибка. Подробности в консоль, клиенту — общий текст
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
