"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  IS_DEV,
  apiFetch,
  devOwnerAvailable,
  getDevRole,
  setDevRole,
} from "../lib/api";
import { checkRecipe, diffSummary, getFormatChoice, sizeFor } from "../lib/utils";
import { installSounds } from "../lib/sound";
import { useStudioData } from "../hooks/useStudioData";
import { useAdminUi } from "../hooks/useAdminUi";
import { Icon, I, Sheet, primaryBtn, secondaryBtn } from "./ui";
import { AdminSheets } from "./AdminSheets";
import { CatalogScreen, CatalogFooter } from "../screens/CatalogScreen";
import { FormatScreen, FormatFooter } from "../screens/FormatScreen";
import { ResultScreen, ResultFooter } from "../screens/ResultScreen";
import { LimitScreen } from "../screens/LimitScreen";
import { MineScreen } from "../screens/MineScreen";
import { EditStrip } from "./EditStrip";
import { Onboarding, shouldShowOnboarding } from "./Onboarding";
import { StatusScreen } from "../screens/StatusScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { AdminFooter } from "../screens/admin/AdminFooter";

// Екран генерації тягне WebGL-бібліотеки (three), тому вантажиться окремим шматком і лише в браузері;
// завантаження починаємо заздалегідь (див. useEffect нижче), щоб до натискання «Згенерувати» він уже був готовий.
const loadLoadingScreen = () =>
  import("../screens/LoadingScreen").then((m) => m.LoadingScreen);
const LoadingScreen = dynamic(loadLoadingScreen, { ssr: false });

// Заставка з 3D-логотипом при кожному запуску (теж three, тому окремим шматком). Поки вантажиться, показуємо порожній кремовий екран.
const Splash = dynamic(() => import("./Splash"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 z-[60] bg-cream" />,
});

