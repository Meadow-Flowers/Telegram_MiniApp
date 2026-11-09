import { AdminCatalogTab } from "./AdminCatalogTab";
import { AdminFormatsTab } from "./AdminFormatsTab";
import { AdminStyleTab } from "./AdminStyleTab";
import { AdminSettingsTab } from "./AdminSettingsTab";
import { AdminStatsTab } from "./AdminStatsTab";

export function AdminScreen({ app }) {
  const { adminTab, formats, setAdminTab, settings, stats } = app;
  return (
    <div className="flex flex-col">
      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-neutral-200 px-4 py-3">
        {[
          ["catalog", "Каталог"],
          ["formats", "Формат"],
          ["style", "Стиль"],
          ["settings", "Налаштування"],
          ["stats", "Статистика"],
        ].map(([key, label]) => (
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
    </div>
  );
}
