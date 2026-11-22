"use client";

import { useRef, useState } from "react";
import { Icon, I, Photo } from "./ui";
import { resizeImage } from "../lib/image";

// Мініатюра в списках адмінки: натиснули, обрали фото (галерея або камера), воно зберігається.
// onPick отримує зменшений файл; onError показує повідомлення про помилку.
export default function UploadThumb({ url, onPick, onError, label = "Змінити фото", className = "h-12 w-12" }) {
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
        <Photo url={url} className="h-full w-full" />
        <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center bg-forest text-cream">
          {busy ? "…" : <Icon d={I.camera} />}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </>
  );
}
