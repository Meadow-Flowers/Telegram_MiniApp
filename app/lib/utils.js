// Чисті допоміжні функції без стану: їх легко тестувати й переносити.

export function plural(n, one, few, many) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

export const flowersWord = (n) => plural(n, "квітка", "квітки", "квітів");

// Розмір букета за кількістю квітів
export const sizeFor = (total) => (total <= 9 ? "S" : total <= 19 ? "M" : "L");

// Що бачить клієнт на екрані формату: лише ввімкнені формати й варіанти.
// picks — вибір клієнта: { [formatId]: { [groupKey]: optionId } }.
// Повертає плоский список груп вибору (форма → колір обраної форми тощо),
// підпис для складу («Коробка · Циліндрична · Біла») і сигнатуру для історії варіантів.
export function getFormatChoice(formats, formatId, picks) {
  const enabledFormats = formats.filter((f) => f.on);
  const activeFormat = enabledFormats.find((f) => f.id === formatId) || enabledFormats[0] || null;
  const formatGroups = [];
  if (activeFormat) {
    const own = picks[activeFormat.id] || {};
    activeFormat.groups.forEach((g) => {
      // форма без жодного ввімкненого кольору клієнту не показується
      const items = g.items.filter((i) => i.on && (!g.childLabel || i.children.some((c) => c.on)));
      if (items.length === 0) return;
      const picked = items.find((i) => i.id === own[g.key]) || items[0];
      formatGroups.push({ key: g.key, label: g.label, items, picked });
      if (g.childLabel) {
        const kids = picked.children.filter((c) => c.on);
        const kidPicked = kids.find((c) => c.id === own[`${g.key}Child`]) || kids[0];
        formatGroups.push({ key: `${g.key}Child`, label: g.childLabel, items: kids, picked: kidPicked });
      }
    });
  }
  const formatLabel = activeFormat ? [activeFormat.name, ...formatGroups.map((g) => g.picked.name)].join(" · ") : "—";
  const formatSig = activeFormat ? [activeFormat.id, ...formatGroups.map((g) => g.picked.id)].join("+") : "none";
  return { enabledFormats, activeFormat, formatGroups, formatLabel, formatSig };
}

// Чим новий вибір відрізняється від складу вже згенерованого букета.
// before/after: [{ id, name, count }]. Повертає додані, прибрані та змінені за кількістю квітки.
export function diffSummary(before, after) {
  const was = new Map(before.map((r) => [r.id, r]));
  const now = new Map(after.map((r) => [r.id, r]));
  const added = [];
  const changed = [];
  after.forEach((r) => {
    const old = was.get(r.id);
    if (!old) added.push({ id: r.id, name: r.name, count: r.count });
    else if (old.count !== r.count) changed.push({ id: r.id, name: r.name, from: old.count, to: r.count });
  });
  const removed = before.filter((r) => !now.has(r.id)).map((r) => ({ id: r.id, name: r.name, count: r.count }));
  return { added, removed, changed, total: added.length + removed.length + changed.length };
}

// Дата для списку «Мої букети»: сьогодні/вчора з часом, далі число й місяць
export function whenLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  const time = d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Сьогодні, ${time}`;
  if (diff === 1) return `Вчора, ${time}`;
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

// Чи можна зараз повторити склад із рецепта: звіряємо з поточним каталогом.
// Повертає { ok, missing: [назви], reduced: [назви], formatOk } і готовий вибір для каталогу.
export function checkRecipe(recipe, { flowers, formats, settings }) {
  const missing = [];
  const reduced = [];
  const counts = {};
  (recipe.flowers || []).forEach((r) => {
    const f = flowers.find((x) => x.id === r.id);
    if (!f || !f.on || f.stock <= 0) {
      missing.push(r.name);
      return;
    }
    const max = Math.min(f.stock, settings.maxPerType);
    counts[f.id] = Math.min(r.count, max);
    if (r.count > max) reduced.push(r.name);
  });
  const picks = Object.fromEntries((recipe.options || []).map((o) => [o.group, o.id]));
  const fid = recipe.format?.id;
  const choice = getFormatChoice(formats, fid, { [fid]: picks });
  const formatOk =
    Boolean(choice.activeFormat) &&
    choice.activeFormat.id === fid &&
    (recipe.options || []).every((o) => choice.formatGroups.find((g) => g.key === o.group)?.picked.id === o.id);
  return { ok: missing.length === 0 && reduced.length === 0 && formatOk, missing, reduced, formatOk, counts, picks, formatId: fid };
}
