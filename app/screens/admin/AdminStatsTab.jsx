import { useCallback, useEffect, useMemo, useState } from "react";
import { IS_DEV, apiFetch } from "../../lib/api";
import { Reveal, Tabs, linkBtn } from "../../components/ui";
import {
  ChartCard,
  Delta,
  Funnel,
  HBars,
  Heatmap,
  LineChart,
  Sparkline,
  FOREST,
  OCHRE,
} from "../../components/charts";

const REFRESH_MS = 30000;
const PERIODS = [
  ["7", "7 днів"],
  ["30", "30 днів"],
  ["90", "90 днів"],
];

// Приклад даних для перегляду графіків, коли справжніх ще мало. Лише в локальній розробці (IS_DEV),
// на проді цього перемикача немає. Числа вигадані.
function demoStats() {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const today = new Date();
  const days = Array.from({ length: 90 }, (_, i) => {
    const date = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - (89 - i),
      ),
    );
    const wd = (date.getUTCDay() + 6) % 7;
    const growth = 0.6 + (i / 89) * 1.1; // поступове зростання
    const g = Math.round((3 + rnd() * 6) * growth * (wd >= 4 ? 1.5 : 1));
    const s = Math.round(g * (0.25 + rnd() * 0.2));
    const sh = Math.round(g * (0.08 + rnd() * 0.12));
    const sv = Math.round(g * (0.12 + rnd() * 0.15));
    const l = rnd() < 0.3 ? Math.round(rnd() * 3) : 0;
    return {
      d: date.toISOString().slice(0, 10),
      g,
      s,
      sh,
      sv,
      l,
      c: Math.round(g * 0.067 * 10000) / 10000,
      n: g,
    };
  });
  const heat = Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 8 }, (_, b) => {
      const evening = Math.exp(-(((b - 6) / 1.5) ** 2)); // піки ввечері
      const noon = 0.5 * Math.exp(-(((b - 4) / 1.2) ** 2));
      const weekend = d >= 4 ? 1.4 : 1;
      return Math.round((evening + noon) * 18 * weekend * (0.6 + rnd() * 0.6));
    }),
  );
  return {
    days,
    heat,
    topFlowers: [
      { name: "Гортензія", count: 64 },
      { name: "Троянда кущова", count: 51 },
      { name: "Еустома", count: 43 },
      { name: "Антуріум", count: 30 },
      { name: "Гвоздика", count: 22 },
      { name: "Pink mondial", count: 17 },
    ],
    formats: [
      { name: "Коробка", count: 96 },
      { name: "Упаковка", count: 71 },
      { name: "Кошик", count: 24 },
    ],
    generations: 0,
    realCost: null,
    realCostCount: 0,
  };
}

const sum = (rows, key) => rows.reduce((s, r) => s + r[key], 0);

