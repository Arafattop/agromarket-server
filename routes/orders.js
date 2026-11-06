import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_QUANTITY = 10;
const clean = (v) => (typeof v === 'string' ? v.trim() : '');

// Проверка заявки на сервере. Возвращает список ошибок (пустой — всё хорошо).
function validateOrder(body) {
  const errors = [];

  if (!clean(body.name)) errors.push('Укажите имя');
  if (!EMAIL_RE.test(clean(body.email))) errors.push('Некорректный email');

  const quantity = Number(body.quantity);
  if (body.quantity === undefined || body.quantity === '' || !Number.isFinite(quantity)) {
    errors.push('Объём должен быть числом');
  } else if (quantity < MIN_QUANTITY) {
    errors.push(`Минимальный объём заказа — ${MIN_QUANTITY} кг`);
  }

  // product_id необязательный, но если передан — должен быть числом
  if (body.product_id && !/^\d+$/.test(String(body.product_id))) {
    errors.push('product_id должен быть числом');
  }

  return errors;
}

// GET /api/orders?status=new — список заявок, новые сверху
router.get('/', async (req, res) => {
  const values = [];
  let sql = `
    SELECT o.id, o.product_id, p.name AS product_name, o.name, o.email, o.phone,
           o.quantity, o.delivery_date, o.comment, o.status, o.created_at
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id`;

  if (typeof req.query.status === 'string' && req.query.status) {
    values.push(req.query.status);
    sql += ' WHERE o.status = $1';
  }
  sql += ' ORDER BY o.id DESC';

  const { rows } = await pool.query(sql, values);
  res.json(rows);
});

// POST /api/orders — новая заявка из формы
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const errors = validateOrder(body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { rows } = await pool.query(
    `INSERT INTO orders (product_id, name, email, phone, quantity, delivery_date, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      body.product_id || null,
      clean(body.name),
      clean(body.email),
      clean(body.phone) || null,
      Number(body.quantity),
      body.date || null,
      clean(body.comment) || null,
    ],
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/orders/:id — сменить статус заявки
router.patch('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'id должен быть числом' });
  }

  const { status } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: 'Поле status обязательно' });
  }

  // Допустимые значения проверяет CHECK в таблице orders.
  // Если передать 'lost', база вернёт ошибку 23514, её обработает errorHandler.
  const { rows } = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Заявка не найдена' });
  }
  res.json(rows[0]);
});
export default router;