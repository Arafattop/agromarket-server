import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./middleware/logger.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());
app.use(logger);

// Картинки товаров лежат в public/images и доступны по адресу /images/...
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.get("/", (req, res) => {
  res.send("АгроМаркет API работает");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/about", (req, res) => {
  res.json({ name: "АгроМаркет", version: "1.0", author: "Арафат" });
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

// 404 — строго после всех маршрутов
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

// Обработчик ошибок — четыре аргумента, поэтому он стоит последним
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Некорректный JSON в запросе" });
  }
  console.error(err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`API запущен: http://localhost:${PORT}`);
});
