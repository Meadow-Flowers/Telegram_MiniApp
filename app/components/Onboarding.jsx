"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, I, Photo, linkBtn, primaryBtn } from "./ui";

// Знайомство для нового клієнта: три екрани з 3D-картками на справжніх фото студії.
// Показується один раз (ознака в localStorage); для перегляду відкрийте додаток із ?onboarding=1.

const KEY = "mf-onboarded-v1";

export function shouldShowOnboarding() {
  try {
    if (new URLSearchParams(window.location.search).has("onboarding")) return true;
    return !localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

const SLIDES = [
  {
    title: "Оберіть квіти",
    text: "Беріть квіти з каталогу студії: бачите, що є в наявності, і самі обираєте кількість.",
  },
  {
    title: "Налаштуйте формат",
    text: "Коробка, кошик або упаковка. Форму й колір обираєте за фото, а розмір підбирається сам.",
  },
  {
    title: "Отримайте букет",
    text: "AI збере візуалізацію з ваших квітів. Сподобалось: надішліть студії, і далі все узгодимо в особистих повідомленнях.",
  },
];

// Картка з фото й підписом. Розташування й глибину задають змінні --z, --rz і звичайні left/top/width.
function Card({ photo, label, style, mark, delay = 0 }) {
  return (
    <div className="ob-card ob-in" style={{ ...style, animationDelay: `${delay}ms` }}>
      <div className="relative overflow-hidden">
        <Photo url={photo} className="aspect-[4/5] w-full" />
        {mark && (
          <span className="ob-pop absolute right-0 top-0 flex h-8 w-8 items-center justify-center bg-forest text-cream">
            <Icon d={I.check} />
          </span>
        )}
      </div>
      {label && (
        <div className="ob-pop t-button border-t border-forest bg-cream px-2 py-1.5 text-center text-[13px]">
          <span className="block truncate">{label}</span>
        </div>
      )}
    </div>
  );
}

function Stage({ slide, flowerPhotos, flowerNames, formats, works }) {
  if (slide === 0) {
    return (
      <>
        <Card photo={flowerPhotos[0]} label={flowerNames[0]} delay={0} style={{ left: "2%", top: "14%", width: "40%", "--z": "10px", "--rz": "-7deg" }} />
        <Card photo={flowerPhotos[2]} label={flowerNames[2]} delay={120} style={{ right: "2%", top: "10%", width: "40%", "--z": "10px", "--rz": "6deg" }} />
        <Card photo={flowerPhotos[1]} label={flowerNames[1]} delay={60} mark style={{ left: "29%", top: "26%", width: "42%", "--z": "70px", "--rz": "0deg" }} />
      </>
    );
  }
  if (slide === 1) {
    const f = formats.slice(0, 3);
    const pos = [
      { left: "1%", top: "22%", "--z": "0px", "--rz": "-3deg" },
      { left: "34%", top: "12%", "--z": "60px", "--rz": "0deg" },
      { right: "1%", top: "22%", "--z": "0px", "--rz": "3deg" },
    ];
    return (
      <>
        {f.map((x, i) => (
          <Card key={x.id} photo={x.photo} label={x.name} delay={i * 80} mark={i === 1} style={{ ...pos[i], width: "31%" }} />
        ))}
      </>
    );
  }
  // третій екран: роботи студії з вкладки «Стиль», до двох фото з кожної категорії (головні великі, другі поменше позаду)
  const main = works.slice(0, 3);
  const mainPos = [
    { left: "2%", top: "12%", width: "36%", "--z": "20px", "--rz": "-6deg" },
    { left: "30%", top: "4%", width: "40%", "--z": "80px", "--rz": "0deg" },
    { right: "2%", top: "12%", width: "36%", "--z": "20px", "--rz": "6deg" },
  ];
  const extra = works.slice(3, 6);
  const extraPos = [
    { left: "6%", top: "65%", width: "26%", "--z": "-10px", "--rz": "-4deg" },
    { left: "37%", top: "69%", width: "26%", "--z": "0px", "--rz": "0deg" },
    { right: "6%", top: "65%", width: "26%", "--z": "-10px", "--rz": "4deg" },
  ];
  return (
    <>
      {extra.map((w, i) => (
        <Card key={`e${i}`} photo={w.url} delay={220 + i * 80} style={extraPos[i]} />
      ))}
      {main.map((w, i) => (
        <Card key={`m${i}`} photo={w.url} label={w.label} delay={i * 100} style={mainPos[i]} />
      ))}
    </>
  );
}

export function Onboarding({ app, onDone }) {
  const { available, enabledFormats, refs } = app;
  const [i, setI] = useState(0);
  const tiltRef = useRef(null);
  const drag = useRef(null);

  const withPhoto = available.filter((f) => f.photo);
  const pool = withPhoto.length ? withPhoto : available;
  const pick = (n) => pool[n % Math.max(pool.length, 1)];
  const flowerPhotos = [0, 1, 2].map((n) => pick(n)?.photo);
  const flowerNames = [0, 1, 2].map((n) => pick(n)?.name);
  // роботи студії зі вкладки «Стиль»: спершу по одному фото з кожної категорії, потім другі фото
  const groups = enabledFormats
    .map((f) => ({ label: f.name, photos: (refs?.[f.id] || []).filter((r) => r.url) }))
    .filter((g) => g.photos.length);
  const works = [
    ...groups.map((g) => ({ url: g.photos[0].url, label: g.label })),
    ...groups.filter((g) => g.photos[1]).map((g) => ({ url: g.photos[1].url })),
  ];
  // якщо референсів ще немає, показуємо квіти з каталогу
  if (!works.length) flowerPhotos.slice(0, 3).forEach((u, i) => u && works.push({ url: u, label: flowerNames[i] }));

  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    onDone();
  };
  const go = (n) => setI(Math.max(0, Math.min(SLIDES.length - 1, n)));

  // нахил сцени за пальцем або мишею
  const tilt = (e) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(x * 22).toFixed(1)}deg`);
    el.style.setProperty("--rx", `${(-y * 16).toFixed(1)}deg`);
  };
  const untilt = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.classList.remove("is-dragging");
  };

  return (
    <div role="dialog" aria-label="Знайомство з додатком" className="absolute inset-0 z-40 flex flex-col bg-cream">
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <span className="t-caption text-neutral-600">
          {i + 1} / {SLIDES.length}
        </span>
        <button type="button" onClick={finish} className={linkBtn}>
          <span className="link-ul">Пропустити</span>
        </button>
      </div>

      {/* Сцена: нахил і свайп вбік */}
      <div
        className="ob-stage relative flex min-h-0 flex-1 touch-pan-y select-none items-center justify-center py-2"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, id: e.pointerId };
          tiltRef.current?.classList.add("is-dragging");
          tilt(e);
        }}
        onPointerMove={tilt}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && Math.abs(e.clientX - d.x) > 50) go(i + (e.clientX < d.x ? 1 : -1));
          untilt();
        }}
        onPointerLeave={() => {
          drag.current = null;
          untilt();
        }}
      >
        <div ref={tiltRef} className="ob-tilt relative h-full max-h-[460px] max-w-[92%]" style={{ aspectRatio: "5 / 6" }}>
          <div className="ob-float absolute inset-0">
            <div key={i} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              <Stage slide={i} flowerPhotos={flowerPhotos} flowerNames={flowerNames} formats={enabledFormats} works={works} />
            </div>
          </div>
        </div>
      </div>

      <div key={`t${i}`} className="ob-in flex shrink-0 flex-col gap-2 px-3 pb-3 pt-4">
        <h2 className="t-h1">{SLIDES[i].title}</h2>
        <p className="t-body text-neutral-700">{SLIDES[i].text}</p>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-forest px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {SLIDES.map((_, n) => (
            <span key={n} className={`h-2.5 w-2.5 border border-forest ${n === i ? "bg-forest" : ""}`} />
          ))}
        </div>
        <button type="button" className={`${primaryBtn} ml-auto min-w-36`} onClick={() => (i === SLIDES.length - 1 ? finish() : go(i + 1))}>
          {i === SLIDES.length - 1 ? "Почати" : "Далі"}
        </button>
      </div>
    </div>
  );
}
