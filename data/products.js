import { readFileSync } from "node:fs";

// Путь считается от этого файла, поэтому сервер можно запускать из любой папки
const db = JSON.parse(readFileSync(new URL("./db.json", import.meta.url), "utf-8"));
export const products = db.products;
