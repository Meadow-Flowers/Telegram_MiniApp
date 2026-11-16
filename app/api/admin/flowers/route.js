import { api, readJson } from "../../../lib/server/http";
import { db, check } from "../../../lib/server/supabase";
import { mapFlower } from "../../../lib/server/catalog";
import { str, int, uuid } from "../../../lib/server/validate";

const COLUMNS = "id, name, category_id, stock, visible, photo_path";

// Нова квітка
export const POST = api(
  async ({ request }) => {
    const body = await readJson(request);
    const row = check(
      await db()
        .from("flowers")
        .insert({
          name: str(body.name, { label: "Назва" }),
          stock: int(body.stock ?? 0, { min: 0, max: 100000, label: "Кількість" }),
          category_id: body.cat ? uuid(body.cat, "Категорія") : null,
        })
        .select(COLUMNS)
        .single(),
    );
    return { flower: mapFlower(row) };
  },
  { role: "staff" },
);
