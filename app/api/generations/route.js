import { api } from "../../lib/server/http";
import { db, check, photoUrl } from "../../lib/server/supabase";

// «Мої букети»: останні згенеровані варіанти поточної людини (до 20, нові зверху).
export const GET = api(async ({ session }) => {
  const rows = check(
    await db()
      .from("generations")
      .select("id, summary, recipe, image_path, sent_to_studio_at, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  );
  return {
    generations: rows.map((g) => ({
      id: g.id,
      imageUrl: photoUrl(g.image_path),
      summary: g.summary,
      recipe: g.recipe,
      sentToStudio: Boolean(g.sent_to_studio_at),
      createdAt: g.created_at,
    })),
  };
});
