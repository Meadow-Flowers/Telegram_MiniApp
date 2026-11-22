import { linkBtn } from "./ui";

// Смужка над нижньою кнопкою, поки клієнт змінює склад уже згенерованого букета.
// Показує, скільки змін, і дає «Почати заново». Повернутися до результату можна стрілкою в шапці.
export function EditStrip({ app }) {
  const { draftDiff, formatChanged, startFresh } = app;
  const n = (draftDiff?.total || 0) + (formatChanged ? 1 : 0);
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-forest bg-sand/60 px-3 py-2">
      <div className="min-w-0">
        <div className="t-caption">Ви змінюєте склад готового букета</div>
        <div className="t-caption text-neutral-700">
          {n === 0 ? "Змін поки немає" : `Змін: ${n}`}
        </div>
      </div>
      <button type="button" onClick={startFresh} className={`${linkBtn} shrink-0`}>
        <span className="link-ul">Почати заново</span>
      </button>
    </div>
  );
}
