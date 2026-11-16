import { api, readJson } from "../../lib/server/http";
import { HttpError } from "../../lib/server/errors";
import { db, check, photoUrl, PHOTOS_BUCKET } from "../../lib/server/supabase";
import { loadCatalog } from "../../lib/server/catalog";
import { buildRecipe } from "../../lib/server/recipe";
import { generateBouquetImage, withCaption } from "../../lib/server/imageGen";
import { logEvent } from "../../lib/server/events";

// Один натиск «Згенерувати» = один варіант. Сервер сам перевіряє вибір, ліміт на добу,
// малює картинку, вписує склад, зберігає й повертає посилання.
export const POST = api(async ({ request, session }) => {
  const input = await readJson(request);
  const catalog = await loadCatalog();
  const recipe = buildRecipe(catalog, input);

  const sb = db();
  const unlimited = session.isStaff;
  const perDay = catalog.settings.gensPerDay;
  const used = check(await sb.rpc("generations_today", { p_user: session.user.id }));

  if (!unlimited && used >= perDay) {
    await logEvent(session.user.id, "limit_hit", { summary: recipe.summary });
    throw new HttpError(429, "На сьогодні генерації закінчились", "limit");
  }

  const { image, model } = await generateBouquetImage({
    recipe,
    summary: recipe.summary,
    variantNo: Number(input.variantNo) || undefined,
  });
  const finalImage = await withCaption(image, recipe.summary);

  const path = `generation/${crypto.randomUUID()}.jpg`;
  const uploaded = await sb.storage.from(PHOTOS_BUCKET).upload(path, finalImage, { contentType: "image/jpeg" });
  if (uploaded.error) {
    console.error("Storage:", uploaded.error);
    throw new HttpError(500, "Не вдалося зберегти картинку");
  }

  const row = check(
    await sb
      .from("generations")
      .insert({
        user_id: session.user.id,
        format_id: recipe.format.id,
        recipe,
        summary: recipe.summary,
        image_path: path,
        model,
      })
      .select("id")
      .single(),
  );
  await logEvent(session.user.id, "generation", { generationId: row.id, model });

  return {
    generation: { id: row.id, imageUrl: photoUrl(path), summary: recipe.summary },
    quota: { used: used + 1, perDay, unlimited },
  };
});
