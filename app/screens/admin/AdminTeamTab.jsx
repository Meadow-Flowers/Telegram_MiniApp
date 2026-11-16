import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

const ROLE_LABEL = { owner: "Власник", staff: "Працівник", client: "Клієнт" };

// Вкладка «Команда» (лише для власника): усі, хто відкривав додаток. Можна дати роль працівника.
export function AdminTeamTab({ app }) {
  const { showToast } = app;
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setUsers((await apiFetch("/api/admin/team")).users);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(user, role) {
    setBusyId(user.id);
    try {
      await apiFetch(`/api/admin/team/${user.id}`, { method: "PATCH", json: { role } });
      setUsers((us) => us.map((u) => (u.id === user.id ? { ...u, role } : u)));
      showToast(role === "staff" ? `${user.name}: тепер працівник` : `${user.name}: роль знято`);
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <p className="p-4 text-sm text-red-700">{error}</p>;
  if (!users) return <p className="p-4 text-sm text-neutral-600">Завантаження…</p>;

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Тут усі, хто відкривав додаток. Працівник бачить «Адмінку» й генерує без ліміту. Щоб додати колегу,
        попросіть його відкрити бота, а потім оновіть список і натисніть «Зробити працівником».
      </p>
      <button type="button" onClick={load} className="h-11 self-start px-1 text-sm font-semibold underline underline-offset-2">
        Оновити список
      </button>
      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">
                {u.name}
                {u.isMe && <span className="font-normal text-neutral-600"> (ви)</span>}
              </div>
              <div className="truncate text-xs text-neutral-600">
                {u.username ? `@${u.username} · ` : ""}
                {ROLE_LABEL[u.role]}
              </div>
            </div>
            {u.role === "client" && (
              <button
                type="button"
                disabled={busyId === u.id}
                onClick={() => setRole(u, "staff")}
                className="h-11 rounded-xl border border-neutral-900 px-3 text-[13px] font-semibold disabled:opacity-40"
              >
                Зробити працівником
              </button>
            )}
            {u.role === "staff" && (
              <button
                type="button"
                disabled={busyId === u.id}
                onClick={() => setRole(u, "client")}
                className="h-11 rounded-xl border border-neutral-300 px-3 text-[13px] font-semibold disabled:opacity-40"
              >
                Забрати роль
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
