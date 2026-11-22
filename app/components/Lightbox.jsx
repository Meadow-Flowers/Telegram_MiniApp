"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Photo, Icon, I, primaryBtnOnDark, secondaryBtnOnDark } from "./ui";
import { resizeImage } from "../lib/image";

// Фото, яке відкривається на весь екран по тапу. Якщо передано onPick, у переглядачі є «Замінити фото».
export default function ZoomPhoto({ url, className = "", imgClassName = "", iconSize, label = "Відкрити фото", onPick, onRemove, onError }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
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
        <button type="button" aria-label="Додати фото" onClick={() => input.current?.click()} className={`shrink-0 ${className}`}>
          <Photo url={null} className="h-full w-full" iconSize={iconSize} icon={I.plus} />
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
        onClick={() => {
          setConfirmDel(false);
          setOpen(true);
        }}
        className={`relative shrink-0 overflow-hidden ${className}`}
      >
        <Photo url={url} className={`h-full w-full ${imgClassName}`} iconSize={iconSize} />
        {/* позначка «фото можна змінити»: тап по фото відкриває переглядач із «Замінити» і «Видалити» */}
        {url && (onPick || onRemove) && (
          <span className="pointer-events-none absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center bg-forest text-cream">
            <Icon d={I.camera} />
          </span>
        )}
      </button>
      {/* Переглядач відкривається поверх усього екрана (через portal у body), щоб не лишалось видно шапку й футер */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-label="Фото"
            className="fixed inset-0 z-[100] flex flex-col bg-black/90 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
            onClick={() => setOpen(false)}
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                aria-label="Закрити"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center bg-cream text-forest"
              >
                <Icon d={I.close} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
            </div>
            {(onPick || onRemove) && (
              <div className="grid grid-cols-2 gap-2 p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
                {onPick && (
                  <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`${primaryBtnOnDark} px-3`}>
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
                        : `${secondaryBtnOnDark} h-12! px-3`
                    }
                  >
                    {confirmDel ? "Точно видалити?" : "Видалити фото"}
                  </button>
                )}
                {onPick && <input ref={input} type="file" accept="image/*" hidden onChange={pick} />}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
