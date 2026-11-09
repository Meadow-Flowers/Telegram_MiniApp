"use client";

import { useState } from "react";
import {
  INITIAL_CATEGORIES,
  INITIAL_FLOWERS,
  INITIAL_FORMATS,
  INITIAL_REFS,
  INITIAL_SETTINGS,
} from "../lib/data";

// Шар даних студії: каталог, категорії, формати, референси стилю, налаштування.
// Зараз усе живе в пам'яті сторінки. Коли підключимо базу (Supabase), міняється лише
// цей файл: екрани викликають ті самі функції й не знають, звідки беруться дані.
export function useStudioData() {
  const [flowers, setFlowers] = useState(INITIAL_FLOWERS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [formats, setFormats] = useState(INITIAL_FORMATS);
  const [refs, setRefs] = useState(INITIAL_REFS);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  /* ---------- квітки й категорії ---------- */

  const updateFlower = (id, patch) => setFlowers((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addFlower = ({ name, cat, stock }) =>
    setFlowers((fs) => [...fs, { id: `n${Date.now()}`, name, cat, stock: Math.max(0, stock), on: true }]);

  // повертає категорію; якщо така назва вже є — наявну (created: false)
  const addCategory = (name) => {
    const exist = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (exist) return { id: exist.id, created: false };
    const id = `c${Date.now()}`;
    setCategories((cs) => [...cs, { id, name }]);
    return { id, created: true };
  };

  // видалення категорії: її квітки лишаються в каталозі без категорії
  const removeCategory = (id) => {
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setFlowers((fs) => fs.map((f) => (f.cat === id ? { ...f, cat: null } : f)));
  };

  /* ---------- формати та їхні варіанти ---------- */

  const updateFormat = (id, patch) => setFormats((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  // змінює список варіантів однієї групи формату
  const editGroup = (fmtId, groupKey, fn) =>
    setFormats((fs) =>
      fs.map((f) =>
        f.id !== fmtId
          ? f
          : { ...f, groups: f.groups.map((g) => (g.key !== groupKey ? g : { ...g, items: fn(g.items, g) })) },
      ),
    );

  const updateOption = (fmtId, groupKey, itemId, patch) =>
    editGroup(fmtId, groupKey, (items) => items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));

  // колір конкретної форми (вкладений варіант)
  const updateChild = (fmtId, groupKey, itemId, childId, patch) =>
    editGroup(fmtId, groupKey, (items) =>
      items.map((i) =>
        i.id !== itemId ? i : { ...i, children: i.children.map((c) => (c.id === childId ? { ...c, ...patch } : c)) },
      ),
    );

  // parent — id форми, якщо додаємо колір до неї; інакше додаємо варіант у саму групу
  const addOption = ({ fmt, group, parent, name }) => {
    const id = `o${Date.now()}`;
    editGroup(fmt, group, (items, g) =>
      parent
        ? items.map((i) => (i.id !== parent ? i : { ...i, children: [...i.children, { id, name, on: true }] }))
        : [...items, { id, name, on: true, ...(g.childLabel ? { children: [] } : {}) }],
    );
  };

  return {
    flowers,
    categories,
    formats,
    refs,
    setRefs,
    settings,
    setSettings,
    updateFlower,
    addFlower,
    addCategory,
    removeCategory,
    updateFormat,
    updateOption,
    updateChild,
    addOption,
  };
}
