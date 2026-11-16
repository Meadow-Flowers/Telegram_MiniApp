import { db } from "../../lib/server/supabase";

// Перевірка налаштувань сервера: чи знайдено змінні й чи відповідає база.
// Показує лише «є / немає», самих значень не віддає.
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    TELEGRAM_BOT_TOKEN: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  };
  let database = false;
  try {
    const { error } = await db().from("settings").select("id").limit(1);
    database = !error;
  } catch {
    database = false;
  }
  return Response.json({ ok: database && Object.values(env).every(Boolean), env, database });
}
