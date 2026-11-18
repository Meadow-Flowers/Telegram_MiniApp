import path from "node:path";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { HttpError } from "./errors";

// ================================================================
// Генерація картинки букета. Це ЄДИНЕ місце, яке знає про модель.
// Є два режими: без OPENAI_API_KEY працює заглушка, з ключем викликається
// OpenAI (images/edits). Іншу модель підключаємо, змінюючи лише generateBouquetImage;
// все інше (ліміти, підпис складу, збереження) лишається як є.
// ================================================================

const FONT_DIR = path.join(process.cwd(), "app/lib/server/fonts");
let fontsReady = false;

function ensureFonts() {
  if (fontsReady) return;
  for (const [file, family] of [
    ["roboto-cyrillic-400-normal.woff", "RobotoCyr"],
    ["roboto-latin-400-normal.woff", "RobotoLat"],
    ["roboto-cyrillic-700-normal.woff", "RobotoCyrBold"],
    ["roboto-latin-700-normal.woff", "RobotoLatBold"],
  ]) {
    GlobalFonts.registerFromPath(path.join(FONT_DIR, file), family);
  }
  fontsReady = true;
}

const FONT = (size) => `${size}px RobotoCyr, RobotoLat`;
const FONT_BOLD = (size) => `${size}px RobotoCyrBold, RobotoLatBold`;

// переносить текст по словах під задану ширину
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Заглушка: однотонна картинка з написом. Повертає PNG-буфер 1024×1024.
async function renderStub({ summary, variantNo }) {
  ensureFonts();
  const size = 1024;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const hue = [...summary].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  ctx.fillStyle = `hsl(${hue}, 28%, 88%)`;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#555";
  ctx.textAlign = "center";
  ctx.font = FONT_BOLD(56);
  ctx.fillText("AI-візуалізація букета", size / 2, size / 2 - 20);
  ctx.font = FONT(38);
  ctx.fillText("(заглушка: тут буде картинка від моделі)", size / 2, size / 2 + 40);
  if (variantNo) ctx.fillText(`Варіант ${variantNo}`, size / 2, size / 2 + 100);
  return canvas.toBuffer("image/png");
}

// ---------------- OpenAI (images/edits) ----------------

// OPENAI_IMAGES_URL лише для тестів із підміненим сервером
const OPENAI_URL = process.env.OPENAI_IMAGES_URL || "https://api.openai.com/v1/images/edits";
const MAX_INPUT_IMAGES = 16; // ліміт API
const MAX_FLOWER_IMAGES = 13; // решта місць: форма/папір і колаж стилю
const INPUT_SIDE = 768; // вхідні фото зменшуємо: менше токенів, швидше
const REQUEST_TIMEOUT_MS = 270_000;

// $ за 1 млн токенів (сторінка цін OpenAI, сімейство gpt-image-2.x). Для інших моделей вартість не рахуємо.
const PRICES = { imageIn: 8, textIn: 5, imageOut: 30 };

const FORMAT_EN = { box: "Box", basket: "Basket", wrap: "Wrapped bouquet (paper wrap)" };
const OPTION_EN = { format: "Container", shape: "Shape", shapeChild: "Color", color: "Paper color", form: "Composition shape" };
// Орієнтовні розміри: підігнати за реальними букетами студії
const SIZE_EN = {
  S: "small, about 20-25 cm across",
  M: "medium, about 30-35 cm across",
  L: "large, about 40-45 cm across",
};

