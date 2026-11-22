import {
  Icon,
  I,
  InfoHead,
  Toggle,
  linkBtn,
  secondaryBtn,
} from "../../components/ui";
import { Fragment } from "react";
import ZoomPhoto from "../../components/Lightbox";

// Рядок варіанта: фото, назва зі статусом, перемикач
// off — варіант вимкнено: фото й підпис приглушені (як у вкладці «Каталог»), перемикач лишається яскравим
function OptionRow({
  photo,
  onPick,
  onRemove,
  onError,
  name,
  status,
  toggle,
  off = false,
}) {
  const dim = off ? "opacity-50" : "";
  return (
    <div className="flex items-center gap-3">
      <ZoomPhoto
        url={photo}
        className={`h-20 w-20 ${dim}`}
        onPick={onPick}
        onRemove={onRemove}
        onError={onError}
      />
      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${dim}`}>
        <div className="t-title truncate">{name}</div>
        <div className="t-caption text-neutral-600">{status}</div>
      </div>
      {toggle}
    </div>
  );
}

// ПРАВИЛА БЛОКІВ У ВКЛАДЦІ «ФОРМАТ»
// Кнопки «Додати»: на рівні групи (нова форма, новий варіант) контурна кнопка на всю ширину групи (addBtn);
//   у вкладеному списку (новий колір під формою) ghost-кнопка з підкресленням на відступі вкладення (addNested).
// Вимкнений перемикач згортає все вкладене: вимкнений формат ховає свої групи (форми, кольори, кнопки «Додати»),
//   вимкнена форма ховає свої кольори. Так само для коробки, кошика й упаковки.
// Роздільники: темно-зелена лінія 1 px на всю ширину контейнера (від краю до краю) між групами формату
//   і між блоками, у яких є вкладення (форми з кольорами, а також перед кнопкою «Додати форму»).
//   Між простими рядками без вкладень ліній немає. Відступ над і під лінією по 24 px.
const addBtn = `${secondaryBtn} flex w-full items-center justify-center gap-2`;
const addNested = `${linkBtn} flex items-center gap-2`;
function Divider() {
  return <div className="-mx-3 border-t border-forest" role="separator" />;
}

export function AdminFormatsTab({ app }) {
  const {
    formats,
    openOpt,
    removeFormatPhoto,
    removeOptionPhoto,
    setFormatPhoto,
    setOptionPhoto,
    showToast,
    updateChild,
    updateFormat,
    updateOption,
  } = app;
  return (
    <div className="flex flex-col gap-6 p-3">
      <InfoHead
        title="Формати й варіанти"
        info="Які формати й варіанти бачить клієнт. Варіант не видаляється: його можна вимкнути й ввімкнути знову. Якщо вимкнути формат (або форму коробки), усе вкладене в нього згортається й ховається від клієнтів. Щоб додати новий варіант, спершу ввімкніть формат або форму."
      />
      {formats.map((fm) => (
        <section key={fm.id} className="border border-forest">
          {/* Формат: власний рядок, під ним розділяюча лінія, далі групи варіантів */}
          <div className="p-3">
            <OptionRow
              photo={fm.photo}
              onPick={(blob) => setFormatPhoto(fm.id, blob)}
              onRemove={() => removeFormatPhoto(fm.id)}
              onError={showToast}
              name={fm.name}
              off={!fm.on}
              status={fm.on ? "Показується" : "Вимкнено"}
              toggle={
                <Toggle
                  on={fm.on}
                  label={`Показувати формат ${fm.name}`}
                  onClick={() => updateFormat(fm.id, { on: !fm.on })}
                />
              }
            />
          </div>

          {fm.on && fm.groups.length > 0 && (
            <div className="flex flex-col gap-6 border-t border-forest p-3">
              {fm.groups.map((g, gi) => (
                <Fragment key={g.key}>
                  {gi > 0 && <Divider />}
                  <div className="flex flex-col gap-3">
                    <h3 className="t-h3">{g.label}</h3>

                    <div
                      className={`flex flex-col ${g.childLabel ? "gap-6" : "gap-3"}`}
                    >
                      {g.items.map((it, ii) => {
                        const hasColors = it.children?.some((c) => c.on);
                        const status = !it.on
                          ? "Вимкнено"
                          : g.childLabel && !hasColors
                            ? "Не показується: немає кольорів"
                            : "Показується";
                        return (
                          <Fragment key={it.id}>
                            {g.childLabel && ii > 0 && <Divider />}
                            <div>
                              <OptionRow
                                photo={it.photo}
                                onPick={(blob) => setOptionPhoto(it.id, blob)}
                                onRemove={() => removeOptionPhoto(it.id)}
                                onError={showToast}
                                name={it.name}
                                off={!it.on}
                                status={status}
                                toggle={
                                  <Toggle
                                    on={it.on}
                                    label={`Показувати ${it.name} (${fm.name}, ${g.label.toLowerCase()})`}
                                    onClick={() =>
                                      updateOption(fm.id, g.key, it.id, {
                                        on: !it.on,
                                      })
                                    }
                                  />
                                }
                              />

                              {/* Вкладення форми: кольори. Лінії дерева ідуть від фото форми, див. .tree у globals.css */}
                              {g.childLabel && it.on && (
                                <>
                                  {it.children.length === 0 ? (
                                    <p className="t-caption pl-12 pt-3 text-neutral-600">
                                      Кольорів поки немає. Додайте хоча б один,
                                      щоб форма з’явилась у клієнтів.
                                    </p>
                                  ) : (
                                    <div className="tree">
                                      {it.children.map((c) => (
                                        <div key={c.id} className="tree-item">
                                          <OptionRow
                                            photo={c.photo}
                                            onPick={(blob) =>
                                              setOptionPhoto(c.id, blob)
                                            }
                                            onRemove={() =>
                                              removeOptionPhoto(c.id)
                                            }
                                            onError={showToast}
                                            name={c.name}
                                            off={!c.on}
                                            status={
                                              c.on ? "Показується" : "Вимкнено"
                                            }
                                            toggle={
                                              <Toggle
                                                on={c.on}
                                                label={`Показувати колір ${c.name} (${it.name.toLowerCase()} коробка)`}
                                                onClick={() =>
                                                  updateChild(
                                                    fm.id,
                                                    g.key,
                                                    it.id,
                                                    c.id,
                                                    { on: !c.on },
                                                  )
                                                }
                                              />
                                            }
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="pl-12 pt-3">
                                    <button
                                      type="button"
                                      className={addNested}
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
                                      <Icon d={I.plus} />
                                      <span className="link-ul">
                                        Додати колір
                                      </span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </Fragment>
                        );
                      })}
                      {g.childLabel && g.items.length > 0 && <Divider />}
                    </div>

                    <button
                      type="button"
                      className={addBtn}
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
                      <Icon d={I.plus} />
                      {g.childLabel ? "Додати форму" : "Додати"}
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
