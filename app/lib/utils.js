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
