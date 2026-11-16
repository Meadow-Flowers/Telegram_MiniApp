import { Icon, I, Photo, Stepper, secondaryBtn, primaryBtn } from "../components/ui";
import { flowersWord } from "../lib/utils";

export function CatalogScreen({ app }) {
  const {
    activeCat,
    available,
    chipCats,
    maxFor,
    q,
    search,
    selection,
    setCatFilter,
    setCount,
    setSearch,
    settings,
    total,
    visible,
  } = app;
  return (
    <div className="flex flex-col gap-3 p-4">
      <label className="relative block">
        <span className="sr-only">Пошук за назвою</span>
        <Icon d={I.search} size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою"
          className="h-11 w-full rounded-xl border border-neutral-300 pl-10 pr-3 text-[15px] outline-none focus:border-neutral-900"
        />
      </label>
      {chipCats.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4" role="group" aria-label="Категорії">
          {[{ id: "all", name: "Усі" }, ...chipCats].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={activeCat === c.id}
              onClick={() => setCatFilter(c.id)}
              className={`h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold ${
                activeCat === c.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <p className="text-[13px] text-neutral-600">
        Не більше {settings.maxPerType} квітів одного виду і {settings.maxTotal} у букеті
      </p>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-neutral-600">
            {available.length === 0 ? "Сьогодні каталог порожній" : "Нічого не знайдено"}
          </p>
          {(q || activeCat !== "all") && (
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                setSearch("");
                setCatFilter("all");
              }}
            >
              Скинути пошук і фільтр
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((f) => {
            const c = selection[f.id] || 0;
            const limit = maxFor(f);
            const totalFull = total >= settings.maxTotal;
            let hint = `В наявності: ${f.stock} шт`;
            if (c > 0 && c >= f.stock) hint = "Більше немає в наявності";
            else if (c > 0 && c >= settings.maxPerType) hint = "Ліміт на один вид";
            else if (totalFull && c === 0) hint = "Букет уже повний";
            return (
              <div
                key={f.id}
                className={`flex flex-col gap-2 rounded-2xl p-2 ${
                  c > 0 ? "border-2 border-neutral-900" : "m-px border border-neutral-200"
                }`}
              >
                <Photo url={f.photo} className="aspect-square w-full rounded-xl" />
                <div className="px-0.5">
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className="text-xs text-neutral-600">{hint}</div>
                </div>
                {c === 0 ? (
                  <button
                    type="button"
                    className={secondaryBtn}
                    disabled={totalFull}
                    onClick={() => setCount(f.id, 1)}
                  >
                    Додати
                  </button>
                ) : (
                  <Stepper
                    dark
                    label={f.name}
                    value={c}
                    onDec={() => setCount(f.id, c - 1)}
                    onInc={() => setCount(f.id, c + 1)}
                    incDisabled={c >= limit || totalFull}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CatalogFooter({ app }) {
  const { format, setScreen, settings, total } = app;
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-neutral-200 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex-1">
        <div className="text-xs text-neutral-600">Обрано</div>
        <div className="text-base font-semibold tabular-nums">
          {total} / {settings.maxTotal} {flowersWord(settings.maxTotal)}
        </div>
      </div>
      <button type="button" className={primaryBtn} disabled={total === 0} onClick={() => setScreen("format")}>
        Далі
      </button>
    </div>
  );
}
