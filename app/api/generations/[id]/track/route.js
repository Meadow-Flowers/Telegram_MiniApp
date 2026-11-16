import { api, readJson } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check } from "../../../../lib/server/supabase";
import { uuid } from "../../../../lib/server/validate";
import { logEvent } from "../../../../lib/server/events";

// Додаток повідомляє, що користувач справді поділився або зберіг фото (для статистики)
export const POST = api(async ({ request, params, session }) => {
  const id = uuid(params.id);
  const { type } = await readJson(request);
  if (!["shared", "saved"].includes(type)) throw new HttpError(400, "Невідома подія");
  const gen = check(await db().from("generations").select("id").eq("id", id).eq("user_id", session.user.id).maybeSingle());
  if (!gen) throw new HttpError(404, "Варіант не знайдено");
  await logEvent(session.user.id, type, { generationId: id });
});
