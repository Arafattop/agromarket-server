import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getAdminToken, uniqueEmail } from './helpers.js';

describe('Валидация регистрации', () => {
  it('некорректный e-mail → 400, в details есть поле email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тест', email: 'не-почта', password: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('email');
  });

  it('пароль из 7 символов → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Тест', email: uniqueEmail(), password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('password');
  });

  it('поле role из запроса игнорируется: новый пользователь — user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Хакер', email: uniqueEmail('role'), password: '12345678', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });
});

describe('Валидация товаров', () => {
  it('отрицательная цена → 400, в details есть поле price', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Мёд', price: -500, category: 'Мёд' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('price');
  });

  it('PUT с пустым телом → 400', async () => {
    const token = await getAdminToken();
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('Параметры и размер запроса', () => {
  it('GET /api/products/abc → 400, а не 500', async () => {
    const res = await request(app).get('/api/products/abc');
    expect(res.status).toBe(400);
  });

  it('тело больше 10 КБ → 413', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'x'.repeat(20_000) }));

    expect(res.status).toBe(413);
  });

  it('заявка с объёмом 5 кг → 400 с понятным сообщением', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ name: 'Тест', email: 't@t.kz', quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.message).join(' ')).toMatch(/10 кг/);
  });
});
