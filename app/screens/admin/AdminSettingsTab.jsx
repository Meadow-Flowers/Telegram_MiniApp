import { Stepper } from "../../components/ui";

export function AdminSettingsTab({ app }) {
  const { settings, updateSettings } = app;
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
      <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-3.5">
        <span className="flex-1 text-[15px] leading-snug">Ціна однієї генерації (для статистики витрат)</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.001"
          defaultValue={settings.generationCost ?? ""}
          placeholder="—"
          aria-label="Ціна однієї генерації"
          onBlur={(e) => {
            const v = e.target.value.trim();
            updateSettings({ generationCost: v === "" ? null : Number(v) });
          }}
          className="h-11 w-24 rounded-xl border border-neutral-300 px-3 text-right text-[15px] outline-none focus:border-neutral-900"
        />
      </label>
    </div>
  );
}
