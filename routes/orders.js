import { Router } from "express";
import { validateOrder } from "../middleware/validateOrder.js";

const router = Router();

// Заявки хранятся в памяти: при перезапуске сервера пропадут
const orders = [];
let nextId = 1;

// GET /api/orders
router.get("/", (req, res) => {
  res.json(orders);
});

// POST /api/orders — сначала валидация, потом сохранение
router.post("/", validateOrder, (req, res) => {
  const order = { id: nextId++, ...req.body, createdAt: new Date().toISOString() };
  orders.push(order);
  res.status(201).json(order);
});

export default router;
