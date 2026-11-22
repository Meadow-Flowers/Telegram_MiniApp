"use client";

import { Stepper, useReveal } from "./ui";
import ZoomPhoto from "./Lightbox";

// Картка квітки в каталозі: фото, під ним табличка з назвою й кількістю в наявності, а під карткою
// кнопка «Додати» (76% ширини). Коли квітку додано, кнопка перетворюється на лічильник.
// Картки в ряду стоять впритул і мають ОДНАКОВУ ширину: рамка малюється окремим шаром поверх картки
// (а не border), і в правої картки цей шар зсунутий на 1 px вліво, щоб лінія між картками була спільна.
// Так фото й таблички лівої та правої карток завжди збігаються по висоті.
export default function CatalogCard({
  flower: f,
  count: c,
  was,
  warn,
  totalFull,
  incDisabled,
  onSet,
  index = 0,
}) {
  const [ref, seen] = useReveal();
  const right = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`reveal zoom-card flex min-w-0 flex-col ${seen ? "is-in" : ""}`}
      style={{ "--delay": `${(index % 2) * 90}ms` }}
    >
      <div className="relative flex flex-1 flex-col">
        <ZoomPhoto
          url={f.photo}
          label={`Відкрити фото: ${f.name}`}
          className="aspect-[4/5] w-full"
          imgClassName="card-img"
        />
        {c > 0 && (
          <span className="t-button pointer-events-none absolute left-0 top-0 bg-forest px-2 py-1 text-cream">
            ×{c}
          </span>
        )}

        {/* Табличка: назва, нижче кількість. Квадрат лише в правому верхньому куті: ліворуч текст, а внизу
            під табличкою кнопка зі своїми квадратами. */}
        <div className="corners cn-tr flex flex-1 flex-col gap-1 border-t border-forest p-3">
          <div className="t-title">{f.name}</div>
          <div
            className={`t-caption ${warn ? "text-rust" : "text-neutral-600"}`}
          >
            {warn ? warn.text : `В наявності: ${f.stock}`}
          </div>
          {/* режим зміни складу: чим картка відрізняється від готового букета */}
          {was !== undefined && was !== c && (
            <div className="t-caption text-rust">
              {was === 0 ? "Нова в букеті" : c === 0 ? `Прибрано, було ×${was}` : `Було ×${was}`}
            </div>
          )}
        </div>

        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 border border-forest ${right ? "-left-px" : "left-0"}`}
        />
      </div>

      {/* Кнопка під карткою: не на всю ширину, але майже. Її верхня й ліва лінії збігаються з лініями картки
          (-mt-px піднімає на товщину лінії, у правої картки -ml-px, бо її рамка виступає на 1 px вліво),
          тож лінія ніде не накладається на лінію й не стає товщою. */}
      <div className={`-mt-px w-[76%] ${right ? "-ml-px" : ""}`}>
        {c === 0 ? (
          <button
            type="button"
            disabled={totalFull}
            onClick={() => onSet(1)}
            className="t-button btn-roll btn-primary corners cn-all flex h-11 w-full border border-forest items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
          >
            Додати
          </button>
        ) : (
          <Stepper
            label={f.name}
            value={c}
            onDec={() => onSet(c - 1)}
            onInc={() => onSet(c + 1)}
            incDisabled={incDisabled}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}
