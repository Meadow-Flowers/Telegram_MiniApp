import { useState } from "react";
import { Icon, I, Stepper } from "../../components/ui";

// Один рядок налаштування: назва з іконкою «?» (пояснення ховається), справа лічильник
function SettingRow({ label, info, value, min, max, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <span className="t-title min-w-0">{label}</span>
          <button
            type="button"
            aria-label={`Пояснення: ${label}`}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="-my-3 flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <Icon d={I.help} />
          </button>
        </div>
        <Stepper
          label={label}
          value={value}
          onDec={() => onChange(Math.max(min, value - 1))}
          onInc={() => onChange(Math.min(max, value + 1))}
          decDisabled={value <= min}
          incDisabled={value >= max}
        />
      </div>
      {open && <p className="t-caption bg-surface p-3 text-neutral-700">{info}</p>}
    </li>
  );
}

export function AdminSettingsTab({ app }) {
  const { settings, updateSettings } = app;
  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Усі налаштування в одному контейнері, між ними одна розділяюча лінія */}
      <ul className="divide-y divide-forest border border-forest">
        <SettingRow
          label="Максимум квітів одного виду"
          info="Скільки квітів одного виду може обрати клієнт. Фактичний максимум для квітки: менше з двох чисел, цей ліміт або залишок у наявності."
          value={settings.maxPerType}
          min={1}
          max={99}
          onChange={(v) => updateSettings({ maxPerType: v })}
        />
        <SettingRow
          label="Максимум квітів у букеті"
          info="Скільки квітів усього може бути в одному букеті."
          value={settings.maxTotal}
          min={1}
          max={199}
          onChange={(v) => updateSettings({ maxTotal: v })}
        />
        <SettingRow
          label="Генерацій на клієнта за добу"
          info="Скільки генерацій на добу доступно клієнту. Працівники студії генерують без ліміту."
          value={settings.gensPerDay}
          min={1}
          max={50}
          onChange={(v) => updateSettings({ gensPerDay: v })}
        />
      </ul>
    </div>
  );
}
