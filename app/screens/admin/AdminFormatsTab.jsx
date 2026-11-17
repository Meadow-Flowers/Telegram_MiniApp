import { Toggle, linkBtn } from "../../components/ui";
import ZoomPhoto from "../../components/Lightbox";
import ShapeIllustration from "../../components/ShapeIllustration";

export function AdminFormatsTab({ app }) {
  const { formats, openOpt, setOptionPhoto, showToast, updateChild, updateFormat, updateOption } = app;
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Які формати й варіанти бачить клієнт. Варіант не видаляється — його можна вимкнути й ввімкнути
        знову. Якщо вимкнути формат (або форму коробки), усе вкладене в нього ховається від клієнтів, а
        перемикачі всередині стають недоступними. Додавати нові варіанти можна завжди.
      </p>
      {formats.map((fm) => (
        <section key={fm.id} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-3.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-semibold">{fm.name}</div>
              <div className="text-xs text-neutral-600">{fm.on ? "Показується клієнтам" : "Вимкнено"}</div>
            </div>
            <Toggle
              on={fm.on}
              label={`Показувати формат ${fm.name}`}
              onClick={() => updateFormat(fm.id, { on: !fm.on })}
            />
          </div>

          {fm.groups.length === 0 && (
            <p className="text-[13px] leading-relaxed text-neutral-600">
              Додаткових налаштувань немає — клієнт просто обирає «{fm.name}».
            </p>
          )}

          {fm.groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-2 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{g.label}</h3>
                
              </div>

              {!g.childLabel ? (
                <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
                  {g.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                      <ZoomPhoto url={it.photo} className="h-14 w-14 rounded-lg" iconSize={18} onPick={(blob) => setOptionPhoto(it.id, blob)} onError={showToast} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">{it.name}</div>
                        <div className="text-xs text-neutral-600">
                          {!fm.on ? "Прихований: формат вимкнено" : it.on ? "Показується клієнтам" : "Вимкнено"}
                        </div>
                      </div>
                      <Toggle
                        on={it.on}
                        disabled={!fm.on}
                        label={`Показувати ${it.name} (${fm.name}, ${g.label.toLowerCase()})`}
                        onClick={() => updateOption(fm.id, g.key, it.id, { on: !it.on })}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col gap-3">
                  {g.items.map((it) => {
                    const hasColors = it.children.some((c) => c.on);
                    return (
                      <div key={it.id} className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 p-3">
                        <div className="flex items-center gap-3">
                          <ShapeIllustration name={it.name} className="h-14 w-14 shrink-0 rounded-lg" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-semibold">{it.name}</div>
                            <div className="text-xs text-neutral-600">
                              {!fm.on
                                ? "Прихований: формат вимкнено"
                                : !it.on
                                  ? "Вимкнено"
                                  : hasColors
                                    ? "Показується клієнтам"
                                    : "Не показується: немає кольорів"}
                            </div>
                          </div>
                          <Toggle
                            on={it.on}
                            disabled={!fm.on}
                            label={`Показувати форму ${it.name}`}
                            onClick={() => updateOption(fm.id, g.key, it.id, { on: !it.on })}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          

                          {it.children.length === 0 ? (
                            <p className="text-[13px] text-neutral-600">
                              Кольорів поки немає. Додайте хоча б один, щоб форма з’явилась у клієнтів.
                            </p>
                          ) : (
                            <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
                              {it.children.map((c) => (
                                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                                  <ZoomPhoto url={c.photo} className="h-14 w-14 rounded-lg" iconSize={18} onPick={(blob) => setOptionPhoto(c.id, blob)} onError={showToast} />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-[15px] font-semibold">{c.name}</div>
                                    <div className="text-xs text-neutral-600">
                                      {!fm.on
                                        ? "Прихований: формат вимкнено"
                                        : !it.on
                                          ? "Прихований: форму вимкнено"
                                          : c.on
                                            ? "Показується клієнтам"
                                            : "Вимкнено"}
                                    </div>
                                  </div>
                                  <Toggle
                                    on={c.on}
                                    disabled={!fm.on || !it.on}
                                    label={`Показувати колір ${c.name} (${it.name.toLowerCase()} коробка)`}
                                    onClick={() => updateChild(fm.id, g.key, it.id, c.id, { on: !c.on })}
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              className={linkBtn}
                              onClick={() =>
                                openOpt(
                                  fm.id,
                                  g.key,
                                  it.id,
                                  `Новий колір: ${it.name.toLowerCase()}`,
                                  "Наприклад, Рожева",
                                )
                              }
                            >
                              + Додати колір
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end"><button
                  type="button"
                  className={linkBtn}
                  onClick={() =>
                    openOpt(
                      fm.id,
                      g.key,
                      null,
                      `Новий варіант: ${g.label.toLowerCase()}`,
                      `Наприклад, ${g.example || "Рожева"}`,
                    )
                  }
                >
                  {g.childLabel ? "+ Додати форму" : "+ Додати"}
                </button></div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
