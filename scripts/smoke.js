// Smoke-тест: быстрые проверки ЖИВОГО продакшена после деплоя.
// Ничего не создаёт и не удаляет: в продакшене настоящие данные.
const API_URL = process.env.API_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const EXPECTED = (process.env.EXPECTED_VERSION || '').slice(0, 7);

if (!API_URL) {
  console.error('Не задан API_URL');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ждём, пока сервер покажет именно наш коммит, а не старую версию
async function waitForVersion() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetch(`${API_URL}/health`);
      const body = await res.json();
      console.log(`#${attempt}: HTTP ${res.status}, версия ${body.version}`);
      if (res.ok && (!EXPECTED || body.version === EXPECTED)) return;
    } catch (err) {
      console.log(`#${attempt}: нет ответа (${err.cause?.code || err.message})`);
    }
    await sleep(10_000);
  }
  throw new Error(`Не дождались версии ${EXPECTED}`);
}

const checks = [
  ['каталог отдаёт непустой список', async () => {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data) || data.length === 0) {
      throw new Error(`HTTP ${res.status}`);
    }
  }],
  ['без токена товар не создать (401)', async () => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'smoke', price: 1 }),
    });
    if (res.status !== 401) throw new Error(`HTTP ${res.status}`);
  }],
  ['несуществующий товар — 404', async () => {
    const res = await fetch(`${API_URL}/products/999999`);
    if (res.status !== 404) throw new Error(`HTTP ${res.status}`);
  }],
  ['CORS: фронтенд допущен', async () => {
    if (!FRONTEND_URL) throw new Error('не задан FRONTEND_URL');
    const res = await fetch(`${API_URL}/products`, {
      headers: { Origin: FRONTEND_URL },
    });
    if (res.headers.get('access-control-allow-origin') !== FRONTEND_URL) {
      throw new Error('заголовок Access-Control-Allow-Origin не совпадает');
    }
  }],
];

async function main() {
  await waitForVersion();
  console.log(`API работает: версия ${EXPECTED || 'не проверяли'}`);

  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${name}: ${err.message}`);
    }
  }

  if (failed > 0) {
    console.log(`Smoke-тест провален: ${failed} проверка(и)`);
    process.exit(1);
  }
  console.log('Smoke-тест пройден');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
