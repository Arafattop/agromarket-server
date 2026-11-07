import { describe, it, expect, vi, afterEach } from 'vitest';
import { errorHandler } from '../middleware/errorHandler.js';

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

const req = { method: 'GET', originalUrl: '/x' };

describe('errorHandler', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('в продакшене скрывает текст ошибки 500', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = mockRes();
    errorHandler(new Error('connect ECONNREFUSED 10.0.0.5:5432'), req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toBe('Внутренняя ошибка сервера');
  });

  it('ошибка со статусом 400 отдаёт свой текст даже в продакшене', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = mockRes();
    const err = Object.assign(new Error('Слишком длинное имя'), { status: 400 });
    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toBe('Слишком длинное имя');
  });
});
