import { Tabs } from "../../components/ui";
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
      <div className="px-3 pt-3">
        <Tabs label="Розділи адмінки" items={tabs} value={adminTab} onChange={setAdminTab} />
      </div>
      {adminTab === "catalog" && <AdminCatalogTab app={app} />}
      {adminTab === "formats" && <AdminFormatsTab app={app} />}
      {adminTab === "style" && <AdminStyleTab app={app} />}
      {adminTab === "settings" && <AdminSettingsTab app={app} />}
      {adminTab === "stats" && <AdminStatsTab app={app} />}
      {adminTab === "team" && me?.isOwner && <AdminTeamTab app={app} />}
    </div>
  );
}
