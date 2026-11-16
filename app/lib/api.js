// Запити додатка до нашого сервера.
// У Telegram додаємо підписані дані входу (initData). Поза Telegram, лише під час
// локальної розробки, підставляємо тестовий Telegram ID (на сервері у продакшені це вимкнено).

export const IS_DEV = process.env.NODE_ENV !== "production";

// тестові користувачі для локальної розробки
const DEV_CLIENT_ID = 1000000001;
const DEV_OWNER_ID = Number(process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID) || 0;
let devRole = DEV_OWNER_ID ? "staff" : "client";

export const devOwnerAvailable = Boolean(DEV_OWNER_ID);
export const getDevRole = () => devRole;
export const setDevRole = (role) => {
  devRole = role;
};

function authHeader() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
  if (tg?.initData) return `tma ${tg.initData}`;
  if (IS_DEV) return `dev ${devRole === "staff" && DEV_OWNER_ID ? DEV_OWNER_ID : DEV_CLIENT_ID}`;
  return null;
}

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// json — звичайний запит із тілом JSON; form — завантаження файлу (FormData)
export async function apiFetch(path, { method = "GET", json, form } = {}) {
  const auth = authHeader();
  if (!auth) throw new ApiError(401, "Відкрийте додаток через Telegram");

  const headers = { Authorization: auth };
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }

  let res;
  try {
    res = await fetch(path, { method, headers, body, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Немає зв'язку з сервером. Перевірте інтернет.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Щось пішло не так", data.code);
  return data;
}
