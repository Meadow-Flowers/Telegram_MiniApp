import { db } from "./supabase";

// Журнал подій для статистики: generation, sent_to_studio, shared, saved, limit_hit.
// Збій запису не повинен ламати дію користувача, тому помилки лише логуємо.
export async function logEvent(userId, type, payload = {}) {
  const { error } = await db().from("events").insert({ user_id: userId, type, payload });
  if (error) console.error("events:", error.message);
}