async function fetchPhoto(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`photo ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Зменшує фото до INPUT_SIDE по довшій стороні й віддає JPEG
async function downscale(buffer, side = INPUT_SIDE) {
  const img = await loadImage(buffer);
  const k = Math.min(1, side / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const canvas = createCanvas(w, h);
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas.toBuffer("image/jpeg", 85);
}

// Один колаж зі стилю студії (до 4 випадкових референсів): одне фото на вході замість кількох
async function styleCollage(urls) {
  const picked = [...urls].sort(() => Math.random() - 0.5).slice(0, 4);
  const loaded = (
    await Promise.all(
      picked.map(async (u) => {
        try {
          return await loadImage(await fetchPhoto(u));
        } catch (e) {
          console.warn("Референс стилю не завантажено:", e.message);
          return null;
        }
      }),
    )
  ).filter(Boolean);
  if (loaded.length === 0) return null;
  const cols = loaded.length === 1 ? 1 : 2;
  const rows = Math.ceil(loaded.length / cols);
  const cell = loaded.length === 1 ? INPUT_SIDE : INPUT_SIDE / 2;
  const canvas = createCanvas(cols * cell, rows * cell);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  loaded.forEach((img, i) => {
    const side = Math.min(img.width, img.height); // квадратний кадр по центру
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, (i % cols) * cell, Math.floor(i / cols) * cell, cell, cell);
  });
  return canvas.toBuffer("image/jpeg", 85);
}

function fill(template, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.split(`{{${k}}}`).join(v), template);
}

// Підставляє у шаблон із бази дані букета. Плейсхолдери: {{IMAGE_ORDER}}, {{INVENTORY}}, {{FORMAT}},
// {{OPTIONS}}, {{SIZE}}, {{FLOWER_COUNT}}, {{TOTAL_STEMS}}.
function buildPrompt(template, recipe, imageLines) {
  return fill(template, {
    IMAGE_ORDER: imageLines.join("\n"),
    INVENTORY: recipe.flowers.map((f) => `${f.name} — ${f.count} stems`).join("\n"),
    FORMAT: FORMAT_EN[recipe.format.id] || recipe.format.name,
    OPTIONS: recipe.options.map((o) => `${OPTION_EN[o.group] || o.group}: ${o.name}`).join("\n"),
    SIZE: SIZE_EN[recipe.size] || recipe.size,
    FLOWER_COUNT: String(recipe.flowers.length),
    TOTAL_STEMS: String(recipe.total),
  });
}

function providerError(status, body) {
  const code = body?.error?.code;
  console.error("OpenAI:", status, code, body?.error?.message);
  if (code === "moderation_blocked") {
    return new HttpError(422, "Не вдалося створити цей варіант. Спробуйте змінити склад.", "blocked");
  }
  // ключ, бюджет, ліміти, збій: клієнту лише зрозуміле повідомлення
  return new HttpError(503, "Генерації тимчасово недоступні. Спробуйте пізніше.", "unavailable");
}

async function generateWithOpenAI({ recipe, images, promptTemplate }, key) {
  const model = process.env.IMAGE_MODEL || "gpt-image-2.6-sunburst";
  const quality = process.env.IMAGE_QUALITY || "medium";
  if (!promptTemplate) {
    console.error("Немає шаблону промпту: виконайте міграцію 0004 і заповніть settings.image_prompt");
    throw new HttpError(503, "Генерації тимчасово недоступні. Спробуйте пізніше.", "unavailable");
  }
  if (images.flowers.length > MAX_FLOWER_IMAGES) {
    throw new HttpError(400, `Оберіть не більше ${MAX_FLOWER_IMAGES} різних квіток`);
  }

  // Усі фото готуємо паралельно; порядок = порядок підписів у промпті
  const prepare = async (url) => {
    try {
      return await downscale(await fetchPhoto(url));
    } catch (e) {
      console.warn("Фото пропущено:", e.message);
      return null;
    }
  };
  const [flowerBufs, containerBufs, collage] = await Promise.all([
    Promise.all(images.flowers.map((f) => (f.url ? prepare(f.url) : null))),
    Promise.all(images.container.map((c) => prepare(c.url))),
    images.styles.length ? styleCollage(images.styles) : null,
  ]);

  const parts = []; // { buf, line }
  images.flowers.forEach((f, i) => {
    if (flowerBufs[i]) parts.push({ buf: flowerBufs[i], line: `stock photo of "${f.name}" (${f.count} stems)` });
  });
  images.container.forEach((c, i) => {
    if (containerBufs[i]) parts.push({ buf: containerBufs[i], line: `packaging reference: ${OPTION_EN[c.group] || c.group} "${c.label}"` });
  });
  if (collage) parts.push({ buf: collage, line: "collage of finished studio arrangements (style reference only)" });
  if (parts.length === 0 || parts.length > MAX_INPUT_IMAGES) {
    throw new HttpError(503, "Генерації тимчасово недоступні. Спробуйте пізніше.", "unavailable");
  }

  const prompt = buildPrompt(promptTemplate, recipe, parts.map((p, i) => `Image ${i + 1}: ${p.line}`));

  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("quality", quality);
  form.append("n", "1");
  form.append("output_format", "jpeg");
  form.append("output_compression", "90");
  if (process.env.IMAGE_COMPLEXITY) form.append("complexity", process.env.IMAGE_COMPLEXITY);
  parts.forEach((p, i) => form.append("image[]", new Blob([p.buf], { type: "image/jpeg" }), `ref${i + 1}.jpg`));

  let res;
  try {
    res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    console.error("OpenAI недоступний:", e.name, e.message);
    throw new HttpError(503, "Генерації тимчасово недоступні. Спробуйте пізніше.", "unavailable");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw providerError(res.status, body);
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) {
    console.error("OpenAI: порожня відповідь");
    throw new HttpError(503, "Генерації тимчасово недоступні. Спробуйте пізніше.", "unavailable");
  }

  const usage = body.usage || null;
  const d = usage?.input_tokens_details || {};
  const cost =
    usage && /^gpt-image-2/.test(model)
      ? ((d.image_tokens || 0) * PRICES.imageIn + (d.text_tokens || 0) * PRICES.textIn + (usage.output_tokens || 0) * PRICES.imageOut) / 1e6
      : null;
  console.log(`[generate] ${model}:${quality} вхід: фото ${d.image_tokens ?? "?"} + текст ${d.text_tokens ?? "?"}, вихід ${usage?.output_tokens ?? "?"}, ≈ $${cost == null ? "?" : cost.toFixed(4)}`);

  return { image: Buffer.from(b64, "base64"), model: `${model}:${quality}`, usage, cost };
}

// Єдина точка входу. input: { recipe, summary, variantNo, images, promptTemplate }.
// Без OPENAI_API_KEY працює заглушка, щоб додаток можна було розробляти без витрат.
export async function generateBouquetImage(input) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { image: await renderStub(input), model: "stub" };
  return generateWithOpenAI(input, key);
}

// Вписує склад букета під картинку (для «Зберегти фото» й надсилання в соцмережі вручну).
// Застосовується до результату будь-якої моделі. Повертає JPEG.
export async function withCaption(imageBuffer, caption) {
  ensureFonts();
  const base = await loadImage(imageBuffer);
  const width = base.width;
  const pad = Math.round(width * 0.04);
  const fontSize = Math.round(width * 0.036);

  const measure = createCanvas(width, 10).getContext("2d");
  measure.font = FONT(fontSize);
  const lines = wrapLines(measure, caption, width - pad * 2);
  const lineH = Math.round(fontSize * 1.35);
  const stripH = pad * 2 + lines.length * lineH + Math.round(fontSize * 0.9);

  const canvas = createCanvas(width, base.height + stripH);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(base, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, base.height, width, stripH);
  ctx.fillStyle = "#171717";
  ctx.textAlign = "left";
  ctx.font = FONT(fontSize);
  lines.forEach((l, i) => ctx.fillText(l, pad, base.height + pad + fontSize + i * lineH));
  ctx.fillStyle = "#737373";
  ctx.font = FONT(Math.round(fontSize * 0.72));
  ctx.fillText("AI-візуалізація. Фінальний букет може відрізнятися.", pad, base.height + stripH - pad * 0.7);
  return canvas.toBuffer("image/jpeg", 88);
}
