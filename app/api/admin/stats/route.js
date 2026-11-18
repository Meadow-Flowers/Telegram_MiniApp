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
    const rows = check(await sb.from("generations").select("cost").not("cost", "is", null).range(from, from + 999));
    rows.forEach((r) => {
      total += Number(r.cost) || 0;
      counted += 1;
    });
    if (rows.length < 1000) break;
  }
  return { total: Math.round(total * 10000) / 10000, counted };
}

// Статистика за весь час: генерації, надсилання студії, поширення, збереження, випадки ліміту, витрати
export const GET = api(
  async () => {
    const sb = db();
    const eventCount = (type) => count(sb.from("events").select("id", { count: "exact", head: true }).eq("type", type));
    const [generations, sentToStudio, shared, saved, limitHits, settings, real] = await Promise.all([
      count(sb.from("generations").select("id", { count: "exact", head: true })),
      eventCount("sent_to_studio"),
      eventCount("shared"),
      eventCount("saved"),
      eventCount("limit_hit"),
      sb.from("settings").select("generation_cost").eq("id", 1).single().then(check),
      realCostTotal(sb),
    ]);
    const cost = settings.generation_cost == null ? null : Number(settings.generation_cost);
    return {
      generations,
      sentToStudio,
      shared,
      saved,
      limitHits,
      generationCost: cost,
      realCost: real.counted > 0 ? real.total : null, // у доларах, за генерації з реальною моделлю
      realCostCount: real.counted,
      estimatedCost: cost == null ? null : Math.round(generations * cost * 100) / 100,
    };
  },
  { role: "staff" },
);
