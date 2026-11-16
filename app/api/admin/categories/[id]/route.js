import { api } from "../../../../lib/server/http";
import { db, check } from "../../../../lib/server/supabase";
import { uuid } from "../../../../lib/server/validate";

// Видалення категорії: її квітки лишаються в каталозі без категорії (так задано в базі)
export const DELETE = api(
  async ({ params }) => {
    check(await db().from("categories").delete().eq("id", uuid(params.id)));
  },
  { role: "staff" },
);
