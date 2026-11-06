import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Читаем .env.test и перекрываем им всё, что могло загрузиться раньше.
// В CI файла нет: переменные задаёт сам workflow.
const { parsed } = dotenv.config({ path: '.env.test', override: true, quiet: true });

export default defineConfig({
  test: {
    env: parsed,
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,   // база одна на все тесты: файлы по очереди
    coverage: {
      include: ['app.js', 'routes/**', 'middleware/**'],
    },
  },
});
