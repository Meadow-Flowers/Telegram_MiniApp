import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { checkRecipe, whenLabel } from "../lib/utils";
import { Icon, I, Reveal, primaryBtn, secondaryBtn } from "../components/ui";
import ZoomPhoto from "../components/Lightbox";

// «Мої букети»: останні 20 згенерованих варіантів людини. Склад і дата живуть поруч із фото, а не в картинці:
// наявність квітів міняється, тож її щоразу рахуємо заново за поточним каталогом.
export function MineScreen({ app }) {
  const { flowers, formats, settings, openShare, repeatRecipe, setScreen } = app;
  const [items, setItems] = useState(null); // null = завантажується
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetch("/api/generations")
      .then((d) => alive && setItems(d.generations))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 px-3 pb-6 pt-6">
      <h1 className="t-h1">Мої букети</h1>

      <div className="flex items-start gap-3 bg-sand/60 p-3">
        <Icon d={I.info} className="shrink-0" />
        <p className="t-caption">
          Це AI-візуалізації. Наявність квітів змінюється, тому перед замовленням
          її уточнюйте в студії. Тут зберігаються останні 20 варіантів.
        </p>
      </div>

      {failed && <p className="t-body text-rust">Не вдалося завантажити букети. Спробуйте пізніше.</p>}

      {!failed && items === null && <p className="t-body text-neutral-600">Завантажуємо…</p>}

      {items && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <h2 className="t-h3">Тут з’являться ваші букети</h2>
          <p className="t-body text-neutral-600">Обрані квіти й готові картинки збережуться тут.</p>
          <button type="button" className={primaryBtn} onClick={() => setScreen("catalog")}>
            До каталогу
          </button>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((g, i) => {
            const r = checkRecipe(g.recipe, { flowers, formats, settings });
            const formatName = [g.recipe.format?.name, ...(g.recipe.options || []).map((o) => o.name)]
              .filter(Boolean)
              .join(" · ");
            const issues = [];
            if (r.missing.length) issues.push(`Немає: ${r.missing.join(", ")}`);
            if (r.reduced.length) issues.push(`Менше в наявності: ${r.reduced.join(", ")}`);
            if (!r.formatOk) issues.push("Формат чи колір уже недоступні");
            return (
              <Reveal as="li" key={g.id} delay={i < 4 ? i * 60 : 0} className="flex flex-col border border-forest">
                <div className="flex">
                  <div className="w-[38%] shrink-0 border-r border-forest">
                    {/* тап відкриває фото на весь екран */}
                    <ZoomPhoto
                      url={g.imageUrl}
                      label="Відкрити фото букета на весь екран"
                      className="block aspect-[4/5] w-full"
                      imgClassName="object-cover object-top"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                    <div className="t-caption text-neutral-600">
                      {whenLabel(g.createdAt)}
                      {g.sentToStudio ? " · надіслано студії" : ""}
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {(g.recipe.flowers || []).map((f) => (
                        <li key={f.id} className="flex items-baseline justify-between gap-2">
                          <span className="t-title min-w-0">{f.name}</span>
                          <span className="t-body shrink-0">×{f.count}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="t-caption text-neutral-700">{formatName}</p>
                    <p className={`t-caption ${r.ok ? "text-neutral-600" : "text-rust"}`}>
                      {r.ok ? "Усе є в наявності" : issues.join(". ")}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-forest">
                  <button
                    type="button"
                    onClick={() => openShare({ id: g.id, imageUrl: g.imageUrl })}
                    className={`${secondaryBtn} border-0 border-r`}
                  >
                    Поділитися
                  </button>
                  <button
                    type="button"
                    onClick={() => repeatRecipe(g.recipe)}
                    className={`${secondaryBtn} border-0`}
                  >
                    Повторити склад
                  </button>
                </div>
              </Reveal>
            );
          })}
        </ul>
      )}
    </div>
  );
}
