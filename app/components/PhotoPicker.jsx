"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, I } from "./ui";
import { resizeImage } from "../lib/image";

// Вибір фото в шторці (нова квітка, новий варіант): з галереї або камери.
// Фото зменшується в браузері; файл (Blob) віддаємо через onChange і завантажуємо при збереженні.
export default function PhotoPicker({ value, onChange, onBusy, label = "Завантажити фото" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    onBusy?.(true);
    setError("");
    try {
      onChange(await resizeImage(file));
    } catch (ex) {
      setError(ex.message);
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-28 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl text-sm ${
          preview ? "bg-neutral-200" : "border border-dashed border-neutral-500"
        }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-1.5 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs text-white">
              Натисніть, щоб замінити
            </span>
          </>
        ) : (
          <>
            <Icon d={I.image} size={26} />
            {busy ? "Обробка…" : label}
          </>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
