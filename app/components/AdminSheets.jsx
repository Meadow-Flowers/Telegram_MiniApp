import { Stepper, Sheet, fieldCls, primaryBtn } from "./ui";
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
    formats,
    refs,
    setStyleEdit,
    styleEdit,
    updateStyleRef,
  } = app;
  const styleFmt = styleEdit && formats.find((f) => f.id === styleEdit.fmtId);
  const styleRef = styleEdit && (refs[styleEdit.fmtId] || []).find((r) => r.id === styleEdit.id);
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
          <label className="flex flex-col gap-2">
            <span className="t-caption text-neutral-600">Назва</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Наприклад, Кущова троянда"
              className={fieldCls}
            />
          </label>
          <CategoryPicker app={app} value={draft.cat} onSelect={(id) => setDraft((d) => ({ ...d, cat: id }))} />
          <div className="flex items-center justify-between gap-3">
            <span className="t-body">Кількість у наявності, шт</span>
            <Stepper
              label="кількість"
              value={draft.stock}
              onDec={() => setDraft((d) => ({ ...d, stock: Math.max(0, d.stock - 1) }))}
              onInc={() => setDraft((d) => ({ ...d, stock: d.stock + 1 }))}
              decDisabled={draft.stock <= 0}
            />
          </div>
          <button
            type="button"
            className={primaryBtn}
            disabled={!draft.name.trim() || saving || draft.photoBusy}
            onClick={saveDraft}
          >
            {saving ? "Зберігаємо…" : "Додати в каталог"}
          </button>
        </Sheet>
      )}

      {editFlower && (
        <Sheet title="Редагувати квітку" onClose={closeFlowerSheets}>
          <label className="flex flex-col gap-2">
            <span className="t-caption text-neutral-600">Назва</span>
            <input
              value={editFlower.name}
              onChange={(e) => setEditFlower((x) => ({ ...x, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && editFlower.name.trim() && saveEdit()}
              aria-label="Назва квітки"
              className={fieldCls}
            />
          </label>
          <CategoryPicker
            selectOnly
            app={app}
            value={editFlower.cat}
            onSelect={(id) => setEditFlower((e) => ({ ...e, cat: id }))}
          />
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
          <label className="flex flex-col gap-2">
            <span className="t-caption text-neutral-600">Назва</span>
            <input
              value={optDraft.name}
              onChange={(e) => setOptDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && saveOption()}
              placeholder={optDraft.placeholder}
              className={fieldCls}
            />
          </label>
          <button
            type="button"
            className={primaryBtn}
            disabled={!optDraft.name.trim() || saving || optDraft.photoBusy}
            onClick={saveOption}
          >
            {saving ? "Зберігаємо…" : "Додати"}
          </button>
        </Sheet>
      )}

      {/* Налаштування референсного фото: форма (коробка, упаковка) і розмір (лише упаковка) */}
      {styleEdit && styleFmt && styleRef && (
        <Sheet title="Налаштування фото" onClose={() => setStyleEdit(null)}>
          <StyleSheetBody fmt={styleFmt} photo={styleRef} onChange={(patch) => updateStyleRef(styleFmt.id, styleRef.id, patch)} onDone={() => setStyleEdit(null)} />
        </Sheet>
      )}
    </>
  );
}

// Вміст шторки «Налаштування фото». Зміни зберігаються одразу, «Готово» лише закриває шторку.
function StyleSheetBody({ fmt, photo, onChange, onDone }) {
  const shapeGroup = fmt.groups.find((g) => g.key === "shape" || g.key === "form");
  const shapes = shapeGroup?.items || [];
  const sizes = [["small", "Малий"], ["large", "Великий"]];
  // в упаковки розмір обов'язковий, у коробки й кошика необов'язковий: просто допомагає підібрати фото під кількість квітів
  const sizeRequired = fmt.id === "wrap";
  const chip = (on) =>
    `t-caption h-10 border border-forest px-3 transition-colors duration-300 ${on ? "bg-forest text-cream" : "bg-transparent active:bg-surface"}`;
  return (
    <>
      {shapes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="t-caption text-neutral-600">Форма</span>
          <div className="flex flex-wrap gap-2">
            {shapes.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={photo.optionId === s.id}
                className={chip(photo.optionId === s.id)}
                onClick={() => onChange({ optionId: photo.optionId === s.id ? null : s.id })}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="t-caption text-neutral-600">{sizeRequired ? "Розмір" : "Розмір (необов'язково)"}</span>
          <div className="flex flex-wrap gap-2">
            {sizes.map(([key, name]) => (
              <button
                key={key}
                type="button"
                aria-pressed={photo.size === key}
                className={chip(photo.size === key)}
                onClick={() => onChange({ size: photo.size === key ? null : key })}
              >
                {name}
              </button>
            ))}
          </div>
          <span className="t-caption text-neutral-600">
            Малий: букет до 9 квітів, великий: від 10.
            {!sizeRequired && " Якщо розмір вказано, великі букети отримають велику коробку, а малі малу."}
          </span>
        </div>
      )}
      <button type="button" className={primaryBtn} onClick={onDone}>
        Готово
      </button>
    </>
  );
}
