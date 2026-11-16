import { AdminCatalogTab } from "./AdminCatalogTab";
import { AdminFormatsTab } from "./AdminFormatsTab";
import { AdminStyleTab } from "./AdminStyleTab";
import { AdminSettingsTab } from "./AdminSettingsTab";
import { AdminStatsTab } from "./AdminStatsTab";
import { AdminTeamTab } from "./AdminTeamTab";

export function AdminScreen({ app }) {
  const { adminTab, me, setAdminTab } = app;
  const tabs = [
    ["catalog", "Каталог"],
    ["formats", "Формат"],
    ["style", "Стиль"],
    ["settings", "Налаштування"],
    ["stats", "Статистика"],
    ...(me?.isOwner ? [["team", "Команда"]] : []),
  ];
  return (
    <div className="flex flex-col">
      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-neutral-200 px-4 py-3">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={adminTab === key}
            onClick={() => setAdminTab(key)}
            className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold ${
              adminTab === key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      {adminTab === "catalog" && <AdminCatalogTab app={app} />}
      {adminTab === "formats" && <AdminFormatsTab app={app} />}
      {adminTab === "style" && <AdminStyleTab app={app} />}
      {adminTab === "settings" && <AdminSettingsTab app={app} />}
      {adminTab === "stats" && <AdminStatsTab app={app} />}
      {adminTab === "team" && me?.isOwner && <AdminTeamTab app={app} />}
    </div>
  );
}
