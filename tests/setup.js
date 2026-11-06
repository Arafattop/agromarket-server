import { afterAll } from 'vitest';
import { pool } from '../db/pool.js';

// После всех тестов файла закрываем подключения, иначе процесс не завершится
afterAll(async () => {
  await pool.end();
});
