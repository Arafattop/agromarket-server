import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// Относительный путь картинки делаем полным адресом сервера.
// Эту функцию не удаляем: без неё React не загрузит картинки с порта 3000.
function withImageUrl(product, req) {
  if (!product.image || product.image.startsWith('http')) return product;
  return { ...product, image: `${req.protocol}://${req.get('host')}${product.image}` };
}

// Допустимые варианты сортировки. Имя столбца нельзя передать через $1,
// поэтому подставляем только значения из этого списка.
const sortOptions = new Map([
  ['price', 'price ASC'],
  ['-price', 'price DESC'],
]);

// GET /api/products?search=...&maxPrice=...&sort=price|-price
router.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const values = [`%${search}%`];
  let sql = 'SELECT id, name, category, price, unit, image FROM products WHERE name ILIKE $1';

  if (req.query.maxPrice !== undefined) {
    const max = Number(req.query.maxPrice);
    if (!Number.isFinite(max)) {
      return res.status(400).json({ error: 'maxPrice должен быть числом' });
    }
    values.push(max);
    sql += ` AND price <= $${values.length}`;
  }

  const order = sortOptions.get(req.query.sort) ?? 'id ASC';
  sql += ` ORDER BY ${order}`;

  const { rows } = await pool.query(sql, values);
  res.json(rows.map((p) => withImageUrl(p, req)));
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'id должен быть числом' });
  }

  const { rows } = await pool.query(
    'SELECT id, name, category, price, unit, image FROM products WHERE id = $1',
    [req.params.id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  res.json(withImageUrl(rows[0], req));
});

export default router;