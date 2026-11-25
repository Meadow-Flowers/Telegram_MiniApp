import { useRef, useState } from "react";
import { Icon, I, InfoHead, Num, Toggle } from "../../components/ui";
import ZoomPhoto from "../../components/Lightbox";
import { resizeImage } from "../../lib/image";

const MAX_REFS = 20;
const SIZES = [
  ["small", "Малий"],
  ["large", "Великий"],
];
// яка група формату описує форму фото: у коробки «shape» (Циліндр, Квадрат, Овал), в упаковки «form» (Круг, Трикутник);
// кошик форм не має
const SHAPE_KEYS = ["shape", "form"];

// Кнопка-позначка: натиснута залита, повторне натискання знімає вибір
function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`t-caption h-9 border border-forest px-3 transition-colors duration-300 ${on ? "bg-forest text-cream" : "bg-transparent active:bg-surface"}`}
    >
      {children}
    </button>
  );
}

// Референсні фото робіт студії, окремо для кожного формату. До кожного фото позначаємо розмір і форму:
// за ними генерація підбирає шаблон під вибір клієнта. «Не використовувати» прибирає фото з генерації.
export function AdminStyleTab({ app }) {
  const { addStyleRef, formats, refs, removeStyleRef, showToast, updateStyleRef } = app;
  const inputs = useRef({});
  const [busyFormat, setBusyFormat] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // id фото, яке збираються видалити (видалення в два тапи)

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
        info="Фото робіт студії. Генерація бере їх як основу й замінює квіти на обрані клієнтом. Позначте для кожного фото розмір і форму: малий — букет до 9 квітів, великий — від 10. «Не використовувати» вимикає фото (ціни, написи, обличчя)."
      />
      {formats.map((fm) => {
        const list = refs[fm.id] || [];
        const shapeGroup = fm.groups.find((g) => SHAPE_KEYS.includes(g.key));
        const shapes = shapeGroup?.items || [];
        const active = list.filter((r) => !r.skip);

        // чого ще бракує: комбінації «форма + розмір», під які немає жодного фото
        const missing = [];
        (shapes.length ? shapes : [null]).forEach((s) => {
          SIZES.forEach(([size, sizeName]) => {
            const have = active.some((r) => r.size === size && (!s || r.optionId === s.id));
            if (!have) missing.push(s ? `${s.name} · ${sizeName.toLowerCase()}` : sizeName.toLowerCase());
          });
        });
        const untagged = active.filter((r) => !r.size || (shapes.length > 0 && !r.optionId)).length;

        return (
          <section key={fm.id} className="flex flex-col gap-3">
            <h2 className="t-h3">
              {fm.name} · <Num>{list.length}</Num> фото
            </h2>

            {list.length > 0 && (
              <div className="t-caption flex flex-col gap-1 text-neutral-700">
                {untagged > 0 && <span className="text-rust">Не розмічено: {untagged}</span>}
                {missing.length > 0 ? <span>Ще немає: {missing.join(", ")}</span> : <span>Усі комбінації мають фото</span>}
              </div>
            )}

            <ul className="flex flex-col gap-3">
              {list.map((r, i) => (
                <li key={r.id} className="flex border border-forest">
                  <div className={`w-[36%] shrink-0 border-r border-forest ${r.skip ? "opacity-50" : ""}`}>
                    {/* тап по фото відкриває його на весь екран */}
                    <ZoomPhoto
                      url={r.url}
                      label={`Відкрити фото ${i + 1}: ${fm.name}`}
                      className="block aspect-[4/5] w-full"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="t-caption text-neutral-600">Розмір</span>
                      <div className="flex flex-wrap gap-1.5">
                        {SIZES.map(([size, name]) => (
                          <Chip
                            key={size}
                            on={r.size === size}
                            onClick={() => updateStyleRef(fm.id, r.id, { size: r.size === size ? null : size })}
                          >
                            {name}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {shapes.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="t-caption text-neutral-600">Форма</span>
                        <div className="flex flex-wrap gap-1.5">
                          {shapes.map((s) => (
                            <Chip
                              key={s.id}
                              on={r.optionId === s.id}
                              onClick={() => updateStyleRef(fm.id, r.id, { optionId: r.optionId === s.id ? null : s.id })}
                            >
                              {s.name}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="t-caption">Не використовувати</span>
                      <Toggle
                        on={Boolean(r.skip)}
                        label={`Не використовувати фото ${i + 1}: ${fm.name}`}
                        onClick={() => updateStyleRef(fm.id, r.id, { skip: !r.skip })}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDel !== r.id) {
                          setConfirmDel(r.id);
                          return;
                        }
                        setConfirmDel(null);
                        removeStyleRef(fm.id, r.id);
                      }}
                      onBlur={() => setConfirmDel((c) => (c === r.id ? null : c))}
                      className={`t-caption flex h-9 items-center justify-center gap-1.5 border px-3 ${
                        confirmDel === r.id ? "border-rust bg-rust text-cream" : "border-forest"
                      }`}
                    >
                      <Icon d={I.close} size={16} />
                      {confirmDel === r.id ? "Точно видалити?" : "Видалити фото"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {list.length < MAX_REFS && (
              <>
                <button
                  type="button"
                  aria-label={`Додати фото: ${fm.name}`}
                  disabled={busyFormat === fm.id}
                  onClick={() => inputs.current[fm.id]?.click()}
                  className="t-button flex h-12 items-center justify-center gap-2 border border-dashed border-forest disabled:opacity-40"
                >
                  {busyFormat === fm.id ? (
                    "Завантажуємо…"
                  ) : (
                    <>
                      <Icon d={I.plus} />
                      Додати фото
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
          </section>
        );
      })}
    </div>
  );
}
