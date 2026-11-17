"use client";

import { useEffect, useRef, useState } from "react";
import { Photo, Icon, I } from "./ui";
import { resizeImage } from "../lib/image";

// Фото, яке відкривається на весь екран по тапу. Якщо передано onPick, у переглядачі є «Замінити фото».
export default function ZoomPhoto({ url, className = "", iconSize, label = "Відкрити фото", onPick, onError }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  // без фото: якщо можна додати, тап відкриває вибір файлу
  if (!url && onPick) {
    return (
      <>
        <button type="button" aria-label="Додати фото" onClick={() => input.current?.click()} className={`shrink-0 ${className}`}>
          <Photo url={null} className="h-full w-full" iconSize={iconSize} />
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        disabled={!url}
        onClick={() => setOpen(true)}
        className={`shrink-0 overflow-hidden ${className}`}
      >
        <Photo url={url} className="h-full w-full" iconSize={iconSize} />
      </button>
      {open && (
        <div role="dialog" aria-label="Фото" className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={() => setOpen(false)}>
          <div className="flex justify-end p-2">
            <button type="button" aria-label="Закрити" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center text-white">
              <Icon d={I.close} size={24} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
          {onPick && (
            <div className="flex justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
                className="h-11 rounded-xl bg-white px-5 text-sm font-semibold disabled:opacity-40"
              >
                {busy ? "Завантаження…" : "Замінити фото"}
              </button>
              <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
