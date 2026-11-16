import { HttpError } from "./errors";
import { db, check } from "./supabase";
import { validateInitData } from "./telegramAuth";

const USER_COLUMNS = "id, telegram_id, first_name, last_name, username, role";

// Хто робить запит. Заголовок Authorization:
//   "tma <initData>" — справжній вхід з Telegram (підпис перевіряється токеном бота);
//   "dev <id>"       — лише для локальної розробки (у продакшені вимкнено).
async function telegramUserFromRequest(request) {
  const auth = request.headers.get("authorization") || "";

  if (auth.startsWith("tma ")) {
    const user = validateInitData(auth.slice(4), process.env.TELEGRAM_BOT_TOKEN);
    if (!user) throw new HttpError(401, "Не вдалося підтвердити вхід через Telegram. Закрийте й відкрийте додаток знову.");
    return { user, fromTelegram: true };
  }

  if (auth.startsWith("dev ") && process.env.NODE_ENV !== "production") {
    const id = Number(auth.slice(4));
    if (Number.isSafeInteger(id) && id > 0) return { user: { id }, fromTelegram: false };
  }

  throw new HttpError(401, "Відкрийте додаток через Telegram");
}

// Знаходить користувача в базі (або створює клієнта). touch = оновити ім'я й час останнього входу.
async function ensureUser(tg, { touch }) {
  const sb = db();
  const found = check(await sb.from("app_users").select(USER_COLUMNS).eq("telegram_id", tg.id).maybeSingle());

  if (!found) {
    return check(
      await sb
        .from("app_users")
        .insert({
          telegram_id: tg.id,
          first_name: tg.first_name ?? null,
          last_name: tg.last_name ?? null,
          username: tg.username ?? null,
        })
        .select(USER_COLUMNS)
        .single(),
    );
  }

  if (touch) {
    const patch = { last_seen_at: new Date().toISOString() };
    // ім'я оновлюємо лише з реального Telegram (у режимі розробки його немає)
    if (tg.first_name !== undefined) {
      patch.first_name = tg.first_name ?? null;
      patch.last_name = tg.last_name ?? null;
      patch.username = tg.username ?? null;
    }
    check(await sb.from("app_users").update(patch).eq("id", found.id));
    return { ...found, ...patch };
  }
  return found;
}

// role: "staff" — потрібен працівник або власник; "owner" — лише власник
export async function getSession(request, { role, touch = false } = {}) {
  const { user: tg } = await telegramUserFromRequest(request);
  const user = await ensureUser(tg, { touch });
  const isStaff = user.role === "staff" || user.role === "owner";

  if (role === "staff" && !isStaff) throw new HttpError(403, "Недостатньо прав");
  if (role === "owner" && user.role !== "owner") throw new HttpError(403, "Лише для власника");

  return { user, isStaff, isOwner: user.role === "owner" };
}
