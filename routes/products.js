import { Router } from "express";
import { products } from "../data/products.js";

const router = Router();

// Относительный путь картинки превращаем в полный URL сервера,
// чтобы React (порт 5173) загружал её с API (порт 3000)
function withImageUrl(product, req) {
  if (!product.image || product.image.startsWith("http")) return product;
  return { ...product, image: `${req.protocol}://${req.get("host")}${product.image}` };
}

// GET /api/products?search=...&maxPrice=...&sort=price|-price
router.get("/", (req, res) => {
  const { search, maxPrice, sort } = req.query;

  // Параметр может прийти массивом (?search=a&search=b) — принимаем только строку
  const term = typeof search === "string" ? search.trim().toLowerCase() : "";

  let limit = null;
  if (maxPrice !== undefined) {
    limit = Number(maxPrice);
    if (!Number.isFinite(limit)) {
      return res.status(400).json({ error: "maxPrice должен быть числом" });
    }
  }

  let result = products.filter(
    (p) =>
      p.name.toLowerCase().includes(term) &&
      (limit === null || Number(p.price) <= limit),
  );

  // [...result] — сортируем копию, а не исходный массив
  if (sort === "price") result = [...result].sort((a, b) => a.price - b.price);
  if (sort === "-price") result = [...result].sort((a, b) => b.price - a.price);

  res.json(result.map((p) => withImageUrl(p, req)));
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const product = products.find((p) => String(p.id) === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Товар не найден" });
  }
  res.json(withImageUrl(product, req));
});

export default router;
