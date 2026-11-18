import { Icon, I, Photo, ChoiceCard, linkBtn, primaryBtn } from "../components/ui";

export function FormatScreen({ app }) {
  const {
    activeFormat,
    enabledFormats,
    formatGroups,
    pickOption,
    sessionVariants,
    setFormat,
    setScreen,
    summary,
  } = app;
  return (
    <div className="flex flex-col gap-6 p-4">
      {activeFormat ? (
        <>
          <section className="flex flex-col gap-2.5">
            <h2 className="text-[15px] font-semibold">Оберіть формат</h2>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Math.min(enabledFormats.length, 3)}, minmax(0, 1fr))` }}
            >
              {enabledFormats.map((f) => (
                <ChoiceCard
                  key={f.id}
                  label={f.name}
                  photo={f.photo}
                  selected={activeFormat.id === f.id}
                  onClick={() => setFormat(f.id)}
                />
              ))}
            </div>
          </section>

          {formatGroups.map((g) => (
            <section key={g.key} className="flex flex-col gap-2.5">
              <h2 className="text-[15px] font-semibold">
                {g.label}
                <span className="font-normal text-neutral-600"> · {g.picked.name}</span>
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {g.items.map((it) => (
                  <ChoiceCard
                    key={it.id}
                    label={it.name}
                    photo={it.photo}
                    selected={g.picked.id === it.id}
                    onClick={() => pickOption(g.key, it.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      ) : (
        <p className="rounded-2xl bg-neutral-100 p-3.5 text-sm text-neutral-600">
          Сьогодні формати тимчасово недоступні. Спробуйте пізніше.
        </p>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Ваш вибір</h2>
          <button type="button" className={linkBtn} onClick={() => setScreen("catalog")}>
            Змінити
          </button>
        </div>
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
          {summary.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 text-[15px]">
              <Photo url={r.photo} className="h-11 w-11 shrink-0 rounded-lg" iconSize={16} />
              <span className="min-w-0 flex-1">{r.name}</span>
              <span className="font-semibold tabular-nums">×{r.count}</span>
            </li>
          ))}
        </ul>
      </section>

      {sessionVariants.length > 0 && (
        <button
          type="button"
          onClick={() => setScreen("result")}
          className="flex items-center justify-between rounded-2xl border border-neutral-300 p-3.5 text-left"
        >
          <span>
            <span className="block text-[15px] font-semibold">Згенеровані варіанти</span>
            <span className="block text-[13px] text-neutral-600">
              {sessionVariants.length} для цього складу
            </span>
          </span>
          <Icon d={I.next} />
        </button>
      )}
    </div>
  );
}

export function FormatFooter({ app }) {
  const { activeFormat, generate, gensLeft, isStaff, settings } = app;
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <span className="text-center text-xs text-neutral-600">
        {isStaff
          ? "Генерації без ліміту (працівник студії)"
          : `Залишилось генерацій сьогодні: ${gensLeft} з ${settings.gensPerDay}`}
      </span>
      <button type="button" className={primaryBtn} disabled={!activeFormat} onClick={generate}>
        Згенерувати
      </button>
    </div>
  );
}
