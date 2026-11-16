import { api, readJson } from "../../../lib/server/http";
import { HttpError } from "../../../lib/server/errors";
import { db, check } from "../../../lib/server/supabase";
import { mapOption } from "../../../lib/server/catalog";
import { str, uuid } from "../../../lib/server/validate";

// Новий варіант формату: форма, колір, колір конкретної форми (parentId)
export const POST = api(
  async ({ request }) => {
    const body = await readJson(request);
    const formatId = str(body.formatId, { max: 20, label: "Формат" });
    const groupKey = str(body.groupKey, { max: 20, label: "Група" });
    const name = str(body.name, { max: 40, label: "Назва" });
    const parentId = body.parentId ? uuid(body.parentId, "Форма") : null;
    const sb = db();

    const group = check(
      await sb.from("format_groups").select("id").eq("format_id", formatId).eq("key", groupKey).maybeSingle(),
    );
    if (!group) throw new HttpError(404, "Групу не знайдено");

    // наступний номер у списку
    const last = check(
      await sb
        .from("format_options")
        .select("sort")
        .eq("group_id", group.id)
        .order("sort", { ascending: false })
        .limit(1),
    );
    const sort = (last[0]?.sort ?? 0) + 1;

    const row = check(
      await sb
        .from("format_options")
        .insert({ group_id: group.id, parent_id: parentId, name, sort })
        .select("id, name, enabled, photo_path")
        .single(),
    );
    return { option: { ...mapOption(row), ...(parentId ? {} : { children: [] }) } };
  },
  { role: "staff" },
);
