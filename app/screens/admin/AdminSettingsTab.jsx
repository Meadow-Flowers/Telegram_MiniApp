import { Stepper, secondaryBtn } from "../../components/ui";

export function AdminSettingsTab({ app }) {
  const { setClientGens, settings, showToast, updateSettings } = app;
  return (
    <div className="flex flex-col gap-3 p-4">
      {[
        ["maxPerType", "Максимум квітів одного виду", 1, 99],
        ["maxTotal", "Максимум квітів у букеті", 1, 199],
        ["gensPerDay", "Генерацій на клієнта за добу", 1, 50],
      ].map(([key, label, min, max]) => (
        <div key={key} className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3.5">
          <span className="flex-1 text-[15px] leading-snug">{label}</span>
          <Stepper
            label={label}
            value={settings[key]}
            onDec={() => updateSettings({ [key]: Math.max(min, settings[key] - 1) })}
            onInc={() => updateSettings({ [key]: Math.min(max, settings[key] + 1) })}
            decDisabled={settings[key] <= min}
            incDisabled={settings[key] >= max}
          />
        </div>
      ))}
      <p className="text-[13px] leading-relaxed text-neutral-600">
        Скільки квітів одного виду може обрати клієнт — менше з двох чисел: залишок цієї квітки або ліміт
        вище. Працівники студії генерують без ліміту. Місячний бюджет у грошах налаштовується в кабінеті
        сервісу моделі.
      </p>
      <button
        type="button"
        className={secondaryBtn}
        onClick={() => {
          setClientGens(0);
          showToast("Лічильник генерацій клієнта скинуто");
        }}
      >
        Скинути денний лічильник (для тесту)
      </button>
    </div>
  );
}
