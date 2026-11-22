import { Icon, I, InfoHead, Stepper, Tabs, Toggle, secondaryBtn } from "../../components/ui";
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
  const tabs = [
    ["all", "Усі"],
    ...categories.map((c) => [c.id, c.name]),
    ...(flowers.some((f) => !f.cat) ? [["none", "Без категорії"]] : []),
  ];
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-stretch">
        <Tabs label="Категорії" items={tabs} value={activeTab} onChange={setTab} className="min-w-0" />
        <button
          type="button"
          aria-label="Редагувати категорії"
          onClick={() => setCatSheet(true)}
          className="-ml-px flex h-11 w-11 shrink-0 items-center justify-center border border-forest bg-transparent active:bg-surface"
        >
          <Icon d={I.edit} />
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
      <InfoHead
        title="Квітки в каталозі"
        info="Клієнт не зможе обрати більше, ніж вказано в наявності. При 0 шт квітка автоматично ховається з каталогу. Вимкнена квітка не видаляється: її можна ввімкнути знову."
      />

      <ul className="divide-y divide-forest border border-forest">
        {shown.map((f) => {
          const open = openId === f.id;
          const cat = categories.find((c) => c.id === f.cat);
          const soldOut = f.on && f.stock <= 0; // увімкнена, але 0 шт: клієнт її не бачить
          const dim = f.on ? "" : "opacity-50"; // вимкнену картку притемнюємо замість напису
          return (
            <li key={f.id} className="flex flex-col">
              <div className="flex items-center gap-3 px-3 py-3">
                <ZoomPhoto
                  url={f.photo}
                  className={`h-20 w-20 ${dim}`}
                  onPick={(blob) => setFlowerPhoto(f.id, blob)}
                  onRemove={() => removeFlowerPhoto(f.id)}
                  onError={showToast}
                />
                <div className={`flex min-w-0 flex-1 flex-col gap-1 ${dim}`}>
                  {/* клікабельна зона розгортання: лише заголовок з іконкою, висота 44 */}
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : f.id)}
                    className="flex min-h-11 w-full items-center gap-2 text-left"
                  >
                    <span className="t-title min-w-0 break-words leading-tight">{f.name}</span>
                    <Icon
                      d={I.chevronDown}
                      className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  <span className="block t-caption">
                    {activeTab === "all" && (
                      <>
                        {cat ? (
                          <span className="text-neutral-900">{cat.name}</span>
                        ) : (
                          <span className="text-neutral-400">Без категорії</span>
                        )}
                        <span className="text-neutral-400"> · </span>
                      </>
                    )}
                    <span className={soldOut ? "text-rust" : "text-neutral-600"}>
                      {f.stock} шт{soldOut ? " · немає в наявності" : ""}
                    </span>
                  </span>
                </div>
                <Toggle on={f.on} label={`Показувати ${f.name}`} onClick={() => updateFlower(f.id, { on: !f.on })} />
              </div>
              {open && (
                <div className="flex flex-col gap-3 bg-surface px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="t-caption text-neutral-600">В наявності, шт</span>
                    <Stepper
                      label={`залишок ${f.name}`}
                      value={f.stock}
                      onDec={() => updateFlower(f.id, { stock: Math.max(0, f.stock - 1) })}
                      onInc={() => updateFlower(f.id, { stock: f.stock + 1 })}
                      decDisabled={f.stock <= 0}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Назва і категорія: ${f.name}`}
                    onClick={() => openEdit(f)}
                    className={`${secondaryBtn} flex items-center justify-center gap-2`}
                  >
                    <Icon d={I.edit} />
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
