import { api } from "../../lib/server/http";
import { loadCatalog } from "../../lib/server/catalog";

// Усе, що потрібно додатку на старті: хто користувач + весь каталог.
export const GET = api(
  async ({ session }) => {
    const catalog = await loadCatalog();
    const { user, isStaff, isOwner } = session;
    return {
      me: { id: user.id, firstName: user.first_name, role: user.role, isStaff, isOwner },
      ...catalog,
    };
  },
  { touch: true },
);
