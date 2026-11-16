import { Icon, I, Stepper, Toggle } from "../../components/ui";
import UploadThumb from "../../components/UploadThumb";

export function AdminCatalogTab({ app }) {
  const {
    categories,
    flowers,
    openEdit,
    setFlowerPhoto,
    showToast,
    updateFlower,
  } = app;
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Клієнт не зможе обрати більше, ніж вказано в наявності. При 0 шт квітка автоматично ховається з
        каталогу. Вимкнена квітка не видаляється — її можна ввімкнути знову.
      </p>

      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        {flowers.map((f) => {
          const visibleForClient = f.on && f.stock > 0;
          return (
            <li key={f.id} className="flex flex-col gap-2 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <UploadThumb url={f.photo} label={`Змінити фото: ${f.name}`} onPick={(blob) => setFlowerPhoto(f.id, blob)} onError={showToast} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{f.name}</div>
                  <div className="text-xs text-neutral-600">
                    {visibleForClient ? "Показується клієнтам" : f.on ? "Немає в наявності (0 шт)" : "Вимкнено"}
                  </div>
                </div>
                <Toggle
                  on={f.on}
                  label={`Показувати ${f.name}`}
                  onClick={() => updateFlower(f.id, { on: !f.on })}
                />
              </div>
              <div className="flex items-center justify-between pl-[60px]">
                <span className="text-[13px] text-neutral-600">Категорія</span>
                <button
                  type="button"
                  aria-label={`Змінити категорію: ${f.name}`}
                  onClick={() => openEdit(f)}
                  className="flex h-11 items-center gap-1 rounded-xl border border-neutral-300 pl-3 pr-2 text-[13px] font-semibold"
                >
                  {categories.find((c) => c.id === f.cat)?.name || "Без категорії"}
                  <Icon d={I.chevronDown} size={16} />
                </button>
              </div>
              <div className="flex items-center justify-between pl-[60px]">
                <span className="text-[13px] text-neutral-600">В наявності, шт</span>
                <Stepper
                  label={`залишок ${f.name}`}
                  value={f.stock}
                  onDec={() => updateFlower(f.id, { stock: Math.max(0, f.stock - 1) })}
                  onInc={() => updateFlower(f.id, { stock: f.stock + 1 })}
                  decDisabled={f.stock <= 0}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
