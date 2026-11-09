"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VARIANT_SHADES } from "../lib/data";
import { getFormatChoice, sizeFor } from "../lib/utils";
import { useStudioData } from "../hooks/useStudioData";
import { useAdminUi } from "../hooks/useAdminUi";
import { Icon, I } from "./ui";
import { ShareDialog } from "./ShareDialog";
import { AdminSheets } from "./AdminSheets";
import { CatalogScreen, CatalogFooter } from "../screens/CatalogScreen";
import { FormatScreen, FormatFooter } from "../screens/FormatScreen";
import { LoadingScreen } from "../screens/LoadingScreen";
import { ResultScreen, ResultFooter } from "../screens/ResultScreen";
import { LimitScreen } from "../screens/LimitScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { AdminFooter } from "../screens/admin/AdminFooter";

const TITLES = {
  catalog: "Каталог на сьогодні",
  format: "Формат букета",
  loading: "Генерація",
  result: "Ваш букет",
  limit: "Ліміт генерацій",
  admin: "Адмінка",
};

// Каркас прототипу: тримає стан клієнтського флоу (вибір квітів, формат, варіанти, ліміт),
// збирає всі значення в `app` і роздає їх екранам. Самі екрани лежать у папці screens.
export default function Prototype() {
  // роль у прототипі (у реальному додатку визначається за Telegram ID)
  const [role, setRole] = useState("client");
  const isStaff = role === "staff";

  const [screen, setScreen] = useState("catalog"); // catalog | format | loading | result | limit | admin
  const [counts, setCounts] = useState({});
  const [format, setFormat] = useState("box");
  const [fmtPick, setFmtPick] = useState({}); // вибір клієнта всередині формату: { box: { shape: id, color: id } }
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  // варіанти генерації в межах поточного складу
  const [variants, setVariants] = useState([]);
  const [variantsSig, setVariantsSig] = useState("");
  const [active, setActive] = useState(0);
  const [nextVariantNo, setNextVariantNo] = useState(1);

  const [clientGens, setClientGens] = useState(0);
  const [stats, setStats] = useState({ gens: 0, sent: 0, limitHits: 0, shared: 0 });

  const [toast, setToast] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const toastTimer = useRef(null);
  const genTimer = useRef(null);
  const contentRef = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(genTimer.current);
    },
    [],
  );

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };

  // дані студії й стан адмінки
  const data = useStudioData();
  const admin = useAdminUi({ data, showToast });
  const { flowers, categories, formats, settings } = data;

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [screen, admin.adminTab]);

  /* ---------- похідні значення ---------- */

  const available = useMemo(() => flowers.filter((f) => f.on && f.stock > 0), [flowers]);

  // максимум для позиції = менше з (залишок у студії, ліміт одного виду)
  const maxFor = (f) => Math.min(f.stock, settings.maxPerType);

  // фактичний вибір: обрізаний під поточні залишки (якщо адмін їх змінив)
  const selection = useMemo(() => {
    const out = {};
    available.forEach((f) => {
      const c = Math.min(counts[f.id] || 0, Math.min(f.stock, settings.maxPerType));
      if (c > 0) out[f.id] = c;
    });
    return out;
  }, [available, counts, settings.maxPerType]);

  const total = Object.values(selection).reduce((a, b) => a + b, 0);
  const summary = available.filter((f) => selection[f.id]).map((f) => ({ name: f.name, count: selection[f.id] }));
  const summaryText = summary.map((r) => `${r.name} ×${r.count}`).join(", ");
  const size = sizeFor(total);

  // формат: показуємо лише ввімкнені; всередині — лише ввімкнені варіанти (форма, колір)
  const { enabledFormats, activeFormat, formatGroups, formatLabel, formatSig } = getFormatChoice(
    formats,
    format,
    fmtPick,
  );
  const sig = `${formatSig}|${summary.map((r) => r.name + r.count).join(",")}`;

  const pickOption = (groupKey, id) =>
    setFmtPick((p) => ({ ...p, [activeFormat.id]: { ...p[activeFormat.id], [groupKey]: id } }));

  const sessionVariants = variantsSig === sig ? variants : [];
  const gensLeft = Math.max(0, settings.gensPerDay - clientGens);
  const canGenerate = isStaff || gensLeft > 0;

  // у фільтрах — лише категорії, де зараз є що показати
  const chipCats = categories.filter((c) => available.some((f) => f.cat === c.id));
  const activeCat = chipCats.some((c) => c.id === catFilter) ? catFilter : "all";

  const q = search.trim().toLowerCase();
  const visible = available.filter(
    (f) => (activeCat === "all" || f.cat === activeCat) && (!q || f.name.toLowerCase().includes(q)),
  );

  const setCount = (id, n) =>
    setCounts((c) => {
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  /* ---------- дії ---------- */

  const generate = () => {
    if (!canGenerate) {
      setStats((s) => ({ ...s, limitHits: s.limitHits + 1 }));
      setScreen("limit");
      return;
    }
    setScreen("loading");
    clearTimeout(genTimer.current);
    genTimer.current = setTimeout(() => {
      const isNewSet = variantsSig !== sig;
      const no = isNewSet ? 1 : nextVariantNo;
      const v = { id: `${Date.now()}`, no, shade: VARIANT_SHADES[(no - 1) % VARIANT_SHADES.length] };
      const list = isNewSet ? [v] : [...variants, v];
      setVariants(list);
      setVariantsSig(sig);
      setNextVariantNo(no + 1);
      setActive(list.length - 1);
      if (!isStaff) setClientGens((g) => g + 1);
      setStats((s) => ({ ...s, gens: s.gens + 1 }));
      setScreen("result");
    }, 1400);
  };

  const activeVariant = sessionVariants[active] || sessionVariants[sessionVariants.length - 1];

  const switchRole = (r) => {
    setRole(r);
    if (r === "client" && screen === "admin") setScreen("catalog");
    setShareOpen(false);
  };

  const goBack = () => {
    if (screen === "format") setScreen("catalog");
    else if (screen === "result") setScreen("format");
    else if (screen === "limit") setScreen(sessionVariants.length ? "result" : "format");
    else if (screen === "admin") setScreen("catalog");
  };

  const showBack = ["format", "result", "limit", "admin"].includes(screen);

  // усе, що потрібно екранам
  const app = {
    ...data,
    ...admin,
    isStaff,
    setScreen,
    format,
    setFormat,
    search,
    setSearch,
    setCatFilter,
    active,
    setActive,
    setClientGens,
    stats,
    setStats,
    setShareOpen,
    showToast,
    available,
    maxFor,
    selection,
    total,
    summary,
    summaryText,
    size,
    enabledFormats,
    activeFormat,
    formatGroups,
    formatLabel,
    pickOption,
    sessionVariants,
    activeVariant,
    gensLeft,
    chipCats,
    activeCat,
    q,
    visible,
    setCount,
    generate,
  };

  /* ================================================================ */

  return (
    <main className="flex min-h-dvh items-center justify-center p-0 sm:p-6">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] sm:h-[844px] sm:w-[390px] sm:rounded-[28px] sm:shadow-xl">
        {/* Перемикач ролі — лише для прототипу */}
        <div className="flex shrink-0 items-center gap-2 border-b border-dashed border-neutral-400 bg-neutral-100 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">Прототип · роль</span>
          <div className="ml-auto flex gap-1">
            {[
              ["client", "Клієнт"],
              ["staff", "Працівник студії"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchRole(key)}
                aria-pressed={role === key}
                className={`h-8 rounded-lg border px-2.5 text-xs font-semibold ${
                  role === key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Шапка */}
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-neutral-200 pl-1 pr-3">
          {showBack ? (
            <button type="button" aria-label="Назад" onClick={goBack} className="flex h-11 w-11 items-center justify-center">
              <Icon d={I.back} />
            </button>
          ) : (
            <span className="w-3" />
          )}
          <h1 className="flex-1 truncate text-[17px] font-semibold">{TITLES[screen]}</h1>
          {isStaff && screen !== "admin" && screen !== "loading" && (
            <button
              type="button"
              onClick={() => setScreen("admin")}
              className="flex h-9 items-center gap-1.5 rounded-full border border-neutral-900 px-3.5 text-[13px] font-semibold"
            >
              <Icon d={I.settings} size={16} />
              Адмінка
            </button>
          )}
        </header>

        {/* Контент */}
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
          {screen === "catalog" && <CatalogScreen app={app} />}
          {screen === "format" && <FormatScreen app={app} />}
          {screen === "loading" && <LoadingScreen app={app} />}
          {screen === "result" && activeVariant && <ResultScreen app={app} />}
          {screen === "limit" && <LimitScreen app={app} />}
          {screen === "admin" && <AdminScreen app={app} />}
        </div>

        {/* Нижні панелі */}
        {screen === "admin" && admin.adminTab === "catalog" && <AdminFooter app={app} />}
        {screen === "catalog" && <CatalogFooter app={app} />}
        {screen === "format" && <FormatFooter app={app} />}
        {screen === "result" && activeVariant && <ResultFooter app={app} />}

        {/* Вікно «Поділитися» (імітація Telegram) */}
        {shareOpen && activeVariant && <ShareDialog app={app} />}

        {/* Шторки адмінки */}
        {screen === "admin" && <AdminSheets app={app} />}

        {/* Тост */}
        {toast && (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-4 top-[108px] z-30 rounded-xl bg-neutral-900 px-3.5 py-3 text-center text-sm leading-snug text-white"
          >
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
