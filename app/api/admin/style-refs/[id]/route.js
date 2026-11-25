import { api, readJson } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check, PHOTOS_BUCKET } from "../../../../lib/server/supabase";
import { bool, uuid } from "../../../../lib/server/validate";

// Позначки референсного фото: розмір (small | large | null), форма (id варіанта формату | null),
// «не використовувати» (true | false). Усі поля необов'язкові: змінюється лише те, що передали.
export const PATCH = api(
  async ({ request, params }) => {
    const id = uuid(params.id);
    const body = await readJson(request);
    const patch = {};
    if ("size" in body) {
      if (body.size !== null && body.size !== "small" && body.size !== "large") throw new HttpError(400, "Розмір: малий або великий");
      patch.size = body.size;
    }
    if ("optionId" in body) patch.option_id = body.optionId === null ? null : uuid(body.optionId, "Форма");
    if ("skip" in body) patch.skip = bool(body.skip, "Не використовувати");
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Нічого змінювати");

    const { error } = await db().from("style_refs").update(patch).eq("id", id);
    if (error) {
      console.error("Supabase:", error);
      // стовпців ще немає: не виконано міграцію 0008
      if (error.code === "42703" || /column/i.test(error.message || "")) {
        throw new HttpError(503, "Спершу виконайте міграцію 0008_style_tags.sql у Supabase");
      }
      throw new HttpError(500, "Помилка бази даних");
    }
  },
  { role: "staff" },
);

// Видалення референсного фото стилю (разом із файлом у сховищі)
export const DELETE = api(
  async ({ params }) => {
    const sb = db();
    const id = uuid(params.id);
    const row = check(await sb.from("style_refs").select("photo_path").eq("id", id).maybeSingle());
    check(await sb.from("style_refs").delete().eq("id", id));
    if (row?.photo_path) await sb.storage.from(PHOTOS_BUCKET).remove([row.photo_path]);
  },
  { role: "staff" },
);
