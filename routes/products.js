import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Изменять каталог может только администратор: сначала токен, потом роль
const adminOnly = [requireAuth, requireRole('admin')];

const SELECT_PRODUCT = 'SELECT id, name, category, price, unit, image FROM products';

function withImageUrl(product, req) {
  if (!product.image || product.image.startsWith('http')) return product;
  return { ...product, image: `${req.protocol}://${req.get('host')}${product.image}` };
}

const sortOptions = new Map([
  ['price', 'price ASC'],
  ['-price', 'price DESC'],
]);

// Проверка данных товара. Возвращает список ошибок (пустой — значит всё хорошо).
function validateProduct(body) {
  const errors = [];
  if (typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name обязателен');
  }
  const price = Number(body.price);
  if (body.price === undefined || !Number.isInteger(price) || price < 0) {
    errors.push('price — целое число, не меньше 0');
  }
  if (body.unit !== undefined && typeof body.unit !== 'string') {
    errors.push('unit — строка');
  }
  return errors;
}

// GET /api/products
router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const values = [`%${search}%`];
  let sql = `${SELECT_PRODUCT} WHERE name ILIKE $1`;

  if (req.query.maxPrice !== undefined) {
    const max = Number(req.query.maxPrice);
    if (!Number.isFinite(max)) {
      return res.status(400).json({ error: 'maxPrice должен быть числом' });
    }
    values.push(max);
    sql += ` AND price <= $${values.length}`;
  }

  sql += ` ORDER BY ${sortOptions.get(req.query.sort) ?? 'id ASC'}`;

  const { rows } = await pool.query(sql, values);
  res.json(rows.map((p) => withImageUrl(p, req)));
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'id должен быть числом' });
  }
  const { rows } = await pool.query(`${SELECT_PRODUCT} WHERE id = $1`, [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  res.json(withImageUrl(rows[0], req));
});

// POST /api/products — создать товар
router.post('/', adminOnly, async (req, res) => {
  const body = req.body ?? {};
  const errors = validateProduct(body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { rows } = await pool.query(
    `INSERT INTO products (name, category, price, unit, image)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, category, price, unit, image`,
    [body.name.trim(), body.category ?? null, Number(body.price), body.unit ?? 'кг', body.image ?? null],
  );
  res.status(201).json(withImageUrl(rows[0], req));
});

// PUT /api/products/:id — полностью заменить данные товара
router.put('/:id', adminOnly, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'id должен быть числом' });
  }
  const body = req.body ?? {};
  const errors = validateProduct(body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('; ') });
  }

  const { rows } = await pool.query(
    `UPDATE products
     SET name = $1, category = $2, price = $3, unit = $4, image = $5
     WHERE id = $6
     RETURNING id, name, category, price, unit, image`,
    [body.name.trim(), body.category ?? null, Number(body.price), body.unit ?? 'кг', body.image ?? null, req.params.id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  res.json(withImageUrl(rows[0], req));
});

// DELETE /api/products/:id — удалить товар
router.delete('/:id', adminOnly, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'id должен быть числом' });
  }

  const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  res.status(204).end();
});

export default router;