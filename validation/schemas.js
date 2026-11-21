import { z } from 'zod';

// Схемы описывают, какие данные принимает сервер. Всё лишнее (например, поле role) отбрасывается.

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Имя — минимум 2 символа').max(100),
  email: z.string().trim().toLowerCase().email('Некорректный e-mail'),
  password: z.string()
    .min(8, 'Пароль — минимум 8 символов')
    .max(72, 'Пароль — максимум 72 символа'), // bcrypt учитывает только первые 72 байта
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный e-mail'),
  password: z.string().min(1, 'Введите пароль').max(72),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Название — минимум 2 символа').max(200),
  price: z.coerce
    .number({ error: 'Цена должна быть числом' })
    .int('Цена — целое число')
    .positive('Цена должна быть больше 0')
    .max(10_000_000),
  category: z.string().trim().max(50).optional().transform((v) => v || null),
  unit: z.string().trim().max(20).optional().transform((v) => v || 'кг'),
  image: z.string().max(500).optional().transform((v) => v || null),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата в формате ГГГГ-ММ-ДД');

export const orderSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя').max(100),
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  phone: z.string().trim().max(30).optional().transform((v) => v || null),
  quantity: z.coerce
    .number({ error: 'Объём должен быть числом' })
    .int('Объём — целое число')
    .min(10, 'Минимальный объём заказа — 10 кг')
    .max(100_000),
  date: z.union([z.literal(''), isoDate]).optional().transform((v) => v || null),
  comment: z.string().trim().max(1000).optional().transform((v) => v || null),
});