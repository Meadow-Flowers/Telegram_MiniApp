import { HttpError } from "./errors";

// Прості перевірки вхідних даних. Кидають 400, якщо значення не підходить.

export function str(value, { min = 1, max = 80, label = "Значення" } = {}) {
  const v = typeof value === "string" ? value.trim() : "";
  if (v.length < min) throw new HttpError(400, `${label}: поле порожнє`);
  if (v.length > max) throw new HttpError(400, `${label}: задовге (до ${max} символів)`);
  return v;
}

export function int(value, { min = 0, max = 100000, label = "Число" } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${label}: від ${min} до ${max}`);
  return n;
}

export function bool(value, label = "Значення") {
  if (typeof value !== "boolean") throw new HttpError(400, `${label}: очікується так/ні`);
  return value;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(value, label = "Ідентифікатор") {
  if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, `${label}: некоректний`);
  return value;
}
