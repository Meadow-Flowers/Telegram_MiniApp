import { api } from "../../../lib/server/http";
import { db, check } from "../../../lib/server/supabase";

const count = async (query) => {
  const { count: n, error } = await query;
  if (error) throw error;
  return n ?? 0;
};

// Сума реальної вартості генерацій (колонка cost пишеться лише для справжньої моделі; у заглушки її немає)
async function realCostTotal(sb) {
  let total = 0;
  let counted = 0;
  for (let from = 0; ; from += 1000) {
    const rows = check(
      await sb
        .from("generations")
        .select("cost")
        .not("cost", "is", null)
        .range(from, from + 999),
    );
    rows.forEach((r) => {
      total += Number(r.cost) || 0;
      counted += 1;
    });
    if (rows.length < 1000) break;
  }
  return { total: Math.round(total * 10000) / 10000, counted };
}

// ---------- Дані для графіків (останні 90 діб, доба за київським часом) ----------
const TZ = "Europe/Kyiv";
const DAYS = 90;
const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  weekday: "short",
  hour: "2-digit",
  hourCycle: "h23",
});
const WEEKDAY = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const EVENT_KEY = {
  sent_to_studio: "s",
  shared: "sh",
  saved: "sv",
  limit_hit: "l",
};

// Список діб від найстарішої до сьогодні: [{ d: "2026-11-22", g, s, sh, sv, l, c }]
//   g генерацій, s надіслано студії, sh поширено, sv збережено, l випадки ліміту, c вартість, $
function emptyDays() {
  const today = dayFmt.format(new Date()); // YYYY-MM-DD за Києвом
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d - (DAYS - 1 - i)));
    return {
      d: date.toISOString().slice(0, 10),
      g: 0,
      s: 0,
      sh: 0,
      sv: 0,
      l: 0,
      c: 0,
    };
  });
}

async function chartData(sb) {
  const since = new Date(Date.now() - (DAYS + 1) * 86400000).toISOString();
  const [gens, events] = await Promise.all([
    sb
      .from("generations")
      .select("created_at, cost, recipe")
      .gte("created_at", since)
      .order("created_at")
      .range(0, 4999)
      .then(check),
    sb
      .from("events")
      .select("type, created_at")
      .in("type", Object.keys(EVENT_KEY))
      .gte("created_at", since)
      .order("created_at")
      .range(0, 9999)
      .then(check),
  ]);

  const days = emptyDays();
  const byDate = new Map(days.map((x) => [x.d, x]));
  const heat = Array.from({ length: 7 }, () => Array(8).fill(0)); // пн…нд × блоки по 3 години
  const flowers = new Map();
  const formats = new Map();

  gens.forEach((g) => {
    const day = byDate.get(dayFmt.format(new Date(g.created_at)));
    if (!day) return;
    day.g += 1;
    day.c += Number(g.cost) || 0;
    const parts = hourFmt.formatToParts(new Date(g.created_at));
    const wd = WEEKDAY[parts.find((p) => p.type === "weekday")?.value];
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    if (wd != null && Number.isFinite(hour))
      heat[wd][Math.floor(hour / 3)] += 1;
    (g.recipe?.flowers || []).forEach((f) =>
      flowers.set(f.name, (flowers.get(f.name) || 0) + 1),
    );
    const fname = g.recipe?.format?.name;
    if (fname) formats.set(fname, (formats.get(fname) || 0) + 1);
  });
  events.forEach((e) => {
    const day = byDate.get(dayFmt.format(new Date(e.created_at)));
    if (day) day[EVENT_KEY[e.type]] += 1;
  });
  days.forEach((x) => (x.c = Math.round(x.c * 10000) / 10000));

  const top = (map, n) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));
  return { days, heat, topFlowers: top(flowers, 6), formats: top(formats, 3) };
}

// Статистика за весь час (плитки) і за останні 90 діб (графіки): генерації, надсилання студії, поширення, збереження, випадки ліміту, витрати
export const GET = api(
  async () => {
    const sb = db();
    const eventCount = (type) =>
      count(
        sb
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("type", type),
      );
    const [
      generations,
      sentToStudio,
      shared,
      saved,
      limitHits,
      settings,
      real,
      charts,
    ] = await Promise.all([
      count(
        sb.from("generations").select("id", { count: "exact", head: true }),
      ),
      eventCount("sent_to_studio"),
      eventCount("shared"),
      eventCount("saved"),
      eventCount("limit_hit"),
      sb
        .from("settings")
        .select("generation_cost")
        .eq("id", 1)
        .single()
        .then(check),
      realCostTotal(sb),
      chartData(sb),
    ]);
    const cost =
      settings.generation_cost == null
        ? null
        : Number(settings.generation_cost);
    return {
      generations,
      sentToStudio,
      shared,
      saved,
      limitHits,
      generationCost: cost,
      realCost: real.counted > 0 ? real.total : null, // у доларах, за генерації з реальною моделлю
      realCostCount: real.counted,
      estimatedCost:
        cost == null ? null : Math.round(generations * cost * 100) / 100,
      ...charts, // days, heat, topFlowers, formats: для графіків
    };
  },
  { role: "staff" },
);
