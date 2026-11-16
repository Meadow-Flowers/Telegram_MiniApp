import { api } from "../../../lib/server/http";
import { db, check } from "../../../lib/server/supabase";

// Список усіх, хто відкривав додаток (для вкладки «Команда»). Лише власник.
export const GET = api(
  async ({ session }) => {
    const rows = check(
      await db()
        .from("app_users")
        .select("id, first_name, last_name, username, role, last_seen_at")
        .order("last_seen_at", { ascending: false })
        .limit(200),
    );
    return {
      users: rows.map((u) => ({
        id: u.id,
        name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "Без імені",
        username: u.username,
        role: u.role,
        lastSeen: u.last_seen_at,
        isMe: u.id === session.user.id,
      })),
    };
  },
  { role: "owner" },
);
