import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { InfoHead, linkBtn, secondaryBtn } from "../../components/ui";

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

  if (error) return <p className="p-3 t-body text-rust">{error}</p>;
  if (!users) return <p className="p-3 t-body text-neutral-600">Завантаження…</p>;

  return (
    <div className="flex flex-col gap-3 p-3">
      <InfoHead
        title="Команда"
        info="Тут усі, хто відкривав додаток. Працівник бачить «Адмінку» й генерує без ліміту. Щоб додати колегу, попросіть його відкрити бота, а потім оновіть список і натисніть «Зробити працівником»."
      />
      <button type="button" onClick={load} className={`${linkBtn} self-start`}>
        <span className="link-ul">Оновити список</span>
      </button>
      <ul className="divide-y divide-forest border border-forest">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate t-title">
                {u.name}
                {u.isMe && <span className="font-normal text-neutral-600"> (ви)</span>}
              </div>
              <div className="truncate t-caption text-neutral-600">
                {u.username ? `@${u.username} · ` : ""}
                {ROLE_LABEL[u.role]}
              </div>
            </div>
            {u.role === "client" && (
              <button
                type="button"
                disabled={busyId === u.id}
                onClick={() => setRole(u, "staff")}
                className={`${secondaryBtn} px-3`}
              >
                Зробити працівником
              </button>
            )}
            {u.role === "staff" && (
              <button
                type="button"
                disabled={busyId === u.id}
                onClick={() => setRole(u, "client")}
                className={`${secondaryBtn} px-3`}
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
