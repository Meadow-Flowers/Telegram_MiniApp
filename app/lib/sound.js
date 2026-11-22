// Звук інтерфейсу: тихий м'який «стук» при наведенні (звуку при натисканні немає, його прибрали).
// Файл з soundcn.xyz (набір Kenney, ліцензія CC0): public/sounds/hover.mp3 (Impact Soft Medium 003). Щоб змінити звук, замініть файл.
// Працює через одну пару слухачів на весь документ, тож у кожну кнопку нічого додавати не треба.
// Звук наведення лише для миші (на телефоні наведення немає). Браузер не дає грати звук, доки
// користувач нічого не натиснув, тому перший тік після відкриття сторінки може бути тихим.
const FILES = { hover: "/sounds/hover.mp3" };
const VOLUME = { hover: 0.22 };
const INTERACTIVE =
  'button, a[href], [role="button"], [role="switch"], label, summary, input[type="checkbox"], input[type="file"]';

let ctx = null;
const buffers = {};
let lastHover = null;
let lastHoverAt = 0;

function getContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

async function loadAll() {
  const c = getContext();
  if (!c) return;
  await Promise.all(
    Object.entries(FILES).map(async ([name, url]) => {
      try {
        const res = await fetch(url);
        buffers[name] = await c.decodeAudioData(await res.arrayBuffer());
      } catch {
        /* без звуку додаток працює так само */
      }
    }),
  );
}

function play(name) {
  const c = ctx;
  const buf = buffers[name];
  if (!c || !buf || c.state !== "running") return;
  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buf;
  gain.gain.value = VOLUME[name];
  src.connect(gain).connect(c.destination);
  src.start();
}

function isDisabled(el) {
  return el.disabled || el.getAttribute("aria-disabled") === "true";
}

function enabled() {
  try {
    return localStorage.getItem("sound") !== "off";
  } catch {
    return true;
  }
}

// Підключає слухачі; повертає функцію, що їх знімає
export function installSounds() {
  if (typeof window === "undefined") return () => {};
  loadAll();

  const wake = () =>
    ctx && ctx.state === "suspended" && ctx.resume().catch(() => {});
  const onOver = (e) => {
    if (e.pointerType !== "mouse" || !enabled()) return;
    const el = e.target.closest?.(INTERACTIVE) || null;
    if (el === lastHover) return;
    lastHover = el;
    if (!el || isDisabled(el)) return;
    const now = performance.now();
    if (now - lastHoverAt < 70) return; // щоб при швидкому русі миші не було «тріскотіння»
    lastHoverAt = now;
    play("hover");
  };
  document.addEventListener("pointerdown", wake, true);
  document.addEventListener("keydown", wake, true);
  document.addEventListener("pointerover", onOver, true);
  return () => {
    document.removeEventListener("pointerdown", wake, true);
    document.removeEventListener("keydown", wake, true);
    document.removeEventListener("pointerover", onOver, true);
  };
}