// Статистика: плитки з відсотком зміни й міні-графіком, графік по днях, воронка, теплова карта, популярні квіти й формати.
// Оновлюється сама: при відкритті вкладки, кожні 30 секунд і коли користувач повертається до додатка.
export function AdminStatsTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30");
  const [demo, setDemo] = useState(false);

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
    const timer = setInterval(load, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const data = useMemo(() => (demo ? demoStats() : stats), [demo, stats]);

  if (error) return <p className="t-body p-3 text-rust">{error}</p>;
  if (!data)
    return <p className="t-body p-3 text-neutral-600">Завантаження…</p>;

  const n = Number(period);
  const cur = data.days.slice(-n);
  const prev = n * 2 <= data.days.length ? data.days.slice(-n * 2, -n) : null; // з попереднім періодом порівнюємо, лише якщо він є
  const hasCost = data.days.some((d) => d.c > 0);

  // Середня вартість одного фото за період: витрати ділимо на кількість генерацій із реальною вартістю
  // (генерації із заглушкою вартості не мають, тому їх не рахуємо)
  const avgCost = (rows) => {
    const count = sum(rows, "n");
    return count > 0 ? sum(rows, "c") / count : null;
  };
  const avgNow = avgCost(cur);
  const avgPrev = prev ? avgCost(prev) : null;

  // Плитка: підпис і відсоток зміни вгорі, число в лівому нижньому куті, міні-графік у правому
  const tile = (label, key, format = (v) => v) => {
    const now = sum(cur, key);
    return (
      <div
        key={key}
        className="flex min-h-28 flex-col justify-between gap-3 bg-surface p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="t-caption text-neutral-600">{label}</span>
          <Delta now={now} prev={prev ? sum(prev, key) : null} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="t-number shrink-0">{format(now)}</span>
          <Sparkline
            values={cur.map((d) => d[key])}
            className="min-w-0 flex-1 text-forest"
          />
        </div>
      </div>
    );
  };

  const stages = [
    { label: "Усього генерацій", value: sum(cur, "g") },
    { label: "Надіслано студії", value: sum(cur, "s") },
    { label: "Поділено", value: sum(cur, "sh") },
    { label: "Збережено", value: sum(cur, "sv") },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <Tabs
          label="Період"
          items={PERIODS}
          value={period}
          onChange={setPeriod}
        />
        {IS_DEV && (
          <button
            type="button"
            className={linkBtn}
            onClick={() => setDemo((d) => !d)}
          >
            <span className="link-ul">
              {demo ? "Справжні дані" : "Приклад даних"}
            </span>
          </button>
        )}
      </div>
      {demo && (
        <p className="t-caption bg-sand/60 p-3">
          Це приклад із вигаданими числами, щоб побачити графіки. Лише в
          локальній розробці.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {tile("Генерацій", "g")}
        {tile("Надіслано студії", "s")}
        {tile("Поділено", "sh")}
        {tile("Збережено фото", "sv")}
        {tile("Уперлися в ліміт", "l")}
        {tile("Витрати на генерації", "c", (v) =>
          hasCost ? `$${v.toFixed(2)}` : "—",
        )}
        <div className="flex min-h-28 flex-col justify-between gap-3 bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="t-caption text-neutral-600">
              Вартість одного фото
            </span>
            <Delta now={avgNow ?? 0} prev={avgNow != null ? avgPrev : null} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="t-number shrink-0">
              {avgNow != null ? `$${avgNow.toFixed(3)}` : "—"}
            </span>
            <Sparkline
              values={cur.map((d) => (d.n > 0 ? (d.c / d.n) * 100 : 0))}
              className="min-w-0 flex-1 text-forest"
            />
          </div>
        </div>
      </div>

      <Reveal>
        <ChartCard
          title="Генерації по днях"
          info="Скільки генерацій щодня (темно-зелена лінія) і скільки з них клієнти надіслали студії (охра). Проведіть пальцем або мишею по графіку, щоб побачити день."
        >
          <LineChart
            days={cur}
            series={[
              { key: "g", label: "Генерацій", color: FOREST },
              { key: "s", label: "Студії", color: OCHRE },
            ]}
          />
        </ChartCard>
      </Reveal>

      <Reveal>
        <ChartCard
          title="Що роблять із результатом"
          info="Воронка за обраний період: з усіх генерацій скільки клієнтів надіслали студії, поділились і зберегли фото. Відсоток рахується від кількості генерацій."
        >
          <Funnel stages={stages} />
        </ChartCard>
      </Reveal>

      <Reveal>
        <ChartCard
          title="Коли генерують"
          info="Дні тижня й години (за київським часом) за останні 90 днів. Чим темніша клітинка, тим більше генерацій. Показує, коли краще бути на звʼязку зі студією."
        >
          <Heatmap heat={data.heat} />
        </ChartCard>
      </Reveal>

      <Reveal>
        <ChartCard
          title="Популярні квіти"
          info="Які квіти найчастіше потрапляють у згенеровані букети: скільки генерацій їх містять. За останні 90 днів."
        >
          <HBars items={data.topFlowers} />
        </ChartCard>
      </Reveal>

      <Reveal>
        <ChartCard
          title="Формати"
          info="Який формат обирають: коробка, кошик чи упаковка. За останні 90 днів."
        >
          <HBars items={data.formats} />
        </ChartCard>
      </Reveal>

      {!demo && data.realCost != null && (
        <p className="t-caption text-neutral-600">
          Витрати за весь час: ${data.realCost.toFixed(2)} за{" "}
          {data.realCostCount} генерацій із реальною моделлю (дані від OpenAI),
          у середньому ${(data.realCost / data.realCostCount).toFixed(3)} за
          одне фото.
          Генерації із заглушкою не рахуються.
        </p>
      )}
    </div>
  );
}
