import { Icon, I, Stepper, Sheet, primaryBtn } from "./ui";
import CategoryPicker from "./CategoryPicker";

export function AdminSheets({ app }) {
  const {
    addOpen,
    catManage,
    closeFlowerSheets,
    draft,
    editFlower,
    flowers,
    optDraft,
    saveDraft,
    saveEdit,
    saveOption,
    setDraft,
    setEditFlower,
    setOptDraft,
  } = app;
  return (
    <>
    {addOpen && (
      <Sheet title="Нова квітка" onClose={closeFlowerSheets}>
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, photo: true }))}
          className={`flex h-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-sm ${
            draft.photo ? "bg-neutral-200 text-neutral-700" : "border border-dashed border-neutral-500"
          }`}
        >
          <Icon d={I.image} size={26} />
          {draft.photo ? "Фото завантажено (натисніть, щоб замінити)" : "Завантажити фото квітки"}
        </button>
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
        <button type="button" className={primaryBtn} disabled={!draft.name.trim()} onClick={saveDraft}>
          Додати в каталог
        </button>
      </Sheet>
    )}

    {editFlower && (
      <Sheet title={`Категорія: ${flowers.find((f) => f.id === editFlower.id)?.name ?? ""}`} onClose={closeFlowerSheets}>
        <CategoryPicker app={app} value={editFlower.cat} onSelect={(id) => setEditFlower((e) => ({ ...e, cat: id }))} />
        <button type="button" className={primaryBtn} disabled={catManage} onClick={saveEdit}>
          Зберегти
        </button>
      </Sheet>
    )}

    {optDraft && (
      <Sheet title={optDraft.title} onClose={() => setOptDraft(null)}>
        <button
          type="button"
          onClick={() => setOptDraft((d) => ({ ...d, photo: true }))}
          className={`flex h-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-sm ${
            optDraft.photo ? "bg-neutral-200 text-neutral-700" : "border border-dashed border-neutral-500"
          }`}
        >
          <Icon d={I.image} size={26} />
          {optDraft.photo ? "Фото завантажено (натисніть, щоб замінити)" : "Завантажити фото"}
        </button>
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
        <button type="button" className={primaryBtn} disabled={!optDraft.name.trim()} onClick={saveOption}>
          Додати
        </button>
      </Sheet>
    )}
    </>
  );
}
