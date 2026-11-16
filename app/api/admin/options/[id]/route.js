import { api, readJson } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check } from "../../../../lib/server/supabase";
import { str, bool, uuid } from "../../../../lib/server/validate";

// Увімкнути/вимкнути варіант або змінити його назву
export const PATCH = api(
  async ({ request, params }) => {
    const id = uuid(params.id);
    const body = await readJson(request);
    const patch = {};
    if ("on" in body) patch.enabled = bool(body.on);
    if ("name" in body) patch.name = str(body.name, { max: 40, label: "Назва" });
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Нічого змінювати");
    check(await db().from("format_options").update(patch).eq("id", id));
  },
  { role: "staff" },
);
