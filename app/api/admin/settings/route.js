import { api, readJson } from "../../../lib/server/http";
import { HttpError } from "../../../lib/server/errors";
import { db, check } from "../../../lib/server/supabase";
import { int } from "../../../lib/server/validate";

// Ліміти продукту: квітів одного виду, квітів у букеті, генерацій на добу
export const PATCH = api(
  async ({ request }) => {
    const body = await readJson(request);
    const patch = {};
    if ("maxPerType" in body) patch.max_per_type = int(body.maxPerType, { min: 1, max: 99, label: "Максимум одного виду" });
    if ("maxTotal" in body) patch.max_total = int(body.maxTotal, { min: 1, max: 199, label: "Максимум у букеті" });
    if ("gensPerDay" in body) patch.gens_per_day = int(body.gensPerDay, { min: 1, max: 50, label: "Генерацій на добу" });
    if ("generationCost" in body) {
      const c = body.generationCost;
      if (c === null || c === "") patch.generation_cost = null;
      else if (typeof c === "number" && Number.isFinite(c) && c >= 0 && c <= 1000) patch.generation_cost = c;
      else throw new HttpError(400, "Ціна генерації: число від 0 до 1000");
    }
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Нічого змінювати");
    check(await db().from("settings").update(patch).eq("id", 1));
  },
  { role: "staff" },
);
