"use client";

import { useState } from "react";

// Стан інтерфейсу адмінки: вкладка, відкриті шторки, чернетки форм.
// Дані (квітки, категорії, формати) беремо з шару даних, див. useStudioData.
export function useAdminUi({ data, showToast }) {
  const { flowers, categories } = data;

  const [adminTab, setAdminTab] = useState("catalog");
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", stock: 10, photo: null, cat: null });
  const [catInput, setCatInput] = useState(null); // null — поле нової категорії закрите
  const [optDraft, setOptDraft] = useState(null); // { fmt, group, parent, title, placeholder, name, photo } — шторка додавання варіанта формату
  const [editFlower, setEditFlower] = useState(null); // { id, cat } — шторка зміни категорії квітки
  const [catManage, setCatManage] = useState(false); // режим видалення категорій
  const [catDelete, setCatDelete] = useState(null); // id категорії, яку збираються видалити
  const [saving, setSaving] = useState(false); // іде збереження в шторці

  const closeFlowerSheets = () => {
    setAddOpen(false);
    setEditFlower(null);
    setCatInput(null);
    setCatManage(false);
    setCatDelete(null);
  };

  const openAdd = () => {
    closeFlowerSheets();
    setDraft((d) => ({ ...d, cat: categories.some((c) => c.id === d.cat) ? d.cat : (categories[0]?.id ?? null) }));
    setAddOpen(true);
  };

  const openEdit = (f) => {
    closeFlowerSheets();
    setEditFlower({ id: f.id, cat: f.cat });
  };

  const saveDraft = async () => {
    const name = draft.name.trim();
    if (!name || saving) return;
    const cat = categories.some((c) => c.id === draft.cat) ? draft.cat : (categories[0]?.id ?? null);
    setSaving(true);
    const created = await data.addFlower({ name, cat, stock: draft.stock, photo: draft.photo });
    setSaving(false);
    if (!created) return; // помилку вже показано
    setDraft({ name: "", stock: 10, photo: null, cat });
    closeFlowerSheets();
    showToast(`«${name}» додано в каталог`);
  };

  const saveEdit = () => {
    const f = flowers.find((x) => x.id === editFlower.id);
    data.updateFlower(editFlower.id, { cat: editFlower.cat });
    showToast(`«${f?.name}»: категорію змінено`);
    closeFlowerSheets();
  };

  // створює категорію з поля вводу й одразу обирає її через onSelect
  const createCategory = async (onSelect) => {
    const name = (catInput || "").trim();
    if (!name) return;
    const res = await data.addCategory(name);
    if (!res) return;
    onSelect(res.id);
    if (res.created) showToast(`Категорію «${name}» створено`);
    setCatInput(null);
  };

  const deleteCategory = (id) => {
    const cat = categories.find((c) => c.id === id);
    const fallback = categories.find((c) => c.id !== id)?.id ?? null;
    data.removeCategory(id);
    setDraft((d) => (d.cat === id ? { ...d, cat: fallback } : d));
    setEditFlower((e) => (e && e.cat === id ? { ...e, cat: fallback } : e));
    setCatDelete(null);
    showToast(`Категорію «${cat?.name}» видалено`);
  };

  // відкриває шторку додавання варіанта формату (форма, колір, колір конкретної форми)
  const openOpt = (fmtId, groupKey, parent, title, placeholder) =>
    setOptDraft({ fmt: fmtId, group: groupKey, parent, title, placeholder, name: "", photo: null });

  const saveOption = async () => {
    const name = optDraft.name.trim();
    if (!name || saving) return;
    setSaving(true);
    const created = await data.addOption({
      fmt: optDraft.fmt,
      group: optDraft.group,
      parent: optDraft.parent,
      name,
      photo: optDraft.photo,
    });
    setSaving(false);
    if (!created) return;
    setOptDraft(null);
    showToast(`«${name}» додано`);
  };

  return {
    adminTab,
    setAdminTab,
    addOpen,
    draft,
    setDraft,
    catInput,
    setCatInput,
    optDraft,
    setOptDraft,
    editFlower,
    setEditFlower,
    catManage,
    setCatManage,
    catDelete,
    setCatDelete,
    saving,
    closeFlowerSheets,
    openAdd,
    openEdit,
    saveDraft,
    saveEdit,
    createCategory,
    deleteCategory,
    openOpt,
    saveOption,
  };
}
