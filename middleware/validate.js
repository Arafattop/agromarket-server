// Проверяет req.body схемой zod. Ошибки — 400 с понятным списком полей.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return res.status(400).json({
        error: 'Ошибка валидации',
        details: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req.body = result.data; // дальше идут только очищенные данные
    next();
  };
}
