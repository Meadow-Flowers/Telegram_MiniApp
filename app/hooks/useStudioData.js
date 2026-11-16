"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

const DEFAULT_SETTINGS = { maxPerType: 15, maxTotal: 35, gensPerDay: 10, generationCost: null };
const DEFAULT_QUOTA = { used: 0, perDay: 10, unlimited: false };

// Шар даних студії: каталог, категорії, формати, референси стилю, налаштування.
// Дані живуть у базі (Supabase) і приходять через наш сервер (папка app/api).
// Екрани не знають, звідки дані: вони викликають прості функції нижче.
// Зміни показуємо одразу (оптимістично) і зберігаємо на сервері; якщо не вдалось, показуємо
// помилку й перезавантажуємо актуальні дані.
export function useStudioData({ onError } = {}) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [me, setMe] = useState(null);
  const [flowers, setFlowers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formats, setFormats] = useState([]);
  const [refs, setRefs] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [quota, setQuota] = useState(DEFAULT_QUOTA); // скільки генерацій людина зробила сьогодні

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const timers = useRef({});
  const pending = useRef({});

  const fail = (e) => onErrorRef.current?.(e?.message || "Щось пішло не так");

  /* ---------- завантаження ---------- */

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus("loading");
    try {
      const d = await apiFetch("/api/bootstrap");
      setMe(d.me);
      setFlowers(d.flowers);
      setCategories(d.categories);
      setFormats(d.formats);
      setRefs(d.refs);
      setSettings(d.settings);
      setQuota(d.quota);
      setError(null);
      setStatus("ready");
    } catch (e) {
      if (silent) fail(e);
      else {
        setError(e);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  /* ---------- допоміжне ---------- */

  // зберігає зміни з невеликою затримкою: швидкі натискання +/− зливаються в один запит
  const saveLater = (key, patch, send) => {
    pending.current[key] = { ...pending.current[key], ...patch };
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      const merged = pending.current[key];
      delete pending.current[key];
      try {
        await send(merged);
      } catch (e) {
        fail(e);
        load({ silent: true });
      }
    }, 400);
  };

  // виконує запит одразу; при помилці повідомляє й повертає null
  const attempt = async (fn) => {
    try {
      return await fn();
    } catch (e) {
      fail(e);
      return null;
    }
  };

  const upload = (fields, blob) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob, "photo.jpg");
    return apiFetch("/api/admin/photos", { method: "POST", form });
  };

  // змінює список варіантів однієї групи формату (у локальному стані)
  const editGroup = (fmtId, groupKey, fn) =>
    setFormats((fs) =>
      fs.map((f) =>
        f.id !== fmtId
          ? f
          : { ...f, groups: f.groups.map((g) => (g.key !== groupKey ? g : { ...g, items: fn(g.items, g) })) },
      ),
    );

  // змінює варіант за id (форму, колір, колір форми) будь-де в дереві форматів
  const patchOptionById = (id, patch) =>
    setFormats((fs) =>
      fs.map((f) => ({
        ...f,
        groups: f.groups.map((g) => ({
          ...g,
          items: g.items.map((i) => ({
            ...(i.id === id ? { ...i, ...patch } : i),
            ...(i.children ? { children: i.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) } : {}),
          })),
        })),
      })),
    );

  /* ---------- квітки й категорії ---------- */

  const updateFlower = (id, patch) => {
    setFlowers((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    saveLater(`flower:${id}`, patch, (p) => apiFetch(`/api/admin/flowers/${id}`, { method: "PATCH", json: p }));
  };

  // photo — необов'язковий файл (вже зменшений у браузері)
  const addFlower = ({ name, cat, stock, photo }) =>
    attempt(async () => {
      const { flower } = await apiFetch("/api/admin/flowers", { method: "POST", json: { name, cat, stock } });
      let created = flower;
      if (photo) {
        try {
          const { url } = await upload({ kind: "flower", id: flower.id }, photo);
          created = { ...flower, photo: url };
        } catch (e) {
          fail(new Error(`Квітку додано, але фото не завантажилось: ${e.message}`));
        }
      }
      setFlowers((fs) => [...fs, created]);
      return created;
    });

  const setFlowerPhoto = (id, blob) =>
    attempt(async () => {
      const { url } = await upload({ kind: "flower", id }, blob);
      setFlowers((fs) => fs.map((f) => (f.id === id ? { ...f, photo: url } : f)));
      return url;
    });

  // повертає { id, created }; якщо така категорія вже є, повертає наявну
  const addCategory = (name) =>
    attempt(async () => {
      const res = await apiFetch("/api/admin/categories", { method: "POST", json: { name } });
      if (res.created) setCategories((cs) => [...cs, { id: res.id, name: res.name }]);
      return { id: res.id, created: res.created };
    });

  // видалення категорії: її квітки лишаються в каталозі без категорії
  const removeCategory = (id) => {
    setCategories((cs) => cs.filter((c) => c.id !== id));
    setFlowers((fs) => fs.map((f) => (f.cat === id ? { ...f, cat: null } : f)));
    attempt(() => apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" })).then((r) => {
      if (r === null) load({ silent: true });
    });
  };

  /* ---------- формати та їхні варіанти ---------- */

  const updateFormat = (id, patch) => {
    setFormats((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    saveLater(`format:${id}`, patch, (p) => apiFetch(`/api/admin/formats/${id}`, { method: "PATCH", json: p }));
  };

  const saveOptionPatch = (id, patch) =>
    saveLater(`option:${id}`, patch, (p) => apiFetch(`/api/admin/options/${id}`, { method: "PATCH", json: p }));

  const updateOption = (fmtId, groupKey, itemId, patch) => {
    editGroup(fmtId, groupKey, (items) => items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));
    saveOptionPatch(itemId, patch);
  };

  // колір конкретної форми (вкладений варіант)
  const updateChild = (fmtId, groupKey, itemId, childId, patch) => {
    editGroup(fmtId, groupKey, (items) =>
      items.map((i) =>
        i.id !== itemId ? i : { ...i, children: i.children.map((c) => (c.id === childId ? { ...c, ...patch } : c)) },
      ),
    );
    saveOptionPatch(childId, patch);
  };

  // parent — id форми, якщо додаємо колір до неї; інакше додаємо варіант у саму групу
  const addOption = ({ fmt, group, parent, name, photo }) =>
    attempt(async () => {
      const { option } = await apiFetch("/api/admin/options", {
        method: "POST",
        json: { formatId: fmt, groupKey: group, parentId: parent || null, name },
      });
      let created = option;
      if (photo) {
        try {
          const { url } = await upload({ kind: "option", id: option.id }, photo);
          created = { ...option, photo: url };
        } catch (e) {
          fail(new Error(`Варіант додано, але фото не завантажилось: ${e.message}`));
        }
      }
      editGroup(fmt, group, (items) =>
        parent
          ? items.map((i) => (i.id !== parent ? i : { ...i, children: [...i.children, created] }))
          : [...items, created],
      );
      return created;
    });

  const setOptionPhoto = (id, blob) =>
    attempt(async () => {
      const { url } = await upload({ kind: "option", id }, blob);
      patchOptionById(id, { photo: url });
      return url;
    });

  /* ---------- референси стилю ---------- */

  const addStyleRef = (formatId, blob) =>
    attempt(async () => {
      const { ref } = await upload({ kind: "style", formatId }, blob);
      setRefs((r) => ({ ...r, [formatId]: [...(r[formatId] || []), ref] }));
      return ref;
    });

  const removeStyleRef = (formatId, id) => {
    setRefs((r) => ({ ...r, [formatId]: (r[formatId] || []).filter((x) => x.id !== id) }));
    attempt(() => apiFetch(`/api/admin/style-refs/${id}`, { method: "DELETE" })).then((r) => {
      if (r === null) load({ silent: true });
    });
  };

  /* ---------- налаштування ---------- */

  const updateSettings = (patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    saveLater("settings", patch, (p) => apiFetch("/api/admin/settings", { method: "PATCH", json: p }));
  };

  return {
    status,
    error,
    me,
    reload: load,
    flowers,
    categories,
    formats,
    refs,
    settings,
    quota,
    setQuota,
    updateFlower,
    addFlower,
    setFlowerPhoto,
    addCategory,
    removeCategory,
    updateFormat,
    updateOption,
    updateChild,
    addOption,
    setOptionPhoto,
    addStyleRef,
    removeStyleRef,
    updateSettings,
  };
}
