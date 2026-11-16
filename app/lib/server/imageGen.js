import path from "node:path";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

// ================================================================
// Генерація картинки букета. Це ЄДИНЕ місце, яке знає про модель.
// Зараз тут заглушка. Коли оберемо Gemini або GPT-модель, міняємо лише
// функцію generateBouquetImage; все інше (ліміти, підпис складу, збереження)
// лишається як є.
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

// Тут з'явиться виклик моделі. input: усе, що модель має знати
// (рецепт, фото квітів і форм, референси стилю), див. buildRecipe і docs у CLAUDE.md.
export async function generateBouquetImage(input) {
  return { image: await renderStub(input), model: "stub" };
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
