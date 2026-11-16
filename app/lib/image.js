// Зменшує фото перед завантаженням: економить місце в сховищі й трафік.
// Повертає JPEG не більший за maxSize пікселів по довшій стороні.
export async function resizeImage(file, maxSize = 1600, quality = 0.85) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Не вдалося відкрити фото. Спробуйте інший файл (JPEG або PNG).");
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Не вдалося обробити фото");
  return blob;
}
