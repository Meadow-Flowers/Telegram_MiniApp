import { createClient } from "@supabase/supabase-js";
import { HttpError } from "./errors";

export const PHOTOS_BUCKET = "photos";

let client = null;

// Клієнт бази з секретним ключем. Працює ЛИШЕ на сервері: ключ не потрапляє в браузер.
export function db() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new HttpError(500, "Сервер не налаштований: немає ключів Supabase");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

// Публічне посилання на фото у сховищі
export function photoUrl(path) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PHOTOS_BUCKET}/${path}`;
}

// кидає помилку, якщо запит до бази не вдався
export function check({ data, error }) {
  if (error) {
    console.error("Supabase:", error);
    throw new HttpError(500, "Помилка бази даних");
  }
  return data;
}
