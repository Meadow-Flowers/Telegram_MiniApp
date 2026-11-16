import crypto from "node:crypto";

const MAX_AGE_SECONDS = 24 * 60 * 60; // дані входу від Telegram дійсні добу

// Перевіряє підпис initData, який Telegram додає до Mini App (https://core.telegram.org/bots/webapps).
// Повертає об'єкт користувача Telegram або null, якщо підпис хибний чи застарів.
export function validateInitData(initData, botToken, now = Date.now()) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || now / 1000 - authDate > MAX_AGE_SECONDS) return null;

  try {
    const user = JSON.parse(params.get("user") || "null");
    return user && Number.isSafeInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}
