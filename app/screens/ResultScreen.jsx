import {
  Icon,
  I,
  Reveal,
  secondaryBtn,
  linkBtn,
  primaryBtn,
} from "../components/ui";

export function ResultScreen({ app }) {
  const {
    active,
    activeVariant,
    formatLabel,
    generate,
    gensLeft,
    isStaff,
    sessionVariants,
    setActive,
    setScreen,
    summary,
  } = app;
  // квадратні кнопки-стрілки на фото, у тому ж стилі, що кнопка «ще варіант»
  const arrow =
    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-forest bg-cream transition-colors duration-300 active:bg-surface disabled:opacity-30";
  return (
    <div className="flex flex-col gap-6 px-3 pb-6 pt-6">
      <h1 className="t-h1">Ваш букет</h1>

      <div className="relative border border-forest">
        <div className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeVariant.id}
            src={activeVariant.imageUrl}
            alt={`Варіант ${activeVariant.no}`}
            className="result-zoom block w-full bg-surface"
          />
        </div>
        {sessionVariants.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Попередній варіант"
              disabled={active === 0}
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              className={`${arrow} left-2`}
            >
              <Icon d={I.back} />
            </button>
            <button
              type="button"
              aria-label="Наступний варіант"
              disabled={active >= sessionVariants.length - 1}
              onClick={() =>
                setActive((a) => Math.min(sessionVariants.length - 1, a + 1))
              }
              className={`${arrow} right-2`}
            >
              <Icon d={I.next} />
            </button>
          </>
        )}
      </div>

      {/* Історія варіантів цього складу */}
      <Reveal as="section" delay={60} className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="t-h3">Варіанти для цього складу</h2>
          <span className="t-caption text-neutral-600">
            {active + 1} з {sessionVariants.length}
          </span>
        </div>
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 py-1">
          {sessionVariants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={`Варіант ${v.no}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border border-forest bg-surface transition-[outline-offset] duration-300 ${
                i === active
                  ? "outline outline-2 outline-offset-2 outline-forest"
                  : "outline outline-2 outline-offset-0 outline-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.imageUrl}
                alt=""
                className="h-full w-full object-cover object-top"
              />
              <span className="t-caption absolute bottom-0 left-0 bg-cream px-2 leading-4">
                №{v.no}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={generate}
          className={`${secondaryBtn} flex items-center justify-center gap-2`}
        >
          <Icon d={I.refresh} />
          {isStaff
            ? "Ще варіант"
            : gensLeft > 0
              ? `Ще варіант · залишилось ${gensLeft}`
              : "Ще варіант · ліміт вичерпано"}
        </button>
      </Reveal>

      <Reveal
        as="section"
        delay={120}
        className="flex flex-col gap-3 border border-forest p-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="t-h3">Склад</h2>
          <button
            type="button"
            className={`${linkBtn} -my-3`}
            onClick={() => setScreen("catalog")}
          >
            <span className="link-ul">Змінити склад</span>
          </button>
        </div>
        {/* склад у стовпчик: назва зліва, кількість навпроти */}
        <ul className="flex flex-col gap-1">
          {summary.map((r) => (
            <li
              key={r.id}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="t-title min-w-0">{r.name}</span>
              <span className="t-body shrink-0">×{r.count}</span>
            </li>
          ))}
        </ul>
        <p className="t-body border-t border-neutral-300 pt-3 text-neutral-700">
          {formatLabel}
        </p>
      </Reveal>

      {/* Застереження: м'який жовтий блок із іконкою, щоб привернути увагу */}
      <Reveal delay={180} className="flex items-start gap-3 bg-sand/60 p-3">
        <Icon d={I.warning} className="shrink-0" />
        <p className="t-caption">
          Це AI-візуалізація. Фінальний букет може трохи відрізнятися, адже
          кожна квітка унікальна.
        </p>
      </Reveal>
    </div>
  );
}

export function ResultFooter({ app }) {
  const { actionBusy, savePhoto, sendToStudio, shareVariant } = app;
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-forest bg-cream px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        className={primaryBtn}
        disabled={actionBusy}
        onClick={sendToStudio}
      >
        Надіслати студії
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={secondaryBtn}
          disabled={actionBusy}
          onClick={shareVariant}
        >
          Поділитися
        </button>
        <button type="button" className={secondaryBtn} onClick={savePhoto}>
          Зберегти фото
        </button>
      </div>
    </div>
  );
}
