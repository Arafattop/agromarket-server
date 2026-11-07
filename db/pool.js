import pg from 'pg';

// Тип DATE отдаём строкой 'YYYY-MM-DD', иначе часовой пояс сдвинет дату
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({
  // Локально и в CI — своя строка; на Render — строка от Neon с ?sslmode=require
  connectionString: process.env.DATABASE_URL,
  max: 5,                          // бесплатным тарифам много соединений не нужно
  idleTimeoutMillis: 30_000,       // закрывать простаивающие соединения через 30 с
  connectionTimeoutMillis: 10_000, // спящая база просыпается — подождём
});

// Облачная база может разорвать соединение. Без обработчика это уронит процесс
pool.on('error', (err) => {
  console.error('PostgreSQL: соединение потеряно —', err.message);
});
