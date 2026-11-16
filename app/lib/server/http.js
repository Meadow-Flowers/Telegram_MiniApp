import { HttpError } from "./errors";
import { getSession } from "./session";

// Обгортка для API-маршрутів: перевіряє вхід і роль, ловить помилки.
// handler отримує { request, params, session, body }.
export function api(handler, { role, touch = false } = {}) {
  return async (request, context) => {
    try {
      const session = await getSession(request, { role, touch });
      const params = context?.params ? await context.params : {};
      return Response.json((await handler({ request, params, session })) ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message, code: e.code }, { status: e.status });
      console.error(e);
      return Response.json({ error: "Внутрішня помилка сервера" }, { status: 500 });
    }
  };
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Некоректний запит");
  }
}
