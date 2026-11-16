"use client";

import { useRef, useState } from "react";
import { Photo } from "./ui";
import { resizeImage } from "../lib/image";

// Мініатюра в списках адмінки: натиснули, обрали фото (галерея або камера), воно зберігається.
// onPick отримує зменшений файл; onError показує повідомлення про помилку.
export default function UploadThumb({ url, onPick, onError, label = "Змінити фото", className = "h-12 w-12 rounded-lg" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      await onPick(await resizeImage(file));
    } catch (ex) {
      onError?.(ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        className={`relative shrink-0 overflow-hidden ${className}`}
      >
        <Photo url={url} className="h-full w-full" iconSize={18} />
        <span className="absolute bottom-0 right-0 flex h-[18px] w-[18px] items-center justify-center rounded-tl-md bg-neutral-900 text-[13px] leading-none text-white">
          {busy ? "…" : "+"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </>
  );
}
