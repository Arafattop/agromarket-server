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

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

// В тестах лог каждого запроса только мешает читать результат
if (process.env.NODE_ENV !== 'test') {
  app.use(logger);
}

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.get('/', (req, res) => {
  res.send('АгроМаркет API работает');
});

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

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

// Обработчик ошибок — по-прежнему последним
app.use(errorHandler);

export default app;
