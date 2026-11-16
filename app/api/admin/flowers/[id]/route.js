import { api, readJson } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check } from "../../../../lib/server/supabase";
import { str, int, bool, uuid } from "../../../../lib/server/validate";

// Зміна квітки: залишок, показ, категорія, назва
export const PATCH = api(
  async ({ request, params }) => {
    const id = uuid(params.id);
    const body = await readJson(request);
    const patch = {};
    if ("stock" in body) patch.stock = int(body.stock, { min: 0, max: 100000, label: "Кількість" });
    if ("on" in body) patch.visible = bool(body.on);
    if ("cat" in body) patch.category_id = body.cat ? uuid(body.cat, "Категорія") : null;
    if ("name" in body) patch.name = str(body.name, { label: "Назва" });
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Нічого змінювати");
    check(await db().from("flowers").update(patch).eq("id", id));
  },
  { role: "staff" },
);
