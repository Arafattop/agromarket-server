const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_QUANTITY = 10;

const clean = (v) => (typeof v === "string" ? v.trim() : "");

// Проверка заявки на сервере: HTML5-валидацию в браузере легко обойти,
// поэтому сервер никогда не доверяет клиенту.
export function validateOrder(req, res, next) {
  const body = req.body ?? {};
  const name = clean(body.name);
  const email = clean(body.email);
  const quantity = Number(body.quantity);

  if (!name) {
    return res.status(400).json({ error: "Укажите имя" });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Некорректный email" });
  }
  // Number("abc") дает NaN, а NaN < 10 дает false — поэтому проверяем отдельно
  if (body.quantity === undefined || body.quantity === "" || !Number.isFinite(quantity)) {
    return res.status(400).json({ error: "Объём должен быть числом" });
  }
  if (quantity < MIN_QUANTITY) {
    return res.status(400).json({ error: `Минимальный объём заказа — ${MIN_QUANTITY} кг` });
  }

  // Дальше идут только очищенные данные
  req.body = {
    name,
    email,
    phone: clean(body.phone),
    quantity,
    date: clean(body.date),
    comment: clean(body.comment),
  };
  next();
}
