import { Icon, I, fieldCls, secondaryBtn, linkBtn } from "./ui";

// manageOnly — окрема шторка «Категорії»: завжди режим видалення + додавання нової, без перемикача «Готово»
// selectOnly — лише вибір зі списку (шторка редагування квітки): без створення й видалення категорій
export default function CategoryPicker({ app, value, onSelect, manageOnly = false, selectOnly = false }) {
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
  const manage = !selectOnly && (manageOnly || catManage);
  const canCreate = !selectOnly && (manageOnly || !catManage);
  const delCat = categories.find((c) => c.id === catDelete);
  const delCount = flowers.filter((f) => f.cat === catDelete).length;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Категорія">
      <div className={`items-center justify-between ${manageOnly ? "hidden" : "flex"}`}>
        <span className="t-caption text-neutral-600">Категорія</span>
        {!selectOnly && categories.length > 0 && (
          <button
            type="button"
            className={`${linkBtn} -my-3`}
            onClick={() => {
              setCatManage((m) => !m);
              setCatDelete(null);
              setCatInput(null);
            }}
          >
            <span className="link-ul">{catManage ? "Готово" : "Редагувати категорії"}</span>
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {!manage && (
          <button
            type="button"
            aria-pressed={value == null}
            onClick={() => onSelect(null)}
            className={`t-button h-11 border border-forest px-4 ${
              value == null ? "bg-forest text-cream" : "bg-transparent"
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
              className={`t-button flex h-11 items-center gap-2 border pl-4 pr-3 ${
                catDelete === c.id ? "border-forest bg-surface" : "border-forest"
              }`}
            >
              {c.name}
              <Icon d={I.close} />
            </button>
          ) : (
            <button
              key={c.id}
              type="button"
              aria-pressed={value === c.id}
              onClick={() => onSelect(c.id)}
              className={`t-button h-11 border border-forest px-4 ${
                value === c.id ? "bg-forest text-cream" : "bg-transparent"
              }`}
            >
              {c.name}
            </button>
          ),
        )}
        {canCreate && catInput === null && (
          <button
            type="button"
            onClick={() => setCatInput("")}
            className="t-button flex h-11 items-center gap-2 border border-dashed border-forest px-4"
          >
            <Icon d={I.plus} />
            Нова категорія
          </button>
        )}
      </div>
      {manage && !delCat && categories.length > 0 && (
        <p className="t-caption text-neutral-600">Натисніть на категорію, яку хочете видалити.</p>
      )}
      {manage && delCat && (
        <div className="flex flex-col gap-2 bg-surface p-3">
          <p className="t-caption leading-snug">
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
      {canCreate && catInput !== null && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createCategory(onSelect)}
            placeholder="Назва категорії"
            aria-label="Назва нової категорії"
            className={`${fieldCls} min-w-0 flex-1`}
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
            <Icon d={I.close} />
          </button>
        </div>
      )}
    </div>
  );
}
