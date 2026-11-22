"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Photo, Icon, I, primaryBtn, secondaryBtn } from "./ui";
import { resizeImage } from "../lib/image";

const ZOOMS = [1, 2, 3.5]; // кроки збільшення кнопками − і +
const FLY_MS = 700; // скільки летить фото з картки на екран і назад
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const TOP = 72; // зверху лишаємо місце під кнопки

// Повноекранний переглядач фото (за мотивами oakame.com). Фото «відлітає» з картки: її рамка плавно
// розтягується до розміру фото на екрані, а тло заливається кремовим; кнопки проявляються наприкінці.
// Угорі зліва − і + (збільшення, збільшене фото можна тягнути пальцем чи мишею), справа «Закрити».
// Закривається так само: фото повертається в картку. Якщо є дії (в адмінці), вони внизу.
function Viewer({ url, srcImg, actions, onClosed }) {
  const [phase, setPhase] = useState("start"); // start → open → leaving
  const [nat, setNat] = useState(() =>
    srcImg?.naturalWidth
      ? { w: srcImg.naturalWidth, h: srcImg.naturalHeight }
      : null,
  );
  const [view, setView] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  const [from, setFrom] = useState(() =>
    srcImg?.getBoundingClientRect().toJSON(),
  );
  const [zoomIdx, setZoomIdx] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const reduce = useRef(
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  const z = ZOOMS[zoomIdx];

  // розмір оригінального фото, якщо картка ще не встигла його завантажити
  useEffect(() => {
    if (nat) return;
    const im = new Image();
    im.onload = () => setNat({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = url;
  }, [nat, url]);

  useEffect(() => {
    const onResize = () =>
      setView({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // фото відлітає, щойно відомі його розміри (два кадри, щоб браузер встиг намалювати початок)
  useEffect(() => {
    if (!nat || phase !== "start") return;
    let r2;
    const r1 = requestAnimationFrame(
      () => (r2 = requestAnimationFrame(() => setPhase("open"))),
    );
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [nat, phase]);

  const close = () => {
    if (phase === "leaving") return;
    if (srcImg) setFrom(srcImg.getBoundingClientRect().toJSON());
    setZoomIdx(0);
    setPan({ x: 0, y: 0 });
    setPhase("leaving");
    setTimeout(onClosed, reduce.current ? 0 : FLY_MS - 50);
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // де фото стоїть на екрані: усередині вільної області, з пропорціями оригіналу
  const bottom = actions ? 104 : 24;
  const availH = view.h - TOP - bottom;
  let fit = null;
  if (nat) {
    const s = Math.min(view.w / nat.w, availH / nat.h);
    const w = nat.w * s;
    const h = nat.h * s;
    fit = {
      left: (view.w - w) / 2,
      top: TOP + (availH - h) / 2,
      width: w,
      height: h,
    };
  }
  const rect = phase === "open" && fit ? fit : from || fit;

  // межі, за які збільшене фото не можна витягнути (воно не відкриває порожнє тло)
  const clampPan = (x, y, zz) => {
    const cx = fit.left + fit.width / 2;
    const cy = fit.top + fit.height / 2;
    const sw = fit.width * zz;
    const sh = fit.height * zz;
    const lim = (size, center, full) =>
      size >= full ? [full - center - size / 2, size / 2 - center] : [0, 0];
    const [x0, x1] = lim(sw, cx, view.w);
    const [y0, y1] = lim(sh, cy, view.h);
    return {
      x: Math.min(x1, Math.max(x0, x)),
      y: Math.min(y1, Math.max(y0, y)),
    };
  };
  const setZoom = (idx) => {
    const next = Math.max(0, Math.min(ZOOMS.length - 1, idx));
    setZoomIdx(next);
    setPan((p) => (fit ? clampPan(p.x, p.y, ZOOMS[next]) : p));
  };
  const down = (e) => {
    if (z === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
  };
  const move = (e) => {
    if (!drag.current) return;
    setPan(
      clampPan(
        drag.current.px + e.clientX - drag.current.x,
        drag.current.py + e.clientY - drag.current.y,
        z,
      ),
    );
  };
  const up = () => {
    drag.current = null;
    setDragging(false);
  };

  const shown = phase === "open";
  const fly = reduce.current
    ? "none"
    : `left ${FLY_MS}ms ${EASE}, top ${FLY_MS}ms ${EASE}, width ${FLY_MS}ms ${EASE}, height ${FLY_MS}ms ${EASE}`;
  const ui = {
    opacity: shown ? 1 : 0,
    transition: reduce.current
      ? "none"
      : `opacity 400ms ease-out ${shown ? FLY_MS - 250 : 0}ms`,
    pointerEvents: shown ? "auto" : "none",
  };
  const solid = { backgroundColor: "var(--color-cream)" };

  return createPortal(
    <div role="dialog" aria-label="Фото" className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-cream"
        style={{
          opacity: shown ? 1 : 0,
          transition: reduce.current
            ? "none"
            : `opacity ${FLY_MS - 150}ms ease-out`,
        }}
      />

      {rect && (
        <div
          className="absolute"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            transition: fly,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            draggable={false}
            className="h-full w-full select-none object-cover"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${z})`,
              transition:
                dragging || reduce.current ? "none" : `transform 450ms ${EASE}`,
              touchAction: z > 1 ? "none" : "auto",
              cursor: z > 1 ? (dragging ? "grabbing" : "grab") : "default",
            }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
        </div>
      )}

      {/* Верхня панель: збільшення зліва, «Закрити» справа */}
      <div
        className="absolute inset-x-0 top-0 flex items-start justify-between p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]"
        style={ui}
      >
        <div className="flex h-11 border border-forest" style={solid}>
          <button
            type="button"
            aria-label="Зменшити"
            disabled={zoomIdx === 0}
            onClick={() => setZoom(zoomIdx - 1)}
            className="btn-roll btn-secondary flex h-full w-11 items-center justify-center border-r border-forest disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon d={I.minus} />
          </button>
          <button
            type="button"
            aria-label="Збільшити"
            disabled={zoomIdx === ZOOMS.length - 1}
            onClick={() => setZoom(zoomIdx + 1)}
            className="btn-roll btn-secondary flex h-full w-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icon d={I.plus} />
          </button>
        </div>
        <button
          type="button"
          onClick={close}
          className={secondaryBtn}
          style={solid}
        >
          Закрити
        </button>
      </div>

      {actions && (
        <div
          className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-2 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          style={ui}
        >
          {actions}
        </div>
      )}
    </div>,
    document.body,
  );
}

// Фото, яке відкривається на весь екран по тапу. Якщо передано onPick, у переглядачі є «Замінити фото».
export default function ZoomPhoto({
  url,
  className = "",
  imgClassName = "",
  iconSize,
  label = "Відкрити фото",
  onPick,
  onRemove,
  onError,
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const input = useRef(null);
  const btn = useRef(null);
  const srcImg = useRef(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await onPick(await resizeImage(file));
      setOpen(false);
    } catch (ex) {
      onError?.(ex.message);
    } finally {
      setBusy(false);
    }
  }

  // видалення в два тапи, щоб не стерти фото випадково
  async function remove() {
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    setBusy(true);
    try {
      if (await onRemove()) setOpen(false);
    } catch (ex) {
      onError?.(ex.message);
    } finally {
      setBusy(false);
      setConfirmDel(false);
    }
  }

  // без фото: якщо можна додати, тап відкриває вибір файлу
  if (!url && onPick) {
    return (
      <>
        <button
          type="button"
          aria-label="Додати фото"
          onClick={() => input.current?.click()}
          className={`shrink-0 ${className}`}
        >
          <Photo
            url={null}
            className="h-full w-full"
            iconSize={iconSize}
            icon={I.plus}
          />
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={pick}
        />
      </>
    );
  }

  const hasActions = onPick || onRemove;
  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        disabled={!url}
        onClick={() => {
          setConfirmDel(false);
          srcImg.current = btn.current?.querySelector("img") || btn.current;
          setOpen(true);
        }}
        // поки фото «літає» на екрані, картку ховаємо, щоб не було двійника
        style={{ visibility: open ? "hidden" : undefined }}
        className={`relative shrink-0 overflow-hidden ${className}`}
      >
        <Photo
          url={url}
          className={`h-full w-full ${imgClassName}`}
          iconSize={iconSize}
        />
        {/* позначка «фото можна змінити»: тап по фото відкриває переглядач із «Замінити» і «Видалити» */}
        {url && hasActions && (
          <span className="pointer-events-none absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center bg-forest text-cream">
            <Icon d={I.camera} />
          </span>
        )}
      </button>
      {open && (
        <Viewer
          url={url}
          srcImg={srcImg.current}
          onClosed={() => setOpen(false)}
          actions={
            hasActions && (
              <>
                {onPick && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => input.current?.click()}
                    className={`${primaryBtn} px-3`}
                  >
                    {busy ? "Зачекайте…" : "Замінити фото"}
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={remove}
                    className={
                      confirmDel
                        ? "t-button h-12 border border-rust bg-rust px-3 text-cream disabled:opacity-30"
                        : `${secondaryBtn} h-12! px-3`
                    }
                    style={
                      confirmDel
                        ? undefined
                        : { backgroundColor: "var(--color-cream)" }
                    }
                  >
                    {confirmDel ? "Точно видалити?" : "Видалити фото"}
                  </button>
                )}
              </>
            )
          }
        />
      )}
      {onPick && (
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={pick}
        />
      )}
    </>
  );
}
