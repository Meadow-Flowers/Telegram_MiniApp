import { api } from "../../lib/server/http";
import { loadCatalog } from "../../lib/server/catalog";
import { db, check } from "../../lib/server/supabase";

// Усе, що потрібно додатку на старті: хто користувач + весь каталог.
export const GET = api(
  async ({ session }) => {
    const catalog = await loadCatalog();
    const { user, isStaff, isOwner } = session;
    const used = check(await db().rpc("generations_today", { p_user: user.id }));
    return {
      quota: { used, perDay: catalog.settings.gensPerDay, unlimited: isStaff },
      me: { id: user.id, firstName: user.first_name, role: user.role, isStaff, isOwner },
      ...catalog,
    };
  },
  { touch: true },
);
