import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { pool } from './pool.js';

// --- Предохранитель: db:init УДАЛЯЕТ ВСЕ ТАБЛИЦЫ ---
// Без --force разрешаем только локальную базу (localhost в DATABASE_URL)
const target = process.env.DATABASE_URL || process.env.PGHOST || '';
const isLocal = /localhost|127\.0\.0\.1/.test(target);
if (!isLocal && !process.argv.includes('--force')) {
  console.error('Отказ: db:init запущен НЕ на локальной базе — все данные будут удалены.');
  console.error('Если база пустая и вы уверены: node db/seed.js --force');
  process.exit(1);
}

const schema = readFileSync('./db/schema.sql', 'utf-8');
const { products } = JSON.parse(readFileSync('./data/db.json', 'utf-8'));

await pool.query(schema);

for (const p of products) {
  await pool.query(
    `INSERT INTO products (name, category, price, unit, image)
     VALUES ($1, $2, $3, $4, $5)`,
    [p.name, p.category ?? null, Math.round(Number(p.price)), p.unit ?? 'кг', p.image ?? null],
  );
}

const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
await pool.query(
  `INSERT INTO users (name, email, password_hash, role)
   VALUES ($1, $2, $3, 'admin')`,
  ['Администратор', process.env.ADMIN_EMAIL, hash],
);

console.log(`Готово: товаров — ${products.length}, админ — ${process.env.ADMIN_EMAIL}`);
await pool.end();
