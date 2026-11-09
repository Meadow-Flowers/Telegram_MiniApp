import { Icon, I, secondaryBtn, linkBtn, primaryBtn } from "../components/ui";

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
    size,
    summaryText,
  } = app;
  return (
    <div className="flex flex-col gap-3.5 p-4">
      <div className="relative">
        <div
          className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-400 text-neutral-600 ${activeVariant.shade}`}
        >
          <Icon d={I.image} size={48} />
          <span className="text-[15px] font-semibold text-neutral-700">AI-візуалізація букета</span>
          <span className="text-[13px]">Варіант {activeVariant.no}</span>
        </div>
        {sessionVariants.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Попередній варіант"
              disabled={active === 0}
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow disabled:opacity-30"
            >
              <Icon d={I.back} />
            </button>
            <button
              type="button"
              aria-label="Наступний варіант"
              disabled={active >= sessionVariants.length - 1}
              onClick={() => setActive((a) => Math.min(sessionVariants.length - 1, a + 1))}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow disabled:opacity-30"
            >
              <Icon d={I.next} />
            </button>
          </>
        )}
      </div>

      {/* Історія варіантів цього складу */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Варіанти для цього складу</h2>
          <span className="text-[13px] text-neutral-600">
            {active + 1} з {sessionVariants.length}
          </span>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {sessionVariants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={`Варіант ${v.no}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-neutral-700 ${v.shade} ${
                i === active ? "ring-2 ring-neutral-900 ring-offset-2" : ""
              }`}
            >
              №{v.no}
            </button>
          ))}
        </div>
        <button type="button" onClick={generate} className={`${secondaryBtn} flex items-center justify-center gap-2`}>
          <Icon d={I.refresh} size={18} />
          {isStaff
            ? "Згенерувати ще варіант"
            : gensLeft > 0
              ? `Згенерувати ще варіант · залишилось ${gensLeft}`
              : "Ще варіант · ліміт вичерпано"}
        </button>
      </section>

      <div className="flex flex-col gap-1 rounded-2xl border border-neutral-200 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-neutral-600">Склад</span>
          <button type="button" className={`${linkBtn} -my-2.5`} onClick={() => setScreen("catalog")}>
            Змінити склад
          </button>
        </div>
        <span className="text-[15px] font-semibold leading-snug">{summaryText}</span>
        <span className="text-sm text-neutral-700">
          {formatLabel} · розмір {size}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-neutral-600">
        Це AI-візуалізація. Фінальний букет може трохи відрізнятися — кожна квітка унікальна.
      </p>
    </div>
  );
}

export function ResultFooter({ app }) {
  const { activeVariant, setShareOpen, setStats, showToast } = app;
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 bg-white px-4 pb-5 pt-3">
      <button
        type="button"
        className={primaryBtn}
        onClick={() => {
          setStats((s) => ({ ...s, sent: s.sent + 1 }));
          showToast(`Варіант ${activeVariant.no} надіслано студії: фото + склад`);
        }}
      >
        Надіслати студії
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={secondaryBtn} onClick={() => setShareOpen(true)}>
          Поділитися
        </button>
        <button
          type="button"
          className={secondaryBtn}
          onClick={() => showToast(`Варіант ${activeVariant.no} збережено в галерею (зі складом на фото)`)}
        >
          Зберегти фото
        </button>
      </div>
    </div>
  );
}
