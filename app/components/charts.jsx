"use client";

import { useRef, useState } from "react";
import { InfoHead } from "./ui";

// Графіки для вкладки «Статистика». Без бібліотек: чистий SVG і CSS у нашому стилі (гострі кути, лінії 1 px,
// PT Mono для підписів). Ідеї взято з boardui.com: картки з пояснювальним заголовком, плитки з відсотком зміни й міні-графіком,
// лінійний графік із підказкою при наведенні, воронка, теплова карта, смужки. Кольори лише з палітри:
// темно-зелений, охра, пісочний, рожевий; помилка й спад: іржавий.

export const FOREST = "var(--color-forest)";
export const OCHRE = "var(--color-ochre)";
const MONTHS = [
  "січ",
  "лют",
  "бер",
  "кві",
  "тра",
  "чер",
  "лип",
  "сер",
  "вер",
  "жов",
  "лис",
  "гру",
];

export function fmtDay(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Картка графіка: заголовок із «?» (пояснення ховається), праворуч за потреби додатковий елемент
export function ChartCard({ title, info, aside, children }) {
  return (
    <section className="flex flex-col gap-3 border border-forest p-3">
      <div className="flex items-start justify-between gap-3">
        <InfoHead title={title} info={info} className="min-w-0 flex-1" />
        {aside}
      </div>
      {children}
    </section>
  );
}

// Зміна відносно попереднього періоду: «+12%», «−8%», «нове»
export function Delta({ now, prev }) {
  if (prev == null) return null;
  let text;
  let tone;
  if (prev === 0) {
    if (now === 0) return null;
    text = "нове";
    tone = "up";
  } else {
    const pct = Math.round(((now - prev) / prev) * 100);
    if (pct === 0) {
      text = "0%";
      tone = "flat";
    } else {
      text = `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
      tone = pct > 0 ? "up" : "down";
    }
  }
  const cls = {
    up: "bg-sand text-forest",
    down: "bg-blush text-rust",
    flat: "bg-surface text-neutral-600",
  }[tone];
  return (
    <span className={`t-caption inline-flex h-6 items-center px-2 ${cls}`}>
      {text}
    </span>
  );
}

// Міні-графік у плитці: лінія за значеннями (без осей)
export function Sparkline({ values, className = "" }) {
  const n = values.length;
  const max = Math.max(...values, 1);
  const pts = values.map(
    (v, i) => `${n < 2 ? 0 : (i / (n - 1)) * 100},${100 - (v / max) * 88 - 6}`,
  );
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`h-7 w-20 ${className}`}
    >
      {values.every((v) => v === 0) ? (
        <line
          x1="0"
          y1="94"
          x2="100"
          y2="94"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          opacity="0.5"
        />
      ) : (
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength="1"
          className="line-draw"
        />
      )}
    </svg>
  );
}

// Верхня межа осі Y: вдвічі більша за «круглий» крок, щоб середня позначка теж була цілою (4/2, 20/10, 40/20 …)
const STEPS = [
  ...new Set(
    [1, 2, 3, 4, 5, 6, 8, 10]
      .flatMap((b) => [1, 10, 100, 1000].map((p) => b * p))
      .concat([12, 15, 25, 120, 150, 250]),
  ),
].sort((a, b) => a - b);
function niceMax(v) {
  const step = STEPS.find((s) => s * 2 >= v) ?? Math.ceil(v / 2);
  return Math.max(step * 2, 2);
}

// Лінійний графік за днями з областю під головною лінією. series: [{ key, label, color }].
// При наведенні (або дотику) з'являється вертикальна лінія, а над графіком показується день і значення.
export function LineChart({ days, series, height = 160 }) {
  const box = useRef(null);
  const [hover, setHover] = useState(null);
  const n = days.length;
  const max = niceMax(
    Math.max(...series.flatMap((s) => days.map((d) => d[s.key])), 1),
  );
  const x = (i) => (n < 2 ? 50 : (i / (n - 1)) * 100);
  const y = (v) => 100 - (v / max) * 100;
  const point = (e) => {
    const r = box.current.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const shown = hover == null ? null : days[hover];
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <div className="flex flex-col gap-3">
      {/* Легенда: при наведенні показує значення за обраний день, інакше суму за період */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="t-caption text-neutral-600">
          {shown ? fmtDay(shown.d) : "За період"}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span
              key={s.key}
              className="t-caption inline-flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2"
                style={{ background: s.color }}
              />
              {s.label}
              <span className="font-sans">
                {shown
                  ? shown[s.key]
                  : days.reduce((sum, d) => sum + d[s.key], 0)}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {/* Підписи осі Y */}
        <div
          className="t-caption flex shrink-0 flex-col justify-between text-right text-neutral-600"
          style={{ height }}
        >
          <span>{max}</span>
          <span>{max / 2}</span>
          <span>0</span>
        </div>
        <div
          ref={box}
          className="relative min-w-0 flex-1 touch-pan-y"
          style={{ height }}
          onPointerMove={point}
          onPointerDown={point}
          onPointerLeave={() => setHover(null)}
        >
          {/* Горизонтальні лінії сітки */}
          {[0, 50, 100].map((p) => (
            <div
              key={p}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-neutral-300"
              style={{ top: `${p}%` }}
            />
          ))}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {series.map((s, si) => {
              const line = days
                .map((d, i) => `${x(i)},${y(d[s.key])}`)
                .join(" ");
              return (
                <g key={s.key}>
                  {si === 0 && (
                    <polygon
                      points={`0,100 ${line} 100,100`}
                      fill={s.color}
                      fillOpacity="0.1"
                      className="fade-in"
                    />
                  )}
                  <polyline
                    points={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength="1"
                    className="line-draw"
                  />
                </g>
              );
            })}
          </svg>
          {hover != null && (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-forest"
                style={{ left: `${x(hover)}%` }}
              />
              {series.map((s) => (
                <span
                  key={s.key}
                  aria-hidden="true"
                  className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-cream"
                  style={{
                    left: `${x(hover)}%`,
                    top: `${y(days[hover][s.key])}%`,
                    background: s.color,
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
      {/* Підписи осі X: початок, середина, кінець періоду */}
      <div className="t-caption relative ml-[calc(2ch+0.5rem)] flex justify-between text-neutral-600">
        {labelIdx.map((i, k) => (
          <span key={k}>{fmtDay(days[i].d)}</span>
        ))}
      </div>
    </div>
  );
}

const FUNNEL_FILL = [
  "var(--color-forest)",
  "var(--color-neutral-600)",
  "var(--color-ochre)",
  "var(--color-sand)",
];

// Воронка: колонки різної висоти, між ними плавні переходи. Нижче: назва, число, частка від першого кроку.
export function Funnel({ stages }) {
  const n = stages.length;
  const max = Math.max(stages[0]?.value || 0, 1);
  const cw = 100 / (n + (n - 1) * 0.7); // ширина колонки, решта на переходи
  const gap = cw * 0.7;
  const h = (v) => Math.max((v / max) * 100, v > 0 ? 3 : 1.2); // мінімальна висота, щоб нуль не зникав зовсім
  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="fade-in h-32 w-full"
      >
        {stages.map((s, i) => {
          const x0 = i * (cw + gap);
          const hh = h(s.value);
          const top = 50 - hh / 2;
          const next = stages[i + 1];
          const nh = next ? h(next.value) : 0;
          return (
            <g key={s.label}>
              {next && (
                <polygon
                  points={`${x0 + cw},${top} ${x0 + cw + gap},${50 - nh / 2} ${x0 + cw + gap},${50 + nh / 2} ${x0 + cw},${top + hh}`}
                  fill={FUNNEL_FILL[i]}
                  opacity="0.22"
                />
              )}
              <rect
                x={x0}
                y={top}
                width={cw}
                height={hh}
                fill={FUNNEL_FILL[i]}
              />
            </g>
          );
        })}
      </svg>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        {stages.map((s, i) => (
          <div key={s.label} className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0"
                style={{ background: FUNNEL_FILL[i] }}
              />
              <span className="t-caption truncate text-neutral-600">
                {s.label}
              </span>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="t-number">{s.value}</span>
              <span className="t-caption text-neutral-600">
                {Math.round((s.value / max) * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const WEEK_FULL = [
  "понеділок",
  "вівторок",
  "середа",
  "четвер",
  "пʼятниця",
  "субота",
  "неділя",
];

// Теплова карта: дні тижня × блоки по 3 години. Чим темніша клітинка, тим більше генерацій.
export function Heatmap({ heat }) {
  const [cell, setCell] = useState(null);
  const max = Math.max(...heat.flat(), 1);
  const total = heat.flat().reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-col gap-3">
      <span className="t-caption text-neutral-600">
        {cell
          ? `${WEEK_FULL[cell[0]]}, ${String(cell[1] * 3).padStart(2, "0")}:00 – ${String(cell[1] * 3 + 3).padStart(2, "0")}:00 · ${heat[cell[0]][cell[1]]}`
          : `Усього генерацій: ${total}`}
      </span>
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: "1.75rem repeat(8, minmax(0, 1fr))" }}
        onPointerLeave={() => setCell(null)}
      >
        {heat.map((row, di) => (
          <div key={di} className="contents">
            <span className="t-caption flex items-center text-neutral-600">
              {WEEK[di]}
            </span>
            {row.map((v, bi) => (
              <button
                key={bi}
                type="button"
                aria-label={`${WEEK_FULL[di]}, ${bi * 3}:00: ${v}`}
                onPointerEnter={() => setCell([di, bi])}
                onClick={() => setCell([di, bi])}
                className="fade-in h-8"
                style={{
                  background:
                    v === 0
                      ? "var(--color-surface)"
                      : `rgb(41 70 59 / ${0.14 + (v / max) * 0.86})`,
                  outline:
                    cell && cell[0] === di && cell[1] === bi
                      ? "1px solid var(--color-forest)"
                      : "none",
                  outlineOffset: "1px",
                  "--delay": `${(di * 8 + bi) * 12}ms`,
                }}
              />
            ))}
          </div>
        ))}
        <span />
        {Array.from({ length: 8 }, (_, b) => (
          <span key={b} className="t-caption text-neutral-600">
            {b * 3}
          </span>
        ))}
      </div>
    </div>
  );
}

// Горизонтальні смужки: назва, значення, смужка від найбільшого
export function HBars({ items, empty = "Поки немає даних" }) {
  if (items.length === 0)
    return <p className="t-caption text-neutral-600">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it, i) => (
        <li key={it.name} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="t-body min-w-0 truncate">{it.name}</span>
            <span className="t-body shrink-0">{it.count}</span>
          </div>
          <div className="h-2 bg-surface">
            <div
              className="bar-grow h-full bg-forest"
              style={{
                width: `${(it.count / max) * 100}%`,
                "--delay": `${i * 90}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
