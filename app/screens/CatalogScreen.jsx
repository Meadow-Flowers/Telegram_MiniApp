import { Icon, I, Num, Tabs, secondaryBtn, primaryBtn } from "../components/ui";
import CatalogCard from "../components/CatalogCard";
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
    <div className="flex flex-col gap-4 px-3 pb-6 pt-6">
      <h1 className="t-h1">
        Оберіть квіти
      </h1>

      <label className="relative block h-11 border border-forest">
        <span className="sr-only">Пошук за назвою</span>
        <Icon d={I.search} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою"
          className="t-body h-full w-full rounded-none bg-transparent pl-11 pr-12 outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--color-forest)]"
        />
        {search && (
          <button
            type="button"
            aria-label="Очистити пошук"
            onClick={() => setSearch("")}
            className="absolute right-0 top-0 flex h-full w-11 items-center justify-center border-l border-forest bg-transparent"
          >
            <Icon d={I.close} />
          </button>
        )}
      </label>

      {chipCats.length > 0 && (
        <Tabs
          label="Категорії"
          items={[["all", "Усі"], ...chipCats.map((c) => [c.id, c.name])]}
          value={activeCat}
          onChange={setCatFilter}
        />
      )}

      <p className="t-caption text-neutral-600">
        Не більше {settings.maxPerType} квітів одного виду і {settings.maxTotal} у букеті
      </p>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="t-body text-neutral-600">
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
        <div className="grid grid-cols-2 gap-x-0 gap-y-4">
          {visible.map((f, i) => {
            const c = selection[f.id] || 0;
            const limit = maxFor(f);
            const totalFull = total >= settings.maxTotal;
            let warn = null;
            if (c > 0 && c >= f.stock) warn = { text: "Більше немає в наявності" };
            else if (c > 0 && c >= settings.maxPerType) warn = { text: "Ліміт на один вид" };
            else if (totalFull && c === 0) warn = { text: "Букет уже повний" };
            return (
              <CatalogCard
                key={f.id}
                flower={f}
                count={c}
                warn={warn}
                totalFull={totalFull}
                incDisabled={c >= limit || totalFull}
                onSet={(n) => setCount(f.id, n)}
                index={i}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CatalogFooter({ app }) {
  const { setScreen, settings, total } = app;
  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-forest bg-cream px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex-1">
        <div className="t-caption text-neutral-600">Обрано</div>
        <div className="t-title tabular-nums">
          <Num>
            {total} / {settings.maxTotal}
          </Num>{" "}
          {flowersWord(settings.maxTotal)}
        </div>
      </div>
      <button type="button" className={`${primaryBtn} min-w-36`} disabled={total === 0} onClick={() => setScreen("format")}>
        Далі
      </button>
    </div>
  );
}
