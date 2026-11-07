import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './middleware/logger.js';
import { pool } from './db/pool.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Версия = первые 7 символов коммита. Render кладёт SHA в RENDER_GIT_COMMIT
const VERSION = (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7);

// На Render запрос идёт через прокси. Без этого req.ip — адрес прокси,
// и лимит попыток входа (429) считал бы всех пользователей одним человеком
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS_ORIGIN может содержать несколько адресов через запятую
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(logger);
}

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.get('/', (req, res) => {
  res.send('АгроМаркет API работает');
});

// Health-check: отвечаем «ok», только если отвечает и база
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', version: VERSION });
  } catch {
    res.status(503).json({ status: 'error', db: 'unavailable', version: VERSION });
  }
});

app.get('/api/about', (req, res) => {
  res.json({ name: 'АгроМаркет', version: '1.0', author: 'Арафат' });
});

// Категории каталога с количеством товаров (для фильтра на главной)
app.get('/api/categories', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT category AS name, COUNT(*)::int AS count
     FROM products
     WHERE category IS NOT NULL
     GROUP BY category
     ORDER BY category`,
  );
  res.json(rows);
});

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use(errorHandler);

export default app;
