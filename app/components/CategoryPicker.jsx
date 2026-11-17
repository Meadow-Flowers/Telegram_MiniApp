import { Icon, I, secondaryBtn, linkBtn } from "./ui";

// manageOnly — окрема шторка «Категорії»: завжди режим видалення + додавання нової, без перемикача «Готово»
export default function CategoryPicker({ app, value, onSelect, manageOnly = false }) {
  const {
    catDelete,
    catInput,
    catManage,
    categories,
    createCategory,
    deleteCategory,
    flowers,
    setCatDelete,
    setCatInput,
    setCatManage,
  } = app;
  const manage = manageOnly || catManage;
  const delCat = categories.find((c) => c.id === catDelete);
  const delCount = flowers.filter((f) => f.cat === catDelete).length;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Категорія">
      <div className={`items-center justify-between ${manageOnly ? "hidden" : "flex"}`}>
        <span className="text-[13px] text-neutral-600">Категорія</span>
        {categories.length > 0 && (
          <button
            type="button"
            className={`${linkBtn} -my-2.5`}
            onClick={() => {
              setCatManage((m) => !m);
              setCatDelete(null);
              setCatInput(null);
            }}
          >
            {catManage ? "Готово" : "Редагувати категорії"}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {!manage && (
          <button
            type="button"
            aria-pressed={value == null}
            onClick={() => onSelect(null)}
            className={`h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
              value == null ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
            }`}
          >
            Без категорії
          </button>
        )}
        {categories.map((c) =>
          manage ? (
            <button
              key={c.id}
              type="button"
              aria-label={`Видалити категорію ${c.name}`}
              onClick={() => setCatDelete(c.id)}
              className={`flex h-9 items-center gap-1.5 rounded-full border pl-3.5 pr-2.5 text-[13px] font-semibold ${
                catDelete === c.id ? "border-neutral-900 bg-neutral-100" : "border-neutral-400"
              }`}
            >
              {c.name}
              <Icon d={I.close} size={14} />
            </button>
          ) : (
            <button
              key={c.id}
              type="button"
              aria-pressed={value === c.id}
              onClick={() => onSelect(c.id)}
              className={`h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
                value === c.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              {c.name}
            </button>
          ),
        )}
        {(manageOnly || !catManage) && catInput === null && (
          <button
            type="button"
            onClick={() => setCatInput("")}
            className="h-9 rounded-full border border-dashed border-neutral-500 px-3.5 text-[13px] font-semibold"
          >
            + Нова категорія
          </button>
        )}
      </div>
      {manage && !delCat && categories.length > 0 && (
        <p className="text-xs text-neutral-600">Натисніть на категорію, яку хочете видалити.</p>
      )}
      {manage && delCat && (
        <div className="flex flex-col gap-2 rounded-xl bg-neutral-100 p-3">
          <p className="text-[13px] leading-snug">
            Видалити категорію «{delCat.name}»?
            {delCount > 0 ? ` Квіток у ній: ${delCount}. Вони залишаться в каталозі без категорії.` : ""}
          </p>
          <div className="flex gap-2">
            <button type="button" className={`${secondaryBtn} flex-1`} onClick={() => deleteCategory(delCat.id)}>
              Видалити
            </button>
            <button type="button" className={`${secondaryBtn} flex-1`} onClick={() => setCatDelete(null)}>
              Скасувати
            </button>
          </div>
        </div>
      )}
      {(manageOnly || !catManage) && catInput !== null && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createCategory(onSelect)}
            placeholder="Назва категорії"
            aria-label="Назва нової категорії"
            className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 text-[15px] outline-none focus:border-neutral-900"
          />
          <button type="button" className={secondaryBtn} disabled={!catInput.trim()} onClick={() => createCategory(onSelect)}>
            Створити
          </button>
          <button
            type="button"
            aria-label="Скасувати нову категорію"
            onClick={() => setCatInput(null)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <Icon d={I.close} size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
