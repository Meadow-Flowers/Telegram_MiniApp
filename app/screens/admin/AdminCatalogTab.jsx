import { Icon, I, Stepper, Toggle, secondaryBtn } from "../../components/ui";
import ZoomPhoto from "../../components/Lightbox";
import { useState } from "react";
import { Sheet } from "../../components/ui";
import CategoryPicker from "../../components/CategoryPicker";

export function AdminCatalogTab({ app }) {
  const {
    categories,
    closeFlowerSheets,
    flowers,
    openEdit,
    removeFlowerPhoto,
    setFlowerPhoto,
    showToast,
    updateFlower,
  } = app;
  const [tab, setTab] = useState("all");
  const [catSheet, setCatSheet] = useState(false);
  const [openId, setOpenId] = useState(null); // розгорнута картка квітки (одна за раз)
  const activeTab = tab === "all" || tab === "none" || categories.some((c) => c.id === tab) ? tab : "all";
  const shown = flowers.filter((f) => activeTab === "all" || (activeTab === "none" ? !f.cat : f.cat === activeTab));
  const tabs = [["all", "Усі"], ...categories.map((c) => [c.id, c.name]), ...(flowers.some((f) => !f.cat) ? [["none", "Без категорії"]] : [])];
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="-mx-4 flex items-center gap-1.5 pl-4">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-1">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={activeTab === key}
              onClick={() => setTab(key)}
              className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold ${
                activeTab === key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Редагувати категорії"
          onClick={() => setCatSheet(true)}
          className="mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white"
        >
          <Icon d={I.edit} size={16} />
        </button>
      </div>
      {catSheet && (
        <Sheet
          title="Категорії"
          onClose={() => {
            setCatSheet(false);
            closeFlowerSheets();
          }}
        >
          <CategoryPicker app={app} value={null} onSelect={() => {}} manageOnly />
        </Sheet>
      )}
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Клієнт не зможе обрати більше, ніж вказано в наявності. При 0 шт квітка автоматично ховається з
        каталогу. Вимкнена квітка не видаляється — її можна ввімкнути знову.
      </p>

      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
        {shown.map((f) => {
          const open = openId === f.id;
          const cat = categories.find((c) => c.id === f.cat);
          const soldOut = f.on && f.stock <= 0; // увімкнена, але 0 шт: клієнт її не бачить
          const dim = f.on ? "" : "opacity-50"; // вимкнену картку притемнюємо замість напису
          return (
            <li key={f.id} className="flex flex-col">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <ZoomPhoto url={f.photo} className={`h-14 w-14 rounded-lg ${dim}`} iconSize={18} onPick={(blob) => setFlowerPhoto(f.id, blob)} onRemove={() => removeFlowerPhoto(f.id)} onError={showToast} />
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : f.id)}
                  className={`min-w-0 flex-1 text-left ${dim}`}
                >
                  <span className="flex items-start gap-1">
                    <span className="break-words text-[15px] font-semibold leading-tight">{f.name}</span>
                    <Icon d={I.chevronDown} size={16} className={`mt-px shrink-0 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`} />
                  </span>
                  <span className="block text-xs">
                    {activeTab === "all" && (
                      <>
                        {cat ? <span className="text-neutral-900">{cat.name}</span> : <span className="text-neutral-400">Без категорії</span>}
                        <span className="text-neutral-400"> · </span>
                      </>
                    )}
                    <span className={soldOut ? "text-red-700" : "text-neutral-600"}>
                      {f.stock} шт{soldOut ? " · немає в наявності" : ""}
                    </span>
                  </span>
                </button>
                <Toggle
                  on={f.on}
                  label={`Показувати ${f.name}`}
                  onClick={() => updateFlower(f.id, { on: !f.on })}
                />
              </div>
              {open && (
                <div className="flex flex-col gap-2.5 border-t border-neutral-100 bg-neutral-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-neutral-600">В наявності, шт</span>
                    <Stepper
                      label={`залишок ${f.name}`}
                      value={f.stock}
                      onDec={() => updateFlower(f.id, { stock: Math.max(0, f.stock - 1) })}
                      onInc={() => updateFlower(f.id, { stock: f.stock + 1 })}
                      decDisabled={f.stock <= 0}
                    />
                  </div>
                  <button type="button" aria-label={`Назва і категорія: ${f.name}`} onClick={() => openEdit(f)} className={`${secondaryBtn} flex items-center justify-center gap-2`}>
                    <Icon d={I.edit} size={16} />
                    Назва і категорія
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
