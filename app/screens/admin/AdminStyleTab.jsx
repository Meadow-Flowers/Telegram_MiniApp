import { useRef, useState } from "react";
import { Icon, I, InfoHead, Num, cell, cellGrid } from "../../components/ui";
import ZoomPhoto from "../../components/Lightbox";
import { resizeImage } from "../../lib/image";

const MAX_REFS = 20;
const SIZES = [
  ["small", "малий"],
  ["large", "великий"],
];
// яка група формату описує форму фото: у коробки «shape» (Циліндр, Квадрат, Овал), в упаковки «form» (Круг, Трикутник);
// кошик форм не має
const SHAPE_KEYS = ["shape", "form"];

// Референсні фото робіт студії, окремо для кожного формату, по два в ряд, як у каталозі.
// Тап по фото відкриває його на весь екран (там його можна видалити). Кнопка з олівцем відкриває шторку,
// де позначаємо форму (коробка, упаковка) і розмір (лише упаковка): за ними генерація підбирає шаблон.
export function AdminStyleTab({ app }) {
  const { addStyleRef, formats, refs, removeStyleRef, setStyleEdit, showToast } = app;
  const inputs = useRef({});
  const [busyFormat, setBusyFormat] = useState(null);

  async function pick(formatId, e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (files.length === 0) return;
    setBusyFormat(formatId);
    try {
      for (const file of files) {
        if ((refs[formatId] || []).length >= MAX_REFS) {
          showToast(`Не більше ${MAX_REFS} фото для формату`);
          break;
        }
        await addStyleRef(formatId, await resizeImage(file));
      }
    } catch (ex) {
      showToast(ex.message);
    } finally {
      setBusyFormat(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-3">
      <InfoHead
        title="Референси стилю"
        info="Фото робіт студії. Генерація бере їх як основу й замінює квіти на обрані клієнтом. Тап по фото відкриває його на весь екран, де його можна видалити. Кнопка з олівцем відкриває налаштування: для коробки це форма, для упаковки форма й розмір (малий до 9 квітів, великий від 10)."
      />
      {formats.map((fm) => {
        const list = refs[fm.id] || [];
        const shapes = fm.groups.find((g) => SHAPE_KEYS.includes(g.key))?.items || [];
        const needsSize = fm.id === "wrap"; // розмір обов'язковий лише для упаковки; у коробки й кошика він необов'язковий
        const tagged = shapes.length > 0 || needsSize; // чи є що вимагати (підказки «не розмічено» і «ще немає»)

        // комбінації, під які ще немає жодного фото
        const missing = [];
        if (tagged) {
          (shapes.length ? shapes : [null]).forEach((s) => {
            (needsSize ? SIZES : [[null, ""]]).forEach(([size, sizeName]) => {
              const have = list.some((r) => (!needsSize || r.size === size) && (!s || r.optionId === s.id));
              if (!have) missing.push([s?.name, sizeName].filter(Boolean).join(" · "));
            });
          });
        }
        const isTagged = (r) => (!shapes.length || r.optionId) && (!needsSize || r.size);
        const untagged = tagged ? list.filter((r) => !isTagged(r)).length : 0;
        const shapeName = (r) => shapes.find((s) => s.id === r.optionId)?.name;

        return (
          <section key={fm.id} className="flex flex-col gap-3">
            <h2 className="t-h3">
              {fm.name} · <Num>{list.length}</Num> фото
            </h2>

            {tagged && list.length > 0 && (
              <div className="t-caption flex flex-col gap-1 text-neutral-700">
                {untagged > 0 && <span className="text-rust">Не розмічено: {untagged}</span>}
                {missing.length > 0 ? <span>Ще немає: {missing.join(", ")}</span> : <span>Усі комбінації мають фото</span>}
              </div>
            )}

            <div className={`${cellGrid} grid-cols-2`}>
              {list.map((r, i) => (
                <div key={r.id} className={`${cell} flex min-w-0 flex-col`}>
                  {/* тап по фото відкриває його на весь екран, де є «Видалити фото» */}
                  <ZoomPhoto
                    url={r.url}
                    label={`Відкрити фото ${i + 1}: ${fm.name}`}
                    className="block aspect-[4/5] w-full"
                    badge={false}
                    onRemove={async () => {
                      // видаляємо трохи згодом, щоб переглядач встиг плавно закритись
                      setTimeout(() => removeStyleRef(fm.id, r.id), 400);
                      return true;
                    }}
                    onError={showToast}
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-forest p-1.5 pl-2.5">
                    <span className={`t-caption min-w-0 truncate ${tagged && !isTagged(r) ? "text-rust" : "text-neutral-700"}`}>
                      {tagged && !isTagged(r)
                        ? "Не розмічено"
                        : [shapeName(r), SIZES.find(([k]) => k === r.size)?.[1]].filter(Boolean).join(" · ") || "Без позначок"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Налаштувати фото ${i + 1}: ${fm.name}`}
                      onClick={() => setStyleEdit({ fmtId: fm.id, id: r.id })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center border border-forest transition-colors duration-300 active:bg-surface"
                    >
                      <Icon d={I.edit} />
                    </button>
                  </div>
                </div>
              ))}
              {list.length < MAX_REFS && (
                <>
                  <button
                    type="button"
                    aria-label={`Додати фото: ${fm.name}`}
                    disabled={busyFormat === fm.id}
                    onClick={() => inputs.current[fm.id]?.click()}
                    className={`${cell} flex min-h-24 flex-col items-center justify-center gap-1 text-forest disabled:opacity-40`}
                  >
                    {busyFormat === fm.id ? (
                      <span className="t-caption">Завантажуємо…</span>
                    ) : (
                      <>
                        <Icon d={I.plus} />
                        <span className="t-caption">Додати фото</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={(el) => (inputs.current[fm.id] = el)}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => pick(fm.id, e)}
                  />
                </>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
