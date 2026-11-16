import { api, readJson } from "../../../../lib/server/http";
import { db, check } from "../../../../lib/server/supabase";
import { bool, str } from "../../../../lib/server/validate";

// Увімкнути або вимкнути формат цілком (коробка, кошик, упаковка)
export const PATCH = api(
  async ({ request, params }) => {
    const id = str(params.id, { max: 20, label: "Формат" });
    const body = await readJson(request);
    check(await db().from("formats").update({ enabled: bool(body.on) }).eq("id", id));
  },
  { role: "staff" },
);
