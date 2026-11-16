import { api } from "../../../../lib/server/http";
import { HttpError } from "../../../../lib/server/errors";
import { db, check, photoUrl } from "../../../../lib/server/supabase";
import { uuid } from "../../../../lib/server/validate";
import { botCall, esc } from "../../../../lib/server/telegramBot";

// «Поділитися»: готуємо повідомлення, яке користувач відправить у будь-який чат через вікно Telegram.
// Клієнт отримує messageId і викликає Telegram.WebApp.shareMessage(messageId).
export const POST = api(async ({ params, session }) => {
  const id = uuid(params.id);
  const gen = check(
    await db()
      .from("generations")
      .select("id, summary, image_path")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .maybeSingle(),
  );
  if (!gen) throw new HttpError(404, "Варіант не знайдено");

  const url = photoUrl(gen.image_path);
  const prepared = await botCall("savePreparedInlineMessage", {
    user_id: session.user.telegram_id,
    result: {
      type: "photo",
      id: gen.id,
      photo_url: url,
      thumbnail_url: url,
      caption: `${esc(gen.summary)}\n\nAI-візуалізація букета`.slice(0, 1024),
      parse_mode: "HTML",
    },
    allow_user_chats: true,
    allow_bot_chats: false,
    allow_group_chats: true,
    allow_channel_chats: true,
  });
  return { messageId: prepared.id };
});
