import { execSync } from 'node:child_process';

export default function setup() {
  // Предохранитель: тесты работают только с базой, в имени которой есть test
  const target = process.env.DATABASE_URL || process.env.PGDATABASE || '';
  if (!target.includes('test')) {
    throw new Error('Тесты должны работать с тестовой базой! Проверьте .env.test');
  }
  execSync('node db/seed.js', { stdio: 'inherit', env: process.env });
  execSync('node db/migrate.js', { stdio: 'inherit', env: process.env }); // миграция поверх готовой базы не должна ломать
}
