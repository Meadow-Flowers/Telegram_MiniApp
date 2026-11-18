import { api, readJson } from "../../../lib/server/http";
import { HttpError } from "../../../lib/server/errors";
import { db, check, photoUrl, PHOTOS_BUCKET } from "../../../lib/server/supabase";
import { str, uuid } from "../../../lib/server/validate";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_STYLE_REFS = 10;
// куди прив'язується фото: квітка, варіант формату (форма, колір) або сам формат
const TABLES = { flower: "flowers", option: "format_options", format: "formats" };
const idOf = (kind, raw) => (kind === "format" ? str(raw, { max: 20, label: "Формат" }) : uuid(raw));

// Завантаження фото: kind = flower | option | format | style.
// Браузер заздалегідь зменшує картинку; тут перевіряємо тип і розмір та кладемо в сховище.
export const POST = api(
  async ({ request }) => {
    const form = await request.formData().catch(() => null);
    if (!form) throw new HttpError(400, "Некоректний запит");

    const kind = form.get("kind");
    const file = form.get("file");
    if (!(file instanceof Blob)) throw new HttpError(400, "Файл не знайдено");
    const ext = TYPES[file.type];
    if (!ext) throw new HttpError(400, "Дозволені лише JPEG, PNG і WebP");
    if (file.size > MAX_BYTES) throw new HttpError(400, "Файл завеликий (до 5 МБ)");
    if (!["flower", "option", "format", "style"].includes(kind)) throw new HttpError(400, "Невідомий тип фото");

    const sb = db();
    const path = `${kind}/${crypto.randomUUID()}.${ext}`;
    const uploaded = await sb.storage
      .from(PHOTOS_BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (uploaded.error) {
      console.error("Storage:", uploaded.error);
      throw new HttpError(500, "Не вдалося зберегти фото");
    }

    try {
      if (kind === "style") {
        const formatId = str(form.get("formatId"), { max: 20, label: "Формат" });
        const existing = check(await sb.from("style_refs").select("id", { count: "exact" }).eq("format_id", formatId));
        if (existing.length >= MAX_STYLE_REFS) throw new HttpError(400, `Не більше ${MAX_STYLE_REFS} фото для формату`);
        const row = check(
          await sb
            .from("style_refs")
            .insert({ format_id: formatId, photo_path: path, sort: existing.length + 1 })
            .select("id, photo_path")
            .single(),
        );
        return { ref: { id: row.id, url: photoUrl(row.photo_path) } };
      }

      // flower / option / format: замінюємо фото й видаляємо старий файл
      const table = TABLES[kind];
      const id = idOf(kind, form.get("id"));
      const old = check(await sb.from(table).select("photo_path").eq("id", id).maybeSingle());
      if (!old) throw new HttpError(404, "Не знайдено");
      check(await sb.from(table).update({ photo_path: path }).eq("id", id));
      if (old.photo_path) await sb.storage.from(PHOTOS_BUCKET).remove([old.photo_path]);
      return { url: photoUrl(path) };
    } catch (e) {
      await sb.storage.from(PHOTOS_BUCKET).remove([path]); // не лишаємо сміття у сховищі
      throw e;
    }
  },
  { role: "staff" },
);

// Видалення фото квітки, варіанта чи формату: сам запис лишається, просто без фото
export const DELETE = api(
  async ({ request }) => {
    const body = await readJson(request);
    const table = TABLES[body.kind];
    if (!table) throw new HttpError(400, "Невідомий тип фото");
    const id = idOf(body.kind, body.id);
    const sb = db();
    const old = check(await sb.from(table).select("photo_path").eq("id", id).maybeSingle());
    if (!old) throw new HttpError(404, "Не знайдено");
    check(await sb.from(table).update({ photo_path: null }).eq("id", id));
    if (old.photo_path) await sb.storage.from(PHOTOS_BUCKET).remove([old.photo_path]);
  },
  { role: "staff" },
);
