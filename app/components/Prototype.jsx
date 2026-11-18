"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IS_DEV, apiFetch, devOwnerAvailable, getDevRole, setDevRole } from "../lib/api";
import { getFormatChoice, sizeFor } from "../lib/utils";
import { useStudioData } from "../hooks/useStudioData";
import { useAdminUi } from "../hooks/useAdminUi";
import { Icon, I } from "./ui";
import { AdminSheets } from "./AdminSheets";
import { CatalogScreen, CatalogFooter } from "../screens/CatalogScreen";
import { FormatScreen, FormatFooter } from "../screens/FormatScreen";
import { LoadingScreen } from "../screens/LoadingScreen";
import { ResultScreen, ResultFooter } from "../screens/ResultScreen";
import { LimitScreen } from "../screens/LimitScreen";
import { StatusScreen } from "../screens/StatusScreen";
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
  // перемикач ролі лише для локальної розробки (у Telegram роль визначає сервер за Telegram ID)
  const [devRole, setDevRoleState] = useState(getDevRole());

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

  const [toast, setToast] = useState("");
  const [actionBusy, setActionBusy] = useState(false); // іде надсилання студії або підготовка «Поділитися»

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
  const data = useStudioData({ onError: showToast });
  const admin = useAdminUi({ data, showToast });
  const { flowers, categories, formats, settings } = data;
  const ready = data.status === "ready";
  const isStaff = Boolean(data.me?.isStaff);

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
  const summary = available
    .filter((f) => selection[f.id])
    .map((f) => ({ id: f.id, name: f.name, count: selection[f.id], photo: f.photo }));
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
  const gensLeft = data.quota.unlimited ? Infinity : Math.max(0, settings.gensPerDay - data.quota.used);

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

  // Один натиск = один варіант. Усе робить сервер: перевіряє вибір і ліміт, малює картинку, вписує склад.
  const generate = async () => {
    // навіть якщо ліміт уже вичерпано, звертаємось до сервера: він сам відмовить і запише це в статистику
    setScreen("loading");
    const isNewSet = variantsSig !== sig;
    const no = isNewSet ? 1 : nextVariantNo;
    try {
      const { generation, quota } = await apiFetch("/api/generate", {
        method: "POST",
        json: {
          flowers: Object.entries(selection).map(([id, count]) => ({ id, count })),
          formatId: activeFormat.id,
          picks: fmtPick[activeFormat.id] || {},
          variantNo: no,
        },
      });
      const v = { id: generation.id, no, imageUrl: generation.imageUrl };
      const list = isNewSet ? [v] : [...variants, v];
      setVariants(list);
      setVariantsSig(sig);
      setNextVariantNo(no + 1);
      setActive(list.length - 1);
      data.setQuota(quota);
      setScreen("result");
    } catch (e) {
      if (e.code === "limit") {
        data.setQuota((q) => ({ ...q, used: Math.max(q.used, settings.gensPerDay) }));
        setScreen("limit");
        return;
      }
      showToast(e.message);
      setScreen("format");
      if (e.code === "stale") data.reload({ silent: true }); // каталог змінився: підтягуємо актуальний
    }
  };

  // «Надіслати студії»: бот пише в робочий чат студії
  const sendToStudio = async () => {
    if (!activeVariant || actionBusy) return;
    setActionBusy(true);
    try {
      const r = await apiFetch(`/api/generations/${activeVariant.id}/send`, { method: "POST" });
      showToast(r.alreadySent ? `Варіант ${activeVariant.no} уже надіслано студії` : `Варіант ${activeVariant.no} надіслано студії`);
    } catch (e) {
      showToast(e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const track = (type) => apiFetch(`/api/generations/${activeVariant.id}/track`, { method: "POST", json: { type } }).catch(() => {});

  // «Поділитися»: стандартне вікно вибору чату в Telegram
  const shareVariant = async () => {
    if (!activeVariant || actionBusy) return;
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      showToast("Поділитися можна лише всередині Telegram");
      return;
    }
    setActionBusy(true);
    try {
      // shareMessage є в скрипті Telegram завжди, але працює лише з версії 8.0; у старих нічого не відкривається
      if (typeof tg.shareMessage === "function" && tg.isVersionAtLeast?.("8.0")) {
        const { messageId } = await apiFetch(`/api/generations/${activeVariant.id}/share`, { method: "POST" });
        tg.shareMessage(messageId, (ok) => ok && track("shared"));
      } else {
        // старіші версії Telegram: звичайне посилання для пересилання
        const link = `https://t.me/share/url?url=${encodeURIComponent(activeVariant.imageUrl)}`;
        tg.openTelegramLink(link);
        track("shared");
      }
    } catch (e) {
      showToast(e.message);
    } finally {
      setActionBusy(false);
    }
  };

  // «Зберегти фото»: у Telegram відкривається системне збереження файлу
  const savePhoto = () => {
    if (!activeVariant) return;
    const tg = window.Telegram?.WebApp;
    const url = activeVariant.imageUrl;
    if (tg && typeof tg.downloadFile === "function" && tg.isVersionAtLeast?.("8.0")) {
      tg.downloadFile({ url, file_name: `buket-${activeVariant.no}.jpg` }, (ok) => ok && track("saved"));
    } else if (tg) {
      tg.openLink(url);
      track("saved");
    } else {
      window.open(url, "_blank");
      track("saved");
    }
  };

  const activeVariant = sessionVariants[active] || sessionVariants[sessionVariants.length - 1];

  // лише для розробки: входимо як тестовий клієнт або як власник і перезавантажуємо дані
  const switchRole = (r) => {
    setDevRole(r);
    setDevRoleState(r);
    if (r === "client" && screen === "admin") setScreen("catalog");
    data.reload();
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
    quota: data.quota,
    actionBusy,
    sendToStudio,
    shareVariant,
    savePhoto,
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
        {/* Перемикач ролі: лише для локальної розробки, у Telegram його немає */}
        {IS_DEV && (
        <div className="flex shrink-0 items-center gap-2 border-b border-dashed border-neutral-400 bg-neutral-100 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">Розробка · роль</span>
          <div className="ml-auto flex gap-1">
            {[
              ["client", "Клієнт"],
              ["staff", "Працівник студії"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchRole(key)}
                disabled={key === "staff" && !devOwnerAvailable}
                title={key === "staff" && !devOwnerAvailable ? "Додайте NEXT_PUBLIC_DEV_TELEGRAM_ID у .env.local" : undefined}
                aria-pressed={devRole === key}
                className={`h-8 rounded-lg border px-2.5 text-xs font-semibold ${
                  devRole === key ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        )}

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
          {ready && isStaff && screen !== "admin" && screen !== "loading" && (
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
          {!ready && <StatusScreen status={data.status} error={data.error} onRetry={() => data.reload()} />}
          {ready && screen === "catalog" && <CatalogScreen app={app} />}
          {ready && screen === "format" && <FormatScreen app={app} />}
          {ready && screen === "loading" && <LoadingScreen app={app} />}
          {ready && screen === "result" && activeVariant && <ResultScreen app={app} />}
          {ready && screen === "limit" && <LimitScreen app={app} />}
          {ready && screen === "admin" && <AdminScreen app={app} />}
        </div>

        {/* Нижні панелі */}
        {ready && screen === "admin" && admin.adminTab === "catalog" && <AdminFooter app={app} />}
        {ready && screen === "catalog" && <CatalogFooter app={app} />}
        {ready && screen === "format" && <FormatFooter app={app} />}
        {ready && screen === "result" && activeVariant && <ResultFooter app={app} />}

        {/* Шторки адмінки */}
        {ready && screen === "admin" && <AdminSheets app={app} />}

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
