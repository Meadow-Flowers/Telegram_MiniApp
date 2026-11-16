import { api } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check, photoUrl } from "../../../../lib/server/supabase";
import { uuid } from "../../../../lib/server/validate";
import { botCall, esc, userLabel } from "../../../../lib/server/telegramBot";
import { logEvent } from "../../../../lib/server/events";

// «Надіслати студії»: бот пише в робочий чат одне повідомлення, фото + склад + контакт клієнта.
export const POST = api(async ({ params, session }) => {
  const id = uuid(params.id);
  const sb = db();
  const gen = check(
    await sb
      .from("generations")
      .select("id, summary, image_path, sent_to_studio_at")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .maybeSingle(),
  );
  if (!gen) throw new HttpError(404, "Варіант не знайдено");
  if (gen.sent_to_studio_at) return { alreadySent: true };

  const chatId = process.env.STUDIO_CHAT_ID;
  if (!chatId) throw new HttpError(503, "Чат студії ще не налаштований");

  const caption = `🌸 Варіант букета від клієнта\n${esc(gen.summary)}\n\nКлієнт: ${userLabel(session.user)}`.slice(0, 1024);
  await botCall("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl(gen.image_path),
    caption,
    parse_mode: "HTML",
  });

  check(await sb.from("generations").update({ sent_to_studio_at: new Date().toISOString() }).eq("id", id));
  await logEvent(session.user.id, "sent_to_studio", { generationId: id });
  return { ok: true };
});
