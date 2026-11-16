import { api, readJson } from "../../../lib/server/http";
import { db, check } from "../../../lib/server/supabase";
import { str } from "../../../lib/server/validate";

// Нова категорія. Якщо така назва вже є, повертає наявну (created: false).
export const POST = api(
  async ({ request }) => {
    const name = str((await readJson(request)).name, { max: 40, label: "Назва категорії" });
    const sb = db();
    const all = check(await sb.from("categories").select("id, name"));
    const exist = all.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (exist) return { id: exist.id, name: exist.name, created: false };
    const row = check(await sb.from("categories").insert({ name }).select("id, name").single());
    return { id: row.id, name: row.name, created: true };
  },
  { role: "staff" },
);
