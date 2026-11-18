import { HttpError } from "./errors";
import { getFormatChoice, sizeFor } from "../utils";
import { int, str, uuid } from "./validate";

// Перевіряє вибір клієнта проти актуального каталогу й будує «рецепт» букета:
// що саме, скільки, у якому форматі. Усе, що прийшло з браузера, вважаємо недовіреним:
// кількості й варіанти звіряємо із залишками, лімітами та ввімкненими формами/кольорами.
export function buildRecipe(catalog, input) {
  const { flowers, formats, settings } = catalog;
  const list = Array.isArray(input?.flowers) ? input.flowers : [];
  if (list.length === 0) throw new HttpError(400, "Оберіть хоча б одну квітку");
  if (list.length > 40) throw new HttpError(400, "Забагато різних квіток");

  const seen = new Set();
  const picked = list.map((row) => {
    const id = uuid(row?.id, "Квітка");
    if (seen.has(id)) throw new HttpError(400, "Квітка повторюється");
    seen.add(id);
    const flower = flowers.find((f) => f.id === id);
    if (!flower || !flower.on || flower.stock <= 0) {
      throw new HttpError(409, "Деякі квіти вже недоступні. Оновіть каталог і спробуйте ще раз.", "stale");
    }
    const count = int(row?.count, { min: 1, max: 1000, label: "Кількість" });
    if (count > Math.min(flower.stock, settings.maxPerType)) {
      throw new HttpError(409, `«${flower.name}»: стільки немає в наявності. Оновіть каталог.`, "stale");
    }
    return { id, name: flower.name, count };
  });

  const total = picked.reduce((s, f) => s + f.count, 0);
  if (total > settings.maxTotal) throw new HttpError(409, `У букеті не більше ${settings.maxTotal} квітів`, "stale");

  const formatId = str(input?.formatId, { max: 20, label: "Формат" });
  const picks = input?.picks && typeof input.picks === "object" ? input.picks : {};
  // клієнт шле вибір лише обраного формату ({ групa: id варіанта }), а getFormatChoice чекає { формат: {...} }
  const choice = getFormatChoice(formats, formatId, { [formatId]: picks });
  if (!choice.activeFormat || choice.activeFormat.id !== formatId) {
    throw new HttpError(409, "Цей формат зараз недоступний. Оновіть каталог.", "stale");
  }

  const size = sizeFor(total);
  const summary = `${picked.map((f) => `${f.name} ×${f.count}`).join(", ")} · ${choice.formatLabel} · розмір ${size}`;

  return {
    flowers: picked,
    total,
    size,
    format: { id: choice.activeFormat.id, name: choice.activeFormat.name },
    options: choice.formatGroups.map((g) => ({ group: g.key, id: g.picked.id, name: g.picked.name })),
    summary,
  };
}

// Які фото передати моделі: обрані квіти, фото форми/паперу (не колір коробки: його задаємо текстом),
// фото самого формату, якщо в нього немає виборів (кошик), і референси стилю формату.
// Фото беремо з каталогу, тому в рецепт (що зберігається в базі) вони не потрапляють.
export function recipeImages(catalog, recipe) {
  const flowers = recipe.flowers.map((f) => ({
    name: f.name,
    count: f.count,
    url: catalog.flowers.find((x) => x.id === f.id)?.photo || null,
  }));
  const format = catalog.formats.find((f) => f.id === recipe.format.id);
  const allOptions = format ? format.groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children || [])])) : [];
  const container = recipe.options
    .filter((o) => !o.group.endsWith("Child"))
    .map((o) => ({ group: o.group, label: o.name, url: allOptions.find((x) => x.id === o.id)?.photo || null }))
    .filter((c) => c.url);
  // формат без виборів (кошик): єдине фото контейнера — фото самого формату
  if (format && format.groups.length === 0 && format.photo) {
    container.push({ group: "format", label: format.name, url: format.photo });
  }
  const styles = (catalog.refs?.[recipe.format.id] || []).map((r) => r.url).filter(Boolean);
  return { flowers, container, styles };
}
