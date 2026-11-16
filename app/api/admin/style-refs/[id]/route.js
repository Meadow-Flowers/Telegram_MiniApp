import { api } from "../../../../lib/server/http";
import { db, check, PHOTOS_BUCKET } from "../../../../lib/server/supabase";
import { uuid } from "../../../../lib/server/validate";

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
