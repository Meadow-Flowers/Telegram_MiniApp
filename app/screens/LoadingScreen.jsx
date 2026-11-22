"use client";

import { useEffect, useRef, useState } from "react";
import { ImageGeneration } from "img-fx";
import FlowingText from "../components/FlowingText";

// Екран генерації. Поки модель малює, у картці безперервно «кипить» піксельна мозаїка (бібліотека img-fx),
// а під нею рядок із назвою квітки, яка перетікає в наступну. Жодних фото під час очікування.
// Коли картинка готова (app.resultImage), мозаїка розсипається у справжній результат, а камера м'яко
// «пірнає» всередину: картка повільно наближається, потім екран розчиняється, і результат осідає
// з легкого збільшення (див. .result-zoom). Наприкінці екран викликає app.finishLoading.
const NAME_MS = 2600; // як часто змінюється назва квітки
const MIN_CHURN_MS = 2600; // мінімум часу мозаїки, навіть якщо картинка (заглушка) готова миттєво
const DIVE_MS = 1000; // тривалість останнього «пірнання» й розчинення
const EASE = "cubic-bezier(0.45, 0, 0.2, 1)";

export function LoadingScreen({ app }) {
  const { formatLabel, summary, resultImage, finishLoading } = app;
  const names = summary.length > 0 ? summary.map((r) => r.name) : ["Букет"];
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState("churn"); // churn → reveal → dive
  const fx = useRef(null);
  const mountedAt = useRef(0);
  const finish = useRef(finishLoading);
  finish.current = finishLoading;

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  // назви квітки одна за одною
  useEffect(() => {
    if (names.length < 2) return;
    const id = setInterval(() => setTick((t) => t + 1), NAME_MS);
    return () => clearInterval(id);
  }, [names.length]);

  // картинка готова: дочекаємось мінімального часу мозаїки й завантаження картинки, тоді мозаїка розсипається в неї
  useEffect(() => {
    if (!resultImage) return;
    let dead = false;
    const timers = [];
    const img = new Image();
    img.crossOrigin = "anonymous";
    const start = () => {
      if (dead) return;
      setPhase("reveal");
      fx.current?.triggerReveal({ hold: "manual" });
      // запасний вихід, якщо подія про завершення чомусь не прийшла
      timers.push(setTimeout(() => !dead && setPhase("dive"), 7000));
    };
    img.onload = () => {
      const wait = Math.max(
        0,
        MIN_CHURN_MS - (performance.now() - mountedAt.current),
      );
      timers.push(setTimeout(start, wait));
    };
    img.onerror = () => !dead && finish.current();
    img.src = resultImage;
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
    };
  }, [resultImage]);

  // «пірнання» закінчилось: переходимо на екран результату
  useEffect(() => {
    if (phase !== "dive") return;
    const id = setTimeout(() => finish.current(), DIVE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  const onCycle = (e) => {
    if (e.phase === "visible") setPhase((p) => (p === "reveal" ? "dive" : p));
  };

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const scale = phase === "churn" ? 1 : phase === "reveal" ? 1.07 : 1.3;
  const cardStyle = reduce
    ? undefined
    : {
        transform: `scale(${scale})`,
        opacity: phase === "dive" ? 0 : 1,
        transition: `transform ${phase === "reveal" ? 3200 : DIVE_MS}ms ${EASE}, opacity ${DIVE_MS}ms ${EASE}`,
        willChange: "transform, opacity",
      };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 overflow-y-auto px-3 py-6 text-center">
      <div className="w-full" style={cardStyle}>
        <ImageGeneration
          ref={fx}
          preset="pixels-organic"
          theme="light"
          images={resultImage ? [resultImage] : []}
          onCycle={onCycle}
          borderRadius={0}
          style={{ display: "block", width: "100%" }}
        >
          <div className="aspect-[4/5] w-full border border-forest bg-surface" />
        </ImageGeneration>
      </div>

      <div
        className="flex flex-col items-center gap-2"
        style={{
          opacity: phase === "churn" ? 1 : 0,
          transition: `opacity 700ms ${EASE}`,
        }}
      >
        <h1 className="t-h2">Генеруємо букет…</h1>
        <FlowingText
          text={names[tick % names.length]}
          className="t-body font-sans uppercase"
        />
        <p className="t-caption text-neutral-600">{formatLabel}</p>
      </div>
    </div>
  );
}
