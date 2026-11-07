import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getAdminToken } from './helpers.js';

describe('GET /api/categories', () => {
  const category = 'Тестовая категория';
  let adminToken;
  let productId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    const created = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Товар категории', category, price: 100, unit: 'кг' });
    productId = created.body.id;
  });

  afterAll(async () => {
    await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('содержит категорию и количество товаров в ней', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);

    const found = res.body.find((c) => c.name === category);
    expect(found).toBeTruthy();
    expect(found.count).toBe(1);
  });
});
