import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

// Статистика за весь час із журналу подій
export function AdminStatsTab({ app }) {
  const { settings } = app;
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setStats(await apiFetch("/api/admin/stats"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, settings.generationCost]);

  if (error) return <p className="p-4 text-sm text-red-700">{error}</p>;
  if (!stats) return <p className="p-4 text-sm text-neutral-600">Завантаження…</p>;
  const hasReal = stats.realCost != null;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Генерацій усього", stats.generations],
          ["Надіслано студії", stats.sentToStudio],
          ["Поширено", stats.shared],
          ["Збережено фото", stats.saved],
          ["Уперлися в ліміт", stats.limitHits],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1.5 rounded-2xl bg-neutral-100 p-3.5">
            <span className="text-[13px] leading-snug text-neutral-600">{label}</span>
            <span className="text-2xl font-bold tabular-nums">{value}</span>
          </div>
        ))}
        <div className="flex flex-col gap-1.5 rounded-2xl bg-neutral-100 p-3.5">
          <span className="text-[13px] leading-snug text-neutral-600">{hasReal ? "Витрати на генерації" : "Орієнтовні витрати"}</span>
          <span className="text-xl font-bold tabular-nums">
            {hasReal ? `$${stats.realCost.toFixed(2)}` : stats.estimatedCost == null ? "—" : stats.estimatedCost}
          </span>
        </div>
      </div>
      {hasReal ? (
        <p className="text-[13px] leading-relaxed text-neutral-600">
          Справжня вартість за {stats.realCostCount} генерацій із реальною моделлю (дані від OpenAI). Генерації із заглушкою не
          рахуються.
        </p>
      ) : (
        stats.estimatedCost == null && (
          <p className="text-[13px] leading-relaxed text-neutral-600">
            Щоб бачити витрати, вкажіть ціну однієї генерації у вкладці «Налаштування».
          </p>
        )
      )}
      <button type="button" onClick={load} className="h-11 self-start px-1 text-sm font-semibold underline underline-offset-2">
        Оновити
      </button>
    </div>
  );
}