// Каркас прототипу: тримає стан клієнтського флоу (вибір квітів, формат, варіанти, ліміт),
// збирає всі значення в `app` і роздає їх екранам. Самі екрани лежать у папці screens.
export default function Prototype() {
  // перемикач ролі лише для локальної розробки (у Telegram роль визначає сервер за Telegram ID)
  const [devRole, setDevRoleState] = useState(getDevRole());

  // звуки наведення й кліку на всіх кнопках (app/lib/sound.js)
  useEffect(() => installSounds(), []);
  useEffect(() => {
    loadLoadingScreen();
  }, []);

  const [screen, setScreen] = useState("catalog"); // catalog | format | loading | result | limit | mine | admin
  const [counts, setCounts] = useState({});
  const [format, setFormat] = useState("box");
  const [fmtPick, setFmtPick] = useState({}); // вибір клієнта всередині формату: { box: { shape: id, color: id } }
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  // Згенеровані букети цієї сесії. Кожен: склад (snapshot) і його варіанти. Результат показує один із них (setIdx),
  // а вибір у каталозі може від нього відрізнятися: це «чернетка» змін, яка ще не згенерована.
  const [sets, setSets] = useState([]);
  const [setIdx, setSetIdx] = useState(-1);
  const [active, setActive] = useState(0);
  const [editMode, setEditMode] = useState(false); // клієнт змінює склад букета з екрана результату
  const [mineFrom, setMineFrom] = useState("catalog"); // звідки відкрили «Мої букети»
  const [splash, setSplash] = useState(true); // заставка з логотипом при запуску
  const [onboarding, setOnboarding] = useState(false); // знайомство для нового клієнта
  useEffect(() => setOnboarding(shouldShowOnboarding()), []);
  const [shareFor, setShareFor] = useState(null); // варіант, для якого відкрита шторка «Поділитися» у «Мої букети»
  const [resultImage, setResultImage] = useState(null); // готова картинка: екран генерації плавно переходить у неї

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

  const available = useMemo(
    () => flowers.filter((f) => f.on && f.stock > 0),
    [flowers],
  );

  // максимум для позиції = менше з (залишок у студії, ліміт одного виду)
  const maxFor = (f) => Math.min(f.stock, settings.maxPerType);

  // фактичний вибір: обрізаний під поточні залишки (якщо адмін їх змінив)
  const selection = useMemo(() => {
    const out = {};
    available.forEach((f) => {
      const c = Math.min(
        counts[f.id] || 0,
        Math.min(f.stock, settings.maxPerType),
      );
      if (c > 0) out[f.id] = c;
    });
    return out;
  }, [available, counts, settings.maxPerType]);

  const total = Object.values(selection).reduce((a, b) => a + b, 0);
  const summary = available
    .filter((f) => selection[f.id])
    .map((f) => ({
      id: f.id,
      name: f.name,
      count: selection[f.id],
      photo: f.photo,
    }));
  const summaryText = summary.map((r) => `${r.name} ×${r.count}`).join(", ");
  const size = sizeFor(total);

  // формат: показуємо лише ввімкнені; всередині — лише ввімкнені варіанти (форма, колір)
  const { enabledFormats, activeFormat, formatGroups, formatLabel, formatSig } =
    getFormatChoice(formats, format, fmtPick);
  const sig = `${formatSig}|${summary.map((r) => r.name + r.count).join(",")}`;

  const pickOption = (groupKey, id) =>
    setFmtPick((p) => ({
      ...p,
      [activeFormat.id]: { ...p[activeFormat.id], [groupKey]: id },
    }));

  // букет, який зараз показує результат, і чи відрізняється від нього поточний вибір
  const currentSet = sets[setIdx] || null;
  const sessionVariants = currentSet ? currentSet.variants : [];
  const compDraft = Boolean(currentSet) && currentSet.sig !== sig;
  const draftDiff = currentSet
    ? diffSummary(currentSet.snapshot.summary, summary)
    : null;
  const formatChanged = Boolean(currentSet) && currentSet.snapshot.formatLabel !== formatLabel;
  // букет із таким самим складом, що й поточний вибір (для переходу з екрана формату)
  const matchingIdx = sets.findIndex((x) => x.sig === sig);
  const gensLeft = data.quota.unlimited
    ? Infinity
    : Math.max(0, settings.gensPerDay - data.quota.used);

  // у фільтрах — лише категорії, де зараз є що показати
  const chipCats = categories.filter((c) =>
    available.some((f) => f.cat === c.id),
  );
  const activeCat = chipCats.some((c) => c.id === catFilter)
    ? catFilter
    : "all";

  const q = search.trim().toLowerCase();
  const visible = available.filter(
    (f) =>
      (activeCat === "all" || f.cat === activeCat) &&
      (!q || f.name.toLowerCase().includes(q)),
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
    setResultImage(null);
    setScreen("loading");
    const idx = sets.findIndex((x) => x.sig === sig);
    const no = idx >= 0 ? sets[idx].variants.length + 1 : 1;
    try {
      const { generation, quota } = await apiFetch("/api/generate", {
        method: "POST",
        json: {
          flowers: Object.entries(selection).map(([id, count]) => ({
            id,
            count,
          })),
          formatId: activeFormat.id,
          picks: fmtPick[activeFormat.id] || {},
          variantNo: no,
        },
      });
      const v = { id: generation.id, no, imageUrl: generation.imageUrl };
      if (idx >= 0) {
        setSets((all) => all.map((x, i) => (i === idx ? { ...x, variants: [...x.variants, v] } : x)));
        setSetIdx(idx);
        setActive(no - 1);
      } else {
        // знімок складу: щоб після змін у каталозі результат лишався за своїм складом, а зміни порівнювались із ним
        const snapshot = {
          counts: { ...selection },
          format: activeFormat.id,
          pick: { ...(fmtPick[activeFormat.id] || {}) },
          summary: summary.map((r) => ({ id: r.id, name: r.name, count: r.count, photo: r.photo })),
          formatLabel,
          size,
        };
        setSets((all) => [...all, { sig, snapshot, variants: [v] }]);
        setSetIdx(sets.length);
        setActive(0);
      }
      setEditMode(false);
      data.setQuota(quota);
      // на результат переходимо не одразу: екран генерації сам програє плавний перехід у готову картинку
      // і наприкінці викликає finishLoading
      setResultImage(generation.imageUrl);
    } catch (e) {
      if (e.code === "limit") {
        data.setQuota((q) => ({
          ...q,
          used: Math.max(q.used, settings.gensPerDay),
        }));
        setScreen("limit");
        return;
      }
      showToast(e.message);
      setScreen("format");
      if (e.code === "stale") data.reload({ silent: true }); // каталог змінився: підтягуємо актуальний
    }
  };

  // «Надіслати студії»: бот пише в робочий чат студії
  // v — варіант, який надсилаємо: за замовчуванням той, що на екрані результату; зі «Мої букети» передаємо свій
  const label = (v) => (v.no ? `Варіант ${v.no}` : "Букет");
  const sendToStudio = async (v = activeVariant) => {
    if (!v || actionBusy) return;
    setActionBusy(true);
    try {
      const r = await apiFetch(`/api/generations/${v.id}/send`, {
        method: "POST",
      });
      showToast(
        r.alreadySent
          ? `${label(v)} уже надіслано студії`
          : `${label(v)} надіслано студії`,
      );
    } catch (e) {
      showToast(e.message);
    } finally {
      setActionBusy(false);
    }
  };

  const track = (type, v = activeVariant) =>
    apiFetch(`/api/generations/${v.id}/track`, {
      method: "POST",
      json: { type },
    }).catch(() => {});

  // «Поділитися»: стандартне вікно вибору чату в Telegram
  const shareVariant = async (v = activeVariant) => {
    if (!v || actionBusy) return;
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      showToast("Поділитися можна лише всередині Telegram");
      return;
    }
    setActionBusy(true);
    try {
      // shareMessage є в скрипті Telegram завжди, але працює лише з версії 8.0; у старих нічого не відкривається
      if (
        typeof tg.shareMessage === "function" &&
        tg.isVersionAtLeast?.("8.0")
      ) {
        const { messageId } = await apiFetch(
          `/api/generations/${v.id}/share`,
          { method: "POST" },
        );
        tg.shareMessage(messageId, (ok) => ok && track("shared", v));
      } else {
        // старіші версії Telegram: звичайне посилання для пересилання
        const link = `https://t.me/share/url?url=${encodeURIComponent(v.imageUrl)}`;
        tg.openTelegramLink(link);
        track("shared", v);
      }
    } catch (e) {
      showToast(e.message);
    } finally {
      setActionBusy(false);
    }
  };

  // «Зберегти фото»: у Telegram відкривається системне збереження файлу
  const savePhoto = (v = activeVariant) => {
    if (!v) return;
    const tg = window.Telegram?.WebApp;
    const url = v.imageUrl;
    if (
      tg &&
      typeof tg.downloadFile === "function" &&
      tg.isVersionAtLeast?.("8.0")
    ) {
      tg.downloadFile(
        { url, file_name: `buket-${v.no || v.id.slice(0, 6)}.jpg` },
        (ok) => ok && track("saved", v),
      );
    } else if (tg) {
      tg.openLink(url);
      track("saved", v);
    } else {
      window.open(url, "_blank");
      track("saved", v);
    }
  };

  const activeVariant =
    sessionVariants[active] || sessionVariants[sessionVariants.length - 1];

  // лише для розробки: входимо як тестовий клієнт або як власник і перезавантажуємо дані
  const switchRole = (r) => {
    setDevRole(r);
    setDevRoleState(r);
    if (r === "client" && screen === "admin") setScreen("catalog");
    data.reload();
  };

  /* ---------- зміна складу з екрана результату ---------- */

  // «Змінити склад»: каталог із уже вибраними квітами, угорі «← До результату»
  const startEdit = () => {
    setEditMode(true);
    setScreen("catalog");
  };
  // «Скасувати зміни»: вибір повертається до складу картинки, що на екрані
  const cancelDraft = () => {
    if (!currentSet) return;
    const snap = currentSet.snapshot;
    setCounts({ ...snap.counts });
    setFormat(snap.format);
    setFmtPick((p) => ({ ...p, [snap.format]: { ...snap.pick } }));
  };
  // «Почати заново»: порожній вибір. Нічого не втрачається: готові букети лишаються в «Мої букети»
  const startFresh = () => {
    setCounts({});
    setEditMode(false);
    setScreen("catalog");
    showToast("Вибір очищено");
  };
  // з екрана формату: показати вже згенеровані варіанти цього самого складу
  const openMatching = () => {
    if (matchingIdx < 0) return;
    setSetIdx(matchingIdx);
    setActive(sets[matchingIdx].variants.length - 1);
    setScreen("result");
  };

  /* ---------- «Мої букети» ---------- */

  const openMine = () => {
    if (screen !== "mine") setMineFrom(screen === "loading" ? "catalog" : screen);
    setScreen("mine");
  };
  // «Повторити склад»: підставляємо квіти й формат із рецепта, лише те, що зараз є в наявності
  const repeatRecipe = (recipe) => {
    const r = checkRecipe(recipe, { flowers, formats, settings });
    setCounts(r.counts);
    if (r.formatOk || r.formatId) {
      setFormat(r.formatId);
      if (r.formatOk) setFmtPick((p) => ({ ...p, [r.formatId]: r.picks }));
    }
    setEditMode(false);
    setScreen("catalog");
    const notes = [];
    if (r.missing.length) notes.push(`немає: ${r.missing.join(", ")}`);
    if (r.reduced.length) notes.push(`менше, ніж було: ${r.reduced.join(", ")}`);
    if (!r.formatOk) notes.push("формат чи колір змінилися, оберіть знову");
    showToast(notes.length ? `Склад повторено, але ${notes.join("; ")}` : "Склад повторено");
  };

  const goBack = () => {
    if (screen === "catalog") setScreen("result"); // режим зміни складу
    else if (screen === "format") setScreen("catalog");
    else if (screen === "result") setScreen("format");
    else if (screen === "limit")
      setScreen(sessionVariants.length ? "result" : "format");
    else if (screen === "mine") setScreen(mineFrom || "catalog");
    else if (screen === "admin") setScreen("catalog");
  };

  const editing = editMode && Boolean(currentSet);
  const showBack =
    ["format", "result", "limit", "mine", "admin"].includes(screen) ||
    (screen === "catalog" && editing);

  // усе, що потрібно екранам
  const app = {
    ...data,
    ...admin,
    isStaff,
    setScreen,
    resultImage,
    finishLoading: () => {
      setResultImage(null);
      setScreen((sc) => (sc === "loading" ? "result" : sc));
    },
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
    sessions: sets,
    currentSet,
    compDraft,
    draftDiff,
    formatChanged,
    matchingIdx,
    editing,
    startEdit,
    cancelDraft,
    startFresh,
    openMatching,
    openMine,
    openShare: setShareFor,
    repeatRecipe,
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
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-cream pt-[env(safe-area-inset-top)] sm:h-[844px] sm:w-[390px] sm:border sm:border-forest">
        {/* Перемикач ролі: лише для локальної розробки, у Telegram його немає */}
        {IS_DEV && (
          <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-dashed border-neutral-400 bg-neutral-100 px-3 py-2">
            <span className="text-[14px] uppercase tracking-wide text-neutral-600">
              Розробка · роль
            </span>
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
                  title={
                    key === "staff" && !devOwnerAvailable
                      ? "Додайте NEXT_PUBLIC_DEV_TELEGRAM_ID у .env.local"
                      : undefined
                  }
                  aria-pressed={devRole === key}
                  className={`h-8 rounded-lg border px-2.5 text-xs font-semibold ${
                    devRole === key
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Показати окремі екрани, які зазвичай бачить клієнт лише раз або на старті */}
            <span className="text-[14px] uppercase tracking-wide text-neutral-600">
              Показати
            </span>
            <div className="ml-auto flex gap-1">
              {[
                [
                  "Онбординг",
                  () => {
                    if (screen === "admin") setScreen("catalog");
                    setOnboarding(true);
                  },
                ],
                ["Заставка", () => setSplash(true)],
              ].map(([label, run]) => (
                <button
                  key={label}
                  type="button"
                  onClick={run}
                  className="h-8 rounded-lg border border-neutral-300 bg-white px-2.5 text-xs font-semibold"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Шапка */}
        {/* Шапка розкреслена тонкими лініями на клітинки: назад | логотип | адмінка */}
        <header className="shrink-0 px-3 pt-3">
          <div className="flex h-12 items-stretch border border-forest">
            {showBack && (
              <button
                type="button"
                aria-label="Назад"
                onClick={goBack}
                className="flex w-12 shrink-0 items-center justify-center border-r border-forest"
              >
                <Icon d={I.back} />
              </button>
            )}
            <div className="corners cn-all flex min-w-0 flex-1 items-center justify-center">
              {screen === "admin" ? (
                <h1 className="t-button">Адмінка</h1>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/brand/logo-horizontal.svg"
                  alt="Meadow Flowers"
                  className="h-7 w-auto"
                />
              )}
            </div>
            {ready && screen !== "admin" && screen !== "loading" && (
              <button
                type="button"
                aria-label="Мої букети"
                onClick={openMine}
                aria-pressed={screen === "mine"}
                className={`relative flex w-12 shrink-0 items-center justify-center border-l border-forest ${screen === "mine" ? "bg-forest text-cream" : ""}`}
              >
                <Icon d={I.flower} />
              </button>
            )}
            {ready && isStaff && screen !== "admin" && screen !== "loading" && (
              <button
                type="button"
                onClick={() => setScreen("admin")}
                className="t-button flex shrink-0 items-center gap-1.5 border-l border-forest px-3"
              >
                <Icon d={I.settings} />
                Адмінка
              </button>
            )}
          </div>
        </header>

        {/* Контент */}
        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
          <div key={ready ? screen : "status"} className="screen-in h-full">
            {!ready && (
              <StatusScreen
                status={data.status}
                error={data.error}
                onRetry={() => data.reload()}
              />
            )}
            {ready && screen === "catalog" && <CatalogScreen app={app} />}
            {ready && screen === "format" && <FormatScreen app={app} />}
            {ready && screen === "loading" && <LoadingScreen app={app} />}
            {ready && screen === "result" && activeVariant && (
              <ResultScreen app={app} />
            )}
            {ready && screen === "limit" && <LimitScreen app={app} />}
            {ready && screen === "mine" && <MineScreen app={app} />}
            {ready && screen === "admin" && <AdminScreen app={app} />}
          </div>
        </div>

        {/* Нижні панелі */}
        {ready && screen === "admin" && admin.adminTab === "catalog" && (
          <AdminFooter app={app} />
        )}
        {ready && editing && (screen === "catalog" || screen === "format") && (
          <EditStrip app={app} />
        )}
        {ready && screen === "catalog" && <CatalogFooter app={app} />}
        {ready && screen === "format" && <FormatFooter app={app} />}
        {ready && screen === "result" && activeVariant && (
          <ResultFooter app={app} />
        )}

        {ready && onboarding && screen !== "admin" && (
          <Onboarding app={app} onDone={() => setOnboarding(false)} />
        )}

        {splash && <Splash onDone={() => setSplash(false)} />}

        {/* Шторка «Поділитися» у «Мої букети»: три способи в одному місці */}
        {ready && shareFor && (
          <Sheet title="Поділитися букетом" onClose={() => setShareFor(null)}>
            <button
              type="button"
              className={primaryBtn}
              disabled={actionBusy}
              onClick={async () => {
                await sendToStudio(shareFor);
                setShareFor(null);
              }}
            >
              Надіслати студії
            </button>
            <button
              type="button"
              className={secondaryBtn}
              disabled={actionBusy}
              onClick={async () => {
                await shareVariant(shareFor);
                setShareFor(null);
              }}
            >
              Поділитися в Telegram
            </button>
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                savePhoto(shareFor);
                setShareFor(null);
              }}
            >
              Зберегти фото
            </button>
          </Sheet>
        )}

        {/* Шторки адмінки */}
        {ready && screen === "admin" && <AdminSheets app={app} />}

        {/* Тост */}
        {toast && (
          <div
            role="status"
            className="t-caption pointer-events-none absolute inset-x-3 top-[84px] z-30 bg-forest px-3.5 py-3 text-center leading-snug text-cream"
          >
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
