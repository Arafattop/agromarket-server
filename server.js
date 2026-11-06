import 'dotenv/config'; // ПЕРВАЯ строка: .env должен загрузиться до всего остального
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './middleware/logger.js';
import { pool } from './db/pool.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import { errorHandler } from './middleware/errorHandler.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(logger);

// Картинки товаров: файлы в public/images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.get('/', (req, res) => {
  res.send('АгроМаркет API работает');
});

// Проверка сервера И базы
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/api/about', (req, res) => {
  res.json({ name: 'АгроМаркет', version: '1.0', author: 'Арафат' });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// 404 — строго после всех маршрутов
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});
// Обработчик ошибок — ВСЕГДА последний
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API запущен: http://localhost:${PORT}`);
});