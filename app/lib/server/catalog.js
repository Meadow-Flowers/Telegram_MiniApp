import { db, check, photoUrl } from "./supabase";

// Перетворення рядків бази у ту форму, яку очікує інтерфейс (див. app/lib/data.js).

export const mapFlower = (f) => ({
  id: f.id,
  name: f.name,
  cat: f.category_id,
  stock: f.stock,
  on: f.visible,
  photo: photoUrl(f.photo_path),
});

export const mapOption = (o) => ({ id: o.id, name: o.name, on: o.enabled, photo: photoUrl(o.photo_path) });

// Завантажує весь каталог одним махом: категорії, квітки, формати з варіантами, референси, налаштування
export async function loadCatalog() {
  const sb = db();
  const [cats, flowers, formats, groups, options, refs, settings] = await Promise.all([
    sb.from("categories").select("id, name").order("created_at"),
    sb.from("flowers").select("id, name, category_id, stock, visible, photo_path").order("created_at"),
    sb.from("formats").select("id, name, enabled, sort").order("sort"),
    sb.from("format_groups").select("id, format_id, key, label, child_label, example, sort").order("sort"),
    sb
      .from("format_options")
      .select("id, group_id, parent_id, name, enabled, photo_path, sort, created_at")
      .order("sort")
      .order("created_at"),
    sb.from("style_refs").select("id, format_id, photo_path, sort, created_at").order("sort").order("created_at"),
    sb.from("settings").select("max_per_type, max_total, gens_per_day, generation_cost").eq("id", 1).single(),
  ]);

  const categoriesData = check(cats);
  const flowersData = check(flowers);
  const formatsData = check(formats);
  const groupsData = check(groups);
  const optionsData = check(options);
  const refsData = check(refs);
  const settingsData = check(settings);

  return {
    categories: categoriesData.map((c) => ({ id: c.id, name: c.name })),
    flowers: flowersData.map(mapFlower),
    formats: formatsData.map((fm) => ({
      id: fm.id,
      name: fm.name,
      on: fm.enabled,
      groups: groupsData
        .filter((g) => g.format_id === fm.id)
        .map((g) => ({
          key: g.key,
          label: g.label,
          childLabel: g.child_label,
          example: g.example,
          items: optionsData
            .filter((o) => o.group_id === g.id && !o.parent_id)
            .map((o) => ({
              ...mapOption(o),
              ...(g.child_label
                ? { children: optionsData.filter((c) => c.parent_id === o.id).map(mapOption) }
                : {}),
            })),
        })),
    })),
    refs: Object.fromEntries(
      formatsData.map((fm) => [
        fm.id,
        refsData.filter((r) => r.format_id === fm.id).map((r) => ({ id: r.id, url: photoUrl(r.photo_path) })),
      ]),
    ),
    settings: {
      maxPerType: settingsData.max_per_type,
      maxTotal: settingsData.max_total,
      gensPerDay: settingsData.gens_per_day,
      generationCost: settingsData.generation_cost == null ? null : Number(settingsData.generation_cost),
    },
  };
}

// Шаблон промпту для моделі зображень. Лежить у базі (settings.image_prompt), а не в коді: репозиторій публічний.
// Не входить у loadCatalog, тож у браузер не потрапляє. Якщо міграцію 0004 ще не виконано, повертає null.
export async function loadPromptTemplate() {
  const { data, error } = await db().from("settings").select("image_prompt").eq("id", 1).single();
  if (error) {
    console.error("Промпт не прочитано (чи виконано міграцію 0004?):", error.message);
    return null;
  }
  return data.image_prompt?.trim() || null;
}
