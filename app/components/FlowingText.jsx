"use client";

import { useEffect, useRef, useState } from "react";

// Рядок, який «перетікає» в наступний: літери по черзі (зліва направо) на мить перетворюються на випадкові
// знаки й осідають у нових. Шрифт у цього блоку моноширинний (PT Mono), тож рядок не стрибає по ширині.
// Рядки вирівнюємо по центру однаковою довжиною, щоб центр лишався на місці.
const GLYPHS = "абвгґдежзийклмнопрстуфхцчшщюяabcdefghijklmnoprstuvwxyz";
const DURATION = 950; // скільки триває перетікання, мс
const WINDOW = 0.38; // скільки часу кожна літера «мерехтить» (частка від тривалості)

function center(str, len) {
  const left = Math.floor((len - str.length) / 2);
  return " ".repeat(left) + str + " ".repeat(len - str.length - left);
}

export default function FlowingText({ text, className = "" }) {
  const [shown, setShown] = useState(text);
  const prev = useRef(text);

  useEffect(() => {
    const from = prev.current;
    prev.current = text;
    if (from === text) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    const len = Math.max(from.length, text.length);
    const a = center(from, len);
    const b = center(text, len);
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      let out = "";
      for (let i = 0; i < len; i++) {
        const s = (i / Math.max(1, len - 1)) * (1 - WINDOW); // коли ця літера починає мерехтіти
        if (t < s) out += a[i];
        else if (t < s + WINDOW)
          out +=
            a[i] === " " && b[i] === " "
              ? " "
              : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += b[i];
      }
      setShown(out);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setShown(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <span className={className}>
      {/* для скрінрідерів: просто поточна назва; анімований рядок для них прихований */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="whitespace-pre">
        {shown}
      </span>
    </span>
  );
}
