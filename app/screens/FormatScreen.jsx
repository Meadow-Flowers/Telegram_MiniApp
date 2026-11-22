import { BorderBeam } from "border-beam";
import {
  Icon,
  I,
  Photo,
  ChoiceCard,
  Reveal,
  cellGrid,
  linkBtn,
  primaryBtn,
  secondaryBtn,
} from "../components/ui";

export function FormatScreen({ app }) {
  const {
    activeFormat,
    enabledFormats,
    formatGroups,
    matchingIdx,
    openMatching,
    pickOption,
    sessions,
    setFormat,
    setScreen,
    summary,
  } = app;
  // кожен блок з'являється з невеликою затримкою після попереднього
  let step = 0;
  const next = () => step++ * 70;
  return (
    <div className="flex flex-col gap-6 px-3 pb-6 pt-6">
      <h1 className="t-h1">Формат букета</h1>

      {activeFormat ? (
        <>
          <Reveal as="section" delay={next()} className="flex flex-col gap-3">
            <h2 className="t-h3">
              Формат
              <span className="text-neutral-600"> · {activeFormat.name}</span>
            </h2>
            <div
              className={cellGrid}
              style={{
                gridTemplateColumns: `repeat(${Math.min(enabledFormats.length, 3)}, minmax(0, 1fr))`,
              }}
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
          </Reveal>

          {formatGroups.map((g) => (
            <Reveal
              as="section"
              key={g.key}
              delay={next()}
              className="flex flex-col gap-3"
            >
              <h2 className="t-h3">
                {g.label}
                <span className="text-neutral-600"> · {g.picked.name}</span>
              </h2>
              <div className={`${cellGrid} grid-cols-3`}>
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
            </Reveal>
          ))}
        </>
      ) : (
        <p className="t-body border border-forest p-3 text-neutral-600">
          Сьогодні формати тимчасово недоступні. Спробуйте пізніше.
        </p>
      )}

      <Reveal as="section" delay={next()} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="t-h3">Ваш вибір</h2>
          <button
            type="button"
            className={linkBtn}
            onClick={() => setScreen("catalog")}
          >
            <span className="link-ul">Змінити</span>
          </button>
        </div>
        <ul className="divide-y divide-forest border border-forest">
          {summary.map((r) => (
            <li key={r.id} className="flex items-center gap-3 pr-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden border-r border-forest">
                <Photo url={r.photo} className="card-img h-full w-full" />
              </div>
              <span className="t-title min-w-0 flex-1">{r.name}</span>
              <span className="t-body">×{r.count}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {matchingIdx >= 0 && (
        <Reveal delay={next()}>
          <button
            type="button"
            onClick={openMatching}
            className={`${secondaryBtn} flex h-auto! w-full items-center justify-between gap-3 py-3 text-left`}
          >
            <span>
              <span className="block">Згенеровані варіанти</span>
              <span className="t-caption block normal-case opacity-70">
                {sessions[matchingIdx].variants.length} для цього складу
              </span>
            </span>
            <Icon d={I.next} />
          </button>
        </Reveal>
      )}
    </div>
  );
}

export function FormatFooter({ app }) {
  const { activeFormat, generate, gensLeft, isStaff, settings } = app;
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-forest bg-cream px-3 pb-safe pt-3">
      <span className="t-caption text-center text-neutral-600">
        {isStaff
          ? "Генерації без ліміту (працівник студії)"
          : `Залишилось генерацій сьогодні: ${gensLeft} з ${settings.gensPerDay}`}
      </span>
      {/* Промінь світла переливається всередині кнопки (бібліотека border-beam) */}
      <BorderBeam
        size="md"
        colorVariant="gold"
        theme="dark"
        strength={0.7}
        brightness={1.7}
        saturation={1.4}
        duration={3.6}
        borderRadius={0}
        active={!!activeFormat}
      >
        <button
          type="button"
          className={`${primaryBtn} w-full`}
          disabled={!activeFormat}
          onClick={generate}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <span className="btn-flow" />
          </span>
          <span className="relative">Згенерувати</span>
        </button>
      </BorderBeam>
    </div>
  );
}
