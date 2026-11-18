import { Stepper, Sheet, primaryBtn } from "./ui";
import CategoryPicker from "./CategoryPicker";
import PhotoPicker from "./PhotoPicker";

export function AdminSheets({ app }) {
  const {
    addOpen,
    closeFlowerSheets,
    draft,
    editFlower,
    optDraft,
    saveDraft,
    saveEdit,
    saveOption,
    saving,
    setDraft,
    setEditFlower,
    setOptDraft,
  } = app;
  return (
    <>
    {addOpen && (
      <Sheet title="Нова квітка" onClose={closeFlowerSheets}>
        <PhotoPicker
          value={draft.photo}
          onChange={(blob) => setDraft((d) => ({ ...d, photo: blob }))}
          onBusy={(busy) => setDraft((d) => ({ ...d, photoBusy: busy }))}
          label="Завантажити фото квітки"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-neutral-600">Назва</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Наприклад, Кущова троянда"
            className="h-11 rounded-xl border border-neutral-300 px-3 text-[15px] outline-none focus:border-neutral-900"
          />
        </label>
        <CategoryPicker app={app} value={draft.cat} onSelect={(id) => setDraft((d) => ({ ...d, cat: id }))} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px]">Кількість у наявності, шт</span>
          <Stepper
            label="кількість"
            value={draft.stock}
            onDec={() => setDraft((d) => ({ ...d, stock: Math.max(0, d.stock - 1) }))}
            onInc={() => setDraft((d) => ({ ...d, stock: d.stock + 1 }))}
            decDisabled={draft.stock <= 0}
          />
        </div>
        <button type="button" className={primaryBtn} disabled={!draft.name.trim() || saving || draft.photoBusy} onClick={saveDraft}>
          {saving ? "Зберігаємо…" : "Додати в каталог"}
        </button>
      </Sheet>
    )}

    {editFlower && (
      <Sheet title="Редагувати квітку" onClose={closeFlowerSheets}>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-neutral-600">Назва</span>
          <input
            value={editFlower.name}
            onChange={(e) => setEditFlower((x) => ({ ...x, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && editFlower.name.trim() && saveEdit()}
            aria-label="Назва квітки"
            className="h-11 rounded-xl border border-neutral-300 px-3 text-[15px] outline-none focus:border-neutral-900"
          />
        </label>
        <CategoryPicker selectOnly app={app} value={editFlower.cat} onSelect={(id) => setEditFlower((e) => ({ ...e, cat: id }))} />
        <button type="button" className={primaryBtn} disabled={!editFlower.name.trim()} onClick={saveEdit}>
          Зберегти
        </button>
      </Sheet>
    )}

    {optDraft && (
      <Sheet title={optDraft.title} onClose={() => setOptDraft(null)}>
        <PhotoPicker
          value={optDraft.photo}
          onChange={(blob) => setOptDraft((d) => ({ ...d, photo: blob }))}
          onBusy={(busy) => setOptDraft((d) => ({ ...d, photoBusy: busy }))}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] text-neutral-600">Назва</span>
          <input
            value={optDraft.name}
            onChange={(e) => setOptDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && saveOption()}
            placeholder={optDraft.placeholder}
            className="h-11 rounded-xl border border-neutral-300 px-3 text-[15px] outline-none focus:border-neutral-900"
          />
        </label>
        <button type="button" className={primaryBtn} disabled={!optDraft.name.trim() || saving || optDraft.photoBusy} onClick={saveOption}>
          {saving ? "Зберігаємо…" : "Додати"}
        </button>
      </Sheet>
    )}
    </>
  );
}
