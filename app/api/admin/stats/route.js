import { api } from "../../../lib/server/http";
import { db, check } from "../../../lib/server/supabase";

const count = async (query) => {
  const { count: n, error } = await query;
  if (error) throw error;
  return n ?? 0;
};

// Статистика за весь час: генерації, надсилання студії, поширення, збереження, випадки ліміту
export const GET = api(
  async () => {
    const sb = db();
    const eventCount = (type) => count(sb.from("events").select("id", { count: "exact", head: true }).eq("type", type));
    const [generations, sentToStudio, shared, saved, limitHits, settings] = await Promise.all([
      count(sb.from("generations").select("id", { count: "exact", head: true })),
      eventCount("sent_to_studio"),
      eventCount("shared"),
      eventCount("saved"),
      eventCount("limit_hit"),
      sb.from("settings").select("generation_cost").eq("id", 1).single().then(check),
    ]);
    const cost = settings.generation_cost == null ? null : Number(settings.generation_cost);
    return {
      generations,
      sentToStudio,
      shared,
      saved,
      limitHits,
      generationCost: cost,
      estimatedCost: cost == null ? null : Math.round(generations * cost * 100) / 100,
    };
  },
  { role: "staff" },
);
