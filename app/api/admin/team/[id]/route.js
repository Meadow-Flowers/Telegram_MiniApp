import { api, readJson } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check } from "../../../../lib/server/supabase";
import { uuid } from "../../../../lib/server/validate";

// Призначити або забрати роль працівника. Власника змінити не можна. Лише власник.
export const PATCH = api(
  async ({ request, params, session }) => {
    const id = uuid(params.id);
    const { role } = await readJson(request);
    if (!["client", "staff"].includes(role)) throw new HttpError(400, "Невідома роль");
    if (id === session.user.id) throw new HttpError(400, "Свою роль змінити не можна");

    const sb = db();
    const target = check(await sb.from("app_users").select("role").eq("id", id).maybeSingle());
    if (!target) throw new HttpError(404, "Користувача не знайдено");
    if (target.role === "owner") throw new HttpError(400, "Роль власника змінити не можна");
    check(await sb.from("app_users").update({ role }).eq("id", id));
  },
  { role: "owner" },
);
