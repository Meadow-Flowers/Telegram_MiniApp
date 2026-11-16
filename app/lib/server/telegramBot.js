import { HttpError } from "./errors";

// Виклики Telegram Bot API від імені нашого бота (токен лежить лише на сервері).
export async function botCall(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new HttpError(503, "Бот не налаштований");
  let res;
  try {
    res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new HttpError(502, "Не вдалося зв'язатися з Telegram", "telegram");
  }
  const data = await res.json().catch(() => null);
  if (!data?.ok) {
    console.error("Telegram", method, data?.error_code, data?.description);
    throw new HttpError(502, "Telegram не прийняв запит", "telegram");
  }
  return data.result;
}

// екранування для HTML-підписів Telegram
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ім'я клієнта з клікабельним посиланням на його профіль і @username
export function userLabel(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Клієнт";
  const link = `<a href="tg://user?id=${user.telegram_id}">${esc(name)}</a>`;
  return user.username ? `${link} (@${esc(user.username)})` : link;
}
